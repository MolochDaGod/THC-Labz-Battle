import { useState, useEffect } from 'react';
import { User, Wallet, Mail, Phone, Settings, ArrowLeft } from 'lucide-react';

interface UserProfilePageProps {
  onBack: () => void;
  user: any;
  onLogout: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onBack, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'wallet'>('profile');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Login</h2>
          <p className="text-gray-400 mb-6">You need to be logged in to access your profile.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">User Profile</h1>
              <p className="text-green-400">Manage your account and preferences</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-green-400/30">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-green-400'
            }`}
          >
            <User size={20} className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'wallet'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-green-400'
            }`}
          >
            <Wallet size={20} className="inline mr-2" />
            Wallet
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-green-400'
            }`}
          >
            <Settings size={20} className="inline mr-2" />
            Preferences
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-green-400 text-sm font-medium mb-1">User ID</label>
                  <p className="text-white bg-gray-700/50 px-3 py-2 rounded-lg">{user.userId}</p>
                </div>
                
                {user.walletAddress && (
                  <div>
                    <label className="block text-green-400 text-sm font-medium mb-1">Wallet Address</label>
                    <p className="text-white bg-gray-700/50 px-3 py-2 rounded-lg font-mono text-sm break-all">
                      {user.walletAddress}
                    </p>
                  </div>
                )}
                
                {user.email && (
                  <div>
                    <label className="block text-green-400 text-sm font-medium mb-1">Email</label>
                    <p className="text-white bg-gray-700/50 px-3 py-2 rounded-lg">{user.email}</p>
                  </div>
                )}
                
                {user.phoneNumber && (
                  <div>
                    <label className="block text-green-400 text-sm font-medium mb-1">Phone</label>
                    <p className="text-white bg-gray-700/50 px-3 py-2 rounded-lg">{user.phoneNumber}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-green-400 text-sm font-medium mb-1">Account Created</label>
                  <p className="text-white bg-gray-700/50 px-3 py-2 rounded-lg">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-green-400 text-sm font-medium mb-1">Last Login</label>
                  <p className="text-white bg-gray-700/50 px-3 py-2 rounded-lg">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Account Stats</h2>
              <div className="space-y-4">
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">Active</div>
                  <div className="text-green-300 text-sm">Account Status</div>
                </div>
                
                <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {user.walletAddress ? 'Connected' : 'Not Connected'}
                  </div>
                  <div className="text-blue-300 text-sm">Wallet Status</div>
                </div>
                
                {user.discord && (
                  <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4">
                    <div className="text-xl font-bold text-purple-400">{user.discord.username}</div>
                    <div className="text-purple-300 text-sm">Discord Connected</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Wallet Information</h2>
            {user.walletAddress ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-600/20 border border-green-600/30 rounded-lg">
                  <Wallet size={24} className="text-green-400" />
                  <div>
                    <div className="text-white font-semibold">Solana Wallet Connected</div>
                    <div className="text-green-400 text-sm font-mono">{user.walletAddress}</div>
                  </div>
                </div>
                
                {user.serverWallet && (
                  <div className="flex items-center gap-4 p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                    <Wallet size={24} className="text-blue-400" />
                    <div>
                      <div className="text-white font-semibold">Server Wallet</div>
                      <div className="text-blue-400 text-sm font-mono">{user.serverWallet}</div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Wallet Features</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Access to THC GROWERZ NFT collection</li>
                    <li>• Game bonuses based on NFT traits</li>
                    <li>• Token rewards and achievements</li>
                    <li>• Cross-game NFT benefits</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet size={48} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No Wallet Connected</h3>
                <p className="text-gray-400 mb-4">Connect your Solana wallet to access NFT features</p>
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Account Preferences</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Notifications</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded" defaultChecked />
                    <span className="text-gray-300">Email notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded" defaultChecked />
                    <span className="text-gray-300">Game updates</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded" />
                    <span className="text-gray-300">Marketing emails</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Privacy</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded" defaultChecked />
                    <span className="text-gray-300">Show my NFTs publicly</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded" />
                    <span className="text-gray-300">Allow friend requests</span>
                  </label>
                </div>
              </div>
              
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;