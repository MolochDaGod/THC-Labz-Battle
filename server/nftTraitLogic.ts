// NFT Metadata interface for trait analysis
interface NFTMetadata {
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// NFT Card interface for generated cards
interface NFTCard {
  id: string;
  name: string;
  image: string;
  attack: number;
  health: number;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'minion' | 'spell' | 'tower';
  class: string;
  description: string;
  abilities: string[];
  isNFTConnected: boolean;
  isAutoDeck?: boolean;
}

// Real NFT trait analysis for authentic game benefits
export interface NFTTraitBonuses {
  attackBonus: number;
  healthBonus: number;
  defenseBonus: number;
  manaBonus: number;
  specialAbilities: string[];
  deckSize: number;
  cardEnhancements: Array<{
    traitType: string;
    traitValue: string;
    cardName: string;
    bonusAttack: number;
    bonusHealth: number;
    specialEffect?: string;
  }>;
}

export interface CaptainCard {
  name: string;
  image: string;
  attack: number;
  health: number;
  abilities: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost: number;
}

// Generate balanced NFT cards between epic and legendary quality - ONLY trait-unlocked cards
export function generateNFTCards(nft: NFTMetadata): NFTCard[] {
  const cards: NFTCard[] = [];
  
  // Generate Captain Card first (auto-fills deck slot 1)
  const captainCard = generateCaptainCard(nft);
  cards.push(captainCard);
  
  // Only generate cards from traits that actually unlock cards (filter out non-card traits)
  if (nft.attributes) {
    const unlockedTraits = nft.attributes.filter(trait => 
      trait.trait_type && 
      trait.value && 
      isTraitCardUnlocked(trait) // Only traits that unlock cards
    );
    
    // Generate cards only from unlocked traits, max based on NFT rank
    const maxCards = nft.rank <= 500 ? 6 : nft.rank <= 1000 ? 5 : 4;
    const traitsToUse = unlockedTraits.slice(0, maxCards - 1); // -1 for captain card
    
    for (let i = 0; i < traitsToUse.length; i++) {
      const trait = traitsToUse[i];
      const traitCard = generateTraitCard(nft, trait, i);
      cards.push(traitCard);
    }
  }
  
  return cards;
}

// Check if a trait unlocks a card (filters out background traits, etc.)
function isTraitCardUnlocked(trait: any): boolean {
  // GROWERZ NFT traits that unlock battle cards
  const cardUnlockingTraits = [
    'Strain', 'Eyes', 'Mouth', 'Clothing', 'Accessories', 'Hat', 'Facial Hair',
    'Skin', 'Hair', 'Expression', 'Glasses', 'Jewelry', 'Special', 'Headgear',
    'Face', 'Body', 'Outfit', 'Item', 'Style', 'Type', 'Color', 'Pattern'
  ];
  
  // Additional check for actual trait values that should generate cards
  const hasValidValue = trait.value && 
    trait.value !== 'None' && 
    trait.value !== 'Normal' && 
    trait.value !== 'Default' &&
    trait.value.trim().length > 0;
  
  const hasUnlockingTraitType = cardUnlockingTraits.some(unlockingTrait => 
    trait.trait_type.toLowerCase().includes(unlockingTrait.toLowerCase()) ||
    trait.trait_type === unlockingTrait
  );
  
  return hasValidValue && hasUnlockingTraitType;
}

// Generate captain card based on NFT (auto-fills slot 1)
function generateCaptainCard(nft: NFTMetadata): NFTCard {
  const rankTier = getRankTier(nft.rank);
  
  return {
    id: `captain-${nft.rank}`,
    name: `${nft.name} Captain`,
    image: nft.image,
    attack: rankTier.captainAttack,
    health: rankTier.captainHealth,
    cost: rankTier.captainCost,
    rarity: rankTier.rarity,
    type: 'minion',
    class: 'captain',
    description: `Legendary captain from ${nft.name}. Auto-fills deck slot 1.`,
    abilities: rankTier.captainAbilities,
    isNFTConnected: true,
    isAutoDeck: true
  };
}

// Generate trait-based cards (epic to legendary quality)
function generateTraitCard(nft: NFTMetadata, trait: any, index: number): NFTCard {
  const traitBonus = calculateTraitBonus(trait);
  const rankTier = getRankTier(nft.rank);
  
  const baseStats = getTraitBaseStats(trait.trait_type);
  
  return {
    id: `nft-${nft.rank}-trait-${index}`,
    name: `${trait.value} ${trait.trait_type}`,
    image: nft.image,
    attack: baseStats.attack + traitBonus.attack + rankTier.cardBonus,
    health: baseStats.health + traitBonus.health + rankTier.cardBonus,
    cost: Math.min(10, Math.max(3, baseStats.cost + Math.floor(traitBonus.mana * 10))),
    rarity: nft.rank <= 300 ? 'legendary' : 'epic',
    type: getTraitCardType(trait.trait_type),
    class: getTraitCardClass(trait.trait_type),
    description: `Enhanced by ${trait.value} trait from ${nft.name}`,
    abilities: [traitBonus.ability || getDefaultAbility(trait.trait_type)],
    isNFTConnected: true
  };
}

// Calculate authentic NFT bonuses based on real traits
export function calculateNFTBonuses(nft: NFTMetadata): NFTTraitBonuses {
  const baseAttack = 50;
  const baseHealth = 100;
  let attackBonus = 0;
  let healthBonus = 0;
  let defenseBonus = 0;
  let manaBonus = 0;
  const specialAbilities: string[] = [];
  const cardEnhancements: any[] = [];

  // Rank-based bonuses (authentic NFT ranking system)
  const rankBonus = calculateRankBonuses(nft.rank);
  attackBonus += rankBonus.attack;
  healthBonus += rankBonus.health;
  defenseBonus += rankBonus.defense;

  // Trait-based bonuses (real NFT attributes)
  if (nft.attributes) {
    for (const trait of nft.attributes) {
      const traitBonus = calculateTraitBonus(trait);
      attackBonus += traitBonus.attack;
      healthBonus += traitBonus.health;
      defenseBonus += traitBonus.defense;
      manaBonus += traitBonus.mana;
      
      if (traitBonus.ability) {
        specialAbilities.push(traitBonus.ability);
      }

      // Create trait-based card enhancement
      cardEnhancements.push({
        traitType: trait.trait_type,
        traitValue: trait.value,
        cardName: `${trait.value} ${trait.trait_type}`,
        bonusAttack: traitBonus.attack,
        bonusHealth: traitBonus.health,
        specialEffect: traitBonus.ability
      });
    }
  }

  // Calculate deck size based on rarity and rank
  const deckSize = calculateDeckSize(nft.rank, nft.attributes?.length || 0);

  return {
    attackBonus,
    healthBonus,
    defenseBonus,
    manaBonus,
    specialAbilities: Array.from(new Set(specialAbilities)), // Remove duplicates
    deckSize,
    cardEnhancements
  };
}

// Get rank tier information for card generation
function getRankTier(rank: number) {
  if (rank <= 100) {
    return {
      rarity: 'legendary' as const,
      captainAttack: 15, captainHealth: 25, captainCost: 8,
      captainAbilities: ['Royal Command', 'Legendary Aura', 'Battle Mastery'],
      cardBonus: 8
    };
  } else if (rank <= 300) {
    return {
      rarity: 'legendary' as const,
      captainAttack: 13, captainHealth: 22, captainCost: 7,
      captainAbilities: ['Elite Command', 'Powerful Aura', 'Combat Expert'],
      cardBonus: 6
    };
  } else if (rank <= 600) {
    return {
      rarity: 'epic' as const,
      captainAttack: 11, captainHealth: 19, captainCost: 6,
      captainAbilities: ['Squad Leader', 'Strong Presence', 'Tactical Mind'],
      cardBonus: 5
    };
  } else if (rank <= 1000) {
    return {
      rarity: 'epic' as const,
      captainAttack: 9, captainHealth: 16, captainCost: 5,
      captainAbilities: ['Team Leader', 'Inspiring', 'Strategic'],
      cardBonus: 4
    };
  } else if (rank <= 1500) {
    return {
      rarity: 'epic' as const,
      captainAttack: 8, captainHealth: 14, captainCost: 4,
      captainAbilities: ['Unit Leader', 'Motivating', 'Organized'],
      cardBonus: 3
    };
  } else {
    return {
      rarity: 'epic' as const,
      captainAttack: 7, captainHealth: 12, captainCost: 4,
      captainAbilities: ['Group Leader', 'Encouraging', 'Coordinated'],
      cardBonus: 2
    };
  }
}

// Get trait-based card stats
function getTraitBaseStats(traitType: string) {
  const traitStats: Record<string, { attack: number; health: number; cost: number }> = {
    'Background': { attack: 8, health: 12, cost: 5 },
    'Eyes': { attack: 10, health: 8, cost: 4 },
    'Clothes': { attack: 6, health: 14, cost: 6 },
    'Head': { attack: 9, health: 11, cost: 5 },
    'Mouth': { attack: 11, health: 9, cost: 4 },
    'Accessories': { attack: 7, health: 13, cost: 6 },
    'Skin': { attack: 8, health: 10, cost: 4 },
    'Hair': { attack: 9, health: 9, cost: 4 }
  };
  
  return traitStats[traitType] || { attack: 8, health: 10, cost: 4 };
}

// Get trait-based card type
function getTraitCardType(traitType: string): 'minion' | 'spell' | 'tower' {
  const typeMap: Record<string, 'minion' | 'spell' | 'tower'> = {
    'Background': 'tower',
    'Eyes': 'minion',
    'Clothes': 'minion',
    'Head': 'minion',
    'Mouth': 'spell',
    'Accessories': 'minion',
    'Skin': 'minion',
    'Hair': 'minion'
  };
  
  return typeMap[traitType] || 'minion';
}

// Get trait-based card class
function getTraitCardClass(traitType: string): string {
  const classMap: Record<string, string> = {
    'Background': 'fortress',
    'Eyes': 'archer',
    'Clothes': 'warrior',
    'Head': 'leader',
    'Mouth': 'caster',
    'Accessories': 'support',
    'Skin': 'guardian',
    'Hair': 'scout'
  };
  
  return classMap[traitType] || 'warrior';
}

// Get default ability for trait type
function getDefaultAbility(traitType: string): string {
  const abilityMap: Record<string, string> = {
    'Background': 'Fortress Defense',
    'Eyes': 'Sharp Sight',
    'Clothes': 'Armor Boost',
    'Head': 'Leadership',
    'Mouth': 'Battle Cry',
    'Accessories': 'Enhancement',
    'Skin': 'Tough Hide',
    'Hair': 'Quick Strike'
  };
  
  return abilityMap[traitType] || 'Basic Attack';
}

// Generate captain card from authentic NFT data
export function generateCaptainCard(nft: NFTMetadata, bonuses: NFTTraitBonuses): CaptainCard {
  const baseAttack = 60;
  const baseHealth = 120;
  
  // Calculate rarity based on rank (authentic ranking system)
  const rarity = getRarityFromRank(nft.rank);
  
  return {
    name: nft.name,
    image: nft.image,
    attack: baseAttack + bonuses.attackBonus,
    health: baseHealth + bonuses.healthBonus,
    abilities: bonuses.specialAbilities,
    rarity,
    cost: 0 // Captain cards are free to deploy
  };
}

// Enhanced deck generation using real NFT traits
export function generateEnhancedDeck(nft: NFTMetadata, bonuses: NFTTraitBonuses): any[] {
  const baseDeck = [
    { name: 'Grower Soldier', attack: 53, health: 80, cost: 2, type: 'basic' },
    { name: 'THC Defender', attack: 33, health: 130, cost: 2, type: 'tank' },
    { name: 'Bud Archer', attack: 73, health: 50, cost: 3, type: 'ranged' },
    { name: 'Strain Wizard', attack: 83, health: 45, cost: 4, type: 'spell' },
    { name: 'Kush Guardian', attack: 43, health: 110, cost: 3, type: 'defender' },
    { name: 'Hash Bomber', attack: 93, health: 35, cost: 4, type: 'explosive' },
    { name: 'Dank Knight', attack: 63, health: 85, cost: 3, type: 'warrior' },
    { name: 'Green Healer', attack: 23, health: 70, cost: 2, type: 'support' }
  ];

  // Apply NFT bonuses to each card
  const enhancedCards = baseDeck.map(card => ({
    ...card,
    attack: card.attack + bonuses.attackBonus,
    health: card.health + bonuses.healthBonus,
    description: `Enhanced by ${nft.name}`
  }));

  // Add trait-based cards from real NFT attributes
  const traitCards = bonuses.cardEnhancements.map(enhancement => ({
    name: enhancement.cardName,
    attack: 40 + enhancement.bonusAttack,
    health: 60 + enhancement.bonusHealth,
    cost: 2,
    type: 'trait',
    description: `${enhancement.traitType}: ${enhancement.traitValue}`,
    specialEffect: enhancement.specialEffect
  }));

  // Combine and limit to deck size
  const fullDeck = [...enhancedCards, ...traitCards];
  return fullDeck.slice(0, bonuses.deckSize);
}

// Authentic rank-based bonus calculation - ALL NFTs get meaningful bonuses
function calculateRankBonuses(rank: number): { attack: number; health: number; defense: number } {
  // Enhanced bonus system ensuring ALL NFTs from GROWERZ collection get significant bonuses
  // Lower rank numbers = rarer NFTs = higher bonuses
  if (rank <= 100) return { attack: 35, health: 70, defense: 25 }; // Top 100 - Legendary
  if (rank <= 300) return { attack: 25, health: 50, defense: 18 }; // Top 300 - Epic  
  if (rank <= 600) return { attack: 20, health: 40, defense: 15 }; // Top 600 - Rare
  if (rank <= 1000) return { attack: 15, health: 30, defense: 12 }; // Top 1000 - Uncommon
  if (rank <= 1500) return { attack: 12, health: 25, defense: 10 }; // Top 1500 - Common+
  if (rank <= 2000) return { attack: 10, health: 20, defense: 8 }; // Top 2000 - Common
  return { attack: 8, health: 15, defense: 5 }; // All remaining NFTs still get solid bonuses
}

// Real trait bonus calculation based on actual NFT attributes
function calculateTraitBonus(trait: { trait_type: string; value: string }): {
  attack: number;
  health: number;
  defense: number;
  mana: number;
  ability?: string;
} {
  const { trait_type, value } = trait;
  
  // Authentic trait bonuses based on GROWERZ collection traits
  switch (trait_type.toLowerCase()) {
    case 'background':
      return getBackgroundBonus(value);
    case 'skin':
      return getSkinBonus(value);
    case 'clothes':
      return getClothesBonus(value);
    case 'eyes':
      return getEyesBonus(value);
    case 'mouth':
      return getMouthBonus(value);
    case 'head':
      return getHeadBonus(value);
    case 'attribute count':
      return { attack: parseInt(value) * 2, health: parseInt(value) * 3, defense: parseInt(value), mana: 0 };
    default:
      return { attack: 1, health: 2, defense: 0, mana: 0 };
  }
}

function getBackgroundBonus(value: string): { attack: number; health: number; defense: number; mana: number; ability?: string } {
  const bonuses: Record<string, { attack: number; health: number; defense: number; mana: number; ability?: string }> = {
    'Blue': { attack: 5, health: 10, defense: 2, mana: 0.01 },
    'Green': { attack: 8, health: 5, defense: 1, mana: 0.02 },
    'Purple': { attack: 12, health: 8, defense: 3, mana: 0.03, ability: 'Magic Resistance' },
    'Red': { attack: 15, health: 5, defense: 0, mana: 0.01, ability: 'Berserker Rage' },
    'Gold': { attack: 20, health: 15, defense: 5, mana: 0.05, ability: 'Golden Aura' }
  };
  return bonuses[value] || { attack: 2, health: 3, defense: 1, mana: 0 };
}

function getSkinBonus(value: string): { attack: number; health: number; defense: number; mana: number; ability?: string } {
  const bonuses: Record<string, { attack: number; health: number; defense: number; mana: number; ability?: string }> = {
    'Alien': { attack: 15, health: 10, defense: 3, mana: 0.03, ability: 'Alien Tech' },
    'Zombie': { attack: 12, health: 20, defense: 0, mana: 0.01, ability: 'Undead' },
    'Robot': { attack: 18, health: 15, defense: 8, mana: 0.02, ability: 'Mechanical' },
    'Skeleton': { attack: 10, health: 25, defense: 5, mana: 0.02, ability: 'Bone Armor' },
    'Normal': { attack: 5, health: 8, defense: 2, mana: 0.01 }
  };
  return bonuses[value] || { attack: 3, health: 5, defense: 1, mana: 0 };
}

function getClothesBonus(value: string): { attack: number; health: number; defense: number; mana: number; ability?: string } {
  const bonuses: Record<string, { attack: number; health: number; defense: number; mana: number; ability?: string }> = {
    'Armor': { attack: 5, health: 20, defense: 15, mana: 0.01, ability: 'Heavy Defense' },
    'Jacket': { attack: 8, health: 12, defense: 5, mana: 0.02 },
    'Hoodie': { attack: 6, health: 10, defense: 3, mana: 0.01 },
    'Suit': { attack: 12, health: 8, defense: 8, mana: 0.03, ability: 'Professional' }
  };
  return bonuses[value] || { attack: 2, health: 4, defense: 1, mana: 0 };
}

function getEyesBonus(value: string): { attack: number; health: number; defense: number; mana: number; ability?: string } {
  const bonuses: Record<string, { attack: number; health: number; defense: number; mana: number; ability?: string }> = {
    'Laser': { attack: 20, health: 5, defense: 0, mana: 0.04, ability: 'Laser Vision' },
    'Fire': { attack: 15, health: 8, defense: 2, mana: 0.03, ability: 'Burning Gaze' },
    'Ice': { attack: 10, health: 12, defense: 5, mana: 0.03, ability: 'Freeze' },
    'Normal': { attack: 3, health: 5, defense: 1, mana: 0.01 }
  };
  return bonuses[value] || { attack: 2, health: 3, defense: 1, mana: 0 };
}

function getMouthBonus(value: string): { attack: number; health: number; defense: number; mana: number; ability?: string } {
  const bonuses: Record<string, { attack: number; health: number; defense: number; mana: number; ability?: string }> = {
    'Fangs': { attack: 12, health: 5, defense: 0, mana: 0.02, ability: 'Vampire Bite' },
    'Smile': { attack: 5, health: 10, defense: 3, mana: 0.02, ability: 'Morale Boost' },
    'Cigar': { attack: 8, health: 8, defense: 2, mana: 0.03, ability: 'Smoke Screen' }
  };
  return bonuses[value] || { attack: 1, health: 2, defense: 0, mana: 0 };
}

function getHeadBonus(value: string): { attack: number; health: number; defense: number; mana: number; ability?: string } {
  const bonuses: Record<string, { attack: number; health: number; defense: number; mana: number; ability?: string }> = {
    'Crown': { attack: 15, health: 20, defense: 10, mana: 0.05, ability: 'Royal Command' },
    'Helmet': { attack: 8, health: 15, defense: 12, mana: 0.02, ability: 'Head Protection' },
    'Hat': { attack: 5, health: 8, defense: 3, mana: 0.02 },
    'Bandana': { attack: 10, health: 6, defense: 2, mana: 0.03, ability: 'Street Smart' }
  };
  return bonuses[value] || { attack: 2, health: 3, defense: 1, mana: 0 };
}

function calculateDeckSize(rank: number, traitCount: number): number {
  let baseSize = 8;
  
  // Rank bonus
  if (rank <= 100) baseSize += 4;
  else if (rank <= 500) baseSize += 3;
  else if (rank <= 1000) baseSize += 2;
  else if (rank <= 2000) baseSize += 1;
  
  // Trait count bonus
  baseSize += Math.floor(traitCount / 2);
  
  return Math.min(baseSize, 15); // Cap at 15 cards
}

function getRarityFromRank(rank: number): 'common' | 'rare' | 'epic' | 'legendary' {
  if (rank <= 50) return 'legendary';
  if (rank <= 200) return 'epic';
  if (rank <= 800) return 'rare';
  return 'common';
}