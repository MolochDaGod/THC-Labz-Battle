import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import purchaseRoutes from "./routes/purchase";
import dopeBudzRoutes from "./routes/dopeBudz";
import { aiAgentRoutes } from "./ai-agent-routes";
import { aiAgentManagementRoutes } from "./routes/aiAgentManagement";
import gbuxSwapRoutes from "./routes/gbuxSwap";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleRewards } from "./rewards";
import { scheduleWeeklyRewards } from "./weekly-rewards";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { aiAgentWallet } from './ai-agent-wallet';
import { gameFlowManager } from './game-flow-manager';

// Session types extension


// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);

// Force production environment setup - detect production mode from multiple sources
const isProduction = process.env.EXPRESS_ENV === "production" || 
                    process.argv.includes("--production") ||
                    __filename.includes("dist/index.js");

if (isProduction) {
  process.env.NODE_ENV = "production";
}

const app = express();

// Configure CORS to allow iframe embedding and THC DOPE BUDZ integration
app.use(cors({
  origin: [
    'https://growerz.thc-labz.xyz',
    'https://dopebudz.thc-labz.xyz',
    'https://cannabis-cultivator-grudgedev.replit.app',
    'https://grudge-thc-growrez.replit.app',
    /.*\.thc-labz\.xyz$/,
    /.*\.replit\.dev$/,
    /.*\.replit\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure Helmet with iframe support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: [
        "'self'", 
        "https://growerz.thc-labz.xyz",
        "https://dopebudz.thc-labz.xyz",
        "https://*.thc-labz.xyz",
        "https://cannabis-cultivator-grudgedev.replit.app",
        "https://grudge-thc-growrez.replit.app"
      ],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  xFrameOptions: false
}));

// Explicitly set express environment for production
if (isProduction) {
  app.set("env", "production");
  log("🚀 Production mode detected and enabled");
}

// Production security and optimization middleware
if (isProduction) {
  // Trust proxy for production deployment
  app.set('trust proxy', 1);

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Request compression
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
} else {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
}

// Fix MIME type for TypeScript/JavaScript modules
app.use((req, res, next) => {
  const ext = req.path.split('.').pop();
  if (ext === 'tsx' || ext === 'ts') {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (ext === 'js' && req.path.includes('src/')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});


// Serve attached assets - check both development and production paths
const attachedAssetsPath = isProduction 
  ? path.resolve('dist/attached_assets')
  : path.resolve('attached_assets');

if (fs.existsSync(attachedAssetsPath)) {
  app.use('/attached_assets', express.static(attachedAssetsPath));
  log(`Serving attached assets from: ${attachedAssetsPath}`);
} else {
  log(`Warning: Attached assets path not found: ${attachedAssetsPath}`);
}

// Inject AdMob environment variables into the client
app.get('/admob-config.js', (req, res) => {
  const config = `
    window.ADMOB_APP_ID = ${JSON.stringify(process.env.ADMOB_APP_ID || '')};
    window.ADMOB_REWARDED_AD_UNIT_ID = ${JSON.stringify(process.env.ADMOB_REWARDED_AD_UNIT_ID || '')};
    console.log('📱 AdMob configuration loaded:', {
      appId: window.ADMOB_APP_ID ? 'Configured' : 'Not configured',
      rewardedAdUnitId: window.ADMOB_REWARDED_AD_UNIT_ID ? 'Configured' : 'Not configured'
    });
  `;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache'); // Don't cache config
  res.send(config);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthStatus);
});

app.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ready',
    message: 'THC Labz Dope Boys is ready to serve traffic',
    timestamp: new Date().toISOString()
  });
});

// Serve app-ads.txt for AdMob monetization
app.get('/app-ads.txt', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send('google.com, pub-1772521802067941, DIRECT, f08c47fec0942fa0');
});

