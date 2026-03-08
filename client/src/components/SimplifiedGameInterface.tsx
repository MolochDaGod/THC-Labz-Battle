import React, { useState, useEffect } from 'react';
import { Crown, Grid, Zap, Heart, Sword, Shield, Play, Settings, User } from 'lucide-react';
import AuthenticTHCClashBattle from './AuthenticTHCClashBattle';

interface Card {
  id: string;
  name: string;
  image: string;
  cost: number;
  attack: number;
  health: number;
  rarity: string;
  type: string;
  description: string;
}

interface SimplifiedGameInterfaceProps {
  walletAddress?: string;
  onBack?: () => void;
  gameZones?: any[];
}

export default function SimplifiedGameInterface({ walletAddress, onBack, gameZones }: SimplifiedGameInterfaceProps) {
  const [gameState, setGameState] = useState<'menu' | 'cards' | 'deck' | 'battle'>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Card[]>([]);
  const [nftCaptain, setNftCaptain] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadGameData();
    }
  }, [walletAddress]);

  const loadGameData = async () => {
    setIsLoading(true);
    try {
      // Load cards
      const cardsResponse = await fetch('/api/admin/cards/active/gameplay');
      const cardsData = await cardsResponse.json();
      if (cardsData.success) {
        setCards(cardsData.cards);
      }

      // Load NFT captain
      const nftResponse = await fetch(`/api/my-nfts/${walletAddress}`);
      const nftData = await nftResponse.json();
      if (nftData.success && nftData.nfts?.length > 0) {
        setNftCaptain(nftData.nfts[0]);
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToDeck = (card: Card) => {
    if (selectedDeck.length < 8 && !selectedDeck.find(c => c.id === card.id)) {
      setSelectedDeck([...selectedDeck, card]);
    }
  };

  const removeFromDeck = (cardId: string) => {
    setSelectedDeck(selectedDeck.filter(c => c.id !== cardId));
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-400 bg-gray-800',
      rare: 'border-blue-400 bg-blue-800',
      epic: 'border-purple-400 bg-purple-800',
      legendary: 'border-yellow-400 bg-yellow-800'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  if (gameState === 'battle') {
    return (
      <AuthenticTHCClashBattle 
        gameZones={gameZones} 
        onBattleEnd={() => setGameState('menu')}
        onBack={() => setGameState('menu')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-gray-900 to-black">
      {/* Clean Header */}
      <div className="bg-black/80 backdrop-blur-md border-b border-green-500/30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌿</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">THC CLASH</h1>
              <p className="text-green-400 text-sm">Cannabis Card Battle</p>
            </div>
          </div>
          
          {nftCaptain && (
            <div className="flex items-center space-x-3 bg-yellow-900/40 border border-yellow-400/50 rounded-lg p-3">
              <img
                src={nftCaptain.image}
                alt={nftCaptain.name}
                className="w-10 h-10 rounded-lg border-2 border-yellow-400"
              />
              <div>
                <div className="flex items-center space-x-1">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">{nftCaptain.name}</span>
                </div>
                <p className="text-yellow-300 text-xs">Rank #{nftCaptain.rank}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Main Menu */}
        {gameState === 'menu' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-4 text-center">
                <Grid className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Cards Available</h3>
                <p className="text-2xl font-bold text-blue-400">{cards.length}</p>
              </div>
              
              <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-4 text-center">
                <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Battle Deck</h3>
                <p className="text-2xl font-bold text-purple-400">{selectedDeck.length}/8</p>
              </div>
              
              <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-4 text-center">
                <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">NFT Captain</h3>
                <p className="text-2xl font-bold text-yellow-400">{nftCaptain ? 'Active' : 'None'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setGameState('cards')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <Grid className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Browse Cards</h3>
                <p className="text-blue-200">View your {cards.length} cannabis-themed cards</p>
              </button>

              <button
                onClick={() => setGameState('deck')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <Shield className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">Build Deck</h3>
                <p className="text-purple-200">Create your 8-card battle deck</p>
              </button>
            </div>

            {/* Battle Button */}
            <div className="text-center">
              <button
                onClick={() => setGameState('battle')}
                disabled={selectedDeck.length === 0}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-4 rounded-xl text-xl font-bold transition-all transform hover:scale-105 disabled:scale-100 shadow-lg disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6 inline mr-2" />
                {selectedDeck.length === 0 ? 'Build Deck to Battle' : 'START BATTLE'}
              </button>
            </div>
          </div>
        )}

        {/* Cards View */}
        {gameState === 'cards' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Cannabis Card Collection</h2>
              <button
                onClick={() => setGameState('menu')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Menu
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`relative ${getRarityColor(card.rarity)} border-2 rounded-lg p-3 cursor-pointer hover:scale-105 transition-transform`}
                  onClick={() => addToDeck(card)}
                >
                  <img
                    src={card.image || '/game-assets/cards/default-card.jpg'}
                    alt={card.name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <h4 className="text-white font-semibold text-sm truncate mb-2">{card.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center text-yellow-300">
                      <Zap className="w-3 h-3 mr-1" />
                      {card.cost}
                    </span>
                    <span className="flex items-center text-red-300">
                      <Sword className="w-3 h-3 mr-1" />
                      {card.attack}
                    </span>
                    <span className="flex items-center text-green-300">
                      <Heart className="w-3 h-3 mr-1" />
                      {card.health}
                    </span>
                  </div>
                  {selectedDeck.find(c => c.id === card.id) && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deck Builder */}
        {gameState === 'deck' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Battle Deck ({selectedDeck.length}/8)</h2>
              <button
                onClick={() => setGameState('menu')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Menu
              </button>
            </div>

            <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4">Your Battle Deck</h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-4">
                {[...Array(8)].map((_, index) => {
                  const card = selectedDeck[index];
                  return (
                    <div
                      key={index}
                      className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center ${
                        card ? 'border-green-400 bg-green-900/30' : 'border-gray-500 bg-gray-700'
                      }`}
                    >
                      {card ? (
                        <div 
                          className="w-full h-full relative cursor-pointer"
                          onClick={() => removeFromDeck(card.id)}
                        >
                          <img
                            src={card.image || '/game-assets/cards/default-card.jpg'}
                            alt={card.name}
                            className="w-full h-full object-cover rounded"
                          />
                          <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            ×
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-2xl">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedDeck.length > 0 && (
                <button
                  onClick={() => setSelectedDeck([])}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Deck
                </button>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => setGameState('cards')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Add More Cards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}