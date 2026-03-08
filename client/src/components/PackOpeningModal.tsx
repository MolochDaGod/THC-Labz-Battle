import { useState, useEffect, useRef, useCallback } from 'react';

interface ShopCard {
  id: string; name: string; rarity: string;
  attack: number; health: number; cost: number;
  class: string; image?: string; level?: number;
  description?: string; abilities?: string[];
}

interface Props {
  cards: ShopCard[];
  packName: string;
  packColor: string;
  packArtUrl?: string | null;
  onDone: () => void;
}

const RARITY_NORM: Record<string, string> = {
  legendary: 'legendary', epic: 'epic', rare: 'rare',
  uncommon: 'uncommon', common: 'common',
  Legendary: 'legendary', Epic: 'epic', Rare: 'rare',
  Uncommon: 'uncommon', Common: 'common',
};

const RARITY_CFG: Record<string, {
  color: string; glow: string; label: string;
  flash: string; particles: number; textShadow: string;
  artBg: string; footerBg: string; orbColor: [string, string];
  abilityBg: string;
}> = {
  legendary: {
    color: '#ffd700', glow: '0 0 70px 24px #ffd700aa, 0 0 140px 40px #ffd70044',
    label: 'LEGENDARY PULL!', flash: 'rgba(255,215,0,0.45)', particles: 32,
    textShadow: '0 0 30px #ffd700, 0 0 60px #ffd700',
    artBg: '#2a1a00', footerBg: '#1a1000',
    orbColor: ['#fff9c4', '#b8860b'], abilityBg: '#1a1400',
  },
  epic: {
    color: '#c084fc', glow: '0 0 60px 18px #c084fcaa, 0 0 120px 36px #c084fc44',
    label: 'EPIC PULL!', flash: 'rgba(192,132,252,0.35)', particles: 22,
    textShadow: '0 0 30px #c084fc, 0 0 60px #c084fc',
    artBg: '#1a0a2e', footerBg: '#110820',
    orbColor: ['#e9d5ff', '#7c3aed'], abilityBg: '#12082a',
  },
  rare: {
    color: '#22c55e', glow: '0 0 50px 16px #22c55eaa, 0 0 100px 30px #22c55e44',
    label: 'RARE PULL!', flash: 'rgba(34,197,94,0.3)', particles: 14,
    textShadow: '0 0 30px #22c55e, 0 0 60px #22c55e',
    artBg: '#001a0a', footerBg: '#001208',
    orbColor: ['#bbf7d0', '#15803d'], abilityBg: '#001508',
  },
  uncommon: {
    color: '#a855f7', glow: '0 0 35px 10px #a855f777',
    label: '', flash: 'rgba(168,85,247,0.18)', particles: 6,
    textShadow: '0 0 20px #a855f7',
    artBg: '#0f0a20', footerBg: '#080514',
    orbColor: ['#ddd6fe', '#6d28d9'], abilityBg: '#0b0818',
  },
  common: {
    color: '#94a3b8', glow: '0 0 16px 4px #94a3b844',
    label: '', flash: 'rgba(148,163,184,0.1)', particles: 0,
    textShadow: 'none',
    artBg: '#0a0a12', footerBg: '#060608',
    orbColor: ['#e2e8f0', '#475569'], abilityBg: '#08080f',
  },
};

function getCfg(rarity: string) {
  return RARITY_CFG[RARITY_NORM[rarity] || 'common'] || RARITY_CFG.common;
}
function normRarity(rarity: string) {
  return RARITY_NORM[rarity] || 'common';
}

