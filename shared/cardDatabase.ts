// Complete card database - all available cards in the game
export interface CardData {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  class: 'ranged' | 'magical' | 'tank' | 'melee';
  type: 'tower' | 'minion' | 'spell';
  image: string;
  abilities?: string[];
  traitRequirements?: string[]; // Which NFT traits unlock this card
}

// Master card database - these are ALL the cards available in the game
export const MASTER_CARD_DATABASE: CardData[] = [
  // Warriors/Melee Units
  {
    id: 'desert_warrior',
    name: 'Desert Warrior',
    cost: 3,
    attack: 85,
    health: 160,
    description: 'Hardy warrior adapted to desert combat',
    rarity: 'rare',
    class: 'melee',
    type: 'minion',
    image: '/attached_assets/good_dealer.png',
    abilities: ['heat_resistance'],
    traitRequirements: ['Background:Desert']
  },
  {
    id: 'heavy_tank',
    name: 'Heavy Tank',
    cost: 4,
    attack: 60,
    health: 200,
    description: 'Heavily armored defensive unit',
    rarity: 'rare',
    class: 'tank',
    type: 'minion',
    image: '/attached_assets/OEnuzI4_1753906070523.png',
    abilities: ['defense', 'taunt'],
    traitRequirements: ['Combat_Role:Tank']
  },
  {
    id: 'archer_ranger',
    name: 'Archer Ranger',
    cost: 3,
    attack: 95,
    health: 120,
    description: 'Long-range combat specialist',
    rarity: 'common',
    class: 'ranged',
    type: 'minion',
    image: '/attached_assets/eUOASsw_1753906068538.png',
    abilities: ['long_range', 'precision'],
    traitRequirements: ['Combat_Role:Ranged']
  },
  {
    id: 'shadow_assassin',
    name: 'Shadow Assassin',
    cost: 3,
    attack: 110,
    health: 90,
    description: 'Stealthy high-damage assassin',
    rarity: 'rare',
    class: 'melee',
    type: 'minion',
    image: '/attached_assets/7EBiEdQ_1753906078020.png',
    abilities: ['stealth', 'critical_strike'],
    traitRequirements: ['Skin:Shadow', 'Clothes:Hoodie']
  },
  {
    id: 'spell_caster',
    name: 'Spell Caster',
    cost: 4,
    attack: 85,
    health: 130,
    description: 'Magic wielder with spell abilities',
    rarity: 'rare',
    class: 'magical',
    type: 'minion',
    image: '/attached_assets/good_dealer.png',
    abilities: ['spell_casting', 'mana_burn'],
    traitRequirements: ['Background:Galaxy', 'Background:Space']
  },
  {
    id: 'fury_berserker',
    name: 'Fury Berserker',
    cost: 3,
    attack: 120,
    health: 100,
    description: 'Rage-fueled melee fighter',
    rarity: 'common',
    class: 'melee',
    type: 'minion',
    image: '/attached_assets/OEnuzI4_1753906070523.png',
    abilities: ['rage', 'fury'],
    traitRequirements: ['Mouth:Angry']
  },
  {
    id: 'blue_elemental',
    name: 'Blue Elemental',
    cost: 3,
    attack: 80,
    health: 160,
    description: 'Water-blessed elemental warrior',
    rarity: 'common',
    class: 'magical',
    type: 'minion',
    image: '/attached_assets/eUOASsw_1753906068538.png',
    abilities: ['water_blessing'],
    traitRequirements: ['Background:Blue']
  },
  {
    id: 'galaxy_cosmic',
    name: 'Galaxy Cosmic',
    cost: 4,
    attack: 90,
    health: 180,
    description: 'Cosmic warrior from distant galaxies',
    rarity: 'epic',
    class: 'magical',
    type: 'minion',
    image: '/attached_assets/7EBiEdQ_1753906078020.png',
    abilities: ['cosmic_power'],
    traitRequirements: ['Background:Galaxy']
  },
  {
    id: 'forest_guardian',
    name: 'Forest Guardian',
    cost: 3,
    attack: 70,
    health: 200,
    description: 'Nature guardian with healing powers',
    rarity: 'rare',
    class: 'tank',
    type: 'minion',
    image: '/attached_assets/good_dealer.png',
    abilities: ['healing'],
    traitRequirements: ['Background:Forest']
  },
  {
    id: 'space_wanderer',
    name: 'Space Wanderer',
    cost: 5,
    attack: 100,
    health: 170,
    description: 'Void-walking space explorer',
    rarity: 'epic',
    class: 'ranged',
    type: 'minion',
    image: '/attached_assets/eUOASsw_1753906068538.png',
    abilities: ['void_walk'],
    traitRequirements: ['Background:Space']
  },
  {
    id: 'lab_technician',
    name: 'Lab Technician',
    cost: 4,
    attack: 80,
    health: 160,
    description: 'Scientific researcher with tech enhancements',
    rarity: 'rare',
    class: 'ranged',
    type: 'minion',
    image: '/attached_assets/7EBiEdQ_1753906078020.png',
    abilities: ['science_boost'],
    traitRequirements: ['Background:Lab', 'Clothes:Lab Coat']
  },
  
  // Strain-based legendary cards
  {
    id: 'og_kush_legend',
    name: 'OG Kush Legend',
    cost: 5,
    attack: 110,
    health: 150,
    description: 'Legendary strain warrior with ultimate potency',
    rarity: 'legendary',
    class: 'melee',
    type: 'minion',
    image: '/attached_assets/good_dealer.png',
    abilities: ['legendary_strain', 'potency'],
    traitRequirements: ['Strain:OG Kush']
  },
  {
    id: 'sour_diesel_energizer',
    name: 'Sour Diesel Energizer',
    cost: 4,
    attack: 95,
    health: 140,
    description: 'High-energy strain warrior with speed boost',
    rarity: 'epic',
    class: 'ranged',
    type: 'minion',
    image: '/attached_assets/OEnuzI4_1753906070523.png',
    abilities: ['energy_boost', 'speed'],
    traitRequirements: ['Strain:Sour Diesel']
  },
  {
    id: 'white_widow_frost',
    name: 'White Widow Frost',
    cost: 4,
    attack: 80,
    health: 220,
    description: 'Resilient frost warrior with armor',
    rarity: 'epic',
    class: 'tank',
    type: 'minion',
    image: '/attached_assets/eUOASsw_1753906068538.png',
    abilities: ['frost_armor', 'resilience'],
    traitRequirements: ['Strain:White Widow']
  },
  {
    id: 'gelato_healer',
    name: 'Gelato Healer',
    cost: 4,
    attack: 85,
    health: 190,
    description: 'Sweet strain warrior with healing aura',
    rarity: 'rare',
    class: 'magical',
    type: 'minion',
    image: '/attached_assets/7EBiEdQ_1753906078020.png',
    abilities: ['healing_aura', 'sweet_scent'],
    traitRequirements: ['Strain:Gelato']
  },
  
  // Special trait cards
  {
    id: 'undead_warrior',
    name: 'Undead Warrior',
    cost: 5,
    attack: 120,
    health: 140,
    description: 'Fearsome undead with bone armor',
    rarity: 'epic',
    class: 'tank',
    type: 'minion',
    image: '/attached_assets/7EBiEdQ_1753906078020.png',
    abilities: ['fear', 'bone_armor'],
    traitRequirements: ['Skin:Skull']
  },
  {
    id: 'royal_commander',
    name: 'Royal Commander',
    cost: 6,
    attack: 120,
    health: 180,
    description: 'Noble leader with command abilities',
    rarity: 'legendary',
    class: 'melee',
    type: 'minion',
    image: '/attached_assets/good_dealer.png',
    abilities: ['command', 'leadership'],
    traitRequirements: ['Head:Crown', 'Accessory:Crown']
  },
  {
    id: 'spiked_punk',
    name: 'Spiked Punk',
    cost: 4,
    attack: 95,
    health: 165,
    description: 'Rebellious fighter with thorns',
    rarity: 'rare',
    class: 'melee',
    type: 'minion',
    image: '/attached_assets/OEnuzI4_1753906070523.png',
    abilities: ['thorns', 'intimidate'],
    traitRequirements: ['Clothes:Spiked Jacket']
  },
  
  // Tower cards
  {
    id: 'grower_tower',
    name: 'Grower Tower',
    cost: 5,
    attack: 100,
    health: 300,
    description: 'Defensive tower that spawns minions',
    rarity: 'rare',
    class: 'ranged',
    type: 'tower',
    image: '/attached_assets/good_dealer.png',
    abilities: ['spawn_minions', 'area_defense'],
    traitRequirements: []
  },
  {
    id: 'mystic_tower',
    name: 'Mystic Tower',
    cost: 6,
    attack: 80,
    health: 350,
    description: 'Magic tower with spell casting abilities',
    rarity: 'epic',
    class: 'magical',
    type: 'tower',
    image: '/attached_assets/eUOASsw_1753906068538.png',
    abilities: ['spell_tower', 'mana_regeneration'],
    traitRequirements: ['Background:Galaxy', 'Background:Space']
  },
  
  // Spell cards
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    cost: 3,
    attack: 150,
    health: 0,
    description: 'Direct damage spell',
    rarity: 'common',
    class: 'magical',
    type: 'spell',
    image: '/attached_assets/7EBiEdQ_1753906078020.png',
    abilities: ['instant_damage'],
    traitRequirements: []
  },
  {
    id: 'healing_potion',
    name: 'Healing Potion',
    cost: 2,
    attack: 0,
    health: 100,
    description: 'Restore health to target',
    rarity: 'common',
    class: 'magical',
    type: 'spell',
    image: '/attached_assets/good_dealer.png',
    abilities: ['heal_target'],
    traitRequirements: []
  },
  {
    id: 'frost_nova',
    name: 'Frost Nova',
    cost: 4,
    attack: 80,
    health: 0,
    description: 'Area freeze and damage spell',
    rarity: 'rare',
    class: 'magical',
    type: 'spell',
    image: '/attached_assets/eUOASsw_1753906068538.png',
    abilities: ['area_damage', 'freeze'],
    traitRequirements: ['Strain:White Widow']
  },
  {
    id: 'rage_buff',
    name: 'Rage Buff',
    cost: 2,
    attack: 0,
    health: 0,
    description: 'Boost ally attack temporarily',
    rarity: 'uncommon',
    class: 'magical',
    type: 'spell',
    image: '/attached_assets/OEnuzI4_1753906070523.png',
    abilities: ['attack_boost'],
    traitRequirements: []
  }
];

