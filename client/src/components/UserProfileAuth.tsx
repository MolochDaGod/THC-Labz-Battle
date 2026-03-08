/**
 * Comprehensive User Profile & Authentication Component
 * Supports multiple login methods: SOL wallet, email, phone, Discord
 * All methods link to unified user account
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Wallet, Mail, Phone, Settings, Star, Trophy, Crown, Target, Zap, Shield, ArrowLeft, Home, Gamepad2, Eye, Shirt, HardHat, Sparkles, Sword } from 'lucide-react';

interface User {
  userId: string;
  email?: string;
  phoneNumber?: string;
  google?: {
    name: string;
    picture: string;
  };
  farcaster?: {
    fid: string;
    username: string;
    bio: string;
    displayName: string;
    pfpUrl: string;
    custody: string;
    verifications: string[];
  };
  discord?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
  };
  walletAddress?: string;
  serverWallet?: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface PlayerNFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface UserProfileAuthProps {
  onAuthChange: (authState: AuthState) => void;
  onNavigateHome?: () => void;
  onNavigateToGame?: () => void;
  connectedNFTs?: PlayerNFT[];
}

export function UserProfileAuth({ onAuthChange, onNavigateHome, onNavigateToGame, connectedNFTs = [] }: UserProfileAuthProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  const [activeTab, setActiveTab] = useState<'login' | 'profile'>('login');
  const [loginMethod, setLoginMethod] = useState<'wallet' | 'email' | 'phone' | 'discord'>('wallet');
  
  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate NFT bonuses for display
  const calculateNFTBonuses = (nft: PlayerNFT) => {
    let attackMultiplier = 1.0;
    let defenseMultiplier = 1.0;
    let speedMultiplier = 1.0;
    let rangeMultiplier = 1.0;
    let attackRateMultiplier = 1.0;
    let manaRegenMultiplier = 1.0;
    const abilities: string[] = [];

    // Rank-based bonuses
    const rankBonus = Math.max(0.1, (2500 - nft.rank) / 2500);
    attackMultiplier += rankBonus * 0.4;
    defenseMultiplier += rankBonus * 0.3;
    speedMultiplier += rankBonus * 0.2;

    // Process traits
    if (nft.attributes) {
      nft.attributes.forEach(attr => {
        const traitType = attr.trait_type.toLowerCase();
        const traitValue = attr.value.toLowerCase();

        switch (traitType) {
          case 'eyes':
            if (traitValue.includes('red')) {
              attackMultiplier += 0.25;
              abilities.push('Burning Gaze');
            } else if (traitValue.includes('green')) {
              manaRegenMultiplier += 0.3;
              abilities.push('Nature Sight');
            } else if (traitValue.includes('blue')) {
              rangeMultiplier += 0.2;
              abilities.push('Ice Stare');
            } else if (traitValue.includes('gold') || traitValue.includes('yellow')) {
              attackMultiplier += 0.15;
              defenseMultiplier += 0.15;
              abilities.push('Golden Vision');
            }
            break;

          case 'clothes':
          case 'clothing':
            if (traitValue.includes('hoodie')) {
              speedMultiplier += 0.2;
              abilities.push('Stealth Mode');
            } else if (traitValue.includes('lab coat')) {
              attackRateMultiplier += 0.3;
              abilities.push('Science Boost');
            } else if (traitValue.includes('suit')) {
              defenseMultiplier += 0.3;
              abilities.push('Professional Shield');
            } else if (traitValue.includes('armor')) {
              defenseMultiplier += 0.4;
              abilities.push('Heavy Defense');
            }
            break;

          case 'head':
          case 'headwear':
            if (traitValue.includes('crown')) {
              attackMultiplier += 0.3;
              defenseMultiplier += 0.2;
              abilities.push('Royal Command');
            } else if (traitValue.includes('bandana')) {
              speedMultiplier += 0.15;
              attackRateMultiplier += 0.15;
              abilities.push('Gang Leader');
            } else if (traitValue.includes('helmet')) {
              defenseMultiplier += 0.35;
              abilities.push('Head Protection');
            }
            break;

          case 'background':
            if (traitValue.includes('lab')) {
              attackRateMultiplier += 0.25;
              abilities.push('Tech Support');
            } else if (traitValue.includes('forest')) {
              defenseMultiplier += 0.15;
              manaRegenMultiplier += 0.2;
              abilities.push('Natural Healing');
            } else if (traitValue.includes('city')) {
              speedMultiplier += 0.2;
              abilities.push('Urban Tactics');
            } else if (traitValue.includes('space')) {
              attackMultiplier += 0.2;
              rangeMultiplier += 0.3;
              abilities.push('Cosmic Power');
            }
            break;
        }
      });
    }

    return {
      attackMultiplier: Math.min(2.5, attackMultiplier),
      defenseMultiplier: Math.min(2.5, defenseMultiplier),
      speedMultiplier: Math.min(2.0, speedMultiplier),
      rangeMultiplier: Math.min(1.8, rangeMultiplier),
      attackRateMultiplier: Math.min(2.0, attackRateMultiplier),
      manaRegenMultiplier: Math.min(1.8, manaRegenMultiplier),
      abilities: abilities.slice(0, 3),
      totalBonus: ((attackMultiplier + defenseMultiplier + speedMultiplier) / 3 - 1) * 100
    };
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Notify parent of auth changes
  useEffect(() => {
    onAuthChange(authState);
  }, [authState, onAuthChange]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await fetch('/api/auth/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.authenticated && data.user) {
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          token,
          loading: false
        });
        setActiveTab('profile');
      } else {
        localStorage.removeItem('authToken');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // SOL Wallet Authentication
  const authenticateWithWallet = async () => {
    try {
      setIsLoading(true);

      // Check if wallet is available
      const phantom = (window as any).phantom?.solana;
      if (!phantom) {
        toast.error('Phantom wallet not detected. Please install Phantom wallet.');
        return;
      }

      // Connect to wallet
      const response = await phantom.connect();
      const walletAddress = response.publicKey.toString();

      console.log('🔐 Connected to wallet:', walletAddress);

      // Authenticate with backend
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });

      const authData = await authResponse.json();

      if (authData.success) {
        localStorage.setItem('authToken', authData.token);
        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          token: authData.token,
          loading: false
        });
        setActiveTab('profile');
        toast.success('Successfully authenticated with wallet!');
      } else {
        toast.error(authData.error || 'Wallet authentication failed');
      }
    } catch (error) {
      console.error('Wallet auth error:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email Authentication
  const authenticateWithEmail = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp: otpSent ? otp : undefined })
      });

      const data = await response.json();

      if (data.success && data.user) {
        localStorage.setItem('authToken', data.token);
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          loading: false
        });
        setActiveTab('profile');
        toast.success('Successfully authenticated with email!');
      } else if (data.error === 'OTP sent to email') {
        setOtpSent(true);
        toast.success('OTP sent to your email');
      } else {
        toast.error(data.error || 'Email authentication failed');
      }
    } catch (error) {
      console.error('Email auth error:', error);
      toast.error('Email authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone Authentication
  const authenticateWithPhone = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: phone, otp: otpSent ? otp : undefined })
      });

      const data = await response.json();

      if (data.success && data.user) {
        localStorage.setItem('authToken', data.token);
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          loading: false
        });
        setActiveTab('profile');
        toast.success('Successfully authenticated with phone!');
      } else if (data.error === 'OTP sent to phone') {
        setOtpSent(true);
        toast.success('OTP sent to your phone');
      } else {
        toast.error(data.error || 'Phone authentication failed');
      }
    } catch (error) {
      console.error('Phone auth error:', error);
      toast.error('Phone authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Discord Authentication
  const authenticateWithDiscord = async () => {
    try {
      const discordClientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/discord/callback');
      
      if (!discordClientId) {
        toast.error('Discord authentication not configured');
        return;
      }

      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`;
      
      window.location.href = discordAuthUrl;
    } catch (error) {
      console.error('Discord auth error:', error);
      toast.error('Discord authentication failed');
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false
    });
    setActiveTab('login');
    setOtpSent(false);
    setOtp('');
    toast.success('Logged out successfully');
  };

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
        <span className="ml-2 text-green-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-green-400">
        <button
          onClick={() => setActiveTab('login')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'login'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-green-300 hover:text-green-400'
          }`}
        >
          Login
        </button>
        {authState.isAuthenticated && (
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'profile'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-green-300 hover:text-green-400'
            }`}
          >
            Profile
          </button>
        )}
      </div>

      {/* Login Tab */}
      {activeTab === 'login' && !authState.isAuthenticated && (
        <div className="space-y-6">
          {/* Login Method Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLoginMethod('wallet')}
              className={`p-3 rounded border text-sm font-medium ${
                loginMethod === 'wallet'
                  ? 'bg-green-400 text-black border-green-400'
                  : 'bg-black text-green-400 border-green-400 hover:bg-green-400 hover:text-black'
              }`}
            >
              🔗 Wallet
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className={`p-3 rounded border text-sm font-medium ${
                loginMethod === 'email'
                  ? 'bg-green-400 text-black border-green-400'
                  : 'bg-black text-green-400 border-green-400 hover:bg-green-400 hover:text-black'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`p-3 rounded border text-sm font-medium ${
                loginMethod === 'phone'
                  ? 'bg-green-400 text-black border-green-400'
                  : 'bg-black text-green-400 border-green-400 hover:bg-green-400 hover:text-black'
              }`}
            >
              📱 Phone
            </button>
            <button
              onClick={() => setLoginMethod('discord')}
              className={`p-3 rounded border text-sm font-medium ${
                loginMethod === 'discord'
                  ? 'bg-green-400 text-black border-green-400'
                  : 'bg-black text-green-400 border-green-400 hover:bg-green-400 hover:text-black'
              }`}
            >
              🎮 Discord
            </button>
          </div>

          {/* Wallet Login */}
          {loginMethod === 'wallet' && (
            <div className="space-y-4">
              <p className="text-green-300 text-sm">
                Connect your Solana wallet to access your account
              </p>
              <button
                onClick={authenticateWithWallet}
                disabled={isLoading}
                className="w-full bg-green-400 text-black px-4 py-3 rounded font-medium hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Connect Phantom Wallet'}
              </button>
            </div>
          )}

          {/* Email Login */}
          {loginMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-black border border-green-400 text-green-400 px-3 py-2 rounded focus:outline-none focus:border-green-300"
                />
              </div>
              
              {otpSent && (
                <div>
                  <label className="block text-green-400 text-sm font-medium mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full bg-black border border-green-400 text-green-400 px-3 py-2 rounded focus:outline-none focus:border-green-300"
                  />
                </div>
              )}

              <button
                onClick={authenticateWithEmail}
                disabled={isLoading || !email}
                className="w-full bg-green-400 text-black px-4 py-3 rounded font-medium hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : otpSent ? 'Verify Code' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {/* Phone Login */}
          {loginMethod === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full bg-black border border-green-400 text-green-400 px-3 py-2 rounded focus:outline-none focus:border-green-300"
                />
              </div>
              
              {otpSent && (
                <div>
                  <label className="block text-green-400 text-sm font-medium mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full bg-black border border-green-400 text-green-400 px-3 py-2 rounded focus:outline-none focus:border-green-300"
                  />
                </div>
              )}

              <button
                onClick={authenticateWithPhone}
                disabled={isLoading || !phone}
                className="w-full bg-green-400 text-black px-4 py-3 rounded font-medium hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : otpSent ? 'Verify Code' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {/* Discord Login */}
          {loginMethod === 'discord' && (
            <div className="space-y-4">
              <p className="text-green-300 text-sm">
                Login with your Discord account for instant access
              </p>
              <button
                onClick={authenticateWithDiscord}
                disabled={isLoading}
                className="w-full bg-green-400 text-black px-4 py-3 rounded font-medium hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Redirecting...' : 'Login with Discord'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && authState.isAuthenticated && authState.user && (
        <div className="space-y-6">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Your Gaming Profile</h3>
              <p className="text-green-300 text-sm">ID: {authState.user.userId}</p>
            </div>
            <div className="flex gap-2">
              {onNavigateHome && (
                <button
                  onClick={onNavigateHome}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <ArrowLeft size={16} />
                  Back to Home
                </button>
              )}
              {onNavigateToGame && connectedNFTs.length > 0 && (
                <button
                  onClick={onNavigateToGame}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Gamepad2 size={16} />
                  Play THC CLASH
                </button>
              )}
            </div>
          </div>

          {/* NFT Collection Showcase */}
          {connectedNFTs.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-green-400/30">
              <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                <Sparkles size={20} />
                Your GROWERZ Collection ({connectedNFTs.length} NFTs)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {connectedNFTs.slice(0, 4).map(nft => {
                  const bonuses = calculateNFTBonuses(nft);
                  return (
                    <div key={nft.mint} className="bg-gray-700/50 rounded-lg p-4 border border-green-400/20">
                      <div className="flex items-start gap-3">
                        <img 
                          src={nft.image} 
                          alt={nft.name} 
                          className="w-16 h-16 rounded-lg object-cover border border-green-400/30"
                        />
                        <div className="flex-1">
                          <h5 className="text-white font-semibold text-sm mb-1">{nft.name.split('#')[0]}</h5>
                          <div className="flex items-center gap-2 mb-2">
                            <Crown size={12} className="text-yellow-400" />
                            <span className="text-yellow-400 text-xs font-medium">Rank #{nft.rank}</span>
                          </div>
                          
                          {/* Game Bonuses */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Sword size={12} className="text-red-400" />
                              <span className="text-red-400 text-xs">ATK: +{((bonuses.attackMultiplier - 1) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield size={12} className="text-blue-400" />
                              <span className="text-blue-400 text-xs">DEF: +{((bonuses.defenseMultiplier - 1) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap size={12} className="text-yellow-400" />
                              <span className="text-yellow-400 text-xs">SPD: +{((bonuses.speedMultiplier - 1) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          
                          {/* Special Abilities */}
                          {bonuses.abilities.length > 0 && (
                            <div className="mt-2">
                              <div className="text-purple-400 text-xs font-medium">Abilities:</div>
                              <div className="text-purple-300 text-xs">{bonuses.abilities.join(', ')}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Trait Details */}
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {nft.attributes?.slice(0, 4).map(attr => (
                            <div key={attr.trait_type} className="flex items-center gap-1">
                              {attr.trait_type.toLowerCase() === 'eyes' && <Eye size={10} className="text-green-400" />}
                              {attr.trait_type.toLowerCase().includes('cloth') && <Shirt size={10} className="text-blue-400" />}
                              {attr.trait_type.toLowerCase() === 'head' && <HardHat size={10} className="text-yellow-400" />}
                              {!['eyes', 'head'].includes(attr.trait_type.toLowerCase()) && !attr.trait_type.toLowerCase().includes('cloth') && 
                                <Target size={10} className="text-purple-400" />}
                              <span className="text-gray-300">{attr.trait_type}: </span>
                              <span className="text-white">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Collection Summary */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-4 border border-green-400/30">
                <h5 className="text-white font-bold mb-3">Collection Game Impact</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      +{Math.round(connectedNFTs.reduce((sum, nft) => sum + ((calculateNFTBonuses(nft).attackMultiplier - 1) * 100), 0) / connectedNFTs.length)}%
                    </div>
                    <div className="text-sm text-gray-400">Avg Attack Boost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      +{Math.round(connectedNFTs.reduce((sum, nft) => sum + ((calculateNFTBonuses(nft).defenseMultiplier - 1) * 100), 0) / connectedNFTs.length)}%
                    </div>
                    <div className="text-sm text-gray-400">Avg Defense Boost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {connectedNFTs.reduce((sum, nft) => sum + calculateNFTBonuses(nft).abilities.length, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Total Abilities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {connectedNFTs.length + 4}
                    </div>
                    <div className="text-sm text-gray-400">Available Cards</div>
                  </div>
                </div>
              </div>

              {connectedNFTs.length > 4 && (
                <div className="text-center pt-4">
                  <p className="text-gray-400 text-sm">+ {connectedNFTs.length - 4} more NFTs providing additional game bonuses</p>
                </div>
              )}
            </div>
          )}

          {/* No NFTs Connected */}
          {connectedNFTs.length === 0 && (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-yellow-400/30 text-center">
              <Crown className="text-yellow-400 mx-auto mb-3" size={48} />
              <h4 className="text-lg font-bold text-yellow-400 mb-2">No GROWERZ NFTs Connected</h4>
              <p className="text-gray-300 mb-4">Connect your wallet with GROWERZ NFTs to unlock powerful game bonuses and abilities!</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-red-400 font-bold">Attack Bonuses</div>
                  <div className="text-gray-400">Up to +150% damage</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-blue-400 font-bold">Defense Bonuses</div>
                  <div className="text-gray-400">Up to +150% health</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-yellow-400 font-bold">Speed Bonuses</div>
                  <div className="text-gray-400">Up to +100% speed</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-purple-400 font-bold">Special Abilities</div>
                  <div className="text-gray-400">Unique powers</div>
                </div>
              </div>
            </div>
          )}

          {/* User Information */}
          <div className="space-y-4">
            {authState.user.walletAddress && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <Wallet size={16} />
                  Wallet Address
                </label>
                <p className="text-green-300 text-sm font-mono break-all bg-gray-800/50 p-2 rounded">
                  {authState.user.walletAddress}
                </p>
              </div>
            )}

            {authState.user.email && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <p className="text-green-300 bg-gray-800/50 p-2 rounded">{authState.user.email}</p>
              </div>
            )}

            {authState.user.phoneNumber && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <Phone size={16} />
                  Phone Number
                </label>
                <p className="text-green-300 bg-gray-800/50 p-2 rounded">{authState.user.phoneNumber}</p>
              </div>
            )}

            {authState.user.discord && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1 flex items-center gap-2">
                  <User size={16} />
                  Discord
                </label>
                <p className="text-green-300 bg-gray-800/50 p-2 rounded">
                  {authState.user.discord.username}#{authState.user.discord.discriminator}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1">
                  Account Created
                </label>
                <p className="text-green-300 text-sm bg-gray-800/50 p-2 rounded">
                  {new Date(authState.user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-green-400 text-sm font-medium mb-1">
                  Last Login
                </label>
                <p className="text-green-300 text-sm bg-gray-800/50 p-2 rounded">
                  {new Date(authState.user.lastLogin).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white px-4 py-3 rounded font-medium hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfileAuth;