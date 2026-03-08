interface NFTTrait {
  trait_type: string;
  value: string;
}

interface NFTBonuses {
  attackBonus: number;
  healthBonus: number;
  defenseBonus: number;
  manaBonus: number;
  specialAbilities: string[];
  deckSize: number;
}

interface CaptainCard {
  name: string;
  image: string;
  attack: number;
  health: number;
  abilities: string[];
  rarity: string;
  cost: number;
}

export class NFTTraitAnalyzer {
  
  // Comprehensive trait-based bonus mapping for THC GROWERZ collection
  private static traitBonusMap: Record<string, Record<string, Partial<NFTBonuses>>> = {
    "Background": {
      // Authentic GROWERZ backgrounds
      "Blue": { attackBonus: 15, healthBonus: 25, manaBonus: 0.10, specialAbilities: ["blue_aura"] },
      "Red": { attackBonus: 20, healthBonus: 15, specialAbilities: ["red_rage"] },
      "Green": { healthBonus: 30, defenseBonus: 10, specialAbilities: ["green_growth"] },
      "Purple": { manaBonus: 0.20, healthBonus: 20, specialAbilities: ["purple_mystery"] },
      "Orange": { attackBonus: 18, manaBonus: 0.12, specialAbilities: ["orange_energy"] },
      "Yellow": { attackBonus: 12, healthBonus: 18, manaBonus: 0.08, deckSize: 1 },
      "Pink": { healthBonus: 22, manaBonus: 0.15, specialAbilities: ["pink_charm"] },
      "Black": { attackBonus: 25, defenseBonus: 15, specialAbilities: ["shadow_power"] },
      "White": { defenseBonus: 20, healthBonus: 25, specialAbilities: ["pure_light"] },
      "Galaxy": { attackBonus: 30, healthBonus: 40, manaBonus: 0.25, deckSize: 3, specialAbilities: ["cosmic_power"] }
    },
    "Strain": {
      // Legendary strains with maximum bonuses
      "OG Kush": { attackBonus: 40, healthBonus: 20, specialAbilities: ["legendary_strain", "kush_power"] },
      "Sour Diesel": { attackBonus: 35, manaBonus: 0.25, specialAbilities: ["energy_boost", "diesel_fury"] },
      "White Widow": { healthBonus: 70, defenseBonus: 25, specialAbilities: ["frost_armor", "widow_web"] },
      "Purple Haze": { attackBonus: 30, healthBonus: 30, specialAbilities: ["confusion_aura", "purple_mist"] },
      "Blue Dream": { healthBonus: 50, manaBonus: 0.30, specialAbilities: ["dream_shield", "blue_vision"] },
      "Green Crack": { attackBonus: 45, manaBonus: 0.20, specialAbilities: ["speed_burst", "crack_strike"] },
      "Gorilla Glue": { defenseBonus: 40, healthBonus: 40, specialAbilities: ["sticky_trap", "gorilla_strength"] },
      // Epic strains
      "Girl Scout Cookies": { attackBonus: 30, healthBonus: 35, specialAbilities: ["cookie_crumble"] },
      "AK-47": { attackBonus: 50, manaBonus: 0.15, specialAbilities: ["rapid_fire", "assault_mode"] },
      "Jack Herer": { healthBonus: 45, manaBonus: 0.25, specialAbilities: ["jack_wisdom", "herbal_healing"] },
      "Northern Lights": { defenseBonus: 30, healthBonus: 50, specialAbilities: ["aurora_shield"] },
      "Amnesia": { attackBonus: 25, manaBonus: 0.35, specialAbilities: ["memory_wipe"] },
      // Rare strains
      "Gelato": { attackBonus: 20, healthBonus: 25, specialAbilities: ["sweet_strike"] },
      "Wedding Cake": { healthBonus: 40, defenseBonus: 15, specialAbilities: ["celebration"] },
      "Zkittlez": { attackBonus: 15, manaBonus: 0.20, deckSize: 2, specialAbilities: ["rainbow_burst"] },
      "Runtz": { attackBonus: 18, healthBonus: 22, specialAbilities: ["candy_power"] },
      // Common strains
      "Indica": { healthBonus: 30, defenseBonus: 10, specialAbilities: ["relaxation"] },
      "Sativa": { attackBonus: 20, manaBonus: 0.15, specialAbilities: ["energy"] },
      "Hybrid": { attackBonus: 15, healthBonus: 15, manaBonus: 0.10, deckSize: 1 }
    },
    "Eyes": {
      // Authentic GROWERZ eyes
      "Shocked": { attackBonus: 15, manaBonus: 0.12, specialAbilities: ["shock_aura"] },
      "Red": { attackBonus: 18, specialAbilities: ["red_rage"] },
      "Blue": { manaBonus: 0.15, healthBonus: 12, specialAbilities: ["blue_calm"] },
      "Green": { healthBonus: 20, specialAbilities: ["green_growth"] },
      "Brown": { defenseBonus: 12, healthBonus: 15 },
      "Black": { attackBonus: 15, defenseBonus: 8, specialAbilities: ["dark_sight"] },
      "Purple": { manaBonus: 0.15, healthBonus: 18, specialAbilities: ["purple_mystery"] },
      "Laser": { attackBonus: 35, specialAbilities: ["laser_vision", "precision_strike"] },
      "Fire": { attackBonus: 25, specialAbilities: ["burn_damage"] },
      "Ice": { defenseBonus: 20, specialAbilities: ["freeze_enemies"] },
      "Gold": { manaBonus: 0.25, deckSize: 3, specialAbilities: ["golden_vision"] },
      "Diamond": { defenseBonus: 30, healthBonus: 50, specialAbilities: ["diamond_skin"] }
    },
    "Head": {
      // Authentic GROWERZ headwear
      "Beanies": { healthBonus: 20, defenseBonus: 12, specialAbilities: ["warm_comfort"] },
      "Cap": { attackBonus: 15, healthBonus: 15, deckSize: 1 },
      "Bandana": { attackBonus: 12, manaBonus: 0.10, specialAbilities: ["rebel_spirit"] },
      "Crown": { attackBonus: 35, healthBonus: 40, manaBonus: 0.25, deckSize: 3, specialAbilities: ["royal_command"] },
      "Wizard Hat": { manaBonus: 0.40, deckSize: 5, specialAbilities: ["magic_mastery"] },
      "Military Helmet": { defenseBonus: 30, healthBonus: 25, specialAbilities: ["tactical_advantage"] },
      "Fedora": { attackBonus: 20, manaBonus: 0.15, specialAbilities: ["detective_instinct"] },
      "Top Hat": { manaBonus: 0.20, deckSize: 2, specialAbilities: ["gentleman_class"] },
      "Headband": { attackBonus: 18, healthBonus: 12, specialAbilities: ["focus_band"] },
      "None": { attackBonus: 5, healthBonus: 5 }
    },
    "Mouth": {
      // Authentic GROWERZ mouth expressions
      "Tongue Out": { attackBonus: 12, manaBonus: 0.08, specialAbilities: ["playful_energy"] },
      "Joint": { attackBonus: 18, manaBonus: 0.15, specialAbilities: ["smoke_screen"] },
      "Blunt": { attackBonus: 22, healthBonus: 20, specialAbilities: ["relaxation"] },
      "Bong": { manaBonus: 0.25, healthBonus: 25, specialAbilities: ["water_filtration"] },
      "Pipe": { manaBonus: 0.20, defenseBonus: 12, specialAbilities: ["wisdom_boost"] },
      "Vape": { attackBonus: 15, manaBonus: 0.18, specialAbilities: ["clean_energy"] },
      "Smile": { healthBonus: 15, manaBonus: 0.10, specialAbilities: ["positive_energy"] },
      "Frown": { attackBonus: 10, defenseBonus: 8 },
      "Open": { manaBonus: 0.12, specialAbilities: ["vocal_power"] },
      "Closed": { defenseBonus: 10, healthBonus: 12 },
      "Shocked": { attackBonus: 8, manaBonus: 0.12, specialAbilities: ["surprise_attack"] },
      "None": { attackBonus: 3, healthBonus: 3 }
    },
    "Clothes": {
      // Authentic GROWERZ clothing
      "Spiked Jacket": { attackBonus: 25, defenseBonus: 18, specialAbilities: ["spike_damage", "tough_exterior"] },
      "Hoodie": { healthBonus: 30, defenseBonus: 15, deckSize: 2, specialAbilities: ["street_comfort"] },
      "T-Shirt": { attackBonus: 10, healthBonus: 12, deckSize: 1 },
      "Tank Top": { attackBonus: 12, manaBonus: 0.08, specialAbilities: ["freedom_of_movement"] },
      "Jersey": { attackBonus: 15, healthBonus: 18, specialAbilities: ["team_spirit"] },
      "Jacket": { defenseBonus: 20, healthBonus: 20, specialAbilities: ["weather_protection"] },
      "Suit": { attackBonus: 20, manaBonus: 0.15, specialAbilities: ["business_savvy"] },
      "Armor": { defenseBonus: 40, healthBonus: 50, specialAbilities: ["battle_ready"] },
      "Robe": { manaBonus: 0.30, deckSize: 4, specialAbilities: ["mystical_knowledge"] },
      "Lab Coat": { manaBonus: 0.25, healthBonus: 30, specialAbilities: ["scientific_method"] },
      "None": { attackBonus: 2, healthBonus: 2 }
    },
    "Skin": {
      // Authentic GROWERZ skin types
      "Skull": { attackBonus: 20, defenseBonus: 15, specialAbilities: ["bone_armor", "intimidation"] },
      "Zombie": { healthBonus: 35, attackBonus: 15, specialAbilities: ["undead_resilience"] },
      "Alien": { manaBonus: 0.20, attackBonus: 18, specialAbilities: ["alien_tech"] },
      "Robot": { defenseBonus: 25, manaBonus: 0.15, specialAbilities: ["mechanical_precision"] },
      "Human": { attackBonus: 8, healthBonus: 8, manaBonus: 0.05, deckSize: 1 },
      "Green": { healthBonus: 20, specialAbilities: ["natural_healing"] },
      "Blue": { manaBonus: 0.12, healthBonus: 15, specialAbilities: ["blue_energy"] },
      "Red": { attackBonus: 15, specialAbilities: ["red_fury"] },
      "Purple": { manaBonus: 0.18, healthBonus: 12, specialAbilities: ["purple_magic"] }
    },
    "Accessories": {
      // Jewelry and extras
      "Gold Chain": { attackBonus: 20, manaBonus: 0.15, specialAbilities: ["bling_power", "wealth_display"] },
      "Diamond Chain": { attackBonus: 35, manaBonus: 0.25, specialAbilities: ["diamond_shine", "luxury_aura"] },
      "Watch": { manaBonus: 0.20, deckSize: 2, specialAbilities: ["time_management"] },
      "Sunglasses": { defenseBonus: 15, specialAbilities: ["cool_factor", "UV_protection"] },
      "Earrings": { attackBonus: 12, manaBonus: 0.10, specialAbilities: ["style_points"] },
      "Tattoo": { attackBonus: 15, specialAbilities: ["ink_power", "permanent_boost"] },
      "None": { attackBonus: 1, healthBonus: 1 }
    }
  };

  static analyzeNFTTraits(nft: any): { bonuses: NFTBonuses; captainCard: CaptainCard } {
    console.log(`🔍 [TRAIT ANALYZER] Starting analysis for ${nft.name}...`);
    
    const baseBonuses: NFTBonuses = {
      attackBonus: 10, // Base bonus for any NFT
      healthBonus: 25,
      defenseBonus: 5,
      manaBonus: 0.05,
      specialAbilities: [],
      deckSize: 12 // Base deck size
    };

    const rank = nft.rank || 2420;
    const rankMultiplier = Math.max(0.1, (2420 - rank) / 2420); // Better rank = higher multiplier
    console.log(`🔍 [TRAIT ANALYZER] Rank: ${rank}, Multiplier: ${rankMultiplier.toFixed(2)}`);

    // Analyze traits from NFT metadata
    const traits = nft.attributes || nft.traits || [];
    console.log(`🔍 [TRAIT ANALYZER] Found ${traits.length} traits:`, traits.map((t: NFTTrait) => `${t.trait_type}=${t.value}`).join(', '));
    
    let processedTraits = 0;
    traits.forEach((trait: NFTTrait, index: number) => {
      const traitType = trait.trait_type;
      const traitValue = trait.value;
      console.log(`🔍 [TRAIT ANALYZER] Processing trait ${index + 1}/${traits.length}: ${traitType} = ${traitValue}`);
      
      if (this.traitBonusMap[traitType] && this.traitBonusMap[traitType][traitValue]) {
        const bonus = this.traitBonusMap[traitType][traitValue];
        console.log(`✅ [TRAIT ANALYZER] Found mapping for ${traitType}=${traitValue}:`, JSON.stringify(bonus, null, 2));
        
        const attackAdd = (bonus.attackBonus || 0) * (1 + rankMultiplier);
        const healthAdd = (bonus.healthBonus || 0) * (1 + rankMultiplier);
        const defenseAdd = (bonus.defenseBonus || 0) * (1 + rankMultiplier);
        const manaAdd = (bonus.manaBonus || 0) * (1 + rankMultiplier);
        
        baseBonuses.attackBonus += attackAdd;
        baseBonuses.healthBonus += healthAdd;
        baseBonuses.defenseBonus += defenseAdd;
        baseBonuses.manaBonus += manaAdd;
        baseBonuses.deckSize += bonus.deckSize || 0;
        
        console.log(`✅ [TRAIT ANALYZER] Applied bonuses: ATK +${attackAdd.toFixed(1)}, HP +${healthAdd.toFixed(1)}, DEF +${defenseAdd.toFixed(1)}, MANA +${manaAdd.toFixed(3)}`);
        
        if (bonus.specialAbilities) {
          baseBonuses.specialAbilities.push(...bonus.specialAbilities);
          console.log(`🎯 [TRAIT ANALYZER] Added abilities: ${bonus.specialAbilities.join(', ')}`);
        }
        processedTraits++;
      } else {
        console.log(`⚠️ [TRAIT ANALYZER] No mapping found for ${traitType}=${traitValue}`);
      }
    });

    console.log(`✅ [TRAIT ANALYZER] Processed ${processedTraits}/${traits.length} traits successfully`);

    // Apply rank-based bonuses
    baseBonuses.attackBonus = Math.floor(baseBonuses.attackBonus);
    baseBonuses.healthBonus = Math.floor(baseBonuses.healthBonus);
    baseBonuses.defenseBonus = Math.floor(baseBonuses.defenseBonus);
    baseBonuses.deckSize = Math.min(40, Math.max(8, baseBonuses.deckSize));

    console.log(`📊 [TRAIT ANALYZER] Final bonuses: ATK ${baseBonuses.attackBonus}, HP ${baseBonuses.healthBonus}, DEF ${baseBonuses.defenseBonus}, MANA ${baseBonuses.manaBonus.toFixed(3)}, Abilities: [${baseBonuses.specialAbilities.join(', ')}]`);

    // Add rank-based special abilities
    if (rank <= 50) {
      baseBonuses.specialAbilities.push("legendary_aura", "double_strike", "commander");
    } else if (rank <= 200) {
      baseBonuses.specialAbilities.push("epic_power", "leadership");
    } else if (rank <= 500) {
      baseBonuses.specialAbilities.push("rare_blessing");
    }

    // Create captain card based on NFT
    const captainCard: CaptainCard = {
      name: nft.name || `THC Grower #${nft.tokenId}`,
      image: nft.image || nft.imageUrl || '',
      attack: 100 + baseBonuses.attackBonus,
      health: 200 + baseBonuses.healthBonus,
      abilities: [...baseBonuses.specialAbilities],
      rarity: rank <= 50 ? 'legendary' : rank <= 200 ? 'epic' : rank <= 500 ? 'rare' : 'common',
      cost: 0 // Captain is free to deploy
    };

    return { bonuses: baseBonuses, captainCard };
  }

