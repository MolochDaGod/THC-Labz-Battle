import express from 'express';
import { storage } from '../storage';
import { gameTypes, nftBonuses } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Calculate game impacts for user's NFTs
router.post('/calculate-game-impacts', async (req, res) => {
  try {
    const { nfts } = req.body;
    const db = storage.getDb();
    
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database unavailable' });
    }
    
    if (!nfts || !Array.isArray(nfts)) {
      return res.status(400).json({ success: false, error: 'Invalid NFTs data' });
    }
    
    // Get all active game types and bonuses
    const allGameTypes = await db.select().from(gameTypes);
    const allBonuses = await db.select().from(nftBonuses);
    
    const impacts = [];
    
    for (const gameType of allGameTypes) {
      if (!gameType.isActive) continue;
      
      const gameImpact = {
        gameType: gameType.name,
        category: gameType.category,
        bonuses: [],
        totalImpactScore: 0
      };
      
      // Calculate bonuses for each NFT
      for (const nft of nfts) {
        if (!nft.attributes) continue;
        
        for (const attribute of nft.attributes) {
          // Find matching bonuses for this trait
          const matchingBonuses = allBonuses.filter((bonus: any) => 
            bonus.gameTypeId === gameType.id &&
            bonus.traitType === attribute.trait_type &&
            bonus.traitValue === attribute.value &&
            bonus.isActive
          );
          
          for (const bonus of matchingBonuses) {
            (gameImpact.bonuses as any[]).push({
              nftName: nft.name,
              nftMint: nft.mint,
              traitType: bonus.traitType,
              traitValue: bonus.traitValue,
              bonusType: bonus.bonusType,
              bonusValue: bonus.bonusValue,
              description: bonus.description,
              type: bonus.bonusType,
              value: bonus.bonusValue
            });
            
            gameImpact.totalImpactScore += bonus.bonusValue;
          }
        }
      }
      
      // Only include games with actual impacts
      if (gameImpact.bonuses.length > 0) {
        impacts.push(gameImpact);
      }
    }
    
    res.json({
      success: true,
      impacts: impacts.sort((a, b) => b.totalImpactScore - a.totalImpactScore)
    });
    
  } catch (error) {
    console.error('Error calculating game impacts:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate game impacts' });
  }
});

export default router;