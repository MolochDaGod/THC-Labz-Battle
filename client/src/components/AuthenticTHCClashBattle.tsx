import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Crown, Zap, Timer, Trophy, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCardEnhancement, triggerAbility, getAnimationByType } from '../utils/EnhancedCardAbilities';
import { getBalancedStats, calculateDamage, getCardTier } from '../utils/BalancedCardStats';
import { MAP_THEMES, getTheme, drawThemeFallback } from '../utils/MapThemes';
import { replayRecorder } from '../utils/BattleReplayRecorder';
import { nftToGrowerzUnitCard } from '../utils/GrowerzUnitSystem';
import { generateGrowerzSprite, getCachedSprite } from '../services/GrowerzBattleSprite';
import { BattleEffectsEngine } from '../utils/BattleEffectsEngine';
import { getBossForTheme, bossToUnit, checkBossEnrage, type BossCard } from '../utils/AiBossSystem';

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
  description?: string;
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
  target: Unit | Tower | null;
  lastAttack: number;
  range: number;
  lane: 'left' | 'right';
  attackType: 'ranged' | 'melee' | 'magical' | 'tank';
  cardClass: string;
  cardType: string;
  deployTime: number;
  movingToX?: number;
  movingToY?: number;
  attackCooldown: number;
  isAttacking: boolean;
  lastTargetAcquisition?: number;
  isAdvancing?: boolean;
  advanceTarget?: {x: number, y: number} | null;
  // Enhanced abilities system
  primaryAbilityLastUsed?: number;
  passiveAbilityActive?: boolean;
  statusEffects?: string[];
  animationState?: string;
  enhancedStats?: {
    speedBoost?: number;
    damageBoost?: number;
    armorBoost?: number;
    healing?: number;
  };
  // Shield system
  shieldCharges?: number;
  maxShieldCharges?: number;
}

interface Tower {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'crown' | 'king' | 'tower-card';
  isPlayer: boolean;
  destroyed: boolean;
  range: number;
  damage: number;
  lastAttack: number;
  attackCooldown: number;
  cardId?: string; // For tower cards deployed from hand
  image?: string; // Tower image URL for authentic rendering
}

interface AdminGameboard {
  elements: Array<{
    type: string;
    x: number;
    y: number;
    team: 'player' | 'ai';
    health?: number;
    towerType?: 'crown' | 'king';
  }>;
  dimensions: { width: number; height: number };
  version: string;
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
  attackType?: 'ranged' | 'melee' | 'magical' | 'tank';
  cardClass?: string;
}

interface GameState {
  isPlaying: boolean;
  timeLeft: number;
  playerCrowns: number;
  enemyCrowns: number;
  playerElixir: number;
  enemyElixir: number;
  aiElixir: number; // Added AI mana management system
  selectedCard: BattleCard | null;
  phase: 'battle' | 'results';
  winner: 'player' | 'ai' | null;
}

interface AuthenticTHCClashBattleProps {
  playerDeck?: BattleCard[];
  captainCard?: BattleCard;
  onBattleEnd?: (winner: 'player' | 'ai', results: any) => void;
  onBack?: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  nftData?: {
    nft?: { image?: string; name?: string };
    bonuses?: { attackBonus?: number };
  };
  playerWallet?: string;
  gameZones?: any[];
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 640;

const GAME_BOARD_BG = '/game-assets/thc-clash-gameboard.png';


// Default tower layout - positions tuned so health bars are always in viewport
const DEFAULT_GAMEBOARD_ELEMENTS = [
  { type: "tower" as const, x: 195, y: 145, team: "ai" as const, towerType: "crown" as const, health: 1500 },
  { type: "tower" as const, x: 525, y: 145, team: "ai" as const, towerType: "crown" as const, health: 1500 },
  { type: "castle" as const, x: 360, y: 80, team: "ai" as const, towerType: "king" as const, health: 2500 },
  { type: "tower" as const, x: 195, y: 490, team: "player" as const, towerType: "crown" as const, health: 1500 },
  { type: "tower" as const, x: 525, y: 490, team: "player" as const, towerType: "crown" as const, health: 1500 },
  { type: "castle" as const, x: 360, y: 558, team: "player" as const, towerType: "king" as const, health: 2500 }
];

export default function AuthenticTHCClashBattle({
  playerDeck = [],
  captainCard,
  onBattleEnd = () => {},
  onBack,
  difficulty = 'medium',
  nftData,
  playerWallet,
  gameZones = []
}: AuthenticTHCClashBattleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameboardImageRef = useRef<HTMLImageElement | null>(null);
  const themeImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState('cannabis');
  const selectedThemeIdRef = useRef('cannabis');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const zoomLevelRef = useRef(1.0);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1.0);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    timeLeft: 180,
    playerCrowns: 0,
    enemyCrowns: 0,
    playerElixir: 0, // Start with 0 elixir - authentic game start
    enemyElixir: 0,
    aiElixir: 0, // AI starts with same elixir as player
    selectedCard: null,
    phase: 'battle',
    winner: null
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const unitsRef = useRef<Unit[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const gameStateRef = useRef<GameState>(null as any);
  const playerDeckRef = useRef<BattleCard[]>(playerDeck);
  const captainCardRef = useRef<BattleCard | undefined>(captainCard);
  const aiDeckRef = useRef<BattleCard[]>([]);
  const currentHandRef = useRef<BattleCard[]>([]);
  const deckIndexRef = useRef(0);
  const lastCardDrawRef = useRef(Date.now());
  const lastGroupPushRef = useRef(0); // AI group push tracking
  const lastPlayerDeployRef = useRef(0); // Reactive defense tracking
  const aiPreferredLaneRef = useRef<'left' | 'right'>('left'); // AI lane preference
  const [adminGameboard, setAdminGameboard] = useState<AdminGameboard | null>(null);
  const [draggedCard, setDraggedCard] = useState<BattleCard | null>(null);
  const [gameboardLoaded, setGameboardLoaded] = useState(false);
  const [imageCache] = useState(new Map<string, HTMLImageElement>());
  // Boss system state
  const bossRef = useRef<BossCard | null>(null);
  const bossSpawnedRef = useRef(false);
  const [bossMessage, setBossMessage] = useState<string | null>(null);
  const bossMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const growerzSpriteCache = useRef(new Map<string, string>());
  const [spriteGenStatus, setSpriteGenStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const fxEngineRef = useRef(new BattleEffectsEngine());
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentHand, setCurrentHand] = useState<BattleCard[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [aiDeck, setAiDeck] = useState<BattleCard[]>([]);
  const [lastCardDraw, setLastCardDraw] = useState(Date.now());
  const visualEffectsRef = useRef<Array<{
    id: string;
    type: 'damage' | 'hit' | 'death' | 'shield' | 'crit';
    x: number;
    y: number;
    value?: number;
    color: string;
    startTime: number;
    duration: number;
    emoji?: string;
    particles?: Array<{ dx: number; dy: number; size: number; color: string }>;
  }>>([]);

  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { towersRef.current = towers; }, [towers]);
  useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { playerDeckRef.current = playerDeck; }, [playerDeck]);
  useEffect(() => { captainCardRef.current = captainCard; }, [captainCard]);
  useEffect(() => { aiDeckRef.current = aiDeck; }, [aiDeck]);
  useEffect(() => { currentHandRef.current = currentHand; }, [currentHand]);
  useEffect(() => { deckIndexRef.current = deckIndex; }, [deckIndex]);
  useEffect(() => { lastCardDrawRef.current = lastCardDraw; }, [lastCardDraw]);

