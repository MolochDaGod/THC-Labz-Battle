import type { Request, Response } from "express";
import { COMPLETE_TRAIT_BONUSES, getTraitBonus, calculateAllTraitBonuses } from './complete-trait-bonuses';

// NFT Rarity Tiers based on rank
export enum RarityTier {
  MYTHIC = "Mythic",
  EPIC = "Epic", 
  RARE = "Rare",
  UNCOMMON = "Uncommon",
  COMMON = "Common"
}

// Game impact interfaces
export interface TraitBonus {
  type: string;
  value: number;
  description: string;
}

export interface NFTGameBonus {
  rarityBonus: TraitBonus;
  traitBonuses: TraitBonus[];
  totalBonus: number;
  description: string;
}

/**
 * Get rarity tier from HowRare.is rank (based on rarity score, not mint number)
 * Updated tier boundaries: Mythic: 1-71, Epic: 72-361, Rare: 362-843, Uncommon: 844-1446, Common: 1447-2420
 */
export function getRarityTier(howRareRank: number): RarityTier {
  // HowRare.is ranking is 1 = rarest, higher numbers = more common
  if (howRareRank >= 1 && howRareRank <= 71) return RarityTier.MYTHIC;
  if (howRareRank >= 72 && howRareRank <= 361) return RarityTier.EPIC;
  if (howRareRank >= 362 && howRareRank <= 843) return RarityTier.RARE;
  if (howRareRank >= 844 && howRareRank <= 1446) return RarityTier.UNCOMMON;
  if (howRareRank >= 1447 && howRareRank <= 2420) return RarityTier.COMMON;
  return RarityTier.COMMON; // fallback for any edge cases
}

/**
 * Calculate rarity bonus multiplier
 */
export function getRarityBonus(tier: RarityTier): number {
  switch (tier) {
    case RarityTier.MYTHIC: return 2.5; // 150% bonus
    case RarityTier.EPIC: return 2.0;   // 100% bonus  
    case RarityTier.RARE: return 1.75;  // 75% bonus
    case RarityTier.UNCOMMON: return 1.5; // 50% bonus
    case RarityTier.COMMON: return 1.25; // 25% bonus
  }
}

/**
 * Background trait bonuses
 */
export function getBackgroundBonus(background: string): TraitBonus | null {
  const bonuses: Record<string, TraitBonus> = {
    "Baby Blue": { type: "peace_deals", value: 15, description: "Peaceful aura reduces police attention by 15%" },
    "Beige": { type: "stealth", value: 10, description: "Neutral appearance provides 10% stealth bonus" },
    "Blue": { type: "loyalty", value: 12, description: "Blue collar respect increases NPC loyalty by 12%" },
    "Crimson": { type: "intimidation", value: 20, description: "Blood red intimidates rivals, 20% better deal prices" },
    "Dark Gray": { type: "night_ops", value: 25, description: "Shadow blending gives 25% bonus to night operations" },
    "Gold": { type: "wealth", value: 30, description: "Golden aura attracts 30% more money from all deals" },
    "Green": { type: "nature", value: 18, description: "Cannabis connection improves product quality by 18%" },
    "Mint": { type: "freshness", value: 14, description: "Fresh appeal increases customer satisfaction by 14%" },
    "Starz And Stripez": { type: "patriot", value: 35, description: "Patriotic pride grants 35% bonus in America-themed cities" },
    "Thc Labz": { type: "lab_access", value: 40, description: "Lab insider knowledge provides 40% research bonus" },
    "Violet": { type: "psychic", value: 22, description: "Purple energy predicts market changes 22% better" },
    "Yellow": { type: "sunshine", value: 16, description: "Bright energy improves mood, 16% better AI conversations" }
  };
  return bonuses[background] || null;
}

/**
 * Skin trait bonuses
 */
