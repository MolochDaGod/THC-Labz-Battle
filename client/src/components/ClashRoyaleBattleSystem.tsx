import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Zap, Crown, Heart, Swords, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameZone {
  id: string;
  type: 'player_deploy' | 'ai_deploy' | 'bridge' | 'water' | 'tower' | 'castle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  name: string;
}

interface Unit {
  id: string;
  cardId: string;
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  isPlayer: boolean;
  targetId?: string;
  lastAttack: number;
  attackCooldown: number;
  range: number;
  speed: number;
  size: number;
  isDead: boolean;
}

interface Tower {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  range: number;
  isPlayer: boolean;
  lastAttack: number;
  isDead: boolean;
}

interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  image: string;
  type: string;
  rarity: string;
}

interface ClashRoyaleBattleSystemProps {
  playerDeck: Card[];
  onBattleEnd: (victory: boolean, results: any) => void;
  gameZones: GameZone[];
  playerWallet?: string;
  nftData?: any;
  captainCard?: Card;
}

interface WalletBalances {
  budzBalance: number;
  gbuxBalance: number;
  solBalance: number;
  thcLabzBalance: number;
}

const ClashRoyaleBattleSystem: React.FC<ClashRoyaleBattleSystemProps> = ({
  playerDeck,
  onBattleEnd,
  gameZones,
  playerWallet,
  nftData,
  captainCard
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [battlefieldImage, setBattlefieldImage] = useState<HTMLImageElement | null>(null);
  
  // Game state
  const [elixir, setElixir] = useState(5);
  const [units, setUnits] = useState<Unit[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [currentHand, setCurrentHand] = useState<Card[]>([]);
  const [battleTime, setBattleTime] = useState(180); // 3 minutes
  const [isGameActive, setIsGameActive] = useState(true);
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null);
  
  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [towerImages, setTowerImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [castleImages, setCastleImages] = useState<{ [key: string]: HTMLImageElement }>({});
  
  // Wallet balances state
  const [walletBalances, setWalletBalances] = useState<WalletBalances>({
    budzBalance: 0,
    gbuxBalance: 0,
    solBalance: 0,
    thcLabzBalance: 0
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  
  // Enhanced responsive settings with device optimization
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobileSize = width < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPortrait = height > width;
      
      setIsMobile(isMobileSize || isTouchDevice);
      setIsTouch(isTouchDevice);
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);
  
  const GRID_WIDTH = 18;
  const GRID_HEIGHT = 28;
  // Optimized cell sizes for different devices
  const BASE_CELL_SIZE = isMobile ? (isTouch ? 12 : 15) : 25;
  const CANVAS_WIDTH = GRID_WIDTH * BASE_CELL_SIZE;
  const CANVAS_HEIGHT = GRID_HEIGHT * BASE_CELL_SIZE;

  // Load battlefield background and tower/castle images
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBattlefieldImage(img);
    // Use the clean THC battlefield background (without towers) as we'll draw towers at correct positions
    img.src = '/attached_assets/a755218e-91f9-45c4-bdfd-9b6a75106de9_1754226584907.png';

    // Load tower images (using proper image URLs from replit.md)
    const loadTowerImage = () => {
      const towerImg = new Image();
      towerImg.crossOrigin = 'anonymous';
      towerImg.onload = () => {
        setTowerImages(prev => ({ ...prev, tower: towerImg }));
      };
      towerImg.src = 'https://i.imgur.com/M7Bear7.png'; // Tower image from replit.md
    };

    // Load castle images  
    const loadCastleImage = () => {
      const castleImg = new Image();
      castleImg.crossOrigin = 'anonymous';
      castleImg.onload = () => {
        setCastleImages(prev => ({ ...prev, castle: castleImg }));
      };
      castleImg.src = 'https://i.imgur.com/hYNPa50.png'; // Castle image from replit.md
    };

    loadTowerImage();
    loadCastleImage();
  }, []);

  // Initialize towers based on game zones with enhanced positioning
  useEffect(() => {
    if (!gameZones.length) return;

    const initialTowers: Tower[] = [];
    
    gameZones.forEach(zone => {
      if (zone.type === 'tower') {
        // Apply positioning adjustments: AI towers down, all towers right
        let adjustedX = zone.x + 2; // Move all towers right
        let adjustedY = zone.y;
        
        // Move AI towers down additionally
        if (zone.id.includes('ai') || !zone.id.includes('player')) {
          adjustedY = zone.y + 2;
        }
        
        initialTowers.push({
          id: zone.id,
          x: adjustedX,
          y: adjustedY,
          health: zone.id.includes('player') ? 1600 : 1600, // Arena towers
          maxHealth: 1600,
          attack: zone.id.includes('player') ? 109 : 109,
          range: 5,
          isPlayer: zone.id.includes('player'),
          lastAttack: 0,
          isDead: false
        });
      } else if (zone.type === 'castle') {
        // Apply positioning adjustments: AI castles down, all castles right
        let adjustedX = zone.x + 2; // Move all castles right
        let adjustedY = zone.y;
        
        // Move AI castles down additionally
        if (zone.id.includes('ai') || !zone.id.includes('player')) {
          adjustedY = zone.y + 2;
        }
        
        initialTowers.push({
          id: zone.id,
          x: adjustedX,
          y: adjustedY,
          health: zone.id.includes('player') ? 2400 : 2400, // King towers
          maxHealth: 2400,
          attack: zone.id.includes('player') ? 109 : 109,
          range: 5,
          isPlayer: zone.id.includes('player'),
          lastAttack: 0,
          isDead: false
        });
      }
    });

    setTowers(initialTowers);
  }, [gameZones]);

  // Initialize player hand
  useEffect(() => {
    if (playerDeck.length > 0) {
      setCurrentHand(playerDeck.slice(0, 4));
    }
  }, [playerDeck]);

  // Fetch wallet balances when wallet connects
  const fetchWalletBalances = useCallback(async () => {
    if (!playerWallet) return;
    
    setIsLoadingBalances(true);
    try {
      console.log(`💰 Fetching wallet balances for: ${playerWallet}`);
      const response = await fetch(`/api/wallet/${playerWallet}`);
      const data = await response.json();
      
      if (response.ok) {
        setWalletBalances({
          budzBalance: data.budzBalance || 0,
          gbuxBalance: data.gbuxBalance || 0,
          solBalance: data.solBalance || 0,
          thcLabzBalance: data.thcLabzTokenBalance || 0
        });
        console.log('✅ Wallet balances updated:', data);
      } else {
        console.error('❌ Failed to fetch wallet balances:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching wallet balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [playerWallet]);

  useEffect(() => {
    fetchWalletBalances();
  }, [fetchWalletBalances]);

  // Process battle rewards via AI agent wallet
  const processBattleRewards = useCallback(async (victory: boolean, timeRemaining: number) => {
    if (!playerWallet) return;

    try {
      const budzReward = victory ? 100 : 25; // Victory: 100 BUDZ, Participation: 25 BUDZ
      console.log(`🎯 Processing battle rewards: ${budzReward} BUDZ for ${victory ? 'victory' : 'participation'}`);
      
      const response = await fetch('/api/ai-agent/distribute-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributions: [{
            walletAddress: playerWallet,
            tokenType: 'budz',
            amount: budzReward,
            reason: victory ? `Battle Victory (${timeRemaining}s remaining)` : 'Battle Participation'
          }]
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`💰 Battle rewards distributed: ${budzReward} BUDZ`);
        // Refresh wallet balances after reward
        setTimeout(() => fetchWalletBalances(), 1000);
      } else {
        console.error('❌ Failed to distribute battle rewards:', result);
      }
    } catch (error) {
      console.error('❌ Error processing battle rewards:', error);
    }
  }, [playerWallet, fetchWalletBalances]);

  // Elixir regeneration (authentic Clash Royale timing)
  useEffect(() => {
    if (!isGameActive) return;
    
    const interval = setInterval(() => {
      setElixir(prev => Math.min(10, prev + 1));
    }, 2800); // Exact Clash Royale elixir timing

    return () => clearInterval(interval);
  }, [isGameActive]);

  // Battle timer
  useEffect(() => {
    if (!isGameActive) return;
    
    const interval = setInterval(() => {
      setBattleTime(prev => {
        if (prev <= 1) {
          setIsGameActive(false);
          // Determine winner based on tower health
          const playerTowerHealth = towers.filter(t => t.isPlayer).reduce((sum, t) => sum + t.health, 0);
          const aiTowerHealth = towers.filter(t => !t.isPlayer).reduce((sum, t) => sum + t.health, 0);
          
          const victory = playerTowerHealth > aiTowerHealth;
          setBattleResult(victory ? 'victory' : 'defeat');
          
          // Process battle rewards via AI agent
          if (playerWallet) {
            processBattleRewards(victory, 0);
          }
          
          onBattleEnd(victory, { timeRemaining: 0, towersDestroyed: towers.filter(t => !t.isPlayer && t.isDead).length });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameActive, towers, onBattleEnd]);

  // Enhanced AI deployment system with strategic logic and deck management
  useEffect(() => {
    if (!isGameActive || playerDeck.length === 0) return;

    const deployAIUnits = () => {
      const aiDeployZones = gameZones.filter(zone => zone.type === 'ai_deploy');
      if (aiDeployZones.length === 0) return;

      // Strategic AI: Choose deployment based on game state
      const playerUnits = units.filter(u => u.isPlayer && !u.isDead);
      const aiUnits = units.filter(u => !u.isPlayer && !u.isDead);
      const playerTowerHealth = towers.filter(t => t.isPlayer).reduce((sum, t) => sum + t.health, 0);
      const aiTowerHealth = towers.filter(t => !t.isPlayer).reduce((sum, t) => sum + t.health, 0);
      
      // AI chooses cards based on advanced strategy
      let selectedCard = playerDeck[Math.floor(Math.random() * playerDeck.length)];
      
      // Defensive strategy: Player has advantage
      if (playerTowerHealth > aiTowerHealth * 1.2 || playerUnits.length > aiUnits.length + 1) {
        const defensiveCards = playerDeck.filter(card => 
          card.type === 'spell' || card.health > card.attack || card.type === 'tower'
        );
        if (defensiveCards.length > 0) {
          selectedCard = defensiveCards[Math.floor(Math.random() * defensiveCards.length)];
        }
      }
      
      // Aggressive strategy: AI has advantage or needs to push
      else if (aiTowerHealth > playerTowerHealth * 1.2 || aiUnits.length < 2) {
        const offensiveCards = playerDeck.filter(card => 
          card.attack > card.health * 0.6 && card.type !== 'spell'
        );
        if (offensiveCards.length > 0) {
          selectedCard = offensiveCards[Math.floor(Math.random() * offensiveCards.length)];
        }
      }
      
      // Counter strategy: React to player units
      if (playerUnits.length > 3) {
        const counterCards = playerDeck.filter(card => 
          card.type === 'spell' || card.attack > 50
        );
        if (counterCards.length > 0) {
          selectedCard = counterCards[Math.floor(Math.random() * counterCards.length)];
        }
      }

      if (!selectedCard) return;

      // Strategic zone selection based on game state
      let deployZone = aiDeployZones[0];
      if (aiDeployZones.length > 1) {
        // Deploy on side with fewer player units
        const leftPlayerUnits = playerUnits.filter(u => u.x < GRID_WIDTH / 2).length;
        const rightPlayerUnits = playerUnits.filter(u => u.x >= GRID_WIDTH / 2).length;
        
        if (leftPlayerUnits < rightPlayerUnits) {
          deployZone = aiDeployZones.find(z => z.id.includes('left')) || aiDeployZones[0];
        } else {
          deployZone = aiDeployZones.find(z => z.id.includes('right')) || aiDeployZones[1] || aiDeployZones[0];
        }
      }

      const deployX = deployZone.x + Math.random() * deployZone.width;
      const deployY = deployZone.y + Math.random() * deployZone.height;

      // Enhanced AI unit stats with difficulty scaling
      const difficultyMultiplier = Math.min(1.5, 1 + (180 - battleTime) / 180 * 0.5); // Scales with time
      
      const newUnit: Unit = {
        id: `ai_unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cardId: selectedCard.id,
        name: selectedCard.name,
        x: deployX,
        y: deployY,
        health: Math.floor(selectedCard.health * difficultyMultiplier),
        maxHealth: Math.floor(selectedCard.health * difficultyMultiplier),
        attack: Math.floor(selectedCard.attack * difficultyMultiplier),
        isPlayer: false,
        lastAttack: 0,
        attackCooldown: 1400, // Slightly faster than player
        range: selectedCard.type === 'spell' ? 4 : selectedCard.type === 'tower' ? 5.5 : 1.8,
        speed: 0.06 + Math.random() * 0.02, // Slightly faster movement
        size: 0.6,
        isDead: false
      };

      setUnits(prev => [...prev, newUnit]);
      console.log(`🤖 AI deployed ${selectedCard.name} (Strategy: ${playerTowerHealth > aiTowerHealth ? 'Defensive' : 'Aggressive'})`);
    };

    // Dynamic deployment timing based on game state
    const aiTowerHealth = towers.filter(t => !t.isPlayer && !t.isDead).reduce((sum, t) => sum + t.health, 0);
    const playerTowerHealth = towers.filter(t => t.isPlayer && !t.isDead).reduce((sum, t) => sum + t.health, 0);
    const aiAdvantage = aiTowerHealth > playerTowerHealth;
    const timeUrgency = battleTime < 60 ? 0.5 : 1; // Deploy faster in final minute
    
    const baseInterval = aiAdvantage ? 5500 : 4000; // ms
    const randomVariation = Math.random() * 2000;
    const deployInterval = (baseInterval + randomVariation) * timeUrgency;
    
    const aiInterval = setInterval(deployAIUnits, deployInterval);
    return () => clearInterval(aiInterval);
  }, [isGameActive, gameZones, playerDeck, units, towers, battleTime]);

  // Enhanced deploy unit function with improved zone validation and NFT bonuses
  const deployUnit = useCallback((card: Card, x: number, y: number) => {
    if (elixir < card.cost || !isGameActive) return false;

    // Enhanced deployment zone validation - check multiple player zones
    const playerDeployZones = gameZones.filter(zone => 
      zone.type === 'player_deploy' || zone.id.includes('player_deploy')
    );
    
    const gridX = Math.floor(x / BASE_CELL_SIZE);
    const gridY = Math.floor(y / BASE_CELL_SIZE);

    let validZone = false;
    
    // Check all player deployment zones
    if (playerDeployZones.length > 0) {
      validZone = playerDeployZones.some(zone => 
        gridX >= zone.x && gridX < zone.x + zone.width &&
        gridY >= zone.y && gridY < zone.y + zone.height
      );
    } else {
      // Fallback: Allow deployment in bottom half of battlefield
      validZone = gridY > GRID_HEIGHT / 2 + 2;
    }

    if (!validZone) {
      console.log(`❌ Invalid deployment zone: (${gridX}, ${gridY})`);
      return false;
    }

    // Apply NFT bonuses and rarity multipliers
    const nftBonus = nftData?.attackBonus || 0;
    const rarityMultiplier = card.rarity === 'legendary' ? 1.3 : 
                            card.rarity === 'epic' ? 1.2 : 
                            card.rarity === 'rare' ? 1.1 : 1.0;

    const newUnit: Unit = {
      id: `player_unit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      cardId: card.id,
      name: card.name,
      x: gridX,
      y: gridY,
      health: Math.floor((card.health + nftBonus) * rarityMultiplier),
      maxHealth: Math.floor((card.health + nftBonus) * rarityMultiplier),
      attack: Math.floor((card.attack + nftBonus) * rarityMultiplier),
      isPlayer: true,
      lastAttack: 0,
      attackCooldown: 1500,
      range: card.type === 'spell' ? 3.5 : card.type === 'tower' ? 5 : 1.5,
      speed: 0.05 + (card.rarity === 'legendary' ? 0.01 : 0),
      size: 0.5,
      isDead: false
    };

    setUnits(prev => [...prev, newUnit]);
    setElixir(prev => prev - card.cost);

    // Improved card cycling - avoid duplicate cards in hand
    const handIndex = currentHand.findIndex(c => c.id === card.id);
    if (handIndex !== -1 && playerDeck.length > 4) {
      const remainingCards = playerDeck.filter(deckCard => 
        !currentHand.some(handCard => handCard.id === deckCard.id || handCard.id === card.id)
      );
      const nextCard = remainingCards.length > 0 ? 
        remainingCards[Math.floor(Math.random() * remainingCards.length)] :
        playerDeck[Math.floor(Math.random() * playerDeck.length)];
      
      setCurrentHand(prev => {
        const newHand = [...prev];
        newHand[handIndex] = nextCard;
        return newHand;
      });
    }

    console.log(`✅ Deployed ${card.name} at (${gridX}, ${gridY}) with ${newUnit.attack} ATK, ${newUnit.health} HP`);
    return true;
  }, [elixir, isGameActive, gameZones, playerDeck, currentHand, nftData, BASE_CELL_SIZE, GRID_HEIGHT]);

  // Game loop for unit movement and combat
  useEffect(() => {
    if (!isGameActive) return;

    const gameLoop = () => {
      const now = Date.now();

      setUnits(prevUnits => {
        return prevUnits.map(unit => {
          if (unit.isDead) return unit;

          // Find target (nearest enemy tower or unit)
          const enemies = [
            ...towers.filter(t => t.isPlayer !== unit.isPlayer && !t.isDead),
            ...prevUnits.filter(u => u.isPlayer !== unit.isPlayer && !u.isDead)
          ];

          if (enemies.length === 0) return unit;

          const nearest = enemies.reduce((closest, enemy) => {
            const distToEnemy = Math.sqrt(Math.pow(enemy.x - unit.x, 2) + Math.pow(enemy.y - unit.y, 2));
            const distToClosest = Math.sqrt(Math.pow(closest.x - unit.x, 2) + Math.pow(closest.y - unit.y, 2));
            return distToEnemy < distToClosest ? enemy : closest;
          });

          const distance = Math.sqrt(Math.pow(nearest.x - unit.x, 2) + Math.pow(nearest.y - unit.y, 2));

          // Attack if in range
          if (distance <= unit.range && now - unit.lastAttack >= unit.attackCooldown) {
            if ('health' in nearest) {
              // Damage enemy
              if (nearest.id.includes('tower') || nearest.id.includes('castle')) {
                setTowers(prevTowers => 
                  prevTowers.map(t => {
                    if (t.id === nearest.id) {
                      const newHealth = Math.max(0, t.health - unit.attack);
                      const isDead = newHealth <= 0;
                      
                      if (isDead && !t.isDead) {
                        // Check for king tower destruction (instant win)
                        if (t.id.includes('castle')) {
                          setTimeout(() => {
                            setIsGameActive(false);
                            const victory = !t.isPlayer;
                            setBattleResult(victory ? 'victory' : 'defeat');
                            
                            // Process battle rewards via AI agent
                            if (victory && playerWallet) {
                              processBattleRewards(victory, battleTime);
                            }
                            
                            onBattleEnd(victory, { 
                              timeRemaining: battleTime, 
                              towersDestroyed: towers.filter(tower => tower.isPlayer === t.isPlayer && tower.isDead).length + 1 
                            });
                          }, 100);
                        }
                      }
                      
                      return { ...t, health: newHealth, isDead };
                    }
                    return t;
                  })
                );
              }
            }
            
            return { ...unit, lastAttack: now };
          }

          // Move towards target if not in range
          if (distance > unit.range) {
            const dx = (nearest.x - unit.x) / distance;
            const dy = (nearest.y - unit.y) / distance;
            
            return {
              ...unit,
              x: unit.x + dx * unit.speed,
              y: unit.y + dy * unit.speed
            };
          }

          return unit;
        }).filter(unit => !unit.isDead);
      });

      // Enhanced tower attacks with authentic Clash Royale mechanics
      setTowers(prevTowers => {
        return prevTowers.map(tower => {
          if (tower.isDead || now - (tower.lastAttack || 0) < 1600) return tower;

          const enemies = units.filter(u => {
            if (u.isPlayer === tower.isPlayer || u.isDead) return false;
            const distance = Math.sqrt(Math.pow(u.x - tower.x, 2) + Math.pow(u.y - tower.y, 2));
            return distance <= (tower.range || 5);
          });

          // Prioritize closest enemies
          const sortedEnemies = enemies.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - tower.x, 2) + Math.pow(a.y - tower.y, 2));
            const distB = Math.sqrt(Math.pow(b.x - tower.x, 2) + Math.pow(b.y - tower.y, 2));
            return distA - distB;
          });

          if (sortedEnemies.length > 0) {
            const target = sortedEnemies[0];
            setUnits(prevUnits => 
              prevUnits.map(u => {
                if (u.id === target.id) {
                  const damage = (tower.attack || 109) + Math.floor(Math.random() * 15);
                  const newHealth = Math.max(0, u.health - damage);
                  const isDead = newHealth <= 0;
                  
                  if (isDead) {
                    console.log(`🏰 ${tower.isPlayer ? 'Player' : 'AI'} tower eliminated ${u.name}`);
                  }
                  
                  return { ...u, health: newHealth, isDead };
                }
                return u;
              })
            );
            return { ...tower, lastAttack: now };
          }

          return tower;
        });
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGameActive, units, towers, battleTime, onBattleEnd]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw battlefield background
      if (battlefieldImage) {
        ctx.drawImage(battlefieldImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        // Fallback green battlefield
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Draw game zones (subtle overlay for deployment areas)
      gameZones.forEach(zone => {
        const x = zone.x * BASE_CELL_SIZE;
        const y = zone.y * BASE_CELL_SIZE;
        const width = zone.width * BASE_CELL_SIZE;
        const height = zone.height * BASE_CELL_SIZE;

        // Only show deployment zones and make them subtle
        if (zone.type === 'player_deploy' || zone.type === 'ai_deploy') {
          ctx.fillStyle = zone.color;
          ctx.fillRect(x, y, width, height);
          
          // Add subtle border
          ctx.strokeStyle = zone.color.replace(/0\.\d/, '0.5');
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(x, y, width, height);
          ctx.setLineDash([]);
        }
        
        // Show bridge area
        if (zone.type === 'bridge') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'; // Blue tint for river
          ctx.fillRect(x, y, width, height);
        }
      });

      // Draw towers with proper images and enhanced visuals
      towers.forEach(tower => {
        if (tower.isDead) return;
        
        const x = tower.x * BASE_CELL_SIZE;
        const y = tower.y * BASE_CELL_SIZE;
        const isCastle = tower.id.includes('castle');
        const size = isCastle ? 35 : 25;
        
        // Use proper tower/castle images if available
        const towerImg = isCastle ? castleImages.castle : towerImages.tower;
        
        if (towerImg) {
          // Draw the actual tower/castle image
          ctx.save();
          if (!tower.isPlayer) {
            // Flip AI towers to face player
            ctx.scale(1, -1);
            ctx.drawImage(towerImg, x - size/2, -(y + size/2), size, size);
          } else {
            ctx.drawImage(towerImg, x - size/2, y - size/2, size, size);
          }
          ctx.restore();
          
          // Add team color overlay
          ctx.fillStyle = tower.isPlayer ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
          ctx.fillRect(x - size/2, y - size/2, size, size);
        } else {
          // Fallback: Enhanced THC themed tower colors
          const towerColor = tower.isPlayer ? '#22C55E' : '#EF4444'; // Green vs Red
          const accentColor = tower.isPlayer ? '#16A34A' : '#DC2626';
          
          // Draw tower base with THC styling
          ctx.fillStyle = towerColor;
          ctx.fillRect(x - size/2, y - size/2, size, size);
          
          // Add border/outline
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(x - size/2, y - size/2, size, size);
          
          // Add castle crown if it's a castle
          if (isCastle) {
            ctx.fillStyle = '#FFD700'; // Gold crown
            ctx.fillRect(x - 8, y - size/2 - 10, 16, 8);
            // Crown points
            ctx.fillRect(x - 12, y - size/2 - 12, 4, 6);
            ctx.fillRect(x - 2, y - size/2 - 15, 4, 9);
            ctx.fillRect(x + 8, y - size/2 - 12, 4, 6);
          }
        }
        
        // Enhanced health bar with THC styling
        const healthRatio = tower.health / tower.maxHealth;
        const barWidth = size + 15;
        const barHeight = 5;
        
        // Background bar with border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x - barWidth/2, y - size/2 - 18, barWidth, barHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth/2, y - size/2 - 18, barWidth, barHeight);
        
        // Gradient health bar
        const gradient = ctx.createLinearGradient(x - barWidth/2, 0, x + barWidth/2, 0);
        if (healthRatio > 0.6) {
          gradient.addColorStop(0, '#22C55E');
          gradient.addColorStop(1, '#16A34A');
        } else if (healthRatio > 0.3) {
          gradient.addColorStop(0, '#EAB308');
          gradient.addColorStop(1, '#CA8A04');
        } else {
          gradient.addColorStop(0, '#EF4444');
          gradient.addColorStop(1, '#DC2626');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x - barWidth/2, y - size/2 - 18, barWidth * healthRatio, barHeight);
        
        // Health text with enhanced visibility
        ctx.fillStyle = 'white';
        ctx.font = `bold ${isMobile ? '10px' : '12px'} Arial`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(`${tower.health}`, x, y - size/2 - 25);
        ctx.fillText(`${tower.health}`, x, y - size/2 - 25);
        
        // Tower type indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${isMobile ? '8px' : '10px'} Arial`;
        ctx.fillText(isCastle ? '♔' : '🏰', x, y + size/2 + 12);
      });

      // Draw units
      units.forEach(unit => {
        if (unit.isDead) return;
        
        const x = unit.x * BASE_CELL_SIZE;
        const y = unit.y * BASE_CELL_SIZE;
        
        // Unit circle
        ctx.beginPath();
        ctx.arc(x, y, unit.size * BASE_CELL_SIZE, 0, 2 * Math.PI);
        ctx.fillStyle = unit.isPlayer ? '#2196F3' : '#FF9800';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Health bar
        const healthRatio = unit.health / unit.maxHealth;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(x - 10, y - 15, 20, 3);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(x - 10, y - 15, 20 * healthRatio, 3);
      });

      requestAnimationFrame(render);
    };

    render();
  }, [battlefieldImage, gameZones, towers, units]);

  // Drag and drop handlers
  const handleCardDragStart = (card: Card, event: React.DragEvent) => {
    if (elixir < card.cost || !isGameActive) return;
    
    setDraggedCard(card);
    setIsDragging(true);
    
    // Set drag data for proper drag events
    event.dataTransfer.setData('text/plain', card.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCanvasDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedCard || !isGameActive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale coordinates properly
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    if (deployUnit(draggedCard, x * scaleX, y * scaleY)) {
      console.log(`🎮 Deployed ${draggedCard.name} via drag and drop`);
    }
    
    setDraggedCard(null);
    setIsDragging(false);
  };

  const handleCanvasDragOver = (event: React.DragEvent) => {
    if (draggedCard && isGameActive) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      
      // Update drag position for visual feedback
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setDragPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    }
  };

  // Handle canvas click for unit deployment (fallback)
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!isGameActive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale coordinates properly
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    // Try to deploy the first card in hand
    if (currentHand.length > 0) {
      deployUnit(currentHand[0], x * scaleX, y * scaleY);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col overflow-hidden ${
      isMobile ? 'mobile-battle-container touch-optimized' : ''
    } ${orientation === 'portrait' ? 'portrait-optimized' : 'landscape-optimized'}`}>
      {/* Battle UI Header - Enhanced Mobile Layout */}
      <div className={`bg-black/90 flex items-center justify-between border-b border-gray-700 flex-shrink-0 ${
        isMobile ? 'mobile-battle-info p-2' : 'p-4'
      }`}>
        <button
          onClick={() => onBattleEnd(false, { forfeit: true })}
          className="text-white hover:text-red-400 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
        >
          <ArrowLeft size={isMobile ? 16 : 20} />
          <span className="hidden sm:inline">Exit Battle</span>
          <span className="sm:hidden">Exit</span>
        </button>
        
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-white">{formatTime(battleTime)}</div>
          <div className="text-xs sm:text-sm text-gray-400">THC CLASH</div>
          
          {/* Wallet Balances - Mobile/Desktop Responsive */}
          {playerWallet && (
            <div className={`flex ${isMobile ? 'gap-2 text-[10px]' : 'gap-3 text-xs'} text-center mt-1`}>
              <div className="text-green-400 font-bold">
                💰 {walletBalances.budzBalance.toLocaleString()}
              </div>
              <div className="text-blue-400 font-bold">
                🌟 {walletBalances.solBalance.toFixed(2)}
              </div>
              <div className="text-yellow-400 font-bold">
                💎 {walletBalances.gbuxBalance.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 bg-purple-600 px-2 sm:px-3 py-1 rounded">
            <Zap className="text-yellow-400" size={isMobile ? 12 : 16} />
            <span className="text-white font-bold text-sm sm:text-base">{elixir}/10</span>
          </div>
        </div>
      </div>

      {/* Battle Canvas - Enhanced Mobile Layout */}
      <div className={`flex-1 flex items-center justify-center bg-gray-900 overflow-hidden ${
        isMobile ? 'mobile-battle-canvas p-1' : 'p-2'
      } ${orientation === 'portrait' ? 'portrait-battle-canvas' : 'landscape-battle-canvas'}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`border border-gray-600 touch-none ${
            isMobile ? 'cursor-default' : isDragging ? 'cursor-move' : 'cursor-crosshair'
          } ${isDragging ? 'ring-2 ring-purple-400' : ''}`}
          onClick={handleCanvasClick}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onDragLeave={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Scale coordinates for canvas with device optimization
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            
            // Deploy first available card on touch
            if (currentHand.length > 0 && elixir >= currentHand[0].cost) {
              deployUnit(currentHand[0], x * scaleX, y * scaleY);
            }
          }}
          style={{ 
            imageRendering: isMobile ? 'auto' : 'pixelated',
            width: isMobile ? (orientation === 'portrait' ? '95vw' : '60vw') : '70vw',
            height: isMobile ? (orientation === 'portrait' ? '50vh' : '85vh') : '55vh',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
        
        {/* Drag preview overlay */}
        {isDragging && draggedCard && (
          <div 
            className="fixed pointer-events-none z-50 opacity-70"
            style={{
              left: dragPosition.x - 30,
              top: dragPosition.y - 40,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-purple-600 border border-purple-400 rounded p-1 text-white text-xs">
              {draggedCard.name}
            </div>
          </div>
        )}
      </div>

      {/* Card Hand - Enhanced Mobile Interface */}
      <div className={`bg-black/90 border-t border-gray-700 flex-shrink-0 ${
        isMobile ? 'mobile-card-hand p-2' : 'p-4'
      } ${orientation === 'portrait' ? 'portrait-card-area' : 'landscape-card-area'}`}>
        <div className={`flex justify-center overflow-x-auto ${
          isMobile ? 'gap-1' : 'gap-2'
        }`}>
          {currentHand.map((card, index) => (
            <motion.div
              key={`${card.id}-${index}`}
              draggable={elixir >= card.cost && isGameActive}
              className={`bg-gray-800 rounded border-2 relative flex-shrink-0 overflow-hidden ${
                isMobile ? 'mobile-card w-12 h-16' : 'w-16 h-20'
              } ${elixir >= card.cost ? 'border-purple-400 hover:border-purple-300 cursor-grab active:cursor-grabbing' : 'border-gray-600 opacity-50'} 
              ${draggedCard?.id === card.id ? 'opacity-50 scale-95' : ''}`}
              whileHover={{ scale: elixir >= card.cost ? (isMobile ? 1.02 : 1.05) : 1 }}
              whileTap={{ scale: elixir >= card.cost ? 0.95 : 1 }}
              onDragStart={(e: React.DragEvent) => {
                if (elixir >= card.cost && isGameActive) {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', card.id);
                  handleCardDragStart(card, e);
                }
              }}
              onDragEnd={() => {
                setDraggedCard(null);
                setIsDragging(false);
              }}
              onClick={() => {
                if (elixir >= card.cost && !isDragging) {
                  deployUnit(card, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
                }
              }}
            >
              <div className="flex flex-col h-full p-1">
                <img 
                  src={card.image} 
                  alt={card.name}
                  className={`w-full ${isMobile ? 'h-8 flex-shrink-0' : 'h-12 flex-shrink-0'} object-cover rounded`}
                  onError={(e) => {
                    e.currentTarget.src = '/attached_assets/good_dealer.png';
                  }}
                />
                <div className={`text-white ${isMobile ? 'text-[8px]' : 'text-[10px]'} text-center font-bold mt-auto leading-none truncate`}>
                  {card.name.slice(0, isMobile ? 3 : 6)}
                </div>
              </div>
              <div className={`absolute top-0 right-0 bg-purple-600 text-white rounded-full ${isMobile ? 'w-4 h-4 text-[7px]' : 'w-5 h-5 text-xs'} flex items-center justify-center font-bold z-10`}>
                {card.cost}
              </div>
              
              {/* Drag indicator */}
              {elixir >= card.cost && (
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-purple-500/20 rounded flex items-center justify-center">
                  <span className="text-white text-xs">🖱️</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Mobile Instructions */}
        {isMobile && (
          <div className="text-center text-gray-400 text-xs mt-2">
            Tap cards then tap battlefield to deploy • Drag cards to battlefield on desktop
          </div>
        )}
        
        {/* Desktop Instructions */}
        {!isMobile && (
          <div className="text-center text-gray-400 text-xs mt-2">
            🖱️ Drag cards onto battlefield or click cards then click deployment zone
          </div>
        )}
      </div>

      {/* Battle Result Modal */}
      <AnimatePresence>
        {battleResult && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-xl border border-gray-700 text-center max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className={`text-4xl font-bold mb-4 ${
                battleResult === 'victory' ? 'text-green-400' : 'text-red-400'
              }`}>
                {battleResult === 'victory' ? '🏆 VICTORY!' : '💀 DEFEAT!'}
              </div>
              <div className="text-gray-300 mb-6">
                {battleResult === 'victory' 
                  ? 'Congratulations! You destroyed the enemy towers!'
                  : 'Better luck next time! Your towers were destroyed.'
                }
              </div>
              <button
                onClick={() => onBattleEnd(battleResult === 'victory', { result: battleResult })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClashRoyaleBattleSystem;