import React, { useState } from 'react';
import { useNFTTraits } from '../contexts/NFTTraitContext';
import { UnifiedCard } from './UnifiedCard';
import { Badge } from './ui/badge';
import { Crown, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Trait {
  trait_type: string;
  value: string;
  rarity?: string;
}

interface NFTTraitDisplayProps {
  onAddToDeck?: (card: any) => void;
}

export const NFTTraitDisplay: React.FC<NFTTraitDisplayProps> = ({ onAddToDeck }) => {
  const { connectedNFT, nftBonuses, battleCards, captainCard, loading } = useNFTTraits();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const handleAddToDeck = (card: any) => {
    if (onAddToDeck) {
      onAddToDeck(card);
      setShowCardModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white text-lg">Loading NFT trait data...</div>
      </div>
    );
  }

  if (!connectedNFT) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white/60 text-center">
          <h3 className="text-xl font-bold mb-2">No NFT Connected</h3>
          <p>Connect your GROWERZ NFT to see trait-based cards and bonuses</p>
        </div>
      </div>
    );
  }

  const traitBonuses = [
    { label: 'Attack Bonus', value: `+${nftBonuses?.attackBonus || 0}`, color: 'bg-red-500' },
    { label: 'Health Bonus', value: `+${nftBonuses?.healthBonus || 0}`, color: 'bg-blue-500' },
    { label: 'Defense Bonus', value: `+${nftBonuses?.defenseBonus || 0}`, color: 'bg-green-500' },
    { label: 'Special Abilities', value: nftBonuses?.specialAbilities?.length || 0, color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-3">
      {/* Combined NFT Overview & Trait Analysis - Reduced padding */}
      <div className="bg-gradient-to-r from-green-900/80 to-purple-900/80 border border-green-400 rounded-lg p-2 sm:p-3 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-32 sm:w-32 sm:h-40 bg-black/20 rounded-lg border-2 border-green-400 overflow-hidden">
              <img 
                src={connectedNFT.image} 
                alt={connectedNFT.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2">
                <div className="bg-green-600 rounded-full w-3 h-3 border border-white/50"></div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-3">{connectedNFT.name}</h2>
            
            {/* NFT Bonuses Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="text-center bg-purple-900/20 rounded-lg p-2">
                <div className="text-lg sm:text-2xl font-bold text-purple-400">#{connectedNFT.rank}</div>
                <div className="text-gray-300 text-xs sm:text-sm">Rank</div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {connectedNFT.rank <= 100 ? 'Legendary' :
                   connectedNFT.rank <= 300 ? 'Epic' :
                   connectedNFT.rank <= 600 ? 'Rare' :
                   connectedNFT.rank <= 1000 ? 'Uncommon' :
                   connectedNFT.rank <= 1500 ? 'Common+' :
                   connectedNFT.rank <= 2000 ? 'Common' : 'Standard'}
                </div>
              </div>
              <div className="text-center bg-red-900/20 rounded-lg p-2">
                <div className="text-lg sm:text-2xl font-bold text-red-400">
                  +{nftBonuses?.attackBonus || 0}
                </div>
                <div className="text-gray-300 text-xs sm:text-sm">Attack</div>
                <div className="text-xs text-gray-500 hidden sm:block">From rank</div>
              </div>
              <div className="text-center bg-green-900/20 rounded-lg p-2">
                <div className="text-lg sm:text-2xl font-bold text-green-400">
                  +{nftBonuses?.healthBonus || 0}
                </div>
                <div className="text-gray-300 text-xs sm:text-sm">Health</div>
                <div className="text-xs text-gray-500 hidden sm:block">From rank</div>
              </div>
              <div className="text-center bg-yellow-900/20 rounded-lg p-2">
                <div className="text-lg sm:text-2xl font-bold text-yellow-400">{connectedNFT.attributes?.length || 0}</div>
                <div className="text-gray-300 text-xs sm:text-sm">Traits</div>
                <div className="text-xs text-gray-500 hidden sm:block">Bonuses</div>
              </div>
            </div>

            {/* Trait Analysis - Compact */}
            {connectedNFT.attributes && connectedNFT.attributes.length > 0 && (
              <div className="bg-gray-900/30 rounded-lg p-3 border border-gray-600 mb-3">
                <h4 className="text-sm sm:text-base font-bold text-gray-300 mb-2 flex items-center gap-2">
                  🧬 Trait Analysis
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {connectedNFT.attributes.slice(0, 6).map((trait: any, index: number) => (
                    <div key={index} className="bg-gray-800/50 rounded p-2 border border-gray-600">
                      <div className="text-xs font-semibold text-blue-400 truncate">{trait.trait_type}</div>
                      <div className="text-xs text-gray-300 truncate">{trait.value}</div>
                      <div className="text-xs text-green-400">
                        {trait.trait_type.toLowerCase().includes('background') ? '+5-20' :
                         trait.trait_type.toLowerCase().includes('eyes') ? '+3-20' :
                         trait.trait_type.toLowerCase().includes('clothes') ? '+2-12' :
                         trait.trait_type.toLowerCase().includes('head') ? '+5-15' : '+1-8'}
                      </div>
                    </div>
                  ))}
                  {connectedNFT.attributes.length > 6 && (
                    <div className="bg-gray-800/50 rounded p-2 border border-gray-600 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">+{connectedNFT.attributes.length - 6}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Special Abilities */}
            {nftBonuses?.specialAbilities && nftBonuses.specialAbilities.length > 0 && (
              <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
                <h4 className="text-sm font-bold text-purple-400 mb-2">Special Abilities</h4>
                <div className="flex flex-wrap gap-2">
                  {nftBonuses.specialAbilities.map((ability, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-600/20 text-purple-300 text-xs">
                      {ability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Captain Card (Auto-fills Slot 1) - Reduced padding */}
      {captainCard && (
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-bold text-white">Your NFT Captain Card</h3>
            <Badge className="bg-gold/20 text-yellow-300 border-yellow-400/50">
              Unique NFT Card + Deck Bonuses
            </Badge>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <UnifiedCard 
                card={{
                  ...captainCard,
                  rarity: (captainCard.rarity as "legendary" | "epic" | "rare" | "uncommon" | "common") || "legendary",
                  type: (captainCard.type as "minion" | "spell" | "tower") || "minion"
                }}
                size="medium"
                showActions={true}
                onAddToDeck={(card) => {
                  // Captain card can be added to deck like any other card
                  console.log('Adding captain card to deck:', card.name);
                  if (onAddToDeck) {
                    onAddToDeck(card);
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-black/40 rounded-lg p-4 mt-4">
            <p className="text-white/80 text-center text-sm mb-2">
              <strong>Captain Card Benefits:</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-white/60">
              <p>• Represents your connected NFT in battle</p>
              <p>• Provides deck-wide bonuses when included</p>
              <p>• Unique legendary stats and abilities</p>
              <p>• Can be added to deck like any other card</p>
            </div>
          </div>
        </div>
      )}

      {/* Trait-Based Battle Cards - Reduced padding */}
      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">Your GROWERZ Trait Cards</h3>
        <p className="text-white/60 text-sm mb-3">
          Only trait-unlocked cards from your GROWERZ NFT appear here. Each visible trait unlocks a unique battle card with enhanced stats.
        </p>
        {battleCards && battleCards.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-4">
              {battleCards.map((card, index) => (
                <div 
                  key={card.id || index} 
                  className="relative group cursor-pointer transform hover:scale-105 transition-transform"
                  onClick={() => handleCardClick(card)}
                >
                  <UnifiedCard 
                    card={{
                      ...card,
                      rarity: (card.rarity as "legendary" | "epic" | "rare" | "uncommon" | "common") || "rare",
                      type: (card.type as "minion" | "spell" | "tower") || "minion"
                    }}
                    size="small"
                    showActions={false}
                  />
                  {/* Click indicator */}
                  <div className="absolute inset-0 bg-white/0 hover:bg-white/10 rounded-lg transition-colors pointer-events-none" />
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-blue-600 rounded-full p-1">
                      <Plus size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/60 text-sm text-center">
              {battleCards.length} trait-unlocked cards generated from your GROWERZ NFT. Only traits that unlock cards are shown.
            </p>
          </>
        ) : (
          <div className="text-center text-white/60 py-8">
            <p>No trait-unlocked cards available. Only traits that unlock cards will appear here.</p>
            <p className="text-sm mt-2">Check that your GROWERZ NFT has card-unlocking traits loaded.</p>
          </div>
        )}
      </div>

      {/* Trait Analysis */}
      {connectedNFT.attributes && (
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Trait Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedNFT.attributes.map((trait: Trait, index: number) => (
              <div key={index} className="bg-black/40 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 text-sm">{trait.trait_type}</span>
                  <Badge variant="outline" className="text-xs">
                    {trait.rarity || 'Standard'}
                  </Badge>
                </div>
                <div className="text-white font-semibold">{trait.value}</div>
                <div className="text-white/40 text-xs mt-1">
                  Enhances in-game card abilities and stats
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Card Detail Modal */}
      {selectedCard && (
        <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <Crown size={24} />
                {selectedCard.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Card Display */}
              <div className="flex-shrink-0 flex justify-center">
                <div className="w-64">
                  <UnifiedCard
                    card={{
                      id: selectedCard.id,
                      name: selectedCard.name,
                      image: selectedCard.image || connectedNFT?.image,
                      attack: selectedCard.attack,
                      health: selectedCard.health,
                      cost: selectedCard.cost,
                      rarity: selectedCard.rarity || 'rare',
                      type: selectedCard.type || 'minion',
                      class: selectedCard.class || 'warrior',
                      description: selectedCard.description || `Enhanced by ${connectedNFT?.name}`,
                      abilities: selectedCard.abilities || [],
                      isNFTConnected: true,
                      nftTraitBonus: {
                        bonusEffect: `Generated from ${connectedNFT?.name} traits`
                      }
                    }}
                    size="large"
                    showAddToDeck={false}
                  />
                </div>
              </div>
              
              {/* Card Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-900/20 rounded-lg p-3 text-center border border-red-500/30">
                    <div className="text-2xl font-bold text-red-400">{selectedCard.attack}</div>
                    <div className="text-sm text-gray-300">Attack</div>
                  </div>
                  <div className="bg-blue-900/20 rounded-lg p-3 text-center border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">{selectedCard.health}</div>
                    <div className="text-sm text-gray-300">Health</div>
                  </div>
                  <div className="bg-purple-900/20 rounded-lg p-3 text-center border border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400">{selectedCard.cost}</div>
                    <div className="text-sm text-gray-300">Cost</div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h4 className="font-bold text-white mb-2">Description</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedCard.description || `This powerful card was generated from your ${connectedNFT?.name} NFT traits, providing unique bonuses and abilities in battle.`}
                  </p>
                </div>
                
                {selectedCard.abilities && selectedCard.abilities.length > 0 && (
                  <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                    <h4 className="font-bold text-purple-400 mb-2">Special Abilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.abilities.map((ability: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-purple-600/20 text-purple-300">
                          {ability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                  <h4 className="font-bold text-green-400 mb-2">NFT Enhancement</h4>
                  <p className="text-green-300 text-sm">
                    Generated from {connectedNFT?.name} (Rank #{connectedNFT?.rank})
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    This card receives bonuses from your NFT traits and rank
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleAddToDeck(selectedCard)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Add to Deck
                  </button>
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <X size={18} />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};