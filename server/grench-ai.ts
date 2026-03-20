import fetch from 'node-fetch';

interface GrencjAIResponse {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RewardDecision {
  shouldProcessRewards: boolean;
  playerCount: number;
  totalRewardPool: number;
  reasoning: string;
  recommendations: string[];
}

interface TokenTransferDecision {
  approved: boolean;
  amount: number;
  recipient: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
}

class GrencjAIAgent {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1'; // Ale AI compatible endpoint

  constructor() {
    this.apiKey = process.env.GRENCH_AI_API_KEY || process.env.GRENCH_API_KEY || '';
    
    if (!this.apiKey) {
      console.log('⚠️ Grench AI API key not configured - using fallback approval system');
    }
  }

  private async makeRequest(messages: Array<{role: string, content: string}>): Promise<GrencjAIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grench AI API error: ${response.statusText}`);
    }

    return await response.json() as GrencjAIResponse;
  }

  /**
   * AI agent decides whether to process daily rewards based on game state
   */
  async analyzeRewardProcessing(leaderboardData: any[]): Promise<RewardDecision> {
    console.log('🤖 Grench AI analyzing reward processing...');
    
    const prompt = `As the Grench AI agent for THC Labz BUDZ Game, analyze if daily leaderboard rewards should be processed.

Current leaderboard data:
${JSON.stringify(leaderboardData.slice(0, 10), null, 2)}

Token economics:
- BUDZ token rewards: 1000 BUDZ for 1st place, scaling down to 100 BUDZ for 10th place
- Daily reset at midnight CST
- Only process if legitimate gameplay detected

Analyze and decide:
1. Should rewards be processed today?
2. How many players qualify?
3. What's the total reward pool?
4. Any suspicious patterns?

Respond with JSON only:
{
  "shouldProcessRewards": boolean,
  "playerCount": number,
  "totalRewardPool": number,
  "reasoning": "explanation",
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are Grench AI, an advanced game economics agent for THC Labz. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ]);

      const decision = JSON.parse(response.choices[0].message.content);
      console.log('🤖 Grench AI reward decision:', decision);
      
      return decision;
    } catch (error) {
      console.error('Grench AI analysis failed:', error);
      
      // Fallback decision
      return {
        shouldProcessRewards: leaderboardData.length > 0,
        playerCount: Math.min(leaderboardData.length, 10),
        totalRewardPool: this.calculateRewardPool(Math.min(leaderboardData.length, 10)),
        reasoning: 'Grench AI unavailable, using fallback logic',
        recommendations: ['Monitor system health', 'Verify player authenticity']
      };
    }
  }

  /**
   * AI agent analyzes token transfer requests for fraud detection
   */
  async analyzeTokenTransfer(
    walletAddress: string,
    tokenMint: string,
    amount: number
  ): Promise<TokenTransferDecision> {
    console.log(`🤖 Grench AI analyzing ${tokenMint} transfer: ${amount} tokens`);
    
    // Fallback system when API key not available
    if (!this.apiKey) {
      console.log('🔄 Using fallback approval system (no AI key)');
      return this.fallbackApprovalSystem(walletAddress, tokenMint, amount);
    }
    
    const prompt = `As Grench AI security agent, analyze this token transfer request:

Transfer Details:
- To: ${walletAddress}
- Amount: ${amount} tokens
- Token: ${tokenMint}

Security Analysis Required:
1. Is this a legitimate reward transfer?
2. Are the amounts reasonable?
3. Any red flags in wallet addresses?
4. Risk assessment level?

Respond with JSON only:
{
  "approved": boolean,
  "amount": number,
  "recipient": "wallet_address",
  "reasoning": "security_analysis",
  "riskLevel": "low|medium|high"
}`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are Grench AI security agent. Analyze transfers for fraud. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ]);

      const decision = JSON.parse(response.choices[0].message.content);
      console.log('🤖 Grench AI transfer decision:', decision);
      
      return decision;
    } catch (error) {
      console.error('Grench AI transfer analysis failed:', error);
      
      // Use fallback system when AI fails
      return this.fallbackApprovalSystem(walletAddress, tokenMint, amount);
    }
  }

  /**
   * AI agent monitors game economics and provides optimization recommendations
   */
  async optimizeGameEconomics(gameStats: any): Promise<string[]> {
    console.log('🤖 Grench AI optimizing game economics...');
    
    const prompt = `As Grench AI economics agent, analyze THC Labz game performance:

Game Statistics:
${JSON.stringify(gameStats, null, 2)}

Provide optimization recommendations for:
1. Token reward distribution
2. Player engagement improvements
3. Economic balance adjustments
4. Anti-cheat measures

Respond with JSON array of recommendations:
["recommendation1", "recommendation2", "recommendation3"]`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are Grench AI economics optimizer. Provide actionable game improvement recommendations. Always respond with valid JSON array only.' },
        { role: 'user', content: prompt }
      ]);

      const recommendations = JSON.parse(response.choices[0].message.content);
      console.log('🤖 Grench AI economics recommendations:', recommendations);
      
      return recommendations;
    } catch (error) {
      console.error('Grench AI economics analysis failed:', error);
      
      return [
        'Monitor daily active players and reward distribution',
        'Implement stricter anti-cheat validation',
        'Balance token economics based on player feedback'
      ];
    }
  }

  private calculateRewardPool(playerCount: number): number {
    let total = 0;
    for (let i = 1; i <= Math.min(playerCount, 10); i++) {
      total += 1000 - ((i - 1) * 100); // 1000 for 1st, 900 for 2nd, etc.
    }
    return total;
  }

  /**
   * Fallback approval system when Grench AI is unavailable
   */
  private fallbackApprovalSystem(
    walletAddress: string,
    tokenMint: string,
    amount: number
  ): TokenTransferDecision {
    console.log('🔄 Using permissive fallback approval logic');
    
    // Basic validation rules
    const isValidWallet = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress);
    const isReasonableAmount = amount > 0 && amount <= 10000000; // Max 10M tokens
    
    // More permissive approval - approve most reasonable requests
    const approved = isValidWallet && isReasonableAmount;
    
    return {
      approved,
      amount,
      recipient: walletAddress,
      reasoning: approved 
        ? 'Fallback system: Transaction approved - valid wallet and reasonable amount'
        : 'Fallback system: Invalid wallet address or excessive amount',
      riskLevel: amount <= 10000 ? 'low' : amount <= 100000 ? 'medium' : 'high'
    };
  }
}

export const grenchAI = new GrencjAIAgent();