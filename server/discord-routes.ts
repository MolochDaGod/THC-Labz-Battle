/**
 * Discord Integration API Routes
 * RESTful endpoints for Grench Discord webhook functionality
 */

import { Request, Response } from 'express';
import { discordGrench } from './discord-grench-service.js';

export const discordRoutes = {
  /**
   * Send recruitment message to Discord
   * POST /api/discord/recruit
   */
  async sendRecruitment(req: Request, res: Response) {
    try {
      await discordGrench.sendRecruitmentMessage();
      
      res.json({
        success: true,
        message: 'Grench recruitment message sent to Discord'
      });
    } catch (error) {
      console.error('Failed to send recruitment message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send recruitment message'
      });
    }
  },

  /**
   * Send daily market update
   * POST /api/discord/daily-update
   */
  async sendDailyUpdate(req: Request, res: Response) {
    try {
      const { totalPlayers = 0, activeRounds = 0, totalRewards = 0, topPlayer, topScore } = req.body;
      
      await discordGrench.sendDailyUpdate({
        totalPlayers,
        activeRounds,
        totalRewards,
        topPlayer,
        topScore
      });
      
      res.json({
        success: true,
        message: 'Grench daily update sent to Discord'
      });
    } catch (error) {
      console.error('Failed to send daily update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send daily update'
      });
    }
  },

  /**
   * Send achievement celebration
   * POST /api/discord/achievement
   */
  async sendAchievementCelebration(req: Request, res: Response) {
    try {
      const { playerName, achievement, reward } = req.body;
      
      if (!playerName || !achievement || !reward) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: playerName, achievement, reward'
        });
      }
      
      await discordGrench.sendAchievementCelebration(playerName, achievement, reward);
      
      res.json({
        success: true,
        message: 'Grench achievement celebration sent to Discord'
      });
    } catch (error) {
      console.error('Failed to send achievement celebration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send achievement celebration'
      });
    }
  },

  /**
   * Send leaderboard update
   * POST /api/discord/leaderboard
   */
  async sendLeaderboardUpdate(req: Request, res: Response) {
    try {
      const { topPlayers } = req.body;
      
      if (!Array.isArray(topPlayers)) {
        return res.status(400).json({
          success: false,
          message: 'topPlayers must be an array'
        });
      }
      
      await discordGrench.sendLeaderboardUpdate(topPlayers);
      
      res.json({
        success: true,
        message: 'Grench leaderboard update sent to Discord'
      });
    } catch (error) {
      console.error('Failed to send leaderboard update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send leaderboard update'
      });
    }
  },

  /**
   * Send new player welcome
   * POST /api/discord/welcome
   */
  async sendNewPlayerWelcome(req: Request, res: Response) {
    try {
      const { playerAddress, hasNFTs = false } = req.body;
      
      if (!playerAddress) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: playerAddress'
        });
      }
      
      await discordGrench.sendNewPlayerWelcome(playerAddress, hasNFTs);
      
      res.json({
        success: true,
        message: 'Grench welcome message sent to Discord'
      });
    } catch (error) {
      console.error('Failed to send welcome message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome message'
      });
    }
  },

  /**
   * Send market alert
   * POST /api/discord/market-alert
   */
  async sendMarketAlert(req: Request, res: Response) {
    try {
      const { city, strain, priceChange } = req.body;
      
      if (!city || !strain || priceChange === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: city, strain, priceChange'
        });
      }
      
      await discordGrench.sendMarketAlert(city, strain, priceChange);
      
      res.json({
        success: true,
        message: 'Grench market alert sent to Discord'
      });
    } catch (error) {
      console.error('Failed to send market alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send market alert'
      });
    }
  },

  /**
   * Test webhook connection
   * POST /api/discord/test
   */
  async testWebhook(req: Request, res: Response) {
    try {
      const success = await discordGrench.testWebhook();
      
      res.json({
        success,
        message: success ? 'Grench webhook test successful' : 'Webhook test failed - check configuration'
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook test failed'
      });
    }
  },

  /**
   * Get Discord integration status
   * GET /api/discord/status
   */
  async getStatus(req: Request, res: Response) {
    try {
      const webhookConfigured = !!process.env.DISCORD_WEBHOOK_URL;
      
      res.json({
        success: true,
        webhookConfigured,
        grenchPersona: {
          name: "Grench 🎮",
          role: "Underground Trading Network Recruiter",
          description: "AI-powered community engagement for THC Dope Budz"
        },
        availableActions: [
          'recruitment',
          'daily-update',
          'achievement-celebration',
          'leaderboard-update',
          'new-player-welcome',
          'market-alert'
        ]
      });
    } catch (error) {
      console.error('Failed to get Discord status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get status'
      });
    }
  }
};