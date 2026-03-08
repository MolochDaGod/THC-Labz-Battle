// Central card database for THC CLASH
// This file defines all available cards based on the classification script
// Cards are mapped to NFT traits for gameplay

export interface GameCard {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cardClass: 'ranged' | 'magical' | 'tank' | 'melee';
  type: 'tower' | 'minion' | 'spell';
  image: string;
  abilities?: string[];
  unitType?: string;
  traitMappings?: string[]; // Which NFT traits can generate this card
}

// Core card database from classification script
export const CARD_DATABASE: GameCard[] = [
  // Minion Cards - Based on classification script images
  {
    id: 'warrior_desert',
    name: 'Desert Warrior',
    cost: 3,
    attack: 85,
    health: 160,
    description: 'Hardy warrior adapted to desert combat',
    rarity: 'common',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/9MIRkig.png',
    abilities: ['charge', 'heat_resistance'],
    unitType: 'warrior',
    traitMappings: ['Background:Desert', 'Clothes:Warrior Gear']
  },
  {
    id: 'tank_heavy',
    name: 'Heavy Defender',
    cost: 4,
    attack: 60,
    health: 220,
    description: 'Heavily armored defensive unit',
    rarity: 'rare',
    cardClass: 'tank',
    type: 'minion',
    image: 'https://i.imgur.com/xYICWlW.png',
    abilities: ['taunt', 'armor'],
    unitType: 'tank',
    traitMappings: ['Clothes:Armor', 'Head:Helmet']
  },
  {
    id: 'archer_elite',
    name: 'Elite Archer',
    cost: 3,
    attack: 95,
    health: 120,
    description: 'Long-range combat specialist',
    rarity: 'common',
    cardClass: 'ranged',
    type: 'minion',
    image: 'https://i.imgur.com/dHAvPGk.png',
    abilities: ['long_range', 'precision'],
    unitType: 'ranged',
    traitMappings: ['Background:Forest', 'Eyes:Focused']
  },
  {
    id: 'assassin_shadow',
    name: 'Shadow Assassin',
    cost: 3,
    attack: 110,
    health: 90,
    description: 'Stealthy high-damage assassin',
    rarity: 'rare',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/PLOIquA.png',
    abilities: ['stealth', 'critical_strike'],
    unitType: 'assassin',
    traitMappings: ['Clothes:Hoodie', 'Background:Dark']
  },
  {
    id: 'champion_legendary',
    name: 'Legendary Champion',
    cost: 6,
    attack: 140,
    health: 200,
    description: 'Ultimate legendary warrior',
    rarity: 'legendary',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/fSgTMOt.png',
    abilities: ['legendary_power', 'intimidate'],
    unitType: 'legendary',
    traitMappings: ['Head:Crown', 'Clothes:Royal']
  },
  {
    id: 'cosmic_guardian',
    name: 'Cosmic Guardian',
    cost: 5,
    attack: 100,
    health: 180,
    description: 'Ethereal guardian from space',
    rarity: 'epic',
    cardClass: 'magical',
    type: 'minion',
    image: 'https://i.imgur.com/jNWxvLY.png',
    abilities: ['cosmic_shield', 'void_walk'],
    unitType: 'cosmic',
    traitMappings: ['Background:Galaxy', 'Background:Space']
  },
  {
    id: 'mage_spellweaver',
    name: 'Spell Weaver',
    cost: 4,
    attack: 85,
    health: 130,
    description: 'Master of magical arts',
    rarity: 'rare',
    cardClass: 'magical',
    type: 'minion',
    image: 'https://i.imgur.com/ggfyOEs.png',
    abilities: ['spell_power', 'mana_burn'],
    unitType: 'mage',
    traitMappings: ['Clothes:Lab Coat', 'Eyes:Glowing']
  },
  {
    id: 'berserker_fury',
    name: 'Fury Berserker',
    cost: 3,
    attack: 120,
    health: 100,
    description: 'Rage-fueled warrior',
    rarity: 'uncommon',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/wpAX667.png',
    abilities: ['rage', 'fury'],
    unitType: 'berserker',
    traitMappings: ['Eyes:Angry', 'Mouth:Gritted']
  },
  {
    id: 'undead_skull',
    name: 'Skull Warrior',
    cost: 5,
    attack: 120,
    health: 140,
    description: 'Undead champion with bone armor',
    rarity: 'epic',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/zm7cjGE.png',
    abilities: ['fear', 'bone_armor'],
    unitType: 'undead',
    traitMappings: ['Skin:Skull', 'Head:Bones']
  },
  {
    id: 'punk_rebel',
    name: 'Spiked Rebel',
    cost: 4,
    attack: 95,
    health: 165,
    description: 'Rebellious punk fighter',
    rarity: 'rare',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/vSgQJWO.png',
    abilities: ['thorns', 'intimidate'],
    unitType: 'punk',
    traitMappings: ['Clothes:Spiked Jacket', 'Head:Mohawk']
  },
  {
    id: 'royal_commander',
    name: 'Royal Commander',
    cost: 6,
    attack: 120,
    health: 200,
    description: 'Noble leader with command abilities',
    rarity: 'legendary',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/ue3ujBh.png',
    abilities: ['command', 'leadership'],
    unitType: 'royal',
    traitMappings: ['Head:Crown', 'Clothes:Royal Robes']
  },
  {
    id: 'trickster_wild',
    name: 'Wild Trickster',
    cost: 2,
    attack: 70,
    health: 110,
    description: 'Unpredictable joker unit',
    rarity: 'uncommon',
    cardClass: 'melee',
    type: 'minion',
    image: 'https://i.imgur.com/xUULDbU.png',
    abilities: ['unpredictable', 'surprise'],
    unitType: 'trickster',
    traitMappings: ['Mouth:Tongue Out', 'Eyes:Crazy']
  },

  // Tower Cards - Defensive structures
  {
    id: 'tower_defense',
    name: 'Defense Tower',
    cost: 5,
    attack: 80,
    health: 300,
    description: 'Stationary defensive structure',
    rarity: 'common',
    cardClass: 'ranged',
    type: 'tower',
    image: 'https://i.imgur.com/dHAvPGk.png',
    abilities: ['immobile', 'area_damage'],
    unitType: 'tower',
    traitMappings: ['Background:Lab', 'Clothes:Tech']
  },
  {
    id: 'tower_magical',
    name: 'Arcane Spire',
    cost: 6,
    attack: 90,
    health: 250,
    description: 'Magical tower with spell attacks',
    rarity: 'rare',
    cardClass: 'magical',
    type: 'tower',
    image: 'https://i.imgur.com/ggfyOEs.png',
    abilities: ['immobile', 'spell_attacks'],
    unitType: 'magical_tower',
    traitMappings: ['Background:Galaxy', 'Eyes:Glowing']
  },

  // Spell Cards - Instant effects
  {
    id: 'spell_lightning',
    name: 'Lightning Bolt',
    cost: 2,
    attack: 100,
    health: 0,
    description: 'Direct damage spell',
    rarity: 'common',
    cardClass: 'magical',
    type: 'spell',
    image: 'https://i.imgur.com/ggfyOEs.png',
    abilities: ['instant', 'direct_damage'],
    unitType: 'damage_spell',
    traitMappings: ['Eyes:Shocked', 'Background:Blue']
  },
  {
    id: 'spell_heal',
    name: 'Healing Aura',
    cost: 3,
    attack: 0,
    health: 0,
    description: 'Heals friendly units in area',
    rarity: 'common',
    cardClass: 'magical',
    type: 'spell',
    image: 'https://i.imgur.com/jNWxvLY.png',
    abilities: ['instant', 'heal', 'area_effect'],
    unitType: 'heal_spell',
    traitMappings: ['Background:Green', 'Eyes:Kind']
  },
  {
    id: 'spell_rage',
    name: 'Battle Rage',
    cost: 2,
    attack: 0,
    health: 0,
    description: 'Boosts attack of friendly units',
    rarity: 'uncommon',
    cardClass: 'magical',
    type: 'spell',
    image: 'https://i.imgur.com/wpAX667.png',
    abilities: ['instant', 'buff', 'attack_boost'],
    unitType: 'buff_spell',
    traitMappings: ['Eyes:Angry', 'Background:Red']
  },
  {
    id: 'spell_freeze',
    name: 'Ice Storm',
    cost: 4,
    attack: 60,
    health: 0,
    description: 'Freezes and damages enemies',
    rarity: 'rare',
    cardClass: 'magical',
    type: 'spell',
    image: 'https://i.imgur.com/jNWxvLY.png',
    abilities: ['instant', 'freeze', 'area_damage'],
    unitType: 'freeze_spell',
    traitMappings: ['Background:Ice', 'Eyes:Cold']
  }
];

