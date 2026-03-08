import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Crown, Zap, Shield, Heart, Target, ArrowLeft } from 'lucide-react';

interface GameCard {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  rarity: string;
  image: string;
  type: 'minion' | 'tower' | 'spell';
  range?: number;
  speed?: number;
  abilities?: string[];
  isNFTCard?: boolean;
}

interface BattleUnit {
  id: string;
  name: string;
  image: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  team: 'player' | 'ai';
  type: 'minion' | 'tower' | 'spell';
  range: number;
  speed: number;
  abilities: string[];
  isMoving: boolean;
  targetId?: string;
  targetX?: number;
  targetY?: number;
  lastAttackTime: number;
  attackCooldown: number;
  isBuilding: boolean;
}

interface Tower {
  id: string;
  team: 'player' | 'ai';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  range: number;
  type: 'side' | 'main';
}

interface BattlefieldProps {
  playerDeck: GameCard[];
  playerNFTs?: any[];
  onGameEnd: (winner: 'player' | 'ai') => void;
  onBack: () => void;
}

const BATTLEFIELD_WIDTH = 800;
const BATTLEFIELD_HEIGHT = 600;
const BRIDGE_Y = BATTLEFIELD_HEIGHT / 2;

const THCClashBattlefield: React.FC<BattlefieldProps> = ({ 
  playerDeck, 
  playerNFTs, 
  onGameEnd, 
  onBack 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Game state
  const [gameTime, setGameTime] = useState(0);
  const [playerMana, setPlayerMana] = useState(5);
  const [aiMana, setAiMana] = useState(5);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  
  // Battle units and towers
  const [battleUnits, setBattleUnits] = useState<BattleUnit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  
  // Admin gameboard integration
  const [adminGameboard, setAdminGameboard] = useState<any>(null);

  // Load admin gameboard and initialize towers
  useEffect(() => {
    const loadAdminGameboardAndTowers = async () => {
      try {
        console.log('🔍 Loading admin gameboard for battlefield...');
        
        // Try loading from server first
        const response = await fetch('/api/admin/load-pve-gameboard');
        const result = await response.json();
        
        if (result.success && result.gameboard) {
          console.log('✅ Admin PvE gameboard loaded from server for battlefield');
          setAdminGameboard(result.gameboard);
          
          // Use admin towers if available
          const adminTowers = result.gameboard.elements?.filter((el: any) => 
            el.type === 'tower' || el.type === 'castle'
          ) || [];
          
          if (adminTowers.length > 0) {
            const battleTowers: Tower[] = adminTowers.map((tower: any) => ({
              id: tower.id,
              team: tower.team as 'player' | 'ai',
              x: tower.x,
              y: tower.y,
              health: tower.health || 800,
              maxHealth: tower.maxHealth || 800,
              attack: tower.attack || 80,
              range: 120,
              type: tower.type === 'castle' ? 'main' : 'side'
            }));
            setTowers(battleTowers);
            return;
          }
        }
        
        // Fallback to local storage
        const localBoard = localStorage.getItem('thc-clash-pve-gameboard');
        if (localBoard) {
          const boardData = JSON.parse(localBoard);
          console.log('✅ Admin PvE gameboard loaded from local storage for battlefield');
          setAdminGameboard(boardData);
          
          const adminTowers = boardData.elements?.filter((el: any) => 
            el.type === 'tower' || el.type === 'castle'
          ) || [];
          
          if (adminTowers.length > 0) {
            const battleTowers: Tower[] = adminTowers.map((tower: any) => ({
              id: tower.id,
              team: tower.team as 'player' | 'ai',
              x: tower.x,
              y: tower.y,
              health: tower.health || 800,
              maxHealth: tower.maxHealth || 800,
              attack: tower.attack || 80,
              range: 120,
              type: tower.type === 'castle' ? 'main' : 'side'
            }));
            setTowers(battleTowers);
            return;
          }
        }
        
        console.warn('⚠️ No admin gameboard found - using fallback towers');
      } catch (error) {
        console.error('❌ Failed to load admin gameboard:', error);
      }
      
      // Fallback towers if no admin gameboard
      const fallbackTowers: Tower[] = [
        // Player towers (bottom)
        { id: 'player-left', team: 'player', x: 200, y: 550, health: 800, maxHealth: 800, attack: 80, range: 120, type: 'side' },
        { id: 'player-right', team: 'player', x: 600, y: 550, health: 800, maxHealth: 800, attack: 80, range: 120, type: 'side' },
        { id: 'player-main', team: 'player', x: 400, y: 580, health: 1200, maxHealth: 1200, attack: 100, range: 150, type: 'main' },
        
        // AI towers (top)
        { id: 'ai-left', team: 'ai', x: 200, y: 50, health: 800, maxHealth: 800, attack: 80, range: 120, type: 'side' },
        { id: 'ai-right', team: 'ai', x: 600, y: 50, health: 800, maxHealth: 800, attack: 80, range: 120, type: 'side' },
        { id: 'ai-main', team: 'ai', x: 400, y: 20, health: 1200, maxHealth: 1200, attack: 100, range: 150, type: 'main' }
      ];
      setTowers(fallbackTowers);
    };
    
    loadAdminGameboardAndTowers();
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const gameLoop = () => {
      setGameTime(prev => prev + 1);
      
      // Mana regeneration
      if (gameTime % 60 === 0) { // Every second
        setPlayerMana(prev => Math.min(10, prev + 1));
        setAiMana(prev => Math.min(10, prev + 1));
      }

      // AI logic
      if (gameTime % 180 === 0 && aiMana >= 3) { // AI plays every 3 seconds
        playAICard();
      }

      // Update battle units
      updateBattleUnits();
      
      // Check win conditions
      checkWinConditions();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameEnded, gameTime, battleUnits, towers]);

  // Draw battlefield
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT);
    
    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, BATTLEFIELD_HEIGHT);
    gradient.addColorStop(0, '#1a2e1a');
    gradient.addColorStop(0.5, '#2d5a2d');
    gradient.addColorStop(1, '#1a2e1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT);
    
    // Draw bridge (middle line)
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, BRIDGE_Y);
    ctx.lineTo(BATTLEFIELD_WIDTH, BRIDGE_Y);
    ctx.stroke();
    
    // Draw river
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(0, BRIDGE_Y - 20, BATTLEFIELD_WIDTH, 40);
    
    // Draw towers
    drawTowers(ctx);
    
    // Draw battle units
    drawBattleUnits(ctx);
    
  }, [battleUnits, towers, gameTime]);

  const drawTowers = (ctx: CanvasRenderingContext2D) => {
    towers.forEach(tower => {
      if (tower.health <= 0) return;
      
      // Tower base
      ctx.fillStyle = tower.team === 'player' ? '#00ff88' : '#ff4444';
      ctx.fillRect(tower.x - 25, tower.y - 25, 50, 50);
      
      // Tower icon
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏰', tower.x, tower.y + 5);
      
      // Health bar
      const healthPercent = tower.health / tower.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(tower.x - 30, tower.y + 35, 60, 8);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(tower.x - 30, tower.y + 35, 60 * healthPercent, 8);
      
      // Health text
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(`${tower.health}`, tower.x, tower.y + 55);
    });
  };

  const drawBattleUnits = (ctx: CanvasRenderingContext2D) => {
    battleUnits.forEach(unit => {
      if (unit.health <= 0) return;
      
      // Draw unit as actual card image
      const img = new Image();
      img.onload = () => {
        // Draw card image as unit representation
        const size = unit.type === 'tower' ? 40 : 30;
        ctx.drawImage(img, unit.x - size/2, unit.y - size/2, size, size);
        
        // Add team border
        ctx.strokeStyle = unit.team === 'player' ? '#00ff88' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(unit.x - size/2, unit.y - size/2, size, size);
      };
      img.onerror = () => {
        // Fallback to colored circle with unit initial
        ctx.fillStyle = unit.team === 'player' ? '#00ff88' : '#ff4444';
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name.charAt(0), unit.x, unit.y + 5);
      };
      img.src = unit.image;
      
      // Health bar
      const healthPercent = unit.health / unit.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(unit.x - 20, unit.y + 25, 40, 6);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(unit.x - 20, unit.y + 25, 40 * healthPercent, 6);
      
      // Unit name
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(unit.name.substring(0, 8), unit.x, unit.y + 40);
      
      // Range indicator when attacking
      if (unit.targetId) {
        ctx.strokeStyle = unit.team === 'player' ? '#00ff8844' : '#ff444444';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, unit.range, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  };

  const updateBattleUnits = () => {
    setBattleUnits(prevUnits => {
      return prevUnits.map(unit => {
        if (unit.health <= 0) return unit;
        
        const now = Date.now();
        let updatedUnit = { ...unit };
        
        // Find targets
        if (!unit.targetId || now - unit.lastAttackTime > unit.attackCooldown) {
          const target = findTarget(unit);
          if (target) {
            updatedUnit.targetId = target.id;
            updatedUnit.targetX = target.x;
            updatedUnit.targetY = target.y;
          }
        }
        
        // Move towards target
        if (updatedUnit.targetX !== undefined && updatedUnit.targetY !== undefined) {
          const dx = updatedUnit.targetX - unit.x;
          const dy = updatedUnit.targetY - unit.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > unit.range) {
            // Move towards target
            updatedUnit.x += (dx / distance) * unit.speed;
            updatedUnit.y += (dy / distance) * unit.speed;
            updatedUnit.isMoving = true;
          } else {
            // Attack target
            if (now - unit.lastAttackTime > unit.attackCooldown) {
              attack(unit, updatedUnit.targetId!);
              updatedUnit.lastAttackTime = now;
            }
            updatedUnit.isMoving = false;
          }
        }
        
        return updatedUnit;
      }).filter(unit => unit.health > 0);
    });
  };

  const findTarget = (unit: BattleUnit): (BattleUnit | Tower) | null => {
    const enemyTeam = unit.team === 'player' ? 'ai' : 'player';
    
    // Priority: Enemy units first, then towers
    const enemyUnits = battleUnits.filter(u => u.team === enemyTeam && u.health > 0);
    const enemyTowers = towers.filter(t => t.team === enemyTeam && t.health > 0);
    
    let closestTarget: (BattleUnit | Tower) | null = null;
    let closestDistance = Infinity;
    
    // Check units first
    enemyUnits.forEach(target => {
      const distance = Math.sqrt(Math.pow(target.x - unit.x, 2) + Math.pow(target.y - unit.y, 2));
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });
    
    // If no units in range, target towers
    if (!closestTarget || closestDistance > unit.range * 2) {
      enemyTowers.forEach(target => {
        const distance = Math.sqrt(Math.pow(target.x - unit.x, 2) + Math.pow(target.y - unit.y, 2));
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTarget = target;
        }
      });
    }
    
    return closestTarget;
  };

  const attack = (attacker: BattleUnit, targetId: string) => {
    // Attack unit
    const targetUnit = battleUnits.find(u => u.id === targetId);
    if (targetUnit) {
      setBattleUnits(prev => prev.map(u => 
        u.id === targetId ? { ...u, health: Math.max(0, u.health - attacker.attack) } : u
      ));
      setBattleLog(prev => [...prev.slice(-9), `${attacker.name} attacks ${targetUnit.name} for ${attacker.attack} damage!`]);
      return;
    }
    
    // Attack tower
    const targetTower = towers.find(t => t.id === targetId);
    if (targetTower) {
      setTowers(prev => prev.map(t => 
        t.id === targetId ? { ...t, health: Math.max(0, t.health - attacker.attack) } : t
      ));
      setBattleLog(prev => [...prev.slice(-9), `${attacker.name} attacks tower for ${attacker.attack} damage!`]);
    }
  };

  const playAICard = () => {
    const availableCards = playerDeck.filter(card => card.cost <= aiMana);
    if (availableCards.length === 0) return;
    
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    const spawnX = 200 + Math.random() * 400;
    const spawnY = 100 + Math.random() * 100;
    
    deployCard(randomCard, spawnX, spawnY, 'ai');
    setAiMana(prev => prev - randomCard.cost);
  };

  const deployCard = (card: GameCard, x: number, y: number, team: 'player' | 'ai') => {
    if (card.type === 'spell') {
      // Handle spell effects
      handleSpell(card, x, y, team);
      return;
    }
    
    const newUnit: BattleUnit = {
      id: `${team}_${card.id}_${Date.now()}`,
      name: card.name,
      image: card.image,
      x: x,
      y: y,
      health: card.health,
      maxHealth: card.health,
      attack: card.attack,
      team: team,
      type: card.type,
      range: card.range || 60,
      speed: card.speed || 1,
      abilities: card.abilities || [],
      isMoving: false,
      lastAttackTime: 0,
      attackCooldown: 1500,
      isBuilding: card.type === 'tower'
    };
    
    setBattleUnits(prev => [...prev, newUnit]);
    setBattleLog(prev => [...prev.slice(-9), `${team} deploys ${card.name}!`]);
  };

  const handleSpell = (card: GameCard, x: number, y: number, team: 'player' | 'ai') => {
    const enemyTeam = team === 'player' ? 'ai' : 'player';
    const spellRange = 80;
    
    // Damage all enemy units in range
    setBattleUnits(prev => prev.map(unit => {
      if (unit.team === enemyTeam) {
        const distance = Math.sqrt(Math.pow(unit.x - x, 2) + Math.pow(unit.y - y, 2));
        if (distance <= spellRange) {
          return { ...unit, health: Math.max(0, unit.health - card.attack) };
        }
      }
      return unit;
    }));
    
    // Visual spell effect
    setBattleLog(prev => [...prev.slice(-9), `${team} casts ${card.name}!`]);
  };

  const checkWinConditions = () => {
    const playerMainTower = towers.find(t => t.id === 'player-main');
    const aiMainTower = towers.find(t => t.id === 'ai-main');
    
    if (playerMainTower && playerMainTower.health <= 0) {
      setWinner('ai');
      setGameEnded(true);
      onGameEnd('ai');
    } else if (aiMainTower && aiMainTower.health <= 0) {
      setWinner('player');
      setGameEnded(true);
      onGameEnd('player');
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedCard || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Only allow deployment on player side
    if (y > BRIDGE_Y - 50 && playerMana >= selectedCard.cost) {
      deployCard(selectedCard, x, y, 'player');
      setPlayerMana(prev => prev - selectedCard.cost);
      setSelectedCard(null);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setBattleLog(['Battle begins!']);
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm p-4 border-b border-green-500 flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        
        <div className="text-white text-center">
          <h2 className="text-xl font-bold text-green-400">THC CLASH Battle</h2>
          <div className="text-sm">Time: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</div>
        </div>
        
        <div className="flex gap-4 text-white text-sm">
          <div className="text-center">
            <div className="text-green-400">Player</div>
            <div>⚡ {playerMana}/10</div>
          </div>
          <div className="text-center">
            <div className="text-red-400">AI</div>
            <div>⚡ {aiMana}/10</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Battlefield */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {!gameStarted ? (
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready for Battle?</h3>
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold"
              >
                START BATTLE
              </button>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={BATTLEFIELD_WIDTH}
                height={BATTLEFIELD_HEIGHT}
                onClick={handleCanvasClick}
                className="border-2 border-green-500 bg-green-900/20 cursor-crosshair"
                style={{ 
                  cursor: selectedCard ? 'crosshair' : 'default',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
              
              {selectedCard && (
                <div className="absolute top-2 left-2 bg-black/80 text-white p-2 rounded-lg text-sm">
                  Click on your side to deploy {selectedCard.name}
                </div>
              )}
              
              {gameEnded && winner && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="bg-gray-900 p-8 rounded-lg text-center">
                    <h3 className="text-3xl font-bold mb-4">
                      {winner === 'player' ? (
                        <span className="text-green-400">Victory!</span>
                      ) : (
                        <span className="text-red-400">Defeat!</span>
                      )}
                    </h3>
                    <button
                      onClick={onBack}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                    >
                      Back to Deck
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-black/80 border-l border-green-500 flex flex-col">
          {/* Player Deck */}
          <div className="p-4 border-b border-green-500">
            <h3 className="text-lg font-bold text-white mb-3">Your Cards</h3>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {playerDeck.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  onClick={() => playerMana >= card.cost ? setSelectedCard(card) : null}
                  className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                    selectedCard?.id === card.id
                      ? 'border-green-400 bg-green-900/50'
                      : playerMana >= card.cost
                        ? 'border-gray-600 hover:border-green-500 bg-gray-800/50'
                        : 'border-gray-700 bg-gray-900/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <img 
                    src={card.image} 
                    alt={card.name}
                    className="w-full h-16 object-cover rounded mb-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23333"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="12">' + card.name.charAt(0) + '</text></svg>';
                    }}
                  />
                  <div className="text-xs text-white font-bold truncate">{card.name}</div>
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>⚡{card.cost}</span>
                    <span>{card.attack}/{card.health}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Battle Log */}
          <div className="p-4 flex-1">
            <h3 className="text-lg font-bold text-white mb-3">Battle Log</h3>
            <div className="text-sm text-gray-300 space-y-1 max-h-40 overflow-y-auto">
              {battleLog.map((log, index) => (
                <div key={index} className="text-xs">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default THCClashBattlefield;