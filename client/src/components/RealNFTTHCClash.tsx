import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ArrowLeft, Crown, Zap, Shield, Sword } from 'lucide-react';
import { GameCard, ALL_CARDS, BASE_CARDS, SPELL_CARDS, Card } from './GameCards';
import SpellEffect from './SpellEffects';

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

interface MinionCard extends GameCard {
  damage?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  nftSource?: string; // NFT mint address if derived from NFT
}

interface Castle {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isKing: boolean;
  owner: 'player' | 'enemy';
  destroyed: boolean;
}

interface Minion {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  range: number;
  attackRate: number;
  owner: 'player' | 'enemy';
  cardId: string;
  target: Minion | Castle | null;
  lastAttack: number;
  abilities: string[];
  moving: boolean;
}

interface GameState {
  phase: 'menu' | 'deck-selection' | 'battle' | 'game-over';
  isPlaying: boolean;
  timeLeft: number;
  playerCrowns: number;
  enemyCrowns: number;
  playerMana: number;
  enemyMana: number;
  selectedCard: string | null;
  dragging: boolean;
  dragCard: GameCard | null;
  spellEffects: Array<{
    id: string;
    type: 'lightning' | 'heal' | 'fire' | 'ice';
    position: { x: number; y: number };
  }>;
}

interface RealNFTTHCClashProps {
  playerNFTs: PlayerNFT[];
  onBack: () => void;
}

