// Complete trait bonus system for all authentic THC GROWERZ traits
export interface TraitBonus {
  trait_type: string;
  value: string;
  bonus_type: string;
  bonus_value: number;
  description: string;
}

export const COMPLETE_TRAIT_BONUSES: Record<string, Record<string, TraitBonus>> = {
  // Background bonuses (12 total)
  Background: {
    "Baby Blue": {
      trait_type: "Background",
      value: "Baby Blue",
      bonus_type: "innocence",
      bonus_value: 5,
      description: "Baby Blue background gives +5% innocence bonus. Police are less suspicious, searches are lighter, and first-time buyer trust increases."
    },
    "Beige": {
      trait_type: "Background", 
      value: "Beige",
      bonus_type: "neutral",
      bonus_value: 3,
      description: "Beige background provides +3% neutral reputation. Blends in anywhere, no city penalties, works well in all neighborhoods."
    },
    "Blue": {
      trait_type: "Background",
      value: "Blue", 
      bonus_type: "loyalty",
      bonus_value: 4,
      description: "Blue collar background gives +4% customer loyalty. Better prices in working-class cities like Detroit, Newark, and Baltimore."
    },
    "Crimson": {
      trait_type: "Background",
      value: "Crimson",
      bonus_type: "danger",
      bonus_value: 8,
      description: "Crimson background adds +8% danger attraction. Higher risk operations pay more, but heat builds faster."
    },
    "Dark Gray": {
      trait_type: "Background",
      value: "Dark Gray",
      bonus_type: "stealth",
      bonus_value: 6,
      description: "Dark Gray background provides +6% stealth operations. Better at avoiding detection, reduced police attention."
    },
    "Gold": {
      trait_type: "Background",
      value: "Gold",
      bonus_type: "luxury",
      bonus_value: 3,
      description: "Gold background gives +3% luxury market access. Premium customers, high-end products, wealthy district bonuses."
    },
    "Green": {
      trait_type: "Background",
      value: "Green",
      bonus_type: "natural",
      bonus_value: 7,
      description: "Green background adds +7% natural product bonuses. Organic strains cost less, environmental trust increases."
    },
    "Mint": {
      trait_type: "Background",
      value: "Mint",
      bonus_type: "fresh",
      bonus_value: 5,
      description: "Mint background provides +5% freshness reputation. Products stay potent longer, quality perception increases."
    },
    "Starz And Stripez": {
      trait_type: "Background",
      value: "Starz And Stripez",
      bonus_type: "patriotic",
      bonus_value: 7,
      description: "Patriotic background gives +7% American market bonus. Better prices in conservative areas, veteran customer trust."
    },
    "Thc Labz": {
      trait_type: "Background",
      value: "Thc Labz",
      bonus_type: "tech",
      bonus_value: 4,
      description: "THC LABZ background adds +4% tech advancement. Advanced growing methods, crypto payments, modern distribution."
    },
    "Violet": {
      trait_type: "Background",
      value: "Violet",
      bonus_type: "mystical",
      bonus_value: 5,
      description: "Violet background provides +5% mystical appeal. Psychedelic customers, spiritual markets, festival connections."
    },
    "Yellow": {
      trait_type: "Background",
      value: "Yellow",
      bonus_type: "energy",
      bonus_value: 6,
      description: "Yellow background gives +6% energy market access. Party supplies, stimulant customers, nightlife connections."
    }
  },

  // Skin bonuses (9 total)
  Skin: {
    "Brown": {
      trait_type: "Skin",
      value: "Brown",
      bonus_type: "community",
      bonus_value: 5,
      description: "Brown skin provides +5% community trust. Better connections in diverse neighborhoods, cultural street credibility."
    },
    "Ecto": {
      trait_type: "Skin",
      value: "Ecto",
      bonus_type: "ghostly",
      bonus_value: 9,
      description: "Ecto skin gives +9% supernatural intimidation. Rivals fear confrontation, police hesitate during encounters."
    },
    "Fair": {
      trait_type: "Skin", 
      value: "Fair",
      bonus_type: "privilege",
      bonus_value: 4,
      description: "Fair skin adds +4% privilege bonus. Less police harassment, better treatment in upscale areas."
    },
    "Gold Drip": {
      trait_type: "Skin",
      value: "Gold Drip",
      bonus_type: "wealth",
      bonus_value: 4,
      description: "Gold Drip skin provides +4% wealth display. Attracts high-paying customers, luxury market access."
    },
    "Psychedelic": {
      trait_type: "Skin",
      value: "Psychedelic",
      bonus_type: "trippy",
      bonus_value: 4,
      description: "Psychedelic skin gives +4% psychedelic market bonus. Festival connections, enhanced product prices for hallucinogens."
    },
    "Skull": {
      trait_type: "Skin",
      value: "Skull",
      bonus_type: "intimidation",
      bonus_value: 4,
      description: "Skull skin adds +4% intimidation factor. Reduced robbery chance, rivals back down from territory disputes."
    },
    "Solana": {
      trait_type: "Skin",
      value: "Solana",
      bonus_type: "crypto",
      bonus_value: 3,
      description: "Solana skin provides +3% crypto market access. Blockchain payments, tech-savvy customers, digital distribution."
    },
    "Sticky Icky": {
      trait_type: "Skin",
      value: "Sticky Icky",
      bonus_type: "quality",
      bonus_value: 8,
      description: "Sticky Icky skin gives +8% product quality reputation. Premium pricing, connoisseur customers."
    },
    "Tatted-up": {
      trait_type: "Skin",
      value: "Tatted-up",
      bonus_type: "street",
      bonus_value: 4,
      description: "Tatted-up skin adds +4% street credibility. Gang connections, underground market access, respect from dealers."
    }
  },

  // Clothes bonuses (23 total)
  Clothes: {
    "Artist Jacket": {
      trait_type: "Clothes",
      value: "Artist Jacket",
      bonus_type: "creative",
      bonus_value: 7,
      description: "Artist Jacket provides +7% creative market access. Art district connections, bohemian customers, gallery events."
    },
    "Baseball Shirt": {
      trait_type: "Clothes",
      value: "Baseball Shirt",
      bonus_type: "casual",
      bonus_value: 4,
      description: "Baseball Shirt gives +4% casual approach. Blends in at sporting events, suburban market access."
    },
    "Basketball Jersey": {
      trait_type: "Clothes",
      value: "Basketball Jersey",
      bonus_type: "athletic",
      bonus_value: 6,
      description: "Basketball Jersey adds +6% athletic market bonus. Gym connections, sports team dealings, player networks."
    },
    "Cheech Outfit": {
      trait_type: "Clothes",
      value: "Cheech Outfit",
      bonus_type: "comedy",
      bonus_value: 8,
      description: "Cheech Outfit provides +8% comedy scene access. Entertainment industry connections, comedian customers."
    },
    "Chong Outfit": {
      trait_type: "Clothes",
      value: "Chong Outfit",
      bonus_type: "chill",
      bonus_value: 7,
      description: "Chong Outfit gives +7% chill vibe bonus. Relaxed negotiations, peaceful conflict resolution."
    },
    "Cozy Sweater": {
      trait_type: "Clothes",
      value: "Cozy Sweater",
      bonus_type: "comfort",
      bonus_value: 5,
      description: "Cozy Sweater adds +5% comfort trust. Home-based operations, family market access, domestic sales."
    },
    "Designer Sweatshirt": {
      trait_type: "Clothes",
      value: "Designer Sweatshirt",
      bonus_type: "fashion",
      bonus_value: 9,
      description: "Designer Sweatshirt provides +9% fashion industry access. Model connections, designer drug markets."
    },
    "Hawaiian Shirt": {
      trait_type: "Clothes",
      value: "Hawaiian Shirt",
      bonus_type: "vacation",
      bonus_value: 5,
      description: "Hawaiian Shirt gives +5% vacation market bonus. Tourist areas, resort connections, beach operations."
    },
    "Honest Farmer": {
      trait_type: "Clothes",
      value: "Honest Farmer",
      bonus_type: "organic",
      bonus_value: 3,
      description: "Honest Farmer outfit adds +3% organic growing bonus. Farm operations, agricultural connections, pure products."
    },
    "Iced-out Bling": {
      trait_type: "Clothes",
      value: "Iced-out Bling",
      bonus_type: "flashy",
      bonus_value: 5,
      description: "Iced-out Bling provides +5% flashy reputation. Attracts wealthy customers, luxury market dominance."
    },
    "Leather Fur-jacket": {
      trait_type: "Clothes",
      value: "Leather Fur-jacket",
      bonus_type: "biker",
      bonus_value: 32,
      description: "Leather Fur-jacket gives +32% biker gang access. Motorcycle club connections, road distribution networks."
    },
    "Mech Jacket": {
      trait_type: "Clothes",
      value: "Mech Jacket",
      bonus_type: "tech",
      bonus_value: 8,
      description: "Mech Jacket adds +8% tech industry access. Silicon Valley connections, programmer customers."
    },
    "Mink Coat": {
      trait_type: "Clothes",
      value: "Mink Coat",
      bonus_type: "luxury",
      bonus_value: 17,
      description: "Mink Coat provides +17% luxury status. Exclusive clientele, high-end venues, premium pricing power."
    },
    "Murica Vest": {
      trait_type: "Clothes",
      value: "Murica Vest",
      bonus_type: "patriotic",
      bonus_value: 7,
      description: "Murica Vest gives +7% patriotic market access. Military connections, veteran customer base."
    },
    "Naked": {
      trait_type: "Clothes",
      value: "Naked",
      bonus_type: "natural",
      bonus_value: 4,
      description: "Naked appearance adds +4% natural authenticity. Raw product appeal, underground scene credibility."
    },
    "Silk Shirt-jacket": {
      trait_type: "Clothes",
      value: "Silk Shirt-jacket",
      bonus_type: "sophisticated",
      bonus_value: 4,
      description: "Silk Shirt-jacket provides +4% sophisticated market access. Business connections, corporate customers."
    },
    "Spiked Jacket": {
      trait_type: "Clothes",
      value: "Spiked Jacket",
      bonus_type: "rebellion",
      bonus_value: 4,
      description: "Spiked Jacket gives +4% rebellion bonus. Punk scene access, illegal product profits, underground networks."
    },
    "Street Jacket": {
      trait_type: "Clothes",
      value: "Street Jacket",
      bonus_type: "urban",
      bonus_value: 7,
      description: "Street Jacket adds +7% urban credibility. City operations, street dealer networks, block connections."
    },
    "Supreme Grower": {
      trait_type: "Clothes",
      value: "Supreme Grower",
      bonus_type: "supreme",
      bonus_value: 4,
      description: "Supreme Grower outfit provides +4% growing expertise. Master cultivation, premium strain development."
    },
    "Tactical Vest": {
      trait_type: "Clothes",
      value: "Tactical Vest",
      bonus_type: "military",
      bonus_value: 3,
      description: "Tactical Vest gives +3% military operation access. Security connections, enforcement protection."
    },
    "Thc Jacket": {
      trait_type: "Clothes",
      value: "Thc Jacket",
      bonus_type: "branded",
      bonus_value: 9,
      description: "THC Jacket adds +9% brand recognition. Official merchandise appeal, cannabis industry connections."
    },
    "Thc Suit": {
      trait_type: "Clothes",
      value: "Thc Suit",
      bonus_type: "business",
      bonus_value: 38,
      description: "THC Suit provides +38% business operation bonus. Corporate cannabis, legal market access, professional dealings."
    },
    "Yaba-dab-a-doo": {
      trait_type: "Clothes",
      value: "Yaba-dab-a-doo",
      bonus_type: "cartoon",
      bonus_value: 26,
      description: "Yaba-dab-a-doo outfit gives +26% cartoon appeal. Family-friendly facade, nostalgic customer connections."
    }
  },

  // Head bonuses (19 total)
  Head: {
    "Anime Hair": {
      trait_type: "Head",
      value: "Anime Hair",
      bonus_type: "otaku",
      bonus_value: 8,
      description: "Anime Hair provides +8% otaku market access. Convention connections, anime community sales."
    },
    "Bald": {
      trait_type: "Head",
      value: "Bald",
      bonus_type: "intimidation",
      bonus_value: 7,
      description: "Bald head gives +7% intimidation factor. Serious business appearance, no-nonsense reputation."
    },
    "Beanies": {
      trait_type: "Head",
      value: "Beanies",
      bonus_type: "credibility",
      bonus_value: 5,
      description: "Beanies add +5% street credibility. Skate culture connections, underground scene access."
    },
    "Buzz Cut": {
      trait_type: "Head",
      value: "Buzz Cut",
      bonus_type: "military",
      bonus_value: 6,
      description: "Buzz Cut provides +6% military connections. Veteran networks, disciplined operation bonuses."
    },
    "Color Halo": {
      trait_type: "Head",
      value: "Color Halo",
      bonus_type: "mystical",
      bonus_value: 3,
      description: "Color Halo gives +3% mystical appeal. Spiritual customers, enlightenment seekers, festival connections."
    },
    "Crown": {
      trait_type: "Head",
      value: "Crown",
      bonus_type: "royalty",
      bonus_value: 5,
      description: "Crown adds +5% royalty status. Supreme authority, territory control, respect from all dealers."
    },
    "Fire Horns": {
      trait_type: "Head",
      value: "Fire Horns",
      bonus_type: "demonic",
      bonus_value: 4,
      description: "Fire Horns provide +4% demonic intimidation. Fear factor, supernatural reputation, occult connections."
    },
    "Heisenberg Hat": {
      trait_type: "Head",
      value: "Heisenberg Hat",
      bonus_type: "chemistry",
      bonus_value: 17,
      description: "Heisenberg Hat gives +17% chemistry expertise. Advanced production, lab operations, pure product synthesis."
    },
    "Pot-head": {
      trait_type: "Head",
      value: "Pot-head",
      bonus_type: "cannabis",
      bonus_value: 4,
      description: "Pot-head adds +4% cannabis culture bonus. Deep marijuana knowledge, strain expertise, connoisseur networks."
    },
    "Raidens Straw Hat": {
      trait_type: "Head",
      value: "Raidens Straw Hat",
      bonus_type: "warrior",
      bonus_value: 32,
      description: "Raidens Straw Hat provides +32% warrior spirit. Combat readiness, territorial defense, conflict resolution."
    },
    "Rasta Hat": {
      trait_type: "Head",
      value: "Rasta Hat",
      bonus_type: "spiritual",
      bonus_value: 9,
      description: "Rasta Hat gives +9% spiritual connection. Rastafarian networks, spiritual customers, natural product appeal."
    },
    "Samurai Manbun": {
      trait_type: "Head",
      value: "Samurai Manbun",
      bonus_type: "honor",
      bonus_value: 8,
      description: "Samurai Manbun adds +8% honor code. Respectful negotiations, code of conduct, loyalty bonuses."
    },
    "Short Dreads": {
      trait_type: "Head",
      value: "Short Dreads",
      bonus_type: "culture",
      bonus_value: 7,
      description: "Short Dreads provide +7% cultural connections. Reggae scene access, Caribbean networks, music industry."
    },
    "Snapback Cap": {
      trait_type: "Head",
      value: "Snapback Cap",
      bonus_type: "youth",
      bonus_value: 5,
      description: "Snapback Cap gives +5% youth market access. College connections, young adult customers, campus operations."
    },
    "Tied Dread": {
      trait_type: "Head",
      value: "Tied Dread",
      bonus_type: "natural",
      bonus_value: 7,
      description: "Tied Dread adds +7% natural lifestyle appeal. Organic customers, earth-conscious buyers, festival circuits."
    },
    "Trapper Hat": {
      trait_type: "Head",
      value: "Trapper Hat",
      bonus_type: "wilderness",
      bonus_value: 6,
      description: "Trapper Hat provides +6% wilderness operations. Rural connections, outdoor growing, remote distribution."
    },
    "Tupac Bandana": {
      trait_type: "Head",
      value: "Tupac Bandana",
      bonus_type: "legend",
      bonus_value: 4,
      description: "Tupac Bandana gives +4% legendary status. Hip-hop connections, music industry access, street legend respect."
    },
    "Uncle Sam's Hat": {
      trait_type: "Head",
      value: "Uncle Sam's Hat",
      bonus_type: "authority",
      bonus_value: 3,
      description: "Uncle Sam's Hat adds +3% authority presence. Government connections, official appearance, legal protection."
    },
    "Wizard Hat": {
      trait_type: "Head",
      value: "Wizard Hat",
      bonus_type: "magic",
      bonus_value: 38,
      description: "Wizard Hat provides +38% magical appeal. Mystical customers, potion-like products, fantasy community access."
    }
  },

  // Mouth bonuses (14 total)
  Mouth: {
    "Blunt": {
      trait_type: "Mouth",
      value: "Blunt",
      bonus_type: "smoking",
      bonus_value: 3,
      description: "Blunt gives +3% smoking culture bonus. Rolling expertise, tobacco connections, smoking accessory sales."
    },
    "Canna-beard": {
      trait_type: "Mouth",
      value: "Canna-beard",
      bonus_type: "wisdom",
      bonus_value: 8,
      description: "Canna-beard adds +8% cannabis wisdom. Growing knowledge, strain history, cultivation mentorship."
    },
    "Cheech Stache": {
      trait_type: "Mouth",
      value: "Cheech Stache",
      bonus_type: "comedy",
      bonus_value: 7,
      description: "Cheech Stache provides +7% comedy scene access. Entertainment connections, comedian networks, show business."
    },
    "Cross Joint": {
      trait_type: "Mouth",
      value: "Cross Joint",
      bonus_type: "advanced",
      bonus_value: 4,
      description: "Cross Joint gives +4% advanced smoking bonus. Complex rolling skills, premium smoking experiences, expert level."
    },
    "Dab Rig": {
      trait_type: "Mouth",
      value: "Dab Rig",
      bonus_type: "concentrate",
      bonus_value: 4,
      description: "Dab Rig adds +4% concentrate market access. Extraction expertise, dab culture, high-potency products."
    },
    "Dope Mask": {
      trait_type: "Mouth",
      value: "Dope Mask",
      bonus_type: "stealth",
      bonus_value: 32,
      description: "Dope Mask provides +32% stealth operations. Anonymous dealing, identity protection, covert activities."
    },
    "Full Beard": {
      trait_type: "Mouth",
      value: "Full Beard",
      bonus_type: "authority",
      bonus_value: 7,
      description: "Full Beard gives +7% authority presence. Mature appearance, trustworthy reputation, established dealer status."
    },
    "Gold Grillz": {
      trait_type: "Mouth",
      value: "Gold Grillz",
      bonus_type: "flashy",
      bonus_value: 38,
      description: "Gold Grillz add +38% flashy wealth display. Hip-hop connections, luxury customers, high-value transactions."
    },
    "Grin Wide-smile": {
      trait_type: "Mouth",
      value: "Grin Wide-smile",
      bonus_type: "charisma",
      bonus_value: 9,
      description: "Grin Wide-smile provides +9% charisma bonus. Customer attraction, negotiation skills, friendly reputation."
    },
    "Joint": {
      trait_type: "Mouth",
      value: "Joint",
      bonus_type: "classic",
      bonus_value: 8,
      description: "Joint gives +8% classic cannabis bonus. Traditional smoking culture, joint rolling expertise, classic appeal."
    },
    "Rainbow Puke": {
      trait_type: "Mouth",
      value: "Rainbow Puke",
      bonus_type: "psychedelic",
      bonus_value: 4,
      description: "Rainbow Puke adds +4% psychedelic experience. Hallucinogen connections, trippy product appeal, festival circuits."
    },
    "Rainbow Teeth": {
      trait_type: "Mouth",
      value: "Rainbow Teeth",
      bonus_type: "colorful",
      bonus_value: 8,
      description: "Rainbow Teeth provide +8% colorful personality. Unique appeal, artistic customers, creative scene access."
    },
    "Shroom Bite": {
      trait_type: "Mouth",
      value: "Shroom Bite",
      bonus_type: "mushroom",
      bonus_value: 42,
      description: "Shroom Bite gives +42% mushroom market access. Psychedelic mushrooms, microdosing culture, therapeutic connections."
    },
    "Tongue Out": {
      trait_type: "Mouth",
      value: "Tongue Out",
      bonus_type: "tension",
      bonus_value: 5,
      description: "Tongue Out adds +5% tension reduction. Playful approach, stress relief, casual customer interactions."
    }
  },

  // Eyes bonuses (12 total)  
  Eyes: {
    "Aviator": {
      trait_type: "Eyes",
      value: "Aviator",
      bonus_type: "pilot",
      bonus_value: 9,
      description: "Aviator glasses give +9% aviation connections. Pilot networks, transport operations, sky-high deals."
    },
    "Bruised": {
      trait_type: "Eyes",
      value: "Bruised",
      bonus_type: "tough",
      bonus_value: 8,
      description: "Bruised eyes add +8% toughness reputation. Combat experience, street fighting credibility, intimidation factor."
    },
    "Leaf Party Shades": {
      trait_type: "Eyes",
      value: "Leaf Party Shades",
      bonus_type: "party",
      bonus_value: 3,
      description: "Leaf Party Shades provide +3% party scene access. Rave connections, festival networks, party supply dealing."
    },
    "Led Shades": {
      trait_type: "Eyes",
      value: "Led Shades",
      bonus_type: "tech",
      bonus_value: 32,
      description: "LED Shades give +32% tech innovation bonus. Electronic music scene, tech parties, digital culture connections."
    },
    "Money Eye": {
      trait_type: "Eyes",
      value: "Money Eye",
      bonus_type: "wealth",
      bonus_value: 4,
      description: "Money Eye adds +4% wealth focus. Financial optimization, profit maximization, investment opportunities."
    },
    "Retro Shades": {
      trait_type: "Eyes",
      value: "Retro Shades",
      bonus_type: "vintage",
      bonus_value: 7,
      description: "Retro Shades provide +7% vintage appeal. Classic customers, nostalgic markets, throwback culture."
    },
    "Shocked": {
      trait_type: "Eyes",
      value: "Shocked",
      bonus_type: "surprise",
      bonus_value: 6,
      description: "Shocked eyes give +6% surprise advantage. Unexpected opportunities, reaction speed, adaptation bonuses."
    },
    "Stoned": {
      trait_type: "Eyes",
      value: "Stoned",
      bonus_type: "relaxed",
      bonus_value: 7,
      description: "Stoned eyes add +7% relaxed vibes. Chill customers, stress-free dealing, peaceful negotiations."
    },
    "Thug Life Shades": {
      trait_type: "Eyes",
      value: "Thug Life Shades",
      bonus_type: "gangster",
      bonus_value: 4,
      description: "Thug Life Shades provide +4% gangster credibility. Gang connections, criminal networks, underground respect."
    },
    "Tinted Shades": {
      trait_type: "Eyes",
      value: "Tinted Shades",
      bonus_type: "mysterious",
      bonus_value: 26,
      description: "Tinted Shades give +26% mysterious appeal. Anonymous dealings, secretive operations, covert connections."
    },
    "Vigilante Mask": {
      trait_type: "Eyes",
      value: "Vigilante Mask",
      bonus_type: "justice",
      bonus_value: 4,
      description: "Vigilante Mask adds +4% justice operations. Anti-establishment appeal, rebel networks, righteous dealing."
    },
    "White Glow": {
      trait_type: "Eyes",
      value: "White Glow",
      bonus_type: "enlightened",
      bonus_value: 38,
      description: "White Glow provides +38% enlightened status. Spiritual connections, higher consciousness appeal, mystical networks."
    }
  }
};

export function getTraitBonus(traitType: string, traitValue: string): TraitBonus | null {
  const category = COMPLETE_TRAIT_BONUSES[traitType];
  if (!category) return null;
  
  return category[traitValue] || null;
}

export function calculateAllTraitBonuses(attributes: Array<{trait_type: string, value: string}>): TraitBonus[] {
  const bonuses: TraitBonus[] = [];
  
  for (const attr of attributes) {
    const bonus = getTraitBonus(attr.trait_type, attr.value);
    if (bonus) {
      bonuses.push(bonus);
    }
  }
  
  return bonuses;
}