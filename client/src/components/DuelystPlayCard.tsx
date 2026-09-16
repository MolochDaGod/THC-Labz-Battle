/**
 * Game-ready card face — Codex LAYOUT.json (195×284).
 * Per-rarity THC chrome + panning buds, packed idle sprite (not the full atlas).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClassificationCard } from '../../../shared/classificationCardDatabase';
import { PLAY_STYLE_SLOTS } from '../../../shared/mapCodexPlaySets';
import { CODEX_BADBUDZ_CARDS, CODEX_GRUDAWARS_CARDS } from '../../../shared/codexPlaySets.generated';
import IDLE_FRAMES from '../../../shared/duelystIdleFrames.json';
import { loadBadBudzCatalog, loadCodexRegistry, loadPlistAnims, loadSheet, type PlistFrame } from '../lib/duelystPlist';

const CHROME = 'https://duelyst.grudge-studio.com/tcg-chrome';
const FONT = 'Cambria, Constantia, Palatino Linotype, Palatino, Georgia, serif';

const CARD_W = 195;
const CARD_H = 284;

/** LAYOUT.json thc.frames — gold vs weed. Cost is the BOTTOM center circle. */
const THC = {
  gold: {
    art: { x: 15, y: 42, w: 166, h: 156 },
    name: { x: 33, y: 8, w: 128, h: 29, size: 13 },
    text: { x: 24, y: 200, w: 147, h: 32 },
    scrim: { x: 26, y: 201, w: 143, h: 30 },
    cost: { cx: 98, cy: 259, r: 12, size: 16 },
    attack: { cx: 28, cy: 253, r: 20, size: 18 },
    health: { cx: 168, cy: 253, r: 20, size: 18 },
  },
  weed: {
    art: { x: 17, y: 50, w: 161, h: 147 },
    name: { x: 26, y: 11, w: 144, h: 29, size: 13 },
    text: { x: 24, y: 199, w: 147, h: 32 },
    scrim: { x: 26, y: 200, w: 143, h: 30 },
    cost: { cx: 100, cy: 259, r: 12, size: 16 },
    attack: { cx: 31, cy: 254, r: 21, size: 18 },
    health: { cx: 169, cy: 254, r: 21, size: 18 },
  },
};

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

function pct(n: number, total: number) {
  return `${(n / total) * 100}%`;
}

function box(b: { x: number; y: number; w: number; h: number }) {
  return {
    position: 'absolute' as const,
    left: pct(b.x, CARD_W),
    top: pct(b.y, CARD_H),
    width: pct(b.w, CARD_W),
    height: pct(b.h, CARD_H),
  };
}

