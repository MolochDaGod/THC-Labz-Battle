import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Card purchase endpoint
router.post('/purchase-card', async (req, res) => {
  try {
    const { cardId, price, walletAddress } = req.body;
    
    if (!cardId || !price || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: cardId, price, and walletAddress'
      });
    }

    // In a real implementation, you would:
    // 1. Verify user's BUDZ balance on-chain
    // 2. Deduct BUDZ tokens
    // 3. Grant card access to user
    // 4. Store purchase record in database
    
    // For now, simulate successful purchase
    console.log(`🛒 Card purchase: ${cardId} for ${price} BUDZ by ${walletAddress}`);
    
    // Replace simulated localStorage tracking with actual DB insert
    try {
      const db = storage.getDb();
      if (db) {
        const { userCards } = await import('../../shared/schema');
        const { and, eq } = await import('drizzle-orm');
        const { CLASSIFICATION_CARD_DATABASE } = await import('../../shared/classificationCardDatabase');

        const cardData = CLASSIFICATION_CARD_DATABASE.find(c => c.id === cardId);
        
        // Check if already owned
        const existing = await db.select().from(userCards).where(and(
          eq(userCards.walletAddress, walletAddress),
          eq(userCards.cardId, cardId)
        )).limit(1);

        if (existing.length === 0) {
          await db.insert(userCards).values({
            walletAddress,
            cardId,
            cardName: cardData?.name || cardId,
            cardData: cardData ? JSON.stringify(cardData) : null,
            source: 'purchased'
          });
          console.log(`✅ Recorded card ownership in DB for ${walletAddress}: ${cardId}`);
        }
      }
    } catch (dbErr) {
      console.error('⚠️ Failed to record card ownership in DB:', dbErr);
    }

    // Store purchase record locally (you can expand this with database storage)
    const purchaseRecord = {
      cardId,
      price,
      walletAddress,
      timestamp: new Date().toISOString(),
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    res.json({
      success: true,
      message: `Successfully purchased card ${cardId} for ${price} BUDZ!`,
      purchase: purchaseRecord,
      newBalance: 0 // Would be calculated based on actual token balance
    });

  } catch (error) {
    console.error('Card purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Purchase failed. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's purchase history
router.get('/purchase-history/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // In a real implementation, fetch from database
    // For now, return empty history
    res.json({
      success: true,
      walletAddress,
      purchases: [],
      totalSpent: 0,
      totalCards: 0
    });

  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase history'
    });
  }
});

export default router;