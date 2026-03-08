import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, Pause, RotateCcw, Zap, Crown, Shield, Swords, Move, Maximize, Grid3X3, Download, Save, Gamepad2, Target, Layers, MapPin, Cpu, Database, Code, Palette, Sparkles, Eye, MousePointer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import UniversalHeader from './UniversalHeader';

// Game element types
interface GameElement {
  id: string;
  type: 'castle' | 'tower' | 'bridge' | 'drop_area' | 'river' | 'wall';
  x: number;
  y: number;
  width?: number;
  height?: number;
  team: 'player' | 'ai' | 'neutral';
  health?: number;
  maxHealth?: number;
  clickable: boolean;
  draggable?: boolean;
  resizable?: boolean;
}

// Card interface for testing
interface TestCard {
  id: string;
  name: string;
  attack: number;
  health: number;
  cost: number;
  speed: number;
  type: 'spell' | 'magical' | 'ranged' | 'tank' | 'melee' | 'tower';
  class: string;
  rarity: string;
  image: string;
}

// Minion instance for gameplay
interface Minion {
  id: string;
  cardId: string;
  x: number;
  y: number;
  team: 'player' | 'ai';
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  type: string;
  targetId?: string;
  lastAttack: number;
}

interface AdminGameInterfaceProps {
  onNavigate?: (path: string) => void;
  user?: any;
  onLogout?: () => void;
}

