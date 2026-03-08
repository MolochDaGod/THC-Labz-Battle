/**
 * Puter Web3 Wallet Adapter for THC Dope Budz
 * Provides seamless wallet integration for Puter deployment
 */

class PuterWalletAdapter {
  constructor() {
    this.connectedWallet = null;
    this.walletType = null;
    this.isConnected = false;
    this.appId = 'app-8e279a43-403f-4783-a3ca-e1ea8f74b228';
    
    console.log('🌐 Puter Wallet Adapter initialized for THC Dope Budz');
    console.log('📱 App ID:', this.appId);
    this.detectEnvironment();
  }

  /**
   * Detect if running in Puter environment
   */
  isPuterEnvironment() {
    return typeof window !== 'undefined' && 
           (window.puter || window.location.hostname.includes('puter'));
  }

  /**
   * Detect environment and optimize accordingly
   */
  detectEnvironment() {
    if (this.isPuterEnvironment()) {
      console.log('🌐 Puter environment detected - optimizing wallet integration');
      this.initializePuterWallet();
    } else {
      console.log('🔧 Standard environment - using default wallet detection');
      this.initializeStandardWallet();
    }
  }

  /**
   * Initialize Puter-specific wallet optimizations
   */
  async initializePuterWallet() {
    // Wait for Puter to be ready
    if (window.puter) {
      await window.puter.ready();
      console.log('✅ Puter ready - wallet adapter active');
      
      // Register app with Puter system
      if (window.puter.apps) {
        try {
          await window.puter.apps.register(this.appId, {
            name: 'THC Dope Budz',
            permissions: ['wallet.connect', 'blockchain.read', 'storage.local']
          });
          console.log('📱 App registered with Puter:', this.appId);
        } catch (error) {
          console.log('⚠️ App registration skipped:', error.message);
        }
      }
    }

    // Enhanced wallet detection for Puter
    this.detectAndConnectWallet();
  }