const RealNFTTHCClash: React.FC<RealNFTTHCClashProps> = ({ playerNFTs, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameLoopRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    isPlaying: false,
    timeLeft: 300,
    playerCrowns: 0,
    enemyCrowns: 0,
    playerMana: 10,
    enemyMana: 10,
    selectedCard: null,
    dragging: false,
    dragCard: null,
    spellEffects: []
  });

  const [availableMinions, setAvailableMinions] = useState<MinionCard[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<MinionCard[]>([]);
  const [castles, setCastles] = useState<Castle[]>([]);
  const [minions, setMinions] = useState<Minion[]>([]);
  const [commanderCard, setCommanderCard] = useState<MinionCard | null>(null);

  // Calculate NFT-based bonuses from real trait data
  const calculateNFTBonuses = useCallback((nft: PlayerNFT) => {
    let attackMultiplier = 1.0;
    let defenseMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let rangeMultiplier = 1.0;
    let attackRateMultiplier = 1.0;
    let manaRegenMultiplier = 1.0;
    let manaCost = 0;
    const abilities: string[] = [];

    // Rank-based bonuses (lower rank = better)
    const rankBonus = Math.max(0.1, (2500 - nft.rank) / 2500);
    attackMultiplier += rankBonus * 0.4;
    defenseMultiplier += rankBonus * 0.3;
    speedMultiplier += rankBonus * 0.2;

    // Process real NFT traits
    if (nft.attributes) {
      nft.attributes.forEach(attr => {
        const traitType = attr.trait_type.toLowerCase();
        const traitValue = attr.value.toLowerCase();

        switch (traitType) {
          case 'eyes':
            if (traitValue.includes('red')) {
              attackMultiplier += 0.25;
              abilities.push('Burning Gaze');
              manaCost += 1;
            } else if (traitValue.includes('green')) {
              manaRegenMultiplier += 0.3;
              abilities.push('Nature Sight');
            } else if (traitValue.includes('blue')) {
              rangeMultiplier += 0.2;
              abilities.push('Ice Stare');
            } else if (traitValue.includes('gold') || traitValue.includes('yellow')) {
              attackMultiplier += 0.15;
              defenseMultiplier += 0.15;
              abilities.push('Golden Vision');
              manaCost += 1;
            }
            break;

          case 'clothes':
          case 'clothing':
            if (traitValue.includes('hoodie')) {
              speedMultiplier += 0.2;
              abilities.push('Stealth Mode');
            } else if (traitValue.includes('lab coat')) {
              attackRateMultiplier += 0.3;
              abilities.push('Science Boost');
              manaCost += 1;
            } else if (traitValue.includes('suit')) {
              defenseMultiplier += 0.3;
              abilities.push('Professional Shield');
            } else if (traitValue.includes('armor')) {
              defenseMultiplier += 0.4;
              speedMultiplier -= 0.1;
              abilities.push('Heavy Defense');
              manaCost += 1;
            }
            break;

          case 'head':
          case 'headwear':
            if (traitValue.includes('crown')) {
              attackMultiplier += 0.3;
              defenseMultiplier += 0.2;
              abilities.push('Royal Command');
              manaCost += 2;
            } else if (traitValue.includes('bandana')) {
              speedMultiplier += 0.15;
              attackRateMultiplier += 0.15;
              abilities.push('Gang Leader');
            } else if (traitValue.includes('helmet')) {
              defenseMultiplier += 0.35;
              abilities.push('Head Protection');
            }
            break;

          case 'mouth':
            if (traitValue.includes('joint')) {
              manaRegenMultiplier += 0.25;
              abilities.push('Smoke Bomb');
            } else if (traitValue.includes('pipe')) {
              attackMultiplier += 0.15;
              rangeMultiplier += 0.15;
              abilities.push('Focus Strike');
            } else if (traitValue.includes('vape')) {
              speedMultiplier += 0.15;
              abilities.push('Vapor Cloud');
            }
            break;

          case 'background':
            if (traitValue.includes('lab')) {
              attackRateMultiplier += 0.25;
              abilities.push('Tech Support');
            } else if (traitValue.includes('forest')) {
              defenseMultiplier += 0.15;
              manaRegenMultiplier += 0.2;
              abilities.push('Natural Healing');
            } else if (traitValue.includes('city')) {
              speedMultiplier += 0.2;
              abilities.push('Urban Tactics');
            } else if (traitValue.includes('space')) {
              attackMultiplier += 0.2;
              rangeMultiplier += 0.3;
              abilities.push('Cosmic Power');
              manaCost += 1;
            }
            break;

          case 'accessories':
          case 'accessory':
            if (traitValue.includes('chain')) {
              attackMultiplier += 0.15;
              abilities.push('Intimidation');
            } else if (traitValue.includes('glasses')) {
              rangeMultiplier += 0.25;
              abilities.push('Enhanced Vision');
            } else if (traitValue.includes('watch')) {
              attackRateMultiplier += 0.2;
              abilities.push('Perfect Timing');
            }
            break;
        }
      });
    }

    return {
      attackMultiplier: Math.min(2.5, attackMultiplier),
      defenseMultiplier: Math.min(2.5, defenseMultiplier),
      speedMultiplier: Math.min(2.0, speedMultiplier),
      rangeMultiplier: Math.min(1.8, rangeMultiplier),
      attackRateMultiplier: Math.min(2.0, attackRateMultiplier),
      manaRegenMultiplier: Math.min(1.8, manaRegenMultiplier),
      manaCost: Math.max(-1, Math.min(2, manaCost)),
      abilities: abilities.slice(0, 3)
    };
  }, []);

  // Generate minion cards from connected NFTs
  const generateNFTMinions = useCallback((): MinionCard[] => {
    const baseStats = {
      damage: 120,
      health: 180,
      speed: 1.0,
      range: 2,
      attackRate: 1.0,
      cost: 4
    };

    return playerNFTs.map((nft, index) => {
      const bonuses = calculateNFTBonuses(nft);
      const rarity = determineRarityFromRank(nft.rank);
      
      return {
        id: `nft_${nft.mint}`,
        name: `${nft.name.split('#')[0]} Warrior`,
        cost: Math.max(1, Math.min(8, baseStats.cost + bonuses.manaCost)),
        damage: Math.round(baseStats.damage * bonuses.attackMultiplier),
        health: Math.round(baseStats.health * bonuses.defenseMultiplier),
        speed: baseStats.speed * bonuses.speedMultiplier,
        range: baseStats.range * bonuses.rangeMultiplier,
        attackRate: baseStats.attackRate * bonuses.attackRateMultiplier,
        description: `Rank #${nft.rank} | Abilities: ${bonuses.abilities.join(', ')}`,
        image: nft.image,
        abilities: bonuses.abilities,
        rarity: rarity as 'common' | 'rare' | 'epic' | 'legendary',
        nftSource: nft.mint
      };
    });
  }, [playerNFTs, calculateNFTBonuses]);

  // Generate base minions to supplement NFT ones
  const generateBaseMinions = useCallback((): MinionCard[] => {
    return [
      {
        id: 'base_grower',
        name: 'THC Grower',
        cost: 1,
        damage: 60,
        health: 100,
        speed: 1.0,
        range: 1,
        attackRate: 1.0,
        description: 'Basic THC cultivator',
        image: '',
        abilities: ['Harvest'],
        rarity: 'common'
      },
      {
        id: 'base_runner',
        name: 'Bud Runner',
        cost: 2,
        damage: 80,
        health: 120,
        speed: 1.5,
        range: 1,
        attackRate: 1.2,
        description: 'Fast moving dealer',
        image: '',
        abilities: ['Speed Boost'],
        rarity: 'common'
      },
      {
        id: 'base_master',
        name: 'Hash Master',
        cost: 4,
        damage: 150,
        health: 200,
        speed: 0.8,
        range: 2,
        attackRate: 0.9,
        description: 'Skilled concentrate maker',
        image: '',
        abilities: ['Sticky Trap'],
        rarity: 'rare'
      },
      {
        id: 'base_shaman',
        name: 'Cannabis Shaman',
        cost: 6,
        damage: 200,
        health: 300,
        speed: 0.7,
        range: 3,
        attackRate: 0.8,
        description: 'Mystical herb master',
        image: '',
        abilities: ['Healing Aura', 'Spirit Guide'],
        rarity: 'epic'
      }
    ];
  }, []);

  const determineRarityFromRank = (rank: number): string => {
    if (rank <= 100) return 'legendary';
    if (rank <= 500) return 'epic';
    if (rank <= 1500) return 'rare';
    return 'common';
  };

  // Initialize minions combining NFT and base ones
  useEffect(() => {
    const nftMinions = generateNFTMinions();
    const baseMinions = generateBaseMinions();
    setAvailableMinions([...nftMinions, ...baseMinions]);
  }, [generateNFTMinions, generateBaseMinions]);

  // Create commander card from best NFT
  useEffect(() => {
    if (playerNFTs.length > 0) {
      const bestNFT = playerNFTs.reduce((best, current) => 
        current.rank < best.rank ? current : best
      );
      
      const bonuses = calculateNFTBonuses(bestNFT);
      
      const commander: MinionCard = {
        id: 'nft_commander',
        name: `${bestNFT.name} Commander`,
        cost: Math.max(3, Math.min(7, 5 + bonuses.manaCost)),
        damage: Math.round(300 * bonuses.attackMultiplier),
        health: Math.round(450 * bonuses.defenseMultiplier),
        speed: 1.0 * bonuses.speedMultiplier,
        range: 2.5 * bonuses.rangeMultiplier,
        attackRate: 1.0 * bonuses.attackRateMultiplier,
        description: `Your #${bestNFT.rank} ranked commander with unique abilities`,
        image: bestNFT.image,
        abilities: ['Commander Aura', ...bonuses.abilities],
        rarity: 'legendary',
        nftSource: bestNFT.mint
      };
      setCommanderCard(commander);
    }
  }, [playerNFTs, calculateNFTBonuses]);

  // Initialize castles with NFT image on player king castle
  useEffect(() => {
    if (gameState.phase === 'battle') {
      const newCastles: Castle[] = [
        // Player castles (bottom)
        { id: 'player_left', x: 120, y: 400, health: 1500, maxHealth: 1500, isKing: false, owner: 'player', destroyed: false },
        { id: 'player_king', x: 180, y: 450, health: 2500, maxHealth: 2500, isKing: true, owner: 'player', destroyed: false },
        { id: 'player_right', x: 240, y: 400, health: 1500, maxHealth: 1500, isKing: false, owner: 'player', destroyed: false },
        
        // Enemy castles (top)
        { id: 'enemy_left', x: 120, y: 80, health: 1500, maxHealth: 1500, isKing: false, owner: 'enemy', destroyed: false },
        { id: 'enemy_king', x: 180, y: 30, health: 2500, maxHealth: 2500, isKing: true, owner: 'enemy', destroyed: false },
        { id: 'enemy_right', x: 240, y: 80, health: 1500, maxHealth: 1500, isKing: false, owner: 'enemy', destroyed: false }
      ];
      setCastles(newCastles);
    }
  }, [gameState.phase]);

  // Draw initial hand from selected deck
  useEffect(() => {
    if (gameState.phase === 'battle' && selectedDeck.length === 6) {
      const deckCards = selectedDeck.map(id => {
        if (id === 'nft_commander' && commanderCard) return commanderCard;
        return availableMinions.find(m => m.id === id);
      }).filter(Boolean) as MinionCard[];
      
      setPlayerHand(deckCards.slice(0, 4));
    }
  }, [gameState.phase, selectedDeck, availableMinions, commanderCard]);

  // Game rendering and logic functions
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw battlefield grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 60; x <= 300; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw castles
    castles.forEach(castle => {
      if (!castle.destroyed) {
        drawCastle(ctx, castle);
      }
    });
    
    // Draw minions
    minions.forEach(minion => {
      drawMinion(ctx, minion);
    });
  };

  const drawCastle = (ctx: CanvasRenderingContext2D, castle: Castle) => {
    const size = castle.isKing ? 40 : 30;
    
    // Castle body
    ctx.fillStyle = castle.owner === 'player' ? '#4CAF50' : '#F44336';
    ctx.fillRect(castle.x - size/2, castle.y - size/2, size, size);
    
    // NFT image on player king castle
    if (castle.isKing && castle.owner === 'player' && playerNFTs[0]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, castle.x - size/2, castle.y - size/2, size, size);
      };
      img.src = playerNFTs[0].image;
    } else {
      // Crown symbol
      ctx.fillStyle = '#FFD700';
      ctx.font = castle.isKing ? '20px Arial' : '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👑', castle.x, castle.y + 5);
    }
    
    // Health bar
    const barWidth = size + 10;
    const barHeight = 6;
    const healthPercent = castle.health / castle.maxHealth;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(castle.x - barWidth/2, castle.y - size/2 - 15, barWidth, barHeight);
    
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(castle.x - barWidth/2, castle.y - size/2 - 15, barWidth * healthPercent, barHeight);
  };

  const drawMinion = (ctx: CanvasRenderingContext2D, minion: Minion) => {
    const size = 16;
    
    // Minion body
    ctx.fillStyle = minion.owner === 'player' ? '#4CAF50' : '#F44336';
    ctx.fillRect(minion.x - size/2, minion.y - size/2, size, size);
    
    // Health bar
    const barWidth = 20;
    const barHeight = 3;
    const healthPercent = minion.health / minion.maxHealth;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(minion.x - barWidth/2, minion.y - size/2 - 8, barWidth, barHeight);
    
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(minion.x - barWidth/2, minion.y - size/2 - 8, barWidth * healthPercent, barHeight);
    
    // Special effect for NFT-based minions
    const sourceCard = availableMinions.find(c => c.id === minion.cardId);
    if (sourceCard?.nftSource) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✨', minion.x, minion.y + size/2 + 10);
    }
  };

  // Game loop and update functions
  useEffect(() => {
    if (gameState.isPlaying) {
      const gameLoop = () => {
        gameLoopRef.current++;
        updateMinions();
        updateCastles();
        updateMana();
        renderGame();
        animationRef.current = requestAnimationFrame(gameLoop);
      };
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, minions, castles]);

  const updateMinions = () => {
    setMinions(prevMinions => {
      return prevMinions.map(minion => {
        if (!minion.target || (minion.target as any).destroyed || (minion.target as any).health <= 0) {
          findTarget(minion);
        }
        
        if (minion.target) {
          const dx = minion.target.x - minion.x;
          const dy = minion.target.y - minion.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > minion.range * 20) {
            const angle = Math.atan2(dy, dx);
            minion.x += Math.cos(angle) * minion.speed * 2;
            minion.y += Math.sin(angle) * minion.speed * 2;
            minion.moving = true;
          } else {
            const now = gameLoopRef.current;
            if (now - minion.lastAttack > 60 / minion.attackRate) {
              
              // Apply NFT bonus damage
              let finalDamage = minion.damage;
              const sourceCard = availableMinions.find(c => c.id === minion.cardId);
              if (sourceCard?.nftSource) {
                const sourceNFT = playerNFTs.find(nft => nft.mint === sourceCard.nftSource);
                if (sourceNFT) {
                  const bonuses = calculateNFTBonuses(sourceNFT);
                  finalDamage = Math.round(minion.damage * bonuses.attackMultiplier);
                }
              }
              
              minion.target.health -= finalDamage;
              minion.lastAttack = now;
              
              if (minion.target.health <= 0) {
                if ('destroyed' in minion.target) {
                  (minion.target as Castle).destroyed = true;
                  if ((minion.target as Castle).isKing) {
                    setGameState(prev => ({
                      ...prev,
                      [minion.owner === 'player' ? 'playerCrowns' : 'enemyCrowns']: prev[minion.owner === 'player' ? 'playerCrowns' : 'enemyCrowns'] + 1
                    }));
                  }
                }
              }
            }
            minion.moving = false;
          }
        }
        
        return minion;
      }).filter(minion => minion.health > 0);
    });
  };

  const findTarget = (minion: Minion) => {
    const targets = [
      ...castles.filter(c => c.owner !== minion.owner && !c.destroyed),
      ...minions.filter(m => m.owner !== minion.owner)
    ];
    
    let closestTarget = null;
    let closestDistance = Infinity;
    
    targets.forEach(target => {
      const distance = Math.sqrt((target.x - minion.x) ** 2 + (target.y - minion.y) ** 2);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });
    
    minion.target = closestTarget;
  };

  const updateCastles = () => {
    setCastles(prev => prev.map(castle => {
      if (castle.health <= 0 && !castle.destroyed) {
        castle.destroyed = true;
        setGameState(prevState => {
          const newCrowns = castle.owner === 'enemy' ? prevState.playerCrowns + 1 : prevState.enemyCrowns + 1;
          return {
            ...prevState,
            [castle.owner === 'enemy' ? 'playerCrowns' : 'enemyCrowns']: newCrowns
          };
        });
      }
      return castle;
    }));
  };

  const updateMana = () => {
    if (gameLoopRef.current % 120 === 0) {
      setGameState(prev => ({
        ...prev,
        playerMana: Math.min(10, prev.playerMana + 1),
        enemyMana: Math.min(10, prev.enemyMana + 1)
      }));
    }
  };

  // Event handlers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.dragCard) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (y < canvas.height * 0.5) return;
    
    if (gameState.playerMana >= gameState.dragCard.cost) {
      deployMinion(gameState.dragCard, x, y);
      setGameState(prev => ({
        ...prev,
        playerMana: prev.playerMana - gameState.dragCard!.cost,
        dragging: false,
        dragCard: null
      }));
    }
  };

  const deployMinion = (card: MinionCard, x: number, y: number) => {
    // Apply NFT bonuses to deployed minion
    let finalStats = {
      health: card.health,
      damage: card.damage,
      speed: card.speed,
      range: card.range,
      attackRate: card.attackRate
    };

    if (card.nftSource) {
      const sourceNFT = playerNFTs.find(nft => nft.mint === card.nftSource);
      if (sourceNFT) {
        const bonuses = calculateNFTBonuses(sourceNFT);
        finalStats = {
          health: Math.round(card.health * bonuses.defenseMultiplier),
          damage: Math.round(card.damage * bonuses.attackMultiplier),
          speed: card.speed * bonuses.speedMultiplier,
          range: card.range * bonuses.rangeMultiplier,
          attackRate: card.attackRate * bonuses.attackRateMultiplier
        };
      }
    }

    const newMinion: Minion = {
      id: `minion_${Date.now()}`,
      x, y,
      health: finalStats.health,
      maxHealth: finalStats.health,
      damage: finalStats.damage,
      speed: finalStats.speed,
      range: finalStats.range,
      attackRate: finalStats.attackRate,
      owner: 'player',
      cardId: card.id,
      target: null,
      lastAttack: 0,
      abilities: card.abilities,
      moving: false
    };
    
    setMinions(prev => [...prev, newMinion]);
    drawNewCard();
  };

  const drawNewCard = () => {
    const availableCards = selectedDeck.map(id => {
      if (id === 'nft_commander' && commanderCard) return commanderCard;
      return availableMinions.find(m => m.id === id);
    }).filter(Boolean) as MinionCard[];
    
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    setPlayerHand(prev => {
      const newHand = [...prev];
      const emptyIndex = newHand.findIndex(card => !card);
      if (emptyIndex !== -1) {
        newHand[emptyIndex] = randomCard;
      } else if (newHand.length < 4) {
        newHand.push(randomCard);
      }
      return newHand;
    });
  };

  const startBattle = () => {
    if (selectedDeck.length !== 6) {
      alert('Please select exactly 6 cards including your NFT commander!');
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      phase: 'battle',
      isPlaying: true,
      timeLeft: 300,
      playerCrowns: 0,
      enemyCrowns: 0,
      playerMana: 10,
      enemyMana: 10
    }));
    setMinions([]);
  };

  const selectCardForDeck = (cardId: string) => {
    if (selectedDeck.includes(cardId)) {
      setSelectedDeck(prev => prev.filter(id => id !== cardId));
    } else if (selectedDeck.length < 5) {
      setSelectedDeck(prev => [...prev, cardId]);
    }
  };

  const addCommanderToDeck = () => {
    if (commanderCard && !selectedDeck.includes('nft_commander')) {
      setSelectedDeck(prev => [...prev, 'nft_commander']);
    }
  };

  // Render based on game phase
  if (gameState.phase === 'menu') {
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
                Real NFT <span className="text-green-400">CLASH</span>
              </h1>
              <div className="w-20"></div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Your Connected GROWERZ NFTs</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Crown className="text-yellow-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">{playerNFTs.length}</div>
                  <div className="text-gray-400 text-sm">Connected NFTs</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Sword className="text-red-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">{playerNFTs.length + 4}</div>
                  <div className="text-gray-400 text-sm">Available Cards</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Shield className="text-blue-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">1</div>
                  <div className="text-gray-400 text-sm">NFT Commander</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Zap className="text-yellow-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">Real</div>
                  <div className="text-gray-400 text-sm">Trait Bonuses</div>
                </div>
              </div>

              <button
                onClick={() => setGameState(prev => ({ ...prev, phase: 'deck-selection' }))}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                Build Your Deck
              </button>
            </div>

            {/* Your Connected NFTs Display */}
            {playerNFTs.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Your GROWERZ Collection</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {playerNFTs.slice(0, 4).map(nft => (
                    <div key={nft.mint} className="bg-gray-700/50 rounded-lg p-3">
                      <img src={nft.image} alt={nft.name} className="w-full h-20 object-cover rounded mb-2" />
                      <h4 className="text-white font-semibold text-sm">{nft.name.split('#')[0]}</h4>
                      <p className="text-green-400 text-xs">Rank #{nft.rank}</p>
                      <p className="text-blue-400 text-xs">{nft.attributes?.length || 0} traits</p>
                    </div>
                  ))}
                </div>
                {playerNFTs.length > 4 && (
                  <p className="text-gray-400 text-center mt-4">+ {playerNFTs.length - 4} more NFTs</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'deck-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 p-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setGameState(prev => ({ ...prev, phase: 'menu' }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <h2 className="text-2xl font-bold text-white">
                Build Your Deck ({selectedDeck.length}/6)
              </h2>
              <button
                onClick={startBattle}
                disabled={selectedDeck.length !== 6}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Battle
              </button>
            </div>

            {/* NFT Commander Selection */}
            {commanderCard && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Your NFT Commander (Required)</h3>
                <div 
                  onClick={addCommanderToDeck}
                  className={`bg-gradient-to-r from-purple-600 to-yellow-500 rounded-lg p-4 cursor-pointer transition-all border-2 ${
                    selectedDeck.includes('nft_commander') ? 'border-green-400' : 'border-purple-400 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img src={commanderCard.image} alt={commanderCard.name} className="w-16 h-16 rounded-lg" />
                    <div>
                      <h4 className="text-white font-bold">{commanderCard.name}</h4>
                      <p className="text-yellow-400">Cost: {commanderCard.cost} | DMG: {commanderCard.damage} | HP: {commanderCard.health}</p>
                      <p className="text-blue-400 text-sm">{commanderCard.abilities.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
              {availableMinions.map(minion => (
                <div
                  key={minion.id}
                  onClick={() => selectCardForDeck(minion.id)}
                  className={`bg-gray-800 rounded-lg p-3 cursor-pointer transition-all border-2 ${
                    selectedDeck.includes(minion.id)
                      ? 'border-green-400 bg-green-900/50'
                      : 'border-gray-600 hover:border-purple-400'
                  } ${minion.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30' : ''}`}
                >
                  <div className="w-full h-12 rounded mb-2 flex items-center justify-center overflow-hidden">
                    {minion.image ? (
                      <img src={minion.image} alt={minion.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center text-xs font-bold text-white">
                        {minion.rarity.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{minion.name}</h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Cost: {minion.cost}</div>
                    <div>DMG: {minion.damage} | HP: {minion.health}</div>
                    <div className="text-yellow-400">{minion.abilities[0]}</div>
                    {minion.nftSource && (
                      <div className="text-green-400">✨ NFT Enhanced</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Battle Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-purple-500/30">
          {/* Game HUD */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="text-white font-bold">
                Time: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-yellow-400" />
                <span className="text-white font-bold">
                  {gameState.playerCrowns} - {gameState.enemyCrowns}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {gameState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => setGameState(prev => ({ ...prev, phase: 'menu' }))}
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCanvasClick}
              className="border-2 border-white rounded-lg shadow-lg cursor-crosshair"
            />
          </div>

          {/* Card Hand */}
          <div className="flex justify-center gap-2 mb-4">
            {playerHand.map((card, index) => (
              <div
                key={`${card.id}_${index}`}
                draggable
                onDragStart={() => setGameState(prev => ({ ...prev, dragging: true, dragCard: card }))}
                onDragEnd={() => setGameState(prev => ({ ...prev, dragging: false, dragCard: null }))}
                className={`bg-gray-800 rounded-lg p-2 cursor-grab transition-all border-2 ${
                  gameState.playerMana >= card.cost
                    ? 'border-green-400 hover:border-green-300'
                    : 'border-red-600 opacity-50'
                }`}
              >
                <div className="w-16 h-16 mb-1 rounded overflow-hidden">
                  {card.image ? (
                    <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🎮</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-white text-center font-semibold">{card.cost}</div>
                <div className="text-xs text-white text-center">{card.name.split(' ')[0]}</div>
                {card.nftSource && (
                  <div className="text-xs text-green-400 text-center">✨</div>
                )}
              </div>
            ))}
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

export default RealNFTTHCClash;