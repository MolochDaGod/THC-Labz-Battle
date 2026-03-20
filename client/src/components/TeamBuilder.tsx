import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, X, Check, Zap, Swords, Heart, Shield, Star, Info } from 'lucide-react';
import { rarityColor, type GrowerzUnitCard } from '../utils/GrowerzUnitSystem';

interface TeamBuilderProps {
  walletAddress?: string;
  growerzUnitCards?: GrowerzUnitCard[];
  onBack: () => void;
  onContinue: (deck: any[], teamName: string) => void;
}

const RARITY = {
  legendary: { border: '#fbbf24', glow: 'rgba(251,191,36,0.55)', badge: '#92400e', text: '#fbbf24', label: '★ LEGENDARY' },
  epic:      { border: '#a855f7', glow: 'rgba(168,85,247,0.55)', badge: '#4c1d95', text: '#c084fc', label: '◆ EPIC' },
  rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.55)', badge: '#1e3a8a', text: '#60a5fa', label: '● RARE' },
  uncommon:  { border: '#22c55e', glow: 'rgba(34,197,94,0.45)',  badge: '#14532d', text: '#4ade80', label: '▲ UNCOMMON' },
  common:    { border: '#6b7280', glow: 'rgba(107,114,128,0.3)', badge: '#1f2937', text: '#9ca3af', label: '— COMMON' },
};

const CLASS_META: Record<string, { icon: string; color: string; label: string }> = {
  melee:   { icon: '⚔️', color: '#f87171', label: 'Melee' },
  ranged:  { icon: '🎯', color: '#38bdf8', label: 'Ranged' },
  magical: { icon: '✨', color: '#c084fc', label: 'Magic' },
  tank:    { icon: '🛡️', color: '#4ade80', label: 'Tank' },
  growerz: { icon: '🌿', color: '#39ff14', label: 'GROWERZ' },
  all:     { icon: '🃏', color: '#fff',    label: 'All' },
};

const TYPE_ICON: Record<string, string> = {
  minion: '👤', tower: '🏰', spell: '💥', beast: '🐾',
};

function getRarityMeta(r: string) {
  return RARITY[r as keyof typeof RARITY] || RARITY.common;
}

