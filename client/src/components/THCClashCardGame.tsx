import React, { useState, useEffect } from 'react';
import { Crown, Zap, Shield, Heart, Star, ArrowLeft, Gamepad2 } from 'lucide-react';
import { UnifiedCard } from './UnifiedCard';
import THCClashBattlefield from './THCClashBattlefield';

interface PlayerNFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface THCClashCardGameProps {
  playerNFTs: PlayerNFT[];
  onBack: () => void;
  nftTraitCards?: any[];
  captainCard?: any;
  nftBonuses?: any;
}

interface BattleCard {
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
}

const THCClashCardGame: React.FC<THCClashCardGameProps> = ({ 
  playerNFTs, 
  onBack, 
  nftTraitCards = [], 
  captainCard = null, 
  nftBonuses = null 
}) => {
  const [gamePhase, setGamePhase] = useState<'deck-selection' | 'battle' | 'game-over'>('deck-selection');
  const [availableCards, setAvailableCards] = useState<BattleCard[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<BattleCard[]>([]);
  const [playerMana, setPlayerMana] = useState(10);
  const [enemyMana, setEnemyMana] = useState(10);
  const [playerHealth, setPlayerHealth] = useState(1000);
  const [enemyHealth, setEnemyHealth] = useState(1000);
  const [selectedCard, setSelectedCard] = useState<BattleCard | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [heroCard, setHeroCard] = useState<BattleCard | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cards from admin panel and NFT data
  useEffect(() => {
    loadBattleCards();
  }, [playerNFTs]);

  const loadBattleCards = async () => {
    try {
      setLoading(true);
      
      // Load admin panel cards
      const adminResponse = await fetch('/api/admin/cards');
      const adminData = await adminResponse.json();
      const adminCards = adminData.success ? adminData.cards : [];
      
      // Get NFT benefits for enhanced cards
      let nftBonuses = null;
      if (playerNFTs.length > 0) {
        try {
          const nftResponse = await fetch('/api/calculate-nft-benefits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              walletAddress: 'connected',
              nft: playerNFTs[0] 
            })
          });
          const nftData = await nftResponse.json();
          if (nftData.success) {
            nftBonuses = nftData.data.bonuses;
          }
        } catch (error) {
          console.error('Failed to load NFT benefits:', error);
        }
      }

      // Use trait-based cards from context if available, otherwise use admin cards with bonuses
      let battleCards: BattleCard[] = [];
      
      if (nftTraitCards && nftTraitCards.length > 0) {
        // Use pre-enhanced cards from NFT trait context
        battleCards = nftTraitCards;
        console.log('🎮 Using NFT trait-based cards from context:', nftTraitCards.length);
      } else {
        // Fallback to admin cards with NFT bonuses
        battleCards = adminCards
          .filter((card: any) => card.isActive)
          .map((card: any) => ({
            id: card.id,
            name: card.name,
            image: card.image,
            attack: card.attack + (nftBonuses?.attackBonus || 0),
            health: card.health + (nftBonuses?.healthBonus || 0),
            cost: card.cost,
            rarity: card.rarity,
            type: card.type,
            class: card.class,
            description: card.description + (nftBonuses ? ` (Enhanced: +${nftBonuses.attackBonus} ATK, +${nftBonuses.healthBonus} HP)` : ''),
            abilities: card.abilities || [],
            isActive: card.isActive,
            isNFTConnected: playerNFTs.length > 0,
            nftTraitBonus: nftBonuses ? {
              bonusEffect: `+${nftBonuses.attackBonus} ATK, +${nftBonuses.healthBonus} HP from ${playerNFTs[0]?.name || 'NFT'}`
            } : undefined
          }));
      }

      // Add NFT-based cards if NFTs are connected
      if (playerNFTs && playerNFTs.length > 0) {
        console.log('🎮 Creating NFT-based cards from:', playerNFTs.length, 'NFTs');
        
        playerNFTs.forEach((nft) => {
          // Use captain card from context if available, otherwise create hero card
          if (captainCard) {
            const heroCard: BattleCard = {
              id: captainCard.id,
              name: captainCard.name,
              image: captainCard.image,
              attack: captainCard.attack,
              health: captainCard.health,
              cost: captainCard.cost,
              rarity: captainCard.rarity,
              type: 'minion',
              class: 'hero',
              description: captainCard.description,
              abilities: captainCard.abilities,
              isNFTConnected: true
            };
            setHeroCard(heroCard);
            console.log('🎮 Using captain card from context:', heroCard.name);
          } else {
            // Fallback to creating hero card from NFT data
            const heroCard: BattleCard = {
              id: `hero_${nft.mint}`,
              name: nft.name,
              image: nft.image,
              attack: 120 + (nft.rank <= 100 ? 50 : nft.rank <= 500 ? 30 : 10),
              health: 250 + (nft.rank <= 100 ? 100 : nft.rank <= 500 ? 60 : 20),
              cost: 0,
              rarity: nft.rank <= 50 ? 'legendary' : nft.rank <= 200 ? 'epic' : nft.rank <= 500 ? 'rare' : 'common',
              type: 'minion',
              class: 'hero',
              description: `NFT Hero - Rank #${nft.rank}`,
              abilities: ['Hero', 'NFT Power'],
              isNFTConnected: true
            };
            
            setHeroCard(heroCard);
            console.log('🎮 Created fallback NFT hero card:', heroCard.name);
          }

          // Add trait-based cards
          nft.attributes?.forEach((trait, index) => {
            if (index < 8) { // Limit trait cards
              const traitCard: BattleCard = {
                id: `trait_${nft.mint}_${index}`,
                name: `${trait.value} ${trait.trait_type}`,
                image: nft.image,
                attack: 40 + Math.floor(Math.random() * 20),
                health: 60 + Math.floor(Math.random() * 30),
                cost: 2 + Math.floor(Math.random() * 2),
                rarity: 'rare',
                type: 'minion',
                class: trait.trait_type.toLowerCase(),
                description: `${trait.trait_type}: ${trait.value}`,
                abilities: [trait.value],
                isNFTConnected: true,
                nftTraitBonus: {
                  bonusEffect: `${trait.trait_type} Power`
                }
              };
              
              battleCards.push(traitCard);
              console.log('🎮 Added trait card:', traitCard.name);
            }
          });
        });
      }

      setAvailableCards(battleCards);
      console.log('🎮 Total battle cards loaded:', battleCards.length);
      
    } catch (error) {
      console.error('Failed to load battle cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToDeck = (card: BattleCard) => {
    if (selectedDeck.length < 8 && !selectedDeck.find(c => c.id === card.id)) {
      setSelectedDeck([...selectedDeck, card]);
    }
  };

  const removeFromDeck = (cardId: string) => {
    setSelectedDeck(selectedDeck.filter(c => c.id !== cardId));
  };

  const startBattle = () => {
    if (selectedDeck.length >= 4) {
      setGamePhase('battle');
      setBattleLog(['🎮 Battle Started! Choose your cards wisely.']);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-purple-900">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading battle cards...</p>
        </div>
      </div>
    );
  }

  if (gamePhase === 'deck-selection') {
    return (
      <div className="h-full bg-gradient-to-br from-green-900 via-black to-purple-900 flex flex-col">
        {/* Header */}
        <div className="bg-black/50 backdrop-blur-sm p-4 border-b border-green-500">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-green-500" />
              THC CLASH - Deck Selection
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-white">
                Deck: {selectedDeck.length}/8
              </div>
              <button
                onClick={startBattle}
                disabled={selectedDeck.length < 4}
                className={`px-6 py-2 rounded-lg font-bold ${
                  selectedDeck.length >= 4 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Start Battle
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Available Cards */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Available Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {availableCards.map(card => (
                <div key={card.id} className="relative">
                  <UnifiedCard
                    card={card}
                    isHero={card.class === 'hero'}
                    size="small"
                  />
                  <button
                    onClick={() => addToDeck(card)}
                    disabled={selectedDeck.length >= 8 || selectedDeck.find(c => c.id === card.id) !== undefined}
                    className="absolute bottom-2 left-2 right-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-1 px-2 rounded text-sm font-bold"
                  >
                    {selectedDeck.find(c => c.id === card.id) ? 'Added' : 'Add to Deck'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Deck */}
          <div className="w-80 bg-black/50 border-l border-green-500 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Selected Deck ({selectedDeck.length}/8)</h2>
            <div className="space-y-2">
              {selectedDeck.map(card => (
                <div key={card.id} className="relative">
                  <UnifiedCard
                    card={card}
                    isHero={card.class === 'hero'}
                    size="small"
                  />
                  <button
                    onClick={() => removeFromDeck(card.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'battle') {
    return (
      <THCClashBattlefield
        playerDeck={selectedDeck}
        playerNFTs={playerNFTs}
        onGameEnd={() => setGamePhase('game-over')}
        onBack={() => setGamePhase('deck-selection')}
      />
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-purple-900">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
        <button
          onClick={() => setGamePhase('deck-selection')}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-bold"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default THCClashCardGame;