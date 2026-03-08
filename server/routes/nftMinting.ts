import { Router } from 'express';
import { crossmintService } from '../crossmint';

const router = Router();

// POST /api/cards/mint-nft — Mint a cNFT for a game card
router.post('/cards/mint-nft', async (req, res) => {
  try {
    const { walletAddress, card } = req.body;

    if (!walletAddress || !card) {
      return res.status(400).json({ error: 'walletAddress and card are required' });
    }

    if (!card.id || !card.name || !card.image) {
      return res.status(400).json({ error: 'card must have id, name, and image' });
    }

    console.log(`🎴 NFT mint request from wallet ${walletAddress} for card "${card.name}"`);

    const result = await crossmintService.mintCardNFT(walletAddress, {
      id: card.id,
      name: card.name,
      image: card.image,
      description: card.description || `THC CLASH — ${card.rarity} ${card.class} card`,
      rarity: card.rarity || 'common',
      class: card.class || 'melee',
      attack: Number(card.attack) || 50,
      health: Number(card.health) || 100,
      cost: Number(card.cost) || 3,
    });

    if (result.success) {
      // Update DB ownership with the new mintId/txHash if applicable
      try {
        const db = storage.getDb();
        if (db) {
          const { userCards } = await import('../../shared/schema');
          const { and, eq } = await import('drizzle-orm');
          
          await db.update(userCards)
            .set({ nftMint: result.mintId || result.txHash })
            .where(and(
              eq(userCards.walletAddress, walletAddress),
              eq(userCards.cardId, card.id)
            ));
          console.log(`✅ Updated DB ownership with NFT mint for card ${card.id}`);
        }
      } catch (dbErr) {
        console.error('⚠️ Failed to update card ownership with mintId:', dbErr);
      }

      res.json({
        success: true,
        mintId: result.mintId,
        txHash: result.txHash,
        message: `cNFT mint initiated for "${card.name}"`
      });
    } else {
      res.status(502).json({ success: false, error: result.error || 'Mint failed' });
    }
  } catch (err: any) {
    console.error('❌ NFT minting route error:', err);
    res.status(500).json({ error: 'Failed to mint NFT' });
  }
});

// GET /api/cards/mint-status/:mintId — Check status of a pending mint
router.get('/cards/mint-status/:mintId', async (req, res) => {
  try {
    const { mintId } = req.params;
    const status = await crossmintService.getMintStatus(mintId);
    res.json({ success: true, status });
  } catch (err: any) {
    console.error('❌ Mint status check failed:', err);
    res.status(500).json({ error: 'Failed to check mint status' });
  }
});

export default router;
