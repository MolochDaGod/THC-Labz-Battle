/**
 * Advanced AI Game Controller for THC Dope Budz
 * The Plug AI Assistant - Most sophisticated AI-driven game experience
 * Powered by OpenAI GPT-4o-mini for dynamic, adaptive gameplay
 */

import OpenAI from "openai";

interface GameState {
  currentCity: string;
  day: number;
  money: number;
  heat: number;
  reputation: number;
  health: number;
  inventory: Record<string, number>;
  timeLeftInDay: number;
  dealsCompleted: number;
  totalTransactions: number;
  timesArrested: number;
  timesRobbed: number;
  strainsSmoked?: string[];
  recentSales: Array<{ city: string; amount: number; day: number }>;
}

interface AIGameEvent {
  id: string;
  type: 'market_shift' | 'police_activity' | 'opportunity' | 'random_encounter' | 'dealer_contact' | 'street_intel';
  title: string;
  description: string;
  choices: Array<{
    id: string;
    text: string;
    effects: {
      money?: number;
      heat?: number;
      reputation?: number;
      time?: number;
      inventory?: Record<string, number>;
      special?: string;
    };
  }>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  playerProfile?: string;
}

class AdvancedAIController {
  private openai: OpenAI;
  private playerProfiles: Map<string, any> = new Map();
  private gameSessionHistory: Map<string, any[]> = new Map();

