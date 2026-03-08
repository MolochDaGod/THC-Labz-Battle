/**
 * AI Assistant API Routes
 * RESTful endpoints for local database-stored AI assistant with conversational capabilities
 */

import { type Request, type Response } from 'express';
import { aiAssistantService } from './ai-assistant-service';

export const aiAssistantRoutes = {
  /**
   * Send message to AI assistant
   * POST /api/ai-assistant/chat
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { walletAddress, message, gameState, nftData } = req.body;

      if (!walletAddress || !message || !gameState) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: walletAddress, message, gameState'
        });
      }

      // Ensure assistant exists (create if needed with NFT data)
      if (nftData) {
        await aiAssistantService.getOrCreateAssistant(walletAddress, nftData);
      }

      const response = await aiAssistantService.sendMessage(
        walletAddress,
        message,
        gameState
      );

      console.log(`🤖 AI Assistant response for ${walletAddress.slice(0, 8)}...`, response.message.slice(0, 100));

      res.json({
        success: true,
        response: response.message,
        suggestions: response.suggestions || [],
        gameAdvice: response.gameAdvice || null,
      });
    } catch (error) {
      console.error('❌ AI Assistant chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process AI assistant message',
        fallback: "Yo, I'm having some tech issues right now. Try again in a moment!"
      });
    }
  },

  /**
   * Get conversation history
   * GET /api/ai-assistant/history/:walletAddress
   */
  async getHistory(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      const history = await aiAssistantService.getConversationHistory(walletAddress, limit);

      res.json({
        success: true,
        history,
        count: history.length,
      });
    } catch (error) {
      console.error('❌ Get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation history'
      });
    }
  },

  /**
   * Get AI assistant info
   * GET /api/ai-assistant/info/:walletAddress
   */
  async getAssistantInfo(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      const assistant = await aiAssistantService.getAssistantInfo(walletAddress);

      if (!assistant) {
        return res.json({
          success: true,
          assistant: null,
          message: 'No assistant found. Send a message to create one.'
        });
      }

      res.json({
        success: true,
        assistant: {
          id: assistant.id,
          name: assistant.name,
          personality: assistant.personality,
          nftName: assistant.nftName,
          nftRarity: assistant.nftRarity,
          aiTemperature: assistant.aiTemperature,
          createdAt: assistant.createdAt,
        }
      });
    } catch (error) {
      console.error('❌ Get assistant info error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assistant info'
      });
    }
  },

  /**
   * Create or update AI assistant with NFT data
   * POST /api/ai-assistant/setup
   */
  async setupAssistant(req: Request, res: Response) {
    try {
      const { walletAddress, nftData } = req.body;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      const assistant = await aiAssistantService.getOrCreateAssistant(walletAddress, nftData);

      console.log(`🤖 AI Assistant setup for ${walletAddress.slice(0, 8)}... - ${assistant.name} (${assistant.personality})`);

      res.json({
        success: true,
        assistant: {
          id: assistant.id,
          name: assistant.name,
          personality: assistant.personality,
          nftName: assistant.nftName,
          nftRarity: assistant.nftRarity,
          aiTemperature: assistant.aiTemperature,
        }
      });
    } catch (error) {
      console.error('❌ Setup assistant error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to setup AI assistant'
      });
    }
  },

  /**
   * Clear conversation history (for testing)
   * DELETE /api/ai-assistant/history/:walletAddress
   */
  async clearHistory(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address required'
        });
      }

      await aiAssistantService.clearHistory(walletAddress);

      console.log(`🗑️ Cleared conversation history for ${walletAddress.slice(0, 8)}...`);

      res.json({
        success: true,
        message: 'Conversation history cleared'
      });
    } catch (error) {
      console.error('❌ Clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear conversation history'
      });
    }
  },

  /**
   * Get daily brief with market analysis
   * POST /api/ai-assistant/daily-brief
   */
  async getDailyBrief(req: Request, res: Response) {
    try {
      const { walletAddress, gameState, drugs } = req.body;

      if (!walletAddress || !gameState || !drugs) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: walletAddress, gameState, drugs'
        });
      }

      // Generate market analysis message
      const marketAnalysis = `Give me a daily brief for Day ${gameState.day}. I'm in ${gameState.currentCity} with $${gameState.money.toLocaleString()} and ${gameState.health}% health. Analyze current BUDZ market conditions and suggest best trading opportunities.`;

      const response = await aiAssistantService.sendMessage(
        walletAddress,
        marketAnalysis,
        gameState
      );

      console.log(`📊 Daily brief generated for ${walletAddress.slice(0, 8)}... on Day ${gameState.day}`);

      res.json({
        success: true,
        briefing: response.message,
        marketTips: response.suggestions || [],
        strategicAdvice: response.gameAdvice || null,
        day: gameState.day,
        city: gameState.currentCity,
      });
    } catch (error) {
      console.error('❌ Daily brief error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate daily brief',
        fallback: "Market's looking good today! Keep an eye on price fluctuations and consider traveling to different cities for better deals."
      });
    }
  }
};