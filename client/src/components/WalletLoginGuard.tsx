import React, { useState, useEffect } from 'react';
import { Wallet, Shield, Users, Crown } from 'lucide-react';

interface WalletLoginGuardProps {
  children: React.ReactNode;
  onWalletConnect: (address: string) => void;
  onWalletDisconnect: () => void;
  isConnected: boolean;
  walletAddress?: string;
}

export default function WalletLoginGuard({ 
  children, 
  onWalletConnect, 
  onWalletDisconnect, 
  isConnected, 
  walletAddress 
}: WalletLoginGuardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [referralInfo, setReferralInfo] = useState<{source?: string; wallet?: string} | null>(null);

  useEffect(() => {
    detectWallets();
    
    // Check for referral parameters
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const wallet = urlParams.get('wallet');
    
    if (source && wallet) {
      setReferralInfo({ source, wallet });
      console.log(`🔗 Referral detected: ${wallet} from ${source}`);
    }
    
    // Auto-connect disabled to prevent MetaMask conflicts
    // Users must manually connect wallets
  }, []);

  const detectWallets = () => {
    const wallets: string[] = [];
    
    if (window.solana?.isPhantom) wallets.push('Phantom');
    if (window.solflare) wallets.push('Solflare');
    if (window.backpack?.solana) wallets.push('Backpack');
    if (window.magicEden?.solana) wallets.push('Magic Eden');
    if (window.coinbaseSolana) wallets.push('Coinbase');
    
    setAvailableWallets(wallets);
  };

  const connectWallet = async (walletType: string = 'auto') => {
    setIsConnecting(true);
    setError('');

    try {
      let wallet;
      
      switch (walletType) {
        case 'Phantom':
          if (!window.solana?.isPhantom) {
            throw new Error('Phantom wallet not detected. Please install from phantom.app');
          }
          wallet = window.solana;
          break;
          
        case 'Solflare':
          if (!window.solflare) {
            throw new Error('Solflare wallet not detected. Please install from solflare.com');
          }
          wallet = window.solflare;
          break;
          
        case 'Backpack':
          if (!window.backpack?.solana) {
            throw new Error('Backpack wallet not detected. Please install from backpack.app');
          }
          wallet = window.backpack.solana;
          break;
          
        case 'Magic Eden':
          if (!window.magicEden?.solana) {
            throw new Error('Magic Eden wallet not detected. Please install from magiceden.io');
          }
          wallet = window.magicEden.solana;
          break;
          
        default:
          // Auto-detect best available wallet
          if (window.solana?.isPhantom) {
            wallet = window.solana;
          } else if (window.solflare) {
            wallet = window.solflare;
          } else {
            throw new Error('No compatible Solana wallet detected. Please install Phantom, Solflare, or another supported wallet.');
          }
      }

      const response = await wallet.connect();
      const address = response.publicKey.toString();
      
      console.log('🎮 Wallet connected successfully:', address);
      
      // Authenticate with server and create Crossmint wallet
      try {
        const authResponse = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: address,
            signature: null // For now, we're not requiring signature verification
          })
        });

        const authData = await authResponse.json();
        
        if (authData.success) {
          console.log('✅ User authenticated and server wallet created:', authData.serverWallet?.address);
          
          // Store authentication data
          localStorage.setItem('thc_clash_auth', JSON.stringify({
            walletAddress: address,
            serverWallet: authData.serverWallet,
            token: authData.token,
            user: authData.user
          }));
          
          onWalletConnect(address);
        } else {
          throw new Error(authData.error || 'Authentication failed');
        }
      } catch (authError: any) {
        console.error('Authentication failed:', authError);
        setError(`Authentication failed: ${authError.message}`);
        return;
      }
      
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected && walletAddress) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Referral Welcome Message */}
        {referralInfo && referralInfo.source === 'dopebudz' && (
          <div className="bg-gradient-to-r from-green-500/20 to-purple-500/20 backdrop-blur-lg border border-green-400/50 rounded-xl p-4 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">Welcome from THC DOPE BUDZ!</span>
            </div>
            <p className="text-white/80 text-sm">
              Continue your cannabis gaming journey with THC CLASH
            </p>
          </div>
        )}

        {/* Main Login Card */}
        <div className="bg-black/70 backdrop-blur-lg border border-green-400/30 rounded-xl p-8 text-center shadow-2xl">
          <div className="mb-6">
            <Crown className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">THC CLASH</h1>
            <p className="text-gray-300">Web3 Cannabis Battle Game</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Secure Wallet Authentication</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <Users className="w-5 h-5" />
              <span className="text-sm">NFT-Powered Gameplay</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {availableWallets.length > 0 ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">
                Connect your Solana wallet to start playing
              </p>
              
              {availableWallets.map((walletName) => (
                <button
                  key={walletName}
                  onClick={() => connectWallet(walletName)}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-5 h-5" />
                  <span>
                    {isConnecting ? 'Connecting...' : `Connect ${walletName}`}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-yellow-300 text-sm">
                No Solana wallet detected. Please install one of the following:
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <a 
                  href="https://phantom.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-purple-600/50 hover:bg-purple-600/70 p-3 rounded-lg border border-purple-400/30 transition-colors"
                >
                  <div className="font-semibold text-white">Phantom</div>
                  <div className="text-purple-200">phantom.app</div>
                </a>
                
                <a 
                  href="https://solflare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-orange-600/50 hover:bg-orange-600/70 p-3 rounded-lg border border-orange-400/30 transition-colors"
                >
                  <div className="font-semibold text-white">Solflare</div>
                  <div className="text-orange-200">solflare.com</div>
                </a>
              </div>

              <button
                onClick={detectWallets}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Refresh wallet detection
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-600">
            <p className="text-gray-400 text-xs">
              Secure login • No passwords required • NFT ownership verified
            </p>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-4 bg-black/50 backdrop-blur-lg border border-gray-600/30 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Game Requirements</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Solana wallet (Phantom, Solflare, etc.)</li>
            <li>• GROWERZ NFT for enhanced gameplay</li>
            <li>• SOL for transaction fees</li>
          </ul>
        </div>
      </div>
    </div>
  );
}