  const spawnEffect = useCallback((type: 'damage' | 'hit' | 'death' | 'shield' | 'crit', x: number, y: number, value?: number, attackType?: string) => {
    const id = `vfx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    
    const makeParticles = (count: number, baseColor: string, spread: number = 30) => 
      Array.from({ length: count }, () => ({
        dx: (Math.random() - 0.5) * spread,
        dy: (Math.random() - 0.5) * spread,
        size: 2 + Math.random() * 4,
        color: baseColor,
      }));

    let effect: any = { id, type, x, y, value, startTime: now };

    switch (type) {
      case 'damage':
        effect.color = attackType === 'magical' ? '#c084fc' : attackType === 'ranged' ? '#fbbf24' : '#ff6b6b';
        effect.duration = 900;
        effect.particles = makeParticles(6, effect.color, 20);
        break;
      case 'hit':
        effect.color = '#ffffff';
        effect.duration = 400;
        effect.particles = makeParticles(8, attackType === 'magical' ? '#a855f7' : attackType === 'tank' ? '#3b82f6' : '#ef4444', 40);
        break;
      case 'death':
        effect.color = '#ff4444';
        effect.duration = 800;
        effect.emoji = '💥';
        effect.particles = makeParticles(12, '#ff8800', 50);
        break;
      case 'shield':
        effect.color = '#60a5fa';
        effect.duration = 600;
        effect.emoji = '🛡️';
        effect.particles = makeParticles(6, '#93c5fd', 25);
        break;
      case 'crit':
        effect.color = '#fbbf24';
        effect.duration = 1100;
        effect.emoji = '⚡';
        effect.particles = makeParticles(10, '#fde047', 35);
        break;
    }

    const effects = visualEffectsRef.current;
    if (effects.length > 30) effects.splice(0, effects.length - 30);
    effects.push(effect);
  }, []);

  // Load admin gameboard - MANDATORY for battles
  const loadAdminGameboard = useCallback(async () => {
    try {
      
      let gameboard = null;
      
      try {
        const response = await fetch('/api/admin/load-pve-gameboard');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.gameboard) {
            gameboard = result.gameboard.gameboard || result.gameboard;
          }
        }
      } catch (_e) {
      }
      
      if (!gameboard) {
        const localBoard = localStorage.getItem('thc-clash-pve-gameboard');
        if (localBoard) {
          try { gameboard = JSON.parse(localBoard); } catch (_e) {}
        }
      }
      
      if (gameboard && validateGameboard(gameboard)) {
        console.debug('✅ Loaded PVE gameboard', gameboard);
        setAdminGameboard(gameboard);
        initializeTowersFromGameboard(gameboard);
        setGameboardLoaded(true);
        // Save to localStorage as backup
        localStorage.setItem('thc-clash-pve-gameboard', JSON.stringify(gameboard));
      } else {
        const defaultGameboard: AdminGameboard = {
          elements: DEFAULT_GAMEBOARD_ELEMENTS,
          dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
          version: "1.0"
        };
        setAdminGameboard(defaultGameboard);
        initializeTowersFromGameboard(defaultGameboard);
        setGameboardLoaded(true);
        localStorage.setItem('thc-clash-pve-gameboard', JSON.stringify(defaultGameboard));
      }
    } catch (error) {
      console.error('❌ Failed to load admin gameboard:', error);
      const defaultGameboard: AdminGameboard = {
        elements: DEFAULT_GAMEBOARD_ELEMENTS,
        dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        version: "1.0"
      };
      setAdminGameboard(defaultGameboard);
      initializeTowersFromGameboard(defaultGameboard);
      setGameboardLoaded(true);
    }
  }, []);

  // Validate gameboard has required elements
  const validateGameboard = (board: AdminGameboard): boolean => {
    if (!board || !board.elements) return false;
    
    const towers = board.elements.filter(el => el.type === 'tower' || el.type === 'castle');
    const playerTowers = towers.filter(t => t.team === 'player');
    const aiTowers = towers.filter(t => t.team === 'ai');
    
    const isValid = playerTowers.length > 0 && aiTowers.length > 0;
    
    return isValid;
  };

  // Initialize towers from admin gameboard
  const initializeTowersFromGameboard = (gameboard: AdminGameboard) => {
    const gameboardTowers: Tower[] = [];
    
    gameboard.elements.forEach((element, index) => {
      if (element.type === 'tower' || element.type === 'castle') {
        const isKingTower = element.towerType === 'king';
        const tower: Tower = {
          id: `${element.team}-tower-${index}`,
          x: element.x,
          y: element.team === 'player' ? element.y + 30 : element.y, // Move player structures DOWN 30 points into lower green area
          health: element.health || (isKingTower ? 2500 : 1500),
          maxHealth: element.health || (isKingTower ? 2500 : 1500),
          type: element.towerType || 'crown',
          isPlayer: element.team === 'player',
          destroyed: false,
          range: 120, // Tower range
          damage: 100, // Tower damage (reduced from 200 to 100 - 50% reduction)
          lastAttack: 0,
          attackCooldown: 1000, // 1 second attack cooldown
          image: isKingTower ? 'https://i.imgur.com/cdCzTKs.png' : 'https://i.imgur.com/M7Bear7.png'
        };
        gameboardTowers.push(tower);
      }
    });
    
    setTowers(gameboardTowers);
  };

  // ── BRIDGE CONSTANTS matching MapThemes.ts drawThemeFallback exactly ──
  // LBX = CANVAS_WIDTH * 0.20 = 160, RBX = CANVAS_WIDTH * 0.80 = 640
  // BRIDGE_W = 100 → left corridor [110, 210], right corridor [590, 690]
  // RIVER: centerY ± 34 (RIVER_H = 68)
  const BRIDGE_LEFT_X = CANVAS_WIDTH * 0.20;   // 160
  const BRIDGE_RIGHT_X = CANVAS_WIDTH * 0.80;  // 640
  const BRIDGE_HALF_W = 52;  // half-width of passable corridor (slightly wider than visual)
  const RIVER_HALF_H = 38;   // half-height of river zone

  const isInBridgeCorridor = (x: number) =>
    (x >= BRIDGE_LEFT_X - BRIDGE_HALF_W && x <= BRIDGE_LEFT_X + BRIDGE_HALF_W) ||
    (x >= BRIDGE_RIGHT_X - BRIDGE_HALF_W && x <= BRIDGE_RIGHT_X + BRIDGE_HALF_W);

  const nearestBridgeX = (x: number) =>
    Math.abs(x - BRIDGE_LEFT_X) <= Math.abs(x - BRIDGE_RIGHT_X)
      ? BRIDGE_LEFT_X
      : BRIDGE_RIGHT_X;

  // IMPROVED BRIDGE PATHFINDING - Authentic Clash Royale bridge positions
  const calculateOptimalPath = (unit: Unit, target: Unit | Tower) => {
    const centerY = CANVAS_HEIGHT / 2;
    const needsCrossing = (unit.y < centerY && target.y > centerY) || (unit.y > centerY && target.y < centerY);
    
    if (needsCrossing) {
      // Use the bridge on the same side as the unit's current X position for lane consistency
      const leftBridgeDist = Math.abs(unit.x - BRIDGE_LEFT_X);
      const rightBridgeDist = Math.abs(unit.x - BRIDGE_RIGHT_X);
      // Respect lane assignment if set, otherwise pick closest bridge
      const optimalBridgeX = (unit as any).lane === 'right'
        ? BRIDGE_RIGHT_X
        : leftBridgeDist <= rightBridgeDist ? BRIDGE_LEFT_X : BRIDGE_RIGHT_X;

      // Waypoint: approach bridge entrance on unit's own side, then cross
      const bridgeEntranceY = unit.y < centerY
        ? centerY - RIVER_HALF_H - 10   // entering from top → stop just above river
        : centerY + RIVER_HALF_H + 10;  // entering from bottom → stop just below river

      const distToBridgeEntrance = Math.sqrt(
        (optimalBridgeX - unit.x) ** 2 + (bridgeEntranceY - unit.y) ** 2
      );

      return {
        needsBridge: true,
        bridgePoint: { x: optimalBridgeX, y: bridgeEntranceY },
        bridgeCrossPoint: { x: optimalBridgeX, y: centerY },
        totalDistance: distToBridgeEntrance
      };
    }
    
    // Direct path within same territory
    return {
      needsBridge: false,
      bridgePoint: null,
      bridgeCrossPoint: null,
      totalDistance: Math.sqrt((target.x - unit.x) ** 2 + (target.y - unit.y) ** 2)
    };
  };

  // AI uses real cards from admin collection with authentic abilities and stats
  // Pre-crafted AI GROWERZ NFT pool — injected 1-4 per battle
  const AI_GROWERZ_POOL = [
    { name: 'GROWERZ #42',  rank: 42,  mint: 'ai-growerz-42',  image: '/card-art/growerz-42.png',  skin: 'Gold',   clothes: 'Army Vest',      head: 'Golden Crown',    mouth: 'Blunt',     eyes: 'Laser',         background: 'Purple' },
    { name: 'GROWERZ #217', rank: 217, mint: 'ai-growerz-217', image: '/card-art/growerz-217.png', skin: 'Brown',  clothes: 'Street Jacket',  head: 'Samurai Helmet',  mouth: 'Pipe',      eyes: 'Stoned',        background: 'Blue' },
    { name: 'GROWERZ #508', rank: 508, mint: 'ai-growerz-508', image: '/card-art/growerz-508.png', skin: 'Dark',   clothes: 'Lab Coat',       head: 'Wild Fro',        mouth: 'Dab Rig',   eyes: 'Sunglasses',    background: 'Green' },
    { name: 'GROWERZ #891', rank: 891, mint: 'ai-growerz-891', image: '/card-art/growerz-891.png', skin: 'Alien',  clothes: 'Hoodie',         head: 'Bald',            mouth: 'Blunt',     eyes: 'Bloodshot',     background: 'Orange' },
    { name: 'GROWERZ #333', rank: 333, mint: 'ai-growerz-333', image: '/card-art/growerz-333.png', skin: 'Silver', clothes: 'Trench Coat',    head: 'Crown',           mouth: 'Gas Mask',  eyes: 'Goggles',       background: 'Red' },
    { name: 'GROWERZ #1200',rank: 1200,mint: 'ai-growerz-1200',image: '/card-art/growerz-1200.png',skin: 'Tan',    clothes: 'Overalls',       head: 'Snapback',        mouth: 'Toothpick', eyes: 'Stoned',        background: 'Yellow' },
    { name: 'GROWERZ #75',  rank: 75,  mint: 'ai-growerz-75',  image: '/card-art/growerz-75.png',  skin: 'Purple', clothes: 'Mystic Robes',   head: 'Wizard Hat',      mouth: 'Hookah',    eyes: 'Glowing Purple',background: 'Cosmic' },
    { name: 'GROWERZ #654', rank: 654, mint: 'ai-growerz-654', image: '/card-art/growerz-654.png', skin: 'Green',  clothes: 'Camo Jacket',    head: 'Beanie',          mouth: 'Blunt',     eyes: 'Monocle',       background: 'Forest' },
  ];

  const generateAIDeck = async () => {
    try {
      // Fetch real admin cards from server
      const response = await fetch('/api/admin/cards');
      const result = await response.json();
      
      let baseCards: BattleCard[] = [];
      if (result.success && result.cards && result.cards.length > 0) {
        console.debug(`✅ Loaded ${result.cards.length} AI cards`);
        const realCards = result.cards.filter((card: BattleCard) => card.id !== 'captain' && !card.name.includes('Captain'));
        if (realCards.length > 0) {
          const shuffled = realCards.sort(() => 0.5 - Math.random());
          baseCards = shuffled.slice(0, 5).map((card: any) => {
            const balancedStats = getBalancedStats(card.id);
            return {
              ...card,
              attack: balancedStats?.attack || card.attack,
              health: balancedStats?.health || card.health,
              cost: balancedStats?.cost || card.cost,
              abilities: card.abilities || []
            };
          });
        }
      }
      if (baseCards.length === 0) {
        return generateFallbackAIDeck();
      }

      // Inject 1-4 random GROWERZ NFT cards into AI deck
      const growerzCount = Math.floor(Math.random() * 4) + 1;
      const shuffledPool = [...AI_GROWERZ_POOL].sort(() => 0.5 - Math.random());
      const growerzCards: BattleCard[] = shuffledPool.slice(0, growerzCount).map(nft => {
        const gc = nftToGrowerzUnitCard(nft);
        return gc as unknown as BattleCard;
      });
      console.debug(`🌿 Injected ${growerzCount} GROWERZ NFT(s) into AI deck`);

      const aiCards = [...baseCards, ...growerzCards];
      setAiDeck(aiCards);
      return aiCards;
    } catch (error) {
      console.error('❌ Error fetching admin cards:', error);
      return generateFallbackAIDeck();
    }
  };

  // Fallback AI deck generation
  const generateFallbackAIDeck = () => {
    const aiCards: BattleCard[] = [];
    
    for (let i = 0; i < 6; i++) {
      const randomCardId = Math.floor(Math.random() * 66) + 1;
      const cardImageId = `image-${randomCardId}`;
      const balancedStats = getBalancedStats(cardImageId);
      
      const aiCard: BattleCard = {
        id: cardImageId,
        name: `Strain ${randomCardId}`,
        attack: balancedStats?.attack || 50,
        health: balancedStats?.health || 100,
        cost: balancedStats?.cost || 3,
        description: `AI Card ${randomCardId}`,
        image: `/game-assets/image-${randomCardId}.png`,
        class: randomCardId % 4 === 0 ? 'tank' : randomCardId % 3 === 0 ? 'ranged' : 'melee',
        type: 'unit',
        rarity: randomCardId <= 20 ? 'common' : randomCardId <= 40 ? 'uncommon' : randomCardId <= 55 ? 'rare' : 'epic',
        abilities: []
      };
      
      aiCards.push(aiCard);
    }
    
    setAiDeck(aiCards);
    return aiCards;
  };

  // Initialize starting hand with exactly 4 random cards from deck (duplicates allowed)
  const initializeHand = () => {
    const userDeck = [...playerDeck];
    if (captainCard) userDeck.push(captainCard); // User can have captain in their deck
    
    // Draw 4 random cards (duplicates allowed)
    const startingHand: BattleCard[] = [];
    for (let i = 0; i < 4; i++) {
      const randomCard = userDeck[Math.floor(Math.random() * userDeck.length)];
      startingHand.push(randomCard);
    }
    
    setCurrentHand(startingHand);
  };

  // Load gameboard image (used only for cannabis theme)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { gameboardImageRef.current = img; };
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => { gameboardImageRef.current = fallback; };
      fallback.src = '/attached_assets/thc-clash-gameboard.png';
    };
    img.src = GAME_BOARD_BG;
  }, []);

  // Load puter.js for free AI image generation
  useEffect(() => {
    if ((window as any).puter) { setPuterReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => setPuterReady(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch (_e) {} };
  }, []);

  // FX canvas animation loop — runs independently from game logic
  useEffect(() => {
    const engine = fxEngineRef.current;
    let raf: number;
    const loop = () => {
      engine.render(fxCanvasRef.current, Date.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); engine.clear(); };
  }, []);

  // Auto-generate full-body battle sprites for GROWERZ NFT cards when puter is ready
  useEffect(() => {
    if (!puterReady) return;
    const puter = (window as any).puter;
    if (!puter?.ai?.txt2img) return;

    const allGrowerz: BattleCard[] = [];
    [...playerDeck, ...(captainCard ? [captainCard] : [])].forEach(card => {
      if ((card as any).isGrowerzUnit) allGrowerz.push(card);
    });

    if (allGrowerz.length === 0) return;

    setSpriteGenStatus('generating');

    const generate = async () => {
      for (const card of allGrowerz) {
        const key = (card as any).nftMint || card.id;
        const already = getCachedSprite(key);
        if (already) {
          growerzSpriteCache.current.set(key, already);
          continue;
        }
        try {
          const traits = (card as any).traits || {};
          const url = await generateGrowerzSprite(key, {
            name: card.name,
            skin: traits.skin,
            clothes: traits.clothes,
            head: traits.head,
            mouth: traits.mouth,
            eyes: traits.eyes,
            background: traits.background,
            rank: (card as any).nftRank,
          }, 128, 220);
          growerzSpriteCache.current.set(key, url);
          // Force image cache to reload with sprite
          imageCache.delete('sprite:' + card.id);
          console.debug(`[GrowerzSprite] ✅ Sprite ready for ${card.name}`);
        } catch (e) {
          console.warn(`[GrowerzSprite] Generation failed for ${card.name}:`, e);
        }
      }
      setSpriteGenStatus('done');
    };

    generate();
  }, [puterReady]);

  // Generate theme background via puter.js txt2img
  const generateThemeBackground = useCallback(async (themeId: string) => {
    const theme = getTheme(themeId);
    themeImageRef.current = null;

    // Check session cache first
    const cacheKey = `thc-theme-v2-${themeId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const img = new Image();
      img.onload = () => { if (selectedThemeIdRef.current === themeId) themeImageRef.current = img; };
      img.src = cached;
      return;
    }

    const puter = (window as any).puter;
    if (!puter?.ai?.txt2img) return;

    setIsGeneratingTheme(true);
    try {
      const img: HTMLImageElement = await puter.ai.txt2img(theme.puterPrompt, false);
      if (selectedThemeIdRef.current === themeId) {
        themeImageRef.current = img;
        // Cache as data URL
        try {
          const offscreen = document.createElement('canvas');
          offscreen.width = img.naturalWidth || 512;
          offscreen.height = img.naturalHeight || 512;
          const ctx2 = offscreen.getContext('2d');
          ctx2?.drawImage(img, 0, 0);
          sessionStorage.setItem(cacheKey, offscreen.toDataURL('image/jpeg', 0.85));
        } catch (_e) {}
      }
    } catch (e) {
      console.warn('puter txt2img generation skipped:', e);
    }
    setIsGeneratingTheme(false);
  }, []);

  // When puter becomes ready, auto-generate background for non-cannabis themes
  useEffect(() => {
    selectedThemeIdRef.current = selectedThemeId;
    if (selectedThemeId !== 'cannabis') {
      generateThemeBackground(selectedThemeId);
    }
  }, [selectedThemeId, puterReady, generateThemeBackground]);

  // Load admin gameboard on component mount
  useEffect(() => {
    loadAdminGameboard();
  }, [loadAdminGameboard]);

  // Start battle function
  const startBattle = () => {
    if (!gameboardLoaded || !adminGameboard) {
      alert('⚠️ Cannot start battle: No valid gameboard loaded. Please create a gameboard in Admin interface.');
      return;
    }
    
    if (!playerDeck || playerDeck.length === 0) {
      alert('⚠️ Cannot start battle: No cards in deck. Please build a deck with NFT cards.');
      return;
    }
    
    // Initialize game systems with proper start state
    generateAIDeck(); // AI gets 6 real cards with authentic images and abilities
    initializeHand(); // User gets 4 cards (can include captain)
    
    // Start with 5 elixir for both players - authentic Clash Royale start
    setGameState(prev => ({ 
      ...prev, 
      isPlaying: true,
      playerElixir: 5, // Start with 5 elixir like authentic Clash Royale
      enemyElixir: 5,  // Start with 5 elixir like authentic Clash Royale
      aiElixir: 5      // AI elixir synced - single source of truth
    }));
    
    // Start recording replay
    replayRecorder.start();
    
    setLastCardDraw(Date.now());
  };

