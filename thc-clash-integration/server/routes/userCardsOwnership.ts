import { Router } from 'express';
import { storage } from '../storage';
import { userCards, insertUserCardSchema } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CLASSIFICATION_CARD_DATABASE } from '../../shared/classificationCardDatabase';

const router = Router();

// GET /api/cards/owned/:wallet — returns all owned cards
router.get('/owned/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const db = storage.getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    // Fetch owned cards from DB
    let ownedCards = await db
      .select()
      .from(userCards)
      .where(eq(userCards.walletAddress, wallet));

    // Auto-seed starter common cards if zero owned cards
    if (ownedCards.length === 0) {
      console.log(`🌱 Seeding starter cards for wallet: ${wallet}`);
      const starterCards = CLASSIFICATION_CARD_DATABASE.filter(card => card.rarity === 'common');
      
      const seedData = starterCards.map(card => ({
        walletAddress: wallet,
        cardId: card.id,
        cardName: card.name,
        cardData: JSON.stringify(card),
        source: 'starter'
      }));

      if (seedData.length > 0) {
        await db.insert(userCards).values(seedData);
        // Fetch again after seeding
        ownedCards = await db
          .select()
          .from(userCards)
          .where(eq(userCards.walletAddress, wallet));
      }
    }

    // Merge with nft-trait unlocks or other logic if needed
    // For now, we return the DB-owned cards which include seeded starters
    const formattedCards = ownedCards.map((oc: any) => ({
      ...oc,
      cardData: oc.cardData ? JSON.parse(oc.cardData) : null
    }));

    res.json(formattedCards);
  } catch (error: any) {
    console.error('Error fetching owned cards:', error);
    res.status(500).json({ error: 'Failed to fetch owned cards', details: error.message });
  }
});

// POST /api/cards/owned/add — adds card to user_cards
router.post('/owned/add', async (req, res) => {
  try {
    const { walletAddress, cardId, source, cardData, cardName } = req.body;
    const db = storage.getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    if (!walletAddress || !cardId) {
      return res.status(400).json({ error: 'walletAddress and cardId are required' });
    }

    // Check for duplicates
    const existing = await db
      .select()
      .from(userCards)
      .where(
        and(
          eq(userCards.walletAddress, walletAddress),
          eq(userCards.cardId, cardId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already owns this card' });
    }

    const newCard = {
      walletAddress,
      cardId,
      cardName: cardName || (cardData?.name),
      cardData: cardData ? JSON.stringify(cardData) : null,
      source: source || 'purchased',
    };

    const result = await db.insert(userCards).values(newCard).returning();

    res.json({
      success: true,
      message: 'Card added to ownership',
      card: result[0]
    });
  } catch (error: any) {
    console.error('Error adding card ownership:', error);
    res.status(500).json({ error: 'Failed to add card ownership', details: error.message });
  }
});

// PATCH /api/cards/owned/set-mint — updates nft_mint column when a card is minted as cNFT
router.patch('/owned/set-mint', async (req, res) => {
  try {
    const { walletAddress, cardId, nftMint } = req.body;
    const db = storage.getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    if (!walletAddress || !cardId || !nftMint) {
      return res.status(400).json({ error: 'walletAddress, cardId, and nftMint are required' });
    }

    const isMintAddress = nftMint.length >= 32;
    const updateData: any = { nftMint };
    if (isMintAddress && cardId.length < 32) {
      updateData.cardId = nftMint;
    }

    const result = await db
      .update(userCards)
      .set(updateData)
      .where(
        and(
          eq(userCards.walletAddress, walletAddress),
          eq(userCards.cardId, cardId)
        )
      )
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Owned card not found' });
    }

    res.json({
      success: true,
      message: 'NFT mint updated — card_id promoted to mint address',
      card: result[0]
    });
  } catch (error: any) {
    console.error('Error updating NFT mint:', error);
    res.status(500).json({ error: 'Failed to update NFT mint', details: error.message });
  }
});

// POST /api/cards/upgrade — combine 4 copies of a card at level N into 1 at level N+1
router.post('/upgrade', async (req, res) => {
  try {
    const { walletAddress, cardId, level } = req.body;
    const db = storage.getDb();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    if (!walletAddress || !cardId || !level) return res.status(400).json({ error: 'walletAddress, cardId, level required' });

    const currentLevel = Number(level);
    if (currentLevel >= 5) return res.status(400).json({ error: 'Card is already max level (5)' });

    const copies = await db
      .select()
      .from(userCards)
      .where(and(
        eq(userCards.walletAddress, walletAddress),
        eq(userCards.cardId, cardId),
        eq(userCards.level, currentLevel)
      ));

    if (copies.length < 4) {
      return res.status(400).json({ error: `Need 4 copies at level ${currentLevel} to upgrade (have ${copies.length})` });
    }

    const toDelete = copies.slice(0, 4).map((c: any) => c.id);
    for (const id of toDelete) {
      await db.delete(userCards).where(eq(userCards.id, id));
    }

    const base = copies[0];
    let cardData = base.cardData || '{}';
    try {
      const parsed = JSON.parse(cardData);
      parsed.level = currentLevel + 1;
      parsed.attack = Math.round((parsed.attack || 100) * 1.15);
      parsed.health = Math.round((parsed.health || 120) * 1.15);
      cardData = JSON.stringify(parsed);
    } catch {}

    await db.insert(userCards).values({
      walletAddress,
      cardId,
      cardName: base.cardName,
      cardData,
      source: 'upgrade',
      level: currentLevel + 1,
    });

    const allCards = await db.select().from(userCards).where(eq(userCards.walletAddress, walletAddress));
    console.log(`⬆️ Upgraded card ${cardId} from level ${currentLevel} to ${currentLevel + 1} for ${walletAddress}`);

    res.json({ success: true, message: `Card upgraded to level ${currentLevel + 1}!`, cards: allCards });
  } catch (error: any) {
    console.error('Card upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed', details: error.message });
  }
});

export default router;
