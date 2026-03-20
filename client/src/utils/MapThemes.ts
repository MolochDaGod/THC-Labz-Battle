export interface MapTheme {
  id: string;
  name: string;
  icon: string;
  puterPrompt: string;
  bgGradient: [string, string];
  topZoneColor: string;
  bottomZoneColor: string;
  riverColor: string;
  bridgeColor: string;
  decorEmoji: string[];
  uiAccent: string;
  uiBorder: string;
  uiBg: string;
  description: string;
}

export const MAP_THEMES: MapTheme[] = [
  {
    id: 'cannabis',
    name: 'Cannabis Garden',
    icon: '🌿',
    puterPrompt: 'top-down view lush cannabis garden battle arena for a card game, vibrant green cannabis plants, stone cobblestone path down the center, river of water in the middle, Clash Royale style game board, saturated greens and earthy tones, pixel art style, no text, no letters',
    bgGradient: ['#1a5c1a', '#0d3d0d'],
    topZoneColor: '#1e7a1e',
    bottomZoneColor: '#1a6b1a',
    riverColor: '#1a6ea8',
    bridgeColor: '#8B6914',
    decorEmoji: ['🌿', '🍃', '🌱', '🌾'],
    uiAccent: 'text-green-400',
    uiBorder: 'border-green-500/60',
    uiBg: 'from-green-900 to-black',
    description: 'Classic cannabis battlefield'
  },
  {
    id: 'volcano',
    name: 'Lava Fields',
    icon: '🌋',
    puterPrompt: 'top-down view volcanic battlefield arena for a card game, black obsidian rock ground, rivers of glowing orange lava in the middle, glowing cracks, fire pits, ash smoke, Clash Royale style game board, dark blacks reds and oranges, pixel art style, no text, no letters',
    bgGradient: ['#3d0a00', '#1a0500'],
    topZoneColor: '#4a1000',
    bottomZoneColor: '#3d0d00',
    riverColor: '#ff4500',
    bridgeColor: '#5a3a1a',
    decorEmoji: ['🔥', '💥', '🌋', '⚡'],
    uiAccent: 'text-orange-400',
    uiBorder: 'border-orange-500/60',
    uiBg: 'from-red-900 to-black',
    description: 'Scorched volcanic wasteland'
  },
  {
    id: 'arctic',
    name: 'Frozen Tundra',
    icon: '❄️',
    puterPrompt: 'top-down view arctic frozen tundra battle arena for a card game, snow covered ground, frozen river of ice in the middle, icicles, snowdrifts, pine trees dusted in snow, Clash Royale style game board, cool blue whites and icy teals, pixel art style, no text, no letters',
    bgGradient: ['#0d2a4a', '#0a1a2e'],
    topZoneColor: '#1a3d5c',
    bottomZoneColor: '#153352',
    riverColor: '#a8d8ea',
    bridgeColor: '#4a7a9b',
    decorEmoji: ['❄️', '🌨️', '⛄', '🏔️'],
    uiAccent: 'text-cyan-400',
    uiBorder: 'border-cyan-500/60',
    uiBg: 'from-blue-900 to-black',
    description: 'Icy frozen battlefield'
  },
  {
    id: 'nightforest',
    name: 'Moonlit Forest',
    icon: '🌙',
    puterPrompt: 'top-down view dark mystical night forest battle arena for a card game, moonlight glowing through ancient twisted trees, purple and blue mystical fog, fireflies, magical glowing mushrooms, moonlit river in the middle, Clash Royale style game board, deep purples and blues, pixel art style, no text, no letters',
    bgGradient: ['#0d0820', '#050310'],
    topZoneColor: '#120a2e',
    bottomZoneColor: '#0f0726',
    riverColor: '#3a1a6e',
    bridgeColor: '#4a2a7a',
    decorEmoji: ['🌙', '✨', '🍄', '🦋'],
    uiAccent: 'text-purple-400',
    uiBorder: 'border-purple-500/60',
    uiBg: 'from-purple-900 to-black',
    description: 'Dark mystical forest'
  },
  {
    id: 'desert',
    name: 'Desert Oasis',
    icon: '🏜️',
    puterPrompt: 'top-down view desert oasis battle arena for a card game, golden sand dunes, an oasis river with turquoise water in the middle, palm trees, cacti, sandstone ruins, ancient temple details, Clash Royale style game board, warm golds tans and turquoise, pixel art style, no text, no letters',
    bgGradient: ['#5c3d0a', '#3d2500'],
    topZoneColor: '#6b4a10',
    bottomZoneColor: '#5c400e',
    riverColor: '#2a9d8f',
    bridgeColor: '#a07830',
    decorEmoji: ['🌵', '🏜️', '🦂', '🌞'],
    uiAccent: 'text-yellow-400',
    uiBorder: 'border-yellow-500/60',
    uiBg: 'from-yellow-900 to-black',
    description: 'Golden sand dunes'
  },
  {
    id: 'galaxy',
    name: 'Galaxy Station',
    icon: '🌌',
    puterPrompt: 'top-down view futuristic space station battle arena for a card game, metallic dark floor with glowing blue energy lines, cosmic purple nebula visible through transparent panels, stars, an energy river beam in the middle, sci-fi Clash Royale style game board, deep purples blues and neon cyan, pixel art style, no text, no letters',
    bgGradient: ['#050a2e', '#020615'],
    topZoneColor: '#0a1040',
    bottomZoneColor: '#080d38',
    riverColor: '#00ffff',
    bridgeColor: '#1a3a6e',
    decorEmoji: ['🌌', '⭐', '🚀', '💫'],
    uiAccent: 'text-cyan-300',
    uiBorder: 'border-cyan-400/60',
    uiBg: 'from-indigo-900 to-black',
    description: 'Cosmic space station'
  }
];

