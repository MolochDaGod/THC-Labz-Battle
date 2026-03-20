import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Crown, Swords, Shield, Zap, Trash2, Trophy } from 'lucide-react';
import type { BattleReplayRecord, ReplayEvent } from '../utils/BattleReplayRecorder';
import { deleteReplay } from '../utils/BattleReplayRecorder';

interface BattleReplayProps {
  replay: BattleReplayRecord;
  onBack: () => void;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function EventIcon({ event }: { event: ReplayEvent }) {
  switch (event.type) {
    case 'unit_deploy':
      return event.data.isPlayer
        ? <span className="text-green-400">⚔️</span>
        : <span className="text-red-400">🤖</span>;
    case 'tower_destroyed':
      return <span className="text-orange-400">💥</span>;
    case 'crown_gained':
      return <span className="text-yellow-400">👑</span>;
    case 'elixir_snapshot':
      return <span className="text-purple-400">⚡</span>;
    case 'battle_start':
      return <span className="text-blue-400">🏁</span>;
    case 'battle_end':
      return <span className="text-white">🏆</span>;
    default:
      return <span>•</span>;
  }
}

function EventLabel({ event }: { event: ReplayEvent }) {
  switch (event.type) {
    case 'unit_deploy':
      return (
        <span>
          <span className={event.data.isPlayer ? 'text-green-300' : 'text-red-300'}>
            {event.data.isPlayer ? 'You' : 'AI'}
          </span>
          {' deployed '}
          <span className="text-white font-semibold">{event.data.cardName}</span>
          {' '}
          <span className="text-purple-400">({event.data.cost}⚡)</span>
        </span>
      );
    case 'tower_destroyed':
      return (
        <span>
          <span className={event.data.isPlayerTower ? 'text-red-300' : 'text-green-300'}>
            {event.data.isPlayerTower ? 'Your' : 'Enemy'}
          </span>
          {' '}
          <span className="text-white">{event.data.towerType === 'king' ? 'Castle' : 'Crown Tower'}</span>
          {' was destroyed!'}
        </span>
      );
    case 'crown_gained':
      return (
        <span className="text-yellow-300">
          Crown gained — {event.data.playerCrowns}👑 vs {event.data.enemyCrowns}👑
        </span>
      );
    case 'elixir_snapshot':
      return (
        <span className="text-gray-400 text-xs">
          Elixir: You {event.data.playerElixir} | AI {event.data.aiElixir} ({Math.floor((180000 - event.data.timeLeft * 1000) / 1000)}s)
        </span>
      );
    case 'battle_start':
      return <span className="text-blue-300">Battle started</span>;
    case 'battle_end':
      return <span className="text-white font-bold">Battle ended</span>;
    default:
      return <span className="text-gray-400">{event.type}</span>;
  }
}

export default function BattleReplay({ replay, onBack }: BattleReplayProps) {
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Only show meaningful events in timeline
  const timelineEvents = replay.events.filter(e =>
    e.type !== 'elixir_snapshot'
  );
  const allEvents = replay.events;

  const playerDeploys = allEvents.filter(e => e.type === 'unit_deploy' && e.data.isPlayer);
  const aiDeploys = allEvents.filter(e => e.type === 'unit_deploy' && !e.data.isPlayer);
  const towersDestroyed = allEvents.filter(e => e.type === 'tower_destroyed');

  // Group player deploys by card for strategy breakdown
  const deckUsage: Record<string, number> = {};
  playerDeploys.forEach(e => {
    deckUsage[e.data.cardName] = (deckUsage[e.data.cardName] || 0) + 1;
  });
  const sortedDeckUsage = Object.entries(deckUsage).sort((a, b) => b[1] - a[1]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= timelineEvents.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, timelineEvents.length]);

