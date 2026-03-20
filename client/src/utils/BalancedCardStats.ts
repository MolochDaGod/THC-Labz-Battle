/**
 * Balanced THC CLASH Card Stats System
 * Comprehensive rebalancing for strategic gameplay
 */

export interface BalancedStats {
  attack: number;
  health: number;
  cost: number;
  resistances: {
    physical: number;    // % resistance to melee/ranged
    magical: number;     // % resistance to spell damage
    tower: number;       // % resistance to tower damage
  };
  weaknesses: {
    physical: number;    // % extra damage from physical
    magical: number;     // % extra damage from magical
    tower: number;       // % extra damage from towers
  };
  speedMultiplier: number; // Speed modifier based on type
  rangeModifier: number;   // Range modifier
  shieldCharges?: number;  // Shield that blocks damage instances (melee units)
  costEfficiency: number;  // Stat efficiency based on mana cost
}

export interface CardTier {
  name: string;
  baseAttack: [number, number]; // [min, max]
  baseHealth: [number, number]; // [min, max]
  baseCost: [number, number];   // [min, max]
  resistanceProfile: string;
}

// Define card tiers for balanced progression
export const cardTiers: Record<string, CardTier> = {
  common: {
    name: "Common Strain",
    baseAttack: [40, 80],
    baseHealth: [120, 200],
    baseCost: [1, 3],
    resistanceProfile: "balanced"
  },
  uncommon: {
    name: "Quality Strain", 
    baseAttack: [60, 120],
    baseHealth: [160, 280],
    baseCost: [2, 4],
    resistanceProfile: "specialized"
  },
  rare: {
    name: "Premium Strain",
    baseAttack: [80, 160],
    baseHealth: [200, 360],
    baseCost: [3, 5],
    resistanceProfile: "enhanced"
  },
  epic: {
    name: "Exotic Strain",
    baseAttack: [120, 220],
    baseHealth: [280, 480],
    baseCost: [4, 6],
    resistanceProfile: "superior"
  },
  legendary: {
    name: "Master Strain",
    baseAttack: [160, 300],
    baseHealth: [360, 600],
    baseCost: [5, 8],
    resistanceProfile: "elite"
  },
  captain: {
    name: "Captain Strain",
    baseAttack: [250, 400],
    baseHealth: [500, 800],
    baseCost: [6, 10],
    resistanceProfile: "ultimate"
  }
};

// Resistance profiles for different card types
export const resistanceProfiles: Record<string, BalancedStats["resistances"]> = {
  balanced: { physical: 10, magical: 10, tower: 5 },
  tank: { physical: 35, magical: 15, tower: 25 },
  ranged: { physical: 5, magical: 20, tower: 10 },
  magical: { physical: 15, magical: 40, tower: 5 },
  glass_cannon: { physical: 0, magical: 0, tower: 0 },
  fortress: { physical: 50, magical: 30, tower: 40 },
  assassin: { physical: 20, magical: 5, tower: 15 },
  support: { physical: 25, magical: 35, tower: 20 }
};

// Speed multipliers for different unit types
export const speedMultipliers: Record<string, number> = {
  tank: 0.6,      // Slow but tanky
  melee: 0.8,     // Standard infantry speed
  ranged: 0.9,    // Slightly slower for balance
  magical: 1.1,   // Fast casters
  assassin: 1.3,  // Very fast but fragile
  support: 0.7    // Slow support units
};

