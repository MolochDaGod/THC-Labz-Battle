import express from "express";
import { storage } from "./storage";
import { z } from "zod";

const router = express.Router();

// Import AI Agent Wallet Service - use the exported instance
import { aiAgentWallet } from "./ai-agent-wallet";

// Validation schemas
const distributeRewardsSchema = z.object({
  distributions: z.array(z.object({
    walletAddress: z.string(),
    tokenType: z.enum(['budz', 'gbux', 'thc_labz']),
    amount: z.number().positive(),
    reason: z.string()
  }))
});

const transferTokensSchema = z.object({
  recipientWallet: z.string(),
  tokenType: z.enum(['budz', 'gbux', 'thc_labz']),
  amount: z.number().positive(),
  reason: z.string().optional()
});

// Use the exported AI Agent Wallet Service instance

/**
 * Get AI Agent status and wallet information
 */
router.get('/status', async (req, res) => {
  try {
    const status = await aiAgentWallet.getAIAgentStatus();
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'AI Agent wallet not found'
      });
    }

    res.json({
      success: true,
      data: {
        address: status.address,
        budzBalance: status.budzBalance,
        gbuxBalance: status.gbuxBalance,
        thcLabzBalance: status.thcLabzBalance,
        lastUpdated: status.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error getting AI Agent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI Agent status'
    });
  }
});

/**
 * Initialize AI Agent wallet
 */
router.post('/initialize', async (req, res) => {
  try {
    console.log('🤖 Initializing AI Agent wallet...');
    const wallet = await aiAgentWallet.initializeAIAgentWallet();
    
    res.json({
      success: true,
      data: {
        address: wallet.address,
        budzBalance: wallet.budzBalance,
        gbuxBalance: wallet.gbuxBalance,
        thcLabzBalance: wallet.thcLabzBalance,
        lastUpdated: wallet.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error initializing AI Agent wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize AI Agent wallet'
    });
  }
});

/**
 * Transfer tokens from AI Agent to user
 */
router.post('/transfer', async (req, res) => {
  try {
    const { recipientWallet, tokenType, amount, reason } = req.body;
    
    console.log(`🤖 Processing AI Agent transfer: ${amount} ${tokenType.toUpperCase()} → ${recipientWallet}`);
    
    const success = await aiAgentWallet.transferTokensFromAI(
      recipientWallet,
      tokenType,
      amount,
      reason || 'AI Agent Transfer'
    );
    
    if (success) {
      res.json({
        success: true,
        message: `Successfully transferred ${amount} ${tokenType.toUpperCase()} to ${recipientWallet}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Transfer failed'
      });
    }
  } catch (error) {
    console.error('❌ Error processing AI Agent transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process transfer'
    });
  }
});

/**
 * Batch distribute rewards to multiple users
 */
router.post('/distribute-rewards', async (req, res) => {
  try {
    const { distributions } = req.body;
    
    console.log(`🎯 Processing batch reward distribution: ${distributions.length} transfers`);
    
    const results = await aiAgentWallet.processBatchDistribution(distributions);
    
    res.json({
      success: true,
      data: {
        totalTransfers: distributions.length,
        successful: results.success,
        failed: results.failed,
        successRate: `${((results.success / distributions.length) * 100).toFixed(1)}%`
      }
    });
  } catch (error) {
    console.error('❌ Error processing batch distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch distribution'
    });
  }
});

/**
 * Process battle rewards specifically
 */
router.post('/battle-rewards', async (req, res) => {
  try {
    const { walletAddress, victory, timeRemaining } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }
    
    const budzReward = victory ? 100 : 25; // Victory: 100 BUDZ, Participation: 25 BUDZ
    const reason = victory ? 
      `Battle Victory (${timeRemaining || 0}s remaining)` : 
      'Battle Participation';
    
    console.log(`🎯 Processing battle rewards: ${budzReward} BUDZ for ${victory ? 'victory' : 'participation'}`);
    
    const success = await aiAgentWallet.transferTokensFromAI(
      walletAddress,
      'budz',
      budzReward,
      reason
    );
    
    if (success) {
      res.json({
        success: true,
        data: {
          reward: budzReward,
          tokenType: 'budz',
          reason,
          walletAddress
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Battle reward distribution failed'
      });
    }
  } catch (error) {
    console.error('❌ Error processing battle rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process battle rewards'
    });
  }
});

/**
 * Get AI Agent transaction history (future enhancement)
 */
router.get('/transactions', async (req, res) => {
  try {
    // Future: Implement transaction history from database
    res.json({
      success: true,
      data: {
        transactions: [],
        message: 'Transaction history feature coming soon'
      }
    });
  } catch (error) {
    console.error('❌ Error getting AI Agent transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history'
    });
  }
});

export { router as aiAgentRoutes };