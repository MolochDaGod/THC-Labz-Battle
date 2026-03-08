import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Crown, Zap, Target, Timer, Trophy, Shield, Sword } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated, useTransition } from '@react-spring/web';
import { LocalGameService, BattleResult } from '../services/LocalGameService';
import {
  drawMagicalAura, drawRangedAura, drawTankAura, drawTowerAura,
  drawMeleeHit, drawRangedHit, drawMagicalHit,
  drawBlizzardAOE, drawFireAOE, drawGenericAOE,
  drawMagicalProjectile, drawRangedProjectile, drawMeleeProjectile,
  drawSpellCast, drawTowerShot
} from './BattleParticles';

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
  angle?: number; // For smooth turning animations
  velocity?: {x: number, y: number}; // For smoother movement
  isTower?: boolean; // Tower cards are stationary defensive units
  deployTime?: number; // When the tower was deployed
  despawnTime?: number; // When the tower should despawn (2 minutes)
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

interface VisualBattleSystemProps {
  playerDeck: BattleCard[];
  captainCard?: BattleCard;
  onBattleEnd: (winner: 'player' | 'ai', results: any) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  nftData?: {
    nft?: { image?: string };
    bonuses?: { attackBonus?: number };
  };
  playerWallet?: string;
  gameZones?: any[];
}

// Enhanced card classification system for ALL 66 cards
const determineCardAttackType = (card: BattleCard): 'ranged' | 'melee' | 'magical' | 'tank' | 'spell' => {
  const name = card.name.toLowerCase();
  const type = card.type?.toLowerCase() || '';
  const className = card.class?.toLowerCase() || '';
  
  // Spell cards (cast magic effects)
  if (type.includes('spell') || name.includes('spell') || name.includes('lightning') || name.includes('bomb')) {
    return 'spell';
  }
  
  // Magical units (wizards, mages, mystics, alchemists)
  if (className.includes('magical') || className.includes('magic') || 
      name.includes('wizard') || name.includes('mage') || name.includes('mystic') || 
      name.includes('sorcerer') || name.includes('archmage') || name.includes('enchanter') ||
      name.includes('alchemist') || name.includes('conjurer') || name.includes('warlock')) {
    return 'magical';
  }
  
  // Ranged units (archers, snipers, marksmen, shooters)
  if (className.includes('ranged') || className.includes('archer') ||
      name.includes('archer') || name.includes('sniper') || name.includes('marksman') ||
      name.includes('shooter') || name.includes('bow') || name.includes('gun') ||
      name.includes('rifle') || name.includes('crossbow')) {
    return 'ranged';
  }
  
  // Tank units (high health, defensive)
  if (className.includes('tank') || name.includes('tank') || name.includes('guard') ||
      name.includes('guardian') || name.includes('defender') || name.includes('shield') ||
      card.health > 120 || name.includes('fortress') || name.includes('wall')) {
    return 'tank';
  }
  
  // Default to melee for all other units
  return 'melee';
};

const getCardRange = (card: BattleCard, attackType: string): number => {
  const BASE_CELL_SIZE = 32;
  
  switch (attackType) {
    case 'ranged':
      return 3.5 * BASE_CELL_SIZE; // Ranged units can hit just short of tower range
    case 'magical':
      return 3 * BASE_CELL_SIZE; // Magical units have moderate range
    case 'spell':
      return 4 * BASE_CELL_SIZE; // Spells have area effect range
    case 'tank':
      return 1.2 * BASE_CELL_SIZE; // Tanks have very short range but high damage
    case 'melee':
    default:
      return 1.5 * BASE_CELL_SIZE; // Standard melee range
  }
};

const getAttackCooldown = (attackType: string): number => {
  switch (attackType) {
    case 'spell':
      return 3000; // Spells are very slow but powerful
    case 'magical':
      return 2200; // Magical attacks are slower
    case 'tank':
      return 2500; // Tank attacks are slow but devastating
    case 'ranged':
      return 1800; // Ranged attacks are moderate speed
    case 'melee':
    default:
      return 1600; // Melee attacks are fastest
  }
};

const getProjectileSpeed = (attackType: string): number => {
  switch (attackType) {
    case 'spell':
      return 12; // Spells move fast to target
    case 'ranged':
      return 10; // Arrows move quickly
    case 'magical':
      return 8; // Magic moves moderately
    case 'tank':
      return 6; // Tank projectiles are slower
    case 'melee':
    default:
      return 0; // Melee has no projectiles
  }
};

const getAttackEmojis = (attackType: string, card: BattleCard): string[] => {
  const name = card.name.toLowerCase();
  
  switch (attackType) {
    case 'spell':
      if (name.includes('lightning') || name.includes('thunder')) return ['⚡', '🌩️'];
      if (name.includes('fire') || name.includes('flame')) return ['🔥', '💥'];
      if (name.includes('ice') || name.includes('frost')) return ['❄️', '🧊'];
      if (name.includes('bomb') || name.includes('explosive')) return ['💣', '💥'];
      return ['✨', '🌟', '💫', '🔮'];
    case 'magical':
      if (name.includes('archmage') || name.includes('wizard')) return ['🔮', '✨', '🌟'];
      if (name.includes('warlock') || name.includes('dark')) return ['💜', '🌀', '🔮'];
      if (name.includes('enchanter')) return ['✨', '💫', '🌟'];
      return ['🔮', '✨', '🌀', '💜'];
    case 'ranged':
      if (name.includes('sniper') || name.includes('marksman')) return ['🎯', '💥'];
      if (name.includes('archer') || name.includes('bow')) return ['🏹', '🎯'];
      return ['🏹', '🎯', '💫'];
    case 'tank':
      return ['🛡️', '💥', '⚔️'];
    case 'melee':
    default:
      if (name.includes('warrior') || name.includes('fighter')) return ['⚔️', '🗡️'];
      if (name.includes('berserker') || name.includes('savage')) return ['🪓', '⚔️'];
      if (name.includes('guard') || name.includes('defender')) return ['🛡️', '⚔️'];
      return ['⚔️', '🪓', '🗡️', '🔨'];
  }
};

