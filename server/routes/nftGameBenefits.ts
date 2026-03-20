import { Router } from 'express';
import { NFTTraitAnalyzer } from '../services/nftTraitAnalyzer';
import { storage } from '../storage.js';
const db = storage.getDb();
import { playerNftAnalysis } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Calculate real NFT game benefits based on traits
router.post('/calculate-nft-benefits', async (req, res) => {
  try {
    const { walletAddress, nft } = req.body;

    if (!walletAddress || !nft) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and NFT data required'
      });
    }

    console.log(`🎮 Calculating real game benefits for NFT: ${nft.name} (Rank #${nft.rank})`);
    
    // Use the proper NFTTraitAnalyzer for comprehensive trait processing
    const analysis = NFTTraitAnalyzer.analyzeNFTTraits(nft);
    
    console.log(`📊 FIXED ANALYSIS RESULT: ATK ${analysis.bonuses.attackBonus}, HP ${analysis.bonuses.healthBonus}, DEF ${analysis.bonuses.defenseBonus}, MANA ${analysis.bonuses.manaBonus.toFixed(3)}, Abilities: [${analysis.bonuses.specialAbilities.join(', ')}]`);
    
    // Generate comprehensive trait-based deck using the proper method
    const enhancedDeck = NFTTraitAnalyzer.generateTraitBasedDeck(nft, analysis.bonuses);

    // Save analysis to database (skip if db is null)
    if (db) {
      try {
        const existingAnalysis = await db
          .select()
          .from(playerNftAnalysis)
          .where(eq(playerNftAnalysis.nft_mint, nft.mint || nft.tokenId))
          .limit(1);

        const analysisData = {
          wallet_address: walletAddress,
          nft_mint: nft.mint || nft.tokenId || nft.id,
          nft_name: nft.name,
          nft_image: nft.image || nft.imageUrl,
          nft_rank: nft.rank,
          traits: nft.attributes || nft.traits || [],
          calculated_bonuses: analysis.bonuses,
          deck_size: analysis.bonuses.deckSize,
          captain_card_data: analysis.captainCard,
          last_updated: new Date()
        };

        if (existingAnalysis.length > 0) {
          await db
            .update(playerNftAnalysis)
            .set(analysisData)
            .where(eq(playerNftAnalysis.nft_mint, nft.mint || nft.tokenId));
        } else {
          await db.insert(playerNftAnalysis).values(analysisData);
        }
      } catch (dbError) {
        console.log('📝 Database save failed, continuing without persistence:', (dbError as Error).message);
      }
    } else {
      console.log('📝 Database not available, skipping persistence');
    }

    console.log(`✅ Real NFT benefits calculated: +${analysis.bonuses.attackBonus} ATK, +${analysis.bonuses.healthBonus} HP, ${analysis.bonuses.deckSize} cards`);

    res.json({
      success: true,
      data: {
        nft: {
          name: nft.name,
          image: nft.image || nft.imageUrl,
          rank: nft.rank,
          mint: nft.mint || nft.tokenId
        },
        bonuses: analysis.bonuses,
        captainCard: analysis.captainCard,
        enhancedDeck,
        traitAnalysis: {
          totalTraits: (nft.attributes || nft.traits || []).length,
          rareTraits: (nft.attributes || nft.traits || []).filter((t: any) => 
            ['Galaxy', 'OG Kush', 'Laser', 'Crown', 'Armor'].includes(t.value)
          ).length
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

// Get saved NFT analysis
router.get('/nft-analysis/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const analysis = await db
      .select()
      .from(playerNftAnalysis)
      .where(eq(playerNftAnalysis.wallet_address, walletAddress))
      .orderBy(playerNftAnalysis.last_updated);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error fetching NFT analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT analysis'
    });
  }
});

export default router;