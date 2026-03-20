/**
 * TypeScript declarations for Dope Budz integration.
 * Shared types between THC CLASH and Dope Budz games.
 */

export type DopeBudzCity =
  | 'Bronx'
  | 'Brooklyn'
  | 'Manhattan'
  | 'Queens'
  | 'Compton'
  | 'Miami'
  | 'Chicago'
  | 'Los Angeles'
  | 'San Francisco'
  | 'Las Vegas'
  | 'New Orleans'
  | 'Atlanta';

export interface DopeBudzInventory {
  [strain: string]: number;
}

export interface DopeBudzGameState {
  currentCity: DopeBudzCity;
  day: number;
  money: number;
  heat: number;
  reputation: number;
  health: number;
  inventory: DopeBudzInventory;
  timeLeftInDay: number;
  dealsCompleted: number;
  totalTransactions: number;
  timesArrested: number;
  timesRobbed: number;
  strainsSmoked?: string[];
  recentSales: DopeBudzSale[];
  budzBalance: number;
  gbuxBalance: number;
  nftBonusActive: boolean;
}

export interface DopeBudzSale {
  city: DopeBudzCity;
  amount: number;
  day: number;
  strain: string;
  quantity: number;
  profit: number;
}

export interface DopeBudzStrain {
  name: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  highChance: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'exotic';
  effects: string[];
}

export interface DopeBudzReward {
  type: 'budz' | 'gbux' | 'thc' | 'nft' | 'card';
  amount: number;
  reason: string;
  timestamp: string;
  txSignature?: string;
}

export interface DopeBudzPlayer {
  walletAddress: string;
  username: string;
  level: number;
  totalEarned: number;
  bestDay: number;
  gamesPlayed: number;
  achievements: string[];
  nftBonuses: DopeBudzNFTBonus[];
  currentStreak: number;
  lastPlayed: string;
}

export interface DopeBudzNFTBonus {
  nftMint: string;
  nftName: string;
  bonusType: 'heat_reduction' | 'price_boost' | 'extra_inventory' | 'rep_bonus' | 'double_budz';
  bonusValue: number;
  traitSource: string;
}

export interface DopeBudzMarketPrice {
  strain: string;
  city: DopeBudzCity;
  buyPrice: number;
  sellPrice: number;
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: string;
}

export interface DopeBudzLeaderboard {
  rank: number;
  walletAddress: string;
  username: string;
  score: number;
  budzEarned: number;
  gamesPlayed: number;
  nftCount: number;
}

export interface DopeBudzMission {
  id: string;
  title: string;
  description: string;
  reward: DopeBudzReward;
  requirement: {
    type: 'deal_count' | 'money' | 'reputation' | 'cities' | 'strain';
    value: number | string;
    comparator: '>=' | '==' | 'includes';
  };
  completed: boolean;
  progress: number;
}

export interface THCClashDopeBudzBridge {
  clashWins: number;
  clashLosses: number;
  clashWinStreak: number;
  dopeBudzGamesPlayed: number;
  sharedBudzBalance: number;
  crossGameAchievements: string[];
  nftBonusesActive: boolean;
}
