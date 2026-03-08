/**
 * AI Agent Management — Server-side SOL wallet management, pack swaps, auction system
 * Routes mounted at /api/ai-agent/management
 */
import { Router } from 'express';
import { storage } from '../storage';
import { sql } from 'drizzle-orm';

const router = Router();

const TREASURY_WALLET = process.env.AI_AGENT_TREASURY_WALLET || '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ';
const GBUX_MINT       = '55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray';
const BUDZ_MINT       = '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ';
const THC_MINT        = 'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT';

// ─── In-memory auction store (persisted to DB in future) ──────────────────────
interface AuctionListing {
  id: string;
  sellerWallet: string;
  cardId: string;
  cardName: string;
  cardImage: string;
  cardRarity: string;
  startingBid: number;
  currentBid: number;
  highestBidder: string | null;
  paymentToken: 'GBUX' | 'SOL' | 'BUDZ' | 'GAME_TOKEN';
  expiresAt: number;
  createdAt: number;
  status: 'active' | 'ended' | 'cancelled';
}

const auctionStore = new Map<string, AuctionListing>();

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Price cache ──────────────────────────────────────────────────────────────
let priceCache: { sol: number; gbux: number; budz: number; thc: number; at: number } | null = null;

async function getLivePrices() {
  if (priceCache && Date.now() - priceCache.at < 5 * 60_000) return priceCache;
  try {
    const mints = [
      'So11111111111111111111111111111111111111112',
      GBUX_MINT, BUDZ_MINT, THC_MINT,
    ].join(',');
    const r = await fetch(`https://price.jup.ag/v6/price?ids=${mints}`);
    if (r.ok) {
      const d = await r.json();
      priceCache = {
        sol:  d.data?.['So11111111111111111111111111111111111111112']?.price  || 180,
        gbux: d.data?.[GBUX_MINT]?.price || 0.0000123,
        budz: d.data?.[BUDZ_MINT]?.price || 0.0000123,
        thc:  d.data?.[THC_MINT]?.price  || 0.001,
        at: Date.now(),
      };
      return priceCache;
    }
  } catch {}
  return priceCache || { sol: 180, gbux: 0.0000123, budz: 0.0000123, thc: 0.001, at: Date.now() };
}