const VisualBattleSystem: React.FC<VisualBattleSystemProps> = ({
  playerDeck,
  captainCard,
  onBattleEnd,
  nftData,
  playerWallet,
  gameZones,
  difficulty = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameLoopRef = useRef<number>(0);
  
  // Background image loading
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [castleImage, setCastleImage] = useState<HTMLImageElement | null>(null);
  const [towerImage, setTowerImage] = useState<HTMLImageElement | null>(null);
  const [nftImage, setNFTImage] = useState<HTMLImageElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: true,
    timeLeft: 180, // 3 minutes
    playerCrowns: 0,
    enemyCrowns: 0,
    playerElixir: 5, // Start with 5 elixir like Clash Royale
    enemyElixir: 5,
    selectedCard: null,
    phase: 'battle'
  });

  // Battle entities
  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [playerHand, setPlayerHand] = useState<BattleCard[]>([]);
  
  // Load background images
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Main game background
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => setBackgroundImage(bgImg);
        bgImg.src = '/attached_assets/Pot60u6_1754231881681.png'; // Your actual cannabis-themed battlefield
        
        // Castle image for king towers - use proper castle/tower image
        const castleImg = new Image();
        castleImg.crossOrigin = 'anonymous';
        castleImg.onload = () => setCastleImage(castleImg);
        castleImg.src = 'https://i.imgur.com/hYNPa50.png';
        
        // Tower image for arena towers - use proper tower image
        const towerImg = new Image();
        towerImg.crossOrigin = 'anonymous';
        towerImg.onload = () => setTowerImage(towerImg);
        towerImg.src = 'https://i.imgur.com/M7Bear7.png';
        
        // NFT image for player representation
        if (nftData?.nft?.image) {
          const nftImg = new Image();
          nftImg.crossOrigin = 'anonymous';
          nftImg.onload = () => setNFTImage(nftImg);
          nftImg.src = nftData.nft.image;
        }
      } catch (error) {
        console.error('Failed to load background images:', error);
      }
    };
    
    loadImages();
  }, [nftData]);

  // Enhanced animation and effects systems
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const [towerProjectiles, setTowerProjectiles] = useState<any[]>([]); // New tower projectiles
  const [rangedProjectiles, setRangedProjectiles] = useState<any[]>([]); // Ranged unit projectiles
  const [magicalProjectiles, setMagicalProjectiles] = useState<any[]>([]); // Magical unit projectiles
  const [damageNumbers, setDamageNumbers] = useState<any[]>([]);
  const [attackEffects, setAttackEffects] = useState<any[]>([]);
  const [abilityEffects, setAbilityEffects] = useState<any[]>([]);
  const [spellAnimations, setSpellAnimations] = useState<any[]>([]);
  const [magicEffects, setMagicEffects] = useState<any[]>([]);
  const [explosionEffects, setExplosionEffects] = useState<any[]>([]);
  
  // Admin gameboard integration
  const [adminGameboard, setAdminGameboard] = useState<any>(null);
  
  // Additional image assets (battlefieldImage and unitImages)
  const [battlefieldImage, setBattlefieldImage] = useState<HTMLImageElement | null>(null);
  const [unitImages, setUnitImages] = useState<{ [key: string]: HTMLImageElement }>({});
  // Player deck management
  const [playerDeckCards, setPlayerDeckCards] = useState<BattleCard[]>([]);
  const [playerDrawnCards, setPlayerDrawnCards] = useState<string[]>([]);
  
  // AI deck management  
  const [aiDeck, setAiDeck] = useState<BattleCard[]>([]);
  const [aiHand, setAiHand] = useState<BattleCard[]>([]);
  const [aiDrawnCards, setAiDrawnCards] = useState<string[]>([]);

  // Full battlefield matching your image - no arbitrary cropping
  const GRID_WIDTH = 18; // Full width to match your battlefield image  
  const GRID_HEIGHT = 32; // Full height to match your battlefield image
  const BASE_CELL_SIZE = 20; // Smaller cells for full field coverage
  const CANVAS_WIDTH = GRID_WIDTH * BASE_CELL_SIZE;
  const CANVAS_HEIGHT = GRID_HEIGHT * BASE_CELL_SIZE;
  const CARD_AREA_HEIGHT = 160; // Increased height for bottom card area to give cards more space

  // Grid pathfinding - 0 = blocked (water), 1 = walkable, 2 = bridge
  const [battleGrid, setBattleGrid] = useState<number[][]>([]);

  // Card tooltip state for hover functionality
  const [hoveredCard, setHoveredCard] = useState<BattleCard | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Balanced card drawing function to ensure even distribution
  const drawCardsBalanced = (deck: BattleCard[], drawnIds: string[], count: number) => {
    const availableCards = deck.filter(card => !drawnIds.includes(card.id));
    
    if (availableCards.length === 0) {
      // Reset draw history if deck is exhausted
      const newDrawn: string[] = [];
      const newCards = deck.slice(0, Math.min(count, deck.length));
      return {
        cards: newCards,
        drawnIds: [...newDrawn, ...newCards.map(c => c.id)]
      };
    }
    
    // Prioritize cards that haven't been drawn recently
    const cardCounts = deck.reduce((acc, card) => {
      const timesDrawn = drawnIds.filter(id => id === card.id).length;
      acc[card.id] = timesDrawn;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort by least drawn, then randomize within same count
    const sortedAvailable = availableCards.sort((a, b) => {
      const aCount = cardCounts[a.id] || 0;
      const bCount = cardCounts[b.id] || 0;
      if (aCount !== bCount) return aCount - bCount;
      return Math.random() - 0.5;
    });
    
    const selectedCards = sortedAvailable.slice(0, count);
    return {
      cards: selectedCards,
      drawnIds: [...drawnIds, ...selectedCards.map(c => c.id)]
    };
  };

  // Load admin-created PvE gameboard using centralized manager
  useEffect(() => {
    const loadAdminGameboard = async () => {
      try {
        console.log('🔍 Loading admin gameboard for PvE battle using centralized manager...');
        
        // Use the AdminGameboardManager for consistent loading
        const { loadGameboard, validateGameboard } = {
          loadGameboard: async () => {
            // Try server first
            const response = await fetch('/api/admin/load-pve-gameboard');
            const result = await response.json();
            
            if (result.success && result.gameboard) {
              return result.gameboard;
            }
            
            // Fallback to local storage
            const localBoard = localStorage.getItem('thc-clash-pve-gameboard');
            if (localBoard) {
              return JSON.parse(localBoard);
            }
            
            return null;
          },
          validateGameboard: (board: any) => {
            if (!board) return false;
            const towers = board.elements?.filter((el: any) => el.type === 'tower' || el.type === 'castle') || [];
            const playerTowers = towers.filter((t: any) => t.team === 'player');
            const aiTowers = towers.filter((t: any) => t.team === 'ai');
            return playerTowers.length > 0 && aiTowers.length > 0;
          }
        };
        
        const gameboard = await loadGameboard();
        
        if (gameboard && validateGameboard(gameboard)) {
          console.log('✅ Valid admin PvE gameboard loaded:', {
            elements: gameboard.elements?.length || 0,
            dimensions: gameboard.dimensions,
            version: gameboard.version
          });
          setAdminGameboard(gameboard);
        } else {
          console.warn('⚠️ No valid admin gameboard found - using fallback layout');
          console.log('🔧 Create a proper gameboard in /admingame interface with towers for both teams');
        }
      } catch (error) {
        console.error('❌ Failed to load admin gameboard:', error);
      }
    };
    
    loadAdminGameboard();
  }, []);

  // Initialize battlefield grid with admin gameboard or fallback
  useEffect(() => {
    let grid: number[][];
    let initialTowers: Tower[];
    
    if (adminGameboard) {
      console.log('🎮 Using admin-created gameboard for PvE battle');
      
      // Use admin-defined grid if available
      if (adminGameboard.gridBlocked) {
        grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(1));
        
        // Apply admin blocked cells
        adminGameboard.gridBlocked.forEach((cellKey: string) => {
          const [x, y] = cellKey.split(',').map(Number);
          if (y < GRID_HEIGHT && x < GRID_WIDTH) {
            grid[y][x] = 0; // Blocked/water
          }
        });
        
        // Admin elements override default zones
        if (adminGameboard.elements) {
          adminGameboard.elements.forEach((element: any) => {
            if (element.type === 'river') {
              // Mark as water
              const gridX = Math.floor(element.x / BASE_CELL_SIZE);
              const gridY = Math.floor(element.y / BASE_CELL_SIZE);
              if (gridX < GRID_WIDTH && gridY < GRID_HEIGHT) {
                grid[gridY][gridX] = 0;
              }
            } else if (element.type === 'bridge') {
              // Mark as bridge
              const gridX = Math.floor(element.x / BASE_CELL_SIZE);
              const gridY = Math.floor(element.y / BASE_CELL_SIZE);
              if (gridX < GRID_WIDTH && gridY < GRID_HEIGHT) {
                grid[gridY][gridX] = 2;
              }
            }
          });
        }
      } else {
        // Fallback grid if admin didn't set custom blocking
        grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(1));
      }
      
      // Use admin towers if available
      const adminTowers = adminGameboard.elements?.filter((el: any) => 
        el.type === 'tower' || el.type === 'castle'
      ) || [];
      
      if (adminTowers.length > 0) {
        initialTowers = adminTowers.map((tower: any) => ({
          id: tower.id,
          x: tower.x,
          y: tower.y,
          health: tower.health || 1600,
          maxHealth: tower.maxHealth || 1600,
          type: tower.type === 'castle' ? 'king' : 'crown',
          isPlayer: tower.team === 'player',
          destroyed: false,
          range: 5 * BASE_CELL_SIZE,
          damage: 150,
          lastAttack: 0
        }));
      } else {
        // Fallback towers
        initialTowers = [
          { id: 'player_left', x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.82, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: true, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
          { id: 'player_king', x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.9, health: 2400, maxHealth: 2400, type: 'king', isPlayer: true, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
          { id: 'player_right', x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.82, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: true, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
          { id: 'enemy_left', x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.18, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: false, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
          { id: 'enemy_king', x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.1, health: 2400, maxHealth: 2400, type: 'king', isPlayer: false, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
          { id: 'enemy_right', x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.18, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: false, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 }
        ];
      }
    } else {
      console.log('⚠️ Using fallback battlefield layout - no admin gameboard found');
      
      // Fallback enhanced grid: 0=water, 1=walkable, 2=bridge, 3=player_deploy, 4=ai_deploy
      grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(1));
      
      // AI deployment zone (top area)
      for (let row = 0; row <= 6; row++) {
        for (let col = 1; col < GRID_WIDTH - 1; col++) {
          grid[row][col] = 4; // AI deployment zone
        }
      }
      
      // Player deployment zone (bottom area)
      for (let row = 14; row < GRID_HEIGHT; row++) {
        for (let col = 1; col < GRID_WIDTH - 1; col++) {
          grid[row][col] = 3; // Player deployment zone
        }
      }
      
      // Water river in middle - strategic barrier
      for (let row = 9; row <= 11; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
          grid[row][col] = 0; // Water - impassable
        }
      }
      
      // Central bridge for tight battlefield
      for (let row = 9; row <= 11; row++) {
        grid[row][3] = 2; // Left bridge
        grid[row][4] = 2; // Right bridge
      }
      
      // Fallback towers
      initialTowers = [
        { id: 'player_left', x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.82, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: true, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
        { id: 'player_king', x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.9, health: 2400, maxHealth: 2400, type: 'king', isPlayer: true, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
        { id: 'player_right', x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.82, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: true, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
        { id: 'enemy_left', x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.18, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: false, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
        { id: 'enemy_king', x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.1, health: 2400, maxHealth: 2400, type: 'king', isPlayer: false, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 },
        { id: 'enemy_right', x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.18, health: 1600, maxHealth: 1600, type: 'crown', isPlayer: false, destroyed: false, range: 5 * BASE_CELL_SIZE, damage: 150, lastAttack: 0 }
      ];
    }
    
    setBattleGrid(grid);
    setTowers(initialTowers);
  }, [adminGameboard]);

    // Tower initialization moved to admin gameboard useEffect above

    // Initialize player deck (6-card battle deck)
    const battleDeck = playerDeck.slice(0, 6);
    setPlayerDeckCards(battleDeck);
    
    // Draw initial 4 cards using balanced drawing
    const initialHand = drawCardsBalanced(battleDeck, [], 4);
    setPlayerHand(initialHand.cards);
    setPlayerDrawnCards(initialHand.drawnIds);
    
    // Initialize AI with difficulty-based card rarity restrictions
    import('../data/allCards').then(({ ALL_CARDS }) => {
      // Filter cards by difficulty-based rarity restrictions
      const getAICardsByDifficulty = (difficulty: string) => {
        switch (difficulty) {
          case 'easy':
            // Easy: Only common and uncommon cards
            return ALL_CARDS.filter(card => 
              card.rarity?.toLowerCase() === 'common' || 
              card.rarity?.toLowerCase() === 'uncommon'
            );
          case 'medium':
            // Medium: Common, uncommon, and rare cards
            return ALL_CARDS.filter(card => 
              card.rarity?.toLowerCase() === 'common' || 
              card.rarity?.toLowerCase() === 'uncommon' ||
              card.rarity?.toLowerCase() === 'rare'
            );
          case 'hard':
            // Hard: Legendary and epic cards (most powerful)
            return ALL_CARDS.filter(card => 
              card.rarity?.toLowerCase() === 'legendary' || 
              card.rarity?.toLowerCase() === 'epic'
            );
          default:
            return ALL_CARDS.filter(card => 
              card.rarity?.toLowerCase() === 'common' || 
              card.rarity?.toLowerCase() === 'uncommon' ||
              card.rarity?.toLowerCase() === 'rare'
            );
        }
      };

      const availableCards = getAICardsByDifficulty(difficulty);
      
      // Create balanced AI deck with strategic card selection from allowed rarities
      const spellCards = availableCards.filter(card => card.type === 'Spell' || card.name?.toLowerCase().includes('spell'));
      const tankCards = availableCards.filter(card => card.class === 'tank' || card.health > 100);
      const rangedCards = availableCards.filter(card => card.class === 'ranged');
      const meleeCards = availableCards.filter(card => card.class === 'melee' || (!card.class && card.attack > 50));
      const otherCards = availableCards.filter(card => 
        !spellCards.includes(card) && !tankCards.includes(card) && 
        !rangedCards.includes(card) && !meleeCards.includes(card)
      );

      // Get difficulty multipliers for AI stats (same mana system, different unit power)
      const getDifficultyMultipliers = (difficulty: string) => {
        switch (difficulty) {
          case 'easy':
            return { attack: 0.8, health: 0.8, elixirRegen: 0.9, deploySpeed: 2500 };
          case 'medium':
            return { attack: 1.0, health: 1.0, elixirRegen: 1.0, deploySpeed: 1600 };
          case 'hard':
            return { attack: 1.2, health: 1.2, elixirRegen: 1.1, deploySpeed: 1200 };
          default:
            return { attack: 1.0, health: 1.0, elixirRegen: 1.0, deploySpeed: 1600 };
        }
      };

      const difficultyMultipliers = getDifficultyMultipliers(difficulty);

      // Build strategic 8-card AI deck ensuring variety and balance
      const buildAIDeck = () => {
        const deck: BattleCard[] = [];
        
        // Add spells (1-2 depending on availability)
        if (spellCards.length > 0) {
          deck.push(...spellCards.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, spellCards.length)));
        }
        
        // Add tanks (1-2 depending on availability)
        if (tankCards.length > 0) {
          deck.push(...tankCards.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, tankCards.length)));
        }
        
        // Add ranged units (1-2 depending on availability)
        if (rangedCards.length > 0) {
          deck.push(...rangedCards.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, rangedCards.length)));
        }
        
        // Fill remaining slots with melee and other cards
        const remainingSlots = 8 - deck.length;
        const remainingCards = [...meleeCards, ...otherCards]
          .sort(() => 0.5 - Math.random())
          .slice(0, remainingSlots);
        
        deck.push(...remainingCards);
        
        // Ensure we have exactly 8 cards, fill with any available if needed
        while (deck.length < 8 && availableCards.length > 0) {
          const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
          if (!deck.some(c => c.id === randomCard.id)) {
            deck.push(randomCard);
          }
        }
        
        return deck.slice(0, 8); // Ensure exactly 8 cards
      };

      // Create AI deck with difficulty-scaled stats but same mana costs
      const aiDeckCards = buildAIDeck().map(card => ({
        ...card,
        id: `ai_${card.id}`,
        name: `AI ${card.name}`,
        // Scale stats but keep same mana costs (AI uses same elixir system)
        attack: Math.max(1, Math.floor(card.attack * difficultyMultipliers.attack)),
        health: Math.max(1, Math.floor(card.health * difficultyMultipliers.health)),
        // Keep original cost - AI uses same mana system as player
        cost: card.cost
      }));
      
      setAiDeck(aiDeckCards);
      
      // Draw AI initial 4 cards (same hand size as player)
      const aiInitialHand = drawCardsBalanced(aiDeckCards, [], 4);
      setAiHand(aiInitialHand.cards);
      setAiDrawnCards(aiInitialHand.drawnIds);
      
      console.log(`🤖 AI deck initialized for ${difficulty} difficulty:`, {
        totalCards: aiDeckCards.length,
        rarities: aiDeckCards.map(c => c.rarity),
        spells: aiDeckCards.filter(c => c.type === 'Spell').length,
        tanks: aiDeckCards.filter(c => c.class === 'tank' || c.health > 100).length,
        ranged: aiDeckCards.filter(c => c.class === 'ranged').length,
        melee: aiDeckCards.filter(c => c.class === 'melee').length,
        avgCost: (aiDeckCards.reduce((sum, c) => sum + c.cost, 0) / aiDeckCards.length).toFixed(1),
        multipliers: difficultyMultipliers
      });
    });
  }, [playerDeck]);

  // Game loop for elixir generation, timer, and card drawing
  useEffect(() => {
    if (gameState.isPlaying) {
      const gameInterval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: Math.max(0, prev.timeLeft - 1),
          // Both player and AI use identical elixir system (1 every 2.8 seconds, max 10)
          playerElixir: Math.min(10, prev.playerElixir + (1/2.8)),
          enemyElixir: Math.min(10, prev.enemyElixir + (1/2.8))
        }));

        // Cards only cycle when played - no automatic drawing
        // This maintains strategic hand management where players must consider each play

        // Check for game end conditions
        if (gameState.timeLeft <= 0) {
          setTimeout(() => endBattle(), 0);
        }
      }, 1000);

      return () => clearInterval(gameInterval);
    }
  }, [gameState.isPlaying, gameState.timeLeft, playerHand, playerDeck]);

  // Enhanced AI card playing system with proper mana management
  useEffect(() => {
    if (!gameState.isPlaying || aiHand.length === 0) return;

    const aiDeploymentSpeed = difficulty === 'easy' ? 2500 : difficulty === 'medium' ? 1600 : 1200;
    
    const aiInterval = setInterval(() => {
      // AI uses same mana system - can only play cards it can afford
      const affordableCards = aiHand.filter(card => card.cost <= Math.floor(gameState.enemyElixir));
      
      if (affordableCards.length === 0) {
        console.log(`🤖 AI waiting for more elixir (${gameState.enemyElixir.toFixed(1)}/10) - cheapest card costs ${Math.min(...aiHand.map(c => c.cost))}`);
        return;
      }

      const playerUnits = units.filter(u => u.isPlayer);
      const aiUnits = units.filter(u => !u.isPlayer);
      const playerTowers = towers.filter(t => t.isPlayer && !t.destroyed);
      
      // AI decision making based on game state
      let deploymentPriority = 0.3; // Base deployment chance
      
      // Tactical analysis
      if (playerUnits.length > aiUnits.length + 1) deploymentPriority += 0.4; // Behind in units
      if (gameState.enemyElixir >= 8) deploymentPriority += 0.5; // High elixir must spend
      if (gameState.timeLeft < 60) deploymentPriority += 0.6; // Final minute pressure
      if (playerTowers.some(t => t.health < t.maxHealth * 0.6)) deploymentPriority += 0.4; // Weak towers
      
      // Recent player activity detection
      const recentPlayerActivity = playerUnits.filter(u => {
        const unitAge = Date.now() - parseInt(u.id.split('_')[1]);
        return unitAge < 5000; // Units deployed in last 5 seconds
      });
      if (recentPlayerActivity.length > 0) deploymentPriority += 0.3;
      
      // Force deployment at max elixir to prevent waste
      const forceDeployment = gameState.enemyElixir >= 9.5;
      const shouldDeploy = forceDeployment || Math.random() < Math.min(0.9, deploymentPriority);
      
      if (shouldDeploy) {
        console.log(`🤖 AI attempting card deployment - Elixir: ${gameState.enemyElixir.toFixed(1)}, Hand: ${aiHand.length}, Affordable: ${affordableCards.length}`);
        deployAICardStrategically();
      }
    }, aiDeploymentSpeed);

    return () => clearInterval(aiInterval);
  }, [gameState.isPlaying, gameState.enemyElixir, aiHand, units, towers, gameState.timeLeft, difficulty]);

  // Tower projectile system - towers shoot at enemies in range
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const towerShootingInterval = setInterval(() => {
      towers.forEach(tower => {
        if (tower.destroyed) return;
        
        // Find enemy units in range (5 cells for towers)
        const towerRange = 5 * BASE_CELL_SIZE;
        const enemyUnits = units.filter(unit => 
          unit.isPlayer !== tower.isPlayer && // Opposite team
          Math.sqrt((unit.x - tower.x) ** 2 + (unit.y - tower.y) ** 2) <= towerRange
        );
        
        // Shoot at closest enemy
        if (enemyUnits.length > 0) {
          const target = enemyUnits.reduce((closest, unit) => {
            const distToUnit = Math.sqrt((unit.x - tower.x) ** 2 + (unit.y - tower.y) ** 2);
            const distToClosest = Math.sqrt((closest.x - tower.x) ** 2 + (closest.y - tower.y) ** 2);
            return distToUnit < distToClosest ? unit : closest;
          });
          
          // Create tower projectile
          const projectileId = `tower_projectile_${Date.now()}_${Math.random()}`;
          const newProjectile = {
            id: projectileId,
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            targetId: target.id,
            damage: tower.type === 'king' ? 120 : 80, // King towers hit harder
            speed: 8,
            isTowerProjectile: true,
            isPlayer: tower.isPlayer,
            color: tower.isPlayer ? '#4169E1' : '#DC143C'
          };
          
          setTowerProjectiles(prev => [...prev, newProjectile]);
        }
      });
    }, 1500); // Towers shoot every 1.5 seconds

    return () => clearInterval(towerShootingInterval);
  }, [gameState.isPlaying, towers, units]);

  // Tower projectile movement and collision
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const projectileInterval = setInterval(() => {
      setTowerProjectiles(prevProjectiles => {
        return prevProjectiles.filter(projectile => {
          // Move projectile towards target
          const dx = projectile.targetX - projectile.x;
          const dy = projectile.targetY - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < projectile.speed) {
            // Hit target - deal damage
            setUnits(prevUnits => 
              prevUnits.map(unit => {
                if (unit.id === projectile.targetId) {
                  const newHealth = unit.health - projectile.damage;
                  
                  // Add damage number effect
                  setDamageNumbers(prev => [...prev, {
                    id: `damage_${Date.now()}`,
                    x: unit.x,
                    y: unit.y,
                    damage: projectile.damage,
                    isPlayer: projectile.isPlayer,
                    type: 'tower'
                  }]);
                  
                  if (newHealth <= 0) {
                    // Unit destroyed
                    console.log(`🏹 Tower projectile destroyed unit ${unit.id}`);
                    return null; // Will be filtered out
                  }
                  
                  return { ...unit, health: newHealth };
                }
                return unit;
              }).filter(Boolean) as any[]
            );
            
            return false; // Remove projectile
          }
          
          // Move projectile
          const moveX = (dx / distance) * projectile.speed;
          const moveY = (dy / distance) * projectile.speed;
          
          projectile.x += moveX;
          projectile.y += moveY;
          
          return true; // Keep projectile
        });
      });
    }, 16); // 60 FPS

    return () => clearInterval(projectileInterval);
  }, [gameState.isPlaying]);

  // Ranged projectile movement and collision
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const rangedProjectileInterval = setInterval(() => {
      setRangedProjectiles(prevProjectiles => {
        return prevProjectiles.filter(projectile => {
          // Move projectile towards target
          const dx = projectile.targetX - projectile.x;
          const dy = projectile.targetY - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < projectile.speed) {
            // Hit target - deal damage to units or towers
            setUnits(prevUnits => 
              prevUnits.map(unit => {
                if (unit.id === projectile.targetId) {
                  const newHealth = unit.health - projectile.damage;
                  
                  setDamageNumbers(prev => [...prev, {
                    id: `damage_${Date.now()}`,
                    x: unit.x,
                    y: unit.y,
                    damage: projectile.damage,
                    isPlayer: projectile.isPlayer,
                    type: 'ranged'
                  }]);
                  
                  if (newHealth <= 0) {
                    console.log(`🏹 Ranged projectile destroyed unit ${unit.id}`);
                    return null; // Will be filtered out
                  }
                  
                  return { ...unit, health: newHealth };
                }
                return unit;
              }).filter(Boolean) as any[]
            );

            // Also check towers
            setTowers(prevTowers => 
              prevTowers.map(tower => {
                if (tower.id === projectile.targetId) {
                  const newHealth = tower.health - projectile.damage;
                  
                  setDamageNumbers(prev => [...prev, {
                    id: `damage_${Date.now()}`,
                    x: tower.x,
                    y: tower.y,
                    damage: projectile.damage,
                    isPlayer: projectile.isPlayer,
                    type: 'ranged'
                  }]);
                  
                  if (newHealth <= 0) {
                    console.log(`🏹 Ranged projectile destroyed tower ${tower.type}`);
                    return { ...tower, health: 0, destroyed: true };
                  }
                  
                  return { ...tower, health: newHealth };
                }
                return tower;
              })
            );
            
            return false; // Remove projectile
          }
          
          // Move projectile
          const moveX = (dx / distance) * projectile.speed;
          const moveY = (dy / distance) * projectile.speed;
          
          projectile.x += moveX;
          projectile.y += moveY;
          
          return true; // Keep projectile
        });
      });
    }, 16); // 60 FPS

    return () => clearInterval(rangedProjectileInterval);
  }, [gameState.isPlaying]);

  // Magical projectile movement and collision
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const magicalProjectileInterval = setInterval(() => {
      setMagicalProjectiles(prevProjectiles => {
        return prevProjectiles.filter(projectile => {
          // Move projectile towards target
          const dx = projectile.targetX - projectile.x;
          const dy = projectile.targetY - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < projectile.speed) {
            // Hit target - deal damage to units or towers
            setUnits(prevUnits => 
              prevUnits.map(unit => {
                if (unit.id === projectile.targetId) {
                  const newHealth = unit.health - projectile.damage;
                  
                  setDamageNumbers(prev => [...prev, {
                    id: `damage_${Date.now()}`,
                    x: unit.x,
                    y: unit.y,
                    damage: projectile.damage,
                    isPlayer: projectile.isPlayer,
                    type: 'magical'
                  }]);
                  
                  if (newHealth <= 0) {
                    console.log(`✨ Magical projectile destroyed unit ${unit.id}`);
                    return null; // Will be filtered out
                  }
                  
                  return { ...unit, health: newHealth };
                }
                return unit;
              }).filter(Boolean) as any[]
            );

            // Also check towers
            setTowers(prevTowers => 
              prevTowers.map(tower => {
                if (tower.id === projectile.targetId) {
                  const newHealth = tower.health - projectile.damage;
                  
                  setDamageNumbers(prev => [...prev, {
                    id: `damage_${Date.now()}`,
                    x: tower.x,
                    y: tower.y,
                    damage: projectile.damage,
                    isPlayer: projectile.isPlayer,
                    type: 'magical'
                  }]);
                  
                  if (newHealth <= 0) {
                    console.log(`✨ Magical projectile destroyed tower ${tower.type}`);
                    return { ...tower, health: 0, destroyed: true };
                  }
                  
                  return { ...tower, health: newHealth };
                }
                return tower;
              })
            );
            
            return false; // Remove projectile
          }
          
          // Move projectile
          const moveX = (dx / distance) * projectile.speed;
          const moveY = (dy / distance) * projectile.speed;
          
          projectile.x += moveX;
          projectile.y += moveY;
          
          return true; // Keep projectile
        });
      });
    }, 16); // 60 FPS

    return () => clearInterval(magicalProjectileInterval);
  }, [gameState.isPlaying]);

  // Unit movement and combat system
  useEffect(() => {
    if (gameState.isPlaying) {
      const combatInterval = setInterval(() => {
        setUnits(prevUnits => {
          return prevUnits.map(unit => {
            const newUnit = { ...unit };
            
            // Tower cards don't move - they are stationary defensive units
            if (!unit.isTower) {
              // Enhanced movement with slower, more strategic pace for better gameplay
              if (unit.target && unit.target.x !== undefined) {
                const targetDistance = Math.sqrt(
                  Math.pow(unit.target.x - unit.x, 2) + 
                  Math.pow(unit.target.y - unit.y, 2)
                );
                
                // Slower, more deliberate turning for strategic feel
                if (targetDistance > 8) {
                  const turnSpeed = 0.08; // Slower turning for more tactical feel
                  const targetAngle = Math.atan2(unit.target.y - unit.y, unit.target.x - unit.x);
                  const currentAngle = unit.angle || 0;
                  let angleDiff = targetAngle - currentAngle;
                  
                  // Normalize angle difference
                  if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                  if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                  
                  newUnit.angle = currentAngle + (angleDiff * turnSpeed);
                }
              }
            }
            
            // Find targets (enemy towers or units)
            const targets = [
              ...towers.filter(t => !t.destroyed && t.isPlayer !== unit.isPlayer),
              ...prevUnits.filter(u => u.isPlayer !== unit.isPlayer)
            ];

            if (targets.length > 0) {
              // Find closest target
              const closest = targets.reduce((closest, target) => {
                const distToClosest = Math.sqrt(Math.pow(unit.x - closest.x, 2) + Math.pow(unit.y - closest.y, 2));
                const distToTarget = Math.sqrt(Math.pow(unit.x - target.x, 2) + Math.pow(unit.y - target.y, 2));
                return distToTarget < distToClosest ? target : closest;
              });

              const distance = Math.sqrt(Math.pow(unit.x - closest.x, 2) + Math.pow(unit.y - closest.y, 2));
              
              if (distance <= unit.range) {
                // Enhanced attack timing using new card classification system
                const attackCooldown = getAttackCooldown(unit.attackType);
                
                if (Date.now() - unit.lastAttack > attackCooldown) {
                  newUnit.lastAttack = Date.now();
                  
                  // Create attack based on unit's class type
                  const attackType = unit.attackType || unit.cardClass || 'melee';
                  
                  if (attackType === 'ranged') {
                    // Enhanced ranged attack projectiles with card-specific visuals
                    const cardData = playerDeck.find(c => c.id === unit.cardId) || aiHand.find(c => c.id === unit.cardId);
                    const rangedEmojis = cardData ? getAttackEmojis('ranged', cardData) : ['🏹', '🎯', '💫'];
                    const selectedEmoji = rangedEmojis[Math.floor(Math.random() * rangedEmojis.length)];
                    
                    const projectile = {
                      id: `proj_${Date.now()}_${Math.random()}`,
                      x: unit.x,
                      y: unit.y,
                      sourceX: unit.x, // Track source for trail effect
                      sourceY: unit.y,
                      targetX: closest.x,
                      targetY: closest.y,
                      damage: unit.damage,
                      isPlayer: unit.isPlayer,
                      type: 'ranged' as const,
                      emoji: selectedEmoji,
                      speed: getProjectileSpeed('ranged')
                    };
                    
                    setProjectiles(prev => [...prev, projectile]);
                    
                    console.log(`🏹 ${unit.isPlayer ? 'Player' : 'AI'} ranged unit attacking with arrow`);
                  } else if (attackType === 'magical') {
                    // Enhanced magical projectiles with mystical effects
                    const cardData = playerDeck.find(c => c.id === unit.cardId) || aiHand.find(c => c.id === unit.cardId);
                    const magicalEmojis = cardData ? getAttackEmojis('magical', cardData) : ['🔮', '⚡', '🌀', '💜'];
                    const selectedEmoji = magicalEmojis[Math.floor(Math.random() * magicalEmojis.length)];
                    
                    const projectile = {
                      id: `proj_${Date.now()}_${Math.random()}`,
                      x: unit.x,
                      y: unit.y,
                      sourceX: unit.x,
                      sourceY: unit.y,
                      targetX: closest.x,
                      targetY: closest.y,
                      damage: unit.damage,
                      isPlayer: unit.isPlayer,
                      type: 'magical' as const,
                      emoji: selectedEmoji,
                      speed: getProjectileSpeed('magical'),
                      trail: true
                    };
                    
                    setProjectiles(prev => [...prev, projectile]);
                    
                    console.log(`🧙 ${unit.isPlayer ? 'Player' : 'AI'} magical unit casting spell`);
                  } else if (attackType === 'tank') {
                    // Tank attacks - heavy damage but slow
                    const cardData = playerDeck.find(c => c.id === unit.cardId) || aiHand.find(c => c.id === unit.cardId);
                    const tankWeapons = cardData ? getAttackEmojis('tank', cardData) : ['🔨', '⚔️', '🪓'];
                    const weapon = tankWeapons[Math.floor(Math.random() * tankWeapons.length)];
                    
                    setAttackEffects(prev => [...prev, {
                      id: `tank_${Date.now()}`,
                      x: closest.x,
                      y: closest.y,
                      type: 'tank',
                      emoji: weapon,
                      frame: 0
                    }]);
                    
                    console.log(`🛡️ ${unit.isPlayer ? 'Player' : 'AI'} tank unit attacking with ${weapon}`);
                  } else {
                    // Melee attack with weapon animation (sword/axe)
                    const cardData = playerDeck.find(c => c.id === unit.cardId) || aiHand.find(c => c.id === unit.cardId);
                    const meleeWeapons = cardData ? getAttackEmojis('melee', cardData) : ['⚔️', '🪓', '🗡️', '🔨'];
                    const weapon = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)];
                    
                    setAttackEffects(prev => [...prev, {
                      id: `melee_${Date.now()}`,
                      x: closest.x,
                      y: closest.y,
                      type: 'melee',
                      emoji: weapon,
                      frame: 0
                    }]);
                    
                    console.log(`${weapon} ${unit.isPlayer ? 'Player' : 'AI'} melee unit attacking with ${weapon}`);
                    
                    // Instant melee damage with effect
                    setTimeout(() => {
                      // Apply melee damage
                      if ('health' in closest) {
                        const targetId = closest.id;
                        const isTargetTower = 'type' in closest;
                        
                        if (isTargetTower) {
                          setTowers(prevTowers => prevTowers.map(tower => {
                            if (tower.id === targetId) {
                              const newHealth = Math.max(0, tower.health - unit.damage);
                              if (newHealth <= 0 && !tower.destroyed) {
                                setTimeout(() => destroyTower(targetId), 0);
                              }
                              return { ...tower, health: newHealth };
                            }
                            return tower;
                          }));
                        } else {
                          setUnits(prevUnits => prevUnits.map(u => {
                            if (u.id === targetId) {
                              return { ...u, health: Math.max(0, u.health - unit.damage) };
                            }
                            return u;
                          }).filter(u => u.health > 0));
                        }
                        
                        // Add damage number and melee effect
                        setDamageNumbers(prev => [...prev, {
                          id: `dmg_${Date.now()}`,
                          x: closest.x,
                          y: closest.y - 20,
                          damage: unit.damage,
                          isPlayer: unit.isPlayer
                        }]);
                        
                        // Melee effect already added above
                      }
                    }, 100);
                  }
                }
              } else {
                // Enhanced pathfinding movement for optimal bridge crossing and tactical positioning
                const path = findPath(unit.x, unit.y, closest.x, closest.y);
                
                if (path.length > 0) {
                  const nextWaypoint = path[0];
                  let direction = {
                    x: (nextWaypoint.x - unit.x),
                    y: (nextWaypoint.y - unit.y)
                  };
                  
                  // Add intelligent lateral movement for better positioning and flanking
                  const nearbyEnemies = prevUnits.filter(enemy => {
                    if (enemy.isPlayer === unit.isPlayer) return false;
                    const dist = Math.sqrt(Math.pow(enemy.x - unit.x, 2) + Math.pow(enemy.y - unit.y, 2));
                    return dist < unit.range * 2 && dist > unit.range * 0.8;
                  });
                  
                  if (nearbyEnemies.length > 0) {
                    // Calculate optimal flanking position (left or right)
                    const avgEnemyX = nearbyEnemies.reduce((sum, e) => sum + e.x, 0) / nearbyEnemies.length;
                    const shouldFlankLeft = unit.x > avgEnemyX;
                    const lateralOffset = shouldFlankLeft ? -BASE_CELL_SIZE * 0.3 : BASE_CELL_SIZE * 0.3;
                    
                    // Blend pathfinding with tactical flanking
                    direction.x += lateralOffset;
                  }
                  
                  // Normalize direction and apply movement speed
                  const directionMagnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
                  if (directionMagnitude > 0) {
                    const moveSpeed = unit.speed || 1;
                    const normalizedX = (direction.x / directionMagnitude) * moveSpeed;
                    const normalizedY = (direction.y / directionMagnitude) * moveSpeed;
                    
                    const nextX = unit.x + normalizedX;
                    const nextY = unit.y + normalizedY;
                    
                    const gridX = Math.floor(nextX / BASE_CELL_SIZE);
                    const gridY = Math.floor(nextY / BASE_CELL_SIZE);
                    
                    // Enhanced movement validation including bridges
                    if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                      const cellType = battleGrid[gridY]?.[gridX] || 1;
                      if (cellType !== 0) { // Can move on walkable terrain, bridges, and deployment zones
                        newUnit.x = Math.max(0, Math.min(CANVAS_WIDTH, nextX));
                        newUnit.y = Math.max(0, Math.min(CANVAS_HEIGHT, nextY));
                        
                        // Log bridge crossing for debugging
                        if (cellType === 2) {
                          console.log(`🌉 Unit ${unit.id} crossing bridge at (${gridX}, ${gridY})`);
                        }
                      }
                    }
                  }
                }
              }
            }

            // Check for tower despawning (2-minute lifespan)
            if (unit.isTower && unit.despawnTime && Date.now() > unit.despawnTime) {
              console.log(`⏰ Tower card ${unit.cardId} despawned after 2 minutes`);
              return null; // Remove tower from battlefield
            }
            
            return newUnit;
          }).filter(unit => unit && unit.health > 0); // Remove dead units and despawned towers
        });
      }, 80); // Increased to 12.5 FPS for smoother combat

      return () => clearInterval(combatInterval);
    }
  }, [gameState.isPlaying, towers]);

  // Projectile movement and collision
  useEffect(() => {
    if (!gameState.isPlaying || projectiles.length === 0) return;
    
    const projectileInterval = setInterval(() => {
        setProjectiles(prevProjectiles => {
          return prevProjectiles.map(proj => {
            const dx = proj.targetX - proj.x;
            const dy = proj.targetY - proj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
              // Projectile hit target - apply damage
              setTimeout(() => {
                const targetId = `target_${proj.targetX}_${proj.targetY}`;
                
                // Find and damage the target
                setTowers(prevTowers => prevTowers.map(tower => {
                  const towerDistance = Math.sqrt(Math.pow(tower.x - proj.targetX, 2) + Math.pow(tower.y - proj.targetY, 2));
                  if (towerDistance < 20) {
                    const newHealth = Math.max(0, tower.health - proj.damage);
                    if (newHealth <= 0 && !tower.destroyed) {
                      setTimeout(() => destroyTower(tower.id), 0);
                    }
                    return { ...tower, health: newHealth };
                  }
                  return tower;
                }));
                
                setUnits(prevUnits => prevUnits.map(unit => {
                  const unitDistance = Math.sqrt(Math.pow(unit.x - proj.targetX, 2) + Math.pow(unit.y - proj.targetY, 2));
                  if (unitDistance < 15 && unit.isPlayer !== proj.isPlayer) {
                    // Add damage number for unit hits
                    setDamageNumbers(prev => [...prev, {
                      id: `proj_dmg_${Date.now()}_${unit.id}`,
                      x: proj.targetX,
                      y: proj.targetY - 15,
                      damage: proj.damage,
                      isPlayer: proj.isPlayer
                    }]);
                    return { ...unit, health: Math.max(0, unit.health - proj.damage) };
                  }
                  return unit;
                }).filter(u => u.health > 0));
              }, 0);
              
              return null; // Remove projectile
            }
            
            // Enhanced projectile movement with attack-type specific speeds and smooth interpolation
            const speed = proj.type === 'tower' ? 18 : // Tower projectiles fastest
                         proj.type === 'magical' ? 6 : // Slower magical for dramatic effect
                         proj.type === 'ranged' ? 14 : 8; // Faster ranged projectiles
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;
            
            return {
              ...proj,
              x: proj.x + moveX,
              y: proj.y + moveY
            };
          }).filter(p => p !== null) as typeof prevProjectiles;
        });
    }, 12); // Increased to 83 FPS for smoother movement
    
    return () => clearInterval(projectileInterval);
  }, [gameState.isPlaying, projectiles]);

  // Animation loops for effects
  useEffect(() => {
    if (gameState.isPlaying) {
      const effectsInterval = setInterval(() => {
        // Update damage numbers (float up and fade)
        setDamageNumbers(prev => prev.map(dmg => ({
          ...dmg,
          y: dmg.y - 2, // Float upward
        })).filter((_, index) => index < 50)); // Limit to prevent memory leaks
        
        // Remove old damage numbers after 2 seconds
        setTimeout(() => {
          setDamageNumbers(prev => prev.slice(0, -1));
        }, 2000);
        
        // Update attack effects
        setAttackEffects(prev => prev.map(effect => ({
          ...effect,
          frame: effect.frame + 1
        })).filter(effect => effect.frame < 15)); // 15 frame animation
        
        // Update ability effects
        setAbilityEffects(prev => prev.map(effect => ({
          ...effect,
          frame: effect.frame + 1
        })).filter(effect => effect.frame < effect.duration));
        
      }, 33); // Increased to 30 FPS for smoother effects
      
      return () => clearInterval(effectsInterval);
    }
  }, [gameState.isPlaying]);

  // Enhanced Tower defensive attacks
  useEffect(() => {
    if (gameState.isPlaying && towers.length > 0) {
      const towerDefenseInterval = setInterval(() => {
        towers.forEach(tower => {
          if (!tower.destroyed) {
            // Enhanced tower range and targeting
            const towerRange = 5 * BASE_CELL_SIZE; // All towers have 5 cell range - can't hit units on bridge but can hit shortly after
            const enemyUnits = units.filter(unit => {
              if (unit.isPlayer === tower.isPlayer) return false;
              const distance = Math.sqrt(Math.pow(unit.x - tower.x, 2) + Math.pow(unit.y - tower.y, 2));
              return distance <= towerRange;
            });
            
            if (enemyUnits.length > 0) {
              // Prioritize closest enemy or strongest threat
              const target = enemyUnits.reduce((closest, unit) => {
                const closestDist = Math.sqrt(Math.pow(closest.x - tower.x, 2) + Math.pow(closest.y - tower.y, 2));
                const unitDist = Math.sqrt(Math.pow(unit.x - tower.x, 2) + Math.pow(unit.y - tower.y, 2));
                
                // Prioritize by threat level (damage) then distance
                if (unit.damage > closest.damage) return unit;
                if (unit.damage === closest.damage && unitDist < closestDist) return unit;
                return closest;
              });
              
              // Enhanced tower damage with NFT bonuses
              let baseDamage = tower.type === 'king' ? 180 : 120; // Increased base damage for better tower defense
              
              // Apply NFT trait bonuses for player towers
              if (tower.isPlayer && nftData?.bonuses?.attackBonus) {
                baseDamage = Math.floor(baseDamage * (1 + nftData.bonuses.attackBonus / 100));
              }
              
              const projectile = {
                id: `tower_def_${Date.now()}_${Math.random()}`,
                x: tower.x,
                y: tower.y - 15, // Shoot from top of tower
                targetX: target.x,
                targetY: target.y,
                damage: baseDamage,
                isPlayer: tower.isPlayer,
                type: 'tower' as const,
                emoji: tower.type === 'king' ? '👑💥' : '🏰🔥', // King towers shoot crown projectiles, regular towers shoot fire
                towerType: tower.type
              };
              
              setProjectiles(prev => [...prev, projectile]);
              
              // Enhanced tower attack effects with larger visual
              setAttackEffects(prev => [...prev, {
                id: `tower_defense_${Date.now()}`,
                x: tower.x,
                y: tower.y - 15,
                type: 'tower',
                frame: 0
              }]);
              
              console.log(`🏰 ${tower.isPlayer ? 'Player' : 'AI'} ${tower.type} tower shooting ${tower.type === 'king' ? 'crown projectile 👑💥' : 'fire projectile 🏰🔥'} dealing ${baseDamage} damage to ${target.cardId}`);
            }
          }
        });
      }, 1200); // Faster defensive attacks - every 1.2 seconds
      
      return () => clearInterval(towerDefenseInterval);
    }
  }, [gameState.isPlaying, towers, units, nftData]);

  // Ranged and Magical Unit Projectile System
  useEffect(() => {
    if (!gameState.isPlaying) return;
    
    const rangedAttackInterval = setInterval(() => {
      units.forEach(unit => {
        if (!unit || unit.health <= 0) return;
        
        const attackType = unit.attackType || unit.cardId?.toLowerCase() || '';
        const isRanged = attackType.includes('ranged') || attackType.includes('archer') || attackType.includes('bow');
        const isMagical = attackType.includes('magical') || attackType.includes('magic') || attackType.includes('spell') || attackType.includes('wizard');
        
        if (!isRanged && !isMagical) return;
        
        // Range limits: Ranged = 3.5 cells, Magical = 3 cells
        const range = isRanged ? 3.5 * BASE_CELL_SIZE : 3 * BASE_CELL_SIZE;
        
        // Find enemy units and towers in range
        const enemyTargets = [
          ...units.filter(target => 
            target.isPlayer !== unit.isPlayer && 
            target.health > 0 &&
            Math.sqrt((target.x - unit.x) ** 2 + (target.y - unit.y) ** 2) <= range
          ),
          ...towers.filter(tower => 
            tower.isPlayer !== unit.isPlayer && 
            !tower.destroyed &&
            Math.sqrt((tower.x - unit.x) ** 2 + (tower.y - unit.y) ** 2) <= range
          )
        ];
        
        if (enemyTargets.length > 0) {
          // Target closest enemy
          const target = enemyTargets.reduce((closest, current) => {
            const distToCurrent = Math.sqrt((current.x - unit.x) ** 2 + (current.y - unit.y) ** 2);
            const distToClosest = Math.sqrt((closest.x - unit.x) ** 2 + (closest.y - unit.y) ** 2);
            return distToCurrent < distToClosest ? current : closest;
          });
          
          // Create projectile
          const projectile = {
            id: `${isRanged ? 'ranged' : 'magical'}_proj_${Date.now()}_${Math.random()}`,
            x: unit.x,
            y: unit.y - 5, // Shoot from above unit
            targetX: target.x,
            targetY: target.y,
            targetId: target.id,
            damage: unit.damage || 50,
            speed: isMagical ? 8 : 6,
            type: isRanged ? 'ranged' : 'magical',
            emoji: isRanged ? '🏹' : '✨',
            isPlayer: unit.isPlayer,
            unitId: unit.id,
            trail: []
          };
          
          if (isRanged) {
            setRangedProjectiles(prev => [...prev, projectile]);
            console.log(`🏹 ${unit.isPlayer ? 'Player' : 'AI'} ranged unit attacking with 🏹`);
          } else {
            setMagicalProjectiles(prev => [...prev, projectile]);
            console.log(`✨ ${unit.isPlayer ? 'Player' : 'AI'} magical unit attacking with ✨`);
          }
          
          // Add attack effect
          setAttackEffects(prev => [...prev, {
            id: `${isRanged ? 'ranged' : 'magical'}_attack_${Date.now()}`,
            x: unit.x,
            y: unit.y - 5,
            type: isRanged ? 'ranged' : 'magical',
            frame: 0
          }]);
        }
      });
    }, 1800); // Ranged/magical units attack every 1.8 seconds
    
    return () => clearInterval(rangedAttackInterval);
  }, [gameState.isPlaying, units, towers]);

  // Enhanced A* pathfinding with intelligent unit navigation and obstacle avoidance
  const findPath = (startX: number, startY: number, targetX: number, targetY: number): {x: number, y: number}[] => {
    const startGridX = Math.floor(startX / BASE_CELL_SIZE);
    const startGridY = Math.floor(startY / BASE_CELL_SIZE);
    const targetGridX = Math.floor(targetX / BASE_CELL_SIZE);
    const targetGridY = Math.floor(targetY / BASE_CELL_SIZE);

    // A* pathfinding implementation
    interface PathNode {
      x: number;
      y: number;
      g: number; // Cost from start
      h: number; // Heuristic to target
      f: number; // Total cost
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

    // Enhanced obstacle detection
    const isBlocked = (x: number, y: number, fromX?: number, fromY?: number): boolean => {
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return true;
      
      // Check grid terrain
      const cellType = battleGrid[y]?.[x] || 1;
      if (cellType === 0) { // Water
        // Only allow water crossing at bridge positions
        if (y >= 13 && y <= 15) {
          return !(x === 5 || x === 13); // Bridge positions
        }
        return true;
      }
      
      // Check for units creating dynamic obstacles
      const unitAtPos = units.find(u => 
        Math.abs(u.x - x * BASE_CELL_SIZE) < BASE_CELL_SIZE * 0.6 &&
        Math.abs(u.y - y * BASE_CELL_SIZE) < BASE_CELL_SIZE * 0.6
      );
      
      if (unitAtPos && unitAtPos.speed > 0) { // Moving units are obstacles
        return true;
      }

      return false;
    };

    // Get valid neighbors with cost weighting
    const getNeighbors = (node: PathNode): PathNode[] => {
      const neighbors: PathNode[] = [];
      const directions = [
        { dx: 0, dy: -1, cost: 1 }, { dx: 1, dy: 0, cost: 1 }, 
        { dx: 0, dy: 1, cost: 1 }, { dx: -1, dy: 0, cost: 1 }, // Cardinal
        { dx: -1, dy: -1, cost: 1.4 }, { dx: 1, dy: -1, cost: 1.4 }, 
        { dx: 1, dy: 1, cost: 1.4 }, { dx: -1, dy: 1, cost: 1.4 } // Diagonal
      ];

      for (const dir of directions) {
        const newX = node.x + dir.dx;
        const newY = node.y + dir.dy;
        
        if (!isBlocked(newX, newY, node.x, node.y)) {
          let moveCost = dir.cost;
          
          // Add penalty for moving near water to encourage bridge use
          if (newY >= 13 && newY <= 15 && (newX < 4 || newX > 14)) {
            moveCost *= 2;
          }
          
          neighbors.push({
            x: newX,
            y: newY,
            g: node.g + moveCost,
            h: Math.abs(targetGridX - newX) + Math.abs(targetGridY - newY),
            f: 0,
            parent: node
          });
        }
      }
      return neighbors;
    };

    // A* main loop
    while (openList.length > 0) {
      // Find node with lowest f cost
      const current = openList.reduce((lowest, node) => 
        node.f < lowest.f ? node : lowest
      );

      // Remove current from open list and add to closed list
      openList.splice(openList.indexOf(current), 1);
      closedList.push(current);

      // Target reached
      if (current.x === targetGridX && current.y === targetGridY) {
        const path: { x: number; y: number }[] = [];
        let pathNode: PathNode | undefined = current;
        
        while (pathNode && pathNode.parent) {
          path.unshift({ x: pathNode.x * BASE_CELL_SIZE, y: pathNode.y * BASE_CELL_SIZE });
          pathNode = pathNode.parent;
        }
        
        console.log(`🧭 A* pathfinding: Found ${path.length}-step path`);
        return path;
      }

      // Process neighbors
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        neighbor.f = neighbor.g + neighbor.h;

        // Skip if already in closed list
        if (closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          continue;
        }

        // Check if this path to neighbor is better
        const existingOpen = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
        if (!existingOpen) {
          openList.push(neighbor);
        } else if (neighbor.g < existingOpen.g) {
          existingOpen.g = neighbor.g;
          existingOpen.f = neighbor.f;
          existingOpen.parent = neighbor.parent;
        }
      }

      // Prevent infinite loops
      if (closedList.length > 500) {
        console.warn('⚠️ A* pathfinding exceeded node limit, using fallback');
        break;
      }
    }

    // Fallback to simple direct path with obstacle avoidance
    const fallbackPath: { x: number; y: number }[] = [];
    let currentX = startGridX;
    let currentY = startGridY;

    while (currentX !== targetGridX || currentY !== targetGridY) {
      const deltaX = targetGridX - currentX;
      const deltaY = targetGridY - currentY;

      // Smart movement prioritization
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentX += Math.sign(deltaX);
      } else {
        currentY += Math.sign(deltaY);
      }

      // Boundary checks
      currentX = Math.max(0, Math.min(GRID_WIDTH - 1, currentX));
      currentY = Math.max(0, Math.min(GRID_HEIGHT - 1, currentY));

      fallbackPath.push({ x: currentX * BASE_CELL_SIZE, y: currentY * BASE_CELL_SIZE });
      
      if (fallbackPath.length > 100) break; // Safety check
    }

    console.log(`🧭 Using fallback path with ${fallbackPath.length} steps`);
    return fallbackPath;
  };

  // Precise deployment based on user click position
  const deployCardAtPosition = (card: BattleCard, x: number, y: number) => {
    if (gameState.playerElixir >= card.cost) {
      // Ensure deployment is on player's side of the battlefield (bottom half)
      const playerSideY = Math.max(y, CANVAS_HEIGHT * 0.5);
      const clampedX = Math.max(0, Math.min(x, CANVAS_WIDTH));
      
      const spawnX = clampedX;
      const spawnY = playerSideY;

      // Enhanced card classification for ALL 66 cards
      const attackType = determineCardAttackType(card);
      const unitRange = getCardRange(card, attackType);
      
      // Check if this is a tower card
      const isTowerCard = card.type === 'tower' || card.name?.toLowerCase().includes('tower') || 
                         card.name?.toLowerCase().includes('turret') || card.class === 'tower';

      // Determine lane based on deployment position
      const deployLane: 'left' | 'right' = spawnX < CANVAS_WIDTH / 2 ? 'left' : 'right';

      const newUnit: Unit = {
        id: `unit_${Date.now()}`,
        x: spawnX,
        y: spawnY,
        health: card.health,
        maxHealth: card.health,
        damage: card.attack,
        speed: isTowerCard ? 0 : 1.5, // Towers don't move
        range: unitRange,
        isPlayer: true,
        cardId: card.id,
        target: null,
        lastAttack: 0,
        lane: deployLane,
        attackType: attackType === 'spell' ? 'magical' : attackType,
        cardClass: card.class,
        cardType: card.type,
        isTower: isTowerCard,
        deployTime: Date.now(), // Track when tower was deployed
        despawnTime: isTowerCard ? Date.now() + (2 * 60 * 1000) : undefined // 2 minutes lifespan
      };

      setUnits(prev => [...prev, newUnit]);
      setGameState(prev => ({
        ...prev,
        playerElixir: prev.playerElixir - card.cost,
        selectedCard: null
      }));
      
      // Enhanced deployment effects with visual feedback
      setAttackEffects(prev => [...prev, {
        id: `deploy_effect_${Date.now()}`,
        x: spawnX,
        y: spawnY,
        type: 'deploy',
        emoji: '✨',
        frame: 0
      }]);
      
      // Trigger ability effects if card has abilities
      if (card.abilities && card.abilities.length > 0) {
        card.abilities.forEach(ability => {
          setAbilityEffects(prev => [...prev, {
            id: `ability_${Date.now()}_${ability}`,
            x: spawnX,
            y: spawnY,
            ability: ability.toLowerCase(),
            frame: 0,
            duration: 45 // Extended duration for better visibility
          }]);
        });
      }

      // Remove used card from hand and draw replacement immediately
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
      
      // Draw replacement card from deck to maintain strategic hand management
      if (playerHand.length <= 4) {
        const drawResult = drawCardsBalanced(playerDeckCards, playerDrawnCards, 1);
        if (drawResult.cards.length > 0) {
          setPlayerHand(prev => [...prev, drawResult.cards[0]]);
          setPlayerDrawnCards(drawResult.drawnIds);
          console.log(`🎴 Player drew replacement card: ${drawResult.cards[0].name}`);
        }
      }
      
      console.log(`🎯 Player deployed ${card.name} (${card.class}) at precise position (${spawnX}, ${spawnY}) on ${deployLane} lane`);
    }
  };

  const deployCard = (card: BattleCard, lane: 'left' | 'right') => {
    if (gameState.playerElixir >= card.cost) {
      const spawnX = lane === 'left' ? 4 * BASE_CELL_SIZE : 14 * BASE_CELL_SIZE;
      const spawnY = 23 * BASE_CELL_SIZE; // Player spawn area in grid
      deployCardAtPosition(card, spawnX, spawnY);
    }
  };

  const deployCard = (card: BattleCard, lane: 'left' | 'right') => {
    if (gameState.playerElixir >= card.cost) {
      const spawnX = lane === 'left' ? 4 * BASE_CELL_SIZE : 14 * BASE_CELL_SIZE;
      const spawnY = 23 * BASE_CELL_SIZE; // Player spawn area in grid
      deployCardAtPosition(card, spawnX, spawnY);
    }
  };

  const deployAICardStrategically = () => {
    console.log(`🤖 deployAICardStrategically called - Hand: ${aiHand.length}, Elixir: ${gameState.enemyElixir.toFixed(1)}`);
    
    // AI must follow same mana rules as player
    const affordableCards = aiHand.filter(card => card.cost <= Math.floor(gameState.enemyElixir));
    
    if (affordableCards.length === 0) {
      console.log(`🤖 AI has no affordable cards - need ${Math.min(...aiHand.map(c => c.cost))} elixir, have ${gameState.enemyElixir.toFixed(1)}`);
      return;
    }

    console.log(`🤖 AI affordable cards:`, affordableCards.map(c => `${c.name}(${c.cost})`));

    // Enhanced AI Strategy with advanced tactical analysis
    const playerUnits = units.filter(u => u.isPlayer);
    const aiUnits = units.filter(u => !u.isPlayer);
    const playerTowers = towers.filter(t => t.isPlayer && !t.destroyed);
    const aiTowers = towers.filter(t => !t.isPlayer && !t.destroyed);

    // Advanced threat assessment for battlefield
    const bridgeThreat = playerUnits.filter(u => 
      u.x >= 3 * BASE_CELL_SIZE && u.x <= 5 * BASE_CELL_SIZE).length;
    
    // Analyze player's army composition for counter-deployment
    const playerRanged = playerUnits.filter(u => u.attackType === 'ranged').length;
    const playerMelee = playerUnits.filter(u => u.attackType === 'melee' || u.attackType === 'tank').length;
    const playerMagical = playerUnits.filter(u => u.attackType === 'magical').length;
    
    // AI Decision Making with Grid Awareness
    let selectedCard = null;
    let selectedLane: 'left' | 'right' = 'left';
    let deployX = 0;
    let deployY = 0;
    
    // Enhanced strategic spell targeting with battlefield analysis
    const affordableSpells = affordableCards.filter(card => card.type === 'Spell' || card.name?.toLowerCase().includes('spell'));
    
    if (affordableSpells.length > 0 && playerUnits.length >= 2) {
      const spellCard = affordableSpells[0];
      // Advanced target analysis for optimal spell placement
      const strongUnits = playerUnits.filter(u => u.damage > 50 || u.health > 100);
      
      // Prioritize high-value targets
      if (strongUnits.length >= 2) {
        // Target powerful unit clusters
        const avgX = strongUnits.reduce((sum, u) => sum + u.x, 0) / strongUnits.length;
        const avgY = strongUnits.reduce((sum, u) => sum + u.y, 0) / strongUnits.length;
        
        deploySpell(spellCard, avgX, avgY);
        
        // AI pays mana cost and draws replacement card
        setGameState(prev => ({ ...prev, enemyElixir: prev.enemyElixir - spellCard.cost }));
        setAiHand(prev => prev.filter(c => c.id !== spellCard.id));
        
        // Draw replacement card immediately
        const aiDrawResult = drawCardsBalanced(aiDeck, aiDrawnCards, 1);
        if (aiDrawResult.cards.length > 0) {
          setAiHand(prev => [...prev, aiDrawResult.cards[0]]);
          setAiDrawnCards(aiDrawResult.drawnIds);
        }
        
        console.log(`🧠 AI deployed spell ${spellCard.name} (${spellCard.cost} elixir) targeting unit cluster`);
        return;
      }
    }
    
    // If no spells or no good targets, deploy unit cards
    const unitCards = affordableCards.filter(card => card.type !== 'Spell' && !card.name?.toLowerCase().includes('spell'));
    
    if (unitCards.length > 0) {
      // Strategic unit selection based on game state
      let bestCard = null;
      let priority = 0;
      
      // Prioritize by tactical needs
      for (const card of unitCards) {
        let cardPriority = 0;
        const attackType = determineCardAttackType(card);
        
        // Counter player composition
        if (playerRanged > 0 && (attackType === 'tank' || attackType === 'melee')) {
          cardPriority += 3; // Tanks counter ranged
        }
        if (playerMelee > 0 && attackType === 'ranged') {
          cardPriority += 2; // Ranged counter melee
        }
        if (playerMagical > 0 && attackType === 'tank') {
          cardPriority += 2; // Tanks resist magic
        }
        
        // Bridge pressure priority
        if (bridgeThreat > 0 && (attackType === 'tank' || card.health > 80)) {
          cardPriority += 2; // Deploy defenders against bridge threats
        }
        
        // Elixir efficiency (prefer cheaper cards when low elixir)
        if (gameState.enemyElixir < 6) {
          cardPriority += (6 - card.cost); // Prefer cheaper cards when low on elixir
        }
        
        // Tower targeting priority
        if (playerTowers.some(t => t.health < t.maxHealth * 0.7) && 
            (attackType === 'ranged' || card.attack > 60)) {
          cardPriority += 2; // Attack weak towers with strong units
        }
        
        if (cardPriority > priority) {
          priority = cardPriority;
          bestCard = card;
        }
      }
      
      // Fallback to random if no clear priority
      if (!bestCard) {
        bestCard = unitCards[Math.floor(Math.random() * unitCards.length)];
      }
      
      // Strategic lane selection
      const leftLaneThreats = playerUnits.filter(u => u.x < CANVAS_WIDTH / 2).length;
      const rightLaneThreats = playerUnits.filter(u => u.x >= CANVAS_WIDTH / 2).length;
      
      // Deploy to lane with more threat or less AI presence
      const aiLeft = aiUnits.filter(u => u.x < CANVAS_WIDTH / 2).length;
      const aiRight = aiUnits.filter(u => u.x >= CANVAS_WIDTH / 2).length;
      
      let deployLane: 'left' | 'right';
      if (leftLaneThreats > rightLaneThreats + 1) {
        deployLane = 'left'; // Defend against threats
      } else if (rightLaneThreats > leftLaneThreats + 1) {
        deployLane = 'right';
      } else if (aiLeft < aiRight) {
        deployLane = 'left'; // Balance AI forces
      } else {
        deployLane = 'right';
      }
      
      // Deploy AI unit
      const spawnX = deployLane === 'left' ? 4 * BASE_CELL_SIZE : 14 * BASE_CELL_SIZE;
      const spawnY = 6 * BASE_CELL_SIZE; // AI spawn area
      
      const attackType = determineCardAttackType(bestCard);
      const unitRange = getCardRange(bestCard, attackType);
      
      const isTowerCard = bestCard.type === 'tower' || bestCard.name?.toLowerCase().includes('tower');
      
      const newUnit: Unit = {
        id: `ai_unit_${Date.now()}`,
        x: spawnX,
        y: spawnY,
        health: bestCard.health,
        maxHealth: bestCard.health,
        damage: bestCard.attack,
        speed: isTowerCard ? 0 : 1.5,
        range: unitRange,
        isPlayer: false,
        cardId: bestCard.id,
        target: null,
        lastAttack: 0,
        lane: deployLane,
        attackType: attackType === 'spell' ? 'magical' : attackType,
        cardClass: bestCard.class,
        cardType: bestCard.type,
        isTower: isTowerCard,
        deployTime: Date.now(),
        despawnTime: isTowerCard ? Date.now() + (2 * 60 * 1000) : undefined
      };

      setUnits(prev => [...prev, newUnit]);
      
      // AI pays mana cost and manages hand
      setGameState(prev => ({ ...prev, enemyElixir: prev.enemyElixir - bestCard.cost }));
      setAiHand(prev => prev.filter(c => c.id !== bestCard.id));
      
      // Draw replacement card to maintain 4-card hand
      const aiDrawResult = drawCardsBalanced(aiDeck, aiDrawnCards, 1);
      if (aiDrawResult.cards.length > 0) {
        setAiHand(prev => [...prev, aiDrawResult.cards[0]]);
        setAiDrawnCards(aiDrawResult.drawnIds);
      }
      
      console.log(`🤖 AI deployed ${bestCard.name} (${bestCard.cost} elixir) on ${deployLane} lane - ${attackType} type`);
    }
  };

  const destroyTower = (towerId: string) => {
    setTowers(prev => prev.map(tower => {
      if (tower.id === towerId) {
        const updatedTower = { ...tower, destroyed: true, health: 0 };
        
        // Award crown
        if (tower.type === 'crown') {
          setGameState(prevState => ({
            ...prevState,
            [tower.isPlayer ? 'enemyCrowns' : 'playerCrowns']: 
              prevState[tower.isPlayer ? 'enemyCrowns' : 'playerCrowns'] + 1
          }));
        } else if (tower.type === 'king') {
          // King tower destroyed = instant win (use timeout to avoid React warnings)
          setTimeout(() => endBattle(), 100);
        }
        
        return updatedTower;
      }
      return tower;
    }));
  };

  const endBattle = () => {
    if (gameState.phase === 'results') return; // Prevent multiple calls
    
    setGameState(prev => ({ ...prev, isPlaying: false, phase: 'results' }));
    
    const playerScore = gameState.playerCrowns;
    const aiScore = gameState.enemyCrowns;
    
    // Enhanced win condition logic
    const playerTowerHealth = towers.filter(t => t.isPlayer && !t.destroyed).reduce((total, t) => total + t.health, 0);
    const aiTowerHealth = towers.filter(t => !t.isPlayer && !t.destroyed).reduce((total, t) => total + t.health, 0);
    
    let winner = 'player';
    if (playerScore > aiScore) {
      winner = 'player';
    } else if (aiScore > playerScore) {
      winner = 'ai';
    } else {
      // If crowns are tied, check tower health
      winner = playerTowerHealth >= aiTowerHealth ? 'player' : 'ai';
    }
    
    const results = {
      playerTowers: towers.filter(t => t.isPlayer).reduce((acc, t) => ({ ...acc, [t.type]: t.health }), {}),
      aiTowers: towers.filter(t => !t.isPlayer).reduce((acc, t) => ({ ...acc, [t.type]: t.health }), {}),
      timeRemaining: gameState.timeLeft,
      unitsDeployed: units.filter(u => u.isPlayer).length,
      damageDealt: towers.filter(t => !t.isPlayer).reduce((total, t) => total + (t.maxHealth - t.health), 0),
      crowns: playerScore,
      winner,
      playerTowerHealth,
      aiTowerHealth,
      difficulty: difficulty,
      battleDuration: 180 - gameState.timeLeft,
      totalUnitsDeployed: units.length,
      aiUnitsDeployed: units.filter(u => !u.isPlayer).length
    };

    console.log('🏆 Battle ended:', winner, results);
    
    // Save battle result to local storage
    if (playerWallet) {
      const battleResult: BattleResult = {
        playerId: playerWallet,
        opponentType: 'ai',
        winner: winner as 'player' | 'ai',
        playerCrowns: playerScore,
        enemyCrowns: aiScore,
        battleDuration: results.battleDuration,
        damageDealt: results.damageDealt,
        unitsDeployed: results.unitsDeployed,
        nftBonusUsed: Boolean(nftData?.bonuses?.attackBonus),
        timestamp: new Date()
      };
      
      LocalGameService.saveBattleResult(battleResult).then(() => {
        console.log('💾 Local Storage: Battle result saved successfully');
      }).catch(error => {
        console.error('❌ Local Storage: Failed to save battle result:', error);
      });
    }
    
    // Reward calculation based on performance
    const performanceMultiplier = winner === 'player' ? 
      (results.crowns >= 2 ? 1.5 : results.crowns >= 1 ? 1.2 : 1.0) : 0.5;
    const difficultyBonus = getPVEDifficultyMultiplier();
    const finalReward = Math.floor((results.damageDealt * 0.1 + results.crowns * 50) * performanceMultiplier * difficultyBonus);
    
    const finalResultsWithReward = {
      ...results,
      reward: Math.max(25, finalReward) // Minimum 25 BUDZ
    };
    
    onBattleEnd(winner as 'player' | 'ai', finalResultsWithReward);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.selectedCard || !gameState.isPlaying) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if it's a spell card (spells can be deployed anywhere)
    const isSpell = gameState.selectedCard.type === 'Spell' || gameState.selectedCard.name?.toLowerCase().includes('spell');
    
    if (isSpell) {
      // Spells can be deployed anywhere on the battlefield
      deploySpell(gameState.selectedCard, x, y);
    } else {
      // Precise unit placement - player clicks exactly where they want to deploy
      const gridX = Math.floor(x / BASE_CELL_SIZE);
      const gridY = Math.floor(y / BASE_CELL_SIZE);
      
      // Ensure deployment is on player's side (bottom half) or neutral zone
      if (gridY >= GRID_HEIGHT * 0.4 && gridX >= 0 && gridX < GRID_WIDTH) {
        // Use precise deployment at click location
        deployCardAtPosition(gameState.selectedCard, x, y);
        console.log(`🎯 Precise deployment at grid (${gridX}, ${gridY}) -> canvas (${x.toFixed(1)}, ${y.toFixed(1)})`);
      } else {
        console.log(`❌ Invalid deployment zone - click on your side of the battlefield`);
      }
    }
  };

  // Deploy spell at target location
  const deploySpell = (card: BattleCard, x: number, y: number) => {
    if (gameState.playerElixir >= card.cost) {
      // Create spell animation
      const spellAnimation = {
        id: `spell_${Date.now()}`,
        x,
        y,
        type: card.name || 'fireball',
        frame: 0
      };
      
      setSpellAnimations(prev => [...prev, spellAnimation]);
      
      // Add spell attack effect
      setAttackEffects(prev => [...prev, {
        id: `spell_effect_${Date.now()}`,
        x,
        y,
        type: 'spell',
        frame: 0
      }]);
      
      // Apply spell effects to nearby units/towers with grid-aware targeting
      setTimeout(() => {
        const damage = card.attack;
        const radius = BASE_CELL_SIZE * 1.5; // Grid-based spell radius (1.5 cells)
        
        // Damage nearby enemy units
        setUnits(prevUnits => prevUnits.map(unit => {
          if (!unit.isPlayer) {
            const distance = Math.sqrt(Math.pow(unit.x - x, 2) + Math.pow(unit.y - y, 2));
            if (distance <= radius) {
              // Add damage number for units
              setDamageNumbers(prev => [...prev, {
                id: `spell_dmg_${Date.now()}_${unit.id}`,
                x: unit.x,
                y: unit.y - 20,
                damage,
                isPlayer: true
              }]);
              return { ...unit, health: Math.max(0, unit.health - damage) };
            }
          }
          return unit;
        }).filter(u => u.health > 0));
        
        // Damage nearby towers
        setTowers(prevTowers => prevTowers.map(tower => {
          if (!tower.isPlayer && !tower.destroyed) {
            const distance = Math.sqrt(Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2));
            if (distance <= radius) {
              const newHealth = Math.max(0, tower.health - damage);
              if (newHealth <= 0) {
                setTimeout(() => destroyTower(tower.id), 0);
              }
              
              // Add damage number for towers
              setDamageNumbers(prev => [...prev, {
                id: `spell_dmg_${Date.now()}_${tower.id}`,
                x: tower.x,
                y: tower.y - 30,
                damage,
                isPlayer: true
              }]);
              
              return { ...tower, health: newHealth };
            }
          }
          return tower;
        }));
      }, 500);
      
      // Remove spell animation after duration
      setTimeout(() => {
        setSpellAnimations(prev => prev.filter(s => s.id !== spellAnimation.id));
      }, 1500);
      
      // Deduct elixir and remove card
      setGameState(prev => ({
        ...prev,
        playerElixir: prev.playerElixir - card.cost,
        selectedCard: null
      }));
      
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
      
      console.log(`✨ Cast spell ${card.name} at grid position (${Math.floor(x/BASE_CELL_SIZE)}, ${Math.floor(y/BASE_CELL_SIZE)})`);
    }
  };

  // All animation and image states already declared above - removed duplicates

  // Load game images including NFT and unit cards
  useEffect(() => {
    // Load battlefield
    const battlefield = new Image();
    battlefield.crossOrigin = 'anonymous';
    battlefield.onload = () => setBattlefieldImage(battlefield);
    battlefield.src = '/attached_assets/Pot60u6_1754231881681.png'; // Your cannabis battlefield

    // Load tower image
    const tower = new Image();
    tower.crossOrigin = 'anonymous';
    tower.onload = () => setTowerImage(tower);
    tower.src = 'https://i.imgur.com/M7Bear7.png';

    // Load castle image
    const castle = new Image();
    castle.crossOrigin = 'anonymous';
    castle.onload = () => setCastleImage(castle);
    castle.src = 'https://i.imgur.com/hYNPa50.png';

    // Load NFT image if available
    if (nftData?.nft?.image) {
      const nft = new Image();
      nft.crossOrigin = 'anonymous';
      nft.onload = () => setNFTImage(nft);
      nft.src = nftData.nft.image;
    }

    // Load unit images from cards
    const loadUnitImages = async () => {
      const images: {[key: string]: HTMLImageElement} = {};
      
      [...playerDeck, ...aiDeck].forEach(card => {
        if (card.image && !images[card.id]) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            images[card.id] = img;
            setUnitImages(prev => ({...prev, [card.id]: img}));
          };
          img.src = card.image;
        }
      });
    };

    loadUnitImages();
  }, [playerDeck, aiDeck, nftData]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw your actual battlefield image - clean and clear without overlays
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      } else {
        // Simple fallback if image fails to load
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // NO GRID OVERLAYS - Keep your battlefield image clean and visible

      // Keep your battlefield image completely clean - no overlays or grid lines

      // Draw towers using your custom images (1.5x bigger size)
      towers.forEach(tower => {
        if (!tower.destroyed) {
          const towerSize = tower.type === 'king' ? 72 : 54; // Increased by 1.5x (was 48/36)
          
          if (tower.type === 'king' && castleImage) {
            // Draw castle image for king towers
            ctx.drawImage(castleImage, tower.x - towerSize/2, tower.y - towerSize/2, towerSize, towerSize);
            
            // Draw NFT image in the middle of player's castle
            if (tower.isPlayer && nftImage) {
              const nftSize = 24;
              ctx.drawImage(nftImage, tower.x - nftSize/2, tower.y - nftSize/2, nftSize, nftSize);
            }
          } else if (tower.type === 'crown' && towerImage) {
            // Draw tower image for arena towers
            ctx.drawImage(towerImage, tower.x - towerSize/2, tower.y - towerSize/2, towerSize, towerSize);
          } else {
            // Fallback colored rectangles
            ctx.fillStyle = tower.isPlayer ? '#4169E1' : '#DC143C';
            ctx.fillRect(tower.x - towerSize/2, tower.y - towerSize/2, towerSize, towerSize);
          }

          // Health bar with better visibility
          const healthPercent = tower.health / tower.maxHealth;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(tower.x - 25, tower.y - towerSize/2 - 10, 50, 8);
          ctx.fillStyle = healthPercent > 0.7 ? '#00FF00' : healthPercent > 0.3 ? '#FFA500' : '#FF0000';
          ctx.fillRect(tower.x - 25, tower.y - towerSize/2 - 10, 50 * healthPercent, 8);
          
          // Health text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText(`${tower.health}`, tower.x, tower.y - towerSize/2 - 15);
          ctx.fillText(`${tower.health}`, tower.x, tower.y - towerSize/2 - 15);
        }
      });

      // Draw units with enhanced animations and visual effects
      units.forEach(unit => {
        const unitImage = unitImages[unit.cardId];
        const unitSize = 22; // Slightly larger for better visibility
        
        // Add subtle floating animation
        const floatOffset = Math.sin(Date.now() * 0.003 + unit.x * 0.01) * 1.5;
        const drawY = unit.y + floatOffset;
        
        if (unitImage) {
          // Save context for advanced rendering
          ctx.save();
          ctx.translate(unit.x, drawY);
          
          // Enhanced rotation based on movement direction with smooth interpolation
          if (unit.angle !== undefined) {
            ctx.rotate(unit.angle);
          }
          
          // Advanced scaling with health-based visual feedback
          const healthScale = unit.health / unit.maxHealth;
          const scaledSize = unitSize * (0.85 + 0.15 * healthScale); // More subtle health scaling
          
          // Remove team-colored circular border for cleaner minion look
          
          // Draw authentic card image as unit avatar without circular clipping
          ctx.drawImage(unitImage, -scaledSize/2, -scaledSize/2, scaledSize, scaledSize);
          
          ctx.restore();
          
          // Re-save for additional effects outside clipping
          ctx.save();
          ctx.translate(unit.x, drawY);
          
          // Phaser-style particle auras per attack class
          const now = Date.now();
          if (unit.attackType === 'magical') {
            drawMagicalAura(ctx, 0, 0, scaledSize / 2, now);
          } else if (unit.attackType === 'ranged') {
            drawRangedAura(ctx, 0, 0, scaledSize / 2, now);
          } else if (unit.attackType === 'tank') {
            drawTankAura(ctx, 0, 0, scaledSize / 2, now);
          } else if (unit.isTower) {
            drawTowerAura(ctx, 0, 0, scaledSize / 2, now);
            // Tower timer badge
            if (unit.despawnTime) {
              const timeLeft = Math.max(0, unit.despawnTime - Date.now());
              const minutesLeft = Math.floor(timeLeft / 60000);
              const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
              if (timeLeft > 0) {
                ctx.fillStyle = timeLeft < 30000 ? '#FF4444' : '#FFD700';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`, 0, scaledSize / 2 + 15);
              }
            }
          }
          
          ctx.restore();
        } else {
          // Enhanced fallback with attack type colors
          const colors = {
            'ranged': unit.isPlayer ? '#32CD32' : '#FF6347',
            'magical': unit.isPlayer ? '#9370DB' : '#DC143C',
            'melee': unit.isPlayer ? '#00FF00' : '#FF4500',
            'tank': unit.isPlayer ? '#4169E1' : '#B22222'
          };
          
          ctx.fillStyle = colors[unit.attackType] || (unit.isPlayer ? '#00FF00' : '#FF4500');
          ctx.beginPath();
          ctx.arc(unit.x, drawY, 12, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = unit.isPlayer ? '#006400' : '#8B0000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Enhanced health bar with smooth transitions
        const healthPercent = unit.health / unit.maxHealth;
        const barWidth = 32;
        const barHeight = 6;
        
        // Health bar background with rounded corners effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(unit.x - barWidth/2, unit.y - 28, barWidth, barHeight);
        
        // Animated health bar
        const healthColor = healthPercent > 0.7 ? '#00FF00' : 
                           healthPercent > 0.4 ? '#FFFF00' : 
                           healthPercent > 0.2 ? '#FFA500' : '#FF0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(unit.x - barWidth/2 + 1, unit.y - 27, (barWidth - 2) * healthPercent, barHeight - 2);
        
        // Health bar shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(unit.x - barWidth/2 + 1, unit.y - 27, (barWidth - 2) * healthPercent, 2);
      });

      // Phaser-style projectiles with glowing trails
      projectiles.forEach(proj => {
        const now = Date.now();
        if (proj.type === 'magical') {
          drawMagicalProjectile(ctx, proj.x, proj.y, now, proj.isPlayer);
        } else if (proj.type === 'ranged') {
          const px = proj.sourceX ?? proj.x - 15;
          const py = proj.sourceY ?? proj.y;
          drawRangedProjectile(ctx, proj.x, proj.y, px, py, proj.isPlayer);
        } else {
          // melee / generic
          drawMeleeProjectile(ctx, proj.x, proj.y, now, proj.isPlayer);
        }
      });

      // Phaser-style spell cast animations
      spellAnimations.forEach(spell => {
        // Pick colour per spell type
        const name: string = (spell.name || '').toLowerCase();
        let r = 148, g = 0, b = 211; // default purple
        if (name.includes('fire') || name.includes('blaze') || name.includes('burn')) { r = 255; g = 80; b = 0; }
        else if (name.includes('ice') || name.includes('blizzard') || name.includes('frost') || name.includes('snow')) { r = 80; g = 200; b = 255; }
        else if (name.includes('lightning') || name.includes('thunder') || name.includes('shock')) { r = 255; g = 230; b = 0; }
        else if (name.includes('heal') || name.includes('bloom') || name.includes('grow')) { r = 80; g = 220; b = 80; }
        else if (name.includes('poison') || name.includes('toxic') || name.includes('venom')) { r = 100; g = 255; b = 60; }

        // AOE spells use area disk + particles
        if (spell.radius && spell.radius > 30) {
          if (name.includes('blizzard') || name.includes('ice') || name.includes('frost') || name.includes('snow')) {
            drawBlizzardAOE(ctx, spell.x, spell.y, spell.radius, spell.frame, spell.duration);
          } else if (name.includes('fire') || name.includes('blaze') || name.includes('inferno')) {
            drawFireAOE(ctx, spell.x, spell.y, spell.radius, spell.frame, spell.duration);
          } else {
            drawGenericAOE(ctx, spell.x, spell.y, spell.radius, spell.frame, spell.duration, r, g, b);
          }
        }

        // Always draw the cast burst
        drawSpellCast(ctx, spell.x, spell.y, spell.frame, spell.duration, r, g, b);

        // Update animation frame
        spell.frame = (spell.frame + 1) % spell.duration;
      });

      // Phaser-style tower projectiles — glowing comet shot
      towerProjectiles.forEach(projectile => {
        drawTowerShot(ctx, projectile.x, projectile.y, projectile.color || '#FFD700', Date.now());
      });

      // Phaser-style ranged projectiles — tapered gradient trail
      rangedProjectiles.forEach(projectile => {
        const prevX = projectile.x - (projectile.targetX - projectile.x) * 0.15;
        const prevY = projectile.y - (projectile.targetY - projectile.y) * 0.15;
        drawRangedProjectile(ctx, projectile.x, projectile.y, prevX, prevY, projectile.isPlayer);
      });

      // Phaser-style magical projectiles — glowing orb + orbiting micro-particles
      magicalProjectiles.forEach(projectile => {
        const t = Date.now() - (projectile.startTime || 0);
        drawMagicalProjectile(ctx, projectile.x, projectile.y, t, projectile.isPlayer);
      });

      // Draw enhanced damage numbers with animations
      damageNumbers.forEach(dmg => {
        const age = Date.now() - parseInt(dmg.id.split('_')[1]);
        const alpha = Math.max(0, 1 - age / 2000); // Fade over 2 seconds
        const scale = Math.min(1.5, 1 + age / 1000); // Grow initially
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.floor(14 * scale)}px Arial`;
        
        // Color based on damage type and amount
        let color = dmg.isPlayer ? '#32CD32' : '#FF6347';
        if (dmg.type === 'spell') color = '#9400D3';
        else if (dmg.type === 'tower') color = '#FFD700';
        else if (dmg.type === 'ranged') color = '#FFA500';
        else if (dmg.type === 'magical') color = '#9932CC';
        else if (dmg.type === 'heal') color = '#00FF00';
        else if (dmg.damage > 100) color = '#FF0000'; // Critical damage
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        const text = dmg.type === 'heal' ? `+${dmg.damage}` : `-${dmg.damage}`;
        ctx.strokeText(text, dmg.x - 10, dmg.y);
        ctx.fillText(text, dmg.x - 10, dmg.y);
        
        ctx.restore();
      });

      // Phaser-style hit impact effects — slash arcs, starburst, shockwave rings
      attackEffects.forEach(effect => {
        const maxFrame = effect.maxFrame || 15;
        switch (effect.type) {
          case 'melee':
            drawMeleeHit(ctx, effect.x, effect.y, effect.frame, maxFrame);
            break;
          case 'ranged':
            drawRangedHit(ctx, effect.x, effect.y, effect.frame, maxFrame, effect.isPlayer ?? true);
            break;
          case 'magical':
          case 'tower':
            drawMagicalHit(ctx, effect.x, effect.y, effect.frame, maxFrame, effect.isPlayer ?? true);
            break;
          default:
            drawMeleeHit(ctx, effect.x, effect.y, effect.frame, maxFrame);
        }
      });

      // Phaser-style ability effects — colour-matched AOE bursts
      abilityEffects.forEach(ability => {
        const aName: string = (ability.ability || '').toLowerCase();
        if (aName.includes('fire') || aName.includes('burn') || aName.includes('blaze')) {
          drawFireAOE(ctx, ability.x, ability.y, 28 + ability.frame * 2, ability.frame, ability.duration);
        } else if (aName.includes('ice') || aName.includes('freeze') || aName.includes('blizzard') || aName.includes('frost')) {
          drawBlizzardAOE(ctx, ability.x, ability.y, 28 + ability.frame * 2, ability.frame, ability.duration);
        } else if (aName.includes('heal') || aName.includes('bloom')) {
          drawGenericAOE(ctx, ability.x, ability.y, 28 + ability.frame * 2, ability.frame, ability.duration, 80, 220, 80);
        } else if (aName.includes('poison') || aName.includes('toxic')) {
          drawGenericAOE(ctx, ability.x, ability.y, 28 + ability.frame * 2, ability.frame, ability.duration, 100, 255, 60);
        } else {
          drawGenericAOE(ctx, ability.x, ability.y, 28 + ability.frame * 2, ability.frame, ability.duration, 180, 100, 255);
        }
      });

      // Highlight deployment zone when card selected
      if (gameState.selectedCard) {
        const deployStartRow = 13;
        const deployStartY = deployStartRow * BASE_CELL_SIZE;
        
        // Highlight player deployment area
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(1 * BASE_CELL_SIZE, deployStartY, (GRID_WIDTH - 2) * BASE_CELL_SIZE, (GRID_HEIGHT - deployStartRow) * BASE_CELL_SIZE);
      }

      if (gameState.isPlaying) {
        // Enhanced frame rate with smooth animations
        animationRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, towers, units, battlefieldImage, towerImage, castleImage, unitImages, nftImage, projectiles]);

  return (
    <div className="w-full max-w-sm mx-auto bg-black flex flex-col h-screen overflow-hidden">
      {/* Top Bar - Game Status */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 py-2 flex justify-between items-center text-sm border-b border-gray-600">
        <button 
          onClick={() => onBattleEnd('ai', {})}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
        >
          <ArrowLeft size={12} />
          EXIT
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Crown className="text-blue-400" size={14} />
            <span className="font-bold text-blue-300">{gameState.playerCrowns}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Timer className="text-yellow-400" size={14} />
            <span className="font-bold text-yellow-300">
              {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Crown className="text-red-400" size={14} />
            <span className="font-bold text-red-300">{gameState.enemyCrowns}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Zap className="text-purple-400" size={14} />
            <span className="font-bold text-white">{Math.floor(gameState.playerElixir)}/10</span>
          </div>
          
          {/* AI Hand Indicator */}
          <div className="bg-red-800/50 px-2 py-1 rounded flex items-center gap-1">
            <div className="w-3 h-4 bg-red-600 rounded-sm"></div>
            <span className="text-red-300 text-xs font-bold">{aiHand.length}</span>
          </div>
        </div>
      </div>

      {/* Game Board - Fixed height to make room for cards */}
      <div className="relative overflow-hidden" style={{ height: '50vh' }}>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(blob:https://imgur.com/3f0f26bd-5c03-4425-9093-7510ee01cbd9)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full cursor-crosshair touch-manipulation relative z-10"
          onClick={handleCanvasClick}
          onDrop={(e) => {
            e.preventDefault();
            const cardData = e.dataTransfer.getData('text/plain');
            if (cardData) {
              try {
                const card = JSON.parse(cardData);
                handleCanvasClick(e); // Deploy card at drop location
              } catch (error) {
                console.error('Failed to parse dropped card data:', error);
              }
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          style={{
            imageRendering: 'crisp-edges',
            backgroundColor: 'transparent'
          }}
        />
      </div>

      {/* Dedicated Card Area - Compact Cards Below Game Board */}
      <div className="bg-gradient-to-t from-gray-900 to-gray-800 p-3 border-t border-gray-600 min-h-[160px]">
        <div className="text-center text-white text-sm font-bold mb-3">
          Your Battle Cards - Drag to Deploy
        </div>
        <div className="grid grid-cols-4 gap-3 max-w-4xl mx-auto">
          {playerHand.map((card, index) => (
            <div
              key={`${card.id}_${index}`}
              className={`
                cursor-pointer transition-all duration-200 hover:scale-105 
                ${gameState.selectedCard?.id === card.id ? 'ring-4 ring-yellow-400 scale-105' : ''}
                ${gameState.playerElixir >= card.cost ? 'opacity-100' : 'opacity-60 grayscale'}
                bg-gradient-to-b from-purple-600 to-purple-800 rounded-xl border-2 border-yellow-500 
                shadow-2xl p-2 text-white h-[120px] relative overflow-hidden
              `}
              onClick={() => gameState.playerElixir >= card.cost && setGameState(prev => ({ 
                ...prev, 
                selectedCard: prev.selectedCard?.id === card.id ? null : card 
              }))}
              draggable={gameState.playerElixir >= card.cost}
              onDragStart={(e) => {
                if (gameState.playerElixir >= card.cost) {
                  e.dataTransfer.setData('text/plain', JSON.stringify(card));
                  setGameState(prev => ({ ...prev, selectedCard: card }));
                }
              }}
            >
              {/* Card Image - Full height */}
              {card.image && (
                <div className="w-full h-full rounded-lg overflow-hidden bg-black/20 relative">
                  <img 
                    src={card.image} 
                    alt={card.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/attached_assets/good_dealer.png';
                    }}
                  />
                  
                  {/* Cost in top-right corner */}
                  <div className="absolute top-1 right-1 w-6 h-6 bg-blue-600/90 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">⚡{card.cost}</span>
                  </div>
                  
                  {/* Attack in bottom-left corner */}
                  <div className="absolute bottom-1 left-1 w-6 h-6 bg-red-600/90 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">⚔️{card.attack}</span>
                  </div>
                  
                  {/* Health in bottom-right corner */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-600/90 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">❤️{card.health}</span>
                  </div>
                </div>
              )}
              
              {/* Deployment Ready Indicator */}
              {gameState.playerElixir >= card.cost && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
              
              {/* Selected Indicator */}
              {gameState.selectedCard?.id === card.id && (
                <div className="absolute inset-0 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                  <div className="text-yellow-300 font-bold text-xs">SELECTED</div>
                </div>
              )}
            </div>
          ))}
          
          {/* Empty card slots */}
          {Array.from({length: Math.max(0, 4 - playerHand.length)}).map((_, index) => (
            <div
              key={`empty_${index}`}
              className="bg-gray-800/50 border-2 border-gray-600 border-dashed rounded-xl flex items-center justify-center h-[120px]"
            >
              <div className="text-gray-500 text-xs">Empty</div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Card Tooltip - Wider and More Attractive */}
      {hoveredCard && (
        <div 
          className="fixed z-50 bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 rounded-xl shadow-2xl backdrop-blur-sm pointer-events-none min-w-80"
          style={{
            left: Math.min(tooltipPosition.x, window.innerWidth - 320),
            top: tooltipPosition.y,
            transform: 'translateY(-50%)',
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.3)'
          }}
        >
          {/* Header with Card Name and Cost */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm truncate max-w-60">{hoveredCard.name}</h3>
              <div className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                ⚡{hoveredCard.cost}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-red-400 text-sm font-semibold mb-1">❤️ Health</div>
                <div className="text-white text-lg font-bold">{hoveredCard.health}</div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 text-sm font-semibold mb-1">⚔️ Attack</div>
                <div className="text-white text-lg font-bold">{hoveredCard.attack}</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 text-sm font-semibold mb-1">🎯 Range</div>
                <div className="text-white text-lg font-bold">
                  {hoveredCard.class === 'ranged' ? '3.5' : 
                   hoveredCard.class === 'magical' ? '3' : 
                   hoveredCard.class === 'tank' ? '1.5' : '1.5'}
                </div>
              </div>
            </div>

            {/* Rarity and Type */}
            <div className="flex justify-between items-center mb-3 text-xs">
              <div className="bg-purple-800/50 px-2 py-1 rounded-full">
                <span className="text-purple-300 font-medium">
                  {hoveredCard.rarity ? hoveredCard.rarity.toUpperCase() : 'COMMON'}
                </span>
              </div>
              <div className="bg-gray-700/50 px-2 py-1 rounded-full">
                <span className="text-gray-300 font-medium">
                  {hoveredCard.type || 'UNIT'}
                </span>
              </div>
            </div>
            
            {/* Description */}
            {(hoveredCard as any).description && (
              <div className="border-t border-gray-700 pt-3">
                <div className="text-sm text-gray-300 leading-relaxed">
                  {(hoveredCard as any).description}
                </div>
              </div>
            )}

            {/* Special Abilities or Traits */}
            {hoveredCard.abilities && hoveredCard.abilities.length > 0 && (
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="text-xs text-yellow-400 font-semibold mb-2">✨ ABILITIES</div>
                <div className="space-y-1">
                  {hoveredCard.abilities.map((ability: string, index: number) => (
                    <div key={index} className="text-xs text-gray-300 bg-gray-800/50 px-2 py-1 rounded">
                      • {ability}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualBattleSystem;