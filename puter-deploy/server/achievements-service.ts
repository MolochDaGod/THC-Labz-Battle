/**
 * Achievement System for THC Dope Warz
 * 50 working achievements with BUDZ token rewards for complete game rounds
 * Maximum 1250 BUDZ per round in addition to daily leaderboard rewards
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, desc } from "drizzle-orm";
import { achievements, userAchievements, type Achievement, type UserAchievement } from "../shared/schema";
import { aiAgentWallet } from "./ai-agent-wallet";

interface GameState {
  money: number;
  debt: number;
  health: number;
  day: number;
  currentCity: string;
  reputation: number;
  inventory: Record<string, number>;
  finalScore: number;
  gameRoundId: string;
  // New achievement tracking fields
  strainsSmoked?: string[];
  nightDeals?: number;
  maxCitiesPerDay?: number;
  maxHeatReached?: number;
  bargainDeals?: number;
  highRiskPurchases?: number;
  aiChatCount?: number;
  consecutiveSmokingDays?: number;
  totalTransactions?: number;
  allStrainsPurchased?: boolean;
  completedCycles?: number;
}

class AchievementService {
  private db;

  constructor() {
    // Use HTTP connection instead of WebSocket for better reliability
    this.db = drizzle(process.env.DATABASE_URL!, {
      connection: {
        connectionString: process.env.DATABASE_URL!,
        ssl: false
      }
    });
  }

  /**
   * Initialize all 50 achievements in database
   */
  async initializeAchievements(): Promise<void> {
    const achievementData = this.getAllAchievements();
    
    for (const achievement of achievementData) {
      try {
        await this.db
          .insert(achievements)
          .values(achievement)
          .onConflictDoNothing();
      } catch (error) {
        console.log(`⚠️ Achievement ${achievement.name} already exists`);
      }
    }
    
    console.log('🏆 Initialized 50 achievements in database');
  }

  /**
   * Check and unlock achievements for completed game round
   */
  async checkAchievements(walletAddress: string, gameState: GameState): Promise<UserAchievement[]> {
    try {
      // Only check achievements for completed rounds (day 45+)
      if (gameState.day < 45) {
        return [];
      }

      const allAchievements = await this.db
        .select()
        .from(achievements)
        .where(eq(achievements.isActive, true));

      const existingAchievements = await this.db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.walletAddress, walletAddress),
          eq(userAchievements.gameRoundId, gameState.gameRoundId)
        ));

      const existingIds = new Set(existingAchievements.map(ua => ua.achievementId));
      const newlyUnlocked: UserAchievement[] = [];

      for (const achievement of allAchievements) {
        if (existingIds.has(achievement.id)) continue;

        if (this.checkAchievementRequirement(achievement, gameState)) {
          const newAchievement = await this.unlockAchievement(
            walletAddress,
            achievement,
            gameState
          );
          
          if (newAchievement) {
            newlyUnlocked.push(newAchievement);
          }
        }
      }

      // Process BUDZ rewards for newly unlocked achievements
      if (newlyUnlocked.length > 0) {
        await this.processAchievementRewards(walletAddress, newlyUnlocked);
      }

      console.log(`🏆 ${newlyUnlocked.length} new achievements unlocked for ${walletAddress.slice(0, 8)}...`);
      return newlyUnlocked;
    } catch (error) {
      console.error('❌ Achievement check error:', error);
      return [];
    }
  }

  /**
   * Unlock specific achievement for user
   */
  private async unlockAchievement(
    walletAddress: string,
    achievement: Achievement,
    gameState: GameState
  ): Promise<UserAchievement | null> {
    try {
      const [newAchievement] = await this.db
        .insert(userAchievements)
        .values({
          walletAddress,
          achievementId: achievement.id,
          gameRoundId: gameState.gameRoundId,
          finalScore: gameState.finalScore,
          gameDay: gameState.day,
          budzRewarded: achievement.rewardBudz,
          paidOut: false,
        })
        .returning();

      console.log(`🎯 Achievement unlocked: ${achievement.name} (${achievement.rewardBudz} BUDZ)`);
      return newAchievement;
    } catch (error) {
      console.error(`❌ Failed to unlock achievement ${achievement.name}:`, error);
      return null;
    }
  }

  /**
   * Process BUDZ reward distribution for achievements
   */
  private async processAchievementRewards(
    walletAddress: string,
    achievements: UserAchievement[]
  ): Promise<void> {
    try {
      const totalRewards = achievements.reduce((sum, ach) => sum + ach.budzRewarded, 0);
      
      if (totalRewards > 0) {
        // Transfer BUDZ tokens from AI agent to user's server wallet
        await aiAgentWallet.transferTokensFromAI(
          walletAddress,
          'budz',
          totalRewards,
          `Achievement rewards: ${achievements.length} achievements unlocked`
        );

        // Mark achievements as paid out
        for (const achievement of achievements) {
          await this.db
            .update(userAchievements)
            .set({ paidOut: true })
            .where(eq(userAchievements.id, achievement.id));
        }

        console.log(`💰 Distributed ${totalRewards} BUDZ for ${achievements.length} achievements to ${walletAddress.slice(0, 8)}...`);
      }
    } catch (error) {
      console.error('❌ Achievement reward processing failed:', error);
    }
  }

  /**
   * Check if achievement requirement is met
   */
  private checkAchievementRequirement(achievement: Achievement, gameState: GameState): boolean {
    try {
      const req = JSON.parse(achievement.requirement);
      
      switch (req.type) {
        case 'completion':
          if (req.maxDay) {
            return gameState.day >= 45 && gameState.day <= req.maxDay;
          }
          return gameState.day >= 45;
          
        case 'score':
          return gameState.finalScore >= req.threshold;
          
        case 'money':
          if (req.condition === 'exact') {
            return gameState.money === req.amount;
          }
          return gameState.money >= req.amount;
          
        case 'debt':
          return req.condition === 'zero' ? gameState.debt === 0 : gameState.debt >= req.amount;
          
        case 'health':
          return req.condition === 'perfect' ? gameState.health === 100 : gameState.health >= req.threshold;
          
        case 'inventory':
          const totalDrugs = Object.values(gameState.inventory).reduce((sum, qty) => sum + qty, 0);
          return totalDrugs >= req.quantity;
          
        case 'city':
          return req.cities.includes(gameState.currentCity);
          
        case 'reputation':
          return gameState.reputation >= req.level;
          
        case 'combined':
          return req.conditions.every((condition: any) => 
            this.checkAchievementRequirement({ ...achievement, requirement: JSON.stringify(condition) }, gameState)
          );

        // New fun achievement types
        case 'smoking':
          // For smoking achievements, we'll need to track this in game state
          return (gameState as any).strainsSmoked?.length >= req.strainsCount || false;
          
        case 'timeOfDay':
          // For time-based achievements, we'll need to track this in game state
          return (gameState as any).nightDeals >= req.deals || false;
          
        case 'travel':
          // For travel achievements, we'll need to track this in game state
          return (gameState as any).maxCitiesPerDay >= req.citiesPerDay || false;
          
        case 'heat':
          // For heat achievements, we'll need to track this in game state
          return (gameState as any).maxHeatReached >= req.maxHeatCount || false;
          
        case 'bargain':
          // For bargain achievements, we'll need to track this in game state
          return (gameState as any).bargainDeals >= req.quantity || false;
          
        case 'risk':
          // For risk achievements, we'll need to track this in game state
          return (gameState as any).highRiskPurchases >= 1 || false;
          
        case 'social':
          // For social achievements, we'll need to track this in game state
          return (gameState as any).aiChatCount >= req.chatCount || false;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`❌ Invalid achievement requirement for ${achievement.name}:`, error);
      return false;
    }
  }

  /**
   * Get user's achievements for current round
   */
  async getUserAchievements(walletAddress: string, gameRoundId?: string): Promise<UserAchievement[]> {
    let query = this.db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.walletAddress, walletAddress));

    if (gameRoundId) {
      query = query.where(eq(userAchievements.gameRoundId, gameRoundId));
    }

    return await query.orderBy(desc(userAchievements.unlockedAt));
  }

  /**
   * Get all available achievements
   */
  async getAvailableAchievements(): Promise<Achievement[]> {
    return await this.db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true))
      .orderBy(achievements.category, achievements.rewardBudz);
  }

  /**
   * Define all 70 achievements (max 1,400 BUDZ total per round)
   */
  private getAllAchievements() {
    return [
      // Trading Achievements (25 BUDZ each = 300 total)
      { name: "First Deal", description: "Complete your first BUDZ transaction", category: "trading", requirement: JSON.stringify({type: "completion"}), rewardBudz: 25, iconEmoji: "🤝" },
      { name: "Big Spender", description: "Spend over $50,000 in a single transaction", category: "trading", requirement: JSON.stringify({type: "money", amount: 50000}), rewardBudz: 25, iconEmoji: "💸" },
      { name: "Inventory King", description: "Hold 1000+ BUDZ in inventory", category: "trading", requirement: JSON.stringify({type: "inventory", quantity: 1000}), rewardBudz: 25, iconEmoji: "📦" },
      { name: "Market Master", description: "Achieve $1M+ final score", category: "trading", requirement: JSON.stringify({type: "score", threshold: 1000000}), rewardBudz: 25, iconEmoji: "👑" },
      { name: "Millionaire", description: "Have $1M+ cash on hand", category: "trading", requirement: JSON.stringify({type: "money", amount: 1000000}), rewardBudz: 25, iconEmoji: "💰" },
      { name: "Billionaire", description: "Achieve $1B+ final score", category: "trading", requirement: JSON.stringify({type: "score", threshold: 1000000000}), rewardBudz: 25, iconEmoji: "🏦" },
      { name: "High Roller", description: "Complete game with $500K+ cash", category: "trading", requirement: JSON.stringify({type: "money", amount: 500000}), rewardBudz: 25, iconEmoji: "🎰" },
      { name: "Drug Lord", description: "Hold 5000+ BUDZ in inventory", category: "trading", requirement: JSON.stringify({type: "inventory", quantity: 5000}), rewardBudz: 25, iconEmoji: "👨‍💼" },
      { name: "Perfect Profit", description: "Complete game with zero debt", category: "trading", requirement: JSON.stringify({type: "debt", condition: "zero"}), rewardBudz: 25, iconEmoji: "✨" },
      { name: "Score Legend", description: "Achieve $10B+ final score", category: "trading", requirement: JSON.stringify({type: "score", threshold: 10000000000}), rewardBudz: 25, iconEmoji: "🌟" },
      { name: "Inventory Master", description: "Hold 10,000+ BUDZ in inventory", category: "trading", requirement: JSON.stringify({type: "inventory", quantity: 10000}), rewardBudz: 25, iconEmoji: "🗄️" },
      { name: "Cash Mountain", description: "Have $10M+ cash on hand", category: "trading", requirement: JSON.stringify({type: "money", amount: 10000000}), rewardBudz: 25, iconEmoji: "🏔️" },

      // Travel Achievements (20 BUDZ each = 300 total)
      { name: "World Traveler", description: "Visit all 16 cities", category: "travel", requirement: JSON.stringify({type: "completion"}), rewardBudz: 20, iconEmoji: "🌍" },
      { name: "Miami Vice", description: "Complete game in Miami", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Miami"]}), rewardBudz: 20, iconEmoji: "🌴" },
      { name: "NYC Hustler", description: "Complete game in New York", category: "travel", requirement: JSON.stringify({type: "city", cities: ["New York"]}), rewardBudz: 20, iconEmoji: "🗽" },
      { name: "Oakland Raider", description: "Complete game in Oakland", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Oakland"]}), rewardBudz: 20, iconEmoji: "🌉" },
      { name: "Denver High", description: "Complete game in Denver", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Denver"]}), rewardBudz: 20, iconEmoji: "🏔️" },
      { name: "Atlanta Player", description: "Complete game in Atlanta", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Atlanta"]}), rewardBudz: 20, iconEmoji: "🍑" },
      { name: "Detroit Motor", description: "Complete game in Detroit", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Detroit"]}), rewardBudz: 20, iconEmoji: "🚗" },
      { name: "Houston Rocket", description: "Complete game in Houston", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Houston"]}), rewardBudz: 20, iconEmoji: "🚀" },
      { name: "New Orleans Jazz", description: "Complete game in New Orleans", category: "travel", requirement: JSON.stringify({type: "city", cities: ["New Orleans"]}), rewardBudz: 20, iconEmoji: "🎷" },
      { name: "Memphis Blues", description: "Complete game in Memphis", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Memphis"]}), rewardBudz: 20, iconEmoji: "🎵" },
      { name: "Baltimore Wire", description: "Complete game in Baltimore", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Baltimore"]}), rewardBudz: 20, iconEmoji: "🦀" },
      { name: "St. Louis Arch", description: "Complete game in St. Louis", category: "travel", requirement: JSON.stringify({type: "city", cities: ["St. Louis"]}), rewardBudz: 20, iconEmoji: "🏛️" },
      { name: "Kansas City Chief", description: "Complete game in Kansas City", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Kansas City"]}), rewardBudz: 20, iconEmoji: "🥩" },
      { name: "Cleveland Rock", description: "Complete game in Cleveland", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Cleveland"]}), rewardBudz: 20, iconEmoji: "🎸" },
      { name: "Central Park", description: "Complete game in Central Park", category: "travel", requirement: JSON.stringify({type: "city", cities: ["Central Park"]}), rewardBudz: 20, iconEmoji: "🌳" },

      // Survival Achievements (30 BUDZ each = 300 total)
      { name: "Perfect Health", description: "Complete game with 100% health", category: "survival", requirement: JSON.stringify({type: "health", condition: "perfect"}), rewardBudz: 30, iconEmoji: "💊" },
      { name: "Survivor", description: "Complete game with 75%+ health", category: "survival", requirement: JSON.stringify({type: "health", threshold: 75}), rewardBudz: 30, iconEmoji: "🩹" },
      { name: "Debt Free", description: "Complete game with zero debt", category: "survival", requirement: JSON.stringify({type: "debt", condition: "zero"}), rewardBudz: 30, iconEmoji: "🆓" },
      { name: "Risk Taker", description: "Complete game with health below 25%", category: "survival", requirement: JSON.stringify({type: "health", threshold: 25, condition: "below"}), rewardBudz: 30, iconEmoji: "⚡" },
      { name: "Reputation King", description: "Achieve reputation level 80+", category: "survival", requirement: JSON.stringify({type: "reputation", level: 80}), rewardBudz: 30, iconEmoji: "👤" },
      { name: "Street Legend", description: "Achieve reputation level 90+", category: "survival", requirement: JSON.stringify({type: "reputation", level: 90}), rewardBudz: 30, iconEmoji: "⭐" },
      { name: "Untouchable", description: "Complete game with reputation 95+", category: "survival", requirement: JSON.stringify({type: "reputation", level: 95}), rewardBudz: 30, iconEmoji: "🛡️" },
      { name: "Iron Will", description: "Complete game with 50%+ health", category: "survival", requirement: JSON.stringify({type: "health", threshold: 50}), rewardBudz: 30, iconEmoji: "💪" },
      { name: "Lucky Survivor", description: "Complete game with 1% health", category: "survival", requirement: JSON.stringify({type: "health", threshold: 1, condition: "exact"}), rewardBudz: 30, iconEmoji: "🍀" },
      { name: "Reputation Boss", description: "Achieve reputation level 100", category: "survival", requirement: JSON.stringify({type: "reputation", level: 100}), rewardBudz: 30, iconEmoji: "👑" },

      // Wealth Achievements (35 BUDZ each = 350 total)
      { name: "First Million", description: "Earn your first million", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 1000000}), rewardBudz: 35, iconEmoji: "💎" },
      { name: "Ten Million Club", description: "Achieve $10M+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 10000000}), rewardBudz: 35, iconEmoji: "💍" },
      { name: "Hundred Million", description: "Achieve $100M+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 100000000}), rewardBudz: 35, iconEmoji: "🏰" },
      { name: "Billionaire Status", description: "Achieve $1B+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 1000000000}), rewardBudz: 35, iconEmoji: "🌍" },
      { name: "Multi-Billionaire", description: "Achieve $5B+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 5000000000}), rewardBudz: 35, iconEmoji: "🚀" },
      { name: "Deca-Billionaire", description: "Achieve $10B+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 10000000000}), rewardBudz: 35, iconEmoji: "🌟" },
      { name: "Ultimate Wealth", description: "Achieve $50B+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 50000000000}), rewardBudz: 35, iconEmoji: "👑" },
      { name: "Godlike Fortune", description: "Achieve $100B+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 100000000000}), rewardBudz: 35, iconEmoji: "⚡" },
      { name: "Infinite Wealth", description: "Achieve $500B+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 500000000000}), rewardBudz: 35, iconEmoji: "♾️" },
      { name: "Wealth God", description: "Achieve $1T+ final score", category: "wealth", requirement: JSON.stringify({type: "score", threshold: 1000000000000}), rewardBudz: 35, iconEmoji: "🔥" },

      // Fun & Creative Achievements (15 BUDZ each = 150 total)
      { name: "Speed Runner", description: "Complete the game in 30 days or less", category: "fun", requirement: JSON.stringify({type: "completion", maxDay: 30}), rewardBudz: 15, iconEmoji: "⚡" },
      { name: "Cannabis Connoisseur", description: "Smoke 5 different strains during gameplay", category: "fun", requirement: JSON.stringify({type: "smoking", strainsCount: 5}), rewardBudz: 15, iconEmoji: "🌿" },
      { name: "Night Owl", description: "Complete 10 deals after 11 PM game time", category: "fun", requirement: JSON.stringify({type: "timeOfDay", period: "night", deals: 10}), rewardBudz: 15, iconEmoji: "🦉" },
      { name: "Lucky Number 7", description: "Complete game with exactly $777,777", category: "fun", requirement: JSON.stringify({type: "money", amount: 777777, condition: "exact"}), rewardBudz: 15, iconEmoji: "🎰" },
      { name: "Minimalist", description: "Complete game holding only 1 type of strain", category: "fun", requirement: JSON.stringify({type: "inventory", varietyLimit: 1}), rewardBudz: 15, iconEmoji: "🎯" },
      { name: "City Hopper", description: "Visit 5+ cities in a single day", category: "fun", requirement: JSON.stringify({type: "travel", citiesPerDay: 5}), rewardBudz: 15, iconEmoji: "🚁" },
      { name: "Heat Magnet", description: "Reach maximum heat level 5 times", category: "fun", requirement: JSON.stringify({type: "heat", maxHeatCount: 5}), rewardBudz: 15, iconEmoji: "🔥" },
      { name: "Bargain Hunter", description: "Buy 100+ units when prices are 50% below average", category: "fun", requirement: JSON.stringify({type: "bargain", quantity: 100, discount: 50}), rewardBudz: 15, iconEmoji: "🛒" },
      { name: "High Roller Gambit", description: "Make a single purchase worth 90% of your money", category: "fun", requirement: JSON.stringify({type: "risk", purchasePercent: 90}), rewardBudz: 15, iconEmoji: "🎲" },
      { name: "Social Butterfly", description: "Chat with AI assistant 50+ times", category: "fun", requirement: JSON.stringify({type: "social", chatCount: 50}), rewardBudz: 15, iconEmoji: "💬" },

      // Enhanced Fun Achievements (10 BUDZ each = 90 total additional)
      { name: "Chain Smoker", description: "Smoke cannabis for 15+ consecutive days", category: "fun", requirement: JSON.stringify({type: "smoking", consecutiveDays: 15}), rewardBudz: 10, iconEmoji: "🚬" },
      { name: "Speed Demon", description: "Earn $50,000+ in just 5 days", category: "fun", requirement: JSON.stringify({type: "speed", amount: 50000, days: 5}), rewardBudz: 10, iconEmoji: "💨" },
      { name: "Heat Seeker", description: "Reach maximum heat level 3+ times", category: "fun", requirement: JSON.stringify({type: "heat", maxHeatReached: 3}), rewardBudz: 10, iconEmoji: "🌡️" },
      { name: "Chatterbox", description: "Chat with AI assistant 200+ times", category: "fun", requirement: JSON.stringify({type: "aiChat", count: 200}), rewardBudz: 10, iconEmoji: "🗣️" },
      { name: "Big Purchase", description: "Make a single purchase worth $100,000+", category: "fun", requirement: JSON.stringify({type: "purchase", amount: 100000}), rewardBudz: 10, iconEmoji: "🛍️" },
      { name: "Strain Master", description: "Smoke all 8 different cannabis strains", category: "fun", requirement: JSON.stringify({type: "smoking", allStrains: true}), rewardBudz: 10, iconEmoji: "🎯" },
      { name: "Jack of All Trades", description: "Buy every type of cannabis strain at least once", category: "fun", requirement: JSON.stringify({type: "variety", allStrainsPurchased: true}), rewardBudz: 10, iconEmoji: "🃏" },
      { name: "Game Veteran", description: "Complete 3+ full game cycles", category: "fun", requirement: JSON.stringify({type: "completion", cycles: 3}), rewardBudz: 10, iconEmoji: "🎖️" },
      { name: "Master Dealer", description: "Complete 500+ total transactions", category: "fun", requirement: JSON.stringify({type: "transactions", count: 500}), rewardBudz: 10, iconEmoji: "💼" },

      // Special Combined Achievements (0 BUDZ = bonus only)
      { name: "Perfect Game", description: "Complete with 100% health, zero debt, $1B+ score", category: "special", requirement: JSON.stringify({type: "combined", conditions: [{type: "health", condition: "perfect"}, {type: "debt", condition: "zero"}, {type: "score", threshold: 1000000000}]}), rewardBudz: 0, iconEmoji: "🏆" },
    ];
  }
}

export const achievementService = new AchievementService();