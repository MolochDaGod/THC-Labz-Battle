/**
 * Central token configuration for the THC LABZ ecosystem.
 * Single source of truth for all token addresses, decimals, and metadata.
 */

export const TOKENS = {
  THC: {
    symbol:   'THC',
    name:     'THC LABZ',
    mint:     'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT',
    decimals: 6,
    icon:     '/thc-labz-token.png',
    coingecko: null,
    jupiter:  'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT',
  },
  GBUX: {
    symbol:   'BUDZ',
    name:     'BUDZ (in-game balance)',
    mint:     '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ',
    decimals: 6,
    icon:     '/budz-token.png',
    coingecko: null,
    jupiter:  '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ',
  },
  BUDZ: {
    symbol:   'BUDZ',
    name:     'DOPE BUDZ',
    mint:     '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ',
    decimals: 6,
    icon:     '/budz-token.png',
    coingecko: null,
    jupiter:  '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ',
  },
  SOL: {
    symbol:   'SOL',
    name:     'Solana',
    mint:     'So11111111111111111111111111111111111111112',
    decimals: 9,
    icon:     '/icons/solana.svg',
    coingecko: 'solana',
    jupiter:  'So11111111111111111111111111111111111111112',
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// AI Agent treasury wallet — receives all on-chain pack payments
// Set VITE_TREASURY_WALLET env var to override
export const TREASURY_WALLET =
  (import.meta as any).env?.VITE_TREASURY_WALLET ||
  '98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK';

export const PACK_USD_PRICES: Record<string, number> = {
  'green-bag':   0.10,
  'dank-pack':   0.30,
  'legend-kush': 0.75,
};

export const PACK_GBUX_PRICES: Record<string, number> = {
  'green-bag':   20,
  'dank-pack':   60,
  'legend-kush': 150,
};

export const PACK_BUDZ_PRICES: Record<string, number> = {
  'green-bag':   500_000,
  'dank-pack':   1_500_000,
  'legend-kush': 3_500_000,
};

export const BUDZ_BATTLE_REWARDS: Record<string, number> = {
  win:               10_000,
  loss:               2_000,
  perfectWin:        25_000,
  tourney1st:       100_000,
  tourney2nd:        50_000,
  tourney3rd:        25_000,
  dailyLogin:         5_000,
  packOpen:           1_000,
};

export const GBUX_BATTLE_REWARDS: Record<string, number> = {
  win:     5,
  loss:    1,
  perfectWin: 15,
};

export function getTokenByMint(mint: string) {
  return Object.values(TOKENS).find(t => t.mint === mint) ?? null;
}

export function getTokenBySymbol(symbol: string) {
  return TOKENS[symbol.toUpperCase() as TokenSymbol] ?? null;
}
