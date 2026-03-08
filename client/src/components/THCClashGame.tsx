import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ArrowLeft, Zap, Shield, Sword, Target } from 'lucide-react';

interface NFTTraits {
  [key: string]: string;
}

interface NFTBonus {
  bonusType: string;
  bonusValue: number;
  description: string;
}

interface PlayerNFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{ trait_type: string; value: string }>;
  bonuses: NFTBonus[];
}

interface GameStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  manaRegenRate: number;
  crowns: number;
  elixir: number;
}

interface Unit {
  id: string;
  type: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  range: number;
  isPlayer: boolean;
  targetX?: number;
  targetY?: number;
  lastAttack: number;
  attackSpeed: number;
}

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
  unitType: string;
}

interface THCClashGameProps {
  playerNFTs: PlayerNFT[];
  onBack: () => void;
}

const THCClashGame: React.FC<THCClashGameProps> = ({ playerNFTs, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'ended'>('menu');
  const [gameTime, setGameTime] = useState(180); // 3 minutes
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [placingUnit, setPlacingUnit] = useState<string | null>(null);

  // Player stats enhanced by NFTs
  const [playerStats, setPlayerStats] = useState<GameStats>({
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    manaRegenRate: 1,
    crowns: 0,
    elixir: 10
  });

  const [enemyStats, setEnemyStats] = useState<GameStats>({
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    manaRegenRate: 1,
    crowns: 0,
    elixir: 10
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);

  // Enhanced base cards that will be boosted by NFT traits
  const baseCards: Card[] = [
    {
      id: 'grower_warrior',
      name: 'GROWER Warrior',
      cost: 3,
      damage: 15,
      health: 45,
      speed: 2,
      range: 1,
      description: 'Strong melee fighter enhanced by NFT traits',
      image: '⚔️',
      unitType: 'melee'
    },
    {
      id: 'thc_archer',
      name: 'THC Archer',
      cost: 2,
      damage: 10,
      health: 25,
      speed: 1.5,
      range: 4,
      description: 'Ranged unit with NFT precision bonuses',
      image: '🏹',
      unitType: 'ranged'
    },
    {
      id: 'crystal_guardian',
      name: 'Crystal Guardian',
      cost: 4,
      damage: 8,
      health: 80,
      speed: 1,
      range: 1,
      description: 'Tank unit with NFT defensive bonuses',
      image: '🛡️',
      unitType: 'tank'
    },
    {
      id: 'lightning_spell',
      name: 'Lightning Spell',
      cost: 6,
      damage: 50,
      health: 0,
      speed: 0,
      range: 0,
      description: 'Instant damage spell boosted by NFT traits',
      image: '⚡',
      unitType: 'spell'
    }
  ];

  // Calculate NFT bonuses on game start
  const calculateNFTBonuses = useCallback(() => {
    const bonuses = {
      manaBonus: 0,
      manaRegenBonus: 0,
      damageBonus: 0,
      healthBonus: 0,
      speedBonus: 0
    };

    playerNFTs.forEach(nft => {
      // Use NFT attributes to calculate bonuses based on traits
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          // Convert trait types to bonus types
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

      // Also use API bonuses if available
      if (nft.bonuses) {
        nft.bonuses.forEach(bonus => {
          switch (bonus.bonusType) {
            case 'mana_production':
              bonuses.manaBonus += bonus.bonusValue;
              break;
            case 'mana_regeneration':
              bonuses.manaRegenBonus += bonus.bonusValue;
              break;
            case 'unit_damage':
              bonuses.damageBonus += bonus.bonusValue;
              break;
            case 'unit_health':
              bonuses.healthBonus += bonus.bonusValue;
              break;
            case 'movement_speed':
              bonuses.speedBonus += bonus.bonusValue;
              break;
          }
        });
      }
    });

    return bonuses;
  }, [playerNFTs]);

  // Apply NFT bonuses to cards
  const enhanceCardsWithNFTBonuses = useCallback(() => {
    const bonuses = calculateNFTBonuses();
    
    return baseCards.map(card => ({
      ...card,
      damage: Math.round(card.damage * (1 + bonuses.damageBonus / 100)),
      health: Math.round(card.health * (1 + bonuses.healthBonus / 100)),
      speed: card.speed * (1 + bonuses.speedBonus / 100),
      cost: Math.max(1, Math.round(card.cost * (1 - bonuses.manaBonus / 200))), // Reduce cost slightly
      enhanced: true
    }));
  }, [calculateNFTBonuses]);

  // Initialize game with NFT enhancements
  useEffect(() => {
    const bonuses = calculateNFTBonuses();
    const enhancedMaxMana = 100 + bonuses.manaBonus;
    const enhancedRegenRate = 1 + (bonuses.manaRegenBonus / 100);

    setPlayerStats(prev => ({
      ...prev,
      maxMana: enhancedMaxMana,
      mana: enhancedMaxMana,
      manaRegenRate: enhancedRegenRate
    }));

    setPlayerCards(enhanceCardsWithNFTBonuses());
  }, [calculateNFTBonuses, enhanceCardsWithNFTBonuses]);

  // Game canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 360;
    canvas.height = 480;
  }, []);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (gameState === 'playing') {
      // Update game timer
      setGameTime(prev => Math.max(0, prev - deltaTime / 1000));

      // Update mana regeneration
      setPlayerStats(prev => ({
        ...prev,
        mana: Math.min(prev.maxMana, prev.mana + (prev.manaRegenRate * deltaTime) / 1000)
      }));

      // Update units
      setUnits(prevUnits => {
        return prevUnits.map(unit => {
          // Simple AI movement toward enemy base
          if (unit.isPlayer) {
            unit.y -= unit.speed;
          } else {
            unit.y += unit.speed;
          }

          // Remove units that reach the end
          if (unit.y < 0 || unit.y > 480) {
            return null;
          }

          return unit;
        }).filter(Boolean) as Unit[];
      });

      // Render game
      renderGame();
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  // Start game loop
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // Render game graphics
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw battlefield sections
    ctx.strokeStyle = '#2a4a3a';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player base
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(canvas.width / 2 - 30, canvas.height - 60, 60, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Player Base', canvas.width / 2, canvas.height - 35);

    // Draw enemy base
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(canvas.width / 2 - 30, 20, 60, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Enemy Base', canvas.width / 2, 45);

    // Draw units
    units.forEach(unit => {
      ctx.fillStyle = unit.isPlayer ? '#4ade80' : '#ef4444';
      ctx.fillRect(unit.x - 8, unit.y - 8, 16, 16);
      
      // Health bar
      if (unit.health < unit.maxHealth) {
        ctx.fillStyle = '#333';
        ctx.fillRect(unit.x - 10, unit.y - 15, 20, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(unit.x - 10, unit.y - 15, (unit.health / unit.maxHealth) * 20, 3);
      }
    });

    // Draw placement preview
    if (placingUnit) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
      ctx.fillRect(canvas.width / 2 - 8, canvas.height * 0.7 - 8, 16, 16);
    }
  }, [units, placingUnit]);

  // Place unit on battlefield
  const placeUnit = useCallback((x: number, y: number) => {
    if (!selectedCard || !placingUnit) return;

    const card = playerCards.find(c => c.id === selectedCard);
    if (!card || playerStats.mana < card.cost) return;

    // Only allow placement in player area (bottom half)
    if (y < (canvasRef.current?.height || 480) * 0.5) return;

    const newUnit: Unit = {
      id: `unit_${Date.now()}`,
      type: card.id,
      x: x,
      y: y,
      health: card.health,
      maxHealth: card.health,
      damage: card.damage,
      speed: card.speed,
      range: card.range,
      isPlayer: true,
      lastAttack: 0,
      attackSpeed: 1000
    };

    setUnits(prev => [...prev, newUnit]);
    setPlayerStats(prev => ({
      ...prev,
      mana: prev.mana - card.cost
    }));
    setPlacingUnit(null);
    setSelectedCard(null);
  }, [selectedCard, placingUnit, playerCards, playerStats.mana]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (placingUnit) {
      placeUnit(x, y);
    }
  }, [placingUnit, placeUnit]);

  // Select card for placement
  const selectCard = useCallback((cardId: string) => {
    const card = playerCards.find(c => c.id === cardId);
    if (!card || playerStats.mana < card.cost) return;

    setSelectedCard(cardId);
    setPlacingUnit(cardId);
  }, [playerCards, playerStats.mana]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setGameTime(180);
    setUnits([]);
    
    const bonuses = calculateNFTBonuses();
    const enhancedMaxMana = 100 + bonuses.manaBonus;
    
    setPlayerStats(prev => ({
      ...prev,
      mana: enhancedMaxMana,
      elixir: 10,
      crowns: 0
    }));
    setEnemyStats(prev => ({
      ...prev,
      mana: 100,
      elixir: 10,
      crowns: 0
    }));
  }, [calculateNFTBonuses]);

  // Pause/Resume game
  const togglePause = useCallback(() => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Onboarding
            </button>
            <h1 className="text-3xl font-bold text-white">THC CLASH</h1>
            <div className="w-32"></div>
          </div>

          {/* NFT Bonuses Display */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Your GROWERZ NFT Bonuses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                    {nft.bonuses && nft.bonuses.length > 0 && (
                      nft.bonuses.slice(0, 1).map((bonus, idx) => (
                        <div key={idx} className="text-xs text-green-400">
                          {bonus.description}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const bonuses = calculateNFTBonuses();
                return [
                  { label: 'Mana Bonus', value: `+${bonuses.manaBonus}`, icon: <Zap className="text-blue-400" size={16} /> },
                  { label: 'Damage Bonus', value: `+${bonuses.damageBonus}%`, icon: <Sword className="text-red-400" size={16} /> },
                  { label: 'Health Bonus', value: `+${bonuses.healthBonus}%`, icon: <Shield className="text-green-400" size={16} /> },
                  { label: 'Speed Bonus', value: `+${bonuses.speedBonus.toFixed(1)}%`, icon: <Target className="text-yellow-400" size={16} /> }
                ].map((bonus, idx) => (
                  <div key={idx} className="bg-gray-600/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      {bonus.icon}
                    </div>
                    <div className="text-white text-sm font-semibold">{bonus.value}</div>
                    <div className="text-gray-400 text-xs">{bonus.label}</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Enhanced Card Preview */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Enhanced Cards</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {enhanceCardsWithNFTBonuses().map(card => (
                <div key={card.id} className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">{card.image}</div>
                  <h3 className="text-white font-semibold text-sm mb-2">{card.name}</h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Cost: {card.cost} mana</div>
                    <div>Damage: {card.damage}</div>
                    <div>Health: {card.health}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          <div className="text-center">
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold mx-auto"
            >
              <Play size={24} />
              Start THC CLASH Battle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Game HUD */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white">
              <span className="text-green-400">Time:</span> {formatTime(gameTime)}
            </div>
            <div className="text-white">
              <span className="text-blue-400">Crowns:</span> {playerStats.crowns} - {enemyStats.crowns}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-white">
              <span className="text-purple-400">Mana:</span> {Math.floor(playerStats.mana)}/{playerStats.maxMana}
            </div>
            <div className="text-white">
              <span className="text-yellow-400">Elixir:</span> {playerStats.elixir}
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 mb-4">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full border-2 border-gray-600 rounded-lg cursor-crosshair"
            style={{ maxWidth: '360px', height: 'auto' }}
          />
        </div>

        {/* Card Hand */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 mb-4">
          <h3 className="text-white font-semibold mb-3">Your Cards</h3>
          <div className="grid grid-cols-4 gap-2">
            {playerCards.slice(0, 4).map(card => (
              <button
                key={card.id}
                onClick={() => selectCard(card.id)}
                disabled={playerStats.mana < card.cost}
                className={`bg-gray-700 rounded-lg p-2 text-center transition-colors ${
                  selectedCard === card.id ? 'ring-2 ring-green-500' : ''
                } ${
                  playerStats.mana < card.cost ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 cursor-pointer'
                }`}
              >
                <div className="text-2xl mb-1">{card.image}</div>
                <div className="text-white text-xs font-semibold truncate">{card.name}</div>
                <div className="text-purple-400 text-xs">{card.cost}</div>
              </button>
            ))}
          </div>
          {placingUnit && (
            <div className="mt-2 text-center text-green-400 text-sm">
              Click on the battlefield to place your unit
            </div>
          )}
        </div>

        {/* Game Controls */}
        <div className="flex gap-2">
          <button
            onClick={togglePause}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex-1"
          >
            {gameState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
            {gameState === 'playing' ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default THCClashGame;