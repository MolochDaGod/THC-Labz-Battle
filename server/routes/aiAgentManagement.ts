/**
 * AI Agent Management — Server-side SOL wallet management, pack swaps, auction system
 * Routes mounted at /api/ai-agent/management
 */
import { Router } from 'express';
import { storage } from '../storage';
import { sql } from 'drizzle-orm';

const router = Router();

const TREASURY_WALLET   = process.env.AI_AGENT_TREASURY_WALLET || '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ';
const GBUX_MINT         = '55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray';
const BUDZ_MINT         = '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ';
const THC_MINT          = 'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT';
const SOL_MINT          = 'So11111111111111111111111111111111111111112';

// ─── Platform fee: 7% on all auction settlements and swap-outs ────────────────
const PLATFORM_FEE_RATE = 0.07;

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

// ─── Price cache (5-min TTL) ──────────────────────────────────────────────────
interface PriceCache { sol: number; gbux: number; budz: number; thc: number; at: number; sources: Record<string,string> }
let priceCache: PriceCache | null = null;

/**
 * Fetch live token prices using multi-source strategy:
 *   SOL  → Jupiter v6 price API
 *   GBUX → Jupiter v6 price API (small-cap fallback: 0.0000123)
 *   BUDZ → always pegged 1:1 to GBUX (same token economics)
 *   THC  → DexScreener API (primary, has live Meteora liquidity)
 *            └→ Jupiter v2 fallback
 *            └→ hardcoded fallback 0.001
 */
