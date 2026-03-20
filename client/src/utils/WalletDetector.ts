export interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  installed: boolean;
  provider: any;
  connect: () => Promise<string>;
  installUrl?: string;
  deepLink?: (url: string) => string;
}

export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('phantom') || ua.includes('solflare') || ua.includes('backpack') || ua.includes('trust');
};

export const getAutoConnectProvider = (): any => {
  if ((window as any).solana?.isPhantom)  return (window as any).solana;
  if ((window as any).phantom?.solana)    return (window as any).phantom.solana;
  if ((window as any).solflare?.isSolflare) return (window as any).solflare;
  if ((window as any).solana?.isSolflare) return (window as any).solana;
  return null;
};

const makeConnect = (provider: any) => async (): Promise<string> => {
  if (!provider) throw new Error('Wallet not available');
  const resp = await provider.connect();
  const pk = resp?.publicKey ?? provider.publicKey;
  if (!pk) throw new Error('No public key returned');
  return pk.toString();
};

export const detectInstalledWallets = (): DetectedWallet[] => {
  const w = window as any;
  const results: DetectedWallet[] = [];

  // Phantom
  const phantomProvider = w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : null);
  results.push({
    id: 'phantom',
    name: 'Phantom',
    icon: '/icons/phantom.svg',
    installed: !!phantomProvider,
    provider: phantomProvider,
    connect: makeConnect(phantomProvider),
    installUrl: 'https://phantom.app',
    deepLink: (appUrl: string) => `https://phantom.app/ul/browse/${encodeURIComponent(appUrl)}?ref=${encodeURIComponent(appUrl)}`,
  });

  // Solflare
  const solflareProvider = w.solflare?.isSolflare ? w.solflare : (w.solana?.isSolflare ? w.solana : null);
  results.push({
    id: 'solflare',
    name: 'Solflare',
    icon: '/icons/solflare.svg',
    installed: !!solflareProvider,
    provider: solflareProvider,
    connect: makeConnect(solflareProvider),
    installUrl: 'https://solflare.com',
    deepLink: (appUrl: string) => `https://solflare.com/ul/v1/browse/${encodeURIComponent(appUrl)}?ref=${encodeURIComponent(appUrl)}`,
  });

  // Backpack
  const backpackProvider = w.backpack?.solana ?? null;
  results.push({
    id: 'backpack',
    name: 'Backpack',
    icon: '/icons/backpack.svg',
    installed: !!backpackProvider,
    provider: backpackProvider,
    connect: makeConnect(backpackProvider),
    installUrl: 'https://backpack.app',
  });

  // Magic Eden
  const magicEdenProvider = w.magicEden?.solana ?? (w.solana?.isMagicEden ? w.solana : null);
  results.push({
    id: 'magiceden',
    name: 'Magic Eden',
    icon: '/icons/magiceden.svg',
    installed: !!magicEdenProvider,
    provider: magicEdenProvider,
    connect: makeConnect(magicEdenProvider),
    installUrl: 'https://wallet.magiceden.io',
  });

  // Coinbase Wallet
  const coinbaseProvider = w.coinbaseSolana ?? null;
  results.push({
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/icons/coinbase.svg',
    installed: !!coinbaseProvider,
    provider: coinbaseProvider,
    connect: makeConnect(coinbaseProvider),
    installUrl: 'https://wallet.coinbase.com',
  });

  return results;
};
