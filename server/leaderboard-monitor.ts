/**
 * Leaderboard Monitoring and AI Wallet Health Check System
 * Ensures proper functionality of reward distribution and AI agent wallet
 */

import { storage } from './storage';
import { aiAgentWallet } from './ai-agent-wallet';
import { leaderboard, users } from '../shared/schema';
import { sql } from 'drizzle-orm';

interface SystemHealth {
  aiWalletStatus: 'healthy' | 'warning' | 'critical';
  leaderboardStatus: 'healthy' | 'warning' | 'critical';
  lastRewardDistribution: Date | null;
  pendingPayouts: number;
  aiWalletBalance: {
    budz: number;
    gbux: number;
    thcLabz: number;
  };
  issues: string[];
  recommendations: string[];
}

class LeaderboardMonitor {
  /**
   * Comprehensive system health check
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Check AI agent wallet status
      const aiStatus = await aiAgentWallet.getAIAgentStatus();
      
      if (!aiStatus) {
        issues.push('AI Agent wallet not found or inaccessible');
        recommendations.push('Initialize AI Agent wallet via /api/admin/init-ai-wallet');
      }
      
      // Check AI wallet balances
      let aiWalletStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (aiStatus) {
        if (aiStatus.budzBalance < 10000) {
          aiWalletStatus = 'critical';
          issues.push(`AI wallet BUDZ balance critically low: ${aiStatus.budzBalance}`);
          recommendations.push('Refill AI wallet BUDZ balance immediately');
        } else if (aiStatus.budzBalance < 50000) {
          aiWalletStatus = 'warning';
          issues.push(`AI wallet BUDZ balance low: ${aiStatus.budzBalance}`);
          recommendations.push('Consider refilling AI wallet BUDZ balance');
        }
        
        if (aiStatus.gbuxBalance < 10000) {
          aiWalletStatus = 'critical';
          issues.push(`AI wallet GBUX balance critically low: ${aiStatus.gbuxBalance}`);
          recommendations.push('Refill AI wallet GBUX balance immediately');
        }
      }
      
      // Check leaderboard status
      const db = storage.getDb();
      let leaderboardStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      let pendingPayouts = 0;
      
      if (db) {
        const currentScores = await db.select().from(leaderboard).limit(10);
        pendingPayouts = currentScores.length;
        
        if (pendingPayouts > 100) {
          leaderboardStatus = 'warning';
          issues.push(`High number of pending scores: ${pendingPayouts}`);
          recommendations.push('Consider processing rewards to clear leaderboard');
        }
      } else {
        leaderboardStatus = 'critical';
        issues.push('Database connection unavailable');
        recommendations.push('Check database connectivity');
      }
      
      return {
        aiWalletStatus,
        leaderboardStatus,
        lastRewardDistribution: null, // Would track from logs
        pendingPayouts,
        aiWalletBalance: {
          budz: aiStatus?.budzBalance || 0,
          gbux: aiStatus?.gbuxBalance || 0,
          thcLabz: aiStatus?.thcLabzBalance || 0
        },
        issues,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ System health check failed:', error);
      return {
        aiWalletStatus: 'critical',
        leaderboardStatus: 'critical',
        lastRewardDistribution: null,
        pendingPayouts: 0,
        aiWalletBalance: { budz: 0, gbux: 0, thcLabz: 0 },
        issues: ['System health check failed'],
        recommendations: ['Check system logs and restart services']
      };
    }
  }
  
  /**
   * Validate reward distribution readiness
   */
  async validateRewardReadiness(): Promise<{
    ready: boolean;
    blockers: string[];
    eligiblePlayers: number;
  }> {
    const blockers: string[] = [];
    
    try {
      const db = storage.getDb();
      if (!db) {
        blockers.push('Database unavailable');
        return { ready: false, blockers, eligiblePlayers: 0 };
      }
      
      // Check AI wallet status
      const aiStatus = await aiAgentWallet.getAIAgentStatus();
      if (!aiStatus) {
        blockers.push('AI Agent wallet not initialized');
        return { ready: false, blockers, eligiblePlayers: 0 };
      }
      
      // Check if AI wallet has sufficient funds for top 10 rewards
      const maxRewardNeeded = 1000 + 889 + 778 + 667 + 556 + 445 + 334 + 223 + 112 + 100; // ~5,104 BUDZ
      if (aiStatus.budzBalance < maxRewardNeeded) {
        blockers.push(`Insufficient BUDZ balance: ${aiStatus.budzBalance} < ${maxRewardNeeded}`);
      }
      
      // Get eligible players
      const eligiblePlayers = await db.select().from(leaderboard);
      
      if (eligiblePlayers.length === 0) {
        blockers.push('No eligible players on leaderboard');
      }
      
      return {
        ready: blockers.length === 0,
        blockers,
        eligiblePlayers: eligiblePlayers.length
      };
      
    } catch (error) {
      console.error('❌ Reward readiness validation failed:', error);
      return {
        ready: false,
        blockers: ['Validation system error'],
        eligiblePlayers: 0
      };
    }
  }
  
  /**
   * Emergency AI wallet refill (admin only)
   */
  async emergencyRefillAIWallet(tokenType: 'budz' | 'gbux', amount: number): Promise<boolean> {
    try {
      console.log(`🚨 Emergency refill initiated: ${amount} ${tokenType.toUpperCase()}`);
      
      const db = storage.getDb();
      if (!db) {
        throw new Error('Database unavailable');
      }
      
      // Add tokens to AI agent wallet
      const updateField = tokenType === 'budz' ? 'budzBalance' : 'gbuxBalance';
      
      await db.update(users)
        .set({
          [updateField]: sql`${tokenType === 'budz' ? users.budzBalance : users.gbuxBalance} + ${amount}`
        })
        .where(sql`${users.walletAddress} = 'ErSGeWkLuKqmW2MNrcFWPsYryNPXDW224GmgNBf8ZT65'`);
      
      console.log(`✅ Emergency refill completed: +${amount} ${tokenType.toUpperCase()}`);
      return true;
      
    } catch (error) {
      console.error('❌ Emergency refill failed:', error);
      return false;
    }
  }
}

export const leaderboardMonitor = new LeaderboardMonitor();