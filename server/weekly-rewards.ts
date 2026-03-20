/**
 * Weekly Rewards and 45-Day Gameplay Cycle System
 * Manages leaderboard wipes, payouts, and game cycle resets
 */

import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { leaderboard, lifetimeLeaderboard, users } from "../shared/schema";
import { aiAgentWallet } from "./ai-agent-wallet";

/**
 * Process weekly rewards and clear leaderboard
 * Called every Thursday at 10:00 PM CST
 */
export async function processWeeklyRewards(): Promise<any> {
  console.log("🗓️ Processing weekly rewards and leaderboard wipe...");
  
  try {
    const db = storage.getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get top 10 players for rewards
    const topPlayers = await db
      .select()
      .from(leaderboard)
      .orderBy(sql`${leaderboard.score} DESC`)
      .limit(10);

    if (topPlayers.length === 0) {
      console.log("No players to reward this week");
      return { rewardedPlayers: [], message: "No players found" };
    }

    // Calculate rewards (1000 BUDZ for 1st, scaling down to 100 for 10th)
    const rewardTiers = [];
    for (let i = 1; i <= 10; i++) {
      const reward = 1000 - ((i - 1) * (900 / 9));
      rewardTiers.push({ position: i, reward: Math.round(reward) });
    }

    // Prepare batch distributions
    const distributions = [];
    for (let i = 0; i < topPlayers.length; i++) {
      const player = topPlayers[i];
      const reward = rewardTiers[i].reward;
      
      if (player.walletAddress) {
        distributions.push({
          walletAddress: player.walletAddress,
          tokenType: 'budz' as const,
          amount: reward,
          reason: `Weekly Top ${i + 1} Reward - ${player.score} points`
        });
      }
    }

    // Process batch distribution via AI Agent
    const result = await aiAgentWallet.processBatchDistribution(distributions);
    
    // Copy top scores to lifetime leaderboard before clearing
    for (const player of topPlayers) {
      await db.insert(lifetimeLeaderboard).values({
        name: player.name,
        score: player.score,
        day: player.day,
        walletAddress: player.walletAddress,
        serverWallet: player.serverWallet,
        weekEnding: new Date()
      }).onConflictDoNothing();
    }

    // Clear the daily leaderboard
    await db.delete(leaderboard);
    
    const rewardedPlayers = distributions.map((dist, index) => ({
      name: topPlayers[index].name,
      position: index + 1,
      reward: dist.amount,
      walletAddress: dist.walletAddress,
      score: topPlayers[index].score
    }));

    console.log(`✅ Weekly rewards processed: ${result.success} success, ${result.failed} failed`);
    console.log("🧹 Daily leaderboard cleared for new week");
    
    return {
      rewardedPlayers,
      totalRewarded: result.success,
      totalFailed: result.failed,
      message: "Weekly rewards processed and leaderboard reset"
    };

  } catch (error) {
    console.error("❌ Error processing weekly rewards:", error);
    throw error;
  }
}

/**
 * Check if 45-day cycle is complete for a player
 */
export function isGameCycleComplete(gameDay: number): boolean {
  return gameDay >= 45;
}

/**
 * Calculate final game score bonus for completing 45-day cycle
 */
export function calculateCycleCompletionBonus(finalScore: number, finalDay: number): number {
  if (finalDay < 45) {
    return 0; // No bonus for incomplete cycles
  }
  
  // 10% bonus for completing full 45-day cycle
  const bonus = Math.floor(finalScore * 0.1);
  console.log(`🎯 45-day cycle completion bonus: ${bonus} points (${finalScore} base score)`);
  return bonus;
}

/**
 * Submit final score for 45-day cycle
 */
export async function submitFinalCycleScore(
  walletAddress: string,
  playerName: string,
  finalScore: number,
  finalDay: number,
  serverWallet: string
): Promise<{ success: boolean; message: string; bonus?: number }> {
  try {
    const db = storage.getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Check if cycle is complete
    if (finalDay < 45) {
      return {
        success: false,
        message: `Game cycle incomplete. Continue playing until day 45. Current day: ${finalDay}`
      };
    }

    // Calculate completion bonus
    const bonus = calculateCycleCompletionBonus(finalScore, finalDay);
    const totalScore = finalScore + bonus;

    // Remove any existing score for this wallet (one score per wallet rule)
    await db.delete(leaderboard)
      .where(sql`${leaderboard.walletAddress} = ${walletAddress}`);

    // Submit final score to leaderboard
    await db.insert(leaderboard).values({
      name: playerName,
      score: totalScore,
      day: finalDay,
      walletAddress,
      serverWallet
    });

    // Also add to lifetime leaderboard
    await db.insert(lifetimeLeaderboard).values({
      name: playerName,
      score: totalScore,
      day: finalDay,
      walletAddress,
      serverWallet,
      weekEnding: new Date()
    }).onConflictDoNothing();

    console.log(`🏆 Final 45-day score submitted: ${playerName} - ${totalScore} points (bonus: ${bonus})`);
    
    return {
      success: true,
      message: `45-day cycle complete! Final score: ${totalScore} (${bonus} bonus points)`,
      bonus
    };

  } catch (error) {
    console.error("❌ Error submitting final cycle score:", error);
    return {
      success: false,
      message: "Failed to submit final score"
    };
  }
}

/**
 * Schedule weekly rewards (called on server startup)
 */
export function scheduleWeeklyRewards(): void {
  const now = new Date();
  const thursdayNight = new Date();
  
  // Set to next Thursday 10:00 PM CST
  thursdayNight.setDate(now.getDate() + (4 - now.getDay() + 7) % 7);
  thursdayNight.setHours(22, 0, 0, 0); // 10:00 PM
  
  const timeUntilRewards = thursdayNight.getTime() - now.getTime();
  
  console.log(`⏰ Next weekly rewards scheduled for: ${thursdayNight.toLocaleString()}`);
  console.log(`⏰ Time until rewards: ${Math.round(timeUntilRewards / (1000 * 60 * 60))} hours`);
  
  setTimeout(async () => {
    try {
      await processWeeklyRewards();
      // Schedule next week
      scheduleWeeklyRewards();
    } catch (error) {
      console.error("❌ Scheduled weekly rewards failed:", error);
      // Retry in 1 hour
      setTimeout(scheduleWeeklyRewards, 60 * 60 * 1000);
    }
  }, timeUntilRewards);
}