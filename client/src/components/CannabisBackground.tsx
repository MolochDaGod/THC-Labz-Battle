import { memo, useMemo } from 'react';

const BUD_SRCS = [
  '/card-art/weed-leaf.png',
  '/budz-token.png',
  '/card-art/weed-leaf.png',
  '/budz-token.png',
];

const CHAR_SRCS = [
  '/card-art/ursus-cosmic-budlord.png',
  '/card-art/kush-ranger.png',
];

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function CannabisBackground() {
  const { buds, smokes, chars } = useMemo(() => {
    const rng = seededRng(0xdeadc0de);
    const r  = (min: number, max: number) => min + rng() * (max - min);
    const ri = (min: number, max: number) => Math.floor(r(min, max + 0.99));

    const buds = Array.from({ length: 10 }, (_, i) => {
      const size  = 16 + Math.pow(rng(), 2) * 44;
      const ratio = (size - 16) / 44;
      const dur   = (14 - ratio * 4 + r(0, 3)).toFixed(1);
      const delay = (-r(0, parseFloat(dur))).toFixed(2);
      return {
        size:   Math.round(size),
        left:   r(2, 94).toFixed(1),
        dur,
        delay,
        rot:    ri(-300, 300),
        drift:  ri(-60, 80),
        src:    BUD_SRCS[i % BUD_SRCS.length],
        zIndex: 3,
      };
    });

    const smokes = Array.from({ length: 4 }, (_, i) => {
      const size   = ri(220, 480);
      const dur    = ri(25, 50);
      const delay  = (-r(0, dur)).toFixed(1);
      const colors = ['255,255,255', '220,255,220', '255,255,220', '240,240,255'];
      return {
        size,
        left:  r(-5, 78).toFixed(1),
        top:   r(-5, 78).toFixed(1),
        dur,
        delay,
        dx:    ri(-250, 250),
        dy:    ri(-250, 250),
        maxOp: r(0.04, 0.09).toFixed(3),
        color: colors[i % colors.length],
      };
    });

    const chars = Array.from({ length: 2 }, (_, i) => {
      const size  = ri(150, 210);
      const left  = [18, 72][i];
      const exitX = left > 50 ? 180 : -180;
      const dur   = ri(30, 42);
      const delay = (i * 14 + r(0, 6)).toFixed(1);
      return { size, left, exitX, dur, delay, src: CHAR_SRCS[i % CHAR_SRCS.length] };
    });

    return { buds, smokes, chars };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        isolation: 'isolate',
        contain: 'strict',
      }}
    >
      {/* Base background */}
      <img
        src="/thc-clash-bg.png"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          transform: 'translateZ(0)',
        }}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Dark vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)',
        zIndex: 1,
      }} />

      {/* Smoke puffs */}
      {smokes.map((s, i) => (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            width: s.size, height: s.size,
            left: `${s.left}%`, top: `${s.top}%`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${s.color},0.85) 0%, transparent 70%)`,
            zIndex: 2,
            animation: `thc-smoke-drift ${s.dur}s ease-in-out ${s.delay}s infinite`,
            ['--max-op' as any]: s.maxOp,
            ['--dx' as any]: `${s.dx}px`,
            ['--dy' as any]: `${s.dy}px`,
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Falling buds */}
      {buds.map((b, i) => (
        <div
          key={`b${i}`}
          style={{
            position: 'absolute',
            width: b.size, height: b.size,
            left: `${b.left}%`,
            top: 0,
            backgroundImage: `url(${b.src})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: b.zIndex,
            animation: `thc-bud-fall ${b.dur}s linear ${b.delay}s infinite`,
            ['--rot' as any]: `${b.rot}deg`,
            ['--drift' as any]: `${b.drift}px`,
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Character pop-ups — rare appearances */}
      {chars.map((c, i) => (
        <div
          key={`c${i}`}
          style={{
            position: 'absolute',
            width: c.size, height: c.size,
            left: `${c.left}%`,
            bottom: 0,
            marginLeft: -c.size / 2,
            backgroundImage: `url(${c.src})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center bottom',
            filter: 'drop-shadow(0 0 10px rgba(57,255,20,0.45))',
            zIndex: 6,
            animation: `thc-char-pop ${c.dur}s ease-in-out ${c.delay}s infinite`,
            ['--exit-x' as any]: `${c.exitX}px`,
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Logo watermark */}
      <img
        src="/thc-labz-logo-nowords.png"
        alt=""
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) translateZ(0)',
          width: 220, height: 220,
          objectFit: 'contain',
          opacity: 0.07,
          zIndex: 1,
          filter: 'drop-shadow(0 0 18px rgba(57,255,20,0.25))',
        }}
      />
    </div>
  );
}

export default memo(CannabisBackground, () => true);
