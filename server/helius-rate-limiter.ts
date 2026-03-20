/**
 * Helius API Rate Limiter - Once Per Day Usage
 * Manages daily rate limiting for Helius API calls
 */

interface DailyUsageTracker {
  lastUsedDate: string;
  usageCount: number;
  maxDailyUsage: number;
}

class HeliusRateLimiter {
  private usageTracker: DailyUsageTracker;
  private readonly MAX_DAILY_USAGE = 1; // Once per day as requested

  constructor() {
    this.usageTracker = {
      lastUsedDate: '',
      usageCount: 0,
      maxDailyUsage: this.MAX_DAILY_USAGE
    };
  }

  /**
   * Check if we can use Helius API today
   */
  canUseHeliusToday(): boolean {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Reset counter if it's a new day
    if (this.usageTracker.lastUsedDate !== today) {
      this.usageTracker.lastUsedDate = today;
      this.usageTracker.usageCount = 0;
      console.log(`🗓️ New day detected, resetting Helius usage counter for ${today}`);
    }

    const canUse = this.usageTracker.usageCount < this.MAX_DAILY_USAGE;
    console.log(`📊 Helius usage today: ${this.usageTracker.usageCount}/${this.MAX_DAILY_USAGE} (Can use: ${canUse})`);
    
    return canUse;
  }

  /**
   * Record Helius API usage
   */
  recordUsage(): void {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.usageTracker.lastUsedDate !== today) {
      this.usageTracker.lastUsedDate = today;
      this.usageTracker.usageCount = 0;
    }

    this.usageTracker.usageCount++;
    console.log(`📈 Helius usage recorded: ${this.usageTracker.usageCount}/${this.MAX_DAILY_USAGE} for ${today}`);
  }

  /**
   * Get current usage status
   */
  getUsageStatus(): DailyUsageTracker {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.usageTracker.lastUsedDate !== today) {
      this.usageTracker.lastUsedDate = today;
      this.usageTracker.usageCount = 0;
    }

    return { ...this.usageTracker };
  }

  /**
   * Reset usage for testing (admin only)
   */
  resetUsageForTesting(): void {
    this.usageTracker.usageCount = 0;
    console.log('🔄 Helius usage reset for testing');
  }
}

// Export singleton instance
export const heliusRateLimiter = new HeliusRateLimiter();

/**
 * Helius API Configuration with new credentials
 */
export const HELIUS_CONFIG = {
  API_KEY: 'e95f1290-ca2d-40da-878a-ae6bcb847906',
  RPC_URL: 'https://mainnet.helius-rpc.com/?api-key=e95f1290-ca2d-40da-878a-ae6bcb847906',
  WEBSOCKET_URL: 'wss://mainnet.helius-rpc.com/?api-key=e95f1290-ca2d-40da-878a-ae6bcb847906',
  API_BASE_URL: 'https://api.helius.xyz/v0'
};

/**
 * Helper function to get Helius RPC URL with rate limiting check
 */
export function getHeliusRPCUrl(): string | null {
  if (heliusRateLimiter.canUseHeliusToday()) {
    heliusRateLimiter.recordUsage();
    console.log('✅ Using Helius RPC (once-per-day allocation)');
    return HELIUS_CONFIG.RPC_URL;
  } else {
    console.log('❌ Helius daily usage limit reached, using fallback RPC');
    return null; // Will trigger fallback to public RPC
  }
}

/**
 * Get fallback RPC URLs when Helius is rate limited
 * Updated with more reliable endpoints
 */
export const FALLBACK_RPC_URLS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana.blockdaemon.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com'
];