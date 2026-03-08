import { useState, useEffect } from 'react';
import { Wallet, Settings, Play, Shield, Zap, Target, Star, Crown, Gamepad2, TrendingUp, Users, Trophy, Sparkles, ArrowRight, CheckCircle, Info } from 'lucide-react';
import RealNFTTHCClash from './RealNFTTHCClash';
import AnimatedGameOnboarding from './AnimatedGameOnboarding';
import THCClashCardGame from './THCClashCardGame';
import THCClashGameContainer from './THCClashGameContainer';
import THCClashTabsSimple from './THCClashTabsSimple';
import WalletLoginGuard from './WalletLoginGuard';
import { NFTTraitProvider } from '../contexts/NFTTraitContext';
// Import will be added when component is available
// import GrowerzGameOnboarding from './GrowerzGameOnboarding';

interface GameOnboardingMainProps {
  onNFTsConnected?: (nfts: any[]) => void;
  gameZones?: any[];
}

export default function GameOnboardingMain({ onNFTsConnected, gameZones }: GameOnboardingMainProps) {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connectedNFTs, setConnectedNFTs] = useState<any[]>([]);
  const [gameImpacts, setGameImpacts] = useState<any[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'onboarding' | 'thc-clash' | 'card-game' | 'tabs'>('tabs');

  // Check for existing wallet connection and URL parameters on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Check URL parameters for incoming users from THC DOPE BUDZ
        const urlParams = new URLSearchParams(window.location.search);
        const referrerWallet = urlParams.get('wallet');
        const referrerSource = urlParams.get('source');
        const userToken = urlParams.get('token');
        
        console.log('🔗 URL Parameters:', { referrerWallet, referrerSource, userToken });
        
        // If coming from THC DOPE BUDZ with wallet parameter
        if (referrerWallet && referrerSource === 'dopebudz') {
          console.log('🌿 User coming from THC DOPE BUDZ with wallet:', referrerWallet);
          setWalletAddress(referrerWallet);
          await loadUserNFTs(referrerWallet);
          
          // Store referrer info for analytics
          try {
            await fetch('/api/track-referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                wallet: referrerWallet, 
                source: 'dopebudz',
                timestamp: new Date().toISOString(),
                token: userToken
              })
            });
          } catch (error) {
            console.warn('Referral tracking failed:', error);
          }
          
          // Clean URL after processing
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        // Auto-connect disabled to prevent MetaMask conflicts
        // Check only if wallet is already connected without triggering connection
        if (typeof window.solana !== 'undefined' && window.solana.isConnected) {
          try {
            // Access publicKey from already connected wallet without triggering connect
            const publicKey = (window.solana as any).publicKey;
            if (publicKey) {
              const address = publicKey.toString();
              if (address && !walletAddress) {
                console.log('🔌 Found existing wallet connection:', address);
                setWalletAddress(address);
                await loadUserNFTs(address);
              }
            }
          } catch (error) {
            console.log('No existing wallet connection found');
          }
        }
      } catch (error) {
        console.error('Error checking existing wallet connection:', error);
      }
    };

    checkExistingConnection();
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (walletAddress) {
      checkAdminStatus();
    }
  }, [walletAddress]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`/api/admin/check/${walletAddress}`);
      const data = await response.json();
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.solana !== 'undefined') {
        setLoading(true);
        const response = await window.solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        
        // Load user's NFTs
        await loadUserNFTs(address);
      } else {
        alert('Please install a Solana wallet like Phantom or Solflare');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserNFTs = async (address: string) => {
    try {
      const response = await fetch(`/api/my-nfts/${address}`);
      const data = await response.json();
      
      if (data.success && data.nfts) {
        setConnectedNFTs(data.nfts);
        
        // Share NFTs with parent component (App)
        if (onNFTsConnected) {
          onNFTsConnected(data.nfts);
        }
        
        // Calculate game impacts
        await calculateGameImpacts(data.nfts);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  const calculateGameImpacts = async (nfts: any[]) => {
    try {
      const response = await fetch('/api/calculate-game-impacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfts })
      });
      
      const data = await response.json();
      if (data.success) {
        setGameImpacts(data.impacts || []);
      }
    } catch (error) {
      console.error('Error calculating game impacts:', error);
    }
  };

  // Show THC CLASH game if selected
  if (currentView === 'thc-clash' && connectedNFTs.length > 0) {
    return (
      <RealNFTTHCClash 
        playerNFTs={connectedNFTs} 
        onBack={() => setCurrentView('onboarding')} 
      />
    );
  }

  // Show Card Game if selected
  if (currentView === 'card-game') {
    return (
      <THCClashGameContainer 
        playerNFTs={connectedNFTs} 
        onBack={() => setCurrentView('onboarding')} 
      />
    );
  }

  // Show Tabbed Interface
  if (currentView === 'tabs') {
    return (
      <NFTTraitProvider>
        <THCClashTabsSimple
          playerWallet={walletAddress}
          playerNFT={connectedNFTs[0] || null}
          onWalletConnect={connectWallet}
          onWalletDisconnect={() => {
            setWalletAddress('');
            setConnectedNFTs([]);
            setGameImpacts([]);
          }}
          gameZones={gameZones}
        />
      </NFTTraitProvider>
    );
  }

  // Use the enhanced animated onboarding instead of the basic version
  return (
    <AnimatedGameOnboarding 
      walletAddress={walletAddress}
      connectedNFTs={connectedNFTs}
      onConnectWallet={connectWallet}
      onStartGame={() => setCurrentView('tabs')}
      loading={loading}
    />
  );

  // Legacy code kept for reference but not used
  const legacyOnboarding = (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            THC CLASH
          </h1>
          <p className="text-green-400 text-lg">
            Onboard your GROWERZ NFTs for multi-game bonuses and experiences
          </p>
        </div>

        {walletAddress && (
          <div className="space-y-8">
            {/* Wallet Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Connected Wallet</h3>
                  <p className="text-green-400 font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</p>
                  <p className="text-gray-300 mt-2">{connectedNFTs.length} GROWERZ NFTs detected</p>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdmin(true)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Settings size={18} />
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => setWalletAddress('')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Game Impacts */}
            {gameImpacts.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Your Game Impact Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gameImpacts.map((impact, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/50 rounded-lg p-6 border border-green-500/20"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Play className="text-green-400" size={24} />
                        <div>
                          <h4 className="text-lg font-bold text-white">{impact.gameType}</h4>
                          <p className="text-gray-400 text-sm">{impact.category}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="text-yellow-400" size={16} />
                          <span className="text-white font-semibold">
                            Impact Score: {impact.totalImpactScore}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300">
                          {impact.bonuses.length} active bonuses
                        </div>
                      </div>

                      <div className="space-y-2">
                        {impact.bonuses.slice(0, 3).map((bonus: any, bonusIndex: number) => (
                          <div
                            key={bonusIndex}
                            className="bg-gray-600/50 rounded p-2 text-xs"
                          >
                            <div className="text-green-400 font-semibold">
                              {bonus.bonusType || bonus.type}: +{bonus.bonusValue || bonus.value}
                            </div>
                            <div className="text-gray-300">
                              {bonus.traitType}: {bonus.traitValue}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              {bonus.description}
                            </div>
                          </div>
                        ))}
                        {impact.bonuses.length > 3 && (
                          <div className="text-gray-400 text-xs text-center">
                            +{impact.bonuses.length - 3} more bonuses
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NFT Grid */}
            {connectedNFTs.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Your GROWERZ NFTs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {connectedNFTs.slice(0, 12).map((nft, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-600/50 transition-colors"
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full aspect-square object-cover rounded mb-2"
                      />
                      <div className="text-white text-sm font-semibold truncate">
                        {nft.name}
                      </div>
                      <div className="text-green-400 text-xs">
                        Rank #{nft.rank || 'N/A'}
                      </div>
                    </div>
                  ))}
                  {connectedNFTs.length > 12 && (
                    <div className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <div className="text-lg font-bold">+{connectedNFTs.length - 12}</div>
                        <div className="text-xs">more NFTs</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {connectedNFTs.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Ready to Play!</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentView('card-game')}
                    className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    <Play size={24} />
                    Play THC CLASH
                  </button>
                  <button
                    onClick={() => window.location.pathname = '/collection'}
                    className="flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    <Star size={24} />
                    Browse Collection
                  </button>
                </div>
              </div>
            )}

            {/* No NFTs Message */}
            {connectedNFTs.length === 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
                <Shield className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">No GROWERZ NFTs Found</h3>
                <p className="text-gray-300 mb-4">
                  This wallet doesn't contain any THC GROWERZ collection NFTs.
                </p>
                <button
                  onClick={() => window.location.pathname = '/collection'}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Browse GROWERZ Collection
                </button>
              </div>
            )}
          </div>
        )}

        {/* Admin Panel Modal */}
        {showAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-8 rounded-lg max-w-md">
              <h2 className="text-xl text-green-400 mb-4">Admin Panel</h2>
              <p className="text-gray-300 mb-4">Admin functionality will be available soon.</p>
              <button
                onClick={() => setShowAdmin(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}