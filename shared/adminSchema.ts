import { pgTable, serial, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core';

// Admin cards table - stores all customizable card data
export const adminCards = pgTable('admin_cards', {
  id: text('id').primaryKey(), // Changed to text to match classification script IDs
  name: text('name').notNull(),
  cost: integer('cost').notNull(),
  attack: integer('attack').notNull(),
  health: integer('health').notNull(),
  description: text('description').notNull(),
  rarity: text('rarity').notNull(), // common, uncommon, rare, epic, legendary
  class: text('class').notNull(), // ranged, magical, tank, melee
  type: text('type').notNull(), // tower, minion, spell
  image: text('image').notNull(),
  abilities: text('abilities').default('[]'),
  traitRequirements: text('trait_requirements').default('[]'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Admin users table
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('admin'), // admin, super_admin
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login')
});

// Game sessions table - track real games
export const gameSessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  playerWallet: text('player_wallet').notNull(),
  playerDeck: json('player_deck').$type<string[]>().notNull(), // Array of card IDs
  nftCard: text('nft_card'), // Auto-added NFT card ID
  gameResult: text('game_result'), // win, loss, draw
  battleLog: json('battle_log').$type<string[]>().default([]),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration') // in seconds
});

// Spell effects table - track placed spells
export const spellEffects = pgTable('spell_effects', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => gameSessions.id),
  spellCardId: text('spell_card_id').notNull(),
  positionX: integer('position_x').notNull(),
  positionY: integer('position_y').notNull(),
  effectType: text('effect_type').notNull(), // damage, heal, buff, debuff
  targetIds: json('target_ids').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at')
});