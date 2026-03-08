/**
 * Comprehensive User Profile & Authentication Component
 * Supports multiple login methods: SOL wallet, email, phone, Discord
 * All methods link to unified user account
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

interface UserProfileAuthProps {
  onAuthChange: (authState: AuthState) => void;
}

export function UserProfileAuth({ onAuthChange }: UserProfileAuthProps) {
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
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-400 mb-2">User Profile</h3>
            <p className="text-green-300 text-sm">ID: {authState.user.userId}</p>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            {authState.user.walletAddress && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1">
                  Wallet Address
                </label>
                <p className="text-green-300 text-sm font-mono break-all">
                  {authState.user.walletAddress}
                </p>
              </div>
            )}

            {authState.user.email && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1">
                  Email
                </label>
                <p className="text-green-300">{authState.user.email}</p>
              </div>
            )}

            {authState.user.phoneNumber && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1">
                  Phone Number
                </label>
                <p className="text-green-300">{authState.user.phoneNumber}</p>
              </div>
            )}

            {authState.user.discord && (
              <div>
                <label className="block text-green-400 text-sm font-medium mb-1">
                  Discord
                </label>
                <p className="text-green-300">
                  {authState.user.discord.username}#{authState.user.discord.discriminator}
                </p>
              </div>
            )}

            <div>
              <label className="block text-green-400 text-sm font-medium mb-1">
                Account Created
              </label>
              <p className="text-green-300 text-sm">
                {new Date(authState.user.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-green-400 text-sm font-medium mb-1">
                Last Login
              </label>
              <p className="text-green-300 text-sm">
                {new Date(authState.user.lastLogin).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white px-4 py-3 rounded font-medium hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfileAuth;