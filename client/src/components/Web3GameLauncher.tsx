import React, { useState, useEffect } from 'react';
import { Wallet, Crown, ShoppingCart, Zap, Star, DollarSign, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface GrowerNFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface WalletBalances {
  sol: number;
  budz: number;
  gbux: number;
  thcLabz: number;
}

interface Web3GameLauncherProps {
  onGameStart: (selectedCaptain?: GrowerNFT, walletAddress?: string) => void;
}

export default function Web3GameLauncher({ onGameStart }: Web3GameLauncherProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [growerNFTs, setGrowerNFTs] = useState<GrowerNFT[]>([]);
  const [selectedCaptain, setSelectedCaptain] = useState<GrowerNFT | null>(null);
  const [walletBalances, setWalletBalances] = useState<WalletBalances>({
    sol: 0, budz: 0, gbux: 0, thcLabz: 0
  });
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [gbuxAmount, setGbuxAmount] = useState<number>(10);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setIsConnected(true);
      fetchGrowerNFTs(savedWallet);
      fetchWalletBalances(savedWallet);
    }
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      let wallet;
      
      // Detect available wallets
      if ((window as any).solana?.isPhantom) {
        wallet = (window as any).solana;
      } else if ((window as any).solflare) {
        wallet = (window as any).solflare;
      } else if ((window as any).backpack?.solana) {
        wallet = (window as any).backpack.solana;
      } else if ((window as any).magicEden?.solana) {
        wallet = (window as any).magicEden.solana;
      } else {
        throw new Error('No compatible Solana wallet detected. Please install Phantom, Solflare, or another supported wallet.');
      }

      const response = await wallet.connect();
      const address = response.publicKey.toString();
      
      setWalletAddress(address);
      setIsConnected(true);
      localStorage.setItem('connectedWallet', address);
      
      // Fetch user's GROWER NFTs and balances
      await Promise.all([
        fetchGrowerNFTs(address),
        fetchWalletBalances(address)
      ]);
      
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch GROWER NFTs from user's wallet
  const fetchGrowerNFTs = async (address: string) => {
    setIsLoadingNFTs(true);
    try {
      const response = await fetch(`/api/my-nfts/${address}`);
      const data = await response.json();
      
      if (data.success && data.nfts) {
        setGrowerNFTs(data.nfts);
        
        // Auto-select first NFT as captain if available
        if (data.nfts.length > 0 && !selectedCaptain) {
          setSelectedCaptain(data.nfts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch GROWER NFTs:', error);
      toast.error('Failed to load your GROWER NFTs');
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  // Fetch wallet token balances
  const fetchWalletBalances = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet/${address}`);
      const data = await response.json();
      
      if (data.success) {
        setWalletBalances(data.balances);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
    }
  };

  // Purchase GBUX with SOL from AI agent wallet
  const purchaseGBUX = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    const requiredSOL = gbuxAmount * 0.1; // 0.1 SOL per GBUX
    
    if (walletBalances.sol < requiredSOL) {
      toast.error(`Insufficient SOL. Need ${requiredSOL} SOL for ${gbuxAmount} GBUX`);
      return;
    }

    setIsSwapping(true);
    try {
      const response = await fetch('/api/swap/sol-to-gbux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          gbuxAmount,
          solAmount: requiredSOL
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh wallet balances
        await fetchWalletBalances(walletAddress);
        toast.success(`Successfully purchased ${gbuxAmount} GBUX for ${requiredSOL} SOL!`);
      } else {
        toast.error(data.error || 'Swap failed');
      }
    } catch (error) {
      console.error('GBUX purchase failed:', error);
      toast.error('Failed to purchase GBUX');
    } finally {
      setIsSwapping(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setGrowerNFTs([]);
    setSelectedCaptain(null);
    setWalletBalances({ sol: 0, budz: 0, gbux: 0, thcLabz: 0 });
    localStorage.removeItem('connectedWallet');
    toast.success('Wallet disconnected');
  };

  // Start game with selected captain
  const startGame = () => {
    onGameStart(selectedCaptain || undefined, walletAddress);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-8 text-center">
          <Crown className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">THC CLASH</h1>
          <p className="text-gray-300 mb-6">Web3 Cannabis Battle Game</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <Crown className="w-5 h-5" />
              <span className="text-sm">GROWER NFTs as Captains</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-blue-400">
              <Coins className="w-5 h-5" />
              <span className="text-sm">GBUX Token Economy</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-purple-400">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">0.1 SOL = 1 GBUX</span>
            </div>
          </div>

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Wallet className="w-5 h-5" />
            <span>{isConnecting ? 'Connecting...' : 'Connect Solana Wallet'}</span>
          </button>

          <div className="mt-6 pt-4 border-t border-gray-600">
            <p className="text-gray-400 text-xs">
              Connect wallet • Select GROWER captain • Purchase GBUX • Play to earn
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">THC CLASH</h1>
              <p className="text-green-400">Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</p>
            </div>
            <button
              onClick={disconnectWallet}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Wallet Balances */}
        <div className="bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Wallet className="w-6 h-6 mr-2" />
            Wallet Balances
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-900/50 p-4 rounded-lg text-center">
              <p className="text-blue-300 text-sm">SOL</p>
              <p className="text-white font-bold text-lg">{walletBalances.sol.toFixed(3)}</p>
            </div>
            <div className="bg-green-900/50 p-4 rounded-lg text-center">
              <p className="text-green-300 text-sm">BUDZ</p>
              <p className="text-white font-bold text-lg">{walletBalances.budz}</p>
            </div>
            <div className="bg-purple-900/50 p-4 rounded-lg text-center">
              <p className="text-purple-300 text-sm">GBUX</p>
              <p className="text-white font-bold text-lg">{walletBalances.gbux}</p>
            </div>
            <div className="bg-yellow-900/50 p-4 rounded-lg text-center">
              <p className="text-yellow-300 text-sm">THC LABZ</p>
              <p className="text-white font-bold text-lg">{walletBalances.thcLabz}</p>
            </div>
          </div>
        </div>

        {/* GBUX Purchase Section */}
        <div className="bg-black/80 backdrop-blur-lg border border-purple-400/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2" />
            Purchase GBUX Tokens
          </h2>
          <p className="text-gray-300 mb-4">Exchange rate: 1 GBUX = 0.1 SOL from AI Agent Wallet</p>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-2">GBUX Amount</label>
              <input
                type="number"
                value={gbuxAmount}
                onChange={(e) => setGbuxAmount(Number(e.target.value))}
                min="1"
                max="100"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-2">SOL Required</label>
              <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-green-400 font-mono">
                {(gbuxAmount * 0.1).toFixed(3)} SOL
              </div>
            </div>
          </div>
          
          <button
            onClick={purchaseGBUX}
            disabled={isSwapping || walletBalances.sol < gbuxAmount * 0.1}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Coins className="w-5 h-5" />
            <span>{isSwapping ? 'Swapping...' : `Purchase ${gbuxAmount} GBUX`}</span>
          </button>
        </div>

        {/* Captain Selection */}
        <div className="bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Crown className="w-6 h-6 mr-2" />
            Select Your Captain
          </h2>
          
          {isLoadingNFTs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading your GROWER NFTs...</p>
            </div>
          ) : growerNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {growerNFTs.map((nft) => (
                <div
                  key={nft.mint}
                  onClick={() => setSelectedCaptain(nft)}
                  className={`cursor-pointer border-2 rounded-xl p-4 transition-all transform hover:scale-105 ${
                    selectedCaptain?.mint === nft.mint
                      ? 'border-gold-400 bg-gold-400/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-green-400'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    {selectedCaptain?.mint === nft.mint && (
                      <div className="absolute top-2 right-2 bg-gold-400 text-black rounded-full p-1">
                        <Crown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-white font-bold truncate">{nft.name}</h3>
                  <p className="text-gray-400 text-sm">Rank #{nft.rank}</p>
                  <div className="flex items-center mt-2">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-yellow-400 text-sm">Captain Bonuses</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No GROWER NFTs found in your wallet</p>
              <p className="text-gray-500 text-sm">You can still play without a captain, but you'll miss out on bonus abilities</p>
            </div>
          )}
        </div>

        {/* Game Start Section */}
        <div className="bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-6">
          <div className="text-center">
            {selectedCaptain && (
              <div className="mb-4 p-4 bg-green-900/50 rounded-lg">
                <p className="text-green-300 mb-2">Selected Captain:</p>
                <p className="text-white font-bold">{selectedCaptain.name}</p>
                <p className="text-gray-400 text-sm">Rank #{selectedCaptain.rank}</p>
              </div>
            )}
            
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <Zap className="w-6 h-6" />
              <span>Start Battle</span>
            </button>
            
            <p className="text-gray-400 text-sm mt-4">
              {selectedCaptain 
                ? 'Ready to battle with your captain!' 
                : 'Playing without captain - consider getting a GROWER NFT for enhanced gameplay'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}