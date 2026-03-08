import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NFTTraitBonuses {
  attackBonus: number;
  healthBonus: number;
  defenseBonus: number;
  manaBonus: number;
  specialAbilities: string[];
  deckSize: number;
}

interface NFTCard {
  id: string;
  name: string;
  image: string;
  attack: number;
  health: number;
  cost: number;
  rarity: string;
  type: string;
  class: string;
  description: string;
  abilities: string[];
  isNFTConnected: boolean;
  nftTraitBonus?: {
    bonusEffect: string;
  };
}

interface NFTTraitContextType {
  connectedNFT: any | null;
  playerNFT: any | null;
  playerWallet: string | null;
  nftBonuses: NFTTraitBonuses | null;
  nftBenefits: any | null;
  enhancedDeck: NFTCard[];
  captainCard: NFTCard | null;
  battleCards: NFTCard[];
  loading: boolean;
  updateNFTData: (nft: any, wallet?: string) => Promise<void>;
  clearNFTData: () => void;
}

const NFTTraitContext = createContext<NFTTraitContextType | undefined>(undefined);

export const useNFTTraits = () => {
  const context = useContext(NFTTraitContext);
  if (context === undefined) {
    throw new Error('useNFTTraits must be used within an NFTTraitProvider');
  }
  return context;
};

interface NFTTraitProviderProps {
  children: ReactNode;
}

