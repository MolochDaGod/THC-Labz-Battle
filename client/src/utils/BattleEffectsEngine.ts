/**
 * BattleEffectsEngine
 * Standalone canvas-based visual effects engine for THC CLASH battles.
 * Runs on a dedicated transparent canvas overlay — zero impact on game logic.
 *
 * Design: pure TypeScript class, no React, no external libs.
 * Instantiate once, call emit*() from game events, call render() every frame.
 */

type EffectKind =
  | 'slash'
  | 'magic_shot'
  | 'arrow'
  | 'impact'
  | 'aoe_ring'
  | 'death_burst'
  | 'deploy_stamp'
  | 'damage_number'
  | 'heal_number'
  | 'tower_beam'
  | 'magic_charge'
  | 'status_burn'
  | 'status_freeze'
  | 'ability_rune';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
}

interface Effect {
  id: number;
  kind: EffectKind;
  x: number; y: number;
  tx?: number; ty?: number;    // target position (directional effects)
  t0: number;                  // start timestamp (ms)
  dur: number;                 // total duration (ms)
  color: string;
  val?: number;                // numeric value (damage, heal)
  isCrit?: boolean;
  particles?: Particle[];
  angle?: number;              // computed angle to target
}

let nextId = 0;

// ─── Particle helpers ─────────────────────────────────────────────────────────

function radialParticles(
  x: number, y: number,
  count: number,
  speed: number,
  size: number,
  color: string,
  life: number
): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const s = speed * (0.6 + Math.random() * 0.8);
    return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, maxLife: life, size: size * (0.7 + Math.random() * 0.6), color };
  });
}

function coneParticles(
  x: number, y: number,
  angle: number,
  spread: number,
  count: number,
  speed: number,
  size: number,
  color: string,
  life: number
): Particle[] {
  return Array.from({ length: count }, () => {
    const a = angle + (Math.random() - 0.5) * spread;
    const s = speed * (0.5 + Math.random());
    return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, maxLife: life, size, color };
  });
}

// ─── Main engine class ────────────────────────────────────────────────────────

export class BattleEffectsEngine {
  private effects: Effect[] = [];
  private _raf = 0;

  // ── Emit API ───────────────────────────────────────────────────────────────

  /** Melee/tank slash swing at attacker (x,y) toward (tx,ty) */
  emitSlash(x: number, y: number, tx: number, ty: number, color = '#fff') {
    const angle = Math.atan2(ty - y, tx - x);
    this.effects.push({ id: nextId++, kind: 'slash', x, y, tx, ty, angle, t0: Date.now(), dur: 420, color });
  }

  /** Magical projectile from (x,y) to (tx,ty) */
  emitMagicShot(x: number, y: number, tx: number, ty: number, color = '#c084fc') {
    const angle = Math.atan2(ty - y, tx - x);
    this.effects.push({ id: nextId++, kind: 'magic_shot', x, y, tx, ty, angle, t0: Date.now(), dur: 550, color });
  }

  /** Ranged arrow/bullet from (x,y) to (tx,ty) */
  emitArrow(x: number, y: number, tx: number, ty: number, color = '#fbbf24') {
    const angle = Math.atan2(ty - y, tx - x);
    this.effects.push({ id: nextId++, kind: 'arrow', x, y, tx, ty, angle, t0: Date.now(), dur: 350, color });
  }

  /** Impact burst at (x,y) — hit sparks */
  emitImpact(x: number, y: number, color = '#ff6b6b', attackType?: string) {
    const c = attackType === 'magical' ? '#c084fc' : attackType === 'ranged' ? '#fbbf24' : color;
    const particles = radialParticles(x, y, 8, 3.5, 3, c, 380);
    this.effects.push({ id: nextId++, kind: 'impact', x, y, t0: Date.now(), dur: 450, color: c, particles });
  }

  /** AoE expanding ring centered at (x,y) */
  emitAoERing(x: number, y: number, radius: number, color = '#22c55e') {
    this.effects.push({ id: nextId++, kind: 'aoe_ring', x, y, t0: Date.now(), dur: 1300, color, val: radius });
  }

  /** Death explosion at (x,y) */
  emitDeath(x: number, y: number, color = '#ff8800') {
    const particles = radialParticles(x, y, 14, 5.5, 4, color, 750);
    this.effects.push({ id: nextId++, kind: 'death_burst', x, y, t0: Date.now(), dur: 800, color, particles });
  }