  /**
   * Connect to Phantom wallet with Puter optimizations
   */
  async connectPhantom() {
    try {
      let phantom;
      
      // Multiple detection paths for Puter environment
      if (window.solana?.isPhantom) {
        phantom = window.solana;
      } else if (window.phantom?.solana) {
        phantom = window.phantom.solana;
      } else if (window.phantom) {
        phantom = window.phantom;
      }

      if (!phantom) {
        throw new Error('Phantom wallet not found in Puter environment');
      }

      console.log('🔗 Connecting to Phantom in Puter...');
      const response = await phantom.connect({ onlyIfTrusted: false });
      
      if (response.publicKey) {
        this.connectedWallet = response.publicKey.toString();
        this.walletType = 'Phantom';
        this.isConnected = true;
        
        console.log('✅ Phantom connected in Puter:', this.connectedWallet);
        return { success: true, publicKey: this.connectedWallet };
      }
    } catch (error) {
      console.error('❌ Phantom connection failed in Puter:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to Solflare wallet
   */
  async connectSolflare() {
    try {
      if (!window.solflare) {
        throw new Error('Solflare wallet not found');
      }

      console.log('🔗 Connecting to Solflare in Puter...');
      const response = await window.solflare.connect();
      
      if (response.publicKey) {
        this.connectedWallet = response.publicKey.toString();
        this.walletType = 'Solflare';
        this.isConnected = true;
        
        console.log('✅ Solflare connected in Puter:', this.connectedWallet);
        return { success: true, publicKey: this.connectedWallet };
      }
    } catch (error) {
      console.error('❌ Solflare connection failed in Puter:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to Backpack wallet
   */
  async connectBackpack() {
    try {
      if (!window.backpack?.solana) {
        throw new Error('Backpack wallet not found');
      }

      console.log('🔗 Connecting to Backpack in Puter...');
      const response = await window.backpack.solana.connect();
      
      if (response.publicKey) {
        this.connectedWallet = response.publicKey.toString();
        this.walletType = 'Backpack';
        this.isConnected = true;
        
        console.log('✅ Backpack connected in Puter:', this.connectedWallet);
        return { success: true, publicKey: this.connectedWallet };
      }
    } catch (error) {
      console.error('❌ Backpack connection failed in Puter:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-detect and connect to available wallet
   */
  async detectAndConnectWallet() {
    const wallets = [
      { name: 'Phantom', detector: () => window.solana?.isPhantom || window.phantom?.solana },
      { name: 'Solflare', detector: () => window.solflare },
      { name: 'Backpack', detector: () => window.backpack?.solana },
      { name: 'Magic Eden', detector: () => window.magicEden?.solana },
      { name: 'Glow', detector: () => window.glow }
    ];

    for (const wallet of wallets) {
      if (wallet.detector()) {
        console.log(`🔍 ${wallet.name} wallet detected in Puter`);
        
        try {
          let result;
          switch (wallet.name) {
            case 'Phantom':
              result = await this.connectPhantom();
              break;
            case 'Solflare':
              result = await this.connectSolflare();
              break;
            case 'Backpack':
              result = await this.connectBackpack();
              break;
            case 'Glow':
              result = await this.connectGlow();
              break;
            default:
              continue;
          }
          
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.log(`⚠️ ${wallet.name} connection failed, trying next...`);
        }
      }
    }

    console.log('❌ No compatible wallets found in Puter environment');
    return { success: false, error: 'No compatible wallets found' };
  }

  /**
   * Connect to Glow wallet (mobile-optimized)
   */
  async connectGlow() {
    try {
      if (!window.glow) {
        throw new Error('Glow wallet not found');
      }

      console.log('🔗 Connecting to Glow in Puter...');
      const response = await window.glow.connect();
      
      if (response.publicKey) {
        this.connectedWallet = response.publicKey.toString();
        this.walletType = 'Glow';
        this.isConnected = true;
        
        console.log('✅ Glow connected in Puter:', this.connectedWallet);
        return { success: true, publicKey: this.connectedWallet };
      }
    } catch (error) {
      console.error('❌ Glow connection failed in Puter:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize standard wallet detection
   */
  async initializeStandardWallet() {
    console.log('🔧 Standard wallet adapter initialized');
    // Use existing wallet detection logic
  }

  /**
   * Sign transaction with connected wallet
   */
  async signTransaction(transaction) {
    if (!this.isConnected) {
      throw new Error('No wallet connected');
    }

    try {
      let wallet;
      switch (this.walletType) {
        case 'Phantom':
          wallet = window.solana?.isPhantom ? window.solana : window.phantom?.solana;
          break;
        case 'Solflare':
          wallet = window.solflare;
          break;
        case 'Backpack':
          wallet = window.backpack.solana;
          break;
        case 'Glow':
          wallet = window.glow;
          break;
        default:
          throw new Error(`Unsupported wallet type: ${this.walletType}`);
      }

      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      const signedTransaction = await wallet.signTransaction(transaction);
      console.log('✅ Transaction signed in Puter environment');
      return signedTransaction;
    } catch (error) {
      console.error('❌ Transaction signing failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      let wallet;
      switch (this.walletType) {
        case 'Phantom':
          wallet = window.solana?.isPhantom ? window.solana : window.phantom?.solana;
          break;
        case 'Solflare':
          wallet = window.solflare;
          break;
        case 'Backpack':
          wallet = window.backpack.solana;
          break;
        case 'Glow':
          wallet = window.glow;
          break;
      }

      if (wallet && wallet.disconnect) {
        await wallet.disconnect();
      }

      this.connectedWallet = null;
      this.walletType = null;
      this.isConnected = false;
      
      console.log('📴 Wallet disconnected from Puter');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      walletType: this.walletType,
      publicKey: this.connectedWallet,
      environment: this.isPuterEnvironment() ? 'Puter' : 'Standard',
      appId: this.appId
    };
  }
}

// Export for use in Puter environment
if (typeof window !== 'undefined') {
  window.PuterWalletAdapter = PuterWalletAdapter;
}

export default PuterWalletAdapter;