  // Auto-scroll to current event
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-event-idx]');
      const el = items[currentIdx] as HTMLElement;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIdx]);

  const progress = timelineEvents.length > 1 ? currentIdx / (timelineEvents.length - 1) : 0;
  const currentEvent = timelineEvents[currentIdx];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 screen-scroll">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Battle Replay</h1>
            <p className="text-gray-400 text-xs">
              {new Date(replay.date).toLocaleDateString()} •{' '}
              {formatDuration(replay.duration)} •{' '}
              <span className="capitalize">{replay.difficulty}</span>
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-bold text-sm ${
            replay.winner === 'player'
              ? 'bg-green-600/30 text-green-400 border border-green-500/30'
              : 'bg-red-600/30 text-red-400 border border-red-500/30'
          }`}>
            {replay.winner === 'player' ? '🏆 WIN' : '💀 LOSS'}
          </div>
        </div>

        {/* Score card */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-3 text-center">
            <Crown className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-yellow-400 font-bold text-xl">{replay.playerCrowns}</div>
            <div className="text-gray-400 text-xs">Crowns</div>
          </div>
          <div className="bg-black/40 border border-gray-600/20 rounded-2xl p-3 text-center">
            <Swords className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-white font-bold text-xl">{playerDeploys.length}</div>
            <div className="text-gray-400 text-xs">Deployed</div>
          </div>
          <div className={`bg-black/40 border rounded-2xl p-3 text-center ${replay.trophyChange >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <Trophy className={`w-5 h-5 mx-auto mb-1 ${replay.trophyChange >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <div className={`font-bold text-xl ${replay.trophyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {replay.trophyChange > 0 ? '+' : ''}{replay.trophyChange}
            </div>
            <div className="text-gray-400 text-xs">Trophies</div>
          </div>
        </div>

        {/* Strategy breakdown */}
        {sortedDeckUsage.length > 0 && (
          <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 mb-5">
            <h3 className="text-purple-300 font-bold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Card Usage
            </h3>
            <div className="space-y-2">
              {sortedDeckUsage.slice(0, 5).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-gray-300 text-xs flex-1 truncate">{name}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 bg-purple-600/60 rounded-full" style={{ width: `${Math.min(count * 20, 80)}px` }} />
                    <span className="text-purple-400 text-xs font-bold">×{count}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700/40 flex justify-between text-xs text-gray-500">
              <span>You: {playerDeploys.length} units</span>
              <span>AI: {aiDeploys.length} units</span>
              <span>Towers fallen: {towersDestroyed.length}</span>
            </div>
          </div>
        )}

        {/* Timeline Player */}
        <div className="bg-black/40 border border-green-700/30 rounded-2xl p-4 mb-4">
          <h3 className="text-green-300 font-bold text-sm mb-3">Timeline Replay</h3>

          {/* Current event highlight */}
          {currentEvent && (
            <div className="bg-green-900/30 border border-green-600/30 rounded-xl px-3 py-2 mb-3 text-sm min-h-[40px] flex items-center gap-2">
              <EventIcon event={currentEvent} />
              <span className="text-gray-200 text-xs"><EventLabel event={currentEvent} /></span>
              <span className="ml-auto text-gray-500 text-[10px] shrink-0">{formatElapsed(currentEvent.elapsed)}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="relative h-2 bg-gray-800 rounded-full mb-3 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setCurrentIdx(Math.round(pct * (timelineEvents.length - 1)));
            }}>
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${progress * 100}%` }}
            />
            {timelineEvents.map((ev, i) => {
              const pct = timelineEvents.length > 1 ? i / (timelineEvents.length - 1) : 0;
              const color =
                ev.type === 'tower_destroyed' ? '#f97316' :
                ev.type === 'crown_gained' ? '#facc15' :
                ev.type === 'unit_deploy' ? (ev.data.isPlayer ? '#22c55e' : '#ef4444') :
                '#6b7280';
              return (
                <div key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-gray-900 cursor-pointer hover:scale-150 transition-transform"
                  style={{ left: `${pct * 100}%`, transform: 'translateX(-50%) translateY(-50%)', backgroundColor: color }}
                  onClick={(e) => { e.stopPropagation(); setCurrentIdx(i); }}
                />
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setCurrentIdx(0)} className="w-9 h-9 rounded-lg bg-gray-700/60 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPlaying(p => !p)}
              className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => setCurrentIdx(timelineEvents.length - 1)} className="w-9 h-9 rounded-lg bg-gray-700/60 flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-all">
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
              className="w-14 h-9 rounded-lg bg-gray-700/60 text-gray-300 hover:text-white text-xs font-bold active:scale-95 transition-all"
            >
              {speed}×
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1 px-1">
            <span>0:00</span>
            <span>{currentIdx + 1} / {timelineEvents.length} events</span>
            <span>{formatDuration(replay.duration)}</span>
          </div>
        </div>

        {/* Full event log */}
        <div className="bg-black/40 border border-gray-600/20 rounded-2xl p-4">
          <h3 className="text-gray-300 font-bold text-sm mb-3">Full Event Log</h3>
          <div ref={listRef} className="space-y-1 max-h-64 overflow-y-auto overscroll-contain pr-1">
            {timelineEvents.map((ev, i) => (
              <div
                key={i}
                data-event-idx={i}
                onClick={() => setCurrentIdx(i)}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  i === currentIdx
                    ? 'bg-green-900/40 border border-green-600/30'
                    : 'hover:bg-white/5'
                }`}
              >
                <EventIcon event={ev} />
                <span className="text-gray-300 text-xs flex-1 leading-snug"><EventLabel event={ev} /></span>
                <span className="text-gray-600 text-[10px] shrink-0">{formatElapsed(ev.elapsed)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deck used */}
        {replay.playerDeckNames.length > 0 && (
          <div className="mt-4 bg-black/40 border border-blue-500/20 rounded-2xl p-4">
            <h3 className="text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Deck Used
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {replay.playerDeckNames.map((name, i) => (
                <span key={i} className="bg-blue-900/30 border border-blue-500/20 text-blue-200 text-xs px-2 py-0.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
