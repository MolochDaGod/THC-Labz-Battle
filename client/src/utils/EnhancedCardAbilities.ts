/**
 * Enhanced THC CLASH Card Abilities System
 * Comprehensive abilities and animations for all 66 cards + captain
 */

export interface EnhancedAbility {
  name: string;
  description: string;
  cooldown: number;
  range: number;
  effect: string;
  animation: string;
  damage?: number;
  healing?: number;
  speedBoost?: number;
  armorBoost?: number;
}

export interface CardEnhancement {
  cardId: string;
  primaryAbility: EnhancedAbility;
  passiveAbility?: EnhancedAbility;
  deployAnimation: string;
  attackAnimation: string;
  deathAnimation: string;
  rarityEffects: string[];
}

// Complete enhanced abilities for all 66 cards
export const enhancedCardAbilities: Record<string, CardEnhancement> = {
  // TIER 1: SATIVA STRAINS (Cards 1-15) - Speed & Energy Focus
  "image-1": {
    cardId: "image-1",
    primaryAbility: {
      name: "Energizing Burst",
      description: "Increases movement speed of nearby allies by 50% for 8 seconds",
      cooldown: 12000,
      range: 120,
      effect: "speed_boost",
      animation: "green_sparkles",
      speedBoost: 0.5
    },
    passiveAbility: {
      name: "Sativa Rush",
      description: "Deals 15% more damage when health is above 75%",
      cooldown: 0,
      range: 0,
      effect: "damage_boost",
      animation: "continuous_glow"
    },
    deployAnimation: "wind_swirl",
    attackAnimation: "green_slash",
    deathAnimation: "leaf_scatter",
    rarityEffects: ["speed_trail", "energy_aura"]
  },

  "image-2": {
    cardId: "image-2", 
    primaryAbility: {
      name: "Focus Fire",
      description: "Next 3 attacks have +100% accuracy and pierce through enemies",
      cooldown: 15000,
      range: 150,
      effect: "piercing_shots",
      animation: "laser_sight",
      damage: 50
    },
    passiveAbility: {
      name: "Clear Mind",
      description: "Immune to slowing effects and debuffs",
      cooldown: 0,
      range: 0,
      effect: "debuff_immunity",
      animation: "shield_shimmer"
    },
    deployAnimation: "energy_spiral",
    attackAnimation: "precision_beam",
    deathAnimation: "light_fade",
    rarityEffects: ["accuracy_crosshair", "focus_beam"]
  },

  "image-3": {
    cardId: "image-3",
    primaryAbility: {
      name: "Euphoric Blast",
      description: "AOE attack that confuses enemies, making them attack random targets",
      cooldown: 18000,
      range: 100,
      effect: "confusion",
      animation: "rainbow_explosion",
      damage: 75
    },
    deployAnimation: "rainbow_spawn",
    attackAnimation: "color_burst",
    deathAnimation: "prismatic_shatter",
    rarityEffects: ["rainbow_trail", "euphoria_aura"]
  },

  "image-4": {
    cardId: "image-4",
    primaryAbility: {
      name: "Creative Spark",
      description: "Spawns a temporary clone that lasts 10 seconds with 50% stats",
      cooldown: 20000,
      range: 0,
      effect: "clone_spawn",
      animation: "mirror_flash"
    },
    deployAnimation: "artistic_swirl",
    attackAnimation: "creative_burst",
    deathAnimation: "inspiration_fade",
    rarityEffects: ["creative_sparks", "artistic_trail"]
  },

  "image-5": {
    cardId: "image-5",
    primaryAbility: {
      name: "Energy Overdrive",
      description: "Doubles attack speed for 6 seconds but loses 10 HP per second",
      cooldown: 25000,
      range: 0,
      effect: "berserk",
      animation: "electric_surge",
      speedBoost: 1.0
    },
    deployAnimation: "lightning_strike",
    attackAnimation: "electric_claw",
    deathAnimation: "power_overload",
    rarityEffects: ["electric_aura", "power_surge"]
  },

  // TIER 2: INDICA STRAINS (Cards 6-20) - Defense & Healing Focus
  "image-6": {
    cardId: "image-6",
    primaryAbility: {
      name: "Relaxing Aura",
      description: "Heals all nearby allies for 100 HP and grants 25% damage reduction",
      cooldown: 16000,
      range: 140,
      effect: "heal_and_armor",
      animation: "purple_waves",
      healing: 100,
      armorBoost: 0.25
    },
    passiveAbility: {
      name: "Deep Roots",
      description: "Gains +2 armor for every 10 seconds in combat",
      cooldown: 0,
      range: 0,
      effect: "stacking_armor",
      animation: "root_growth"
    },
    deployAnimation: "earth_emergence",
    attackAnimation: "root_strike",
    deathAnimation: "nature_return",
    rarityEffects: ["healing_mist", "earth_armor"]
  },

  "image-7": {
    cardId: "image-7",
    primaryAbility: {
      name: "Sedative Cloud",
      description: "Creates a cloud that slows enemies by 70% for 12 seconds",
      cooldown: 20000,
      range: 120,
      effect: "slow_field",
      animation: "purple_cloud"
    },
    deployAnimation: "mist_rise",
    attackAnimation: "cloud_burst",
    deathAnimation: "vapor_dissipate", 
    rarityEffects: ["sedative_trail", "calming_aura"]
  },

  "image-8": {
    cardId: "image-8",
    primaryAbility: {
      name: "Body Stone",
      description: "Becomes immobile but gains 90% damage reduction and reflects 50% damage",
      cooldown: 18000,
      range: 0,
      effect: "fortress_mode",
      animation: "stone_shell",
      armorBoost: 0.9
    },
    deployAnimation: "rock_formation",
    attackAnimation: "boulder_slam",
    deathAnimation: "stone_crumble",
    rarityEffects: ["stone_armor", "reflect_shield"]
  },

  // TIER 3: HYBRID STRAINS (Cards 21-35) - Balanced Abilities
  "image-21": {
    cardId: "image-21",
    primaryAbility: {
      name: "Balanced Harmony",
      description: "Alternates between +50% speed boost and +50% damage boost every 8 seconds",
      cooldown: 0,
      range: 0,
      effect: "alternating_boost",
      animation: "yin_yang_glow"
    },
    deployAnimation: "balance_spiral",
    attackAnimation: "harmony_strike",
    deathAnimation: "equilibrium_fade",
    rarityEffects: ["harmony_aura", "balance_particles"]
  },

  "image-22": {
    cardId: "image-22",
    primaryAbility: {
      name: "Adaptive Evolution",
      description: "Gains resistance to damage types that have hit it (stacks up to 50%)",
      cooldown: 0,
      range: 0,
      effect: "adaptive_armor",
      animation: "evolution_glow"
    },
    deployAnimation: "dna_helix",
    attackAnimation: "evolved_strike",
    deathAnimation: "genetic_scatter",
    rarityEffects: ["adaptation_shimmer", "evolution_trail"]
  },

  // TIER 4: EXOTIC STRAINS (Cards 36-50) - Unique Mechanics
  "image-36": {
    cardId: "image-36",
    primaryAbility: {
      name: "Quantum Entanglement",
      description: "Links with another random ally - when one takes damage, both share it equally",
      cooldown: 22000,
      range: 200,
      effect: "damage_link",
      animation: "quantum_threads"
    },
    deployAnimation: "particle_burst",
    attackAnimation: "quantum_slash",
    deathAnimation: "reality_tear",
    rarityEffects: ["quantum_particles", "entanglement_lines"]
  },

  "image-37": {
    cardId: "image-37",
    primaryAbility: {
      name: "Time Dilation",
      description: "Slows time for all enemies within range, reducing their speed by 80%",
      cooldown: 30000,
      range: 180,
      effect: "time_slow",
      animation: "temporal_waves"
    },
    deployAnimation: "time_rift",
    attackAnimation: "chrono_strike",
    deathAnimation: "temporal_collapse",
    rarityEffects: ["time_distortion", "temporal_aura"]
  },

  // TIER 5: LEGENDARY STRAINS (Cards 51-66) - Powerful Abilities
  "image-51": {
    cardId: "image-51",
    primaryAbility: {
      name: "Phoenix Rebirth",
      description: "Upon death, revives with 50% health and deals 200 damage to nearby enemies",
      cooldown: 60000,
      range: 100,
      effect: "death_explosion_revive",
      animation: "phoenix_flames",
      damage: 200,
      healing: 150
    },
    passiveAbility: {
      name: "Eternal Flame",
      description: "Attacks apply burning effect (20 damage/sec for 5 seconds)",
      cooldown: 0,
      range: 0,
      effect: "burn_on_hit",
      animation: "flame_aura"
    },
    deployAnimation: "legendary_entrance",
    attackAnimation: "divine_strike",
    deathAnimation: "phoenix_ascension",
    rarityEffects: ["legendary_glow", "phoenix_feathers", "eternal_flames"]
  },

  "image-52": {
    cardId: "image-52",
    primaryAbility: {
      name: "Void Consumption",
      description: "Drains life from all enemies in range, healing self for total damage dealt",
      cooldown: 25000,
      range: 150,
      effect: "life_drain",
      animation: "void_tendrils",
      damage: 80,
      healing: 80
    },
    passiveAbility: {
      name: "Shadow Walker",
      description: "Becomes untargetable for 2 seconds after taking 100 damage",
      cooldown: 15000,
      range: 0,
      effect: "phase_shift",
      animation: "shadow_fade"
    },
    deployAnimation: "void_portal",
    attackAnimation: "shadow_claw",
    deathAnimation: "void_collapse",
    rarityEffects: ["void_aura", "shadow_tendrils", "dark_energy"]
  },

  // Continue patterns for remaining cards...
  // Cards 9-20 (More Indica variants with healing/defense focus)
  "image-9": {
    cardId: "image-9",
    primaryAbility: {
      name: "Couch Lock",
      description: "Roots all nearby enemies for 5 seconds, preventing movement",
      cooldown: 20000,
      range: 100,
      effect: "root",
      animation: "vine_entangle"
    },
    deployAnimation: "garden_growth",
    attackAnimation: "thorn_whip",
    deathAnimation: "compost_decay",
    rarityEffects: ["vine_growth", "nature_bond"]
  },

  "image-10": {
    cardId: "image-10",
    primaryAbility: {
      name: "Munchies Madness",
      description: "Devours enemy projectiles to gain health and damage boost",
      cooldown: 12000,
      range: 80,
      effect: "projectile_absorption",
      animation: "consumption_glow"
    },
    deployAnimation: "hungry_emergence",
    attackAnimation: "bite_attack",
    deathAnimation: "satisfied_fade",
    rarityEffects: ["hunger_aura", "consumption_trail"]
  },

  // CAPTAIN CARD - Ultimate Legendary
  "captain": {
    cardId: "captain",
    primaryAbility: {
      name: "Master Cultivation",
      description: "Spawns 3 random strain units and grants all allies +100% stats for 15 seconds",
      cooldown: 45000,
      range: 300,
      effect: "ultimate_boost",
      animation: "cultivation_explosion",
      damage: 150,
      healing: 200,
      speedBoost: 1.0,
      armorBoost: 1.0
    },
    passiveAbility: {
      name: "Strain Master",
      description: "All allied units gain abilities from their strain types",
      cooldown: 0,
      range: 500,
      effect: "global_strain_boost",
      animation: "mastery_aura"
    },
    deployAnimation: "legendary_arrival",
    attackAnimation: "master_strike",
    deathAnimation: "legacy_explosion",
    rarityEffects: ["captain_crown", "mastery_glow", "strain_synergy", "leadership_aura"]
  }
};