function slot(cx: number, cy: number, r: number) {
  return {
    position: 'absolute' as const,
    left: pct(cx - r, CARD_W),
    top: pct(cy - r, CARD_H),
    width: pct(r * 2, CARD_W),
    height: pct(r * 2, CARD_H),
  };
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
  const weed = rk === 'legendary' || rk === 'mythic' || rk === 'glitch';
  const skin = weed ? THC.weed : THC.gold;
  const glitch = Boolean(card.glitchCost || rk === 'glitch');
  const [face, setFace] = useState({
    cost: card.cost,
    attack: card.attack,
    health: card.health,
    abilities: (card.abilities || []).filter(Boolean),
    playStyles: card.playStyles || [],
  });
  const [costDigit, setCostDigit] = useState(card.cost);
  useEffect(() => {
    if (!glitch) { setCostDigit(face.cost); return; }
    const id = window.setInterval(() => {
      setCostDigit(Math.random() < 0.45 ? face.cost : Math.max(0, face.cost + (Math.random() < 0.5 ? 1 : -1)));
    }, 160);
    return () => window.clearInterval(id);
  }, [glitch, face.cost]);

  const style = playKey(card);
  const collector = badBudzNumber(card);
  const [uuid, setUuid] = useState('');
  useEffect(() => {
    const slug = card.duelystId || String(card.id || '').replace(/^badbudz:/, '').replace(/^grudawars:/, '');
    const isBad = (card.cardSet || 'badbudz') === 'badbudz' || String(card.id).startsWith('badbudz:');
    Promise.all([loadCodexRegistry(), isBad ? loadBadBudzCatalog() : Promise.resolve(null)]).then(([reg, bb]) => {
      const uuidRow = reg.get(`duelyst:${slug}`) || reg.get(`grudawars:${slug}`) || reg.get(slug) || reg.get(card.id);
      if (uuidRow?.uuid) setUuid(uuidRow.uuid);
      const bbRow = bb?.get(slug) || bb?.get(card.id) || bb?.get(`badbudz:${slug}`);
      if (bbRow) {
        setFace({
          cost: Number(bbRow.cost ?? card.cost),
          attack: Number(bbRow.attack ?? card.attack),
          health: Number(bbRow.health ?? card.health),
          abilities: bbRow.abilityNames?.length ? bbRow.abilityNames : (card.abilities || []),
          playStyles: bbRow.playStyles?.length ? bbRow.playStyles : (card.playStyles || []),
        });
      }
    });
  }, [card.id, card.duelystId, card.cardSet, card.cost, card.attack, card.health, card.abilities, card.playStyles]);
  const plate = card.chromeBg || RARITY_BG[rk] || RARITY_BG.common;
  const buds = card.chromeBuds || RARITY_BUDS[rk];
  const frame = FRAME[rk] || FRAME.common;
  const artBox = skin.art;
  const nameSize = card.name.length > 26 ? 8 : card.name.length > 22 ? 9 : card.name.length > 16 ? 11 : skin.name.size;
  const ownedStyles = useMemo(() => {
    const keys = new Set(
      (face.playStyles.length ? face.playStyles : card.playStyles || [])
        .filter((p) => p.on)
        .map((p) => p.key)
        .concat((card.keywords || []).map((k) => String(k).toLowerCase())),
    );
    const fromSlots = PLAY_STYLE_SLOTS.filter((s) => keys.has(s.key));
    if (fromSlots.length) return fromSlots.slice(0, 4);
    const listed = face.playStyles.length ? face.playStyles : (card.playStyles || []);
    if (listed.length) return [];
    const fallback = PLAY_STYLE_SLOTS.find((s) => s.key === style);
    return fallback ? [fallback] : [];
  }, [face.playStyles, card.playStyles, card.keywords, style]);

  const STYLE_OR_KW = new Set(['melee', 'ranged', 'splash', 'flying', 'tank', 'charge', 'swarm', 'seed', 'spell']);
  const body = face.abilities.filter((a) => a && !STYLE_OR_KW.has(a.toLowerCase())).join(' · ');
  const flavor = (card.abilityDesc || card.description || '').split('.')[0];
  const styleIcon = 18;
  const styleOriginX = artBox.x + 2 + styleIcon / 2;
  const styleOriginY = artBox.y + 12 + styleIcon / 2;
  const styleStep = styleIcon + 3;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${card.name} · ${face.cost}/${face.attack}/${face.health}${uuid ? ` · ${uuid}` : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${CARD_W} / ${CARD_H}`,
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
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          transform: 'translateY(-8%) scale(1.22)',
          transformOrigin: 'center bottom',
        }}>
          <CardUnitArt card={card} />
        </div>
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
        ...box(skin.name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT,
        fontSize: nameSize,
        fontWeight: 700,
        color: '#fff8dc',
        letterSpacing: 0.2,
        textShadow: '0 0 1px #120c04, 1px 0 0 #120c04, -1px 0 0 #120c04, 0 1px 0 #120c04, 0 -1px 0 #120c04, 0 1px 2px #000',
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        pointerEvents: 'none', zIndex: 3, padding: '0 4px',
      }}>
        {card.name}
      </div>

      {ownedStyles.map((ps, i) => (
        <StyleCircle
          key={ps.key}
          label={ps.label}
          badge={ps.badge}
          icon={ps.icon}
          cx={styleOriginX}
          cy={styleOriginY + i * styleStep}
          r={styleIcon / 2}
        />
      ))}

      <div style={{
        ...box(skin.scrim),
        background: 'rgba(6, 10, 6, 0.36)',
        borderRadius: 10,
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      <div style={{
        ...box(skin.text),
        fontFamily: FONT,
        color: '#fff8dc',
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
        {body ? <div style={{ fontSize: 9, lineHeight: 1.15, fontWeight: 700 }}>{body}</div> : null}
        {flavor && (
          <div style={{ fontSize: 8, lineHeight: 1.2, opacity: 0.85, marginTop: body ? 2 : 0 }}>{flavor}.</div>
        )}
        <div style={{ fontSize: 6, letterSpacing: 0.3, opacity: 0.75, marginTop: 'auto' }}>
          {card.cardSet === 'grudawars' ? `GrudaWars #${collector || '—'}` : `BadBudz #${collector || '—'}`}
        </div>
      </div>

      <Gem cx={skin.cost.cx} cy={skin.cost.cy} r={skin.cost.r} size={skin.cost.size} kind="mana" value={glitch ? costDigit : face.cost} hot={glitch} />
      {face.attack > 0 && <Gem cx={skin.attack.cx} cy={skin.attack.cy} r={skin.attack.r} size={skin.attack.size} kind="attack" value={face.attack} />}
      {face.health > 0 && <Gem cx={skin.health.cx} cy={skin.health.cy} r={skin.health.r} size={skin.health.size} kind="health" value={face.health} />}
    </button>
  );
}