// Generate balanced stats for a card
export function generateBalancedStats(
  cardId: string, 
  cardRarity: string = "common",
  cardClass: string = "melee",
  cardType: string = "unit"
): BalancedStats {
  
  const tier = cardTiers[cardRarity.toLowerCase()] || cardTiers.common;
  
  // Determine card number for scaling
  const cardNumber = parseInt(cardId.replace('image-', '')) || 1;
  const progressionFactor = Math.min(cardNumber / 66, 1); // Scale 1-66
  
  // Calculate base stats with progression
  const attackRange = tier.baseAttack[1] - tier.baseAttack[0];
  const healthRange = tier.baseHealth[1] - tier.baseHealth[0];
  const costRange = tier.baseCost[1] - tier.baseCost[0];
  
  let baseAttack = Math.round(tier.baseAttack[0] + (attackRange * progressionFactor));
  let baseHealth = Math.round(tier.baseHealth[0] + (healthRange * progressionFactor));
  const baseCost = Math.round(tier.baseCost[0] + (costRange * progressionFactor));
  
  // APPLY DAMAGE MULTIPLIERS: Ranged 25% damage reduction
  if (cardClass.includes("ranged")) {
    baseAttack = Math.round(baseAttack * 0.75); // Ranged damage multiplier: 75% (25% reduction)
  }
  
  // APPLY HP MULTIPLIERS: Tank 2x, Ranged 1.2x, Melee 1.5x
  if (cardClass.includes("tank")) {
    baseHealth = Math.round(baseHealth * 2.0); // Tank HP multiplier: 2x
  } else if (cardClass.includes("ranged")) {
    baseHealth = Math.round(baseHealth * 1.2); // Ranged HP multiplier: 1.2x
  } else if (cardClass.includes("melee")) {
    baseHealth = Math.round(baseHealth * 1.5); // Melee HP multiplier: 1.5x
  }
  // Magical, assassin, and support units keep base health
  
  // Determine resistance profile based on class
  let resistanceProfile = "balanced";
  if (cardClass.includes("tank")) resistanceProfile = "tank";
  else if (cardClass.includes("ranged")) resistanceProfile = "ranged";
  else if (cardClass.includes("spell") || cardClass.includes("magical")) resistanceProfile = "magical";
  else if (cardClass.includes("assassin")) resistanceProfile = "assassin";
  else if (cardClass.includes("support")) resistanceProfile = "support";
  
  const resistances = resistanceProfiles[resistanceProfile];
  
  // Calculate weaknesses (opposite of resistances)
  const weaknesses = {
    physical: Math.max(0, 15 - resistances.physical),
    magical: Math.max(0, 15 - resistances.magical),  
    tower: Math.max(0, 10 - resistances.tower)
  };
  
  // Speed and range modifiers
  const speedMultiplier = speedMultipliers[cardClass.toLowerCase()] || speedMultipliers.melee;
  const rangeModifier = cardClass.includes("ranged") ? 1.5 : 
                       cardClass.includes("magical") ? 1.3 :
                       cardClass.includes("tank") ? 0.8 : 1.0;
  
  // MANA COST EFFICIENCY - Higher cost cards get stat bonuses
  const finalCost = Math.max(1, baseCost);
  const costEfficiency = finalCost / 3; // Base efficiency at 3 mana
  const costBonus = Math.max(1, costEfficiency * 0.2); // 20% bonus per mana above 3
  
  // Apply cost-based stat scaling
  const costScaledAttack = Math.round(baseAttack * (1 + (costBonus - 1)));
  const costScaledHealth = Math.round(baseHealth * (1 + (costBonus - 1)));
  
  // SHIELDED EFFECT for some melee cards (blocks 3 damage instances)
  let shieldCharges = 0;
  if (cardClass.includes("melee") && !cardClass.includes("tank")) {
    // Give shield to 30% of melee cards (card numbers divisible by certain values)
    const cardNumber = parseInt(cardId.replace('image-', '')) || 1;
    if (cardNumber % 7 === 0 || cardNumber % 11 === 0) {
      shieldCharges = 3; // Blocks 3 damage instances
    }
  }
  
  return {
    attack: costScaledAttack,
    health: costScaledHealth,
    cost: finalCost,
    resistances,
    weaknesses,
    speedMultiplier,
    rangeModifier,
    shieldCharges,
    costEfficiency
  };
}

// Comprehensive balanced stats for all 66 cards + captain
export const balancedCardDatabase: Record<string, BalancedStats> = {};

// Generate balanced stats for all cards
for (let i = 1; i <= 66; i++) {
  const cardId = `image-${i}`;
  let rarity: string;
  let cardClass: string;
  
  // Assign rarity based on card number
  if (i <= 20) {
    rarity = i <= 10 ? "common" : "uncommon";
    cardClass = i % 4 === 0 ? "tank" : i % 3 === 0 ? "ranged" : "melee";
  } else if (i <= 40) {
    rarity = i <= 30 ? "uncommon" : "rare";
    cardClass = i % 5 === 0 ? "magical" : i % 4 === 0 ? "tank" : i % 3 === 0 ? "ranged" : "melee";
  } else if (i <= 55) {
    rarity = "rare";
    cardClass = i % 6 === 0 ? "support" : i % 5 === 0 ? "magical" : i % 4 === 0 ? "assassin" : "ranged";
  } else if (i <= 65) {
    rarity = "epic";
    cardClass = i % 7 === 0 ? "magical" : i % 6 === 0 ? "assassin" : i % 5 === 0 ? "support" : "tank";
  } else {
    rarity = "legendary";
    cardClass = i === 66 ? "magical" : "tank";
  }
  
  balancedCardDatabase[cardId] = generateBalancedStats(cardId, rarity, cardClass);
}

// Special captain card
balancedCardDatabase["captain"] = generateBalancedStats("captain", "captain", "magical", "hero");

// Damage calculation with resistances
export function calculateDamage(
  baseDamage: number,
  attackerType: string,
  defenderStats: BalancedStats,
  damageSource: "unit" | "tower" | "spell" = "unit"
): number {
  let finalDamage = baseDamage;
  
  // Apply resistances based on attack type
  if (damageSource === "tower") {
    finalDamage *= (1 - defenderStats.resistances.tower / 100);
  } else if (attackerType.includes("magical") || attackerType.includes("spell")) {
    finalDamage *= (1 - defenderStats.resistances.magical / 100);
  } else {
    finalDamage *= (1 - defenderStats.resistances.physical / 100);
  }
  
  // Apply type effectiveness
  if (attackerType === "magical" && defenderStats.weaknesses.magical > 0) {
    finalDamage *= (1 + defenderStats.weaknesses.magical / 100);
  } else if (attackerType !== "magical" && defenderStats.weaknesses.physical > 0) {
    finalDamage *= (1 + defenderStats.weaknesses.physical / 100);
  }
  
  return Math.max(1, Math.round(finalDamage)); // Minimum 1 damage
}

// Get balanced stats for a card
export function getBalancedStats(cardId: string): BalancedStats | null {
  return balancedCardDatabase[cardId] || null;
}

// Utility function to get card tier info
export function getCardTier(cardId: string): string {
  const cardNumber = parseInt(cardId.replace('image-', '')) || 1;
  
  if (cardId === "captain") return "captain";
  if (cardNumber <= 10) return "common";
  if (cardNumber <= 20) return "uncommon";  
  if (cardNumber <= 40) return "rare";
  if (cardNumber <= 55) return "epic";
  return "legendary";
}

// Note: cardTiers, resistanceProfiles, and speedMultipliers are already exported above