// ─── 1. Live token prices ─────────────────────────────────────────────────────
function fmtPrice(n: number): string {
  if (n >= 1)    return `$${n.toFixed(4)}`;
  if (n >= 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(8)}`;
}

router.get('/prices', async (_req, res) => {
  try {
    const prices = await getLivePrices();
    res.json({
      success: true,
      prices: {
        SOL:  { usd: prices.sol,  display: `$${prices.sol.toFixed(2)}` },
        GBUX: { usd: prices.gbux, display: fmtPrice(prices.gbux) },
        BUDZ: { usd: prices.budz, display: fmtPrice(prices.budz) },
        THC:  { usd: prices.thc,  display: fmtPrice(prices.thc) },
      },
      updatedAt: new Date(prices.at).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch prices' });
  }
});

// ─── 2. Pack price quote (USD → any token) ────────────────────────────────────
const PACK_USD: Record<string, number> = { 'green-bag': 0.10, 'dank-pack': 0.30, 'legend-kush': 0.75 };
const PACK_GBUX: Record<string, number> = { 'green-bag': 20, 'dank-pack': 60, 'legend-kush': 150 };

router.get('/pack-quote/:packType', async (req, res) => {
  try {
    const { packType } = req.params;
    const usd = PACK_USD[packType];
    if (!usd) return res.status(400).json({ success: false, error: 'Unknown pack type' });

    const prices = await getLivePrices();
    res.json({
      success: true,
      packType,
      usdPrice: usd,
      quotes: {
        GBUX:       { amount: PACK_GBUX[packType], token: 'GBUX' },
        SOL:        { amount: prices.sol  > 0 ? usd / prices.sol  : 0, token: 'SOL' },
        BUDZ:       { amount: prices.budz > 0 ? usd / prices.budz : 0, token: 'BUDZ' },
        GAME_TOKEN: { amount: prices.thc  > 0 ? usd / prices.thc  : 0, token: 'THC' },
      },
      treasury: TREASURY_WALLET,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate quote' });
  }
});

// ─── 3. Treasury balance (on-chain SOL + token balances) ──────────────────────
router.get('/treasury', async (_req, res) => {
  try {
    const { Connection, PublicKey, clusterApiUrl } = await import('@solana/web3.js');
    const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'), 'confirmed');
    const pubkey = new PublicKey(TREASURY_WALLET);

    let solBalance = 0;
    try {
      const lamports = await conn.getBalance(pubkey);
      solBalance = lamports / 1e9;
    } catch {}

    const prices = await getLivePrices();
    const solUsd = solBalance * prices.sol;

    res.json({
      success: true,
      treasury: {
        address: TREASURY_WALLET,
        solBalance,
        solUsd: solUsd.toFixed(2),
        prices: { SOL: prices.sol, GBUX: prices.gbux, BUDZ: prices.budz, THC: prices.thc },
      },
    });
  } catch (err) {
    console.error('Treasury balance error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch treasury balance' });
  }
});

// ─── 4. Wallet settings (read/write env-level config) ─────────────────────────
router.get('/wallet-settings', (_req, res) => {
  res.json({
    success: true,
    settings: {
      treasuryWallet:   TREASURY_WALLET,
      gbuxMint:         GBUX_MINT,
      budzMint:         BUDZ_MINT,
      thcMint:          THC_MINT,
      rpcEndpoint:      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      privateKeyLoaded: !!(process.env.AI_AGENT_PRIVATE_KEY),
      network:          'mainnet-beta',
      packPricesUSD:    PACK_USD,
      packPricesGBUX:   PACK_GBUX,
      packUSDRates: {
        description: 'All packs priced in USD. Token amounts calculated live from Jupiter prices.',
        tokens: ['GBUX', 'SOL', 'BUDZ', 'GAME_TOKEN'],
      },
    },
  });
});

// ─── 5. Auction — list a card ─────────────────────────────────────────────────
router.post('/auction/list', async (req, res) => {
  try {
    const { sellerWallet, cardId, cardName, cardImage, cardRarity, startingBid, paymentToken, durationHours } = req.body;
    if (!sellerWallet || !cardId || !cardName || !startingBid || !paymentToken) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const validTokens = ['GBUX', 'SOL', 'BUDZ', 'GAME_TOKEN'];
    if (!validTokens.includes(paymentToken)) {
      return res.status(400).json({ success: false, error: 'Invalid payment token' });
    }

    const hours = Math.min(Math.max(Number(durationHours) || 24, 1), 168); // 1–168 hours
    const listing: AuctionListing = {
      id: genId(),
      sellerWallet,
      cardId,
      cardName,
      cardImage: cardImage || '',
      cardRarity: cardRarity || 'common',
      startingBid: Number(startingBid),
      currentBid: Number(startingBid),
      highestBidder: null,
      paymentToken,
      expiresAt: Date.now() + hours * 3_600_000,
      createdAt: Date.now(),
      status: 'active',
    };

    auctionStore.set(listing.id, listing);
    console.log(`🔨 Auction listed: ${cardName} by ${sellerWallet} starting at ${startingBid} ${paymentToken}`);

    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list auction' });
  }
});

// ─── 6. Auction — get all active listings ─────────────────────────────────────
router.get('/auction/listings', (req, res) => {
  const now = Date.now();
  const { paymentToken, rarity, status } = req.query;

  let listings = Array.from(auctionStore.values());

  // Auto-expire
  listings.forEach(l => {
    if (l.status === 'active' && now > l.expiresAt) l.status = 'ended';
  });

  // Filter
  if (status) listings = listings.filter(l => l.status === status);
  else listings = listings.filter(l => l.status === 'active');
  if (paymentToken) listings = listings.filter(l => l.paymentToken === paymentToken);
  if (rarity) listings = listings.filter(l => l.cardRarity.toLowerCase() === (rarity as string).toLowerCase());

  listings.sort((a, b) => b.createdAt - a.createdAt);

  res.json({ success: true, listings, count: listings.length });
});

// ─── 7. Auction — place a bid ─────────────────────────────────────────────────
router.post('/auction/bid', async (req, res) => {
  try {
    const { auctionId, bidderWallet, bidAmount, signature } = req.body;
    if (!auctionId || !bidderWallet || !bidAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const listing = auctionStore.get(auctionId);
    if (!listing) return res.status(404).json({ success: false, error: 'Auction not found' });
    if (listing.status !== 'active') return res.status(400).json({ success: false, error: 'Auction is not active' });
    if (Date.now() > listing.expiresAt) {
      listing.status = 'ended';
      return res.status(400).json({ success: false, error: 'Auction has ended' });
    }
    if (bidderWallet === listing.sellerWallet) {
      return res.status(400).json({ success: false, error: 'Cannot bid on own auction' });
    }
    if (Number(bidAmount) <= listing.currentBid) {
      return res.status(400).json({ success: false, error: `Bid must exceed current bid of ${listing.currentBid} ${listing.paymentToken}` });
    }

    listing.currentBid = Number(bidAmount);
    listing.highestBidder = bidderWallet;
    auctionStore.set(auctionId, listing);

    console.log(`💰 Bid placed: ${bidAmount} ${listing.paymentToken} by ${bidderWallet} on ${listing.cardName} (auction ${auctionId})`);

    res.json({ success: true, listing, message: `Bid of ${bidAmount} ${listing.paymentToken} placed successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to place bid' });
  }
});