export function getTheme(id: string): MapTheme {
  return MAP_THEMES.find(t => t.id === id) || MAP_THEMES[0];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function adjustHex(hex: string, amount: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const r = Math.max(0, Math.min(255, c.r + amount));
  const g = Math.max(0, Math.min(255, c.g + amount));
  const b = Math.max(0, Math.min(255, c.b + amount));
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  if (!c) return `rgba(128,128,128,${alpha})`;
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

function drawTileGrid(
  ctx: CanvasRenderingContext2D,
  baseColor: string,
  x: number, y: number,
  w: number, h: number,
  tileSize: number,
  shade: 'enemy' | 'player'
) {
  const c = hexToRgb(baseColor);
  if (!c) return;

  const colsCount = Math.ceil(w / tileSize) + 1;
  const rowsCount = Math.ceil(h / tileSize) + 1;

  for (let col = 0; col < colsCount; col++) {
    for (let row = 0; row < rowsCount; row++) {
      const tx = x + col * tileSize;
      const ty = y + row * tileSize;
      const tw = Math.min(tileSize, x + w - tx);
      const th = Math.min(tileSize, y + h - ty);
      if (tw <= 0 || th <= 0) continue;

      const checker = (col + row) % 2 === 0;
      const brightness = checker ? 12 : -8;
      const r = Math.max(0, Math.min(255, c.r + brightness));
      const g = Math.max(0, Math.min(255, c.g + brightness));
      const b = Math.max(0, Math.min(255, c.b + brightness));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(tx, ty, tw, th);

      ctx.strokeStyle = shade === 'enemy'
        ? 'rgba(0,0,0,0.18)'
        : 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tx, ty, tw, th);
    }
  }
}

function drawRiverShimmer(
  ctx: CanvasRenderingContext2D,
  riverColor: string,
  width: number,
  riverTop: number,
  riverH: number
) {
  const lightColor = adjustHex(riverColor, 50);
  ctx.fillStyle = hexToRgba(lightColor.replace('rgb', 'rgb'), 0.25);

  const shimmerRows = 3;
  const shimmerSpacing = riverH / shimmerRows;
  for (let row = 0; row < shimmerRows; row++) {
    const sy = riverTop + shimmerSpacing * row + shimmerSpacing * 0.3;
    for (let x = 0; x < width; x += 48) {
      const offset = (row * 19 + x * 0.3) % 24;
      ctx.globalAlpha = 0.15 + 0.1 * Math.sin(x * 0.05);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + offset, sy, 22, 4);
      ctx.fillRect(x + 24 - offset * 0.5, sy + 8, 14, 3);
    }
  }
  ctx.globalAlpha = 1;
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  theme: MapTheme,
  bridgeCenterX: number,
  riverTop: number,
  bridgeW: number,
  riverH: number
) {
  const bx = bridgeCenterX - bridgeW / 2;
  const by = riverTop - 6;
  const bh = riverH + 12;
  const bc = hexToRgb(theme.bridgeColor);
  if (!bc) return;

  ctx.save();

  const bridgeBase = ctx.createLinearGradient(bx, 0, bx + bridgeW, 0);
  bridgeBase.addColorStop(0, adjustHex(theme.bridgeColor, -25));
  bridgeBase.addColorStop(0.2, adjustHex(theme.bridgeColor, 15));
  bridgeBase.addColorStop(0.5, adjustHex(theme.bridgeColor, 35));
  bridgeBase.addColorStop(0.8, adjustHex(theme.bridgeColor, 15));
  bridgeBase.addColorStop(1, adjustHex(theme.bridgeColor, -25));
  ctx.fillStyle = bridgeBase;
  ctx.globalAlpha = 0.95;
  ctx.fillRect(bx, by, bridgeW, bh);
  ctx.globalAlpha = 1;

  const plankCount = Math.floor(bh / 10);
  for (let i = 0; i < plankCount; i++) {
    const py = by + i * 10;
    ctx.fillStyle = i % 2 === 0
      ? hexToRgba(theme.bridgeColor, 0.5)
      : hexToRgba(adjustHex(theme.bridgeColor, -20), 0.5);
    ctx.fillRect(bx + 2, py, bridgeW - 4, 9);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx + 2, py, bridgeW - 4, 9);
  }

  ctx.strokeStyle = adjustHex(theme.bridgeColor, -40);
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bridgeW, bh);

  ctx.strokeStyle = adjustHex(theme.bridgeColor, 50);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx + 4, by + 4);
  ctx.lineTo(bx + bridgeW - 4, by + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 4, by + bh - 4);
  ctx.lineTo(bx + bridgeW - 4, by + bh - 4);
  ctx.stroke();

  const postH = 16;
  const postW = 8;
  const postColor = adjustHex(theme.bridgeColor, -30);
  [[bx, by - postH + 4], [bx + bridgeW - postW, by - postH + 4],
   [bx, by + bh - 4], [bx + bridgeW - postW, by + bh - 4]].forEach(([px, py]) => {
    ctx.fillStyle = postColor;
    ctx.fillRect(px, py, postW, postH);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, postW, postH);
  });

  ctx.restore();
}

