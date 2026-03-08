import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Crown, Zap, Timer, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PSG1BattleController from './PSG1BattleController';

interface BattleCard {
  id: string;
  name: string;
  image: string;
  attack: number;
  health: number;
  cost: number;
  rarity: string;
  type: string;
  class: string;
  abilities: string[];
}

interface Unit {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  isPlayer: boolean;
  cardId: string;
  target: Unit | null;
  lastAttack: number;
  range: number;
  lane: 'left' | 'right';
  attackType: 'ranged' | 'melee' | 'magical' | 'tank';
  cardClass: string;
  cardType: string;
  angle?: number;
  velocity?: {x: number, y: number};
  isTower?: boolean;
  deployTime?: number;
}

interface Tower {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'crown' | 'king';
  isPlayer: boolean;
  destroyed: boolean;
  image: string;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  speed: number;
  emoji: string;
  isPlayer: boolean;
}

interface GameState {
  isPlaying: boolean;
  timeLeft: number;
  playerCrowns: number;
  enemyCrowns: number;
  playerElixir: number;
  enemyElixir: number;
  selectedCard: BattleCard | null;
  phase: 'battle' | 'results';
}

interface THCClashGameBoardProps {
  playerDeck: BattleCard[];
  captainCard?: BattleCard;
  onBattleEnd: (winner: 'player' | 'ai', results: any) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  nftData?: {
    nft?: { image?: string };
    bonuses?: { attackBonus?: number };
  };
  playerWallet?: string;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Authentic THC CLASH game assets - using your uploaded images
const GAME_BOARD_BG = '/game-assets/thc-clash-gameboard.png';
const TOWER_FULL = 'https://i.imgur.com/M7Bear7.png';
const TOWER_HALF = 'https://i.imgur.com/nXACiv2.png';
const TOWER_DEAD = 'https://i.imgur.com/cCzoRkR.png';
const CASTLE_IMAGE = 'https://i.imgur.com/hYNPa50.png';

export default function THCClashGameBoard({
  playerDeck,
  captainCard,
  onBattleEnd,
  difficulty = 'medium',
  nftData,
  playerWallet
}: THCClashGameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    timeLeft: 180,
    playerCrowns: 0,
    enemyCrowns: 0,
    playerElixir: 5,
    enemyElixir: 5,
    selectedCard: null,
    phase: 'battle'
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [draggedCard, setDraggedCard] = useState<BattleCard | null>(null);
  const [dragPosition, setDragPosition] = useState<{x: number, y: number} | null>(null);
  
  // PSG1 controller state
  const [psg1Enabled, setPsg1Enabled] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  
  // Check PSG1 status from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('thc-clash-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setPsg1Enabled(settings.psg1Enabled || false);
      } catch (e) {
        console.error('Error loading PSG1 settings:', e);
      }
    }
  }, []);

  // Initialize towers based on the provided layout
  const initializeTowers = useCallback(() => {
    const initialTowers: Tower[] = [
      // Player towers (bottom)
      {
        id: 'player-left-tower',
        x: 200,
        y: 480,
        health: 1000,
        maxHealth: 1000,
        type: 'crown',
        isPlayer: true,
        destroyed: false,
        image: TOWER_FULL
      },
      {
        id: 'player-right-tower',
        x: 600,
        y: 480,
        health: 1000,
        maxHealth: 1000,
        type: 'crown',
        isPlayer: true,
        destroyed: false,
        image: TOWER_FULL
      },
      {
        id: 'player-castle',
        x: 400,
        y: 520,
        health: 2000,
        maxHealth: 2000,
        type: 'king',
        isPlayer: true,
        destroyed: false,
        image: CASTLE_IMAGE
      },
      // AI towers (top)
      {
        id: 'ai-left-tower',
        x: 200,
        y: 120,
        health: 1000,
        maxHealth: 1000,
        type: 'crown',
        isPlayer: false,
        destroyed: false,
        image: TOWER_FULL
      },
      {
        id: 'ai-right-tower',
        x: 600,
        y: 120,
        health: 1000,
        maxHealth: 1000,
        type: 'crown',
        isPlayer: false,
        destroyed: false,
        image: TOWER_FULL
      },
      {
        id: 'ai-castle',
        x: 400,
        y: 80,
        health: 2000,
        maxHealth: 2000,
        type: 'king',
        isPlayer: false,
        destroyed: false,
        image: CASTLE_IMAGE
      }
    ];
    setTowers(initialTowers);
  }, []);

  // Initialize game
  useEffect(() => {
    initializeTowers();
  }, [initializeTowers]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw background with fallback
      ctx.fillStyle = '#2a5c2a'; // Green battlefield fallback
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Try to load background image
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      };
      bgImg.src = GAME_BOARD_BG;

      // Draw towers with proper loading
      towers.forEach(tower => {
        // Draw tower shape first as fallback
        ctx.fillStyle = tower.isPlayer ? '#4CAF50' : '#F44336';
        ctx.fillRect(tower.x - 30, tower.y - 40, 60, 80);
        
        // Load and draw tower image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, tower.x - 30, tower.y - 40, 60, 80);
        };
        
        // Determine tower image based on health
        let towerSrc = TOWER_FULL;
        if (tower.destroyed) {
          towerSrc = TOWER_DEAD;
        } else if (tower.health < tower.maxHealth * 0.5) {
          towerSrc = TOWER_HALF;
        }
        
        if (tower.type === 'king') {
          towerSrc = CASTLE_IMAGE;
        }
        
        img.src = towerSrc;
        
        // Health bar
        if (!tower.destroyed) {
          const healthPercent = tower.health / tower.maxHealth;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(tower.x - 25, tower.y - 50, 50, 8);
          ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
          ctx.fillRect(tower.x - 25, tower.y - 50, 50 * healthPercent, 8);
          
          // Health text
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${tower.health}/${tower.maxHealth}`, tower.x, tower.y - 55);
        }
        
        // Tower label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(tower.type === 'king' ? '👑' : '🏰', tower.x, tower.y + 50);
      });

      // Draw units with emoji fallbacks
      units.forEach(unit => {
        const card = playerDeck.find(c => c.id === unit.cardId);
        
        // Draw unit circle as base
        ctx.fillStyle = unit.isPlayer ? '#4CAF50' : '#F44336';
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        // Try to load card image
        if (card?.image) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(unit.x, unit.y, 18, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(img, unit.x - 18, unit.y - 18, 36, 36);
            ctx.restore();
          };
          img.src = card.image;
        } else {
          // Emoji fallback based on card type
          let unitEmoji = unit.isPlayer ? '🌿' : '💀';
          if (card?.class?.includes('tank')) unitEmoji = unit.isPlayer ? '🛡️' : '⚔️';
          if (card?.class?.includes('ranged')) unitEmoji = unit.isPlayer ? '🏹' : '💥';
          if (card?.class?.includes('spell')) unitEmoji = unit.isPlayer ? '✨' : '🔥';
          
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(unitEmoji, unit.x, unit.y + 8);
        }
        
        // Health bar
        const healthPercent = unit.health / unit.maxHealth;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(unit.x - 15, unit.y - 30, 30, 4);
        ctx.fillStyle = unit.isPlayer ? '#00ff88' : '#ff4444';
        ctx.fillRect(unit.x - 15, unit.y - 30, 30 * healthPercent, 4);
        
        // Unit name
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(card?.name || 'Unit', unit.x, unit.y + 35);
      });

      // Draw projectiles
      projectiles.forEach(projectile => {
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(projectile.emoji, projectile.x, projectile.y);
      });

      // Update game state
      updateGameLogic();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, units, towers, projectiles, playerDeck]);

  const updateGameLogic = () => {
    // Update projectiles
    setProjectiles(prev => prev.map(projectile => {
      const dx = projectile.targetX - projectile.x;
      const dy = projectile.targetY - projectile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < projectile.speed) {
        // Projectile hit target - damage towers
        setTowers(towers => towers.map(tower => {
          const towerDistance = Math.sqrt((tower.x - projectile.targetX) ** 2 + (tower.y - projectile.targetY) ** 2);
          if (towerDistance < 50 && tower.isPlayer !== projectile.isPlayer) {
            const newHealth = Math.max(0, tower.health - projectile.damage);
            if (newHealth === 0 && !tower.destroyed) {
              // Tower destroyed - update crowns
              setGameState(prev => ({
                ...prev,
                playerCrowns: projectile.isPlayer ? prev.playerCrowns + 1 : prev.playerCrowns,
                enemyCrowns: !projectile.isPlayer ? prev.enemyCrowns + 1 : prev.enemyCrowns
              }));
            }
            return { ...tower, health: newHealth, destroyed: newHealth === 0 };
          }
          return tower;
        }));
        return null;
      }
      
      const moveX = (dx / distance) * projectile.speed;
      const moveY = (dy / distance) * projectile.speed;
      
      return {
        ...projectile,
        x: projectile.x + moveX,
        y: projectile.y + moveY
      };
    }).filter(Boolean) as Projectile[]);

    // Update units
    setUnits(prev => prev.map(unit => {
      if (!unit.target) {
        // Find nearest enemy tower
        const enemyTowers = towers.filter(t => t.isPlayer !== unit.isPlayer && !t.destroyed);
        if (enemyTowers.length > 0) {
          const nearest = enemyTowers.reduce((closest, tower) => {
            const distToTower = Math.sqrt((tower.x - unit.x) ** 2 + (tower.y - unit.y) ** 2);
            const distToClosest = Math.sqrt((closest.x - unit.x) ** 2 + (closest.y - unit.y) ** 2);
            return distToTower < distToClosest ? tower : closest;
          });
          
          unit.target = nearest as any;
        }
      }

      if (unit.target) {
        const dx = unit.target.x - unit.x;
        const dy = unit.target.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= unit.range) {
          // Attack
          if (Date.now() - unit.lastAttack > 1000) {
            // Create projectile with card-specific emoji
            const card = playerDeck.find(c => c.id === unit.cardId);
            let projectileEmoji = unit.isPlayer ? '🌿' : '💥';
            
            if (card?.class?.includes('tank')) projectileEmoji = unit.isPlayer ? '🛡️' : '⚔️';
            if (card?.class?.includes('ranged')) projectileEmoji = unit.isPlayer ? '🏹' : '🔥';
            if (card?.class?.includes('spell')) projectileEmoji = unit.isPlayer ? '✨' : '🌟';
            if (card?.name?.toLowerCase().includes('weed')) projectileEmoji = '🌿';
            if (card?.name?.toLowerCase().includes('smoke')) projectileEmoji = '💨';
            if (card?.name?.toLowerCase().includes('fire')) projectileEmoji = '🔥';
            
            setProjectiles(prev => [...prev, {
              id: `projectile-${Date.now()}`,
              x: unit.x,
              y: unit.y,
              targetX: unit.target!.x,
              targetY: unit.target!.y,
              damage: unit.damage,
              speed: 8,
              emoji: projectileEmoji,
              isPlayer: unit.isPlayer
            }]);
            
            unit.lastAttack = Date.now();
          }
        } else {
          // Move towards target
          const moveX = (dx / distance) * unit.speed;
          const moveY = (dy / distance) * unit.speed;
          unit.x += moveX;
          unit.y += moveY;
        }
      }

      return unit;
    }));

    // Update elixir and timer
    setGameState(prev => {
      const newTimeLeft = Math.max(0, prev.timeLeft - 1/60); // Decrease by 1 second per 60 frames
      
      // Check win conditions
      if (newTimeLeft <= 0 || prev.playerCrowns >= 3 || prev.enemyCrowns >= 3) {
        const winner = prev.playerCrowns > prev.enemyCrowns ? 'player' : 'ai';
        setTimeout(() => {
          onBattleEnd(winner, {
            playerCrowns: prev.playerCrowns,
            enemyCrowns: prev.enemyCrowns,
            timeLeft: newTimeLeft,
            unitsDeployed: units.filter(u => u.isPlayer).length
          });
        }, 100);
      }
      
      return {
        ...prev,
        timeLeft: newTimeLeft,
        playerElixir: Math.min(10, prev.playerElixir + 0.028), // +1 every 2.8 seconds
        enemyElixir: Math.min(10, prev.enemyElixir + 0.028)
      };
    });

    // AI deployment logic
    if (gameState.enemyElixir >= 4 && Math.random() < 0.02) { // 2% chance per frame
      deployAIUnit();
    }
  };

  const deployAIUnit = () => {
    const aiCard = playerDeck[Math.floor(Math.random() * playerDeck.length)];
    if (aiCard && gameState.enemyElixir >= aiCard.cost) {
      const aiUnit: Unit = {
        id: `ai-unit-${Date.now()}`,
        x: 200 + Math.random() * 400, // Random x position in AI area
        y: 150,
        health: aiCard.health,
        maxHealth: aiCard.health,
        damage: aiCard.attack,
        speed: 1,
        isPlayer: false,
        cardId: aiCard.id,
        target: null,
        lastAttack: 0,
        range: 60,
        lane: Math.random() > 0.5 ? 'left' : 'right',
        attackType: 'ranged',
        cardClass: aiCard.class,
        cardType: aiCard.type
      };
      
      setUnits(prev => [...prev, aiUnit]);
      setGameState(prev => ({ ...prev, enemyElixir: prev.enemyElixir - aiCard.cost }));
      
      console.log('🤖 AI deployed:', aiCard.name);
    }
  };

  const startBattle = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, timeLeft: 180 }));
    console.log('🎮 THC Clash Battle: Starting game loop');
    
    // Deploy initial AI unit after 3 seconds
    setTimeout(() => {
      deployAIUnit();
    }, 3000);
  };

  const handleCanvasDrop = (event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    if (!draggedCard || !gameState.isPlaying) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to canvas coordinates
    const canvasX = (x / rect.width) * CANVAS_WIDTH;
    const canvasY = (y / rect.height) * CANVAS_HEIGHT;
    
    // Deploy unit
    if (gameState.playerElixir >= draggedCard.cost && canvasY > CANVAS_HEIGHT / 2) {
      const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        x: canvasX,
        y: canvasY,
        health: draggedCard.health,
        maxHealth: draggedCard.health,
        damage: draggedCard.attack,
        speed: 1,
        isPlayer: true,
        cardId: draggedCard.id,
        target: null,
        lastAttack: 0,
        range: 50,
        lane: canvasX < CANVAS_WIDTH / 2 ? 'left' : 'right',
        attackType: 'ranged',
        cardClass: draggedCard.class,
        cardType: draggedCard.type
      };
      
      setUnits(prev => [...prev, newUnit]);
      setGameState(prev => ({
        ...prev,
        playerElixir: prev.playerElixir - draggedCard.cost,
        selectedCard: null
      }));
      
      console.log('🏃 Unit deployed:', draggedCard.name, `at ${canvasX},${canvasY}`);
    }
    
    setDraggedCard(null);
    setDragPosition(null);
  };

  const handleCardDragStart = (card: BattleCard) => {
    setDraggedCard(card);
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
    setDragPosition(null);
  };
  
  // PSG1 controller handlers
  const handlePSG1CardSelect = (cardIndex: number) => {
    const validIndex = Math.min(cardIndex, playerDeck.length - 1);
    setSelectedCardIndex(validIndex);
    console.log('🎮 PSG1: Selected card', validIndex, playerDeck[validIndex]?.name);
  };
  
  const handlePSG1CardDeploy = (x: number, y: number) => {
    if (!gameState.isPlaying) return;
    
    const selectedCard = playerDeck[selectedCardIndex];
    if (!selectedCard || gameState.playerElixir < selectedCard.cost) {
      console.log('🎮 PSG1: Cannot deploy card - insufficient elixir or no card selected');
      return;
    }
    
    // Convert PSG1 coordinates (854x480) to canvas coordinates (800x600)
    const canvasX = (x / 854) * CANVAS_WIDTH;
    const canvasY = (y / 480) * CANVAS_HEIGHT;
    
    console.log('🎮 PSG1: Deploying card', selectedCard.name, 'at', canvasX, canvasY);
    
    // Deploy the card at the specified position
    handleCanvasDrop({
      dataTransfer: { getData: () => JSON.stringify(selectedCard) },
      clientX: canvasX,
      clientY: canvasY,
      preventDefault: () => {},
      currentTarget: canvasRef.current
    } as any);
  };
  
  const handlePSG1MenuToggle = () => {
    console.log('🎮 PSG1: Menu toggle requested');
    // Could open settings or pause menu
  };

  if (gameState.phase === 'results') {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-green-900 to-black p-8 rounded-xl text-center max-w-md"
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Battle Complete!</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <PSG1BattleController
      isEnabled={psg1Enabled}
      onCardSelect={handlePSG1CardSelect}
      onCardDeploy={handlePSG1CardDeploy}
      onMenuToggle={handlePSG1MenuToggle}
    >
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900 to-black">
        <button
          onClick={() => onBattleEnd('ai', {})}
          className="flex items-center gap-2 text-white hover:text-green-400"
        >
          <ArrowLeft className="w-5 h-5" />
          Exit Battle
        </button>
        
        <div className="flex items-center gap-6 text-white">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-400" />
            <span>{gameState.enemyCrowns}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            <span>{Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-green-400" />
            <span>{gameState.playerCrowns}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-purple-400" />
          <span>{Math.floor(gameState.playerElixir)}/10</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-600">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-yellow-600 rounded-lg shadow-2xl bg-green-800"
          onDrop={handleCanvasDrop}
          onDragOver={(e) => e.preventDefault()}
        />
      </div>

      {/* Card Hand */}
      <div className="p-4 bg-gradient-to-r from-green-900 to-black">
        <div className="flex justify-center gap-4">
          {!gameState.isPlaying ? (
            <button
              onClick={startBattle}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-800 text-white font-bold rounded-lg hover:from-green-500 hover:to-green-700 transition-all transform hover:scale-105"
            >
              🔥 START BATTLE 🔥
            </button>
          ) : (
            playerDeck.slice(0, 4).map((card, index) => (
              <motion.div
                key={card.id}
                draggable
                onDragStart={() => handleCardDragStart(card)}
                onDragEnd={handleCardDragEnd}
                className={`
                  relative w-20 h-28 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing
                  ${gameState.playerElixir >= card.cost ? 'opacity-100' : 'opacity-50'}
                  transform hover:scale-110 transition-all
                `}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Cost */}
                <div className="absolute top-1 right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {card.cost}
                </div>
                
                {/* Stats */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1">
                  <div className="flex justify-between">
                    <span>⚔️{card.attack}</span>
                    <span>❤️{card.health}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      </div>
    </PSG1BattleController>
  );
}