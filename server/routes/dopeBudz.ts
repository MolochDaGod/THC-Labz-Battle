/**
 * Dope Budz game API routes.
 * Handles player data, game state, market prices, missions, leaderboard,
 * cross-game bridge with THC CLASH, and battle reward distribution.
 */

import express from 'express';
import { storage } from '../storage';
import { dopeBudzAI } from '../dope-budz-ai-controller';

const router = express.Router();

const STRAINS = [
  { name: 'OG Kush',      basePrice: 350,  rarity: 'common'   },
  { name: 'Blue Dream',   basePrice: 420,  rarity: 'common'   },
  { name: 'Sour Diesel',  basePrice: 480,  rarity: 'uncommon' },
  { name: 'Gelato',       basePrice: 600,  rarity: 'uncommon' },
  { name: 'Purple Haze',  basePrice: 750,  rarity: 'rare'     },
  { name: 'Gorilla Glue', basePrice: 820,  rarity: 'rare'     },
  { name: 'White Widow',  basePrice: 950,  rarity: 'exotic'   },
  { name: 'THC Labz OG',  basePrice: 1200, rarity: 'exotic'   },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

async function getUserByWallet(db: any, walletAddress: string) {
  try {
    const { users } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return rows[0] ?? null;
  } catch { return null; }
}

async function getPlayerProgress(db: any, walletAddress: string) {
  try {
    const { playerProgress } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(playerProgress).where(eq(playerProgress.walletAddress, walletAddress)).limit(1);
    return rows[0] ?? null;
  } catch { return null; }
}

router.get('/player/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const db = storage.getDb();
    const [user, progress] = await Promise.all([
      getUserByWallet(db, walletAddress),
      getPlayerProgress(db, walletAddress),
    ]);
    const player = {
      walletAddress,
      username:      user?.username   || walletAddress.slice(0, 8),
      level:         Math.floor(((progress?.achievementsUnlocked ?? 0) + (progress?.currentScore ?? 0) / 10000)) + 1,
      totalEarned:   user?.budzBalance  ?? 0,
      bestDay:       progress?.currentScore ?? 0,
      gamesPlayed:   progress?.achievementsUnlocked ?? 0,
      achievements:  [],
      nftBonuses:    [],
      currentStreak: 0,
      lastPlayed:    progress?.lastPlayed?.toISOString() ?? new Date().toISOString(),
    };
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/state', async (req, res) => {
  try {
    const { walletAddress, state } = req.body;
    if (!walletAddress || !state) return res.status(400).json({ success: false, error: 'Missing fields' });
    const db = storage.getDb();
    const { playerProgress } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');

    const existing = await getPlayerProgress(db, walletAddress);
    if (existing) {
      await db.update(playerProgress)
        .set({
          currentScore: state.money ?? 0,
          currentDay:   state.day   ?? 1,
          updatedAt:    new Date(),
          lastPlayed:   new Date(),
        })
        .where(eq(playerProgress.walletAddress, walletAddress));
    } else {
      await db.insert(playerProgress).values({
        walletAddress,
        playerName:    walletAddress.slice(0, 8),
        currentDay:    state.day    ?? 1,
        currentScore:  state.money  ?? 0,
        lastPlayed:    new Date(),
        totalPlayTime: 0,
        achievementsUnlocked: 0,
        tokensEarned:  0,
        completionStatus: 'active',
      }).onConflictDoNothing();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/state/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const db = storage.getDb();
    const [user, progress] = await Promise.all([
      getUserByWallet(db, walletAddress),
      getPlayerProgress(db, walletAddress),
    ]);
    if (!progress) return res.json({ success: false, state: null });
    const state = {
      currentCity:       'Bronx',
      day:               progress.currentDay,
      money:             Number(progress.currentScore),
      heat:              0,
      reputation:        50,
      health:            100,
      inventory:         {},
      timeLeftInDay:     24,
      dealsCompleted:    progress.achievementsUnlocked ?? 0,
      totalTransactions: progress.achievementsUnlocked ?? 0,
      timesArrested:     0,
      timesRobbed:       0,
      strainsSmoked:     [],
      recentSales:       [],
      budzBalance:       Number(user?.budzBalance ?? 0),
      gbuxBalance:       Number(user?.gbuxBalance ?? 0),
      nftBonusActive:    false,
    };
    res.json({ success: true, state });
  } catch {
    res.json({ success: false, state: null });
  }
});

router.get('/market/:city', (req, res) => {
  const { city } = req.params;
  const hourSeed  = Math.floor(Date.now() / (1000 * 60 * 60));
  const citySeed  = city.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);

  const prices = STRAINS.map((strain, i) => {
    const rand      = seededRandom(hourSeed + citySeed + i);
    const multiplier = 0.7 + rand * 0.8;
    const buyPrice   = Math.round(strain.basePrice * multiplier);
    const sellPrice  = Math.round(buyPrice * (1.1 + seededRandom(hourSeed + citySeed + i + 100) * 0.4));
    const trendRand  = seededRandom(hourSeed + citySeed + i + 200);
    const trend      = trendRand < 0.33 ? 'rising' : trendRand < 0.66 ? 'falling' : 'stable';
    return { strain: strain.name, city, buyPrice, sellPrice, trend, rarity: strain.rarity, lastUpdated: new Date().toISOString() };
  });

  res.json({ success: true, prices, city });
});