  constructor() {
    // the newest OpenAI model is "gpt-4o-mini" which was released after knowledge cutoff. do not change this unless explicitly requested by the user
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_DOPE_BUDZ || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate dynamic AI events based on current game state and player behavior
   */
  async generateDynamicEvent(gameState: GameState, walletAddress: string): Promise<AIGameEvent | null> {
    try {
      // Analyze player behavior pattern
      const playerProfile = this.analyzePlayerBehavior(gameState, walletAddress);
      
      // Get session history for context
      const sessionHistory = this.gameSessionHistory.get(walletAddress) || [];
      
      const prompt = this.buildEventGenerationPrompt(gameState, playerProfile, sessionHistory);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: [
          {
            role: "system",
            content: `You are "The Plug" - the most sophisticated AI assistant in the cannabis trading underworld. You control dynamic game events that adapt to player behavior to create the most engaging 45-day trading experience possible. Your goal is to generate unpredictable, exciting events that help players achieve high scores and earn BUDZ tokens.

Response format must be valid JSON:
{
  "id": "event_unique_id",
  "type": "market_shift|police_activity|opportunity|random_encounter|dealer_contact|street_intel",
  "title": "Event Title",
  "description": "Detailed event description",
  "choices": [
    {
      "id": "choice1",
      "text": "Choice description",
      "effects": {
        "money": 0,
        "heat": 0,
        "reputation": 0,
        "time": 0,
        "inventory": {"strain_name": amount},
        "special": "special_effect_description"
      }
    }
  ],
  "urgency": "low|medium|high|critical",
  "playerProfile": "behavioral_analysis"
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1000
      });

      const eventData = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Store event in session history
      sessionHistory.push({
        day: gameState.day,
        event: eventData,
        gameState: { ...gameState }
      });
      this.gameSessionHistory.set(walletAddress, sessionHistory.slice(-20)); // Keep last 20 events
      
      return eventData as AIGameEvent;
      
    } catch (error) {
      console.error('AI Event Generation Error:', error);
      return this.generateFallbackEvent(gameState);
    }
  }

  /**
   * Generate contextual AI advice through The Plug assistant
   */
  async generateAIAdvice(gameState: GameState, walletAddress: string, userMessage?: string): Promise<string> {
    try {
      const playerProfile = this.analyzePlayerBehavior(gameState, walletAddress);
      const sessionHistory = this.gameSessionHistory.get(walletAddress) || [];
      
      const prompt = this.buildAdvicePrompt(gameState, playerProfile, sessionHistory, userMessage);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: [
          {
            role: "system",
            content: `You are "The Plug" - the most knowledgeable AI assistant in the cannabis trading game. You provide strategic advice to help players maximize their profits and achieve high scores during their 45-day trading cycles. You understand market dynamics, police heat management, and optimal trading strategies.

Your responses should be:
- Strategic and actionable
- Adapted to the player's current situation
- Focused on helping them earn more BUDZ tokens
- Written in street-smart cannabis trading language
- Include specific numbers and recommendations
- Consider their behavioral patterns and preferences`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0].message.content || "Stay focused on those deals, and watch your heat level.";
      
    } catch (error) {
      console.error('AI Advice Generation Error:', error);
      return this.generateFallbackAdvice(gameState);
    }
  }

  /**
   * Generate dynamic missions based on player progress
   */
  async generateDynamicMission(gameState: GameState, walletAddress: string): Promise<any> {
    try {
      const playerProfile = this.analyzePlayerBehavior(gameState, walletAddress);
      
      const prompt = `Generate a challenging but achievable mission for this player:
Current State: Day ${gameState.day}/45, $${gameState.money}, Heat: ${gameState.heat}/5
Player Profile: ${JSON.stringify(playerProfile)}
Focus: Create missions that push the player toward higher scores and more BUDZ earnings.`;
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: [
          {
            role: "system",
            content: `Generate a mission in JSON format:
{
  "title": "Mission Title",
  "description": "Mission description",
  "objectives": ["objective1", "objective2"],
  "reward": "BUDZ_amount",
  "timeLimit": "days",
  "difficulty": "easy|medium|hard"
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 400
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
      
    } catch (error) {
      console.error('Mission Generation Error:', error);
      return this.generateFallbackMission(gameState);
    }
  }

  /**
   * Analyze player behavior to create personalized experiences
   */
  private analyzePlayerBehavior(gameState: GameState, walletAddress: string): any {
    const existing = this.playerProfiles.get(walletAddress) || {};
    
    const profile = {
      ...existing,
      riskTolerance: this.calculateRiskTolerance(gameState),
      tradingStyle: this.determineTradingStyle(gameState),
      preferredCities: this.analyzeLocationPreferences(gameState),
      moneyManagement: this.analyzeMoneyManagement(gameState),
      heatManagement: this.analyzeHeatManagement(gameState),
      lastUpdated: new Date().toISOString()
    };
    
    this.playerProfiles.set(walletAddress, profile);
    return profile;
  }

  private calculateRiskTolerance(gameState: GameState): 'low' | 'medium' | 'high' {
    if (gameState.heat >= 4) return 'high';
    if (gameState.heat >= 2) return 'medium';
    return 'low';
  }

  private determineTradingStyle(gameState: GameState): string {
    const moneyRatio = gameState.money / Math.max(gameState.day * 1000, 1000);
    if (moneyRatio > 10) return 'aggressive_trader';
    if (moneyRatio > 5) return 'balanced_trader';
    return 'conservative_trader';
  }

  private analyzeLocationPreferences(gameState: GameState): string[] {
    // Analyze from recent sales data
    const recentCities = gameState.recentSales?.map(sale => sale.city) || [];
    return [...new Set(recentCities)];
  }

  private analyzeMoneyManagement(gameState: GameState): string {
    if (gameState.money > gameState.day * 5000) return 'excellent';
    if (gameState.money > gameState.day * 2000) return 'good';
    return 'needs_improvement';
  }

  private analyzeHeatManagement(gameState: GameState): string {
    if (gameState.heat <= 1) return 'excellent';
    if (gameState.heat <= 3) return 'good';
    return 'risky';
  }

  private buildEventGenerationPrompt(gameState: GameState, playerProfile: any, sessionHistory: any[]): string {
    return `Current Game State:
- Day: ${gameState.day}/45
- Money: $${gameState.money}
- Heat Level: ${gameState.heat}/5
- Current City: ${gameState.currentCity}
- Health: ${gameState.health}%
- Reputation: ${gameState.reputation}
- Time Left Today: ${gameState.timeLeftInDay} hours
- Recent Activity: ${gameState.dealsCompleted} deals completed

Player Profile:
- Risk Tolerance: ${playerProfile.riskTolerance}
- Trading Style: ${playerProfile.tradingStyle}
- Money Management: ${playerProfile.moneyManagement}
- Heat Management: ${playerProfile.heatManagement}

Recent Events: ${sessionHistory.slice(-3).map(h => h.event?.title).join(', ')}

Generate an exciting, adaptive event that:
1. Challenges the player appropriately for their skill level
2. Offers meaningful choices with different risk/reward profiles
3. Advances the narrative of their 45-day journey
4. Creates opportunities for higher scores and BUDZ earnings
5. Feels unique and unpredictable

Event should be relevant to current game state and player behavior patterns.`;
  }

  private buildAdvicePrompt(gameState: GameState, playerProfile: any, sessionHistory: any[], userMessage?: string): string {
    return `Current Game Situation:
Day ${gameState.day}/45 - Money: $${gameState.money} - Heat: ${gameState.heat}/5
City: ${gameState.currentCity} - Health: ${gameState.health}% - Time: ${gameState.timeLeftInDay}h

Player Analysis:
- Style: ${playerProfile.tradingStyle}
- Risk Level: ${playerProfile.riskTolerance}
- Money Management: ${playerProfile.moneyManagement}

${userMessage ? `Player Question: "${userMessage}"` : 'Provide strategic advice for maximizing profits and achieving a high score.'}

Give specific, actionable advice that helps this player succeed in their remaining ${45 - gameState.day} days.`;
  }

  private generateFallbackEvent(gameState: GameState): AIGameEvent {
    const events = [
      {
        id: `fallback_${Date.now()}`,
        type: 'opportunity' as const,
        title: "Street Contact",
        description: "A trusted dealer offers you a special deal on premium strains.",
        choices: [
          {
            id: "accept",
            text: "Take the deal",
            effects: { money: -500, inventory: { "OG Kush": 5 }, reputation: 5 }
          },
          {
            id: "decline",
            text: "Pass on this one",
            effects: { reputation: -2 }
          }
        ],
        urgency: 'medium' as const
      }
    ];
    return events[0];
  }

  private generateFallbackAdvice(gameState: GameState): string {
    if (gameState.heat >= 4) return "Your heat is too high! Lay low and avoid big deals until it cools down.";
    if (gameState.money < 1000) return "Focus on small, profitable deals to build your bankroll safely.";
    if (gameState.day > 35) return "Final stretch! Time to take calculated risks for maximum profits.";
    return "Keep building your reputation and watch for good opportunities.";
  }

  private generateFallbackMission(gameState: GameState): any {
    return {
      title: "Build Your Empire",
      description: "Establish yourself as a serious player in the game.",
      objectives: ["Reach $10,000", "Complete 5 deals", "Visit 3 different cities"],
      reward: "50 BUDZ",
      timeLimit: "7 days",
      difficulty: "medium"
    };
  }
}

export const advancedAIController = new AdvancedAIController();