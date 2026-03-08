import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import PackOpeningModal from './PackOpeningModal';
import {
  executePurchaseAndOpenPack, fetchAllTokenPrices, calcTokenAmount,
  PACK_USD_PRICES, isWalletConnected,
  type PaymentToken, type TokenPrices,
} from '../utils/Web3Purchase';

interface ShopCard {
  id: string; name: string; cost: number; attack: number; health: number;
  rarity: string; class: string; type: string; image: string;
  description?: string; level?: number;
}

interface CardPackShopProps {
  walletAddress?: string;
  user?: any;
  onBack: () => void;
}

const PACK_TYPES = [
  {
    id: 'green-bag' as const,
    name: 'Green Bag',
    strain: 'SOUR DIESEL',
    tag: 'STARTER',
    gbuxCost: 20,
    usd: 0.10,
    color: '#39ff14',
    bgImage: '/card-art/pack-sour-diesel.jpg',
    tagline: '"Electric citrus, raw diesel energy"',
    flavorNotes: ['🍋 Tangy Citrus Burst', '⚡ Energizing Sativa', '🚀 Fast Aggressive Plays'],
    effectDesc: 'Fresh off the vine — sativa-fueled opening cards to jumpstart your collection. Every pull drips with electric green energy.',
    odds: [
      { r: 'Common', p: '100%', c: '#9ca3af' },
    ],
    previewCards: [
      'https://i.imgur.com/9MIRkig.png',
      'https://i.imgur.com/xUULDbU.png',
      'https://i.imgur.com/TNwQ9gN.png',
    ],
  },
  {
    id: 'dank-pack' as const,
    name: 'Dank Pack',
    strain: 'PURPLE HAZE',
    tag: 'PREMIUM',
    gbuxCost: 60,
    usd: 0.30,
    color: '#c084fc',
    bgImage: '/card-art/pack-purple-haze.jpg',
    tagline: '"Psychedelic phenotype, guaranteed Rare"',
    flavorNotes: ['🍇 Deep Purple Terps', '🌀 Mind-Bending Pulls', '💜 Rare Every Pack'],
    effectDesc: 'Swathed in psychedelic smoke — every open guaranteed Rare+. Limited phenotype genetics only the plug knows about.',
    odds: [
      { r: 'Common',    p: '15%', c: '#9ca3af' },
      { r: 'Uncommon',  p: '40%', c: '#a855f7' },
      { r: 'Rare',      p: '30%', c: '#22c55e' },
      { r: 'Epic',      p: '12%', c: '#fbbf24' },
      { r: 'Legendary', p: '3%',  c: '#ff6b00' },
    ],
    previewCards: [
      'https://i.imgur.com/lIEaocK.png',
      'https://i.imgur.com/ZrNhsNQ.png',
      'https://i.imgur.com/vQOANIg.png',
    ],
  },
  {
    id: 'legend-kush' as const,
    name: 'Legendary Kush',
    strain: 'WHITE WIDOW',
    tag: 'ELITE',
    gbuxCost: 150,
    usd: 0.75,
    color: '#ffd700',
    bgImage: '/card-art/pack-white-widow.jpg',
    tagline: '"Frost-kissed genetics, legendary lineage"',
    flavorNotes: ['❄️ Crystal Trichome Frost', '🏆 Epic Guaranteed', '🌟 Legendary Possible'],
    effectDesc: 'White as the frost on a trophy nug. Every pull is elite — Epic or Legendary guaranteed. The pinnacle of THC Clash cards.',
    odds: [
      { r: 'Uncommon',  p: '5%',  c: '#a855f7' },
      { r: 'Rare',      p: '30%', c: '#22c55e' },
      { r: 'Epic',      p: '40%', c: '#fbbf24' },
      { r: 'Legendary', p: '25%', c: '#ff6b00' },
    ],
    previewCards: [
      'https://i.imgur.com/ZfezyZU.png',
      'https://i.imgur.com/lTUTFEV.png',
      'https://i.imgur.com/1idodNr.png',
    ],
  },
] as const;

type PackType = typeof PACK_TYPES[number];
type Phase = 'select' | 'confirm' | 'purchasing';
type Tab = 'shop' | 'collection';

const TOKEN_META: Record<PaymentToken, { label: string; sublabel: string; color: string }> = {
  GBUX:       { label: 'GBUX',  sublabel: 'in-game',  color: '#bef264' },
  SOL:        { label: 'SOL',   sublabel: 'on-chain', color: '#9945ff' },
  BUDZ:       { label: 'BUDZ',  sublabel: 'on-chain', color: '#39ff14' },
  GAME_TOKEN: { label: 'THC',   sublabel: 'on-chain', color: '#ff6b00' },
};

function fmtAmt(n: number, token: PaymentToken): string {
  if (token === 'GBUX') return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (token === 'SOL')  return n.toFixed(5);
  return n >= 1_000_000
    ? (n / 1_000_000).toFixed(2) + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(1) + 'K'
    : n.toFixed(0);
}

function CollectionView({ walletAddress }: { walletAddress?: string }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) { setLoading(false); return; }
    fetch(`/api/cards/owned/${walletAddress}`)
      .then(r => r.json()).then(d => {
        const arr = Array.isArray(d) ? d : (d?.cards ?? []);
        setCards(arr);
      })
      .catch(() => setCards([])).finally(() => setLoading(false));
  }, [walletAddress]);

  const RARITY_BG: Record<string, string> = {
    legendary: '/card-backgrounds/legendary-weed.png', epic: '/card-backgrounds/epic-gold.png',
    rare: '/card-backgrounds/rare-green.png', uncommon: '/card-backgrounds/uncommon-purple.png',
    common: '/card-backgrounds/common-grey.png',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Loading collection...</div>;
  if (!walletAddress) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Connect wallet to view collection</div>;
  if (cards.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No cards yet — open a pack!</div>;

  return (
    <div style={{ padding: '12px 14px 80px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {cards.map((card: any, i: number) => (
        <div key={i} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '2/3' }}>
          <img src={RARITY_BG[(card.rarity || '').toLowerCase()] || RARITY_BG.common} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          {card.image && <img src={card.image} alt={card.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '70%', objectFit: 'contain', top: '10%' }} />}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '4px 6px 5px' }}>
            <div style={{ color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: "'LEMON MILK', sans-serif", textAlign: 'center' }}>{card.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CardPackShop({ walletAddress, user, onBack }: CardPackShopProps) {
  const [tab, setTab] = useState<Tab>('shop');
  const [gbuxBalance, setGbuxBalance] = useState<number>(user?.gbuxBalance ?? 0);
  const [tokenPrices, setTokenPrices] = useState<TokenPrices | null>(null);
  const [loadingBal, setLoadingBal] = useState(!!walletAddress);
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [selectedToken, setSelectedToken] = useState<PaymentToken>('GBUX');
  const [phase, setPhase] = useState<Phase>('select');
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [error, setError] = useState('');
  const [revealedCards, setRevealedCards] = useState<ShopCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [starterPacksRemaining, setStarterPacksRemaining] = useState(0);
  const [openingStarter, setOpeningStarter] = useState(false);
  const walletConnected = isWalletConnected();

  useEffect(() => {
    fetchAllTokenPrices().then(p => setTokenPrices(p)).catch(() => {});
    if (!walletAddress) { setLoadingBal(false); return; }
    fetch(`/api/card-shop/balance/${walletAddress}`)
      .then(r => r.json()).then(d => { if (d?.gbuxBalance != null) setGbuxBalance(d.gbuxBalance); })
      .catch(() => {}).finally(() => setLoadingBal(false));
    // Check starter packs
    fetch(`/api/cards/owned/${walletAddress}`)
      .then(r => r.json())
      .then(d => { if (d?.starterPacksRemaining != null) setStarterPacksRemaining(d.starterPacksRemaining); })
      .catch(() => {});
  }, [walletAddress]);

  async function handleOpenStarterPack() {
    if (!walletAddress || openingStarter) return;
    setOpeningStarter(true);
    try {
      const res = await fetch('/api/card-shop/open-starter-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json();
      if (data.success && data.cards) {
        setStarterPacksRemaining(data.starterPacksRemaining ?? 0);
        setRevealedCards(data.cards);
        setSelectedPack(PACK_TYPES[0] as any);
        setShowModal(true);
      }
    } catch {}
    setOpeningStarter(false);
  }

  function handlePackSelect(pack: PackType) {
    setSelectedPack(pack);
    setSelectedToken('GBUX');
    setPhase('confirm');
    setError('');
    setPurchaseStatus('');
  }

  async function handleOpenPack() {
    if (!selectedPack) return;
    setError(''); setPurchaseStatus('');
    setPhase('purchasing');
    const prices = tokenPrices || { sol: 180, gbux: 0.0000123, budz: 0.0000123, thcLabz: 0.001 };
    const res = await executePurchaseAndOpenPack(walletAddress || '', selectedPack.id, selectedToken, prices, msg => setPurchaseStatus(msg));
    if (!res.success) { setError(res.error || 'Purchase failed'); setPhase('confirm'); return; }
    if (res.newGbuxBalance != null) setGbuxBalance(res.newGbuxBalance);
    setRevealedCards(res.cards || []);
    setShowModal(true);
  }

  function addCardsToDeck(cards: any[]) {
    try {
      const raw = localStorage.getItem('thc-clash-battle-deck');
      const deck: any[] = raw ? JSON.parse(raw) : [];
      const newDeck = [...deck, ...cards];
      localStorage.setItem('thc-clash-battle-deck', JSON.stringify(newDeck));
    } catch {}
  }

  function onModalDone() {
    if (revealedCards.length > 0) {
      addCardsToDeck(revealedCards.slice(0, 3));
    }
    setShowModal(false); setPhase('select'); setSelectedPack(null); setRevealedCards([]); setError('');
  }

  return (
    <div style={{ minHeight: '100dvh', width: '100%', position: 'relative', background: 'linear-gradient(160deg, #030b04 0%, #060f07 50%, #030b04 100%)', color: '#fff', overflowY: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'url(/thc-clash-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.07, pointerEvents: 'none' }} />

      {showModal && selectedPack && revealedCards.length > 0 && (
        <PackOpeningModal cards={revealedCards.slice(0, 3)} packName={selectedPack.name} packColor={selectedPack.color} packArtUrl={selectedPack.bgImage} onDone={onModalDone} />
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(3,11,4,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(57,255,20,0.1)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, display: 'flex', gap: 4 }}>
          {(['shop', 'collection'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${tab === t ? '#39ff14' : 'rgba(255,255,255,0.08)'}`, background: tab === t ? 'rgba(57,255,20,0.12)' : 'rgba(255,255,255,0.03)', color: tab === t ? '#39ff14' : 'rgba(255,255,255,0.4)', fontFamily: "'LEMON MILK', sans-serif", fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.18s' }}>
              {t === 'shop' ? '🛒 Shop' : '🃏 My Cards'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(190,242,100,0.08)', border: '1px solid rgba(190,242,100,0.25)', borderRadius: 10, padding: '5px 10px' }}>
          <img src="/gbux-token.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          <span style={{ fontFamily: "'LEMON MILK', sans-serif", color: '#bef264', fontSize: 13, fontWeight: 900 }}>
            {loadingBal ? '—' : Math.floor(gbuxBalance).toLocaleString()}
          </span>
          <span style={{ color: 'rgba(190,242,100,0.5)', fontSize: 9, fontFamily: "'LEMON MILK', sans-serif" }}>GBUX</span>
        </div>
      </div>

      {/* SHOP TAB */}
      {tab === 'shop' && (
        <div style={{ position: 'relative', zIndex: 1, padding: '18px 14px 100px' }}>
          {/* Starter Packs Banner */}
          {starterPacksRemaining > 0 && walletAddress && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(57,255,20,0.18), rgba(20,83,45,0.4))',
              border: '2px solid #39ff14',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 20,
              boxShadow: '0 0 24px rgba(57,255,20,0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.06,
                backgroundImage: 'url(/card-art/pack-sour-diesel.jpg)',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
                }}>
                  <div>
                    <div style={{
                      fontFamily: "'LEMON MILK', sans-serif", fontSize: 14, fontWeight: 900,
                      color: '#39ff14', letterSpacing: 1, textShadow: '0 0 12px #39ff14',
                    }}>
                      🎁 STARTER GROWERZ PACKS
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      Welcome gift · Commons only · THC GROWERZ Collection
                    </div>
                  </div>
                  <div style={{
                    background: '#39ff14', borderRadius: 10,
                    padding: '6px 12px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#000', lineHeight: 1 }}>{starterPacksRemaining}</div>
                    <div style={{ fontSize: 8, color: '#000', fontFamily: "'LEMON MILK', sans-serif", letterSpacing: 0.5 }}>LEFT</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                  {['🌿 3 Common Cards', '🆓 Completely Free', '🚫 No Tokens Required'].map(t => (
                    <span key={t} style={{
                      background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(57,255,20,0.3)',
                      borderRadius: 6, padding: '3px 8px', fontSize: 8, color: 'rgba(255,255,255,0.8)',
                      fontFamily: "'LEMON MILK', sans-serif",
                    }}>{t}</span>
                  ))}
                </div>
                <button
                  onClick={handleOpenStarterPack}
                  disabled={openingStarter}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: openingStarter ? 'rgba(57,255,20,0.3)' : '#39ff14',
                    border: 'none', borderRadius: 10, cursor: openingStarter ? 'not-allowed' : 'pointer',
                    fontFamily: "'LEMON MILK', sans-serif", fontSize: 13, fontWeight: 900,
                    color: '#000', letterSpacing: 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {openingStarter ? '🌿 OPENING...' : `OPEN STARTER PACK (${starterPacksRemaining} remaining)`}
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontFamily: "'LEMON MILK', sans-serif", color: '#39ff14', fontSize: 22, fontWeight: 900, letterSpacing: '0.12em', textShadow: '0 0 20px rgba(57,255,20,0.5)', marginBottom: 4 }}>CARD SHOP</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>All prices USD-pegged · Pay with GBUX, SOL, BUDZ, or THC</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PACK_TYPES.map(pack => (
              <div key={pack.id} style={{ width: '100%', borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${pack.color}44`, boxShadow: `0 4px 32px ${pack.color}18`, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'row', minHeight: 230 }}>

                {/* LEFT — strain photo */}
                <div style={{ width: 130, minWidth: 130, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={pack.bgImage} alt={pack.strain} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 55%, rgba(0,0,0,0.85) 100%)' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 60%)', padding: '10px 8px 0' }}>
                    <div style={{ display: 'inline-block', background: pack.color, color: '#000', fontFamily: "'LEMON MILK', sans-serif", fontSize: 8, fontWeight: 900, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 5 }}>{pack.tag}</div>
                    <div style={{ color: '#fff', fontFamily: "'LEMON MILK', sans-serif", fontSize: 10, fontWeight: 900, marginTop: 4, textShadow: `0 0 10px ${pack.color}` }}>{pack.strain}</div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 6px 8px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontStyle: 'italic', lineHeight: 1.3 }}>{pack.tagline}</div>
                  </div>
                </div>

                {/* RIGHT — info panel */}
                <div style={{ flex: 1, padding: '12px 12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'LEMON MILK', sans-serif", color: pack.color, fontSize: 16, fontWeight: 900, textShadow: `0 0 12px ${pack.color}88`, lineHeight: 1.1 }}>{pack.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 1 }}>3 cards · weighted drops</div>
                    </div>
                    <div style={{ background: `${pack.color}22`, border: `1px solid ${pack.color}55`, borderRadius: 8, padding: '3px 8px', flexShrink: 0, marginLeft: 6 }}>
                      <span style={{ fontFamily: "'LEMON MILK', sans-serif", color: pack.color, fontSize: 14, fontWeight: 900 }}>${pack.usd.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Flavor notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {pack.flavorNotes.map((note, i) => (
                      <div key={i} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{note}</div>
                    ))}
                  </div>

                  {/* Rarity odds */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {pack.odds.map(o => (
                      <div key={o.r} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${o.c}44`, borderRadius: 6, padding: '2px 6px' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: o.c, display: 'inline-block' }} />
                        <span style={{ color: o.c, fontSize: 9, fontWeight: 700 }}>{o.r}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{o.p}</span>
                      </div>
                    ))}
                  </div>

                  {/* Token price strip */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {(['GBUX', 'SOL', 'BUDZ', 'GAME_TOKEN'] as PaymentToken[]).map(t => {
                      const meta = TOKEN_META[t];
                      const amt = tokenPrices ? calcTokenAmount(pack.id, t, tokenPrices) : null;
                      const isGbux = t === 'GBUX';
                      return (
                        <div key={t} style={{ flex: 1, background: 'rgba(0,0,0,0.35)', border: `1px solid ${meta.color}33`, borderRadius: 8, padding: '4px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <span style={{ color: meta.color, fontSize: 7, fontWeight: 900, fontFamily: "'LEMON MILK', sans-serif" }}>{meta.label}</span>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 6 }}>{isGbux ? 'in-game' : 'on-chain'}</span>
                          <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{amt !== null ? fmtAmt(amt, t) : '—'}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Buy button */}
                  <button onClick={() => handlePackSelect(pack)} style={{ width: '100%', padding: '9px 0', borderRadius: 11, cursor: 'pointer', background: `linear-gradient(135deg, ${pack.color} 0%, ${pack.color}bb 100%)`, border: `2px solid ${pack.color}`, color: '#000', fontWeight: 900, fontSize: 11, fontFamily: "'LEMON MILK', sans-serif", letterSpacing: '0.1em', boxShadow: `0 0 16px 4px ${pack.color}33, 0 3px 0 ${pack.color}66`, textTransform: 'uppercase' }}>
                    OPEN PACK
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.1)', borderRadius: 14, padding: '12px 16px' }}>
            <div style={{ fontFamily: "'LEMON MILK', sans-serif", color: '#39ff14', fontSize: 9, letterSpacing: '0.15em', marginBottom: 6 }}>💡 HOW PRICING WORKS</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.6 }}>
              All pack prices are fixed in USD. Token amounts update live from Jupiter. Pay with <strong style={{ color: '#bef264' }}>GBUX</strong> (in-game credits, no wallet needed), or connect your wallet to pay on-chain with <strong style={{ color: '#9945ff' }}>SOL</strong>, <strong style={{ color: '#39ff14' }}>BUDZ</strong>, or <strong style={{ color: '#ff6b00' }}>THC LABZ</strong>. The AI agent treasury verifies every on-chain payment before cards are released.
            </div>
          </div>
        </div>
      )}

      {/* COLLECTION TAB */}
      {tab === 'collection' && <div style={{ position: 'relative', zIndex: 1 }}><CollectionView walletAddress={walletAddress} /></div>}

      {/* CONFIRM BOTTOM SHEET */}
      {tab === 'shop' && phase === 'confirm' && selectedPack && !showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) { setPhase('select'); setSelectedPack(null); } }}>
          <div style={{ width: '100%', maxWidth: 500, margin: '0 auto', background: 'linear-gradient(180deg, #0d1f12 0%, #080f08 100%)', border: `2px solid ${selectedPack.color}44`, borderBottom: 'none', borderRadius: '22px 22px 0 0', padding: '18px 18px 44px', boxShadow: `0 -24px 60px ${selectedPack.color}18` }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />

            <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 90, height: 120, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: `2px solid ${selectedPack.color}`, boxShadow: `0 0 20px 6px ${selectedPack.color}44` }}>
                <img src={selectedPack.bgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'LEMON MILK', sans-serif", color: selectedPack.color, fontSize: 18, fontWeight: 900, textShadow: `0 0 14px ${selectedPack.color}` }}>{selectedPack.name}</div>
                <div style={{ color: '#999', fontSize: 10, fontFamily: "'LEMON MILK', sans-serif", marginBottom: 6 }}>{selectedPack.strain}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.5 }}>{selectedPack.effectDesc}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexWrap: 'wrap' }}>
              {selectedPack.odds.map(o => (
                <div key={o.r} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${o.c}11`, border: `1px solid ${o.c}44`, borderRadius: 8, padding: '4px 10px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: o.c, display: 'inline-block' }} />
                  <span style={{ color: o.c, fontSize: 10, fontWeight: 700 }}>{o.r}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{o.p}</span>
                </div>
              ))}
            </div>

            {error && <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '9px 12px', marginBottom: 14, color: '#f87171', fontSize: 12, textAlign: 'center' }}>{error}</div>}

            <div style={{ marginBottom: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: "'LEMON MILK', sans-serif", letterSpacing: '0.1em', marginBottom: 8 }}>
                SELECT PAYMENT · PRICES FIXED IN USD
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['GBUX', 'SOL', 'BUDZ', 'GAME_TOKEN'] as PaymentToken[]).map(t => {
                  const meta = TOKEN_META[t];
                  const amt = tokenPrices ? calcTokenAmount(selectedPack.id, t, tokenPrices) : null;
                  const disabled = t !== 'GBUX' && !walletConnected;
                  const isSelected = selectedToken === t;
                  return (
                    <button key={t} onClick={() => !disabled && setSelectedToken(t)}
                      style={{
                        flex: 1, padding: '10px 3px', borderRadius: 12,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        border: `2px solid ${isSelected ? meta.color : 'rgba(255,255,255,0.1)'}`,
                        background: isSelected ? `${meta.color}18` : 'rgba(0,0,0,0.3)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        opacity: disabled ? 0.35 : 1, transition: 'all 0.15s',
                      }}>
                      <span style={{ color: meta.color, fontSize: 8, fontWeight: 900, fontFamily: "'LEMON MILK', sans-serif" }}>{meta.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7 }}>{meta.sublabel}</span>
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>{amt !== null ? fmtAmt(amt, t) : '—'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7 }}>${PACK_USD_PRICES[selectedPack.id].toFixed(2)} USD</span>
                    </button>
                  );
                })}
              </div>
              {selectedToken !== 'GBUX' && !walletConnected && (
                <div style={{ color: '#fbbf24', fontSize: 10, textAlign: 'center', marginTop: 6 }}>
                  Connect Phantom/Solflare to pay on-chain
                </div>
              )}
              {selectedToken === 'GBUX' && (
                <div style={{ color: 'rgba(190,242,100,0.6)', fontSize: 9, textAlign: 'center', marginTop: 5 }}>
                  GBUX Balance: {Math.floor(gbuxBalance).toLocaleString()} · Cost: {selectedPack.gbuxCost.toLocaleString()}
                </div>
              )}
            </div>

            <button onClick={handleOpenPack}
              disabled={selectedToken === 'GBUX' && gbuxBalance < selectedPack.gbuxCost}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14, cursor: 'pointer', marginTop: 12,
                background: `linear-gradient(135deg, ${selectedPack.color} 0%, ${selectedPack.color}99 100%)`,
                border: `2px solid ${selectedPack.color}`, color: '#000', fontWeight: 900, fontSize: 14,
                fontFamily: "'LEMON MILK', sans-serif", letterSpacing: '0.12em',
                boxShadow: `0 0 30px 10px ${selectedPack.color}33, 0 5px 0 ${selectedPack.color}66`,
                opacity: selectedToken === 'GBUX' && gbuxBalance < selectedPack.gbuxCost ? 0.4 : 1,
                textTransform: 'uppercase', transition: 'opacity 0.2s',
              }}>
              {selectedToken === 'GBUX' && gbuxBalance < selectedPack.gbuxCost
                ? `Need ${(selectedPack.gbuxCost - Math.floor(gbuxBalance)).toLocaleString()} More GBUX`
                : selectedToken === 'GBUX'
                  ? `OPEN · ${selectedPack.gbuxCost.toLocaleString()} GBUX`
                  : tokenPrices
                    ? `OPEN · ${fmtAmt(calcTokenAmount(selectedPack.id, selectedToken, tokenPrices), selectedToken)} ${TOKEN_META[selectedToken].label}`
                    : `OPEN · $${PACK_USD_PRICES[selectedPack.id]} USD`
              }
            </button>
          </div>
        </div>
      )}

      {/* PURCHASING OVERLAY */}
      {phase === 'purchasing' && !showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <img src="/thc-labz-logo-nowords.png" alt="" style={{ width: 72, height: 72, objectFit: 'contain', filter: `drop-shadow(0 0 24px ${selectedPack?.color || '#39ff14'})`, animation: 'spin 1.1s linear infinite' }} />
          <div style={{ fontFamily: "'LEMON MILK', sans-serif", color: '#fff', fontSize: 14, letterSpacing: '0.12em' }}>OPENING YOUR PACK...</div>
          {purchaseStatus && <div style={{ color: '#39ff14', fontSize: 11 }}>{purchaseStatus}</div>}
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
