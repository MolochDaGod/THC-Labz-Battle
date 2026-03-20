/**
 * Crossmint client-side configuration.
 * Used by CrossmintService and useCrossmint hook.
 */

export const CROSSMINT_CONFIG = {
  clientApiKey: (import.meta as any).env?.VITE_CROSSMINT_CLIENT_API_KEY ?? '',
  projectId:    (import.meta as any).env?.VITE_CROSSMINT_PROJECT_ID ?? '',
  environment:  ((import.meta as any).env?.VITE_CROSSMINT_ENV ?? 'production') as 'staging' | 'production',
  baseUrl:      'https://api.crossmint.com',
  walletType:   'solana-mpc-wallet' as const,
};

export const CROSSMINT_AUTH_METHODS = [
  'wallet',
  'email',
  'phone',
  'discord',
  'google',
  'farcaster',
] as const;

export type CrossmintAuthMethod = typeof CROSSMINT_AUTH_METHODS[number];

export const CROSSMINT_CHAIN = 'solana' as const;

export const NFT_COLLECTION = {
  growerz: {
    name:          'THC GROWERZ',
    collectionId:  'thc-growerz',
    symbol:        'GROWERZ',
    totalSupply:   2335,
    website:       'https://growerz.thc-labz.xyz',
    howrare:       'https://howrare.is/thcgrowerz',
    magiceden:     'https://magiceden.io/marketplace/thcgrowerz',
    royaltyBps:    500,
  },
} as const;
