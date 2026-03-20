import express from 'express';
import { storage } from '../storage';
import { getAvailableCardsForUser, generateUserDeck, getNFTHeroCard, CLASSIFICATION_CARD_DATABASE } from '../../shared/classificationCardDatabase';

const router = express.Router();

// Get user's available cards based on their NFT traits
router.post('/user/available-cards', async (req, res) => {
  try {
    const { walletAddress, nftTraits } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    // Get available cards based on NFT traits
    const userTraits = nftTraits || [];
    const availableCards = getAvailableCardsForUser(userTraits);
    
    res.json({
      success: true,
      walletAddress,
      totalAvailable: availableCards.length,
      cards: availableCards,
      nftConnectedCards: availableCards.filter(card => card.isNFTConnected).length,
      commonCards: availableCards.filter(card => !card.isNFTConnected).length
    });
  } catch (error) {
    console.error('Error fetching user cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available cards'
    });
  }
});

// Generate user's complete deck (1 NFT hero + 7 cards)
router.post('/user/generate-deck', async (req, res) => {
  try {
    const { walletAddress, nftData, nftTraits } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    const userTraits = nftTraits || [];
    const deck = generateUserDeck(nftData, userTraits);
    
    // Get hero card separately for display
    const heroCard = getNFTHeroCard(nftData);
    
    res.json({
      success: true,
      walletAddress,
      deck: deck,
      heroCard: heroCard,
      deckComposition: {
        heroCards: heroCard ? 1 : 0,
        regularCards: deck.length - (heroCard ? 1 : 0),
        totalCards: deck.length,
        rarityBreakdown: {
          legendary: deck.filter(c => c.rarity === 'legendary').length,
          epic: deck.filter(c => c.rarity === 'epic').length,
          rare: deck.filter(c => c.rarity === 'rare').length,
          uncommon: deck.filter(c => c.rarity === 'uncommon').length,
          common: deck.filter(c => c.rarity === 'common').length
        }
      }
    });
  } catch (error) {
    console.error('Error generating user deck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate deck'
    });
  }
});

// Get specific card details by ID
router.get('/card/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    
    const card = CLASSIFICATION_CARD_DATABASE.find(c => c.id === cardId);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    res.json({
      success: true,
      card: card
    });
  } catch (error) {
    console.error('Error fetching card details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch card details'
    });
  }
});

// Get all cards in database (for admin purposes)
router.get('/all-cards', async (req, res) => {
  try {
    res.json({
      success: true,
      totalCards: CLASSIFICATION_CARD_DATABASE.length,
      cards: CLASSIFICATION_CARD_DATABASE,
      statistics: {
        byRarity: {
          legendary: CLASSIFICATION_CARD_DATABASE.filter(c => c.rarity === 'legendary').length,
          epic: CLASSIFICATION_CARD_DATABASE.filter(c => c.rarity === 'epic').length,
          rare: CLASSIFICATION_CARD_DATABASE.filter(c => c.rarity === 'rare').length,
          uncommon: CLASSIFICATION_CARD_DATABASE.filter(c => c.rarity === 'uncommon').length,
          common: CLASSIFICATION_CARD_DATABASE.filter(c => c.rarity === 'common').length
        },
        byClass: {
          ranged: CLASSIFICATION_CARD_DATABASE.filter(c => c.class === 'ranged').length,
          magical: CLASSIFICATION_CARD_DATABASE.filter(c => c.class === 'magical').length,
          tank: CLASSIFICATION_CARD_DATABASE.filter(c => c.class === 'tank').length,
          melee: CLASSIFICATION_CARD_DATABASE.filter(c => c.class === 'melee').length
        },
        byType: {
          tower: CLASSIFICATION_CARD_DATABASE.filter(c => c.type === 'tower').length,
          minion: CLASSIFICATION_CARD_DATABASE.filter(c => c.type === 'minion').length,
          spell: CLASSIFICATION_CARD_DATABASE.filter(c => c.type === 'spell').length
        },
        nftConnected: CLASSIFICATION_CARD_DATABASE.filter(c => c.isNFTConnected).length,
        openToAll: CLASSIFICATION_CARD_DATABASE.filter(c => !c.isNFTConnected).length
      }
    });
  } catch (error) {
    console.error('Error fetching all cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cards'
    });
  }
});

// Check what cards a user can unlock with specific NFT traits
router.post('/user/trait-analysis', async (req, res) => {
  try {
    const { nftTraits } = req.body;
    
    if (!nftTraits || !Array.isArray(nftTraits)) {
      return res.status(400).json({
        success: false,
        error: 'NFT traits array required'
      });
    }

    const analysis: {
      totalTraits: number;
      unlockedCards: any[];
      potentialUnlocks: any[];
      traitPower: Record<string, any>;
    } = {
      totalTraits: nftTraits.length,
      unlockedCards: [],
      potentialUnlocks: [],
      traitPower: {}
    };

    // Analyze each trait's unlocking power
    for (const trait of nftTraits) {
      const traitKey = `${trait.trait_type}:${trait.value}`;
      const unlockedByTrait = CLASSIFICATION_CARD_DATABASE.filter(card =>
        card.traitRequirements.includes(traitKey)
      );
      
      (analysis.traitPower as Record<string, any>)[traitKey] = {
        unlocksCount: unlockedByTrait.length,
        cards: unlockedByTrait.map(c => ({ id: c.id, name: c.name, rarity: c.rarity }))
      };
    }

    // Get all unlocked cards
    const unlockedCards = getAvailableCardsForUser(nftTraits).filter(c => c.isNFTConnected);
    analysis.unlockedCards = unlockedCards;
    
    // Find potential unlocks (cards user can't access yet)
    const potentialUnlocks = CLASSIFICATION_CARD_DATABASE.filter(card =>
      card.isNFTConnected && !unlockedCards.some((unlocked: any) => unlocked.id === card.id)
    );
    analysis.potentialUnlocks = potentialUnlocks;

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing traits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze traits'
    });
  }
});

export default router;