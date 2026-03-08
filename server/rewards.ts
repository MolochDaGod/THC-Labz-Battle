import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { grenchAI } from "./grench-ai";
import { leaderboard, users, lifetimeLeaderboard } from "../shared/schema";

// Agent AI wallet configuration - BUDZ AI Agent Reward Token
const AGENT_AI_WALLET = "2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ";
const AGENT_AI_SECRET = "dream chest village mango summer transfer prefer whip jeans head pond firm";

// Token contracts - BUDZ is the AI agent reward token
const BUDZ_CONTRACT = "2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ";
const GBUX_CONTRACT = "55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray";

// Reward amounts
const FIRST_PLACE_REWARD = 1000;
const TENTH_PLACE_REWARD = 100;

interface RewardTier {
  position: number;
  reward: number;
}

// Calculate reward tiers (1000 for 1st, scaling down to 100 for 10th)
function calculateRewardTiers(): RewardTier[] {
  const tiers: RewardTier[] = [];
  for (let i = 1; i <= 10; i++) {
    const reward = FIRST_PLACE_REWARD - ((i - 1) * ((FIRST_PLACE_REWARD - TENTH_PLACE_REWARD) / 9));
    tiers.push({ position: i, reward: Math.round(reward) });
  }
  return tiers;
}

export async function processLeaderboardRewards() {
  console.log("🏆 Processing daily leaderboard rewards via AI Agent...");
  
  try {
    const { aiAgentWallet } = await import('./ai-agent-wallet');
    const db = storage.getDb();
    if (!db) {
      console.error("Database not available for rewards processing");
      return [];
    }

    // Get current leaderboard for AI analysis
    const currentLeaderboard = await db.select().from(leaderboard).limit(20);
    
    // Let Grench AI decide if rewards should be processed — fall through if unavailable
    try {
      const aiDecision = await grenchAI.analyzeRewardProcessing(currentLeaderboard);
      if (!aiDecision.shouldProcessRewards) {
        console.log("🤖 Grench AI decided not to process rewards:", aiDecision.reasoning);
        return [];
      }
      console.log(`🤖 Grench AI approved reward processing for ${aiDecision.playerCount} players`);
    } catch {
      console.log("🤖 Grench AI unavailable — proceeding with leaderboard rewards directly");
    }

    // Get top 10 players from leaderboard (one score per wallet rule)
    const topPlayers = await db
      .select()
      .from(leaderboard)
      .orderBy(sql`${leaderboard.score} DESC`)
      .limit(10);

    if (topPlayers.length === 0) {
      console.log("No players found for rewards");
      return [];
    }

    console.log(`Found ${topPlayers.length} players to reward`);

    const rewardTiers = calculateRewardTiers();
    const distributions = [];

    // Prepare batch distributions via AI Agent
    for (let i = 0; i < topPlayers.length; i++) {
      const player = topPlayers[i];
      const reward = rewardTiers[i].reward;
      
      if (player.walletAddress) {
        distributions.push({
          walletAddress: player.walletAddress,
          tokenType: 'budz' as const,
          amount: reward,
          reason: `Daily Leaderboard Reward - Position #${i + 1} (${player.score} points)`
        });
      }
    }

    // Process batch distribution via AI Agent
    const result = await aiAgentWallet.processBatchDistribution(distributions);
    
    const rewardedPlayers = distributions.map((dist, index) => ({
      name: topPlayers[index].name,
      position: index + 1,
      reward: dist.amount,
      walletAddress: dist.walletAddress
    }));

    // Remove rewarded players from leaderboard to allow new submissions
    const rewardedIds = rewardedPlayers.map(p => topPlayers.find((tp: any) => tp.name === p.name)?.id).filter(Boolean);
    if (rewardedIds.length > 0) {
      for (const id of rewardedIds) {
        await db.delete(leaderboard)
          .where(sql`${leaderboard.id} = ${id}`);
      }
      
      console.log(`🗑️ Removed ${rewardedIds.length} rewarded entries from leaderboard`);
    }

    console.log(`✅ Rewards processing complete. ${rewardedPlayers.length} players rewarded.`);
    return rewardedPlayers;

  } catch (error) {
    console.error("Error processing leaderboard rewards:", error);
    throw error;
  }
}

// Schedule daily rewards at midnight CST
export function scheduleRewards() {
  console.log("📅 Scheduling daily leaderboard rewards...");
  
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0); // Midnight CST
  midnight.setDate(midnight.getDate() + 1); // Next midnight
  
  // Convert to CST (UTC-6)
  const cstOffset = -6 * 60 * 60 * 1000; // CST is UTC-6
  const midnightCST = new Date(midnight.getTime() + cstOffset);
  
  const timeUntilMidnight = midnightCST.getTime() - now.getTime();
  
  console.log(`⏰ Next reward processing in ${Math.round(timeUntilMidnight / 1000 / 60 / 60)} hours`);
  
  // Set timeout for next midnight
  setTimeout(() => {
    processLeaderboardRewards();
    
    // Schedule daily recurring rewards
    setInterval(processLeaderboardRewards, 24 * 60 * 60 * 1000); // Every 24 hours
  }, timeUntilMidnight);
}

// Manual reward processing endpoint
export async function manualRewardProcessing() {
  console.log("🔧 Manual reward processing triggered");
  return await processLeaderboardRewards();
}