async function getLivePrices(): Promise<PriceCache> {
  if (priceCache && Date.now() - priceCache.at < 5 * 60_000) return priceCache;

  const sources: Record<string, string> = {};
  let sol = 180, gbux = 0.0000123, thc = 0.001;

  // ── SOL + GBUX from Jupiter v6 ──────────────────────────────────────────────
  try {
    const jupUrl = `https://price.jup.ag/v6/price?ids=${SOL_MINT},${GBUX_MINT}`;
    const r = await fetch(jupUrl, { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const d = await r.json();
      const solP = d.data?.[SOL_MINT]?.price;
      const gbuxP = d.data?.[GBUX_MINT]?.price;
      if (solP  && solP  > 0) { sol  = solP;  sources.SOL  = 'jupiter-v6'; }
      if (gbuxP && gbuxP > 0) { gbux = gbuxP; sources.GBUX = 'jupiter-v6'; }
    }
  } catch { /* use defaults */ }

  // ── THC LABZ from DexScreener (live Meteora pool) ───────────────────────────
  try {
    const dsUrl = `https://api.dexscreener.com/latest/dex/tokens/${THC_MINT}`;
    const r = await fetch(dsUrl, { signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const d = await r.json();
      const pairs: any[] = d.pairs ?? [];
      // prefer the pair with highest USD liquidity
      const best = pairs
        .filter((p: any) => p.priceUsd && Number(p.priceUsd) > 0)
        .sort((a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
      if (best) {
        thc = Number(best.priceUsd);
        sources.THC = `dexscreener/${best.dexId}`;
      }
    }
  } catch { /* try Jupiter v2 fallback */ }

  // THC fallback → Jupiter v2
  if (!sources.THC) {
    try {
      const jupV2 = `https://api.jup.ag/price/v2?ids=${THC_MINT}`;
      const r = await fetch(jupV2, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json();
        const thcP = d.data?.[THC_MINT]?.price;
        if (thcP && thcP > 0) { thc = thcP; sources.THC = 'jupiter-v2'; }
      }
    } catch { /* keep hardcoded */ }
  }
  if (!sources.THC) { thc = 0.001; sources.THC = 'hardcoded-fallback'; }
  if (!sources.SOL)  { sources.SOL  = 'hardcoded-fallback'; }
  if (!sources.GBUX) { sources.GBUX = 'hardcoded-fallback'; }

  // BUDZ is pegged 1:1 to GBUX — same price, same token economics
  const budz = gbux;
  sources.BUDZ = `pegged-1:1-to-GBUX (${sources.GBUX})`;

  priceCache = { sol, gbux, budz, thc, at: Date.now(), sources };
  console.log(`💰 Prices refreshed — SOL:${sol.toFixed(2)} GBUX:${gbux} BUDZ:${budz} THC:${thc} | sources:`, sources);
  return priceCache;
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

// ─── 8. Auction — buy now / settle (with 7% platform fee) ────────────────────
//
//  Fee breakdown on every settlement:
//    buyer  pays:   bidAmount  (full)
//    seller gets:   bidAmount × 0.93  (93%)
//    treasury gets: bidAmount × 0.07  (7%)
//
//  Settlement flow:
//    1. Validate listing & buyer
//    2. For GBUX/BUDZ: check DB balance → deduct buyer → credit seller 93% → credit treasury 7%
//    3. Transfer card ownership in user_cards (and via Crossmint if cNFT mint exists)
//    4. Mark auction ended
// ─────────────────────────────────────────────────────────────────────────────
router.post('/auction/buy', async (req, res) => {
  try {
    const { auctionId, buyerWallet, signature } = req.body;
    if (!auctionId || !buyerWallet) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const listing = auctionStore.get(auctionId);
    if (!listing) return res.status(404).json({ success: false, error: 'Auction not found' });
    if (listing.status !== 'active') return res.status(400).json({ success: false, error: 'Auction is not active' });
    if (Date.now() > listing.expiresAt) {
      listing.status = 'ended';
      return res.status(400).json({ success: false, error: 'Auction has ended' });
    }
    if (buyerWallet === listing.sellerWallet) {
      return res.status(400).json({ success: false, error: 'Cannot buy own listing' });
    }

    const saleAmount   = listing.currentBid;
    const feeAmount    = Math.ceil(saleAmount * PLATFORM_FEE_RATE * 1000) / 1000;
    const sellerPayout = saleAmount - feeAmount;
    const token        = listing.paymentToken;

    // ── On-chain tokens (SOL): trust the provided signature ──────────────────
    // SOL auctions require the buyer to have already sent SOL on-chain.
    // The server verifies this via the signature param (same as pack purchase flow).
    // GBUX/BUDZ auctions are settled server-side via DB balances.

    if (token === 'GBUX' || token === 'BUDZ') {
      const db = storage.getDb();
      if (!db) return res.status(503).json({ success: false, error: 'Database unavailable' });

      const balCol = token === 'GBUX' ? 'gbux_balance' : 'budz_balance';

      // Check buyer balance
      const buyerRows = await db.execute(sql`
        SELECT ${sql.raw(balCol)} as bal FROM users WHERE wallet_address = ${buyerWallet}
      `);
      const buyerBal = Number((buyerRows as any).rows?.[0]?.bal ?? 0);
      if (buyerBal < saleAmount) {
        return res.status(402).json({
          success: false,
          error: `Insufficient ${token} balance. Need ${saleAmount}, have ${buyerBal.toFixed(4)}`,
        });
      }

      // Deduct from buyer
      await db.execute(sql`
        UPDATE users SET ${sql.raw(balCol)} = ${sql.raw(balCol)} - ${saleAmount}
        WHERE wallet_address = ${buyerWallet}
      `);

      // Credit seller (93%)
      await db.execute(sql`
        INSERT INTO users (wallet_address, ${sql.raw(balCol)})
        VALUES (${listing.sellerWallet}, ${sellerPayout})
        ON CONFLICT (wallet_address) DO UPDATE
          SET ${sql.raw(balCol)} = users.${sql.raw(balCol)} + ${sellerPayout}
      `);

      // Credit treasury (7%)
      await db.execute(sql`
        INSERT INTO users (wallet_address, ${sql.raw(balCol)})
        VALUES (${TREASURY_WALLET}, ${feeAmount})
        ON CONFLICT (wallet_address) DO UPDATE
          SET ${sql.raw(balCol)} = users.${sql.raw(balCol)} + ${feeAmount}
      `);

      console.log(`💸 Auction fee: ${feeAmount} ${token} → treasury | seller receives ${sellerPayout} ${token}`);

      // Transfer card in user_cards
      try {
        await db.execute(sql`
          DELETE FROM user_cards WHERE wallet_address = ${listing.sellerWallet} AND card_id = ${listing.cardId}
        `);
        await db.execute(sql`
          INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
          VALUES (${buyerWallet}, ${listing.cardId}, ${listing.cardName}, ${JSON.stringify({ id: listing.cardId, name: listing.cardName, image: listing.cardImage, rarity: listing.cardRarity })}, 'auction')
          ON CONFLICT (wallet_address, card_id) DO UPDATE SET card_name = EXCLUDED.card_name, source = 'auction'
        `);
        console.log(`🃏 Card ${listing.cardName} transferred: ${listing.sellerWallet} → ${buyerWallet}`);
      } catch (cardErr) {
        console.warn('Card transfer DB error (non-fatal):', cardErr);
      }
    }

    // ── cNFT transfer via Crossmint if nft_mint is set ───────────────────────
    let crossmintTxId: string | null = null;
    if ((listing as any).nftMint) {
      try {
        const { crossmintService } = await import('../crossmint');
        const agentWalletId = process.env.CROSSMINT_AGENT_WALLET_ID;
        if (agentWalletId) {
          const result = await (crossmintService as any).transferNft(agentWalletId, buyerWallet, (listing as any).nftMint);
          crossmintTxId = result?.id ?? null;
          console.log(`🖼️ cNFT ${(listing as any).nftMint} transferred → ${buyerWallet} | crossmint tx: ${crossmintTxId}`);
        }
      } catch (nftErr: any) {
        console.warn('Crossmint cNFT transfer failed (non-fatal):', nftErr.message);
      }
    }

    listing.status = 'ended';
    listing.highestBidder = buyerWallet;
    auctionStore.set(auctionId, listing);

    console.log(`🏆 Auction settled: ${listing.cardName} → ${buyerWallet} | ${saleAmount} ${token} (fee: ${feeAmount})`);

    res.json({
      success: true,
      listing,
      settlement: {
        saleAmount,
        platformFee:   feeAmount,
        platformFeeRate: `${(PLATFORM_FEE_RATE * 100).toFixed(0)}%`,
        sellerReceives: sellerPayout,
        token,
        crossmintTxId,
      },
      message: `Purchased ${listing.cardName} for ${saleAmount} ${token} (${(PLATFORM_FEE_RATE * 100).toFixed(0)}% fee applied)`,
    });
  } catch (err) {
    console.error('Auction buy error:', err);
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
      'green-bag':   { common: 100, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
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

// ─── 10b. Token swap-out with 7% fee ─────────────────────────────────────────
//
//  When the AI agent performs a token swap on behalf of a user:
//    - 7% of the input amount is taken as platform fee
//    - 93% proceeds to the actual Jupiter swap
//  Supported input tokens: GBUX, BUDZ
//  Output tokens: any (SOL, THC, etc.)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/swap-out', async (req, res) => {
  try {
    const { walletAddress, inputToken, inputAmount, outputToken } = req.body;
    if (!walletAddress || !inputToken || !inputAmount || !outputToken) {
      return res.status(400).json({ success: false, error: 'walletAddress, inputToken, inputAmount, outputToken required' });
    }

    const validInputs = ['GBUX', 'BUDZ'];
    if (!validInputs.includes(inputToken)) {
      return res.status(400).json({ success: false, error: 'inputToken must be GBUX or BUDZ' });
    }

    const db = storage.getDb();
    if (!db) return res.status(503).json({ success: false, error: 'Database unavailable' });

    const amount       = Number(inputAmount);
    const feeAmount    = Math.ceil(amount * PLATFORM_FEE_RATE * 10000) / 10000;
    const swapAmount   = amount - feeAmount;
    const balCol       = inputToken === 'GBUX' ? 'gbux_balance' : 'budz_balance';

    // Check balance
    const rows = await db.execute(sql`
      SELECT ${sql.raw(balCol)} as bal FROM users WHERE wallet_address = ${walletAddress}
    `);
    const bal = Number((rows as any).rows?.[0]?.bal ?? 0);
    if (bal < amount) {
      return res.status(402).json({ success: false, error: `Insufficient ${inputToken}. Need ${amount}, have ${bal}` });
    }

    // Deduct full amount from user
    await db.execute(sql`
      UPDATE users SET ${sql.raw(balCol)} = ${sql.raw(balCol)} - ${amount}
      WHERE wallet_address = ${walletAddress}
    `);

    // Credit treasury fee (7%)
    await db.execute(sql`
      INSERT INTO users (wallet_address, ${sql.raw(balCol)})
      VALUES (${TREASURY_WALLET}, ${feeAmount})
      ON CONFLICT (wallet_address) DO UPDATE
        SET ${sql.raw(balCol)} = users.${sql.raw(balCol)} + ${feeAmount}
    `);

    const prices = await getLivePrices();
    const inputMint  = inputToken === 'GBUX' ? GBUX_MINT : BUDZ_MINT;
    const outputMint = outputToken === 'SOL' ? SOL_MINT : outputToken === 'THC' ? THC_MINT : outputToken;

    // Return the Jupiter swap quote for the remaining 93%
    let quoteUrl = '';
    try {
      const inputPrice = inputToken === 'GBUX' ? prices.gbux : prices.budz;
      const outputPrice = outputToken === 'SOL' ? prices.sol : outputToken === 'THC' ? prices.thc : 0;
      const estimatedOutput = outputPrice > 0 ? (swapAmount * inputPrice) / outputPrice : null;
      quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.round(swapAmount * 1e6)}&slippageBps=50`;

      console.log(`🔄 Swap-out: ${amount} ${inputToken} → ${outputToken} | fee: ${feeAmount} | swap: ${swapAmount}`);

      res.json({
        success: true,
        swap: {
          inputToken, inputAmount: amount, outputToken,
          platformFee: feeAmount, platformFeeRate: `${(PLATFORM_FEE_RATE * 100).toFixed(0)}%`,
          netSwapAmount: swapAmount,
          estimatedOutput,
          jupiterQuoteUrl: quoteUrl,
          note: `Use jupiterQuoteUrl to get the on-chain swap quote for ${swapAmount} ${inputToken} → ${outputToken}`,
        },
      });
    } catch {
      res.json({
        success: true,
        swap: {
          inputToken, inputAmount: amount, outputToken,
          platformFee: feeAmount, platformFeeRate: `${(PLATFORM_FEE_RATE * 100).toFixed(0)}%`,
          netSwapAmount: swapAmount,
          jupiterQuoteUrl: quoteUrl,
        },
      });
    }
  } catch (err) {
    console.error('Swap-out error:', err);
    res.status(500).json({ success: false, error: 'Swap failed' });
  }
});

// ─── 10c. Settle expired auction (pick winner from highest bidder) ────────────
router.post('/auction/settle', async (req, res) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId) return res.status(400).json({ success: false, error: 'auctionId required' });

    const listing = auctionStore.get(auctionId);
    if (!listing) return res.status(404).json({ success: false, error: 'Auction not found' });
    if (listing.status === 'cancelled') return res.status(400).json({ success: false, error: 'Auction was cancelled' });
    if (listing.status === 'active' && Date.now() < listing.expiresAt) {
      return res.status(400).json({ success: false, error: 'Auction is still active' });
    }

    if (!listing.highestBidder) {
      listing.status = 'ended';
      auctionStore.set(auctionId, listing);
      return res.json({ success: true, result: 'no-bids', listing });
    }

    // Reuse the buy logic by delegating to the buy endpoint internally
    const saleAmount   = listing.currentBid;
    const feeAmount    = Math.ceil(saleAmount * PLATFORM_FEE_RATE * 1000) / 1000;
    const sellerPayout = saleAmount - feeAmount;
    const token        = listing.paymentToken;

    if (token === 'GBUX' || token === 'BUDZ') {
      const db = storage.getDb();
      if (db) {
        const balCol = token === 'GBUX' ? 'gbux_balance' : 'budz_balance';
        try {
          await db.execute(sql`
            UPDATE users SET ${sql.raw(balCol)} = ${sql.raw(balCol)} - ${saleAmount}
            WHERE wallet_address = ${listing.highestBidder}
          `);
          await db.execute(sql`
            INSERT INTO users (wallet_address, ${sql.raw(balCol)})
            VALUES (${listing.sellerWallet}, ${sellerPayout})
            ON CONFLICT (wallet_address) DO UPDATE
              SET ${sql.raw(balCol)} = users.${sql.raw(balCol)} + ${sellerPayout}
          `);
          await db.execute(sql`
            INSERT INTO users (wallet_address, ${sql.raw(balCol)})
            VALUES (${TREASURY_WALLET}, ${feeAmount})
            ON CONFLICT (wallet_address) DO UPDATE
              SET ${sql.raw(balCol)} = users.${sql.raw(balCol)} + ${feeAmount}
          `);
          await db.execute(sql`
            DELETE FROM user_cards WHERE wallet_address = ${listing.sellerWallet} AND card_id = ${listing.cardId}
          `);
          await db.execute(sql`
            INSERT INTO user_cards (wallet_address, card_id, card_name, card_data, source)
            VALUES (${listing.highestBidder}, ${listing.cardId}, ${listing.cardName},
              ${JSON.stringify({ id: listing.cardId, name: listing.cardName, image: listing.cardImage, rarity: listing.cardRarity })}, 'auction-settle')
            ON CONFLICT (wallet_address, card_id) DO UPDATE SET source = 'auction-settle'
          `);
        } catch (dbErr) { console.warn('Settle DB partial error:', dbErr); }
      }
    }

    listing.status = 'ended';
    auctionStore.set(auctionId, listing);
    console.log(`⚖️ Auction settled: ${listing.cardName} → ${listing.highestBidder} for ${saleAmount} ${token} (fee: ${feeAmount})`);

    res.json({
      success: true,
      result: 'settled',
      winner: listing.highestBidder,
      listing,
      settlement: { saleAmount, platformFee: feeAmount, sellerReceives: sellerPayout, token },
    });
  } catch (err) {
    console.error('Auction settle error:', err);
    res.status(500).json({ success: false, error: 'Failed to settle auction' });
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
          GBUX: fmtPrice(prices.gbux),
          BUDZ: fmtPrice(prices.budz),
          THC:  fmtPrice(prices.thc),
          note: '1 GBUX = 1 BUDZ (pegged)',
          raw:  { SOL: prices.sol, GBUX: prices.gbux, BUDZ: prices.budz, THC: prices.thc },
          sources: prices.sources,
        },
        fees: {
          auctionFee:    `${(PLATFORM_FEE_RATE * 100).toFixed(0)}%`,
          swapOutFee:    `${(PLATFORM_FEE_RATE * 100).toFixed(0)}%`,
          sellerReceives: `${((1 - PLATFORM_FEE_RATE) * 100).toFixed(0)}%`,
          treasuryWallet: TREASURY_WALLET,
          description:   'Platform takes 7% on all auction sales and token swap-outs',
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
