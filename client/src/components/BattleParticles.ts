/**
 * BattleParticles.ts — Phaser-inspired canvas particle & effects system
 *
 * Techniques drawn from Phaser 3's particle emitter, additive blend glow,
 * eased property tweens, and burst-emitter impact effects.
 */

// ── Easing ────────────────────────────────────────────────────────────────────
const easeOut3  = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn2   = (t: number) => t * t;
const sinePulse = (t: number, speed: number) => 0.5 + 0.5 * Math.sin(t * speed);

// ── UNIT AURAS ────────────────────────────────────────────────────────────────

/** Phaser-style orbiting particle ring + additive glow disk for magical units */
export function drawMagicalAura(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Soft pulsing underbelly disk
  const pulse = 0.14 + 0.06 * Math.sin(t * 0.003);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r + 12);
  g.addColorStop(0,   `rgba(160, 32, 240, ${pulse})`);
  g.addColorStop(0.5, `rgba(100, 0, 200, ${pulse * 0.5})`);
  g.addColorStop(1,   'rgba(80, 0, 160, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r + 12, 0, Math.PI * 2);
  ctx.fill();

  // 6 orbiting dot particles (Phaser particle emitter orbit pattern)
  const ORBIT_R = r + 8;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * 0.0022;
    const px = x + Math.cos(angle) * ORBIT_R;
    const py = y + Math.sin(angle) * ORBIT_R;
    const bright = 0.5 + 0.5 * Math.sin(i * 1.05 + t * 0.004);

    const gp = ctx.createRadialGradient(px, py, 0, px, py, 5);
    gp.addColorStop(0, `rgba(230, 170, 255, ${bright})`);
    gp.addColorStop(1, 'rgba(148, 0, 211, 0)');
    ctx.fillStyle = gp;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/** Thin golden halo with 4 reticle tick marks for ranged units */
export function drawRangedAura(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save();
  const alpha = 0.22 + 0.12 * Math.sin(t * 0.0035);

  // Outer halo ring
  ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r + 7, 0, Math.PI * 2);
  ctx.stroke();

  // 4 tick marks at cardinal angles
  ctx.strokeStyle = `rgba(255, 215, 0, ${alpha + 0.25})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const i1 = r + 4, i2 = r + 10;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * i1, y + Math.sin(a) * i1);
    ctx.lineTo(x + Math.cos(a) * i2, y + Math.sin(a) * i2);
    ctx.stroke();
  }

  ctx.restore();
}

/** Heavy blue pulsing ring with 4 corner block accents for tank units */
export function drawTankAura(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save();
  const pulse = 0.55 + 0.3 * Math.sin(t * 0.002);

  // Main shield ring
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(65, 105, 225, 0.85)';
  ctx.strokeStyle = `rgba(65, 105, 225, ${pulse})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4 corner block accents
  ctx.fillStyle = `rgba(100, 149, 237, ${pulse})`;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const ax = x + Math.cos(a) * (r + 6);
    const ay = y + Math.sin(a) * (r + 6);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a);
    ctx.fillRect(-3.5, -1.5, 7, 3);
    ctx.restore();
  }

  ctx.restore();
}

