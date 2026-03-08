/**
 * Growerz Hub Tab Integration
 * Embeds the existing Growerz Hub game without modifications
 * Provides cross-game wallet state synchronization
 */

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface GrowerHubTabProps {
  walletAddress?: string;
  onClose?: () => void;
}

export function GrowerHubTab({ walletAddress, onClose }: GrowerHubTabProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const gameState = useGameStore((state) => state.gameState);

  // Sync wallet state with Growerz Hub
  const syncWalletState = async () => {
    if (!walletAddress) return;

    try {
      setSyncStatus('syncing');
      const response = await fetch(`/api/growerz-hub/sync/${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus('synced');
        console.log('🌱 Wallet state synced with Growerz Hub:', data);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Wallet sync error:', error);
      setSyncStatus('error');
    }
  };

  // Setup cross-game communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Growerz Hub
      if (event.origin !== 'https://growerz.thc-labz.xyz') return;

      const { type, data } = event.data;
      console.log('🌱 Received from Growerz Hub:', { type, data });

      switch (type) {
        case 'GROWERZ_READY':
          console.log('🌱 Growerz Hub loaded and ready');
          setIsLoading(false);
          sendToGrowerHub('WALLET_STATE', getCurrentWalletState());
          break;
          
        case 'GROWERZ_SCORE_UPDATE':
          console.log('🌱 Growerz score update:', data);
          // Could trigger achievement checks in Dope Budz
          break;
          
        case 'GROWERZ_NFT_EQUIPPED':
          console.log('🌱 NFT equipped in Growerz Hub:', data);
          // Apply cross-game NFT benefits
          break;
          
        case 'GROWERZ_ACHIEVEMENT_UNLOCKED':
          console.log('🌱 Growerz achievement unlocked:', data);
          // Sync achievement systems
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send messages to Growerz Hub
  const sendToGrowerHub = (type: string, data: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type, data }, 
        'https://growerz.thc-labz.xyz'
      );
    }
  };

  // Get current wallet state from Dope Budz
  const getCurrentWalletState = () => {
    const walletData = JSON.parse(localStorage.getItem('walletData') || '{}');
    
    return {
      type: 'WALLET_STATE',
      gameState: {
        money: gameState.money || 0,
        day: gameState.day || 1,
        health: gameState.health || 100,
        currentCity: gameState.currentCity || 'hometown',
        achievements: gameState.achievements || []
      },
      wallet: {
        address: walletData.address,
        type: walletData.type,
        connected: walletData.connected,
        serverWallet: walletData.serverWallet,
        budzBalance: walletData.budzBalance || 0,
        gbuxBalance: walletData.gbuxBalance || 0,
        thcLabzTokenBalance: walletData.thcLabzTokenBalance || 0
      },
      source: 'thc-dope-budz',
      timestamp: new Date().toISOString()
    };
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setTimeout(() => {
      sendToGrowerHub('WALLET_STATE', getCurrentWalletState());
      syncWalletState();
    }, 1000);
  };

  // Generate Growerz Hub URL with integration parameters
  const getGrowerHubUrl = () => {
    const baseUrl = 'https://growerz.thc-labz.xyz';
    const params = new URLSearchParams({
      wallet: walletAddress || '',
      source: 'thc-dope-budz',
      integration: 'true',
      mode: 'embedded'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-green-400 mb-2">Growerz Hub</h3>
          <p className="text-gray-400 mb-4">Connect your wallet to access the Growerz Hub mini-game</p>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              Wallet connection required to sync your GROWERZ NFTs and game progress
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/80 backdrop-blur-sm">
      {/* Header with sync status */}
      <div className="flex items-center justify-between p-4 border-b border-green-500/30">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-green-400">🌱 Growerz Hub</h2>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-400' :
              syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
              syncStatus === 'error' ? 'bg-red-400' :
              'bg-gray-400'
            }`} />
            <span className="text-gray-400">
              {syncStatus === 'synced' ? 'Synced' :
               syncStatus === 'syncing' ? 'Syncing...' :
               syncStatus === 'error' ? 'Sync Error' :
               'Ready'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={syncWalletState}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Wallet'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center h-20 border-b border-green-500/30">
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading Growerz Hub...</span>
          </div>
        </div>
      )}

      {/* Growerz Hub iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={getGrowerHubUrl()}
          className="w-full h-full border-none"
          title="Growerz Hub"
          onLoad={handleIframeLoad}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
          allow="clipboard-read; clipboard-write; web-share"
        />
      </div>

      {/* Integration info footer */}
      <div className="p-3 bg-gray-900/50 border-t border-green-500/30">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>🔗 Integrated with THC Dope Budz</span>
          <span>Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
        </div>
      </div>
    </div>
  );
}