/**
 * Game-ready card face — same CraftPix / Duelyst TCG chrome as
 * duelyst.grudge-studio.com (LAYOUT.json thc gold / weed frames).
 * Art breathes in the window. Cost/ATK/HP sit on the crystal slots.
 */
import { useEffect, useState } from 'react';
import type { ClassificationCard } from '../../../shared/classificationCardDatabase';

const CHROME = 'https://duelyst.grudge-studio.com/tcg-chrome';

const GOLD = {
  frame: `${CHROME}/frames/thc-epic-gold.png`,
  art: { x: 15, y: 42, w: 166, h: 156 },
  name: { x: 33, y: 8, w: 128, h: 29 },
  text: { x: 24, y: 200, w: 147, h: 32 },
  cost: { cx: 98, cy: 259, r: 12 },
  attack: { cx: 28, cy: 253, r: 20 },
  health: { cx: 168, cy: 253, r: 20 },
};

const WEED = {
  frame: `${CHROME}/frames/thc-legendary-weed.png`,
  art: { x: 17, y: 50, w: 161, h: 147 },
  name: { x: 26, y: 11, w: 144, h: 29 },
  text: { x: 24, y: 199, w: 147, h: 32 },
  cost: { cx: 100, cy: 259, r: 12 },
  attack: { cx: 31, cy: 254, r: 21 },
  health: { cx: 169, cy: 254, r: 21 },
};

const W = 195;
const H = 284;

const STYLE_ICON: Record<string, string> = {
  melee: `${CHROME}/slots/attack.png`,
  ranged: `${CHROME}/slots/mana.png`,
  splash: `${CHROME}/slots/ability.png`,
  flying: `${CHROME}/slots/rarity.png`,
  tank: `${CHROME}/slots/type.png`,
  charge: `${CHROME}/slots/health.png`,
};

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
  const ability = (card.abilities && card.abilities[0]) || card.type;
  const setLabel = (card.cardSet || 'badbudz').toUpperCase();

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
          src={card.image}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center 20%',
            imageRendering: 'pixelated',
            animation: 'duelystBreathe 2.4s ease-in-out infinite',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
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
        {setLabel} · {ability}
      </div>

      <img
        src={STYLE_ICON[style] || STYLE_ICON.melee}
        alt={style}
        title={style}
        style={{
          position: 'absolute',
          left: '6%', top: '57%',
          width: '9%', height: 'auto',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 4px #f5d76e)',
        }}
      />

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