  // Game loop with authentic rendering
  useEffect(() => {
    if (!gameState.isPlaying || !gameboardLoaded) return;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw map background - themed
      const activeTheme = getTheme(selectedThemeIdRef.current);
      const useUploadedBg = selectedThemeIdRef.current === 'cannabis' && gameboardImageRef.current;
      const useAiBg = themeImageRef.current;

      if (useUploadedBg) {
        ctx.drawImage(gameboardImageRef.current!, 0, -30, CANVAS_WIDTH, CANVAS_HEIGHT + 60);
      } else if (useAiBg) {
        ctx.drawImage(themeImageRef.current!, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Overlay subtle darkening at very top and bottom so health bars remain readable
        const topGrad = ctx.createLinearGradient(0, 0, 0, 90);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.45)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, 90);
        const botGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 80, 0, CANVAS_HEIGHT);
        botGrad.addColorStop(0, 'rgba(0,0,0,0)');
        botGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
      } else {
        drawThemeFallback(ctx, activeTheme, CANVAS_WIDTH, CANVAS_HEIGHT, Date.now());
      }

      // Draw towers with authentic images and dynamic health states
      const currentTowers = towersRef.current;
      const currentUnits = unitsRef.current;
      const currentProjectiles = projectilesRef.current;
      
      currentTowers.forEach(tower => {
        const healthPercent = tower.health / tower.maxHealth;
        let towerImageUrl = tower.image;
        
        // Dynamic tower image based on health state
        if (tower.destroyed) {
          towerImageUrl = 'https://i.imgur.com/cCzoRkR.png'; // Destroyed tower
        } else if (tower.type === 'king') {
          towerImageUrl = 'https://i.imgur.com/cdCzTKs.png'; // Castle (always same)
        } else {
          // Regular towers change based on health
          if (healthPercent > 0.5) {
            towerImageUrl = 'https://i.imgur.com/M7Bear7.png'; // Full health
          } else if (healthPercent > 0) {
            towerImageUrl = 'https://i.imgur.com/Feve3a6.png'; // Half health
          } else {
            towerImageUrl = 'https://i.imgur.com/cCzoRkR.png'; // Destroyed
          }
        }
        
        // Load and draw tower image
        if (towerImageUrl) {
          let towerImg = imageCache.get(towerImageUrl);
          if (!towerImg) {
            towerImg = new Image();
            towerImg.crossOrigin = 'anonymous';
            towerImg.src = towerImageUrl;
            imageCache.set(towerImageUrl, towerImg);
          }
          
          if (towerImg.complete && towerImg.naturalWidth > 0 && !tower.destroyed) {
            // Draw authentic tower/castle image
            const towerSize = tower.type === 'king' ? 80 : 60;
            ctx.drawImage(towerImg, tower.x - towerSize/2, tower.y - towerSize/2, towerSize, towerSize);
          } else if (tower.destroyed && towerImg.complete) {
            // Draw destroyed tower image
            ctx.drawImage(towerImg, tower.x - 40, tower.y - 40, 80, 80);
          } else {
            // Fallback while loading
            ctx.fillStyle = tower.isPlayer ? '#4CAF50' : '#F44336';
            ctx.fillRect(tower.x - 25, tower.y - 30, 50, 60);
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(tower.type === 'king' ? '🏰' : '🗼', tower.x, tower.y + 10);
          }
        }
        
        // Health bar for living towers
        if (!tower.destroyed) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(tower.x - 30, tower.y - 55, 60, 10);
          ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
          ctx.fillRect(tower.x - 30, tower.y - 55, 60 * healthPercent, 10);
          
          // Health text
          ctx.fillStyle = 'white';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(tower.health)}`, tower.x, tower.y - 60);
        }
      });

      // Draw minions using exact card images (not circles!)
      currentUnits.forEach(unit => {
        let card = null;
        
        if (unit.isPlayer) {
          card = playerDeckRef.current.find(c => c.id === unit.cardId) || captainCardRef.current;
        } else {
          card = aiDeckRef.current.find(c => c.id === unit.cardId) || playerDeckRef.current.find(c => c.id === unit.cardId);
        }
        
        // Draw REAL CARD IMAGES as minions on battlefield
        if (card?.image) {
          let img = imageCache.get(card.image);
          if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = card.image;
            imageCache.set(card.image, img);
          }
          
          const isGrowerzCard = !!(card as any).isGrowerzUnit;

          // Resolve best draw image: prefer generated full-body sprite for GROWERZ
          const spriteKey = isGrowerzCard ? ((card as any).nftMint || card.id) : null;
          const spriteUrl = spriteKey ? growerzSpriteCache.current.get(spriteKey) : null;
          let drawImg = img;
          if (spriteUrl) {
            const spriteCacheKey = 'gsprite:' + (spriteKey || card.id);
            let si = imageCache.get(spriteCacheKey);
            if (!si) {
              si = new Image();
              si.src = spriteUrl;
              imageCache.set(spriteCacheKey, si);
            }
            if (si.complete && si.naturalWidth > 0) drawImg = si;
          }

          if (drawImg.complete && drawImg.naturalWidth > 0) {
            if (isGrowerzCard) {
              // ─── GROWERZ NFT unit: full-body portrait sprite ───
              const SW = 46;   // portrait width
              const SH = 76;   // portrait height (~1:1.65 ratio like reference art)
              const sx = unit.x - SW / 2;
              const sy = unit.y - SH + 14;  // feet land near unit.y
              const teamColor = unit.isPlayer ? '#22c55e' : '#ef4444';
              const teamGlow  = unit.isPlayer ? '#44ff88' : '#ff5555';

              // Team glow border (rounded rect)
              ctx.save();
              ctx.shadowColor = teamGlow;
              ctx.shadowBlur = 18;
              ctx.strokeStyle = teamColor;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              const r = 5;
              ctx.moveTo(sx - 2 + r, sy - 2);
              ctx.lineTo(sx - 2 + SW + 4 - r, sy - 2);
              ctx.arcTo(sx - 2 + SW + 4, sy - 2, sx - 2 + SW + 4, sy - 2 + r, r);
              ctx.lineTo(sx - 2 + SW + 4, sy - 2 + SH + 4 - r);
              ctx.arcTo(sx - 2 + SW + 4, sy - 2 + SH + 4, sx - 2 + SW + 4 - r, sy - 2 + SH + 4, r);
              ctx.lineTo(sx - 2 + r, sy - 2 + SH + 4);
              ctx.arcTo(sx - 2, sy - 2 + SH + 4, sx - 2, sy - 2 + SH + 4 - r, r);
              ctx.lineTo(sx - 2, sy - 2 + r);
              ctx.arcTo(sx - 2, sy - 2, sx - 2 + r, sy - 2, r);
              ctx.closePath();
              ctx.stroke();
              ctx.restore();

              // Clip sprite to rounded portrait rect
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(sx + r, sy);
              ctx.lineTo(sx + SW - r, sy);
              ctx.arcTo(sx + SW, sy, sx + SW, sy + r, r);
              ctx.lineTo(sx + SW, sy + SH - r);
              ctx.arcTo(sx + SW, sy + SH, sx + SW - r, sy + SH, r);
              ctx.lineTo(sx + r, sy + SH);
              ctx.arcTo(sx, sy + SH, sx, sy + SH - r, r);
              ctx.lineTo(sx, sy + r);
              ctx.arcTo(sx, sy, sx + r, sy, r);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(drawImg, sx, sy, SW, SH);

              // Subtle bottom shadow vignette (ground contact)
              const vg = ctx.createLinearGradient(0, sy + SH * 0.72, 0, sy + SH);
              vg.addColorStop(0, 'rgba(0,0,0,0)');
              vg.addColorStop(1, 'rgba(0,0,0,0.32)');
              ctx.fillStyle = vg;
              ctx.fillRect(sx, sy + SH * 0.72, SW, SH * 0.28);
              ctx.restore();

              // Inner highlight border
              ctx.save();
              ctx.strokeStyle = 'rgba(255,255,255,0.4)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(sx + r, sy);
              ctx.lineTo(sx + SW - r, sy);
              ctx.arcTo(sx + SW, sy, sx + SW, sy + r, r);
              ctx.lineTo(sx + SW, sy + SH - r);
              ctx.arcTo(sx + SW, sy + SH, sx + SW - r, sy + SH, r);
              ctx.lineTo(sx + r, sy + SH);
              ctx.arcTo(sx, sy + SH, sx, sy + SH - r, r);
              ctx.lineTo(sx, sy + r);
              ctx.arcTo(sx, sy, sx + r, sy, r);
              ctx.closePath();
              ctx.stroke();
              ctx.restore();

              // 🌿 NFT badge below sprite
              ctx.save();
              ctx.font = 'bold 8px Arial';
              ctx.fillStyle = '#22ff88';
              ctx.textAlign = 'center';
              ctx.shadowColor = '#000';
              ctx.shadowBlur = 5;
              ctx.fillText('🌿 NFT', unit.x, sy + SH + 10);
              ctx.restore();
            } else {
              // Regular card image - unchanged
              ctx.drawImage(drawImg, unit.x - 20, unit.y - 20, 40, 40);
            }
          } else {
            // Loading indicator while image loads
            ctx.fillStyle = unit.isPlayer ? '#22c55e' : '#ef4444';
            ctx.fillRect(unit.x - 18, unit.y - 18, 36, 36);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('↻', unit.x, unit.y + 4);
          }
        } else {
          // Only when absolutely no card image exists
          ctx.fillStyle = unit.isPlayer ? '#4CAF50' : '#F44336';
          ctx.fillRect(unit.x - 20, unit.y - 20, 40, 40);
          
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'white';
          const icon = unit.cardClass.includes('tank') ? '🛡️' : 
                      unit.cardClass.includes('ranged') ? '🏹' : '⚔️';
          ctx.fillText(icon, unit.x, unit.y + 7);
        }
        
        // Health bar
        const healthPercent = unit.health / unit.maxHealth;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(unit.x - 15, unit.y - 28, 30, 5);
        ctx.fillStyle = unit.isPlayer ? '#22c55e' : '#ef4444';
        ctx.fillRect(unit.x - 15, unit.y - 28, 30 * healthPercent, 5);
        
        // Clean pathfinding outlines - Green for AI, Red for Player
        if (unit.target) {
          const outlineColor = unit.isPlayer ? '#ff4444' : '#00ff44'; // Red for player, Green for AI
          ctx.strokeStyle = outlineColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(unit.x, unit.y);
          ctx.lineTo(unit.target.x, unit.target.y);
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash
          
          // Target indicator
          ctx.fillStyle = outlineColor;
          ctx.beginPath();
          ctx.arc(unit.target.x, unit.target.y, 8, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        // Enhanced attack animations with cooler effects
        if (unit.isAttacking) {
          const attackTime = Date.now() - unit.lastAttack;
          const animationProgress = Math.min(attackTime / 300, 1); // 300ms attack animation
          
          if (unit.cardClass.includes('ranged') || unit.cardClass.includes('magical')) {
            const isMagical = unit.cardClass.includes('magical');
            ctx.save();
            
            const chargePhase = Math.min(animationProgress / 0.4, 1);
            const releasePhase = Math.max(0, (animationProgress - 0.4) / 0.6);
            
            if (chargePhase < 1) {
              const ringAlpha = chargePhase * 0.8;
              ctx.globalAlpha = ringAlpha;
              ctx.strokeStyle = isMagical ? '#c084fc' : '#fde047';
              ctx.lineWidth = 2 + chargePhase * 2;
              ctx.beginPath();
              ctx.arc(unit.x, unit.y, 15 + chargePhase * 12, 0, Math.PI * 2);
              ctx.stroke();
              
              const innerGrad = ctx.createRadialGradient(unit.x, unit.y, 0, unit.x, unit.y, 12);
              innerGrad.addColorStop(0, isMagical ? 'rgba(192, 132, 252, 0.4)' : 'rgba(253, 224, 71, 0.4)');
              innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = innerGrad;
              ctx.beginPath();
              ctx.arc(unit.x, unit.y, 12, 0, Math.PI * 2);
              ctx.fill();
            }
            
            const particleCount = isMagical ? 8 : 5;
            for (let i = 0; i < particleCount; i++) {
              const pAngle = (i / particleCount) * Math.PI * 2 + animationProgress * Math.PI * 3;
              const radius = chargePhase < 1 ? (25 - chargePhase * 15) : (10 + releasePhase * 20);
              const pAlpha = chargePhase < 1 ? chargePhase : (1 - releasePhase);
              const px = unit.x + Math.cos(pAngle) * radius;
              const py = unit.y + Math.sin(pAngle) * radius;
              ctx.globalAlpha = pAlpha * 0.8;
              ctx.fillStyle = isMagical ? '#d8b4fe' : '#fbbf24';
              ctx.shadowColor = isMagical ? '#a855f7' : '#fbbf24';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(px, py, 2 + (isMagical ? Math.sin(pAngle * 3) : 0), 0, Math.PI * 2);
              ctx.fill();
            }
            
            if (releasePhase > 0 && isMagical) {
              ctx.globalAlpha = (1 - releasePhase) * 0.3;
              ctx.strokeStyle = '#e9d5ff';
              ctx.lineWidth = 1;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.arc(unit.x, unit.y, 20 + releasePhase * 15, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }
            
            ctx.restore();
          } else {
            ctx.save();
            const isTank = unit.cardClass?.includes('tank');
            const angle = Math.atan2((unit.target?.y || unit.y) - unit.y, (unit.target?.x || unit.x) - unit.x);
            
            const windUp = Math.min(animationProgress / 0.3, 1);
            const swing = animationProgress > 0.3 ? Math.min((animationProgress - 0.3) / 0.3, 1) : 0;
            const followThrough = animationProgress > 0.6 ? (animationProgress - 0.6) / 0.4 : 0;
            
            if (isTank) {
              ctx.shadowColor = '#3b82f6';
              ctx.shadowBlur = 12 * swing;
              
              const smashRadius = 25 + swing * 30;
              const sweepAngle = swing * Math.PI * 1.2;
              ctx.globalAlpha = Math.max(0, 1 - followThrough);
              ctx.strokeStyle = '#60a5fa';
              ctx.lineWidth = 8 - followThrough * 4;
              ctx.beginPath();
              ctx.arc(unit.x, unit.y, smashRadius, angle - sweepAngle / 2, angle + sweepAngle / 2);
              ctx.stroke();
              
              if (swing > 0.5) {
                const impactX = unit.x + Math.cos(angle) * 30;
                const impactY = unit.y + Math.sin(angle) * 30;
                const shockAlpha = (1 - followThrough) * 0.6;
                ctx.globalAlpha = shockAlpha;
                const shockGrad = ctx.createRadialGradient(impactX, impactY, 0, impactX, impactY, 20 + followThrough * 15);
                shockGrad.addColorStop(0, 'rgba(96, 165, 250, 0.5)');
                shockGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');
                ctx.fillStyle = shockGrad;
                ctx.beginPath();
                ctx.arc(impactX, impactY, 20 + followThrough * 15, 0, Math.PI * 2);
                ctx.fill();
              }
              
              if (followThrough > 0) {
                for (let i = 0; i < 5; i++) {
                  const sAngle = angle + (Math.random() - 0.5) * Math.PI * 0.8;
                  const sLen = (10 + Math.random() * 20) * (1 - followThrough);
                  ctx.globalAlpha = (1 - followThrough) * 0.7;
                  ctx.strokeStyle = '#93c5fd';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(unit.x + Math.cos(angle) * 25, unit.y + Math.sin(angle) * 25);
                  ctx.lineTo(unit.x + Math.cos(angle) * 25 + Math.cos(sAngle) * sLen, unit.y + Math.sin(angle) * 25 + Math.sin(sAngle) * sLen);
                  ctx.stroke();
                }
              }
            } else {
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 10 * swing;
              
              const slashLen = 35 + swing * 15;
              const sweepStart = angle - Math.PI * 0.6 * windUp;
              const sweepEnd = angle + Math.PI * 0.8 * swing;
              ctx.globalAlpha = Math.max(0, 1 - followThrough * 1.5);
              
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 5 - followThrough * 3;
              ctx.beginPath();
              ctx.arc(unit.x, unit.y, slashLen, sweepStart, sweepEnd);
              ctx.stroke();
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(unit.x, unit.y, slashLen - 3, sweepStart + 0.1, sweepEnd - 0.1);
              ctx.stroke();
              
              if (swing > 0.7) {
                const sparkCount = 5;
                for (let i = 0; i < sparkCount; i++) {
                  const sAngle = angle + (Math.random() - 0.5) * Math.PI * 0.6;
                  const sLen = (8 + Math.random() * 18) * (1 - followThrough);
                  ctx.globalAlpha = (1 - followThrough) * 0.9;
                  ctx.strokeStyle = i % 2 === 0 ? '#fbbf24' : '#ffffff';
                  ctx.lineWidth = 2;
                  const startX = unit.x + Math.cos(angle) * 20;
                  const startY = unit.y + Math.sin(angle) * 20;
                  ctx.beginPath();
                  ctx.moveTo(startX, startY);
                  ctx.lineTo(startX + Math.cos(sAngle) * sLen, startY + Math.sin(sAngle) * sLen);
                  ctx.stroke();
                }
              }
            }
            
            ctx.restore();
          }
        }

      });

      // Draw enhanced projectiles with improved visual trails and effects
      currentProjectiles.forEach(projectile => {
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) return;
        const normX = dx / distance;
        const normY = dy / distance;
        
        ctx.save();
        
        if (projectile.attackType === 'magical') {
          const trailLen = 35;
          for (let i = 0; i < 3; i++) {
            const offset = i * 8;
            const tX = projectile.x - normX * (trailLen - offset);
            const tY = projectile.y - normY * (trailLen - offset);
            const grad = ctx.createLinearGradient(tX, tY, projectile.x, projectile.y);
            grad.addColorStop(0, 'rgba(168, 85, 247, 0)');
            grad.addColorStop(0.5, `rgba(192, 132, 252, ${0.15 + i * 0.15})`);
            grad.addColorStop(1, `rgba(216, 180, 254, ${0.4 + i * 0.15})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 6 - i * 1.5;
            ctx.beginPath();
            ctx.moveTo(tX, tY);
            ctx.lineTo(projectile.x, projectile.y);
            ctx.stroke();
          }
          
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 18;
          
