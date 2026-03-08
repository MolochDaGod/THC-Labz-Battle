import express from "express";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

const router = express.Router();

const RPC_URL = process.env.SOLANA_RPC_URL
  || (process.env.HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}` : null)
  || (process.env.HELIUS_RPC_URL ?? null)
  || clusterApiUrl('mainnet-beta');

const connection = new Connection(RPC_URL, 'confirmed');

export const TOKEN_ADDRESSES = {
  GAME_TOKEN: "2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ",
  GBUX:       "55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray",
  THC_LABZ:   "BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT",
  SOL:        "So11111111111111111111111111111111111111112",
};

export const TREASURY_WALLET = "2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ";

const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const BALANCE_CACHE_TTL = 60_000;
const balanceCache = new Map<string, { data: any; ts: number }>();

const PRICE_CACHE_TTL = 300_000;
const priceCache = new Map<string, { price: number; ts: number }>();

export async function fetchJupiterPrice(mintAddress: string): Promise<number> {
  const cached = priceCache.get(mintAddress);
  if (cached && Date.now() - cached.ts < PRICE_CACHE_TTL) return cached.price;
  try {
    const resp = await fetch(`https://price.jup.ag/v6/price?ids=${mintAddress}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return 0;
    const data = await resp.json();
    const price = data?.data?.[mintAddress]?.price ?? 0;
    priceCache.set(mintAddress, { price, ts: Date.now() });
    return price;
  } catch { return 0; }
}

export interface BalanceResponse {
  walletAddress: string;
  gameTokenBalance: number;
  gbuxBalance: number;
  thcLabzTokenBalance: number;
  thcBalance: number;
  solBalance: number;
  budzBalance: number;
  lastUpdated: string;
  fromCache: boolean;
}

async function fetchLiveBalances(walletAddress: string): Promise<BalanceResponse> {
  const publicKey = new PublicKey(walletAddress);
  let solBalance = 0;
  try { solBalance = await connection.getBalance(publicKey) / 1e9; } catch {}

  let gameTokenBalance = 0, gbuxBalance = 0, thcLabzTokenBalance = 0;
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey(SPL_TOKEN_PROGRAM),
    });
    for (const acct of tokenAccounts.value) {
      const info = acct.account.data.parsed.info;
      const uiAmount = info.tokenAmount.uiAmount || 0;
      if (info.mint === TOKEN_ADDRESSES.GAME_TOKEN)  gameTokenBalance = uiAmount;
      else if (info.mint === TOKEN_ADDRESSES.GBUX)   gbuxBalance = uiAmount;
      else if (info.mint === TOKEN_ADDRESSES.THC_LABZ) thcLabzTokenBalance = uiAmount;
    }
  } catch (e) { console.error('Token balance error:', e); }

  return {
    walletAddress, gameTokenBalance, gbuxBalance,
    thcLabzTokenBalance, thcBalance: thcLabzTokenBalance,
    solBalance, budzBalance: 0, lastUpdated: new Date().toISOString(), fromCache: false,
  };
}

async function handleGetWalletInfo(req: any, res: any) {
  try {
    const walletAddress = req.params.walletAddress;
    try { new PublicKey(walletAddress); } catch {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    const cached = balanceCache.get(walletAddress);
    if (cached && Date.now() - cached.ts < BALANCE_CACHE_TTL) {
      return res.json({ ...cached.data, fromCache: true });
    }
    const data = await fetchLiveBalances(walletAddress);
    balanceCache.set(walletAddress, { data, ts: Date.now() });
    res.json(data);
  } catch { res.status(500).json({ error: 'Balance fetch failed' }); }
}

router.get('/wallet/:walletAddress', handleGetWalletInfo);

router.get('/wallet/:walletAddress/refresh', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    balanceCache.delete(walletAddress);
    const data = await fetchLiveBalances(walletAddress);
    balanceCache.set(walletAddress, { data, ts: Date.now() });
    res.json(data);
  } catch { res.status(500).json({ error: 'Refresh failed' }); }
});

router.get('/token-price', async (_req, res) => {
  try {
    const [gameTokenPrice, gbuxPrice, thcLabzPrice] = await Promise.all([
      fetchJupiterPrice(TOKEN_ADDRESSES.GAME_TOKEN),
      fetchJupiterPrice(TOKEN_ADDRESSES.GBUX),
      fetchJupiterPrice(TOKEN_ADDRESSES.THC_LABZ),
    ]);
    res.json({
      success: true,
      prices: {
        GAME_TOKEN: { mint: TOKEN_ADDRESSES.GAME_TOKEN, priceUSD: gameTokenPrice },
        GBUX:       { mint: TOKEN_ADDRESSES.GBUX,       priceUSD: gbuxPrice },
        THC_LABZ:   { mint: TOKEN_ADDRESSES.THC_LABZ,   priceUSD: thcLabzPrice },
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch { res.status(500).json({ error: 'Price fetch failed' }); }
});

router.get('/token-prices', async (req, res) => {
  try {
    const prices = {
      GAME_TOKEN: await fetchJupiterPrice(TOKEN_ADDRESSES.GAME_TOKEN),
      GBUX:       await fetchJupiterPrice(TOKEN_ADDRESSES.GBUX),
      THC_LABZ:   await fetchJupiterPrice(TOKEN_ADDRESSES.THC_LABZ),
    };
    res.json({ success: true, prices, lastUpdated: new Date().toISOString() });
  } catch { res.status(500).json({ error: 'Price fetch failed' }); }
});

router.get('/transaction-cost', (_req, res) => {
  res.json({
    success: true,
    data: { baseCost: 0.000005, tokenTransferCost: 0.002, totalCostSOL: 0.002005 },
  });
});

export const tokenRoutes = router;
export { tokenRoutes as default, handleGetWalletInfo as getWalletInfo };
