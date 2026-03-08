import React from 'react';
import { Zap, Shield, Heart, Flame, Snowflake, Star, Sparkles, Target } from 'lucide-react';

export interface GameCard {
  id: string;
  name: string;
  type: 'unit' | 'spell';
  cost: number;
  image: string;
  unitType?: 'melee' | 'ranged' | 'tank' | 'support' | 'fast' | 'wizard' | 'healer';
  attack?: number;
  defense?: number;
  speed?: number;
  range?: number;
  health?: number;
  description: string;
  abilities?: string[];
  spellEffect?: {
    type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon';
    value: number;
    area: 'single' | 'aoe' | 'line' | 'global';
    duration?: number;
  };
}

// Basic starter cards that all NFT holders receive
export const BASIC_STARTER_CARDS: GameCard[] = [
  {
    id: 'basic_warrior',
    name: 'Militia Warrior',
    type: 'unit',
    cost: 1,
    image: 'https://i.imgur.com/Y4Q3AxF.png',
    unitType: 'melee',
    attack: 40,
    defense: 35,
    speed: 50,
    range: 1,
    health: 60,
    description: 'Basic melee unit provided to all NFT holders',
    abilities: ['Basic Strike']
  },
  {
    id: 'basic_archer',
    name: 'Scout Archer',
    type: 'unit',
    cost: 2,
    image: 'https://i.imgur.com/zlF4ULC.png',
    unitType: 'ranged',
    attack: 45,
    defense: 25,
    speed: 60,
    range: 4,
    health: 50,
    description: 'Basic ranged unit provided to all NFT holders',
    abilities: ['Basic Shot']
  },
  {
    id: 'basic_mage',
    name: 'Apprentice Mage',
    type: 'unit',
    cost: 3,
    image: 'https://i.imgur.com/lTUTFEV.png',
    unitType: 'wizard',
    attack: 50,
    defense: 20,
    speed: 45,
    range: 3,
    health: 45,
    description: 'Basic wizard unit provided to all NFT holders',
    abilities: ['Basic Spell']
  },
  {
    id: 'basic_assassin',
    name: 'Shadow Initiate',
    type: 'unit',
    cost: 2,
    image: 'https://i.imgur.com/qZi7YND.png',
    unitType: 'melee',
    attack: 55,
    defense: 20,
    speed: 75,
    range: 1,
    health: 40,
    description: 'Basic assassin unit provided to all NFT holders - fast but fragile',
    abilities: ['Stealth Strike']
  }
];

