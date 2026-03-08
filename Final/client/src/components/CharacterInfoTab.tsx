import React, { useState, useEffect } from 'react';
import { User, Activity, Zap, Star, TrendingUp, Calendar, DollarSign, Target, MapPin, Clock, Award, Flame } from 'lucide-react';
import { GameState } from './DopeWarsGame';

interface CharacterInfoTabProps {
  gameState: GameState;
  isVisible: boolean;
  onClose: () => void;
  connectedWallet: string;
  selectedNFT: any;
  achievements: any[];
  nftVisitors: Array<{
    id: string;
    name: string;
    image: string;
    rank: number;
    rarity_score: number;
    visitType: 'purchase' | 'mission' | 'trade';
    offer: string;
    requiresResponse: boolean;
    timeLimit: number;
    reward: number;
  }>;
  onAcceptNFTVisit: (visitor: any) => void;
  onDeclineNFTVisit: (visitor: any) => void;
}

export function CharacterInfoTab({ 
  gameState, 
  isVisible, 
  onClose, 
  connectedWallet, 
  selectedNFT, 
  achievements,
  nftVisitors,
  onAcceptNFTVisit,
  onDeclineNFTVisit
}: CharacterInfoTabProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'stats' | 'actions' | 'nft-visits'>('info');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (!isVisible) return null;

  const formatWallet = (wallet: string) => {
    if (!wallet) return 'Not Connected';
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const calculateNetWorth = () => {
    return gameState.money + gameState.bankAccount - gameState.debt;
  };

  const getRepLevel = (rep: number) => {
    if (rep >= 90) return { level: 'Legendary', color: 'text-yellow-400' };
    if (rep >= 70) return { level: 'Veteran', color: 'text-purple-400' };
    if (rep >= 50) return { level: 'Respected', color: 'text-blue-400' };
    if (rep >= 30) return { level: 'Known', color: 'text-green-400' };
    return { level: 'Newcomer', color: 'text-gray-400' };
  };

  const repLevel = getRepLevel(gameState.reputation);

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-gray-900 border-r border-green-400 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-green-400 bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-green-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
            Character Info
          </h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Character Avatar */}
        <div className="flex items-center gap-3">
          {selectedNFT?.image ? (
            <img 
              src={selectedNFT.image} 
              alt={selectedNFT.name}
              className="w-12 h-12 rounded-full border-2 border-green-400"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-green-400 flex items-center justify-center">
              <User className="w-6 h-6 text-green-400" />
            </div>
          )}
          <div>
            <div className="text-white font-semibold">
              {selectedNFT?.name || 'Solo Player'}
            </div>
            <div className="text-sm text-gray-400">
              {formatWallet(connectedWallet)}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Mobile Responsive */}
      <div className="border-b border-gray-700">
        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <div className="relative">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between px-4 py-3 text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                {activeSection === 'info' && <><User className="w-4 h-4" /> Info</>}
                {activeSection === 'stats' && <><Activity className="w-4 h-4" /> Stats</>}
                {activeSection === 'actions' && <><Zap className="w-4 h-4" /> Actions</>}
                {activeSection === 'nft-visits' && <><Star className="w-4 h-4" /> Visits {nftVisitors.length > 0 ? `(${nftVisitors.length})` : ''}</>}
              </div>
              <span className="text-gray-400">▼</span>
            </button>

            {showMobileMenu && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-600 z-[9999] shadow-xl">
                {[
                  { id: 'info', label: 'Info', icon: User },
                  { id: 'stats', label: 'Stats', icon: Activity },
                  { id: 'actions', label: 'Actions', icon: Zap },
                  { id: 'nft-visits', label: `Visits ${nftVisitors.length > 0 ? `(${nftVisitors.length})` : ''}`, icon: Star }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveSection(id as any);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left font-semibold transition-colors border-b border-gray-700 last:border-b-0 flex items-center gap-2 ${
                      activeSection === id
                        ? 'border-green-400 text-green-400 bg-gray-700'
                        : 'text-gray-400 hover:text-green-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex">
          {[
            { id: 'info', label: 'Info', icon: User },
            { id: 'stats', label: 'Stats', icon: Activity },
            { id: 'actions', label: 'Actions', icon: Zap },
            { id: 'nft-visits', label: `Visits ${nftVisitors.length > 0 ? `(${nftVisitors.length})` : ''}`, icon: Star }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`flex-1 p-3 text-xs font-semibold border-b-2 transition-colors ${
                activeSection === id
                  ? 'border-green-400 text-green-400 bg-gray-800'
                  : 'border-transparent text-gray-400 hover:text-green-300'
              }`}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'info' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cash:</span>
                  <span className="text-green-400">${gameState.money.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank:</span>
                  <span className="text-blue-400">${gameState.bankAccount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Debt:</span>
                  <span className="text-red-400">${gameState.debt.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-300">Net Worth:</span>
                  <span className={calculateNetWorth() >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${calculateNetWorth().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Character Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Health:</span>
                  <span className={`font-semibold ${gameState.health > 70 ? 'text-green-400' : gameState.health > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {gameState.health}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reputation:</span>
                  <span className={`font-semibold ${repLevel.color}`}>
                    {gameState.reputation} ({repLevel.level})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Heat Level:</span>
                  <span className={`font-semibold ${gameState.heat <= 1 ? 'text-green-400' : gameState.heat <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {'★'.repeat(gameState.heat)}{'☆'.repeat(5 - gameState.heat)} ({gameState.heat}/5)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-blue-400 capitalize">{gameState.currentCity}</span>
                </div>
              </div>
            </div>

            {selectedNFT && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  AI Assistant
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">NFT Rank:</span>
                    <span className="text-purple-400">#{selectedNFT.rank || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rarity Score:</span>
                    <span className="text-yellow-400">{selectedNFT.rarity_score || 'Unknown'}</span>
                  </div>
                  <div className="text-gray-400">
                    Active bonuses from your selected AI assistant are enhancing your trading performance.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Game Progress
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Day:</span>
                  <span className="text-green-400">{gameState.day}/45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completion:</span>
                  <span className="text-blue-400">{Math.round((gameState.day / 45) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Days Remaining:</span>
                  <span className="text-yellow-400">{45 - gameState.day}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Trading Performance
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Transactions:</span>
                  <span className="text-green-400">{gameState.totalTransactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Profit:</span>
                  <span className="text-green-400">${(gameState.totalProfit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Highest Daily Profit:</span>
                  <span className="text-yellow-400">${(gameState.highestDailyProfit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deals Completed:</span>
                  <span className="text-blue-400">{gameState.dealsCompleted || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Achievements
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Unlocked:</span>
                  <span className="text-green-400">{achievements?.length || 0}/70</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completion:</span>
                  <span className="text-blue-400">{Math.round(((achievements?.length || 0) / 70) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'actions' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-semibold">
                  🏥 Quick Heal (+20 Health)
                </button>
                <button className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold">
                  🧠 AI Market Analysis
                </button>
                <button className="w-full p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-semibold">
                  📊 View Achievements
                </button>
                <button className="w-full p-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors text-sm font-semibold">
                  💰 Emergency Bank Loan
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Travel Options
              </h3>
              <div className="space-y-2 text-sm">
                <button className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-green-400 rounded transition-colors">
                  🏠 Return to Home Town
                </button>
                <button className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-green-400 rounded transition-colors">
                  🌆 Quick Travel to NYC
                </button>
                <button className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-green-400 rounded transition-colors">
                  🔍 Find Best Prices
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'nft-visits' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                NFT Visitors
              </h3>
              {nftVisitors.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No GROWERZ NFT visitors yet</p>
                  <p className="text-gray-500 text-xs mt-2">
                    AI-powered NFT characters will visit with special offers and missions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nftVisitors.map((visitor) => (
                    <div key={visitor.id} className="bg-gray-700 rounded-lg p-3 border-l-4 border-purple-400">
                      <div className="flex items-start gap-3">
                        <img 
                          src={visitor.image} 
                          alt={visitor.name}
                          className="w-12 h-12 rounded-full border-2 border-purple-400"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-sm">{visitor.name}</span>
                            <span className="text-xs text-purple-400">#{visitor.rank}</span>
                          </div>
                          <p className="text-gray-300 text-xs mb-2">{visitor.offer}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${
                              visitor.visitType === 'purchase' ? 'bg-green-900 text-green-300' :
                              visitor.visitType === 'mission' ? 'bg-blue-900 text-blue-300' :
                              'bg-yellow-900 text-yellow-300'
                            }`}>
                              {visitor.visitType.toUpperCase()}
                            </span>
                            <span className="text-green-400">${visitor.reward}</span>
                            <span className="text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {visitor.timeLimit}m
                            </span>
                          </div>
                          {visitor.requiresResponse && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => onAcceptNFTVisit(visitor)}
                                className="flex-1 py-1 px-3 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => onDeclineNFTVisit(visitor)}
                                className="flex-1 py-1 px-3 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}