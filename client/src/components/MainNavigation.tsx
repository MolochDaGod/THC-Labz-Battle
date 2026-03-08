import { useState } from 'react';
import { Gamepad2, Grid, Settings, User, LogOut } from 'lucide-react';

interface MainNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user?: any;
  onLogout?: () => void;
}

export default function MainNavigation({ currentPath, onNavigate, user, onLogout }: MainNavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  return (
    <div className="bg-black/20 backdrop-blur-sm border-b border-green-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Mobile Optimized */}
          <div className="flex items-center">
            <div className="text-lg sm:text-xl font-bold text-white">
              THC <span className="text-green-400">CLASH</span>
            </div>
          </div>

          {/* Navigation - Mobile Optimized */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('/')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                currentPath === '/' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Gamepad2 size={14} />
              <span className="hidden sm:inline">Game</span>
            </button>
            <button
              onClick={() => onNavigate('/collection')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                currentPath === '/collection' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Grid size={14} />
              <span className="hidden sm:inline">Collection</span>
            </button>
            <button
              onClick={() => onNavigate('/settings')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                currentPath === '/settings' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Settings size={14} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => onNavigate('/admingame')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                currentPath === '/admingame' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <Grid size={14} />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <User size={18} />
                  {user.walletAddress ? 
                    `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` :
                    user.email || 'User'
                  }
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        onNavigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors"
                    >
                      <User size={16} className="inline mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('/settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <Settings size={16} className="inline mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        onLogout && onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-b-lg transition-colors"
                    >
                      <LogOut size={16} className="inline mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <User size={18} />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}