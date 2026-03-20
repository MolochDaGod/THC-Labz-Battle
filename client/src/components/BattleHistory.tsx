import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Play, Trophy, Crown, Clock, Swords } from 'lucide-react';
import GameIcon from './GameIcon';
import { loadReplays, deleteReplay, type BattleReplayRecord } from '../utils/BattleReplayRecorder';
import BattleReplay from './BattleReplay';

interface BattleHistoryProps {
  onBack: () => void;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BattleHistory({ onBack }: BattleHistoryProps) {
  const [replays, setReplays] = useState<BattleReplayRecord[]>([]);
  const [watching, setWatching] = useState<BattleReplayRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setReplays(loadReplays());
  }, []);

  const handleDelete = (id: string) => {
    deleteReplay(id);
    setReplays(loadReplays());
    setConfirmDelete(null);
  };

  if (watching) {
    return <BattleReplay replay={watching} onBack={() => setWatching(null)} />;
  }

  const wins = replays.filter(r => r.winner === 'player').length;
  const losses = replays.filter(r => r.winner === 'ai').length;

  return (
    <div className="min-h-screen min-h-[100dvh] screen-scroll">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Battle History</h1>
            <p className="text-gray-400 text-xs">Review & replay your past battles</p>
          </div>
        </div>

        {/* Win / Loss summary */}
        {replays.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-black/40 border border-green-500/30 rounded-2xl p-3 text-center">
              <div className="text-green-400 font-bold text-2xl">{wins}</div>
              <div className="text-gray-400 text-xs">Wins</div>
            </div>
            <div className="bg-black/40 border border-red-500/30 rounded-2xl p-3 text-center">
              <div className="text-red-400 font-bold text-2xl">{losses}</div>
              <div className="text-gray-400 text-xs">Losses</div>
            </div>
            <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-3 text-center">
              <div className="text-yellow-400 font-bold text-2xl">
                {replays.length > 0 ? Math.round((wins / replays.length) * 100) : 0}%
              </div>
              <div className="text-gray-400 text-xs">Win Rate</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {replays.length === 0 && (
          <div className="text-center py-16">
            <GameIcon icon="cards" size={60} className="mb-4" />
            <h2 className="text-white font-bold text-lg mb-2">No replays yet</h2>
            <p className="text-gray-400 text-sm">
              Play a battle to start recording replays. You can review every unit deployment and tower fight.
            </p>
          </div>
        )}

        {/* Replay list */}
        <div className="space-y-3">
          {replays.map(r => (
            <div
              key={r.id}
              className={`bg-black/40 border rounded-2xl overflow-hidden transition-all ${
                r.winner === 'player' ? 'border-green-700/40' : 'border-red-700/40'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Result badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    r.winner === 'player' ? 'bg-green-900/50' : 'bg-red-900/50'
                  }`}>
                    <GameIcon icon={r.winner === 'player' ? 'trophy' : 'skull'} size={28} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm ${r.winner === 'player' ? 'text-green-400' : 'text-red-400'}`}>
                        {r.winner === 'player' ? 'Victory' : 'Defeat'}
                      </span>
                      <span className="text-gray-600 text-xs">•</span>
                      <span className="text-gray-400 text-xs capitalize">
                        {r.difficulty === 'easy' ? 'Rookie' : r.difficulty === 'medium' ? 'Veteran' : 'OG Kush'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap gap-y-1">
                      <span className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-400" />
                        {r.playerCrowns} vs {r.enemyCrowns}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(r.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Swords className="w-3 h-3" />
                        {r.events.filter(e => e.type === 'unit_deploy' && e.data.isPlayer).length} deployed
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${r.trophyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <Trophy className="w-3 h-3" />
                        {r.trophyChange > 0 ? '+' : ''}{r.trophyChange}
                      </span>
                    </div>

                    <p className="text-gray-600 text-[10px] mt-1">{formatDate(r.date)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setWatching(r)}
                    className="flex-1 py-2.5 rounded-xl bg-green-700/40 hover:bg-green-700/60 border border-green-600/30 text-green-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Watch Replay
                  </button>
                  <button
                    onClick={() => setConfirmDelete(confirmDelete === r.id ? null : r.id)}
                    className="w-11 rounded-xl bg-red-900/20 hover:bg-red-900/40 border border-red-700/20 text-red-400 flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {confirmDelete === r.id && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="flex-1 py-2 rounded-xl bg-red-700 text-white font-bold text-sm active:scale-95 transition-all"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-2 rounded-xl bg-gray-700/50 text-gray-300 text-sm active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
