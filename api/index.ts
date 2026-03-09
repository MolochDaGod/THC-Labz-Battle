/**
 * Vercel Serverless API — handles all /api/* requests for THC CLASH Battle.
 * Connects to the shared Neon PostgreSQL database.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq } from 'drizzle-orm';

// Lazy DB init
let _db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) return null;
    _db = drizzle(neon(url));
  }
  return _db;
}

// ─── Route handlers ──────────────────────────────────────

async function walletAuth(req: VercelRequest, res: VercelResponse) {
  const { walletAddress } = req.body || {};
  if (!walletAddress) return res.status(400).json({ success: false, error: 'walletAddress required' });
  const db = getDb();
  if (!db) return res.json({ success: true, user: { walletAddress, budzBalance: 0, gbuxBalance: 0, thcBalance: 0 } });
  try {
    // Upsert user
    await db.execute(sql`
      INSERT INTO users (username, password, wallet_address, starter_packs_remaining)
      VALUES (${walletAddress}, 'wallet_auth', ${walletAddress}, 3)
      ON CONFLICT (wallet_address) DO NOTHING
    `);
    const rows = await db.execute(sql`
      SELECT id, username, display_name, wallet_address, gbux_balance, budz_balance
      FROM users WHERE wallet_address = ${walletAddress} LIMIT 1
    `);
    const user = (rows as any).rows?.[0] || (rows as any)[0];
    if (!user) return res.json({ success: true, user: { walletAddress, budzBalance: 0, gbuxBalance: 0, thcBalance: 0 } });
    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        displayName: user.display_name || user.username,
        budzBalance: Number(user.budz_balance ?? 0),
        gbuxBalance: Number(user.gbux_balance ?? 0),
        thcBalance: 0,
      },
    });
  } catch (err) {
    console.error('walletAuth error:', err);
    res.json({ success: true, user: { walletAddress, budzBalance: 0, gbuxBalance: 0, thcBalance: 0 } });
  }
}

async function ssoVerify(req: VercelRequest, res: VercelResponse) {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });
  try {
    // Dynamic import for edge compat
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'fallback-dev-secret';
    const decoded = jwt.default.verify(token, secret) as any;
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
    await db.execute(sql`
      INSERT INTO users (username, password, wallet_address, starter_packs_remaining)
      VALUES (${decoded.walletAddress}, 'wallet_auth', ${decoded.walletAddress}, 3)
      ON CONFLICT (wallet_address) DO NOTHING
    `);
    const rows = await db.execute(sql`
      SELECT id, username, display_name, wallet_address, gbux_balance, budz_balance
      FROM users WHERE wallet_address = ${decoded.walletAddress} LIMIT 1
    `);
    const user = (rows as any).rows?.[0] || (rows as any)[0];
    if (!user) return res.status(404).json({ error: 'User not found after upsert' });
    res.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        displayName: user.display_name || user.username,
        gbuxBalance: Number(user.gbux_balance ?? 0),
        budzBalance: Number(user.budz_balance ?? 0),
        loginMethod: 'sso',
        isAuthenticated: true,
        source: decoded.source,
      },
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'SSO token expired' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid SSO token' });
    console.error('SSO error:', err);
    res.status(500).json({ error: 'SSO verification failed' });
  }
}

async function walletBalance(req: VercelRequest, res: VercelResponse) {
  const wallet = req.query.path?.[1] || '';
  const db = getDb();
  if (!db || !wallet) return res.json({ walletAddress: wallet, gameTokenBalance: 0, budzBalance: 0, gbuxBalance: 0 });
  try {
    const rows = await db.execute(sql`
      SELECT gbux_balance, budz_balance FROM users WHERE wallet_address = ${wallet} LIMIT 1
    `);
    const user = (rows as any).rows?.[0] || (rows as any)[0];
    res.json({
      walletAddress: wallet,
      gameTokenBalance: 0,
      budzBalance: Number(user?.budz_balance ?? 0),
      gbuxBalance: Number(user?.gbux_balance ?? 0),
    });
  } catch {
    res.json({ walletAddress: wallet, gameTokenBalance: 0, budzBalance: 0, gbuxBalance: 0 });
  }
}

async function myNfts(req: VercelRequest, res: VercelResponse) {
  const wallet = req.query.path?.[1] || '';
  if (!wallet) return res.json({ success: false, nfts: [] });
  try {
    // Fetch from Helius DAS API
    const heliusKey = process.env.HELIUS_API_KEY || process.env.HELIUS_PROJECT_ID || '';
    const rpcUrl = heliusKey
      ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
      : 'https://api.mainnet-beta.solana.com';
    const resp = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 'nft-fetch', method: 'getAssetsByOwner',
        params: { ownerAddress: wallet, page: 1, limit: 50, displayOptions: { showCollectionMetadata: true } },
      }),
    });
    const data = await resp.json();
    const items = (data as any).result?.items || [];
    // Filter THC GROWERZ collection
    const growerz = items.filter((nft: any) => {
      const name = (nft.content?.metadata?.name || '').toLowerCase();
      const collection = nft.grouping?.find((g: any) => g.group_key === 'collection')?.group_value || '';
      return name.includes('growerz') || name.includes('thc') || collection === 'DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6WK3GChEySUpHSS4x';
    });
    const nfts = growerz.map((nft: any) => ({
      mint: nft.id,
      name: nft.content?.metadata?.name || 'Unknown',
      image: nft.content?.links?.image || nft.content?.files?.[0]?.uri || '',
      attributes: nft.content?.metadata?.attributes || [],
      rank: null,
    }));
    res.json({ success: true, nfts, total: nfts.length });
  } catch (err) {
    console.error('NFT fetch error:', err);
    res.json({ success: false, nfts: [], error: 'Failed to fetch NFTs' });
  }
}

async function ownedCards(req: VercelRequest, res: VercelResponse) {
  const wallet = req.query.path?.[2] || '';
  const db = getDb();
  if (!db || !wallet) return res.json({ cards: [], count: 0, starterPacksRemaining: 3 });
  try {
    const rows = await db.execute(sql`
      SELECT * FROM user_cards WHERE wallet_address = ${wallet}
    `);
    const cards = ((rows as any).rows || rows || []).map((c: any) => ({
      ...c,
      cardData: c.card_data ? JSON.parse(c.card_data) : null,
    }));
    const userRows = await db.execute(sql`
      SELECT starter_packs_remaining FROM users WHERE wallet_address = ${wallet} LIMIT 1
    `);
    const starterPacks = ((userRows as any).rows?.[0] || (userRows as any)[0])?.starter_packs_remaining ?? 3;
    res.json({ cards, count: cards.length, starterPacksRemaining: Number(starterPacks) });
  } catch {
    res.json({ cards: [], count: 0, starterPacksRemaining: 3 });
  }
}

async function adminCardsList(_req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  if (!db) return res.json([]);
  try {
    const rows = await db.execute(sql`SELECT * FROM admin_cards WHERE is_active = true ORDER BY name`);
    res.json((rows as any).rows || rows || []);
  } catch {
    res.json([]);
  }
}

async function cardShopBalance(req: VercelRequest, res: VercelResponse) {
  const wallet = req.query.path?.[2] || '';
  const db = getDb();
  if (!db || !wallet) return res.json({ gbuxBalance: 0 });
  try {
    const rows = await db.execute(sql`SELECT gbux_balance FROM users WHERE wallet_address = ${wallet} LIMIT 1`);
    const user = (rows as any).rows?.[0] || (rows as any)[0];
    res.json({ gbuxBalance: Number(user?.gbux_balance ?? 0) });
  } catch {
    res.json({ gbuxBalance: 0 });
  }
}

async function healthCheck(_req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  res.json({
    success: true,
    status: db ? 'healthy' : 'degraded',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

// ─── Router ──────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse path: /api/auth/wallet → ['auth', 'wallet']
  const rawPath = (req.query.path as string[]) || [];
  const path = rawPath.join('/');

  try {
    // Auth routes
    if (path === 'auth/wallet' && req.method === 'POST') return walletAuth(req, res);
    if (path === 'auth/sso' && req.method === 'POST') return ssoVerify(req, res);

    // Wallet info
    if (path.startsWith('wallet/') && req.method === 'GET') return walletBalance(req, res);

    // NFTs
    if (path.startsWith('my-nfts/') && req.method === 'GET') return myNfts(req, res);

    // Cards
    if (path.startsWith('cards/owned/') && req.method === 'GET') return ownedCards(req, res);
    if (path === 'admin/cards' && req.method === 'GET') return adminCardsList(req, res);

    // Card shop
    if (path.startsWith('card-shop/balance/') && req.method === 'GET') return cardShopBalance(req, res);

    // Health
    if (path === 'health') return healthCheck(req, res);

    // Fallback
    res.status(404).json({ error: 'Not found', path: `/api/${path}` });
  } catch (err) {
    console.error('API handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
