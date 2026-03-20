import { Router } from 'express';

const router = Router();

// In-memory storage for game configuration (can be moved to database later)
let gameConfiguration: any = null;

// Save master game configuration
router.post('/save-game-config', (req, res) => {
  try {
    const config = req.body;
    
    // Validate configuration structure
    if (!config.gameConfig || !config.timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration format'
      });
    }
    
    // Store configuration
    gameConfiguration = {
      ...config,
      savedAt: new Date().toISOString()
    };
    
    console.log('✅ Master game configuration saved:', gameConfiguration);
    
    res.json({
      success: true,
      message: 'Game configuration saved successfully',
      config: gameConfiguration
    });
  } catch (error) {
    console.error('❌ Error saving game configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save game configuration'
    });
  }
});

// Load master game configuration
router.get('/load-game-config', (req, res) => {
  try {
    if (!gameConfiguration) {
      return res.json({
        success: false,
        message: 'No game configuration found'
      });
    }
    
    res.json({
      success: true,
      config: gameConfiguration
    });
  } catch (error) {
    console.error('❌ Error loading game configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load game configuration'
    });
  }
});

// Get current game settings for battle system
router.get('/current-settings', (req, res) => {
  try {
    const settings = gameConfiguration ? {
      elixirSystem: gameConfiguration.gameConfig?.elixirSystem || {
        startingElixir: 5,
        maxElixir: 10,
        regenRate: 2.8,
        enabled: true
      },
      battleSystem: gameConfiguration.gameConfig?.battleSystem || {
        battleTime: 180,
        overtimeTime: 60,
        damageMultiplier: 1.0,
        enabled: true
      },
      aiSystem: gameConfiguration.gameConfig?.aiSystem || {
        difficulty: 'medium',
        reactionTime: 1.5,
        cardCycleSpeed: 2.0,
        adaptiveStrategy: true
      },
      economySystem: gameConfiguration.gameConfig?.economySystem || {
        victoryReward: 100,
        participationReward: 25,
        streakBonus: 10,
        enabled: true
      }
    } : null;
    
    res.json({
      success: true,
      settings,
      hasConfig: !!gameConfiguration
    });
  } catch (error) {
    console.error('❌ Error getting current settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current settings'
    });
  }
});

export default router;