  static generateTraitBasedDeck(nft: any, bonuses: NFTBonuses): any[] {
    const traits = nft.attributes || nft.traits || [];
    
    // Base deck with enhanced variety
    const baseDeck = [
      { name: "Grower Soldier", attack: 60, health: 100, cost: 2, type: "minion", class: "warrior" },
      { name: "THC Defender", attack: 40, health: 150, cost: 2, type: "minion", class: "tank" },
      { name: "Bud Archer", attack: 80, health: 70, cost: 3, type: "minion", class: "archer" },
      { name: "Strain Wizard", attack: 100, health: 80, cost: 4, type: "minion", class: "mage" },
      { name: "Harvest Guardian", attack: 120, health: 200, cost: 5, type: "minion", class: "tank" },
      { name: "Trichome Assassin", attack: 150, health: 60, cost: 4, type: "minion", class: "assassin" },
      { name: "Resin Bomber", attack: 90, health: 90, cost: 3, type: "minion", class: "warrior" },
      { name: "Cannabinoid Healer", attack: 30, health: 120, cost: 3, type: "minion", class: "support" }
    ];

    // Generate trait-specific special cards
    const specialCards = this.generateTraitSpecificCards(traits, bonuses);
    
    // Combine base deck with special cards
    const allCards = [...baseDeck, ...specialCards];

    const enhancedDeck = allCards.map(card => ({
      ...card,
      attack: Math.floor(card.attack + (bonuses.attackBonus * 0.3)),
      health: Math.floor(card.health + (bonuses.healthBonus * 0.2)),
      description: `Enhanced by ${nft.name || 'your NFT'} traits`,
      abilities: bonuses.specialAbilities.slice(0, 2) // Add first 2 special abilities
    }));

    // Add more cards if needed based on deck size
    while (enhancedDeck.length < bonuses.deckSize) {
      const baseCard = allCards[enhancedDeck.length % allCards.length];
      enhancedDeck.push({
        ...baseCard,
        name: `${baseCard.name} Enhanced`,
        attack: Math.floor(baseCard.attack + bonuses.attackBonus * 0.5),
        health: Math.floor(baseCard.health + bonuses.healthBonus * 0.3),
        cost: Math.min(8, baseCard.cost + 1),
        description: `Powered by NFT trait synergy`,
        abilities: bonuses.specialAbilities
      });
    }

    return enhancedDeck.slice(0, bonuses.deckSize);
  }

