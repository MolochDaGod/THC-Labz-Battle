import express from 'express';
import aiService from '../ai-service';
import { advancedAIController } from '../advanced-ai-controller';

const router = express.Router();

// Generate AI missions with advanced controller
router.post('/missions', async (req, res) => {
  try {
    const { gameState, walletAddress } = req.body;
    
    if (!gameState || !walletAddress) {
      return res.status(400).json({ error: 'Game state and wallet address required' });
    }

    console.log('🤖 Generating advanced AI mission for wallet:', walletAddress);
    const mission = await advancedAIController.generateDynamicMission(gameState, walletAddress);
    res.json({ missions: [mission] });
  } catch (error) {
    console.error('Advanced AI Mission Generation Error:', error);
    // Fallback to original service
    const missions = await aiService.generateMissions(gameState, walletAddress);
    res.json({ missions });
  }
});

// Generate AI response with advanced controller
router.post('/chat', async (req, res) => {
  try {
    const { message, gameState, playerNFTs, walletAddress } = req.body;
    
    if (!gameState || !walletAddress) {
      return res.status(400).json({ error: 'Game state and wallet address required' });
    }

    console.log('🤖 Generating advanced AI advice for wallet:', walletAddress);
    const aiAdvice = await advancedAIController.generateAIAdvice(gameState, walletAddress, message);
    
    res.json({ 
      message: aiAdvice,
      missions: [],
      specialEvent: null,
      personality: 85 // Enhanced AI personality
    });
  } catch (error) {
    console.error('Advanced AI Chat Error:', error);
    // Fallback to original service
    const response = await aiService.generateResponse(message || "Give me advice", gameState, playerNFTs || []);
    res.json(response);
  }
});

// Generate advanced AI events
router.post('/event', async (req, res) => {
  try {
    const { gameState, walletAddress } = req.body;
    
    if (!gameState || !walletAddress) {
      return res.status(400).json({ error: 'Game state and wallet address required' });
    }

    console.log('🤖 Generating advanced AI event for wallet:', walletAddress);
    const aiEvent = await advancedAIController.generateDynamicEvent(gameState, walletAddress);
    res.json({ event: aiEvent });
  } catch (error) {
    console.error('Advanced AI Event Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI event' });
  }
});

// Legacy event endpoint
router.post('/legacy-event', async (req, res) => {
  try {
    const { gameState } = req.body;
    
    if (!gameState) {
      return res.status(400).json({ error: 'Game state required' });
    }

    const event = await aiService.generateSpecialEvent(gameState);
    res.json(event);
  } catch (error) {
    console.error('AI Event Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate event' });
  }
});

export default router;