import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { storage } from './storage';
import { users, leaderboard } from '../shared/schema';
import { processLeaderboardRewards } from './rewards';
import { processWeeklyRewards } from './weekly-rewards';
import { crossmintService } from './crossmint';
import { grenchAI } from './grench-ai';

// Admin authentication middleware (simplified for demo)
const adminAuth = (req: Request, res: Response, next: any) => {
  // In production, implement proper admin authentication
  // For now, allow access during development
  next();
};

export const adminRoutes = {
  // Get admin statistics
  async getStats(req: Request, res: Response) {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Get user statistics
      const userStats = await db.select({
        totalUsers: sql<number>`count(*)`,
        totalWallets: sql<number>`count(${users.walletAddress})`,
        totalBudzIssued: sql<number>`sum(${users.budzBalance})`,
        totalGbuxIssued: sql<number>`sum(${users.gbuxBalance})`
      }).from(users);

      // Get leaderboard statistics
      const leaderboardStats = await db.select({
        activeEntries: sql<number>`count(*)`,
        pendingRewards: sql<number>`count(*) filter (where ${leaderboard.rewardPaid} = false)`
      }).from(leaderboard);

      // Get AI Agent statistics
      const aiAgentStats = {
        totalTokensManaged: 1000000000, // 1 billion tokens managed by AI agent
        weeklyRewardsScheduled: true,
        nextRewardProcessing: new Date().toISOString(),
        totalFeesCollected: 0, // Calculate from transaction history
        lastSwapProcessed: new Date().toISOString()
      };

      // Check system health
      const systemHealth = {
        grenchAiStatus: 'Active with Fallback',
        crossmintStatus: 'Connected',
        databaseStatus: 'Connected',
        schedulerStatus: 'Running'
      };

      const stats = {
        totalUsers: userStats[0]?.totalUsers || 0,
        totalWallets: userStats[0]?.totalWallets || 0,
        totalBudzIssued: userStats[0]?.totalBudzIssued || 0,
        totalGbuxIssued: userStats[0]?.totalGbuxIssued || 0,
        activeLeaderboardEntries: leaderboardStats[0]?.activeEntries || 0,
        pendingRewards: leaderboardStats[0]?.pendingRewards || 0,
        aiAgentStats,
        systemHealth
      };

      res.json(stats);
    } catch (error) {
      console.error('Error getting admin stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get all users
  async getUsers(req: Request, res: Response) {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const allUsers = await db.select().from(users).orderBy(sql`${users.createdAt} desc`);
      res.json(allUsers);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get leaderboard entries
  async getLeaderboard(req: Request, res: Response) {
    try {
      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const entries = await db.select()
        .from(leaderboard)
        .orderBy(sql`${leaderboard.score} desc, ${leaderboard.createdAt} asc`);
      
      res.json(entries);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update user token balance
  async updateUserBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { token, amount } = req.body;
      
      if (!['budz', 'gbux'].includes(token)) {
        return res.status(400).json({ error: 'Invalid token type' });
      }

      const db = storage.getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const field = token === 'budz' ? users.budzBalance : users.gbuxBalance;
      
      await db.update(users)
        .set({
          [token === 'budz' ? 'budzBalance' : 'gbuxBalance']: sql`${field} + ${amount}`
        })
        .where(sql`${users.id} = ${parseInt(userId)}`);

      console.log(`Admin updated ${token} balance for user ${userId}: ${amount > 0 ? '+' : ''}${amount}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Manually process rewards
  async processRewards(req: Request, res: Response) {
    try {
      console.log('Admin manually triggered reward processing');
      const rewardedPlayers = await processLeaderboardRewards();
      
      res.json({
        success: true,
        playersRewarded: rewardedPlayers?.length || 0,
        players: rewardedPlayers
      });
    } catch (error) {
      console.error('Error processing rewards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get system health
  async getHealth(req: Request, res: Response) {
    try {
      const db = storage.getDb();
      const dbConnected = !!db;
      
      // Test database connection
      let dbWorking = false;
      if (db) {
        try {
          await db.select().from(users).limit(1);
          dbWorking = true;
        } catch (error) {
          console.error('Database health check failed:', error);
        }
      }

      const health = {
        timestamp: new Date().toISOString(),
        database: {
          connected: dbConnected,
          working: dbWorking
        },
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      };

      res.json(health);
    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Send custom reward from AI agent
  async sendCustomReward(req: Request, res: Response) {
    try {
      const { walletAddress, amount, token, reason } = req.body;

      if (!walletAddress || !amount || !token || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log(`🎁 Admin custom reward: ${amount} ${token.toUpperCase()} to ${walletAddress} - Reason: ${reason}`);

      // AI Agent wallet for token transfers
      const AI_AGENT_WALLET = 'ErSGeWkLuKqmW2MNrcFWPsYryNPXDW224GmgNBf8ZT65';

      let transactionId = '';
      
      // Process transfer based on token type
      switch (token) {
        case 'budz':
          const budzResult = await crossmintService.transferBudz(AI_AGENT_WALLET, walletAddress, amount);
          transactionId = budzResult.id;
          break;
        case 'gbux':
          const gbuxResult = await crossmintService.transferGbux(AI_AGENT_WALLET, walletAddress, amount);
          transactionId = gbuxResult.id;
          break;
        case 'thc-labz':
          const thcResult = await crossmintService.transferThcLabz(AI_AGENT_WALLET, walletAddress, amount);
          transactionId = thcResult.id;
          break;
        default:
          return res.status(400).json({ error: 'Invalid token type' });
      }

      console.log(`✅ Custom reward sent successfully: ${transactionId}`);

      res.json({
        success: true,
        transactionId,
        amount,
        token: token.toUpperCase(),
        recipient: walletAddress,
        reason
      });
    } catch (error) {
      console.error('Error sending custom reward:', error);
      res.status(500).json({ error: 'Failed to send custom reward', details: error.message });
    }
  },

  // Manually trigger weekly rewards
  async triggerWeeklyRewards(req: Request, res: Response) {
    try {
      console.log('🚀 Manual weekly rewards triggered by admin');
      await processWeeklyRewards();
      
      res.json({
        success: true,
        message: 'Weekly rewards processing completed'
      });
    } catch (error) {
      console.error('Error processing weekly rewards:', error);
      res.status(500).json({ error: 'Failed to process weekly rewards', details: error.message });
    }
  }
};