function hexRgb(hex: string): [number, number, number] {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [128, 128, 128];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function ha(hex: string, a: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function adj(hex: string, amt: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.max(0,Math.min(255,r+amt))},${Math.max(0,Math.min(255,g+amt))},${Math.max(0,Math.min(255,b+amt))})`;
}

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * drawCannabisLeaf — draws a proper 7-leaflet palmate cannabis leaf in canvas.
 * cx/cy = center base of stem. size = half-height of whole leaf.
 * color = fill color. alpha = transparency.
 */
function drawCannabisLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  color: string,
  alpha: number = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  const leaflets = [
    { angle: -Math.PI / 2,          len: size * 1.0,  wid: size * 0.20 },
    { angle: -Math.PI / 2 - 0.52,   len: size * 0.82, wid: size * 0.15 },
    { angle: -Math.PI / 2 + 0.52,   len: size * 0.82, wid: size * 0.15 },
    { angle: -Math.PI / 2 - 1.08,   len: size * 0.62, wid: size * 0.11 },
    { angle: -Math.PI / 2 + 1.08,   len: size * 0.62, wid: size * 0.11 },
    { angle: -Math.PI / 2 - 1.55,   len: size * 0.40, wid: size * 0.075 },
    { angle: -Math.PI / 2 + 1.55,   len: size * 0.40, wid: size * 0.075 },
  ];

  for (const l of leaflets) {
    const tipX = Math.cos(l.angle) * l.len;
    const tipY = Math.sin(l.angle) * l.len;
    const perpX = -Math.sin(l.angle);
    const perpY = Math.cos(l.angle);
    const segs = 8;

    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const px = tipX * t;
      const py = tipY * t;
      const envelope = Math.sin(Math.PI * t) * (1 - t * 0.25);
      const bulge = l.wid * envelope;
      const serr = (i % 2 === 0 ? l.wid * 0.12 : -l.wid * 0.08) * Math.sin(Math.PI * t) * (1 - t * 0.5);
      ctx.lineTo(px - perpX * (bulge + serr), py - perpY * (bulge + serr));
    }

    ctx.lineTo(tipX, tipY);

    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      const px = tipX * t;
      const py = tipY * t;
      const envelope = Math.sin(Math.PI * t) * (1 - t * 0.25);
      const bulge = l.wid * envelope;
      const serr = (i % 2 === 0 ? l.wid * 0.12 : -l.wid * 0.08) * Math.sin(Math.PI * t) * (1 - t * 0.5);
      ctx.lineTo(px + perpX * (bulge + serr), py + perpY * (bulge + serr));
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = Math.max(0.5, size * 0.012);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(0.4, size * 0.008);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX * 0.88, tipY * 0.88);
    ctx.stroke();
  }

  const stemColor = adj(color, -30);
  ctx.strokeStyle = stemColor;
  ctx.lineWidth = Math.max(1.5, size * 0.04);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size * 0.38);
  ctx.stroke();

  ctx.restore();
}

/**
 * CARD BACK — dark cannabis field with drawn leaf + "THC CLASH" label.
 * Layout:
 *   - deep green dark gradient fill
 *   - diagonal line texture
 *   - triple nested rounded rect border in accentColor
 *   - concentric circle + spoke ornament center
 *   - CANNABIS LEAF drawn at center (replacing emoji)
 *   - "THC CLASH" label below leaf
 */
function drawCardBack(ctx: CanvasRenderingContext2D, W: number, H: number, accentColor: string) {
  const R = Math.round(W * 0.06);
  ctx.save();
  rrPath(ctx, 0, 0, W, H, R);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1d0e');
  bg.addColorStop(0.5, '#050e07');
  bg.addColorStop(1, '#0b1d0e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.022)';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H * 0.5, H);
    ctx.stroke();
  }

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  rrPath(ctx, 1.5, 1.5, W - 3, H - 3, R);
  ctx.stroke();

  ctx.strokeStyle = ha(accentColor, 0.38);
  ctx.lineWidth = 1;
  rrPath(ctx, 7, 7, W - 14, H - 14, R - 3);
  ctx.stroke();

  ctx.strokeStyle = ha(accentColor, 0.18);
  ctx.lineWidth = 0.75;
  rrPath(ctx, 13, 13, W - 26, H - 26, R - 6);
  ctx.stroke();

  const cx = W / 2, cy = H * 0.44;
  const outerR = Math.min(W, H) * 0.34;
  const innerR = outerR * 0.55;

  ctx.strokeStyle = ha(accentColor, 0.20);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = ha(accentColor, 0.16);
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.strokeStyle = ha(accentColor, 0.10);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
    ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
    ctx.stroke();
  }

  const glowG = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  glowG.addColorStop(0, ha(accentColor, 0.16));
  glowG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowG;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();

  const leafSize = Math.round(Math.min(W, H) * 0.22);
  const leafGreen = '#3ddc65';
  drawCannabisLeaf(ctx, cx, cy + leafSize * 0.1, leafSize, leafGreen, ha(accentColor, 0.72) === 'rgba(0,0,0,0)' ? 0.65 : 0.68);

  const labelSize = Math.round(W * 0.072);
  ctx.fillStyle = ha(accentColor, 0.72);
  ctx.font = `bold ${labelSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('THC CLASH', cx, cy + leafSize * 0.55);

  ctx.restore();
}

function drawStatPill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  icon: string, value: number | string,
  bg: string, textColor: string
) {
  const R = 4;
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, ha(bg, 0.92));
  grd.addColorStop(1, ha(adj(bg, -30), 0.92));
  ctx.fillStyle = grd;
  rrPath(ctx, x, y, w, h, R);
  ctx.fill();

  ctx.strokeStyle = ha(bg, 0.65);
  ctx.lineWidth = 1;
  rrPath(ctx, x, y, w, h, R);
  ctx.stroke();

  const fs = Math.round(h * 0.54);
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fs}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${icon} ${value}`, x + w / 2, y + h / 2 + 1);
}

/**
 * CARD FACE — full production-quality TCG card.
 *
 * LAYOUT (all positions as ratios of H, exact pixel comments at W=200 H=292):
 *
 *  ┌─────────────────────────────────────┐  ← [0,0]
 *  │ ── outer border (2.5px rarity) ──   │
 *  │ ── inner border × 2 (α rings) ──    │
 *  │                                     │
 *  │  HEADER  [y: 10 .. H*0.115+10]      │  ← ~13px tall at H=292
 *  │  ┌──────────────────────────────┐   │
 *  │  │ (◉ cost orb)  (CLASS label)  │   │  cost orb x=22, class x=W-12 right-align
 *  │  └──────────────────────────────┘   │
 *  │                                     │
 *  │  ART WINDOW [y: H*0.115+17 .. H*0.60]│  ← y≈50..175 at H=292
 *  │  ┌──────────────────────────────┐   │
 *  │  │  full-bleed artwork          │   │  aspect-fill, top+bottom vignette
 *  │  │  corner accent brackets      │   │
 *  │  └──────────────────────────────┘   │
 *  │                                     │
 *  │  ── rarity divider + gem ──         │  ← y≈H*0.60+7
 *  │                                     │
 *  │  NAME PLATE [y: H*0.62 .. H*0.70]   │
 *  │  ┌──────────────────────────────┐   │
 *  │  │  RARITY LABEL (rarity color) │   │  tiny caps
 *  │  │  CARD NAME   (white bold)    │   │  truncated with ellipsis
 *  │  └──────────────────────────────┘   │
 *  │                                     │
 *  │  ABILITY ZONE [y: H*0.70 .. H*0.82] │
 *  │  ┌──────────────────────────────┐   │
 *  │  │  ✦ ability text (or class)   │   │  1 line, overflow ellipsis
 *  │  └──────────────────────────────┘   │
 *  │                                     │
 *  │  STATS FOOTER [y: H*0.83 .. H-8]    │
 *  │  ┌───────────────┬─────────────┐    │
 *  │  │  ⚔ ATK pill  │  ♥ HP pill  │    │  two equal pills side by side
 *  │  └───────────────┴─────────────┘    │
 *  │                                     │
 *  └─────────────────────────────────────┘  ← [W,H]
 */
function drawCardFace(
  ctx: CanvasRenderingContext2D,
  card: ShopCard,
  cfg: typeof RARITY_CFG[string],
  W: number, H: number,
  artImg: HTMLImageElement | null
) {
  const R = Math.round(W * 0.058);
  const rc = cfg.color;

  ctx.save();
  rrPath(ctx, 0, 0, W, H, R);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, ha(adj(rc, -155), 0.98));
  bg.addColorStop(0.45, '#08080f');
  bg.addColorStop(1, ha(adj(rc, -140), 0.98));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.022)';
  ctx.lineWidth = 0.75;
  for (let i = -H; i < W + H; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H * 0.45, H);
    ctx.stroke();
  }

  ctx.strokeStyle = rc;
  ctx.lineWidth = 2.5;
  rrPath(ctx, 1.5, 1.5, W - 3, H - 3, R);
  ctx.stroke();

  ctx.strokeStyle = ha(rc, 0.38);
  ctx.lineWidth = 1;
  rrPath(ctx, 6, 6, W - 12, H - 12, R - 2);
  ctx.stroke();

  ctx.strokeStyle = ha(rc, 0.15);
  ctx.lineWidth = 0.5;
  rrPath(ctx, 11, 11, W - 22, H - 22, R - 5);
  ctx.stroke();

  // ── HEADER ZONE ──────────────────────────────────────────── y: 10..H*0.115+10
  const HDR_PAD = 10;
  const HDR_H = Math.round(H * 0.108);
  const HDR_TOP = 10;

  const hGrd = ctx.createLinearGradient(0, HDR_TOP, 0, HDR_TOP + HDR_H);
  hGrd.addColorStop(0, ha(rc, 0.32));
  hGrd.addColorStop(1, ha(rc, 0.04));
  ctx.fillStyle = hGrd;
  rrPath(ctx, HDR_PAD, HDR_TOP, W - HDR_PAD * 2, HDR_H, 4);
  ctx.fill();

  ctx.strokeStyle = ha(rc, 0.45);
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(HDR_PAD + 6, HDR_TOP + HDR_H);
  ctx.lineTo(W - HDR_PAD - 6, HDR_TOP + HDR_H);
  ctx.stroke();

  const ORB_R = Math.round(HDR_H * 0.38);
  const OX = HDR_PAD + 8 + ORB_R;
  const OY = HDR_TOP + HDR_H / 2;

  ctx.shadowColor = '#2244ff';
  ctx.shadowBlur = 10;
  const orbG = ctx.createRadialGradient(OX - ORB_R * 0.3, OY - ORB_R * 0.3, 0, OX, OY, ORB_R);
  orbG.addColorStop(0, '#8aaaff');
  orbG.addColorStop(0.55, '#2244dd');
  orbG.addColorStop(1, '#0a0e66');
  ctx.fillStyle = orbG;
  ctx.beginPath();
  ctx.arc(OX, OY, ORB_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(OX, OY, ORB_R, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(ORB_R * 1.25)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), OX, OY + 1);

  ctx.fillStyle = ha('#fff', 0.58);
  ctx.font = `${Math.round(HDR_H * 0.34)}px Arial`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText((card.class || '').toUpperCase(), W - HDR_PAD - 8, OY);

  // ── ART WINDOW ───────────────────────────────────────────── y: H*0.12+17..H*0.60
  const ART_PAD = 10;
  const ART_TOP = HDR_TOP + HDR_H + 7;
  const ART_H = Math.round(H * 0.478);
  const ART_W = W - ART_PAD * 2;
  const ART_R = 5;

  ctx.shadowColor = rc;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = rc;
  ctx.lineWidth = 2;
  rrPath(ctx, ART_PAD - 2, ART_TOP - 2, ART_W + 4, ART_H + 4, ART_R + 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.save();
  rrPath(ctx, ART_PAD, ART_TOP, ART_W, ART_H, ART_R);
  ctx.clip();

  ctx.fillStyle = cfg.artBg;
  ctx.fillRect(ART_PAD, ART_TOP, ART_W, ART_H);

  if (artImg) {
    const iw = artImg.naturalWidth || ART_W;
    const ih = artImg.naturalHeight || ART_H;
    const scale = Math.max(ART_W / iw, ART_H / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(artImg, ART_PAD + (ART_W - dw) / 2, ART_TOP + (ART_H - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = ha(rc, 0.10);
    ctx.fillRect(ART_PAD, ART_TOP, ART_W, ART_H);
    const leafSz = Math.round(Math.min(ART_W, ART_H) * 0.28);
    drawCannabisLeaf(ctx,
      ART_PAD + ART_W / 2,
      ART_TOP + ART_H / 2 + leafSz * 0.05,
      leafSz, ha(rc, 0.55), 0.7
    );
  }

  const vgT = ctx.createLinearGradient(0, ART_TOP, 0, ART_TOP + ART_H * 0.28);
  vgT.addColorStop(0, 'rgba(0,0,0,0.38)');
  vgT.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vgT;
  ctx.fillRect(ART_PAD, ART_TOP, ART_W, ART_H * 0.28);

  const vgB = ctx.createLinearGradient(0, ART_TOP + ART_H * 0.65, 0, ART_TOP + ART_H);
  vgB.addColorStop(0, 'rgba(0,0,0,0)');
  vgB.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vgB;
  ctx.fillRect(ART_PAD, ART_TOP + ART_H * 0.65, ART_W, ART_H * 0.35);

  ctx.restore();

  const cornerSz = 5;
  [
    [ART_PAD - 2, ART_TOP - 2],
    [ART_PAD + ART_W + 2 - cornerSz - 3, ART_TOP - 2],
    [ART_PAD - 2, ART_TOP + ART_H + 2 - cornerSz - 3],
    [ART_PAD + ART_W + 2 - cornerSz - 3, ART_TOP + ART_H + 2 - cornerSz - 3],
  ].forEach(([bx, by]) => {
    ctx.fillStyle = ha(rc, 0.65);
    ctx.fillRect(bx, by, cornerSz + 4, 2);
    ctx.fillRect(bx, by, 2, cornerSz + 4);
  });

  // ── RARITY DIVIDER ───────────────────────────────────────── y: ART_TOP+ART_H+7
  const DIV_Y = ART_TOP + ART_H + 7;
  const divG = ctx.createLinearGradient(0, 0, W, 0);
  divG.addColorStop(0, 'transparent');
  divG.addColorStop(0.12, ha(rc, 0.7));
  divG.addColorStop(0.5, rc);
  divG.addColorStop(0.88, ha(rc, 0.7));
  divG.addColorStop(1, 'transparent');
  ctx.fillStyle = divG;
  ctx.fillRect(ART_PAD, DIV_Y, ART_W, 2.5);

  const GX = W / 2, GY = DIV_Y + 1.25;
  const GR = Math.round(H * 0.017);
  ctx.shadowColor = rc;
  ctx.shadowBlur = 6;
  const gGrd = ctx.createRadialGradient(GX, GY - GR * 0.3, 0, GX, GY, GR);
  gGrd.addColorStop(0, adj(rc, 60));
  gGrd.addColorStop(1, rc);
  ctx.fillStyle = gGrd;
  ctx.beginPath();
  ctx.arc(GX, GY, GR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = ha('#fff', 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(GX, GY, GR, 0, Math.PI * 2);
  ctx.stroke();

  // ── NAME PLATE ───────────────────────────────────────────── y: H*0.62..H*0.70
  const NP_TOP = GY + GR + 4;

  const rarSize = Math.round(H * 0.026);
  ctx.fillStyle = rc;
  ctx.font = `${rarSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(normRarity(card.rarity).toUpperCase(), W / 2, NP_TOP);

  const nameSize = Math.round(H * 0.046);
  const maxNameW = ART_W - 8;
  let displayName = card.name;
  ctx.font = `bold ${nameSize}px Arial`;
  while (ctx.measureText(displayName).width > maxNameW && displayName.length > 4) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== card.name) displayName = displayName.trimEnd() + '\u2026';

  ctx.shadowColor = rc;
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(displayName, W / 2, NP_TOP + rarSize + 3);
  ctx.shadowBlur = 0;

  // ── ABILITY ZONE ─────────────────────────────────────────── y: H*0.70..H*0.82
  const AB_TOP = NP_TOP + rarSize + nameSize + 10;
  const AB_BOT = H * 0.82;
  const AB_H = AB_BOT - AB_TOP;

  if (AB_H > 10) {
    const abBg = ctx.createLinearGradient(0, AB_TOP, 0, AB_BOT);
    abBg.addColorStop(0, ha(rc, 0.10));
    abBg.addColorStop(1, ha(rc, 0.03));
    ctx.fillStyle = abBg;
    rrPath(ctx, ART_PAD, AB_TOP, ART_W, AB_H, 4);
    ctx.fill();

    ctx.strokeStyle = ha(rc, 0.25);
    ctx.lineWidth = 0.75;
    rrPath(ctx, ART_PAD, AB_TOP, ART_W, AB_H, 4);
    ctx.stroke();

    const abilityText = (card.abilities && card.abilities.length > 0)
      ? '\u2736 ' + card.abilities[0]
      : card.description
        ? '\u2736 ' + card.description.slice(0, 42)
        : '\u2736 ' + (card.class || 'Unit').charAt(0).toUpperCase() + (card.class || 'Unit').slice(1) + ' class';

    const abSize = Math.round(Math.min(AB_H * 0.42, H * 0.032));
    ctx.fillStyle = ha('#fff', 0.62);
    ctx.font = `${abSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let abDisplay = abilityText;
    while (ctx.measureText(abDisplay).width > ART_W - 12 && abDisplay.length > 6) {
      abDisplay = abDisplay.slice(0, -1);
    }
    if (abDisplay !== abilityText) abDisplay = abDisplay.trimEnd() + '\u2026';
    ctx.fillText(abDisplay, W / 2, AB_TOP + AB_H / 2 + 1);
  }

  // ── STATS FOOTER ─────────────────────────────────────────── y: H*0.83..H-8
  const SF_TOP = Math.round(H * 0.83);
  const SF_H = H - SF_TOP - 8;

  const ftG = ctx.createLinearGradient(0, SF_TOP - 14, 0, H);
  ftG.addColorStop(0, 'rgba(0,0,0,0)');
  ftG.addColorStop(0.3, 'rgba(0,0,0,0.78)');
  ftG.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = ftG;
  ctx.fillRect(0, SF_TOP - 14, W, H - (SF_TOP - 14));

  const SB_H = Math.round(SF_H * 0.70);
  const SB_Y = SF_TOP + (SF_H - SB_H) / 2;
  const SB_W = Math.round((ART_W - 6) / 2);

  drawStatPill(ctx, ART_PAD, SB_Y, SB_W, SB_H, '\u2694', card.attack, '#dc2626', '#fca5a5');
  drawStatPill(ctx, ART_PAD + SB_W + 6, SB_Y, SB_W, SB_H, '\u2665', card.health, '#16a34a', '#86efac');

  ctx.restore();
}

function TCGCard({
  card, cfg, w, h, flipped, packColor
}: {
  card: ShopCard; cfg: typeof RARITY_CFG[string];
  w: number; h: number; flipped: boolean; packColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const DPR = 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = w * DPR;
    const H = h * DPR;

    if (!flipped) {
      drawCardBack(ctx, W, H, packColor);
      return;
    }

    const draw = (img: HTMLImageElement | null) => {
      ctx.clearRect(0, 0, W, H);
      drawCardFace(ctx, card, cfg, W, H, img);
    };

    if (card.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = card.image;
    } else {
      draw(null);
    }
  }, [card, cfg, w, h, flipped, packColor]);

  return (
    <canvas
      ref={canvasRef}
      width={w * DPR}
      height={h * DPR}
      style={{ width: w, height: h, display: 'block', imageRendering: 'crisp-edges' }}
    />
  );
}

function MiniTCGCard({ card, w, h }: { card: ShopCard; w: number; h: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const DPR = 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = w * DPR;
    const H = h * DPR;
    const cfg = getCfg(card.rarity);

    const draw = (img: HTMLImageElement | null) => {
      ctx.clearRect(0, 0, W, H);
      drawCardFace(ctx, card, cfg, W, H, img);
    };

    if (card.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = card.image;
    } else {
      draw(null);
    }
  }, [card, w, h]);

  return (
    <canvas
      ref={canvasRef}
      width={w * DPR}
      height={h * DPR}
      style={{ width: w, height: h, display: 'block', imageRendering: 'crisp-edges' }}
    />
  );
}

function CannabisLeafSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50,65)">
        {[
          { a: -90, len: 48, w: 10 },
          { a: -90 - 30, len: 40, w: 8 },
          { a: -90 + 30, len: 40, w: 8 },
          { a: -90 - 62, len: 30, w: 6 },
          { a: -90 + 62, len: 30, w: 6 },
          { a: -90 - 88, len: 19, w: 4 },
          { a: -90 + 88, len: 19, w: 4 },
        ].map((l, i) => {
          const rad = (l.a * Math.PI) / 180;
          const tx = Math.cos(rad) * l.len;
          const ty = Math.sin(rad) * l.len;
          const px = -Math.sin(rad);
          const py = Math.cos(rad);
          const pts: [number,number][] = [];
          const segs = 8;
          pts.push([0, 0]);
          for (let s = 0; s <= segs; s++) {
            const t = s / segs;
            const bx = tx * t;
            const by = ty * t;
            const b = l.w * Math.sin(Math.PI * t) * (1 - t * 0.2);
            const serr = (s % 2 === 0 ? l.w * 0.12 : -l.w * 0.07) * Math.sin(Math.PI * t) * (1 - t * 0.5);
            pts.push([bx - px * (b + serr), by - py * (b + serr)]);
          }
          pts.push([tx, ty]);
          for (let s = segs; s >= 0; s--) {
            const t = s / segs;
            const bx = tx * t;
            const by = ty * t;
            const b = l.w * Math.sin(Math.PI * t) * (1 - t * 0.2);
            const serr = (s % 2 === 0 ? l.w * 0.12 : -l.w * 0.07) * Math.sin(Math.PI * t) * (1 - t * 0.5);
            pts.push([bx + px * (b + serr), by + py * (b + serr)]);
          }
          const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
          return (
            <g key={i}>
              <path d={d} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
              <line x1="0" y1="0" x2={tx * 0.88} y2={ty * 0.88} stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
            </g>
          );
        })}
        <line x1="0" y1="0" x2="0" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Particle({ color, idx, total }: { color: string; idx: number; total: number }) {
  const angle = (idx / total) * 360 + (idx % 2 === 0 ? 15 : -15);
  const dist = 90 + (idx % 4) * 35;
  const size = 5 + (idx % 3) * 3;
  const dur = 0.55 + (idx % 4) * 0.15;
  const tx = Math.cos((angle * Math.PI) / 180) * dist;
  const ty = Math.sin((angle * Math.PI) / 180) * dist;
  const shapes = ['50%', '2px', '50% 0 50% 0'];
  const shape = shapes[idx % shapes.length];
  return (
    <span style={{
      position: 'absolute', left: '50%', top: '50%',
      width: size, height: size,
      borderRadius: shape,
      background: idx % 3 === 0 ? '#fff' : color,
      pointerEvents: 'none',
      animation: `pop-particle ${dur}s ease-out forwards`,
      '--tx': `${tx}px`, '--ty': `${ty}px`,
      boxShadow: `0 0 8px 2px ${color}`,
    } as React.CSSProperties & Record<string, string>} />
  );
}

type Phase = 'pack' | 'burst' | 'reveal' | 'summary';

export default function PackOpeningModal({ cards, packName, packColor, packArtUrl, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('pack');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [rarityLabel, setRarityLabel] = useState('');
  const [summaryIn, setSummaryIn] = useState<boolean[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844;

  const T = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const displayCards = cards.slice(0, 3);
  const current = displayCards[cardIndex];
  const cfg = current ? getCfg(current.rarity) : RARITY_CFG.common;
  const isHighRarity = ['legendary', 'epic', 'rare'].includes(normRarity(current?.rarity || ''));

  const openPack = useCallback(() => {
    setPhase('burst');
    T(() => {
      setPhase('reveal');
      setCardIndex(0); setFlipped(false);
      setShowParticles(false); setRarityLabel('');
    }, 620);
  }, [T]);

  const tap = useCallback(() => {
    if (phase !== 'reveal') return;
    if (!flipped) {
      setFlipped(true);
      if (cfg.particles > 0) {
        setShowFlash(true);
        T(() => setShowFlash(false), 280);
        T(() => setShowParticles(true), 60);
        T(() => setShowParticles(false), 1000);
      }
      if (cfg.label) {
        T(() => setRarityLabel(cfg.label), 180);
        T(() => setRarityLabel(''), 2200);
      }
    } else {
      if (cardIndex < displayCards.length - 1) {
        setFlipped(false); setShowParticles(false); setRarityLabel('');
        T(() => setCardIndex(i => i + 1), 300);
      } else {
        setSummaryIn([]);
        setPhase('summary');
        displayCards.forEach((_, i) => {
          T(() => setSummaryIn(prev => { const n = [...prev]; n[i] = true; return n; }), i * 180 + 60);
        });
      }
    }
  }, [phase, flipped, cardIndex, displayCards, cfg, T]);

  const cardW = Math.min(260, vw - 48);
  const cardH = Math.round(cardW * 1.46);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at center bottom, #0a1a0a 0%, #000 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', overflowY: 'auto',
      userSelect: 'none', WebkitUserSelect: 'none',
    }}>
      <style>{`
        @keyframes pop-particle {
          0%   { opacity:1; transform:translate(-50%,-50%) translate(0,0) scale(1.2); }
          100% { opacity:0; transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0); }
        }
        @keyframes pack-hover {
          0%,100% { transform:translateY(0) rotate(-1.5deg); }
          50%      { transform:translateY(-18px) rotate(1.5deg); }
        }
        @keyframes pack-burst {
          0%  { opacity:0; transform:scale(0.4); }
          40% { opacity:1; transform:scale(1.8); }
          100%{ opacity:0; transform:scale(3); }
        }
        @keyframes screen-flash {
          0%  { opacity:0; }
          12% { opacity:1; }
          100%{ opacity:0; }
        }
        @keyframes card-drop-in {
          from { opacity:0; transform:translateY(60px) scale(0.88); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes card-flip {
          0%   { transform:rotateY(90deg) scale(0.94); opacity:0.4; }
          100% { transform:rotateY(0deg) scale(1); opacity:1; }
        }
        @keyframes rarity-slam {
          0%   { opacity:0; transform:translateY(-60px) scale(0.6) skewX(-4deg); }
          22%  { opacity:1; transform:translateY(4px) scale(1.18) skewX(0); }
          32%  { transform:translateY(0) scale(1); }
          78%  { opacity:1; }
          100% { opacity:0; transform:translateY(10px) scale(0.92); }
        }
        @keyframes tap-breathe {
          0%,100% { opacity:0.55; transform:scale(1); }
          50%      { opacity:1;    transform:scale(1.04); }
        }
        @keyframes summary-pop {
          from { opacity:0; transform:translateY(30px) scale(0.82) rotateX(12deg); }
          to   { opacity:1; transform:translateY(0) scale(1) rotateX(0); }
        }
        @keyframes legend-shimmer {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes leaf-pulse {
          0%,100% { transform:scale(1) rotate(-2deg); opacity:0.85; }
          50%      { transform:scale(1.06) rotate(2deg); opacity:1; }
        }
      `}</style>

      {/* ── PACK PHASE ──────────────────────────────────────── */}
      {phase === 'pack' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '24px 20px' }}>
          <div style={{
            fontSize: 11, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
          }}>PACK OPENING</div>

          <div style={{ position: 'relative', width: 200, height: 290 }} onClick={openPack}>
            {[
              { rot: -22, tx: -52, ty: 20 },
              { rot: 22, tx: 52, ty: 20 },
              { rot: 0, tx: 0, ty: 8 },
            ].map((c, i) => {
              const bw = 120, bh = 175;
              return (
                <div key={i} style={{
                  position: 'absolute', left: '50%', top: 0,
                  width: bw, height: bh,
                  transform: `translateX(calc(-50% + ${c.tx}px)) rotate(${c.rot}deg) translateY(${c.ty}px)`,
                  borderRadius: 10, overflow: 'hidden', zIndex: i,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.7), 0 0 10px ${packColor}44`,
                }}>
                  <canvas
                    width={bw * 2} height={bh * 2}
                    ref={el => { if (el) { const ctx = el.getContext('2d'); if (ctx) drawCardBack(ctx, bw * 2, bh * 2, packColor); } }}
                    style={{ width: bw, height: bh, display: 'block' }}
                  />
                </div>
              );
            })}

            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 160, height: 224,
              transform: 'translate(-50%, -44%)',
              animation: 'pack-hover 3s ease-in-out infinite',
              cursor: 'pointer', zIndex: 10,
              borderRadius: 14,
              border: `3px solid ${packColor}`,
              boxShadow: `0 0 40px 12px ${packColor}55, 0 0 80px 30px ${packColor}22`,
              overflow: 'hidden',
              background: `linear-gradient(145deg, ${packColor}22, #000 60%, ${packColor}11)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              {packArtUrl
                ? <img src={packArtUrl} alt={packName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    animation: 'leaf-pulse 2.4s ease-in-out infinite',
                  }}>
                    <CannabisLeafSVG color={packColor} size={68} />
                    <div style={{ color: packColor, fontSize: 11, letterSpacing: '0.22em', fontWeight: 700, textShadow: `0 0 14px ${packColor}` }}>THC CLASH</div>
                  </div>
                )
              }
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(120deg, rgba(255,255,255,0.10) 0%, transparent 50%)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: '0.1em', marginBottom: 4 }}>{packName}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>{displayCards.length} cards inside</div>
            <button
              onClick={openPack}
              style={{
                background: `linear-gradient(135deg, ${packColor} 0%, ${packColor}99 100%)`,
                border: `2px solid ${packColor}`,
                borderRadius: 14, padding: '14px 56px',
                color: '#000', fontWeight: 900, fontSize: 16,
                letterSpacing: '0.12em', cursor: 'pointer',
                boxShadow: `0 0 30px 10px ${packColor}55, 0 6px 0 ${packColor}88`,
                textTransform: 'uppercase',
              }}
            >OPEN PACK</button>
          </div>
        </div>
      )}

      {/* ── BURST PHASE ─────────────────────────────────────── */}
      {phase === 'burst' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 280, height: 380, borderRadius: 24,
            background: `radial-gradient(ellipse at center, #fff 0%, ${packColor} 30%, transparent 70%)`,
            animation: 'pack-burst 0.62s ease-out forwards',
          }} />
          <div style={{
            position: 'absolute', inset: 0, background: '#fff',
            animation: 'screen-flash 0.5s ease-out forwards', opacity: 0,
          }} />
        </div>
      )}

      {/* ── REVEAL PHASE ────────────────────────────────────── */}
      {phase === 'reveal' && current && (
        <div
          onClick={tap}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '100%', padding: `${Math.max(12, (vh - cardH - 160) / 2)}px 20px`,
            cursor: 'pointer', gap: 20,
          }}
        >
          {showFlash && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 2,
              background: cfg.flash,
              animation: 'screen-flash 0.28s ease-out forwards',
              pointerEvents: 'none',
            }} />
          )}

          {rarityLabel && (
            <div style={{
              position: 'fixed', top: '8%', left: 0, right: 0,
              textAlign: 'center', zIndex: 20, pointerEvents: 'none',
            }}>
              <span style={{
                display: 'inline-block',
                fontSize: Math.min(34, vw * 0.085),
                fontWeight: 900, letterSpacing: '0.18em',
                color: cfg.color, textTransform: 'uppercase',
                textShadow: cfg.textShadow,
                animation: 'rarity-slam 2.2s ease-out forwards',
                ...(normRarity(current.rarity) === 'legendary' ? {
                  background: 'linear-gradient(90deg, #ffd700, #fff, #ffd700, #ff9900, #ffd700)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'rarity-slam 2.2s ease-out forwards, legend-shimmer 1.5s ease infinite',
                } : {}),
              }}>
                {rarityLabel}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {displayCards.map((c, i) => (
              <div key={i} style={{
                width: 36, height: 5, borderRadius: 3,
                background: i < cardIndex
                  ? getCfg(displayCards[i].rarity).color
                  : i === cardIndex && flipped ? cfg.color
                  : i === cardIndex ? 'rgba(255,255,255,0.3)' : '#1a1a1a',
                boxShadow: i === cardIndex && flipped ? `0 0 8px 2px ${cfg.color}` : 'none',
                transition: 'all 0.4s',
              }} />
            ))}
          </div>

          <div style={{ position: 'relative', width: cardW, height: cardH }}>
            {showParticles && cfg.particles > 0 && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                {Array.from({ length: cfg.particles }).map((_, i) => (
                  <Particle key={i} color={cfg.color} idx={i} total={cfg.particles} />
                ))}
              </div>
            )}

            {flipped && isHighRarity && (
              <div style={{
                position: 'absolute', inset: -16, borderRadius: 22, zIndex: 0,
                boxShadow: cfg.glow,
                border: `1px solid ${cfg.color}55`,
                pointerEvents: 'none',
              }} />
            )}

            <div style={{
              width: '100%', height: '100%',
              borderRadius: 14, overflow: 'hidden',
              animation: flipped ? 'card-flip 0.44s cubic-bezier(0.23,1,0.32,1)' : 'card-drop-in 0.35s ease-out',
              position: 'relative', zIndex: 1,
            }}>
              <TCGCard
                card={current}
                cfg={cfg}
                w={cardW}
                h={cardH}
                flipped={flipped}
                packColor={packColor}
              />
            </div>
          </div>

          {flipped && (
            <div style={{
              position: 'fixed', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(ellipse at center, ${cfg.color}07 0%, transparent 65%)`,
              zIndex: 0,
            }} />
          )}

          <div style={{
            fontSize: 11, letterSpacing: '0.22em',
            color: flipped ? 'rgba(255,255,255,0.45)' : cfg.color,
            textTransform: 'uppercase',
            animation: 'tap-breathe 1.8s ease-in-out infinite',
            textShadow: flipped ? 'none' : `0 0 12px ${cfg.color}`,
          }}>
            {!flipped ? 'TAP TO REVEAL'
              : cardIndex < displayCards.length - 1 ? 'TAP FOR NEXT CARD'
              : 'TAP TO COLLECT ALL'}
          </div>
        </div>
      )}

      {/* ── SUMMARY PHASE ───────────────────────────────────── */}
      {phase === 'summary' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%', padding: '28px 16px', gap: 24,
        }}>
          <div style={{
            color: '#fff', fontSize: 20, letterSpacing: '0.16em',
            textShadow: `0 0 24px ${packColor}`,
          }}>YOUR PULL</div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {displayCards.map((card, i) => {
              const sw = Math.min(130, (vw - 48) / 3 - 6);
              const sh = Math.round(sw * 1.46);
              const cr = getCfg(card.rarity);
              return (
                <div key={i} style={{
                  width: sw, height: sh,
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: summaryIn[i] ? cr.glow : 'none',
                  opacity: summaryIn[i] ? 1 : 0,
                  animation: summaryIn[i] ? 'summary-pop 0.42s cubic-bezier(0.23,1,0.32,1) both' : undefined,
                  position: 'relative', flexShrink: 0,
                }}>
                  <MiniTCGCard card={card} w={sw} h={sh} />
                </div>
              );
            })}
          </div>

          <button
            onClick={onDone}
            style={{
              background: `linear-gradient(135deg, ${packColor} 0%, ${packColor}88 100%)`,
              border: `2px solid ${packColor}`,
              borderRadius: 14, padding: '14px 52px',
              color: '#000', fontWeight: 900, fontSize: 15,
              letterSpacing: '0.12em', cursor: 'pointer',
              boxShadow: `0 0 30px 10px ${packColor}44, 0 6px 0 ${packColor}66`,
              textTransform: 'uppercase',
            }}
          >COLLECT CARDS</button>
        </div>
      )}
    </div>
  );
}