export default function AdminGameInterface({ onNavigate, user, onLogout }: AdminGameInterfaceProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameElements, setGameElements] = useState<GameElement[]>([]);
  const [minions, setMinions] = useState<Minion[]>([]);
  const [selectedCard, setSelectedCard] = useState<TestCard | null>(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [cardSettings, setCardSettings] = useState({
    speed: 1,
    attack: 100,
    health: 200,
    type: 'melee' as const,
    class: 'warrior'
  });

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizedElement, setResizedElement] = useState<string | null>(null);

  // New board editor controls
  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Game Systems Configuration
  const [gameConfig, setGameConfig] = useState({
    elixirSystem: {
      startingElixir: 5,
      maxElixir: 10,
      regenRate: 2.8,
      enabled: true
    },
    battleSystem: {
      battleTime: 180,
      overtimeTime: 60,
      damageMultiplier: 1.0,
      enabled: true
    },
    aiSystem: {
      difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
      reactionTime: 1.5,
      cardCycleSpeed: 2.0,
      adaptiveStrategy: true
    },
    cardSystem: {
      handSize: 4,
      deckSize: 8,
      cycleOnPlay: true,
      rarityWeights: {
        common: 0.6,
        rare: 0.25,
        epic: 0.12,
        legendary: 0.03
      }
    },
    economySystem: {
      victoryReward: 100,
      participationReward: 25,
      streakBonus: 10,
      enabled: true
    }
  });

  // Visual/Audio Systems
  const [visualConfig, setVisualConfig] = useState({
    animations: true,
    particles: true,
    soundEffects: true,
    backgroundMusic: true,
    screenShake: true,
    quality: 'high' as 'low' | 'medium' | 'high' | 'ultra'
  });

  // Advanced Canvas Tools
  const [canvasTools, setCanvasTools] = useState({
    snapToGrid: true,
    showCoordinates: true,
    layerSystem: true,
    undoHistory: true,
    groupSelection: false
  });
  const [gridBlocked, setGridBlocked] = useState<Set<string>>(new Set());
  const [showBlockedGrid, setShowBlockedGrid] = useState(false);

  // Drawing and pathfinding tools
  const [drawingMode, setDrawingMode] = useState<'wall' | 'bridge' | 'zone' | 'path' | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnElements, setDrawnElements] = useState<Array<{
    id: string;
    type: 'wall' | 'bridge' | 'zone' | 'path';
    points: Array<{x: number, y: number}>;
    pathId?: string;
  }>>([]);

  const [pathStorage, setPathStorage] = useState<{
    [key: string]: Array<{x: number, y: number}>
  }>({});
  const [activePath, setActivePath] = useState<Array<{x: number, y: number}>>([]);

  // Canvas dimensions - now adjustable
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 600
  });

  // Image cache for better performance
  const [imageCache, setImageCache] = useState<{ [key: string]: HTMLImageElement }>({});

  // Initialize default game elements
  useEffect(() => {
    const initializeGameElements = () => {
      const defaultElements: GameElement[] = [
        // AI Team (Top Half)
        { id: 'ai-castle', type: 'castle', x: 400, y: 80, team: 'ai', health: 2400, maxHealth: 2400, clickable: true, draggable: true },
        { id: 'ai-tower-left', type: 'tower', x: 240, y: 140, team: 'ai', health: 1600, maxHealth: 1600, clickable: true, draggable: true },
        { id: 'ai-tower-right', type: 'tower', x: 560, y: 140, team: 'ai', health: 1600, maxHealth: 1600, clickable: true, draggable: true },

        // Player Team (Bottom Half)  
        { id: 'player-castle', type: 'castle', x: 400, y: 520, team: 'player', health: 2400, maxHealth: 2400, clickable: true, draggable: true },
        { id: 'player-tower-left', type: 'tower', x: 240, y: 460, team: 'player', health: 1600, maxHealth: 1600, clickable: true, draggable: true },
        { id: 'player-tower-right', type: 'tower', x: 560, y: 460, team: 'player', health: 1600, maxHealth: 1600, clickable: true, draggable: true },

        // Arena boundaries - stone walls LOCKED to absolute canvas edges
        { id: 'arena-top', type: 'wall', x: 400, y: 0, width: 800, height: 10, team: 'neutral', clickable: false, draggable: false, resizable: false },
        { id: 'arena-bottom', type: 'wall', x: 400, y: 595, width: 800, height: 10, team: 'neutral', clickable: false, draggable: false, resizable: false },
        { id: 'arena-left', type: 'wall', x: 0, y: 300, width: 10, height: 600, team: 'neutral', clickable: false, draggable: false, resizable: false },
        { id: 'arena-right', type: 'wall', x: 795, y: 300, width: 10, height: 600, team: 'neutral', clickable: false, draggable: false, resizable: false },

        // Deploy Areas
        { id: 'player-deploy-left', type: 'drop_area', x: 160, y: 380, width: 120, height: 80, team: 'player', clickable: true, draggable: true, resizable: true },
        { id: 'player-deploy-right', type: 'drop_area', x: 640, y: 380, width: 120, height: 80, team: 'player', clickable: true, draggable: true, resizable: true },
        { id: 'ai-deploy-left', type: 'drop_area', x: 160, y: 220, width: 120, height: 80, team: 'ai', clickable: true, draggable: true, resizable: true },
        { id: 'ai-deploy-right', type: 'drop_area', x: 640, y: 220, width: 120, height: 80, team: 'ai', clickable: true, draggable: true, resizable: true }
      ];

      setGameElements(defaultElements);
      console.log('🎮 Initialized default game elements:', defaultElements.length);
    };

    if (gameElements.length === 0) {
      initializeGameElements();
    }
  }, []);

  // Canvas dimensions - now dynamic and adjustable
  const CANVAS_WIDTH = canvasDimensions.width;
  const CANVAS_HEIGHT = canvasDimensions.height;
  const GRID_SIZE = 10;

  // Fetch all 66 admin cards for quick deploy
  const { data: adminCardsData, refetch: loadCards } = useQuery({
    queryKey: ['admin-cards'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cards');
      if (!response.ok) throw new Error('Failed to fetch admin cards');
      return response.json();
    },
  });

  // Generate classification card collection
  const generateClassificationCards = async () => {
    try {
      const response = await fetch('/api/admin/generate-classification-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Generated classification cards collection:', data.cards.length, 'cards');
        loadCards();
        toast('✅ Classification card collection restored!');
      } else {
        console.error('❌ Failed to generate classification cards:', data.error);
        toast('❌ Failed to generate cards');
      }
    } catch (error) {
      console.error('❌ Error generating classification cards:', error);
      toast('❌ Error generating cards');
    }
  };

  // Convert admin cards to quick deploy format and add special cards
  const quickDeployCards = useMemo(() => {
    const specialCards = [
      {
        id: 'player-tower',
        name: 'Player Tower',
        attack: 90,
        health: 1600,
        cost: 6,
        speed: 0,
        type: 'tower' as const,
        class: 'structure',
        rarity: 'legendary',
        image: 'https://i.imgur.com/M7Bear7.png'
      },
      {
        id: 'player-castle',
        name: 'Player Castle',
        attack: 120,
        health: 2400,
        cost: 8,
        speed: 0,
        type: 'tower' as const,
        class: 'structure',
        rarity: 'legendary',
        image: 'https://i.imgur.com/hYNPa50.png'
      }
    ];

    const adminCards = adminCardsData?.cards || [];
    const convertedCards = adminCards.map((card: any) => ({
      id: card.id,
      name: card.name,
      attack: card.attack || 100,
      health: card.health || 100,
      cost: card.cost || 3,
      speed: card.speed || 1.0,
      type: (card.type || 'melee') as 'spell' | 'magical' | 'ranged' | 'tank' | 'melee' | 'tower',
      class: card.class || 'warrior',
      rarity: card.rarity || 'common',
      image: card.image || '/api/placeholder/60/80'
    }));

    return [...specialCards, ...convertedCards];
  }, [adminCardsData]);

  // Load and cache images
  useEffect(() => {
    const loadImages = async () => {
      const imagesToLoad = {
        background: 'https://i.imgur.com/UAOuO9a.png',
        castle: 'https://i.imgur.com/hYNPa50.png',
        tower: 'https://i.imgur.com/M7Bear7.png',
        damagedTower: 'https://i.imgur.com/nXACiv2.png',
        deadTower: 'https://i.imgur.com/cCzoRkR.png'
      };

      const cache: { [key: string]: HTMLImageElement } = {};

      for (const [key, src] of Object.entries(imagesToLoad)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        }).catch(() => {
          console.log(`Failed to load ${key} image`);
        });

        cache[key] = img;
      }

      setImageCache(cache);
    };

    loadImages();
  }, []);

  // Enhanced canvas rendering with glow effects
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const drawScene = () => {
      // Enhanced background with gradient overlay
      const backgroundImg = imageCache.background;
      if (backgroundImg && backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Add subtle overlay for better contrast
        const gradient = ctx.createRadialGradient(
          CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
          CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) / 2
        );
        gradient.addColorStop(0, 'rgba(26, 76, 50, 0.1)');
        gradient.addColorStop(1, 'rgba(26, 76, 50, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#1a4c32';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Enhanced grid system with glow effects
      if (showBlockedGrid) {
        // Add glow effect for blocked grid
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';

        for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
          for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
            const gridKey = `${x},${y}`;
            if (gridBlocked.has(gridKey)) {
              ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + GRID_SIZE, y + GRID_SIZE);
              ctx.moveTo(x + GRID_SIZE, y);
              ctx.lineTo(x, y + GRID_SIZE);
              ctx.stroke();
            } else {
              ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
              ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
            }
          }
        }
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'rgba(0, 255, 127, 0.4)';
        ctx.lineWidth = 0.8;
      }

      ctx.setLineDash([]);

      // Grid lines with subtle glow
      ctx.shadowBlur = 2;
      ctx.shadowColor = showBlockedGrid ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 127, 0.3)';

      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Enhanced center dividing line with animation
      const time = Date.now() * 0.003;
      const pulseAlpha = 0.5 + Math.sin(time) * 0.3;
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 8]);
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Enhanced team zones with gradients
      const aiGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT / 2);
      aiGradient.addColorStop(0, 'rgba(255, 50, 50, 0.08)');
      aiGradient.addColorStop(1, 'rgba(255, 50, 50, 0.02)');
      ctx.fillStyle = aiGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

      const playerGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT / 2, 0, CANVAS_HEIGHT);
      playerGradient.addColorStop(0, 'rgba(50, 150, 255, 0.02)');
      playerGradient.addColorStop(1, 'rgba(50, 150, 255, 0.08)');
      ctx.fillStyle = playerGradient;
      ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

      // Draw game elements with enhanced effects
      gameElements.forEach(element => {
        drawGameElement(ctx, element);
      });

      // Draw minions with enhanced visuals
      minions.forEach(minion => {
        drawMinion(ctx, minion);
      });

      // Show coordinates if enabled
      if (canvasTools.showCoordinates) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`Canvas: ${CANVAS_WIDTH}×${CANVAS_HEIGHT}`, 10, 20);
        ctx.fillText(`Grid: ${GRID_SIZE}px`, 10, 35);
        ctx.fillText(`Elements: ${gameElements.length}`, 10, 50);
      }
    };

    drawScene();
  }, [gameElements, minions, showBlockedGrid, gridBlocked, canvasTools.showCoordinates, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, imageCache]);

  // Enhanced game element drawing with glow effects
  const drawGameElement = (ctx: CanvasRenderingContext2D, element: GameElement) => {
    ctx.save();

    const width = element.width || 80;
    const height = element.height || 80;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Enhanced glow effects for interactive elements
    if (element.draggable || element.clickable) {
      const glowIntensity = draggedElement === element.id ? 20 : 8;
      const glowColor = element.draggable ? '#FFD700' : '#00FF7F';

      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = draggedElement === element.id ? 3 : 2;
      ctx.setLineDash([8, 4]);
    }

    switch (element.type) {
      case 'castle':
        const castleImg = imageCache.castle;
        if (castleImg && castleImg.complete) {
          // Add castle glow effect
          if (element.team === 'player') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(50, 150, 255, 0.6)';
          } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 50, 50, 0.6)';
          }
          ctx.drawImage(castleImg, element.x - halfWidth, element.y - halfHeight, width, height);
          ctx.shadowBlur = 0;
        }
        break;

      case 'tower':
        const currentHealth = element.health || 0;
        const maxHealth = element.maxHealth || 1600;
        const healthPercentage = currentHealth / maxHealth;

        let towerImage = null;
        let towerGlow = 'rgba(255, 215, 0, 0.6)';

        if (currentHealth === 0) {
          towerImage = imageCache.deadTower;
          towerGlow = 'rgba(128, 128, 128, 0.4)';
        } else if (healthPercentage < 0.25) {
          towerImage = imageCache.damagedTower;
          towerGlow = 'rgba(255, 100, 100, 0.6)';
        } else {
          towerImage = imageCache.tower;
          towerGlow = element.team === 'player' ? 'rgba(50, 150, 255, 0.6)' : 'rgba(255, 100, 100, 0.6)';
        }

        if (towerImage && towerImage.complete) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = towerGlow;
          ctx.drawImage(towerImage, element.x - halfWidth, element.y - halfHeight, width, height);
          ctx.shadowBlur = 0;
        }
        break;

      case 'drop_area':
        const time = Date.now() * 0.004;
        const alpha = 0.4 + Math.sin(time) * 0.3;
        const pulseScale = 1 + Math.sin(time * 2) * 0.05;

        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-element.x, -element.y);

        // Enhanced glow for drop areas
        ctx.shadowBlur = 20;
        ctx.shadowColor = element.team === 'player' 
          ? `rgba(0, 255, 127, ${alpha})` 
          : `rgba(255, 136, 0, ${alpha})`;

        ctx.strokeStyle = element.team === 'player' 
          ? `rgba(0, 255, 127, ${alpha + 0.3})` 
          : `rgba(255, 136, 0, ${alpha + 0.3})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 6]);
        ctx.strokeRect(element.x - halfWidth, element.y - halfHeight, width, height);

        // Fill with gradient
        const gradient = ctx.createRadialGradient(
          element.x, element.y, 0,
          element.x, element.y, Math.max(width, height) / 2
        );
        gradient.addColorStop(0, element.team === 'player' 
          ? `rgba(0, 255, 127, ${alpha * 0.3})` 
          : `rgba(255, 136, 0, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(element.x - halfWidth, element.y - halfHeight, width, height);

        ctx.restore();

        // Enhanced text with glow
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.fillStyle = element.team === 'player' ? '#00FF7F' : '#FF8C00';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          element.team === 'player' ? 'PLAYER DEPLOY' : 'AI DEPLOY', 
          element.x, 
          element.y + 4
        );
        ctx.shadowBlur = 0;
        break;

      case 'wall':
        if (element.id.startsWith('arena-')) {
          // Arena boundaries with metallic glow
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(128, 128, 128, 0.6)';
          ctx.fillStyle = '#4a5568';
          ctx.fillRect(element.x - halfWidth, element.y - halfHeight, width, height);

          // Metallic texture
          ctx.fillStyle = '#718096';
          for (let i = 0; i < width; i += 20) {
            for (let j = 0; j < height; j += 20) {
              ctx.fillRect(element.x - halfWidth + i + 3, element.y - halfHeight + j + 3, 10, 10);
            }
          }
          ctx.shadowBlur = 0;
        } else {
          // Custom walls with energy glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(138, 43, 226, 0.6)';
          ctx.fillStyle = '#8B7CF6';
          ctx.fillRect(element.x - halfWidth, element.y - halfHeight, width, height);
          ctx.shadowBlur = 0;
        }
        break;

      default:
        // Default element with subtle glow
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.fillStyle = '#64748b';
        ctx.fillRect(element.x - halfWidth, element.y - halfHeight, width, height);
        ctx.shadowBlur = 0;
        break;
    }

    // Enhanced health bars with glow
    if (element.health !== undefined && element.maxHealth) {
      const healthRatio = element.health / element.maxHealth;
      const barWidth = Math.max(width, 70);
      const barHeight = 8;

      // Health bar background with glow
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(element.x - barWidth/2, element.y - halfHeight - 22, barWidth, barHeight);

      // Health bar with color-coded glow
      const healthColor = healthRatio > 0.6 ? '#48bb78' : 
                         healthRatio > 0.3 ? '#ed8936' : '#f56565';
      const healthGlow = healthRatio > 0.6 ? 'rgba(72, 187, 120, 0.6)' : 
                        healthRatio > 0.3 ? 'rgba(237, 137, 54, 0.6)' : 'rgba(245, 101, 101, 0.6)';

      ctx.shadowColor = healthGlow;
      ctx.shadowBlur = 6;
      ctx.fillStyle = healthColor;
      ctx.fillRect(element.x - barWidth/2, element.y - halfHeight - 22, barWidth * healthRatio, barHeight);

      // Health text with outline
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText(`${element.health}/${element.maxHealth}`, element.x, element.y - halfHeight - 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${element.health}/${element.maxHealth}`, element.x, element.y - halfHeight - 28);
    }

    if (element.draggable || element.clickable) {
      ctx.stroke();
    }

    ctx.restore();
  };

  // Enhanced minion drawing with particle effects
  const drawMinion = (ctx: CanvasRenderingContext2D, minion: Minion) => {
    ctx.save();

    const card = quickDeployCards.find((c: any) => c.id === minion.cardId);

    // Enhanced shadow with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = minion.team === 'player' ? 'rgba(50, 150, 255, 0.4)' : 'rgba(255, 50, 50, 0.4)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(minion.x, minion.y + 25, 18, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    const sizes = {
      'tank': 35,
      'melee': 25, 
      'ranged': 25,
      'magical': 25,
      'spell': 20,
      'tower': 30
    };
    const size = sizes[minion.type as keyof typeof sizes] || 25;

    // Enhanced minion glow based on type
    const typeGlow = {
      'tank': 'rgba(255, 0, 0, 0.6)',
      'melee': 'rgba(255, 165, 0, 0.6)',
      'ranged': 'rgba(0, 255, 0, 0.6)',
      'magical': 'rgba(138, 43, 226, 0.6)',
      'spell': 'rgba(255, 20, 147, 0.6)',
      'tower': 'rgba(70, 130, 180, 0.6)'
    };

    ctx.shadowBlur = 12;
    ctx.shadowColor = typeGlow[minion.type as keyof typeof typeGlow] || 'rgba(255, 255, 255, 0.4)';

    if (card && card.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = card.image;

      if (img.complete) {
        ctx.drawImage(img, minion.x - size/2, minion.y - size/2, size, size);
      } else {
        ctx.fillStyle = minion.team === 'player' ? '#4ade80' : '#ef4444';
        ctx.beginPath();
        ctx.arc(minion.x, minion.y, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = minion.team === 'player' ? '#4ade80' : '#ef4444';
      ctx.beginPath();
      ctx.arc(minion.x, minion.y, size/2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Enhanced health bar with pulse effect
    const healthRatio = minion.health / minion.maxHealth;
    const barWidth = 40;
    const barHeight = 6;
    const pulseTime = Date.now() * 0.01;
    const pulse = 1 + Math.sin(pulseTime) * 0.1;

    // Health bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(minion.x - barWidth/2, minion.y - 35, barWidth, barHeight);

    // Health bar with animated glow
    const healthColor = healthRatio > 0.6 ? '#10b981' : 
                       healthRatio > 0.3 ? '#f59e0b' : '#ef4444';
    const healthGlow = healthRatio > 0.6 ? 'rgba(16, 185, 129, 0.8)' : 
                      healthRatio > 0.3 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.8)';

    ctx.shadowBlur = 6 * pulse;
    ctx.shadowColor = healthGlow;
    ctx.fillStyle = healthColor;
    ctx.fillRect(minion.x - barWidth/2, minion.y - 35, barWidth * healthRatio, barHeight);

    // Health bar border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(minion.x - barWidth/2, minion.y - 35, barWidth, barHeight);

    // Attack indicator with animated ring
    if (minion.targetId) {
      const ringTime = Date.now() * 0.005;
      const ringRadius = 30 + Math.sin(ringTime) * 5;
      const ringAlpha = 0.7 + Math.sin(ringTime * 2) * 0.3;

      ctx.strokeStyle = `rgba(255, 0, 0, ${ringAlpha})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(minion.x, minion.y, ringRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  // Mouse event handlers for canvas interaction
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const rawX = (event.clientX - rect.left) * scaleX;
    const rawY = (event.clientY - rect.top) * scaleY;

    const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    // Check for resize handle clicks first
    if (editMode) {
      for (const element of gameElements) {
        if (element.type === 'drop_area' && element.resizable !== false) {
          const halfWidth = (element.width || 120) / 2;
          const halfHeight = (element.height || 80) / 2;
          const handleSize = 10;

          const corners = [
            { x: element.x - halfWidth, y: element.y - halfHeight, type: 'top-left' },
            { x: element.x + halfWidth, y: element.y - halfHeight, type: 'top-right' },
            { x: element.x - halfWidth, y: element.y + halfHeight, type: 'bottom-left' },
            { x: element.x + halfWidth, y: element.y + halfHeight, type: 'bottom-right' }
          ];

          for (const corner of corners) {
            if (x >= corner.x - handleSize/2 && x <= corner.x + handleSize/2 &&
                y >= corner.y - handleSize/2 && y <= corner.y + handleSize/2) {
              setIsResizing(true);
              setResizedElement(element.id);
              setDragOffset({ x: corner.x, y: corner.y });
              console.log(`Started resizing ${element.id} from ${corner.type} corner`);
              return;
            }
          }
        }
      }
    }

    const clickedElement = gameElements.find(element => {
      if (element.id.startsWith('arena-')) {
        return false;
      }

      const halfWidth = (element.width || 80) / 2;
      const halfHeight = (element.height || 80) / 2;
      return x >= element.x - halfWidth && x <= element.x + halfWidth &&
             y >= element.y - halfHeight && y <= element.y + halfHeight;
    });

    if (clickedElement) {
      if (clickedElement.draggable) {
        setIsDragging(true);
        setDraggedElement(clickedElement.id);
        setDragOffset({
          x: x - clickedElement.x,
          y: y - clickedElement.y
        });
      } else {
        console.log(`Clicked on ${clickedElement.type}: ${clickedElement.id}`);
        handleElementClick(clickedElement);
      }
    } else if (showBlockedGrid && editMode) {
      const gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
      const gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE;
      const gridKey = `${gridX},${gridY}`;

      setGridBlocked(prev => {
        const newBlocked = new Set(prev);
        if (newBlocked.has(gridKey)) {
          newBlocked.delete(gridKey);
        } else {
          newBlocked.add(gridKey);
        }
        return newBlocked;
      });
    } else if (drawingMode) {
      setIsDrawing(true);

      if (drawingMode === 'path') {
        const pathId = `path-${Date.now()}`;
        const newPath = {
          id: pathId,
          type: drawingMode,
          points: [{ x, y }],
          pathId: pathId
        };
        setDrawnElements(prev => [...prev, newPath]);
        setActivePath([{ x, y }]);
        console.log(`🛤️ Started drawing path at (${x}, ${y}) - drag to continue`);

        setPathStorage(prev => ({
          ...prev,
          [pathId]: [{ x, y }]
        }));
      } else {
        const newElement = {
          id: `${drawingMode}-${Date.now()}`,
          type: drawingMode,
          points: [{ x, y }]
        };
        setDrawnElements(prev => [...prev, newElement]);
        console.log(`🎨 Started drawing ${drawingMode} at (${x}, ${y})`);
      }
    } else if (selectedCard) {
      deployCard(selectedCard, x, y);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const rawX = (event.clientX - rect.left) * scaleX;
    const rawY = (event.clientY - rect.top) * scaleY;

    const snapX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

    if (isResizing && resizedElement) {
      setGameElements(prev => prev.map(element => {
        if (element.id === resizedElement) {
          const deltaX = snapX - element.x;
          const deltaY = snapY - element.y;

          const minWidth = 40;
          const minHeight = 30;

          let newWidth = Math.max(minWidth, Math.abs(deltaX) * 2);
          let newHeight = Math.max(minHeight, Math.abs(deltaY) * 2);

          newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
          newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;

          return { ...element, width: newWidth, height: newHeight };
        }
        return element;
      }));
    } else if (isDragging && draggedElement) {
      const newX = Math.round((rawX - dragOffset.x) / GRID_SIZE) * GRID_SIZE;
      const newY = Math.round((rawY - dragOffset.y) / GRID_SIZE) * GRID_SIZE;

      setGameElements(prev => prev.map(element => 
        element.id === draggedElement 
          ? { ...element, x: newX, y: newY }
          : element
      ));
    } else if (isDrawing && drawingMode && drawnElements.length > 0) {
      const currentElement = drawnElements[drawnElements.length - 1];
      if (currentElement) {
        const newPoint = { x: snapX, y: snapY };
        const updatedElement = {
          ...currentElement,
          points: [...currentElement.points, newPoint]
        };
        setDrawnElements(prev => 
          prev.slice(0, -1).concat([updatedElement])
        );

        if (drawingMode === 'path' && currentElement.pathId) {
          setPathStorage(prev => ({
            ...prev,
            [currentElement.pathId!]: [...(prev[currentElement.pathId!] || []), newPoint]
          }));
          setActivePath(prev => [...prev, newPoint]);
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (isResizing) {
      console.log(`Finished resizing ${resizedElement}`);
    }
    if (isDrawing) {
      console.log(`Finished drawing ${drawingMode} element`);
      setIsDrawing(false);

      if (drawingMode === 'path' && activePath.length > 1) {
        console.log(`🛤️ Path completed with ${activePath.length} points - ready for AI navigation`);
      }
      setActivePath([]);
    }
    setIsDragging(false);
    setDraggedElement(null);
    setIsResizing(false);
    setResizedElement(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleElementClick = (element: GameElement) => {
    console.log(`Interacting with ${element.type}:`, element);

    switch (element.type) {
      case 'drop_area':
        console.log(`${element.team} drop area activated`);
        break;
      case 'tower':
      case 'castle':
        if (element.health && element.health > 0) {
          const newElements = gameElements.map(el => 
            el.id === element.id 
              ? { 
                  ...el, 
                  health: Math.max(0, el.health! - 200),
                  ...(el.type === 'tower' && Math.max(0, el.health! - 200) === 0 && { attack: 0 })
                }
              : el
          );
          setGameElements(newElements);
        }
        break;
    }
  };

  const deployCard = (card: TestCard, x: number, y: number) => {
    const newMinion: Minion = {
      id: `minion-${Date.now()}`,
      cardId: card.id,
      x,
      y,
      team: 'player',
      health: card.health,
      maxHealth: card.health,
      attack: card.attack,
      speed: cardSettings.speed,
      type: card.type,
      lastAttack: 0
    };

    setMinions(prev => [...prev, newMinion]);
    console.log('Deployed minion:', newMinion);
  };

  // Game loop with enhanced AI
  useEffect(() => {
    if (!gameRunning) return;

    const gameLoop = setInterval(() => {
      setMinions(prev => prev.map(minion => {
        const enemies = gameElements.filter(element => 
          element.team !== minion.team && 
          (element.type === 'tower' || element.type === 'castle') &&
          element.health && element.health > 0
        );

        let nearestEnemy = enemies.reduce((closest, enemy) => {
          const distToEnemy = Math.sqrt((minion.x - enemy.x) ** 2 + (minion.y - enemy.y) ** 2);
          const distToClosest = closest ? Math.sqrt((minion.x - closest.x) ** 2 + (minion.y - closest.y) ** 2) : Infinity;
          return distToEnemy < distToClosest ? enemy : closest;
        }, null as GameElement | null);

        if (!nearestEnemy) {
          if (minion.team === 'player') {
            return { ...minion, y: Math.max(50, minion.y - minion.speed) };
          } else {
            return { ...minion, y: Math.min(550, minion.y + minion.speed) };
          }
        }

        const distToTarget = Math.sqrt((minion.x - nearestEnemy.x) ** 2 + (minion.y - nearestEnemy.y) ** 2);

        const attackRange = {
          'melee': 35,
          'ranged': 100,
          'magical': 90,
          'tank': 30,
          'spell': 120,
          'tower': 140
        }[minion.type] || 35;

        if (distToTarget <= attackRange) {
          const now = Date.now();
          if (now - minion.lastAttack > 1500) {
            setGameElements(elements => elements.map(element => 
              element.id === nearestEnemy!.id && element.health 
                ? { ...element, health: Math.max(0, element.health - minion.attack) }
                : element
            ));

            const attackEffects = {
              'melee': '⚔️',
              'ranged': '🏹', 
              'magical': '✨',
              'tank': '🛡️',
              'spell': '💫',
              'tower': '🏰'
            };

            console.log(`${attackEffects[minion.type as keyof typeof attackEffects] || '⚔️'} ${minion.type} attacks ${nearestEnemy.id} for ${minion.attack} damage!`);
            return { ...minion, lastAttack: now, targetId: nearestEnemy.id };
          }
          return { ...minion, targetId: nearestEnemy.id };
        } else {
          const dx = nearestEnemy.x - minion.x;
          const dy = nearestEnemy.y - minion.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let moveX = (dx / distance) * minion.speed;
          let moveY = (dy / distance) * minion.speed;

          const nextX = Math.floor((minion.x + moveX) / GRID_SIZE) * GRID_SIZE;
          const nextY = Math.floor((minion.y + moveY) / GRID_SIZE) * GRID_SIZE;
          const gridKey = `${nextX},${nextY}`;

          if (gridBlocked.has(gridKey)) {
            if (Math.abs(dx) > Math.abs(dy)) {
              moveX = 0;
              moveY = dy > 0 ? minion.speed : -minion.speed;
            } else {
              moveX = dx > 0 ? minion.speed : -minion.speed;
              moveY = 0;
            }

            const altX = Math.floor((minion.x + moveX) / GRID_SIZE) * GRID_SIZE;
            const altY = Math.floor((minion.y + moveY) / GRID_SIZE) * GRID_SIZE;
            const altGridKey = `${altX},${altY}`;

            if (gridBlocked.has(altGridKey)) {
              const alternatives = [
                { x: minion.speed, y: 0 },
                { x: -minion.speed, y: 0 },
                { x: 0, y: minion.speed },
                { x: 0, y: -minion.speed }
              ];

              for (const alt of alternatives) {
                const testX = Math.floor((minion.x + alt.x) / GRID_SIZE) * GRID_SIZE;
                const testY = Math.floor((minion.y + alt.y) / GRID_SIZE) * GRID_SIZE;
                const testKey = `${testX},${testY}`;

                if (!gridBlocked.has(testKey)) {
                  moveX = alt.x;
                  moveY = alt.y;
                  break;
                }
              }

              if (gridBlocked.has(`${Math.floor((minion.x + moveX) / GRID_SIZE) * GRID_SIZE},${Math.floor((minion.y + moveY) / GRID_SIZE) * GRID_SIZE}`)) {
                moveX = 0;
                moveY = 0;
              }
            }
          }

          return { 
            ...minion, 
            x: minion.x + moveX, 
            y: minion.y + moveY,
            targetId: nearestEnemy.id
          };
        }
      }));
    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameRunning, gameElements, gridBlocked, GRID_SIZE]);

  // Real-time canvas animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      drawCanvas();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [drawCanvas]);

  const navigate = onNavigate || (() => {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <UniversalHeader
        currentPath="/admingame"
        onNavigate={navigate}
        user={user}
        onLogout={onLogout}
        title="Admin Game Interface"
        showBackButton={true}
        onBack={() => navigate('/')}
      />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Status Header with Glow Effects */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6 bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30"
          >
            <motion.div
              animate={{ rotate: gameRunning ? 360 : 0 }}
              transition={{ duration: 2, repeat: gameRunning ? Infinity : 0, ease: "linear" }}
            >
              <Settings className="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" size={32} />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Enhanced Admin Interface
              </h2>
              <p className="text-gray-400 text-sm">Configure game elements, test cards, and manage battlefield settings</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="text-purple-400 drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]" size={24} />
            </motion.div>
          </motion.div>

        {/* Enhanced Master Control Panel with Glow Cards */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6"
        >
          <div className="lg:col-span-5 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl p-6 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.2)]">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Database className="drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" size={20} />
              Master Game Systems Control
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Enhanced System Status Cards with Glow Effects */}
              {[
                {
                  title: 'ELIXIR SYSTEM',
                  status: gameConfig.elixirSystem.enabled ? '✅ ACTIVE' : '❌ DISABLED',
                  details: `${gameConfig.elixirSystem.startingElixir}/${gameConfig.elixirSystem.maxElixir} | ${gameConfig.elixirSystem.regenRate}s`,
                  color: 'from-green-500 to-emerald-600',
                  glowColor: 'rgba(34, 197, 94, 0.3)'
                },
                {
                  title: 'BATTLE TIMER',
                  status: gameConfig.battleSystem.enabled ? '✅ ACTIVE' : '❌ DISABLED',
                  details: `${gameConfig.battleSystem.battleTime}s + ${gameConfig.battleSystem.overtimeTime}s OT`,
                  color: 'from-blue-500 to-cyan-600',
                  glowColor: 'rgba(59, 130, 246, 0.3)'
                },
                {
                  title: 'AI OPPONENT',
                  status: gameConfig.aiSystem.difficulty.toUpperCase(),
                  details: `${gameConfig.aiSystem.reactionTime}s reaction`,
                  color: 'from-red-500 to-rose-600',
                  glowColor: 'rgba(239, 68, 68, 0.3)'
                },
                {
                  title: 'CARD SYSTEM',
                  status: `${gameConfig.cardSystem.handSize}/${gameConfig.cardSystem.deckSize}`,
                  details: gameConfig.cardSystem.cycleOnPlay ? 'Auto-Cycle' : 'Manual',
                  color: 'from-purple-500 to-violet-600',
                  glowColor: 'rgba(147, 51, 234, 0.3)'
                },
                {
                  title: 'ECONOMY',
                  status: gameConfig.economySystem.enabled ? '✅ BUDZ REWARDS' : '❌ DISABLED',
                  details: `+${gameConfig.economySystem.victoryReward} WIN`,
                  color: 'from-yellow-500 to-amber-600',
                  glowColor: 'rgba(245, 158, 11, 0.3)'
                },
                {
                  title: 'VISUAL/AUDIO',
                  status: visualConfig.quality.toUpperCase(),
                  details: `${visualConfig.animations ? 'Animations' : 'Static'} | ${visualConfig.soundEffects ? 'SFX' : 'Silent'}`,
                  color: 'from-cyan-500 to-teal-600',
                  glowColor: 'rgba(6, 182, 212, 0.3)'
                }
              ].map((system, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${system.color} p-4 rounded-lg text-center relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105`}
                  style={{
                    boxShadow: `0 0 20px ${system.glowColor}`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="text-white font-bold text-sm mb-1">{system.title}</div>
                    <div className="text-xs text-gray-100 mb-1">{system.status}</div>
                    <div className="text-xs text-gray-200">{system.details}</div>
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-6 h-6 bg-white/20 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Game Canvas */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Eye className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={28} />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Enhanced Game Board Builder
                  </h2>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGameRunning(!gameRunning)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white font-bold transition-all duration-300 ${
                      gameRunning 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                    }`}
                  >
                    {gameRunning ? <Pause size={20} /> : <Play size={20} />}
                    {gameRunning ? 'Stop' : 'Test'} Battle
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white font-bold transition-all duration-300 ${
                      editMode 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-[0_0_20px_rgba(147,51,234,0.4)]' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-[0_0_20px_rgba(75,85,99,0.4)]'
                    }`}
                  >
                    <Move size={20} />
                    {editMode ? 'Edit ON' : 'Edit OFF'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBlockedGrid(!showBlockedGrid)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white font-bold transition-all duration-300 ${
                      showBlockedGrid 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                    }`}
                  >
                    <Grid3X3 size={20} />
                    {showBlockedGrid ? 'Red Grid' : 'Green Grid'}
                  </motion.button>

                  {/* Enhanced Save/Load Buttons */}
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(34,197,94,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const boardData = {
                        elements: gameElements,
                        minions: minions,
                        gridBlocked: Array.from(gridBlocked),
                        drawnElements: drawnElements,
                        gridSize: GRID_SIZE,
                        dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
                        version: '2.0',
                        precision: 'fine',
                        createdAt: new Date().toISOString(),
                        gameSystem: 'thc-clash-admin-primary',
                        isOfficialPvEBoard: true
                      };

                      localStorage.setItem('thc-clash-board-layout', JSON.stringify(boardData));
                      localStorage.setItem('thc-clash-game-system', JSON.stringify(boardData));
                      localStorage.setItem('thc-clash-pve-gameboard', JSON.stringify(boardData));
                      localStorage.setItem('admin-created-pve-board', JSON.stringify(boardData));

                      fetch('/api/admin/save-pve-gameboard', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(boardData)
                      }).then(response => {
                        if (response.ok) {
                          console.log('✅ Official PvE gameboard saved to server');
                        }
                      }).catch(err => {
                        console.log('⚠️ Server save failed, but local save successful');
                      });

                      console.log('🎮 OFFICIAL PvE GAMEBOARD SAVED:', boardData);
                      toast.success('✅ Official PvE Gameboard Saved!', {
                        description: `🏰 ${gameElements.length} elements saved. This layout will be used for ALL PvE battles!`
                      });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg flex items-center gap-2 text-white font-bold border-2 border-green-400/50 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    <Settings size={20} />
                    Save Official PvE Board
                  </motion.button>
                </div>
              </div>

              {/* Enhanced Canvas Container */}
              <div className="relative group">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="border-2 border-blue-400/50 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:border-blue-400/80 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                  style={{ 
                    background: 'linear-gradient(135deg, #1a4c32, #2d5a3d)',
                    display: 'block',
                    cursor: showBlockedGrid && editMode 
                      ? 'crosshair' 
                      : isResizing 
                        ? 'nw-resize' 
                        : isDragging 
                          ? 'grabbing' 
                          : editMode 
                            ? 'grab' 
                            : 'default',
                    maxWidth: '100%',
                    filter: gameRunning ? 'brightness(1.1) contrast(1.05)' : 'brightness(1)',
                    transition: 'all 0.3s ease'
                  }}
                />

                {/* Enhanced Overlay Info */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-lg border border-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded animate-pulse"></div>
                    <span className="font-bold text-green-400">Fine Grid: {GRID_SIZE}px</span>
                  </div>
                  <div className="text-gray-300 text-xs">Canvas: {CANVAS_WIDTH}×{CANVAS_HEIGHT}</div>
                  <div className="text-green-400 font-bold text-xs">🎮 Official PvE Gameboard Creator</div>
                  <div className="text-yellow-400 text-xs flex items-center gap-2 mt-1">
                    <Sparkles size={12} />
                    Elements: {gameElements.length} | Minions: {minions.length}
                  </div>
                </motion.div>

                {/* Game Running Indicator */}
                <AnimatePresence>
                  {gameRunning && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Gamepad2 size={16} />
                      </motion.div>
                      BATTLE ACTIVE
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enhanced Help Text */}
              <div className="mt-6 text-sm text-gray-400 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p>• <span className="text-yellow-400 font-semibold">Yellow glow</span>: Draggable elements</p>
                  <p>• <span className="text-green-400 font-semibold">Green glow</span>: Clickable elements</p>
                  <p>• <span className="text-purple-400 font-semibold">Edit Mode</span>: Enable drag/resize controls</p>
                  <p>• <span className="text-blue-400 font-semibold">10px Grid</span>: Precision building system</p>
                </div>
                <div className="space-y-1">
                  <p>• <span className="text-green-400 font-semibold">Fine Grid</span>: 4x more accurate positioning</p>
                  <p>• <span className="text-red-400 font-semibold">Blocked Grid</span>: Click to prevent movement</p>
                  <p>• <span className="text-cyan-400 font-semibold">Enhanced Effects</span>: Glow, particles, animations</p>
                  <p>• <span className="text-yellow-400 font-semibold">Real-time Updates</span>: Live battle simulation</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced User Hand Area */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" size={20} />
                  <h3 className="text-lg font-bold text-green-400">
                    Classification Cards ({quickDeployCards.length})
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateClassificationCards}
                    className="px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  >
                    Generate Cards
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => loadCards()}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    Reload
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {quickDeployCards.map((card, index) => (
                  <motion.div 
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelectedCard(card)}
                    className={`cursor-pointer border-2 rounded-lg p-2 text-center transition-all duration-300 group relative overflow-hidden ${
                      selectedCard?.id === card.id 
                        ? 'border-green-400 bg-green-900/30 shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' 
                        : 'border-gray-600 hover:border-gray-400 hover:shadow-[0_0_15px_rgba(75,85,99,0.3)]'
                    }`}
                    whileHover={{ scale: selectedCard?.id === card.id ? 1.05 : 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {card.image && (
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className="w-10 h-10 mx-auto mb-1 rounded object-cover shadow-lg"
                        crossOrigin="anonymous"
                      />
                    )}
                    <div className="text-xs text-white font-bold truncate relative z-10">{card.name}</div>
                    <div className="text-xs text-yellow-400 flex justify-center gap-1 relative z-10">
                      <span>⚔️{card.attack}</span>
                      <span>❤️{card.health}</span>
                    </div>
                    <div className="text-xs text-blue-400 relative z-10">⚡{card.cost}</div>
                    {card.type === 'tower' && (
                      <div className="text-xs text-purple-400 relative z-10">🏰</div>
                    )}

                    {/* Selection Glow */}
                    {selectedCard?.id === card.id && (
                      <motion.div
                        className="absolute inset-0 bg-green-400/20 rounded-lg"
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Card Testing Section */}
              <AnimatePresence>
                {selectedCard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-green-600/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                  >
                    <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                      <Target size={16} />
                      Testing: {selectedCard.name}
                    </h4>
                    <div className="text-sm grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <span>⚔️</span> <span>Attack: {selectedCard.attack}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>❤️</span> <span>Health: {selectedCard.health}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⚡</span> <span>Cost: {selectedCard.cost}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🏃</span> <span>Speed: {cardSettings.speed}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-bold mb-2 text-gray-300">Movement Speed:</label>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={cardSettings.speed}
                        onChange={(e) => setCardSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                        className="w-full accent-green-400"
                      />
                      <span className="text-xs text-green-400 font-semibold">{cardSettings.speed}px/frame</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Enhanced Canvas Size Controls */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.2)]"
            >
              <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                <Maximize className="text-purple-400 drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" size={20} />
                Canvas Dimensions ({CANVAS_WIDTH}×{CANVAS_HEIGHT})
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Width:</label>
                  <input
                    type="range"
                    min="600"
                    max="1400"
                    step="50"
                    value={canvasDimensions.width}
                    onChange={(e) => setCanvasDimensions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="w-full accent-purple-400"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>600px</span>
                    <span className="text-purple-400 font-bold">{canvasDimensions.width}px</span>
                    <span>1400px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">Height:</label>
                  <input
                    type="range"
                    min="400"
                    max="1000"
                    step="50"
                    value={canvasDimensions.height}
                    onChange={(e) => setCanvasDimensions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full accent-purple-400"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>400px</span>
                    <span className="text-purple-400 font-bold">{canvasDimensions.height}px</span>
                    <span>1000px</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {[
                  { name: 'Standard', size: { width: 800, height: 600 }, color: 'from-blue-600 to-blue-700' },
                  { name: 'Large', size: { width: 1200, height: 800 }, color: 'from-green-600 to-green-700' },
                  { name: 'Wide', size: { width: 1000, height: 400 }, color: 'from-yellow-600 to-yellow-700' }
                ].map((preset, index) => (
                  <motion.button
                    key={preset.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCanvasDimensions(preset.size)}
                    className={`px-3 py-2 bg-gradient-to-r ${preset.color} hover:shadow-lg rounded-lg text-sm font-medium transition-all duration-300`}
                  >
                    {preset.name} ({preset.size.width}×{preset.size.height})
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Enhanced Admin Controls */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
            >
              <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <MousePointer className="text-yellow-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" size={20} />
                Enhanced Admin Controls
              </h3>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditMode(!editMode)}
                  className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-300 ${
                    editMode 
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                      : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-yellow-400 shadow-[0_0_15px_rgba(75,85,99,0.3)]'
                  }`}
                >
                  📝 Edit Mode {editMode ? 'ON' : 'OFF'}
                  {editMode && <span className="ml-2 animate-pulse">✨</span>}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMinions([]);
                    setGameElements(prev => prev.map(el => ({ 
                      ...el, 
                      health: el.maxHealth || el.health
                    })));
                    toast.success('🔄 Battle Reset Complete!', {
                      description: 'All minions cleared and structures restored'
                    });
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-lg font-bold text-white transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw size={16} />
                    Reset Battle
                  </div>
                </motion.button>

                <div className="pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Minions:</span>
                        <span className="text-green-400 font-bold">{minions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Game Running:</span>
                        <span className={`font-bold ${gameRunning ? 'text-green-400' : 'text-red-400'}`}>
                          {gameRunning ? 'Yes ⚡' : 'No 🛑'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Edit Mode:</span>
                        <span className={`font-bold ${editMode ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {editMode ? 'Active 🔧' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Elements:</span>
                        <span className="text-blue-400 font-bold">{gameElements.length} 🏗️</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(147, 51, 234, 0.5) rgba(55, 65, 81, 0.5);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.7), rgba(168, 85, 247, 0.7));
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.9), rgba(168, 85, 247, 0.9));
        }

        /* Enhanced input ranges */
        input[type="range"] {
          background: transparent;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-track {
          background: linear-gradient(to right, rgba(75, 85, 99, 0.5), rgba(107, 114, 128, 0.5));
          height: 6px;
          border-radius: 3px;
          border: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--tw-gradient-stops));
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }

        input[type="range"]::-moz-range-track {
          background: linear-gradient(to right, rgba(75, 85, 99, 0.5), rgba(107, 114, 128, 0.5));
          height: 6px;
          border-radius: 3px;
          border: none;
        }

        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--tw-gradient-stops));
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}