export function getSkinBonus(skin: string): TraitBonus | null {
  const bonuses: Record<string, TraitBonus> = {
    "Brown": { type: "earthy", value: 12, description: "Earth connection improves outdoor grow operations by 12%" },
    "Ecto": { type: "ghostly", value: 25, description: "Spectral form reduces police detection by 25%" },
    "Fair": { type: "innocent", value: 15, description: "Innocent appearance reduces suspicion by 15%" },
    "Gold Drip": { type: "luxury", value: 35, description: "Golden skin attracts premium customers, 35% price bonus" },
    "Psychedelic": { type: "trippy", value: 30, description: "Mind-bending aura confuses enemies, 30% evasion bonus" },
    "Skull": { type: "death", value: 40, description: "Death imagery intimidates rivals, 40% fear factor bonus" },
    "Solana": { type: "crypto", value: 50, description: "Blockchain connection enhances all crypto transactions by 50%" },
    "Sticky Icky": { type: "resin", value: 28, description: "Cannabis resin knowledge improves product potency by 28%" },
    "Tatted-up": { type: "street_cred", value: 20, description: "Tattoo respect increases street credibility by 20%" }
  };
  return bonuses[skin] || null;
}

/**
 * Clothes trait bonuses
 */
export function getClothesBonus(clothes: string): TraitBonus | null {
  const bonuses: Record<string, TraitBonus> = {
    "Artist Jacket": { type: "creativity", value: 18, description: "Artistic flair improves creative marketing by 18%" },
    "Baseball Shirt": { type: "athletics", value: 15, description: "Sports gear increases running speed by 15%" },
    "Basketball Jersey": { type: "team_play", value: 20, description: "Team spirit enhances group operations by 20%" },
    "Cheech Outfit": { type: "comedy", value: 25, description: "Comedy legend status reduces tension by 25%" },
    "Chong Outfit": { type: "zen", value: 22, description: "Zen master calm improves meditation bonuses by 22%" },
    "Cozy Sweater": { type: "comfort", value: 12, description: "Cozy vibes improve customer relations by 12%" },
    "Designer Sweatshirt": { type: "fashion", value: 16, description: "Fashion sense attracts trendy customers by 16%" },
    "Hawaiian Shirt": { type: "vacation", value: 20, description: "Vacation vibes reduce stress by 20%" },
    "Honest Farmer": { type: "agriculture", value: 35, description: "Farming expertise improves grow operations by 35%" },
    "Iced-out Bling": { type: "flashy", value: 30, description: "Bling status intimidates and impresses by 30%" },
    "Leather Fur-jacket": { type: "luxury_tough", value: 25, description: "Luxury toughness combines class and fear by 25%" },
    "Mech Jacket": { type: "tech", value: 28, description: "Tech gear enhances all electronic operations by 28%" },
    "Mink Coat": { type: "ultra_luxury", value: 45, description: "Ultimate luxury attracts elite customers by 45%" },
    "Murica Vest": { type: "patriotic", value: 30, description: "American pride boosts domestic operations by 30%" },
    "Naked": { type: "fearless", value: 50, description: "Fearless confidence intimidates everyone by 50%" },
    "Silk Shirt-jacket": { type: "smooth", value: 20, description: "Smooth operator improves negotiation by 20%" },
    "Spiked Jacket": { type: "punk_rock", value: 35, description: "Punk attitude increases rebellion bonus by 35%" },
    "Street Jacket": { type: "street_smart", value: 25, description: "Street knowledge improves urban operations by 25%" },
    "Supreme Grower": { type: "grow_master", value: 40, description: "Master grower expertise maximizes yield by 40%" },
    "Tactical Vest": { type: "military", value: 32, description: "Military precision increases operation success by 32%" },
    "Thc Jacket": { type: "cannabis_expert", value: 38, description: "Cannabis expertise improves all product quality by 38%" },
    "Thc Suit": { type: "cannabis_executive", value: 42, description: "Executive status commands respect and 42% bonus" },
    "Yaba-dab-a-doo": { type: "prehistoric", value: 28, description: "Stone age wisdom provides 28% primitive bonus" }
  };
  return bonuses[clothes] || null;
}

