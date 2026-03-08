/**
 * Battle Replay Recorder
 * Records battle events during gameplay and saves them to localStorage.
 */

export type ReplayEventType =
  | 'unit_deploy'
  | 'tower_destroyed'
  | 'crown_gained'
  | 'elixir_snapshot'
  | 'battle_start'
  | 'battle_end';

export interface ReplayEvent {
  type: ReplayEventType;
  timestamp: number;
  elapsed: number;
  data: Record<string, any>;
}

export interface BattleReplayRecord {
  id: string;
  date: string;
  winner: 'player' | 'ai';
  difficulty: string;
  teamName: string;
  playerCrowns: number;
  enemyCrowns: number;
  duration: number;
  events: ReplayEvent[];
  playerDeckNames: string[];
  trophyChange: number;
}

const STORAGE_KEY = 'thc-clash-battle-replays';
const MAX_REPLAYS = 20;

class BattleReplayRecorder {
  private events: ReplayEvent[] = [];
  private startTime: number = 0;
  private recording = false;

  start() {
    this.events = [];
    this.startTime = Date.now();
    this.recording = true;
    this.push('battle_start', {});
  }

  stop() {
    this.recording = false;
  }

  private push(type: ReplayEventType, data: Record<string, any>) {
    if (!this.recording) return;
    this.events.push({
      type,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      data,
    });
  }

  recordDeploy(card: { id: string; name: string; image?: string; cost: number; class?: string }, x: number, y: number, isPlayer: boolean) {
    this.push('unit_deploy', { cardId: card.id, cardName: card.name, cardImage: card.image, cost: card.cost, cardClass: card.class, x, y, isPlayer });
  }

  recordTowerDestroyed(towerType: string, isPlayerTower: boolean) {
    this.push('tower_destroyed', { towerType, isPlayerTower });
  }

  recordCrown(isPlayer: boolean, playerCrowns: number, enemyCrowns: number) {
    this.push('crown_gained', { isPlayer, playerCrowns, enemyCrowns });
  }

  recordElixir(playerElixir: number, aiElixir: number, timeLeft: number) {
    if (!this.recording) return;
    const last = this.events.findLast?.(e => e.type === 'elixir_snapshot');
    if (last && Date.now() - last.timestamp < 5000) return;
    this.push('elixir_snapshot', { playerElixir: Math.round(playerElixir), aiElixir: Math.round(aiElixir), timeLeft });
  }

  save(options: {
    winner: 'player' | 'ai';
    difficulty: string;
    teamName: string;
    playerCrowns: number;
    enemyCrowns: number;
    playerDeckNames: string[];
    trophyChange: number;
  }): BattleReplayRecord {
    this.push('battle_end', { winner: options.winner });
    this.recording = false;

    const record: BattleReplayRecord = {
      id: `replay-${Date.now()}`,
      date: new Date().toISOString(),
      winner: options.winner,
      difficulty: options.difficulty,
      teamName: options.teamName,
      playerCrowns: options.playerCrowns,
      enemyCrowns: options.enemyCrowns,
      duration: Date.now() - this.startTime,
      events: this.events,
      playerDeckNames: options.playerDeckNames,
      trophyChange: options.trophyChange,
    };

    try {
      const existing: BattleReplayRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = [record, ...existing].slice(0, MAX_REPLAYS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    return record;
  }
}

export const replayRecorder = new BattleReplayRecorder();

export function loadReplays(): BattleReplayRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteReplay(id: string) {
  try {
    const existing = loadReplays().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (_) {}
}