  /** Unit deploy landing stamp */
  emitDeploy(x: number, y: number, isPlayer: boolean) {
    const color = isPlayer ? '#22c55e' : '#ef4444';
    const particles = radialParticles(x, y, 10, 4, 3, color, 450);
    this.effects.push({ id: nextId++, kind: 'deploy_stamp', x, y, t0: Date.now(), dur: 600, color, particles });
  }

  /** Floating damage number */
  emitDamageNumber(x: number, y: number, value: number, isCrit = false, attackType?: string) {
    const color = attackType === 'magical' ? '#e879f9' : attackType === 'ranged' ? '#fbbf24' : '#ff5555';
    this.effects.push({ id: nextId++, kind: 'damage_number', x, y, t0: Date.now(), dur: isCrit ? 1100 : 850, color, val: value, isCrit });
  }

  /** Floating heal number */
  emitHealNumber(x: number, y: number, value: number) {
    this.effects.push({ id: nextId++, kind: 'heal_number', x, y, t0: Date.now(), dur: 800, color: '#22c55e', val: value });
  }

  /** Tower attack beam from tower (x,y) to target (tx,ty) */
  emitTowerBeam(x: number, y: number, tx: number, ty: number, color = '#facc15') {
    this.effects.push({ id: nextId++, kind: 'tower_beam', x, y, tx, ty, t0: Date.now(), dur: 280, color });
  }

  /** Caster ring charging effect (magical units pre-shot) */
  emitMagicCharge(x: number, y: number, color = '#c084fc') {
    this.effects.push({ id: nextId++, kind: 'magic_charge', x, y, t0: Date.now(), dur: 400, color });
  }

  /** Burn status around unit */
  emitStatusBurn(x: number, y: number) {
    const particles = coneParticles(x, y, -Math.PI / 2, Math.PI, 6, 2.5, 2.5, '#ff6600', 500);
    this.effects.push({ id: nextId++, kind: 'status_burn', x, y, t0: Date.now(), dur: 550, color: '#ff6600', particles });
  }

  /** Freeze status */
  emitStatusFreeze(x: number, y: number) {
    const particles = radialParticles(x, y, 6, 2, 2, '#7dd3fc', 500);
    this.effects.push({ id: nextId++, kind: 'status_freeze', x, y, t0: Date.now(), dur: 600, color: '#7dd3fc', particles });
  }

  /** Ability rune circle */
  emitAbilityRune(x: number, y: number, color = '#a855f7') {
    this.effects.push({ id: nextId++, kind: 'ability_rune', x, y, t0: Date.now(), dur: 900, color });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  /** Called every frame. Clears, draws all active effects, removes expired. */
  render(canvas: HTMLCanvasElement | null, now: number) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.effects = this.effects.filter(e => {
      const elapsed = now - e.t0;
      if (elapsed >= e.dur) return false;
      const p = elapsed / e.dur;  // progress 0 → 1
      this._drawEffect(ctx, e, p, elapsed);
      return true;
    });
  }

  /** Advance free particles */
  private _advanceParticles(e: Effect, dt: number) {
    if (!e.particles) return;
    for (const pt of e.particles) {
      pt.x  += pt.vx;
      pt.y  += pt.vy;
      pt.vy += 0.08; // gravity
      pt.life -= dt;
    }
    e.particles = e.particles.filter(pt => pt.life > 0);
  }

  private _drawEffect(ctx: CanvasRenderingContext2D, e: Effect, p: number, elapsed: number) {
    ctx.save();
    ctx.globalAlpha = 1;

    switch (e.kind) {
      case 'slash':          this._drawSlash(ctx, e, p); break;
      case 'magic_shot':     this._drawMagicShot(ctx, e, p); break;
      case 'arrow':          this._drawArrow(ctx, e, p); break;
      case 'impact':         this._drawImpact(ctx, e, p, elapsed); break;
      case 'aoe_ring':       this._drawAoERing(ctx, e, p); break;
      case 'death_burst':    this._drawDeathBurst(ctx, e, p, elapsed); break;
      case 'deploy_stamp':   this._drawDeployStamp(ctx, e, p, elapsed); break;
      case 'damage_number':  this._drawDamageNumber(ctx, e, p); break;
      case 'heal_number':    this._drawHealNumber(ctx, e, p); break;
      case 'tower_beam':     this._drawTowerBeam(ctx, e, p); break;
      case 'magic_charge':   this._drawMagicCharge(ctx, e, p); break;
      case 'status_burn':
      case 'status_freeze':  this._drawStatusEffect(ctx, e, p, elapsed); break;
      case 'ability_rune':   this._drawAbilityRune(ctx, e, p); break;
    }

    ctx.restore();
  }