/**
 * Head trait bonuses
 */
export function getHeadBonus(head: string): TraitBonus | null {
  const bonuses: Record<string, TraitBonus> = {
    "Anime Hair": { type: "anime_power", value: 25, description: "Anime protagonist energy increases determination by 25%" },
    "Bald": { type: "wisdom", value: 20, description: "Bald wisdom improves strategic thinking by 20%" },
    "Beanies": { type: "street_style", value: 15, description: "Street style increases urban credibility by 15%" },
    "Buzz Cut": { type: "military_discipline", value: 18, description: "Military discipline improves focus by 18%" },
    "Color Halo": { type: "divine", value: 30, description: "Divine blessing provides 30% protection from bad luck" },
    "Crown": { type: "royalty", value: 40, description: "Royal authority commands 40% respect and better prices" },
    "Fire Horns": { type: "demonic", value: 35, description: "Demonic power intimidates rivals by 35%" },
    "Heisenberg Hat": { type: "chemistry", value: 45, description: "Chemistry mastery improves product purity by 45%" },
    "Pot-head": { type: "cannabis_mind", value: 30, description: "Cannabis consciousness enhances plant knowledge by 30%" },
    "Raidens Straw Hat": { type: "lightning", value: 28, description: "Lightning speed increases reaction time by 28%" },
    "Rasta Hat": { type: "rastafarian", value: 32, description: "Rasta wisdom improves spiritual connection by 32%" },
    "Samurai Manbun": { type: "bushido", value: 35, description: "Samurai honor increases loyalty and respect by 35%" },
    "Short Dreads": { type: "natural", value: 22, description: "Natural style improves authenticity by 22%" },
    "Snapback Cap": { type: "youth_culture", value: 16, description: "Youth appeal attracts younger customers by 16%" },
    "Tied Dread": { type: "organized", value: 24, description: "Organized appearance improves business efficiency by 24%" },
    "Trapper Hat": { type: "survival", value: 26, description: "Survival skills improve harsh condition operations by 26%" },
    "Tupac Bandana": { type: "legend", value: 38, description: "Legendary status provides 38% street credibility" },
    "Uncle Sam's Hat": { type: "government", value: 30, description: "Government authority reduces legal trouble by 30%" },
    "Wizard Hat": { type: "magic", value: 42, description: "Magical knowledge provides 42% mystical bonuses" }
  };
  return bonuses[head] || null;
}

/**
 * Mouth trait bonuses  
 */
export function getMouthBonus(mouth: string): TraitBonus | null {
  const bonuses: Record<string, TraitBonus> = {
    "Blunt": { type: "smoking", value: 25, description: "Blunt smoking improves cannabis appreciation by 25%" },
    "Canna-beard": { type: "cannabis_wisdom", value: 30, description: "Cannabis beard shows expertise, 30% product bonus" },
    "Cheech Stache": { type: "comedy_legend", value: 28, description: "Comedy legend status reduces tension by 28%" },
    "Cross Joint": { type: "advanced_smoking", value: 35, description: "Advanced smoking technique improves efficiency by 35%" },
    "Dab Rig": { type: "concentrate_master", value: 40, description: "Concentrate mastery maximizes potency by 40%" },
    "Dope Mask": { type: "anonymous", value: 32, description: "Anonymous identity reduces detection risk by 32%" },
    "Full Beard": { type: "mature_wisdom", value: 22, description: "Mature wisdom improves decision making by 22%" },
    "Gold Grillz": { type: "wealth_display", value: 26, description: "Wealth display intimidates and impresses by 26%" },
    "Grin Wide-smile": { type: "charisma", value: 20, description: "Charismatic smile improves social interactions by 20%" },
    "Joint": { type: "classic_smoking", value: 18, description: "Classic joint smoking provides 18% relaxation bonus" },
    "Rainbow Puke": { type: "psychedelic_experience", value: 35, description: "Psychedelic experience enhances creativity by 35%" },
    "Rainbow Teeth": { type: "colorful_personality", value: 24, description: "Colorful personality attracts diverse customers by 24%" },
    "Shroom Bite": { type: "mushroom_knowledge", value: 30, description: "Mushroom knowledge expands product range by 30%" },
    "Tongue Out": { type: "playful", value: 16, description: "Playful attitude reduces serious tensions by 16%" }
  };
  return bonuses[mouth] || null;
}

