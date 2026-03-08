import React, { useRef, useEffect, useState } from 'react';

interface AttackEffect {
  id: string;
  type: 'projectile' | 'spell' | 'explosion' | 'healing';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  color: string;
  size: number;
  duration: number;
  timestamp: number;
}

interface AttackEffectsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  effects: AttackEffect[];
  onEffectComplete: (effectId: string) => void;
}

export const AttackEffects: React.FC<AttackEffectsProps> = ({
  canvasRef,
  effects,
  onEffectComplete
}) => {
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentTime = Date.now();
      
      effects.forEach(effect => {
        const elapsed = currentTime - effect.timestamp;
        const progress = Math.min(elapsed / effect.duration, 1);
        
        if (progress >= 1) {
          onEffectComplete(effect.id);
          return;
        }
        
        drawEffect(ctx, effect, progress);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [effects, onEffectComplete, canvasRef]);

  const drawEffect = (ctx: CanvasRenderingContext2D, effect: AttackEffect, progress: number) => {
    const currentX = effect.startX + (effect.endX - effect.startX) * progress;
    const currentY = effect.startY + (effect.endY - effect.startY) * progress;
    
    ctx.save();
    
    switch (effect.type) {
      case 'projectile':
        drawProjectile(ctx, currentX, currentY, effect, progress);
        break;
      case 'spell':
        drawSpell(ctx, currentX, currentY, effect, progress);
        break;
      case 'explosion':
        drawExplosion(ctx, currentX, currentY, effect, progress);
        break;
      case 'healing':
        drawHealing(ctx, currentX, currentY, effect, progress);
        break;
    }
    
    ctx.restore();
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, x: number, y: number, effect: AttackEffect, progress: number) => {
    // Draw projectile trail
    const trailLength = 20;
    const trailOpacity = 0.6 * (1 - progress);
    
    ctx.globalAlpha = trailOpacity;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.size / 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x - trailLength, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Draw projectile
    ctx.globalAlpha = 1;
    ctx.fillStyle = effect.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = effect.color;
    
    ctx.beginPath();
    ctx.arc(x, y, effect.size, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSpell = (ctx: CanvasRenderingContext2D, x: number, y: number, effect: AttackEffect, progress: number) => {
    // Cannabis-themed spell effect
    const radius = effect.size * (1 + progress * 2);
    const particles = 8;
    
    ctx.globalAlpha = 0.8 * (1 - progress);
    
    for (let i = 0; i < particles; i++) {
      const angle = (i / particles) * Math.PI * 2 + progress * Math.PI * 4;
      const particleX = x + Math.cos(angle) * radius;
      const particleY = y + Math.sin(angle) * radius;
      
      // Draw cannabis leaf particles
      ctx.fillStyle = '#4CAF50';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#4CAF50';
      
      ctx.save();
      ctx.translate(particleX, particleY);
      ctx.rotate(angle);
      
      // Simple leaf shape
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    // Central glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, effect.size);
    gradient.addColorStop(0, `rgba(76, 175, 80, ${0.8 * (1 - progress)})`);
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, effect.size * 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, x: number, y: number, effect: AttackEffect, progress: number) => {
    const maxRadius = effect.size * 3;
    const currentRadius = maxRadius * progress;
    const opacity = 1 - progress;
    
    // Outer explosion ring
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 8;
    ctx.shadowBlur = 15;
    ctx.shadowColor = effect.color;
    
    ctx.beginPath();
    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner flash
    if (progress < 0.3) {
      const flashIntensity = 1 - (progress / 0.3);
      ctx.globalAlpha = flashIntensity;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, effect.color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Explosion particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = currentRadius * 0.8;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      ctx.globalAlpha = opacity * 0.7;
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawHealing = (ctx: CanvasRenderingContext2D, x: number, y: number, effect: AttackEffect, progress: number) => {
    // Rising healing particles
    const particleCount = 6;
    const riseHeight = 40 * progress;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const offset = 15;
      const particleX = x + Math.cos(angle) * offset;
      const particleY = y - riseHeight + Math.sin(progress * Math.PI * 4) * 5;
      
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = '#4CAF50';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#4CAF50';
      
      // Draw plus sign for healing
      ctx.fillRect(particleX - 4, particleY - 1, 8, 3);
      ctx.fillRect(particleX - 1, particleY - 4, 3, 8);
    }
    
    // Healing aura
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, effect.size * 2);
    gradient.addColorStop(0, `rgba(76, 175, 80, ${0.3 * (1 - progress)})`);
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, effect.size * 2, 0, Math.PI * 2);
    ctx.fill();
  };

  return null; // This component only draws on the canvas
};

// Helper function to create attack effects
export const createAttackEffect = (
  type: AttackEffect['type'],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string = '#FF6B35',
  size: number = 8,
  duration: number = 1000
): AttackEffect => ({
  id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  startX,
  startY,
  endX,
  endY,
  progress: 0,
  color,
  size,
  duration,
  timestamp: Date.now()
});

export default AttackEffects;