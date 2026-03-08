// Simplified Minion AI - Clean implementation without complex pathfinding
export interface SimplifiedUnit {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  isPlayer: boolean;
  cardId: string;
  target: SimplifiedUnit | any | null;
  lastAttack: number;
  range: number;
  lane: 'left' | 'right';
  attackType: 'ranged' | 'melee' | 'magical' | 'tank';
  cardClass: string;
  cardType: string;
  deployTime: number;
  attackCooldown: number;
  isAttacking: boolean;
  isAdvancing?: boolean;
  advanceTarget?: {x: number, y: number} | null;
}

export const updateMinionAI = (
  unit: SimplifiedUnit, 
  units: SimplifiedUnit[], 
  towers: any[], 
  CANVAS_WIDTH: number, 
  CANVAS_HEIGHT: number,
  now: number
): SimplifiedUnit => {
  
  // AGGRESSIVE TARGET ACQUISITION
  const shouldRetarget = !unit.target || 
      ('destroyed' in unit.target && unit.target.destroyed) || 
      ('health' in unit.target && unit.target.health <= 0) ||
      !unit.target.x || !unit.target.y ||
      (Math.random() < 0.05); // 5% chance per frame to re-evaluate targets

  if (shouldRetarget) {
    const enemyUnits = units.filter(u => u && u.isPlayer !== unit.isPlayer && u.health > 0 && u.x && u.y);
    const enemyTowers = towers.filter(t => t && t.isPlayer !== unit.isPlayer && !t.destroyed);
    
    let nextTarget = null;
    let closestDistance = Infinity;
    
    // PRIORITY 1: Close enemy units
    const attackRange = (unit.range || 40) + 30;
    const nearbyEnemies = enemyUnits.filter(enemy => {
      const dist = Math.sqrt((enemy.x - unit.x) ** 2 + (enemy.y - unit.y) ** 2);
      return dist <= attackRange;
    }).sort((a, b) => {
      const distA = Math.sqrt((a.x - unit.x) ** 2 + (a.y - unit.y) ** 2);
      const distB = Math.sqrt((b.x - unit.x) ** 2 + (b.y - unit.y) ** 2);
      return distA - distB;
    });
    
    if (nearbyEnemies.length > 0) {
      nextTarget = nearbyEnemies[0];
    } else {
      // PRIORITY 2: Lane-based tower targeting
      const unitIsOnLeftSide = unit.x < CANVAS_WIDTH / 2;
      const sameSideTowers = enemyTowers.filter(tower => {
        const towerIsOnLeft = tower.x < CANVAS_WIDTH / 2;
        return unitIsOnLeftSide === towerIsOnLeft;
      });
      
      const towersToCheck = sameSideTowers.length > 0 ? sameSideTowers : enemyTowers;
      
      if (towersToCheck.length > 0) {
        nextTarget = towersToCheck.reduce((nearest, tower) => {
          const distToNearest = Math.sqrt((nearest.x - unit.x) ** 2 + (nearest.y - unit.y) ** 2);
          const distToCurrent = Math.sqrt((tower.x - unit.x) ** 2 + (tower.y - unit.y) ** 2);
          return distToCurrent < distToNearest ? tower : nearest;
        });
      }
    }
    
    unit.target = nextTarget;
    
    if (!nextTarget) {
      // Set advance behavior
      unit.isAdvancing = true;
      unit.advanceTarget = unit.isPlayer ? 
        { x: CANVAS_WIDTH / 2, y: 100 } : 
        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 };
    }
  }

  // MOVEMENT AND COMBAT
  if ((unit.target && unit.target.x && unit.target.y) || unit.isAdvancing) {
    const actualTarget = unit.target || unit.advanceTarget;
    if (!actualTarget) return unit;

    const dx = actualTarget.x - unit.x;
    const dy = actualTarget.y - unit.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (unit.target && distance <= (unit.range || 50)) {
      // ATTACK
      if (now - unit.lastAttack > unit.attackCooldown) {
        unit.isAttacking = true;
        unit.lastAttack = now;
        
        if ('health' in unit.target) {
          unit.target.health -= unit.damage;
          console.log(`⚔️ Unit ${unit.id} attacks for ${unit.damage} damage`);
        }
      }
    } else {
      // MOVE
      unit.isAttacking = false;
      const unitSpeed = unit.speed || 2;
      
      // Simple bridge navigation for middle zone
      const centerY = CANVAS_HEIGHT / 2;
      const isInMiddleZone = Math.abs(unit.y - centerY) < 40;
      const xPercent = (unit.x / CANVAS_WIDTH) * 100;
      const isBlockedArea = xPercent > 25 && xPercent < 75;
      
      if (isInMiddleZone && isBlockedArea) {
        // Navigate to bridge
        const leftBridge = CANVAS_WIDTH * 0.15;
        const rightBridge = CANVAS_WIDTH * 0.85;
        const chosenBridge = unit.x < CANVAS_WIDTH / 2 ? leftBridge : rightBridge;
        
        const bridgeDx = chosenBridge - unit.x;
        const bridgeDy = centerY - unit.y;
        const bridgeDistance = Math.sqrt(bridgeDx * bridgeDx + bridgeDy * bridgeDy);
        
        if (bridgeDistance > 20) {
          unit.x += (bridgeDx / bridgeDistance) * unitSpeed;
          unit.y += (bridgeDy / bridgeDistance) * unitSpeed;
        } else {
          // Cross bridge
          unit.y += (unit.isPlayer ? -1 : 1) * unitSpeed * 2;
        }
      } else {
        // Normal movement toward target
        unit.x += (dx / distance) * unitSpeed;
        unit.y += (dy / distance) * unitSpeed;
      }
      
      // Check if reached advance target
      if (unit.isAdvancing && distance < 40) {
        unit.isAdvancing = false;
        unit.advanceTarget = null;
        unit.target = null; // Force retargeting
      }
    }
    
    // Boundary protection
    unit.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, unit.x));
    unit.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, unit.y));
  }

  return unit;
};