import React, { useRef, useEffect, useState, useCallback } from 'react';
// Define BattleCard interface locally
interface BattleCard {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  class?: string;
  type?: string;
  rarity?: string;
  abilities?: string[];
}

// Basic types and interfaces
interface Unit {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  range: number;
  isPlayer: boolean;
  cardId: string;
  target: string | null;
  lastAttack: number;
  lane: 'left' | 'right';
  attackType: 'melee' | 'ranged' | 'magical' | 'tank';
  cardClass?: string;
  cardType?: string;
  isTower?: boolean;
  deployTime?: number;
  despawnTime?: number;
}

interface Tower {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isPlayer: boolean;
  type: 'crown' | 'king';
  destroyed: boolean;
  range: number;
  damage: number;
  lastAttack: number;
}

interface GameState {
  isPlaying: boolean;
  phase: 'setup' | 'playing' | 'results';
  playerElixir: number;
  enemyElixir: number;
  timeLeft: number;
  playerCrowns: number;
  enemyCrowns: number;
  selectedCard: BattleCard | null;
}

interface AttackEffect {
  id: string;
  x: number;
  y: number;
  type: 'melee' | 'ranged' | 'magical' | 'tank' | 'deploy';
  emoji: string;
  frame: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  isPlayer: boolean;
  type: 'ranged' | 'magical';
  emoji: string;
  speed: number;
  trail?: boolean;
}

interface DamageNumber {
  id: string;
  x: number;
  y: number;
  damage: number;
  isPlayer: boolean;
}

interface AbilityEffect {
  id: string;
  x: number;
  y: number;
  ability: string;
  frame: number;
  duration: number;
}

interface VisualBattleSystemProps {
  playerDeck: BattleCard[];
  captainCard?: BattleCard;
  onBattleEnd: (winner: 'player' | 'ai', results: any) => void;
  gameZones?: any[];
  playerWallet?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nftData?: any;
}

// Constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const BASE_CELL_SIZE = 30;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 27;

// Simplified battle grid (0=water, 1=walkable, 2=bridge, 3=player_deploy, 4=ai_deploy)
const battleGrid: number[][] = Array(GRID_HEIGHT).fill(0).map((_, row) => {
  if (row < 10) return Array(GRID_WIDTH).fill(4); // AI side
  if (row >= 13 && row <= 15) {
    // Water with bridges
    return Array(GRID_WIDTH).fill(0).map((_, col) => (col === 5 || col === 13) ? 2 : 0);
  }
  if (row > 15) return Array(GRID_WIDTH).fill(3); // Player side
  return Array(GRID_WIDTH).fill(1); // Neutral zone
});

