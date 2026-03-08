import { pgTable, text, serial, integer, bigint, boolean, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  displayName: text("display_name"),
  avatar: text("avatar"),
  walletAddress: text("wallet_address").unique(),
  serverWallet: text("server_wallet").unique(),
  budzBalance: bigint("budz_balance", { mode: 'number' }).default(0).notNull(),
  gbuxBalance: bigint("gbux_balance", { mode: 'number' }).default(0).notNull(),
  // Social connections
  discordId: text("discord_id").unique(),
  discordUsername: text("discord_username"),
  twitterHandle: text("twitter_handle"),
  telegramUsername: text("telegram_username"),
  instagramHandle: text("instagram_handle"),
  youtubeChannel: text("youtube_channel"),
  // Authentication methods
  lastLoginMethod: text("last_login_method").default('wallet'), // 'wallet', 'discord', 'email'
  emailVerified: boolean("email_verified").default(false).notNull(),
  profileComplete: boolean("profile_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  day: integer("day").notNull(),
  walletAddress: text("wallet_address"),
  serverWallet: text("server_wallet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rewardPaid: boolean("reward_paid").default(false).notNull(),
});

export const lifetimeLeaderboard = pgTable("lifetime_leaderboard", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  day: integer("day").notNull(),
  walletAddress: text("wallet_address"),
  serverWallet: text("server_wallet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced Real-Time Player Progress Tracking
export const playerProgress = pgTable("player_progress", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  playerName: text("player_name").notNull(),
  currentDay: integer("current_day").notNull(),
  currentScore: bigint("current_score", { mode: 'number' }).notNull(),
  lastPlayed: timestamp("last_played").notNull(),
  totalPlayTime: integer("total_play_time").notNull(),
  achievementsUnlocked: integer("achievements_unlocked").notNull(),
  tokensEarned: bigint("tokens_earned", { mode: 'number' }).notNull(),
  completionStatus: text("completion_status"),
  quitReason: text("quit_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Assistant and Conversation System
export const aiAssistants = pgTable("ai_assistants", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  name: text("name").notNull(),
  personality: text("personality").notNull(), // "grench" or "nft-based"
  nftMintAddress: text("nft_mint_address"), // null for grench, filled for GROWERZ NFTs
  nftName: text("nft_name"), // strain name like "OG Kush", "Purple Haze"
  nftRarity: text("nft_rarity"), // "legendary", "epic", "rare", "uncommon"
  aiTemperature: integer("ai_temperature").default(70).notNull(), // 0-100, determines creativity
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  assistantId: integer("assistant_id").references(() => aiAssistants.id),
  role: text("role").notNull(), // "user" or "assistant"
  message: text("message").notNull(),
  gameContext: text("game_context"), // JSON string with game state context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameContext = pgTable("game_context", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  currentCity: text("current_city").notNull(),
  gameDay: integer("game_day").notNull(),
  money: bigint("money", { mode: 'number' }).notNull(),
  debt: bigint("debt", { mode: 'number' }).notNull(),
  health: integer("health").notNull(),
  inventory: text("inventory"), // JSON string of current drugs
  reputation: integer("reputation").notNull(),
  lastEvent: text("last_event"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Achievement System for Complete Game Rounds
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "trading", "travel", "survival", "wealth", "special"
  requirement: text("requirement").notNull(), // JSON string with unlock conditions
  rewardBudz: integer("reward_budz").notNull(), // BUDZ tokens earned
  iconEmoji: text("icon_emoji").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id),
  gameRoundId: text("game_round_id").notNull(), // Unique identifier for each 45-day round
  finalScore: bigint("final_score", { mode: 'number' }).notNull(),
  gameDay: integer("game_day").notNull(), // Day achieved (usually 45 for completion)
  budzRewarded: integer("budz_rewarded").notNull(),
  paidOut: boolean("paid_out").default(false).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

// Mission Completion Tracking - Prevents repeat collection exploit
export const completedMissions = pgTable("completed_missions", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  gameRoundId: text("game_round_id").notNull(), // Unique identifier for each 45-day round
  missionId: text("mission_id").notNull(), // Unique mission identifier
  missionTitle: text("mission_title").notNull(),
  reward: integer("reward").notNull(), // Money reward amount
  gameDay: integer("game_day").notNull(), // Day when mission was completed
  city: text("city").notNull(), // City where mission was completed
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).pick({
  name: true,
  score: true,
  day: true,
});

export const insertLifetimeLeaderboardSchema = createInsertSchema(lifetimeLeaderboard).pick({
  name: true,
  score: true,
  day: true,
});

export const insertAiAssistantSchema = createInsertSchema(aiAssistants).pick({
  walletAddress: true,
  name: true,
  personality: true,
  nftMintAddress: true,
  nftName: true,
  nftRarity: true,
  aiTemperature: true,
  systemPrompt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  walletAddress: true,
  assistantId: true,
  role: true,
  message: true,
  gameContext: true,
});

export const insertGameContextSchema = createInsertSchema(gameContext).pick({
  walletAddress: true,
  currentCity: true,
  gameDay: true,
  money: true,
  debt: true,
  health: true,
  inventory: true,
  reputation: true,
  lastEvent: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  category: true,
  requirement: true,
  rewardBudz: true,
  iconEmoji: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  walletAddress: true,
  achievementId: true,
  gameRoundId: true,
  finalScore: true,
  gameDay: true,
  budzRewarded: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLifetimeLeaderboard = z.infer<typeof insertLifetimeLeaderboardSchema>;
export type LifetimeLeaderboard = typeof lifetimeLeaderboard.$inferSelect;
export type InsertAiAssistant = z.infer<typeof insertAiAssistantSchema>;
export type AiAssistant = typeof aiAssistants.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertGameContext = z.infer<typeof insertGameContextSchema>;
export type GameContext = typeof gameContext.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export const insertCompletedMissionSchema = createInsertSchema(completedMissions).pick({
  walletAddress: true,
  gameRoundId: true,
  missionId: true,
  missionTitle: true,
  reward: true,
  gameDay: true,
  city: true,
});

export const insertPlayerProgressSchema = createInsertSchema(playerProgress).pick({
  walletAddress: true,
  playerName: true,
  currentDay: true,
  currentScore: true,
  lastPlayed: true,
  totalPlayTime: true,
  achievementsUnlocked: true,
  tokensEarned: true,
  completionStatus: true,
  quitReason: true,
});

export type InsertCompletedMission = z.infer<typeof insertCompletedMissionSchema>;
export type CompletedMission = typeof completedMissions.$inferSelect;
export type InsertPlayerProgress = z.infer<typeof insertPlayerProgressSchema>;
export type PlayerProgress = typeof playerProgress.$inferSelect;
