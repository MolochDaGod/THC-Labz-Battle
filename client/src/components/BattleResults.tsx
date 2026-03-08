import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Shield, RotateCcw, Home, Star, Crown, TrendingUp, History } from 'lucide-react';
import GameIcon from './GameIcon';
import { updateEloAfterBattle, getEloTier } from '../utils/EloSystem';

interface BattleResultsProps {
  winner: 'player' | 'ai';
  results: any;
  teamName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  walletAddress?: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onEditDeck: () => void;
  onHistory?: () => void;
  onBalanceUpdate?: (newBudzBalance: number) => void;
}

export default function BattleResults({ winner, results, teamName, difficulty, walletAddress, onPlayAgain, onGoHome, onEditDeck, onHistory, onBalanceUpdate }: BattleResultsProps) {
  const [showContent, setShowContent] = useState(false);
  const [trophyChange, setTrophyChange] = useState(0);
  const [budzEarned, setBudzEarned] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [eloChange, setEloChange] = useState<{ old: number; new: number } | null>(null);

  const isVictory = winner === 'player';

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);

    const trophies = isVictory
      ? difficulty === 'hard' ? 30 : difficulty === 'medium' ? 15 : 5
      : difficulty === 'hard' ? -10 : difficulty === 'medium' ? -5 : -2;
    
    setTrophyChange(trophies);

    try {
      const savedStats = localStorage.getItem('thc-clash-player-stats');
      const stats = savedStats ? JSON.parse(savedStats) : { wins: 0, losses: 0, trophies: 0 };
      
      if (isVictory) {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }
      stats.trophies = Math.max(0, stats.trophies + trophies);
      
      localStorage.setItem('thc-clash-player-stats', JSON.stringify(stats));
    } catch {}

    try {
      const { loadElo } = { loadElo: (w?: string) => { try { return parseInt(localStorage.getItem(`thc-clash-elo-${w || 'guest'}`) || '1000', 10); } catch { return 1000; } } };
      const oldElo = loadElo(walletAddress);
      const newElo = updateEloAfterBattle(walletAddress, isVictory);
      setEloChange({ old: oldElo, new: newElo });
    } catch {}

    if (isVictory && walletAddress && !rewardClaimed) {
      setRewardClaimed(true);

      const crowns = results?.playerCrowns ?? 0;
      const isPerfect = crowns >= 3;

      let eloTier = 'Bronze';
      try {
        const elo = parseInt(localStorage.getItem(`thc-clash-elo-${walletAddress}`) || '1000', 10);
        eloTier = getEloTier(elo).tier;
      } catch {}

      let isFirstWinOfDay = false;
      try {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(`thc-clash-first-win-${walletAddress}`);
        isFirstWinOfDay = stored !== today;
        if (isFirstWinOfDay) localStorage.setItem(`thc-clash-first-win-${walletAddress}`, today);
      } catch {}

      let winStreak = 1;
      try {
        const raw = localStorage.getItem(`thc-clash-streak-${walletAddress}`);
        winStreak = raw ? parseInt(raw, 10) + 1 : 1;
        localStorage.setItem(`thc-clash-streak-${walletAddress}`, String(winStreak));
      } catch {}

      fetch('/api/battle/win-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, difficulty, wins: 1, crowns, isPerfect, eloTier, isFirstWinOfDay, winStreak }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setBudzEarned(data.reward);
            if (onBalanceUpdate && data.newBudzBalance !== undefined) {
              onBalanceUpdate(data.newBudzBalance);
            }
          }
        })
        .catch(() => {});
    } else if (!isVictory && walletAddress) {
      try {
        localStorage.setItem(`thc-clash-streak-${walletAddress}`, '0');
      } catch {}
    }
  }, []);

  const rewardAmounts: Record<string, number> = { hard: 35, medium: 20, easy: 10 };

  return (
    <div className={`min-h-screen min-h-[100dvh] overflow-y-auto ${
      isVictory
        ? 'bg-gradient-to-br from-yellow-900 via-green-900 to-yellow-900'
        : 'bg-gradient-to-br from-gray-900 via-red-950 to-gray-900'
    }`}>
      <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-6">
        <div className={`w-full max-w-sm transition-all duration-700 ${showContent ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}`}>
          <div className="text-center mb-8">
            <div className={`mb-4 flex justify-center ${isVictory ? 'animate-bounce' : ''}`}>
              <GameIcon icon={isVictory ? 'trophy' : 'skull'} size={88} />
            </div>
            <h1 className={`text-5xl font-black mb-2 ${
              isVictory
                ? 'bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-red-400 via-gray-400 to-red-400 bg-clip-text text-transparent'
            }`}>
              {isVictory ? 'VICTORY!' : 'DEFEAT'}
            </h1>
            <p className="text-gray-300 text-lg">{teamName}</p>
          </div>

          <div className="space-y-4 mb-10">
            <div className={`bg-black/40 border-2 rounded-2xl p-5 text-center ${
              trophyChange > 0 ? 'border-yellow-500/40' : 'border-red-500/40'
            }`}>
              <Trophy className={`w-10 h-10 mx-auto mb-2 ${trophyChange > 0 ? 'text-yellow-400' : 'text-red-400'}`} />
              <div className={`text-3xl font-black ${trophyChange > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                {trophyChange > 0 ? '+' : ''}{trophyChange} Trophies
              </div>
            </div>

            {isVictory && walletAddress && (
              <div className="bg-black/60 border-2 border-green-500/50 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <img src="/budz-token.png" alt="BUDZ" className="w-6 h-6" />
                  <span className="text-green-400 font-black text-2xl">
                    +{budzEarned > 0 ? budzEarned : rewardAmounts[difficulty]} BUDZ
                  </span>
                </div>
                <div className="text-gray-400 text-xs">AI Agent reward credited to your account</div>
              </div>
            )}

            <div className="bg-black/40 border border-gray-600/30 rounded-2xl p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Swords className="w-6 h-6 text-red-400 mx-auto mb-1.5" />
                  <div className="text-white font-bold text-xl">{results?.playerCrowns || 0}</div>
                  <div className="text-gray-400 text-xs mt-0.5">Crowns</div>
                </div>
                <div>
                  <Shield className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
                  <div className="text-white font-bold text-xl">{results?.towersDestroyed || 0}</div>
                  <div className="text-gray-400 text-xs mt-0.5">Towers</div>
                </div>
                <div>
                  <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1.5" />
                  <div className="text-white font-bold text-xl">{results?.unitsDeployed || 0}</div>
                  <div className="text-gray-400 text-xs mt-0.5">Deployed</div>
                </div>
              </div>
            </div>

            {eloChange && (
              <div className={`bg-black/50 border-2 rounded-2xl p-4 text-center ${eloChange.new >= eloChange.old ? 'border-yellow-500/50' : 'border-gray-600/40'}`}>
                <div style={{ fontSize: 11, color: '#888', fontFamily: "'LEMON MILK', sans-serif", marginBottom: 4, letterSpacing: 0.5 }}>ELO RATING</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, color: '#aaa', fontFamily: "'LEMON MILK', sans-serif", fontWeight: 900 }}>{eloChange.old}</span>
                  <span style={{ fontSize: 14, color: '#555' }}>→</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: eloChange.new >= eloChange.old ? '#ffd700' : '#f87171', fontFamily: "'LEMON MILK', sans-serif" }}>{eloChange.new}</span>
                  <span style={{ fontSize: 13, color: eloChange.new >= eloChange.old ? '#ffd700' : '#f87171', fontWeight: 700 }}>
                    {eloChange.new >= eloChange.old ? `+${eloChange.new - eloChange.old}` : eloChange.new - eloChange.old}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#666', fontFamily: "'LEMON MILK', sans-serif", marginTop: 3 }}>
                  {getEloTier(eloChange.new).icon} {getEloTier(eloChange.new).tier}
                </div>
              </div>
            )}

            <div className="bg-black/40 border border-gray-600/30 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
                <span>Difficulty:</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="capitalize">{difficulty === 'easy' ? 'Rookie' : difficulty === 'medium' ? 'Veteran' : 'OG Kush'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onPlayAgain}
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white active:scale-[0.97] transition-all shadow-lg shadow-green-500/30 min-h-[52px]"
            >
              <div className="flex items-center justify-center gap-3">
                <RotateCcw className="w-5 h-5" />
                <span>Play Again</span>
              </div>
            </button>

            <button
              onClick={onEditDeck}
              className="w-full py-3.5 rounded-2xl font-semibold bg-purple-700/60 border border-purple-500/30 text-white active:bg-purple-600/60 transition-all min-h-[52px]"
            >
              <div className="flex items-center justify-center gap-2">
                <GameIcon icon="cards" size={20} />
                <span>Edit Deck</span>
              </div>
            </button>

            {onHistory && (
              <button
                onClick={onHistory}
                className="w-full py-3.5 rounded-2xl font-semibold bg-blue-700/30 border border-blue-500/20 text-blue-300 active:bg-blue-700/50 transition-all min-h-[52px]"
              >
                <div className="flex items-center justify-center gap-2">
                  <History className="w-5 h-5" />
                  <span>Watch Replay</span>
                </div>
              </button>
            )}

            <button
              onClick={onGoHome}
              className="w-full py-3.5 rounded-2xl font-semibold bg-gray-700/40 border border-gray-600/30 text-gray-300 active:bg-gray-600/40 active:text-white transition-all min-h-[52px]"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                <span>Back to Hub</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