const VisualBattleSystemFixed: React.FC<VisualBattleSystemProps> = ({
  playerDeck,
  captainCard,
  onBattleEnd,
  gameZones,
  playerWallet,
  difficulty,
  nftData
}) => {
  const [playerHand, setPlayerHand] = useState<BattleCard[]>([]);
  const [aiHand, setAiHand] = useState<BattleCard[]>([]);
  const isActive = true;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    phase: 'setup',
    playerElixir: 5,
    enemyElixir: 5,
    timeLeft: 180,
    playerCrowns: 0,
    enemyCrowns: 0,
    selectedCard: null
  });
  
  // Admin gameboard data
  const [adminGameboard, setAdminGameboard] = useState<any>(null);
  
  // Load official PvE gameboard on component mount
  useEffect(() => {
    const loadOfficialGameboard = async () => {
      try {
        // Try server first
        const response = await fetch('/api/admin/load-pve-gameboard');
        const result = await response.json();
        
        if (result.success && result.gameboard) {
          setAdminGameboard(result.gameboard);
          console.log('✅ PvE Battle using official admin-created gameboard from server');
          console.log(`🏰 Loaded ${result.gameboard.elements?.length || 0} elements from admin interface`);
        } else {
          // Fallback to local storage
          const localBoard = localStorage.getItem('thc-clash-pve-gameboard');
          if (localBoard) {
            const boardData = JSON.parse(localBoard);
            setAdminGameboard(boardData);
            console.log('✅ PvE Battle using official admin-created gameboard from local storage');
            console.log(`🏰 Loaded ${boardData.elements?.length || 0} elements from admin interface`);
          } else {
            console.log('❌ NO ADMIN GAMEBOARD FOUND - BATTLE CANCELLED');
            console.log('💡 You MUST create a gameboard in Admin Interface (/admingame) first');
            alert('⚠️ NO ADMIN GAMEBOARD FOUND!\n\nYou must create a gameboard in the Admin Interface (/admingame) before starting battles.\n\nGo to /admingame → Create Layout → Save Official PvE Gameboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading official PvE gameboard:', error);
        console.log('⚠️ Using default battle layout');
      }
    };
    
    loadOfficialGameboard();
  }, []);

  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [abilityEffects, setAbilityEffects] = useState<AbilityEffect[]>([]);
  
  const [hoveredCard, setHoveredCard] = useState<BattleCard | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Initialize player hand from deck
  useEffect(() => {
    if (playerDeck && playerDeck.length > 0 && playerHand.length === 0) {
      const initialHand = playerDeck.slice(0, 4);
      setPlayerHand(initialHand);
      console.log('🎴 Initialized player hand with 4 cards');
    }
  }, [playerDeck, playerHand.length]);

  // Initialize towers based on admin gameboard or defaults
  useEffect(() => {
    if (isActive && towers.length === 0) {
      let initialTowers: Tower[] = [];
      
      // Use admin gameboard if available
      if (adminGameboard && adminGameboard.elements) {
        console.log('🏰 Loading towers from admin gameboard');
        
        adminGameboard.elements.forEach((element: any) => {
          if (element.type === 'castle') {
            initialTowers.push({
              id: element.id,
              x: element.x,
              y: element.y,
              health: element.health || 2400,
              maxHealth: element.maxHealth || 2400,
              isPlayer: element.team === 'player',
              type: 'king',
              destroyed: false,
              range: 120,
              damage: 100,
              lastAttack: 0
            });
          } else if (element.type === 'tower') {
            initialTowers.push({
              id: element.id,
              x: element.x,
              y: element.y,
              health: element.health || 1600,
              maxHealth: element.maxHealth || 1600,
              isPlayer: element.team === 'player',
              type: 'crown',
              destroyed: false,
              range: 150,
              damage: 80,
              lastAttack: 0
            });
          }
        });
        
        console.log(`🏰 Admin Gameboard Integration: Loaded ${initialTowers.length} towers`);
        console.log('🎯 BATTLE USING ADMIN-CREATED LAYOUT - SUCCESS!');
      }
      
      // NO FALLBACK TOWERS - ADMIN GAMEBOARD REQUIRED
      if (initialTowers.length === 0) {
        console.log('❌ NO TOWERS FROM ADMIN GAMEBOARD - BATTLE TERMINATED');
        alert('⚠️ ADMIN GAMEBOARD MISSING TOWERS!\n\nYour admin gameboard needs towers/castles.\n\nGo to /admingame → Place Towers → Save Official PvE Gameboard');
        return;
      }
      
      setTowers(initialTowers);
    }
  }, [isActive, towers.length, adminGameboard]);

  // Start battle
  const startBattle = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, phase: 'playing' }));
    console.log('🎮 Enhanced Battle Started with A* Pathfinding and Precise Deployment');
  };

  // AI opponent system
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const aiLoop = setInterval(() => {
      // AI deployment logic based on difficulty
      if (gameState.enemyElixir >= 3 && Math.random() < 0.3) {
        const availableCards = playerDeck.filter(card => card.cost <= gameState.enemyElixir);
        
        if (availableCards.length > 0) {
          const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
          
          // AI deploys on their side (top half)
          const deployX = Math.random() * (CANVAS_WIDTH - 100) + 50;
          const deployY = Math.random() * (CANVAS_HEIGHT * 0.3) + 50;
          
          // Determine attack type from card properties
          const attackType = determineAttackType(randomCard);
          
          const aiUnit: Unit = {
            id: `ai_unit_${Date.now()}`,
            x: deployX,
            y: deployY,
            health: randomCard.health,
            maxHealth: randomCard.health,
            damage: randomCard.attack,
            speed: 1.2,
            range: getAttackRange(attackType),
            isPlayer: false,
            cardId: randomCard.id,
            target: null,
            lastAttack: 0,
            lane: deployX < CANVAS_WIDTH / 2 ? 'left' : 'right',
            attackType: attackType
          };

          setUnits(prev => [...prev, aiUnit]);
          setGameState(prev => ({
            ...prev,
            enemyElixir: prev.enemyElixir - randomCard.cost
          }));
          
          console.log(`🤖 AI deployed ${randomCard.name} (${attackType}) at (${deployX.toFixed(0)}, ${deployY.toFixed(0)})`);
        }
      }
    }, 3000); // AI considers deployment every 3 seconds

    return () => clearInterval(aiLoop);
  }, [gameState.isPlaying, gameState.enemyElixir, playerDeck]);

  // Determine attack type from card properties
  const determineAttackType = (card: BattleCard): 'melee' | 'ranged' | 'magical' | 'tank' => {
    const name = card.name?.toLowerCase() || '';
    const cardClass = card.class?.toLowerCase() || '';
    const cardType = card.type?.toLowerCase() || '';
    
    // Magical units
    if (name.includes('wizard') || name.includes('mage') || name.includes('witch') || 
        name.includes('spell') || cardClass.includes('magical') || cardType.includes('spell')) {
      return 'magical';
    }
    
    // Ranged units
    if (name.includes('archer') || name.includes('sniper') || name.includes('ranger') || 
        name.includes('bow') || cardClass.includes('ranged')) {
      return 'ranged';
    }
    
    // Tank units
    if (name.includes('tank') || name.includes('giant') || name.includes('golem') || 
        name.includes('knight') || cardClass.includes('tank') || card.health > 150) {
      return 'tank';
    }
    
    // Default to melee
    return 'melee';
  };

  // Get attack range based on type
  const getAttackRange = (attackType: 'melee' | 'ranged' | 'magical' | 'tank'): number => {
    switch (attackType) {
      case 'ranged': return 80;
      case 'magical': return 70;
      case 'tank': return 35;
      case 'melee': 
      default: return 40;
    }
  };

  // A* Pathfinding algorithm
  const findPath = useCallback((startX: number, startY: number, targetX: number, targetY: number): {x: number, y: number}[] => {
    const startGridX = Math.floor(startX / BASE_CELL_SIZE);
    const startGridY = Math.floor(startY / BASE_CELL_SIZE);
    const targetGridX = Math.floor(targetX / BASE_CELL_SIZE);
    const targetGridY = Math.floor(targetY / BASE_CELL_SIZE);

    interface PathNode {
      x: number;
      y: number;
      g: number;
      h: number;
      f: number;
      parent?: PathNode;
    }

    const openList: PathNode[] = [];
    const closedList: PathNode[] = [];
    const startNode: PathNode = {
      x: startGridX,
      y: startGridY,
      g: 0,
      h: Math.abs(targetGridX - startGridX) + Math.abs(targetGridY - startGridY),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    const isBlocked = (x: number, y: number): boolean => {
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return true;
      const cellType = battleGrid[y]?.[x] || 1;
      if (cellType === 0) {
        if (y >= 13 && y <= 15) {
          return !(x === 5 || x === 13);
        }
        return true;
      }
      return false;
    };

    const getNeighbors = (node: PathNode): PathNode[] => {
      const neighbors: PathNode[] = [];
      const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, 
        { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, 
        { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
      ];

      for (const dir of directions) {
        const newX = node.x + dir.dx;
        const newY = node.y + dir.dy;
        
        if (!isBlocked(newX, newY)) {
          neighbors.push({
            x: newX,
            y: newY,
            g: node.g + 1,
            h: Math.abs(targetGridX - newX) + Math.abs(targetGridY - newY),
            f: 0,
            parent: node
          });
        }
      }
      return neighbors;
    };

    while (openList.length > 0) {
      const current = openList.reduce((lowest, node) => node.f < lowest.f ? node : lowest);
      openList.splice(openList.indexOf(current), 1);
      closedList.push(current);

      if (current.x === targetGridX && current.y === targetGridY) {
        const path: { x: number; y: number }[] = [];
        let pathNode: PathNode | undefined = current;
        
        while (pathNode && pathNode.parent) {
          path.unshift({ x: pathNode.x * BASE_CELL_SIZE, y: pathNode.y * BASE_CELL_SIZE });
          pathNode = pathNode.parent;
        }
        
        return path;
      }

      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        neighbor.f = neighbor.g + neighbor.h;

        if (closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          continue;
        }

        const existingOpen = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
        if (!existingOpen) {
          openList.push(neighbor);
        } else if (neighbor.g < existingOpen.g) {
          existingOpen.g = neighbor.g;
          existingOpen.f = neighbor.f;
          existingOpen.parent = neighbor.parent;
        }
      }

      if (closedList.length > 300) break;
    }

    return [];
  }, []);

  // Precise deployment at click position
  const deployCardAtPosition = useCallback((card: BattleCard, x: number, y: number) => {
    if (gameState.playerElixir >= card.cost) {
      const playerSideY = Math.max(y, CANVAS_HEIGHT * 0.5);
      const clampedX = Math.max(0, Math.min(x, CANVAS_WIDTH));
      
      // Determine attack type and range for player unit
      const attackType = determineAttackType(card);
      const unitRange = getAttackRange(attackType);
      
      const newUnit: Unit = {
        id: `unit_${Date.now()}`,
        x: clampedX,
        y: playerSideY,
        health: card.health,
        maxHealth: card.health,
        damage: card.attack,
        speed: 1.5,
        range: unitRange,
        isPlayer: true,
        cardId: card.id,
        target: null,
        lastAttack: 0,
        lane: clampedX < CANVAS_WIDTH / 2 ? 'left' : 'right',
        attackType: attackType
      };

      setUnits(prev => [...prev, newUnit]);
      setGameState(prev => ({
        ...prev,
        playerElixir: prev.playerElixir - card.cost,
        selectedCard: null
      }));
      
      console.log(`🎯 Precise deployment at (${clampedX}, ${playerSideY})`);
    }
  }, [gameState.playerElixir]);

  // Canvas click handler for precise placement
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.selectedCard || !gameState.isPlaying) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const gridY = Math.floor(y / BASE_CELL_SIZE);
    
    if (gridY >= GRID_HEIGHT * 0.4) {
      deployCardAtPosition(gameState.selectedCard, x, y);
    }
  }, [gameState.selectedCard, gameState.isPlaying, deployCardAtPosition]);

  // Enhanced combat system with minion-to-minion combat and proper attack types
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = setInterval(() => {
      const currentTime = Date.now();
      
      // Update units with enhanced combat system
      setUnits(prevUnits => 
        prevUnits.map(unit => {
          // Find all possible targets (enemy units first, then towers)
          const enemyUnits = prevUnits.filter(u => u.isPlayer !== unit.isPlayer);
          const enemyTowers = towers.filter(t => t.isPlayer !== unit.isPlayer && !t.destroyed);
          
          // Prioritize enemy units over towers
          let allTargets = [...enemyUnits, ...enemyTowers];
          
          if (allTargets.length > 0) {
            // Find closest target
            const target = allTargets.reduce((closest, enemy) => {
              const distToCurrent = Math.sqrt((enemy.x - unit.x) ** 2 + (enemy.y - unit.y) ** 2);
              const distToClosest = Math.sqrt((closest.x - unit.x) ** 2 + (closest.y - unit.y) ** 2);
              return distToCurrent < distToClosest ? enemy : closest;
            });
            
            const distance = Math.sqrt((target.x - unit.x) ** 2 + (target.y - unit.y) ** 2);
            
            if (distance > unit.range) {
              // Move towards target using A* pathfinding
              const path = findPath(unit.x, unit.y, target.x, target.y);
              if (path.length > 0) {
                const nextStep = path[0];
                const directionX = nextStep.x - unit.x;
                const directionY = nextStep.y - unit.y;
                const stepDistance = Math.sqrt(directionX ** 2 + directionY ** 2);
                
                if (stepDistance > 0) {
                  unit.x += (directionX / stepDistance) * unit.speed;
                  unit.y += (directionY / stepDistance) * unit.speed;
                }
              }
            } else if (currentTime - unit.lastAttack > 1500) {
              // Attack based on unit type
              handleUnitAttack(unit, target, currentTime);
              unit.lastAttack = currentTime;
            }
          }
          
          return unit;
        }).filter(unit => unit.health > 0) // Remove dead units
      );

      // Update elixir
      setGameState(prev => ({
        ...prev,
        playerElixir: Math.min(10, prev.playerElixir + 0.1),
        enemyElixir: Math.min(10, prev.enemyElixir + 0.1),
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));

    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameState.isPlaying, towers, units, findPath]);

  // Enhanced attack handler with proper combat mechanics
  const handleUnitAttack = (attacker: Unit, target: Unit | Tower, currentTime: number) => {
    const attackType = attacker.attackType;
    
    if (attackType === 'melee' || attackType === 'tank') {
      // Melee/Tank attacks - instant damage with visual effects
      const meleeWeapons = attackType === 'tank' ? ['🔨', '⚔️', '🪓', '⛏️'] : ['⚔️', '🗡️', '🔪', '🪓'];
      const weapon = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)];
      
      setAttackEffects(prev => [...prev, {
        id: `${attackType}_${currentTime}`,
        x: target.x,
        y: target.y,
        type: attackType,
        emoji: weapon,
        frame: 0
      }]);
      
      // Apply damage immediately
      applyDamage(attacker, target);
      
      console.log(`${weapon} ${attacker.isPlayer ? 'Player' : 'AI'} ${attackType} unit attacking`);
      
    } else if (attackType === 'ranged') {
      // Ranged attacks - create projectiles
      const rangedWeapons = ['🏹', '🎯', '🪃', '🔫'];
      const projectile = rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)];
      
      setProjectiles(prev => [...prev, {
        id: `ranged_${currentTime}`,
        x: attacker.x,
        y: attacker.y,
        targetX: target.x,
        targetY: target.y,
        damage: attacker.damage,
        isPlayer: attacker.isPlayer,
        type: 'ranged',
        emoji: projectile,
        speed: 8
      }]);
      
      console.log(`🏹 ${attacker.isPlayer ? 'Player' : 'AI'} ranged unit firing ${projectile}`);
      
    } else if (attackType === 'magical') {
      // Magical attacks - create magical projectiles with effects
      const magicalSpells = ['✨', '🔮', '⚡', '🌟', '💫', '🔥', '❄️'];
      const spell = magicalSpells[Math.floor(Math.random() * magicalSpells.length)];
      
      setProjectiles(prev => [...prev, {
        id: `magical_${currentTime}`,
        x: attacker.x,
        y: attacker.y,
        targetX: target.x,
        targetY: target.y,
        damage: attacker.damage,
        isPlayer: attacker.isPlayer,
        type: 'magical',
        emoji: spell,
        speed: 6,
        trail: true
      }]);
      
      // Add magical aura effect around caster
      setAbilityEffects(prev => [...prev, {
        id: `aura_${currentTime}`,
        x: attacker.x,
        y: attacker.y,
        ability: 'magical_aura',
        frame: 0,
        duration: 30
      }]);
      
      console.log(`✨ ${attacker.isPlayer ? 'Player' : 'AI'} magical unit casting ${spell}`);
    }
  };

  // Apply damage to target
  const applyDamage = (attacker: Unit, target: Unit | Tower) => {
    if ('type' in target) {
      // Target is a tower
      setTowers(prevTowers => prevTowers.map(tower => {
        if (tower.id === target.id) {
          const newHealth = Math.max(0, tower.health - attacker.damage);
          return { ...tower, health: newHealth, destroyed: newHealth <= 0 };
        }
        return tower;
      }));
    } else {
      // Target is a unit
      setUnits(prevUnits => prevUnits.map(unit => {
        if (unit.id === target.id) {
          return { ...unit, health: Math.max(0, unit.health - attacker.damage) };
        }
        return unit;
      }));
    }
    
    // Add damage number effect
    setDamageNumbers(prev => [...prev, {
      id: `dmg_${Date.now()}`,
      x: target.x,
      y: target.y - 20,
      damage: attacker.damage,
      isPlayer: attacker.isPlayer
    }]);
  };

  // Update projectiles
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const projectileLoop = setInterval(() => {
      setProjectiles(prevProjectiles => 
        prevProjectiles.map(projectile => {
          const dx = projectile.targetX - projectile.x;
          const dy = projectile.targetY - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < projectile.speed) {
            // Projectile reached target - apply damage
            const targetUnit = units.find(u => 
              Math.abs(u.x - projectile.targetX) < 30 && 
              Math.abs(u.y - projectile.targetY) < 30 &&
              u.isPlayer !== projectile.isPlayer
            );
            
            const targetTower = towers.find(t => 
              Math.abs(t.x - projectile.targetX) < 30 && 
              Math.abs(t.y - projectile.targetY) < 30 &&
              t.isPlayer !== projectile.isPlayer && !t.destroyed
            );
            
            if (targetUnit || targetTower) {
              const target = targetUnit || targetTower!;
              
              // Apply damage
              if (targetUnit) {
                setUnits(prevUnits => prevUnits.map(unit => 
                  unit.id === targetUnit.id 
                    ? { ...unit, health: Math.max(0, unit.health - projectile.damage) }
                    : unit
                ).filter(unit => unit.health > 0));
              } else if (targetTower) {
                setTowers(prevTowers => prevTowers.map(tower => 
                  tower.id === targetTower.id 
                    ? { ...tower, health: Math.max(0, tower.health - projectile.damage), destroyed: tower.health <= projectile.damage }
                    : tower
                ));
              }
              
              // Add damage number
              setDamageNumbers(prev => [...prev, {
                id: `dmg_${Date.now()}`,
                x: projectile.targetX,
                y: projectile.targetY - 20,
                damage: projectile.damage,
                isPlayer: projectile.isPlayer
              }]);
              
              // Add impact effect
              setAttackEffects(prev => [...prev, {
                id: `impact_${Date.now()}`,
                x: projectile.targetX,
                y: projectile.targetY,
                type: projectile.type,
                emoji: projectile.type === 'magical' ? '💥' : '🎯',
                frame: 0
              }]);
            }
            
            return null; // Remove projectile
          }
          
          // Move projectile towards target
          const moveX = (dx / distance) * projectile.speed;
          const moveY = (dy / distance) * projectile.speed;
          
          return {
            ...projectile,
            x: projectile.x + moveX,
            y: projectile.y + moveY
          };
        }).filter(Boolean) as Projectile[]
      );
    }, 50);

    return () => clearInterval(projectileLoop);
  }, [gameState.isPlaying, units, towers]);

  // Update visual effects
  useEffect(() => {
    const effectsLoop = setInterval(() => {
      // Update attack effects
      setAttackEffects(prev => 
        prev.map(effect => ({ ...effect, frame: effect.frame + 1 }))
            .filter(effect => effect.frame < 20)
      );
      
      // Update ability effects
      setAbilityEffects(prev => 
        prev.map(effect => ({ ...effect, frame: effect.frame + 1 }))
            .filter(effect => effect.frame < effect.duration)
      );
      
      // Update damage numbers
      setDamageNumbers(prev => 
        prev.filter(dmg => Date.now() - parseInt(dmg.id.split('_')[1]) < 2000)
      );
    }, 100);

    return () => clearInterval(effectsLoop);
  }, []);

  // Enhanced canvas rendering with effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const drawAuthenticBackground = () => {
      // Solid background to prevent flashing
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#4a5d3a');
      gradient.addColorStop(0.5, '#2d4d2d');
      gradient.addColorStop(1, '#1a3d1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
      
      // Load authentic background image
      const backgroundImg = new Image();
      backgroundImg.crossOrigin = 'anonymous';
      backgroundImg.onload = () => {
        ctx.drawImage(backgroundImg, 0, 0, 800, 600);
        drawGameElements(); // Redraw elements over the background
      };
      backgroundImg.src = 'https://i.imgur.com/UAOuO9a.png';
    };
    
    // Use the authentic background image immediately
    drawAuthenticBackground();
    
    const drawFallbackBackground = () => {
      ctx.fillStyle = '#2a4d3a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw water
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(0, 390, CANVAS_WIDTH, 90);
      
      // Draw bridges
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(135, 390, 60, 90);
      ctx.fillRect(405, 390, 60, 90);
      
      // Battle line in center (overlay)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(800, 300);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Deployment zones (subtle overlay)
      ctx.fillStyle = 'rgba(76, 175, 80, 0.1)'; // Player zone
      ctx.fillRect(0, 480, 800, 120);
      
      ctx.fillStyle = 'rgba(244, 67, 54, 0.1)'; // Enemy zone
      ctx.fillRect(0, 0, 800, 120);
      
      // Lane markers (subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(400, 0);
      ctx.lineTo(400, 600);
      ctx.stroke();
    };
    
    const drawGameElements = () => {
      // Draw ability effects (behind units)
      abilityEffects.forEach((effect: AbilityEffect) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, 1 - effect.frame / effect.duration);
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        
        if (effect.ability === 'magical_aura') {
          // Draw magical aura
          const radius = 15 + (effect.frame * 0.5);
          ctx.strokeStyle = '#9A4DFF';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        ctx.restore();
      });
      
      // Draw towers with authentic images
      const towerImg = new Image();
      towerImg.src = '/towers-authentic.png';
      
      const castleImg = new Image();
      castleImg.src = '/castle-authentic.png';
      
      towers.forEach((tower: Tower) => {
        if (!tower.destroyed) {
          // Try to use authentic images for towers
          const imageSize = tower.type === 'king' ? 60 : 40;
          const currentImg = tower.type === 'king' ? castleImg : towerImg;
          
          if (currentImg.complete) {
            // Draw authentic tower/castle image
            ctx.save();
            if (!tower.isPlayer) {
              // Flip AI towers vertically
              ctx.scale(1, -1);
              ctx.drawImage(currentImg, tower.x - imageSize/2, -(tower.y + imageSize/2), imageSize, imageSize);
            } else {
              ctx.drawImage(currentImg, tower.x - imageSize/2, tower.y - imageSize/2, imageSize, imageSize);
            }
            ctx.restore();
          } else {
            // Fallback to colored rectangles
            ctx.fillStyle = tower.isPlayer ? '#4CAF50' : '#F44336';
            ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
          }
          
          // Health bar
          const healthPercent = tower.health / tower.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(tower.x - 25, tower.y - 35, 50, 8);
          ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
          ctx.fillRect(tower.x - 25, tower.y - 35, 50 * healthPercent, 8);
        }
      });
    
      // Draw units with attack type indicators
      units.forEach((unit: Unit) => {
        // Unit body color based on attack type
        let unitColor = unit.isPlayer ? '#81C784' : '#E57373';
        if (unit.attackType === 'magical') unitColor = unit.isPlayer ? '#9C27B0' : '#E91E63';
        if (unit.attackType === 'tank') unitColor = unit.isPlayer ? '#795548' : '#8D6E63';
        if (unit.attackType === 'ranged') unitColor = unit.isPlayer ? '#2196F3' : '#3F51B5';
        
        ctx.fillStyle = unitColor;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Attack type indicator
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        const typeEmoji: { [key: string]: string } = {
          melee: '⚔️',
          ranged: '🏹',
          magical: '✨',
          tank: '🛡️'
        };
        ctx.fillText(typeEmoji[unit.attackType] || '⚔️', unit.x, unit.y + 3);
        
        // Health bar
        const healthPercent = unit.health / unit.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(unit.x - 12, unit.y - 20, 24, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
        ctx.fillRect(unit.x - 12, unit.y - 20, 24 * healthPercent, 4);
      });
      
      // Draw projectiles
      projectiles.forEach((projectile: Projectile) => {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        
        if (projectile.trail) {
          // Magical projectiles have trails
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillText(projectile.emoji, projectile.x - 5, projectile.y);
          ctx.fillText(projectile.emoji, projectile.x - 10, projectile.y);
          ctx.restore();
        }
        
        ctx.fillText(projectile.emoji, projectile.x, projectile.y);
      });
    
      // Draw attack effects
      attackEffects.forEach((effect: AttackEffect) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, 1 - effect.frame / 20);
        ctx.font = `${20 + effect.frame}px Arial`;
        ctx.textAlign = 'center';
        
        if (effect.type === 'deploy') {
          ctx.fillStyle = '#FFD700';
        } else {
          ctx.fillStyle = '#FF4444';
        }
        
        ctx.fillText(effect.emoji, effect.x, effect.y - effect.frame * 2);
        ctx.restore();
      });
      
      // Draw damage numbers
      damageNumbers.forEach((dmg: DamageNumber) => {
        const age = Date.now() - parseInt(dmg.id.split('_')[1]);
        const alpha = Math.max(0, 1 - age / 2000);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = dmg.isPlayer ? '#4CAF50' : '#F44336';
        ctx.fillText(`-${dmg.damage}`, dmg.x, dmg.y - age * 0.02);
        ctx.restore();
      });
    };
    
    // Initial draw - authentic background first, then game elements
    drawAuthenticBackground();
    drawGameElements();

  }, [units, towers, projectiles, attackEffects, abilityEffects, damageNumbers]);

  return (
    <div className="flex flex-col items-center h-full bg-gradient-to-b from-green-900 to-green-800">
      {/* Game UI */}
      <div className="w-full max-w-2xl bg-black/20 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center text-white mb-2">
          <div>⚡ Player: {Math.floor(gameState.playerElixir)}/10</div>
          <div>⏰ {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}</div>
          <div>⚡ AI: {Math.floor(gameState.enemyElixir)}/10</div>
        </div>
        
        <div className="flex justify-between text-white">
          <div>👑 Player: {gameState.playerCrowns}</div>
          <div>👑 AI: {gameState.enemyCrowns}</div>
        </div>
      </div>

      {/* Battle Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-600 rounded-lg cursor-crosshair"
        onClick={handleCanvasClick}
      />

      {/* Start Button */}
      {!gameState.isPlaying && gameState.phase === 'setup' && (
        <button
          onClick={startBattle}
          className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
        >
          Start Enhanced Battle
        </button>
      )}

      {/* Player Hand */}
      <div className="mt-4 flex gap-2 flex-wrap max-w-2xl">
        {playerHand.map(card => (
          <div
            key={card.id}
            className={`relative bg-gray-800 border-2 rounded-xl p-2 cursor-pointer transition-all hover:scale-105 ${
              gameState.selectedCard?.id === card.id 
                ? 'border-yellow-400 bg-yellow-900/30' 
                : gameState.playerElixir >= card.cost 
                ? 'border-green-400' 
                : 'border-gray-600 opacity-50'
            }`}
            onClick={() => setGameState(prev => ({ 
              ...prev, 
              selectedCard: prev.selectedCard?.id === card.id ? null : card 
            }))}
            onMouseEnter={(e) => {
              setHoveredCard(card);
              setTooltipPosition({ x: e.clientX + 10, y: e.clientY });
            }}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="w-16 h-20 bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg flex flex-col items-center justify-center">
              <div className="text-white text-xs font-bold mb-1">{card.name}</div>
              <div className="text-xs text-gray-300">⚔️{card.attack}</div>
              <div className="text-xs text-gray-300">❤️{card.health}</div>
            </div>
            
            <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {card.cost}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCard && (
        <div 
          className="fixed z-50 bg-gray-900 border border-purple-500 rounded-lg p-3 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="text-white font-bold">{hoveredCard.name}</div>
          <div className="text-sm text-gray-300">Cost: ⚡{hoveredCard.cost}</div>
          <div className="text-sm text-gray-300">Attack: ⚔️{hoveredCard.attack}</div>
          <div className="text-sm text-gray-300">Health: ❤️{hoveredCard.health}</div>
        </div>
      )}
    </div>
  );
};

export default VisualBattleSystemFixed;