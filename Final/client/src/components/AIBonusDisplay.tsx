import React, { useState, useEffect } from 'react';
import { getAIBonusSummary, getAIBonusState } from '../lib/ai-bonus-manager';

interface AIBonusDisplayProps {
  onDeactivate?: () => void;
}

export function AIBonusDisplay({ onDeactivate }: AIBonusDisplayProps) {
  const [bonusSummary, setBonusSummary] = useState<any>(null);
  const [bonusState, setBonusState] = useState<any>(null);

  useEffect(() => {
    const updateBonusDisplay = async () => {
      const summary = getAIBonusSummary();
      const state = getAIBonusState();
      setBonusSummary(summary);
      setBonusState(state);
      
      // Check if we have an NFT selected but AI bonuses not initialized
      const storedNFT = localStorage.getItem('selectedPlugNft');
      if (storedNFT && !state.isActive) {
        try {
          const nftData = JSON.parse(storedNFT);
          if (nftData.mint) {
            console.log('🤖 Initializing AI bonuses from localStorage NFT:', nftData.mint);
            const { initializeAIBonuses } = await import('../lib/ai-bonus-manager');
            await initializeAIBonuses(nftData.mint);
            
            // Update state after initialization
            const newState = getAIBonusState();
            setBonusState(newState);
          }
        } catch (error) {
          console.error('Error initializing AI bonuses from localStorage:', error);
        }
      }
    };

    // Initial load
    updateBonusDisplay();

    // Update every 2 seconds to show real-time bonus effects
    const interval = setInterval(updateBonusDisplay, 2000);

    return () => clearInterval(interval);
  }, []);

  // Check if we have an NFT selected in localStorage
  const storedSelectedAssistant = localStorage.getItem('selectedPlugNft');
  const hasActiveAssistant = bonusState?.isActive || storedSelectedAssistant;

  if (!bonusSummary || (!bonusState?.isActive && !storedSelectedAssistant)) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-400 mb-2">AI Assistant Inactive</h3>
          <p className="text-gray-500 text-sm mb-4">
            Select a GROWERZ NFT from "MY NFTS" tab to activate your AI assistant and unlock gameplay bonuses.
          </p>
          <div className="bg-gray-700 p-3 rounded border border-gray-600">
            <p className="text-xs text-gray-400">
              <strong>Available Bonuses:</strong> Market price improvements, heat reduction, profit multipliers, conversation rewards
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 p-4 rounded-lg border border-green-400/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🤖</div>
          <div>
            <h3 className="text-lg font-bold text-green-400">AI Assistant Active</h3>
            <p className="text-sm text-gray-300">Providing real-time gameplay bonuses</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{bonusSummary.totalEffectiveness}</div>
          <div className="text-xs text-gray-400">Total Effectiveness</div>
        </div>
      </div>

      {/* NFT Info Display */}
      {bonusState.nftMint && (
        <div className="bg-gray-800/50 p-3 rounded mb-4 border border-gray-600">
          <div className="flex items-center gap-3">
            <div className="text-yellow-400">🏆</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Active GROWERZ NFT</p>
              <p className="text-xs text-gray-400">Mint: {bonusState.nftMint.slice(0, 8)}...{bonusState.nftMint.slice(-4)}</p>
            </div>
            <div className="text-xs text-green-400 font-bold">ACTIVE</div>
          </div>
        </div>
      )}

      {/* Active Bonuses Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-900/30 p-3 rounded border border-blue-400/30">
          <div className="text-lg font-bold text-blue-400">{bonusSummary.marketBonus}</div>
          <div className="text-xs text-gray-300">Market Deals</div>
          <div className="text-xs text-gray-500">Buy/Sell prices</div>
        </div>
        <div className="bg-purple-900/30 p-3 rounded border border-purple-400/30">
          <div className="text-lg font-bold text-purple-400">{bonusSummary.stealthBonus}</div>
          <div className="text-xs text-gray-300">Stealth Mode</div>
          <div className="text-xs text-gray-500">Heat reduction</div>
        </div>
        <div className="bg-yellow-900/30 p-3 rounded border border-yellow-400/30">
          <div className="text-lg font-bold text-yellow-400">{bonusSummary.profitBonus}</div>
          <div className="text-xs text-gray-300">Profit Boost</div>
          <div className="text-xs text-gray-500">Extra earnings</div>
        </div>
      </div>

      {/* Active Skills */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-300 mb-2">Active NFT Traits & Skills</h4>
        <div className="space-y-1">
          {bonusSummary.activeSkills.slice(0, 4).map((skill: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-300">{skill}</span>
            </div>
          ))}
          {bonusSummary.activeSkills.length > 4 && (
            <div className="text-xs text-gray-500 ml-4">
              +{bonusSummary.activeSkills.length - 4} more skills active...
            </div>
          )}
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-300">Real-time bonuses applied to all transactions</span>
          </div>
          <div className="text-xs text-gray-500">
            Last update: {new Date(bonusState.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Deactivate Option */}
      {onDeactivate && (
        <button
          onClick={onDeactivate}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors"
        >
          🚫 Deactivate AI Assistant
        </button>
      )}
    </div>
  );
}