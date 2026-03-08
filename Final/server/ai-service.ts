import OpenAI from 'openai';

interface GameState {
  currentCity: string;
  day: number;
  money: number;
  health: number;
  debt: number;
  heat: number;
  reputation: number;
  drugs: any[];
  achievements: any[];
}

interface Mission {
  id: string;
  title: string;
  description: string;
  city: string;
  reward: number;
  type: 'travel' | 'purchase' | 'sell' | 'daily' | 'special';
  completed: boolean;
  day: number;
  difficulty: 'easy' | 'medium' | 'hard';
  requirements?: string[];
}

interface AIResponse {
  message: string;
  missions?: Mission[];
  specialEvent?: any;
  personality: number;
}

class AIService {
  private openai: OpenAI | null = null;
  private fallbackResponses: string[] = [
    "Yo, the streets are talking and they're saying you need to step up your game. What's your next move?",
    "Listen up - this game ain't about luck, it's about strategy. You got what it takes?",
    "The plug sees all in these streets. Your reputation is everything, remember that.",
    "Day by day, deal by deal, that's how you build an empire. Stay focused.",
    "Heat's rising, money's flowing, but are you making the right moves out there?"
  ];

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  async generateMissions(gameState: GameState, walletAddress: string): Promise<Mission[]> {
    if (!this.openai) {
      return this.generateFallbackMissions(gameState);
    }

    try {
      const prompt = `Generate 3 personalized missions for a cannabis trading game player. 

Game Context:
- Current Day: ${gameState.day}/45
- Current City: ${gameState.currentCity}
- Money: $${gameState.money}
- Health: ${gameState.health}%
- Heat Level: ${gameState.heat}/5
- Debt: $${gameState.debt}

Player Progress:
- Reputation: ${gameState.reputation}
- Achievements: ${gameState.achievements.length}
- Cities available: New York, Miami, Los Angeles, Chicago, Denver, Seattle, Atlanta, Detroit

Create missions that are:
1. Relevant to current game state
2. Progressive in difficulty
3. Rewarding but balanced
4. Themed around cannabis culture

Response format (JSON):
{
  "missions": [
    {
      "title": "Mission Title",
      "description": "Detailed description with cannabis culture references",
      "city": "target_city",
      "reward": 100-1000,
      "type": "travel|purchase|sell|daily|special",
      "difficulty": "easy|medium|hard",
      "requirements": ["optional requirement"]
    }
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are The Plug, a street-smart cannabis trading advisor. Generate missions that are challenging, culturally relevant, and fun. Use cannabis terminology and street language appropriately."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      return aiResponse.missions?.map((mission: any, index: number) => ({
        id: `ai_mission_${Date.now()}_${index}`,
        ...mission,
        completed: false,
        day: gameState.day + Math.floor(Math.random() * 3) + 1
      })) || [];

    } catch (error) {
      console.error('AI Mission Generation Error:', error);
      return this.generateFallbackMissions(gameState);
    }
  }

  async generateResponse(message: string, gameState: GameState, playerNFTs: any[]): Promise<AIResponse> {
    if (!this.openai) {
      return {
        message: this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)],
        personality: 0.7
      };
    }

    try {
      const nftContext = playerNFTs.length > 0 ? 
        `Player owns ${playerNFTs.length} GROWERZ NFTs: ${playerNFTs.map(nft => nft.name).join(', ')}` : 
        'Player has no GROWERZ NFTs';

      const prompt = `Player message: "${message}"

Game Context:
- Day ${gameState.day}/45 in ${gameState.currentCity}
- Money: $${gameState.money}, Health: ${gameState.health}%
- Heat Level: ${gameState.heat}/5, Debt: $${gameState.debt}
- ${nftContext}

Respond as The Plug - a knowledgeable cannabis trading advisor with street smarts. Be helpful but maintain the character's personality. Include game-relevant advice, market insights, or strategic suggestions. Keep responses under 150 words.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are The Plug, a street-smart cannabis trading game advisor. You're knowledgeable about the game mechanics, market dynamics, and cannabis culture. Be helpful but maintain your character - confident, experienced, and connected to the streets."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      });

      return {
        message: response.choices[0].message.content || "The streets are calling, but I'm having trouble hearing them right now. Try again.",
        personality: 0.8
      };

    } catch (error) {
      console.error('AI Response Generation Error:', error);
      return {
        message: this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)],
        personality: 0.7
      };
    }
  }

  async generateSpecialEvent(gameState: GameState): Promise<any> {
    if (!this.openai) {
      return this.generateFallbackEvent(gameState);
    }

    try {
      const contextualFactors = this.generateContextualFactors(gameState);
      const prompt = `Generate a unique, dynamic event that has never been seen before in this cannabis trading game.

GAME CONTEXT:
- Current Location: ${gameState.currentCity}
- Day: ${gameState.day}/45
- Player Money: $${gameState.money}
- Heat Level: ${gameState.heat}/5 (police attention)
- Health: ${gameState.health}%
- Reputation: ${gameState.reputation}
- Time of Day: ${contextualFactors.timeOfDay}
- Weather: ${contextualFactors.weather}
- Market Trend: ${contextualFactors.marketTrend}

REQUIREMENTS:
1. Create something completely unpredictable and fresh
2. Include 3-4 meaningful choice options with real consequences
3. Each choice should feel meaningfully different
4. Consider current game state for balanced risk/reward
5. Use cannabis culture and street terminology authentically
6. Make it feel urgent and consequential

AVOID:
- Generic "buy/sell" scenarios
- Repetitive police encounters
- Basic market changes
- Predictable outcomes

Response format (JSON):
{
  "title": "Unique Event Title",
  "description": "Rich, immersive description that sets the scene (100-150 words)",
  "eventType": "market_shift|police_activity|supplier_issue|opportunity|crisis|territory_war|weather|social_media|informant|rival_gang",
  "urgency": "low|medium|high|critical",
  "timeLimit": 15-45,
  "location": "${gameState.currentCity}",
  "choices": [
    {
      "id": "choice1",
      "text": "Action option 1",
      "consequence": "What happens if you choose this",
      "effects": {
        "money": -500 to 1500,
        "heat": -2 to 3,
        "reputation": -10 to 20,
        "inventory": {"strain_name": quantity_change},
        "time": -10 to 5
      },
      "riskLevel": "low|medium|high"
    }
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a master storyteller for an immersive cannabis trading game. Create dynamic, unpredictable events that feel fresh and engaging every time. Never repeat scenarios. Use authentic street culture and cannabis terminology. Make each event feel like a unique story moment with meaningful consequences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.95, // Higher temperature for more creativity
        max_tokens: 800
      });

      const event = JSON.parse(response.choices[0].message.content || '{}');
      return {
        id: `ai_event_${Date.now()}`,
        ...event,
        aiGenerated: true,
        contextualFactors
      };

    } catch (error) {
      console.error('AI Event Generation Error:', error);
      return this.generateFallbackEvent(gameState);
    }
  }

  private generateContextualFactors(gameState: GameState) {
    const hour = new Date().getHours();
    const timeOfDay = hour >= 6 && hour < 12 ? 'morning' : 
                     hour >= 12 && hour < 18 ? 'afternoon' : 
                     hour >= 18 && hour < 24 ? 'evening' : 'night';
    
    const weather = ['clear', 'rainy', 'foggy', 'hot', 'cold', 'stormy'][Math.floor(Math.random() * 6)];
    const marketTrend = Math.random() > 0.5 ? 'rising' : 'falling';
    
    return { timeOfDay, weather, marketTrend };
  }

  private generateFallbackMissions(gameState: GameState): Mission[] {
    const missions: Mission[] = [];
    const cities = ['new_york', 'miami', 'los_angeles', 'chicago', 'denver', 'seattle', 'atlanta', 'detroit'];
    const availableCities = cities.filter(city => city !== gameState.currentCity);

    // Travel mission
    const targetCity = availableCities[Math.floor(Math.random() * availableCities.length)];
    missions.push({
      id: `fallback_travel_${Date.now()}`,
      title: "Hit the Road",
      description: `The word on the street is that ${targetCity.replace('_', ' ')} has some serious opportunities. Time to expand your territory.`,
      city: targetCity,
      reward: 150 + Math.floor(Math.random() * 100),
      type: 'travel',
      completed: false,
      day: gameState.day + 1,
      difficulty: 'easy'
    });

    // Purchase mission
    missions.push({
      id: `fallback_purchase_${Date.now()}`,
      title: "Stock Up",
      description: "Your connect says the supply is about to dry up. Better grab what you can while the price is right.",
      city: gameState.currentCity,
      reward: 200 + Math.floor(Math.random() * 150),
      type: 'purchase',
      completed: false,
      day: gameState.day,
      difficulty: 'medium'
    });

    // Daily mission
    missions.push({
      id: `fallback_daily_${Date.now()}`,
      title: "Daily Hustle",
      description: "Every day is a new opportunity to build your empire. Stay focused and keep grinding.",
      city: gameState.currentCity,
      reward: 100 + Math.floor(Math.random() * 50),
      type: 'daily',
      completed: false,
      day: gameState.day,
      difficulty: 'easy'
    });

    return missions;
  }

  private generateFallbackEvent(gameState: GameState): any {
    const events = [
      {
        title: "Market Fluctuation",
        description: "Supply and demand are shifting in the streets. Adapt your strategy accordingly.",
        eventType: "market_crash",
        effect: { priceChange: { reggie: 0.9, mids: 1.1 }, duration: 2 }
      },
      {
        title: "New Territory",
        description: "Fresh opportunities have opened up. The hustle continues.",
        eventType: "windfall",
        effect: { moneyMultiplier: 1.2, duration: 1 }
      }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    return {
      id: `fallback_event_${Date.now()}`,
      ...event,
      triggerDay: gameState.day + 1,
      isActive: false,
      aiGenerated: false
    };
  }
}

export default new AIService();