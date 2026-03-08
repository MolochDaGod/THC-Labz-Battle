import React, { useState, useEffect } from 'react';
import { Swords, Crown, Shield, Zap, Target, Timer, Trophy } from 'lucide-react';
import { ALL_CARDS } from '../data/allCards';

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

interface AIBattleSystemProps {
  playerDeck: BattleCard[];
  captainCard?: BattleCard;
  onBattleEnd: (winner: 'player' | 'ai', results: any) => void;
}

const AIBattleSystem: React.FC<AIBattleSystemProps> = ({
  playerDeck,
  captainCard,
  onBattleEnd
}) => {
  const [battlePhase, setBattlePhase] = useState<'prep' | 'battle' | 'results'>('prep');
  const [playerElixir, setPlayerElixir] = useState(5); // Start with 5 elixir like Clash Royale
  const [aiElixir, setAiElixir] = useState(5);
  const [playerTowers, setPlayerTowers] = useState({ left: 1600, right: 1600, king: 2400 }); // Clash Royale tower structure
  const [aiTowers, setAiTowers] = useState({ left: 1600, right: 1600, king: 2400 });
  const [battleTimer, setBattleTimer] = useState(180); // 3 minutes like Clash Royale
  const [deployedUnits, setDeployedUnits] = useState<any[]>([]);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<BattleCard[]>([]);
  const [aiHand, setAiHand] = useState<BattleCard[]>([]);
  
  // Generate random AI deck from all cards
  const [aiDeck] = useState(() => {
    const availableCards = ALL_CARDS.filter(card => card.rarity !== 'legendary');
    const shuffled = [...availableCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  });

  const [aiCaptain] = useState(() => {
    const legendaryCards = ALL_CARDS.filter(card => card.rarity === 'legendary');
    return legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
  });

  // Initialize hands when battle starts
  useEffect(() => {
    if (battlePhase === 'battle' && playerHand.length === 0) {
      // Draw 4 starting cards for player
      const shuffledDeck = [...playerDeck].sort(() => 0.5 - Math.random());
      setPlayerHand(shuffledDeck.slice(0, 4));
      
      // Draw 4 starting cards for AI
      const shuffledAIDeck = [...aiDeck].sort(() => 0.5 - Math.random());
      setAiHand(shuffledAIDeck.slice(0, 4));
    }
  }, [battlePhase, playerDeck, aiDeck]);

  useEffect(() => {
    if (battlePhase === 'battle') {
      // Elixir generation: +1 every 2.8 seconds (authentic Clash Royale timing)
      const elixirInterval = setInterval(() => {
        setPlayerElixir(prev => Math.min(prev + 1, 10));
        setAiElixir(prev => Math.min(prev + 1, 10));
      }, 2800);

      // Battle timer
      const timerInterval = setInterval(() => {
        setBattleTimer(prev => {
          if (prev <= 1) {
            setBattlePhase('results');
            determineWinner();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Unit movement and combat
      const combatInterval = setInterval(() => {
        simulateUnitMovement();
        simulateCombat();
      }, 100); // Real-time updates

      return () => {
        clearInterval(elixirInterval);
        clearInterval(timerInterval);
        clearInterval(combatInterval);
      };
    }
  }, [battlePhase]);

  const deployCard = (card: BattleCard, side: 'player' | 'ai', lane: 'left' | 'right') => {
    const currentElixir = side === 'player' ? playerElixir : aiElixir;
    
    if (currentElixir >= card.cost) {
      const deployedUnit = {
        ...card,
        id: `${side}-${Date.now()}-${Math.random()}`,
        side,
        currentHealth: card.health,
        maxHealth: card.health,
        lane,
        position: side === 'player' ? 10 : 90, // Start near own side
        target: null,
        lastAttack: 0,
        speed: card.type === 'spell' ? 0 : (card.class === 'fast' ? 2 : 1)
      };
      
      setDeployedUnits(prev => [...prev, deployedUnit]);
      setBattleLog(prev => [...prev, `${side.toUpperCase()} deployed ${card.name} in ${lane} lane`]);
      
      // Spend elixir
      if (side === 'player') {
        setPlayerElixir(prev => prev - card.cost);
        // Draw new card to hand
        const availableCards = playerDeck.filter(c => !playerHand.find(h => h.id === c.id));
        if (availableCards.length > 0) {
          const newCard = availableCards[Math.floor(Math.random() * availableCards.length)];
          const handWithoutPlayed = playerHand.filter(c => c.id !== card.id);
          setPlayerHand([...handWithoutPlayed, newCard]);
        }
      } else {
        setAiElixir(prev => prev - card.cost);
        // AI draws new card
        const availableCards = aiDeck.filter(c => !aiHand.find(h => h.id === c.id));
        if (availableCards.length > 0) {
          const newCard = availableCards[Math.floor(Math.random() * availableCards.length)];
          const handWithoutPlayed = aiHand.filter(c => c.id !== card.id);
          setAiHand([...handWithoutPlayed, newCard]);
        }
      }
    }
  };

  const simulateAITurn = () => {
    // AI strategy: deploy cards from hand when it has enough elixir
    const affordableCards = aiHand.filter(card => card.cost <= aiElixir);
    if (affordableCards.length > 0 && Math.random() > 0.4) {
      const selectedCard = affordableCards[Math.floor(Math.random() * affordableCards.length)];
      const selectedLane = Math.random() > 0.5 ? 'left' : 'right';
      deployCard(selectedCard, 'ai', selectedLane);
    }
  };

  const simulateUnitMovement = () => {
    setDeployedUnits(prev => prev.map(unit => {
      if (unit.currentHealth <= 0) return unit;
      
      // Units move toward enemy towers
      const direction = unit.side === 'player' ? 1 : -1;
      const newPosition = Math.max(0, Math.min(100, unit.position + (unit.speed * direction)));
      
      return { ...unit, position: newPosition };
    }));
  };

  const simulateCombat = () => {
    setDeployedUnits(prev => {
      const now = Date.now();
      return prev.map(unit => {
        if (unit.currentHealth <= 0) return unit;
        
        // Find targets (enemy units or towers)
        const enemyUnits = prev.filter(u => 
          u.side !== unit.side && 
          u.currentHealth > 0 &&
          Math.abs(u.position - unit.position) < 15 // Attack range
        );
        
        // Attack if enemy in range and cooldown passed
        if (enemyUnits.length > 0 && (now - unit.lastAttack) > 1500) {
          const target = enemyUnits[0];
          target.currentHealth -= unit.attack;
          unit.lastAttack = now;
          
          if (target.currentHealth <= 0) {
            setBattleLog(prev => [...prev.slice(-10), `${unit.name} destroyed ${target.name}!`]);
          }
        }
        
        // Attack towers when units reach them
        if (unit.side === 'player' && unit.position >= 85) {
          if ((now - unit.lastAttack) > 1500) {
            // Attack AI towers
            setAiTowers(prev => {
              const damaged = { ...prev };
              if (damaged.left > 0) {
                damaged.left -= unit.attack;
                setBattleLog(logs => [...logs.slice(-10), `${unit.name} attacks left tower!`]);
              } else if (damaged.right > 0) {
                damaged.right -= unit.attack;
                setBattleLog(logs => [...logs.slice(-10), `${unit.name} attacks right tower!`]);
              } else {
                damaged.king -= unit.attack;
                setBattleLog(logs => [...logs.slice(-10), `${unit.name} attacks KING TOWER!`]);
              }
              return damaged;
            });
            unit.lastAttack = now;
          }
        } else if (unit.side === 'ai' && unit.position <= 15) {
          if ((now - unit.lastAttack) > 1500) {
            // Attack player towers
            setPlayerTowers(prev => {
              const damaged = { ...prev };
              if (damaged.left > 0) {
                damaged.left -= unit.attack;
                setBattleLog(logs => [...logs.slice(-10), `Enemy ${unit.name} attacks your left tower!`]);
              } else if (damaged.right > 0) {
                damaged.right -= unit.attack;
                setBattleLog(logs => [...logs.slice(-10), `Enemy ${unit.name} attacks your right tower!`]);
              } else {
                damaged.king -= unit.attack;
                setBattleLog(logs => [...logs.slice(-10), `Enemy ${unit.name} attacks YOUR KING TOWER!`]);
              }
              return damaged;
            });
            unit.lastAttack = now;
          }
        }
        
        return unit;
      }).filter(unit => unit.currentHealth > 0); // Remove dead units
    });
  };

  const simulateBattleTick = () => {
    // This function is now handled by simulateCombat above
    // Keeping for compatibility but functionality moved to real-time combat
  };

  useEffect(() => {
    if (battlePhase === 'battle') {
      const aiInterval = setInterval(simulateAITurn, 3000);
      
      return () => {
        clearInterval(aiInterval);
      };
    }
  }, [battlePhase, deployedUnits, aiElixir]);

  useEffect(() => {
    if (playerTowers.king <= 0 || aiTowers.king <= 0) {
      setBattlePhase('results');
      determineWinner();
    }
  }, [playerTowers.king, aiTowers.king]);

  const determineWinner = () => {
    const playerScore = (2400 - playerTowers.king) + (1600 - Math.max(0, playerTowers.left)) + (1600 - Math.max(0, playerTowers.right));
    const aiScore = (2400 - aiTowers.king) + (1600 - Math.max(0, aiTowers.left)) + (1600 - Math.max(0, aiTowers.right));
    
    let winner: 'player' | 'ai';
    
    // King tower destroyed = instant win (authentic Clash Royale)
    if (aiTowers.king <= 0) {
      winner = 'player';
    } else if (playerTowers.king <= 0) {
      winner = 'ai';
    } else {
      // Most damage wins
      winner = aiScore > playerScore ? 'player' : 'ai';
    }
    
    const results = {
      playerTowers,
      aiTowers,
      timeRemaining: battleTimer,
      unitsDeployed: deployedUnits.filter(u => u.side === 'player').length,
      damageDealt: aiScore,
      crowns: winner === 'player' ? 
        (aiTowers.king <= 0 ? 3 : (aiTowers.left <= 0 ? 1 : 0) + (aiTowers.right <= 0 ? 1 : 0)) : 0
    };
    
    setTimeout(() => {
      onBattleEnd(winner, results);
    }, 3000);
  };

  const startBattle = () => {
    setBattlePhase('battle');
    setBattleLog(['Battle started! Deploy your cards strategically.']);
    
    // Auto-deploy captain cards
    if (captainCard) {
      deployCard(captainCard, 'player', 'left');
    }
    if (aiCaptain) {
      deployCard(aiCaptain, 'ai', 'left');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (battlePhase === 'prep') {
    return (
      <div className="h-full bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Battle Preparation Header */}
          <div className="bg-black/60 border border-red-500 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <Swords size={32} />
              THC CLASH - Battle Arena
            </h1>
            <p className="text-red-200 mb-6">
              Prepare for epic Clash Royale style battle! Deploy your cards strategically to destroy the enemy castle.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player Deck */}
              <div className="bg-blue-900/40 border border-blue-500 rounded-lg p-4">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Your Battle Deck</h3>
                <div className="grid grid-cols-4 gap-2">
                  {playerDeck.map((card, index) => (
                    <div key={index} className="bg-black/40 border border-blue-400 rounded p-2">
                      <div className="text-xs text-blue-300 font-bold">{card.name}</div>
                      <div className="text-xs text-gray-400">{card.attack}/{card.health}</div>
                      <div className="text-xs text-purple-400">{card.cost} mana</div>
                    </div>
                  ))}
                </div>
                {captainCard && (
                  <div className="mt-4 bg-yellow-900/40 border border-yellow-500 rounded p-3">
                    <div className="text-sm font-bold text-yellow-400">Captain: {captainCard.name}</div>
                    <div className="text-xs text-gray-300">{captainCard.attack}/{captainCard.health} - Auto-deploys</div>
                  </div>
                )}
              </div>

              {/* AI Deck */}
              <div className="bg-red-900/40 border border-red-500 rounded-lg p-4">
                <h3 className="text-xl font-bold text-red-400 mb-4">AI Opponent Deck</h3>
                <div className="grid grid-cols-4 gap-2">
                  {aiDeck.map((card, index) => (
                    <div key={index} className="bg-black/40 border border-red-400 rounded p-2">
                      <div className="text-xs text-red-300 font-bold">{card.name}</div>
                      <div className="text-xs text-gray-400">{card.attack}/{card.health}</div>
                      <div className="text-xs text-purple-400">{card.cost} mana</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-orange-900/40 border border-orange-500 rounded p-3">
                  <div className="text-sm font-bold text-orange-400">Captain: {aiCaptain.name}</div>
                  <div className="text-xs text-gray-300">{aiCaptain.attack}/{aiCaptain.health} - Auto-deploys</div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={startBattle}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-xl font-bold flex items-center gap-3 mx-auto"
              >
                <Swords size={24} />
                START BATTLE
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (battlePhase === 'battle') {
    return (
      <div className="h-full bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
        {/* Battle HUD */}
        <div className="bg-black/80 border border-red-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{playerTowers.king}</div>
                <div className="text-sm text-blue-300">King Tower</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{playerElixir}/10</div>
                <div className="text-sm text-purple-300">Elixir</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{formatTime(battleTimer)}</div>
              <div className="text-sm text-red-300">Battle Time</div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{aiTowers.king}</div>
                <div className="text-sm text-red-300">AI King Tower</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{aiElixir}/10</div>
                <div className="text-sm text-purple-300">AI Elixir</div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Field */}
        <div className="flex gap-4 h-[400px]">
          {/* Deployed Cards Visualization */}
          <div className="flex-1 bg-green-900/20 border border-green-500 rounded-lg p-4">
            <h3 className="text-lg font-bold text-green-400 mb-2">Battlefield</h3>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-blue-900/20 border border-blue-400 rounded p-2">
                <div className="text-sm font-bold text-blue-400 mb-2">Your Forces</div>
                {deployedUnits.filter(unit => unit.side === 'player').map((unit, idx) => (
                  <div key={idx} className="text-xs text-blue-300 mb-1">
                    {unit.name} ({unit.currentHealth}/{unit.maxHealth}HP) - Pos: {Math.round(unit.position)}
                  </div>
                ))}
              </div>
              <div className="bg-red-900/20 border border-red-400 rounded p-2">
                <div className="text-sm font-bold text-red-400 mb-2">AI Forces</div>
                {deployedUnits.filter(unit => unit.side === 'ai').map((unit, idx) => (
                  <div key={idx} className="text-xs text-red-300 mb-1">
                    {unit.name} ({unit.currentHealth}/{unit.maxHealth}HP) - Pos: {Math.round(unit.position)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="w-80 bg-black/60 border border-gray-500 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-400 mb-2">Battle Log</h3>
            <div className="h-full overflow-y-auto space-y-1">
              {battleLog.slice(-15).map((log, idx) => (
                <div key={idx} className="text-xs text-gray-300">{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Cards */}
        <div className="mt-4 bg-black/60 border border-blue-500 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-400 mb-2">Your Hand (Elixir: {playerElixir})</h3>
          <div className="grid grid-cols-4 gap-2">
            {playerHand.map((card, index) => (
              <div key={index} className="space-y-1">
                <button
                  onClick={() => deployCard(card, 'player', 'left')}
                  disabled={playerElixir < card.cost}
                  className={`p-2 rounded border text-xs w-full ${
                    playerElixir >= card.cost
                      ? 'border-blue-400 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300'
                      : 'border-gray-600 bg-gray-800/40 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold">{card.name}</div>
                  <div>{card.attack}/{card.health}</div>
                  <div className="text-purple-400">{card.cost} elixir</div>
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => deployCard(card, 'player', 'left')}
                    disabled={playerElixir < card.cost}
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white p-1 rounded"
                  >
                    Left
                  </button>
                  <button
                    onClick={() => deployCard(card, 'player', 'right')}
                    disabled={playerElixir < card.cost}
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white p-1 rounded"
                  >
                    Right
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results phase
  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
      <div className="bg-black/80 border border-purple-500 rounded-lg p-8 max-w-2xl">
        <div className="text-center">
          <div className="text-4xl font-bold mb-4">
            {playerTowers.king > 0 && aiTowers.king <= 0 ? (
              <span className="text-green-400">🏆 VICTORY! 🏆</span>
            ) : aiTowers.king > 0 && playerTowers.king <= 0 ? (
              <span className="text-red-400">💀 DEFEAT 💀</span>
            ) : (playerTowers.left + playerTowers.right + playerTowers.king) > (aiTowers.left + aiTowers.right + aiTowers.king) ? (
              <span className="text-green-400">🏆 VICTORY! 🏆</span>
            ) : (
              <span className="text-red-400">💀 DEFEAT 💀</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-900/40 border border-blue-500 rounded p-4">
              <div className="text-lg font-bold text-blue-400">Your Towers</div>
              <div className="text-sm text-blue-300">King Tower: {Math.max(0, playerTowers.king)}/2400</div>
              <div className="text-sm text-blue-300">Left Tower: {Math.max(0, playerTowers.left)}/1600</div>
              <div className="text-sm text-blue-300">Right Tower: {Math.max(0, playerTowers.right)}/1600</div>
              <div className="text-sm text-blue-300">Units Deployed: {deployedUnits.filter(u => u.side === 'player').length}</div>
            </div>
            <div className="bg-red-900/40 border border-red-500 rounded p-4">
              <div className="text-lg font-bold text-red-400">AI Towers</div>
              <div className="text-sm text-red-300">King Tower: {Math.max(0, aiTowers.king)}/2400</div>
              <div className="text-sm text-red-300">Left Tower: {Math.max(0, aiTowers.left)}/1600</div>
              <div className="text-sm text-red-300">Right Tower: {Math.max(0, aiTowers.right)}/1600</div>
              <div className="text-sm text-red-300">Damage Dealt: {2400 - playerTowers.king + Math.max(0, 1600 - playerTowers.left) + Math.max(0, 1600 - playerTowers.right)}</div>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBattleSystem;