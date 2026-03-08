/**
 * DopeBudzService — bridge between THC CLASH and the Dope Budz game.
 *
 * Responsibilities:
 *  - Shared BUDZ/GBUX balance reads
 *  - Cross-game rewards (win in CLASH → earn BUDZ for Dope Budz)
 *  - NFT bonus propagation (GROWERZ traits apply in both games)
 *  - Unified leaderboard data
 *  - Game state persistence via /api/game-state/*
 */

import type {
  DopeBudzGameState,
  DopeBudzReward,
  DopeBudzPlayer,
  DopeBudzLeaderboard,
  DopeBudzMarketPrice,
  DopeBudzMission,
  THCClashDopeBudzBridge,
  DopeBudzCity,
} from '../types/dopeBudz.d.ts';

import { TOKENS, BUDZ_BATTLE_REWARDS, GBUX_BATTLE_REWARDS } from '../config/tokens';

const BASE = '';

export class DopeBudzService {
  private walletAddress: string;

  constructor(walletAddress: string) {
    this.walletAddress = walletAddress;
  }

  async getPlayer(): Promise<DopeBudzPlayer | null> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/player/${this.walletAddress}`);
      if (!res.ok) return null;
      const d = await res.json();
      return d.success ? d.player : null;
    } catch { return null; }
  }

  async saveGameState(state: DopeBudzGameState): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/state`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ walletAddress: this.walletAddress, state }),
      });
      return res.ok;
    } catch { return false; }
  }

  async loadGameState(): Promise<DopeBudzGameState | null> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/state/${this.walletAddress}`);
      if (!res.ok) return null;
      const d = await res.json();
      return d.success ? d.state : null;
    } catch { return null; }
  }

  async getMarketPrices(city: DopeBudzCity): Promise<DopeBudzMarketPrice[]> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/market/${encodeURIComponent(city)}`);
      if (!res.ok) return [];
      const d = await res.json();
      return d.prices ?? [];
    } catch { return []; }
  }

  async getMissions(): Promise<DopeBudzMission[]> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/missions/${this.walletAddress}`);
      if (!res.ok) return [];
      const d = await res.json();
      return d.missions ?? [];
    } catch { return []; }
  }

  async claimMissionReward(missionId: string): Promise<DopeBudzReward | null> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/missions/claim`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ walletAddress: this.walletAddress, missionId }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d.reward ?? null;
    } catch { return null; }
  }

  async getLeaderboard(limit = 20): Promise<DopeBudzLeaderboard[]> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/leaderboard?limit=${limit}`);
      if (!res.ok) return [];
      const d = await res.json();
      return d.leaderboard ?? [];
    } catch { return []; }
  }

  async getBudzBalance(): Promise<number> {
    try {
      const res = await fetch(`${BASE}/api/wallet/${this.walletAddress}`);
      if (!res.ok) return 0;
      const d = await res.json();
      return d.budzBalance ?? d.budz_balance ?? 0;
    } catch { return 0; }
  }

  async getBridge(): Promise<THCClashDopeBudzBridge | null> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/bridge/${this.walletAddress}`);
      if (!res.ok) return null;
      const d = await res.json();
      return d.bridge ?? null;
    } catch { return null; }
  }

  async recordClashResult(params: {
    won: boolean;
    trophyChange: number;
    streakCount: number;
    isPerfectWin: boolean;
  }): Promise<DopeBudzReward | null> {
    const budzAmount = params.isPerfectWin
      ? BUDZ_BATTLE_REWARDS.perfectWin
      : params.won
        ? BUDZ_BATTLE_REWARDS.win
        : BUDZ_BATTLE_REWARDS.loss;

    const gbuxAmount = params.isPerfectWin
      ? GBUX_BATTLE_REWARDS.perfectWin
      : params.won
        ? GBUX_BATTLE_REWARDS.win
        : GBUX_BATTLE_REWARDS.loss;

    try {
      const res = await fetch(`${BASE}/api/battle/reward`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          walletAddress: this.walletAddress,
          budzAmount,
          gbuxAmount,
          ...params,
        }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d.reward ?? {
        type:      'budz',
        amount:    budzAmount,
        reason:    params.won ? 'Battle Win' : 'Battle Participation',
        timestamp: new Date().toISOString(),
      };
    } catch { return null; }
  }

  async validateGameWithAI(state: DopeBudzGameState): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/ai-validate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ walletAddress: this.walletAddress, state }),
      });
      if (!res.ok) return { isValid: true, issues: [], recommendations: [] };
      return res.json();
    } catch {
      return { isValid: true, issues: [], recommendations: [] };
    }
  }

  static async getGlobalLeaderboard(limit = 50): Promise<DopeBudzLeaderboard[]> {
    try {
      const res = await fetch(`${BASE}/api/dope-budz/leaderboard?limit=${limit}&global=true`);
      if (!res.ok) return [];
      const d = await res.json();
      return d.leaderboard ?? [];
    } catch { return []; }
  }

  static buildDefaultGameState(walletAddress: string): DopeBudzGameState {
    return {
      currentCity:        'Bronx',
      day:                1,
      money:              2000,
      heat:               0,
      reputation:         50,
      health:             100,
      inventory:          {},
      timeLeftInDay:      24,
      dealsCompleted:     0,
      totalTransactions:  0,
      timesArrested:      0,
      timesRobbed:        0,
      strainsSmoked:      [],
      recentSales:        [],
      budzBalance:        0,
      gbuxBalance:        0,
      nftBonusActive:     false,
    };
  }
}

export default DopeBudzService;
