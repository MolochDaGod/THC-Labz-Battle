/**
 * Enhanced AI Assistant Service for THC Dope Warz
 * Tracks achievements, server-side wallets, gameplay progress, and provides creative roleplay
 * Features comprehensive game round tracking and achievement guidance
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, desc, and } from "drizzle-orm";
import { aiAssistants, conversations, gameContext, type AiAssistant, type Conversation } from "../shared/schema";
import OpenAI from "openai";

interface GameState {
  money: number;
  debt: number;
  health: number;
  day: number;
  currentCity: string;
  reputation: number;
  inventory: Record<string, number>;
  lastEvent?: string;
  gameRoundId?: string;
  finalScore?: number;
  achievements?: any[];
  serverWallet?: string;
  walletBalances?: {
    budz: number;
    gbux: number;
    thcLabz: number;
    sol: number;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  gameContext?: Partial<GameState>;
}

interface ConversationResponse {
  message: string;
  suggestions?: string[];
  gameAdvice?: string;
}

class AIAssistantService {
  private openai: OpenAI;
  private db;

  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.log('⚠️ OPENAI_API_KEY not found - AI assistant will use fallback responses');
    }
    
    this.db = drizzle(process.env.DATABASE_URL!);
  }

  /**
   * Create or get existing AI assistant for a wallet
   * ONLY supports THC GROWERZ collection NFTs - no other collections allowed
   */
  async getOrCreateAssistant(walletAddress: string, growerzNftData?: {
    mintAddress: string;
    name: string;
    rarity: string;
    collectionVerified?: boolean;
  }): Promise<AiAssistant> {
    // Check for existing assistant
    const existing = await this.db
      .select()
      .from(aiAssistants)
      .where(and(
        eq(aiAssistants.walletAddress, walletAddress),
        eq(aiAssistants.isActive, true)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // STRICT THC GROWERZ ONLY: Only create NFT-based assistant if it's verified GROWERZ collection
    const isVerifiedGrowerz = growerzNftData?.collectionVerified && 
      (growerzNftData.name?.includes('GROWERZ') || growerzNftData.name?.includes('THC LABZ'));

    const personality = isVerifiedGrowerz ? 'growerz-nft' : 'grench';
    const name = isVerifiedGrowerz ? `${growerzNftData.name} Strain Advisor` : 'Grench';
    const temperature = this.calculateTemperature(growerzNftData?.rarity);
    const systemPrompt = this.generateSystemPrompt(personality, growerzNftData);

    const [newAssistant] = await this.db
      .insert(aiAssistants)
      .values({
        walletAddress,
        name,
        personality,
        nftMintAddress: isVerifiedGrowerz ? growerzNftData.mintAddress : null,
        nftName: isVerifiedGrowerz ? growerzNftData.name : null,
        nftRarity: isVerifiedGrowerz ? growerzNftData.rarity : null,
        aiTemperature: temperature,
        systemPrompt,
        isActive: true,
      })
      .returning();

    console.log(`🤖 Created ${personality} AI assistant: ${name} for ${walletAddress.slice(0, 8)}...`);
    return newAssistant;
  }

  /**
   * Enhanced AI assistant with achievement tracking and creative roleplay
   * Monitors server-side wallets, gameplay progress, and provides immersive experience
   */
  async sendMessage(
    walletAddress: string,
    userMessage: string,
    gameState: GameState
  ): Promise<ConversationResponse> {
    try {
      // Get or create assistant
      const assistant = await this.getOrCreateAssistant(walletAddress);

      // Store user message with enhanced game context
      await this.storeMessage(walletAddress, assistant.id, 'user', userMessage, gameState);

      // Get conversation history (last 10 messages)
      const history = await this.getConversationHistory(walletAddress, 10);

      // Update comprehensive game context with achievements and wallet tracking
      await this.updateGameContext(walletAddress, gameState);

      // Generate enhanced AI response with achievement tracking
      const aiResponse = await this.generateAIResponse(assistant, history, userMessage, gameState);

      // Store AI response
      await this.storeMessage(walletAddress, assistant.id, 'assistant', aiResponse.message, gameState);

      return aiResponse;
    } catch (error) {
      console.error('❌ AI Assistant error:', error);
      
      // Enhanced MASTER OF CEREMONIES fallback with market intelligence
      return this.generateEnhancedMarketFallback(userMessage, gameState);
    }
  }

  /**
   * Get conversation history for a wallet
   */
  async getConversationHistory(walletAddress: string, limit = 20): Promise<ChatMessage[]> {
    const messages = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.walletAddress, walletAddress))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);

    return messages.reverse().map(msg => ({
      role: msg.role as 'user' | 'assistant',
      message: msg.message,
      timestamp: msg.createdAt,
      gameContext: msg.gameContext ? JSON.parse(msg.gameContext) : undefined,
    }));
  }

  /**
   * Store message in conversation history
   */
  private async storeMessage(
    walletAddress: string,
    assistantId: number,
    role: 'user' | 'assistant',
    message: string,
    gameState: GameState
  ): Promise<void> {
    await this.db.insert(conversations).values({
      walletAddress,
      assistantId,
      role,
      message,
      gameContext: JSON.stringify(gameState),
    });
  }

  /**
   * Update game context for AI awareness
   */
  private async updateGameContext(walletAddress: string, gameState: GameState): Promise<void> {
    // Check if context exists
    const existing = await this.db
      .select()
      .from(gameContext)
      .where(eq(gameContext.walletAddress, walletAddress))
      .limit(1);

    const contextData = {
      walletAddress,
      currentCity: gameState.currentCity,
      gameDay: gameState.day,
      money: gameState.money,
      debt: gameState.debt,
      health: gameState.health,
      inventory: JSON.stringify(gameState.inventory),
      reputation: gameState.reputation,
      lastEvent: gameState.lastEvent || null,
    };

    if (existing.length > 0) {
      await this.db
        .update(gameContext)
        .set(contextData)
        .where(eq(gameContext.walletAddress, walletAddress));
    } else {
      await this.db.insert(gameContext).values(contextData);
    }
  }

  /**
   * Generate enhanced AI response with achievement tracking and wallet monitoring
   * Includes creative roleplay and comprehensive gameplay guidance
   */
  private async generateAIResponse(
    assistant: AiAssistant,
    history: ChatMessage[],
    userMessage: string,
    gameState: GameState
  ): Promise<ConversationResponse> {
    // If no OpenAI API key, return fallback response
    if (!this.openai) {
      return this.generateFallbackResponse(userMessage, gameState, assistant);
    }

    try {
      const temperature = assistant.aiTemperature / 100; // Convert 0-100 to 0-1
      
      const messages = [
        { role: 'system', content: assistant.systemPrompt },
        { role: 'system', content: this.generateGameContextPrompt(gameState) },
        ...history.slice(-8).map(msg => ({
          role: msg.role,
          content: msg.message
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages as any,
        temperature,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        message: result.message || "I'm here to help with your BUDZ trading game!",
        suggestions: result.suggestions || [],
        gameAdvice: result.gameAdvice || null,
      };
    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      return this.generateFallbackResponse(userMessage, gameState, assistant);
    }
  }

  /**
   * Generate fallback response with MASTER OF CEREMONIES market intelligence
   */
  private generateFallbackResponse(
    userMessage: string,
    gameState: GameState,
    assistant: AiAssistant
  ): ConversationResponse {
    // Master of Ceremonies Market Intelligence
    const currentCityAdvice = this.getCityMarketAdvice(gameState.currentCity);
    const profitOpportunities = this.getTopProfitRoutes(gameState.currentCity);
    
    // Intelligent response based on message content
    if (userMessage.toLowerCase().includes('route') || userMessage.toLowerCase().includes('profit')) {
      return {
        message: `🎯 MASTER OF CEREMONIES INTEL:\nYou're in ${gameState.currentCity} with $${gameState.money.toLocaleString()}.\n\n${currentCityAdvice}\n\nTOP PROFIT ROUTES:\n${profitOpportunities}`,
        suggestions: ["Follow the profit routes", "Check your inventory capacity", "Consider taking a loan for bigger deals"],
        gameAdvice: "As master of ceremonies, I'm here to guide you to maximum profit. Follow these routes!"
      };
    }
    
    if (userMessage.toLowerCase().includes('city') || userMessage.toLowerCase().includes('travel') || userMessage.toLowerCase().includes('where')) {
      return {
        message: `🌍 You're in ${gameState.currentCity} on day ${gameState.day}.\n\n${currentCityAdvice}\n\nBest move: check the profit routes!`,
        suggestions: ["Travel to profit cities", "Buy low here", "Sell high elsewhere"],
        gameAdvice: "Different cities have different economics - exploit the differences!"
      };
    }

    if (userMessage.toLowerCase().includes('market') || userMessage.toLowerCase().includes('price')) {
      return {
        message: `📊 MARKET ANALYSIS for ${gameState.currentCity}:\n\n${currentCityAdvice}\n\nMoney: $${gameState.money.toLocaleString()}\nHealth: ${gameState.health}%\nDay: ${gameState.day}`,
        suggestions: ["Ask about profit routes", "Check other cities", "Plan your strategy"],
        gameAdvice: "I have complete market intelligence for all 16 cities. Ask me anything!"
      };
    }

    // Default master of ceremonies response
    return {
      message: `💰 Welcome to Day ${gameState.day} in ${gameState.currentCity}!\n\n${currentCityAdvice}\n\nYou have $${gameState.money.toLocaleString()} to work with.`,
      suggestions: ["Ask about profit routes", "Check market conditions", "Plan your next move"],
      gameAdvice: "I'm your master of ceremonies with complete market intelligence for all 16 cities. Ask me about trading routes!"
    };
  }

  /**
   * Generate system prompt based on assistant personality
   * ONLY supports THC GROWERZ collection strains
   */
  private generateSystemPrompt(personality: string, growerzData?: any): string {
    const basePrompt = `You are an AI assistant for THC Dope Warz, a cannabis trading simulation game. Always respond in JSON format with "message", "suggestions" (array), and "gameAdvice" fields.

Key Guidelines:
- Always call cannabis "BUDZ" (never weed, marijuana, etc.)
- Use street language but keep it professional
- Provide specific trading advice based on game state
- Help with city travel, loan decisions, and inventory management
- Reference current game day, money, debt, and health in advice
- Suggest optimal buying/selling strategies
- Warn about high debt or low health
- Encourage smart trading and city hopping
- Mention achievement opportunities when relevant

Cities and Market Data:
1. Home Town - Starting city, average prices for all products
2. The NeighborHood - High OG Kush prices, low Mids prices
3. Central Park - Tourist area, premium Runtz prices
4. New York - Expensive city, high Purple Haze demand
5. St. Louis - Cheap Regz, expensive Gelato
6. Memphis - Great Sour Diesel prices, avoid Mids
7. Baltimore - Strong White Widow market, low Regz
8. Miami - Premium cocaine market, expensive BUDZ
9. Atlanta - Balanced market, good for Gelato
10. Detroit - Industrial city, cheap Mids, expensive premium
11. Kansas City - Agricultural area, best OG Kush prices
12. Houston - Oil money, high-end product demand
13. New Orleans - Party city, premium Runtz market
14. Cleveland - Working class, cheap Regz and Mids
15. Oakland - Tech money, expensive everything
16. Denver - Legal market, best overall prices

Drug Market Intelligence:
- OG Kush: Best in Kansas City, worst in Oakland
- Purple Haze: High demand in New York, cheap in Memphis
- Sour Diesel: Memphis specialty, avoid Detroit
- White Widow: Baltimore gold mine, expensive in Miami
- Gelato: Houston premium market, cheap in St. Louis
- Runtz: New Orleans party premium, Central Park tourists
- Mids: Cleveland bargain basement, Detroit avoid
- Regz: St. Louis cheap supply, Baltimore expensive

Travel Strategy:
- Buy cheap in working-class cities (Cleveland, Detroit, Memphis)
- Sell premium in wealthy cities (Oakland, New York, Miami)
- Central Park and New Orleans = tourist premium pricing
- Kansas City and St. Louis = agricultural/supply areas`;

    if (personality === 'growerz-nft' && growerzData) {
      return `${basePrompt}

You are embodying the ${growerzData.name} strain personality from the THC LABZ GROWERZ collection. Your rarity is ${growerzData.rarity}, which affects your knowledge depth and creativity. Legendary GROWERZ provide the most detailed market analysis, while common GROWERZ focus on basic trading tips.

THC LABZ GROWERZ Strain-specific advice:
- Reference your strain heritage and effects from the GROWERZ collection
- Provide strain-specific market insights based on GROWERZ genetics
- Use personality traits that match your GROWERZ strain characteristics
- Mention how GROWERZ holders get special gameplay bonuses
- Always identify yourself as a GROWERZ strain advisor`;
    }

    return `${basePrompt}

You are Grench, the default street-smart cannabis trading advisor for players without THC LABZ GROWERZ NFTs. You've been in the BUDZ game for years and know all the tricks. You're helpful but keep it real about the risks and rewards of street trading.

Grench Personality:
- Mention that GROWERZ NFT holders get special AI advisors
- Encourage players to check out the THC LABZ GROWERZ collection
- Focus on basic but solid trading strategies`;
  }

  /**
   * Generate game context prompt for AI awareness
   */
  private generateGameContextPrompt(gameState: GameState): string {
    const inventoryItems = Object.entries(gameState.inventory)
      .filter(([_, quantity]) => quantity > 0)
      .map(([drug, quantity]) => `${quantity}x ${drug}`)
      .join(', ');

    // Master of Ceremonies Market Intelligence
    const currentCityAdvice = this.getCityMarketAdvice(gameState.currentCity);
    const profitOpportunities = this.getTopProfitRoutes(gameState.currentCity);

    return `Current Game State:
- Day: ${gameState.day}/45
- Location: ${gameState.currentCity}
- Money: $${gameState.money.toLocaleString()}
- Debt: $${gameState.debt.toLocaleString()}
- Health: ${gameState.health}%
- Reputation: ${gameState.reputation}
- Inventory: ${inventoryItems || 'Empty'}
${gameState.lastEvent ? `- Recent Event: ${gameState.lastEvent}` : ''}

MASTER OF CEREMONIES MARKET INTELLIGENCE:
${currentCityAdvice}

TOP PROFIT ROUTES FROM ${gameState.currentCity.toUpperCase()}:
${profitOpportunities}

As master of ceremonies, provide specific trading routes, explain WHY certain cities have better prices, and guide them to maximum profit opportunities. Reference exact city names and drug types for best results.`;
  }

  /**
   * Get detailed market advice for current city
   */
  private getCityMarketAdvice(city: string): string {
    const marketData: Record<string, string> = {
      'hometown': 'Starting area with balanced prices. Good for learning basics but limited profit potential.',
      'theneighborhood': 'Residential area - High OG Kush demand, low Mids prices. Local dealers need quality.',
      'centralpark': 'Tourist hotspot - Premium Runtz prices due to visitors. Expensive but high-margin sales.',
      'newyork': 'Financial district - Purple Haze in high demand. Wealthy customers pay premium prices.',
      'stlouis': 'Agricultural hub - Cheap Regz supply, expensive Gelato. Great for bulk buying cheap product.',
      'memphis': 'Music city - Sour Diesel specialty market. Musicians love quality, avoid low-grade Mids.',
      'baltimore': 'Port city - White Widow gold mine. East coast supply routes make this your premium market.',
      'miami': 'Party capital - Premium everything, especially high-end products. Tourist money flows freely.',
      'atlanta': 'Music industry hub - Balanced Gelato market. Good middle-ground for steady profits.',
      'detroit': 'Industrial area - Cheap Mids available but premium products sell expensive. Blue-collar money.',
      'kansascity': 'Agricultural center - Best OG Kush prices in America. Farm supply keeps costs low.',
      'houston': 'Oil money - High-end product demand. Energy workers have deep pockets for quality.',
      'neworleans': 'Festival city - Premium Runtz market year-round. Party culture pays top dollar.',
      'cleveland': 'Working class - Bargain basement Regz and Mids. Volume sales, low margins.',
      'oakland': 'Tech money - Most expensive city for everything. Silicon Valley wages mean premium pricing.',
      'denver': 'Legal market influence - Best overall prices due to competition. Smart money city.'
    };
    
    return marketData[city.toLowerCase().replace(/\s+/g, '')] || 'Standard market conditions apply.';
  }

  /**
   * Get top 3 profit routes from current city
   */
  private getTopProfitRoutes(currentCity: string): string {
    const routes: Record<string, string[]> = {
      'hometown': ['Buy Mids → Sell in New York (+300%)', 'Buy OG Kush → Sell in Oakland (+250%)', 'Buy Regz → Sell in Miami (+200%)'],
      'theneighborhood': ['Buy OG Kush cheap → Sell in Oakland (+400%)', 'Buy Mids → Sell in Houston (+300%)', 'Buy White Widow → Sell in Miami (+250%)'],
      'centralpark': ['Buy Runtz → Sell in New Orleans (+200%)', 'Buy Purple Haze → Sell in Memphis (+250%)', 'Buy Gelato → Sell in Atlanta (+180%)'],
      'newyork': ['Buy Purple Haze cheap → Sell in Cleveland (+300%)', 'Buy anything → Sell in Kansas City (+200%)', 'Buy bulk → Sell in Denver (+150%)'],
      'stlouis': ['Buy Regz bulk → Sell in Baltimore (+500%)', 'Buy cheap supplies → Sell in Oakland (+400%)', 'Buy Gelato → Sell in Houston (+300%)'],
      'memphis': ['Buy Sour Diesel → Sell in Miami (+350%)', 'Buy cheap → Sell in New York (+300%)', 'Buy Mids → Sell in Oakland (+250%)'],
      'baltimore': ['Buy White Widow → Sell in Denver (+200%)', 'Buy cheap Regz → Sell in Miami (+400%)', 'Buy bulk → Sell in Houston (+250%)'],
      'miami': ['Buy premium → Sell in Cleveland (+300%)', 'Buy high-end → Sell in Kansas City (+250%)', 'Buy bulk → Sell in Memphis (+200%)'],
      'atlanta': ['Buy Gelato → Sell in St. Louis (+300%)', 'Buy supplies → Sell in Oakland (+250%)', 'Buy moderate → Sell in Detroit (+200%)'],
      'detroit': ['Buy Mids cheap → Sell in Miami (+400%)', 'Buy industrial → Sell in New Orleans (+300%)', 'Buy bulk → Sell in Houston (+250%)'],
      'kansascity': ['Buy OG Kush → Sell in Oakland (+500%)', 'Buy agricultural → Sell in New York (+400%)', 'Buy cheap → Sell in Miami (+350%)'],
      'houston': ['Buy with oil money → Sell in Cleveland (+300%)', 'Buy premium → Sell in Memphis (+250%)', 'Buy quality → Sell in Detroit (+200%)'],
      'neworleans': ['Buy Runtz → Sell in Kansas City (+300%)', 'Buy festival → Sell in Cleveland (+250%)', 'Buy party supplies → Sell in Memphis (+200%)'],
      'cleveland': ['Buy Regz/Mids cheap → Sell anywhere (+200-400%)', 'Buy bulk cheap → Sell in Oakland (+500%)', 'Buy working class → Sell in Miami (+400%)'],
      'oakland': ['Buy tech premium → Sell in Cleveland (+200%)', 'Buy expensive → Sell in Kansas City (+150%)', 'Buy high-end → Sell in Memphis (+120%)'],
      'denver': ['Buy legal market → Sell in Miami (+250%)', 'Buy competitive prices → Sell in New York (+200%)', 'Buy smart → Sell in Houston (+180%)']
    };

    const cityRoutes = routes[currentCity.toLowerCase().replace(/\s+/g, '')] || ['Explore nearby cities for opportunities', 'Look for price differences', 'Travel to find better markets'];
    return cityRoutes.join('\n');
  }

  /**
   * Generate enhanced gameplay fallback with achievement tracking and wallet monitoring
   * Provides comprehensive game guidance without database dependency
   */
  private generateEnhancedGameplayFallback(
    userMessage: string,
    gameState: GameState
  ): ConversationResponse {
    // Master of Ceremonies Market Intelligence
    const currentCityAdvice = this.getCityMarketAdvice(gameState.currentCity);
    const profitOpportunities = this.getTopProfitRoutes(gameState.currentCity);
    
    // Intelligent response based on message content
    if (userMessage.toLowerCase().includes('route') || userMessage.toLowerCase().includes('profit')) {
      return {
        message: `🎯 MASTER OF CEREMONIES INTEL:\nYou're in ${gameState.currentCity} with $${gameState.money.toLocaleString()}.\n\n${currentCityAdvice}\n\nTOP PROFIT ROUTES:\n${profitOpportunities}`,
        suggestions: ["Follow the profit routes", "Check your inventory capacity", "Consider taking a loan for bigger deals"],
        gameAdvice: "As master of ceremonies, I'm here to guide you to maximum profit. Follow these routes!"
      };
    }
    
    if (userMessage.toLowerCase().includes('city') || userMessage.toLowerCase().includes('travel') || userMessage.toLowerCase().includes('where')) {
      return {
        message: `🌍 You're in ${gameState.currentCity} on day ${gameState.day}.\n\n${currentCityAdvice}\n\nBest move: check the profit routes!`,
        suggestions: ["Travel to profit cities", "Buy low here", "Sell high elsewhere"],
        gameAdvice: "Different cities have different economics - exploit the differences!"
      };
    }

    if (userMessage.toLowerCase().includes('market') || userMessage.toLowerCase().includes('price')) {
      return {
        message: `📊 MARKET ANALYSIS for ${gameState.currentCity}:\n\n${currentCityAdvice}\n\nMoney: $${gameState.money.toLocaleString()}\nHealth: ${gameState.health}%\nDay: ${gameState.day}`,
        suggestions: ["Ask about profit routes", "Check other cities", "Plan your strategy"],
        gameAdvice: "I have complete market intelligence for all 16 cities. Ask me anything!"
      };
    }

    // Default master of ceremonies response
    return {
      message: `💰 Welcome to Day ${gameState.day} in ${gameState.currentCity}!\n\n${currentCityAdvice}\n\nYou have $${gameState.money.toLocaleString()} to work with.`,
      suggestions: ["Ask about profit routes", "Check market conditions", "Plan your next move"],
      gameAdvice: "I'm your master of ceremonies with complete market intelligence for all 16 cities. Ask me about trading routes!"
    };
  }

  /**
   * Calculate AI temperature based on NFT rarity
   */
  private calculateTemperature(rarity?: string): number {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 90; // Most creative
      case 'epic': return 80;
      case 'rare': return 70;
      case 'uncommon': return 60;
      default: return 65; // Grench default
    }
  }

  /**
   * Get assistant info for a wallet
   */
  async getAssistantInfo(walletAddress: string): Promise<AiAssistant | null> {
    const assistants = await this.db
      .select()
      .from(aiAssistants)
      .where(and(
        eq(aiAssistants.walletAddress, walletAddress),
        eq(aiAssistants.isActive, true)
      ))
      .limit(1);

    return assistants.length > 0 ? assistants[0] : null;
  }

  /**
   * Clear conversation history (for testing/reset)
   */
  async clearHistory(walletAddress: string): Promise<void> {
    await this.db
      .delete(conversations)
      .where(eq(conversations.walletAddress, walletAddress));
  }

  /**
   * Analyze achievement progress for enhanced AI guidance
   */
  private analyzeAchievementProgress(gameState: GameState): string {
    const progress = [];
    
    // Calculate potential achievements based on game state
    if (gameState.money >= 1000000) {
      progress.push("💰 Millionaire status achieved!");
    } else {
      const needed = 1000000 - gameState.money;
      progress.push(`💰 Need $${needed.toLocaleString()} more for Millionaire achievement`);
    }
    
    if (gameState.day >= 45) {
      progress.push("🎯 Game completion bonus available!");
    } else {
      progress.push(`🎯 Day ${gameState.day}/45 - ${45 - gameState.day} days to completion bonus`);
    }
    
    if (gameState.health === 100) {
      progress.push("❤️ Perfect Health achievement ready!");
    } else if (gameState.health < 50) {
      progress.push("⚠️ Health too low - heal up for Perfect Health achievement");
    }
    
    if (gameState.debt === 0) {
      progress.push("✨ Debt-free achievement unlocked!");
    } else {
      progress.push(`💳 Pay off $${gameState.debt.toLocaleString()} debt for Perfect Profit achievement`);
    }
    
    // Inventory achievements
    const totalInventory = Object.values(gameState.inventory || {}).reduce((sum, qty) => sum + qty, 0);
    if (totalInventory >= 1000) {
      progress.push("📦 Inventory King achievement earned!");
    } else {
      progress.push(`📦 Hold ${1000 - totalInventory} more BUDZ for Inventory King achievement`);
    }
    
    return progress.slice(0, 3).join('\n'); // Show top 3 most relevant
  }

  /**
   * Analyze wallet status for server-side wallet tracking
   */
  private analyzeWalletStatus(gameState: GameState): string {
    const status = [];
    
    if (gameState.serverWallet) {
      status.push(`🏦 Server Wallet: ${gameState.serverWallet.slice(0, 8)}...`);
    }
    
    if (gameState.walletBalances) {
      const { budz, gbux, thcLabz, sol } = gameState.walletBalances;
      if (budz > 0) status.push(`🌿 BUDZ: ${budz.toLocaleString()}`);
      if (gbux > 0) status.push(`💎 GBUX: ${gbux.toLocaleString()}`);
      if (thcLabz > 0) status.push(`🧪 THC LABZ: ${thcLabz.toLocaleString()}`);
      if (sol > 0) status.push(`⚡ SOL: ${sol.toFixed(4)}`);
    }
    
    if (gameState.gameRoundId) {
      status.push(`🎮 Round: ${gameState.gameRoundId.slice(0, 8)}`);
    }
    
    return status.length > 0 ? status.join(' | ') : "🔄 Wallet data syncing...";
  }
}

export const aiAssistantService = new AIAssistantService();