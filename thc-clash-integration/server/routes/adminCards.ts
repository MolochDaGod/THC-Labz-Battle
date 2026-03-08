import express from 'express';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { adminCards } from '../../shared/adminSchema';
import { CLASSIFICATION_CARD_DATABASE } from '../../shared/classificationCardDatabase';

const router = express.Router();

// Get all admin cards
router.get('/cards', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const cards = await db.select().from(adminCards);
    
    // If no admin cards exist, initialize with classification database
    if (cards.length === 0) {
      const initialCards = CLASSIFICATION_CARD_DATABASE.map(card => ({
        id: card.id,
        name: card.name,
        cost: card.cost,
        attack: card.attack,
        health: card.health,
        description: card.description,
        rarity: card.rarity,
        class: card.class,
        type: card.type,
        image: card.image,
        abilities: card.abilities || [],
        traitRequirements: card.traitRequirements || [],
        isActive: true
      }));

      await db.insert(adminCards).values(initialCards);
      const newCards = await db.select().from(adminCards);
      
      return res.json({
        success: true,
        cards: newCards,
        message: 'Initialized cards from classification database'
      });
    }

    res.json({
      success: true,
      cards: cards
    });
  } catch (error) {
    console.error('Error fetching admin cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cards'
    });
  }
});

// Get single card by ID
router.get('/cards/:id', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const cardId = req.params.id;
    const card = await db.select().from(adminCards).where(eq(adminCards.id, cardId)).limit(1);
    
    if (card.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    res.json({
      success: true,
      card: card[0]
    });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch card'
    });
  }
});

// Create new card
router.post('/cards', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const cardData = req.body;
    
    // Validate required fields
    const requiredFields = ['id', 'name', 'cost', 'attack', 'health', 'description', 'rarity', 'class', 'type', 'image'];
    for (const field of requiredFields) {
      if (cardData[field] === undefined || cardData[field] === null) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    const newCard = {
      id: cardData.id,
      name: cardData.name,
      cost: cardData.cost,
      attack: cardData.attack,
      health: cardData.health,
      description: cardData.description,
      rarity: cardData.rarity,
      class: cardData.class,
      type: cardData.type,
      image: cardData.image,
      abilities: cardData.abilities || [],
      trait_requirements: cardData.traitRequirements || [],
      is_active: cardData.isActive !== undefined ? cardData.isActive : true
    };

    const result = await db.insert(adminCards).values(newCard).returning();

    res.json({
      success: true,
      card: result[0],
      message: 'Card created successfully'
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create card'
    });
  }
});

// Update card
router.put('/cards/:id', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const cardId = req.params.id;
    const cardData = req.body;

    const updateData = {
      name: cardData.name,
      cost: cardData.cost,
      attack: cardData.attack,
      health: cardData.health,
      description: cardData.description,
      rarity: cardData.rarity,
      class: cardData.class,
      type: cardData.type,
      image: cardData.image,
      abilities: cardData.abilities || [],
      traitRequirements: cardData.traitRequirements || [],
      isActive: cardData.isActive !== undefined ? cardData.isActive : true,
      updatedAt: new Date()
    };

    const result = await db.update(adminCards)
      .set(updateData)
      .where(eq(adminCards.id, cardId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    res.json({
      success: true,
      card: result[0],
      message: 'Card updated successfully'
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update card'
    });
  }
});

// Delete card
router.delete('/cards/:id', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const cardId = req.params.id;
    
    const result = await db.delete(adminCards)
      .where(eq(adminCards.id, cardId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete card'
    });
  }
});

// Get active cards for gameplay
router.get('/cards/active/gameplay', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const activeCards = await db.select()
      .from(adminCards)
      .where(eq(adminCards.isActive, true));

    res.json({
      success: true,
      cards: activeCards
    });
  } catch (error) {
    console.error('Error fetching active cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active cards'
    });
  }
});

// Get cards available for specific NFT traits
router.post('/cards/for-traits', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }
    
    const { nftTraits } = req.body;
    
    if (!nftTraits || !Array.isArray(nftTraits)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid NFT traits provided'
      });
    }

    // Get all active cards
    const allActiveCards = await db.select()
      .from(adminCards)
      .where(eq(adminCards.isActive, true));

    // Filter cards based on trait requirements
    const availableCards = allActiveCards.filter((card: any) => {
      // Always include cards with no trait requirements
      if (!card.traitRequirements || card.traitRequirements.length === 0) {
        return true;
      }

      // Check if player has any of the required traits
      return card.traitRequirements.some((requirement: any) => {
        const [traitType, traitValue] = requirement.split(':');
        return nftTraits.some(trait => 
          trait.trait_type === traitType && trait.value === traitValue
        );
      });
    });

    res.json({
      success: true,
      cards: availableCards,
      totalAvailable: availableCards.length
    });
  } catch (error) {
    console.error('Error fetching cards for traits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cards for traits'
    });
  }
});

// Generate classification-based card collection (restore old system)
router.post('/generate-classification-cards', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }

    // Use the CLASSIFICATION_CARD_DATABASE for the original working cards
    const classificationCards = CLASSIFICATION_CARD_DATABASE.map(card => ({
      id: card.id,
      name: card.name,
      cost: card.cost,
      attack: card.attack,
      health: card.health,
      description: card.description,
      rarity: card.rarity,
      class: card.class,
      type: card.type,
      image: card.image,
      abilities: card.abilities || [],
      traitRequirements: card.traitRequirements || [],
      isActive: card.isNFTConnected ? false : true, // NFT cards require unlock
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Clear existing cards and insert the classification collection
    await db.delete(adminCards);
    await db.insert(adminCards).values(classificationCards);

    console.log('🎯 Generated and saved classification card collection to database:', classificationCards.length, 'cards');
    
    res.json({
      success: true,
      cards: classificationCards,
      message: `Successfully generated ${classificationCards.length} classification THC cards`
    });
  } catch (error) {
    console.error('Error generating classification cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate classification card collection'
    });
  }
});

// Get classification cards with all data needed for gameplay
router.get('/classification-cards', async (req, res) => {
  try {
    const db = storage.getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: "Database not available" 
      });
    }

    let allCards = await db.select().from(adminCards);

    // If no cards exist, generate them from the classification database
    if (allCards.length === 0) {
      console.log('🎯 No cards found, auto-generating classification collection...');
      
      const classificationCards = CLASSIFICATION_CARD_DATABASE.map(card => ({
        id: card.id,
        name: card.name,
        cost: card.cost,
        attack: card.attack,
        health: card.health,
        description: card.description,
        rarity: card.rarity,
        class: card.class,
        type: card.type,
        image: card.image,
        abilities: JSON.stringify(card.abilities || []),
        traitRequirements: JSON.stringify(card.traitRequirements || []),
        isActive: card.isNFTConnected ? false : true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await db.insert(adminCards).values(classificationCards);
      allCards = classificationCards;
    }

    res.json({
      success: true,
      cards: allCards,
      totalCards: allCards.length
    });
  } catch (error) {
    console.error('Error fetching classification cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch classification cards'
    });
  }
});

export default router;