/**
 * Game-ready card face — same CraftPix / Duelyst TCG chrome as
 * duelyst.grudge-studio.com (LAYOUT.json thc gold / weed frames).
 * Art breathes in the window. Cost/ATK/HP sit on the crystal slots.
 * Ability ribbon = Codex playStyles (slots/*.png). Named abilities use tcg-chrome/objects icons.
 */
import { useEffect, useRef, useState } from 'react';
import type { ClassificationCard } from '../../../shared/classificationCardDatabase';
import { PLAY_STYLE_SLOTS } from '../../../shared/mapCodexPlaySets';

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
        <CodexIdleArt card={card} />
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

      {(card.abilityIcons || []).slice(0, 3).length > 0 && (
        <div style={{
          position: 'absolute',
          right: '6%', top: '42%',
          display: 'flex', flexDirection: 'column', gap: 2,
          pointerEvents: 'none',
        }}>
          {(card.abilityIcons || []).slice(0, 3).map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={card.abilities[i] || 'ability'}
              title={card.abilities[i]}
              style={{ width: 16, height: 16, imageRendering: 'pixelated' }}
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

function parsePlistFrames(xml: string): Array<{ name: string; x: number; y: number; w: number; h: number }> {
  const out: Array<{ name: string; x: number; y: number; w: number; h: number }> = [];
  const re = /<key>([^<]+)<\/key>\s*<dict>\s*<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out.push({ name: m[1], x: +m[2], y: +m[3], w: +m[4], h: +m[5] });
  }
  return out;
}

function pickIdleFrame(frames: Array<{ name: string; x: number; y: number; w: number; h: number }>) {
  const idle = frames.find((f) => /breathing|idle/i.test(f.name)) || frames[0];
  return idle;
}

function CodexIdleArt({ card }: { card: ClassificationCard }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let dead = false;
    setFallback(false);
    const kind = card.artKind;
    const run = async () => {
      try {
        if (kind === 'duelyst-plist' && card.sheet && card.plist) {
          const [xml, blob] = await Promise.all([
            fetch(card.plist).then((r) => { if (!r.ok) throw new Error('plist'); return r.text(); }),
            fetch(card.sheet).then((r) => { if (!r.ok) throw new Error('sheet'); return r.blob(); }),
          ]);
          const frames = parsePlistFrames(xml);
          const fr = pickIdleFrame(frames);
          if (!fr) throw new Error('no frame');
          const bmp = await createImageBitmap(blob);
          if (dead) return;
          const c = canvasRef.current;
          if (!c) return;
          c.width = fr.w;
          c.height = fr.h;
          const ctx = c.getContext('2d');
          if (!ctx) return;
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, fr.w, fr.h);
          ctx.drawImage(bmp, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
          return;
        }
        if (kind === 'gw-strip' && (card.idleStrip || card.image)) {
          const src = card.idleStrip || card.image;
          const blob = await fetch(src).then((r) => { if (!r.ok) throw new Error('strip'); return r.blob(); });
          const bmp = await createImageBitmap(blob);
          const cell = Math.min(bmp.width, bmp.height);
          if (dead) return;
          const c = canvasRef.current;
          if (!c) return;
          c.width = cell;
          c.height = cell;
          const ctx = c.getContext('2d');
          if (!ctx) return;
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, cell, cell);
          ctx.drawImage(bmp, 0, 0, cell, cell, 0, 0, cell, cell);
          return;
        }
        throw new Error('portrait');
      } catch {
        if (!dead) setFallback(true);
      }
    };
    void run();
    return () => { dead = true; };
  }, [card.id, card.artKind, card.sheet, card.plist, card.idleStrip, card.image]);

  if (fallback) {
    return (
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
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        imageRendering: 'pixelated',
        animation: 'duelystBreathe 2.4s ease-in-out infinite',
      }}
    />
  );
}
