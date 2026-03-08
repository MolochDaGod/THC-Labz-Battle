/**
 * THC CLASH — Official BUDZ Payout Schedule
 * This is the single source of truth that the AI Agent follows for all BUDZ distributions.
 * Edit the values here to adjust rewards across the entire game.
 */

export interface PayoutRule {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: 'BUDZ';
  condition?: string;
}

// ─── Base battle rewards by difficulty ───────────────────────────────────────
export const BASE_BATTLE_REWARDS: Record<string, number> = {
  easy:   10,
  medium: 20,
  hard:   35,
};

// ─── Crown multiplier: extra BUDZ per crown earned in battle ─────────────────
export const CROWN_BONUS_PER_CROWN = 3; // +3 BUDZ per crown

// ─── Perfect victory bonus (all 3 enemy towers destroyed) ───────────────────
export const PERFECT_VICTORY_BONUS = 15;

// ─── ELO tier bonuses applied on top of base reward ─────────────────────────
export const ELO_TIER_BONUS: Record<string, number> = {
  'Bronze':       0,
  'Silver':       3,
  'Gold':         7,
  'Platinum':    12,
  'Diamond':     20,
  'Grand Master':30,
};

// ─── Win streak bonuses ───────────────────────────────────────────────────────
// Applied when the player wins X consecutive battles
export const WIN_STREAK_BONUS: Record<number, number> = {
  3:  10,  // 3-win streak  → +10 BUDZ
  5:  20,  // 5-win streak  → +20 BUDZ
  10: 50,  // 10-win streak → +50 BUDZ
};

// ─── First win of the day bonus ───────────────────────────────────────────────
export const FIRST_WIN_OF_DAY_BONUS = 25;

// ─── Achievement payouts ──────────────────────────────────────────────────────
export const ACHIEVEMENT_PAYOUTS: PayoutRule[] = [
  { id: 'first_battle',      category: 'Milestone',  description: 'First battle played',            amount: 5,   currency: 'BUDZ' },
  { id: 'first_win',         category: 'Milestone',  description: 'First battle won',               amount: 10,  currency: 'BUDZ' },
  { id: 'wins_10',           category: 'Wins',       description: '10 total wins',                  amount: 20,  currency: 'BUDZ' },
  { id: 'wins_25',           category: 'Wins',       description: '25 total wins',                  amount: 50,  currency: 'BUDZ' },
  { id: 'wins_50',           category: 'Wins',       description: '50 total wins',                  amount: 100, currency: 'BUDZ' },
  { id: 'wins_100',          category: 'Wins',       description: '100 total wins',                 amount: 250, currency: 'BUDZ' },
  { id: 'hard_5',            category: 'Difficulty', description: '5 wins on Hard difficulty',      amount: 75,  currency: 'BUDZ' },
  { id: 'perfect_3',         category: 'Skill',      description: '3 perfect victories (3 crowns)', amount: 60,  currency: 'BUDZ' },
  { id: 'streak_5',          category: 'Streak',     description: '5-win streak achieved',          amount: 50,  currency: 'BUDZ' },
  { id: 'streak_10',         category: 'Streak',     description: '10-win streak achieved',         amount: 150, currency: 'BUDZ' },
  { id: 'growerz_equipped',  category: 'NFT',        description: 'Battle with a GROWERZ NFT',      amount: 15,  currency: 'BUDZ' },
  { id: 'growerz_win',       category: 'NFT',        description: 'Win with a GROWERZ NFT',         amount: 25,  currency: 'BUDZ' },
];

// ─── Daily / weekly leaderboard rewards ──────────────────────────────────────
export const LEADERBOARD_DAILY_REWARDS: Record<number, number> = {
  1:  500,   // 1st place
  2:  300,   // 2nd place
  3:  200,   // 3rd place
  4:  100,
  5:  75,
  6:  50,
  7:  50,
  8:  25,
  9:  25,
  10: 25,
};