  // Generate cards based on specific NFT traits
  private static generateTraitSpecificCards(traits: NFTTrait[], bonuses: NFTBonuses): any[] {
    const specialCards: any[] = [];

    traits.forEach((trait: NFTTrait) => {
      const traitType = trait.trait_type;
      const traitValue = trait.value;

      // Generate cards based on specific trait combinations
      switch (traitType) {
        case "Strain":
          if (["OG Kush", "Sour Diesel", "White Widow"].includes(traitValue)) {
            specialCards.push({
              name: `${traitValue} Master`,
              attack: 130,
              health: 160,
              cost: 6,
              type: "minion",
              class: "mage",
              description: `Legendary ${traitValue} strain master with enhanced abilities`
            });
          }
          break;

        case "Eyes":
          if (["Laser", "Diamond", "Galaxy"].includes(traitValue)) {
            specialCards.push({
              name: `${traitValue} Vision`,
              attack: 200,
              health: 50,
              cost: 5,
              type: "spell",
              class: "mage",
              description: `Devastating ${traitValue} eye beam attack`
            });
          }
          break;

        case "Background":
          if (["Galaxy", "Forest", "Ocean"].includes(traitValue)) {
            specialCards.push({
              name: `${traitValue} Guardian`,
              attack: 80,
              health: 180,
              cost: 4,
              type: "minion",
              class: "support",
              description: `Environmental guardian from the ${traitValue}`
            });
          }
          break;

        case "Hat":
          if (["Crown", "Wizard Hat"].includes(traitValue)) {
            specialCards.push({
              name: `${traitValue} Authority`,
              attack: 90,
              health: 120,
              cost: 4,
              type: "minion",
              class: "mage",
              description: `Commands respect with the power of ${traitValue}`
            });
          }
          break;

        case "Clothing":
          if (["Armor", "Robe"].includes(traitValue)) {
            specialCards.push({
              name: `${traitValue} Specialist`,
              attack: 70,
              health: 200,
              cost: 5,
              type: "minion",
              class: "tank",
              description: `Elite warrior equipped with ${traitValue}`
            });
          }
          break;
      }
    });

    return specialCards;
  }
}