function StyleCircle({
  label, badge, icon, cx, cy, r,
}: {
  label: string; badge: string; icon: string; cx: number; cy: number; r: number;
}) {
  return (
    <div title={label} style={{ ...slot(cx, cy, r + 1.2), pointerEvents: 'none', zIndex: 3 }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'rgba(46, 28, 8, 0.94)',
        border: '1.6px solid #f0c645',
        boxShadow: '0 0 6px rgba(255, 206, 84, 0.75)',
      }} />
      <img
        src={badge}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: '-8%', width: '116%', height: '116%', imageRendering: 'pixelated' }}
      />
      <img
        src={icon}
        alt={label}
        draggable={false}
        style={{ position: 'absolute', inset: '14%', width: '72%', height: '72%', imageRendering: 'pixelated' }}
      />
    </div>
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

function DuelystBreathe({ sheet, plist, fallback }: { sheet: string; plist: string; fallback?: IdleFrame }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dead = false;
    let raf = 0;
    (async () => {
      const [img, anims] = await Promise.all([loadSheet(sheet), loadPlistAnims(plist)]);
      if (dead) return;
      const frames: PlistFrame[] = anims.breathing?.length ? anims.breathing : (anims.idle || []);
      const canvas = ref.current;
      if (!canvas || !frames.length) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      let i = 0;
      let last = 0;
      const tick = (t: number) => {
        if (dead) return;
        if (t - last >= 83) {
          last = t;
          const fr = frames[i % frames.length];
          if (canvas.width !== fr.w) canvas.width = fr.w;
          if (canvas.height !== fr.h) canvas.height = fr.h;
          ctx.clearRect(0, 0, fr.w, fr.h);
          ctx.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, fr.w, fr.h);
          i += 1;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })().catch(async () => {
      if (!fallback || !ref.current) return;
      try {
        const img = await loadSheet(sheet);
        const canvas = ref.current;
        if (!canvas) return;
        canvas.width = fallback.w;
        canvas.height = fallback.h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, fallback.x, fallback.y, fallback.w, fallback.h, 0, 0, fallback.w, fallback.h);
      } catch { /* leave blank */ }
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [sheet, plist, fallback]);
  return (
    <canvas
      ref={ref}
      title="plist breathe"
      style={{
        width: '92%',
        height: 'auto',
        maxHeight: '100%',
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
  const isGw = card.cardSet === 'grudawars' || String(card.id).startsWith('grudawars:');
  if (isGw) {
    const gw = CODEX_GRUDAWARS_CARDS.find((c) => c.id === card.id) || card;
    const src = gw.idleStrip || gw.image || card.idleStrip || card.image;
    if (src && !String(src).startsWith('CARD-')) return <GwIdleSprite src={src} />;
  }
  const duelystId = card.duelystId || String(card.id || '').replace(/^badbudz:/, '').replace(/^grudawars:/, '');
  if (String(duelystId).startsWith('CARD-')) return card.image && !card.image.startsWith('CARD-') ? <Portrait src={card.image} /> : null;
  const fr = card.idleFrame || FRAMES[duelystId];
  const sheet = card.sheet || (fr ? `https://assets.grudge-studio.com/sprites/duelyst/units/${duelystId}.png` : '');
  const kind = card.artKind || (card.idleStrip ? 'gw-strip' : fr ? 'duelyst-plist' : 'portrait');

  const plist = card.plist || (duelystId
    ? `https://assets.grudge-studio.com/sprites/duelyst/plists/${duelystId}.plist`
    : '');
  if (kind === 'gw-strip' && (card.idleStrip || card.image) && !String(card.idleStrip || card.image).startsWith('CARD-')) {
    return <GwIdleSprite src={card.idleStrip || card.image} />;
  }
  if (kind === 'duelyst-plist' || (sheet && plist)) {
    return <DuelystBreathe sheet={sheet || card.image} plist={plist} fallback={fr} />;
  }
  if (card.image && !String(card.image).startsWith('CARD-')) {
    return <Portrait src={card.image} />;
  }
  return null;
}