/* ── Tooltip component ─────────────────────────────── */
function CardTooltip({ card, onClose }: { card: any; onClose: () => void }) {
  const rm = getRarityMeta(card.rarity);
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #0a0f0a 0%, #111a11 100%)',
          border: `2px solid ${rm.border}`,
          boxShadow: `0 0 32px ${rm.glow}`,
          borderRadius: 20, overflow: 'hidden', maxWidth: 340, width: '100%',
        }}
      >
        {/* Art */}
        <div style={{ position: 'relative', height: 200 }}>
          <img
            src={card.image}
            alt={card.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23228B22" width="100" height="100"/></svg>'; }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: rm.badge, color: rm.text, fontSize: 9, fontWeight: 900,
            padding: '3px 8px', borderRadius: 6, letterSpacing: 1,
            border: `1px solid ${rm.border}66`,
          }}>{rm.label}</div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
            border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={14} /></button>
          <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: "'LEMON MILK', sans-serif" }}>{card.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {TYPE_ICON[card.type] || '▸'} {card.type?.toUpperCase()} · {(CLASS_META[card.class]?.icon || '') + ' ' + (card.class || '').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 1 }}>
          {[
            { icon: '⚡', val: card.cost,   label: 'COST', bg: '#4c1d95', color: '#c084fc' },
            { icon: '⚔️', val: card.attack, label: 'ATK',  bg: '#7f1d1d', color: '#fca5a5' },
            { icon: '❤️', val: card.health, label: 'HP',   bg: '#14532d', color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: s.bg, padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, lineHeight: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: s.color, lineHeight: 1, marginTop: 2 }}>{s.val}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ padding: '12px 14px 14px' }}>
          {card.description && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>
              "{card.description}"
            </p>
          )}
          {card.abilities?.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#39ff14', fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>ABILITIES</div>
              {card.abilities.map((ab: string, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4,
                  background: 'rgba(57,255,20,0.06)', borderRadius: 6, padding: '5px 8px',
                  border: '1px solid rgba(57,255,20,0.15)',
                }}>
                  <span style={{ color: '#39ff14', fontSize: 12, marginTop: 0 }}>◈</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{ab}</span>
                </div>
              ))}
            </div>
          )}
          {card.isGrowerzUnit && card.traits && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: '#39ff14', fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>NFT TRAITS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {Object.entries(card.traits).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} style={{
                    background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 7px',
                    fontSize: 9, color: 'rgba(255,255,255,0.55)',
                  }}>
                    <span style={{ color: '#39ff14' }}>{k}</span>: {v as string}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Full Trading Card ──────────────────────────────── */
function TradingCard({
  card, inDeck, disabled, onAdd, onInfo,
}: {
  card: any; inDeck: boolean; disabled: boolean;
  onAdd: () => void; onInfo: (e: React.MouseEvent) => void;
}) {
  const rm = getRarityMeta(card.rarity);
  const cm = CLASS_META[card.class] || CLASS_META.all;

  return (
    <div style={{ position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}>
      {/* Card frame */}
      <div
        onClick={!inDeck && !disabled ? onAdd : undefined}
        style={{
          borderRadius: 12,
          border: `2px solid ${inDeck ? '#22c55e' : rm.border}`,
          boxShadow: inDeck
            ? '0 0 12px rgba(34,197,94,0.6)'
            : `0 0 10px ${rm.glow}, inset 0 0 0 1px rgba(255,255,255,0.05)`,
          overflow: 'hidden',
          background: '#0a0f0a',
          transition: 'transform 0.15s, box-shadow 0.15s',
          position: 'relative',
        }}
      >
        {/* Art area — portrait 3:4 */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
          <img
            src={card.image}
            alt={card.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 133"><rect fill="%23228B22" width="100" height="133"/><circle cx="50" cy="60" r="30" fill="%2339ff14" opacity="0.25"/></svg>';
            }}
          />

          {/* Gradient overlays */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.82) 100%)',
          }} />

          {/* ── TOP ROW ── */}
          {/* Cost — top left */}
          <div style={{
            position: 'absolute', top: 5, left: 5,
            background: 'rgba(88,28,135,0.92)', border: '1.5px solid #a855f7',
            borderRadius: '50%', width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: '#e9d5ff',
            boxShadow: '0 0 8px rgba(168,85,247,0.7)',
            fontFamily: "'LEMON MILK', sans-serif",
          }}>
            {card.cost}
          </div>

          {/* Type icon — top right */}
          <div style={{
            position: 'absolute', top: 5, right: 5,
            background: 'rgba(0,0,0,0.6)', borderRadius: 5,
            padding: '1px 4px', fontSize: 11,
          }}>
            {card.isGrowerzUnit
              ? <img src="/budz-token.png" alt="" style={{ width: 14, height: 14 }} />
              : (TYPE_ICON[card.type] || '▸')
            }
          </div>

          {/* Rarity glow strip — just inside top border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent 0%, ${rm.border} 50%, transparent 100%)`,
          }} />

          {/* ── BOTTOM ROW — stats overlay ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '4px 5px 5px',
          }}>
            {/* Name */}
            <div style={{
              fontSize: 9, fontWeight: 900, color: '#fff', lineHeight: 1.2,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)', marginBottom: 3,
              fontFamily: "'LEMON MILK', sans-serif",
              letterSpacing: 0.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{card.name}</div>

            {/* ATK / HP */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                background: 'rgba(127,29,29,0.85)', borderRadius: 4, padding: '2px 5px',
                display: 'flex', alignItems: 'center', gap: 2,
                border: '1px solid rgba(248,113,113,0.4)',
              }}>
                <span style={{ fontSize: 9 }}>⚔️</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#fca5a5', fontFamily: "'LEMON MILK', sans-serif" }}>
                  {card.attack}
                </span>
              </div>

              {/* Class icon center */}
              <div style={{ fontSize: 11 }}>{cm.icon}</div>

              <div style={{
                background: 'rgba(20,83,45,0.85)', borderRadius: 4, padding: '2px 5px',
                display: 'flex', alignItems: 'center', gap: 2,
                border: '1px solid rgba(74,222,128,0.4)',
              }}>
                <span style={{ fontSize: 9 }}>❤️</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#4ade80', fontFamily: "'LEMON MILK', sans-serif" }}>
                  {card.health}
                </span>
              </div>
            </div>
          </div>

          {/* In-deck checkmark */}
          {inDeck && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: '#16a34a', borderRadius: '50%', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(34,197,94,0.8)',
              }}>
                <Check size={18} color="#fff" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info button */}
      <button
        onClick={onInfo}
        style={{
          position: 'absolute', bottom: -8, right: -8, zIndex: 10,
          background: 'rgba(0,0,0,0.85)', border: `1px solid ${rm.border}`,
          borderRadius: '50%', width: 22, height: 22, cursor: 'pointer',
          color: rm.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Info size={11} />
      </button>
    </div>
  );
}

/* ── Deck Slot (mini portrait card) ────────────────── */
function DeckSlot({ card, onRemove, index }: { card: any | null; onRemove?: () => void; index: number }) {
  const rm = card ? getRarityMeta(card.rarity) : null;
  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: `1.5px solid ${card ? rm!.border : 'rgba(255,255,255,0.1)'}`,
      boxShadow: card ? `0 0 8px ${rm!.glow}` : 'none',
      background: card ? '#0a0f0a' : 'rgba(255,255,255,0.03)',
      aspectRatio: '3/4', position: 'relative', cursor: card ? 'pointer' : 'default',
    }}
    onClick={card ? onRemove : undefined}
    >
      {card ? (
        <>
          <img
            src={card.image}
            alt={card.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 133"><rect fill="%23228B22" width="100" height="133"/></svg>'; }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
          }} />
          {/* Cost badge */}
          <div style={{
            position: 'absolute', top: 2, left: 2, background: 'rgba(88,28,135,0.92)',
            borderRadius: '50%', width: 14, height: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 900, color: '#e9d5ff', border: '1px solid #a855f7',
          }}>{card.cost}</div>
          {/* Remove overlay */}
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(239,68,68,0)',
            transition: 'background 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0)'; }}
          >
            <X size={14} color="rgba(255,255,255,0)" style={{ transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as SVGElement).style.color = '#fff'; }}
            />
          </div>
          <div style={{ position: 'absolute', bottom: 1, left: 0, right: 0, textAlign: 'center' }}>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', fontFamily: "'LEMON MILK', sans-serif", lineHeight: 1 }}>
              {card.name.split(' ')[0]}
            </span>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.12)' }}>+</span>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.1)', fontFamily: "'LEMON MILK', sans-serif" }}>{index + 1}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main TeamBuilder ───────────────────────────────── */