export const NFTTraitProvider: React.FC<NFTTraitProviderProps> = ({ children }) => {
  // Initialize state from localStorage for persistence
  const [connectedNFT, setConnectedNFT] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-connected-nft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [playerNFT, setPlayerNFT] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-player-nft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [playerWallet, setPlayerWallet] = useState<string | null>(() => {
    try {
      return localStorage.getItem('thc-clash-wallet') || null;
    } catch {
      return null;
    }
  });
  
  const [nftBonuses, setNftBonuses] = useState<NFTTraitBonuses | null>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-nft-bonuses');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [nftBenefits, setNftBenefits] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-nft-benefits');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [enhancedDeck, setEnhancedDeck] = useState<NFTCard[]>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-enhanced-deck');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [captainCard, setCaptainCard] = useState<NFTCard | null>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-captain-card');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [battleCards, setBattleCards] = useState<NFTCard[]>(() => {
    try {
      const saved = localStorage.getItem('thc-clash-battle-cards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [loading, setLoading] = useState(false);

  // Persist state changes to localStorage
  useEffect(() => {
    if (connectedNFT) {
      localStorage.setItem('thc-clash-connected-nft', JSON.stringify(connectedNFT));
    }
  }, [connectedNFT]);

  useEffect(() => {
    if (playerNFT) {
      localStorage.setItem('thc-clash-player-nft', JSON.stringify(playerNFT));
    }
  }, [playerNFT]);

  useEffect(() => {
    if (playerWallet) {
      localStorage.setItem('thc-clash-wallet', playerWallet);
    }
  }, [playerWallet]);

  useEffect(() => {
    if (nftBonuses) {
      localStorage.setItem('thc-clash-nft-bonuses', JSON.stringify(nftBonuses));
    }
  }, [nftBonuses]);

  useEffect(() => {
    if (nftBenefits) {
      localStorage.setItem('thc-clash-nft-benefits', JSON.stringify(nftBenefits));
    }
  }, [nftBenefits]);

  useEffect(() => {
    if (enhancedDeck.length > 0) {
      localStorage.setItem('thc-clash-enhanced-deck', JSON.stringify(enhancedDeck));
    }
  }, [enhancedDeck]);

  useEffect(() => {
    if (captainCard) {
      localStorage.setItem('thc-clash-captain-card', JSON.stringify(captainCard));
    }
  }, [captainCard]);

  useEffect(() => {
    if (battleCards.length > 0) {
      localStorage.setItem('thc-clash-battle-cards', JSON.stringify(battleCards));
    }
  }, [battleCards]);

  const updateNFTData = async (nft: any, wallet?: string) => {
    if (!nft) return;
    
    // Prevent unnecessary updates if the NFT is the same
    if (connectedNFT && connectedNFT.name === nft.name && connectedNFT.rank === nft.rank) {
      return;
    }
    
    setLoading(true);
    setConnectedNFT(nft);
    setPlayerNFT(nft);
    if (wallet) setPlayerWallet(wallet);
    
    try {
      // Calculate NFT benefits and trait-based cards
      const nftResponse = await fetch('/api/calculate-nft-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: 'connected',
          nft: nft 
        })
      });
      
      const nftData = await nftResponse.json();
      
      if (nftData.success) {
        setNftBonuses(nftData.data.bonuses);
        
        // Create enhanced deck from NFT traits
        if (nftData.data.enhancedDeck) {
          const traitBasedCards: NFTCard[] = nftData.data.enhancedDeck.map((card: any, index: number) => ({
            id: `nft-${index}`,
            name: card.name,
            image: nft.image,
            attack: card.attack,
            health: card.health,
            cost: card.cost,
            rarity: 'rare',
            type: card.type === 'basic' ? 'minion' : 
                  card.type === 'spell' ? 'spell' : 'minion',
            class: card.type,
            description: card.description || `Enhanced by ${nft.name}`,
            abilities: [],
            isNFTConnected: true,
            nftTraitBonus: {
              bonusEffect: `NFT trait bonus from ${nft.name}`
            }
          }));
          setEnhancedDeck(traitBasedCards);
        }
        
        // Create captain card
        if (nftData.data.captainCard) {
          const captain: NFTCard = {
            id: 'captain',
            name: nftData.data.captainCard.name,
            image: nftData.data.captainCard.image,
            attack: nftData.data.captainCard.attack,
            health: nftData.data.captainCard.health,
            cost: Math.max(5, Math.min(8, nftData.data.captainCard.cost + 2)), // Balanced captain cost: 5-8 elixir
            rarity: nftData.data.captainCard.rarity,
            type: 'minion',
            class: 'captain',
            description: `Captain from ${nft.name}`,
            abilities: nftData.data.captainCard.abilities,
            isNFTConnected: true,
            nftTraitBonus: {
              bonusEffect: 'Captain abilities from NFT'
            }
          };
          setCaptainCard(captain);
        }
        
        // Load and enhance admin battle cards
        await loadEnhancedBattleCards(nftData.data.bonuses);
      }
    } catch (error) {
      console.error('Failed to update NFT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnhancedBattleCards = async (bonuses: NFTTraitBonuses) => {
    try {
      const adminResponse = await fetch('/api/admin/cards');
      const adminData = await adminResponse.json();
      
      if (adminData.success && connectedNFT) {
        // Get NFT traits from connected NFT
        const nftTraits = connectedNFT.attributes || [];
        console.log('🎯 NFT Traits for card unlocking:', nftTraits.map((attr: any) => `${attr.trait_type}: ${attr.value}`));
        
        // Get ALL available admin card names first
        const allCardNames = adminData.cards.filter((c: any) => c.isActive).map((c: any) => c.name);
        console.log('📚 Total available admin cards:', allCardNames.length);
        
        // Create trait-to-card mapping using ACTUAL admin card names
        const traitCardMapping: Record<string, string[]> = {
          // Each trait type unlocks cards by index groups
          'Strain': allCardNames.slice(0, 11),        // First 11 cards
          'Growing Method': allCardNames.slice(11, 22),  // Next 11 cards  
          'Equipment': allCardNames.slice(22, 33),    // Next 11 cards
          'Experience': allCardNames.slice(33, 44),   // Next 11 cards
          'Background': allCardNames.slice(44, 55),   // Next 11 cards
          'Clothes': allCardNames.slice(55, 66),      // Last 11 cards
          'Eyes': allCardNames.slice(0, 8),           // Overlapping groups for more variety
          'Hair': allCardNames.slice(8, 16),
          'Head': allCardNames.slice(16, 24),
          'Mouth': allCardNames.slice(24, 32),
          'Neck': allCardNames.slice(32, 40),
          'Rarity': allCardNames.slice(40, 48)
        };
        
        // Find which cards this NFT unlocks based on its traits
        const unlockedCardNames = new Set<string>();
        
        nftTraits.forEach((trait: any) => {
          const traitType = trait.trait_type;
          const availableCards = traitCardMapping[traitType] || [];
          
          // Each trait unlocks 1-2 cards (based on trait value)
          if (availableCards.length > 0) {
            // Hash the trait value to consistently select the same cards
            const traitHash = trait.value.toString().split('').reduce((a: any, b: any) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            
            const numCards = Math.abs(traitHash) % 2 + 1; // 1-2 cards per trait
            const startIndex = Math.abs(traitHash) % availableCards.length;
            
            for (let i = 0; i < numCards; i++) {
              const cardIndex = (startIndex + i) % availableCards.length;
              unlockedCardNames.add(availableCards[cardIndex]);
            }
          }
        });
        
        console.log('🔓 Cards unlocked by NFT traits:', Array.from(unlockedCardNames));
        console.log('📊 Admin cards that match unlocked names:', adminData.cards.filter((card: any) => card.isActive && unlockedCardNames.has(card.name)).map((c: any) => c.name));
        
        // Filter admin cards to only include unlocked ones
        const enhancedCards: NFTCard[] = adminData.cards
          .filter((card: any) => card.isActive && unlockedCardNames.has(card.name))
          .map((card: any) => ({
            id: card.id,
            name: card.name,
            image: card.image,
            attack: card.attack + (bonuses?.attackBonus || 0),
            health: card.health + (bonuses?.healthBonus || 0),
            cost: card.cost,
            rarity: card.rarity,
            type: card.type,
            class: card.class,
            description: card.description + (bonuses ? ` (Enhanced: +${bonuses.attackBonus} ATK, +${bonuses.healthBonus} HP)` : ''),
            abilities: card.abilities || [],
            isNFTConnected: true,
            nftTraitBonus: bonuses ? {
              bonusEffect: `+${bonuses.attackBonus} ATK, +${bonuses.healthBonus} HP from ${connectedNFT?.name || 'NFT'}`
            } : undefined
          }));
        
        console.log(`🎮 NFT unlocked ${enhancedCards.length} cards from ${nftTraits.length} traits`);
        
        // Important: If no cards unlocked (trait mapping issue), don't show all cards
        if (enhancedCards.length === 0) {
          console.warn('⚠️ No cards unlocked by traits - trait mapping may need adjustment');
          console.log('📊 Available admin card names:', adminData.cards.filter((c: any) => c.isActive).map((c: any) => c.name));
          setBattleCards([]); // Show empty instead of all cards
        } else {
          setBattleCards(enhancedCards);
        }
      }
    } catch (error) {
      console.error('Failed to load enhanced battle cards:', error);
    }
  };

  const clearNFTData = () => {
    // Clear state
    setConnectedNFT(null);
    setPlayerNFT(null);
    setPlayerWallet(null);
    setNftBonuses(null);
    setNftBenefits(null);
    setEnhancedDeck([]);
    setCaptainCard(null);
    setBattleCards([]);
    setLoading(false);
    
    // Clear localStorage
    localStorage.removeItem('thc-clash-connected-nft');
    localStorage.removeItem('thc-clash-player-nft');
    localStorage.removeItem('thc-clash-wallet');
    localStorage.removeItem('thc-clash-nft-bonuses');
    localStorage.removeItem('thc-clash-nft-benefits');
    localStorage.removeItem('thc-clash-enhanced-deck');
    localStorage.removeItem('thc-clash-captain-card');
    localStorage.removeItem('thc-clash-battle-cards');
  };

  const value: NFTTraitContextType = {
    connectedNFT,
    playerNFT,
    playerWallet,
    nftBonuses,
    nftBenefits,
    enhancedDeck,
    captainCard,
    battleCards,
    loading,
    updateNFTData,
    clearNFTData
  };

  return (
    <NFTTraitContext.Provider value={value}>
      {children}
    </NFTTraitContext.Provider>
  );
};