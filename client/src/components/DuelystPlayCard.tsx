/**
 * Game-ready card face — same CraftPix / Duelyst TCG chrome as
 * duelyst.grudge-studio.com (LAYOUT.json thc gold / weed frames).
 * Art breathes in the window. Cost/ATK/HP sit on the crystal slots.
 * Ability ribbon = Codex playStyles (slots/*.png). Named abilities use tcg-chrome/objects icons.
 */
import { useEffect, useState } from 'react';
import type { ClassificationCard } from '../../../shared/classificationCardDatabase';
import { defaultBackgroundForRarity } from '../../../shared/classificationCardDatabase';
import { PLAY_STYLE_SLOTS, abilityIconFor } from '../../../shared/mapCodexPlaySets';
import { CODEX_BADBUDZ_CARDS, CODEX_GRUDAWARS_CARDS } from '../../../shared/codexPlaySets.generated';
import IDLE_FRAMES from '../../../shared/duelystIdleFrames.json';

const CHROME = 'https://duelyst.grudge-studio.com/tcg-chrome';

/** LAYOUT.json — cost is top-right inside the card viewport. */
const GOLD = {
  frame: `${CHROME}/frames/thc-epic-gold.png`,
  art: { x: 31, y: 48, w: 132, h: 112 },
  name: { x: 10, y: 6, w: 148, h: 24 },
  text: { x: 18, y: 196, w: 159, h: 56 },
  cost: { cx: 176, cy: 18, r: 15 },
  attack: { cx: 26, cy: 268, r: 16 },
  health: { cx: 170, cy: 268, r: 16 },
};

const WEED = {
  frame: `${CHROME}/frames/thc-legendary-weed.png`,
  art: { x: 31, y: 48, w: 132, h: 112 },
  name: { x: 10, y: 6, w: 148, h: 24 },
  text: { x: 18, y: 196, w: 159, h: 56 },
  cost: { cx: 176, cy: 18, r: 15 },
  attack: { cx: 26, cy: 268, r: 16 },
  health: { cx: 170, cy: 268, r: 16 },
};

const BB_NO = new Map(CODEX_BADBUDZ_CARDS.map((c, i) => [c.id, i + 1]));
const GW_NO = new Map(CODEX_GRUDAWARS_CARDS.map((c, i) => [c.id, i + 1]));

function badBudzNumber(card: ClassificationCard): number {
  return GW_NO.get(card.id) || BB_NO.get(card.id) || 0;
}

function resolveAbilities(card: ClassificationCard): { names: string[]; icons: string[] } {
  const want = card.cost <= 2 ? 1 : card.cost <= 4 ? 2 : 3;
  const fromCard = (card.abilities || []).filter(Boolean);
  const fromStyles = (card.playStyles || [])
    .filter((p) => p.on)
    .map((p) => PLAY_STYLE_SLOTS.find((s) => s.key === p.key)?.label || p.key);
  const names = [...fromCard, ...fromStyles].filter((n, i, a) => n && a.indexOf(n) === i).slice(0, want);
  if (!names.length) names.push(card.class);
  const icons = names.map((n, i) => card.abilityIcons?.[i] || abilityIconFor(n, i, card.class));
  return { names, icons };
}

const W = 195;
const H = 284;

function pct(n: number, total: number) {
  return `${(n / total) * 100}%`;
}

function skinFor(rarity: string) {
  const r = String(rarity || '').toLowerCase();
  return r === 'legendary' || r === 'mythic' || r === 'glitch' ? WEED : GOLD;
}

function playKey(card: ClassificationCard): string {
  const blob = `${card.class} ${(card.abilities || []).join(' ')} ${card.abilityDesc || ''}`.toLowerCase();
  if (blob.includes('air') || blob.includes('fly')) return 'flying';
  if (blob.includes('rush') || blob.includes('charge')) return 'charge';
  if (blob.includes('splash') || blob.includes('aoe') || card.class === 'magical') return 'splash';
  if (card.class === 'tank') return 'tank';
  if (card.class === 'ranged') return 'ranged';
  return 'melee';
}