          const pulseSize = 6 + Math.sin(Date.now() * 0.015) * 2;
          const orbGrad = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, pulseSize);
          orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          orbGrad.addColorStop(0.4, 'rgba(192, 132, 252, 0.7)');
          orbGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          
          for (let i = 0; i < 4; i++) {
            const age = (Date.now() + i * 100) * 0.008;
            const sparkX = projectile.x + Math.cos(age + i) * (8 + Math.sin(age * 2) * 5);
            const sparkY = projectile.y + Math.sin(age + i) * (8 + Math.cos(age * 2) * 5);
            ctx.globalAlpha = 0.5 + Math.sin(age) * 0.3;
            ctx.fillStyle = '#e9d5ff';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (projectile.attackType === 'ranged') {
          const trailLen = 28;
          const tX = projectile.x - normX * trailLen;
          const tY = projectile.y - normY * trailLen;
          const grad = ctx.createLinearGradient(tX, tY, projectile.x, projectile.y);
          grad.addColorStop(0, 'rgba(251, 191, 36, 0)');
          grad.addColorStop(0.6, 'rgba(251, 191, 36, 0.3)');
          grad.addColorStop(1, 'rgba(253, 224, 71, 0.7)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(tX, tY);
          ctx.lineTo(projectile.x, projectile.y);
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(projectile.x - normX * 12, projectile.y - normY * 12);
          ctx.lineTo(projectile.x, projectile.y);
          ctx.stroke();
          
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;
        } else {
          const tX = projectile.x - normX * 18;
          const tY = projectile.y - normY * 18;
          const grad = ctx.createLinearGradient(tX, tY, projectile.x, projectile.y);
          grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0.5)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(tX, tY);
          ctx.lineTo(projectile.x, projectile.y);
          ctx.stroke();
          
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
        }
        
        ctx.globalAlpha = 1;
        ctx.font = projectile.attackType === 'magical' ? '22px Arial' : '18px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeText(projectile.emoji, projectile.x, projectile.y + 6);
        ctx.fillStyle = 'white';
        ctx.fillText(projectile.emoji, projectile.x, projectile.y + 6);
        
        ctx.restore();
      });

      // AOE animations now handled by BattleEffectsEngine overlay canvas

      // Draw visual effects (damage numbers, hit particles, death explosions)
      const vfxNow = Date.now();
      visualEffectsRef.current = visualEffectsRef.current.filter(vfx => {
        const elapsed = vfxNow - vfx.startTime;
        if (elapsed >= vfx.duration) return false;
        const progress = elapsed / vfx.duration;
        
        ctx.save();
        
        if (vfx.type === 'damage' || vfx.type === 'crit') {
          const rise = progress * 40;
          const scale = vfx.type === 'crit' ? 1.4 : 1;
          const alpha = progress < 0.2 ? progress / 0.2 : 1 - ((progress - 0.2) / 0.8);
          ctx.globalAlpha = Math.max(0, alpha);
          
          if (vfx.type === 'crit') {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 12;
          }
          
          ctx.font = `bold ${Math.round(16 * scale)}px Arial`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.9)';
          ctx.lineWidth = 3;
          ctx.fillStyle = vfx.color;
          const text = vfx.value ? `-${Math.round(vfx.value)}` : '💥';
          ctx.strokeText(text, vfx.x + (Math.sin(progress * 6) * 3), vfx.y - rise);
          ctx.fillText(text, vfx.x + (Math.sin(progress * 6) * 3), vfx.y - rise);
          
          if (vfx.type === 'crit' && vfx.emoji) {
            ctx.font = '18px Arial';
            ctx.fillText(vfx.emoji, vfx.x + 20, vfx.y - rise - 8);
          }
        }
        
        if (vfx.type === 'hit') {
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          const ringRadius = 8 + progress * 25;
          ctx.strokeStyle = vfx.color;
          ctx.lineWidth = 3 * (1 - progress);
          ctx.beginPath();
          ctx.arc(vfx.x, vfx.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          const innerAlpha = alpha * 0.4;
          ctx.globalAlpha = innerAlpha;
          ctx.fillStyle = vfx.color;
          ctx.beginPath();
          ctx.arc(vfx.x, vfx.y, ringRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (vfx.type === 'death') {
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          
          const burstRadius = progress * 45;
          const gradient = ctx.createRadialGradient(vfx.x, vfx.y, 0, vfx.x, vfx.y, burstRadius);
          gradient.addColorStop(0, 'rgba(255, 200, 50, ' + alpha * 0.6 + ')');
          gradient.addColorStop(0.5, 'rgba(255, 100, 0, ' + alpha * 0.3 + ')');
          gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(vfx.x, vfx.y, burstRadius, 0, Math.PI * 2);
          ctx.fill();
          
          if (progress < 0.4 && vfx.emoji) {
            ctx.globalAlpha = 1 - progress / 0.4;
            ctx.font = `${24 + progress * 20}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(vfx.emoji, vfx.x, vfx.y + 8);
          }
          
          ctx.strokeStyle = 'rgba(255, 150, 0, ' + alpha * 0.8 + ')';
          ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + progress * 2;
            const len = progress * 35;
            ctx.beginPath();
            ctx.moveTo(vfx.x, vfx.y);
            ctx.lineTo(vfx.x + Math.cos(angle) * len, vfx.y + Math.sin(angle) * len);
            ctx.stroke();
          }
        }
        
        if (vfx.type === 'shield') {
          const alpha = 1 - progress;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 3;
          const shieldSize = 18 + Math.sin(progress * Math.PI) * 8;
          ctx.beginPath();
          ctx.arc(vfx.x, vfx.y, shieldSize, 0, Math.PI * 2);
          ctx.stroke();
          if (vfx.emoji) {
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(vfx.emoji, vfx.x, vfx.y - shieldSize - 5);
          }
        }
        
        if (vfx.particles) {
          const pAlpha = Math.max(0, 1 - progress * 1.2);
          vfx.particles.forEach(p => {
            ctx.globalAlpha = pAlpha;
            ctx.fillStyle = p.color;
            const px = vfx.x + p.dx * progress * 2;
            const py = vfx.y + p.dy * progress * 2 - progress * 15;
            const pSize = p.size * (1 - progress * 0.6);
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.5, pSize), 0, Math.PI * 2);
            ctx.fill();
          });
        }
        
        ctx.restore();
        return true;
      });

      // Update game logic
      updateGameLogic();

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, gameboardLoaded]);

  // ── BOSS SPAWN by time (fallback: 90s if no tower destroyed) ──
  const gameStartTimeRef = useRef<number>(0);
  useEffect(() => {
    if (gameState.isPlaying) gameStartTimeRef.current = Date.now();
  }, [gameState.isPlaying]);

  // Enhanced game logic with proper Clash Royale mechanics
  const updateGameLogic = () => {
    const now = Date.now();

    // Time-based boss spawn fallback (90 seconds into battle)
    if (
      gameState.isPlaying &&
      !bossSpawnedRef.current &&
      gameStartTimeRef.current > 0 &&
      now - gameStartTimeRef.current > 90_000
    ) {
      bossSpawnedRef.current = true;
      const boss = getBossForTheme(selectedThemeIdRef.current);
      bossRef.current = boss;
      const bossUnit = bossToUnit(boss, CANVAS_WIDTH, CANVAS_HEIGHT, false);
      setUnits(prev => [...prev, bossUnit as any]);
      setBossMessage(boss.spawnMessage);
      if (bossMessageTimerRef.current) clearTimeout(bossMessageTimerRef.current);
      bossMessageTimerRef.current = setTimeout(() => setBossMessage(null), 5000);
    }

    // Boss enrage check — scan units for boss, check HP, apply enrage
    if (bossRef.current && !bossRef.current.enrageTriggered) {
      const bossUnit = unitsRef.current.find(u => (u as any).isBoss);
      if (bossUnit) {
        bossRef.current.health = bossUnit.health;
        const enraged = checkBossEnrage(bossRef.current);
        if (enraged) {
          // Apply enraged stats to the live unit
          setUnits(prev => prev.map(u =>
            (u as any).isBoss
              ? { ...u, damage: bossRef.current!.attack, speed: bossRef.current!.speed, attackCooldown: bossRef.current!.attackCooldown }
              : u
          ));
          setBossMessage(bossRef.current.phaseLabel);
          if (bossMessageTimerRef.current) clearTimeout(bossMessageTimerRef.current);
          bossMessageTimerRef.current = setTimeout(() => setBossMessage(null), 4000);
        }
      }
    }
    
    // Enhanced projectile system with error handling and cleanup
    setProjectiles(prev => prev.map(projectile => {
      try {
        // Validate projectile properties
        if (!projectile || typeof projectile.x !== 'number' || typeof projectile.y !== 'number' || 
            typeof projectile.targetX !== 'number' || typeof projectile.targetY !== 'number') {
          // Invalid projectile
          return null;
        }
        
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Validate distance calculation
        if (isNaN(distance) || distance < 0) {
          // Invalid distance
          return null;
        }
        
        if (distance < (projectile.speed || 5)) { // Default speed fallback
          // Enhanced projectile hit detection with validation
          setTowers(towers => towers.map(tower => {
            if (!tower || typeof tower.x !== 'number' || typeof tower.y !== 'number') return tower;
            
            try {
              const towerDistance = Math.sqrt((tower.x - projectile.targetX) ** 2 + (tower.y - projectile.targetY) ** 2);
              if (!isNaN(towerDistance) && towerDistance < 50 && tower.isPlayer !== projectile.isPlayer && !tower.destroyed) {
                let damage = projectile.damage || 25;
                
                // TOWER & CASTLE DAMAGE REDUCTION: 0.5x damage as requested
                damage *= 0.5; // All projectiles do 50% damage to towers and castles
                
                // ADDITIONAL TANK RESISTANCE: Extra reduction for tank-type projectiles
                if (projectile.attackType === 'tank' || projectile.cardClass?.includes('tank')) {
                  damage *= 0.8;
                }
                
                const newHealth = Math.max(0, tower.health - damage);
                
                spawnEffect('damage', tower.x, tower.y - 20, damage, projectile.attackType);
                spawnEffect('hit', tower.x, tower.y, undefined, projectile.attackType);
                if (newHealth === 0) spawnEffect('death', tower.x, tower.y);
                // FX: tower beam + damage number
                fxEngineRef.current.emitTowerBeam(projectile.x, projectile.y, tower.x, tower.y,
                  projectile.attackType === 'magical' ? '#a855f7' : projectile.attackType === 'ranged' ? '#fbbf24' : '#ef4444');
                fxEngineRef.current.emitDamageNumber(tower.x, tower.y - 22, damage, false, projectile.attackType);
                if (newHealth === 0) { fxEngineRef.current.emitDeath(tower.x, tower.y); fxEngineRef.current.emitAoERing(tower.x, tower.y, 70, '#ff4400'); }
                
                // FX: spell/ranged impact rings on tower
                if (projectile.attackType === 'magical' || projectile.cardClass?.includes('spell')) {
                  fxEngineRef.current.emitAoERing(tower.x, tower.y, 60, '#a855f7');
                  fxEngineRef.current.emitImpact(tower.x, tower.y, '#c084fc', 'magical');
                } else if (projectile.attackType === 'ranged') {
                  fxEngineRef.current.emitAoERing(tower.x, tower.y, 40, '#fbbf24');
                  fxEngineRef.current.emitImpact(tower.x, tower.y, '#fbbf24', 'ranged');
                }
                
                if (newHealth === 0) {
                  // Record tower destroyed for replay
                  replayRecorder.recordTowerDestroyed(tower.type, tower.isPlayer);
                  replayRecorder.recordCrown(
                    projectile.isPlayer,
                    projectile.isPlayer ? 1 : 0,
                    !projectile.isPlayer ? 1 : 0
                  );
                  setGameState(prev => ({
                    ...prev,
                    playerCrowns: projectile.isPlayer ? prev.playerCrowns + 1 : prev.playerCrowns,
                    enemyCrowns: !projectile.isPlayer ? prev.enemyCrowns + 1 : prev.enemyCrowns
                  }));
                  // ── BOSS SPAWN on first tower destruction ──
                  if (!bossSpawnedRef.current && tower.type !== 'king') {
                    bossSpawnedRef.current = true;
                    const boss = getBossForTheme(selectedThemeIdRef.current);
                    bossRef.current = boss;
                    const bossUnit = bossToUnit(boss, CANVAS_WIDTH, CANVAS_HEIGHT, false);
                    setUnits(prev => [...prev, bossUnit as any]);
                    setBossMessage(boss.spawnMessage);
                    if (bossMessageTimerRef.current) clearTimeout(bossMessageTimerRef.current);
                    bossMessageTimerRef.current = setTimeout(() => setBossMessage(null), 5000);
                  }
                }
                return { ...tower, health: newHealth, destroyed: newHealth === 0 };
              }
            } catch (e) {
              
            }
            return tower;
          }));
          
          // Enhanced unit damage with combat reduction system
          setUnits(units => units.map(unit => {
            if (!unit || typeof unit.x !== 'number' || typeof unit.y !== 'number') return unit;
            
            try {
              const unitDistance = Math.sqrt((unit.x - projectile.targetX) ** 2 + (unit.y - projectile.targetY) ** 2);
              if (!isNaN(unitDistance) && unitDistance < 30 && unit.isPlayer !== projectile.isPlayer) {
                let damage = projectile.damage || 25;
                
                // DAMAGE REDUCTION SYSTEM: Minion vs Minion combat
                if (projectile.attackType === 'ranged') {
                  damage *= 0.4;
                } else if (unit.attackType === 'tank' || unit.cardClass?.includes('tank')) {
                  damage *= 0.75;
                  unit.speed = Math.max(0.3, (unit.speed || 1) * 0.8);
                }
                
                // SHIELD SYSTEM: Check if unit has shield charges
                let actualDamage = damage;
                let updatedUnit = { ...unit };
                
                if (unit.shieldCharges && unit.shieldCharges > 0) {
                  updatedUnit.shieldCharges = unit.shieldCharges - 1;
                  actualDamage = 0;
                  spawnEffect('shield', unit.x, unit.y);
                  
                } else {
                  const newHealth = Math.max(0, unit.health - actualDamage);
                  updatedUnit.health = newHealth;
                  spawnEffect('damage', unit.x, unit.y - 15, actualDamage, projectile.attackType);
                  spawnEffect('hit', unit.x, unit.y, undefined, projectile.attackType);
                  if (newHealth <= 0) spawnEffect('death', unit.x, unit.y);
                  // FX: impact burst + damage number at hit point
                  fxEngineRef.current.emitImpact(unit.x, unit.y, undefined, projectile.attackType);
                  fxEngineRef.current.emitDamageNumber(unit.x, unit.y - 18, actualDamage, false, projectile.attackType);
                  if (newHealth <= 0) fxEngineRef.current.emitDeath(unit.x, unit.y);
                }
                
                return updatedUnit;
              }
            } catch (e) {
              
            }
            return unit;
          }).filter(unit => unit && unit.health > 0));
          
          return null; // Remove projectile after hit
        }
        
        // Enhanced projectile movement with validation
        const speed = projectile.speed || 5;
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;
        
        if (isNaN(moveX) || isNaN(moveY)) {
          
          return null;
        }
        
        const newX = projectile.x + moveX;
        const newY = projectile.y + moveY;
        
        // Remove projectiles that go out of bounds
        if (newX < 0 || newX > CANVAS_WIDTH || newY < 0 || newY > CANVAS_HEIGHT) {
          return null;
        }
        
        return {
          ...projectile,
          x: newX,
          y: newY
        };
      } catch (projectileError) {
        
        return null;
      }
    }).filter(Boolean) as Projectile[]);

    // Enhanced unit AI with error prevention and cleanup
    setUnits(prev => prev.map(unit => {
      if (!unit || typeof unit.x !== 'number' || typeof unit.y !== 'number' || unit.health <= 0) {
        return null;
      }
      
      let u = { ...unit, isAttacking: false };
      
      const shouldRetarget = !u.target || 
          ('destroyed' in u.target && u.target.destroyed) || 
          ('health' in u.target && u.target.health <= 0) ||
          !u.target.x || !u.target.y ||
          (Math.random() < 0.1);
      
      if (shouldRetarget) {
        const enemyUnits = unitsRef.current.filter(eu => eu && eu.isPlayer !== u.isPlayer && eu.health > 0 && eu.x && eu.y);
        const enemyTowers = towersRef.current.filter(t => t && t.isPlayer !== u.isPlayer && !t.destroyed && t.x && t.y);
        
        let nextTarget = null;
        let closestDistance = Infinity;
        
        // STRATEGIC TARGET PRIORITIZATION: Continue the advance
        // PRIORITY 1: Aggressive enemy unit engagement (expanded range)
        const attackRange = (u.range || 40) + 30;
        const highPriorityEnemies = enemyUnits.filter(enemy => {
          const dist = Math.sqrt((enemy.x - u.x) ** 2 + (enemy.y - u.y) ** 2);
          return dist <= attackRange;
        }).sort((a, b) => {
          const distA = Math.sqrt((a.x - u.x) ** 2 + (a.y - u.y) ** 2);
          const distB = Math.sqrt((b.x - u.x) ** 2 + (b.y - u.y) ** 2);
          const healthA = a.health / a.maxHealth;
          const healthB = b.health / b.maxHealth;
          return (distA + healthA * 50) - (distB + healthB * 50); // Prefer closer, weaker enemies
        });
        
        if (highPriorityEnemies.length > 0) {
          nextTarget = highPriorityEnemies[0];
          closestDistance = Math.sqrt((nextTarget.x - u.x) ** 2 + (nextTarget.y - u.y) ** 2);
        }
        
        if (!nextTarget) {
          const extendedRangeEnemies = enemyUnits.filter(enemy => {
            const dist = Math.sqrt((enemy.x - u.x) ** 2 + (enemy.y - u.y) ** 2);
            return dist < 220;
          }).sort((a, b) => {
            const distA = Math.sqrt((a.x - u.x) ** 2 + (a.y - u.y) ** 2);
            const distB = Math.sqrt((b.x - u.x) ** 2 + (b.y - u.y) ** 2);
            
            const ourTowers = towersRef.current.filter(t => t.isPlayer === u.isPlayer && !t.destroyed);
            const threatA = ourTowers.some(tower => {
              const enemyToTower = Math.sqrt((a.x - tower.x) ** 2 + (a.y - tower.y) ** 2);
              return enemyToTower < 150; // Enemy near our towers = high threat
            });
            const threatB = ourTowers.some(tower => {
              const enemyToTower = Math.sqrt((b.x - tower.x) ** 2 + (b.y - tower.y) ** 2);
              return enemyToTower < 150;
            });
            
            const threatBonusA = threatA ? -100 : 0; // Negative = higher priority
            const threatBonusB = threatB ? -100 : 0;
            
            return (distA + threatBonusA) - (distB + threatBonusB);
          });
          
          if (extendedRangeEnemies.length > 0) {
            nextTarget = extendedRangeEnemies[0];
            closestDistance = Math.sqrt((nextTarget.x - u.x) ** 2 + (nextTarget.y - u.y) ** 2);
          }
        }
        
        if (!nextTarget) {
          const unitIsOnLeftSide = u.x < CANVAS_WIDTH / 2;
          const preferredSide = unitIsOnLeftSide ? 'left' : 'right';
          
          // Filter towers to same side first, then any enemy tower
          const sameSideTowers = enemyTowers.filter(tower => {
            const towerIsOnLeft = tower.x < CANVAS_WIDTH / 2;
            return unitIsOnLeftSide === towerIsOnLeft;
          });
          
          const towersToCheck = sameSideTowers.length > 0 ? sameSideTowers : enemyTowers;
          
          let bestTower = null;
          let bestPathDistance = Infinity;
          
          for (const tower of towersToCheck) {
            try {
              const pathInfo = calculateOptimalPath(u, tower);
              if (!isNaN(pathInfo.totalDistance) && pathInfo.totalDistance < bestPathDistance) {
                bestTower = tower;
                bestPathDistance = pathInfo.totalDistance;
              }
            } catch (e) {
            }
          }
          
          if (bestTower) {
            nextTarget = bestTower;
            closestDistance = bestPathDistance;
          }
        }
        
        if (!nextTarget) {
          const allEnemyTowers = towersRef.current.filter(t => t && t.isPlayer !== u.isPlayer && !t.destroyed);
          if (allEnemyTowers.length > 0) {
            const unitIsOnLeftSide = u.x < CANVAS_WIDTH / 2;
            
            // Find tower with optimal path (considering bridges and obstacles)
            let optimalTower = null;
            let optimalPathDistance = Infinity;
            
            for (const tower of allEnemyTowers) {
              const pathInfo = calculateOptimalPath(u, tower);
              // Prioritize crown towers over king tower for easier victory
              const priorityBonus = tower.type === 'king' ? 150 : 0; // Add distance penalty for king tower
              
              // Bonus for staying on same side (lane preference)
              const towerIsOnLeft = tower.x < CANVAS_WIDTH / 2;
              const sameSideBonus = (unitIsOnLeftSide === towerIsOnLeft) ? -50 : 0; // Reduce distance for same side
              
              const adjustedDistance = pathInfo.totalDistance + priorityBonus + sameSideBonus;
              
              if (adjustedDistance < optimalPathDistance) {
                optimalTower = tower;
                optimalPathDistance = adjustedDistance;
              }
            }
            
            if (optimalTower) {
              nextTarget = optimalTower;
            }
          }
        }
        
        if (!nextTarget) {
          const enemyKingTower = towersRef.current.find(t => t.isPlayer !== u.isPlayer && t.type === 'king' && !t.destroyed);
          if (enemyKingTower) {
            nextTarget = enemyKingTower;
          }
        }
        
        u.target = nextTarget;
        
        if (nextTarget) {
          u.lastTargetAcquisition = now;
        } else {
          u.isAdvancing = true;
          u.advanceTarget = u.isPlayer ? 
            { x: CANVAS_WIDTH / 2, y: 100 } :
            { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 };
        }
      }

      if ((u.target && u.target.x && u.target.y) || u.isAdvancing) {
        const actualTarget = u.target || u.advanceTarget;
        if (!actualTarget) return u;
        try {
          const dx = actualTarget.x - u.x;
          const dy = actualTarget.y - u.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (isNaN(distance) || distance < 0) {
            u.target = null;
            u.isAdvancing = false;
            return u;
          }
          
          const canAttackFromRange = u.target && distance <= (u.range || 50);
          const isTargetingTower = u.target && 'destroyed' in u.target;
          
          if (canAttackFromRange) {
            if (now - u.lastAttack > (u.attackCooldown || 1000)) {
              u.isAttacking = true;
              u.lastAttack = now;
              
              let projectileSpeed = 8;
              let projectileEmoji = '💥';
              
              if (u.cardClass && u.cardClass.includes('ranged')) {
                projectileSpeed = 12;
                projectileEmoji = u.isPlayer ? '🏹' : '🔥';
              } else if (u.cardClass && u.cardClass.includes('magical')) {
                projectileSpeed = 15;
                projectileEmoji = u.isPlayer ? '✨' : '⚡';
              } else if (u.cardClass && (u.cardClass.includes('melee') || u.cardClass.includes('tank'))) {
                try {
                  if (u.target && 'health' in u.target && typeof u.target.health === 'number') {
                    const targetId = u.target.id;
                    const baseDamage = u.damage || 50;
                    setUnits(units => units.map(target => {
                      if (target && target.id === targetId) {
                        const targetStats = getBalancedStats(target.cardId || 'default');
                        let finalDamage = targetStats ? 
                          calculateDamage(baseDamage, u.attackType, targetStats, 'unit') : 
                          baseDamage;
                        
                        if (u.attackType === 'ranged') {
                          finalDamage *= 0.4;
                        } else if (target.attackType === 'tank' || target.cardClass?.includes('tank')) {
                          finalDamage *= 0.75;
                        }

                        // 15% critical hit chance — 1.5x damage
                        const isCrit = Math.random() < 0.15;
                        if (isCrit) {
                          finalDamage *= 1.5;
                          spawnEffect('crit', target.x, target.y - 25, finalDamage, u.attackType);
                        }
                        
                        const newHealth = Math.max(0, target.health - finalDamage);
                        spawnEffect('damage', target.x, target.y - 15, finalDamage, u.attackType);
                        spawnEffect('hit', target.x, target.y, undefined, u.attackType);
                        if (newHealth <= 0) spawnEffect('death', target.x, target.y);
                        // FX: slash + impact on melee hit
                        const slashColor = u.attackType === 'tank' ? '#3b82f6' : u.attackType === 'magical' ? '#c084fc' : '#ffffff';
                        fxEngineRef.current.emitSlash(u.x, u.y, target.x, target.y, slashColor);
                        fxEngineRef.current.emitImpact(target.x, target.y, slashColor, u.attackType);
                        fxEngineRef.current.emitDamageNumber(target.x, target.y - 15, finalDamage, isCrit, u.attackType);
                        if (newHealth <= 0) fxEngineRef.current.emitDeath(target.x, target.y);
                        
                        return { ...target, health: newHealth };
                      }
                      return target;
                    }).filter(t => t && t.health > 0));
                  } else if (u.target && 'destroyed' in u.target) {
                    const towerId = u.target.id;
                    setTowers(towers => towers.map(t => {
                      if (t && t.id === towerId && !t.destroyed) {
                        let damage = u.damage || 50;
                        damage *= 0.5;
                        if (u.attackType === 'tank' || u.cardClass?.includes('tank')) {
                          damage *= 1.2;
                        }
                        const newHealth = Math.max(0, t.health - damage);
                        spawnEffect('damage', t.x, t.y - 20, damage, u.attackType);
                        spawnEffect('hit', t.x, t.y, undefined, u.attackType);
                        if (newHealth === 0) spawnEffect('death', t.x, t.y);
                        // FX: slash on melee vs tower
                        const tSlashColor = u.attackType === 'tank' ? '#3b82f6' : '#fff';
                        fxEngineRef.current.emitSlash(u.x, u.y, t.x, t.y, tSlashColor);
                        fxEngineRef.current.emitImpact(t.x, t.y, tSlashColor, u.attackType);
                        fxEngineRef.current.emitDamageNumber(t.x, t.y - 20, damage, false, u.attackType);
                        if (newHealth === 0) { fxEngineRef.current.emitDeath(t.x, t.y); fxEngineRef.current.emitAoERing(t.x, t.y, 55, '#ff8800'); }
                        return { ...t, health: newHealth, destroyed: newHealth === 0 };
                      }
                      return t;
                    }));
                  }
                } catch (damageError) {}
                return u;
              }
              
              if (projectileSpeed > 0 && u.target && u.target.x && u.target.y) {
                const targetStats = getBalancedStats(u.target.cardId || 'default');
                const baseDamage = u.damage || 50;
                let finalDamage = targetStats ? 
                  calculateDamage(baseDamage, u.attackType, targetStats, 'unit') : 
                  baseDamage;
                
                if (isTargetingTower) {
                  finalDamage *= 0.5;
                }
                
                setProjectiles(prev => [...prev, {
                  id: `projectile-${now}-${u.id}`,
                  x: u.x,
                  y: u.y,
                  targetX: u.target!.x,
                  targetY: u.target!.y,
                  damage: finalDamage,
                  speed: projectileSpeed,
                  emoji: projectileEmoji,
                  isPlayer: u.isPlayer,
                  attackType: u.attackType,
                  cardClass: u.cardClass
                }]);
                // FX: visible projectile trail from attacker to target
                if (u.cardClass?.includes('magical') || u.attackType === 'magical') {
                  fxEngineRef.current.emitMagicShot(u.x, u.y, u.target!.x, u.target!.y);
                  fxEngineRef.current.emitMagicCharge(u.x, u.y);
                } else if (u.cardClass?.includes('ranged') || u.attackType === 'ranged') {
                  fxEngineRef.current.emitArrow(u.x, u.y, u.target!.x, u.target!.y);
                }
              }
            }
          } else {
            const unitSpeed = u.speed || 2;
            const directPath = calculateOptimalPath(u, actualTarget as Unit | Tower);
            
            let moveX, moveY;
            if (directPath.needsBridge) {
              // ── Phase 1: Navigate to bridge entrance on own side ──
              const bridgeTarget = directPath.bridgePoint; // entrance waypoint
              if (bridgeTarget) {
                const bridgeEntranceDist = Math.sqrt(
                  (bridgeTarget.x - u.x) ** 2 + (bridgeTarget.y - u.y) ** 2
                );
                if (bridgeEntranceDist > 20) {
                  // Step 1: move laterally + slightly toward river entrance
                  const bDx = bridgeTarget.x - u.x;
                  const bDy = bridgeTarget.y - u.y;
                  const bDist = Math.sqrt(bDx * bDx + bDy * bDy);
                  moveX = (bDx / bDist) * unitSpeed;
                  moveY = (bDy / bDist) * unitSpeed;
                } else {
                  // Step 2: at entrance — drive straight across river along bridge X
                  const crossTarget = directPath.bridgeCrossPoint || { x: bridgeTarget.x, y: CANVAS_HEIGHT / 2 };
                  const cDx = crossTarget.x - u.x;
                  const cDy = dx; // continue toward target Y direction  
                  moveX = (bridgeTarget.x - u.x) * 0.1; // snap to bridge X gently
                  moveY = (u.y < CANVAS_HEIGHT / 2 ? 1 : -1) * unitSpeed * 1.4; // push through river
                }
              } else {
                moveX = (dx / distance) * unitSpeed;
                moveY = (dy / distance) * unitSpeed;
              }
            } else {
              moveX = (dx / distance) * unitSpeed;
              moveY = (dy / distance) * unitSpeed;
            }
            
            let newX = u.x + moveX;
            let newY = u.y + moveY;
            
            if (isNaN(newX) || isNaN(newY)) {
              newX = u.x + (Math.random() - 0.5) * 2;
              newY = u.y + (Math.random() - 0.5) * 2;
            }
            
            if (u.isAdvancing && distance < 40) {
              u.isAdvancing = false;
              u.advanceTarget = null;
              u.target = null;
            }

            // ── RIVER GATE: block passage except through bridge corridors ──
            const centerY = CANVAS_HEIGHT / 2;
            const crossingRiver = (
              (u.y < centerY - RIVER_HALF_H && newY >= centerY - RIVER_HALF_H) ||
              (u.y > centerY + RIVER_HALF_H && newY <= centerY + RIVER_HALF_H)
            );
            if (crossingRiver && !isInBridgeCorridor(newX)) {
              // Block crossing — redirect to nearest bridge
              const bx = nearestBridgeX(newX);
              const bDx = bx - u.x;
              const bDist = Math.abs(bDx);
              if (bDist > 5) {
                newX = u.x + (bDx / bDist) * unitSpeed;
              }
              newY = u.y; // stay on same side until aligned with bridge
            }
            
            u.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, newX));
            u.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, newY));
          }
        } catch (movementError) {
          const centerX = CANVAS_WIDTH / 2;
          const centerY = CANVAS_HEIGHT / 2;
          u.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, u.x + (centerX > u.x ? 1 : -1)));
          u.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, u.y + (centerY > u.y ? 1 : -1)));
        }
      } else {
        const isAIUnit = !u.isPlayer;
        const moveDirection = isAIUnit ? 1 : -1;
        const advanceSpeed = (u.speed || 1.5) * 0.8;
        u.y += moveDirection * advanceSpeed;
        u.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, u.x));
        u.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, u.y));
      }

      return u;
    }).filter((unit): unit is Unit => unit !== null && unit.health > 0));

    // Tower defensive attacks - use ref for fresh unit positions
    setTowers(prev => prev.map(tower => {
      if (tower.destroyed) return tower;
      
      const enemyUnits = unitsRef.current.filter(u => u.isPlayer !== tower.isPlayer && u.health > 0);
      if (enemyUnits.length > 0 && now - tower.lastAttack > tower.attackCooldown) {
        // Find closest enemy in range
        let target = null;
        let closestDistance = Infinity;
        
        for (const unit of enemyUnits) {
          const dist = Math.sqrt((unit.x - tower.x) ** 2 + (unit.y - tower.y) ** 2);
          if (dist <= tower.range && dist < closestDistance) {
            target = unit;
            closestDistance = dist;
          }
        }
        
        if (target) {
          tower.lastAttack = now;
          
          // Tower projectile
          setProjectiles(prev => [...prev, {
            id: `tower-projectile-${now}-${tower.id}`,
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            damage: tower.damage,
            speed: 12,
            emoji: tower.isPlayer ? '💚' : '💀',
            isPlayer: tower.isPlayer
          }]);
        }
      }
      
      return tower;
    }));

    // Card cycling: draw every 5 seconds when hand has space (uses refs for fresh data)
    const handSize = currentHandRef.current.length;
    const lastDraw = lastCardDrawRef.current;
    const currentDeckIdx = deckIndexRef.current;
    const deck = playerDeckRef.current;
    
    if (now - lastDraw > 5000 && handSize < 4 && deck.length > 0) {
      if (currentDeckIdx < deck.length) {
        const newCard = deck[currentDeckIdx];
        setCurrentHand(prev => prev.length < 4 ? [...prev, newCard] : prev);
        setDeckIndex(currentDeckIdx + 1);
        setLastCardDraw(now);
      } else {
        const randomCard = deck[Math.floor(Math.random() * deck.length)];
        setCurrentHand(prev => prev.length < 4 ? [...prev, randomCard] : prev);
        setDeckIndex(0);
        setLastCardDraw(now);
      }
    }

    // ─── ENHANCED AI STRATEGIC DEPLOYMENT ────────────────────────────────
    const gs = gameStateRef.current;
    if (gs.aiElixir >= 2) {
      const currentUnitsForAI = unitsRef.current;
      const currentTowersForAI = towersRef.current;
      const playerUnitsAI = currentUnitsForAI.filter(u => u.isPlayer);
      const aiUnitsAI = currentUnitsForAI.filter(u => !u.isPlayer);
      const elixirAdvantage = gs.aiElixir - gs.playerElixir;
      const timeRemaining = gs.timeLeft;
      const crownAdvantage = gs.enemyCrowns - gs.playerCrowns;

      // ── Lane preference: AI pushes the lane where player's tower is weaker ──
      const playerLeftTower = currentTowersForAI.find(t => t.isPlayer && !t.destroyed && t.x < CANVAS_WIDTH / 2 && t.type === 'crown');
      const playerRightTower = currentTowersForAI.find(t => t.isPlayer && !t.destroyed && t.x >= CANVAS_WIDTH / 2 && t.type === 'crown');
      if (!playerLeftTower && playerRightTower) {
        aiPreferredLaneRef.current = 'right'; // Left destroyed, push right
      } else if (!playerRightTower && playerLeftTower) {
        aiPreferredLaneRef.current = 'left'; // Right destroyed, push left
      } else if (playerLeftTower && playerRightTower) {
        // Push the weaker side every 20s
        if (now % 20000 < 200) {
          aiPreferredLaneRef.current = playerLeftTower.health < playerRightTower.health ? 'left' : 'right';
        }
      }

      // ── Reactive defense: respond immediately when player deploys ──
      const timeSincePlayerDeploy = now - lastPlayerDeployRef.current;
      const playerNearAITower = playerUnitsAI.some(u => u.y < CANVAS_HEIGHT * 0.4);
      const reactiveDefense = timeSincePlayerDeploy < 1500 && playerNearAITower && gs.aiElixir >= 3;

      // ── Threat analysis ──
      const playerAvgY = playerUnitsAI.length > 0 ?
        playerUnitsAI.reduce((sum, u) => sum + u.y, 0) / playerUnitsAI.length : CANVAS_HEIGHT;
      const threatLevel = playerAvgY < CANVAS_HEIGHT * 0.45 ? 'CRITICAL' : playerAvgY < CANVAS_HEIGHT * 0.6 ? 'HIGH' : 'MEDIUM';

      // ── Base deployment chance with tactical modifiers ──
      let baseDeploymentChance = 0.009;
      if (threatLevel === 'CRITICAL') baseDeploymentChance *= 2.5;
      else if (threatLevel === 'HIGH') baseDeploymentChance *= 1.6;
      if (reactiveDefense) baseDeploymentChance *= 3.0;
      if (crownAdvantage < 0) baseDeploymentChance *= 1.4;
      if (timeRemaining < 60) baseDeploymentChance *= 1.8;
      if (playerUnitsAI.length > aiUnitsAI.length + 1) baseDeploymentChance *= 1.5;
      if (elixirAdvantage > 2) baseDeploymentChance *= 1.2;
      if (gs.aiElixir >= 8) baseDeploymentChance *= 1.5;
      if (crownAdvantage < -1) baseDeploymentChance *= 2.0;

      // ── Group push: deploy 2 cards in quick succession every ~30s ──
      const timeSinceGroupPush = now - lastGroupPushRef.current;
      if (timeSinceGroupPush > 30000 && gs.aiElixir >= 6 && Math.random() < 0.04) {
        lastGroupPushRef.current = now;
        deployAIUnit();
        setTimeout(() => deployAIUnit(), 600); // Second card 0.6s later
      } else if (Math.random() < baseDeploymentChance) {
        deployAIUnit();
      }
    }

    // Check for king tower destruction = instant 3-crown win
    const currentTowersCheck = towersRef.current;
    const playerKingDestroyed = currentTowersCheck.some(t => t.isPlayer && t.type === 'king' && t.destroyed);
    const aiKingDestroyed = currentTowersCheck.some(t => !t.isPlayer && t.type === 'king' && t.destroyed);
    
    setGameState(prev => {
      if (prev.winner) return prev;
      
      const newTimeLeft = Math.max(0, prev.timeLeft - 1/60);
      
      let playerCrowns = prev.playerCrowns;
      let enemyCrowns = prev.enemyCrowns;
      
      if (aiKingDestroyed && playerCrowns < 3) playerCrowns = 3;
      if (playerKingDestroyed && enemyCrowns < 3) enemyCrowns = 3;
      
      const gameOver = newTimeLeft <= 0 || playerCrowns >= 3 || enemyCrowns >= 3;
      
      if (gameOver) {
        let winner: 'player' | 'ai';
        if (playerCrowns > enemyCrowns) {
          winner = 'player';
        } else if (enemyCrowns > playerCrowns) {
          winner = 'ai';
        } else {
          const playerTowerHP = currentTowersCheck.filter(t => t.isPlayer && !t.destroyed).reduce((sum, t) => sum + t.health, 0);
          const aiTowerHP = currentTowersCheck.filter(t => !t.isPlayer && !t.destroyed).reduce((sum, t) => sum + t.health, 0);
          winner = playerTowerHP >= aiTowerHP ? 'player' : 'ai';
        }
        
        // Save replay record
        const trophyChange = winner === 'player'
          ? (difficulty === 'hard' ? 30 : difficulty === 'medium' ? 15 : 5)
          : (difficulty === 'hard' ? -10 : difficulty === 'medium' ? -5 : -2);
        replayRecorder.save({
          winner,
          difficulty,
          teamName: playerDeck[0]?.name ? 'THC Warriors' : 'THC Warriors',
          playerCrowns,
          enemyCrowns,
          playerDeckNames: playerDeck.map(c => c.name),
          trophyChange,
        });

        setTimeout(() => {
          onBattleEnd(winner, {
            playerCrowns,
            enemyCrowns,
            timeLeft: newTimeLeft,
            nftBonus: nftData?.bonuses?.attackBonus || 0
          });
        }, 1000);
        
        return { ...prev, timeLeft: newTimeLeft, playerCrowns, enemyCrowns, winner, phase: 'results' };
      }
      
      // Dynamic elixir regen: slow at start, speeds up in final minute (double elixir)
      const elixirRate = newTimeLeft > 60
        ? 0.017  // ~1.0/s first two minutes
        : newTimeLeft > 0
          ? 0.034  // ~2.0/s double elixir last minute
          : 0.056; // ~3.3/s overtime sudden death

      return {
        ...prev,
        timeLeft: newTimeLeft,
        playerCrowns,
        enemyCrowns,
        playerElixir: Math.min(10, prev.playerElixir + elixirRate),
        aiElixir: Math.min(10, prev.aiElixir + elixirRate),
        enemyElixir: Math.min(10, prev.aiElixir + elixirRate)
      };
    });
  };

  // Enhanced card deployment with proper mechanics
  const deployCard = (card: BattleCard, x: number, y: number) => {
    if (gameState.playerElixir < card.cost) return;
    
    // Apply NFT bonuses
    const attackBonus = nftData?.bonuses?.attackBonus || 0;
    
    // Get balanced stats for the card
    const balancedStats = getBalancedStats(card.id);
    const cardTier = getCardTier(card.id);
    
    // Determine unit stats based on balanced system
    let range = 40; // Default melee range
    let speed = 0.9; // Base speed with 40% reduction applied
    let attackCooldown = 1500; // Base cooldown
    let attackType: 'ranged' | 'melee' | 'magical' | 'tank' = 'melee';
    
    // Apply balanced stats if available
    if (balancedStats) {
      speed = 0.6 * balancedStats.speedMultiplier; // Apply 40% reduction to balanced speed
      range = Math.round(40 * balancedStats.rangeModifier);
      
      if (card.class.includes('ranged')) {
        attackType = 'ranged';
        attackCooldown = 1000;
      } else if (card.class.includes('tank')) {
        attackType = 'tank';
        attackCooldown = 2000;
      } else if (card.class.includes('spell') || card.class.includes('magical')) {
        attackType = 'magical';
        attackCooldown = 800;
      }
    } else {
      // Fallback to original system if balanced stats not found
      if (card.class.includes('ranged')) {
        range = 100;
        attackType = 'ranged';
        attackCooldown = 1000;
        speed = 0.72;
      } else if (card.class.includes('tank')) {
        range = 35;
        attackType = 'tank';
        attackCooldown = 2000;
        speed = 0.48;
      } else if (card.class.includes('spell')) {
        attackType = 'magical';
        range = 120;
        attackCooldown = 800;
        speed = 1.08;
      }
    }
    
    // Check if it's a tower-type card
    if (card.type === 'tower' || card.name.toLowerCase().includes('tower')) {
      // Deploy as a defensive tower
      const tower: Tower = {
        id: `tower-card-${Date.now()}`,
        x,
        y,
        health: card.health + (nftData?.bonuses?.attackBonus || 0) * 2,
        maxHealth: card.health + (nftData?.bonuses?.attackBonus || 0) * 2,
        type: 'tower-card',
        isPlayer: true,
        destroyed: false,
        range: 120,
        damage: card.attack + attackBonus,
        lastAttack: 0,
        attackCooldown: 1200,
        cardId: card.id
      };
      
      setTowers(prev => [...prev, tower]);
    } else {
      // Deploy as a unit with enhanced abilities and balanced stats
      const enhancement = getCardEnhancement(card.id);
      const finalHealth = balancedStats ? balancedStats.health : card.health;
      const finalDamage = (balancedStats ? balancedStats.attack : card.attack) + attackBonus;
      
      // Initialize shield charges based on balanced stats
      const shieldCharges = balancedStats?.shieldCharges || 0;

      const unit: Unit = {
        id: `unit-${Date.now()}`,
        x,
        y,
        health: finalHealth,
        maxHealth: finalHealth,
        damage: finalDamage,
        speed,
        isPlayer: true,
        cardId: card.id,
        target: null,
        lastAttack: 0,
        range,
        lane: x < CANVAS_WIDTH / 2 ? 'left' : 'right',
        attackType,
        shieldCharges,
        maxShieldCharges: shieldCharges,
        cardClass: card.class,
        cardType: card.type,
        deployTime: Date.now(),
        attackCooldown,
        isAttacking: false,
        // Enhanced abilities initialization
        primaryAbilityLastUsed: 0,
        passiveAbilityActive: enhancement?.passiveAbility ? true : false,
        statusEffects: [],
        animationState: getAnimationByType(card.id, 'deploy'),
        enhancedStats: {
          speedBoost: 0,
          damageBoost: 0,
          armorBoost: 0,
          healing: 0
        }
      };
      
      setUnits(prev => [...prev, unit]);
      // Track deploy time for AI reactive defense
      lastPlayerDeployRef.current = Date.now();
      // FX: player deploy stamp
      fxEngineRef.current.emitDeploy(x, y, true);
      // Record deploy event for replay
      replayRecorder.recordDeploy(card, x, y, true);
      if (shieldCharges > 0) {
      }
      if (balancedStats) {
      }
    }
    
    // Remove card from hand and reduce elixir (normal card game system)
    setCurrentHand(prev => {
      const cardIndex = prev.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        // Remove only the first matching card (allows duplicates)
        const newHand = [...prev];
        newHand.splice(cardIndex, 1);
        return newHand;
      }
      return prev;
    });
    setGameState(prev => ({ ...prev, playerElixir: prev.playerElixir - card.cost }));
  };

  const deployAIUnit = () => {
    const currentGS = gameStateRef.current;
    const currentAIDeck = aiDeckRef.current;
    const affordableCards = currentAIDeck.filter(card => card.cost <= currentGS.aiElixir);
    if (affordableCards.length === 0) {
      
      return;
    }
    
    // AI strategic card selection based on elixir efficiency
    const preferredCards = affordableCards.sort((a, b) => {
      const aValue = (a.attack + a.health) / a.cost; // Damage-per-elixir ratio
      const bValue = (b.attack + b.health) / b.cost;
      return bValue - aValue; // Prefer higher efficiency
    });
    
    // Choose from top 3 most efficient cards for variety
    const topCards = preferredCards.slice(0, Math.min(3, preferredCards.length));
    const aiCard = topCards[Math.floor(Math.random() * topCards.length)];
    
    if (aiCard && currentGS.aiElixir >= aiCard.cost) {
      // AI deploys in the preferred lane for strategic pressure
      const preferredLane = aiPreferredLaneRef.current;
      const deployX = preferredLane === 'left'
        ? 100 + Math.random() * 220   // Left lane (100-320px)
        : 380 + Math.random() * 220;  // Right lane (380-600px)
      const deployY = 140 + Math.random() * 90; // Top territory (140-230px from top)
      
      let range = 40;
      let speed = 1.5;
      let attackCooldown = 1500;
      let attackType: 'ranged' | 'melee' | 'magical' | 'tank' = 'melee';
      
      if (aiCard.class.includes('ranged')) {
        range = 100;
        attackType = 'ranged';
        attackCooldown = 1000;
        speed = 1.2;
      } else if (aiCard.class.includes('tank')) {
        range = 35;
        attackType = 'tank';
        attackCooldown = 2000;
        speed = 0.8;
      }
      
      // AI USES SAME BALANCED STATS AS PLAYER (no captain bonus)
      const balancedStats = getBalancedStats(aiCard.id);
      const finalAttack = balancedStats ? balancedStats.attack : aiCard.attack;
      const finalHealth = balancedStats ? balancedStats.health : aiCard.health;
      
      // Apply same speed reductions as player
      if (balancedStats) {
        speed = 0.6 * balancedStats.speedMultiplier; // Same 40% reduction
        range = Math.round(40 * balancedStats.rangeModifier);
      }

      // Initialize shield charges for AI units too
      const shieldCharges = balancedStats?.shieldCharges || 0;

      const aiUnit: Unit = {
        id: `ai-unit-${Date.now()}`,
        x: deployX,
        y: deployY,
        health: finalHealth,
        maxHealth: finalHealth,
        damage: finalAttack,
        speed,
        isPlayer: false,
        cardId: aiCard.id,
        target: null,
        lastAttack: 0,
        range,
        lane: deployX < CANVAS_WIDTH / 2 ? 'left' : 'right',
        attackType,
        cardClass: aiCard.class,
        cardType: aiCard.type,
        deployTime: Date.now(),
        attackCooldown,
        isAttacking: false,
        shieldCharges,
        maxShieldCharges: shieldCharges
      };
      
      setUnits(prev => [...prev, aiUnit]);
      // FX: AI deploy stamp (red for enemy)
      fxEngineRef.current.emitDeploy(deployX, deployY, false);
      setGameState(prev => ({ 
        ...prev, 
        aiElixir: prev.aiElixir - aiCard.cost,
        enemyElixir: prev.aiElixir - aiCard.cost
      }));
      
      
    }
  };

  const [selectedCard, setSelectedCard] = useState<BattleCard | null>(null);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const MIN_ZOOM = 0.55;
  const MAX_ZOOM = 2.4;

  const applyZoom = (nextZoom: number) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    zoomLevelRef.current = clamped;
    setZoomLevel(clamped);
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    applyZoom(zoomLevelRef.current + delta);
  };

  const handlePinchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoomRef.current = zoomLevelRef.current;
    }
  };

  const handlePinchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchStartDistRef.current;
      applyZoom(pinchStartZoomRef.current * ratio);
    }
  };

  const handlePinchEnd = () => {
    pinchStartDistRef.current = null;
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const card = draggedCard || selectedCard;
    if (!card) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    if (coords.y > CANVAS_HEIGHT / 2 && coords.x > 50 && coords.x < CANVAS_WIDTH - 50) {
      deployCard(card, coords.x, coords.y);
    }
    setDraggedCard(null);
    setSelectedCard(null);
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectedCard) return;
    if (gameState.playerElixir < selectedCard.cost) {
      setSelectedCard(null);
      return;
    }
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;
    if (coords.y > CANVAS_HEIGHT / 2 && coords.x > 50 && coords.x < CANVAS_WIDTH - 50) {
      deployCard(selectedCard, coords.x, coords.y);
      setSelectedCard(null);
    }
  };

  const handleCardSelect = (card: BattleCard) => {
    if (gameState.playerElixir >= card.cost) {
      setSelectedCard(prev => prev?.id === card.id ? null : card);
    }
  };

  const handleCardDragStart = (card: BattleCard) => {
    if (gameState.playerElixir >= card.cost) {
      setDraggedCard(card);
    }
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
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
          <h2 className="text-3xl font-bold text-white mb-4">
            {gameState.winner === 'player' ? '🎉 Victory!' : '💪 Good Battle!'}
          </h2>
          <div className="text-lg text-gray-300 mb-6">
            <div>Your Crowns: {gameState.playerCrowns}</div>
            <div>AI Crowns: {gameState.enemyCrowns}</div>
            {nftData?.bonuses?.attackBonus && (
              <div className="text-green-400">NFT Bonus: +{nftData.bonuses.attackBonus} ATK</div>
            )}
          </div>
          <button
            onClick={() => onBattleEnd(gameState.winner!, {})}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Continue
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900 to-black">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBattleEnd('ai', {})}
            className="flex items-center gap-2 text-white hover:text-green-400"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit Battle
          </button>
          {spriteGenStatus === 'generating' && (
            <span className="text-xs bg-green-900/80 border border-green-500/50 text-green-300 px-2 py-0.5 rounded-full animate-pulse">
              🌿 Generating battle sprites…
            </span>
          )}
          {spriteGenStatus === 'done' && (
            <span className="text-xs bg-green-900/60 border border-green-600/40 text-green-400 px-2 py-0.5 rounded-full">
              🌿 Sprites ready
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-6 text-white">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-red-400" />
            <span>{gameState.enemyCrowns}</span>
          </div>
          
          <div className="flex flex-col items-center gap-0.5">
            {gameState.timeLeft <= 0 && (
              <span className="text-xs font-extrabold text-orange-400 animate-pulse tracking-widest uppercase">Overtime!</span>
            )}
            {gameState.timeLeft > 0 && gameState.timeLeft <= 60 && (
              <span className="text-xs font-bold text-blue-300 animate-pulse tracking-wide uppercase">2x Elixir</span>
            )}
            <div className="flex items-center gap-2">
              <Timer className="w-6 h-6 text-yellow-400" />
              <span className={`text-lg font-bold drop-shadow-lg ${
                gameState.timeLeft <= 0 ? 'text-orange-400' :
                gameState.timeLeft <= 60 ? 'text-blue-300' : 'text-yellow-400'
              }`}>
                {gameState.timeLeft <= 0 ? 'OT' :
                  `${Math.floor(gameState.timeLeft / 60)}:${Math.floor(gameState.timeLeft % 60).toString().padStart(2, '0')}`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-green-400" />
            <span>{gameState.playerCrowns}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>{Math.floor(gameState.playerElixir)}/10</span>
          </div>
          {nftData?.bonuses?.attackBonus && (
            <div className="flex items-center gap-1 text-green-400">
              <Shield className="w-4 h-4" />
              <span>+{nftData.bonuses.attackBonus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Canvas - full viewport fit with zoom */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        style={{
          background: `
            radial-gradient(ellipse at 20% 15%, ${getTheme(selectedThemeId).topZoneColor}88 0%, transparent 55%),
            radial-gradient(ellipse at 80% 85%, ${getTheme(selectedThemeId).bottomZoneColor}88 0%, transparent 55%),
            radial-gradient(ellipse at 50% 50%, ${getTheme(selectedThemeId).bgGradient[0]}cc 0%, ${getTheme(selectedThemeId).bgGradient[1]} 100%)
          `
        }}
        ref={canvasWrapperRef}
        onWheel={handleWheelZoom}
        onTouchStart={handlePinchStart}
        onTouchMove={handlePinchMove}
        onTouchEnd={handlePinchEnd}
      >
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 z-30 flex flex-col gap-1">
          <button
            onClick={() => applyZoom(zoomLevelRef.current + 0.15)}
            className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white font-bold rounded-lg border border-white/20 flex items-center justify-center text-lg leading-none transition-all hover:scale-110 select-none"
            title="Zoom in"
          >+</button>
          <button
            onClick={() => applyZoom(1.0)}
            className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white/70 rounded-lg border border-white/20 flex items-center justify-center text-[10px] font-mono transition-all hover:scale-110 select-none"
            title="Reset zoom"
          >{Math.round(zoomLevel * 100)}%</button>
          <button
            onClick={() => applyZoom(zoomLevelRef.current - 0.15)}
            className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white font-bold rounded-lg border border-white/20 flex items-center justify-center text-lg leading-none transition-all hover:scale-110 select-none"
            title="Zoom out"
          >−</button>
        </div>

        <div className="relative flex justify-center" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.1s ease-out' }}>
          {!gameboardLoaded && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                <div>Loading Gameboard...</div>
              </div>
            </div>
          )}
          {isGeneratingTheme && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
              <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
              Generating {getTheme(selectedThemeId).icon} map...
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={`border-4 rounded-lg shadow-2xl ${selectedCard ? 'border-dashed border-yellow-400' : 'border-yellow-600/80'}`}
            style={{
              touchAction: 'none',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 280px)',
              width: 'auto',
              height: 'auto',
              display: 'block',
              boxShadow: `0 0 40px 8px ${getTheme(selectedThemeId).riverColor}44, 0 8px 32px rgba(0,0,0,0.6)`
            }}
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={handleCanvasClick}
            onTouchEnd={(e) => {
              if (!selectedCard) return;
              const touch = e.changedTouches[0];
              if (!touch) return;
              const coords = getCanvasCoords(touch.clientX, touch.clientY);
              if (!coords) return;
              if (coords.y > CANVAS_HEIGHT / 2 && coords.x > 50 && coords.x < CANVAS_WIDTH - 50) {
                deployCard(selectedCard, coords.x, coords.y);
                setSelectedCard(null);
              }
            }}
          />
          {/* FX overlay canvas — effects engine renders here, pointer-events off */}
          <canvas
            ref={fxCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              position: 'absolute',
              top: 0, left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 280px)',
              width: 'auto',
              height: 'auto',
              pointerEvents: 'none',
              display: 'block',
              borderRadius: '0.5rem',
            }}
          />
          {selectedCard && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-yellow-300 text-sm px-3 py-1 rounded-full animate-pulse pointer-events-none">
              Tap battlefield to deploy {selectedCard.name}
            </div>
          )}

          {/* ── BOSS ANNOUNCEMENT BANNER ── */}
          <AnimatePresence>
            {bossMessage && (
              <motion.div
                initial={{ opacity: 0, y: -40, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className="bg-black/90 border-2 border-yellow-400 rounded-xl px-6 py-3 text-center shadow-2xl shadow-yellow-500/30">
                  <div className="text-yellow-300 font-extrabold text-lg tracking-wide drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">
                    {bossMessage}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BOSS HEALTH BAR ── */}
          {bossRef.current && (() => {
            const bossUnit = units.find(u => (u as any).isBoss);
            if (!bossUnit) return null;
            const hp = bossUnit.health / bossUnit.maxHealth;
            const boss = bossRef.current!;
            return (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-72 z-40 pointer-events-none">
                <div className="bg-black/85 border border-yellow-500/60 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-yellow-300 font-bold text-xs tracking-wide">
                      {(boss as any).bossEmoji || '👹'} {boss.name}
                    </span>
                    <span className={`text-xs font-bold ${ boss.isEnraged ? 'text-red-400 animate-pulse' : 'text-gray-300' }`}>
                      {boss.isEnraged ? '🔥 ENRAGED' : 'BOSS'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${ boss.isEnraged ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-yellow-300' }`}
                      style={{ width: `${Math.max(0, hp * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="text-gray-400 text-[10px] text-right mt-0.5">
                    {Math.round(bossUnit.health).toLocaleString()} / {bossUnit.maxHealth.toLocaleString()} HP
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Bottom Panel - theme picker pre-battle / hand cards during battle */}
      <div className={`bg-gradient-to-r ${getTheme(selectedThemeId).uiBg} border-t-2 ${getTheme(selectedThemeId).uiBorder} p-3 min-h-[150px]`}>
        {!gameState.isPlaying ? (
          <div>
            {/* Map Theme Picker */}
            <div className="mb-3">
              <p className="text-gray-400 text-xs text-center mb-2 uppercase tracking-widest">Choose Map Theme</p>
              <div className="grid grid-cols-6 gap-1.5">
                {MAP_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedThemeId(theme.id);
                      selectedThemeIdRef.current = theme.id;
                    }}
                    className={`flex flex-col items-center py-1.5 px-1 rounded-lg border transition-all text-center ${
                      selectedThemeId === theme.id
                        ? 'border-yellow-400 bg-yellow-900/40 scale-105 shadow-lg shadow-yellow-400/20'
                        : 'border-white/15 hover:border-white/40 bg-white/5'
                    }`}
                    title={theme.description}
                  >
                    <span className="text-xl leading-none">{theme.icon}</span>
                    <span className="text-white text-[9px] mt-1 leading-tight font-medium">{theme.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
              {selectedThemeId !== 'cannabis' && (
                <div className="text-center mt-1">
                  {isGeneratingTheme ? (
                    <span className="text-xs text-yellow-400 animate-pulse">✨ Generating AI background…</span>
                  ) : themeImageRef.current ? (
                    <span className="text-xs text-green-400">✅ AI map ready</span>
                  ) : puterReady ? (
                    <button
                      onClick={() => generateThemeBackground(selectedThemeId)}
                      className="text-xs text-blue-400 underline hover:text-blue-300"
                    >
                      Generate AI background
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">Loading AI engine…</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-center">
              {!gameboardLoaded ? (
                <div className="text-white text-sm">⏳ Loading gameboard…</div>
              ) : (
                <button
                  onClick={startBattle}
                  className="px-8 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all transform hover:scale-105 text-sm shadow-lg"
                >
                  🔥 START BATTLE 🔥
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Battle Stats Bar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-purple-400">
                  <Zap className="w-5 h-5" />
                  <span className="font-bold text-lg">{Math.floor(gameState.playerElixir * 10) / 10}/10</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Timer className="w-5 h-5" />
                  <span className="font-bold">{Math.floor(gameState.timeLeft / 60)}:{Math.floor(gameState.timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
              
              <div className="text-white text-sm">
                Hand: {currentHand.length}/4 cards
              </div>
            </div>
            
            {/* FIXED 4-CARD HAND POSITIONS - Stable Placeholders */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((slotIndex) => {
                const card = currentHand[slotIndex];
                const canAfford = card && gameState.playerElixir >= card.cost;
                return (
                  <div
                    key={`slot-${slotIndex}`}
                    className="relative w-20 h-28 rounded-lg overflow-hidden"
                  >
                    {card ? (
                      <motion.div
                        key={card.id}
                        initial={{ y: 60, opacity: 0, scale: 0.7 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: slotIndex * 0.06 }}
                        draggable
                        onDragStart={() => handleCardDragStart(card)}
                        onDragEnd={handleCardDragEnd}
                        onClick={() => handleCardSelect(card)}
                        onTouchEnd={(e) => { e.preventDefault(); handleCardSelect(card); }}
                        className={`
                          w-full h-full cursor-pointer
                          border-2 transition-all duration-300 rounded-lg overflow-hidden
                          ${selectedCard?.id === card.id
                            ? 'opacity-100 border-yellow-400 scale-110 shadow-lg shadow-yellow-400/40 ring-2 ring-yellow-300'
                            : canAfford
                              ? 'opacity-100 border-green-400 hover:border-green-300 hover:scale-110 shadow-lg shadow-green-400/20' 
                              : 'opacity-60 border-gray-600 cursor-not-allowed'
                          }
                        `}
                        animate={canAfford ? {
                          y: 0,
                          boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 12px rgba(74,222,128,0.6)', '0 0 0px rgba(74,222,128,0)'],
                        } : { y: 0 }}
                        whileHover={canAfford ? { y: -8, scale: 1.08 } : {}}
                        whileTap={{ scale: 0.93 }}
                      >
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2332CD32"/><text x="50" y="55" font-size="30" text-anchor="middle" fill="white">🌿</text></svg>';
                          }}
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
                    ) : (
                      // EMPTY SLOT PLACEHOLDER
                      <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg bg-gray-900/50 flex items-center justify-center">
                        <div className="text-gray-500 text-xs text-center">
                          <div className="text-lg">📱</div>
                          <div>Card {slotIndex + 1}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}