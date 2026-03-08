import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import GameIcon from './GameIcon';
import GAME_CONFIG from '../config/gameConfig';
import FreePackTimer from './FreePackTimer';
import { preloadIcons } from '../services/ImageService';
import { preloadPackArts } from '../services/PackArtService';
import { nftToGrowerzUnitCard, getGrowerzRarityTier, type GrowerzUnitCard } from '../utils/GrowerzUnitSystem';
import { getGrowerzCardBg } from '../utils/growerzCardBg';
import { loadReplays } from '../utils/BattleReplayRecorder';
import { BalanceCache, type WalletBalances } from '../utils/BalanceCache';

interface GameHubProps {
  user: any;
  onPlayPvE: () => void;
  onBuildTeam: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onAdmin?: () => void;
  onLibrary?: () => void;
  growerzUnitCards?: GrowerzUnitCard[];
  onHistory?: () => void;
  onShop?: () => void;
  onAccount?: () => void;
  onTrade?: () => void;
  onPaySheet?: () => void;
}

function fmt(n: number): string {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toLocaleString();
}

const RARITY_GLOW: Record<string, string> = {
  Mythic: '#ff00ff', Epic: '#a855f7', Rare: '#3b82f6', Uncommon: '#22c55e', Common: '#9ca3af',
};

// ── Rarity frame textures (same files as LibraryPage) ──────────────────────
const GROWERZ_FRAME: Record<string, string> = {
  common:    '/card-backgrounds/common-grey.png',
  uncommon:  '/card-backgrounds/uncommon-purple.png',
  rare:      '/card-backgrounds/rare-green.png',
  epic:      '/card-backgrounds/epic-gold.png',
  mythic:    '/card-backgrounds/legendary-weed.png',
};

// ── Standardised TCG card for GROWERZ NFTs ─────────────────────────────────
// Zones (% of card height):
//  0 → 11%  : NAME BAR  (rarity · NFT name, mana orb top-right)
// 11 → 73%  : ART ZONE  (NFT image, full-bleed)
// 73 → 87%  : STATS BAR (⚔ ATK | 💧 MANA | ❤ HP)
// 87 → 100% : TYPE STRIP (GROWERZ | rank + class)
function GrowerzTCGCard({
  card,
  bgImage,
  rarity,
  onClick,
}: {
  card: GrowerzUnitCard;
  bgImage: string;
  rarity: string;           // e.g. 'Mythic'
  onClick?: () => void;
}) {
  const rarityKey = rarity.toLowerCase();
  const glow  = RARITY_GLOW[rarity] || '#39ff14';
  const frame = GROWERZ_FRAME[rarityKey] || GROWERZ_FRAME.common;

  const RARITY_TEXT: Record<string, string> = {
    mythic: '#e879f9', epic: '#c084fc', rare: '#60a5fa',
    uncommon: '#4ade80', common: '#9ca3af',
  };
  const textCol = RARITY_TEXT[rarityKey] || '#9ca3af';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: 172, minWidth: 172,
        aspectRatio: '2/3',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: `2.5px solid ${glow}cc`,
        boxShadow: `0 0 28px ${glow}66, 0 0 10px ${glow}33, 0 8px 32px rgba(0,0,0,0.95)`,
        fontFamily: "'LEMON MILK', 'Arial Black', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* BG: blurred NFT art */}
      <img src={card.image} alt=""
        style={{
          position: 'absolute', inset: -16,
          width: 'calc(100% + 32px)', height: 'calc(100% + 32px)',
          objectFit: 'cover', objectPosition: 'center 20%',
          filter: 'blur(14px) saturate(1.6) brightness(0.5)',
          zIndex: 0,
        }}
      />
      {/* Rarity background behind art */}
      <img src={bgImage} alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: 0.35, mixBlendMode: 'screen',
          zIndex: 0, pointerEvents: 'none',
        }}
      />
      {/* Rarity frame texture */}
      <img src={frame} alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: 0.2, mixBlendMode: 'screen',
          zIndex: 0, pointerEvents: 'none',
        }}
      />
      {/* Inner glow ring */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: `inset 0 0 22px ${glow}30`,
        borderRadius: 12, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* ── NAME BAR  0 → 11% ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '11%',
        background: `linear-gradient(180deg, rgba(0,0,0,0.92) 0%, ${glow}28 100%)`,
        borderBottom: `1.5px solid ${glow}88`,
        zIndex: 3,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '1% 18% 1% 3%',
      }}>
        <div style={{ fontSize: 5.5, fontWeight: 900, color: textCol, letterSpacing: 1.5, lineHeight: 1, marginBottom: 1.5 }}>
          {rarity.toUpperCase()}
        </div>
        <div style={{
          fontSize: 8, fontWeight: 900, color: '#fff', lineHeight: 1.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          width: '100%', textAlign: 'center',
          textShadow: `0 0 10px ${glow}cc, 0 1px 3px rgba(0,0,0,1)`,
        }}>{card.name}</div>
      </div>

      {/* Mana orb — top-right overlapping name bar */}
      <div style={{
        position: 'absolute', top: '0.8%', right: '2%',
        width: '14%', aspectRatio: '1/1',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #60a5fa, #1d4ed8)',
        border: '2px solid #93c5fd',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: '#fff',
        boxShadow: '0 0 12px rgba(59,130,246,0.9), inset 0 1px 2px rgba(255,255,255,0.3)',
        zIndex: 5,
      }}>{card.cost}</div>

      {/* ── ART ZONE  11% → 72% — blurred backdrop + contain viewport ── */}
      <div style={{
        position: 'absolute',
        top: '11%', left: 0, right: 0, height: '61%',
        zIndex: 1, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Blurred background fill */}
        <img src={card.image} alt="" aria-hidden
          style={{
            position: 'absolute', inset: -12,
            width: 'calc(100% + 24px)', height: 'calc(100% + 24px)',
            objectFit: 'cover', objectPosition: 'center 20%',
            filter: 'blur(10px) saturate(1.4) brightness(0.5)',
          }}
          onError={e => { (e.target as HTMLImageElement).src = '/growerz-nft-showcase.png'; }}
        />
        {/* Main character image — contain so nothing is ever cropped */}
        <img src={card.image} alt={card.name}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', height: '100%',
            objectFit: 'contain', objectPosition: 'center 15%',
            transform: 'scale(1.06)',
            transformOrigin: 'center 30%',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src = '/growerz-nft-showcase.png';
          }}
        />
      </div>
      {/* Fade art into stats bar — ends at 72% boundary */}
      <div style={{
        position: 'absolute', top: '55%', left: 0, right: 0, height: '17%',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.92) 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* ── STATS BAR  72% → 88% ── */}
      <div style={{
        position: 'absolute', top: '72%', left: 0, right: 0, height: '16%',
        background: 'rgba(0,0,0,0.92)',
        borderTop: `2px solid ${glow}88`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 3,
        display: 'flex', alignItems: 'stretch',
      }}>
        {/* GROWERZ units: ATK (left) | HP (right) — mana orb handles cost */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, borderRight: '1px solid rgba(255,255,255,0.12)', background: 'rgba(220,38,38,0.15)' }}>
          <div style={{ fontSize: 6, color: '#f87171', fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>⚔ ATK</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fca5a5', lineHeight: 1, textShadow: '0 0 10px rgba(220,38,38,1)' }}>{card.attack}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, background: 'rgba(22,163,74,0.15)' }}>
          <div style={{ fontSize: 6, color: '#4ade80', fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>❤ HP</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#86efac', lineHeight: 1, textShadow: '0 0 10px rgba(34,197,94,1)' }}>{card.health}</div>
        </div>
      </div>

      {/* ── TYPE STRIP  88% → 100% — flush edge-to-edge ── */}
      <div style={{
        position: 'absolute', top: '88%', left: 0, right: 0, bottom: 0,
        background: `linear-gradient(90deg, rgba(0,0,0,0.96) 0%, ${glow}28 50%, rgba(0,0,0,0.96) 100%)`,
        borderTop: `1px solid ${glow}44`,
        zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 3%',
      }}>
        <span style={{ fontSize: 6, color: textCol, fontWeight: 900, letterSpacing: 1 }}>GROWERZ</span>
        <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.5)', fontWeight: 900, letterSpacing: 0.5 }}>#{card.nftRank}</span>
      </div>
    </div>
  );
}

const ACTION_BUTTONS = [
  {
    key: 'build',
    label: 'Build Deck',
    sublabel: 'Edit your team',
    bg: '/card-art/pack-sour-diesel.jpg',
    icon: 'cards',
    accent: '#39ff14',
  },
  {
    key: 'shop',
    label: 'Card Shop',
    sublabel: 'Buy packs',
    bg: '/card-art/pack-purple-haze.jpg',
    icon: 'shop',
    accent: '#a855f7',
  },
  {
    key: 'history',
    label: 'History',
    sublabel: 'Past battles',
    bg: '/card-art/grow-house.png',
    icon: 'history',
    accent: '#fbbf24',
  },
  {
    key: 'trade',
    label: 'NFT Trade',
    sublabel: 'Web3 market',
    bg: '/card-art/pack-white-widow.jpg',
    icon: null,
    accent: '#38bdf8',
  },
];

export default function GameHub({
  user, onPlayPvE, onBuildTeam, onSettings, onLogout, onAdmin,
  onLibrary, growerzUnitCards = [], onHistory, onShop, onAccount, onTrade, onPaySheet,
}: GameHubProps) {
  const [teamName, setTeamName] = useState(() => localStorage.getItem('thc-clash-team-name') || '');
  const [replayCount, setReplayCount] = useState(0);
  const [deckSize, setDeckSize] = useState(0);
  const [stats, setStats] = useState({ wins: 0, losses: 0, trophies: 0 });
  const [growerz, setGrowerz] = useState<GrowerzUnitCard[]>([]);
  const [growerzIdx, setGrowerzIdx] = useState(0);
  const [growerzLoading, setGrowerzLoading] = useState(false);
  const [liveBalances, setLiveBalances] = useState<WalletBalances | null>(null);
  const [balRefreshing, setBalRefreshing] = useState(false);

  const fetchLiveBalances = useCallback(async (force = false) => {
    if (!user?.walletAddress) return;
    setBalRefreshing(true);
    try {
      const b = await BalanceCache.getBalances(user.walletAddress, force);
      setLiveBalances(b);
    } catch {}
    setBalRefreshing(false);
  }, [user?.walletAddress]);

  useEffect(() => { fetchLiveBalances(false); }, [fetchLiveBalances]);

  useEffect(() => {
    preloadIcons(['trophy', 'battle', 'cards', 'shop', 'history', 'settings', 'skull', 'win', 'gift', 'timer', 'shield', 'logout', 'user']);
    preloadPackArts();
    setReplayCount(loadReplays().length);
    try {
      const saved = localStorage.getItem('thc-clash-battle-deck');
      if (saved) setDeckSize(JSON.parse(saved).length);
    } catch {}
    try {
      const s = localStorage.getItem('thc-clash-player-stats');
      if (s) setStats(JSON.parse(s));
    } catch {}
    if (growerzUnitCards.length > 0) { setGrowerz(growerzUnitCards); }
  }, [growerzUnitCards]);

  useEffect(() => {
    if (!user?.walletAddress) return;
    setGrowerzLoading(true);
    fetch(`/api/my-nfts/${user.walletAddress}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.nfts?.length > 0) {
          setGrowerz(data.nfts.filter(Boolean).map(nftToGrowerzUnitCard));
        }
      })
      .catch(() => {})
      .finally(() => setGrowerzLoading(false));
  }, [user?.walletAddress]);

  const hasDeck = deckSize >= 4;
  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0;

  const budz = Number(liveBalances?.gameTokenBalance ?? user?.budzBalance) || 0;
  const gbux = Number(liveBalances?.gbuxBalance ?? user?.gbuxBalance) || 0;
  const thc  = Number(liveBalances?.thcLabzTokenBalance ?? user?.gameTokenBalance ?? user?.thcBalance) || 0;
  const displayName = user?.displayName || (user?.walletAddress ? `${user.walletAddress.slice(0, 8)}...` : 'Player');

  const activeGrowerz: GrowerzUnitCard | null = growerz[growerzIdx] ?? null;
  const growerzRarity = activeGrowerz ? getGrowerzRarityTier(activeGrowerz.nftRank) : 'Common';
  const growerzGlow = RARITY_GLOW[growerzRarity] || '#39ff14';
  const carouselBg = activeGrowerz
    ? (getGrowerzCardBg(activeGrowerz.traits?.background, growerzRarity.toLowerCase()) ?? '/card-backgrounds/growerz/dark-gray.png')
    : '/growerz-nft-showcase.png';

  function handleActionButton(key: string) {
    if (key === 'build') onBuildTeam();
    else if (key === 'shop' && onShop) onShop();
    else if (key === 'history' && onHistory) onHistory();
    else if (key === 'trade' && onTrade) onTrade();
  }

  return (
    <div style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      color: '#fff',
      fontFamily: "'LEMON MILK', 'Arial Black', sans-serif",
      position: 'relative',
      background: '#060e06',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/thc-clash-bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.07, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 0%, rgba(57,255,20,0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(57,255,20,0.07) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '18px 16px 90px' }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={GAME_CONFIG.logoSrc}
              alt={GAME_CONFIG.logoAlt}
              style={{ width: 54, height: 54, filter: 'drop-shadow(0 0 16px rgba(57,255,20,0.95))' }}
            />
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: GAME_CONFIG.primaryColor, lineHeight: 1, letterSpacing: 2, textShadow: '0 0 20px rgba(57,255,20,0.8), 0 0 40px rgba(57,255,20,0.3)' }}>
                {GAME_CONFIG.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3, letterSpacing: 1 }}>
                🌿 {displayName}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {onLibrary && (
              <button onClick={onLibrary} title="Card Library" style={iconBtnStyle('#39ff14')}>
                <GameIcon icon="cards" size={30} />
              </button>
            )}
            {onAccount && (
              <button onClick={onAccount} title="My Profile" style={iconBtnStyle('#39ff14')}>
                <GameIcon icon="user" size={30} />
              </button>
            )}
            <button onClick={onSettings} style={iconBtnStyle('rgba(255,255,255,0.25)')}>
              <GameIcon icon="settings" size={30} />
            </button>
            <button onClick={onLogout} style={iconBtnStyle('#ef4444')}>
              <GameIcon icon="logout" size={30} />
            </button>
          </div>
        </div>

        {/* ── THC GROWERZ Hero Carousel ────────────────────── */}
        <div style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 16,
          border: `2px solid ${growerzGlow}`,
          boxShadow: `0 0 32px ${growerzGlow}55, 0 4px 24px rgba(0,0,0,0.7)`,
          backgroundImage: `url(${carouselBg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          position: 'relative',
          minHeight: 200,
        }}>
          {growerzLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
              <RefreshCw size={18} style={{ color: '#39ff14', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>LOADING GROWERZ...</span>
            </div>
          ) : activeGrowerz ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 0' }}>

              {/* ── Card + side arrows row ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
                {growerz.length > 1 ? (
                  <button
                    onClick={() => setGrowerzIdx((growerzIdx - 1 + growerz.length) % growerz.length)}
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${growerzGlow}44`, borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 10px ${growerzGlow}22` }}
                  ><ChevronLeft size={18} /></button>
                ) : <div style={{ width: 34 }} />}

                <GrowerzTCGCard
                  card={activeGrowerz}
                  bgImage={carouselBg}
                  rarity={growerzRarity}
                  onClick={onAccount}
                />

                {growerz.length > 1 ? (
                  <button
                    onClick={() => setGrowerzIdx((growerzIdx + 1) % growerz.length)}
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${growerzGlow}44`, borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 10px ${growerzGlow}22` }}
                  ><ChevronRight size={18} /></button>
                ) : <div style={{ width: 34 }} />}
              </div>

              {/* ── Abilities + traits below card ── */}
              <div style={{ width: '100%', padding: '10px 4px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeGrowerz.abilities?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                    {activeGrowerz.abilities.slice(0, 4).map((ab, i) => (
                      <span key={i} style={{
                        background: `${growerzGlow}15`, border: `1px solid ${growerzGlow}45`,
                        borderRadius: 5, padding: '2px 8px', fontSize: 8, color: '#fff', fontWeight: 700, letterSpacing: 0.3,
                      }}>{ab}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
                    {activeGrowerz.attackType?.toUpperCase()} · {activeGrowerz.class?.toUpperCase()}
                  </span>
                  {growerz.length > 1 && (
                    <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
                      {growerzIdx + 1} / {growerz.length} GROWERZ
                    </span>
                  )}
                  <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
                    RANK #{activeGrowerz.nftRank}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* No GROWERZ connected */
            <div
              onClick={onAccount}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 210, gap: 8, cursor: 'pointer', padding: 20, position: 'relative',
                backgroundImage: 'url(/growerz-nft-showcase.png)',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.68)', borderRadius: 18 }} />
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#39ff14', marginBottom: 5, textShadow: '0 0 12px rgba(57,255,20,0.6)' }}>
                  NO GROWERZ CONNECTED
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.5 }}>
                  Connect your THC GROWERZ NFT wallet<br/>to unlock your battle units
                </div>
                {onAccount && (
                  <div style={{
                    background: 'linear-gradient(135deg, #39ff14, #22c55e)',
                    color: '#000', borderRadius: 10,
                    padding: '8px 20px', fontSize: 11, fontWeight: 900, display: 'inline-block',
                    boxShadow: '0 0 18px rgba(57,255,20,0.5)',
                    letterSpacing: 1,
                  }}>CONNECT WALLET →</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Token Balances ───────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          {/* Price sheet button (full width, sits above the balance bar) */}
          {onPaySheet && (
            <button onClick={onPaySheet} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', width: '100%', marginBottom: 8 }}>
              <img src={GAME_CONFIG.priceSheetBtn} alt="Price Sheet" style={{ height: 88, width: '100%', objectFit: 'contain', display: 'block' }} />
            </button>
          )}

          {/* Single sleek balance bar */}
          <div style={{
            display: 'flex', alignItems: 'stretch',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.55) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
          }}>
            {[
              { icon: '/thc-labz-token.png', val: fmt(thc),  label: 'THC LABZ', color: '#4ade80' },
              { icon: '/budz-token.png',      val: fmt(gbux), label: 'GBUX',    color: '#bef264' },
              { icon: '/budz-token.png',      val: fmt(budz), label: 'BUDZ',    color: '#4ade80' },
            ].map((t, i, arr) => (
              <div key={t.label} style={{
                flex: 1,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <img src={t.icon} alt={t.label} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0, filter: `drop-shadow(0 0 5px ${t.color}88)` }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.color, lineHeight: 1, textShadow: `0 0 12px ${t.color}66`, letterSpacing: -0.3 }}>{t.val}</div>
                  <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginTop: 2 }}>{t.label}</div>
                </div>
              </div>
            ))}

            {/* Refresh inline at the end */}
            {user?.walletAddress && (
              <button onClick={() => fetchLiveBalances(true)} title="Refresh" style={{
                background: 'none', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.07)',
                padding: '0 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
              }}>
                <RefreshCw size={13} style={{ color: liveBalances ? '#39ff14' : 'rgba(255,255,255,0.3)', animation: balRefreshing ? 'spin360 1s linear infinite' : 'none' }} />
              </button>
            )}
          </div>

          {/* Live/cached status line */}
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.5, textAlign: 'right', marginTop: 4 }}>
            {liveBalances?.fromCache ? '● CACHED' : liveBalances ? '● LIVE' : ''}
          </div>
        </div>

        {/* Free Pack Timer */}
        <div style={{ marginBottom: 14 }}>
          <FreePackTimer walletAddress={user?.walletAddress} />
        </div>

        {/* Active Deck */}
        {teamName && (
          <div
            onClick={onBuildTeam}
            style={{
              background: 'rgba(0,0,0,0.6)', border: '1.5px solid rgba(57,255,20,0.35)',
              borderRadius: 16, padding: '13px 16px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: hasDeck ? '0 0 16px rgba(57,255,20,0.15)' : 'none',
            }}
          >
            <GameIcon icon="cards" size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#39ff14', marginBottom: 3, letterSpacing: 1.5 }}>ACTIVE DECK</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{teamName}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{deckSize}/11 cards loaded</div>
            </div>
            <div style={{
              background: hasDeck ? 'linear-gradient(135deg, #39ff14, #22c55e)' : 'rgba(255,255,255,0.08)',
              color: hasDeck ? '#000' : 'rgba(255,255,255,0.4)',
              borderRadius: 9, padding: '5px 12px', fontSize: 9, fontWeight: 900, letterSpacing: 1,
              boxShadow: hasDeck ? '0 0 12px rgba(57,255,20,0.4)' : 'none',
            }}>
              {hasDeck ? '✓ READY' : 'INCOMPLETE'}
            </div>
          </div>
        )}

        {/* ── MAIN BATTLE BUTTON ────────────────────────────── */}
        <button
          onClick={hasDeck ? onPlayPvE : onBuildTeam}
          style={{
            width: '100%', padding: '20px 0', borderRadius: 18,
            border: 'none', cursor: 'pointer', marginBottom: 14,
            backgroundImage: hasDeck
              ? 'url(/card-art/beast-mary-jane.png)'
              : 'url(/card-art/pack-sour-diesel.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: hasDeck
              ? '0 0 28px rgba(239,68,68,0.5), 0 6px 30px rgba(0,0,0,0.6)'
              : '0 0 24px rgba(57,255,20,0.4), 0 6px 30px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: hasDeck
              ? 'linear-gradient(135deg, rgba(185,28,28,0.86) 0%, rgba(239,68,68,0.78) 100%)'
              : 'linear-gradient(135deg, rgba(22,163,74,0.82) 0%, rgba(57,255,20,0.68) 100%)',
          }} />
          {/* top shine */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 100%)',
            borderRadius: '18px 18px 0 0',
          }} />
          <span style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            fontSize: 24, fontWeight: 900, color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)', letterSpacing: 2,
          }}>
            <GameIcon icon={hasDeck ? 'battle' : 'cards'} size={40} />
            {hasDeck ? 'BATTLE NOW!' : 'BUILD YOUR DECK'}
            <ChevronRight size={30} />
          </span>
        </button>

        {/* ── 2×2 Action Buttons ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {ACTION_BUTTONS.map(btn => (
            <button
              key={btn.key}
              onClick={() => handleActionButton(btn.key)}
              style={{
                borderRadius: 16,
                border: `2px solid ${btn.accent}55`,
                cursor: 'pointer',
                padding: '20px 10px',
                backgroundImage: `url(${btn.bg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative', overflow: 'hidden',
                minHeight: 110,
                boxShadow: `0 0 14px ${btn.accent}25, 0 4px 16px rgba(0,0,0,0.5)`,
              }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)',
              }} />
              {/* colored accent top edge */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: btn.accent,
                boxShadow: `0 0 10px ${btn.accent}`,
              }} />
              <span style={{
                position: 'relative', zIndex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                {btn.icon ? (
                  <GameIcon icon={btn.icon as any} size={36} />
                ) : (
                  <span style={{ fontSize: 30, lineHeight: 1 }}>🌿</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 0.5, textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                  {btn.label}
                </span>
                <span style={{ fontSize: 9, color: btn.accent, textShadow: `0 0 8px ${btn.accent}`, letterSpacing: 0.5 }}>
                  {btn.key === 'history' && replayCount > 0 ? `${replayCount} replays` : btn.sublabel}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* No deck hint */}
        {!hasDeck && (
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1.5px solid rgba(251,191,36,0.3)',
            borderRadius: 16, padding: '16px 18px', marginBottom: 14, textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 9, color: '#fbbf24', marginBottom: 5, letterSpacing: 2 }}>GET STARTED</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
              Build a deck with at least 4 cards to unlock battle mode!
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, paddingBottom: 8 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: 2 }}>
            {GAME_CONFIG.name} {GAME_CONFIG.version} · {GAME_CONFIG.tagline}
          </span>
        </div>
        <div style={{ height: 24 }} />
      </div>
      </div>

      <style>{`
        @keyframes paySheetPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(57,255,20,0.5), 0 0 18px rgba(57,255,20,0.2); }
          50%       { box-shadow: 0 0 16px rgba(57,255,20,0.95), 0 0 34px rgba(57,255,20,0.5); }
        }
        @keyframes spin360 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function iconBtnStyle(borderColor: string): React.CSSProperties {
  return {
    width: 42, height: 42, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.55)', border: `1.5px solid ${borderColor}`,
    cursor: 'pointer', color: '#fff',
    backdropFilter: 'blur(10px)',
    transition: 'opacity 0.15s',
  };
}
