import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Crown, Sword, Shield, Zap, Users, Settings, Sparkles } from 'lucide-react';
import { UnifiedCard } from './UnifiedCard';

interface NFTCard {
  id: string;
  name: string;
  image: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  class: 'ranged' | 'magical' | 'tank' | 'melee';
  type: 'tower' | 'minion' | 'spell';
  abilities: string[];
  traitRequirements: string[];
  isNFTConnected: boolean;
  nftTraitBonus?: {
    traitType: string;
    traitValue: string;
    bonusEffect: string;
  };
}

interface NFTCardDeckProps {
  walletAddress: string;
  nftData: any;
  nftTraits: Array<{trait_type: string, value: string}>;
}

const rarityColors = {
  common: 'bg-gray-400',
  uncommon: 'bg-green-500', 
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-orange-500'
};

const classIcons = {
  ranged: Sword,
  magical: Sparkles,
  tank: Shield,
  melee: Zap
};

const typeIcons = {
  tower: Settings,
  minion: Users,
  spell: Crown
};

export const NFTCardDeck: React.FC<NFTCardDeckProps> = ({ 
  walletAddress, 
  nftData, 
  nftTraits 
}) => {
  const [deck, setDeck] = useState<NFTCard[]>([]);
  const [availableCards, setAvailableCards] = useState<NFTCard[]>([]);
  const [heroCard, setHeroCard] = useState<NFTCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deck' | 'available'>('deck');
  const [deckStats, setDeckStats] = useState<any>(null);

  useEffect(() => {
    if (walletAddress) {
      loadUserCards();
    }
  }, [walletAddress, nftData, nftTraits]);

  const loadUserCards = async () => {
    try {
      setLoading(true);
      
      // Load admin cards
      const adminResponse = await fetch('/api/admin/cards');
      const adminData = await adminResponse.json();
      const adminCards = adminData.success ? adminData.cards : [];
      
      // Get NFT benefits to enhance cards
      let nftBonuses = null;
      try {
        const nftResponse = await fetch('/api/calculate-nft-benefits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress: walletAddress,
            nft: nftData 
          })
        });
        const benefitsData = await nftResponse.json();
        if (benefitsData.success) {
          nftBonuses = benefitsData.data.bonuses;
        }
      } catch (error) {
        console.error('Failed to load NFT benefits:', error);
      }
      
      // Convert admin cards to NFT format with bonuses applied
      const enhancedAdminCards: NFTCard[] = adminCards
        .filter((card: any) => card.isActive)
        .map((card: any) => ({
          id: card.id,
          name: card.name,
          image: card.image,
          cost: card.cost,
          attack: card.attack + (nftBonuses?.attackBonus || 0),
          health: card.health + (nftBonuses?.healthBonus || 0),
          description: card.description + (nftBonuses ? ` (NFT Enhanced: +${nftBonuses.attackBonus} ATK, +${nftBonuses.healthBonus} HP)` : ''),
          rarity: card.rarity,
          class: card.class || 'melee',
          type: card.type || 'minion',
          abilities: card.abilities || [],
          traitRequirements: [],
          isNFTConnected: true,
          nftTraitBonus: nftBonuses ? {
            traitType: 'NFT_BONUS',
            traitValue: nftData?.name || 'Connected NFT',
            bonusEffect: `+${nftBonuses.attackBonus} ATK, +${nftBonuses.healthBonus} HP from NFT traits`
          } : undefined
        }));
      
      setAvailableCards(enhancedAdminCards);
      setDeck(enhancedAdminCards.slice(0, nftBonuses?.deckSize || 8));
      
      // Create hero card from NFT
      if (nftData) {
        const heroCard: NFTCard = {
          id: `hero_${nftData.mint}`,
          name: nftData.name,
          image: nftData.image,
          cost: 0,
          attack: 100 + (nftBonuses?.attackBonus || 0),
          health: 200 + (nftBonuses?.healthBonus || 0),
          description: `Hero card from ${nftData.name} NFT`,
          rarity: nftData.rank <= 100 ? 'legendary' : nftData.rank <= 500 ? 'epic' : 'rare',
          class: 'melee',
          type: 'minion',
          abilities: ['Hero', 'NFT Power'],
          traitRequirements: [],
          isNFTConnected: true,
          nftTraitBonus: {
            traitType: 'HERO',
            traitValue: nftData.name,
            bonusEffect: `Hero abilities from ${nftData.name} (Rank #${nftData.rank})`
          }
        };
        setHeroCard(heroCard);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load user cards:', error);
      setLoading(false);
    }
  };

  // Calculate deck statistics
  useEffect(() => {
    if (deck.length > 0) {
      const stats = {
        totalCards: deck.length,
        totalCost: deck.reduce((sum, card) => sum + card.cost, 0),
        totalAttack: deck.reduce((sum, card) => sum + card.attack, 0),
        totalHealth: deck.reduce((sum, card) => sum + card.health, 0),
        averageCost: (deck.reduce((sum, card) => sum + card.cost, 0) / deck.length).toFixed(1),
        rarityBreakdown: {
          legendary: deck.filter(c => c.rarity === 'legendary').length,
          epic: deck.filter(c => c.rarity === 'epic').length,
          rare: deck.filter(c => c.rarity === 'rare').length,
          uncommon: deck.filter(c => c.rarity === 'uncommon').length,
          common: deck.filter(c => c.rarity === 'common').length,
        }
      };
      setDeckStats(stats);
    }
  }, [deck]);

  const addToDeck = (card: NFTCard) => {
    if (deck.length < 12) {
      setDeck(prev => [...prev, card]);
    }
  };

  const removeFromDeck = (cardId: string) => {
    setDeck(prev => prev.filter(card => card.id !== cardId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <span className="ml-3 text-white">Loading NFT-enhanced cards...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-green-900 via-black to-purple-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">NFT Card Deck</h1>
          <p className="text-gray-300">Cards enhanced by your {nftData?.name} NFT traits</p>
        </div>

        {/* Hero Card */}
        {heroCard && (
          <div className="bg-black/50 border border-yellow-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Hero Card
            </h2>
            <div className="max-w-sm mx-auto">
              <UnifiedCard
                card={{
                  id: heroCard.id,
                  name: heroCard.name,
                  image: heroCard.image,
                  attack: heroCard.attack,
                  health: heroCard.health,
                  cost: heroCard.cost,
                  rarity: heroCard.rarity,
                  type: heroCard.type,
                  class: heroCard.class,
                  description: heroCard.description,
                  abilities: heroCard.abilities,
                  isNFTConnected: true,
                  nftTraitBonus: heroCard.nftTraitBonus
                }}
                isHero={true}
                size="medium"
              />
            </div>
          </div>
        )}

        {/* Deck Statistics */}
        {deckStats && (
          <div className="bg-black/50 border border-blue-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Deck Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-gray-400 text-sm">Total Cards</div>
                <div className="text-white font-bold text-lg">{deckStats.totalCards}/12</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-gray-400 text-sm">Avg Cost</div>
                <div className="text-white font-bold text-lg">{deckStats.averageCost}</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-gray-400 text-sm">Total Attack</div>
                <div className="text-red-400 font-bold text-lg">{deckStats.totalAttack}</div>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-gray-400 text-sm">Total Health</div>
                <div className="text-blue-400 font-bold text-lg">{deckStats.totalHealth}</div>
              </div>
            </div>
          </div>
        )}

        {/* Deck Management Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('deck')}
            variant={activeTab === 'deck' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Current Deck ({deck.length})
          </Button>
          <Button
            onClick={() => setActiveTab('available')}
            variant={activeTab === 'available' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Available Cards ({availableCards.length})
          </Button>
        </div>

        {/* Card Grid */}
        <div className="bg-black/30 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(activeTab === 'deck' ? deck : availableCards).map((card) => (
              <div key={card.id} className="relative">
                <UnifiedCard
                  card={{
                    id: card.id,
                    name: card.name,
                    image: card.image,
                    attack: card.attack,
                    health: card.health,
                    cost: card.cost,
                    rarity: card.rarity,
                    type: card.type,
                    class: card.class,
                    description: card.description,
                    abilities: card.abilities,
                    isNFTConnected: card.isNFTConnected,
                    nftTraitBonus: card.nftTraitBonus
                  }}
                  size="medium"
                />
                
                {/* Add/Remove buttons */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  {activeTab === 'available' ? (
                    <Button
                      onClick={() => addToDeck(card)}
                      disabled={deck.length >= 12}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add to Deck
                    </Button>
                  ) : (
                    <Button
                      onClick={() => removeFromDeck(card.id)}
                      size="sm"
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCardDeck;