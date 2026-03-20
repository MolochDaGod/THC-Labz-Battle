/**
 * Advanced Physics Engine for DopeWars Game
 * Includes realistic bounce mechanics, collision detection, and particle systems
 */

export interface PhysicsObject {
  id: string;
  position: { x: number; y: number; z?: number };
  velocity: { x: number; y: number; z?: number };
  acceleration: { x: number; y: number; z?: number };
  mass: number;
  restitution: number; // Bounce factor (0 = no bounce, 1 = perfect bounce)
  friction: number;
  radius: number;
  isStatic: boolean;
  material: 'money' | 'drug' | 'default';
  rotation?: number;
  angularVelocity?: number;
  trail?: Array<{ x: number; y: number; alpha: number }>;
  lifeTime?: number;
  maxLifeTime?: number;
  scale?: number;
  color?: string;
  bounceCount?: number;
  maxBounces?: number;
}

export interface Boundary {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PhysicsEngine {
  private objects: Map<string, PhysicsObject> = new Map();
  private gravity = { x: 0, y: 980, z: 0 }; // pixels/s²
  private airResistance = 0.998;
  private boundaries: Boundary[] = [];
  private wind = { x: 0, y: 0 }; // Wind force
  private timeStep = 1/60; // 60 FPS

  constructor() {
    this.setupDefaultBoundaries();
    this.setupEnvironmentalForces();
  }

  private setupDefaultBoundaries() {
    // Screen boundaries (assuming 1920x1080 viewport)
    this.boundaries = [
      { x: 0, y: 0, width: window.innerWidth, height: 50 }, // Top
      { x: 0, y: window.innerHeight - 50, width: window.innerWidth, height: 50 }, // Bottom
      { x: 0, y: 0, width: 50, height: window.innerHeight }, // Left
      { x: window.innerWidth - 50, y: 0, width: 50, height: window.innerHeight }, // Right
    ];
  }

  private setupEnvironmentalForces() {
    // Random wind effects for more dynamic movement
    setInterval(() => {
      this.wind.x = (Math.random() - 0.5) * 50; // Random wind between -25 and 25
      this.wind.y = (Math.random() - 0.5) * 20; // Small vertical wind
    }, 3000); // Change wind every 3 seconds
  }

  addObject(obj: PhysicsObject): void {
    this.objects.set(obj.id, { ...obj });
  }

  removeObject(id: string): void {
    this.objects.delete(id);
  }

  getObject(id: string): PhysicsObject | undefined {
    return this.objects.get(id);
  }

  getAllObjects(): PhysicsObject[] {
    return Array.from(this.objects.values());
  }

  update(deltaTime: number): void {
    const dt = Math.min(deltaTime / 1000, this.timeStep); // Convert to seconds, cap at timeStep

    for (const obj of Array.from(this.objects.values())) {
      if (obj.isStatic) continue;

      // Initialize advanced properties if not set
      if (obj.rotation === undefined) obj.rotation = Math.random() * Math.PI * 2;
      if (obj.angularVelocity === undefined) obj.angularVelocity = (Math.random() - 0.5) * 10;
      if (obj.lifeTime === undefined) obj.lifeTime = 0;
      if (obj.maxLifeTime === undefined) obj.maxLifeTime = 5000; // 5 seconds
      if (obj.scale === undefined) obj.scale = 1;
      if (obj.bounceCount === undefined) obj.bounceCount = 0;
      if (obj.maxBounces === undefined) obj.maxBounces = 8;
      if (!obj.trail) obj.trail = [];

      // Update lifetime and check expiration
      obj.lifeTime += deltaTime;
      if (obj.lifeTime > obj.maxLifeTime) {
        this.removeObject(obj.id);
        continue;
      }
      
      // Remove slow-moving particles near the bottom to prevent accumulation
      const totalVelocity = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
      if (obj.material === 'default' && totalVelocity < 10 && obj.position.y > window.innerHeight - 200) {
        this.removeObject(obj.id);
        continue;
      }

      // Apply gravity with mass consideration
      const gravityForce = this.gravity.y * obj.mass;
      obj.acceleration.y += gravityForce;

      // Apply wind forces for more dynamic movement
      obj.acceleration.x += this.wind.x * (1 / obj.mass);
      obj.acceleration.y += this.wind.y * (1 / obj.mass);

      // Enhanced air resistance based on velocity magnitude
      const speed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
      const dragCoeff = Math.min(0.02, 0.0001 * speed * speed / obj.mass);
      
      obj.velocity.x *= (this.airResistance - dragCoeff);
      obj.velocity.y *= (this.airResistance - dragCoeff);
      if (obj.velocity.z !== undefined) {
        obj.velocity.z *= (this.airResistance - dragCoeff);
      }

      // Verlet integration for better stability
      obj.velocity.x += obj.acceleration.x * dt;
      obj.velocity.y += obj.acceleration.y * dt;
      if (obj.velocity.z !== undefined && obj.acceleration.z !== undefined) {
        obj.velocity.z += obj.acceleration.z * dt;
      }

      // Update position
      obj.position.x += obj.velocity.x * dt;
      obj.position.y += obj.velocity.y * dt;
      if (obj.position.z !== undefined && obj.velocity.z !== undefined) {
        obj.position.z += obj.velocity.z * dt;
      }

      // Update rotation and apply angular damping
      obj.rotation += obj.angularVelocity * dt;
      obj.angularVelocity *= 0.985; // Angular damping

      // Trail effects disabled - no smoke trails

      // Scale based on lifetime for fade out effect
      if (obj.lifeTime !== undefined && obj.maxLifeTime !== undefined) {
        const lifeRatio = obj.lifeTime / obj.maxLifeTime;
        obj.scale = Math.max(0.2, 1 - lifeRatio * 0.4);
      }

      // Reset acceleration for next frame
      obj.acceleration.x = 0;
      obj.acceleration.y = 0;
      if (obj.acceleration.z !== undefined) {
        obj.acceleration.z = 0;
      }

      // Enhanced boundary collision detection
      this.checkBoundaryCollisions(obj);
    }

    // Check object-to-object collisions
    this.checkObjectCollisions();
  }

  private checkBoundaryCollisions(obj: PhysicsObject): void {
    const { position, velocity, radius, restitution, friction } = obj;
    let bounced = false;
    const minVelocity = 15; // Minimum velocity to continue bouncing

    // Bottom boundary collision with enhanced physics
    if (position.y + radius > window.innerHeight - 100) {
      // Remove particles that reach the bottom instead of letting them accumulate
      if (obj.material === 'default' || (obj.bounceCount || 0) > 3) {
        this.removeObject(obj.id);
        return;
      }
      
      position.y = window.innerHeight - 100 - radius;
      const impactVelocity = Math.abs(velocity.y);
      velocity.y = -velocity.y * restitution * (1 - (obj.bounceCount || 0) * 0.08);
      velocity.x *= friction;
      
      // Add realistic surface interaction
      const surfaceRandomness = (Math.random() - 0.5) * Math.min(impactVelocity * 0.3, 30);
      velocity.x += surfaceRandomness;
      
      // Generate angular velocity based on impact
      obj.angularVelocity = (obj.angularVelocity || 0) + velocity.x * 0.05;
      obj.bounceCount = (obj.bounceCount || 0) + 1;
      bounced = true;
    }

    // Top boundary collision
    if (position.y - radius < 100) {
      position.y = 100 + radius;
      velocity.y = -velocity.y * restitution * (1 - (obj.bounceCount || 0) * 0.08);
      velocity.x *= friction;
      obj.angularVelocity = (obj.angularVelocity || 0) + velocity.x * 0.05;
      bounced = true;
    }

    // Left boundary collision
    if (position.x - radius < 50) {
      position.x = 50 + radius;
      const impactVelocity = Math.abs(velocity.x);
      velocity.x = -velocity.x * restitution * (1 - (obj.bounceCount || 0) * 0.08);
      velocity.y *= friction;
      
      const surfaceRandomness = (Math.random() - 0.5) * Math.min(impactVelocity * 0.2, 25);
      velocity.y += surfaceRandomness;
      obj.angularVelocity = (obj.angularVelocity || 0) + velocity.y * 0.05;
      bounced = true;
    }

    // Right boundary collision
    if (position.x + radius > window.innerWidth - 50) {
      position.x = window.innerWidth - 50 - radius;
      const impactVelocity = Math.abs(velocity.x);
      velocity.x = -velocity.x * restitution * (1 - (obj.bounceCount || 0) * 0.08);
      velocity.y *= friction;
      
      const surfaceRandomness = (Math.random() - 0.5) * Math.min(impactVelocity * 0.2, 25);
      velocity.y += surfaceRandomness;
      obj.angularVelocity = (obj.angularVelocity || 0) + velocity.y * 0.05;
      bounced = true;
    }

    // Handle bounce counting and energy dissipation
    if (bounced) {
      obj.bounceCount = (obj.bounceCount || 0) + 1;
      
      // Impact particles disabled - no smoke effects
      
      // Remove low-energy objects
      const totalEnergy = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (totalEnergy < minVelocity && obj.bounceCount > 3) {
        // Gradually fade out instead of immediate removal
        obj.maxLifeTime = Math.min(obj.maxLifeTime || 5000, (obj.lifeTime || 0) + 1000);
      }
    }
  }