// Helper functions for card management
export function getCardById(id: string): CardData | undefined {
  return MASTER_CARD_DATABASE.find(card => card.id === id);
}

export function getCardsByRarity(rarity: string): CardData[] {
  return MASTER_CARD_DATABASE.filter(card => card.rarity === rarity);
}

export function getCardsByType(type: string): CardData[] {
  return MASTER_CARD_DATABASE.filter(card => card.type === type);
}

export function getCardsByClass(cardClass: string): CardData[] {
  return MASTER_CARD_DATABASE.filter(card => card.class === cardClass);
}

// Get cards available for specific NFT traits
export function getAvailableCardsForTraits(nftTraits: Array<{trait_type: string, value: string}>): CardData[] {
  const availableCards: CardData[] = [];
  
  // Always include basic cards (no trait requirements)
  const basicCards = MASTER_CARD_DATABASE.filter(card => 
    !card.traitRequirements || card.traitRequirements.length === 0
  );
  availableCards.push(...basicCards);
  
  // Add trait-specific cards
  nftTraits.forEach(trait => {
    const traitKey = `${trait.trait_type}:${trait.value}`;
    const matchingCards = MASTER_CARD_DATABASE.filter(card => 
      card.traitRequirements?.includes(traitKey)
    );
    availableCards.push(...matchingCards);
  });
  
  // Remove duplicates
  const uniqueCards = availableCards.filter((card, index, self) => 
    index === self.findIndex(c => c.id === card.id)
  );
  
  return uniqueCards;
}