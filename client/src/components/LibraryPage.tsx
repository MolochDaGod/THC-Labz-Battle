import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { CLASSIFICATION_CARD_DATABASE, type ClassificationCard } from '../../../shared/classificationCardDatabase';
import GAME_CONFIG from '../config/gameConfig';

// ── Skill Tree ─────────────────────────────────────────
interface SkillOption { id: string; name: string; desc: string; icon: string; }
interface SkillTierDef { tier: number; label: string; options: [SkillOption, SkillOption]; }

const SKILL_TREES: Record<string, SkillTierDef[]> = {
  melee: [
    { tier: 1, label: 'STARTER BONUS', options: [
      { id: 'A', name: 'Fury Strike', desc: '+20% attack damage on every hit', icon: '🔥' },
      { id: 'B', name: 'Iron Skin',   desc: '+25% max HP and +10% damage resistance', icon: '🛡️' },
    ]},
    { tier: 2, label: 'BATTLE TRAIT', options: [
      { id: 'A', name: 'Berserk',     desc: 'Attack speed triples when HP drops below 25%', icon: '😤' },
      { id: 'B', name: 'Battle Cry',  desc: 'Adjacent allies gain +15% ATK permanently', icon: '📣' },
    ]},
    { tier: 3, label: 'POWER SKILL', options: [
      { id: 'A', name: 'Whirlwind',   desc: 'Every 8s deals full ATK damage to all nearby enemies', icon: '🌀' },
      { id: 'B', name: 'Last Stand',  desc: 'Revives once at 30% HP when killed', icon: '💀' },
    ]},
    { tier: 4, label: 'ULTIMATE', options: [
      { id: 'A', name: 'Unstoppable', desc: 'Ignores all armor, immune to stun and slow', icon: '⚡' },
      { id: 'B', name: 'Blood Feast', desc: 'Heals 20% of all damage dealt back to max HP', icon: '🩸' },
    ]},
  ],
  ranged: [
    { tier: 1, label: 'STARTER BONUS', options: [
      { id: 'A', name: 'Eagle Eye',   desc: '+30% attack range and +10% accuracy', icon: '🦅' },
      { id: 'B', name: 'Rapid Fire',  desc: 'Attack speed increased by 25%', icon: '💨' },
    ]},
    { tier: 2, label: 'BATTLE TRAIT', options: [
      { id: 'A', name: 'Explosive Rounds', desc: '25% chance for shots to deal 50% splash damage', icon: '💥' },
      { id: 'B', name: 'Poison Tip', desc: 'Shots apply 15% extra damage per second for 4s', icon: '☠️' },
    ]},
    { tier: 3, label: 'POWER SKILL', options: [
      { id: 'A', name: 'Multi-Shot',  desc: 'Each attack hits 2 targets simultaneously', icon: '🎯' },
      { id: 'B', name: "Sniper's Mark", desc: 'Marked target takes +40% damage from all sources', icon: '🔴' },
    ]},
    { tier: 4, label: 'ULTIMATE', options: [
      { id: 'A', name: 'Obliterate', desc: 'Instantly kills any enemy at or below 20% HP', icon: '💣' },
      { id: 'B', name: 'Storm Volley', desc: 'Every 15s fires a burst of 5 shots at the same target', icon: '🌩️' },
    ]},
  ],
  magical: [
    { tier: 1, label: 'STARTER BONUS', options: [
      { id: 'A', name: 'Arcane Surge', desc: '+20% spell power and +10% ability damage', icon: '✨' },
      { id: 'B', name: 'Mana Barrier', desc: 'Absorbs 15% of all incoming damage as magic shield', icon: '🔵' },
    ]},
    { tier: 2, label: 'BATTLE TRAIT', options: [
      { id: 'A', name: 'Chain Reaction', desc: 'Spells bounce to 2 extra targets at 60% damage', icon: '⛓️' },
      { id: 'B', name: 'Silence',       desc: 'Target cannot use abilities for 3 seconds after hit', icon: '🤐' },
    ]},
    { tier: 3, label: 'POWER SKILL', options: [
      { id: 'A', name: 'Void Rift',    desc: '3-tile AoE burst dealing 200% spell damage', icon: '🌑' },
      { id: 'B', name: 'Arcane Shield', desc: 'Creates a 2s full damage-immunity zone on cast', icon: '🛡️' },
    ]},
    { tier: 4, label: 'ULTIMATE', options: [
      { id: 'A', name: 'Annihilation', desc: 'Triples damage for one attack per battle — once only', icon: '☢️' },
      { id: 'B', name: 'Temporal Loop', desc: 'Resets all ability cooldowns to zero once per battle', icon: '⏳' },
    ]},
  ],
  tank: [
    { tier: 1, label: 'STARTER BONUS', options: [
      { id: 'A', name: 'Fortify',     desc: '+30% physical damage reduction permanently', icon: '🏰' },
      { id: 'B', name: 'Thorns Armor', desc: 'Returns 20% of melee damage to attacker', icon: '🌵' },
    ]},
    { tier: 2, label: 'BATTLE TRAIT', options: [
      { id: 'A', name: 'War Shout',   desc: 'Nearby allies gain +15% ATK permanently on deploy', icon: '📢' },
      { id: 'B', name: 'Shield Wall', desc: 'Absorbs the next hit completely (15s cooldown)', icon: '🛡️' },
    ]},
    { tier: 3, label: 'POWER SKILL', options: [
      { id: 'A', name: 'Taunt',       desc: 'Forces all nearby enemies to target this unit only', icon: '😡' },
      { id: 'B', name: 'Juggernaut', desc: 'Every attack knocks enemy back and stuns for 0.5s', icon: '🐂' },
    ]},
    { tier: 4, label: 'ULTIMATE', options: [
      { id: 'A', name: 'Unbreakable', desc: '50% damage reduction when HP is below 30%', icon: '💎' },
      { id: 'B', name: 'Iron Will',   desc: 'Regenerates 8% max HP per second continuously', icon: '🌱' },
    ]},
  ],
};

