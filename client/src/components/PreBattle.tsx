import React, { useState } from 'react';
import { ArrowLeft, Swords, Shield, Zap, Heart, Crown, ChevronRight, Star } from 'lucide-react';
import GameIcon from './GameIcon';
import type { IconKey } from '../services/ImageService';

interface PreBattleProps {
  deck: any[];
  teamName: string;
  onBack: () => void;
  onStartBattle: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export default function PreBattle({ deck, teamName, onBack, onStartBattle }: PreBattleProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLaunching, setIsLaunching] = useState(false);

  const difficulties = [
    {
      id: 'easy' as const,
      name: 'Rookie',
      icon: 'shield',
      description: 'AI plays slower, less aggressive',
      color: 'from-green-600 to-emerald-600',
      border: 'border-green-500/50',
      activeBg: 'bg-green-900/30',
      stars: 1,
      rewards: '+5 Trophies'
    },
    {
      id: 'medium' as const,
      name: 'Veteran',
      icon: 'battle',
      description: 'Balanced AI with smart plays',
      color: 'from-blue-600 to-purple-600',
      border: 'border-blue-500/50',
      activeBg: 'bg-blue-900/30',
      stars: 2,
      rewards: '+15 Trophies'
    },
    {
      id: 'hard' as const,
      name: 'OG Kush',
      icon: 'fire',
      description: 'Aggressive AI, fast elixir',
      color: 'from-red-600 to-orange-600',
      border: 'border-red-500/50',
      activeBg: 'bg-red-900/30',
      stars: 3,
      rewards: '+30 Trophies'
    }
  ];

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      onStartBattle(selectedDifficulty);
    }, 800);
  };

  const avgCost = deck.length > 0 ? (deck.reduce((s: number, c: any) => s + c.cost, 0) / deck.length).toFixed(1) : '0';
  const totalAtk = deck.reduce((s: number, c: any) => s + c.attack, 0);
  const totalHp = deck.reduce((s: number, c: any) => s + c.health, 0);

  return (
    <div className={`min-h-screen min-h-[100dvh] text-white transition-all duration-500 ${isLaunching ? 'scale-110 opacity-0' : ''}`}>
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-red-500/30 safe-area-padding">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-300 active:text-white transition-colors min-h-[44px] px-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Edit Deck</span>
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Pre-Battle
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-10 overflow-y-auto">
        <div className="text-center mb-8">
          <GameIcon icon="battle" size={60} className="mb-3" />
          <h2 className="text-3xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            {teamName}
          </h2>
          <p className="text-gray-400 text-sm mt-2">vs AI Opponent</p>
        </div>

        <div className="bg-black/40 border border-gray-600/30 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Your Deck ({deck.length} cards)
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
            {deck.map((card: any, i: number) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-600/50">
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  onError={(e: any) => { e.currentTarget.src = '/game-assets/cards/default-card.jpg'; }}
                />
              </div>
            ))}
            {[...Array(Math.max(0, 8 - deck.length))].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl border border-dashed border-gray-700 bg-gray-800/20" />
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-blue-400" /> Avg: {avgCost}</span>
            <span className="flex items-center gap-1"><Swords className="w-3.5 h-3.5 text-red-400" /> ATK: {totalAtk}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-400" /> HP: {totalHp}</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-300 mb-3">Select Difficulty</h3>
        <div className="space-y-3 mb-8">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setSelectedDifficulty(diff.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all active:scale-[0.98] text-left min-h-[72px] ${
                selectedDifficulty === diff.id
                  ? `${diff.border} ${diff.activeBg} shadow-lg`
                  : 'border-gray-700/50 bg-black/30 active:border-gray-600/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GameIcon icon={(diff as any).icon as IconKey} size={32} />
                  <div>
                    <div className="font-bold text-white text-base">{diff.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{diff.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < diff.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <div className="text-green-400 text-xs font-medium">{diff.rewards}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          className="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white shadow-2xl shadow-red-500/30 active:scale-[0.97] transition-all disabled:opacity-70"
        >
          <div className="flex items-center justify-center gap-3">
            <GameIcon icon="battle" size={28} />
            <span>{isLaunching ? 'LAUNCHING...' : 'START BATTLE!'}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
