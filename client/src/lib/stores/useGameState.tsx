import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { calculateTrajectory, checkSphereBoxCollision } from "../physics";
import { useAudio } from "./useAudio";

export type GamePhase = "ready" | "playing" | "ended";

interface Nugget {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  active: boolean;
  timeAlive: number;
  size: number;
  color: string;
  shape: 'round' | 'oval' | 'chunky';
  rotation: number;
  flushing: boolean;
  flushTime: number;
  flushToilet?: { x: number; z: number; points: number };
}

interface GameState {
  gamePhase: GamePhase;
  score: number;
  totalThrows: number;
  nuggets: Nugget[];
  power: number;
  aimDirection: [number, number, number];
  
  // Actions
  startGame: () => void;
  resetGame: () => void;
  endGame: () => void;
  throwNugget: () => void;
  updateNuggets: (delta: number) => void;
  checkCollisions: () => void;
  setPower: (power: number) => void;
  setAimDirection: (direction: [number, number, number]) => void;
}

export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    gamePhase: "ready",
    score: 0,
    totalThrows: 0,
    nuggets: [],
    power: 0,
    aimDirection: [0, 0, -1],
    
    startGame: () => {
      console.log("Starting game");
      set({
        gamePhase: "playing",
        score: 0,
        totalThrows: 0,
        nuggets: [],
        power: 0
      });
    },
    
    resetGame: () => {
      console.log("Resetting game");
      set({
        gamePhase: "ready",
        score: 0,
        totalThrows: 0,
        nuggets: [],
        power: 0
      });
    },
    
    endGame: () => {
      console.log("Ending game");
      set({ gamePhase: "ended" });
    },
    
    setPower: (power: number) => {
      set({ power: Math.max(0, Math.min(20, power)) });
    },
    
    setAimDirection: (direction: [number, number, number]) => {
      // Normalize the direction
      const length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]);
      if (length > 0) {
        set({
          aimDirection: [
            direction[0] / length,
            direction[1] / length,
            direction[2] / length
          ]
        });
      }
    },
    
    throwNugget: () => {
      const { power, aimDirection, totalThrows } = get();
      
      if (power < 1) return; // Minimum power required
      
      console.log(`Throwing nugget with power ${power}, direction:`, aimDirection);
      
      const nuggetId = `nugget-${Date.now()}`;
      const startPosition: [number, number, number] = [0, 1, 0]; // Start at bottom of screen
      
      // Create a proper throwing arc - translate aim direction to screen coordinates
      const throwSpeed = power * 3;
      const velocity: [number, number, number] = [
        aimDirection[0] * throwSpeed, // Left/right movement across screen
        throwSpeed * 0.5, // Upward arc
        aimDirection[2] * throwSpeed * 2 // Forward movement toward toilets
      ];
      
      console.log("Calculated velocity:", velocity);
      
      // Random nugget properties for variety
      const nuggetColors = ['#4a5d23', '#3d4f1c', '#556b29', '#2d3f14', '#65751f', '#8b9a32'];
      const nuggetShapes: ('round' | 'oval' | 'chunky')[] = ['round', 'oval', 'chunky'];
      
      const newNugget: Nugget = {
        id: nuggetId,
        position: [...startPosition],
        velocity,
        active: true,
        timeAlive: 0,
        size: (Math.random() * 6 + 6) * 1.5, // Size between 9-18 (50% bigger)
        color: nuggetColors[Math.floor(Math.random() * nuggetColors.length)],
        shape: nuggetShapes[Math.floor(Math.random() * nuggetShapes.length)],
        rotation: 0,
        flushing: false,
        flushTime: 0
      };
      
      set(state => ({
        nuggets: [...state.nuggets, newNugget],
        totalThrows: totalThrows + 1,
        power: 0
      }));
      
      // Play throw sound
      const audioStore = useAudio.getState();
      audioStore.playHit();
    },
    
    updateNuggets: (delta: number) => {
      set(state => ({
        nuggets: state.nuggets.map(nugget => {
          if (!nugget.active) return nugget;
          
          const newTimeAlive = nugget.timeAlive + delta;
          
          // Handle flushing animation
          if (nugget.flushing && nugget.flushToilet) {
            const newFlushTime = nugget.flushTime + delta;
            const flushProgress = Math.min(newFlushTime / 2.0, 1); // 2 second flush animation
            
            // Spiral towards toilet center with downward motion
            const toiletX = nugget.flushToilet.x;
            const toiletZ = nugget.flushToilet.z;
            
            // Create spiral motion
            const spiralRadius = 2 * (1 - flushProgress); // Shrinking radius
            const spiralSpeed = flushProgress * 8; // Increasing spiral speed
            const angle = newFlushTime * spiralSpeed;
            
            const targetX = toiletX + Math.cos(angle) * spiralRadius;
            const targetZ = toiletZ + Math.sin(angle) * spiralRadius;
            const targetY = Math.max(0, 2 * (1 - flushProgress * 1.5)); // Sink down
            
            // Update position to spiral towards toilet
            const newPosition: [number, number, number] = [targetX, targetY, targetZ];
            
            // Remove nugget when flush is complete
            if (flushProgress >= 1) {
              console.log("💧 Nugget successfully flushed!");
              return { ...nugget, active: false };
            }
            
            return {
              ...nugget,
              position: newPosition,
              flushTime: newFlushTime,
              rotation: nugget.rotation + 0.3 // Fast spinning while flushing
            };
          }
          
          // Normal physics for non-flushing nuggets
          // Calculate new position with 3D physics
          let newPosition: [number, number, number] = [
            nugget.position[0] + nugget.velocity[0] * delta,
            nugget.position[1] + nugget.velocity[1] * delta,
            nugget.position[2] + nugget.velocity[2] * delta
          ];
          
          // Apply gravity and air resistance
          let newVelocity: [number, number, number] = [
            nugget.velocity[0] * 0.996, // Air resistance
            nugget.velocity[1] - 9.8 * delta, // Gravity pulls down
            nugget.velocity[2] * 0.996 // Air resistance
          ];
          
          // Floor collision with enhanced bouncing (Y = 0 is floor level)
          if (newPosition[1] <= 0 && nugget.velocity[1] < 0) {
            newPosition[1] = 0; // Stay on floor
            newVelocity[1] = -nugget.velocity[1] * 0.7; // Much more bouncy!
            newVelocity[0] *= 0.92; // Less friction for more rolling
            newVelocity[2] *= 0.92; // Less friction for more rolling
            
            // Add some random bounce variation for realistic behavior
            newVelocity[0] += (Math.random() - 0.5) * 0.5;
            newVelocity[2] += (Math.random() - 0.5) * 0.5;
            
            // Stop very small bounces but allow more bouncing
            if (Math.abs(newVelocity[1]) < 0.1) {
              newVelocity[1] = 0;
              newVelocity[0] *= 0.95; // Gentle rolling friction
              newVelocity[2] *= 0.95;
            }
          }
          
          // Side wall bounces (keep nuggets in reasonable bounds)
          if (newPosition[0] < -12) {
            newPosition[0] = -12;
            newVelocity[0] = -newVelocity[0] * 0.6;
          }
          if (newPosition[0] > 12) {
            newPosition[0] = 12;
            newVelocity[0] = -newVelocity[0] * 0.6;
          }
          
          // Remove nuggets that are too old or stopped moving
          if (newTimeAlive > 10) {
            console.log("Nugget removed - Time:", newTimeAlive);
            return { ...nugget, active: false };
          }
          
          // Remove nuggets that have settled and stopped moving
          const speed = Math.sqrt(
            newVelocity[0] * newVelocity[0] + 
            newVelocity[1] * newVelocity[1] + 
            newVelocity[2] * newVelocity[2]
          );
          if (newPosition[1] <= 0.1 && speed < 0.2 && newTimeAlive > 3) {
            console.log("Nugget removed - Settled on floor, speed:", speed);
            return { ...nugget, active: false };
          }
          
          // Log nugget position occasionally for debugging
          if (Math.floor(newTimeAlive * 10) % 20 === 0) {
            console.log("Nugget position:", newPosition, "Velocity:", newVelocity, "Speed:", speed.toFixed(2));
          }
          
          // Check toilet collisions for this nugget
          const toilets = [
            { x: -8, z: -18, points: 1, color: 'Blue', radius: 3.0 },
            { x: 0, z: -15, points: 2, color: 'Green', radius: 3.0 },
            { x: 8, z: -18, points: 3, color: 'Gold', radius: 3.0 },
            { x: 0, z: -25, points: 5, color: 'Pink', radius: 2.5 }
          ];
          
          for (const toilet of toilets) {
            const dx = newPosition[0] - toilet.x;
            const dz = newPosition[2] - toilet.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < toilet.radius && !nugget.flushing) {
              console.log(`🚽 Nugget hit ${toilet.color} toilet! FLUSHING! +${toilet.points} points!`);
              
              // Start flushing immediately
              set(state => ({
                score: state.score + toilet.points
              }));
              
              // Play success sound
              const audioStore = useAudio.getState();
              audioStore.playSuccess();
              
              return {
                ...nugget,
                position: newPosition,
                velocity: newVelocity,
                timeAlive: newTimeAlive,
                rotation: nugget.rotation + 0.1,
                flushing: true,
                flushTime: 0,
                flushToilet: { x: toilet.x, z: toilet.z, points: toilet.points }
              };
            }
          }

          return {
            ...nugget,
            position: newPosition,
            velocity: newVelocity,
            timeAlive: newTimeAlive,
            rotation: nugget.rotation + 0.1 // Slow rotation while flying
          };
        }).filter(nugget => nugget.active)
      }));
    },
    
    checkCollisions: () => {
      const { nuggets, score } = get();
      
      // Define toilet positions and point values to match the visual toilets
      const toilets = [
        { x: -8, z: -18, points: 1, color: 'Blue', radius: 3.0 },    // Blue toilet - 1 point (left)
        { x: 0, z: -15, points: 2, color: 'Green', radius: 3.0 },    // Green toilet - 2 points (center)
        { x: 8, z: -18, points: 3, color: 'Gold', radius: 3.0 },     // Gold toilet - 3 points (right)
        { x: 0, z: -25, points: 5, color: 'Pink', radius: 2.5 }      // Pink toilet - 5 points (back, smaller)
      ];
      
      nuggets.forEach(nugget => {
        if (!nugget.active) return;
        
        // Check collision with each toilet
        toilets.forEach(toilet => {
          const dx = nugget.position[0] - toilet.x;
          const dz = nugget.position[2] - toilet.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < toilet.radius && !nugget.flushing) {
            console.log(`🚽 Nugget hit ${toilet.color} toilet! FLUSHING! +${toilet.points} points!`);
            
            // Start the flushing animation
            set(state => ({
              nuggets: state.nuggets.map(n => 
                n.id === nugget.id ? { 
                  ...n, 
                  flushing: true, 
                  flushTime: 0,
                  flushToilet: { x: toilet.x, z: toilet.z, points: toilet.points }
                } : n
              ),
              score: score + toilet.points
            }));
            
            // Play success sound
            const audioStore = useAudio.getState();
            audioStore.playSuccess();
          }
        });
      });
    }
  }))
);
