/**
 * Player Analytics & Progress Tracking System
 * Enhanced tracking for all players regardless of completion status
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { eq, desc, count, sql } from "drizzle-orm";
import { storage } from "./storage";

interface PlayerProgress {
  walletAddress: string;
  playerName: string;
  currentDay: number;
  currentScore: number;
  lastPlayed: Date;
  totalPlayTime: number;
  achievementsUnlocked: number;
  tokensEarned: number;
  completionStatus: 'active' | 'completed' | 'abandoned';
  quitReason?: string;
}

interface EngagementMetrics {
  totalPlayers: number;
  activePlayers: number;
  completionRate: number;
  averagePlayTime: number;
  topQuitDay: number;
  retentionByDay: Record<number, number>;
}

class PlayerAnalyticsService {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  /**
   * Track player progress at any point in the game
   */
  async trackPlayerProgress(progress: PlayerProgress): Promise<void> {
    try {
      const db = storage.getDb();
      if (!db) return;

      // Check if player progress record exists
      const existingProgress = await db
        .select()
        .from(sql`player_progress`)
        .where(sql`wallet_address = ${progress.walletAddress}`)
        .limit(1);

      if (existingProgress.length > 0) {
        // Update existing progress
        await db
          .update(sql`player_progress`)
          .set({
            current_day: progress.currentDay,
            current_score: progress.currentScore,
            last_played: progress.lastPlayed,
            total_play_time: progress.totalPlayTime,
            achievements_unlocked: progress.achievementsUnlocked,
            tokens_earned: progress.tokensEarned,
            completion_status: progress.completionStatus,
            quit_reason: progress.quitReason
          })
          .where(sql`wallet_address = ${progress.walletAddress}`);
      } else {
        // Insert new progress record
        await db
          .insert(sql`player_progress`)
          .values({
            wallet_address: progress.walletAddress,
            player_name: progress.playerName,
            current_day: progress.currentDay,
            current_score: progress.currentScore,
            last_played: progress.lastPlayed,
            total_play_time: progress.totalPlayTime,
            achievements_unlocked: progress.achievementsUnlocked,
            tokens_earned: progress.tokensEarned,
            completion_status: progress.completionStatus,
            quit_reason: progress.quitReason,
            created_at: new Date()
          });
      }

      console.log(`📊 Tracked progress for ${progress.playerName}: Day ${progress.currentDay}, Score ${progress.currentScore}`);
    } catch (error) {
      console.error("Error tracking player progress:", error);
    }
  }

  /**
   * Get engagement metrics for all players
   */
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    try {
      const db = storage.getDb();
      if (!db) {
        return {
          totalPlayers: 0,
          activePlayers: 0,
          completionRate: 0,
          averagePlayTime: 0,
          topQuitDay: 0,
          retentionByDay: {}
        };
      }

      // Get basic metrics
      const totalPlayers = await db
        .select({ count: count() })
        .from(sql`users`);

      const activePlayers = await db
        .select({ count: count() })
        .from(sql`player_progress`)
        .where(sql`completion_status = 'active' AND last_played > NOW() - INTERVAL '7 days'`);

      const completedPlayers = await db
        .select({ count: count() })
        .from(sql`player_progress`)
        .where(sql`completion_status = 'completed'`);

      const completionRate = totalPlayers[0]?.count > 0 
        ? (completedPlayers[0]?.count || 0) / totalPlayers[0].count * 100 
        : 0;

      // Get average play time
      const avgPlayTime = await db
        .select({ avg: sql`AVG(total_play_time)` })
        .from(sql`player_progress`);

      // Get most common quit day
      const quitDays = await db
        .select({ 
          quit_day: sql`current_day`,
          count: count()
        })
        .from(sql`player_progress`)
        .where(sql`completion_status = 'abandoned'`)
        .groupBy(sql`current_day`)
        .orderBy(desc(count()))
        .limit(1);

      // Get retention by day milestones
      const retentionData = await db
        .select({
          day: sql`current_day`,
          count: count()
        })
        .from(sql`player_progress`)
        .where(sql`current_day >= 10`)
        .groupBy(sql`current_day`)
        .orderBy(sql`current_day`);

      const retentionByDay: Record<number, number> = {};
      retentionData.forEach(item => {
        retentionByDay[item.day] = item.count;
      });

      return {
        totalPlayers: totalPlayers[0]?.count || 0,
        activePlayers: activePlayers[0]?.count || 0,
        completionRate,
        averagePlayTime: avgPlayTime[0]?.avg || 0,
        topQuitDay: quitDays[0]?.quit_day || 0,
        retentionByDay
      };

    } catch (error) {
      console.error("Error getting engagement metrics:", error);
      return {
        totalPlayers: 0,
        activePlayers: 0,
        completionRate: 0,
        averagePlayTime: 0,
        topQuitDay: 0,
        retentionByDay: {}
      };
    }
  }

  /**
   * Get all player progress for admin dashboard
   */
  async getAllPlayerProgress(): Promise<PlayerProgress[]> {
    try {
      const db = storage.getDb();
      if (!db) return [];

      const progress = await db
        .select()
        .from(sql`player_progress`)
        .orderBy(desc(sql`last_played`));

      return progress.map(p => ({
        walletAddress: p.wallet_address,
        playerName: p.player_name,
        currentDay: p.current_day,
        currentScore: p.current_score,
        lastPlayed: p.last_played,
        totalPlayTime: p.total_play_time,
        achievementsUnlocked: p.achievements_unlocked,
        tokensEarned: p.tokens_earned,
        completionStatus: p.completion_status,
        quitReason: p.quit_reason
      }));

    } catch (error) {
      console.error("Error getting all player progress:", error);
      return [];
    }
  }

  /**
   * Mark player as abandoned if inactive for 7+ days
   */
  async markInactivePlayers(): Promise<void> {
    try {
      const db = storage.getDb();
      if (!db) return;

      await db
        .update(sql`player_progress`)
        .set({ completion_status: 'abandoned', quit_reason: 'Inactive for 7+ days' })
        .where(sql`completion_status = 'active' AND last_played < NOW() - INTERVAL '7 days' AND current_day < 45`);

      console.log("📊 Updated inactive player statuses");
    } catch (error) {
      console.error("Error marking inactive players:", error);
    }
  }
}

export const playerAnalytics = new PlayerAnalyticsService();