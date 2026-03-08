/**
 * Puter Platform Integration for THC Dope Warz
 * Handles Puter-specific features and optimizations
 */

class PuterIntegration {
  constructor() {
    this.isPuterEnvironment = this.detectPuterEnvironment();
    this.config = {
      apiPrefix: '/api',
      staticFiles: ['/puter-wallet-adapter.js', '/attached_assets'],
      corsEnabled: true,
      iframeAllowed: true
    };
  }

  // Detect if running on Puter platform
  detectPuterEnvironment() {
    return process.env.PUTER_DEPLOYMENT === 'true' ||
           process.env.NODE_ENV === 'puter' ||
           process.env.HOSTNAME?.includes('puter');
  }

  // Configure Express app for Puter deployment
  configurePuterApp(app) {
    if (!this.isPuterEnvironment) {
      console.log('🌐 Standard deployment detected');
      return;
    }

    console.log('🎮 Configuring for Puter deployment...');

    // Serve Puter wallet adapter
    app.get('/puter-wallet-adapter.js', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'puter-wallet-adapter.js'));
    });

    // Enhanced CORS for Puter iframe embedding
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('X-Frame-Options', 'SAMEORIGIN');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Puter-specific health check
    app.get('/api/puter/health', (req, res) => {
      res.json({
        success: true,
        platform: 'puter',
        status: 'operational',
        features: {
          walletIntegration: true,
          achievementSystem: true,
          aiAssistant: true,
          nftDetection: true,
          tokenBalances: true
        },
        timestamp: new Date().toISOString()
      });
    });

    // Puter wallet status endpoint
    app.get('/api/puter/wallet-status', (req, res) => {
      res.json({
        success: true,
        supportedWallets: ['phantom', 'solflare', 'backpack', 'glow'],
        adapterVersion: '1.0.0',
        puterOptimized: true
      });
    });

    console.log('✅ Puter integration configured');
  }

  // Get Puter-specific environment variables
  getPuterConfig() {
    return {
      isPuter: this.isPuterEnvironment,
      domain: process.env.PUTER_DOMAIN || 'localhost',
      port: process.env.PORT || 5000,
      nodeEnv: process.env.NODE_ENV || 'production',
      features: {
        walletAdapter: true,
        webglSupport: true,
        mobileOptimized: true,
        iframeEmbedding: true
      }
    };
  }

  // Log Puter deployment status
  logDeploymentStatus() {
    const config = this.getPuterConfig();
    
    console.log('\n🎮 THC Dope Warz - Puter Deployment Status');
    console.log('==========================================');
    console.log(`Platform: ${config.isPuter ? 'Puter' : 'Standard'}`);
    console.log(`Domain: ${config.domain}`);
    console.log(`Port: ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log('Features:');
    Object.entries(config.features).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });
    console.log('==========================================\n');
  }
}

module.exports = { PuterIntegration };