// Fill in remaining cards with pattern-based abilities
for (let i = 11; i <= 66; i++) {
  const cardId = `image-${i}`;
  if (!enhancedCardAbilities[cardId]) {
    // Determine tier and assign appropriate abilities
    let tier: string;
    let primaryAbility: EnhancedAbility;
    let rarityEffects: string[];

    if (i <= 15) {
      tier = "sativa";
      primaryAbility = {
        name: `Sativa Power ${i}`,
        description: `Unique sativa-based ability for strain ${i}`,
        cooldown: 10000 + (i * 1000),
        range: 80 + (i * 5),
        effect: "energy_boost",
        animation: "green_energy",
        speedBoost: 0.3 + (i * 0.02)
      };
      rarityEffects = ["sativa_glow", "energy_particles"];
    } else if (i <= 35) {
      tier = "hybrid";
      primaryAbility = {
        name: `Hybrid Balance ${i}`,
        description: `Balanced hybrid ability for strain ${i}`,
        cooldown: 12000 + (i * 800),
        range: 90 + (i * 3),
        effect: "balanced_boost",
        animation: "dual_energy",
        damage: 40 + (i * 2),
        healing: 30 + (i * 1.5)
      };
      rarityEffects = ["hybrid_aura", "balance_particles"];
    } else if (i <= 50) {
      tier = "exotic";
      primaryAbility = {
        name: `Exotic Phenomenon ${i}`,
        description: `Rare exotic ability for strain ${i}`,
        cooldown: 15000 + (i * 600),
        range: 100 + (i * 2),
        effect: "exotic_power",
        animation: "mystical_energy",
        damage: 60 + (i * 2.5)
      };
      rarityEffects = ["exotic_shimmer", "mystical_particles", "rare_glow"];
    } else {
      tier = "legendary";
      primaryAbility = {
        name: `Legendary Mastery ${i}`,
        description: `Ultimate legendary ability for strain ${i}`,
        cooldown: 20000 + (i * 500),
        range: 120 + i,
        effect: "legendary_power",
        animation: "divine_energy",
        damage: 80 + (i * 3),
        healing: 50 + (i * 2),
        speedBoost: 0.4,
        armorBoost: 0.3
      };
      rarityEffects = ["legendary_aura", "divine_particles", "mastery_glow", "epic_trail"];
    }

    enhancedCardAbilities[cardId] = {
      cardId,
      primaryAbility,
      deployAnimation: `${tier}_deploy`,
      attackAnimation: `${tier}_attack`, 
      deathAnimation: `${tier}_death`,
      rarityEffects
    };
  }
}

// Utility functions for ability system
export const getCardEnhancement = (cardId: string): CardEnhancement | null => {
  return enhancedCardAbilities[cardId] || null;
};

export const triggerAbility = (cardId: string, abilityType: 'primary' | 'passive') => {
  const enhancement = getCardEnhancement(cardId);
  if (!enhancement) return null;

  const ability = abilityType === 'primary' ? enhancement.primaryAbility : enhancement.passiveAbility;
  if (!ability) return null;

  return {
    ...ability,
    timestamp: Date.now(),
    cardId
  };
};

export const getAnimationByType = (cardId: string, animationType: 'deploy' | 'attack' | 'death'): string => {
  const enhancement = getCardEnhancement(cardId);
  if (!enhancement) return 'default_animation';

  switch (animationType) {
    case 'deploy': return enhancement.deployAnimation;
    case 'attack': return enhancement.attackAnimation;
    case 'death': return enhancement.deathAnimation;
    default: return 'default_animation';
  }
};

export const getRarityEffects = (cardId: string): string[] => {
  const enhancement = getCardEnhancement(cardId);
  return enhancement?.rarityEffects || [];
};