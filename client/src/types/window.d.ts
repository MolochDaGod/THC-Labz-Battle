/**
 * Window interface extensions for Web3 wallet compatibility
 * Supports Phantom, Solflare, Backpack, Magic Eden, Coinbase, and other Web3 browsers
 */

interface Window {
  // Phantom Wallet (Primary)
  solana?: {
    isPhantom?: boolean;
    isConnected?: boolean;
    publicKey?: any;
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
  };

  // Phantom Alternative Access
  phantom?: {
    solana?: {
      isPhantom?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
    };
  };

  // Solflare Wallet
  solflare?: {
    isSolflare?: boolean;
    isConnected?: boolean;
    publicKey?: any;
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
  };

  // Backpack Wallet
  backpack?: {
    solana?: {
      isBackpack?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
    };
  };

  // Magic Eden Wallet
  magicEden?: {
    solana?: {
      isMagicEden?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signTransaction?: (transaction: any) => Promise<any>;
      signAllTransactions?: (transactions: any[]) => Promise<any[]>;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
    };
  };

  // Coinbase Wallet
  coinbaseSolana?: {
    isCoinbase?: boolean;
    isConnected?: boolean;
    publicKey?: any;
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
  };

  // Glow Wallet
  glow?: {
    isGlow?: boolean;
    isConnected?: boolean;
    publicKey?: any;
    connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
    signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array; publicKey: any }>;
  };

  // Slope Wallet
  Slope?: {
    connect: () => Promise<{ msg: string; data: { publicKey: string } }>;
    disconnect: () => Promise<{ msg: string }>;
    signTransaction: (transaction: any) => Promise<{ msg: string; data: { signature: string } }>;
  };

  // Sollet Wallet
  sollet?: {
    isConnected?: boolean;
    publicKey?: any;
    connect: () => Promise<any>;
    disconnect: () => Promise<void>;
  };

  // Torus Wallet
  torus?: {
    solana?: {
      isTorus?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
    };
  };

  // Clover Wallet
  clover_solana?: {
    isClover?: boolean;
    isConnected?: boolean;
    publicKey?: any;
    connect: () => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
  };

  // Math Wallet
  solana_math?: {
    isMathWallet?: boolean;
    isConnected?: boolean;
    publicKey?: any;
    connect: () => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
  };

  // Bonfida Wallet
  bonfida?: {
    solana?: {
      isBonfida?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
    };
  };

  // Additional Solana browser detection only
  // NO ethereum/web3 properties to prevent MetaMask detection

  // Browser detection for Web3 browsers
  chrome?: any;
  firefox?: any;
  brave?: {
    isBrave?: () => boolean;
  };
}

// Declare global for TypeScript
declare global {
  interface Window {
    solana?: any;
    phantom?: any;
    solflare?: any;
    backpack?: any;
    magicEden?: any;
    coinbaseSolana?: any;
    glow?: any;
    Slope?: any;
    sollet?: any;
    torus?: any;
    clover_solana?: any;
    solana_math?: any;
    bonfida?: any;
    // NO ethereum/web3 globals to prevent MetaMask interference
    chrome?: any;
    firefox?: any;
    brave?: any;
  }
}

export {};