// Base card deck using provided images
export const BASE_CARDS: GameCard[] = [
  // Melee Units
  {
    id: 'melee_warrior_1',
    name: 'THC Warrior',
    type: 'unit',
    cost: 3,
    image: 'https://i.imgur.com/LKHfZYk.png',
    unitType: 'melee',
    attack: 85,
    defense: 70,
    speed: 60,
    range: 1,
    health: 120,
    description: 'Strong melee fighter with balanced stats',
    abilities: ['First Strike', 'Combat Training']
  },
  {
    id: 'melee_berserker',
    name: 'Green Berserker',
    type: 'unit',
    cost: 4,
    image: 'https://i.imgur.com/KiiU4bg.png',
    unitType: 'melee',
    attack: 110,
    defense: 50,
    speed: 75,
    range: 1,
    health: 100,
    description: 'High damage melee unit with reduced defense',
    abilities: ['Rage', 'Berserker Fury']
  },
  {
    id: 'melee_brawler',
    name: 'Street Brawler',
    type: 'unit',
    cost: 2,
    image: 'https://i.imgur.com/xUULDbU.png',
    unitType: 'melee',
    attack: 65,
    defense: 60,
    speed: 80,
    range: 1,
    health: 90,
    description: 'Fast and agile close combat specialist',
    abilities: ['Quick Strike', 'Street Smart']
  },

  // Ranged Units
  {
    id: 'ranged_archer',
    name: 'Dope Archer',
    type: 'unit',
    cost: 3,
    image: 'https://i.imgur.com/aEEZOAq.png',
    unitType: 'ranged',
    attack: 75,
    defense: 40,
    speed: 65,
    range: 4,
    health: 80,
    description: 'Standard ranged unit with good range',
    abilities: ['Precise Shot', 'Long Range']
  },
  {
    id: 'ranged_sniper',
    name: 'THC Sniper',
    type: 'unit',
    cost: 4,
    image: 'https://i.imgur.com/ChHlRyi.png',
    unitType: 'ranged',
    attack: 95,
    defense: 35,
    speed: 50,
    range: 6,
    health: 70,
    description: 'High damage long-range specialist',
    abilities: ['Headshot', 'Stealth']
  },
  {
    id: 'ranged_gunner',
    name: 'Heavy Gunner',
    type: 'unit',
    cost: 5,
    image: 'https://i.imgur.com/9ziSpeK.png',
    unitType: 'ranged',
    attack: 100,
    defense: 65,
    speed: 40,
    range: 5,
    health: 110,
    description: 'Powerful ranged unit with area damage',
    abilities: ['Suppressing Fire', 'Area Blast']
  },

  // Special Units
  {
    id: 'healer_medic',
    name: 'Green Medic',
    type: 'unit',
    cost: 4,
    image: 'https://i.imgur.com/fYUgwEK.png',
    unitType: 'healer',
    attack: 30,
    defense: 60,
    speed: 70,
    range: 3,
    health: 100,
    description: 'Healing support unit with area of effect healing',
    abilities: ['Mass Heal', 'Medical Training', 'Healing Aura']
  },
  {
    id: 'wizard_mage',
    name: 'THC Wizard',
    type: 'unit',
    cost: 5,
    image: 'https://i.imgur.com/PjDTJXy.png',
    unitType: 'wizard',
    attack: 90,
    defense: 45,
    speed: 55,
    range: 4,
    health: 85,
    description: 'Magical damage dealer with spell casting',
    abilities: ['Fireball', 'Mana Shield', 'Spell Power']
  },
  {
    id: 'tank_guardian',
    name: 'Heavy Tank',
    type: 'unit',
    cost: 6,
    image: 'https://i.imgur.com/FlKHvfu.png',
    unitType: 'tank',
    attack: 60,
    defense: 120,
    speed: 30,
    range: 1,
    health: 180,
    description: 'High health tank unit that soaks damage',
    abilities: ['Taunt', 'Heavy Armor', 'Shield Wall']
  },
  {
    id: 'ninja_assassin',
    name: 'Shadow Ninja',
    type: 'unit',
    cost: 4,
    image: 'https://i.imgur.com/Omr6Q3H.png',
    unitType: 'fast',
    attack: 85,
    defense: 40,
    speed: 120,
    range: 2,
    health: 75,
    description: 'Ultra-fast stealth unit with hit-and-run tactics',
    abilities: ['Stealth', 'Backstab', 'Shadow Step']
  },
  {
    id: 'summoner_support',
    name: 'Plant Summoner',
    type: 'unit',
    cost: 5,
    image: 'https://i.imgur.com/QQEIv7C.png',
    unitType: 'support',
    attack: 50,
    defense: 70,
    speed: 60,
    range: 3,
    health: 110,
    description: 'Support unit that summons plant minions',
    abilities: ['Summon Plants', 'Nature Bond', 'Growth Boost']
  },
  {
    id: 'bomber_scientist',
    name: 'Mad Scientist',
    type: 'unit',
    cost: 4,
    image: 'https://i.imgur.com/eQCL0s8.png',
    unitType: 'ranged',
    attack: 80,
    defense: 50,
    speed: 65,
    range: 4,
    health: 90,
    description: 'Science-based unit with explosive attacks',
    abilities: ['Chemical Bombs', 'Toxic Cloud', 'Experiment']
  },
  {
    id: 'midrange_fighter',
    name: 'Battle Master',
    type: 'unit',
    cost: 4,
    image: 'https://i.imgur.com/n63nk0d.png',
    unitType: 'melee',
    attack: 90,
    defense: 80,
    speed: 70,
    range: 2,
    health: 115,
    description: 'Versatile mid-range melee specialist',
    abilities: ['Combat Mastery', 'Weapon Expertise', 'Battle Fury']
  },

  // Additional Ranged Units
  {
    id: 'bow_archer',
    name: 'Elite Bowman',
    type: 'unit',
    cost: 3,
    image: 'https://i.imgur.com/5jxAREw.png',
    unitType: 'ranged',
    attack: 80,
    defense: 45,
    speed: 70,
    range: 5,
    health: 85,
    description: 'Skilled archer with enhanced accuracy and range',
    abilities: ['Multi-Shot', 'Eagle Eye', 'Wind Arrow']
  },
  {
    id: 'slingshot_ranger',
    name: 'Stone Slinger',
    type: 'unit',
    cost: 2,
    image: '🎯', // Fallback since blob URL won't work
    unitType: 'ranged',
    attack: 60,
    defense: 35,
    speed: 85,
    range: 3,
    health: 70,
    description: 'Fast ranged unit with stone projectiles',
    abilities: ['Quick Shot', 'Stone Storm', 'Mobility']
  },
  {
    id: 'heavy_cannon',
    name: 'Artillery Cannon',
    type: 'unit',
    cost: 6,
    image: 'https://i.imgur.com/vQOANIg.png',
    unitType: 'ranged',
    attack: 120,
    defense: 80,
    speed: 25,
    range: 6,
    health: 140,
    description: 'Devastating heavy ranged unit with explosive shells',
    abilities: ['Explosive Shot', 'Siege Mode', 'Area Damage']
  },
  {
    id: 'heavy_artillery',
    name: 'Mega Launcher',
    type: 'unit',
    cost: 7,
    image: 'https://i.imgur.com/ZfwNzNS.png',
    unitType: 'ranged',
    attack: 140,
    defense: 70,
    speed: 20,
    range: 7,
    health: 160,
    description: 'Ultimate heavy ranged unit with devastating firepower',
    abilities: ['Meteor Strike', 'Chain Explosion', 'Long Range']
  },

  // Additional Melee Units
  {
    id: 'heavy_bruiser',
    name: 'Heavy Brawler',
    type: 'unit',
    cost: 5,
    image: 'https://i.imgur.com/OrubEt3.png',
    unitType: 'melee',
    attack: 100,
    defense: 90,
    speed: 45,
    range: 1,
    health: 150,
    description: 'Powerful melee unit with devastating close combat abilities',
    abilities: ['Ground Slam', 'Heavy Strike', 'Intimidate']
  },

  // Elite Wizard
  {
    id: 'elite_wizard',
    name: 'Arcane Master',
    type: 'unit',
    cost: 6,
    image: 'https://i.imgur.com/1VY2r6U.png',
    unitType: 'wizard',
    attack: 110,
    defense: 60,
    speed: 65,
    range: 5,
    health: 100,
    description: 'Elite magical unit with powerful spells and enchantments',
    abilities: ['Chain Lightning', 'Teleport', 'Mana Shield', 'Spell Amplify']
  },

  // Epic Tier Units
  {
    id: 'epic_berserker',
    name: 'Legendary Berserker',
    type: 'unit',
    cost: 8,
    image: 'https://i.imgur.com/CYex0c0.png',
    unitType: 'melee',
    attack: 160,
    defense: 95,
    speed: 80,
    range: 1,
    health: 200,
    description: 'Epic melee warrior with devastating rage abilities and unstoppable fury',
    abilities: ['Berserker Rage', 'Blood Frenzy', 'Unstoppable Force', 'Death Wish']
  },
  {
    id: 'epic_sniper',
    name: 'Shadow Marksman',
    type: 'unit',
    cost: 7,
    image: 'https://i.imgur.com/asRu6nc.png',
    unitType: 'ranged',
    attack: 150,
    defense: 55,
    speed: 75,
    range: 8,
    health: 120,
    description: 'Epic ranged assassin with pinpoint accuracy and stealth capabilities',
    abilities: ['Headshot', 'Stealth Strike', 'Perfect Aim', 'Shadow Step']
  },
  {
    id: 'epic_guardian',
    name: 'Fortress Guardian',
    type: 'unit',
    cost: 9,
    image: 'https://i.imgur.com/e7U5bTo.png',
    unitType: 'tank',
    attack: 80,
    defense: 150,
    speed: 30,
    range: 1,
    health: 300,
    description: 'Epic tank unit with massive health and defensive abilities that protect allies',
    abilities: ['Taunt', 'Shield Wall', 'Damage Reduction', 'Ally Protection']
  },

  // Legendary Tier Units - Ultimate Power
  {
    id: 'legendary_wizard',
    name: 'Cosmic Archmage',
    type: 'unit',
    cost: 10,
    image: 'https://i.imgur.com/p0dqPCS.png',
    unitType: 'wizard',
    attack: 180,
    defense: 75,
    speed: 70,
    range: 6,
    health: 140,
    description: 'Legendary wizard with reality-bending magic and ultimate spell mastery',
    abilities: ['Reality Tear', 'Time Stop', 'Meteor Swarm', 'Mana Overflow', 'Spell Immunity']
  },
  {
    id: 'legendary_assassin',
    name: 'Shadow Reaper',
    type: 'unit',
    cost: 10,
    image: 'https://i.imgur.com/KcfnvLC.png',
    unitType: 'melee',
    attack: 200,
    defense: 60,
    speed: 100,
    range: 2,
    health: 130,
    description: 'Legendary assassin with unmatched speed and lethal precision strikes',
    abilities: ['Instant Kill', 'Shadow Clone', 'Phase Walk', 'Critical Strike', 'Death Mark']
  }
];

// Spell Cards with visual effects
export const SPELL_CARDS: GameCard[] = [
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    type: 'spell',
    cost: 2,
    image: '⚡',
    description: 'Deal 80 damage to target enemy unit',
    spellEffect: {
      type: 'damage',
      value: 80,
      area: 'single'
    }
  },
  {
    id: 'healing_wave',
    name: 'Healing Wave',
    type: 'spell',
    cost: 3,
    image: '💚',
    description: 'Restore 60 health to all friendly units',
    spellEffect: {
      type: 'heal',
      value: 60,
      area: 'global'
    }
  },
  {
    id: 'fire_storm',
    name: 'Fire Storm',
    type: 'spell',
    cost: 5,
    image: '🔥',
    description: 'Deal 50 damage to all enemies in a large area',
    spellEffect: {
      type: 'damage',
      value: 50,
      area: 'aoe'
    }
  },
  {
    id: 'ice_freeze',
    name: 'Ice Freeze',
    type: 'spell',
    cost: 3,
    image: '❄️',
    description: 'Freeze target enemy for 3 seconds, reducing speed by 50%',
    spellEffect: {
      type: 'debuff',
      value: 50,
      area: 'single',
      duration: 3000
    }
  },
  {
    id: 'poison_cloud',
    name: 'Toxic Cloud',
    type: 'spell',
    cost: 4,
    image: '☠️',
    description: 'Create a poison cloud that deals 25 damage per second for 4 seconds',
    spellEffect: {
      type: 'damage',
      value: 25,
      area: 'aoe',
      duration: 4000
    }
  },
  {
    id: 'shield_wall',
    name: 'Divine Shield',
    type: 'spell',
    cost: 4,
    image: '🛡️',
    description: 'Grant all friendly units +50 defense for 10 seconds',
    spellEffect: {
      type: 'buff',
      value: 50,
      area: 'global',
      duration: 10000
    }
  }
];

