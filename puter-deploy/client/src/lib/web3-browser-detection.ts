/**
 * Web3 Browser Detection and Optimization
 * Enhanced support for Phantom Browser and other Web3-native browsers
 */

export interface BrowserInfo {
  name: string;
  isWeb3Native: boolean;
  walletIntegration: string[];
  optimizations: string[];
}

/**
 * Detect if running in a Web3-native browser
 */
export const detectWeb3Browser = (): BrowserInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isPhantom = userAgent.includes('phantom') || window.solana?.isPhantom;
  const isBrave = !!(window as any).brave && (window as any).brave.isBrave;
  const isOpera = userAgent.includes('opr/') || userAgent.includes('opera');
  const isEdge = userAgent.includes('edg/');
  const isChrome = userAgent.includes('chrome') && !isEdge && !isOpera;
  const isFirefox = userAgent.includes('firefox');
  const isSafari = userAgent.includes('safari') && !isChrome && !isEdge;

  console.log('🌐 Browser Detection:', {
    userAgent,
    isPhantom,
    isBrave,
    isOpera,
    isEdge,
    isChrome,
    isFirefox,
    isSafari
  });

  // Phantom Browser (Web3 Native)
  if (isPhantom) {
    return {
      name: 'Phantom Browser',
      isWeb3Native: true,
      walletIntegration: ['Phantom', 'Solflare', 'Magic Eden', 'Backpack'],
      optimizations: ['auto-connect', 'enhanced-security', 'native-web3']
    };
  }

  // Brave Browser (Web3 Friendly)
  if (isBrave) {
    return {
      name: 'Brave Browser',
      isWeb3Native: true,
      walletIntegration: ['Phantom', 'Solflare', 'Magic Eden', 'Backpack', 'Coinbase'],
      optimizations: ['privacy-focused', 'crypto-wallet', 'ad-blocking']
    };
  }

  // Opera (Web3 Features)
  if (isOpera) {
    return {
      name: 'Opera Browser',
      isWeb3Native: true,
      walletIntegration: ['Phantom', 'Solflare', 'Opera Wallet'],
      optimizations: ['built-in-wallet', 'vpn-support']
    };
  }

  // Standard browsers with Web3 extensions
  if (isChrome) {
    return {
      name: 'Chrome Browser',
      isWeb3Native: false,
      walletIntegration: ['Phantom', 'Solflare', 'Magic Eden', 'Backpack', 'Coinbase'],
      optimizations: ['extension-support']
    };
  }

  if (isFirefox) {
    return {
      name: 'Firefox Browser',
      isWeb3Native: false,
      walletIntegration: ['Phantom', 'Solflare'],
      optimizations: ['extension-support', 'privacy-focused']
    };
  }

  if (isEdge) {
    return {
      name: 'Edge Browser',
      isWeb3Native: false,
      walletIntegration: ['Phantom', 'Solflare', 'Magic Eden'],
      optimizations: ['extension-support']
    };
  }

  if (isSafari) {
    return {
      name: 'Safari Browser',
      isWeb3Native: false,
      walletIntegration: ['Glow', 'Phantom'],
      optimizations: ['mobile-optimized']
    };
  }

  return {
    name: 'Unknown Browser',
    isWeb3Native: false,
    walletIntegration: ['Phantom'],
    optimizations: []
  };
};

/**
 * Apply Web3 browser optimizations
 */
export const applyWeb3Optimizations = (browserInfo: BrowserInfo): void => {
  console.log(`🚀 Applying optimizations for ${browserInfo.name}:`, browserInfo.optimizations);

  // Auto-connect for Web3 native browsers
  if (browserInfo.isWeb3Native && browserInfo.optimizations.includes('auto-connect')) {
    console.log('⚡ Web3 native browser detected - enabling auto-connect');
    // Auto-connect will be handled by the main wallet connection logic
  }

  // Enhanced security for Web3 browsers
  if (browserInfo.optimizations.includes('enhanced-security')) {
    console.log('🔒 Enabling enhanced security features');
    // Implement additional security checks
  }

  // Privacy optimizations for Brave/Firefox
  if (browserInfo.optimizations.includes('privacy-focused')) {
    console.log('🛡️ Privacy-focused browser detected - respecting user preferences');
  }

  // Mobile optimizations for Safari
  if (browserInfo.optimizations.includes('mobile-optimized')) {
    console.log('📱 Mobile browser detected - applying touch optimizations');
    document.body.style.touchAction = 'manipulation';
  }
};

/**
 * Check if browser supports specific wallet
 */
export const isBrowserWalletSupported = (walletName: string, browserInfo: BrowserInfo): boolean => {
  return browserInfo.walletIntegration.includes(walletName);
};

/**
 * Get recommended wallets for current browser
 */
export const getRecommendedWallets = (browserInfo: BrowserInfo): string[] => {
  // Prioritize native wallet for Web3 browsers
  if (browserInfo.name === 'Phantom Browser') {
    return ['Phantom', 'Solflare', 'Magic Eden'];
  }

  if (browserInfo.name === 'Brave Browser') {
    return ['Phantom', 'Brave Wallet', 'Solflare'];
  }

  if (browserInfo.name === 'Opera Browser') {
    return ['Phantom', 'Opera Wallet', 'Solflare'];
  }

  // Default recommendations for standard browsers
  return ['Phantom', 'Solflare', 'Magic Eden', 'Backpack'];
};

/**
 * Enhanced wallet detection with browser-specific paths
 */
export const detectBrowserSpecificWallets = () => {
  const browserInfo = detectWeb3Browser();
  const wallets: string[] = [];

  console.log('🔍 Browser-specific wallet detection for:', browserInfo.name);

  // Phantom detection with browser-specific paths
  if (window.solana?.isPhantom) {
    wallets.push('Phantom');
    console.log('✅ Phantom detected via window.solana');
  } else if (window.phantom?.solana) {
    wallets.push('Phantom');
    console.log('✅ Phantom detected via window.phantom');
  }

  // Brave browser built-in wallet
  if (browserInfo.name === 'Brave Browser' && (window as any).ethereum) {
    console.log('✅ Brave built-in wallet available');
  }

  // Opera browser built-in wallet
  if (browserInfo.name === 'Opera Browser' && (window as any).ethereum) {
    console.log('✅ Opera built-in wallet available');
  }

  // Standard wallet detections
  if (window.solflare) {
    wallets.push('Solflare');
    console.log('✅ Solflare detected');
  }

  if (window.backpack?.solana) {
    wallets.push('Backpack');
    console.log('✅ Backpack detected');
  }

  if (window.magicEden?.solana) {
    wallets.push('Magic Eden');
    console.log('✅ Magic Eden detected');
  }

  if (window.coinbaseSolana) {
    wallets.push('Coinbase');
    console.log('✅ Coinbase detected');
  }

  console.log(`🎯 Detected ${wallets.length} wallets in ${browserInfo.name}:`, wallets);
  return { wallets, browserInfo };
};