  // ── Individual effect renderers ────────────────────────────────────────────

  private _drawSlash(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    const angle = e.angle ?? 0;
    const fadeAlpha = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
    const swingAngle = (p - 0.5) * Math.PI * 0.9;

    // Three arc swipes at slightly different offsets
    const configs = [
      { radOff: 0,   width: 4.5, alpha: 0.85, colorMix: 1 },
      { radOff: 6,   width: 3,   alpha: 0.55, colorMix: 0.7 },
      { radOff: -6,  width: 2,   alpha: 0.35, colorMix: 0.4 },
    ];

    for (const cfg of configs) {
      ctx.save();
      ctx.globalAlpha = fadeAlpha * cfg.alpha;
      ctx.translate(e.x, e.y);
      ctx.rotate(angle);

      const arcR = 30 + cfg.radOff;
      const startAngle = swingAngle - 0.65;
      const endAngle   = swingAngle + 0.65;

      const grad = ctx.createLinearGradient(-arcR, 0, arcR, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.4, e.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = grad;
      ctx.lineWidth = cfg.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, arcR, startAngle, endAngle);
      ctx.stroke();
      ctx.restore();
    }

    // Slash spark at tip
    if (p > 0.4 && p < 0.75) {
      const sparkP = (p - 0.4) / 0.35;
      const sx = e.x + Math.cos(angle + swingAngle) * 30;
      const sy = e.y + Math.sin(angle + swingAngle) * 30;
      ctx.globalAlpha = (1 - sparkP) * 0.9;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 * (1 - sparkP), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawMagicShot(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    if (e.tx === undefined || e.ty === undefined) return;
    const ox = e.x + (e.tx - e.x) * p;
    const oy = e.y + (e.ty - e.y) * p;

    // Trail
    const trailLen = 40;
    const angle = e.angle ?? 0;
    for (let i = 3; i > 0; i--) {
      const off = (i / 3) * trailLen;
      const tx2 = ox - Math.cos(angle) * off;
      const ty2 = oy - Math.sin(angle) * off;
      const a = (1 - i / 3) * 0.7 * Math.min(p * 5, 1) * (1 - Math.max(0, p - 0.8) / 0.2);
      ctx.globalAlpha = a;
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(tx2, ty2, 4 - i * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orb core
    const fade = Math.min(p * 5, 1) * (1 - Math.max(0, (p - 0.85) / 0.15));
    const pulseR = 6 + Math.sin(p * Math.PI * 8) * 1.5;
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, pulseR);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.35, e.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = fade;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, pulseR, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting sparks
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + p * Math.PI * 6;
      const sr = 10;
      const sx = ox + Math.cos(a) * sr;
      const sy = oy + Math.sin(a) * sr;
      ctx.globalAlpha = fade * 0.6;
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawArrow(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    if (e.tx === undefined || e.ty === undefined) return;
    const ox = e.x + (e.tx - e.x) * p;
    const oy = e.y + (e.ty - e.y) * p;
    const angle = e.angle ?? 0;
    const fade = Math.min(p * 4, 1) * (1 - Math.max(0, (p - 0.8) / 0.2));

    // Wind trail
    const tLen = 22;
    const tGrad = ctx.createLinearGradient(
      ox - Math.cos(angle) * tLen, oy - Math.sin(angle) * tLen,
      ox, oy
    );
    tGrad.addColorStop(0, 'rgba(251,191,36,0)');
    tGrad.addColorStop(1, e.color);
    ctx.globalAlpha = fade * 0.7;
    ctx.strokeStyle = tGrad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox - Math.cos(angle) * tLen, oy - Math.sin(angle) * tLen);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    // Arrowhead
    ctx.globalAlpha = fade;
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private _drawImpact(ctx: CanvasRenderingContext2D, e: Effect, p: number, elapsed: number) {
    const fade = 1 - p;
    const ringR = 6 + p * 28;

    // Ring
    ctx.globalAlpha = fade * 0.8;
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3 * fade;
    ctx.beginPath();
    ctx.arc(e.x, e.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner flash
    if (p < 0.3) {
      const ff = 1 - p / 0.3;
      ctx.globalAlpha = ff * 0.5;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 12);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    this._advanceParticles(e, 1);
    this._drawParticles(ctx, e);
  }

  private _drawAoERing(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    const maxR = e.val ?? 80;
    const radius = p < 0.15 ? (p / 0.15) * maxR : maxR;
    const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;

    // Filled inner
    ctx.globalAlpha = fade * 0.15;
    const fill = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius);
    fill.addColorStop(0, e.color);
    fill.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Dashed border
    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner second ring
    if (radius > 10) {
      ctx.globalAlpha = fade * 0.4;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.arc(e.x, e.y, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private _drawDeathBurst(ctx: CanvasRenderingContext2D, e: Effect, p: number, elapsed: number) {
    // Shockwave ring
    const fade = 1 - p;
    const ringR = p * 50;
    ctx.globalAlpha = fade * 0.6;
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 4 * fade;
    ctx.beginPath();
    ctx.arc(e.x, e.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner flash
    if (p < 0.25) {
      const ff = 1 - p / 0.25;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 20);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.4, e.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = ff * 0.7;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    this._advanceParticles(e, 1);
    this._drawParticles(ctx, e);
  }

  private _drawDeployStamp(ctx: CanvasRenderingContext2D, e: Effect, p: number, elapsed: number) {
    const r = p < 0.3 ? (p / 0.3) * 35 : 35 * (1 + (p - 0.3) * 0.3);
    const fade = p < 0.3 ? 1 : 1 - (p - 0.3) / 0.7;

    // Outer stamp ring
    ctx.globalAlpha = fade;
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3 * fade;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    ctx.globalAlpha = fade * 0.35;
    const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 0.7);
    g.addColorStop(0, e.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    this._advanceParticles(e, 1);
    this._drawParticles(ctx, e);
  }

  private _drawDamageNumber(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    const rise = p * 38;
    const wobble = Math.sin(p * 12) * (e.isCrit ? 4 : 2);
    const alpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
    const size  = e.isCrit ? 18 + (1 - p) * 4 : 14;
    const text  = e.val ? `-${Math.round(e.val)}` : '?';

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (e.isCrit) {
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 14;
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeText(text, e.x + wobble, e.y - rise);
    ctx.fillStyle = e.color;
    ctx.fillText(text, e.x + wobble, e.y - rise);

    if (e.isCrit) {
      ctx.globalAlpha = Math.max(0, alpha * 0.7);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText('CRIT!', e.x + wobble + 18, e.y - rise - 8);
    }
  }

  private _drawHealNumber(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    const rise = p * 30;
    const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
    const text  = e.val ? `+${Math.round(e.val)}` : '+HP';

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2.5;
    ctx.strokeText(text, e.x, e.y - rise);
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.fillText(text, e.x, e.y - rise);
  }

  private _drawTowerBeam(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    if (e.tx === undefined || e.ty === undefined) return;
    const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;

    ctx.globalAlpha = fade;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 20;

    // Core beam
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3.5 * fade;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.tx, e.ty);
    ctx.stroke();

    // Glow overlay
    ctx.globalAlpha = fade * 0.4;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5 * fade;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.tx, e.ty);
    ctx.stroke();

    // Muzzle flash at origin
    if (p < 0.3) {
      const ff = 1 - p / 0.3;
      ctx.globalAlpha = ff * 0.8;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 6 * ff, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact flash at target
    if (p < 0.4) {
      const ff = 1 - p / 0.4;
      ctx.globalAlpha = ff * 0.7;
      const g = ctx.createRadialGradient(e.tx, e.ty, 0, e.tx, e.ty, 14 * ff);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.5, e.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.tx, e.ty, 14 * ff, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawMagicCharge(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    const fade = p < 0.5 ? p * 2 : (1 - p) * 2;
    const ringR = 14 + p * 10;

    ctx.globalAlpha = fade * 0.7;
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + p * Math.PI * 4;
      const r = ringR - 4;
      ctx.globalAlpha = fade * 0.5;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawStatusEffect(ctx: CanvasRenderingContext2D, e: Effect, p: number, elapsed: number) {
    this._advanceParticles(e, 1);
    this._drawParticles(ctx, e);
  }

  private _drawAbilityRune(ctx: CanvasRenderingContext2D, e: Effect, p: number) {
    const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
    const scale = p < 0.3 ? p / 0.3 : 1 + (p - 0.3) * 0.3;
    const r = 20 * scale;

    // Rotating hexagon rune
    ctx.globalAlpha = fade;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(p * Math.PI * 2);
    ctx.strokeStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Inner ring
    ctx.globalAlpha = fade * 0.5;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  private _drawParticles(ctx: CanvasRenderingContext2D, e: Effect) {
    if (!e.particles) return;
    for (const pt of e.particles) {
      const a = pt.life / pt.maxLife;
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /** Remove all active effects (e.g. on battle end) */
  clear() { this.effects = []; }

  /** How many effects are currently active */
  get activeCount() { return this.effects.length; }
}
