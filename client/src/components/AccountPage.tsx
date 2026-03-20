import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Copy, CheckCheck, ExternalLink, RefreshCw, Lock, TrendingUp } from 'lucide-react';
import { BalanceCache, WalletBalances } from '../utils/BalanceCache';
import GameIcon from './GameIcon';
import { loadElo, getEloTier } from '../utils/EloSystem';

interface User {
  id?: number;
  username?: string;
  walletAddress?: string;
  phoneNumber?: string;
  email?: string;
  discordId?: string;
  displayName?: string;
  budzBalance?: number;
  gbuxBalance?: number;
  thcBalance?: number;
  gameTokenBalance?: number;
}

interface AccountPageProps {
  user: User;
  onBack: () => void;
  navigateTo: (screen: string) => void;
  connectedNFTs?: any[];
  onUserUpdate?: (updated: Partial<User>) => void;
}

interface BattleStats {
  wins: number;
  losses: number;
  trophies: number;
  totalBattles: number;
  winRate: number;
  rank: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

function shortAddress(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

function getRankInfo(trophies: number): { rank: string; color: string; nextRank: string; needed: number } {
  if (trophies >= 10000) return { rank: 'OG Kush Legend', color: '#ffd700', nextRank: 'MAX', needed: 0 };
  if (trophies >= 5000) return { rank: 'Dank Master', color: '#ff6b35', nextRank: 'OG Kush Legend', needed: 10000 - trophies };
  if (trophies >= 2000) return { rank: 'Top Shelf', color: '#b94fff', nextRank: 'Dank Master', needed: 5000 - trophies };
  if (trophies >= 1000) return { rank: 'Mid Grade', color: '#4dabff', nextRank: 'Top Shelf', needed: 2000 - trophies };
  if (trophies >= 500) return { rank: 'Rookie Bud', color: '#39ff14', nextRank: 'Mid Grade', needed: 1000 - trophies };
  return { rank: 'Seedling', color: '#a3d977', nextRank: 'Rookie Bud', needed: 500 - trophies };
}

function loadBattleStats(walletAddress?: string): BattleStats {
  try {
    const key = `thc-battle-stats-${walletAddress || 'guest'}`;
    const raw = localStorage.getItem(key) || localStorage.getItem('thc-clash-player-stats') || localStorage.getItem('thc-battle-results') || '{}';
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      const wins = data.filter((r: any) => r.result === 'win' || r.winner === 'player').length;
      const losses = data.length - wins;
      const trophies = data.reduce((sum: number, r: any) => sum + (r.trophyChange || r.trophies || 0), 0);
      const totalBattles = data.length;
      const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
      return { wins, losses, trophies, totalBattles, winRate, rank: getRankInfo(trophies).rank };
    }

    const wins = data.wins ?? 0;
    const losses = data.losses ?? 0;
    const trophies = data.trophies ?? 0;
    const totalBattles = data.totalBattles ?? (wins + losses);
    const winRate = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0;
    return { wins, losses, trophies, totalBattles, winRate, rank: getRankInfo(trophies).rank };
  } catch {
    return { wins: 0, losses: 0, trophies: 0, totalBattles: 0, winRate: 0, rank: 'Seedling' };
  }
}

function loadPackHistory(): any[] {
  try {
    const raw = localStorage.getItem('thc-pack-history') || '[]';
    return JSON.parse(raw).slice(-20).reverse();
  } catch { return []; }
}

function loadDeckSize(): number {
  try {
    const raw = localStorage.getItem('thc-clash-battle-deck') || '[]';
    return JSON.parse(raw).length;
  } catch { return 0; }
}

function buildAchievements(stats: BattleStats, nftCount: number, deckSize: number, packCount: number, hasWallet: boolean): Achievement[] {
  return [
    {
      id: 'first_blood',
      title: 'First Blood',
      description: 'Win your first battle',
      icon: 'battle',
      unlocked: stats.wins >= 1,
      progress: Math.min(stats.wins, 1),
      total: 1,
    },
    {
      id: 'battle_ready',
      title: 'Battle Ready',
      description: 'Build a full 8-card deck',
      icon: 'cards',
      unlocked: deckSize >= 8,
      progress: Math.min(deckSize, 8),
      total: 8,
    },
    {
      id: 'trophy_hunter',
      title: 'Trophy Hunter',
      description: 'Earn 100 trophies',
      icon: 'trophy',
      unlocked: stats.trophies >= 100,
      progress: Math.min(stats.trophies, 100),
      total: 100,
    },
    {
      id: 'win_streak',
      title: 'Winning Ways',
      description: 'Win 10 battles',
      icon: 'win',
      unlocked: stats.wins >= 10,
      progress: Math.min(stats.wins, 10),
      total: 10,
    },
    {
      id: 'battle_veteran',
      title: 'Battle Veteran',
      description: 'Complete 20 battles',
      icon: 'shield',
      unlocked: stats.totalBattles >= 20,
      progress: Math.min(stats.totalBattles, 20),
      total: 20,
    },
    {
      id: 'pack_opener',
      title: 'Pack Opener',
      description: 'Open your first card pack',
      icon: 'gift',
      unlocked: packCount >= 1,
      progress: Math.min(packCount, 1),
      total: 1,
    },
    {
      id: 'nft_holder',
      title: 'GROWERZ Holder',
      description: 'Own at least 1 GROWERZ NFT',
      icon: 'user',
      unlocked: nftCount >= 1,
      progress: Math.min(nftCount, 1),
      total: 1,
    },
    {
      id: 'rare_collector',
      title: 'Rare Collector',
      description: 'Own 3 or more GROWERZ NFTs',
      icon: 'trophy',
      unlocked: nftCount >= 3,
      progress: Math.min(nftCount, 3),
      total: 3,
    },
    {
      id: 'wallet_connected',
      title: 'Web3 Pioneer',
      description: 'Connect a Solana wallet',
      icon: 'shield',
      unlocked: hasWallet,
      progress: hasWallet ? 1 : 0,
      total: 1,
    },
    {
      id: 'mid_grade',
      title: 'Mid Grade',
      description: 'Reach Mid Grade rank (1000 trophies)',
      icon: 'trophy',
      unlocked: stats.trophies >= 1000,
      progress: Math.min(stats.trophies, 1000),
      total: 1000,
    },
    {
      id: 'survivor',
      title: 'Survivor',
      description: 'Maintain 60%+ win rate across 10+ battles',
      icon: 'skull',
      unlocked: stats.totalBattles >= 10 && stats.winRate >= 60,
      progress: stats.totalBattles >= 10 ? Math.min(stats.winRate, 60) : stats.totalBattles,
      total: stats.totalBattles >= 10 ? 60 : 10,
    },
    {
      id: 'kush_commander',
      title: 'Kush Commander',
      description: 'Win 50 battles',
      icon: 'battle',
      unlocked: stats.wins >= 50,
      progress: Math.min(stats.wins, 50),
      total: 50,
    },
  ];
}

function fmt(n: number | null | undefined): string {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

type TabKey = 'profile' | 'achievements' | 'wallet' | 'history' | 'leaderboard';

export default function AccountPage({ user, onBack, navigateTo, connectedNFTs = [], onUserUpdate }: AccountPageProps) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [showNFTPicker, setShowNFTPicker] = useState(false);

  const avatarStorageKey = `thc-clash-avatar-nft-${user.walletAddress || 'guest'}`;
  const [selectedNFTIndex, setSelectedNFTIndex] = useState<number>(() => {
    const saved = localStorage.getItem(avatarStorageKey);
    const idx = saved !== null ? parseInt(saved, 10) : 0;
    return isNaN(idx) ? 0 : idx;
  });

  const safeIndex = Math.min(selectedNFTIndex, Math.max(0, connectedNFTs.length - 1));

  function selectNFTAvatar(idx: number) {
    setSelectedNFTIndex(idx);
    localStorage.setItem(avatarStorageKey, String(idx));
    setShowNFTPicker(false);
  }

  const stats = loadBattleStats(user.walletAddress);
  const packHistory = loadPackHistory();
  const deckSize = loadDeckSize();
  const nftCount = connectedNFTs.length;
  const rankInfo = getRankInfo(stats.trophies);
  const achievements = buildAchievements(stats, nftCount, deckSize, packHistory.length, !!user.walletAddress);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const elo = loadElo(user.walletAddress);
  const eloTier = getEloTier(elo);

  function proxyImg(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/') || url.startsWith('data:')) return url;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  const primaryNFT = connectedNFTs[safeIndex] ?? null;
  const nftImageUrl: string | null = proxyImg(
    primaryNFT?.imageUrl ||
    primaryNFT?.image ||
    primaryNFT?.metadata?.image ||
    null
  );

  const loadBalances = useCallback(async (force = false) => {
    if (!user.walletAddress) return;
    setBalanceLoading(true);
    try {
      const data = await BalanceCache.getBalances(user.walletAddress, force);
      setBalances(data);
      setCacheAge(BalanceCache.getCacheAge(user.walletAddress));
      if (onUserUpdate && !data.fromCache) {
        onUserUpdate({
          gbuxBalance: data.gbuxBalance,
          thcBalance: data.thcLabzTokenBalance,
          gameTokenBalance: data.gameTokenBalance,
        });
      }
    } catch (e) {
      console.error('Balance load failed', e);
    } finally {
      setBalanceLoading(false);
    }
  }, [user.walletAddress, onUserUpdate]);

  useEffect(() => { loadBalances(false); }, [loadBalances]);

  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    setLbLoading(true);
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data);
        else if (data.success) setLeaderboard(data.leaderboard || data.entries || []);
        else if (Array.isArray(data.entries)) setLeaderboard(data.entries);
      })
      .catch(() => {})
      .finally(() => setLbLoading(false));
  }, [activeTab]);

  function copyAddress() {
    if (!user.walletAddress) return;
    navigator.clipboard.writeText(user.walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const formatAge = (ms: number) => ms < 60000 ? `${Math.round(ms / 1000)}s ago` : `${Math.round(ms / 60000)}m ago`;
  const displayName = user.displayName || user.username || user.email || user.phoneNumber || 'THC Player';

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'profile',      label: 'Profile' },
    { key: 'achievements', label: 'Achievements' },
    { key: 'leaderboard',  label: 'Leaderboard' },
    { key: 'wallet',       label: 'Wallet' },
    { key: 'history',      label: 'History' },
  ];

  const rarityColors: Record<string, string> = {
    legendary: '#f5a623', epic: '#9b59b6', rare: '#4dabff',
    uncommon: '#39ff14', common: '#888',
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      overflowY: 'auto',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(160deg, #040c05 0%, #081510 40%, #050f08 100%)',
      }} />
      <img
        src="/thc-clash-bg.png"
        alt=""
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
          opacity: 0.18,
        }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(57,255,20,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2, minHeight: '100dvh', color: '#fff' }}>

        {/* Header */}
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(16px)',
          borderBottom: '2px solid rgba(57,255,20,0.25)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <button
            onClick={onBack}
            className="cartoon-btn cartoon-btn-dark"
            style={{ minHeight: 40, padding: '0 14px', gap: 6, display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: 13 }}>Back</span>
          </button>
          <img src="/thc-labz-logo-nowords.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(57,255,20,0.6))' }} />
          <h1 className="cartoon-title" style={{ margin: 0, fontSize: 20, color: '#39ff14' }}>My Account</h1>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px' }}>

          {/* Hero Card */}
          <div style={{
            marginBottom: 16, borderRadius: 20, overflow: 'hidden',
            border: `3px solid ${rankInfo.color}`,
            boxShadow: `0 4px 40px ${rankInfo.color}40`,
          }}>
            {/* Banner strip */}
            <div style={{
              height: 110, position: 'relative', overflow: 'hidden',
              backgroundImage: nftImageUrl ? `url(${nftImageUrl})` : 'url(/card-art/grow-house.png)',
              backgroundSize: 'cover', backgroundPosition: 'center 20%',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, ${rankInfo.color}55 0%, rgba(0,0,0,0.85) 100%)`,
              }} />
              {nftImageUrl && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)',
                }} />
              )}
              <div style={{ position: 'absolute', top: 10, left: 16 }}>
                <div className="cartoon-label" style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5 }}>THC CLASH PLAYER</div>
                <div className="cartoon-title" style={{ fontSize: 20, color: '#fff', lineHeight: 1.1, marginTop: 2 }}>{displayName}</div>
              </div>
              <div style={{ position: 'absolute', top: 10, right: 14, textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: "'LEMON MILK', sans-serif", letterSpacing: 1 }}>ELO</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: eloTier.color, lineHeight: 1, fontFamily: "'LEMON MILK', sans-serif" }}>{elo}</div>
                <div style={{ fontSize: 9, color: eloTier.color, fontFamily: "'LEMON MILK', sans-serif" }}>{eloTier.icon} {eloTier.tier}</div>
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ background: 'rgba(0,0,0,0.82)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar — tap to pick NFT */}
              <div style={{ position: 'relative', flexShrink: 0, marginTop: -36 }}>
                <div
                  onClick={() => nftCount > 1 && setShowNFTPicker(v => !v)}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    border: `3px solid ${rankInfo.color}`,
                    overflow: 'hidden', background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 18px ${rankInfo.color}60`,
                    cursor: nftCount > 1 ? 'pointer' : 'default',
                  }}
                >
                  {nftImageUrl ? (
                    <img src={nftImageUrl} alt="NFT Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${rankInfo.color}30, rgba(0,0,0,0.6))`,
                      fontSize: 26, fontWeight: 900, color: rankInfo.color, fontFamily: "'LEMON MILK', sans-serif",
                    }}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                {nftCount > 1 && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: rankInfo.color, borderRadius: '50%',
                    width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #000', cursor: 'pointer',
                  }} onClick={() => setShowNFTPicker(v => !v)}>
                    <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✎</span>
                  </div>
                )}
              </div>

              {/* NFT Picker Modal */}
              {showNFTPicker && nftCount > 1 && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 9999,
                  background: 'rgba(0,0,0,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 20,
                }} onClick={() => setShowNFTPicker(false)}>
                  <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    borderRadius: 20, padding: 20, maxWidth: 400, width: '100%',
                    border: `2px solid ${rankInfo.color}44`,
                    maxHeight: '80vh', overflowY: 'auto',
                  }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: rankInfo.color, marginBottom: 14, letterSpacing: 1, fontFamily: "'LEMON MILK', sans-serif" }}>
                      CHOOSE AVATAR NFT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {connectedNFTs.map((nft, idx) => {
                        const imgUrl = proxyImg(nft?.imageUrl || nft?.image || nft?.metadata?.image || null);
                        const isSelected = idx === safeIndex;
                        return (
                          <div
                            key={idx}
                            onClick={() => selectNFTAvatar(idx)}
                            style={{
                              borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                              border: isSelected ? `2px solid ${rankInfo.color}` : '2px solid rgba(255,255,255,0.1)',
                              background: 'rgba(255,255,255,0.04)',
                              transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt={nft?.name || `NFT ${idx + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🌿</div>
                            )}
                            <div style={{ padding: '4px 6px', fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: "'LEMON MILK', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {nft?.name?.replace('THC Labz | The Growerz ', '#') || `NFT ${idx + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setShowNFTPicker(false)}
                      style={{ marginTop: 16, width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', padding: '10px', cursor: 'pointer', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cartoon-label" style={{ fontSize: 12, color: rankInfo.color, marginBottom: 2 }}>
                  {rankInfo.rank}
                </div>
                {primaryNFT && (
                  <div style={{ fontSize: 10, color: '#666', fontFamily: "'LEMON MILK', sans-serif" }}>
                    {primaryNFT.name?.replace('THC Labz | The Growerz ', '') || 'GROWERZ NFT'}
                    {primaryNFT.rank && <span style={{ color: rankInfo.color, marginLeft: 5 }}>#{primaryNFT.rank}</span>}
                  </div>
                )}
                {user.walletAddress && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5,
                    background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '4px 8px',
                    border: '1px solid rgba(57,255,20,0.15)',
                  }}>
                    <span style={{ fontFamily: "'LEMON MILK', monospace", fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 }}>{shortAddress(user.walletAddress)}</span>
                    <button onClick={copyAddress} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: copied ? '#39ff14' : '#aaa', display: 'flex', alignItems: 'center' }}>
                      {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                    </button>
                    <a href={`https://solscan.io/account/${user.walletAddress}`} target="_blank" rel="noreferrer" style={{ color: '#39ff1460', display: 'flex', alignItems: 'center' }}>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Trophy + stats */}
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <GameIcon icon="trophy" size={26} />
                  <div className="cartoon-title" style={{ fontSize: 16, color: '#ffe259', marginTop: 2 }}>{stats.trophies}</div>
                  <div className="cartoon-label" style={{ fontSize: 8, color: '#666' }}>Trophies</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <GameIcon icon="win" size={26} />
                  <div className="cartoon-title" style={{ fontSize: 16, color: '#4ade80', marginTop: 2 }}>{stats.wins}</div>
                  <div className="cartoon-label" style={{ fontSize: 8, color: '#666' }}>Wins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <GameIcon icon="skull" size={26} />
                  <div className="cartoon-title" style={{ fontSize: 16, color: '#f87171', marginTop: 2 }}>{stats.losses}</div>
                  <div className="cartoon-label" style={{ fontSize: 8, color: '#666' }}>Losses</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank Progress */}
          {rankInfo.nextRank !== 'MAX' && (
            <div className="cartoon-card" style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="cartoon-label" style={{ fontSize: 10, color: '#888' }}>{rankInfo.rank}</span>
                <span className="cartoon-label" style={{ fontSize: 10, color: rankInfo.color }}>{rankInfo.nextRank} in {rankInfo.needed} trophies</span>
              </div>
              <div className="cartoon-progress-track">
                <div className="cartoon-progress-fill" style={{
                  width: `${Math.max(2, Math.min(100, 100 - (rankInfo.needed / (rankInfo.needed + stats.trophies)) * 100))}%`,
                  background: `linear-gradient(90deg, ${rankInfo.color}aa, ${rankInfo.color})`,
                  boxShadow: `0 0 10px ${rankInfo.color}80`,
                }} />
              </div>
            </div>
          )}

          {/* Achievements unlocked pill */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="cartoon-badge" style={{ color: '#39ff14', borderColor: '#39ff14', padding: '5px 14px', fontSize: 11 }}>
              {unlockedCount}/{achievements.length} Achievements
            </div>
            {nftCount > 0 && (
              <div className="cartoon-badge" style={{ color: '#ffe259', borderColor: '#ffe259', padding: '5px 14px', fontSize: 11 }}>
                {nftCount} GROWERZ NFT{nftCount > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Tab Nav */}
          <div style={{
            display: 'flex', gap: 3,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 15, padding: 5, marginBottom: 18,
            border: '2px solid rgba(255,255,255,0.1)',
          }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: activeTab === key
                    ? 'linear-gradient(135deg, rgba(57,255,20,0.22) 0%, rgba(34,197,94,0.15) 100%)'
                    : 'transparent',
                  color: activeTab === key ? '#39ff14' : 'rgba(255,255,255,0.4)',
                  fontFamily: "'LEMON MILK', 'Arial Black', sans-serif",
                  fontWeight: 900, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                  borderBottom: activeTab === key ? '2px solid #39ff14' : '2px solid transparent',
                  boxShadow: activeTab === key ? '0 0 12px rgba(57,255,20,0.2)' : 'none',
                  transition: 'all 0.15s',
                  textShadow: activeTab === key ? '0 0 8px rgba(57,255,20,0.6)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Win Rate', value: `${stats.winRate}%`, icon: 'win' as const, color: '#39ff14' },
                  { label: 'Total Battles', value: stats.totalBattles, icon: 'battle' as const, color: '#4dabff' },
                  { label: 'Wins', value: stats.wins, icon: 'win' as const, color: '#39ff14' },
                  { label: 'Losses', value: stats.losses, icon: 'skull' as const, color: '#ff4f4f' },
                  { label: 'Deck Cards', value: `${deckSize}/8`, icon: 'cards' as const, color: '#b94fff' },
                  { label: 'NFTs Owned', value: nftCount, icon: 'user' as const, color: '#ffe259' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="cartoon-card" style={{ padding: '14px 12px', textAlign: 'center', background: 'rgba(0,0,0,0.55)' }}>
                    <GameIcon icon={icon} size={28} style={{ marginBottom: 6 }} />
                    <div className="cartoon-title" style={{ fontSize: 20, color, marginBottom: 2 }}>{value}</div>
                    <div className="cartoon-label" style={{ fontSize: 10, color: '#777' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* NFT showcase */}
              {connectedNFTs.length > 0 && (
                <div className="cartoon-card cartoon-card-gold" style={{ padding: 16, background: 'rgba(0,0,0,0.55)' }}>
                  <div className="cartoon-label" style={{ fontSize: 11, color: '#ffe259', marginBottom: 10 }}>My GROWERZ</div>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {connectedNFTs.slice(0, 6).map((nft: any, i: number) => {
                      const img = proxyImg(nft.imageUrl || nft.image || nft.metadata?.image);
                      return (
                        <div key={i} style={{
                          flexShrink: 0, width: 72, textAlign: 'center',
                        }}>
                          <div style={{
                            width: 72, height: 72, borderRadius: 12, overflow: 'hidden',
                            border: '2px solid rgba(255,226,89,0.4)',
                            background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {img
                              ? <img src={img} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <GameIcon icon="user" size={32} />
                            }
                          </div>
                          <div style={{ fontSize: 9, color: '#888', marginTop: 4, fontFamily: "'LEMON MILK', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nft.name?.replace('THC Labz | The Growerz #', '#') || `#${i + 1}`}
                          </div>
                          {nft.rank && <div style={{ fontSize: 8, color: '#ffe259', fontFamily: "'LEMON MILK', sans-serif" }}>Rank {nft.rank}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              <div className="cartoon-card" style={{ padding: 16, background: 'rgba(0,0,0,0.55)', border: '2px solid rgba(57,255,20,0.18)' }}>
                <div className="cartoon-label" style={{ fontSize: 11, color: '#39ff14', marginBottom: 12, letterSpacing: 1.5 }}>
                  PRO TIPS & BEST PRACTICES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: '🃏', title: 'Fill Your Deck', tip: 'A full 8-card deck unlocks max battle bonuses. Mix rarities for the best synergy.' },
                    { icon: '🔥', title: 'Win Streaks Pay', tip: 'Consecutive wins multiply your BUDZ payout. Keep the streak alive to stack rewards.' },
                    { icon: '🌿', title: 'GROWERZ NFT Bonus', tip: 'Holding a GROWERZ NFT boosts your base BUDZ earning rate every battle.' },
                    { icon: '📦', title: 'Daily Free Pack', tip: 'Claim a free card pack every 24 hours from the Pack Shop — never miss a day.' },
                    { icon: '🏆', title: 'Rank Up for More', tip: 'Higher trophy ranks earn bigger payout multipliers. Check the Pay Sheet to plan your climb.' },
                    { icon: '⚡', title: 'ELO Matters', tip: 'Your ELO score drives bonus payouts. Battle regularly to maintain and grow it.' },
                  ].map(({ icon, title, tip }) => (
                    <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        fontSize: 20, lineHeight: 1, flexShrink: 0,
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'LEMON MILK', sans-serif", marginBottom: 2 }}>{title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigateTo('team-builder')} className="cartoon-btn cartoon-btn-purple" style={{ flex: 1, padding: '12px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <GameIcon icon="cards" size={20} />
                    <span style={{ fontSize: 13 }}>Build Deck</span>
                  </span>
                </button>
                <button onClick={() => navigateTo('shop')} className="cartoon-btn cartoon-btn-gold" style={{ flex: 1, padding: '12px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <GameIcon icon="shop" size={20} />
                    <span style={{ fontSize: 13 }}>Pack Shop</span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── Achievements Tab ── */}
          {activeTab === 'achievements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cartoon-card" style={{
                padding: '10px 16px', background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <GameIcon icon="trophy" size={28} />
                <div>
                  <div className="cartoon-title" style={{ fontSize: 15, color: '#ffe259' }}>{unlockedCount} of {achievements.length} Unlocked</div>
                  <div className="cartoon-progress-track" style={{ marginTop: 6, width: 180 }}>
                    <div className="cartoon-progress-fill" style={{ width: `${Math.round((unlockedCount / achievements.length) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {achievements.map(a => (
                <div key={a.id} className="cartoon-card" style={{
                  padding: '14px 16px',
                  background: a.unlocked ? 'rgba(57,255,20,0.08)' : 'rgba(0,0,0,0.45)',
                  border: a.unlocked ? '2px solid rgba(57,255,20,0.5)' : '2px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: a.unlocked ? 1 : 0.65,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: a.unlocked ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)',
                    border: a.unlocked ? '2px solid rgba(57,255,20,0.4)' : '2px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    filter: a.unlocked ? 'none' : 'grayscale(1)',
                  }}>
                    {a.unlocked
                      ? <GameIcon icon={a.icon as any} size={28} />
                      : <Lock size={20} style={{ color: '#555' }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cartoon-label" style={{ fontSize: 12, color: a.unlocked ? '#39ff14' : '#888', marginBottom: 2 }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', fontFamily: "'LEMON MILK', sans-serif", marginBottom: a.total ? 6 : 0 }}>
                      {a.description}
                    </div>
                    {a.total && a.total > 1 && (
                      <div>
                        <div className="cartoon-progress-track" style={{ height: 6 }}>
                          <div className="cartoon-progress-fill" style={{
                            width: `${Math.min(100, Math.round(((a.progress ?? 0) / a.total) * 100))}%`,
                            background: a.unlocked ? 'linear-gradient(90deg, #39ff14, #00e64d)' : 'linear-gradient(90deg, #4dabff, #0065cc)',
                          }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#555', fontFamily: "'LEMON MILK', sans-serif", marginTop: 3 }}>
                          {a.progress ?? 0} / {a.total}
                        </div>
                      </div>
                    )}
                  </div>
                  {a.unlocked && (
                    <div className="cartoon-badge" style={{ color: '#39ff14', borderColor: '#39ff14', fontSize: 9, flexShrink: 0 }}>
                      Done
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Leaderboard Tab ── */}
          {activeTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Player ELO card */}
              <div style={{
                borderRadius: 18, overflow: 'hidden',
                background: 'rgba(0,0,0,0.7)',
                border: `2px solid ${eloTier.color}`,
                boxShadow: `0 4px 28px ${eloTier.color}30`,
              }}>
                <div style={{
                  backgroundImage: 'url(/card-art/pack-white-widow.jpg)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  padding: '20px 20px 14px',
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                      background: `linear-gradient(135deg, ${eloTier.color}30, rgba(0,0,0,0.5))`,
                      border: `3px solid ${eloTier.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 30,
                    }}>
                      {eloTier.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'LEMON MILK', sans-serif", letterSpacing: 1 }}>YOUR ELO RATING</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: eloTier.color, lineHeight: 1, fontFamily: "'LEMON MILK', sans-serif" }}>{elo}</div>
                      <div style={{ fontSize: 12, color: eloTier.color, fontFamily: "'LEMON MILK', sans-serif", fontWeight: 700 }}>{eloTier.tier}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                          { label: 'W', val: stats.wins, color: '#4ade80' },
                          { label: 'L', val: stats.losses, color: '#f87171' },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "'LEMON MILK', sans-serif", lineHeight: 1 }}>{s.val}</div>
                            <div style={{ fontSize: 8, color: '#555', fontFamily: "'LEMON MILK', sans-serif" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* ELO tier progression */}
                <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {[
                      { t: 'Bronze', c: '#cd7f32', min: 0 },
                      { t: 'Silver', c: '#c0c0c0', min: 1100 },
                      { t: 'Gold', c: '#ffd700', min: 1300 },
                      { t: 'Plat', c: '#b3c8d9', min: 1500 },
                      { t: 'Diamond', c: '#00d4ff', min: 1800 },
                      { t: 'GM', c: '#ff6b35', min: 2000 },
                    ].map(tier => (
                      <div key={tier.t} style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{
                          height: 6, borderRadius: 3, margin: '0 1px',
                          background: elo >= tier.min ? tier.c : 'rgba(255,255,255,0.08)',
                          boxShadow: elo >= tier.min ? `0 0 6px ${tier.c}80` : 'none',
                        }} />
                        <div style={{ fontSize: 7, color: elo >= tier.min ? tier.c : '#444', fontFamily: "'LEMON MILK', sans-serif", marginTop: 3 }}>{tier.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Global leaderboard */}
              <div className="cartoon-card" style={{ padding: 16, background: 'rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} style={{ color: '#39ff14' }} />
                    <div className="cartoon-label" style={{ fontSize: 11, color: '#39ff14' }}>Global Leaderboard</div>
                  </div>
                  {lbLoading && <RefreshCw size={13} style={{ color: '#39ff14', animation: 'spin360 1s linear infinite' }} />}
                </div>

                {leaderboard.length === 0 && !lbLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#555', fontFamily: "'LEMON MILK', sans-serif", fontSize: 12 }}>
                    No leaderboard data yet. Battle to earn your rank!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {leaderboard.slice(0, 20).map((entry: any, i: number) => {
                      const isMe = user.walletAddress && (entry.walletAddress === user.walletAddress || entry.wallet_address === user.walletAddress);
                      const medals = ['🥇', '🥈', '🥉'];
                      const score = entry.score || entry.current_score || 0;
                      const name = entry.displayName || entry.display_name || entry.username || (entry.walletAddress || entry.wallet_address || '???').slice(0, 8) + '...';
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: isMe ? 'rgba(57,255,20,0.05)' : 'transparent',
                          borderRadius: isMe ? 8 : 0,
                        }}>
                          <div style={{ width: 22, textAlign: 'center', fontSize: i < 3 ? 16 : 12, color: i < 3 ? '#ffe259' : '#555', fontFamily: "'LEMON MILK', sans-serif", fontWeight: 700 }}>
                            {i < 3 ? medals[i] : `#${i + 1}`}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: isMe ? '#39ff14' : '#ccc', fontFamily: "'LEMON MILK', sans-serif", fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}{isMe ? ' (You)' : ''}
                            </div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#ffe259', fontFamily: "'LEMON MILK', sans-serif" }}>{score.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Wallet Tab ── */}
          {activeTab === 'wallet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {user.walletAddress ? (
                <>
                  {/* Token balances */}
                  <div className="cartoon-card" style={{ padding: 16, background: 'rgba(0,0,0,0.6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div className="cartoon-label" style={{ fontSize: 11, color: '#39ff14' }}>Token Balances</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {cacheAge !== null && !balanceLoading && (
                          <span style={{ fontSize: 10, color: '#555', fontFamily: "'LEMON MILK', sans-serif" }}>
                            {formatAge(cacheAge)}
                          </span>
                        )}
                        <button
                          onClick={() => loadBalances(true)}
                          disabled={balanceLoading}
                          className="cartoon-btn cartoon-btn-dark"
                          style={{ minHeight: 32, padding: '0 10px', gap: 6, display: 'flex', alignItems: 'center', fontSize: 11 }}
                        >
                          <RefreshCw size={13} style={{ animation: balanceLoading ? 'spin360 1s linear infinite' : 'none' }} />
                          {balanceLoading ? 'Loading' : 'Refresh'}
                        </button>
                      </div>
                    </div>

                    {balanceLoading && !balances ? (
                      <div style={{ textAlign: 'center', padding: 24, color: '#555', fontFamily: "'LEMON MILK', sans-serif", fontSize: 13 }}>
                        Fetching balances...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {[
                          {
                            label: 'SOL',
                            subLabel: 'Solana',
                            value: balances?.solBalance?.toFixed(4) ?? (user.walletAddress ? '...' : '0'),
                            icon: '/icons/shield.png',
                            color: '#9945FF',
                            isImg: true,
                          },
                          {
                            label: 'BUDZ',
                            subLabel: 'Game Currency',
                            value: fmt(balances?.gameTokenBalance ?? user.budzBalance),
                            icon: '/budz-token.png',
                            color: '#39ff14',
                            isImg: true,
                          },
                          {
                            label: 'GBUX',
                            subLabel: 'Reward Token',
                            value: fmt(balances?.gbuxBalance ?? user.gbuxBalance),
                            icon: '/gbux-token.png',
                            color: '#ffe259',
                            isImg: true,
                          },
                          {
                            label: 'THC LABZ',
                            subLabel: 'Platform Token',
                            value: fmt(balances?.thcLabzTokenBalance ?? user.thcBalance),
                            icon: '/thc-labz-token.png',
                            color: '#4dabff',
                            isImg: true,
                          },
                        ].map(({ label, subLabel, value, icon, color, isImg }) => (
                          <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: `${color}18`,
                                border: `2px solid ${color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {isImg
                                  ? <img src={icon} alt={label} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                                  : null
                                }
                              </div>
                              <div>
                                <div className="cartoon-label" style={{ fontSize: 12, color: '#ccc' }}>{label}</div>
                                <div style={{ fontSize: 10, color: '#555', fontFamily: "'LEMON MILK', sans-serif" }}>{subLabel}</div>
                              </div>
                            </div>
                            <div className="cartoon-title" style={{ fontSize: 17, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wallet address */}
                  <div className="cartoon-card" style={{ padding: 16, background: 'rgba(0,0,0,0.5)' }}>
                    <div className="cartoon-label" style={{ fontSize: 10, color: '#888', marginBottom: 10 }}>Wallet Address</div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10, padding: '10px 14px',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: '#aaa', wordBreak: 'break-all' }}>
                        {user.walletAddress}
                      </span>
                      <button onClick={copyAddress} className="cartoon-btn cartoon-btn-dark" style={{ minHeight: 32, padding: '0 10px', gap: 6, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                        <span style={{ fontSize: 11 }}>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <a
                        href={`https://solscan.io/account/${user.walletAddress}`}
                        target="_blank" rel="noreferrer"
                        className="cartoon-btn cartoon-btn-blue"
                        style={{ minHeight: 36, padding: '0 14px', gap: 6, display: 'flex', alignItems: 'center', textDecoration: 'none', fontSize: 12 }}
                      >
                        <ExternalLink size={13} />
                        Solscan
                      </a>
                      <a
                        href={`https://magiceden.io/marketplace/thc_growerz`}
                        target="_blank" rel="noreferrer"
                        className="cartoon-btn cartoon-btn-purple"
                        style={{ minHeight: 36, padding: '0 14px', gap: 6, display: 'flex', alignItems: 'center', textDecoration: 'none', fontSize: 12 }}
                      >
                        <ExternalLink size={13} />
                        Magic Eden
                      </a>
                    </div>
                  </div>

                  {/* GROWERZ NFTs summary */}
                  <div className="cartoon-card cartoon-card-gold" style={{ padding: 16, background: 'rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: nftCount > 0 ? 12 : 0 }}>
                      <img src="/budz-token.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      <div className="cartoon-label" style={{ fontSize: 11, color: '#ffe259' }}>GROWERZ NFTs</div>
                      <div className="cartoon-badge" style={{ color: '#ffe259', borderColor: '#ffe259', fontSize: 10, marginLeft: 'auto' }}>
                        {nftCount} Owned
                      </div>
                    </div>
                    {nftCount === 0 && (
                      <div style={{ color: '#666', fontSize: 12, fontFamily: "'LEMON MILK', sans-serif" }}>
                        No GROWERZ NFTs in this wallet.{' '}
                        <a href="https://magiceden.io/marketplace/thc_growerz" target="_blank" rel="noreferrer" style={{ color: '#ffe259' }}>
                          Buy on Magic Eden
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="cartoon-card" style={{ padding: 32, textAlign: 'center', background: 'rgba(0,0,0,0.5)' }}>
                  <GameIcon icon="shield" size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                  <div className="cartoon-label" style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>No Wallet Connected</div>
                  <div style={{ fontSize: 12, color: '#444', fontFamily: "'LEMON MILK', sans-serif" }}>
                    Connect a Solana wallet via the login screen to see balances and NFTs.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Battle summary */}
              <div className="cartoon-card" style={{ padding: 16, background: 'rgba(0,0,0,0.55)' }}>
                <div className="cartoon-label" style={{ fontSize: 11, color: '#39ff14', marginBottom: 12 }}>Battle Record</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
                  {[
                    { label: 'Wins', value: stats.wins, color: '#39ff14' },
                    { label: 'Losses', value: stats.losses, color: '#ff4f4f' },
                    { label: 'Win Rate', value: `${stats.winRate}%`, color: '#4dabff' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="cartoon-title" style={{ fontSize: 22, color }}>{value}</div>
                      <div className="cartoon-label" style={{ fontSize: 9, color: '#666' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="cartoon-progress-track" style={{ marginTop: 12 }}>
                  <div className="cartoon-progress-fill" style={{ width: `${stats.winRate}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: '#555', fontFamily: "'LEMON MILK', sans-serif" }}>0%</span>
                  <span style={{ fontSize: 9, color: '#555', fontFamily: "'LEMON MILK', sans-serif" }}>100%</span>
                </div>
              </div>

              {/* Pack history */}
              <div className="cartoon-card" style={{ padding: 16, background: 'rgba(0,0,0,0.55)' }}>
                <div className="cartoon-label" style={{ fontSize: 11, color: '#ffe259', marginBottom: 12 }}>Pack Purchase History</div>
                {packHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <GameIcon icon="shop" size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                    <div style={{ color: '#555', fontSize: 12, fontFamily: "'LEMON MILK', sans-serif", marginBottom: 12 }}>No packs opened yet</div>
                    <button onClick={() => navigateTo('shop')} className="cartoon-btn cartoon-btn-gold" style={{ padding: '10px 20px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GameIcon icon="shop" size={18} />
                        <span style={{ fontSize: 13 }}>Open Pack Shop</span>
                      </span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {packHistory.map((p: any, i: number) => (
                      <div key={i} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        padding: '10px 0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      }}>
                        <div>
                          <div className="cartoon-label" style={{ fontSize: 11, color: '#ccc', marginBottom: 3 }}>
                            {p.packName || p.packType || 'Card Pack'}
                          </div>
                          <div style={{ fontSize: 10, color: '#555', fontFamily: "'LEMON MILK', sans-serif", marginBottom: 4 }}>
                            {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : ''}
                            {p.signature ? ` · ${p.signature.slice(0, 8)}...` : ''}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(p.cards || []).slice(0, 3).map((card: any, ci: number) => (
                              <span key={ci} style={{
                                fontSize: 9, padding: '2px 7px', borderRadius: 4,
                                background: 'rgba(255,255,255,0.05)',
                                borderLeft: `3px solid ${rarityColors[card.rarity] || '#888'}`,
                                color: '#aaa', fontFamily: "'LEMON MILK', sans-serif",
                              }}>
                                {card.name || card.cardName || 'Card'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="cartoon-badge" style={{ color: '#ffe259', borderColor: '#ffe25944', fontSize: 10, flexShrink: 0, marginLeft: 8 }}>
                          {p.cost || p.gbuxCost ? `${p.cost || p.gbuxCost} GBUX` : p.paymentToken || 'Free'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