function drawLanePath(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  pathW: number,
  y: number,
  h: number,
  riverTop: number,
  riverBot: number
) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = 'rgba(255,255,255,1)';
  if (h > 0) {
    ctx.fillRect(centerX - pathW / 2, y, pathW, h);
  }

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 16]);
  ctx.beginPath();
  ctx.moveTo(centerX, y);
  ctx.lineTo(centerX, y + h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawTeamZoneTint(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number, y: number, w: number, h: number,
  isEnemy: boolean
) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  if (isEnemy) {
    grad.addColorStop(0, hexToRgba(color, 0.3));
    grad.addColorStop(1, hexToRgba(color, 0));
  } else {
    grad.addColorStop(0, hexToRgba(color, 0));
    grad.addColorStop(1, hexToRgba(color, 0.3));
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawTowerPad(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string,
  isKing: boolean
) {
  ctx.save();
  const r = isKing ? 46 : 38;
  const grad = ctx.createRadialGradient(x, y, 4, x, y, r);
  grad.addColorStop(0, hexToRgba(color, 0.28));
  grad.addColorStop(0.6, hexToRgba(color, 0.12));
  grad.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(color, 0.4);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(x, y, r - 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawOuterAtmosphere(
  ctx: CanvasRenderingContext2D,
  theme: MapTheme,
  width: number,
  height: number
) {
  ctx.save();

  const margin = 18;
  const cornerRadius = 6;

  ctx.fillStyle = hexToRgba(theme.bgGradient[0], 0.6);
  ctx.fillRect(0, 0, margin, height);
  ctx.fillRect(width - margin, 0, margin, height);
  ctx.fillRect(0, 0, width, margin);
  ctx.fillRect(0, height - margin, width, margin);

  ctx.strokeStyle = hexToRgba(adjustHex(theme.bridgeColor, 20), 0.5);
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  ctx.strokeStyle = hexToRgba(adjustHex(theme.bridgeColor, -20), 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 3, margin + 3, width - (margin + 3) * 2, height - (margin + 3) * 2);

  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  const vx = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  vx.addColorStop(0, 'rgba(0,0,0,0)');
  vx.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vx;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawThemeAmbience(
  ctx: CanvasRenderingContext2D,
  theme: MapTheme,
  width: number,
  height: number,
  riverTop: number,
  riverBot: number
) {
  ctx.save();

  if (theme.id === 'cannabis') {
    const accentPositions = [
      { x: 26, y: 55 }, { x: 770, y: 60 }, { x: 22, y: 170 }, { x: 772, y: 180 },
      { x: 28, y: 420 }, { x: 765, y: 430 }, { x: 24, y: 570 }, { x: 768, y: 565 },
      { x: 120, y: 22 }, { x: 400, y: 18 }, { x: 680, y: 24 },
      { x: 120, y: height - 22 }, { x: 400, y: height - 18 }, { x: 680, y: height - 22 },
    ];
    ctx.font = '18px Arial';
    accentPositions.forEach((p, i) => {
      ctx.globalAlpha = 0.55;
      ctx.fillText(theme.decorEmoji[i % theme.decorEmoji.length], p.x, p.y);
    });

    for (let i = 0; i < 8; i++) {
      const gx = (i * 113 + 40) % (width - 60) + 30;
      const gy = i < 4 ? 30 + i * 18 : (height - 80) + (i - 4) * 18;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#2d8a2d';
      ctx.beginPath();
      ctx.arc(gx, gy, 6 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (theme.id === 'volcano') {
    for (let i = 0; i < 12; i++) {
      const cx = ((i * 71) % (width - 40)) + 20;
      const cy = i < 6 ? 15 + (i * 23) % 60 : height - 15 - (i * 19) % 60;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = i % 3 === 0 ? '#ff6600' : i % 3 === 1 ? '#cc3300' : '#ff9900';
      ctx.beginPath();
      ctx.arc(cx, cy, 4 + i % 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '16px Arial';
    [[25, 40], [768, 35], [20, 580], [770, 575], [22, 200], [770, 210]].forEach(([x, y], i) => {
      ctx.globalAlpha = 0.5;
      ctx.fillText(theme.decorEmoji[i % theme.decorEmoji.length], x, y);
    });
  }

  if (theme.id === 'arctic') {
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 41) % (width - 20)) + 10;
      const sy = ((i * 37) % (height - 20)) + 10;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'rgba(200,240,255,0.6)';
      const size = 1 + i % 3;
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.font = '16px Arial';
    [[22, 38], [770, 42], [20, 590], [765, 582], [23, 310]].forEach(([x, y], i) => {
      ctx.globalAlpha = 0.5;
      ctx.fillText(theme.decorEmoji[i % theme.decorEmoji.length], x, y);
    });
  }

  if (theme.id === 'nightforest') {
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 37) % (width - 24)) + 12;
      const sy = ((i * 53) % (height - 24)) + 12;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = i % 2 === 0 ? '#fffacd' : '#c8a0ff';
      const size = 1 + (i % 2);
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '15px Arial';
    [[22, 40], [768, 38], [20, 580], [768, 575], [23, 200], [769, 195]].forEach(([x, y], i) => {
      ctx.globalAlpha = 0.55;
      ctx.fillText(theme.decorEmoji[i % theme.decorEmoji.length], x, y);
    });
  }

  if (theme.id === 'desert') {
    for (let i = 0; i < 10; i++) {
      const dx = ((i * 83) % (width - 40)) + 20;
      const dy = i < 5 ? 20 + i * 14 : height - 20 - (i - 5) * 14;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#c8a020';
      ctx.beginPath();
      ctx.ellipse(dx, dy, 12 + i % 5, 5 + i % 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '16px Arial';
    [[22, 38], [768, 40], [20, 582], [766, 578], [24, 200], [768, 206]].forEach(([x, y], i) => {
      ctx.globalAlpha = 0.55;
      ctx.fillText(theme.decorEmoji[i % theme.decorEmoji.length], x, y);
    });
  }

  if (theme.id === 'galaxy') {
    for (let i = 0; i < 35; i++) {
      const sx = ((i * 23) % (width - 16)) + 8;
      const sy = ((i * 31) % (height - 16)) + 8;
      ctx.globalAlpha = 0.55;
      const brightness = 150 + (i * 37) % 105;
      ctx.fillStyle = i % 3 === 0 ? `rgb(${brightness},${brightness},255)` : `rgb(180,${brightness},255)`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '15px Arial';
    [[22, 38], [768, 40], [20, 582], [766, 578], [24, 200]].forEach(([x, y], i) => {
      ctx.globalAlpha = 0.55;
      ctx.fillText(theme.decorEmoji[i % theme.decorEmoji.length], x, y);
    });
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawThemeFallback(
  ctx: CanvasRenderingContext2D,
  theme: MapTheme,
  width: number,
  height: number
) {
  const TILE = 32;
  const centerY = height / 2;
  const RIVER_H = 68;
  const riverTop = centerY - RIVER_H / 2;
  const riverBot = centerY + RIVER_H / 2;

  const LBX = width * 0.20;
  const RBX = width * 0.80;
  const BRIDGE_W = 100;
  const LANE_W = BRIDGE_W + 16;

  // 1 — Rich background gradient (full canvas)
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, adjustHex(theme.topZoneColor, -30));
  bg.addColorStop(0.05, adjustHex(theme.topZoneColor, -15));
  bg.addColorStop(0.35, theme.bgGradient[0]);
  bg.addColorStop(0.48, adjustHex(theme.riverColor, -35));
  bg.addColorStop(0.52, adjustHex(theme.riverColor, -35));
  bg.addColorStop(0.65, theme.bgGradient[1]);
  bg.addColorStop(0.95, adjustHex(theme.bottomZoneColor, -15));
  bg.addColorStop(1, adjustHex(theme.bottomZoneColor, -30));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 2 — Tile grid - enemy zone
  drawTileGrid(ctx, theme.topZoneColor, 0, 0, width, riverTop, TILE, 'enemy');

  // 3 — Tile grid - player zone
  drawTileGrid(ctx, theme.bottomZoneColor, 0, riverBot, width, height - riverBot, TILE, 'player');

  // 4 — Team zone color tints
  drawTeamZoneTint(ctx, theme.topZoneColor, 0, 0, width, riverTop, true);
  drawTeamZoneTint(ctx, theme.bottomZoneColor, 0, riverBot, width, height - riverBot, false);

  // 5 — Lane paths (visual indicators where units walk toward bridges)
  drawLanePath(ctx, LBX, LANE_W, 0, riverTop, riverTop, riverBot);
  drawLanePath(ctx, RBX, LANE_W, 0, riverTop, riverTop, riverBot);
  drawLanePath(ctx, LBX, LANE_W, riverBot, height - riverBot, riverTop, riverBot);
  drawLanePath(ctx, RBX, LANE_W, riverBot, height - riverBot, riverTop, riverBot);

  // 6 — River
  const riverGrad = ctx.createLinearGradient(0, riverTop, 0, riverBot);
  riverGrad.addColorStop(0, adjustHex(theme.riverColor, -45));
  riverGrad.addColorStop(0.15, adjustHex(theme.riverColor, -20));
  riverGrad.addColorStop(0.4, theme.riverColor);
  riverGrad.addColorStop(0.5, adjustHex(theme.riverColor, 30));
  riverGrad.addColorStop(0.6, theme.riverColor);
  riverGrad.addColorStop(0.85, adjustHex(theme.riverColor, -20));
  riverGrad.addColorStop(1, adjustHex(theme.riverColor, -45));
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = riverGrad;
  ctx.fillRect(0, riverTop, width, RIVER_H);
  ctx.globalAlpha = 1;

  // River shimmer
  drawRiverShimmer(ctx, theme.riverColor, width, riverTop, RIVER_H);

  // River bank edges (raised stone/dirt)
  ctx.fillStyle = adjustHex(theme.bridgeColor, -5);
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, riverTop - 5, width, 7);
  ctx.fillRect(0, riverBot - 2, width, 7);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, riverTop - 5, width, 3);
  ctx.fillRect(0, riverBot + 3, width, 3);
  ctx.globalAlpha = 1;

  // 7 — Bridges
  drawBridge(ctx, theme, LBX, riverTop, BRIDGE_W, RIVER_H);
  drawBridge(ctx, theme, RBX, riverTop, BRIDGE_W, RIVER_H);

  // 8 — Tower placement pads
  const enemyColor = theme.topZoneColor;
  const playerColor = theme.bottomZoneColor;
  drawTowerPad(ctx, width * 0.244, 145, enemyColor, false);
  drawTowerPad(ctx, width * 0.656, 145, enemyColor, false);
  drawTowerPad(ctx, width * 0.45, 80, enemyColor, true);
  drawTowerPad(ctx, width * 0.244, height - 150, playerColor, false);
  drawTowerPad(ctx, width * 0.656, height - 150, playerColor, false);
  drawTowerPad(ctx, width * 0.45, height - 82, playerColor, true);

  // 9 — Center dividing line (subtle, like CR mid-line)
  ctx.strokeStyle = hexToRgba(theme.bridgeColor, 0.18);
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(LBX - BRIDGE_W / 2 - 2, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(LBX + BRIDGE_W / 2 + 2, centerY);
  ctx.lineTo(RBX - BRIDGE_W / 2 - 2, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(RBX + BRIDGE_W / 2 + 2, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 10 — Outer atmosphere (border frame + margin)
  drawOuterAtmosphere(ctx, theme, width, height);

  // 11 — Theme-specific ambient decorations
  drawThemeAmbience(ctx, theme, width, height, riverTop, riverBot);

  // 12 — Final vignette
  drawVignette(ctx, width, height);
}
