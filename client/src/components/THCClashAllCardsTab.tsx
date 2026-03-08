import React, { useState, useEffect } from 'react';
import { Shield, Sword, Zap, Heart, Star } from 'lucide-react';
import { UnifiedCard } from './UnifiedCard';

interface GameCard {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  unitType: string;
  abilities: string[];
  isNFTCard?: boolean;
}

const THCClashAllCardsTab: React.FC = () => {
  const [allCards, setAllCards] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllCards();
  }, []);

  const loadAllCards = async () => {
    try {
      // Load admin panel cards
      const response = await fetch('/api/admin/cards');
      const data = await response.json();
      
      if (data.success) {
        setAllCards(data.cards || []);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-white">Loading cards...</span>
      </div>
    );
  }

  const rarityStats = {
    legendary: allCards.filter(c => c.rarity === 'legendary').length,
    epic: allCards.filter(c => c.rarity === 'epic').length,
    rare: allCards.filter(c => c.rarity === 'rare').length,
    common: allCards.filter(c => c.rarity === 'common').length,
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-900 via-black to-purple-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">All THC Clash Cards</h1>
          <p className="text-gray-300">
            Complete collection of battle cards from the Admin Panel
          </p>
        </div>
        
        {/* Card Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 text-center">
            <div className="text-yellow-400 font-bold text-2xl">{rarityStats.legendary}</div>
            <div className="text-yellow-300 text-sm">Legendary</div>
          </div>
          <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4 text-center">
            <div className="text-purple-400 font-bold text-2xl">{rarityStats.epic}</div>
            <div className="text-purple-300 text-sm">Epic</div>
          </div>
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 text-center">
            <div className="text-blue-400 font-bold text-2xl">{rarityStats.rare}</div>
            <div className="text-blue-300 text-sm">Rare</div>
          </div>
          <div className="bg-gray-600/20 border border-gray-600/30 rounded-lg p-4 text-center">
            <div className="text-gray-400 font-bold text-2xl">{rarityStats.common}</div>
            <div className="text-gray-300 text-sm">Common</div>
          </div>
        </div>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {allCards.map(card => (
            <UnifiedCard
              key={card.id}
              card={card}
              size="medium"
            />
          ))}
        </div>
        
        {allCards.length === 0 && (
          <div className="text-center text-white mt-12">
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">No Cards Available</h2>
              <p className="text-gray-300 mb-6">
                Visit the Admin Panel to create and manage battle cards.
              </p>
              <p className="text-sm text-gray-400">
                Cards created in the Admin Panel will automatically appear here and in battle mode.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default THCClashAllCardsTab;