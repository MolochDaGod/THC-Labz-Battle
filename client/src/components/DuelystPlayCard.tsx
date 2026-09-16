/**
 * Game-ready card face — Codex LAYOUT.json (195×284).
 * Per-rarity THC chrome + panning buds, packed idle sprite (not the full atlas).
 */
import { useEffect, useMemo, useState } from 'react';
import type { ClassificationCard } from '../../../shared/classificationCardDatabase';
import { PLAY_STYLE_SLOTS, abilityIconFor } from '../../../shared/mapCodexPlaySets';
import { CODEX_BADBUDZ_CARDS, CODEX_GRUDAWARS_CARDS } from '../../../shared/codexPlaySets.generated';
import IDLE_FRAMES from '../../../shared/duelystIdleFrames.json';

const CHROME = 'https://duelyst.grudge-studio.com/tcg-chrome';
const FONT = 'Cambria, Constantia, Palatino Linotype, Palatino, Georgia, serif';

const L = {
  w: 195,
  h: 284,
  name: { x: 10, y: 6, w: 148, h: 24, size: 13 },
  ribbon: { x: 16, y: 164, w: 163, h: 32 },
  text: { x: 18, y: 196, w: 159, h: 56 },
  cost: { cx: 176, cy: 18, r: 15, size: 14 },
  attack: { cx: 26, cy: 268, r: 16, size: 14 },
  health: { cx: 170, cy: 268, r: 16, size: 14 },
};

/** lab/tools/thc-frame-windows.json — art hole of the THC gold/weed frames. */
const ART_GOLD = { x: 15, y: 42, w: 166, h: 156 };
const ART_WEED = { x: 17, y: 50, w: 161, h: 147 };

const FRAME: Record<string, string> = {
  common: `${CHROME}/frames/thc-epic-gold.png`,
  uncommon: `${CHROME}/frames/thc-epic-gold.png`,
  rare: `${CHROME}/frames/thc-epic-gold.png`,
  epic: `${CHROME}/frames/thc-epic-gold.png`,
  legendary: `${CHROME}/frames/thc-legendary-weed.png`,
  mythic: `${CHROME}/frames/thc-legendary-weed.png`,
  glitch: `${CHROME}/frames/thc-legendary-weed.png`,
};

const RARITY_BG: Record<string, string> = {
  common: `${CHROME}/thc/bg-common.png`,
  uncommon: `${CHROME}/thc/bg-uncommon.png`,
  rare: `${CHROME}/thc/bg-rare.png`,
  epic: `${CHROME}/thc/bg-epic.png`,
  legendary: `${CHROME}/thc/bg-legendary.png`,
  mythic: `${CHROME}/thc/bg-legendary.png`,
  glitch: `${CHROME}/thc/bg-legendary.png`,
};

const RARITY_BUDS: Record<string, string> = {
  common: `${CHROME}/thc/buds-common.png`,
  uncommon: `${CHROME}/thc/buds-uncommon.png`,
  rare: `${CHROME}/thc/buds-rare.png`,
  epic: `${CHROME}/thc/buds-epic.png`,
  legendary: `${CHROME}/thc/buds-legendary.png`,
  mythic: `${CHROME}/thc/buds-legendary.png`,
  glitch: `${CHROME}/thc/buds-legendary.png`,
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

function pct(n: number, total: number) {
  return `${(n / total) * 100}%`;
}

function rarityKey(card: ClassificationCard): string {
  return String(card.rarity || 'common').toLowerCase();
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
    left: pct(cx - r, L.w),
    top: pct(cy - r, L.h),
    width: pct(r * 2, L.w),
    height: pct(r * 2, L.h),
  };
}

