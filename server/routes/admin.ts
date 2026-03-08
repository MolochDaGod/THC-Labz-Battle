import express from 'express';
import { storage } from '../storage';
import { gameTypes, nftBonuses, adminUsers } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Check if wallet address has admin privileges
router.get('/check/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const db = storage.getDb();
    
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    
    const adminUser = await db.select().from(adminUsers)
      .where(eq(adminUsers.walletAddress, walletAddress))
      .limit(1);
    
    if (adminUser.length > 0) {
      res.json({
        success: true,
        isAdmin: true,
        permissions: adminUser[0].permissions || ['admin'],
        permissionLevel: 'admin'
      });
    } else {
      res.json({
        success: true,
        isAdmin: false
      });
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ success: false, error: 'Failed to check admin status' });
  }
});

// Get all game types
router.get('/game-types', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    
    const allGameTypes = await db.select().from(gameTypes);
    
    res.json({
      success: true,
      gameTypes: allGameTypes
    });
  } catch (error) {
    console.error('Error fetching game types:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch game types' });
  }
});

// Create new game type
router.post('/game-types', async (req, res) => {
  try {
    const { name, category, description, nftImpactTypes, isActive } = req.body;
    const db = storage.getDb();
    
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    
    const newGameType = await db.insert(gameTypes).values({
      name,
      category,
      description,
      nftImpactTypes: JSON.stringify(nftImpactTypes || []),
      isActive: isActive ?? true,
      createdAt: new Date()
    }).returning();
    
    res.json({
      success: true,
      gameType: newGameType[0]
    });
  } catch (error) {
    console.error('Error creating game type:', error);
    res.status(500).json({ success: false, error: 'Failed to create game type' });
  }
});

// Get all NFT bonuses
router.get('/nft-bonuses', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    
    const allBonuses = await db.select().from(nftBonuses);
    
    res.json({
      success: true,
      bonuses: allBonuses
    });
  } catch (error) {
    console.error('Error fetching NFT bonuses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NFT bonuses' });
  }
});

// Create new NFT bonus
router.post('/nft-bonuses', async (req, res) => {
  try {
    const { traitType, traitValue, bonusType, bonusValue, gameTypes: gameTypeIds, description } = req.body;
    const db = storage.getDb();
    
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    
    const newBonus = await db.insert(nftBonuses).values({
      traitType,
      traitValue,
      bonusType,
      bonusValue,
      gameTypes: JSON.stringify(gameTypeIds || []),
      description,
      createdAt: new Date()
    }).returning();
    
    res.json({
      success: true,
      bonus: newBonus[0]
    });
  } catch (error) {
    console.error('Error creating NFT bonus:', error);
    res.status(500).json({ success: false, error: 'Failed to create NFT bonus' });
  }
});

// Save official PvE gameboard
router.post('/save-pve-gameboard', async (req, res) => {
  try {
    const gameboardData = req.body;
    
    // Save to memory storage for simplicity and reliability
    (global as any).officialPvEGameboard = gameboardData;
    
    console.log('✅ Official PvE gameboard saved to server memory');
    
    res.json({ 
      success: true, 
      message: 'Official PvE gameboard saved successfully',
      timestamp: gameboardData.createdAt || new Date().toISOString()
    });
  } catch (error) {
    console.error('PvE gameboard save error:', error);
    res.status(500).json({ success: false, error: 'Failed to save PvE gameboard' });
  }
});

// Load official PvE gameboard
router.get('/load-pve-gameboard', async (req, res) => {
  try {
    if ((global as any).officialPvEGameboard) {
      console.log('✅ Official PvE gameboard loaded from server memory');
      
      res.json({ 
        success: true, 
        gameboard: (global as any).officialPvEGameboard,
        message: 'Official PvE gameboard loaded successfully'
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No official PvE gameboard found - create one in admin interface'
      });
    }
  } catch (error) {
    console.error('PvE gameboard load error:', error);
    res.status(500).json({ success: false, error: 'Failed to load PvE gameboard' });
  }
});

// Clear official PvE gameboard
router.post('/clear-pve-gameboard', async (req, res) => {
  try {
    // Clear from memory storage
    (global as any).officialPvEGameboard = null;
    
    console.log('🗑️ Official PvE gameboard cleared from server memory');
    
    res.json({ 
      success: true, 
      message: 'Official PvE gameboard cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing official PvE gameboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear PvE gameboard'
    });
  }
});

export default router;