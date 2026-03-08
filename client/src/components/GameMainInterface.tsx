import React, { useState, useEffect } from 'react';
import { Crown, Grid, Coins, ArrowLeft, Wallet, Shield } from 'lucide-react';
import NFTTab from './NFTTab';
import CardTab from './CardTab';
import AuthenticTHCClashBattle from './AuthenticTHCClashBattle';
import UniversalHeader from './UniversalHeader';

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

interface GameMainInterfaceProps {
  walletAddress?: string;
  onBack?: () => void;
  gameZones?: any[];
}

export default function GameMainInterface({ walletAddress, onBack, gameZones }: GameMainInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'nft' | 'cards' | 'deck' | 'battle'>('nft');
  const [selectedCaptain, setSelectedCaptain] = useState<GrowerNFT | null>(null);
  const [walletBalances, setWalletBalances] = useState({
    sol: 0,
    budz: 0,
    gbux: 0,
    thcLabz: 0
  });
  const [nftCards, setNftCards] = useState<any[]>([]);
  const [filteredCards, setFilteredCards] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any[]>(() => {
    try {
      const savedDeck = localStorage.getItem('thc-clash-battle-deck');
      return savedDeck ? JSON.parse(savedDeck) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Always fetch classification cards for gameplay
    fetchClassificationCards();
    
    // Only fetch wallet-specific data if wallet is connected
    if (walletAddress) {
      fetchWalletBalances();
      fetchNFTCaptain();
    }
  }, [walletAddress]);

  const fetchNFTCaptain = async () => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`/api/my-nfts/${walletAddress}`);
      const data = await response.json();
      
      if (data.success && data.nfts && data.nfts.length > 0) {
        // Get the first (highest rank) NFT as captain
        const captain = data.nfts[0];
        setSelectedCaptain(captain);
        console.log('✅ Auto-selected NFT captain:', captain.name);
      }
    } catch (error) {
      console.error('Failed to fetch NFT captain:', error);
    }
  };

  const fetchClassificationCards = async () => {
    try {
      const response = await fetch('/api/admin/cards/active/gameplay');
      const data = await response.json();
      
      if (data.success && data.cards) {
        setFilteredCards(data.cards);
        console.log('✅ Loaded classification cards for bottom interface:', data.cards.length);
      }
    } catch (error) {
      console.error('Failed to fetch classification cards:', error);
    }
  };

  const fetchWalletBalances = async () => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`/api/wallet/${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setWalletBalances(data.balances);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
    }
  };

  const handleCaptainSelect = (nft: GrowerNFT) => {
    setSelectedCaptain(nft);
    localStorage.setItem('thc-clash-selected-captain', JSON.stringify(nft));
  };

  const handleCardPurchase = (card: any) => {
    // Refresh balances after purchase
    fetchWalletBalances();
  };

  const addToDeck = (card: any) => {
    if (selectedDeck.length < 8 && !selectedDeck.find(c => c.id === card.id)) {
      const newDeck = [...selectedDeck, card];
      setSelectedDeck(newDeck);
      localStorage.setItem('thc-clash-battle-deck', JSON.stringify(newDeck));
      console.log('✅ Added card to battle deck:', card.name, 'Deck size:', newDeck.length);
    }
  };

  const removeFromDeck = (cardId: string) => {
    const newDeck = selectedDeck.filter(c => c.id !== cardId);
    setSelectedDeck(newDeck);
    localStorage.setItem('thc-clash-battle-deck', JSON.stringify(newDeck));
    console.log('✅ Removed card from battle deck, new size:', newDeck.length);
  };

  const handleBattleEnd = (result: any) => {
    console.log('Battle ended:', result);
    // Could show battle results, update stats, etc.
  };

  if (activeTab === 'battle') {
    return (
      <AuthenticTHCClashBattle 
        gameZones={gameZones} 
        onBattleEnd={handleBattleEnd}
        onBack={() => setActiveTab('nft')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900 relative">
      {/* Background Cannabis Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-6xl">🌿</div>
        <div className="absolute top-32 right-20 text-4xl">🍃</div>
        <div className="absolute bottom-20 left-20 text-5xl">🌱</div>
        <div className="absolute bottom-40 right-10 text-3xl">💚</div>
      </div>
      
      <div className="max-w-6xl mx-auto p-4 relative z-10 pb-80">
        {/* Enhanced Header */}
        <div className="bg-black/90 backdrop-blur-xl border border-green-400/40 rounded-2xl p-6 mb-6 shadow-2xl shadow-green-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
              )}
              <div>
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8 text-green-400" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    THC CLASH
                  </h1>
                </div>
                {walletAddress && (
                  <p className="text-green-400 text-sm flex items-center space-x-2 mt-1">
                    <Wallet className="w-4 h-4" />
                    <span>Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Enhanced Wallet Balances */}
            {walletAddress && (
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-900/60 to-purple-800/60 border border-purple-400/40 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-purple-400" />
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{walletBalances.gbux}</div>
                      <div className="text-purple-300 text-xs">GBUX</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-900/60 to-blue-800/60 border border-blue-400/40 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{walletBalances.sol.toFixed(3)}</div>
                      <div className="text-blue-300 text-xs">SOL</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-900/60 to-green-800/60 border border-green-400/40 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="text-green-400 text-lg">🌿</div>
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{walletBalances.budz}</div>
                      <div className="text-green-300 text-xs">BUDZ</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-black/70 backdrop-blur-xl border border-gray-500/50 rounded-2xl p-3 mb-6 shadow-lg">
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('nft')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'nft'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gray-700/40 text-gray-300 hover:bg-gray-600/60 hover:text-white'
              }`}
            >
              <Crown className="w-6 h-6" />
              <span className="hidden sm:inline">NFT Captains</span>
              <span className="sm:hidden">NFTs</span>
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'cards'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700/40 text-gray-300 hover:bg-gray-600/60 hover:text-white'
              }`}
            >
              <Grid className="w-6 h-6" />
              <span className="hidden sm:inline">Classification Cards</span>
              <span className="sm:hidden">Cards</span>
            </button>
            <button
              onClick={() => setActiveTab('deck')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'deck'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700/40 text-gray-300 hover:bg-gray-600/60 hover:text-white'
              }`}
            >
              <Shield className="w-6 h-6" />
              <span className="hidden sm:inline">Battle Deck ({selectedDeck.length}/8)</span>
              <span className="sm:hidden">Deck</span>
            </button>
            <button
              onClick={() => setActiveTab('battle')}
              disabled={selectedDeck.length === 0}
              className="flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white transition-all duration-300 transform hover:scale-105 disabled:scale-100 ml-auto shadow-lg shadow-red-500/30 disabled:cursor-not-allowed"
            >
              <span className="text-xl">⚔️</span>
              <span className="hidden sm:inline">{selectedDeck.length === 0 ? 'Build Deck First' : 'Battle Now'}</span>
              <span className="sm:hidden">Battle</span>
            </button>
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="bg-black/70 backdrop-blur-xl border border-gray-500/50 rounded-2xl p-6 shadow-xl">
          {!walletAddress && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-yellow-400" />
                <div>
                  <h4 className="text-yellow-400 font-semibold">Enhanced Features Available</h4>
                  <p className="text-yellow-200 text-sm">Connect your wallet to unlock NFT captains and special abilities</p>
                </div>
              </div>
            </div>
          )}

        {/* Enhanced Selected Captain Display */}
        {selectedCaptain && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-400/50 rounded-2xl p-6 mt-6 shadow-lg shadow-yellow-500/20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={selectedCaptain.image}
                  alt={selectedCaptain.name}
                  className="w-16 h-16 rounded-xl border-3 border-yellow-400 shadow-lg"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-6 h-6 flex items-center justify-center">
                  <Crown className="w-3 h-3" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-bold text-lg">Active Captain:</span>
                  <span className="text-yellow-300 font-semibold">{selectedCaptain.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 px-2 py-1 rounded-full">
                    Rank #{selectedCaptain.rank}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">Providing battle bonuses and card access</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Interface - NFT, Cards, Deck (Only when logged in) */}
      </div>
      
      {/* Fixed Bottom Interface */}
      {walletAddress && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-green-400/40 z-50">
            <div className="max-w-6xl mx-auto p-4">
              {/* Bottom Tab Navigation */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() => setActiveTab('nft')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === 'nft'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/80 hover:text-white'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                  <span>NFT ({selectedCaptain ? 1 : 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === 'cards'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/80 hover:text-white'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                  <span>CARDS</span>
                </button>
                <button
                  onClick={() => setActiveTab('deck')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === 'deck'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/80 hover:text-white'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                  <span>DECK</span>
                </button>
                <button
                  onClick={() => setActiveTab('battle')}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
                >
                  <span className="text-lg">⚔️</span>
                  <span>BATTLE</span>
                </button>
              </div>

              {/* Bottom Content Area - Compact */}
              <div className="max-h-64 overflow-y-auto bg-gray-900/60 rounded-xl p-4 border border-gray-600/50">
                {activeTab === 'nft' && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-green-400 mb-3">Your NFT Captain</h3>
                    {selectedCaptain ? (
                      <div className="flex items-center space-x-4 bg-yellow-900/40 border border-yellow-400/50 rounded-xl p-3">
                        <img
                          src={selectedCaptain.image}
                          alt={selectedCaptain.name}
                          className="w-12 h-12 rounded-lg border-2 border-yellow-400"
                          onError={(e) => {
                            e.currentTarget.src = '/game-assets/cards/default-nft.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-semibold">{selectedCaptain.name}</span>
                            <span className="text-yellow-300 text-sm">Rank #{selectedCaptain.rank}</span>
                          </div>
                          <p className="text-gray-300 text-sm">Providing +10 ATK, +25 HP bonuses</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Connected</span>
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">12 Cards Unlocked</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Crown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 mb-2">No GROWERZ NFT Found</p>
                        <p className="text-gray-500 text-sm">Connect a wallet with THC GROWERZ NFTs to unlock captain bonuses</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cards' && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-blue-400 mb-3">Classification Cards ({filteredCards.length})</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {filteredCards.slice(0, 16).map((card) => (
                        <div
                          key={card.id}
                          className={`relative bg-gray-800 border-2 rounded-lg p-2 cursor-pointer hover:scale-105 transition-transform ${
                            card.rarity === 'legendary' ? 'border-yellow-400' :
                            card.rarity === 'epic' ? 'border-purple-400' :
                            card.rarity === 'rare' ? 'border-blue-400' : 'border-gray-500'
                          }`}
                        >
                          <img
                            src={card.image || '/game-assets/cards/default-card.jpg'}
                            alt={card.name}
                            className="w-full h-16 object-cover rounded mb-1"
                          />
                          <div className="text-xs">
                            <div className="text-white font-semibold truncate">{card.name}</div>
                            <div className="flex justify-between items-center text-gray-300">
                              <span>⚡{card.cost}</span>
                              <span>⚔️{card.attack}</span>
                              <span>❤️{card.health}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToDeck(card);
                              }}
                              className="mt-1 w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded transition-colors"
                              disabled={selectedDeck.length >= 8 || selectedDeck.find(c => c.id === card.id)}
                            >
                              {selectedDeck.find(c => c.id === card.id) ? '✓ Added' : selectedDeck.length >= 8 ? 'Deck Full' : 'Add to Deck'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredCards.length > 16 && (
                      <p className="text-gray-400 text-center text-sm">
                        +{filteredCards.length - 16} more cards available
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'deck' && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-purple-400 mb-3">Battle Deck ({selectedDeck.length}/8)</h3>
                    <div className="grid grid-cols-8 gap-2">
                      {[...Array(8)].map((_, index) => {
                        const card = selectedDeck[index];
                        return (
                          <div
                            key={index}
                            className={`aspect-square border-2 rounded-lg flex items-center justify-center ${
                              card ? 'border-purple-400 bg-purple-900/30' : 'border-dashed border-gray-500 bg-gray-700'
                            }`}
                          >
                            {card ? (
                              <div 
                                className="w-full h-full relative cursor-pointer group"
                                onClick={() => removeFromDeck(card.id)}
                              >
                                <img
                                  src={card.image || '/game-assets/cards/default-card.jpg'}
                                  alt={card.name}
                                  className="w-full h-full object-cover rounded"
                                />
                                <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  ×
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-2xl">+</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedDeck.length === 0 ? (
                      <p className="text-gray-400 text-center text-sm">
                        Add cards to your battle deck from the Cards tab
                      </p>
                    ) : (
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setSelectedDeck([]);
                            localStorage.removeItem('thc-clash-battle-deck');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                        >
                          Clear Deck
                        </button>
                        <button
                          onClick={() => setActiveTab('battle')}
                          disabled={selectedDeck.length === 0}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors font-semibold"
                        >
                          {selectedDeck.length > 0 ? 'Start Battle!' : 'Build deck first'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}