import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sword, Shield, Crown, Edit, Eye, Trash2 } from 'lucide-react';
import { CardBackground } from './CardBackground';

interface UnifiedCardProps {
  card: {
    id: string;
    name: string;
    image: string;
    attack: number;
    health: number;
    cost: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    type: 'minion' | 'spell' | 'tower';
    class: string;
    description: string;
    abilities: string[];
    isActive?: boolean;
    isNFTConnected?: boolean;
    nftTraitBonus?: {
      bonusEffect: string;
    };
  };
  isHero?: boolean;
  isAdmin?: boolean;
  onEdit?: (card: any) => void;
  onToggleActive?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showAddToDeck?: boolean;
  onAddToDeck?: (card: any) => void;
}

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  card,
  isHero = false,
  isAdmin = false,
  onEdit,
  onToggleActive,
  onDelete,
  size = 'medium',
  showAddToDeck = false,
  onAddToDeck
}) => {
  const sizeClasses = {
    tiny: 'w-12 h-16', // Even smaller for mobile deck cards
    small: 'w-24 h-32', // Slightly larger for better visibility
    medium: 'w-40 h-56', // Significantly larger for better viewing
    large: 'w-48 h-68' // Even larger for detailed display
  };

  const imageSizes = {
    tiny: '35px', // Much smaller for mobile deck cards
    small: '80px', // Improved size for better visibility  
    medium: '150px', // Much larger for better viewing
    large: '200px' // Extra large for detailed display
  };

  const getCardBackground = (rarity: string) => {
    const backgrounds = {
      'legendary': '/card-backgrounds/legendary-weed.png',
      'epic': '/card-backgrounds/epic-gold.png',
      'rare': '/card-backgrounds/rare-green.png',
      'uncommon': '/card-backgrounds/uncommon-purple.png',
      'common': '/card-backgrounds/common-grey.png'
    };
    return backgrounds[rarity as keyof typeof backgrounds] || backgrounds.common;
  };

  const getRarityGlow = (rarity: string) => {
    const glows = {
      'legendary': 'rgba(255, 215, 0, 0.4)',
      'epic': 'rgba(128, 0, 128, 0.4)', 
      'rare': 'rgba(0, 100, 255, 0.4)',
      'uncommon': 'rgba(0, 255, 0, 0.4)',
      'common': 'rgba(128, 128, 128, 0.2)'
    };
    return glows[rarity as keyof typeof glows] || glows.common;
  };

  // Rarity gradient borders
  const rarityBorder = {
    legendary: 'linear-gradient(135deg, #FFD700, #FF8C00, #FFD700)',
    epic:      'linear-gradient(135deg, #9966CC, #C084FC, #7C3AED)',
    rare:      'linear-gradient(135deg, #4169E1, #60A5FA, #2563EB)',
    uncommon:  'linear-gradient(135deg, #32CD32, #86EFAC, #16A34A)',
    common:    'linear-gradient(135deg, #808080, #A0AEC0, #6B7280)',
  }[card.rarity] || 'linear-gradient(135deg, #808080, #A0AEC0)';

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-xl ${
        card.isActive !== false ? '' : 'opacity-50'
      } shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:z-50 cursor-pointer group`}
      style={{
        padding: '2px',
        background: rarityBorder,
        boxShadow: `0 0 20px ${getRarityGlow(card.rarity)}`,
        // Legendary gets a pulsing outer glow animation
        animation: card.rarity === 'legendary' ? 'legendaryPulse 2s ease-in-out infinite' : undefined,
      }}
    >
    {/* Inner card face */}
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-900">
    {/* Legendary shimmer sweep */}
    {card.rarity === 'legendary' && (
      <div
        className="absolute inset-0 z-30 pointer-events-none rounded-xl"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.18) 50%, transparent 60%)',
          animation: 'shimmerSweep 2.4s ease-in-out infinite',
        }}
      />
    )}
      
      {/* Hero Crown - Bottom left corner */}
      {isHero && (
        <div className="absolute bottom-14 left-2 z-20">
          <div className="bg-yellow-400 rounded-full p-1.5">
            <Crown className="w-4 h-4 text-yellow-900 fill-current" />
          </div>
        </div>
      )}

      {/* Card Background Image - Full coverage */}
      <div 
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{ opacity: 0.85 }}
      >
        <img
          src={getCardBackground(card.rarity)}
          alt={`${card.rarity} background`}
          className="w-full h-full rounded-xl"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      
      {/* Card Content - Full image with proper text scaling */}
      <div className="relative h-full flex flex-col p-2">
        {/* Card Art - transparent-bg aware (PNG support) */}
        <div className="flex-1 flex items-center justify-center relative mb-2 p-2">
          <img 
            src={card.image} 
            alt={card.name}
            className="transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
            style={{ 
              objectFit: 'contain',
              width: size === 'tiny' ? '70%' : size === 'small' ? '85%' : '88%',
              height: 'auto',
              minHeight: size === 'tiny' ? '25px' : size === 'small' ? '70px' : size === 'large' ? '180px' : '110px',
              maxHeight: size === 'tiny' ? '35px' : size === 'small' ? '95px' : size === 'large' ? '240px' : '140px',
              borderRadius: '6px',
              filter: card.rarity === 'legendary' ? 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
            }}
            onError={(e) => {
              e.currentTarget.src = '/attached_assets/good_dealer.png';
            }}
          />
        </div>

        {/* Card Name - Enhanced visibility on hover */}
        <div className="absolute top-1 left-1 right-1 px-2 py-1 z-10">
          <h3 className={`${
            size === 'tiny' ? 'text-[8px] group-hover:text-[9px]' : 
            size === 'small' ? 'text-[10px] group-hover:text-xs' : 
            size === 'large' ? 'text-sm group-hover:text-base' : 'text-xs group-hover:text-sm'
          } text-white font-bold text-center leading-tight transition-all duration-300`}
          style={{ 
            wordBreak: 'break-word',
            hyphens: 'auto',
            lineHeight: '1.1',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)'
          }}>
            {size === 'tiny' ? 
              (card.name.length > 6 ? card.name.slice(0, 6) + '...' : card.name) : 
              card.name
            }
          </h3>
        </div>

        {/* Smart positioned stats with emoji circles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Cost badge - Top right corner with emoji only */}
          <div className={`absolute top-1 right-1 ${
            size === 'tiny' ? 'w-5 h-5 group-hover:w-6 group-hover:h-6' : 
            size === 'small' ? 'w-6 h-6 group-hover:w-7 group-hover:h-7' : 
            size === 'large' ? 'w-9 h-9 group-hover:w-10 group-hover:h-10' : 'w-7 h-7 group-hover:w-8 group-hover:h-8'
          } bg-purple-600 text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg z-20 transition-all duration-300`}>
            <span className={`${
              size === 'tiny' ? 'text-[8px]' : 
              size === 'small' ? 'text-[10px]' : 
              size === 'large' ? 'text-sm' : 'text-xs'
            } leading-none font-bold`}>{card.cost}</span>
          </div>

          {/* Attack - Bottom left with sword emoji */}
          <div className={`absolute bottom-1 left-1 ${
            size === 'tiny' ? 'w-5 h-5 group-hover:w-6 group-hover:h-6' : 
            size === 'small' ? 'w-6 h-6 group-hover:w-7 group-hover:h-7' : 
            size === 'large' ? 'w-9 h-9 group-hover:w-10 group-hover:h-10' : 'w-7 h-7 group-hover:w-8 group-hover:h-8'
          } bg-red-600 text-white rounded-full flex flex-col items-center justify-center font-bold border-2 border-white shadow-lg z-20 transition-all duration-300`}>
            <span className={`${
              size === 'tiny' ? 'text-[6px]' : 
              size === 'small' ? 'text-[8px]' : 
              size === 'large' ? 'text-xs' : 'text-[10px]'
            } leading-none`}>⚔️</span>
            <span className={`${
              size === 'tiny' ? 'text-[7px]' : 
              size === 'small' ? 'text-[9px]' : 
              size === 'large' ? 'text-xs' : 'text-[10px]'
            } leading-none font-bold`}>{card.attack}</span>
          </div>
          
          {/* Health - Bottom right with heart emoji */}
          <div className={`absolute bottom-1 right-1 ${
            size === 'tiny' ? 'w-5 h-5 group-hover:w-6 group-hover:h-6' : 
            size === 'small' ? 'w-6 h-6 group-hover:w-7 group-hover:h-7' : 
            size === 'large' ? 'w-9 h-9 group-hover:w-10 group-hover:h-10' : 'w-7 h-7 group-hover:w-8 group-hover:h-8'
          } bg-green-600 text-white rounded-full flex flex-col items-center justify-center font-bold border-2 border-white shadow-lg z-20 transition-all duration-300`}>
            <span className={`${
              size === 'tiny' ? 'text-[6px]' : 
              size === 'small' ? 'text-[8px]' : 
              size === 'large' ? 'text-xs' : 'text-[10px]'
            } leading-none`}>❤️</span>
            <span className={`${
              size === 'tiny' ? 'text-[7px]' : 
              size === 'small' ? 'text-[9px]' : 
              size === 'large' ? 'text-xs' : 'text-[10px]'
            } leading-none font-bold`}>{card.health}</span>
          </div>
        </div>

        {/* NFT/Hero Indicator - Less intrusive */}
        {(card.isNFTConnected || card.nftTraitBonus || isHero) && (
          <div className={`absolute ${size === 'tiny' ? 'bottom-1 right-1' : 'bottom-2 right-2'} z-10`}>
            <div className="bg-green-600/80 text-white rounded-full w-2 h-2 border border-white/50"></div>
          </div>
        )}

        {/* Abilities tooltip on hover (medium/large only) */}
        {size !== 'tiny' && card.abilities && card.abilities.length > 0 && (
          <div className="absolute inset-0 bg-black/85 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-40 flex flex-col justify-center p-2 pointer-events-none">
            <div className="text-white font-bold text-center text-[9px] mb-1 truncate">{card.name}</div>
            <div className="text-[8px] text-gray-300 text-center leading-tight space-y-0.5">
              {card.abilities.slice(0, 3).map((ab, i) => (
                <div key={i} className="text-green-300">• {ab}</div>
              ))}
            </div>
            {card.description && size === 'large' && (
              <div className="text-[7px] text-gray-400 text-center mt-1 leading-tight line-clamp-2">{card.description}</div>
            )}
          </div>
        )}
      </div>
    </div>  {/* end inner card face */}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="mt-2 flex justify-center gap-2">
          <button
            onClick={() => onEdit && onEdit(card)}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Edit size={12} />
            Edit
          </button>
          
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(card.id)}
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                card.isActive !== false 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Eye size={12} />
              {card.isActive !== false ? 'Active' : 'Hidden'}
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Delete this card?')) {
                  onDelete(card.id);
                }
              }}
              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Add to Deck Button */}
      {showAddToDeck && onAddToDeck && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => onAddToDeck(card)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold text-sm"
          >
            <Crown size={16} />
            Add to Deck
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedCard;
export { UnifiedCard };