function getSkillTree(card: ClassificationCard): SkillTierDef[] {
  return SKILL_TREES[card.class] || SKILL_TREES.melee;
}

function loadSkills(cardId: string): Record<number, 'A' | 'B'> {
  try {
    const raw = localStorage.getItem(`thc-skills-${cardId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSkills(cardId: string, skills: Record<number, 'A' | 'B'>) {
  localStorage.setItem(`thc-skills-${cardId}`, JSON.stringify(skills));
}

// ── Rarity config ─────────────────────────────────────
const RARITY: Record<string, { border: string; glow: string; badge: string; bg: string; text: string; leaves: number }> = {
  common:    { border: '#9ca3af', glow: 'rgba(156,163,175,0.35)', badge: '#374151', bg: 'rgba(30,30,35,0.92)',    text: '#d1d5db', leaves: 1 },
  uncommon:  { border: '#22c55e', glow: 'rgba(34,197,94,0.45)',   badge: '#14532d', bg: 'rgba(10,25,15,0.92)',    text: '#4ade80', leaves: 2 },
  rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.45)',  badge: '#1e3a8a', bg: 'rgba(8,15,35,0.92)',     text: '#60a5fa', leaves: 3 },
  epic:      { border: '#a855f7', glow: 'rgba(168,85,247,0.5)',   badge: '#4c1d95', bg: 'rgba(18,8,38,0.92)',     text: '#c084fc', leaves: 4 },
  legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.6)',   badge: '#78350f', bg: 'rgba(30,15,0,0.92)',     text: '#fbbf24', leaves: 5 },
};

const CLASS_META: Record<string, { icon: string; color: string }> = {
  melee:   { icon: '⚔️', color: '#f87171' },
  ranged:  { icon: '🎯', color: '#38bdf8' },
  magical: { icon: '✨', color: '#c084fc' },
  tank:    { icon: '🛡️', color: '#4ade80' },
};

const TYPE_META: Record<string, { icon: string; color: string }> = {
  minion:   { icon: '👤', color: '#a3e635' },
  tower:    { icon: '🏰', color: '#fb923c' },
  building: { icon: '🏗️', color: '#fbbf24' },
  spell:    { icon: '💥', color: '#f472b6' },
  beast:    { icon: '🐾', color: '#34d399' },
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// ── Pot Leaf SVG ──────────────────────────────────────
function PotLeaf({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ filter: `drop-shadow(0 0 2px ${color}99)` }}>
      <path d="M12 2C12 2 7 5.5 5 9c-1.5 2.7-1 5.5 0 7 1 1.5 3 2.2 3 2.2S9.5 22 12 22s4-3.8 4-3.8 2-0.7 3-2.2c1-1.5 1.5-4.3 0-7C17 5.5 12 2 12 2z"/>
      <path d="M12 10 L12 22" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function RarityLeaves({ rarity }: { rarity: string }) {
  const rm = RARITY[rarity] || RARITY.common;
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {Array.from({ length: rm.leaves }).map((_, i) => (
        <PotLeaf key={i} color={rm.text} size={8} />
      ))}
    </div>
  );
}

// ── Tier system ───────────────────────────────────────
const TIER_LABELS = ['I', 'II', 'III', 'IV'];

function getTierStats(card: ClassificationCard, tier: number) {
  const multipliers = [1, 1.1, 1.22, 1.35];
  const m = multipliers[tier - 1];
  return {
    attack: Math.round(card.attack * m),
    health: Math.round(card.health * m),
    cost: tier === 4 ? Math.max(1, card.cost - 1) : card.cost,
  };
}

function getTierAbilities(card: ClassificationCard, tier: number): string[] {
  const raw = card.abilities;
  const base: string[] = Array.isArray(raw) ? raw
    : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
    : [];
  if (tier === 1) return base.slice(0, 1);
  if (tier === 2) return base.slice(0, Math.min(2, base.length));
  if (tier === 3) return base.slice(0, Math.min(3, base.length));
  return base;
}

function TierPips({ tier, color }: { tier: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4].map(t => (
        <div key={t} style={{
          width: 6, height: 6, borderRadius: 1,
          background: t <= tier ? color : 'rgba(255,255,255,0.12)',
          border: `1px solid ${t <= tier ? color : 'rgba(255,255,255,0.1)'}`,
          boxShadow: t <= tier ? `0 0 4px ${color}88` : 'none',
          transition: 'all 0.15s',
        }} />
      ))}
    </div>
  );
}

// ── Lore quotes ───────────────────────────────────────
const LORE: Record<string, string> = {
  'image-0':  '"Watch posts don\'t need sleep. Neither does this thing."',
  'image-1':  '"Cheap, reliable, and always watching."',
  'image-2':  '"Ten thousand hours trimming shears — ten thousand cuts per battle."',
  'image-3':  '"First day on the grow, immediately tried to trim the boss. Hired on the spot."',
  'image-4':  '"Half germinated, fully dangerous."',
  'image-5':  '"Resin-saturated pressure blasts? That\'ll slow things down."',
  'image-6':  '"The veterans say it was just a curing room. The enemy disagrees."',
  'image-7':  '"Fast hands in the trim room, even faster on the battlefield."',
  'image-8':  '"Her arrows smell like mangoes and hit like a rockslide."',
  'image-9':  '"Pierce through them. Let the Kush decide who survives."',
  'image-10': '"Hit hard, vanish into the canopy. Classic Hash Hawk."',
  'image-11': '"Live resin. It sticks. So do its effects."',
  'image-12': '"He says it\'s alchemy. We say it\'s terpene warfare. Both correct."',
  'image-13': '"Permanently golden hands. Permanently ending your plans."',
  'image-14': '"Never lost. Never will."',
  'image-15': '"If you\'re reading this, you\'re in range."',
  'image-16': '"Where she plants, the battlefield rots."',
  'image-17': '"Roots don\'t stop growing. Neither does this one."',
  'image-18': '"She dances in the trim room. She dances in combat."',
  'image-19': '"Built from concentrate. Dense. Unstoppable."',
  'image-20': '"The smoke was just cover. The daggers were real."',
  'image-21': '"Ancient strains hold ancient knowledge. Ancient devastation too."',
  'image-22': '"Fast. Sticky. Very hard to shake."',
  'image-23': '"Silence before the terpene burst. Then nothing is silent."',
  'image-24': '"Kush moves through walls. So does this warrior."',
  'image-25': '"The grow-house speaks. Its words are lightning."',
  'image-26': '"Every canopy is a battlefield. Every branch a fortification."',
  'image-27': '"Her seeds remember every grow. They act accordingly."',
  'image-28': '"Sky drops only happen once. They only need to."',
  'image-29': '"The dankest thing in the air isn\'t humidity. It\'s him."',
  'image-30': '"Purple veins carry something older than the plant itself."',
  'image-31': '"The greenhouse shudders when she enters."',
  'image-32': '"OG blood runs true. Savage, unstoppable, legendary."',
  'image-33': '"Crystals on the outside. Something far older within."',
  'image-34': '"From the mountain grows. Cold-blooded and calculating."',
  'image-35': '"One terpene bomb changed everything. One was enough."',
  'image-36': '"Not all grows are vertical. Her battlefield is everywhere."',
  'image-37': '"The last defender. Every grow should be so lucky."',
  'image-38': '"Born in the dark of a sealed clone room. Thrives everywhere."',
  'image-39': '"Cultivators call it a gift. Enemies call it a nightmare."',
  'image-40': '"Ancient seeds. Modern devastation."',
  'image-41': '"The cure room forged her. The battlefield tempts her."',
  'image-42': '"Bred from the heaviest indica line. Impossible to move."',
  'image-43': '"Not a hound. Not exactly. But loyal to the grow."',
  'image-44': '"The resin flows. So does victory."',
  'image-45': '"CO2 extraction, battlefield application. Effective on all levels."',
  'image-46': '"Full spectrum doesn\'t just mean the oil. It means the fight."',
  'image-47': '"Live rosin: pressed cold, delivered hot."',
  'image-48': '"From seed to sovereignty. Never looked back."',
  'image-49': '"The indica spirit manifests. The battlefield trembles."',
  'image-50': '"STHC flows through every cell."',
  'image-51': '"THC genesis was just the beginning."',
  'image-52': '"Void warps space. This token warps certainty."',
};

interface LibraryPageProps { onBack: () => void; walletAddress?: string; }

// ── Coerce a raw DB card record into a ClassificationCard shape ──
function dbCardToClassification(raw: any): ClassificationCard {
  const data = raw.cardData || raw.card_data || {};
  const id   = raw.cardId  || raw.card_id  || raw.id || data.id || 'unknown';
  return {
    id,
    name:        raw.cardName || data.name || id,
    image:       data.image   || '/thc-clash-bg.png',
    cost:        Number(data.cost)   || 1,
    attack:      Number(data.attack) || 50,
    health:      Number(data.health) || 100,
    description: data.description   || 'Opened from a pack.',
    rarity:      (data.rarity?.toLowerCase() || 'common') as ClassificationCard['rarity'],
    class:       (data.class  || 'melee')  as ClassificationCard['class'],
    type:        (data.type   || 'minion') as ClassificationCard['type'],
    subtype:     data.subtype,
    abilities:   Array.isArray(data.abilities) ? data.abilities : (typeof data.abilities === 'string' ? JSON.parse(data.abilities || '[]') : []),
    abilityDesc: data.abilityDesc,
    traitRequirements: [],
    isNFTConnected: false,
    rarityBackground: data.rarityBackground,
  };
}

// ── Main Library Component ────────────────────────────
export default function LibraryPage({ onBack, walletAddress }: LibraryPageProps) {
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [filterClass, setFilterClass]   = useState('all');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<ClassificationCard | null>(null);
  const [ownedIds, setOwnedIds]         = useState<Set<string>>(new Set());
  const [extraOwnedCards, setExtraOwnedCards] = useState<ClassificationCard[]>([]);

  useEffect(() => {
    if (!walletAddress) return;
    fetch(`/api/cards/owned/${walletAddress}`)
      .then(r => r.json())
      .then(d => {
        const arr: any[] = Array.isArray(d) ? d : (d?.cards ?? []);
        const ids = new Set(arr.map((c: any) => c.cardId || c.card_id || c.id));
        setOwnedIds(ids);

        const classificationIds = new Set(CLASSIFICATION_CARD_DATABASE.map(c => c.id));
        const extras = arr
          .filter((c: any) => {
            const id = c.cardId || c.card_id || c.id;
            return id && !classificationIds.has(id);
          })
          .map(dbCardToClassification);
        const uniqueExtras = extras.filter((c, i, self) => self.findIndex(x => x.id === c.id) === i);
        setExtraOwnedCards(uniqueExtras);
      })
      .catch(() => {});
  }, [walletAddress]);

  const allCards = useMemo(() => [...CLASSIFICATION_CARD_DATABASE, ...extraOwnedCards], [extraOwnedCards]);

  const filtered = allCards.filter(c => {
    if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
    if (filterType   !== 'all' && c.type  !== filterType)   return false;
    if (filterClass  !== 'all' && c.class !== filterClass)  return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aOwned = ownedIds.has(a.id) ? 0 : 1;
    const bOwned = ownedIds.has(b.id) ? 0 : 1;
    if (aOwned !== bOwned) return aOwned - bOwned;
    const ri = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    return ri !== 0 ? ri : a.name.localeCompare(b.name);
  });

  const rarityCounts = RARITY_ORDER.reduce((acc, r) => {
    acc[r] = allCards.filter(c => c.rarity === r).length;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = ['minion', 'tower', 'building', 'spell'].reduce((acc, t) => {
    acc[t] = allCards.filter(c => c.type === t || c.subtype === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{
      minHeight: '100dvh', color: '#fff',
      fontFamily: "'LEMON MILK', sans-serif",
      background: '#050d05',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/library-bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
        opacity: 0.18, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(160deg, rgba(5,13,5,0.88) 0%, rgba(12,22,12,0.82) 50%, rgba(6,13,10,0.88) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Sticky Header ──────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,13,5,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(57,255,20,0.18)',
        padding: '10px 14px 8px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button onClick={onBack} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: '#aaa',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
            }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#39ff14', letterSpacing: 1, textShadow: '0 0 14px rgba(57,255,20,0.7)' }}>
                CARD LIBRARY
              </div>
              <div style={{ fontSize: 8, color: 'rgba(57,255,20,0.5)', letterSpacing: 2, marginTop: 1 }}>
                {allCards.length} CARDS · 4 TIERS · SKILL TREES
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#39ff14' }}>{sorted.length}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>SHOWING</div>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="🔍  Search cards by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(57,255,20,0.2)',
              borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 11,
              fontFamily: "'LEMON MILK', sans-serif", outline: 'none', marginBottom: 8,
            }}
          />

          {/* Rarity filter with pot leaves */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            <button onClick={() => setFilterRarity('all')} style={filterPill(filterRarity === 'all', '#39ff14')}>
              🃏 ALL ({allCards.length})
            </button>
            {RARITY_ORDER.map(r => {
              const rm = RARITY[r];
              return (
                <button key={r} onClick={() => setFilterRarity(r)} style={filterPill(filterRarity === r, rm.border)}>
                  <span style={{ display: 'inline-flex', gap: 1, verticalAlign: 'middle', marginRight: 3 }}>
                    {Array.from({ length: rm.leaves }).map((_, i) => (
                      <img key={i} src="/card-art/weed-leaf.png" style={{ width: 10, height: 10, objectFit: 'contain', filter: `drop-shadow(0 0 2px ${rm.border})` }} />
                    ))}
                  </span>
                  {r.toUpperCase()} ({rarityCounts[r]})
                </button>
              );
            })}
          </div>

          {/* Type + Class filters */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', 'minion', 'tower', 'building', 'spell'].map(t => {
              const meta = TYPE_META[t];
              return (
                <button key={t} onClick={() => setFilterType(t)} style={filterPill(filterType === t, '#fb923c', true)}>
                  {t === 'all' ? '🗂 ALL' : `${meta?.icon || ''} ${t.toUpperCase()}`}
                </button>
              );
            })}
            <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />
            {['all', 'melee', 'ranged', 'magical', 'tank'].map(c => {
              const meta = CLASS_META[c];
              return (
                <button key={c} onClick={() => setFilterClass(c)} style={filterPill(filterClass === c, '#a78bfa', true)}>
                  {c === 'all' ? '⚡ ALL' : `${meta?.icon || ''} ${c.toUpperCase()}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Card Grid ──────────────────────────────── */}
      <div style={{
        maxWidth: 700, margin: '0 auto',
        padding: '14px 12px 100px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14,
      }}>
        {sorted.map(card => (
          <LibraryCard
            key={card.id}
            card={card}
            owned={ownedIds.has(card.id)}
            onClick={() => setSelected(card)}
          />
        ))}
      </div>

      {/* ── Detail Modal ───────────────────────────── */}
      {selected && (
        <CardDetailModal
          card={selected}
          owned={ownedIds.has(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} ::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ── Rarity → frame background map ────────────────────
const RARITY_FRAME: Record<string, string> = {
  common:    '/card-backgrounds/common-grey.png',
  uncommon:  '/card-backgrounds/uncommon-purple.png',
  rare:      '/card-backgrounds/rare-green.png',
  epic:      '/card-backgrounds/epic-gold.png',
  legendary: '/card-backgrounds/legendary-weed.png',
};

// ── TCG Library Card — standardised 4-zone layout ───────────────────────────
// 0→11% NAME BAR | 11→73% ART ZONE | 73→87% STATS BAR | 87→100% TYPE STRIP
function LibraryCard({ card, owned, onClick }: { card: ClassificationCard; owned: boolean; onClick: () => void }) {
  const rm    = RARITY[card.rarity] || RARITY.common;
  const frame = RARITY_FRAME[card.rarity] || RARITY_FRAME.common;
  const isSpell = card.type === 'spell';
  const typeLabel = (card.subtype || card.type).toUpperCase();
  const classLabel = (card.class || '').toUpperCase();

  // ── Spell effect colour + label ──────────────────────────
  // AOE radius spells → orange (explosive)
  // Duration spells   → cyan   (freeze / time)
  // Generic damage    → pink   (magical impact)
  const spellColor  = isSpell && card.aoeRadius ? '#fb923c'
                    : isSpell && card.duration  ? '#22d3ee'
                    : '#e879f9';
  const spellLabel  = isSpell && card.aoeRadius ? '💥 AOE BLAST'
                    : isSpell && card.duration  ? `⏱ ${card.duration}s DUR`
                    : '⚡ IMPACT';

  // ── Standardised card zones (% of card height) ──────────
  // 0 → 11%  : NAME BAR  (mana orb top-right — no mana column needed)
  // 11 → 72% : ART ZONE
  // 72 → 88% : STATS BAR — minion/tower: ⚔ ATK | ❤ HP
  //                       — spell:       ⚔ DMG | effect text
  // 88 → 100%: TYPE STRIP

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '2/3',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `2px solid ${rm.border}${owned ? 'dd' : '55'}`,
        boxShadow: owned
          ? `0 0 22px ${rm.glow}, 0 0 8px rgba(57,255,20,0.5), 0 6px 24px rgba(0,0,0,0.9)`
          : `0 0 10px ${rm.glow}66, 0 4px 16px rgba(0,0,0,0.8)`,
        fontFamily: "'LEMON MILK', 'Arial Black', sans-serif",
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px) scale(1.04)';
        (e.currentTarget as HTMLElement).style.zIndex = '5';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.zIndex = '1';
      }}
    >

      {/* ── BG LAYER: blurred art + rarity frame texture ── */}
      <img src={card.image} alt=""
        style={{
          position: 'absolute', inset: -16,
          width: 'calc(100% + 32px)', height: 'calc(100% + 32px)',
          objectFit: 'cover', objectPosition: 'center 20%',
          filter: owned
            ? 'blur(16px) saturate(1.5) brightness(0.55)'
            : 'blur(16px) saturate(0.3) brightness(0.32)',
          zIndex: 0,
        }}
      />
      <img src={frame} alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: owned ? 0.18 : 0.5,
          mixBlendMode: 'screen',
          zIndex: 0, pointerEvents: 'none',
        }}
      />
      {/* inner glow ring */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: `inset 0 0 20px ${rm.border}${owned ? '33' : '18'}`,
        zIndex: 0, pointerEvents: 'none', borderRadius: 10,
      }} />

      {/* ── NAME BAR  0 → 11% ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '11%',
        background: `linear-gradient(180deg, rgba(0,0,0,0.9) 0%, ${rm.border}28 100%)`,
        borderBottom: `1.5px solid ${rm.border}88`,
        zIndex: 3,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '1% 18% 1% 3%',
      }}>
        <div style={{ fontSize: 5.5, fontWeight: 900, color: rm.text, letterSpacing: 1.5, lineHeight: 1, marginBottom: 1.5 }}>
          {card.rarity.toUpperCase()}
        </div>
        <div style={{
          fontSize: 8.5, fontWeight: 900, color: '#fff', lineHeight: 1.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          width: '100%', textAlign: 'center',
          textShadow: `0 0 10px ${rm.border}cc, 0 1px 3px rgba(0,0,0,1)`,
        }}>{card.name}</div>
      </div>

      {/* Cost orb — top-right overlapping name bar */}
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

      {/* ── ART ZONE  11% → 72% — viewport with contain so character is never cropped ── */}
      <div style={{
        position: 'absolute',
        top: '11%', left: 0, right: 0, height: '61%',
        zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Blurred fill behind contain image */}
        <img src={card.image} alt="" aria-hidden
          style={{
            position: 'absolute', inset: -12,
            width: 'calc(100% + 24px)', height: 'calc(100% + 24px)',
            objectFit: 'cover', objectPosition: 'center 20%',
            filter: owned
              ? 'blur(10px) saturate(1.4) brightness(0.55)'
              : 'blur(10px) saturate(0.3) brightness(0.32)',
          }}
        />
        {/* Main character image — contain so the whole subject is always visible */}
        <img src={card.image} alt={card.name} loading="lazy"
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', height: '100%',
            objectFit: 'contain', objectPosition: 'center 15%',
            filter: owned ? 'none' : 'saturate(0.45) brightness(0.72)',
            transform: 'scale(1.06)',
            transformOrigin: 'center 30%',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src =
              `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 155"><rect fill="%23050d05" width="100" height="155"/><text x="50" y="85" font-size="38" text-anchor="middle" fill="%2339ff14">%F0%9F%8C%BF</text></svg>`;
          }}
        />
      </div>
      {/* fade art into stats bar — ends at 72% boundary */}
      <div style={{
        position: 'absolute', top: '55%', left: 0, right: 0, height: '17%',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.92) 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* ── STATS BAR  72% → 88% ── */}
      <div style={{
        position: 'absolute', top: '72%', left: 0, right: 0, height: '16%',
        background: 'rgba(0,0,0,0.92)',
        borderTop: `2px solid ${rm.border}88`,
        borderBottom: `1px solid rgba(255,255,255,0.1)`,
        zIndex: 3,
        display: 'flex', alignItems: 'stretch',
      }}>
        {isSpell ? (
          <>
            {/* Spell: DMG value (left) */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              borderRight: '1px solid rgba(255,255,255,0.12)',
              background: `${spellColor}18`,
            }}>
              <div style={{ fontSize: 6, color: spellColor, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>⚔ DMG</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: spellColor, lineHeight: 1, textShadow: `0 0 10px ${spellColor}` }}>{card.attack}</div>
            </div>
            {/* Spell: effect text (right) */}
            <div style={{
              flex: 1.2, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              background: `${spellColor}10`,
            }}>
              <div style={{ fontSize: 6, color: spellColor, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>EFFECT</div>
              <div style={{ fontSize: 8.5, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: 0.3, textShadow: `0 0 8px ${spellColor}` }}>{spellLabel}</div>
            </div>
          </>
        ) : (
          <>
            {/* Minion/Tower: ATK (left, red) */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              borderRight: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(220,38,38,0.15)',
            }}>
              <div style={{ fontSize: 6, color: '#f87171', fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>⚔ ATK</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fca5a5', lineHeight: 1, textShadow: '0 0 10px rgba(220,38,38,1)' }}>{card.attack}</div>
            </div>
            {/* Minion/Tower: HP (right, green) */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              background: 'rgba(22,163,74,0.15)',
            }}>
              <div style={{ fontSize: 6, color: '#4ade80', fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>❤ HP</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#86efac', lineHeight: 1, textShadow: '0 0 10px rgba(34,197,94,1)' }}>{card.health}</div>
            </div>
          </>
        )}
      </div>

      {/* ── TYPE STRIP  88% → 100% — flush edge-to-edge ── */}
      <div style={{
        position: 'absolute', top: '88%', left: 0, right: 0, bottom: 0,
        background: `linear-gradient(90deg, rgba(0,0,0,0.96) 0%, ${rm.border}28 50%, rgba(0,0,0,0.96) 100%)`,
        borderTop: `1px solid ${rm.border}44`,
        zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 3%',
      }}>
        <span style={{ fontSize: 6, color: rm.text, fontWeight: 900, letterSpacing: 1 }}>{typeLabel}</span>
        {owned
          ? <span style={{ fontSize: 6, fontWeight: 900, color: '#39ff14', letterSpacing: 0.5, textShadow: '0 0 8px rgba(57,255,20,0.8)' }}>✓ OWNED</span>
          : <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', fontWeight: 900, letterSpacing: 0.5 }}>{classLabel || typeLabel}</span>
        }
      </div>

    </div>
  );
}

// ── Skill Tree Component ──────────────────────────────
function SkillTree({ card, rm }: { card: ClassificationCard; rm: typeof RARITY[string] }) {
  const [skills, setSkills] = useState<Record<number, 'A' | 'B'>>(() => loadSkills(card.id));
  const tree = getSkillTree(card);

  function choose(tier: number, choice: 'A' | 'B') {
    const updated = { ...skills, [tier]: choice };
    setSkills(updated);
    saveSkills(card.id, updated);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        — SKILL TREE —
        <span style={{ fontSize: 7, color: rm.text, background: `${rm.border}22`, border: `1px solid ${rm.border}44`, borderRadius: 4, padding: '1px 5px' }}>
          {Object.keys(skills).length}/4 CHOSEN
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tree.map(({ tier, label, options }) => {
          const chosen = skills[tier];
          return (
            <div key={tier} style={{
              background: chosen ? `${rm.border}12` : 'rgba(0,0,0,0.35)',
              border: `1px solid ${chosen ? rm.border + '50' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              {/* Tier header */}
              <div style={{
                padding: '4px 10px',
                background: chosen ? `${rm.border}20` : 'rgba(255,255,255,0.04)',
                borderBottom: `1px solid ${chosen ? rm.border + '30' : 'rgba(255,255,255,0.06)'}`,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: chosen ? rm.border : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 900, color: chosen ? '#000' : 'rgba(255,255,255,0.3)',
                  boxShadow: chosen ? `0 0 8px ${rm.glow}` : 'none',
                }}>
                  {tier === 4 ? '★' : tier}
                </div>
                <span style={{ fontSize: 8, color: chosen ? rm.text : 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 1 }}>
                  TIER {['I','II','III','IV'][tier-1]} · {label}
                </span>
                {chosen && (
                  <span style={{ marginLeft: 'auto', fontSize: 7, color: rm.text, background: `${rm.border}25`, borderRadius: 4, padding: '1px 5px' }}>
                    {options.find(o => o.id === chosen)?.name}
                  </span>
                )}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: 6, padding: 8 }}>
                {options.map(opt => {
                  const isChosen = chosen === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => choose(tier, opt.id as 'A' | 'B')}
                      style={{
                        flex: 1, border: `1.5px solid ${isChosen ? rm.border : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 8, background: isChosen ? `${rm.border}22` : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', padding: '7px 6px', textAlign: 'left', transition: 'all 0.15s',
                        boxShadow: isChosen ? `0 0 10px ${rm.glow}` : 'none',
                      }}
                    >
                      <div style={{ fontSize: 15, marginBottom: 2, lineHeight: 1 }}>{opt.icon}</div>
                      <div style={{ fontSize: 9, fontWeight: 900, color: isChosen ? rm.text : '#fff', fontFamily: "'LEMON MILK', sans-serif", marginBottom: 2 }}>
                        {opt.id}. {opt.name}
                      </div>
                      <div style={{ fontSize: 8, color: isChosen ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                        {opt.desc}
                      </div>
                      {isChosen && (
                        <div style={{
                          marginTop: 4, fontSize: 7, color: rm.text, fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          ✓ ACTIVE
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Card Detail Modal ─────────────────────────────────
function CardDetailModal({ card, owned, onClose }: { card: ClassificationCard; owned: boolean; onClose: () => void }) {
  const [viewTier, setViewTier] = useState(1);
  const rm = RARITY[card.rarity] || RARITY.common;
  const cm = CLASS_META[card.class];
  const tm = TYPE_META[card.type] || TYPE_META[card.subtype || ''] || { icon: '▸', color: '#fff' };
  const lore = LORE[card.id] || `"Born of the finest cannabis genetics."`;
  const tierStats = getTierStats(card, viewTier);
  const tierAbilities = getTierAbilities(card, viewTier);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(165deg, #060e06 0%, #0f1a0f 100%)',
          border: `2px solid ${rm.border}`,
          boxShadow: `0 0 48px ${rm.glow}`,
          borderRadius: 20, overflow: 'hidden',
          width: '100%', maxWidth: 360, maxHeight: '92vh', overflowY: 'auto',
          fontFamily: "'LEMON MILK', sans-serif",
        }}
      >
        {/* Art header — blurred backdrop + contain viewport so full character shows */}
        <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
          {/* Blurred background fill */}
          <img src={card.image} alt="" aria-hidden
            style={{
              position: 'absolute', inset: -20,
              width: 'calc(100% + 40px)', height: 'calc(100% + 40px)',
              objectFit: 'cover', objectPosition: 'center 20%',
              filter: 'blur(18px) saturate(1.5) brightness(0.45)',
            }}
          />
          {/* Rarity frame overlay on backdrop */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${rm.border}22 0%, transparent 60%)`,
          }} />
          {/* Main character image — contain so nothing is ever cut off */}
          <img
            src={card.image}
            alt={card.name}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', objectPosition: 'center 15%',
              transform: 'scale(1.04)',
              transformOrigin: 'center 30%',
            }}
            onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23228B22" width="100" height="100"/></svg>'; }}
          />
          {/* Bottom fade into panel content */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,14,6,1) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)' }} />

          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${rm.border}55`, borderRadius: '50%', width: 28, height: 28,
            cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={13} /></button>

          {/* Rarity leaves top-right */}
          <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', gap: 2, alignItems: 'center' }}>
            <div style={{
              background: rm.badge, borderRadius: 6, padding: '3px 8px',
              fontSize: 8, fontWeight: 900, color: rm.text, letterSpacing: 0.5,
              border: `1px solid ${rm.border}55`,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {Array.from({ length: rm.leaves }).map((_, i) => <img key={i} src="/card-art/weed-leaf.png" style={{ width: 11, height: 11, objectFit: 'contain', filter: `drop-shadow(0 0 3px ${rm.border})` }} />)}
              {card.rarity.toUpperCase()}
            </div>
            {owned && (
              <div style={{ background: '#39ff14', borderRadius: 5, padding: '3px 7px', fontSize: 8, fontWeight: 900, color: '#000' }}>OWNED</div>
            )}
          </div>

          {/* Name overlay */}
          <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', textShadow: `0 0 14px ${rm.glow}`, lineHeight: 1.2 }}>
              {card.name}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: rm.text }}>{cm?.icon} {card.class.toUpperCase()}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>·</span>
              <span style={{ fontSize: 9, color: tm.color }}>{tm.icon} {card.type.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 14px 18px' }}>

          {/* ── Tier selector ─────────────────────── */}
          <div style={{
            background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '10px 12px',
            marginBottom: 12, border: `1px solid ${rm.border}30`,
          }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 }}>— CARD TIER —</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4].map(t => (
                <button
                  key={t}
                  onClick={() => setViewTier(t)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    border: viewTier === t ? `2px solid ${rm.border}` : '2px solid rgba(255,255,255,0.1)',
                    background: viewTier === t ? `${rm.border}20` : 'rgba(255,255,255,0.03)',
                    color: viewTier === t ? rm.text : 'rgba(255,255,255,0.4)',
                    fontSize: 11, fontWeight: 900, fontFamily: "'LEMON MILK', sans-serif",
                    boxShadow: viewTier === t ? `0 0 12px ${rm.glow}` : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {TIER_LABELS[t - 1]}
                  {t === 4 && <div style={{ fontSize: 7, color: '#fbbf24', marginTop: 2 }}>MAX</div>}
                </button>
              ))}
            </div>

            {/* Tier stats */}
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {[
                { icon: '⚡', val: tierStats.cost,   label: 'COST', bg: '#4c1d95', c: '#c084fc' },
                { icon: '⚔️', val: tierStats.attack, label: 'ATK',  bg: '#7f1d1d', c: '#fca5a5' },
                { icon: '❤️', val: tierStats.health, label: 'HP',   bg: '#14532d', c: '#4ade80' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 7, padding: '6px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, lineHeight: 1 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: s.c, lineHeight: 1, marginTop: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {viewTier > 1 && (
              <div style={{ marginTop: 8, fontSize: 9, color: '#fbbf24', textAlign: 'center', letterSpacing: 0.5 }}>
                {viewTier === 2 && '▲ +10% ATK & HP · Unlocks 2nd ability'}
                {viewTier === 3 && '▲ +22% ATK & HP · Unlocks 3rd ability'}
                {viewTier === 4 && '▲ +35% ATK & HP · All abilities · −1 cost · MAX POWER'}
              </div>
            )}
          </div>

          {/* ── Skill Tree ────────────────────────── */}
          <SkillTree card={card} rm={rm} />

          {/* ── Abilities at this tier ─────────────── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 6 }}>
              — ABILITIES (TIER {TIER_LABELS[viewTier - 1]}) —
            </div>
            {card.abilities && card.abilities.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {card.abilities.map((ab, i) => {
                    const unlocked = i < tierAbilities.length;
                    return (
                      <span key={i} style={{
                        background: unlocked ? `${rm.badge}88` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${unlocked ? rm.border + '80' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 5, padding: '4px 8px',
                        fontSize: 9, color: unlocked ? rm.text : 'rgba(255,255,255,0.25)',
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                        opacity: unlocked ? 1 : 0.5,
                      }}>
                        {unlocked ? '◈' : '🔒'} {ab}
                        {!unlocked && (
                          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>
                            T{i + 1}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                {card.abilityDesc && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    {card.abilityDesc}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>No active abilities</div>
            )}
          </div>

          {/* ── Lore ─────────────────────────────── */}
          <div style={{
            background: 'rgba(0,0,0,0.45)', borderRadius: 8,
            borderLeft: `3px solid ${rm.border}`,
            padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 4 }}>LORE</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontStyle: 'italic' }}>{lore}</div>
          </div>

          {/* ── Description ──────────────────────── */}
          <div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 4 }}>ABOUT</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{card.description}</div>
          </div>

          {/* ── NFT Trait Bonus ───────────────────── */}
          {card.nftTraitBonus && (
            <div style={{
              marginTop: 10, background: 'rgba(57,255,20,0.06)',
              border: '1px solid rgba(57,255,20,0.2)', borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 7, color: '#39ff14', letterSpacing: 1, marginBottom: 4 }}>🌿 GROWERZ TRAIT BONUS</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                <span style={{ color: '#39ff14' }}>{card.nftTraitBonus.traitType}: {card.nftTraitBonus.traitValue}</span>
                {' — '}{card.nftTraitBonus.bonusEffect}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared filter pill style helper ──────────────────
function filterPill(active: boolean, color: string, small = false): React.CSSProperties {
  return {
    padding: small ? '3px 7px' : '5px 9px',
    borderRadius: 20, fontSize: small ? 8 : 9, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'LEMON MILK', sans-serif",
    border: active ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.1)',
    background: active ? `${color}18` : 'rgba(0,0,0,0.4)',
    color: active ? color : 'rgba(255,255,255,0.4)',
    boxShadow: active ? `0 0 10px ${color}44` : 'none',
    transition: 'all 0.12s',
    whiteSpace: 'nowrap' as const,
    letterSpacing: 0.5,
    flexShrink: 0,
  };
}
