
interface GameSession {
  userId: string;
  walletAddress: string;
  serverWallet: string;
  gameState: 'initializing' | 'ready' | 'playing' | 'paused' | 'ended';
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
}

interface TokenBalance {
  budz: number;
  gbux: number;
  thcLabz: number;
  lastUpdated: Date;
}

export class GameFlowManager {
  private static instance: GameFlowManager;
  private activeSessions: Map<string, GameSession> = new Map();
  private userBalances: Map<string, TokenBalance> = new Map();

  constructor() {
    if (GameFlowManager.instance) {
      return GameFlowManager.instance;
    }
    GameFlowManager.instance = this;
  }

  /**
   * Initialize a new game session
   */
  async initializeGameSession(
    userId: string, 
    walletAddress: string, 
    serverWallet: string
  ): Promise<GameSession> {
    const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: GameSession = {
      userId,
      walletAddress,
      serverWallet,
      gameState: 'initializing',
      sessionId,
      startTime: new Date(),
      lastActivity: new Date()
    };

    this.activeSessions.set(sessionId, session);
    
    // Initialize user balances
    await this.refreshUserBalances(userId, serverWallet);
    
    // Mark session as ready
    session.gameState = 'ready';
    
    console.log(`🎮 Game session initialized: ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Refresh user token balances
   */
  async refreshUserBalances(userId: string, serverWallet: string): Promise<TokenBalance> {
    try {
      // Try to get real balances from Crossmint
      const balances = await crossmintService.getWalletBalance(serverWallet);
      
      const tokenBalance: TokenBalance = {
        budz: balances.budz || 0,
        gbux: balances.gbux || 0,
        thcLabz: balances.thcLabz || 0,
        lastUpdated: new Date()
      };
      
      this.userBalances.set(userId, tokenBalance);
      console.log(`💰 Balances refreshed for ${userId}:`, tokenBalance);
      
      return tokenBalance;
    } catch (error) {
      console.warn(`⚠️ Failed to refresh balances for ${userId}, using fallback:`, error);
      
      // Fallback balances
      const fallbackBalance: TokenBalance = {
        budz: 1000,
        gbux: 500,
        thcLabz: 100,
        lastUpdated: new Date()
      };
      
      this.userBalances.set(userId, fallbackBalance);
      return fallbackBalance;
    }
  }

  /**
   * Update game session state
   */
  updateSessionState(sessionId: string, newState: GameSession['gameState']): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.gameState = newState;
      session.lastActivity = new Date();
      console.log(`🎮 Session ${sessionId} state updated to: ${newState}`);
      return true;
    }
    return false;
  }

  /**
   * Get user's current balances
   */
  getUserBalances(userId: string): TokenBalance | null {
    return this.userBalances.get(userId) || null;
  }

  /**
   * Get active session for user
   */
  getUserSession(userId: string): GameSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.gameState !== 'ended') {
        return session;
      }
    }
    return null;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
      const hoursSinceActivity = timeSinceActivity / (1000 * 60 * 60);

      if (hoursSinceActivity > 24) { // 24 hour session timeout
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
      console.log(`🗑️ Cleaned up expired session: ${sessionId}`);
    });
  }
}

// Import required services
import { crossmintService } from './crossmint';

// Export singleton instance
export const gameFlowManager = new GameFlowManager();

// Clean up expired sessions every hour
setInterval(() => {
  gameFlowManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);