// NFT Trait Analysis API
app.post('/api/calculate-nft-benefits', async (req, res) => {
  try {
    const { walletAddress, nft } = req.body;

    if (!walletAddress || !nft) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and NFT data required'
      });
    }

    console.log(`🎮 Calculating real game benefits for NFT: ${nft.name} (Rank #${nft.rank})`);

    // Real trait analysis mapping
    const traitBonusMap: Record<string, Record<string, any>> = {
      "Background": {
        "Galaxy": { attackBonus: 25, healthBonus: 50, specialAbilities: ["cosmic_power"] },
        "Sunset": { attackBonus: 20, healthBonus: 40, manaBonus: 0.15 },
        "Forest": { healthBonus: 60, defenseBonus: 20, specialAbilities: ["nature_healing"] },
        "Desert": { attackBonus: 30, defenseBonus: 15, specialAbilities: ["heat_resistance"] },
        "Ocean": { healthBonus: 45, manaBonus: 0.20, specialAbilities: ["water_blessing"] },
        "Mountain": { defenseBonus: 35, healthBonus: 30, specialAbilities: ["rock_solid"] },
        "City": { attackBonus: 15, manaBonus: 0.10, deckSize: 2 }
      },
      "Strain": {
        "OG Kush": { attackBonus: 40, healthBonus: 20, specialAbilities: ["legendary_strain"] },
        "Sour Diesel": { attackBonus: 35, manaBonus: 0.25, specialAbilities: ["energy_boost"] },
        "White Widow": { healthBonus: 70, defenseBonus: 25, specialAbilities: ["frost_armor"] },
        "Purple Haze": { attackBonus: 30, healthBonus: 30, specialAbilities: ["confusion_aura"] },
        "Blue Dream": { healthBonus: 50, manaBonus: 0.30, specialAbilities: ["dream_shield"] },
        "Green Crack": { attackBonus: 45, manaBonus: 0.20, specialAbilities: ["speed_burst"] },
        "Gorilla Glue": { defenseBonus: 40, healthBonus: 40, specialAbilities: ["sticky_trap"] }
      },
      "Eyes": {
        "Laser": { attackBonus: 50, specialAbilities: ["laser_vision", "precision_strike"] },
        "Fire": { attackBonus: 35, specialAbilities: ["burn_damage"] },
        "Ice": { defenseBonus: 30, specialAbilities: ["freeze_enemies"] },
        "Gold": { manaBonus: 0.40, deckSize: 5, specialAbilities: ["midas_touch"] },
        "Diamond": { defenseBonus: 50, healthBonus: 100, specialAbilities: ["diamond_skin"] },
        "Rainbow": { attackBonus: 20, healthBonus: 20, manaBonus: 0.15, deckSize: 3 }
      }
    };

    const baseBonuses = {
      attackBonus: 10,
      healthBonus: 25,
      defenseBonus: 5,
      manaBonus: 0.05,
      specialAbilities: [] as string[],
      deckSize: 12
    };

    const rank = nft.rank || 2420;
    const rankMultiplier = Math.max(0.1, (2420 - rank) / 2420);

    // Analyze real traits
    const traits = nft.attributes || nft.traits || [];

    traits.forEach((trait: any) => {
      const traitType = trait.trait_type;
      const traitValue = trait.value;

      if (traitBonusMap[traitType] && traitBonusMap[traitType][traitValue]) {
        const bonus = traitBonusMap[traitType][traitValue];

        baseBonuses.attackBonus += (bonus.attackBonus || 0) * (1 + rankMultiplier);
        baseBonuses.healthBonus += (bonus.healthBonus || 0) * (1 + rankMultiplier);
        baseBonuses.defenseBonus += (bonus.defenseBonus || 0) * (1 + rankMultiplier);
        baseBonuses.manaBonus += (bonus.manaBonus || 0) * (1 + rankMultiplier);
        baseBonuses.deckSize += bonus.deckSize || 0;

        if (bonus.specialAbilities) {
          baseBonuses.specialAbilities.push(...bonus.specialAbilities);
        }
      }
    });

    // Apply rank bonuses
    baseBonuses.attackBonus = Math.floor(baseBonuses.attackBonus);
    baseBonuses.healthBonus = Math.floor(baseBonuses.healthBonus);
    baseBonuses.defenseBonus = Math.floor(baseBonuses.defenseBonus);
    baseBonuses.deckSize = Math.min(40, Math.max(8, baseBonuses.deckSize));

    if (rank <= 50) {
      baseBonuses.specialAbilities.push("legendary_aura", "double_strike", "commander");
    } else if (rank <= 200) {
      baseBonuses.specialAbilities.push("epic_power", "leadership");
    } else if (rank <= 500) {
      baseBonuses.specialAbilities.push("rare_blessing");
    }

    // Create captain card
    const captainCard = {
      name: nft.name || `THC Grower #${nft.tokenId}`,
      image: nft.image || nft.imageUrl || '',
      attack: 100 + baseBonuses.attackBonus,
      health: 200 + baseBonuses.healthBonus,
      abilities: [...baseBonuses.specialAbilities],
      rarity: rank <= 50 ? 'legendary' : rank <= 200 ? 'epic' : rank <= 500 ? 'rare' : 'common',
      cost: 0
    };

    // Generate enhanced deck
    const baseDeck = [
      { name: "Grower Soldier", attack: 60, health: 100, cost: 2, type: "basic" },
      { name: "THC Defender", attack: 40, health: 150, cost: 2, type: "tank" },
      { name: "Bud Archer", attack: 80, health: 70, cost: 3, type: "ranged" },
      { name: "Strain Wizard", attack: 100, health: 80, cost: 4, type: "magic" },
      { name: "Harvest Guardian", attack: 120, health: 200, cost: 5, type: "elite" },
      { name: "Trichome Assassin", attack: 150, health: 60, cost: 4, type: "stealth" },
      { name: "Resin Bomber", attack: 90, health: 90, cost: 3, type: "explosive" },
      { name: "Cannabinoid Healer", attack: 30, health: 120, cost: 3, type: "support" }
    ];

    // Grant access to specific cards from 1-66 collection based on NFT rank
    const grantedCardIds: number[] = [];
    if (rank <= 100) {
      // Top 100 NFTs get access to premium cards (51-66)
      grantedCardIds.push(...Array.from({ length: 16 }, (_, i) => 51 + i));
    } else if (rank <= 500) {
      // Top 500 NFTs get access to mid-tier cards (26-50)  
      grantedCardIds.push(...Array.from({ length: 25 }, (_, i) => 26 + i));
    } else if (rank <= 1000) {
      // Top 1000 NFTs get access to starter cards (11-25)
      grantedCardIds.push(...Array.from({ length: 15 }, (_, i) => 11 + i));
    } else {
      // Other NFTs get access to basic cards (1-10)
      grantedCardIds.push(...Array.from({ length: 10 }, (_, i) => 1 + i));
    }

    // Add trait-based bonus cards from specific card numbers
    traits.forEach((trait: any) => {
      const traitHash = (trait.trait_type + trait.value).toLowerCase();
      const cardNumber = (traitHash.charCodeAt(0) + traitHash.charCodeAt(traitHash.length - 1)) % 66 + 1;
      if (!grantedCardIds.includes(cardNumber)) {
        grantedCardIds.push(cardNumber);
      }
    });

    // Ensure we have at least 8 cards for deck building
    while (grantedCardIds.length < 8) {
      const randomCard = Math.floor(Math.random() * 66) + 1;
      if (!grantedCardIds.includes(randomCard)) {
        grantedCardIds.push(randomCard);
      }
    }

    // Create authentic cards from 1-66 collection
    const traitCards = grantedCardIds.map((cardNumber: number) => ({
      id: `card-${cardNumber}`,
      cardNumber,
      name: `THC Card ${cardNumber}`,
      image: `https://howrare.is/drop_thumbnail/${cardNumber}`,
      attack: Math.floor(45 + (cardNumber / 66) * 55 + baseBonuses.attackBonus * 0.3),
      health: Math.floor(65 + (cardNumber / 66) * 85 + baseBonuses.healthBonus * 0.2),
      cost: Math.min(8, Math.max(1, 2 + Math.floor(cardNumber / 11))),
      rarity: cardNumber > 50 ? 'legendary' : cardNumber > 30 ? 'epic' : cardNumber > 15 ? 'rare' : 'common',
      type: ['basic', 'ranged', 'tank', 'magic', 'stealth'][Math.floor(cardNumber / 14) % 5],
      class: cardNumber <= 22 ? 'melee' : cardNumber <= 44 ? 'ranged' : 'tank',
      description: `Authentic THC Card #${cardNumber} unlocked by ${nft.name}`,
      abilities: [`Card ${cardNumber} Power`],
      isNFTConnected: true
    }));

    const enhancedDeck = baseDeck.map(card => ({
      ...card,
      attack: card.attack + Math.floor(baseBonuses.attackBonus * 0.3),
      health: card.health + Math.floor(baseBonuses.healthBonus * 0.2),
      description: `Enhanced by ${nft.name || 'your NFT'}`
    }));

    while (enhancedDeck.length < baseBonuses.deckSize) {
      const baseCard = baseDeck[enhancedDeck.length % baseDeck.length];
      enhancedDeck.push({
        ...baseCard,
        name: `${baseCard.name} +`,
        attack: baseCard.attack + baseBonuses.attackBonus,
        health: baseCard.health + baseBonuses.healthBonus,
        description: `Enhanced by ${nft.name || 'your NFT'}`
      });
    }

    console.log(`✅ Real NFT benefits calculated: +${baseBonuses.attackBonus} ATK, +${baseBonuses.healthBonus} HP, ${baseBonuses.deckSize} cards`);

    res.json({
      success: true,
      data: {
        nft: {
          name: nft.name,
          image: nft.image || nft.imageUrl,
          rank: nft.rank,
          mint: nft.mint || nft.tokenId
        },
        bonuses: baseBonuses,
        captainCard: {
          ...captainCard,
          isUnique: true, // Unique NFT-based card, not auto-deploying
          id: `captain-${nft.rank || nft.tokenId}`,
          providesBonus: true // This card provides deck-wide bonuses when in deck
        },
        enhancedDeck: [...traitCards, ...enhancedDeck].slice(0, baseBonuses.deckSize),
        battleCards: traitCards, // Only NFT-enhanced cards for GROWERZ tab
        traitAnalysis: {
          totalTraits: traits.length,
          unlockedCards: grantedCardIds.length,
          cardNumbers: grantedCardIds.sort((a, b) => a - b),
          rankTier: rank <= 100 ? 'Premium' : rank <= 500 ? 'Elite' : rank <= 1000 ? 'Advanced' : 'Standard',
          realGameBenefits: traits.map((t: any) => ({
            trait: `${t.value} ${t.trait_type}`,
            bonus: traitBonusMap[t.trait_type]?.[t.value] || { attackBonus: 5, healthBonus: 8 }
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error calculating NFT benefits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate NFT benefits'
    });
  }
});

(async () => {
  const server = await registerRoutes(app);

  // Register purchase routes
  app.use('/api', purchaseRoutes);

  // Register AI Agent routes
  app.use('/api/ai-agent', aiAgentRoutes);
  app.use('/api/ai-agent/management', aiAgentManagementRoutes);

  // Register GBUX swap routes
  app.use('/api/swap', gbuxSwapRoutes);

  // Register Dope Budz game routes
  app.use('/api/dope-budz', dopeBudzRoutes);

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error details in production
    if (isProduction) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Request Error',
        error: message,
        status,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }));
    }

    res.status(status).json({ 
      message: isProduction ? "Internal Server Error" : message,
      ...((!isProduction) && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const environment = app.get("env");
  const nodeEnv = process.env.NODE_ENV;
  log(`Environment check: app.get("env") = "${environment}", NODE_ENV = "${nodeEnv}", isProduction = ${isProduction}`);

  if (!isProduction) {
    log("Setting up Vite development server");
    await setupVite(app, server);
  } else {
    log("Setting up static file serving for production");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    const startupMessage = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'THC Labz Dope Boys Server Started',
      port,
      environment: process.env.NODE_ENV || 'development',
      ready: true
    };

    if (isProduction) {
      console.log(JSON.stringify(startupMessage));
    } else {
      log(`serving on port ${port}`);
    }

    // AI wallet system disabled for THC CLASH - not needed for card battle game

    // Initialize reward schedulers
    try {
      scheduleRewards();
      scheduleWeeklyRewards();
      log("💰 Daily and weekly rewards systems initialized");
    } catch (error) {
      log("❌ Failed to initialize rewards:", String(error));
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Received ${signal}. Shutting down gracefully...`
    }));

    server.close(() => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Server closed successfully'
      }));
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Forced shutdown after timeout'
      }));
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();