function box(b: { x: number; y: number; w: number; h: number }) {
  return {
    position: 'absolute' as const,
    left: pct(b.x, L.w),
    top: pct(b.y, L.h),
    width: pct(b.w, L.w),
    height: pct(b.h, L.h),
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
  const rk = rarityKey(card);
  const glitch = Boolean(card.glitchCost || rk === 'glitch');
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
  const plate = card.chromeBg || RARITY_BG[rk] || RARITY_BG.common;
  const buds = card.chromeBuds || RARITY_BUDS[rk];
  const frame = FRAME[rk] || FRAME.common;
  const artBox = rk === 'legendary' || rk === 'mythic' || rk === 'glitch' ? ART_WEED : ART_GOLD;
  const nameSize = card.name.length > 22 ? 10 : card.name.length > 16 ? 11 : L.name.size;
  const onKeys = useMemo(() => {
    const s = new Set(
      (card.playStyles || []).filter((p) => p.on).map((p) => p.key).concat(card.keywords || []),
    );
    if (!s.size) s.add(style);
    return s;
  }, [card.playStyles, card.keywords, style]);

  const body = abilityNames.join(' · ');
  const flavor = (card.abilityDesc || card.description || '').split('.')[0];

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${card.name} · ${card.cost}/${card.attack}/${card.health}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${L.w} / ${L.h}`,
        padding: 0,
        border: 'none',
        background: '#0a0806',
        cursor: 'pointer',
        filter: owned ? 'none' : 'saturate(0.62) brightness(0.78)',
        minHeight: 44,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes duelystBreathe {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4%) scale(1.03); }
        }
        @keyframes budsPan {
          0% { background-position: 0% 40%; }
          100% { background-position: 100% 40%; }
        }
      `}</style>

      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${plate})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {buds && (
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${buds})`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            opacity: 0.28,
            mixBlendMode: 'screen',
            animation: 'budsPan 22s linear infinite',
            imageRendering: 'pixelated',
          }}
        />
      )}
      <div style={{ ...box(artBox), overflow: 'hidden', zIndex: 1 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <CardUnitArt card={card} />
        </div>
        {abilityIcons.length > 0 && (
          <div style={{
            position: 'absolute',
            right: '3%',
            top: '4%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pointerEvents: 'none',
          }}>
            {abilityIcons.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={abilityNames[i] || 'ability'}
                title={abilityNames[i]}
                style={{
                  width: 16,
                  height: 16,
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 1px 1px #000)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <img
        src={frame}
        alt=""
        draggable={false}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', imageRendering: 'pixelated', zIndex: 2,
        }}
      />

      <div style={{
        ...box(L.name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT,
        fontSize: nameSize,
        fontWeight: 700,
        color: '#1a1630',
        letterSpacing: 0.2,
        textShadow: '0 0 1px #f4e7b0, 1px 0 0 #d4b56a, -1px 0 0 #d4b56a, 0 1px 0 #d4b56a, 0 -1px 0 #d4b56a',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        pointerEvents: 'none', zIndex: 3, padding: '0 4px',
      }}>
        {card.name}
      </div>

      <div style={{
        ...box(L.ribbon),
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none', zIndex: 3, padding: '0 2%',
      }}>
        {PLAY_STYLE_SLOTS.map((ps) => {
          const on = onKeys.has(ps.key);
          return (
            <img
              key={ps.key}
              src={ps.icon}
              alt={ps.label}
              title={ps.label}
              style={{
                width: '13.5%',
                height: 'auto',
                imageRendering: 'pixelated',
                opacity: on ? 1 : 0.22,
                filter: on ? 'drop-shadow(0 0 3px #f5d76e)' : 'grayscale(1)',
              }}
            />
          );
        })}
      </div>

      <div style={{
        ...box(L.text),
        fontFamily: FONT,
        color: '#f4e7b0',
        textAlign: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '2px 3px 0',
        textShadow: '0 1px 1px #000, 0 0 2px #3a2a10',
      }}>
        <div style={{ fontSize: 9, lineHeight: 1.15, fontWeight: 700 }}>{body}</div>
        {flavor && (
          <div style={{ fontSize: 8, lineHeight: 1.2, opacity: 0.85, marginTop: 2 }}>{flavor}.</div>
        )}
        <div style={{ fontSize: 7, letterSpacing: 0.6, opacity: 0.7, marginTop: 'auto', textTransform: 'uppercase' }}>
          {card.cardSet === 'grudawars' ? 'GrudaWars' : 'BadBudz'} #{collector || '—'}
        </div>
      </div>

      <Gem cx={L.cost.cx} cy={L.cost.cy} r={L.cost.r} size={L.cost.size} kind="mana" value={glitch ? costDigit : card.cost} hot={glitch} />
      {card.attack > 0 && <Gem cx={L.attack.cx} cy={L.attack.cy} r={L.attack.r} size={L.attack.size} kind="attack" value={card.attack} />}
      {card.health > 0 && <Gem cx={L.health.cx} cy={L.health.cy} r={L.health.r} size={L.health.size} kind="health" value={card.health} />}
    </button>
  );
}

function Gem({
  cx, cy, r, size, kind, value, hot,
}: {
  cx: number; cy: number; r: number; size: number; kind: 'mana' | 'attack' | 'health'; value: number; hot?: boolean;
}) {
  const src = `${CHROME}/slots/crystal-${kind}.png`;
  return (
    <div style={{ ...slot(cx, cy, r), pointerEvents: 'none', zIndex: 4 }}>
      <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }} />
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1,
        color: hot ? '#f9a8d4' : '#fff',
        textShadow: '0 1px 2px #000, 0 0 4px #000',
      }}>
        {value}
      </span>
    </div>
  );
}

type IdleFrame = { x: number; y: number; w: number; h: number; sheetW: number; sheetH: number };

const FRAMES = IDLE_FRAMES as Record<string, IdleFrame>;

let clipsPromise: Promise<any> | null = null;
function loadDuelystClips() {
  if (!clipsPromise) {
    clipsPromise = fetch('https://duelyst.grudge-studio.com/catalog/duelyst-clips.json')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return clipsPromise;
}

function breatheCells(first: IdleFrame, frames: number, sheetW: number, sheetH: number): IdleFrame[] {
  const out: IdleFrame[] = [];
  let x = first.x;
  let y = first.y;
  for (let i = 0; i < Math.max(1, frames); i++) {
    out.push({ x, y, w: first.w, h: first.h, sheetW, sheetH });
    x += first.w;
    if (x + first.w > sheetW + 1) {
      x = 0;
      y += first.h;
      if (y + first.h > sheetH + 1) break;
    }
  }
  return out;
}

function PackedIdleSprite({ sheet, fr, duelystId }: { sheet: string; fr: IdleFrame; duelystId?: string }) {
  const [cells, setCells] = useState<IdleFrame[]>([fr]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    if (!duelystId) return;
    loadDuelystClips().then((j) => {
      if (!live || !j) return;
      const clip = (j.units || j)[duelystId]?.clips?.breathing || (j.units || j)[duelystId]?.clips?.idle;
      if (!clip || !clip.frames) return;
      const first = clip.first || fr;
      const sheetW = fr.sheetW;
      const sheetH = fr.sheetH;
      setCells(breatheCells({ ...first, sheetW, sheetH }, Number(clip.frames) || 1, sheetW, sheetH));
    });
    return () => { live = false; };
  }, [duelystId, fr, sheet]);
  useEffect(() => {
    if (cells.length <= 1) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 90);
    return () => window.clearInterval(id);
  }, [cells.length]);
  const cell = cells[tick % cells.length] || fr;
  const sizeX = (cell.sheetW / cell.w) * 100;
  const sizeY = (cell.sheetH / cell.h) * 100;
  const posX = cell.sheetW === cell.w ? 0 : (cell.x / (cell.sheetW - cell.w)) * 100;
  const posY = cell.sheetH === cell.h ? 0 : (cell.y / (cell.sheetH - cell.h)) * 100;
  return (
    <div
      style={{
        width: '92%',
        aspectRatio: '1',
        maxHeight: '100%',
        backgroundImage: `url(${sheet})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${sizeX}% ${sizeY}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        imageRendering: 'pixelated',
        filter: 'contrast(1.08) saturate(1.08)',
      }}
    />
  );
}

function GwIdleSprite({ src }: { src: string }) {
  const [frames, setFrames] = useState(1);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (frames <= 1) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 140);
    return () => window.clearInterval(id);
  }, [frames]);
  const frame = frames <= 1 ? 0 : tick % frames;
  const pos = frames <= 1 ? 'center bottom' : `${(frame / Math.max(frames - 1, 1)) * 100}% 0%`;
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
        filter: 'contrast(1.08) saturate(1.1)',
        animation: frames <= 1 ? 'duelystBreathe 2.6s ease-in-out infinite' : undefined,
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

function Portrait({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center bottom',
        imageRendering: 'pixelated',
        filter: 'contrast(1.08) saturate(1.08)',
        animation: 'duelystBreathe 2.6s ease-in-out infinite',
      }}
    />
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
    return <PackedIdleSprite sheet={sheet} fr={fr} duelystId={duelystId} />;
  }
  if (card.image) {
    return <Portrait src={card.image} />;
  }
  return null;
}
