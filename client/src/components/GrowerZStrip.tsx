import { memo, useMemo } from 'react';
import type { GrowerzUnitCard } from '../utils/GrowerzUnitSystem';

interface Props {
  cards: GrowerzUnitCard[];
}

const RARITY_GLOW: Record<string, string> = {
  Mythic: '#ff00ff',
  Epic: '#a855f7',
  Rare: '#60a5fa',
  Uncommon: '#22c55e',
  Common: '#9ca3af',
};

function GrowerZStrip({ cards }: Props) {
  const items = useMemo(() => {
    if (!cards.length) return [];
    const base = cards.slice(0, 12);
    return [...base, ...base];
  }, [cards]);

  if (!items.length) return null;

  const scrollDur = `${Math.max(16, items.length * 1.6)}s`;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: 96,
        marginBottom: 16,
        maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: 2, left: 12,
          zIndex: 10,
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.15em',
          color: '#39ff14',
          textShadow: '0 0 8px #39ff14',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          fontFamily: "'LEMON MILK', 'Orbitron', sans-serif",
        }}
      >
        YOUR GROWERZ
      </div>

      {/* Scrolling track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingTop: 16,
          width: 'max-content',
          animation: `growerz-scroll ${scrollDur} linear infinite`,
          willChange: 'transform',
        }}
      >
        {items.map((card, i) => {
          const glow = RARITY_GLOW[card.rarity] ?? '#9ca3af';
          return (
            <div
              key={`${card.id}-${i}`}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 72,
                height: 72,
                borderRadius: 12,
                border: `2px solid ${glow}66`,
                boxShadow: `0 0 10px 2px ${glow}33`,
                overflow: 'hidden',
                animation: `growerz-bob ${2 + (i % 5) * 0.3}s ease-in-out ${(i % 7) * 0.4}s infinite`,
              }}
            >
              <img
                src={card.image}
                alt={card.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
              {/* Rank badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 2, right: 2,
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: 4,
                  padding: '1px 4px',
                  fontSize: 8,
                  fontWeight: 700,
                  color: glow,
                  lineHeight: '12px',
                  fontFamily: "'LEMON MILK', monospace",
                }}
              >
                #{card.nftNumber}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(GrowerZStrip);
