/**
 * Achievement System API Routes
 * RESTful endpoints for 50 working achievements with BUDZ token rewards
 * Rewards distributed to server-side wallets from AI agent wallet
 */

import { type Request, type Response } from 'express';
import { achievementService } from './achievements-service';

export const achievementRoutes = {
  /**
   * Initialize all 50 achievements in database
   * POST /api/achievements/initialize
   */
  async initializeAchievements(req: Request, res: Response) {
    try {
      await achievementService.initializeAchievements();
      
      res.json({
        success: true,
        message: '50 achievements initialized successfully',
        totalRewards: 1250,
        categories: ['trading', 'travel', 'survival', 'wealth', 'special'],
      });
    } catch (error) {
      console.error('❌ Achievement initialization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize achievements'
      });
    }
  },

  /**
   * Check and unlock achievements for completed game round
   * POST /api/achievements/check
   */
  async checkAchievements(req: Request, res: Response) {
    try {
      const { walletAddress, gameState } = req.body;

      if (!walletAddress || !gameState) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: walletAddress, gameState'
        });
      }

      // Ensure gameRoundId exists
      if (!gameState.gameRoundId) {
        gameState.gameRoundId = `${walletAddress}_${Date.now()}`;
      }

      const unlockedAchievements = await achievementService.checkAchievements(
        walletAddress,
        gameState
      );

      const totalBudzEarned = unlockedAchievements.reduce(
        (sum, ach) => sum + ach.budzRewarded, 
        0
      );

      console.log(`🏆 Achievement check for ${walletAddress.slice(0, 8)}... - ${unlockedAchievements.length} new achievements, ${totalBudzEarned} BUDZ earned`);

      res.json({
        success: true,
        newAchievements: unlockedAchievements.length,
        totalBudzEarned,
        achievements: unlockedAchievements.map(ach => ({
          id: ach.id,
          name: ach.achievementId, // Will need to join with achievements table for full data
          budzRewarded: ach.budzRewarded,
          gameDay: ach.gameDay,
          unlockedAt: ach.unlockedAt,
        })),
      });
    } catch (error) {
      console.error('❌ Achievement check error:', error);
      // Fallback response when database unavailable
      res.json({
        success: true,
        newAchievements: 0,
        totalBudzEarned: 0,
        achievements: [],
        note: 'Database connection issue - achievement check temporarily unavailable'
      });
    }
  },

  /**
   * Get user's achievements for current or specific round
   * GET /api/achievements/user/:walletAddress?gameRoundId=xxx
   */
  async getUserAchievements(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      const { gameRoundId } = req.query;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      const userAchievements = await achievementService.getUserAchievements(
        walletAddress,
        gameRoundId as string
      );

      const totalBudz = userAchievements.reduce(
        (sum, ach) => sum + ach.budzRewarded, 
        0
      );

      res.json({
        success: true,
        count: userAchievements.length,
        totalBudzEarned: totalBudz,
        achievements: userAchievements,
      });
    } catch (error) {
      console.error('❌ Get user achievements error:', error);
      // Fallback response when database unavailable
      res.json({
        success: true,
        count: 0,
        totalBudzEarned: 0,
        achievements: [],
        note: 'Database connection issue - no user achievements available'
      });
    }
  },

  /**
   * Get all available achievements
   * GET /api/achievements/available
   */
  async getAvailableAchievements(req: Request, res: Response) {
    try {
      const achievements = await achievementService.getAvailableAchievements();

      const totalPossibleBudz = achievements.reduce(
        (sum, ach) => sum + ach.rewardBudz, 
        0
      );

      const categories = [...new Set(achievements.map(ach => ach.category))];

      res.json({
        success: true,
        count: achievements.length,
        totalPossibleBudz,
        categories,
        achievements: achievements.map(ach => ({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          category: ach.category,
          rewardBudz: ach.rewardBudz,
          iconEmoji: ach.iconEmoji,
          requirement: JSON.parse(ach.requirement),
        })),
      });
    } catch (error) {
      console.error('❌ Get available achievements error:', error);
      console.log('🔄 Database error detected, attempting to reinitialize achievements...');
      
      // Try to reinitialize achievements from service
      try {
        await achievementService.initializeAchievements();
        
        // Get all achievements from service
        const allAchievements = achievementService.getAllAchievements();
        const totalBudz = allAchievements.reduce((sum, ach) => sum + ach.rewardBudz, 0);
        
        console.log(`✅ Fallback: Successfully loaded ${allAchievements.length} achievements with ${totalBudz} total BUDZ rewards`);
        
        res.json({
          success: true,
          count: allAchievements.length,
          totalPossibleBudz: totalBudz,
          categories: [...new Set(allAchievements.map(a => a.category))],
          achievements: allAchievements.map(ach => ({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            category: ach.category,
            rewardBudz: ach.rewardBudz,
            iconEmoji: ach.iconEmoji,
            requirement: typeof ach.requirement === 'string' ? JSON.parse(ach.requirement) : ach.requirement,
          })),
          source: 'service_fallback'
        });
        return;
      } catch (reinitError) {
        console.error('❌ Retry failed, returning fallback achievements');
      }
      
      // Final fallback when database unavailable - return all 70 achievements from service
      const fallbackAchievements = achievementService.getAllAchievements();
      const totalBudz = fallbackAchievements.reduce((sum, ach) => sum + ach.rewardBudz, 0);
      
      res.json({
        success: true,
        count: fallbackAchievements.length,
        totalPossibleBudz: totalBudz,
        categories: [...new Set(fallbackAchievements.map(a => a.category))],
        achievements: fallbackAchievements.map(ach => ({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          category: ach.category,
          rewardBudz: ach.rewardBudz,
          iconEmoji: ach.iconEmoji,
          requirement: typeof ach.requirement === 'string' ? JSON.parse(ach.requirement) : ach.requirement,
        })),
        source: 'static_fallback'
      });
    }
  },

  /**
   * Get achievement statistics
   * GET /api/achievements/stats
   */
  async getAchievementStats(req: Request, res: Response) {
    try {
      const achievements = await achievementService.getAvailableAchievements();

      const stats = {
        totalAchievements: achievements.length,
        maxBudzPerRound: achievements.reduce((sum, ach) => sum + ach.rewardBudz, 0),
        categories: {
          trading: achievements.filter(a => a.category === 'trading').length,
          travel: achievements.filter(a => a.category === 'travel').length,
          survival: achievements.filter(a => a.category === 'survival').length,
          wealth: achievements.filter(a => a.category === 'wealth').length,
          special: achievements.filter(a => a.category === 'special').length,
        },
        rewardDistribution: {
          trading: achievements.filter(a => a.category === 'trading').reduce((s, a) => s + a.rewardBudz, 0),
          travel: achievements.filter(a => a.category === 'travel').reduce((s, a) => s + a.rewardBudz, 0),
          survival: achievements.filter(a => a.category === 'survival').reduce((s, a) => s + a.rewardBudz, 0),
          wealth: achievements.filter(a => a.category === 'wealth').reduce((s, a) => s + a.rewardBudz, 0),
          special: achievements.filter(a => a.category === 'special').reduce((s, a) => s + a.rewardBudz, 0),
        },
      };

      res.json({
        success: true,
        stats,
        note: 'Rewards distributed to server-side wallets from AI agent wallet upon round completion',
      });
    } catch (error) {
      console.error('❌ Achievement stats error:', error);
      // Fallback stats when database unavailable - show all 70 achievements
      res.json({
        success: true,
        stats: {
          totalAchievements: 70,
          maxBudzPerRound: 1400,
          categories: {
            trading: 15,
            travel: 16,
            survival: 10,
            wealth: 15,
            special: 14
          },
          rewardDistribution: {
            trading: 350,
            travel: 320,
            survival: 250,
            wealth: 300,
            special: 180
          }
        },
        note: 'Database connection issue - showing fallback achievement statistics'
      });
    }
  }
};