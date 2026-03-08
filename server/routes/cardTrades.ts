import { Router } from 'express';
import { storage } from '../storage';
import { sql } from 'drizzle-orm';

const router = Router();

function getDb() {
  return storage.getDb();
}

router.get('/trades', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT * FROM card_trades WHERE status = 'active' ORDER BY created_at DESC LIMIT 100
    `);
    res.json({ success: true, trades: rows.rows });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/trades/my/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const db = getDb();
    const rows = await db.execute(sql`
      SELECT * FROM card_trades WHERE seller_wallet = ${wallet} ORDER BY created_at DESC
    `);
    res.json({ success: true, trades: rows.rows });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/trades/list', async (req, res) => {
  try {
    const { sellerWallet, cardId, cardName, cardData, nftMint, askingPriceBudz } = req.body;
    if (!sellerWallet || !cardId) {
      return res.status(400).json({ success: false, error: 'sellerWallet and cardId required' });
    }
    const db = getDb();
    const owned = await db.execute(sql`
      SELECT id FROM user_cards WHERE wallet_address = ${sellerWallet} AND card_id = ${cardId} LIMIT 1
    `);
    if (!owned.rows.length) {
      return res.status(403).json({ success: false, error: 'You do not own this card' });
    }
    const result = await db.execute(sql`
      INSERT INTO card_trades (seller_wallet, card_id, card_name, card_data, nft_mint, asking_price_budz)
      VALUES (${sellerWallet}, ${cardId}, ${cardName || null}, ${cardData ? JSON.stringify(cardData) : null}, ${nftMint || null}, ${askingPriceBudz || 0})
      RETURNING *
    `);
    res.json({ success: true, trade: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.body;
    const db = getDb();
    const existing = await db.execute(sql`
      SELECT * FROM card_trades WHERE id = ${parseInt(id)} LIMIT 1
    `);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    const trade = existing.rows[0] as any;
    if (trade.seller_wallet !== walletAddress) {
      return res.status(403).json({ success: false, error: 'Not your listing' });
    }
    await db.execute(sql`
      UPDATE card_trades SET status = 'cancelled' WHERE id = ${parseInt(id)}
    `);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/trades/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerWallet } = req.body;
    if (!buyerWallet) {
      return res.status(400).json({ success: false, error: 'buyerWallet required' });
    }
    const db = getDb();

    const existing = await db.execute(sql`
      SELECT * FROM card_trades WHERE id = ${parseInt(id)} AND status = 'active' LIMIT 1
    `);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, error: 'Active trade not found' });
    }
    const trade = existing.rows[0] as any;
    const price = Number(trade.asking_price_budz) || 0;

    // Check buyer can't buy their own listing
    if (trade.seller_wallet === buyerWallet) {
      return res.status(400).json({ success: false, error: 'You cannot buy your own listing' });
    }

    // Verify and deduct buyer BUDZ balance (if price > 0)
    if (price > 0) {
      const buyerRow = await db.execute(sql`
        SELECT budz_balance FROM users WHERE wallet_address = ${buyerWallet} LIMIT 1
      `);
      if (!buyerRow.rows.length) {
        return res.status(404).json({ success: false, error: 'Buyer not found. Connect wallet first.' });
      }
      const buyerBudz = Number((buyerRow.rows[0] as any).budz_balance) || 0;
      if (buyerBudz < price) {
        return res.status(402).json({
          success: false,
          error: `Insufficient BUDZ. Need ${price.toLocaleString()}, have ${buyerBudz.toLocaleString()}.`
        });
      }

      // Deduct from buyer, credit seller — atomic transaction
      await db.execute(sql`
        UPDATE users SET budz_balance = budz_balance - ${price} WHERE wallet_address = ${buyerWallet}
      `);
      await db.execute(sql`
        UPDATE users SET budz_balance = budz_balance + ${price} WHERE wallet_address = ${trade.seller_wallet}
      `);
    }

    // Mark trade completed
    await db.execute(sql`
      UPDATE card_trades SET status = 'completed', buyer_wallet = ${buyerWallet}, updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `);

    // Transfer card ownership to buyer
    await db.execute(sql`
      INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, nft_mint, source)
      VALUES (${buyerWallet}, ${trade.card_id}, ${trade.card_name}, ${trade.card_data}, ${trade.nft_mint}, 'purchased')
      ON CONFLICT (wallet_address, card_id) DO UPDATE SET source = 'purchased', acquired_at = NOW()
    `);

    // Remove card from seller's inventory
    await db.execute(sql`
      DELETE FROM user_cards WHERE wallet_address = ${trade.seller_wallet} AND card_id = ${trade.card_id}
    `);

    console.log(`💰 Trade #${id} completed: ${trade.card_name} sold to ${buyerWallet} for ${price} BUDZ`);
    res.json({
      success: true,
      message: `Trade accepted! ${trade.card_name} transferred for ${price.toLocaleString()} BUDZ.`,
      cardName: trade.card_name,
      pricePaid: price
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