function slot(cx: number, cy: number, r: number) {
  return {
    position: 'absolute' as const,
    left: pct(cx - r, W),
    top: pct(cy - r, H),
    width: pct(r * 2, W),
    height: pct(r * 2, H),
  };
}

export default function DuelystPlayCard({
  card,
  owned,
  onClick,
}: {
  card: ClassificationCard;
  owned: boolean;
  onClick: () => void;
}) {
  const skin = skinFor(card.rarity);
  const glitch = Boolean(card.glitchCost || card.rarity === 'glitch');
  const [costDigit, setCostDigit] = useState(card.cost);
  useEffect(() => {
    if (!glitch) { setCostDigit(card.cost); return; }
    const id = window.setInterval(() => {
      setCostDigit(Math.random() < 0.45 ? card.cost : Math.max(0, card.cost + (Math.random() < 0.5 ? 1 : -1)));
    }, 160);
    return () => window.clearInterval(id);
  }, [glitch, card.cost]);

  const style = playKey(card);
  const { names: abilityNames, icons: abilityIcons } = resolveAbilities(card);
  const collector = badBudzNumber(card);
  const plate = card.chromeBg || defaultBackgroundForRarity(card.rarity).src;
  const onKeys = new Set(
    (card.playStyles || []).filter((p) => p.on).map((p) => p.key).concat(card.keywords || []),
  );
  if (!onKeys.size) onKeys.add(style);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${card.name} · ${card.cost}/${card.attack}/${card.health}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${W} / ${H}`,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        filter: owned ? 'none' : 'saturate(0.55) brightness(0.72)',
        minHeight: 44,
      }}
    >
      <style>{`
        @keyframes duelystBreathe {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3%) scale(1.045); }
        }
        @keyframes duelystShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        left: pct(skin.art.x, W),
        top: pct(skin.art.y, H),
        width: pct(skin.art.w, W),
        height: pct(skin.art.h, H),
        overflow: 'hidden',
        background: '#07050c',
      }}>
        <img
          src={plate}
          alt=""
          draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', pointerEvents: 'none',
            filter: 'brightness(1.22) saturate(1.12) contrast(1.06)',
          }}
        />
        <CardUnitArt card={card} />
      </div>

      <img
        src={skin.frame}
        alt=""
        draggable={false}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', imageRendering: 'pixelated',
        }}
      />

      <div style={{
        position: 'absolute',
        left: pct(skin.name.x, W),
        top: pct(skin.name.y, H),
        width: pct(skin.name.w, W),
        height: pct(skin.name.h, H),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cambria, Palatino Linotype, Palatino, Georgia, serif',
        fontSize: 11, fontWeight: 700, color: '#1a1630',
        textShadow: '0 0 3px #f4e7b0',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        pointerEvents: 'none',
      }}>
        {card.name}
      </div>

      <div style={{
        position: 'absolute',
        left: pct(skin.text.x, W),
        top: pct(skin.text.y, H),
        width: pct(skin.text.w, W),
        height: pct(skin.text.h, H),
        fontFamily: 'Cambria, Palatino Linotype, Palatino, Georgia, serif',
        fontSize: 8, lineHeight: 1.2, color: '#f4e7b0',
        textAlign: 'center', overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        Bad Budz #{collector || '—'}
      </div>

      <div style={{
        position: 'absolute',
        left: '8%', top: '56%',
        width: '84%', height: '8%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {PLAY_STYLE_SLOTS.map((slot) => {
          const on = onKeys.has(slot.key);
          return (
            <img
              key={slot.key}
              src={slot.icon}
              alt={slot.label}
              title={slot.label}
              style={{
                width: '14%', height: 'auto',
                imageRendering: 'pixelated',
                opacity: on ? 1 : 0.28,
                filter: on ? 'drop-shadow(0 0 4px #f5d76e)' : 'grayscale(0.8)',
              }}
            />
          );
        })}
      </div>

      {abilityIcons.length > 0 && (
        <div style={{
          position: 'absolute',
          left: pct(skin.art.x + skin.art.w - 20, W),
          top: pct(skin.art.y + 4, H),
          display: 'flex', flexDirection: 'column', gap: 2,
          pointerEvents: 'none',
        }}>
          {abilityIcons.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={abilityNames[i] || 'ability'}
              title={abilityNames[i]}
              style={{ width: 16, height: 16, imageRendering: 'pixelated', filter: 'brightness(1.15)' }}
            />
          ))}
        </div>
      )}

      <Gem cx={skin.cost.cx} cy={skin.cost.cy} r={skin.cost.r} kind="mana" value={glitch ? costDigit : card.cost} hot={glitch} />
      {card.attack > 0 && <Gem cx={skin.attack.cx} cy={skin.attack.cy} r={skin.attack.r} kind="attack" value={card.attack} />}
      {card.health > 0 && <Gem cx={skin.health.cx} cy={skin.health.cy} r={skin.health.r} kind="health" value={card.health} />}
    </button>
  );
}

