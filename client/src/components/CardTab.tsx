import React, { useState, useEffect } from 'react';
import { ShoppingCart, Coins, Star, Sword, Shield, Zap, Crown, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Card {
  id: string;
  name: string;
  image: string;
  attack: number;
  health: number;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: string;
  description: string;
  price: number; // in GBUX
  abilities?: string[];
}

interface CardTabProps {
  walletAddress?: string;
  gbuxBalance?: number;
  onPurchase?: (card: Card) => void;
}

export default function CardTab({ walletAddress, gbuxBalance = 0, onPurchase }: CardTabProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [purchasedCards, setPurchasedCards] = useState<string[]>([]);

  useEffect(() => {
    fetchCards();
    loadPurchasedCards();
  }, []);

  const regenerateCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/generate-classification-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        const classificationCards = data.cards.map((card: any) => ({
          id: card.id,
          name: card.name,
          image: card.image,
          attack: card.attack,
          health: card.health,
          cost: card.cost,
          rarity: card.rarity,
          type: card.type,
          description: card.description,
          price: card.rarity === 'legendary' ? 50 : 
                 card.rarity === 'epic' ? 30 : 
                 card.rarity === 'rare' ? 20 : 10,
          abilities: card.abilities || []
        }));
        setCards(classificationCards);
        toast.success('Classification cards regenerated!');
      }
    } catch (error) {
      toast.error('Failed to regenerate cards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterCards();
  }, [cards, selectedRarity, selectedType]);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      // Fetch classification cards from the restored system
      const response = await fetch('/api/admin/cards/active/gameplay');
      const data = await response.json();
      
      if (data.success && data.cards && data.cards.length > 0) {
        // Convert admin cards to card tab format
        const classificationCards = data.cards.map((card: any) => ({
          id: card.id,
          name: card.name,
          image: card.image,
          attack: card.attack,
          health: card.health,
          cost: card.cost,
          rarity: card.rarity,
          type: card.type,
          description: card.description,
          price: card.rarity === 'legendary' ? 50 : 
                 card.rarity === 'epic' ? 30 : 
                 card.rarity === 'rare' ? 20 : 10,
          abilities: card.abilities || []
        }));
        setCards(classificationCards);
        console.log('✅ Loaded classification cards:', classificationCards.length);
        return;
      }
      
      // Auto-generate classification cards if none exist
      console.log('❌ No classification cards found, generating...');
      const generateResponse = await fetch('/api/admin/generate-classification-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const generateData = await generateResponse.json();
      if (generateData.success) {
        const classificationCards = generateData.cards.map((card: any) => ({
          id: card.id,
          name: card.name,
          image: card.image,
          attack: card.attack,
          health: card.health,
          cost: card.cost,
          rarity: card.rarity,
          type: card.type,
          description: card.description,
          price: card.rarity === 'legendary' ? 50 : 
                 card.rarity === 'epic' ? 30 : 
                 card.rarity === 'rare' ? 20 : 10,
          abilities: card.abilities || []
        }));
        setCards(classificationCards);
        console.log('✅ Generated classification cards:', classificationCards.length);
        return;
      }

      // Fallback to sample cards if all else fails
      const marketplaceCards: Card[] = [
        {
          id: 'fire_drake',
          name: 'Fire Drake',
          image: '/game-assets/cards/fire-drake.jpg',
          attack: 120,
          health: 80,
          cost: 5,
          rarity: 'legendary',
          type: 'dragon',
          description: 'Breathes fire that damages multiple enemies',
          price: 50,
          abilities: ['Fire Breath', 'Flying']
        },
        {
          id: 'crystal_golem',
          name: 'Crystal Golem',
          image: '/game-assets/cards/crystal-golem.jpg',
          attack: 80,
          health: 200,
          cost: 6,
          rarity: 'epic',
          type: 'tank',
          description: 'Massive defensive unit with crystal armor',
          price: 30,
          abilities: ['Crystal Shield', 'Earthquake']
        },
        {
          id: 'shadow_assassin',
          name: 'Shadow Assassin',
          image: '/game-assets/cards/shadow-assassin.jpg',
          attack: 150,
          health: 60,
          cost: 4,
          rarity: 'epic',
          type: 'stealth',
          description: 'Fast-moving stealth unit with critical strikes',
          price: 25,
          abilities: ['Stealth', 'Critical Strike']
        },
        {
          id: 'healing_sprite',
          name: 'Healing Sprite',
          image: '/game-assets/cards/healing-sprite.jpg',
          attack: 30,
          health: 80,
          cost: 3,
          rarity: 'rare',
          type: 'support',
          description: 'Heals nearby friendly units',
          price: 15,
          abilities: ['Group Heal']
        },
        {
          id: 'lightning_mage',
          name: 'Lightning Mage',
          image: '/game-assets/cards/lightning-mage.jpg',
          attack: 100,
          health: 70,
          cost: 4,
          rarity: 'rare',
          type: 'magic',
          description: 'Casts lightning spells at enemies',
          price: 20,
          abilities: ['Chain Lightning']
        },
        {
          id: 'armored_knight',
          name: 'Armored Knight',
          image: '/game-assets/cards/armored-knight.jpg',
          attack: 90,
          health: 150,
          cost: 5,
          rarity: 'rare',
          type: 'tank',
          description: 'Heavy armor provides excellent protection',
          price: 18,
          abilities: ['Shield Bash']
        },
        {
          id: 'frost_archer',
          name: 'Frost Archer',
          image: '/game-assets/cards/frost-archer.jpg',
          attack: 85,
          health: 75,
          cost: 3,
          rarity: 'common',
          type: 'ranged',
          description: 'Slows enemies with ice arrows',
          price: 10,
          abilities: ['Frost Shot']
        },
        {
          id: 'goblin_warrior',
          name: 'Goblin Warrior',
          image: '/game-assets/cards/goblin-warrior.jpg',
          attack: 60,
          health: 80,
          cost: 2,
          rarity: 'common',
          type: 'melee',
          description: 'Fast and aggressive melee fighter',
          price: 8,
          abilities: ['Battle Frenzy']
        },
        {
          id: 'mystic_healer',
          name: 'Mystic Healer',
          image: '/game-assets/cards/mystic-healer.jpg',
          attack: 40,
          health: 100,
          cost: 4,
          rarity: 'epic',
          type: 'support',
          description: 'Powerful healing and protective magic',
          price: 35,
          abilities: ['Mass Heal', 'Protection Ward']
        },
        {
          id: 'dragon_knight',
          name: 'Dragon Knight',
          image: '/game-assets/cards/dragon-knight.jpg',
          attack: 140,
          health: 120,
          cost: 7,
          rarity: 'legendary',
          type: 'elite',
          description: 'Elite warrior riding a mighty dragon',
          price: 75,
          abilities: ['Dragon Strike', 'Fire Immunity', 'Flying']
        }
      ];

      setCards(marketplaceCards);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      toast.error('Failed to load marketplace cards');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPurchasedCards = () => {
    try {
      const saved = localStorage.getItem('thc-clash-purchased-cards');
      if (saved) {
        setPurchasedCards(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load purchased cards:', error);
    }
  };

  const filterCards = () => {
    let filtered = cards;

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(card => card.rarity === selectedRarity);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(card => card.type === selectedType);
    }

    setFilteredCards(filtered);
  };

  const purchaseCard = async (card: Card) => {
    if (!walletAddress) {
      toast.error('Connect your wallet to purchase cards');
      return;
    }

    if (gbuxBalance < card.price) {
      toast.error(`Insufficient GBUX. Need ${card.price} GBUX`);
      return;
    }

    if (purchasedCards.includes(card.id)) {
      toast.error('You already own this card');
      return;
    }

    try {
      const response = await fetch('/api/purchase-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          cardId: card.id,
          price: card.price
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newPurchasedCards = [...purchasedCards, card.id];
        setPurchasedCards(newPurchasedCards);
        localStorage.setItem('thc-clash-purchased-cards', JSON.stringify(newPurchasedCards));
        
        onPurchase?.(card);
        toast.success(`${card.name} purchased successfully!`);
      } else {
        toast.error(data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed');
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-400 bg-gray-900/50',
      rare: 'border-blue-400 bg-blue-900/50',
      epic: 'border-purple-400 bg-purple-900/50',
      legendary: 'border-yellow-400 bg-yellow-900/50'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityTextColor = (rarity: string) => {
    const colors = {
      common: 'text-gray-300',
      rare: 'text-blue-300',
      epic: 'text-purple-300',
      legendary: 'text-yellow-300'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
        <p className="text-gray-400">Connect your wallet to access the card marketplace</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Balance */}
      <div className="flex items-center justify-between bg-gray-800/50 border border-gray-600 rounded-xl p-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Classification Card Collection</h3>
          <p className="text-gray-400 text-sm">Cannabis-themed cards with authentic images</p>
        </div>
        <div className="flex items-center space-x-2 bg-purple-900/50 border border-purple-400/30 rounded-lg px-4 py-2">
          <Coins className="w-5 h-5 text-purple-400" />
          <span className="text-white font-bold">{gbuxBalance} GBUX</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-gray-800/30 border border-gray-600 rounded-xl p-4">
        <Filter className="w-5 h-5 text-gray-400" />
        
        <div>
          <label className="block text-gray-400 text-sm mb-1">Rarity</label>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="melee">Melee</option>
            <option value="ranged">Ranged</option>
            <option value="magic">Magic</option>
            <option value="tank">Tank</option>
            <option value="support">Support</option>
            <option value="stealth">Stealth</option>
            <option value="dragon">Dragon</option>
            <option value="elite">Elite</option>
          </select>
        </div>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
          <p className="text-gray-300 ml-4">Loading marketplace...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
            const isOwned = purchasedCards.includes(card.id);
            const canAfford = gbuxBalance >= card.price;

            return (
              <div
                key={card.id}
                className={`border-2 rounded-xl p-4 transition-all ${getRarityColor(card.rarity)} ${
                  isOwned ? 'opacity-60' : 'hover:scale-105'
                }`}
              >
                <div className="relative mb-4">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-40 object-cover rounded-lg bg-gray-700"
                    onError={(e) => {
                      // Fallback to a placeholder
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/200x160/374151/9CA3AF?text=${encodeURIComponent(card.name)}`;
                    }}
                  />
                  {isOwned && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      <div className="bg-green-600 text-white rounded-full px-3 py-1 text-sm font-bold">
                        OWNED
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className={`text-sm font-bold capitalize ${getRarityTextColor(card.rarity)}`}>
                      {card.rarity}
                    </span>
                  </div>
                </div>

                <h4 className="text-white font-bold mb-2">{card.name}</h4>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{card.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-red-900/30 border border-red-400/30 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Sword className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 text-xs">ATK</span>
                    </div>
                    <span className="text-white text-sm font-bold">{card.attack}</span>
                  </div>
                  <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400 text-xs">HP</span>
                    </div>
                    <span className="text-white text-sm font-bold">{card.health}</span>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-400/30 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-400 text-xs">COST</span>
                    </div>
                    <span className="text-white text-sm font-bold">{card.cost}</span>
                  </div>
                </div>

                {/* Abilities */}
                {card.abilities && card.abilities.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {card.abilities.slice(0, 2).map((ability, index) => (
                        <span
                          key={index}
                          className="bg-green-900/30 border border-green-400/30 text-green-300 text-xs px-2 py-1 rounded-full"
                        >
                          {ability}
                        </span>
                      ))}
                      {card.abilities.length > 2 && (
                        <span className="text-gray-400 text-xs px-2 py-1">
                          +{card.abilities.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Purchase Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-bold">{card.price} GBUX</span>
                  </div>
                  <button
                    onClick={() => purchaseCard(card)}
                    disabled={isOwned || !canAfford}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      isOwned
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : canAfford
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600/50 text-red-300 cursor-not-allowed'
                    }`}
                  >
                    {isOwned ? 'Owned' : canAfford ? 'Buy' : 'Not Enough GBUX'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredCards.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Cards Found</h3>
          <p className="text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}