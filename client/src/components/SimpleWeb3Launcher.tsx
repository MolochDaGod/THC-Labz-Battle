import React, { useState, useEffect } from 'react';
import { Crown, Zap, DollarSign, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleWeb3LauncherProps {
  onStartGame: () => void;
}

export default function SimpleWeb3Launcher({ onStartGame }: SimpleWeb3LauncherProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletBalances, setWalletBalances] = useState({
    sol: 0,
    budz: 0,
    gbux: 0,
    thcLabz: 0
  });

  // Check for existing connection
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      setWalletAddress(savedWallet);
      setIsConnected(true);
      fetchBalances(savedWallet);
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if ((window as any).solana?.isPhantom) {
        const response = await (window as any).solana.connect();
        const address = response.publicKey.toString();
        setWalletAddress(address);
        setIsConnected(true);
        localStorage.setItem('connectedWallet', address);
        await fetchBalances(address);
        toast.success('Wallet connected!');
      } else {
        toast.error('Please install Phantom wallet');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalances = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet/${address}`);
      const data = await response.json();
      if (data.success) {
        setWalletBalances(data.balances);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  const purchaseGBUX = async () => {
    if (!isConnected) {
      toast.error('Connect wallet first');
      return;
    }

    try {
      const response = await fetch('/api/swap/sol-to-gbux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          gbuxAmount: 10,
          solAmount: 1.0
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchBalances(walletAddress);
        toast.success('GBUX purchased successfully!');
      } else {
        toast.error(data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-8 text-center">
          <Crown className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">THC CLASH</h1>
          <p className="text-gray-300 mb-6">Web3 Cannabis Battle Game</p>
          
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Wallet className="w-5 h-5" />
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
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
              onClick={() => {
                setIsConnected(false);
                setWalletAddress('');
                localStorage.removeItem('connectedWallet');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Wallet Balances */}
        <div className="bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Wallet Balances</h2>
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

        {/* Purchase GBUX */}
        <div className="bg-black/80 backdrop-blur-lg border border-purple-400/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Purchase GBUX</h2>
          <p className="text-gray-300 mb-4">Buy 10 GBUX for 1.0 SOL from AI Agent</p>
          <button
            onClick={purchaseGBUX}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <DollarSign className="w-5 h-5" />
            <span>Purchase 10 GBUX (1.0 SOL)</span>
          </button>
        </div>

        {/* Start Game */}
        <div className="bg-black/80 backdrop-blur-lg border border-green-400/30 rounded-xl p-6">
          <div className="text-center">
            <button
              onClick={onStartGame}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <Zap className="w-6 h-6" />
              <span>Start Battle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}