// Function to get cards available based on NFT traits
export const getAvailableCardsForTraits = (nftTraits: any[]): GameCard[] => {
  const availableCards: GameCard[] = [];
  
  // Always add some basic cards
  const basicCards = CARD_DATABASE.filter(card => 
    card.rarity === 'common' && card.type === 'minion'
  );
  availableCards.push(...basicCards.slice(0, 3));

  // Add cards based on specific traits
  nftTraits.forEach(trait => {
    const traitKey = `${trait.trait_type}:${trait.value}`;
    
    const matchingCards = CARD_DATABASE.filter(card => 
      card.traitMappings?.includes(traitKey)
    );
    
    matchingCards.forEach(card => {
      if (!availableCards.find(c => c.id === card.id)) {
        availableCards.push(card);
      }
    });
  });

  return availableCards;
};

// Function to create NFT captain card
export const createNFTCaptainCard = (nft: any): GameCard => {
  const rankBonus = Math.max(1, Math.floor((3000 - (nft.rank || 2000)) / 100));
  
  return {
    id: `captain_${nft.mint}`,
    name: nft.name,
    cost: 0, // Captain cards are free
    attack: 100 + (rankBonus * 10),
    health: 200 + (rankBonus * 25),
    description: `Your NFT Hero Captain - Rank #${nft.rank}`,
    rarity: nft.rank <= 100 ? 'legendary' : 
           nft.rank <= 500 ? 'epic' : 
           nft.rank <= 1500 ? 'rare' : 'common',
    cardClass: 'melee',
    type: 'minion',
    image: nft.image,
    abilities: ['captain', 'leadership'],
    unitType: 'captain'
  };
};

// Function to get cards by ID (for admin panel)
export const getCardById = (id: string): GameCard | undefined => {
  return CARD_DATABASE.find(card => card.id === id);
};

// Function to get all cards (for admin panel)
export const getAllCards = (): GameCard[] => {
  return [...CARD_DATABASE];
};

// Function to update card in database (for admin panel)
export const updateCard = (updatedCard: GameCard): void => {
  const index = CARD_DATABASE.findIndex(card => card.id === updatedCard.id);
  if (index !== -1) {
    CARD_DATABASE[index] = updatedCard;
  }
};

// Function to add new card (for admin panel)
export const addCard = (newCard: GameCard): void => {
  CARD_DATABASE.push(newCard);
};

// Function to remove card (for admin panel)
export const removeCard = (cardId: string): void => {
  const index = CARD_DATABASE.findIndex(card => card.id === cardId);
  if (index !== -1) {
    CARD_DATABASE.splice(index, 1);
  }
};