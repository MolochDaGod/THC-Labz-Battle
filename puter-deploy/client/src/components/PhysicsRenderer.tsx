import React, { useEffect, useRef, useCallback } from 'react';
import { physicsEngine, PhysicsObject } from '../lib/physics';

interface PhysicsRendererProps {
  enabled: boolean;
  className?: string;
}

export const PhysicsRenderer: React.FC<PhysicsRendererProps> = ({ enabled, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const render = useCallback((ctx: CanvasRenderingContext2D, objects: PhysicsObject[]) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Render each physics object
    objects.forEach(obj => {
      ctx.save();
      
      // Set position
      ctx.translate(obj.position.x, obj.position.y);
      
      // Add rotation based on velocity for realism
      const rotation = Math.atan2(obj.velocity.y, obj.velocity.x);
      ctx.rotate(rotation);

      // Render based on material type
      switch (obj.material) {
        case 'money':
          renderMoney(ctx, obj);
          break;
        case 'drug':
          renderDrug(ctx, obj);
          break;
        default:
          renderDefault(ctx, obj);
          break;
      }
      
      ctx.restore();
    });
  }, []);

  const renderMoney = (ctx: CanvasRenderingContext2D, obj: PhysicsObject) => {
    const { radius } = obj;
    const scale = obj.scale || 1;
    
    // Apply rotation if available
    if (obj.rotation !== undefined) {
      ctx.rotate(obj.rotation);
    }
    
    // Apply scaling
    ctx.scale(scale, scale);
    
    // Enhanced money bill with glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6 * scale;
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    
    // Bill shape (rectangle)
    const width = radius * 2;
    const height = radius * 1.2;
    
    ctx.fillRect(-width/2, -height/2, width, height);
    ctx.strokeRect(-width/2, -height/2, width, height);
    
    // Dollar sign with enhanced styling
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('$', 0, 0);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText('$', 0, 0);
  };

  const renderDrug = (ctx: CanvasRenderingContext2D, obj: PhysicsObject) => {
    const { radius } = obj;
    
    // Drug bag appearance
    ctx.fillStyle = '#10b981'; // Emerald green
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    
    // Bag shape (rounded rectangle)
    const width = radius * 1.8;
    const height = radius * 1.4;
    
    ctx.beginPath();
    ctx.roundRect(-width/2, -height/2, width, height, radius * 0.3);
    ctx.fill();
    ctx.stroke();
    
    // Weed leaf emoji
    ctx.fillStyle = '#ffffff';
    ctx.font = `${radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍃', 0, 0);
  };

  const renderDefault = (ctx: CanvasRenderingContext2D, obj: PhysicsObject) => {
    const { radius } = obj;
    
    // Default circle
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  const animate = useCallback((currentTime: number) => {
    if (!enabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Calculate delta time
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    // Update physics
    physicsEngine.update(deltaTime);
    
    // Get all physics objects
    const objects = physicsEngine.getAllObjects();
    
    // Render objects
    render(ctx, objects);
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [enabled, render]);

  useEffect(() => {
    if (!enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start animation loop
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, animate]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-10 ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};

export default PhysicsRenderer;