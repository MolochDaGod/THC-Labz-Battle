const K = 32;
const DEFAULT_ELO = 1000;

function expected(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

export function calcElo(playerElo: number, opponentElo: number, won: boolean): number {
  const exp = expected(playerElo, opponentElo);
  const score = won ? 1 : 0;
  return Math.max(100, Math.round(playerElo + K * (score - exp)));
}

export function loadElo(walletAddress?: string): number {
  try {
    const key = `thc-clash-elo-${walletAddress || 'guest'}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : DEFAULT_ELO;
  } catch {
    return DEFAULT_ELO;
  }
}

export function saveElo(walletAddress: string | undefined, elo: number): void {
  try {
    const key = `thc-clash-elo-${walletAddress || 'guest'}`;
    localStorage.setItem(key, String(elo));
  } catch {}
}

export function updateEloAfterBattle(walletAddress: string | undefined, won: boolean): number {
  const AI_ELO = 1050;
  const current = loadElo(walletAddress);
  const next = calcElo(current, AI_ELO, won);
  saveElo(walletAddress, next);
  return next;
}

export function getEloTier(elo: number): { tier: string; color: string; icon: string } {
  if (elo >= 2000) return { tier: 'Grand Master', color: '#ff6b35', icon: '👑' };
  if (elo >= 1800) return { tier: 'Diamond', color: '#00d4ff', icon: '💎' };
  if (elo >= 1500) return { tier: 'Platinum', color: '#b3c8d9', icon: '🔷' };
  if (elo >= 1300) return { tier: 'Gold', color: '#ffd700', icon: '🥇' };
  if (elo >= 1100) return { tier: 'Silver', color: '#c0c0c0', icon: '🥈' };
  return { tier: 'Bronze', color: '#cd7f32', icon: '🥉' };
}