/** Soft amber breathing glow disk for tower/building cards */
export function drawTowerAura(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const pulse = 0.08 + 0.05 * Math.sin(t * 0.0014);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r + 16);
  g.addColorStop(0,   `rgba(255, 165, 0, ${pulse})`);
  g.addColorStop(0.5, `rgba(255, 90, 0, ${pulse * 0.55})`);
  g.addColorStop(1,   'rgba(200, 40, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r + 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── HIT IMPACT EFFECTS ────────────────────────────────────────────────────────

/** Melee slash: two overlapping arc paths with flying debris sparks */
export function drawMeleeHit(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, maxFrame: number) {
  const t = frame / maxFrame;
  const alpha = 1 - easeIn2(t);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  // Two overlapping slash arcs (offset angle + radius)
  for (let s = 0; s < 2; s++) {
    const baseAngle = -0.7 + t * 0.9 + s * 0.38;
    const radius = 11 + s * 4 + t * 9;
    const a = alpha * (s === 0 ? 1 : 0.55);

    ctx.strokeStyle = `rgba(255, ${210 - s * 55}, 40, ${a})`;
    ctx.lineWidth = 4.5 - t * 3 - s * 0.5;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 14 * alpha;
    ctx.shadowColor = 'rgba(255, 160, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, radius, baseAngle - 0.62, baseAngle + 0.62);
    ctx.stroke();
  }

  // 6 debris sparks fanning outward (Phaser burst emitter style)
  for (let i = 0; i < 6; i++) {
    const sa = (i / 6) * Math.PI * 2 + 0.3;
    const dist = (13 + i * 2.5) * easeOut3(t);
    const a = alpha * 0.85;
    const sx = Math.cos(sa) * dist;
    const sy = Math.sin(sa) * dist;

    ctx.fillStyle = `rgba(255, ${190 + i * 8}, 50, ${a})`;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(255, 140, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(sx, sy, 1.8 + (1 - t) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/** Ranged impact: 8-spike starburst + quick white flash disk */
export function drawRangedHit(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, maxFrame: number, isPlayer: boolean) {
  const t = frame / maxFrame;
  const alpha = 1 - t;
  const c = isPlayer ? [255, 215, 0] : [255, 80, 80];

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  // 8 radial spikes of alternating lengths (Phaser burst emitter)
  const SPIKES = 8;
  for (let i = 0; i < SPIKES; i++) {
    const a = (i / SPIKES) * Math.PI * 2;
    const len = (7 + (i % 2) * 5) * easeOut3(t);

    ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 5 * alpha;
    ctx.shadowColor = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.9)`;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }

  // White flash disk — fades in first 25% of lifetime
  if (t < 0.25) {
    const flashA = (1 - t / 0.25) * 0.45;
    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    fg.addColorStop(0, `rgba(255, 255, 255, ${flashA})`);
    fg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/** Magical impact: expanding shockwave rings + 6 spiraling out particles */
export function drawMagicalHit(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, maxFrame: number, isPlayer: boolean) {
  const t = frame / maxFrame;
  const alpha = 1 - easeIn2(t);
  const c = isPlayer ? [148, 0, 211] : [220, 20, 60];

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  // Primary shockwave ring
  const r1 = 7 + t * 22;
  ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha * 0.9})`;
  ctx.lineWidth = 3.5 - t * 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r1, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary inner ring (faster expand)
  const r2 = 3 + t * 13;
  ctx.strokeStyle = `rgba(210, 120, 255, ${alpha * 0.55})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r2, 0, Math.PI * 2);
  ctx.stroke();

  // 6 dots spiral outward (Phaser orbit → outward tween)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * Math.PI;
    const dist = 4 + t * 20;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 3.5);
    dg.addColorStop(0, `rgba(230, 190, 255, ${alpha * 0.85})`);
    dg.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── SPELL / AOE ANIMATIONS ────────────────────────────────────────────────────

/**
 * Blizzard AOE — icy ground disk + frost ring + 16 real snowflake particles.
 * Snowflakes are deterministic (seeded) so they don't re-randomise each frame.
 */
export function drawBlizzardAOE(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, frame: number, maxFrame: number) {
  const t = frame / maxFrame;
  const alpha = Math.sin(t * Math.PI);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Icy ground disk
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0,   `rgba(160, 230, 255, ${alpha * 0.16})`);
  g.addColorStop(0.5, `rgba(80, 160, 240, ${alpha * 0.08})`);
  g.addColorStop(1,   'rgba(0, 80, 200, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Expanding frost ring
  ctx.strokeStyle = `rgba(190, 235, 255, ${alpha * 0.55})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.65 + t * 0.35), 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';

  // Snowflake particles — seeded positions for determinism
  const FLAKES = 18;
  for (let i = 0; i < FLAKES; i++) {
    // Cheap pseudo-random from index seed
    const s1 = (i * 7919 + 1) % 1000 / 1000;
    const s2 = (i * 3571 + 2) % 1000 / 1000;
    const s3 = (i * 2311 + 3) % 1000 / 1000;
    const s4 = (i * 6421 + 5) % 1000 / 1000;

    // Base position (fixed per flake, within radius)
    const baseAngle = s1 * Math.PI * 2;
    const baseDist  = radius * (0.1 + s2 * 0.82);
    const fx = x + Math.cos(baseAngle) * baseDist;
    // Drift downward relative to frame
    const fy = y + Math.sin(baseAngle) * baseDist + frame * (0.6 + s3 * 0.6);

    const fAlpha = alpha * (0.35 + s4 * 0.45);
    const fSize  = 2 + s3 * 2.5;
    const rot    = (s1 * Math.PI * 2) + frame * 0.04 * (s2 > 0.5 ? 1 : -1);

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.strokeStyle = `rgba(210, 240, 255, ${fAlpha})`;
    ctx.lineWidth   = 0.9;

    // 6-spoke snowflake with one set of side branches
    for (let sp = 0; sp < 6; sp++) {
      const a = (sp / 6) * Math.PI * 2;
      const ex = Math.cos(a) * fSize;
      const ey = Math.sin(a) * fSize;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Branch
      const bx = Math.cos(a) * fSize * 0.5;
      const by = Math.sin(a) * fSize * 0.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a + Math.PI * 0.35) * fSize * 0.3,
                 by + Math.sin(a + Math.PI * 0.35) * fSize * 0.3);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

/** Fire / explosion AOE — hot ground disk + rising ember particles */
export function drawFireAOE(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, frame: number, maxFrame: number) {
  const t = frame / maxFrame;
  const alpha = Math.sin(t * Math.PI);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0,   `rgba(255, 130, 0, ${alpha * 0.22})`);
  g.addColorStop(0.5, `rgba(255, 50, 0, ${alpha * 0.1})`);
  g.addColorStop(1,   'rgba(180, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Expanding heat ring
  ctx.strokeStyle = `rgba(255, 160, 0, ${alpha * 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.6 + t * 0.4), 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';

  // Ember particles rising
  const EMBERS = 20;
  for (let i = 0; i < EMBERS; i++) {
    const s1 = (i * 6421 + 1) % 1000 / 1000;
    const s2 = (i * 7919 + 2) % 1000 / 1000;
    const s3 = (i * 3137 + 4) % 1000 / 1000;

    const baseAngle = s1 * Math.PI * 2;
    const baseDist  = radius * (0.05 + s2 * 0.85);
    const fx = x + Math.cos(baseAngle) * baseDist;
    const fy = y + Math.sin(baseAngle) * baseDist - frame * (0.8 + s3 * 0.9);

    const fAlpha = alpha * (0.4 + s3 * 0.4);
    const fSize  = 1 + s2 * 2;

    ctx.shadowBlur = 5;
    ctx.shadowColor = `rgba(255, 100, 0, 0.7)`;
    ctx.fillStyle = `rgba(255, ${80 + Math.floor(s3 * 130)}, 0, ${fAlpha})`;
    ctx.beginPath();
    ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Generic AOE ring + fade — used for duration-type spells (poison, stun etc.)
 * Colour-matches the spell's effect colour.
 */
export function drawGenericAOE(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, frame: number, maxFrame: number, r: number, g: number, b: number) {
  const t = frame / maxFrame;
  const alpha = Math.sin(t * Math.PI);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grd.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.14})`);
  grd.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.7 + t * 0.3), 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── PROJECTILE VISUALS ────────────────────────────────────────────────────────

/** Magical projectile: glowing orb with 3 orbiting micro-particles */
export function drawMagicalProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, isPlayer: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const c = isPlayer ? [148, 0, 211] : [220, 20, 60];

  // Core glow orb
  const og = ctx.createRadialGradient(x, y, 0, x, y, 10);
  og.addColorStop(0,   'rgba(255, 255, 255, 0.95)');
  og.addColorStop(0.3, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.85)`);
  og.addColorStop(1,   `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();

  // 3 orbiting micro particles
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + t * 0.18;
    const ox = x + Math.cos(angle) * 8;
    const oy = y + Math.sin(angle) * 8;
    ctx.fillStyle = `rgba(210, 160, 255, 0.65)`;
    ctx.beginPath();
    ctx.arc(ox, oy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/**
 * Ranged projectile: tapered gradient trail + bright arrowhead dot.
 * prevX/prevY = previous frame position for trail direction.
 */
export function drawRangedProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, prevX: number, prevY: number, isPlayer: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const c = isPlayer ? [255, 215, 0] : [255, 90, 80];
  const dx = x - prevX, dy = y - prevY;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len > 1) {
    // Tapered trail: transparent at tail → white at head
    const tr = ctx.createLinearGradient(prevX, prevY, x, y);
    tr.addColorStop(0,   `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
    tr.addColorStop(0.6, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.35)`);
    tr.addColorStop(1,   'rgba(255, 255, 255, 0.9)');
    ctx.strokeStyle = tr;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // Bright arrowhead glow dot
  const ag = ctx.createRadialGradient(x, y, 0, x, y, 6);
  ag.addColorStop(0, 'rgba(255, 255, 255, 1)');
  ag.addColorStop(0.4, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.8)`);
  ag.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/** Melee impact shockwave for close-range hits at the target position */
export function drawMeleeProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, isPlayer: boolean) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const c = isPlayer ? [50, 255, 50] : [255, 80, 80];
  const pulse = sinePulse(t, 0.25);

  const mg = ctx.createRadialGradient(x, y, 0, x, y, 7 + pulse * 3);
  mg.addColorStop(0, `rgba(255, 255, 255, 0.8)`);
  mg.addColorStop(0.5, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.6)`);
  mg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(x, y, 7 + pulse * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── SPELL CAST ANIMATION ──────────────────────────────────────────────────────

/**
 * Replaces the old "spinning emoji + gold arc" with a proper Phaser-style
 * expanding rune circle burst.
 *
 * color: hex string like '#9400D3', '#FF6600', '#00AAFF'
 */
export function drawSpellCast(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, maxFrame: number, colorR: number, colorG: number, colorB: number) {
  const t = frame / maxFrame;
  const alpha = 1 - easeIn2(t);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  // Primary expanding ring
  const r1 = 6 + t * 28;
  ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha * 0.9})`;
  ctx.lineWidth = 3 - t * 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r1, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary delayed ring
  const r2 = 4 + t * 18;
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r2, 0, Math.PI * 2);
  ctx.stroke();

  // 8 rotating rune spokes
  const SPOKES = 8;
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2 + t * Math.PI * 1.5;
    const spokeLen = (6 + t * 12) * alpha;
    ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha * 0.6})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r2 * 0.6, Math.sin(a) * r2 * 0.6);
    ctx.lineTo(Math.cos(a) * (r2 * 0.6 + spokeLen), Math.sin(a) * (r2 * 0.6 + spokeLen));
    ctx.stroke();
  }

  // Central bright flash (early frames only)
  if (t < 0.3) {
    const fa = (1 - t / 0.3) * 0.6;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
    cg.addColorStop(0, `rgba(255, 255, 255, ${fa})`);
    cg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ── TOWER PROJECTILE ──────────────────────────────────────────────────────────

/** Clean glowing orb tower shot — replaces the plain gradient circle */
export function drawTowerShot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Parse hex color to rgb (fallback to gold)
  let r = 255, g = 200, b = 0;
  try {
    if (color.startsWith('#') && color.length >= 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
  } catch (_) {}

  const pulse = 0.7 + 0.3 * Math.sin(t * 0.3);

  const og = ctx.createRadialGradient(x, y, 0, x, y, 11 * pulse);
  og.addColorStop(0,   'rgba(255, 255, 255, 0.95)');
  og.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.85)`);
  og.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.arc(x, y, 11 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Small trailing glow comet tail
  const tailLen = 12;
  const tg = ctx.createRadialGradient(x, y, 2, x, y, tailLen);
  tg.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
  tg.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.arc(x, y, tailLen, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
