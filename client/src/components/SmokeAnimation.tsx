import React, { useState, useEffect } from 'react';

interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  scale: number;
}

interface SmokeAnimationProps {
  onComplete?: () => void;
}

export function SmokeAnimation({ onComplete }: SmokeAnimationProps) {
  const [particles, setParticles] = useState<SmokeParticle[]>([]);

  useEffect(() => {
    // Animation loop
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          opacity: Math.max(0, particle.opacity - 0.02),
          scale: particle.scale + 0.02,
          velocityY: particle.velocityY - 0.1, // gravity effect
        })).filter(particle => particle.opacity > 0);

        // Remove animation when all particles are gone
        if (updatedParticles.length === 0 && prevParticles.length > 0) {
          onComplete?.();
        }

        return updatedParticles;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gray-400"
          style={{
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            transform: `scale(${particle.scale})`,
            transition: 'transform 0.1s ease-out',
            boxShadow: '0 0 10px rgba(128, 128, 128, 0.5)',
            background: `radial-gradient(circle, rgba(200, 200, 200, ${particle.opacity}) 0%, rgba(128, 128, 128, ${particle.opacity * 0.5}) 70%, transparent 100%)`,
          }}
        />
      ))}
    </div>
  );
}

// Hook for managing smoke effects
export function useSmokeEffect() {
  const [smokeEffects, setSmokeEffects] = useState<{ id: number; x: number; y: number; intensity: number }[]>([]);

  const createSmokeEffect = (x: number, y: number, intensity: number = 1) => {
    const id = Date.now() + Math.random();
    setSmokeEffects(prev => [...prev, { id, x, y, intensity }]);
  };

  const removeSmokeEffect = (id: number) => {
    setSmokeEffects(prev => prev.filter(effect => effect.id !== id));
  };

  return {
    smokeEffects,
    createSmokeEffect,
    removeSmokeEffect,
  };
}

// Individual smoke effect component
interface SmokeEffectProps {
  x: number;
  y: number;
  intensity: number;
  onComplete: () => void;
}

export function SmokeEffect({ x, y, intensity, onComplete }: SmokeEffectProps) {
  const [particles, setParticles] = useState<SmokeParticle[]>([]);
  const [time, setTime] = useState(0);

  useEffect(() => {
    // Generate more particles for wispy effect
    const particleCount = Math.max(8, Math.min(25, intensity * 8));
    const newParticles: SmokeParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 10,
        size: Math.random() * (intensity * 6) + 4,
        opacity: Math.random() * 0.6 + 0.3,
        velocityX: (Math.random() - 0.5) * 1.5,
        velocityY: -Math.random() * 2.5 - 0.5,
        scale: Math.random() * 0.5 + 0.8,
      });
    }

    setParticles(newParticles);
  }, [x, y, intensity]);

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setTime(prevTime => prevTime + 1);
      
      setParticles(prevParticles => {
        const updatedParticles = prevParticles.map((particle, index) => {
          // Add swirling motion with time-based sine waves
          const swirl = Math.sin((time + index) * 0.1) * 0.3;
          const drift = Math.cos((time + index) * 0.08) * 0.2;
          
          return {
            ...particle,
            x: particle.x + particle.velocityX + swirl,
            y: particle.y + particle.velocityY,
            opacity: Math.max(0, particle.opacity - (0.015 + Math.random() * 0.01)),
            scale: particle.scale + 0.025,
            velocityY: particle.velocityY - 0.03, // lighter gravity
            velocityX: particle.velocityX * 0.99 + drift, // air currents
          };
        }).filter(particle => particle.opacity > 0.05);

        if (updatedParticles.length === 0) {
          onComplete();
        }

        return updatedParticles;
      });
    }, 50); // Slightly faster for smoother animation

    return () => clearInterval(interval);
  }, [particles.length, onComplete, time]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map((particle, index) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            transform: `scale(${particle.scale}) rotate(${time * 2 + index * 10}deg)`,
            background: `radial-gradient(ellipse 120% 80%, rgba(240, 240, 240, ${particle.opacity * 0.8}) 0%, rgba(200, 200, 200, ${particle.opacity * 0.6}) 30%, rgba(150, 150, 150, ${particle.opacity * 0.4}) 60%, rgba(120, 120, 120, ${particle.opacity * 0.2}) 80%, transparent 100%)`,
            borderRadius: '60% 40% 70% 30%',
            filter: `blur(${Math.min(2, particle.scale * 1.5)}px)`,
            mixBlendMode: 'multiply',
            animation: `smokeWisp ${3 + Math.random() * 2}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}