export default function TeamBuilder({ walletAddress, growerzUnitCards = [], onBack, onContinue }: TeamBuilderProps) {
  const [teamName, setTeamName] = useState(() => localStorage.getItem('thc-clash-team-name') || '');
  const [allCards, setAllCards] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any[]>(() => {
    try { const s = localStorage.getItem('thc-clash-battle-deck'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [tooltip, setTooltip] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/admin/cards/active/gameplay')
      .then(r => r.json())
      .then(data => { if (data.success && data.cards) setAllCards(data.cards); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToDeck = (card: any) => {
    if (selectedDeck.length >= 11 || selectedDeck.find(c => c.id === card.id)) return;
    const d = [...selectedDeck, card];
    setSelectedDeck(d);
    localStorage.setItem('thc-clash-battle-deck', JSON.stringify(d));
  };

  const removeFromDeck = (id: string) => {
    const d = selectedDeck.filter(c => c.id !== id);
    setSelectedDeck(d);
    localStorage.setItem('thc-clash-battle-deck', JSON.stringify(d));
  };

  const handleContinue = () => {
    if (selectedDeck.length < 4) return;
    const name = teamName.trim() || 'THC Warriors';
    localStorage.setItem('thc-clash-team-name', name);
    localStorage.setItem('thc-clash-battle-deck', JSON.stringify(selectedDeck));
    onContinue(selectedDeck, name);
  };

  const filteredCards = filter === 'growerz'
    ? growerzUnitCards
    : filter === 'all'
    ? allCards
    : allCards.filter(c => c.class === filter);

  const hasDeck = selectedDeck.length >= 4;
  const avgCost = selectedDeck.length > 0
    ? (selectedDeck.reduce((s, c) => s + c.cost, 0) / selectedDeck.length).toFixed(1) : '—';

  const TABS = [
    { key: 'all',     ...CLASS_META.all },
    { key: 'melee',   ...CLASS_META.melee },
    { key: 'ranged',  ...CLASS_META.ranged },
    { key: 'magical', ...CLASS_META.magical },
    { key: 'tank',    ...CLASS_META.tank },
    ...(growerzUnitCards.length > 0 ? [{ key: 'growerz', ...CLASS_META.growerz }] : []),
  ];

  return (
    <div style={{
      minHeight: '100dvh', color: '#fff', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #050d05 0%, #0c160c 50%, #060d0a 100%)',
      fontFamily: "'LEMON MILK', sans-serif",
    }}>

      {/* ── Sticky Header ──────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,13,5,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(57,255,20,0.15)',
        padding: '10px 14px 8px',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button onClick={onBack} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#aaa',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            }}>
              <ArrowLeft size={15} /> Back
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#39ff14', letterSpacing: 1, textShadow: '0 0 12px rgba(57,255,20,0.6)' }}>
                DECK BUILDER
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                {selectedDeck.length}/11 CARDS
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!hasDeck}
              style={{
                background: hasDeck ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(255,255,255,0.05)',
                border: hasDeck ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '8px 14px', cursor: hasDeck ? 'pointer' : 'not-allowed',
                color: hasDeck ? '#fff' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                boxShadow: hasDeck ? '0 0 16px rgba(74,222,128,0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              BATTLE <ChevronRight size={15} />
            </button>
          </div>

          {/* Team name input */}
          <input
            type="text"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Name your deck..."
            maxLength={24}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(57,255,20,0.2)',
              borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 12,
              outline: 'none', fontFamily: "'LEMON MILK', sans-serif",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 120px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

          {/* ── Deck Slots ─────────────────────────────── */}
          <div style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(57,255,20,0.12)',
            borderRadius: 16, padding: '12px 10px', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#39ff14', letterSpacing: 1 }}>
                ⚔ BATTLE DECK ({selectedDeck.length}/11)
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                {selectedDeck.length > 0 && (
                  <>
                    <span>AVG ⚡{avgCost}</span>
                    <span>ATK {selectedDeck.reduce((s, c) => s + c.attack, 0)}</span>
                    <span>HP {selectedDeck.reduce((s, c) => s + c.health, 0)}</span>
                    <button
                      onClick={() => { setSelectedDeck([]); localStorage.removeItem('thc-clash-battle-deck'); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 9, padding: 0 }}
                    >CLEAR</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[...Array(11)].map((_, i) => (
                <DeckSlot key={i} card={selectedDeck[i] || null} index={i}
                  onRemove={() => selectedDeck[i] && removeFromDeck(selectedDeck[i].id)} />
              ))}
            </div>

            {selectedDeck.length < 4 && (
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 9, color: '#fbbf24' }}>
                ⚠ Select at least 4 cards to unlock battle
              </div>
            )}
          </div>

          {/* ── INVENTORY Header ────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, whiteSpace: 'nowrap' }}>
              🎒 INVENTORY — {allCards.length} CARDS OWNED
            </div>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── Filter Tabs ─────────────────────────────── */}
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
            marginBottom: 12, scrollbarWidth: 'none',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                  border: filter === tab.key ? `1.5px solid ${tab.color}` : '1.5px solid rgba(255,255,255,0.1)',
                  background: filter === tab.key ? `${tab.color}18` : 'rgba(0,0,0,0.4)',
                  color: filter === tab.key ? tab.color : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  boxShadow: filter === tab.key ? `0 0 12px ${tab.color}44` : 'none',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.key === 'all' && <span style={{ opacity: 0.5, fontSize: 9 }}>{allCards.length}</span>}
                {tab.key === 'growerz' && <span style={{ opacity: 0.5, fontSize: 9 }}>{growerzUnitCards.length}</span>}
              </button>
            ))}
          </div>

          {/* ── Card Grid ───────────────────────────────── */}
          {loading && filter !== 'growerz' ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid #39ff14', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Loading cards...</div>
            </div>
          ) : filter === 'growerz' && growerzUnitCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No GROWERZ NFTs in wallet</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                Connect a Solana wallet with THC GROWERZ to use them
              </div>
            </div>
          ) : filteredCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              No cards found
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filteredCards.map((card: any) => {
                const inDeck = !!selectedDeck.find(c => c.id === card.id);
                const full = selectedDeck.length >= 11 && !inDeck;
                return (
                  <TradingCard
                    key={card.id}
                    card={card}
                    inDeck={inDeck}
                    disabled={full}
                    onAdd={() => addToDeck(card)}
                    onInfo={e => { e.stopPropagation(); setTooltip(card); }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Battle CTA ─────────────────────────────────── */}
      {hasDeck && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'rgba(5,13,5,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(57,255,20,0.25)', padding: '12px 16px 20px',
        }}>
          <button
            onClick={handleContinue}
            style={{
              display: 'block', width: '100%', maxWidth: 560, margin: '0 auto',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              border: '2px solid #4ade80', borderRadius: 14, padding: '15px 0',
              color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 0 28px rgba(74,222,128,0.45)',
              letterSpacing: 1,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span>⚔️</span>
              <span>BATTLE NOW  ({selectedDeck.length}/11)</span>
              <ChevronRight size={20} />
            </span>
          </button>
        </div>
      )}

      {/* ── Card Tooltip Modal ─────────────────────────── */}
      {tooltip && <CardTooltip card={tooltip} onClose={() => setTooltip(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
