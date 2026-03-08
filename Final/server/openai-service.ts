/**
 * OpenAI Service for The Plug AI Assistant
 * Powers intelligent conversations with GPT-3.5-turbo
 */

import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface GameContext {
  playerName: string;
  walletAddress: string;
  currentDay: number;
  money: number;
  debt: number;
  health: number;
  currentCity: string;
  inventory: Record<string, number>;
  heat: number;
  hasNFTs: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenAIService {
  private systemPrompt = `You are "The Plug" - a street-smart cannabis trading advisor in the THC Dope Budz game. You're knowledgeable, cool, and help players navigate the underground economy.

PERSONALITY:
- Speak like a knowledgeable street dealer who's been in the game for years
- Use cannabis culture slang naturally but stay professional
- Be helpful, encouraging, and strategic
- Mix business advice with street wisdom
- Reference the player's actual game situation

GAME KNOWLEDGE:
- This is a 45-day cannabis trading simulation
- Players travel between cities buying/selling different strains
- Heat levels represent police attention (avoid getting too hot)
- Banking, loans, and debt management are crucial
- Achievement system rewards strategic play
- NFT holders get special bonuses

RESPONSE STYLE:
- Keep responses concise (2-4 sentences max)
- Give actionable advice based on current situation
- Mention specific strains, cities, or game mechanics when relevant
- Be encouraging but realistic about risks
- Never break character or mention this is AI

AVOID:
- Generic responses that don't use game context
- Mentioning you're an AI or automated system
- Legal disclaimers about real cannabis
- Overly long explanations
- Repeating the same advice`;

  /**
   * Generate intelligent response using OpenAI GPT-3.5-turbo
   */
  async generateResponse(
    message: string, 
    gameContext: GameContext, 
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(gameContext);
      
      // Prepare messages for OpenAI
      const messages: ChatMessage[] = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: contextPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: 'user', content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 150,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        return this.getFallbackResponse(message, gameContext);
      }

      console.log(`🤖 OpenAI response for ${gameContext.playerName}: ${response.slice(0, 50)}...`);
      return response;

    } catch (error) {
      console.error('OpenAI service error:', error);
      return this.getFallbackResponse(message, gameContext);
    }
  }

  /**
   * Build context-aware prompt with current game state
   */
  private buildContextPrompt(context: GameContext): string {
    const moneyStatus = context.money > 10000 ? 'flush with cash' : 
                       context.money > 1000 ? 'doing alright' : 'running low on funds';
    
    const debtStatus = context.debt > 5000 ? 'serious debt problems' : 
                       context.debt > 0 ? 'some debt to handle' : 'debt-free';
    
    const heatStatus = context.heat >= 4 ? 'extremely hot with police' :
                       context.heat >= 2 ? 'moderate heat level' : 'laying low';

    const inventoryItems = Object.entries(context.inventory)
      .filter(([_, qty]) => qty > 0)
      .map(([strain, qty]) => `${qty} ${strain}`)
      .join(', ');

    return `CURRENT SITUATION:
Player: ${context.playerName} (Day ${context.currentDay}/45)
Location: ${context.currentCity}
Money: $${context.money.toLocaleString()} (${moneyStatus})
Debt: $${context.debt.toLocaleString()} (${debtStatus})
Health: ${context.health}%
Heat Level: ${context.heat}/5 (${heatStatus})
Inventory: ${inventoryItems || 'empty'}
NFT Status: ${context.hasNFTs ? 'GROWERZ holder (VIP)' : 'Standard player'}

Give personalized advice based on this exact situation.`;
  }

  /**
   * Fallback responses when OpenAI is unavailable
   */
  private getFallbackResponse(message: string, context: GameContext): string {
    const responses = [
      `Yo ${context.playerName}, keep grinding on day ${context.currentDay}. That $${context.money.toLocaleString()} can grow if you play it smart.`,
      `${context.currentCity} treating you right? With ${context.heat} heat level, ${context.heat >= 3 ? 'maybe lay low' : 'you got room to operate'}.`,
      `Check those strain prices, fam. Market's always shifting - buy low, sell high, stay alive.`,
      `${context.debt > 0 ? 'Handle that debt before it handles you.' : 'Debt-free is the way to be.'} Keep building that empire.`,
      `Day ${context.currentDay} of 45 - you're ${Math.round((context.currentDay/45)*100)}% through the cycle. Stay focused.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Analyze message sentiment and generate appropriate bonus
   */
  async analyzeSentiment(message: string): Promise<{ 
    rating: number; 
    confidence: number; 
    shouldTriggerBonus: boolean 
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment and engagement level of this cannabis trading game message. Rate 1-5 stars based on enthusiasm, strategy discussion, and engagement. Return JSON: {\"rating\": number, \"confidence\": number, \"engaging\": boolean}"
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 100
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        rating: Math.max(1, Math.min(5, result.rating || 3)),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        shouldTriggerBonus: result.engaging || result.rating >= 4
      };

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        rating: 3,
        confidence: 0.5,
        shouldTriggerBonus: false
      };
    }
  }

  /**
   * Check if OpenAI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      });
      return !!response.choices[0];
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

export const openaiService = new OpenAIService();