import { pgTable, text, serial, integer, bigint, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// Enhanced game saves with inventory and action logging
export const gameSaves = pgTable("game_saves", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  gameRoundId: text("game_round_id").notNull(),
  day: integer("day").notNull(),
  money: bigint("money", { mode: 'number' }).notNull(),
  debt: bigint("debt", { mode: 'number' }).notNull(),
  health: integer("health").notNull(),
  currentCity: text("current_city").notNull(),
  heat: integer("heat").notNull(),
  reputation: integer("reputation").notNull(),
  // Enhanced inventory storage as JSON
  inventory: jsonb("inventory").notNull(), // { "strain_name": quantity, ... }
  // Player action logs
  actionLog: jsonb("action_log").notNull(), // Array of action entries
  // Game state metadata
  completedMissions: jsonb("completed_missions"), // Array of completed mission IDs
  achievements: jsonb("achievements"), // Array of unlocked achievement IDs
  totalTransactions: integer("total_transactions").default(0),
  totalProfits: bigint("total_profits", { mode: 'number' }).default(0),
  totalLosses: bigint("total_losses", { mode: 'number' }).default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Player action logs for detailed gameplay tracking
export const playerActionLogs = pgTable("player_action_logs", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  gameRoundId: text("game_round_id").notNull(),
  day: integer("day").notNull(),
  actionType: text("action_type").notNull(), // 'buy', 'sell', 'travel', 'event', 'mission', 'achievement'
  actionDetails: jsonb("action_details").notNull(), // Detailed action data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export interface GameSaveData {
  walletAddress: string;
  gameRoundId: string;
  day: number;
  money: number;
  debt: number;
  health: number;
  currentCity: string;
  heat: number;
  reputation: number;
  inventory: Record<string, number>;
  actionLog: PlayerAction[];
  completedMissions?: string[];
  achievements?: string[];
  totalTransactions?: number;
  totalProfits?: number;
  totalLosses?: number;
}

export interface PlayerAction {
  id: string;
  day: number;
  time: string;
  type: 'buy' | 'sell' | 'travel' | 'event' | 'mission' | 'achievement' | 'police' | 'special';
  description: string;
  details: {
    item?: string;
    quantity?: number;
    price?: number;
    profit?: number;
    location?: string;
    from?: string;
    to?: string;
    reward?: number;
    penalty?: number;
  };
  result: 'success' | 'failure' | 'neutral';
}