export const LEADERBOARD_WEEKLY_REWARDS: Record<number, number> = {
  1:  2500,
  2:  1500,
  3:  1000,
  4:  500,
  5:  300,
  6:  200,
  7:  200,
  8:  100,
  9:  100,
  10: 100,
};

// ─── Free pack reward ─────────────────────────────────────────────────────────
export const FREE_PACK_BUDZ_BONUS = 0; // BUDZ awarded on free pack claim (0 = cards only)

// ─── Cap: max BUDZ earnable per day per wallet ───────────────────────────────
export const MAX_DAILY_BATTLE_BUDZ = 500;

/**
 * calculateBattlePayout
 * Core function used by the AI Agent to determine exact BUDZ payout.
 */
export function calculateBattlePayout(params: {
  difficulty: 'easy' | 'medium' | 'hard';
  crowns: number;           // 0-3
  isPerfect: boolean;       // all 3 towers destroyed
  eloTier: string;          // e.g. 'Gold'
  isFirstWinOfDay: boolean;
  winStreak: number;        // current consecutive win count
}): {
  base: number;
  crownBonus: number;
  perfectBonus: number;
  eloBonus: number;
  firstWinBonus: number;
  streakBonus: number;
  total: number;
  breakdown: string[];
} {
  const base = BASE_BATTLE_REWARDS[params.difficulty] ?? 10;
  const crownBonus = params.crowns * CROWN_BONUS_PER_CROWN;
  const perfectBonus = params.isPerfect ? PERFECT_VICTORY_BONUS : 0;
  const eloBonus = ELO_TIER_BONUS[params.eloTier] ?? 0;
  const firstWinBonus = params.isFirstWinOfDay ? FIRST_WIN_OF_DAY_BONUS : 0;

  let streakBonus = 0;
  const streakThresholds = Object.keys(WIN_STREAK_BONUS).map(Number).sort((a, b) => b - a);
  for (const threshold of streakThresholds) {
    if (params.winStreak >= threshold) {
      streakBonus = WIN_STREAK_BONUS[threshold];
      break;
    }
  }

  const total = base + crownBonus + perfectBonus + eloBonus + firstWinBonus + streakBonus;
  const breakdown: string[] = [
    `Base (${params.difficulty}): ${base} BUDZ`,
    ...(crownBonus > 0  ? [`Crowns ×${params.crowns}: +${crownBonus} BUDZ`] : []),
    ...(perfectBonus > 0 ? [`Perfect victory: +${perfectBonus} BUDZ`] : []),
    ...(eloBonus > 0    ? [`${params.eloTier} ELO tier: +${eloBonus} BUDZ`] : []),
    ...(firstWinBonus > 0 ? [`First win of day: +${firstWinBonus} BUDZ`] : []),
    ...(streakBonus > 0 ? [`${params.winStreak}-win streak: +${streakBonus} BUDZ`] : []),
  ];

  return { base, crownBonus, perfectBonus, eloBonus, firstWinBonus, streakBonus, total, breakdown };
}

/**
 * Full pay sheet export — used by the /api/battle/payout-sheet endpoint
 */
export function getFullPaySheet() {
  return {
    baseBattleRewards: BASE_BATTLE_REWARDS,
    crownBonusPerCrown: CROWN_BONUS_PER_CROWN,
    perfectVictoryBonus: PERFECT_VICTORY_BONUS,
    eloTierBonuses: ELO_TIER_BONUS,
    winStreakBonuses: WIN_STREAK_BONUS,
    firstWinOfDayBonus: FIRST_WIN_OF_DAY_BONUS,
    achievementPayouts: ACHIEVEMENT_PAYOUTS,
    leaderboardDailyRewards: LEADERBOARD_DAILY_REWARDS,
    leaderboardWeeklyRewards: LEADERBOARD_WEEKLY_REWARDS,
    maxDailyBattleBudz: MAX_DAILY_BATTLE_BUDZ,
    freePackBudzBonus: FREE_PACK_BUDZ_BONUS,
  };
}
