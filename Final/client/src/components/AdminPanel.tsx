import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  walletAddress: string | null;
  serverWallet: string | null;
  budzBalance: number;
  gbuxBalance: number;
  createdAt: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  day: number;
  walletAddress: string | null;
  serverWallet: string | null;
  createdAt: string;
  rewardPaid: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalWallets: number;
  totalBudzIssued: number;
  totalGbuxIssued: number;
  activeLeaderboardEntries: number;
  pendingRewards: number;
  aiAgentStats: {
    totalTokensManaged: number;
    weeklyRewardsScheduled: boolean;
    nextRewardProcessing: string;
    totalFeesCollected: number;
    lastSwapProcessed: string;
  };
  systemHealth: {
    grenchAiStatus: string;
    crossmintStatus: string;
    databaseStatus: string;
    schedulerStatus: string;
  };
}

interface AdminPanelProps {
  onClose: () => void;
  onTestEndGameVideo?: () => void;
  onTestAchievementRewards?: () => void;
}

export default function AdminPanel({ onClose, onTestEndGameVideo, onTestAchievementRewards }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'leaderboard' | 'stats' | 'rewards' | 'ai-agent' | 'console'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Custom reward/bonus state
  const [customRewardWallet, setCustomRewardWallet] = useState('');
  const [customRewardAmount, setCustomRewardAmount] = useState(0);
  const [customRewardToken, setCustomRewardToken] = useState<'budz' | 'gbux' | 'thc-labz'>('budz');
  const [customRewardReason, setCustomRewardReason] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } else if (activeTab === 'leaderboard') {
        const response = await fetch('/api/admin/leaderboard');
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } else if (activeTab === 'stats') {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRewards = async () => {
    if (confirm('Are you sure you want to manually process daily rewards?')) {
      try {
        const response = await fetch('/api/admin/process-rewards', { method: 'POST' });
        const result = await response.json();
        alert(`Rewards processed: ${result.playersRewarded} players rewarded`);
        loadAdminData();
      } catch (error) {
        alert('Error processing rewards');
        console.error(error);
      }
    }
  };

  const sendCustomReward = async () => {
    if (!customRewardWallet || !customRewardAmount || !customRewardReason) {
      alert('Please fill in all custom reward fields');
      return;
    }

    if (confirm(`Send ${customRewardAmount} ${customRewardToken.toUpperCase()} tokens to ${customRewardWallet}?`)) {
      try {
        const response = await fetch('/api/admin/custom-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: customRewardWallet,
            amount: customRewardAmount,
            token: customRewardToken,
            reason: customRewardReason
          })
        });
        const result = await response.json();
        if (response.ok) {
          alert(`Custom reward sent successfully! Transaction: ${result.transactionId}`);
          setCustomRewardWallet('');
          setCustomRewardAmount(0);
          setCustomRewardReason('');
          loadAdminData();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        alert('Error sending custom reward');
        console.error(error);
      }
    }
  };

  const processWeeklyRewards = async () => {
    if (confirm('Are you sure you want to manually trigger weekly reward distribution?')) {
      try {
        const response = await fetch('/api/admin/weekly-rewards', { method: 'POST' });
        const result = await response.json();
        alert(`Weekly rewards processed: ${result.walletsProcessed} wallets processed`);
        loadAdminData();
      } catch (error) {
        alert('Error processing weekly rewards');
        console.error(error);
      }
    }
  };

  const updateTokenBalance = async (userId: number, token: 'budz' | 'gbux', amount: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amount })
      });
      if (response.ok) {
        alert('Balance updated successfully');
        loadAdminData();
      }
    } catch (error) {
      alert('Error updating balance');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-red-400 w-full h-full max-w-7xl max-h-[95vh] flex flex-col rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-red-400">
          <h2 className="text-2xl font-bold text-red-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
            🔧 Admin Control Panel
          </h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-3xl font-bold"
            title="Close Admin Panel"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs - Mobile Responsive */}
        <div className="border-b border-gray-700">
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-full flex items-center justify-between px-4 py-3 text-white bg-gray-800 hover:bg-gray-700 transition-colors font-bold"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                <span>
                  {activeTab === 'stats' && '📊 Stats'}
                  {activeTab === 'users' && '👥 Users'}
                  {activeTab === 'leaderboard' && '🏆 Leaderboard'}
                  {activeTab === 'rewards' && '💰 Rewards'}
                  {activeTab === 'ai-agent' && '🤖 AI Agent'}
                  {activeTab === 'console' && '🖥️ Console'}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {showMobileMenu && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-600 z-[9999] shadow-xl">
                  {(['stats', 'users', 'leaderboard', 'rewards', 'ai-agent', 'console'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left font-bold transition-colors border-b border-gray-700 last:border-b-0 ${
                        activeTab === tab
                          ? 'bg-red-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      style={{ fontFamily: 'LemonMilk, sans-serif' }}
                    >
                      {tab === 'stats' ? '📊 Stats' : 
                       tab === 'users' ? '👥 Users' : 
                       tab === 'leaderboard' ? '🏆 Leaderboard' : 
                       tab === 'rewards' ? '💰 Rewards' :
                       tab === 'ai-agent' ? '🤖 AI Agent' :
                       '🖥️ Console'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:flex overflow-x-auto scrollbar-hide">
            {(['stats', 'users', 'leaderboard', 'rewards', 'ai-agent', 'console'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-none px-4 py-3 font-bold capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-red-600 text-white border-b-2 border-red-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                {tab === 'stats' ? '📊 Stats' : 
                 tab === 'users' ? '👥 Users' : 
                 tab === 'leaderboard' ? '🏆 Leaderboard' : 
                 tab === 'rewards' ? '💰 Rewards' :
                 tab === 'ai-agent' ? '🤖 AI Agent' :
                 '🖥️ Console'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-green-400 text-xl">Loading admin data...</div>
            </div>
          ) : (
            <>
              {/* Stats Tab */}
              {activeTab === 'stats' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-6 rounded-lg border border-green-400">
                    <h3 className="text-lg font-bold text-green-400 mb-2">👥 Users</h3>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-400">Total registered users</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-purple-400">
                    <h3 className="text-lg font-bold text-purple-400 mb-2">💼 Wallets</h3>
                    <p className="text-3xl font-bold text-white">{stats.totalWallets}</p>
                    <p className="text-sm text-gray-400">Connected wallets</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-yellow-400">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">🌿 BUDZ Issued</h3>
                    <p className="text-3xl font-bold text-white">{stats.totalBudzIssued.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total BUDZ distributed</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-orange-400">
                    <h3 className="text-lg font-bold text-orange-400 mb-2">💎 GBUX Issued</h3>
                    <p className="text-3xl font-bold text-white">{stats.totalGbuxIssued.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total GBUX distributed</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-blue-400">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">🏆 Active Scores</h3>
                    <p className="text-3xl font-bold text-white">{stats.activeLeaderboardEntries}</p>
                    <p className="text-sm text-gray-400">Current leaderboard entries</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-red-400">
                    <h3 className="text-lg font-bold text-red-400 mb-2">⏳ Pending Rewards</h3>
                    <p className="text-3xl font-bold text-white">{stats.pendingRewards}</p>
                    <p className="text-sm text-gray-400">Unpaid reward entries</p>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-green-400 mb-4">User Management</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-gray-800 rounded-lg">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-4 text-green-400">ID</th>
                          <th className="text-left p-4 text-green-400">Username</th>
                          <th className="text-left p-4 text-green-400">Authentication</th>
                          <th className="text-left p-4 text-green-400">Contact Info</th>
                          <th className="text-left p-4 text-green-400">Wallet Address</th>
                          <th className="text-left p-4 text-green-400">THC Dope Wars SOL Wallet</th>
                          <th className="text-left p-4 text-green-400">BUDZ</th>
                          <th className="text-left p-4 text-green-400">GBUX</th>
                          <th className="text-left p-4 text-green-400">Created</th>
                          <th className="text-left p-4 text-green-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="p-4 text-white">{user.id}</td>
                            <td className="p-4 text-white">{user.username}</td>
                            <td className="p-4 text-xs">
                              <div className="space-y-1">
                                {user.walletAddress && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-green-400">💰</span>
                                    <span className="text-gray-300">Wallet</span>
                                  </div>
                                )}
                                {user.email && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-blue-400">📧</span>
                                    <span className="text-gray-300">Email</span>
                                  </div>
                                )}
                                {user.phoneNumber && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-purple-400">📱</span>
                                    <span className="text-gray-300">Phone</span>
                                  </div>
                                )}
                                {user.discord && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-indigo-400">🎮</span>
                                    <span className="text-gray-300">Discord</span>
                                  </div>
                                )}
                                {user.google && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-red-400">🔍</span>
                                    <span className="text-gray-300">Google</span>
                                  </div>
                                )}
                                {user.farcaster && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-yellow-400">🔵</span>
                                    <span className="text-gray-300">Farcaster</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="space-y-1">
                                {user.email && (
                                  <div className="text-blue-400">{user.email}</div>
                                )}
                                {user.phoneNumber && (
                                  <div className="text-purple-400">{user.phoneNumber}</div>
                                )}
                                {user.discord && (
                                  <div className="text-indigo-400">{user.discord.username}#{user.discord.discriminator}</div>
                                )}
                                {user.google && (
                                  <div className="text-red-400">{user.google.name}</div>
                                )}
                                {user.farcaster && (
                                  <div className="text-yellow-400">@{user.farcaster.username}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-xs text-gray-300 font-mono">
                              {user.walletAddress ? `${user.walletAddress.slice(0, 8)}...` : 'None'}
                            </td>
                            <td className="p-4 text-xs text-gray-300 font-mono">
                              {user.serverWallet ? `${user.serverWallet.slice(0, 8)}...` : 'None'}
                            </td>
                            <td className="p-4 text-yellow-400">{user.budzBalance.toLocaleString()}</td>
                            <td className="p-4 text-orange-400">{user.gbuxBalance.toLocaleString()}</td>
                            <td className="p-4 text-gray-400 text-xs">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const amount = prompt('Enter BUDZ amount to add/subtract:');
                                    if (amount) updateTokenBalance(user.id, 'budz', parseInt(amount));
                                  }}
                                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded"
                                >
                                  BUDZ
                                </button>
                                <button
                                  onClick={() => {
                                    const amount = prompt('Enter GBUX amount to add/subtract:');
                                    if (amount) updateTokenBalance(user.id, 'gbux', parseInt(amount));
                                  }}
                                  className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded"
                                >
                                  GBUX
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Leaderboard Management</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-gray-800 rounded-lg">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-4 text-green-400">Rank</th>
                          <th className="text-left p-4 text-green-400">Player</th>
                          <th className="text-left p-4 text-green-400">Score</th>
                          <th className="text-left p-4 text-green-400">Day</th>
                          <th className="text-left p-4 text-green-400">Wallet</th>
                          <th className="text-left p-4 text-green-400">Reward Status</th>
                          <th className="text-left p-4 text-green-400">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => (
                          <tr key={entry.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="p-4 text-white font-bold">#{index + 1}</td>
                            <td className="p-4 text-white">{entry.name}</td>
                            <td className="p-4 text-green-400 font-bold">{entry.score.toLocaleString()}</td>
                            <td className="p-4 text-white">{entry.day}</td>
                            <td className="p-4 text-xs text-gray-300 font-mono">
                              {entry.walletAddress ? `${entry.walletAddress.slice(0, 8)}...` : 'None'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                entry.rewardPaid ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                              }`}>
                                {entry.rewardPaid ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 text-xs">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rewards Tab */}
              {activeTab === 'rewards' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Reward Management</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-yellow-400">
                      <h4 className="text-lg font-bold text-yellow-400 mb-4">Manual Reward Processing</h4>
                      <p className="text-gray-300 mb-4">
                        Process daily rewards manually. Distributes BUDZ tokens to top 10 players.
                      </p>
                      <button
                        onClick={processRewards}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg mb-4 w-full"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        🏆 Process Daily Rewards
                      </button>
                      <button
                        onClick={processWeeklyRewards}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg w-full"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        📅 Process Weekly Rewards
                      </button>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg border border-blue-400">
                      <h4 className="text-lg font-bold text-blue-400 mb-4">Custom AI Agent Rewards</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Wallet Address"
                          value={customRewardWallet}
                          onChange={(e) => setCustomRewardWallet(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Amount"
                            value={customRewardAmount}
                            onChange={(e) => setCustomRewardAmount(Number(e.target.value))}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                          />
                          <select
                            value={customRewardToken}
                            onChange={(e) => setCustomRewardToken(e.target.value as 'budz' | 'gbux' | 'thc-labz')}
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                          >
                            <option value="budz">BUDZ</option>
                            <option value="gbux">GBUX</option>
                            <option value="thc-labz">THC LABZ</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Reason for reward"
                          value={customRewardReason}
                          onChange={(e) => setCustomRewardReason(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                        <button
                          onClick={sendCustomReward}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                        >
                          🤖 Send AI Agent Reward
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-green-400">
                    <h4 className="text-lg font-bold text-green-400 mb-4">AI Agent & Weekly Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-300 mb-2">
                          <strong>Daily Rewards:</strong> Midnight CST automatic processing
                        </p>
                        <p className="text-gray-300 mb-2">
                          <strong>Weekly Rewards:</strong> Thursday 10:00 PM CST batch distribution
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300 mb-2">
                          <strong>AI Agent:</strong> Controls 10 billion token supply
                        </p>
                        <p className="text-gray-300 mb-2">
                          <strong>Server Distribution:</strong> Tokens sent to THC Dope Wars SOL wallets
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Agent Tab */}
              {activeTab === 'ai-agent' && stats && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-green-400 mb-4">AI Agent Management</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-cyan-400">
                      <h4 className="text-lg font-bold text-cyan-400 mb-4">AI Agent Statistics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Tokens Managed:</span>
                          <span className="text-white font-bold">{stats.aiAgentStats.totalTokensManaged.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Weekly Rewards:</span>
                          <span className="text-green-400 font-bold">
                            {stats.aiAgentStats.weeklyRewardsScheduled ? 'Scheduled' : 'Not Scheduled'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Fees Collected:</span>
                          <span className="text-yellow-400 font-bold">{stats.aiAgentStats.totalFeesCollected.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg border border-orange-400">
                      <h4 className="text-lg font-bold text-orange-400 mb-4">System Health</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Grench AI:</span>
                          <span className="text-green-400 font-bold">{stats.systemHealth.grenchAiStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Crossmint API:</span>
                          <span className="text-green-400 font-bold">{stats.systemHealth.crossmintStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Database:</span>
                          <span className="text-green-400 font-bold">{stats.systemHealth.databaseStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Scheduler:</span>
                          <span className="text-green-400 font-bold">{stats.systemHealth.schedulerStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg border border-red-400">
                    <h4 className="text-lg font-bold text-red-400 mb-4">AI Agent Wallet</h4>
                    <p className="text-gray-300 mb-4">
                      AI Agent Wallet: <span className="font-mono text-cyan-400">ErSGeWkLuKqmW2MNrcFWPsYryNPXDW224GmgNBf8ZT65</span>
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      This wallet controls the entire 10 billion token supply and processes all custom rewards, 
                      swaps, and weekly distributions. All transactions require AI approval or fallback logic.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-700 p-4 rounded border border-yellow-500">
                        <h5 className="text-yellow-400 font-bold mb-2">BUDZ Tokens</h5>
                        <p className="text-white text-lg">Contract: 2i7T...nsiQ</p>
                        <p className="text-gray-400 text-sm">Game reward token</p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded border border-orange-500">
                        <h5 className="text-orange-400 font-bold mb-2">GBUX Tokens</h5>
                        <p className="text-white text-lg">Contract: 55Tp...nray</p>
                        <p className="text-gray-400 text-sm">Swappable token</p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded border border-green-500">
                        <h5 className="text-green-400 font-bold mb-2">THC LABZ</h5>
                        <p className="text-white text-lg">Contract: BmwJ...LbuT</p>
                        <p className="text-gray-400 text-sm">Premium token</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Console Tab */}
              {activeTab === 'console' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">System Console</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConsoleLogs([])}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        Clear Logs
                      </button>
                      <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`px-4 py-2 rounded transition-colors text-sm ${
                          autoScroll ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                        } text-white`}
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Test Features */}
                  <div className="bg-red-900 bg-opacity-30 p-4 rounded-lg border border-red-400 mb-6">
                    <h4 className="text-red-400 font-bold mb-4">🧪 Test Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          console.log('🎬 Testing end-game video sequence...');
                          if (onTestEndGameVideo) {
                            onTestEndGameVideo();
                          } else {
                            console.log('❌ Test function not available');
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded transition-colors"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        🎬 Test End-Game Video
                      </button>
                      <button
                        onClick={() => {
                          console.log('🏆 Testing achievement rewards...');
                          if (onTestAchievementRewards) {
                            onTestAchievementRewards();
                          } else {
                            console.log('❌ Test function not available');
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded transition-colors"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        🏆 Test Achievement Rewards
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Test the 45-day completion celebration sequence and achievement rewards modal
                    </p>
                  </div>

                  {/* System Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-green-400">
                      <h4 className="text-green-400 font-bold text-sm mb-2">Server Status</h4>
                      <p className="text-white text-lg">🟢 ONLINE</p>
                      <p className="text-gray-400 text-xs">Port 5000</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-blue-400">
                      <h4 className="text-blue-400 font-bold text-sm mb-2">Database</h4>
                      <p className="text-white text-lg">🟢 CONNECTED</p>
                      <p className="text-gray-400 text-xs">PostgreSQL</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-yellow-400 font-bold text-sm mb-2">AI Agent</h4>
                      <p className="text-white text-lg">🟢 ACTIVE</p>
                      <p className="text-gray-400 text-xs">Grench AI</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-purple-400">
                      <h4 className="text-purple-400 font-bold text-sm mb-2">Crossmint</h4>
                      <p className="text-white text-lg">🟡 READY</p>
                      <p className="text-gray-400 text-xs">Wallet API</p>
                    </div>
                  </div>

                  {/* Console Output */}
                  <div className="bg-black border border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex justify-between items-center">
                      <span className="text-green-400 font-mono text-sm">THC Labz Dope Wars Console</span>
                      <span className="text-gray-400 text-xs">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div 
                      className="h-96 overflow-y-auto p-4 font-mono text-sm"
                      style={{ 
                        backgroundColor: '#0a0a0a',
                        scrollBehavior: autoScroll ? 'smooth' : 'auto'
                      }}
                    >
                      {consoleLogs.length === 0 ? (
                        <div className="text-gray-500">
                          <p>🖥️ Console initialized...</p>
                          <p>💰 THC Labz Dope Wars production server</p>
                          <p>🔧 Monitoring system logs, API requests, and database operations</p>
                          <p>📡 Real-time updates enabled</p>
                          <p className="mt-2 text-yellow-400">Waiting for system events...</p>
                        </div>
                      ) : (
                        consoleLogs.map((log, index) => (
                          <div 
                            key={index} 
                            className={`mb-1 ${
                              log.includes('ERROR') || log.includes('❌') ? 'text-red-400' :
                              log.includes('SUCCESS') || log.includes('✅') ? 'text-green-400' :
                              log.includes('WARNING') || log.includes('⚠️') ? 'text-yellow-400' :
                              log.includes('API') || log.includes('🔗') ? 'text-blue-400' :
                              log.includes('DATABASE') || log.includes('💾') ? 'text-purple-400' :
                              log.includes('NFT') || log.includes('🌿') ? 'text-orange-400' :
                              'text-gray-300'
                            }`}
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-cyan-400">
                      <h4 className="text-cyan-400 font-bold mb-3">Server Health</h4>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/health');
                            const data = await response.json();
                            const timestamp = new Date().toLocaleTimeString();
                            setConsoleLogs(prev => [...prev, `[${timestamp}] 🏥 Health check: ${data.status}`]);
                          } catch (error) {
                            const timestamp = new Date().toLocaleTimeString();
                            setConsoleLogs(prev => [...prev, `[${timestamp}] ❌ Health check failed: ${error}`]);
                          }
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        Health Check
                      </button>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-yellow-400">
                      <h4 className="text-yellow-400 font-bold mb-3">AI Agent Status</h4>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/ai-agent/status');
                            const data = await response.json();
                            const timestamp = new Date().toLocaleTimeString();
                            setConsoleLogs(prev => [...prev, 
                              `[${timestamp}] 🤖 AI Agent Status: ${data.success ? 'OPERATIONAL' : 'ERROR'}`,
                              `[${timestamp}] 💰 BUDZ Balance: ${data.aiWallet?.budzBalance?.toLocaleString() || 'N/A'}`,
                              `[${timestamp}] 💰 GBUX Balance: ${data.aiWallet?.gbuxBalance?.toLocaleString() || 'N/A'}`
                            ]);
                          } catch (error) {
                            const timestamp = new Date().toLocaleTimeString();
                            setConsoleLogs(prev => [...prev, `[${timestamp}] ❌ AI Agent check failed: ${error}`]);
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        Check AI Agent
                      </button>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-red-400">
                      <h4 className="text-red-400 font-bold mb-3">System Restart</h4>
                      <button
                        onClick={() => {
                          if (confirm('This will restart the development server. Continue?')) {
                            const timestamp = new Date().toLocaleTimeString();
                            setConsoleLogs(prev => [...prev, `[${timestamp}] 🔄 Restarting development server...`]);
                            window.location.reload();
                          }
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        Restart Server
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}