// Combined card deck
export const ALL_CARDS = [...BASIC_STARTER_CARDS, ...BASE_CARDS, ...SPELL_CARDS];

// Card component for rendering
interface CardProps {
  card: GameCard;
  selected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, selected = false, onClick, showStats = true }) => {
  const renderCardImage = () => {
    if (card.image.startsWith('http')) {
      return (
        <img 
          src={card.image} 
          alt={card.name} 
          className="w-full h-32 object-cover rounded-t-lg"
          onError={(e) => {
            // Fallback to emoji if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    } else {
      // Emoji or text fallback
      return (
        <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-t-lg">
          <span className="text-6xl">{card.image}</span>
        </div>
      );
    }
  };

  const renderSpellEffect = () => {
    if (card.type !== 'spell' || !card.spellEffect) return null;

    const effectIcon = {
      damage: <Zap className="text-red-400" size={16} />,
      heal: <Heart className="text-green-400" size={16} />,
      buff: <Star className="text-yellow-400" size={16} />,
      debuff: <Target className="text-purple-400" size={16} />,
      summon: <Sparkles className="text-blue-400" size={16} />
    };

    return (
      <div className="flex items-center gap-1 text-xs">
        {effectIcon[card.spellEffect.type]}
        <span className="text-gray-300">
          {card.spellEffect.type === 'damage' ? 'DMG' : 
           card.spellEffect.type === 'heal' ? 'HEAL' : 
           card.spellEffect.type.toUpperCase()}: {card.spellEffect.value}
        </span>
      </div>
    );
  };

  return (
    <div 
      className={`
        relative bg-gray-800 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${selected ? 'border-green-400 shadow-lg shadow-green-400/30' : 'border-gray-600 hover:border-gray-500'}
        ${card.type === 'spell' ? 'bg-gradient-to-b from-purple-900/50 to-gray-800' : ''}
      `}
      onClick={onClick}
    >
      {/* Mana Cost */}
      <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
        {card.cost}
      </div>

      {/* Card Type Indicator */}
      {card.type === 'spell' && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded px-2 py-1 text-xs font-semibold z-10">
          SPELL
        </div>
      )}

      {/* Card Image */}
      <div className="relative">
        {renderCardImage()}
        <div className="hidden w-full h-32 flex items-center justify-center bg-gradient-to-br from-green-600 to-blue-600 rounded-t-lg">
          <span className="text-4xl">🎮</span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3">
        <h3 className="text-white font-bold text-sm mb-1">{card.name}</h3>
        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{card.description}</p>

        {/* Unit Stats */}
        {card.type === 'unit' && showStats && (
          <div className="grid grid-cols-2 gap-1 text-xs mb-2">
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-red-400" />
              <span className="text-red-400">{card.attack}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-blue-400" />
              <span className="text-blue-400">{card.defense}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} className="text-green-400" />
              <span className="text-green-400">{card.health}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target size={12} className="text-yellow-400" />
              <span className="text-yellow-400">{card.range}</span>
            </div>
          </div>
        )}

        {/* Spell Effect */}
        {card.type === 'spell' && (
          <div className="mb-2">
            {renderSpellEffect()}
          </div>
        )}

        {/* Abilities */}
        {card.abilities && card.abilities.length > 0 && (
          <div className="text-xs">
            <div className="text-purple-400 font-semibold mb-1">Abilities:</div>
            <div className="text-purple-300">
              {card.abilities.slice(0, 2).join(', ')}
              {card.abilities.length > 2 && '...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;