router.get('/missions/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  const db       = storage.getDb();
  const [user, progress] = await Promise.all([
    getUserByWallet(db, walletAddress),
    getPlayerProgress(db, walletAddress),
  ]);

  const budz    = Number(user?.budzBalance   ?? 0);
  const battles = progress?.achievementsUnlocked ?? 0;

  const missions = [
    {
      id: 'first_win',
      title: 'First Victory',
      description: 'Win your first THC CLASH battle',
      reward: { type: 'budz', amount: 10000, reason: 'First win bonus', timestamp: new Date().toISOString() },
      requirement: { type: 'deal_count', value: 1, comparator: '>=' },
      completed: battles >= 1,
      progress: Math.min(battles, 1),
    },
    {
      id: 'ten_battles',
      title: 'Battle Hardened',
      description: 'Complete 10 battles',
      reward: { type: 'budz', amount: 50000, reason: '10 battles bonus', timestamp: new Date().toISOString() },
      requirement: { type: 'deal_count', value: 10, comparator: '>=' },
      completed: battles >= 10,
      progress: Math.min(battles, 10),
    },
    {
      id: 'earn_100k_budz',
      title: 'High Roller',
      description: 'Accumulate 100,000 BUDZ',
      reward: { type: 'gbux', amount: 100, reason: 'High roller bonus', timestamp: new Date().toISOString() },
      requirement: { type: 'money', value: 100000, comparator: '>=' },
      completed: budz >= 100000,
      progress: Math.min(budz, 100000),
    },
  ];

  res.json({ success: true, missions });
});

router.post('/missions/claim', (req, res) => {
  const { walletAddress, missionId } = req.body;
  if (!walletAddress || !missionId) return res.status(400).json({ success: false });
  const reward = {
    type:      'budz' as const,
    amount:    10000,
    reason:    `Mission: ${missionId}`,
    timestamp: new Date().toISOString(),
  };
  res.json({ success: true, reward });
});

router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const db    = storage.getDb();
    const { leaderboard } = await import('../../shared/schema');
    const { desc }        = await import('drizzle-orm');
    const rows = await db.select().from(leaderboard).orderBy(desc(leaderboard.score)).limit(limit);
    const board = rows.map((r: any, i: number) => ({
      rank:          i + 1,
      walletAddress: r.walletAddress || r.serverWallet || '',
      username:      r.name || r.walletAddress?.slice(0, 8) || 'Unknown',
      score:         r.score ?? 0,
      budzEarned:    0,
      gamesPlayed:   0,
      nftCount:      0,
    }));
    res.json({ success: true, leaderboard: board });
  } catch {
    res.json({ success: true, leaderboard: [] });
  }
});

router.get('/bridge/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const db = storage.getDb();
    const [user, progress] = await Promise.all([
      getUserByWallet(db, walletAddress),
      getPlayerProgress(db, walletAddress),
    ]);
    const bridge = {
      clashWins:             progress?.achievementsUnlocked ?? 0,
      clashLosses:           0,
      clashWinStreak:        0,
      dopeBudzGamesPlayed:   0,
      sharedBudzBalance:     Number(user?.budzBalance ?? 0),
      crossGameAchievements: [],
      nftBonusesActive:      false,
    };
    res.json({ success: true, bridge });
  } catch {
    res.json({ success: false, bridge: null });
  }
});

router.post('/ai-validate', async (req, res) => {
  const { walletAddress, state } = req.body;
  if (!state) return res.json({ isValid: true, issues: [], recommendations: [] });
  try {
    const result = await dopeBudzAI.validateGameState(state, walletAddress || 'unknown');
    res.json(result);
  } catch {
    res.json({ isValid: true, issues: [], recommendations: [] });
  }
});

router.post('/validate', async (req, res) => {
  const { gameState, walletAddress, missions } = req.body;
  if (!gameState) return res.status(400).json({ success: false, error: 'Missing gameState' });
  try {
    const validation   = await dopeBudzAI.validateGameState(gameState, walletAddress || 'unknown');
    const optimization = await dopeBudzAI.optimizeGameplay(gameState, walletAddress || 'unknown');
    const syncCheck    = await dopeBudzAI.checkSystemSync(gameState, walletAddress || 'unknown');

    let missionValidations: any[] = [];
    if (missions?.length) {
      missionValidations = await dopeBudzAI.validateAllMissions(gameState, missions);
    }

    res.json({ success: true, validation, optimization, syncCheck, missionValidations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

export default router;