// ─── 8. Auction — buy now / end auction ──────────────────────────────────────
router.post('/auction/buy', async (req, res) => {
  try {
    const { auctionId, buyerWallet, signature } = req.body;
    if (!auctionId || !buyerWallet) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const listing = auctionStore.get(auctionId);
    if (!listing) return res.status(404).json({ success: false, error: 'Auction not found' });
    if (listing.status !== 'active') return res.status(400).json({ success: false, error: 'Auction is not active' });
    if (buyerWallet === listing.sellerWallet) {
      return res.status(400).json({ success: false, error: 'Cannot buy own listing' });
    }

    listing.status = 'ended';
    listing.highestBidder = buyerWallet;
    auctionStore.set(auctionId, listing);

    console.log(`🏆 Auction won: ${listing.cardName} → ${buyerWallet} for ${listing.currentBid} ${listing.paymentToken}`);

    res.json({ success: true, listing, message: `Purchased ${listing.cardName} for ${listing.currentBid} ${listing.paymentToken}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to complete purchase' });
  }
});

// ─── 9. Auction — cancel listing ─────────────────────────────────────────────
router.post('/auction/cancel', async (req, res) => {
  try {
    const { auctionId, sellerWallet } = req.body;
    if (!auctionId || !sellerWallet) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const listing = auctionStore.get(auctionId);
    if (!listing) return res.status(404).json({ success: false, error: 'Auction not found' });
    if (listing.sellerWallet !== sellerWallet) {
      return res.status(403).json({ success: false, error: 'Only the seller can cancel' });
    }
    if (listing.highestBidder) {
      return res.status(400).json({ success: false, error: 'Cannot cancel — active bids exist' });
    }

    listing.status = 'cancelled';
    auctionStore.set(auctionId, listing);

    res.json({ success: true, message: 'Listing cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel listing' });
  }
});

// ─── 10. On-chain pack purchase (server validates + opens pack) ───────────────
router.post('/purchase-pack', async (req, res) => {
  try {
    const { signature, walletAddress, packType, paymentToken } = req.body;
    if (!signature || !walletAddress || !packType || !paymentToken) {
      return res.status(400).json({ success: false, error: 'Missing required fields: signature, walletAddress, packType, paymentToken' });
    }

    const usd = PACK_USD[packType];
    if (!usd) return res.status(400).json({ success: false, error: 'Invalid pack type' });

    // Forward to the main verify-tx endpoint logic
    const { Connection, clusterApiUrl, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'), 'confirmed');

    let txData: any = null;
    for (let i = 0; i < 5; i++) {
      try {
        txData = await conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });
        if (txData) break;
      } catch {}
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!txData) return res.status(400).json({ success: false, error: 'Transaction not confirmed on-chain yet. Try again in a moment.' });
    if (txData.meta?.err) return res.status(400).json({ success: false, error: 'Transaction failed on Solana' });

    const prices = await getLivePrices();
    let verified = false;

    if (paymentToken === 'SOL') {
      const minLamports = Math.floor((usd / prices.sol) * 0.90 * LAMPORTS_PER_SOL);
      const allInstructions = [
        ...(txData.transaction?.message?.instructions ?? []),
        ...(txData.meta?.innerInstructions ?? []).flatMap((i: any) => i.instructions ?? []),
      ];
      verified = allInstructions.some((ix: any) =>
        ix.parsed?.type === 'transfer' &&
        ix.parsed?.info?.destination === TREASURY_WALLET &&
        parseInt(ix.parsed?.info?.lamports ?? '0') >= minLamports
      );
    } else {
      const mintMap: Record<string, string> = { GBUX: GBUX_MINT, BUDZ: BUDZ_MINT, GAME_TOKEN: THC_MINT };
      const expectedMint = mintMap[paymentToken];
      const pre = txData.meta?.preTokenBalances ?? [];
      const post = txData.meta?.postTokenBalances ?? [];
      for (const postBal of post) {
        if (postBal.mint !== expectedMint) continue;
        const preBal = pre.find((p: any) => p.accountIndex === postBal.accountIndex && p.mint === expectedMint);
        const preAmt = preBal?.uiTokenAmount?.uiAmount ?? 0;
        const diff = (postBal.uiTokenAmount?.uiAmount ?? 0) - preAmt;
        if (diff > 0 && postBal.owner === TREASURY_WALLET) { verified = true; break; }
      }
    }

    if (!verified) {
      return res.status(402).json({ success: false, error: `Payment to treasury not found. Send $${usd} worth of ${paymentToken} to ${TREASURY_WALLET}` });
    }

    // Draw cards
    const { sql } = await import('drizzle-orm');
    const db = storage.getDb();
    if (!db) return res.status(503).json({ success: false, error: 'Database unavailable' });

    const WEIGHTS: Record<string, Record<string, number>> = {
      'green-bag':   { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 },
      'dank-pack':   { common: 15, uncommon: 40, rare: 30, epic: 12, legendary: 3 },
      'legend-kush': { common: 0, uncommon: 5, rare: 30, epic: 40, legendary: 25 },
    };

    const { adminCards } = await import('../db/schema');
    const allCards = await db.select().from(adminCards);
    if (allCards.length === 0) return res.status(503).json({ success: false, error: 'No cards available' });

    const weights = WEIGHTS[packType];
    function pickCard(pool: any[]): any {
      const total = Object.values(weights).reduce((s, v) => s + v, 0);
      let rand = Math.random() * total;
      let picked = 'common';
      for (const [r, w] of Object.entries(weights)) { rand -= w; if (rand <= 0) { picked = r; break; } }
      const rarityCards = pool.filter(c => c.rarity === picked);
      const p = rarityCards.length > 0 ? rarityCards : pool;
      return p[Math.floor(Math.random() * p.length)];
    }

    const drawnCards = [pickCard(allCards), pickCard(allCards), pickCard(allCards)];

    // Persist drawn cards to user_cards
    for (const card of drawnCards) {
      try {
        await db.execute(sql`
          INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
          VALUES (${walletAddress}, ${card.id}, ${card.name}, ${JSON.stringify(card)}, 'purchased')
          ON CONFLICT (wallet_address, card_id) DO UPDATE SET card_name = EXCLUDED.card_name, source = 'purchased'
        `);
      } catch {}
    }

    console.log(`✅ AI-agent pack purchase: ${packType} ${paymentToken} wallet=${walletAddress} sig=${signature}`);
    res.json({ success: true, cards: drawnCards, signature, packType, paymentToken });
  } catch (err) {
    console.error('AI agent purchase-pack error:', err);
    res.status(500).json({ success: false, error: 'Pack purchase failed' });
  }
});

// ─── 11. Server-side SOL send (requires AI_AGENT_PRIVATE_KEY) ─────────────────
router.post('/send-sol', async (req, res) => {
  try {
    const { toWallet, lamports, reason } = req.body;
    if (!toWallet || !lamports) {
      return res.status(400).json({ success: false, error: 'toWallet and lamports required' });
    }

    const privateKey = process.env.AI_AGENT_PRIVATE_KEY;
    if (!privateKey) {
      return res.status(503).json({ success: false, error: 'AI_AGENT_PRIVATE_KEY not configured' });
    }

    const { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, clusterApiUrl } = await import('@solana/web3.js');
    const bs58 = await import('bs58');

    let secretBytes: Uint8Array;
    const trimmed = privateKey.trim();
    if (trimmed.startsWith('[')) {
      secretBytes = Uint8Array.from(JSON.parse(trimmed));
    } else {
      secretBytes = bs58.default.decode(trimmed);
    }
    const agentKeypair = Keypair.fromSecretKey(secretBytes);

    const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'), 'confirmed');
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: agentKeypair.publicKey,
        toPubkey: new PublicKey(toWallet),
        lamports: BigInt(lamports),
      })
    );

    const signature = await sendAndConfirmTransaction(conn, tx, [agentKeypair]);
    console.log(`💸 AI agent sent ${lamports} lamports → ${toWallet} | reason: ${reason} | sig: ${signature}`);
    res.json({ success: true, signature, lamports, toWallet });
  } catch (err: any) {
    console.error('AI agent send-sol error:', err);
    res.status(500).json({ success: false, error: err.message || 'SOL transfer failed' });
  }
});

// ─── 12. AI Agent full status dashboard ──────────────────────────────────────
router.get('/dashboard', async (_req, res) => {
  try {
    const prices = await getLivePrices();
    const activeAuctions = Array.from(auctionStore.values()).filter(a => a.status === 'active' && Date.now() < a.expiresAt);

    let solBalance = 0;
    try {
      const { Connection, PublicKey, clusterApiUrl } = await import('@solana/web3.js');
      const conn = new Connection(process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'), 'confirmed');
      const lamports = await conn.getBalance(new PublicKey(TREASURY_WALLET));
      solBalance = lamports / 1e9;
    } catch {}

    res.json({
      success: true,
      dashboard: {
        treasury: {
          address: TREASURY_WALLET,
          solBalance,
          solUSD: (solBalance * prices.sol).toFixed(2),
        },
        prices: {
          SOL:  `$${prices.sol.toFixed(2)}`,
          GBUX: `$${prices.gbux < 0.001 ? prices.gbux.toFixed(8) : prices.gbux.toFixed(6)}`,
          BUDZ: `$${prices.budz < 0.001 ? prices.budz.toFixed(8) : prices.budz.toFixed(6)}`,
          THC:  `$${prices.thc < 0.001 ? prices.thc.toFixed(6) : prices.thc.toFixed(4)}`,
          raw:  { SOL: prices.sol, GBUX: prices.gbux, BUDZ: prices.budz, THC: prices.thc }
        },
        auctions: {
          active: activeAuctions.length,
          total: auctionStore.size,
        },
        packs: {
          'green-bag':   { usd: 0.10, gbux: 20, sol: prices.sol  > 0 ? (0.10 / prices.sol).toFixed(6) : '—', budz: prices.budz > 0 ? Math.ceil(0.10 / prices.budz).toLocaleString() : '—', thc: prices.thc > 0 ? Math.ceil(0.10 / prices.thc).toLocaleString() : '—' },
          'dank-pack':   { usd: 0.30, gbux: 60, sol: prices.sol  > 0 ? (0.30 / prices.sol).toFixed(6) : '—', budz: prices.budz > 0 ? Math.ceil(0.30 / prices.budz).toLocaleString() : '—', thc: prices.thc > 0 ? Math.ceil(0.30 / prices.thc).toLocaleString() : '—' },
          'legend-kush': { usd: 0.75, gbux: 150, sol: prices.sol > 0 ? (0.75 / prices.sol).toFixed(6) : '—', budz: prices.budz > 0 ? Math.ceil(0.75 / prices.budz).toLocaleString() : '—', thc: prices.thc > 0 ? Math.ceil(0.75 / prices.thc).toLocaleString() : '—' },
        },
        config: {
          rpc: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
          privateKeyLoaded: !!(process.env.AI_AGENT_PRIVATE_KEY),
          network: 'mainnet-beta',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Dashboard error' });
  }
});

export { router as aiAgentManagementRoutes };
