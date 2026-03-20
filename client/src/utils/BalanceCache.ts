export interface WalletBalances {
  walletAddress: string;
  gameTokenBalance: number;
  gbuxBalance: number;
  thcLabzTokenBalance: number;
  solBalance: number;
  lastUpdated: string;
  fromCache?: boolean;
}

export interface TokenPrices {
  GAME_TOKEN: number;
  GBUX: number;
  THC_LABZ: number;
  fetchedAt: number;
}

const BALANCE_TTL = 60_000;
const PRICE_TTL = 300_000;
const MIN_REFRESH_INTERVAL = 30_000;
const STORAGE_KEY = (wallet: string) => `thc-balance-v1-${wallet}`;
const PRICE_STORAGE_KEY = 'thc-prices-v1';

const inMemoryBalances = new Map<string, { data: WalletBalances; ts: number }>();
const pendingRequests = new Map<string, Promise<WalletBalances>>();
let inMemoryPrices: TokenPrices | null = null;

function loadStoredBalances(wallet: string): { data: WalletBalances; ts: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY(wallet));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts < BALANCE_TTL) return parsed;
    sessionStorage.removeItem(STORAGE_KEY(wallet));
    return null;
  } catch { return null; }
}

function saveStoredBalances(wallet: string, data: WalletBalances) {
  try {
    sessionStorage.setItem(STORAGE_KEY(wallet), JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function loadStoredPrices(): TokenPrices | null {
  try {
    const raw = sessionStorage.getItem(PRICE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt < PRICE_TTL) return parsed;
    sessionStorage.removeItem(PRICE_STORAGE_KEY);
    return null;
  } catch { return null; }
}

function saveStoredPrices(prices: TokenPrices) {
  try {
    sessionStorage.setItem(PRICE_STORAGE_KEY, JSON.stringify(prices));
  } catch {}
}

async function doFetchBalances(walletAddress: string, force = false): Promise<WalletBalances> {
  const url = force
    ? `/api/wallet/${walletAddress}/refresh`
    : `/api/wallet/${walletAddress}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Balance fetch failed');
  return resp.json();
}

export const BalanceCache = {
  async getBalances(walletAddress: string, force = false): Promise<WalletBalances> {
    if (!force) {
      const mem = inMemoryBalances.get(walletAddress);
      if (mem && Date.now() - mem.ts < BALANCE_TTL) return { ...mem.data, fromCache: true };

      const stored = loadStoredBalances(walletAddress);
      if (stored) {
        inMemoryBalances.set(walletAddress, stored);
        return { ...stored.data, fromCache: true };
      }
    } else {
      const mem = inMemoryBalances.get(walletAddress);
      if (mem && Date.now() - mem.ts < MIN_REFRESH_INTERVAL) {
        return { ...mem.data, fromCache: true };
      }
    }

    if (pendingRequests.has(walletAddress)) {
      return pendingRequests.get(walletAddress)!;
    }

    const promise = doFetchBalances(walletAddress, force)
      .then(data => {
        const entry = { data, ts: Date.now() };
        inMemoryBalances.set(walletAddress, entry);
        saveStoredBalances(walletAddress, data);
        pendingRequests.delete(walletAddress);
        return data;
      })
      .catch(err => {
        pendingRequests.delete(walletAddress);
        const mem = inMemoryBalances.get(walletAddress);
        if (mem) return { ...mem.data, fromCache: true };
        throw err;
      });

    pendingRequests.set(walletAddress, promise);
    return promise;
  },

  async getPrices(): Promise<TokenPrices> {
    if (inMemoryPrices && Date.now() - inMemoryPrices.fetchedAt < PRICE_TTL) {
      return inMemoryPrices;
    }
    const stored = loadStoredPrices();
    if (stored) { inMemoryPrices = stored; return stored; }

    try {
      const resp = await fetch('/api/token-price');
      if (!resp.ok) throw new Error('Price fetch failed');
      const data = await resp.json();
      const prices: TokenPrices = {
        GAME_TOKEN: data.prices?.GAME_TOKEN?.priceUSD ?? 0,
        GBUX:       data.prices?.GBUX?.priceUSD ?? 0,
        THC_LABZ:   data.prices?.THC_LABZ?.priceUSD ?? 0,
        fetchedAt:  Date.now(),
      };
      inMemoryPrices = prices;
      saveStoredPrices(prices);
      return prices;
    } catch {
      return { GAME_TOKEN: 0, GBUX: 0, THC_LABZ: 0, fetchedAt: Date.now() };
    }
  },

  invalidate(walletAddress: string) {
    inMemoryBalances.delete(walletAddress);
    try { sessionStorage.removeItem(STORAGE_KEY(walletAddress)); } catch {}
  },

  getCacheAge(walletAddress: string): number | null {
    const mem = inMemoryBalances.get(walletAddress);
    if (!mem) return null;
    return Date.now() - mem.ts;
  },
};