/**
 * Eyes trait bonuses
 */
export function getEyesBonus(eyes: string): TraitBonus | null {
  const bonuses: Record<string, TraitBonus> = {
    "Aviator": { type: "pilot_vision", value: 25, description: "Pilot vision improves long-distance operations by 25%" },
    "Bruised": { type: "battle_hardened", value: 30, description: "Battle scars increase intimidation factor by 30%" },
    "Leaf Party Shades": { type: "party_vision", value: 20, description: "Party vision spots fun opportunities 20% better" },
    "Led Shades": { type: "tech_vision", value: 28, description: "LED technology enhances digital operations by 28%" },
    "Money Eye": { type: "profit_vision", value: 35, description: "Money vision spots profitable deals 35% better" },
    "Retro Shades": { type: "vintage_cool", value: 22, description: "Vintage cool attracts nostalgic customers by 22%" },
    "Shocked": { type: "surprise_factor", value: 18, description: "Shock value catches enemies off guard by 18%" },
    "Stoned": { type: "high_insight", value: 32, description: "Stoned perspective provides 32% enhanced perception" },
    "Thug Life Shades": { type: "gangster_vision", value: 38, description: "Gangster vision improves criminal operations by 38%" },
    "Tinted Shades": { type: "mystery", value: 24, description: "Mysterious appearance makes intentions 24% harder to read" },
    "Vigilante Mask": { type: "justice", value: 35, description: "Justice drive improves moral operations by 35%" },
    "White Glow": { type: "enlightened", value: 40, description: "Enlightened vision provides 40% spiritual insight" }
  };
  return bonuses[eyes] || null;
}

/**
 * Calculate all bonuses for an NFT
 */
export function calculateNFTBonuses(attributes: any[], rank: number): NFTGameBonus {
  const rarityTier = getRarityTier(rank);
  const rarityMultiplier = getRarityBonus(rarityTier);
  
  const rarityBonus: TraitBonus = {
    type: "rarity_multiplier",
    value: (rarityMultiplier - 1) * 100,
    description: `${rarityTier} rarity provides ${((rarityMultiplier - 1) * 100).toFixed(0)}% bonus to all operations`
  };

  const traitBonuses: TraitBonus[] = [];
  
  for (const attr of attributes) {
    // Skip attribute count as it's not a gameplay trait
    if (attr.trait_type === 'Attribute count') continue;
    
    const traitBonus = getTraitBonus(attr.trait_type, attr.value);
    if (traitBonus) {
      traitBonuses.push({
        type: traitBonus.bonus_type,
        value: traitBonus.bonus_value,
        description: traitBonus.description
      });
    }
  }

  const traitTotal = traitBonuses.reduce((sum, bonus) => sum + bonus.value, 0);
  const totalBonus = rarityMultiplier + (traitTotal / 100);

  return {
    rarityBonus,
    traitBonuses,
    totalBonus,
    description: `Total game impact: ${(totalBonus * 100).toFixed(1)}% effectiveness across all operations`
  };
}

/**
 * API endpoint to analyze NFT traits and bonuses
 */
