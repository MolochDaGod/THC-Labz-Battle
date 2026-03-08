-- =====================================================================
-- THC CLASH — Dope-Budz Integration Database Migrations
-- Run against: postgresql://postgres:password@helium/heliumdb
-- =====================================================================

-- 1. Admin Cards (master card collection — 74 unique cannabis cards)
CREATE TABLE IF NOT EXISTS admin_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  attack INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  class TEXT NOT NULL DEFAULT 'melee',
  type TEXT NOT NULL DEFAULT 'minion',
  image TEXT,
  abilities JSONB DEFAULT '[]',
  trait_requirements JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. User Card Ownership (persistent card inventory per wallet)
CREATE TABLE IF NOT EXISTS user_cards (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  card_id TEXT NOT NULL,
  card_name TEXT,
  card_data JSONB,
  nft_mint TEXT,
  source TEXT NOT NULL DEFAULT 'purchased',
  level INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_cards_wallet_card ON user_cards(wallet_address, card_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_wallet ON user_cards(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_cards_card_id ON user_cards(card_id);

-- 3. Card Marketplace / Trades (peer-to-peer BUDZ-settled trades)
CREATE TABLE IF NOT EXISTS card_trades (
  id SERIAL PRIMARY KEY,
  seller_wallet TEXT NOT NULL,
  card_id TEXT NOT NULL,
  card_name TEXT,
  card_data JSONB,
  nft_mint TEXT,
  asking_price_budz INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  buyer_wallet TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_trades_status ON card_trades(status);
CREATE INDEX IF NOT EXISTS idx_card_trades_seller ON card_trades(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_card_trades_buyer ON card_trades(buyer_wallet);

-- 4. Ensure balance columns exist on users table (helium already has these)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gbux_balance BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS budz_balance BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS thc_balance BIGINT NOT NULL DEFAULT 0;

-- 5. Verify setup
SELECT
  (SELECT COUNT(*) FROM admin_cards) as total_cards,
  (SELECT COUNT(*) FROM user_cards)  as total_owned,
  (SELECT COUNT(*) FROM card_trades) as total_trades;
