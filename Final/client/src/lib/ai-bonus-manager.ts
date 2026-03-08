/**
 * AI Assistant Bonus Manager
 * Applies real NFT trait bonuses to gameplay mechanics
 */

export interface NFTTraitBonus {
  type: string;
  value: number;
  description: string;
}

export interface NFTGameBonus {
  rarityBonus: NFTTraitBonus;
  traitBonuses: NFTTraitBonus[];
  totalBonus: number;
  description: string;
}

export interface AIBonusManager {
  isActive: boolean;
  nftMint: string | null;
  bonuses: NFTGameBonus | null;
  lastUpdate: number;
}

// Global AI Bonus state
let aiBonusState: AIBonusManager = {
  isActive: false,
  nftMint: null,
  bonuses: null,
  lastUpdate: 0
};

/**
 * Initialize AI Assistant bonuses from selected NFT
 */
export async function initializeAIBonuses(nftMint: string): Promise<boolean> {
  try {
    console.log(`🤖 Initializing AI bonuses for NFT: ${nftMint}`);
    
    const response = await fetch(`/api/nft/analyze/${nftMint}`);
    if (!response.ok) {
      console.error('Failed to fetch NFT analysis:', response.status);
      return false;
    }
    
    const data = await response.json();
    if (!data.success || !data.game_bonuses) {
      console.error('Invalid NFT analysis response:', data);
      return false;
    }
    
    aiBonusState = {
      isActive: true,
      nftMint,
      bonuses: data.game_bonuses,
      lastUpdate: Date.now()
    };
    
    console.log(`✅ AI bonuses activated:`, {
      rarity: data.rarity_tier,
      totalBonus: (data.game_bonuses.totalBonus * 100).toFixed(1) + '%',
      traits: data.game_bonuses.traitBonuses.length
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing AI bonuses:', error);
    return false;
  }
}

/**
 * Deactivate AI Assistant bonuses
 */
export function deactivateAIBonuses(): void {
  aiBonusState = {
    isActive: false,
    nftMint: null,
    bonuses: null,
    lastUpdate: Date.now()
  };
  console.log('🚫 AI bonuses deactivated');
}

/**
 * Get current AI bonus state
 */
export function getAIBonusState(): AIBonusManager {
  return { ...aiBonusState };
}

/**
 * Apply market price bonuses (buy/sell operations)
 */
export function applyMarketBonus(basePrice: number, operation: 'buy' | 'sell'): {
  finalPrice: number;
  bonus: number;
  description: string;
} {
  if (!aiBonusState.isActive || !aiBonusState.bonuses) {
    return {
      finalPrice: basePrice,
      bonus: 0,
      description: 'No AI assistant active'
    };
  }
  
  let totalBonus = 0;
  let descriptions: string[] = [];
  
  // Apply rarity bonus
  const rarityMultiplier = (aiBonusState.bonuses.rarityBonus.value / 100);
  
  // Apply relevant trait bonuses
  aiBonusState.bonuses.traitBonuses.forEach(bonus => {
    switch (bonus.type) {
      case 'wealth':
        if (operation === 'sell') {
          totalBonus += bonus.value;
          descriptions.push(`+${bonus.value}% wealth bonus`);
        }
        break;
      case 'intimidation':
        if (operation === 'buy') {
          totalBonus += bonus.value;
          descriptions.push(`+${bonus.value}% intimidation discount`);
        }
        break;
      case 'lab_access':
        totalBonus += bonus.value * 0.5; // Applies to both buy/sell
        descriptions.push(`+${(bonus.value * 0.5).toFixed(1)}% lab knowledge`);
        break;
      case 'loyalty':
        totalBonus += bonus.value * 0.3; // Customer loyalty bonus
        descriptions.push(`+${(bonus.value * 0.3).toFixed(1)}% loyalty bonus`);
        break;
    }
  });
  
  // Add base rarity bonus
  totalBonus += rarityMultiplier;
  descriptions.unshift(`+${rarityMultiplier.toFixed(1)}% rarity bonus`);
  
  // Calculate final price
  const bonusMultiplier = operation === 'sell' 
    ? (1 + totalBonus / 100)  // Increase sell prices
    : (1 - totalBonus / 200); // Decrease buy prices (less aggressive)
    
  const finalPrice = Math.max(1, Math.round(basePrice * bonusMultiplier));
  
  return {
    finalPrice,
    bonus: totalBonus,
    description: descriptions.join(', ')
  };
}

/**
 * Apply heat reduction bonuses
 */
export function applyHeatReduction(baseHeatIncrease: number): {
  finalHeat: number;
  reduction: number;
  description: string;
} {
  if (!aiBonusState.isActive || !aiBonusState.bonuses) {
    return {
      finalHeat: baseHeatIncrease,
      reduction: 0,
      description: 'No AI assistant active'
    };
  }
  
  let totalReduction = 0;
  let descriptions: string[] = [];
  
  // Apply relevant trait bonuses
  aiBonusState.bonuses.traitBonuses.forEach(bonus => {
    switch (bonus.type) {
      case 'stealth':
        totalReduction += bonus.value;
        descriptions.push(`-${bonus.value}% stealth bonus`);
        break;
      case 'night_ops':
        totalReduction += bonus.value * 0.6;
        descriptions.push(`-${(bonus.value * 0.6).toFixed(1)}% night ops`);
        break;
      case 'peace_deals':
        totalReduction += bonus.value;
        descriptions.push(`-${bonus.value}% peaceful aura`);
        break;
    }
  });
  
  // Apply rarity-based heat reduction
  const rarityReduction = aiBonusState.bonuses.rarityBonus.value * 0.2;
  totalReduction += rarityReduction;
  descriptions.unshift(`-${rarityReduction.toFixed(1)}% rarity stealth`);
  
  const reductionMultiplier = Math.max(0, 1 - totalReduction / 100);
  const finalHeat = Math.max(0, baseHeatIncrease * reductionMultiplier);
  
  return {
    finalHeat,
    reduction: totalReduction,
    description: descriptions.join(', ')
  };
}

/**
 * Apply achievement progress bonuses
 */
export function applyAchievementBonus(baseProgress: number): {
  finalProgress: number;
  bonus: number;
  description: string;
} {
  if (!aiBonusState.isActive || !aiBonusState.bonuses) {
    return {
      finalProgress: baseProgress,
      bonus: 0,
      description: 'No AI assistant active'
    };
  }
  
  // AI assistant provides 15% faster achievement progress
  const achievementBonus = aiBonusState.bonuses.rarityBonus.value * 0.15;
  const bonusMultiplier = 1 + achievementBonus / 100;
  const finalProgress = baseProgress * bonusMultiplier;
  
  return {
    finalProgress,
    bonus: achievementBonus,
    description: `+${achievementBonus.toFixed(1)}% AI achievement acceleration`
  };
}

/**
 * Apply conversation/AI interaction bonuses
 */
export function applyConversationBonus(): {
  bonus: number;
  description: string;
} {
  if (!aiBonusState.isActive || !aiBonusState.bonuses) {
    return {
      bonus: 0,
      description: 'No AI assistant active'
    };
  }
  
  let conversationBonus = 0;
  let descriptions: string[] = [];
  
  // Apply relevant trait bonuses
  aiBonusState.bonuses.traitBonuses.forEach(bonus => {
    switch (bonus.type) {
      case 'sunshine':
        conversationBonus += bonus.value;
        descriptions.push(`+${bonus.value}% bright energy`);
        break;
      case 'psychic':
        conversationBonus += bonus.value;
        descriptions.push(`+${bonus.value}% psychic insight`);
        break;
      case 'playful':
        conversationBonus += bonus.value * 0.8;
        descriptions.push(`+${(bonus.value * 0.8).toFixed(1)}% playful charm`);
        break;
    }
  });
  
  // Add base rarity conversation bonus
  const rarityBonus = aiBonusState.bonuses.rarityBonus.value * 0.5;
  conversationBonus += rarityBonus;
  descriptions.unshift(`+${rarityBonus.toFixed(1)}% rarity charisma`);
  
  return {
    bonus: conversationBonus,
    description: descriptions.join(', ')
  };
}

/**
 * Apply money/profit bonuses
 */
export function applyProfitBonus(baseMoney: number): {
  finalMoney: number;
  bonus: number;
  description: string;
} {
  if (!aiBonusState.isActive || !aiBonusState.bonuses) {
    return {
      finalMoney: baseMoney,
      bonus: 0,
      description: 'No AI assistant active'
    };
  }
  
  let totalBonus = 0;
  let descriptions: string[] = [];
  
  // Apply relevant trait bonuses
  aiBonusState.bonuses.traitBonuses.forEach(bonus => {
    switch (bonus.type) {
      case 'wealth':
        totalBonus += bonus.value;
        descriptions.push(`+${bonus.value}% wealth attraction`);
        break;
      case 'lab_access':
        totalBonus += bonus.value * 0.3;
        descriptions.push(`+${(bonus.value * 0.3).toFixed(1)}% lab profits`);
        break;
      case 'patriot':
        totalBonus += bonus.value * 0.4;
        descriptions.push(`+${(bonus.value * 0.4).toFixed(1)}% patriot bonus`);
        break;
    }
  });
  
  // Add base rarity money bonus
  const rarityBonus = aiBonusState.bonuses.rarityBonus.value * 0.3;
  totalBonus += rarityBonus;
  descriptions.unshift(`+${rarityBonus.toFixed(1)}% rarity prosperity`);
  
  const bonusMultiplier = 1 + totalBonus / 100;
  const finalMoney = Math.round(baseMoney * bonusMultiplier);
  
  return {
    finalMoney,
    bonus: totalBonus,
    description: descriptions.join(', ')
  };
}

/**
 * Get current AI bonus summary for UI display
 */
export function getAIBonusSummary(): {
  isActive: boolean;
  nftName: string;
  rarityTier: string;
  totalEffectiveness: string;
  activeSkills: string[];
  marketBonus: string;
  stealthBonus: string;
  profitBonus: string;
} | null {
  if (!aiBonusState.isActive || !aiBonusState.bonuses) {
    return null;
  }
  
  const marketBonus = aiBonusState.bonuses.traitBonuses
    .filter(b => ['wealth', 'intimidation', 'lab_access'].includes(b.type))
    .reduce((sum, b) => sum + b.value, 0) + aiBonusState.bonuses.rarityBonus.value;
    
  const stealthBonus = aiBonusState.bonuses.traitBonuses
    .filter(b => ['stealth', 'night_ops', 'peace_deals'].includes(b.type))
    .reduce((sum, b) => sum + b.value, 0) + (aiBonusState.bonuses.rarityBonus.value * 0.2);
    
  const profitBonus = aiBonusState.bonuses.traitBonuses
    .filter(b => ['wealth', 'lab_access', 'patriot'].includes(b.type))
    .reduce((sum, b) => sum + b.value, 0) + (aiBonusState.bonuses.rarityBonus.value * 0.3);
  
  const activeSkills = aiBonusState.bonuses.traitBonuses.map(b => b.description);
  
  return {
    isActive: true,
    nftName: `NFT Assistant`,
    rarityTier: 'Active',
    totalEffectiveness: (aiBonusState.bonuses.totalBonus * 100).toFixed(1) + '%',
    activeSkills,
    marketBonus: `+${marketBonus.toFixed(1)}%`,
    stealthBonus: `-${stealthBonus.toFixed(1)}%`,
    profitBonus: `+${profitBonus.toFixed(1)}%`
  };
}