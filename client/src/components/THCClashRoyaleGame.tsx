import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Target, Timer, Trophy, Shield, Sword, ArrowLeft } from 'lucide-react';

// Game constants matching Clash Royale mechanics
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 40;
const GRID_WIDTH = Math.floor(CANVAS_WIDTH / CELL_SIZE);
const GRID_HEIGHT = Math.floor(CANVAS_HEIGHT / CELL_SIZE);

interface GameCard {
  id: string;
  name: string;
  image: string;
  cost: number;
  attack: number;
  health: number;
  type: 'troop' | 'spell' | 'building';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
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
}

interface Unit {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  range: number;
  isPlayer: boolean;
  cardId: string;
  target: Tower | Unit | null;
  lastAttack: number;
  moving: boolean;
}

interface THCClashRoyaleGameProps {
  playerDeck: GameCard[];
  onBack: () => void;
}

const THCClashRoyaleGame: React.FC<THCClashRoyaleGameProps> = ({ playerDeck, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Game state
  const [gameTime, setGameTime] = useState(180); // 3 minutes in seconds
  const [playerElixir, setPlayerElixir] = useState(5);
  const [aiElixir, setAiElixir] = useState(5);
  const [playerCrowns, setPlayerCrowns] = useState(0);
  const [aiCrowns, setAiCrowns] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  
  // Battle entities
  const [towers, setTowers] = useState<Tower[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [playerHand, setPlayerHand] = useState<GameCard[]>([]);
  
  // PSX1 container styling
  const psxStyle = {
    background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)',
    border: '4px solid #00ffff',
    borderRadius: '12px',
    boxShadow: '0 0 20px #00ffff, inset 0 0 20px rgba(0,255,255,0.1)',
    fontFamily: 'monospace'
  };

  // THC themed cards using your authentic collection
  const gameCards: GameCard[] = [
    {
      id: 'thc-warrior',
      name: 'THC Warrior',
      image: '/attached_assets/OGKush_1752183385525.jpg',
      cost: 3,
      attack: 120,
      health: 180,
      type: 'troop',
      rarity: 'common',
      description: 'Strong melee fighter'
    },
    {
      id: 'sour-diesel-archer',
      name: 'Sour Diesel Archer',
      image: '/attached_assets/Sour Diesel1_1752183743205.jpg',
      cost: 2,
      attack: 80,
      health: 100,
      type: 'troop',
      rarity: 'common',
      description: 'Ranged attacker'
    },
    {
      id: 'gelato-mage',
      name: 'Gelato Mage',
      image: '/attached_assets/gelato_1752183529839.jpg',
      cost: 4,
      attack: 150,
      health: 120,
      type: 'troop',
      rarity: 'rare',
      description: 'Magical damage dealer'
    },
    {
      id: 'regz-tank',
      name: 'Regz Tank',
      image: '/attached_assets/Regz_1752183158112.jpg',
      cost: 5,
      attack: 200,
      health: 400,
      type: 'troop',
      rarity: 'epic',
      description: 'Heavy armored unit'
    },
    {
      id: 'mids-spell',
      name: 'Mids Blast',
      image: '/attached_assets/Mids_1752183315749.jpg',
      cost: 3,
      attack: 180,
      health: 0,
      type: 'spell',
      rarity: 'common',
      description: 'Area damage spell'
    },
    {
      id: 'bank-tower',
      name: 'Bank Tower',
      image: '/attached_assets/bank1_1752188062383.jpg',
      cost: 4,
      attack: 100,
      health: 300,
      type: 'building',
      rarity: 'rare',
      description: 'Defensive structure'
    }
  ];

  // Initialize towers and game state
  useEffect(() => {
    const initialTowers: Tower[] = [
      // Player towers (bottom)
      { id: 'player-left', x: 200, y: 520, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: true, destroyed: false },
      { id: 'player-right', x: 600, y: 520, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: true, destroyed: false },
      { id: 'player-king', x: 400, y: 560, health: 2400, maxHealth: 2400, type: 'king', isPlayer: true, destroyed: false },
      
      // AI towers (top)
      { id: 'ai-left', x: 200, y: 80, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: false, destroyed: false },
      { id: 'ai-right', x: 600, y: 80, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: false, destroyed: false },
      { id: 'ai-king', x: 400, y: 40, health: 2400, maxHealth: 2400, type: 'king', isPlayer: false, destroyed: false }
    ];
    setTowers(initialTowers);
    console.log('🏰 Towers initialized:', initialTowers.length);
    
    // Initialize player hand
    const initialHand = playerDeck.length > 0 ? playerDeck.slice(0, 4) : gameCards.slice(0, 4);
    setPlayerHand(initialHand);
    console.log('🃏 Initial hand set:', initialHand.map(c => c.name));
    
    // Draw initial game state
    setTimeout(() => drawGame(), 100);
  }, [playerDeck]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    console.log('🎮 THC Clash Royale: Starting game loop');

    const gameLoop = () => {
      // Update game time
      setGameTime(prev => {
        const newTime = prev - 1/60; // 60 FPS
        if (newTime <= 0) {
          console.log('⏰ Game time ended');
          endGame();
          return 0;
        }
        return newTime;
      });

      // Elixir regeneration (every 2.8 seconds)
      const elixirInterval = Math.floor(Date.now() / 2800);
      if (elixirInterval % 1 === 0) {
        setPlayerElixir(prev => Math.min(10, prev + 0.02)); // Slower regen for better gameplay
        setAiElixir(prev => Math.min(10, prev + 0.02));
      }

      // Update units
      updateUnits();
      
      // AI logic - more strategic
      if (Math.random() < 0.005 && aiElixir >= 3) { // AI plays less frequently but more strategically
        playAICard();
      }

      // Draw game
      drawGame();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    console.log('🎮 Game loop initialized');
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        console.log('🛑 Game loop stopped');
      }
    };
  }, [gameStarted, gameEnded, units, towers]);

  const updateUnits = () => {
    setUnits(prevUnits => {
      return prevUnits.map(unit => {
        // Find target if none
        if (!unit.target) {
          const enemyTowers = towers.filter(t => t.isPlayer !== unit.isPlayer && !t.destroyed);
          if (enemyTowers.length > 0) {
            unit.target = enemyTowers[0];
          }
        }

        // Move towards target
        if (unit.target && 'destroyed' in unit.target && !unit.target.destroyed) {
          const dx = unit.target.x - unit.x;
          const dy = unit.target.y - unit.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > unit.range) {
            // Move towards target
            unit.x += (dx / distance) * unit.speed;
            unit.y += (dy / distance) * unit.speed;
            unit.moving = true;
          } else {
            // Attack target
            unit.moving = false;
            const now = Date.now();
            if (now - unit.lastAttack > 1000) { // 1 second attack cooldown
              attackTarget(unit, unit.target);
              unit.lastAttack = now;
            }
          }
        }

        return unit;
      }).filter(unit => unit.health > 0);
    });
  };

  const attackTarget = (attacker: Unit, target: Tower | Unit) => {
    if ('destroyed' in target) {
      // Attacking a tower
      setTowers(prevTowers => 
        prevTowers.map(tower => {
          if (tower.id === (target as Tower).id) {
            const newHealth = Math.max(0, tower.health - attacker.attack);
            if (newHealth === 0 && !tower.destroyed) {
              tower.destroyed = true;
              if (tower.type === 'crown') {
                if (tower.isPlayer) {
                  setAiCrowns(prev => prev + 1);
                } else {
                  setPlayerCrowns(prev => prev + 1);
                }
              }
            }
            return { ...tower, health: newHealth };
          }
          return tower;
        })
      );
    } else {
      // Attacking another unit
      setUnits(prevUnits =>
        prevUnits.map(unit => {
          if (unit.id === (target as Unit).id) {
            return { ...unit, health: Math.max(0, unit.health - attacker.attack) };
          }
          return unit;
        })
      );
    }
  };

  const playAICard = () => {
    const availableCards = gameCards.filter(card => card.cost <= Math.floor(aiElixir));
    if (availableCards.length === 0) return;

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    const spawnX = 300 + Math.random() * 200;
    const spawnY = 100 + Math.random() * 100;

    if (randomCard.type === 'troop') {
      spawnUnit(randomCard, spawnX, spawnY, false);
      setAiElixir(prev => prev - randomCard.cost);
    }
  };

  const spawnUnit = (card: GameCard, x: number, y: number, isPlayer: boolean) => {
    const newUnit: Unit = {
      id: `${card.id}-${Date.now()}-${Math.random()}`,
      x,
      y,
      health: card.health,
      maxHealth: card.health,
      attack: card.attack,
      speed: 1.5, // Balanced speed
      range: card.type === 'troop' ? 40 : 80,
      isPlayer,
      cardId: card.id,
      target: null,
      lastAttack: 0,
      moving: false
    };

    console.log('🏃 Unit spawned:', {
      name: card.name,
      position: `${x},${y}`,
      stats: `${card.attack}ATK/${card.health}HP`,
      player: isPlayer ? 'Player' : 'AI'
    });

    setUnits(prev => [...prev, newUnit]);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedCard || !gameStarted) {
      console.log('❌ Cannot deploy: No card selected or game not started');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log('🎯 Canvas click at:', x, y, 'Card:', selectedCard.name, 'Cost:', selectedCard.cost, 'Elixir:', Math.floor(playerElixir));

    // Check if click is in player deployment zone (bottom half)
    if (y > CANVAS_HEIGHT / 2 && selectedCard.cost <= Math.floor(playerElixir)) {
      console.log('✅ Valid deployment zone and elixir');
      
      if (selectedCard.type === 'troop') {
        console.log('🗡️ Spawning unit:', selectedCard.name);
        spawnUnit(selectedCard, x, y, true);
        setPlayerElixir(prev => prev - selectedCard.cost);
        setSelectedCard(null);
      } else if (selectedCard.type === 'spell') {
        console.log('✨ Casting spell:', selectedCard.name);
        // Cast spell at location
        castSpell(selectedCard, x, y);
        setPlayerElixir(prev => prev - selectedCard.cost);
        setSelectedCard(null);
      }
    } else {
      console.log('❌ Invalid deployment: Wrong zone or insufficient elixir');
    }
  };

  const castSpell = (card: GameCard, x: number, y: number) => {
    // Find all enemy units in spell radius
    const radius = 80;
    setUnits(prevUnits =>
      prevUnits.map(unit => {
        if (!unit.isPlayer) {
          const distance = Math.sqrt((unit.x - x) ** 2 + (unit.y - y) ** 2);
          if (distance <= radius) {
            return { ...unit, health: Math.max(0, unit.health - card.attack) };
          }
        }
        return unit;
      })
    );
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not found for drawing');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas context not available');
      return;
    }

    // Clear canvas with THC background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a4d2e');
    gradient.addColorStop(0.5, '#2d5a3d');
    gradient.addColorStop(1, '#1a4d2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw river in middle
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(0, CANVAS_HEIGHT * 0.45, CANVAS_WIDTH, CANVAS_HEIGHT * 0.1);

    // Draw bridge
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(CANVAS_WIDTH * 0.4, CANVAS_HEIGHT * 0.45, CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.1);

    // Draw towers
    towers.forEach(tower => {
      if (tower.destroyed) return;

      ctx.fillStyle = tower.isPlayer ? '#4CAF50' : '#F44336';
      
      if (tower.type === 'king') {
        ctx.fillRect(tower.x - 25, tower.y - 25, 50, 50);
        // Crown on king tower
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(tower.x - 15, tower.y - 35, 30, 15);
      } else {
        ctx.fillRect(tower.x - 20, tower.y - 20, 40, 40);
      }

      // Health bar
      const healthPercent = tower.health / tower.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(tower.x - 25, tower.y - 40, 50, 6);
      ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(tower.x - 25, tower.y - 40, 50 * healthPercent, 6);
    });

    // Draw units
    units.forEach(unit => {
      ctx.fillStyle = unit.isPlayer ? '#2196F3' : '#E91E63';
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, 15, 0, 2 * Math.PI);
      ctx.fill();

      // Health bar
      const healthPercent = unit.health / unit.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(unit.x - 15, unit.y - 25, 30, 4);
      ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(unit.x - 15, unit.y - 25, 30 * healthPercent, 4);
    });

    // Draw deployment zone highlight if card selected
    if (selectedCard) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    }
  };

  const startGame = () => {
    console.log('🚀 Starting THC Clash Royale battle!');
    console.log('👑 Player deck:', playerDeck?.length || 0, 'cards');
    setGameStarted(true);
    setGameTime(180);
    setPlayerElixir(5);
    setAiElixir(5);
    setPlayerCrowns(0);
    setAiCrowns(0);
    setUnits([]);
    
    // Refresh player hand
    const initialHand = playerDeck.length > 0 ? playerDeck.slice(0, 4) : gameCards.slice(0, 4);
    setPlayerHand(initialHand);
    console.log('🃏 Starting hand:', initialHand.map(c => c.name));
  };

  const endGame = () => {
    setGameEnded(true);
    if (playerCrowns > aiCrowns) {
      setWinner('player');
    } else if (aiCrowns > playerCrowns) {
      setWinner('ai');
    } else {
      setWinner('draw');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col" style={psxStyle}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/30 border-b-2 border-cyan-400">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        
        <div className="flex items-center gap-6 text-cyan-400 font-mono">
          <div className="flex items-center gap-2">
            <Timer size={20} />
            <span className="text-xl font-bold">{formatTime(gameTime)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Crown size={16} className="text-blue-400" />
              <span>{playerCrowns}</span>
            </div>
            <span>-</span>
            <div className="flex items-center gap-1">
              <Crown size={16} className="text-red-400" />
              <span>{aiCrowns}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Zap size={20} className="text-purple-400" />
          <span className="text-xl font-bold text-purple-400">{Math.floor(playerElixir)}/10</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="border-2 border-cyan-400 rounded-lg cursor-crosshair"
          style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #228B22 100%)' }}
        />
      </div>

      {/* Cards Hand */}
      <div className="p-4 bg-black/30 border-t-2 border-cyan-400">
        <div className="flex justify-center gap-2">
          {playerHand.map((card, index) => (
            <motion.div
              key={`${card.id}-${index}`}
              className={`relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-2 cursor-pointer border-2 transition-all ${
                selectedCard?.id === card.id 
                  ? 'border-cyan-400 shadow-lg shadow-cyan-400/50 scale-105' 
                  : 'border-gray-600 hover:border-gray-400'
              } ${card.cost > Math.floor(playerElixir) ? 'opacity-50' : ''}`}
              onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={card.image}
                alt={card.name}
                className="w-16 h-16 object-cover rounded-md mb-1"
                onError={(e) => {
                  console.log('❌ Image failed to load:', card.image);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23333"/><text x="32" y="32" text-anchor="middle" fill="white" font-size="8">' + card.name.slice(0,8) + '</text></svg>';
                }}
              />
              <div className="text-xs text-white text-center font-mono">
                <div className="font-bold">{card.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-1">
                    <Zap size={12} className="text-purple-400" />
                    {card.cost}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sword size={12} className="text-red-400" />
                    {card.attack}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game Start/End Overlays */}
      <AnimatePresence>
        {!gameStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-center p-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-cyan-400">
              <h2 className="text-3xl font-bold text-cyan-400 mb-4">THC CLASH ROYALE</h2>
              <p className="text-white mb-6">Deploy your cannabis warriors to destroy enemy towers!</p>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xl transition-colors"
              >
                START BATTLE
              </button>
            </div>
          </motion.div>
        )}

        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-center p-8 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-cyan-400">
              <Trophy size={64} className={`mx-auto mb-4 ${winner === 'player' ? 'text-gold' : 'text-gray-400'}`} />
              <h2 className="text-3xl font-bold text-cyan-400 mb-2">
                {winner === 'player' ? 'VICTORY!' : winner === 'ai' ? 'DEFEAT!' : 'DRAW!'}
              </h2>
              <p className="text-white mb-6">Crowns: {playerCrowns} - {aiCrowns}</p>
              <button
                onClick={onBack}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
              >
                RETURN TO MENU
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default THCClashRoyaleGame;