  private checkObjectCollisions(): void {
    const objects = Array.from(this.objects.values());
    
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const objA = objects[i];
        const objB = objects[j];

        if (objA.isStatic && objB.isStatic) continue;

        const distance = this.calculateDistance(objA.position, objB.position);
        const minDistance = objA.radius + objB.radius;

        if (distance < minDistance) {
          this.resolveCollision(objA, objB, distance, minDistance);
        }
      }
    }
  }

  private calculateDistance(posA: { x: number; y: number }, posB: { x: number; y: number }): number {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private resolveCollision(objA: PhysicsObject, objB: PhysicsObject, distance: number, minDistance: number): void {
    // Calculate collision normal
    const dx = objB.position.x - objA.position.x;
    const dy = objB.position.y - objA.position.y;
    const normalX = dx / distance;
    const normalY = dy / distance;

    // Separate objects
    const overlap = minDistance - distance;
    const separationX = normalX * overlap * 0.5;
    const separationY = normalY * overlap * 0.5;

    if (!objA.isStatic) {
      objA.position.x -= separationX;
      objA.position.y -= separationY;
    }
    if (!objB.isStatic) {
      objB.position.x += separationX;
      objB.position.y += separationY;
    }

    // Calculate relative velocity
    const relativeVelX = objB.velocity.x - objA.velocity.x;
    const relativeVelY = objB.velocity.y - objA.velocity.y;

    // Calculate relative velocity in collision normal direction
    const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;

    // Don't resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Calculate restitution
    const restitution = Math.min(objA.restitution, objB.restitution);

    // Calculate impulse scalar
    let impulse = -(1 + restitution) * velAlongNormal;
    impulse /= (1 / objA.mass) + (1 / objB.mass);

    // Apply impulse
    const impulseX = impulse * normalX;
    const impulseY = impulse * normalY;

    if (!objA.isStatic) {
      objA.velocity.x -= impulseX / objA.mass;
      objA.velocity.y -= impulseY / objA.mass;
    }
    if (!objB.isStatic) {
      objB.velocity.x += impulseX / objB.mass;
      objB.velocity.y += impulseY / objB.mass;
    }
  }

  applyForce(id: string, force: { x: number; y: number; z?: number }): void {
    const obj = this.objects.get(id);
    if (!obj || obj.isStatic) return;

    obj.acceleration.x += force.x / obj.mass;
    obj.acceleration.y += force.y / obj.mass;
    if (force.z !== undefined && obj.acceleration.z !== undefined) {
      obj.acceleration.z += force.z / obj.mass;
    }
  }

  // Material presets for different object types
  static getMaterialProperties(material: 'money' | 'drug' | 'default') {
    switch (material) {
      case 'money':
        return {
          mass: 0.5,
          restitution: 0.3,
          friction: 0.8,
          radius: 15
        };
      case 'drug':
        return {
          mass: 1.0,
          restitution: 0.6,
          friction: 0.7,
          radius: 20
        };
      default:
        return {
          mass: 1.0,
          restitution: 0.5,
          friction: 0.8,
          radius: 10
        };
    }
  }

  // Create money explosion effect
  createMoneyExplosion(x: number, y: number, amount: number): string[] {
    const billCount = Math.min(Math.floor(amount / 100), 20); // Max 20 bills
    const billIds: string[] = [];

    for (let i = 0; i < billCount; i++) {
      const angle = (Math.PI * 2 * i) / billCount;
      const speed = 200 + Math.random() * 300;
      const id = `money_${Date.now()}_${i}`;

      const materialProps = PhysicsEngine.getMaterialProperties('money');
      
      const bill: PhysicsObject = {
        id,
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 200 // Initial upward velocity
        },
        acceleration: { x: 0, y: 0 },
        ...materialProps,
        isStatic: false,
        material: 'money'
      };

      this.addObject(bill);
      billIds.push(id);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        this.removeObject(id);
      }, 5000);
    }

    return billIds;
  }

  // Create drug bag bounce effect
  createDrugBounce(x: number, y: number, type: string): string {
    const id = `drug_${type}_${Date.now()}`;
    const materialProps = PhysicsEngine.getMaterialProperties('drug');

    const drug: PhysicsObject = {
      id,
      position: { x, y },
      velocity: {
        x: (Math.random() - 0.5) * 200,
        y: -300 - Math.random() * 200
      },
      acceleration: { x: 0, y: 0 },
      ...materialProps,
      isStatic: false,
      material: 'drug'
    };

    this.addObject(drug);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.removeObject(id);
    }, 3000);

    return id;
  }

  // Screen shake effect
  createScreenShake(intensity: number = 1): void {
    const duration = 500 * intensity;
    const magnitude = 10 * intensity;
    const startTime = Date.now();

    const shake = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) return;

      const progress = elapsed / duration;
      const currentMagnitude = magnitude * (1 - progress);
      
      const x = (Math.random() - 0.5) * currentMagnitude;
      const y = (Math.random() - 0.5) * currentMagnitude;

      document.body.style.transform = `translate(${x}px, ${y}px)`;

      requestAnimationFrame(shake);
    };

    shake();

    // Reset after duration
    setTimeout(() => {
      document.body.style.transform = '';
    }, duration);
  }

  createImpactParticles(x: number, y: number, material: string): void {
    // Smoke effects disabled - no particle creation
    return;
  }
}

// Singleton physics engine instance
export const physicsEngine = new PhysicsEngine();

// Helper functions for common physics operations
export const createBouncyMoney = (x: number, y: number, amount: number) => {
  return physicsEngine.createMoneyExplosion(x, y, amount);
};

export const createBouncyDrug = (x: number, y: number, type: string) => {
  return physicsEngine.createDrugBounce(x, y, type);
};

export const shakeScreen = (intensity: number = 1) => {
  physicsEngine.createScreenShake(intensity);
};