import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ArrowLeft, Zap, Shield, Sword, Target, Crown, Clock } from 'lucide-react';

interface Card {
  id: string;
  name: string;
  cost: number;
  damage: number;
  health: number;
  speed: number;
  range: number;
  description: string;
  image: string;
  level: number;
}

interface GameState {
  isPlaying: boolean;
  timeLeft: number;
  playerCrowns: number;
  enemyCrowns: number;
  playerMana: number;
  enemyMana: number;
  selectedCard: string | null;
  gamePhase: 'menu' | 'deck-selection' | 'battle' | 'game-over';
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
}

interface PlayerNFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface ProfessionalTHCClashProps {
  playerNFTs: PlayerNFT[];
  onBack: () => void;
}

const ProfessionalTHCClash: React.FC<ProfessionalTHCClashProps> = ({ playerNFTs, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Base cards with professional stats
  const baseCards: Card[] = [
    { id: 'grower', name: 'THC Grower', cost: 2, damage: 80, health: 120, speed: 1.0, range: 1, description: 'Basic cannabis cultivator', image: '', level: 1 },
    { id: 'dealer', name: 'Street Dealer', cost: 3, damage: 120, health: 100, speed: 1.5, range: 1, description: 'Fast attack unit', image: '', level: 1 },
    { id: 'enforcer', name: 'THC Enforcer', cost: 4, damage: 160, health: 200, speed: 0.8, range: 1, description: 'Heavy tank unit', image: '', level: 1 },
    { id: 'sniper', name: 'Scope Sniper', cost: 4, damage: 200, health: 80, speed: 0.5, range: 5, description: 'Long range specialist', image: '', level: 1 },
    { id: 'runner', name: 'Quick Runner', cost: 1, damage: 40, health: 60, speed: 2.0, range: 1, description: 'Fast scout unit', image: '', level: 1 },
    { id: 'heavy', name: 'Heavy Hitter', cost: 5, damage: 240, health: 300, speed: 0.5, range: 1, description: 'Slow but powerful', image: '', level: 1 },
    { id: 'medic', name: 'Field Medic', cost: 3, damage: 60, health: 100, speed: 1.0, range: 2, description: 'Heals nearby units', image: '', level: 1 },
    { id: 'bomber', name: 'Grenade Bomber', cost: 4, damage: 180, health: 90, speed: 1.2, range: 3, description: 'Area damage specialist', image: '', level: 1 }
  ];

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    timeLeft: 180, // 3 minutes
    playerCrowns: 0,
    enemyCrowns: 0,
    playerMana: 10,
    enemyMana: 10,
    selectedCard: null,
    gamePhase: 'menu'
  });

  const [selectedDeck, setSelectedDeck] = useState<string[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>(baseCards);
  const [units, setUnits] = useState<Unit[]>([]);
  const [gameTime, setGameTime] = useState(0);

  // Calculate NFT bonuses
  const calculateNFTBonuses = useCallback(() => {
    const bonuses = {
      manaBonus: 0,
      damageBonus: 0,
      healthBonus: 0,
      speedBonus: 0,
      manaRegenBonus: 0
    };

    playerNFTs.forEach(nft => {
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          switch (attr.trait_type) {
            case 'Clothes':
              if (attr.value === 'THC Hoodie') bonuses.manaBonus += 15;
              break;
            case 'Eyes':
              if (attr.value === 'Green Eyes') bonuses.damageBonus += 12;
              break;
            case 'Head':
              if (attr.value === 'Bandana') bonuses.healthBonus += 18;
              break;
            case 'Background':
              if (attr.value === 'Forest') bonuses.speedBonus += 10;
              break;
            case 'Mouth':
              if (attr.value === 'Joint') bonuses.manaRegenBonus += 20;
              break;
          }
        });
      }
    });

    return bonuses;
  }, [playerNFTs]);

  // Enhanced cards with NFT bonuses
  const enhanceCardsWithNFTBonuses = useCallback(() => {
    const bonuses = calculateNFTBonuses();
    
    return baseCards.map(card => ({
      ...card,
      damage: Math.round(card.damage * (1 + bonuses.damageBonus / 100)),
      health: Math.round(card.health * (1 + bonuses.healthBonus / 100)),
      speed: card.speed * (1 + bonuses.speedBonus / 100),
      cost: Math.max(1, Math.round(card.cost * (1 - bonuses.manaBonus / 200)))
    }));
  }, [calculateNFTBonuses]);

  // Update available cards with bonuses
  useEffect(() => {
    setAvailableCards(enhanceCardsWithNFTBonuses());
  }, [enhanceCardsWithNFTBonuses]);

  // Game loop
  useEffect(() => {
    if (gameState.isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, units, gameTime]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'linear-gradient(180deg, #87CEEB 0%, #228B22 50%, #8B4513 100%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw battlefield lanes
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Horizontal lanes
    for (let i = 1; i < 3; i++) {
      const y = (canvas.height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Center line
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw towers
    drawTower(ctx, canvas.width / 2, 30, false); // Enemy tower
    drawTower(ctx, canvas.width / 2, canvas.height - 30, true); // Player tower

    // Draw units
    units.forEach(unit => {
      drawUnit(ctx, unit);
    });

    // Update game logic
    updateUnits();
    updateMana();

    setGameTime(prev => prev + 1);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [units, gameTime]);

  const drawTower = (ctx: CanvasRenderingContext2D, x: number, y: number, isPlayer: boolean) => {
    ctx.fillStyle = isPlayer ? '#4CAF50' : '#F44336';
    ctx.fillRect(x - 20, y - 15, 40, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👑', x, y + 5);
  };

  const drawUnit = (ctx: CanvasRenderingContext2D, unit: Unit) => {
    const size = 12;
    
    // Unit body
    ctx.fillStyle = unit.isPlayer ? '#4CAF50' : '#F44336';
    ctx.fillRect(unit.x - size/2, unit.y - size/2, size, size);
    
    // Health bar
    const healthBarWidth = 16;
    const healthBarHeight = 3;
    const healthPercent = unit.health / unit.maxHealth;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(unit.x - healthBarWidth/2, unit.y - size/2 - 8, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(unit.x - healthBarWidth/2, unit.y - size/2 - 8, healthBarWidth * healthPercent, healthBarHeight);
  };

  const updateUnits = () => {
    setUnits(prevUnits => {
      return prevUnits.map(unit => {
        // Simple AI movement toward center
        const targetY = unit.isPlayer ? unit.y - 1 : unit.y + 1;
        return {
          ...unit,
          y: Math.max(10, Math.min(470, targetY))
        };
      }).filter(unit => unit.health > 0);
    });
  };

  const updateMana = () => {
    if (gameTime % 60 === 0) { // Every second at 60fps
      setGameState(prev => ({
        ...prev,
        playerMana: Math.min(10, prev.playerMana + 1),
        enemyMana: Math.min(10, prev.enemyMana + 1)
      }));
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.selectedCard) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Only allow placement in player area (bottom half)
    if (y < canvas.height * 0.5) return;
    
    const card = availableCards.find(c => c.id === gameState.selectedCard);
    if (!card || gameState.playerMana < card.cost) return;
    
    // Create new unit
    const newUnit: Unit = {
      id: `unit_${Date.now()}`,
      x: x,
      y: y,
      health: card.health,
      maxHealth: card.health,
      damage: card.damage,
      speed: card.speed,
      isPlayer: true,
      cardId: card.id,
      target: null,
      lastAttack: 0
    };
    
    setUnits(prev => [...prev, newUnit]);
    setGameState(prev => ({
      ...prev,
      playerMana: prev.playerMana - card.cost,
      selectedCard: null
    }));
  };

  const startBattle = () => {
    if (selectedDeck.length !== 4) {
      alert('Please select exactly 4 cards for your deck!');
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      gamePhase: 'battle',
      isPlaying: true,
      timeLeft: 180,
      playerCrowns: 0,
      enemyCrowns: 0,
      playerMana: 10,
      enemyMana: 10
    }));
    setUnits([]);
    setGameTime(0);
  };

  const selectCard = (cardId: string) => {
    if (gameState.gamePhase === 'deck-selection') {
      if (selectedDeck.includes(cardId)) {
        setSelectedDeck(prev => prev.filter(id => id !== cardId));
      } else if (selectedDeck.length < 4) {
        setSelectedDeck(prev => [...prev, cardId]);
      }
    } else if (gameState.gamePhase === 'battle') {
      setGameState(prev => ({
        ...prev,
        selectedCard: prev.selectedCard === cardId ? null : cardId
      }));
    }
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const returnToMenu = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'menu',
      isPlaying: false
    }));
    setSelectedDeck([]);
    setUnits([]);
  };

  // Render menu phase
  if (gameState.gamePhase === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h1 className="text-4xl font-bold text-white text-center">
                THC <span className="text-green-400">CLASH</span>
              </h1>
              <div className="w-20"></div>
            </div>

            <div className="text-center mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const bonuses = calculateNFTBonuses();
                  return [
                    { label: 'Mana Bonus', value: `+${bonuses.manaBonus}%`, icon: <Zap className="text-blue-400" size={16} /> },
                    { label: 'Damage Bonus', value: `+${bonuses.damageBonus}%`, icon: <Sword className="text-red-400" size={16} /> },
                    { label: 'Health Bonus', value: `+${bonuses.healthBonus}%`, icon: <Shield className="text-green-400" size={16} /> },
                    { label: 'Speed Bonus', value: `+${bonuses.speedBonus.toFixed(1)}%`, icon: <Target className="text-yellow-400" size={16} /> }
                  ].map((bonus, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        {bonus.icon}
                      </div>
                      <div className="text-white text-sm font-semibold">{bonus.value}</div>
                      <div className="text-gray-400 text-xs">{bonus.label}</div>
                    </div>
                  ));
                })()}
              </div>

              <button
                onClick={() => setGameState(prev => ({ ...prev, gamePhase: 'deck-selection' }))}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                Start THC CLASH Battle
              </button>
            </div>

            {/* NFT Collection Display */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-4">Your GROWERZ NFTs Providing Bonuses</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                {playerNFTs.map(nft => (
                  <div key={nft.mint} className="bg-gray-700/50 rounded-lg p-4">
                    <img src={nft.image} alt={nft.name} className="w-16 h-16 rounded-lg mb-2" />
                    <h3 className="text-white font-semibold text-sm mb-2">{nft.name}</h3>
                    <p className="text-green-400 text-xs mb-2">Rank #{nft.rank}</p>
                    <div className="space-y-1">
                      {nft.attributes && nft.attributes.slice(0, 2).map((attr, idx) => (
                        <div key={idx} className="text-xs text-gray-300">
                          {attr.trait_type}: {attr.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render deck selection phase
  if (gameState.gamePhase === 'deck-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setGameState(prev => ({ ...prev, gamePhase: 'menu' }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h2 className="text-2xl font-bold text-white">
                Select Your Deck ({selectedDeck.length}/4)
              </h2>
              <button
                onClick={startBattle}
                disabled={selectedDeck.length !== 4}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Battle
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {availableCards.map(card => (
                <div
                  key={card.id}
                  onClick={() => selectCard(card.id)}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all border-2 ${
                    selectedDeck.includes(card.id)
                      ? 'border-green-400 bg-green-900/50'
                      : 'border-gray-600 hover:border-purple-400'
                  }`}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-2 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2">{card.name}</h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Cost: {card.cost}</div>
                    <div>DMG: {card.damage}</div>
                    <div>HP: {card.health}</div>
                    <div>Speed: {card.speed.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render battle phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-purple-500/30">
          {/* Game HUD */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-600/50 px-3 py-1 rounded-lg">
                <Clock size={16} className="text-blue-400" />
                <span className="text-white font-bold">
                  {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-600/50 px-3 py-1 rounded-lg">
                <Crown size={16} className="text-yellow-400" />
                <span className="text-white font-bold">
                  {gameState.playerCrowns} - {gameState.enemyCrowns}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={pauseGame}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {gameState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {gameState.isPlaying ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={returnToMenu}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Menu
              </button>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              width={360}
              height={480}
              onClick={handleCanvasClick}
              className="border-2 border-white rounded-lg shadow-lg cursor-crosshair"
            />
          </div>

          {/* Card Deck */}
          <div className="flex justify-center gap-2 mb-4">
            {selectedDeck.map(cardId => {
              const card = availableCards.find(c => c.id === cardId);
              if (!card) return null;
              
              return (
                <div
                  key={cardId}
                  onClick={() => selectCard(cardId)}
                  className={`bg-gray-800 rounded-lg p-2 cursor-pointer transition-all border-2 ${
                    gameState.selectedCard === cardId
                      ? 'border-green-400 bg-green-900/50'
                      : gameState.playerMana >= card.cost
                      ? 'border-purple-400 hover:border-purple-300'
                      : 'border-gray-600 opacity-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded mb-1 flex items-center justify-center text-lg">
                    🎮
                  </div>
                  <div className="text-xs text-white text-center font-semibold">{card.cost}</div>
                </div>
              );
            })}
          </div>

          {/* Mana Display */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-blue-600/50 px-4 py-2 rounded-lg">
              <Zap size={16} className="text-blue-400" />
              <span className="text-white font-bold">Mana: {gameState.playerMana}/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTHCClash;