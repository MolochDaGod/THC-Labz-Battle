import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Gamepad2, 
  Grid, 
  Settings, 
  User, 
  LogOut, 
  Shield, 
  Crown, 
  Coins, 
  Wallet,
  Menu,
  X,
  Download,
  Database,
  ChevronDown
} from 'lucide-react';

interface UniversalHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user?: any;
  onLogout?: () => void;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  walletBalances?: {
    sol: number;
    budz: number;
    gbux: number;
    thcLabz: number;
  };
  connectedNFTs?: any[];
}

export default function UniversalHeader({ 
  currentPath, 
  onNavigate, 
  user, 
  onLogout, 
  title,
  showBackButton = false,
  onBack,
  walletBalances,
  connectedNFTs = []
}: UniversalHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for a live feel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const navigationItems = [
    { path: '/', label: 'Game', icon: Gamepad2 },
    { path: '/collection', label: 'Collection', icon: Grid },
    { path: '/battle', label: 'Battle', icon: Shield },
    { path: '/web3', label: 'Web3', icon: Wallet },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/download', label: 'Download', icon: Download }
  ];

  const adminItems = [
    { path: '/admingame', label: 'Admin Game', icon: Database },
    { path: '/admin', label: 'Admin Board', icon: Grid }
  ];

  const isActivePage = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="bg-gradient-to-r from-black/90 via-gray-900/90 to-black/90 backdrop-blur-lg border-b border-green-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Left Section - Logo + Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="text-xl sm:text-2xl font-bold">
                <span className="text-white">THC</span>
                <span className="text-green-400 ml-1">CLASH</span>
              </div>
              {title && (
                <>
                  <div className="hidden sm:block w-px h-6 bg-gray-600"></div>
                  <div className="text-gray-300 font-medium hidden sm:block">{title}</div>
                </>
              )}
            </div>
          </div>

          {/* Middle Section - Navigation (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setShowMobileMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActivePage(item.path)
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
            
            {/* Admin Section (if applicable) */}
            {user && (currentPath.includes('/admin') || user.isAdmin) && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-600">
                {adminItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      setShowMobileMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePage(item.path)
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                    }`}
                  >
                    <item.icon size={16} />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - User Info + Mobile Menu */}
          <div className="flex items-center gap-3">
            
            {/* Wallet Balances (if user logged in) */}
            {user && walletBalances && (
              <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Coins size={16} />
                  <span className="text-sm font-medium">{walletBalances.budz.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Wallet size={16} />
                  <span className="text-sm font-medium">{walletBalances.sol.toFixed(3)}</span>
                </div>
                {connectedNFTs.length > 0 && (
                  <div className="flex items-center gap-1 text-purple-400">
                    <Crown size={16} />
                    <span className="text-sm font-medium">{connectedNFTs.length}</span>
                  </div>
                )}
              </div>
            )}

            {/* Time Display */}
            <div className="hidden sm:block text-sm text-gray-400 font-mono">
              {formatTime(currentTime)}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">
                    {user.walletAddress ? 
                      `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` :
                      user.email || 'User'
                    }
                  </span>
                  <ChevronDown size={16} className="hidden sm:inline" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50">
                    <div className="p-4 border-b border-gray-600">
                      <div className="text-white font-medium">
                        {user.email || 'Connected User'}
                      </div>
                      {user.walletAddress && (
                        <div className="text-gray-400 text-sm font-mono">
                          {user.walletAddress}
                        </div>
                      )}
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          onNavigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <User size={16} />
                        Profile
                      </button>
                      
                      <button
                        onClick={() => {
                          onNavigate('/settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      
                      <div className="border-t border-gray-600 mt-2 pt-2">
                        <button
                          onClick={() => {
                            onLogout && onLogout();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-3"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActivePage(item.path)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            
            {/* Mobile Admin Section */}
            {user && (currentPath.includes('/admin') || user.isAdmin) && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="text-xs text-gray-400 mb-2 font-medium">ADMIN</div>
                <div className="grid grid-cols-2 gap-2">
                  {adminItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        onNavigate(item.path);
                        setShowMobileMenu(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActivePage(item.path)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Wallet Info */}
            {user && walletBalances && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800/50 px-3 py-2 rounded-lg text-center">
                    <div className="text-yellow-400 text-sm font-medium">{walletBalances.budz.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">BUDZ</div>
                  </div>
                  <div className="bg-gray-800/50 px-3 py-2 rounded-lg text-center">
                    <div className="text-blue-400 text-sm font-medium">{walletBalances.sol.toFixed(3)}</div>
                    <div className="text-xs text-gray-400">SOL</div>
                  </div>
                  {connectedNFTs.length > 0 && (
                    <div className="bg-gray-800/50 px-3 py-2 rounded-lg text-center">
                      <div className="text-purple-400 text-sm font-medium">{connectedNFTs.length}</div>
                      <div className="text-xs text-gray-400">NFTs</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}