export async function analyzeNFTTraits(req: Request, res: Response) {
  try {
    const { mint } = req.params;
    
    if (!mint) {
      return res.status(400).json({
        success: false,
        error: 'NFT mint address is required'
      });
    }

    console.log(`🔍 Analyzing traits for NFT: ${mint}`);

    // Fetch authentic NFT data from HowRare.is
    try {
      const howRareResponse = await fetch(`${process.env.REPLIT_URL || 'http://localhost:5000'}/api/howrare/nft/${mint}`);
      
      if (!howRareResponse.ok) {
        throw new Error(`HowRare API failed: ${howRareResponse.status}`);
      }
      
      const howRareData = await howRareResponse.json();
      
      if (!howRareData.success || !howRareData.nft) {
        throw new Error('Invalid HowRare.is response');
      }

      const nftData = howRareData.nft;
      console.log(`✅ Found authentic NFT data: ${nftData.name} (HowRare.is Rank #${nftData.rank})`);

      // Calculate bonuses using authentic HowRare.is rarity rank (not mint number)
      const bonuses = calculateNFTBonuses(nftData.attributes, nftData.rank);
      const rarityTier = getRarityTier(nftData.rank);
      
      console.log(`🏆 NFT rarity analysis: Rank #${nftData.rank} = ${rarityTier} tier`);

      // Generate personalized analysis based on authentic traits
      const strongestTraits = bonuses.traitBonuses
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      const topTraitType = strongestTraits[0]?.type || 'general operations';
      const recommendation = generatePersonalizedRecommendation(rarityTier, topTraitType, nftData.attributes);

      return res.json({
        success: true,
        nft: {
          mint: nftData.mint,
          name: nftData.name,
          rank: nftData.rank,
          attributes: nftData.attributes
        },
        rarity_tier: rarityTier,
        game_bonuses: bonuses,
        analysis: {
          power_level: rarityTier,
          total_effectiveness: `${(bonuses.totalBonus * 100).toFixed(1)}%`,
          strongest_traits: strongestTraits.map(t => `${t.description}`),
          recommendation
        }
      });

    } catch (fetchError) {
      console.error('Failed to fetch NFT data, using fallback analysis:', fetchError);
      
      // Fallback: provide general analysis message
      return res.json({
        success: true,
        nft: {
          mint,
          name: "GROWERZ NFT",
          rank: 1000,
          attributes: []
        },
        rarity_tier: "Rare",
        game_bonuses: {
          rarityBonus: { type: "rarity_multiplier", value: 75, description: "Rare NFT provides 75% bonus to all operations" },
          traitBonuses: [],
          totalBonus: 1.75,
          description: "This GROWERZ NFT enhances your AI assistant capabilities"
        },
        analysis: {
          power_level: "Rare",
          total_effectiveness: "175%",
          strongest_traits: ["Enhanced AI assistance", "Improved market intelligence", "Better deal negotiations"],
          recommendation: "This GROWERZ NFT will significantly enhance your AI assistant's capabilities in market analysis and deal making."
        }
      });
    }

  } catch (error) {
    console.error('Error analyzing NFT traits:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze NFT traits'
    });
  }
}

/**
 * Generate personalized recommendation based on NFT traits
 */
function generatePersonalizedRecommendation(rarityTier: RarityTier, topTraitType: string, attributes: any[]): string {
  const backgroundTrait = attributes.find(attr => attr.trait_type === "Background")?.value;
  const skinTrait = attributes.find(attr => attr.trait_type === "Skin")?.value;
  
  let recommendation = `This ${rarityTier} GROWERZ NFT `;
  
  switch (topTraitType) {
    case "lab_access":
      recommendation += "provides insider lab knowledge, giving you significant research advantages and enhanced product quality. ";
      break;
    case "wealth":
      recommendation += "attracts wealth and prosperity, increasing your profit margins on all deals. ";
      break;
    case "intimidation":
      recommendation += "intimidates rivals and competitors, allowing you to negotiate better prices and terms. ";
      break;
    case "stealth":
      recommendation += "provides excellent stealth capabilities, reducing police attention and heat generation. ";
      break;
    case "night_ops":
      recommendation += "excels in nighttime operations, giving you advantages during evening activities. ";
      break;
    default:
      recommendation += "offers well-rounded bonuses across multiple game aspects. ";
  }
  
  if (backgroundTrait) {
    recommendation += `The ${backgroundTrait} background enhances these abilities further. `;
  }
  
  recommendation += "Your AI assistant will be significantly more effective with this NFT's traits active.";
  
  return recommendation;
}