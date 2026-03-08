/**
 * Puter Web3 Wallet Adapter for THC Dope Warz
 * Provides seamless wallet integration for Puter deployment
 */

class PuterWalletAdapter {
  constructor() {
    this.isConnected = false;
    this.publicKey = null;
    this.walletName = 'Puter Wallet';
    this.supportedWallets = ['phantom', 'solflare', 'backpack', 'glow'];
  }

  // Check if running on Puter platform
  isPuterEnvironment() {
    return typeof window !== 'undefined' && 
           (window.location.hostname.includes('puter.') || 
            window.puter || 
            navigator.userAgent.includes('Puter'));
  }

  // Initialize wallet connection for Puter
  async initializePuterWallet() {
    if (!this.isPuterEnvironment()) {
      console.log('🌐 Not in Puter environment, using standard wallet connection');
      return this.initializeStandardWallet();
    }

    console.log('🎮 Initializing Puter wallet adapter...');
    
    try {
      // Check for injected Solana provider
      if (window.solana && window.solana.isPhantom) {
        console.log('👻 Phantom wallet detected in Puter');
        return await this.connectPhantom();
      }

      if (window.solflare && window.solflare.isSolflare) {
        console.log('🔥 Solflare wallet detected in Puter');
        return await this.connectSolflare();
      }

      if (window.backpack) {
        console.log('🎒 Backpack wallet detected in Puter');
        return await this.connectBackpack();
      }

      // Fallback to browser extension detection
      return await this.detectAndConnectWallet();

    } catch (error) {
      console.error('❌ Puter wallet initialization failed:', error);
      throw new Error('Failed to initialize wallet in Puter environment');
    }
  }

  // Connect to Phantom wallet
  async connectPhantom() {
    try {
      const resp = await window.solana.connect();
      this.isConnected = true;
      this.publicKey = resp.publicKey.toString();
      console.log('✅ Phantom connected:', this.publicKey.slice(0, 8) + '...');
      return {
        publicKey: this.publicKey,
        wallet: 'phantom',
        success: true
      };
    } catch (error) {
      console.error('❌ Phantom connection failed:', error);
      throw error;
    }
  }

  // Connect to Solflare wallet
  async connectSolflare() {
    try {
      const resp = await window.solflare.connect();
      this.isConnected = true;
      this.publicKey = resp.publicKey.toString();
      console.log('✅ Solflare connected:', this.publicKey.slice(0, 8) + '...');
      return {
        publicKey: this.publicKey,
        wallet: 'solflare',
        success: true
      };
    } catch (error) {
      console.error('❌ Solflare connection failed:', error);
      throw error;
    }
  }

  // Connect to Backpack wallet
  async connectBackpack() {
    try {
      const resp = await window.backpack.connect();
      this.isConnected = true;
      this.publicKey = resp.publicKey.toString();
      console.log('✅ Backpack connected:', this.publicKey.slice(0, 8) + '...');
      return {
        publicKey: this.publicKey,
        wallet: 'backpack',
        success: true
      };
    } catch (error) {
      console.error('❌ Backpack connection failed:', error);
      throw error;
    }
  }

  // Detect and connect to available wallet
  async detectAndConnectWallet() {
    const walletChecks = [
      { name: 'phantom', check: () => window.solana?.isPhantom, connect: () => this.connectPhantom() },
      { name: 'solflare', check: () => window.solflare?.isSolflare, connect: () => this.connectSolflare() },
      { name: 'backpack', check: () => window.backpack, connect: () => this.connectBackpack() },
      { name: 'glow', check: () => window.glowSolana, connect: () => this.connectGlow() }
    ];

    for (const wallet of walletChecks) {
      if (wallet.check()) {
        console.log(`🔗 Attempting to connect ${wallet.name} wallet...`);
        try {
          return await wallet.connect();
        } catch (error) {
          console.warn(`⚠️ ${wallet.name} connection failed, trying next wallet...`);
          continue;
        }
      }
    }

    throw new Error('No compatible Solana wallet found. Please install Phantom, Solflare, or Backpack.');
  }

  // Connect to Glow wallet
  async connectGlow() {
    try {
      const resp = await window.glowSolana.connect();
      this.isConnected = true;
      this.publicKey = resp.publicKey.toString();
      console.log('✅ Glow connected:', this.publicKey.slice(0, 8) + '...');
      return {
        publicKey: this.publicKey,
        wallet: 'glow',
        success: true
      };
    } catch (error) {
      console.error('❌ Glow connection failed:', error);
      throw error;
    }
  }

  // Standard wallet initialization for non-Puter environments
  async initializeStandardWallet() {
    console.log('🔗 Initializing standard wallet connection...');
    return await this.detectAndConnectWallet();
  }

  // Sign transaction for Puter compatibility
  async signTransaction(transaction) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (window.solana?.isPhantom) {
        return await window.solana.signTransaction(transaction);
      }
      if (window.solflare?.isSolflare) {
        return await window.solflare.signTransaction(transaction);
      }
      if (window.backpack) {
        return await window.backpack.signTransaction(transaction);
      }
      if (window.glowSolana) {
        return await window.glowSolana.signTransaction(transaction);
      }
      throw new Error('No wallet available for signing');
    } catch (error) {
      console.error('❌ Transaction signing failed:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      if (window.solana?.isPhantom) {
        await window.solana.disconnect();
      } else if (window.solflare?.isSolflare) {
        await window.solflare.disconnect();
      } else if (window.backpack) {
        await window.backpack.disconnect();
      } else if (window.glowSolana) {
        await window.glowSolana.disconnect();
      }
      
      this.isConnected = false;
      this.publicKey = null;
      console.log('🔌 Wallet disconnected');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      publicKey: this.publicKey,
      walletName: this.walletName,
      isPuter: this.isPuterEnvironment()
    };
  }
}

// Export for use in THC Dope Warz
window.PuterWalletAdapter = PuterWalletAdapter;

// Auto-initialize for immediate use
if (typeof window !== 'undefined') {
  window.puterWallet = new PuterWalletAdapter();
}