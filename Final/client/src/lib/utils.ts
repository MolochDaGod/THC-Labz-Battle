import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getLocalStorage = (key: string): any =>
  JSON.parse(window.localStorage.getItem(key) || "null");
const setLocalStorage = (key: string, value: any): void =>
  window.localStorage.setItem(key, JSON.stringify(value));

// Universal NFT selection system - handles selection across all components
export const saveSelectedNFT = async (nft: any, walletAddress: string) => {
  try {
    console.log(`🎯 [Universal NFT Selection] Selecting ${nft.name} (${nft.mint}) as The Plug`);
    
    // Create comprehensive NFT data object
    const nftData = {
      mint: nft.mint,
      name: nft.name,
      image: nft.image,
      description: nft.description || `Rank #${nft.rank} with rarity score ${nft.rarity_score}`,
      rank: nft.rank,
      rarity_score: nft.rarity_score,
      attributes: nft.attributes || []
    };
    
    // Save to multiple storage locations for compatibility
    setLocalStorage('selectedPlugNft', nftData);
    setLocalStorage(`theplug_nft_${walletAddress}`, nftData);
    
    // Calculate and apply universal rank-based bonuses
    const calculateRankBonuses = (rank: number) => {
      // Updated tier boundaries to match specification:
      // Mythic: 1-71, Epic: 72-361, Rare: 362-843, Uncommon: 844-1446, Common: 1447-2420
      if (rank >= 1 && rank <= 71) return { tier: 'Mythic', tradingBonus: 25, negotiationBonus: 25, riskReduction: 25, heatReduction: 25, aiResponseQuality: 2.0, missionRewards: 50 };
      else if (rank >= 72 && rank <= 361) return { tier: 'Epic', tradingBonus: 20, negotiationBonus: 20, riskReduction: 20, heatReduction: 20, aiResponseQuality: 1.5, missionRewards: 30 };
      else if (rank >= 362 && rank <= 843) return { tier: 'Rare', tradingBonus: 15, negotiationBonus: 15, riskReduction: 15, heatReduction: 15, aiResponseQuality: 1.2, missionRewards: 20 };
      else if (rank >= 844 && rank <= 1446) return { tier: 'Uncommon', tradingBonus: 10, negotiationBonus: 10, riskReduction: 10, heatReduction: 10, aiResponseQuality: 0.8, missionRewards: 15 };
      else if (rank >= 1447 && rank <= 2420) return { tier: 'Common', tradingBonus: 5, negotiationBonus: 5, riskReduction: 5, heatReduction: 5, aiResponseQuality: 0.5, missionRewards: 10 };
      else return { tier: 'Common', tradingBonus: 5, negotiationBonus: 5, riskReduction: 5, heatReduction: 5, aiResponseQuality: 0.5, missionRewards: 10 }; // fallback
    };
    
    const rankBonuses = calculateRankBonuses(nft.rank);
    setLocalStorage(`nft_bonuses_${walletAddress}`, rankBonuses);
    
    // Expose bonuses globally for all game components
    (window as any).activeNFTBonuses = rankBonuses;
    
    // Unified Plug activation event - single event for all NFT/AI/assistant functionality
    const plugActivatedEvent = new CustomEvent('plugActivated', {
      detail: {
        nft: nftData,
        bonuses: rankBonuses,
        walletAddress: walletAddress
      }
    });
    
    // Use setTimeout to prevent unhandled promise rejection
    setTimeout(() => {
      window.dispatchEvent(plugActivatedEvent);
    }, 0);
    
    console.log(`🎯 [Unified Plug System] Activated The Plug:`, nftData);
    console.log(`🎯 [Plug Bonuses] Applied ${rankBonuses.tier} tier bonuses:`, rankBonuses);
    
    return nftData;
  } catch (error) {
    console.error('❌ Error in saveSelectedNFT:', error);
    throw error;
  }
};

// Tier icon and color system for GROWERZ NFTs
export const getTierInfo = (rank: number) => {
  if (rank >= 1 && rank <= 71) {
    return { 
      tier: 'Mythic', 
      icon: '👑', 
      color: 'bg-gradient-to-r from-purple-500 to-pink-500', 
      textColor: 'text-purple-300',
      borderColor: 'border-purple-400'
    };
  } else if (rank >= 72 && rank <= 361) {
    return { 
      tier: 'Epic', 
      icon: '💎', 
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
      textColor: 'text-yellow-300',
      borderColor: 'border-yellow-400'
    };
  } else if (rank >= 362 && rank <= 843) {
    return { 
      tier: 'Rare', 
      icon: '⭐', 
      color: 'bg-gradient-to-r from-blue-400 to-blue-600', 
      textColor: 'text-blue-300',
      borderColor: 'border-blue-400'
    };
  } else if (rank >= 844 && rank <= 1446) {
    return { 
      tier: 'Uncommon', 
      icon: '🔷', 
      color: 'bg-gradient-to-r from-green-400 to-green-600', 
      textColor: 'text-green-300',
      borderColor: 'border-green-400'
    };
  } else if (rank >= 1447 && rank <= 2420) {
    return { 
      tier: 'Common', 
      icon: '⚪', 
      color: 'bg-gradient-to-r from-gray-400 to-gray-600', 
      textColor: 'text-gray-300',
      borderColor: 'border-gray-400'
    };
  } else {
    return { 
      tier: 'Common', 
      icon: '⚪', 
      color: 'bg-gradient-to-r from-gray-400 to-gray-600', 
      textColor: 'text-gray-300',
      borderColor: 'border-gray-400'
    };
  }
};

// Universal function to get the currently selected NFT across all components
export const getSelectedNFT = (walletAddress: string) => {
  try {
    // Check all possible storage keys for backwards compatibility
    const keys = [
      'selectedPlugNft',
      `theplug_nft_${walletAddress}`,
      `selectedNFT_${walletAddress}`,
      'selectedAssistant'
    ];
    
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const nftData = JSON.parse(stored);
        if (nftData?.mint && nftData?.name) {
          console.log(`🔄 Loaded existing selected NFT: ${nftData.name}`);
          return nftData;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading selected NFT:', error);
    return null;
  }
};

// Universal function to check if user has a selected NFT (for UI states)
export const hasSelectedNFT = (walletAddress: string): boolean => {
  return getSelectedNFT(walletAddress) !== null;
};

export { getLocalStorage, setLocalStorage };
