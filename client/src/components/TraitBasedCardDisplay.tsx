import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Sword, Shield, Zap, Star, Lock, ShoppingCart } from 'lucide-react';

interface CardTraits {
  attack: number;
  health: number;
  cost: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: 'minion' | 'spell' | 'tower';
  class: string;
  abilities: string[];
  isUnlocked: boolean;
  budzPrice?: number;
  nftBonuses?: {
    attackBonus: number;
    healthBonus: number;
    specialAbilities: string[];
  };
}

interface TraitBasedCardDisplayProps {
  card: any;
  isNFTUnlocked?: boolean;
  showBuyButton?: boolean;
  onPurchase?: (cardId: string, price: number) => void;
  onAddToDeck?: (card: any) => void;
  userBudzBalance?: number;
}

const TraitBasedCardDisplay: React.FC<TraitBasedCardDisplayProps> = ({
  card,
  isNFTUnlocked = false,
  showBuyButton = false,
  onPurchase,
  onAddToDeck,
  userBudzBalance = 0
}) => {
  const [showFullTraits, setShowFullTraits] = useState(false);

  const getTraitColor = (trait: string, value: any) => {
    switch (trait) {
      case 'attack': return 'text-red-400';
      case 'health': return 'text-blue-400';
      case 'cost': return 'text-purple-400';
      case 'rarity': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityGradient = (rarity: string) => {
    const gradients = {
      common: 'from-gray-600 to-gray-800',
      uncommon: 'from-green-600 to-green-800',
      rare: 'from-blue-600 to-blue-800',
      epic: 'from-purple-600 to-purple-800',
      legendary: 'from-yellow-600 to-orange-800'
    };
    return gradients[rarity as keyof typeof gradients] || gradients.common;
  };

  const canAfford = userBudzBalance >= (card.budzPrice || 0);

  return (
    <div className="flex gap-3 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 max-w-full overflow-hidden">
      {/* Card Image - Use UnifiedCard for consistency */}
      <div className="flex-shrink-0">
        <div className="relative w-24 h-32">
          {/* Use simplified card display matching UnifiedCard style */}
          <div className="relative w-full h-full bg-black/20 rounded-lg border-2 border-green-400/50 overflow-hidden">
            <img 
              src={card.image} 
              alt={card.name}
              className="w-full h-full object-contain p-1"
            />
            
            {/* NFT Indicator */}
            {isNFTUnlocked && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-green-600 rounded-full border border-white/50"></div>
            )}
            
            {/* Lock overlay */}
            {!card.isUnlocked && !isNFTUnlocked && (
              <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons Below Card */}
        <div className="mt-2 space-y-1">
          {!card.isUnlocked && !isNFTUnlocked && showBuyButton && onPurchase && (
            <button
              onClick={() => onPurchase(card.id, card.budzPrice || 0)}
              disabled={!canAfford}
              className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
                canAfford 
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              {card.budzPrice || 0}
            </button>
          )}

          {(card.isUnlocked || isNFTUnlocked) && onAddToDeck && (
            <button
              onClick={() => onAddToDeck(card)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-all"
            >
              <Crown className="w-3 h-3" />
              Deck
            </button>
          )}
        </div>
      </div>

      {/* Compact Information Panel */}
      <div className="flex-1 space-y-2 min-w-0">
        {/* Card Header - Compact */}
        <div>
          <h3 className="text-lg font-bold text-white truncate">{card.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className={`px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${getRarityGradient(card.rarity)} text-white`}>
              {card.rarity}
            </span>
            <span className="px-2 py-1 rounded text-xs bg-blue-600 text-white">
              {card.type}
            </span>
            <span className="px-2 py-1 rounded text-xs bg-purple-600 text-white">
              {card.class}
            </span>
          </div>
        </div>

        {/* Compact Stats - Horizontal Layout */}
        <div className="flex gap-2">
          <div className="flex-1 bg-red-900/30 rounded p-2 border border-red-500/30">
            <div className="flex items-center gap-1 text-xs text-red-400">
              <Sword className="w-3 h-3" />
              ATK
            </div>
            <div className="font-bold text-red-400">
              {card.attack}
              {isNFTUnlocked && card.nftBonuses?.attackBonus && (
                <span className="text-green-400 text-xs ml-1">
                  +{card.nftBonuses.attackBonus}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 bg-blue-900/30 rounded p-2 border border-blue-500/30">
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <Shield className="w-3 h-3" />
              HP
            </div>
            <div className="font-bold text-blue-400">
              {card.health}
              {isNFTUnlocked && card.nftBonuses?.healthBonus && (
                <span className="text-green-400 text-xs ml-1">
                  +{card.nftBonuses.healthBonus}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 bg-purple-900/30 rounded p-2 border border-purple-500/30">
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <Zap className="w-3 h-3" />
              COST
            </div>
            <div className="font-bold text-purple-400">{card.cost}</div>
          </div>
        </div>

        {/* Compact Abilities */}
        {card.abilities && card.abilities.length > 0 && (
          <div className="bg-yellow-900/20 rounded p-2 border border-yellow-500/30">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-semibold">Abilities</span>
            </div>
            <div className="space-y-1">
              {card.abilities.slice(0, showFullTraits ? undefined : 1).map((ability: string, idx: number) => (
                <div key={idx} className="text-xs text-yellow-300 bg-yellow-900/20 rounded px-2 py-1">
                  {ability.length > 50 ? `${ability.slice(0, 50)}...` : ability}
                </div>
              ))}
              {card.abilities.length > 1 && (
                <button
                  onClick={() => setShowFullTraits(!showFullTraits)}
                  className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                >
                  {showFullTraits ? 'Show less' : `+${card.abilities.length - 1} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Compact NFT Bonuses */}
        {isNFTUnlocked && card.nftBonuses?.specialAbilities?.length > 0 && (
          <div className="bg-green-900/20 rounded p-2 border border-green-500/30">
            <div className="flex items-center gap-1 mb-1">
              <Crown className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400 font-semibold">NFT Bonus</span>
            </div>
            <div className="text-xs text-green-300">
              {card.nftBonuses.specialAbilities[0]}
              {card.nftBonuses.specialAbilities.length > 1 && (
                <span className="text-green-400"> +{card.nftBonuses.specialAbilities.length - 1} more</span>
              )}
            </div>
          </div>
        )}

        {/* BUDZ Balance - Compact */}
        {showBuyButton && (
          <div className="text-xs text-gray-400 pt-1 border-t border-gray-700">
            BUDZ: <span className="text-yellow-400 font-semibold">{userBudzBalance}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraitBasedCardDisplay;