import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ArrowLeft, Crown, Zap, Shield, Sword } from 'lucide-react';

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

interface MinionCard {
  id: string;
  name: string;
  cost: number;
  damage: number;
  health: number;
  speed: number;
  range: number;
  attackRate: number;
  description: string;
  image: string;
  abilities: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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
  dragCard: MinionCard | null;
}

interface AdvancedTHCClashProps {
  playerNFTs: PlayerNFT[];
  onBack: () => void;
}

const AdvancedTHCClash: React.FC<AdvancedTHCClashProps> = ({ playerNFTs, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameLoopRef = useRef<number>(0);

  // Generate minion cards based on connected NFTs and trait bonuses
  const generateMinionTypes = useCallback((): MinionCard[] => {
    // Base minion template that can be enhanced by NFT traits
    const baseMinionTemplate = {
      damage: 100,
      health: 150,
      speed: 1.0,
      range: 2,
      attackRate: 1.0,
      cost: 3
    };

    // Calculate NFT-based bonuses for each connected NFT
    const nftEnhancedMinions = playerNFTs.map((nft, index) => {
      const bonuses = calculateNFTBonuses(nft);
      
      return {
        id: `nft_minion_${nft.mint}`,
        name: `${nft.name} Warrior`,
        cost: Math.max(1, Math.min(10, baseMinionTemplate.cost + bonuses.manaCost)),
        damage: Math.round(baseMinionTemplate.damage * bonuses.attackMultiplier),
        health: Math.round(baseMinionTemplate.health * bonuses.defenseMultiplier),
        speed: baseMinionTemplate.speed * bonuses.speedMultiplier,
        range: baseMinionTemplate.range * bonuses.rangeMultiplier,
        attackRate: baseMinionTemplate.attackRate * bonuses.attackRateMultiplier,
        description: `Enhanced by ${nft.name} traits: ${bonuses.abilities.join(', ')}`,
        image: nft.image,
        abilities: bonuses.abilities,
        rarity: determineRarityFromRank(nft.rank) as 'common' | 'rare' | 'epic' | 'legendary'
      };
    });

    // Add base minions to fill out the collection
    const baseMinions = [
      // Common Minions (1-2 cost)
      { name: 'THC Grower', cost: 1, damage: 60, health: 100, speed: 1.0, range: 1, attackRate: 1.0, abilities: ['Harvest'], rarity: 'common' as const },
      { name: 'Bud Runner', cost: 1, damage: 45, health: 80, speed: 2.0, range: 1, attackRate: 1.2, abilities: ['Speed Boost'], rarity: 'common' as const },
      { name: 'Joint Smoker', cost: 2, damage: 80, health: 120, speed: 0.8, range: 1, attackRate: 0.9, abilities: ['Smoke Screen'], rarity: 'common' as const },
      { name: 'Seed Planter', cost: 2, damage: 70, health: 140, speed: 0.7, range: 1, attackRate: 0.8, abilities: ['Plant Growth'], rarity: 'common' as const },
      { name: 'Street Dealer', cost: 2, damage: 90, health: 110, speed: 1.3, range: 1, attackRate: 1.1, abilities: ['Quick Sale'], rarity: 'common' as const },
      { name: 'Trimmer', cost: 2, damage: 85, health: 105, speed: 1.1, range: 1, attackRate: 1.0, abilities: ['Precision Cut'], rarity: 'common' as const },
      { name: 'Hash Maker', cost: 2, damage: 75, health: 125, speed: 0.9, range: 2, attackRate: 0.9, abilities: ['Sticky Trap'], rarity: 'common' as const },
      { name: 'Bong Guardian', cost: 2, damage: 95, health: 130, speed: 0.6, range: 1, attackRate: 0.8, abilities: ['Water Shield'], rarity: 'common' as const },
      
      // Rare Minions (3-4 cost)
      { name: 'Hydro Master', cost: 3, damage: 120, health: 180, speed: 1.0, range: 2, attackRate: 1.0, abilities: ['Hydroponic Boost'], rarity: 'rare' as const },
      { name: 'Dab Specialist', cost: 3, damage: 140, health: 160, speed: 1.2, range: 1.5, attackRate: 1.1, abilities: ['Concentrate Attack'], rarity: 'rare' as const },
      { name: 'Vape Cloud', cost: 3, damage: 100, health: 200, speed: 0.8, range: 3, attackRate: 1.0, abilities: ['Vapor Screen'], rarity: 'rare' as const },
      { name: 'Edible Chef', cost: 3, damage: 110, health: 190, speed: 0.9, range: 2, attackRate: 0.9, abilities: ['Healing Food'], rarity: 'rare' as const },
      { name: 'Trichome Hunter', cost: 4, damage: 160, health: 220, speed: 1.1, range: 2, attackRate: 1.0, abilities: ['Crystal Harvest'], rarity: 'rare' as const },
      { name: 'Extraction Artist', cost: 4, damage: 180, health: 200, speed: 1.0, range: 2.5, attackRate: 1.1, abilities: ['Pure Extract'], rarity: 'rare' as const },
      { name: 'Greenhouse Guard', cost: 4, damage: 140, health: 280, speed: 0.7, range: 1.5, attackRate: 0.8, abilities: ['Climate Control'], rarity: 'rare' as const },
      { name: 'Terpene Warrior', cost: 4, damage: 170, health: 240, speed: 1.0, range: 2, attackRate: 1.0, abilities: ['Aroma Boost'], rarity: 'rare' as const },
      
      // Epic Minions (5-6 cost)
      { name: 'Master Cultivator', cost: 5, damage: 200, health: 320, speed: 0.9, range: 2, attackRate: 1.0, abilities: ['Master Growth', 'THC Boost'], rarity: 'epic' as const },
      { name: 'Dispensary Owner', cost: 5, damage: 180, health: 350, speed: 0.8, range: 3, attackRate: 0.9, abilities: ['Business Boost', 'Quality Control'], rarity: 'epic' as const },
      { name: 'Lab Technician', cost: 5, damage: 220, health: 300, speed: 1.0, range: 2.5, attackRate: 1.1, abilities: ['Lab Analysis', 'Potency Test'], rarity: 'epic' as const },
      { name: 'Cannabis Shaman', cost: 6, damage: 190, health: 380, speed: 0.7, range: 4, attackRate: 0.8, abilities: ['Spiritual Healing', 'Ancient Wisdom'], rarity: 'epic' as const },
      { name: 'Rosin Press King', cost: 6, damage: 250, health: 320, speed: 0.8, range: 2, attackRate: 1.0, abilities: ['Pressure Strike', 'Golden Extract'], rarity: 'epic' as const },
      { name: 'Breeding Expert', cost: 6, damage: 210, health: 360, speed: 0.9, range: 2.5, attackRate: 0.9, abilities: ['Genetic Mastery', 'Strain Creation'], rarity: 'epic' as const },
      
      // Legendary Minions (7-10 cost)
      { name: 'Cannabis Dragon', cost: 7, damage: 300, health: 450, speed: 1.2, range: 3, attackRate: 1.1, abilities: ['Fire Breath', 'Flying', 'Ancient Power'], rarity: 'legendary' as const },
      { name: 'THC Phoenix', cost: 8, damage: 280, health: 400, speed: 1.3, range: 3.5, attackRate: 1.2, abilities: ['Rebirth', 'Flame Trail', 'Resurrection'], rarity: 'legendary' as const },
      { name: 'Ganja Golem', cost: 8, damage: 350, health: 600, speed: 0.6, range: 1.5, attackRate: 0.7, abilities: ['Stone Skin', 'Earth Shake', 'Regeneration'], rarity: 'legendary' as const },
      { name: 'Cosmic Cultivator', cost: 9, damage: 320, health: 500, speed: 1.0, range: 4, attackRate: 1.0, abilities: ['Space Growth', 'Stellar Energy', 'Time Warp'], rarity: 'legendary' as const },
      { name: 'Hash Oil Wizard', cost: 9, damage: 290, health: 480, speed: 0.8, range: 5, attackRate: 0.9, abilities: ['Oil Magic', 'Sticky Spell', 'Concentrate Power'], rarity: 'legendary' as const },
      
      // Spell/Support Cards (2-6 cost)
      { name: 'Nutrient Boost', cost: 2, damage: 0, health: 0, speed: 0, range: 0, attackRate: 0, abilities: ['Team Buff'], rarity: 'common' as const },
      { name: 'Pest Control', cost: 3, damage: 150, health: 0, speed: 0, range: 0, attackRate: 0, abilities: ['Area Damage'], rarity: 'rare' as const },
      { name: 'Light Spectrum', cost: 4, damage: 0, health: 0, speed: 0, range: 0, attackRate: 0, abilities: ['Growth Acceleration'], rarity: 'rare' as const },
      { name: 'CO2 Injection', cost: 3, damage: 0, health: 0, speed: 0, range: 0, attackRate: 0, abilities: ['Speed Boost All'], rarity: 'rare' as const },
      
      // Additional Unique Minions
      { name: 'Kief Collector', cost: 3, damage: 130, health: 170, speed: 1.1, range: 2, attackRate: 1.0, abilities: ['Dust Cloud'], rarity: 'rare' as const },
      { name: 'Bubble Hash Bomber', cost: 4, damage: 200, health: 180, speed: 1.0, range: 3, attackRate: 0.8, abilities: ['Bubble Burst'], rarity: 'rare' as const },
      { name: 'Live Resin Lurker', cost: 5, damage: 240, health: 280, speed: 0.9, range: 2, attackRate: 1.0, abilities: ['Fresh Extract'], rarity: 'epic' as const },
      { name: 'Crystalline Guardian', cost: 6, damage: 220, health: 340, speed: 0.8, range: 2.5, attackRate: 0.9, abilities: ['Crystal Shield'], rarity: 'epic' as const },
      { name: 'Terpene Tornado', cost: 7, damage: 260, health: 300, speed: 1.4, range: 2, attackRate: 1.2, abilities: ['Whirlwind Attack'], rarity: 'legendary' as const },
      { name: 'Full Spectrum Sage', cost: 8, damage: 310, health: 420, speed: 0.9, range: 4, attackRate: 0.8, abilities: ['Spectrum Mastery'], rarity: 'legendary' as const },
      { name: 'Distillate Destroyer', cost: 9, damage: 380, health: 460, speed: 1.1, range: 3, attackRate: 1.0, abilities: ['Pure Destruction'], rarity: 'legendary' as const },
      { name: 'Isolate Emperor', cost: 10, damage: 400, health: 550, speed: 0.8, range: 3.5, attackRate: 0.9, abilities: ['Ultimate Purity'], rarity: 'legendary' as const },
      { name: 'Moonrock Meteor', cost: 8, damage: 350, health: 380, speed: 1.2, range: 2.5, attackRate: 1.1, abilities: ['Cosmic Impact'], rarity: 'legendary' as const },
      { name: 'Solventless Supreme', cost: 7, damage: 270, health: 400, speed: 1.0, range: 3, attackRate: 1.0, abilities: ['Clean Extraction'], rarity: 'legendary' as const }
    ];

    const baseMinions = generateBaseMinions();
    
    // Combine NFT-enhanced minions with base minions
    const allMinions = [...nftEnhancedMinions, ...baseMinions];
    
    return allMinions.map((minion, index) => ({
      id: minion.id || `minion_${index}`,
      ...minion,
      description: minion.description || `${minion.abilities.join(', ')} - A powerful ${minion.rarity} THC unit`,
      image: minion.image || '' // Use NFT image or default
    }));
  }, [playerNFTs]);

  // Calculate detailed NFT bonuses based on actual traits
  const calculateNFTBonuses = (nft: PlayerNFT) => {
    let attackMultiplier = 1.0;
    let defenseMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let rangeMultiplier = 1.0;
    let attackRateMultiplier = 1.0;
    let manaRegenMultiplier = 1.0;
    let manaCost = 0;
    const abilities: string[] = [];

    // Rank-based base bonuses (lower rank = better stats)
    const rankBonus = Math.max(0.1, (2500 - nft.rank) / 2500);
    attackMultiplier += rankBonus * 0.5;
    defenseMultiplier += rankBonus * 0.3;
    speedMultiplier += rankBonus * 0.2;

    // Trait-specific bonuses
    if (nft.attributes) {
      nft.attributes.forEach(attr => {
        const traitType = attr.trait_type.toLowerCase();
        const traitValue = attr.value.toLowerCase();

        switch (traitType) {
          case 'eyes':
            if (traitValue.includes('red')) {
              attackMultiplier += 0.3;
              abilities.push('Burning Gaze');
              manaCost += 1;
            } else if (traitValue.includes('green')) {
              manaRegenMultiplier += 0.4;
              abilities.push('Nature Sight');
            } else if (traitValue.includes('blue')) {
              rangeMultiplier += 0.3;
              abilities.push('Ice Stare');
            } else if (traitValue.includes('gold')) {
              attackMultiplier += 0.2;
              defenseMultiplier += 0.2;
              abilities.push('Golden Vision');
              manaCost += 2;
            }
            break;

          case 'clothes':
          case 'clothing':
            if (traitValue.includes('hoodie')) {
              speedMultiplier += 0.3;
              abilities.push('Stealth Mode');
            } else if (traitValue.includes('lab coat')) {
              attackRateMultiplier += 0.4;
              abilities.push('Science Boost');
              manaCost += 1;
            } else if (traitValue.includes('suit')) {
              defenseMultiplier += 0.4;
              abilities.push('Professional Shield');
              manaCost += 1;
            } else if (traitValue.includes('armor')) {
              defenseMultiplier += 0.6;
              speedMultiplier -= 0.2;
              abilities.push('Heavy Defense');
              manaCost += 2;
            }
            break;

          case 'head':
          case 'headwear':
            if (traitValue.includes('crown')) {
              attackMultiplier += 0.4;
              defenseMultiplier += 0.3;
              abilities.push('Royal Command');
              manaCost += 2;
            } else if (traitValue.includes('bandana')) {
              speedMultiplier += 0.2;
              attackRateMultiplier += 0.2;
              abilities.push('Gang Leader');
            } else if (traitValue.includes('helmet')) {
              defenseMultiplier += 0.5;
              abilities.push('Head Protection');
              manaCost += 1;
            }
            break;

          case 'mouth':
            if (traitValue.includes('joint')) {
              manaRegenMultiplier += 0.3;
              abilities.push('Smoke Bomb');
            } else if (traitValue.includes('pipe')) {
              attackMultiplier += 0.2;
              rangeMultiplier += 0.2;
              abilities.push('Focus Strike');
            } else if (traitValue.includes('vape')) {
              speedMultiplier += 0.2;
              abilities.push('Vapor Cloud');
            }
            break;

          case 'background':
            if (traitValue.includes('lab')) {
              attackRateMultiplier += 0.3;
              abilities.push('Tech Support');
            } else if (traitValue.includes('forest')) {
              defenseMultiplier += 0.2;
              manaRegenMultiplier += 0.3;
              abilities.push('Natural Healing');
            } else if (traitValue.includes('city')) {
              speedMultiplier += 0.3;
              abilities.push('Urban Tactics');
            } else if (traitValue.includes('space')) {
              attackMultiplier += 0.3;
              rangeMultiplier += 0.4;
              abilities.push('Cosmic Power');
              manaCost += 2;
            }
            break;

          case 'accessories':
          case 'accessory':
            if (traitValue.includes('chain')) {
              attackMultiplier += 0.2;
              abilities.push('Intimidation');
            } else if (traitValue.includes('glasses')) {
              rangeMultiplier += 0.3;
              abilities.push('Enhanced Vision');
            } else if (traitValue.includes('watch')) {
              attackRateMultiplier += 0.3;
              abilities.push('Perfect Timing');
            }
            break;
        }
      });
    }

    return {
      attackMultiplier: Math.min(3.0, attackMultiplier), // Cap at 3x
      defenseMultiplier: Math.min(3.0, defenseMultiplier),
      speedMultiplier: Math.min(2.5, speedMultiplier),
      rangeMultiplier: Math.min(2.0, rangeMultiplier),
      attackRateMultiplier: Math.min(2.5, attackRateMultiplier),
      manaRegenMultiplier: Math.min(2.0, manaRegenMultiplier),
      manaCost: Math.max(-2, Math.min(3, manaCost)), // Cost adjustment -2 to +3
      abilities: abilities.slice(0, 3) // Limit to 3 abilities max
    };
  };

  // Determine rarity based on NFT rank
  const determineRarityFromRank = (rank: number): string => {
    if (rank <= 100) return 'legendary';
    if (rank <= 500) return 'epic';
    if (rank <= 1500) return 'rare';
    return 'common';
  };

  // Generate base minions to supplement NFT-based ones
  const generateBaseMinions = (): Partial<MinionCard>[] => {
    return [
      // Common base minions
      { name: 'THC Grower', cost: 1, damage: 60, health: 100, speed: 1.0, range: 1, attackRate: 1.0, abilities: ['Harvest'], rarity: 'common' },
      { name: 'Bud Runner', cost: 2, damage: 80, health: 120, speed: 1.2, range: 1, attackRate: 1.1, abilities: ['Speed Boost'], rarity: 'common' },
      { name: 'Joint Smoker', cost: 2, damage: 90, health: 110, speed: 0.9, range: 1, attackRate: 0.9, abilities: ['Smoke Screen'], rarity: 'common' },
      // Rare base minions  
      { name: 'Hash Master', cost: 3, damage: 130, health: 180, speed: 1.0, range: 2, attackRate: 1.0, abilities: ['Sticky Trap'], rarity: 'rare' },
      { name: 'Vape Cloud', cost: 4, damage: 150, health: 200, speed: 0.8, range: 3, attackRate: 1.0, abilities: ['Vapor Screen'], rarity: 'rare' },
      // Epic base minions
      { name: 'Cannabis Shaman', cost: 6, damage: 200, health: 300, speed: 0.7, range: 4, attackRate: 0.8, abilities: ['Healing Aura'], rarity: 'epic' },
      // Legendary base minion
      { name: 'THC Dragon', cost: 8, damage: 350, health: 450, speed: 1.2, range: 3, attackRate: 1.1, abilities: ['Fire Breath'], rarity: 'legendary' }
    ];
  };

  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    isPlaying: false,
    timeLeft: 300, // 5 minutes
    playerCrowns: 0,
    enemyCrowns: 0,
    playerMana: 10,
    enemyMana: 10,
    selectedCard: null,
    dragging: false,
    dragCard: null
  });

  const [availableMinions] = useState<MinionCard[]>(generateMinionTypes());
  const [selectedDeck, setSelectedDeck] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<MinionCard[]>([]);
  const [castles, setCastles] = useState<Castle[]>([]);
  const [minions, setMinions] = useState<Minion[]>([]);
  const [commanderCard, setCommanderCard] = useState<MinionCard | null>(null);

  // Create NFT Commander Card based on player's best NFT with authentic bonuses
  useEffect(() => {
    if (playerNFTs.length > 0) {
      // Use the highest ranked (lowest number) NFT as commander
      const bestNFT = playerNFTs.reduce((best, current) => 
        current.rank < best.rank ? current : best
      );
      
      const bonuses = calculateNFTBonuses(bestNFT);
      const baseCost = 4; // Base commander cost
      
      const commander: MinionCard = {
        id: 'nft_commander',
        name: `${bestNFT.name} Commander`,
        cost: Math.max(2, Math.min(8, baseCost + bonuses.manaCost)),
        damage: Math.round(250 * bonuses.attackMultiplier),
        health: Math.round(400 * bonuses.defenseMultiplier),
        speed: 1.0 * bonuses.speedMultiplier,
        range: 2.5 * bonuses.rangeMultiplier,
        attackRate: 1.0 * bonuses.attackRateMultiplier,
        description: `Your #${bestNFT.rank} ranked commander with authentic trait bonuses`,
        image: bestNFT.image,
        abilities: ['Commander Aura', ...bonuses.abilities],
        rarity: 'legendary'
      };
      setCommanderCard(commander);
    }
  }, [playerNFTs]);

  // Initialize castles
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

  // Draw initial hand
  useEffect(() => {
    if (gameState.phase === 'battle' && selectedDeck.length === 6) {
      const deckCards = selectedDeck.map(id => {
        if (id === 'nft_commander' && commanderCard) return commanderCard;
        return availableMinions.find(m => m.id === id)!;
      }).filter(Boolean);
      
      setPlayerHand(deckCards.slice(0, 4)); // Start with 4 cards
    }
  }, [gameState.phase, selectedDeck, availableMinions, commanderCard]);

  // Game loop
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

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'linear-gradient(180deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw battlefield grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lanes
    for (let x = 60; x <= 300; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal center line
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
      // Create image element and draw NFT
      const img = new Image();
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
    
    // Ability indicators
    if (minion.abilities.length > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('✨', minion.x, minion.y + size/2 + 10);
    }
  };

  const updateMinions = () => {
    setMinions(prevMinions => {
      return prevMinions.map(minion => {
        // Find target if none
        if (!minion.target || (minion.target as any).destroyed || (minion.target as any).health <= 0) {
          findTarget(minion);
        }
        
        if (minion.target) {
          const dx = minion.target.x - minion.x;
          const dy = minion.target.y - minion.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > minion.range * 20) {
            // Move towards target
            const angle = Math.atan2(dy, dx);
            minion.x += Math.cos(angle) * minion.speed * 2;
            minion.y += Math.sin(angle) * minion.speed * 2;
            minion.moving = true;
          } else {
            // Attack target
            const now = gameLoopRef.current;
            if (now - minion.lastAttack > 60 / minion.attackRate) {
              minion.target.health -= minion.damage;
              minion.lastAttack = now;
              
              // Check if target destroyed
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
    if (gameLoopRef.current % 120 === 0) { // Every 2 seconds at 60fps
      setGameState(prev => ({
        ...prev,
        playerMana: Math.min(10, prev.playerMana + 1),
        enemyMana: Math.min(10, prev.enemyMana + 1)
      }));
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.dragCard) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Only allow placement in player area (bottom half)
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
    const newMinion: Minion = {
      id: `minion_${Date.now()}`,
      x, y,
      health: card.health,
      maxHealth: card.health,
      damage: card.damage,
      speed: card.speed,
      range: card.range,
      attackRate: card.attackRate,
      owner: 'player',
      cardId: card.id,
      target: null,
      lastAttack: 0,
      abilities: card.abilities,
      moving: false
    };
    
    setMinions(prev => [...prev, newMinion]);
    
    // Draw new card to replace the played one
    drawNewCard();
  };

  const drawNewCard = () => {
    const availableCards = selectedDeck.map(id => {
      if (id === 'nft_commander' && commanderCard) return commanderCard;
      return availableMinions.find(m => m.id === id)!;
    }).filter(Boolean);
    
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
    } else if (selectedDeck.length < 5) { // Leave room for commander
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
                THC <span className="text-green-400">CLASH</span>
              </h1>
              <div className="w-20"></div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Advanced Battle System</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Crown className="text-yellow-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">3 Castles</div>
                  <div className="text-gray-400 text-sm">Each Side</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Sword className="text-red-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">40 Minions</div>
                  <div className="text-gray-400 text-sm">Unique Types</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Shield className="text-blue-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">NFT Commander</div>
                  <div className="text-gray-400 text-sm">Your Avatar</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <Zap className="text-yellow-400 mx-auto mb-2" size={24} />
                  <div className="text-white font-semibold">6 Card Deck</div>
                  <div className="text-gray-400 text-sm">Strategic Play</div>
                </div>
              </div>

              <button
                onClick={() => setGameState(prev => ({ ...prev, phase: 'deck-selection' }))}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                Build Your Deck
              </button>
            </div>

            {/* NFT Commander Preview */}
            {commanderCard && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Your NFT Commander</h3>
                <div className="flex items-center gap-4">
                  <img src={commanderCard.image} alt={commanderCard.name} className="w-20 h-20 rounded-lg" />
                  <div>
                    <h4 className="text-white font-bold text-lg">{commanderCard.name}</h4>
                    <p className="text-green-400">Cost: {commanderCard.cost} | Damage: {commanderCard.damage} | Health: {commanderCard.health}</p>
                    <p className="text-blue-400 text-sm">Abilities: {commanderCard.abilities.join(', ')}</p>
                  </div>
                </div>
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
                  className={`bg-gradient-to-r from-purple-600 to-gold-500 rounded-lg p-4 cursor-pointer transition-all border-2 ${
                    selectedDeck.includes('nft_commander') ? 'border-green-400' : 'border-purple-400 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img src={commanderCard.image} alt={commanderCard.name} className="w-16 h-16 rounded-lg" />
                    <div>
                      <h4 className="text-white font-bold">{commanderCard.name}</h4>
                      <p className="text-yellow-400">Cost: {commanderCard.cost} | Legendary</p>
                      <p className="text-blue-400 text-sm">{commanderCard.abilities.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Minion Selection Grid */}
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
                  <div className="w-full h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded mb-2 flex items-center justify-center text-xs font-bold text-white">
                    {minion.rarity.toUpperCase()}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{minion.name}</h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Cost: {minion.cost}</div>
                    <div>DMG: {minion.damage} | HP: {minion.health}</div>
                    <div className="text-yellow-400">{minion.abilities[0]}</div>
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
                <div className="w-16 h-16 mb-1 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  {card.id === 'nft_commander' && card.image ? (
                    <img src={card.image} alt={card.name} className="w-full h-full rounded object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">🎮</span>
                  )}
                </div>
                <div className="text-xs text-white text-center font-semibold">{card.cost}</div>
                <div className="text-xs text-white text-center">{card.name.split(' ')[0]}</div>
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

export default AdvancedTHCClash;