function Gem({
  cx, cy, r, kind, value, hot,
}: {
  cx: number; cy: number; r: number; kind: 'mana' | 'attack' | 'health'; value: number; hot?: boolean;
}) {
  const src = `${CHROME}/slots/crystal-${kind}.png`;
  return (
    <div style={{ ...slot(cx, cy, r), pointerEvents: 'none' }}>
      <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }} />
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cambria, Palatino Linotype, Georgia, serif',
        fontWeight: 900, fontSize: r > 16 ? 13 : 11,
        color: hot ? '#f9a8d4' : '#fff',
        textShadow: '0 1px 2px #000, 0 0 6px #000',
      }}>
        {value}
      </span>
    </div>
  );
}

type IdleFrame = { x: number; y: number; w: number; h: number; sheetW: number; sheetH: number };

const FRAMES = IDLE_FRAMES as Record<string, IdleFrame>;

/** Duelyst Magmar / BadBudz idle cell — CSS sprite, never the full atlas. */
function PackedIdleSprite({ sheet, fr }: { sheet: string; fr: IdleFrame }) {
  const sizeX = (fr.sheetW / fr.w) * 100;
  const sizeY = (fr.sheetH / fr.h) * 100;
  const posX = fr.sheetW === fr.w ? 0 : (fr.x / (fr.sheetW - fr.w)) * 100;
  const posY = fr.sheetH === fr.h ? 0 : (fr.y / (fr.sheetH - fr.h)) * 100;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${sheet})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${sizeX}% ${sizeY}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        imageRendering: 'pixelated',
        filter: 'brightness(1.18) contrast(1.06) saturate(1.1)',
        animation: 'duelystBreathe 2.4s ease-in-out infinite',
      }}
    />
  );
}

/** CraftPix / Codex horizontal idle strip — play cells, do not show the whole sheet. */
function GwIdleSprite({ src }: { src: string }) {
  const [frames, setFrames] = useState(1);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (frames <= 1) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 140);
    return () => window.clearInterval(id);
  }, [frames]);
  const frame = frames <= 1 ? 0 : tick % frames;
  const pos = frames <= 1 ? '50% 100%' : `${(frame / Math.max(frames - 1, 1)) * 100}% 0%`;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: frames > 1 ? `${frames * 100}% 100%` : 'contain',
        backgroundPosition: pos,
        imageRendering: 'pixelated',
        filter: 'brightness(1.2) contrast(1.08) saturate(1.14)',
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const im = e.currentTarget;
          const h = im.naturalHeight;
          const w = im.naturalWidth;
          if (h > 8 && w > h * 1.35) setFrames(Math.max(1, Math.floor(w / h)));
        }}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}

export function CardUnitArt({ card }: { card: ClassificationCard }) {
  const duelystId = card.duelystId || String(card.id || '').replace(/^badbudz:/, '');
  const fr = card.idleFrame || FRAMES[duelystId];
  const sheet = card.sheet || (fr ? `https://assets.grudge-studio.com/sprites/duelyst/units/${duelystId}.png` : '');
  const kind = card.artKind || (card.idleStrip ? 'gw-strip' : fr ? 'duelyst-plist' : 'portrait');

  if (kind === 'gw-strip' && (card.idleStrip || card.image)) {
    return <GwIdleSprite src={card.idleStrip || card.image} />;
  }
  if (fr && sheet) {
    return <PackedIdleSprite sheet={sheet} fr={fr} />;
  }
  return null;
}
