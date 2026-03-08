/**
 * Achievement Display Component
 * Shows unlocked achievements and BUDZ rewards for completed game rounds
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Coins, Star, Target, MapPin, Heart, DollarSign, Sparkles } from 'lucide-react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  rewardBudz: number;
  iconEmoji: string;
  requirement: any;
}

interface UserAchievement {
  id: number;
  achievementId: number;
  budzRewarded: number;
  gameDay: number;
  unlockedAt: string;
}

interface AchievementDisplayProps {
  walletAddress: string;
  gameRoundId?: string;
  onClose: () => void;
}

export function AchievementDisplay({ walletAddress, gameRoundId, onClose }: AchievementDisplayProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievementData();
  }, [walletAddress, gameRoundId]);

  const loadAchievementData = async () => {
    try {
      setLoading(true);

      // Load all available achievements
      const availableResponse = await fetch('/api/achievements/available');
      const availableData = await availableResponse.json();

      // Load user achievements
      const userUrl = gameRoundId 
        ? `/api/achievements/user/${walletAddress}?gameRoundId=${gameRoundId}`
        : `/api/achievements/user/${walletAddress}`;
      const userResponse = await fetch(userUrl);
      const userData = await userResponse.json();

      // Load achievement stats
      const statsResponse = await fetch('/api/achievements/stats');
      const statsData = await statsResponse.json();

      if (availableData.success) setAchievements(availableData.achievements);
      if (userData.success) setUserAchievements(userData.achievements);
      if (statsData.success) setStats(statsData.stats);

      console.log('🏆 Loaded achievements:', {
        available: availableData.achievements?.length,
        unlocked: userData.achievements?.length,
        totalBudz: userData.totalBudzEarned
      });
    } catch (error) {
      console.error('❌ Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trading': return <Coins className="w-5 h-5" />;
      case 'travel': return <MapPin className="w-5 h-5" />;
      case 'survival': return <Heart className="w-5 h-5" />;
      case 'wealth': return <DollarSign className="w-5 h-5" />;
      case 'special': return <Sparkles className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trading': return 'text-blue-400 bg-blue-900';
      case 'travel': return 'text-green-400 bg-green-900';
      case 'survival': return 'text-red-400 bg-red-900';
      case 'wealth': return 'text-yellow-400 bg-yellow-900';
      case 'special': return 'text-purple-400 bg-purple-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const isAchievementUnlocked = (achievementId: number) => {
    return userAchievements.some(ua => ua.achievementId === achievementId);
  };

  const getUserAchievement = (achievementId: number) => {
    return userAchievements.find(ua => ua.achievementId === achievementId);
  };

  const totalBudzEarned = userAchievements.reduce((sum, ua) => sum + ua.budzRewarded, 0);
  const achievementsByCategory = achievements.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-yellow-400 p-8 rounded-lg">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400 animate-spin" />
            <span className="text-xl text-white" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
              Loading Achievements...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-400 w-full max-w-6xl h-[90vh] flex flex-col rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-yellow-400 bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <div>
                <h2 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  Achievement System
                </h2>
                <p className="text-sm text-gray-300">
                  Earn BUDZ tokens for completing game rounds • Max 1,250 BUDZ per round
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 text-2xl font-bold px-4 py-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="p-4 bg-gray-800 border-b border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-400">{userAchievements.length}</div>
                <div className="text-xs text-gray-400">Unlocked</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-green-400">{totalBudzEarned}</div>
                <div className="text-xs text-gray-400">BUDZ Earned</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-blue-400">{stats.totalAchievements}</div>
                <div className="text-xs text-gray-400">Total Available</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-purple-400">{stats.maxBudzPerRound}</div>
                <div className="text-xs text-gray-400">Max BUDZ/Round</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-2xl font-bold text-orange-400">
                  {Math.round((userAchievements.length / stats.totalAchievements) * 100)}%
                </div>
                <div className="text-xs text-gray-400">Completion</div>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Categories */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
            <div key={category} className="mb-8">
              <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${getCategoryColor(category)}`}>
                {getCategoryIcon(category)}
                <h3 className="text-xl font-bold capitalize" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  {category} Achievements
                </h3>
                <span className="ml-auto text-sm">
                  {categoryAchievements.filter(a => isAchievementUnlocked(a.id)).length} / {categoryAchievements.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => {
                  const unlocked = isAchievementUnlocked(achievement.id);
                  const userAch = getUserAchievement(achievement.id);

                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        unlocked
                          ? 'border-green-400 bg-green-900 bg-opacity-20'
                          : 'border-gray-600 bg-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{achievement.iconEmoji}</span>
                          <div className="text-lg font-bold text-white">
                            {achievement.name}
                          </div>
                        </div>
                        {unlocked && (
                          <div className="flex items-center gap-1 text-green-400">
                            <Award className="w-4 h-4" />
                            <span className="text-sm font-bold">+{achievement.rewardBudz} BUDZ</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-300 mb-3">
                        {achievement.description}
                      </p>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">
                          Reward: {achievement.rewardBudz} BUDZ
                        </span>
                        {unlocked && userAch && (
                          <span className="text-green-400">
                            Day {userAch.gameDay}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-400 bg-gray-800 text-center">
          <p className="text-sm text-gray-400">
            🎯 Complete 45-day game rounds to unlock achievements and earn BUDZ tokens from the AI agent wallet
          </p>
        </div>
      </div>
    </div>
  );
}