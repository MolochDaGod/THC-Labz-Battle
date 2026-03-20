/**
 * GROWERZ Unit System
 * Converts owned THC GROWERZ NFTs into deployable battle unit cards.
 * Stats are deterministically derived from each NFT's authentic traits.
 */

export interface GrowerzUnitCard {
  id: string;
  name: string;
  image: string;
  attack: number;
  health: number;
  cost: number;
  rarity: string;
  type: string;
  class: string;
  abilities: string[];
  description: string;
  attackType: 'melee' | 'ranged' | 'magical';
  range: number;
  speed: number;
  isGrowerzUnit: true;
  nftMint: string;
  nftRank: number;
  nftNumber: number;
  bgTrait: string;
  traits: {
    background: string;
    skin: string;
    clothes: string;
    head: string;
    mouth: string;
    eyes: string;
  };
}

// ──────────────────────────────────────────────
//  Rarity tier by HowRare rank
// ──────────────────────────────────────────────
export function getGrowerzRarityTier(rank: number): 'Mythic' | 'Epic' | 'Rare' | 'Uncommon' | 'Common' {
  if (rank <= 71) return 'Mythic';
  if (rank <= 361) return 'Epic';
  if (rank <= 843) return 'Rare';
  if (rank <= 1446) return 'Uncommon';
  return 'Common';
}

// Rarity → base elixir cost
function rarityToCost(tier: string): number {
  const map: Record<string, number> = { Mythic: 8, Epic: 7, Rare: 6, Uncommon: 5, Common: 4 };
  return map[tier] ?? 5;
}

// Rarity → stat multiplier
function rarityMultiplier(tier: string): number {
  const map: Record<string, number> = { Mythic: 2.2, Epic: 1.8, Rare: 1.5, Uncommon: 1.25, Common: 1.0 };
  return map[tier] ?? 1.0;
}

// ──────────────────────────────────────────────
//  Skin → base health
// ──────────────────────────────────────────────
function skinToHealth(skin: string): number {
  const map: Record<string, number> = {
    'Solana': 1500,
    'Skull': 1400,
    'Gold Drip': 1300,
    'Sticky Icky': 1250,
    'Tatted-up': 1150,
    'Psychedelic': 1000,
    'Ecto': 850,
    'Brown': 1000,
    'Fair': 950,
  };
  return map[skin] ?? 1000;
}

// ──────────────────────────────────────────────
//  Clothes → base attack damage
// ──────────────────────────────────────────────
function clothesToAttack(clothes: string): number {
  const high = ['Yaba-dab-a-doo', 'Chong Outfit', 'Cheech Outfit', 'Thc Suit', 'Supreme Grower'];
  const med  = ['Mink Coat', 'Iced-out Bling', 'Leather Fur-jacket', 'Spiked Jacket', 'Tactical Vest', 'Mech Jacket'];
  if (high.includes(clothes)) return 270;
  if (med.includes(clothes)) return 220;
  return 180;
}

// ──────────────────────────────────────────────
//  Head → attack type, range, special ability
// ──────────────────────────────────────────────
function headToAbilities(head: string): {
  attackType: 'melee' | 'ranged' | 'magical';
  range: number;
  ability: string;
  abilityDesc: string;
} {
  const map: Record<string, { attackType: 'melee' | 'ranged' | 'magical'; range: number; ability: string; abilityDesc: string }> = {
    'Crown':              { attackType: 'magical', range: 200, ability: 'Royal Decree',    abilityDesc: 'Boosts all nearby allies +15% ATK for 5s' },
    'Fire Horns':         { attackType: 'magical', range: 180, ability: 'Inferno',          abilityDesc: 'Burns targets dealing 20 dmg/sec for 3s' },
    'Wizard Hat':         { attackType: 'magical', range: 220, ability: 'Arcane Blast',     abilityDesc: 'Fires arcane bolt that pierces through enemies' },
    'Pot-head':           { attackType: 'ranged',  range: 160, ability: 'Cannabis Healing', abilityDesc: 'Heals nearby units for 50 HP every 2s' },
    'Uncle Sam\'s Hat':   { attackType: 'ranged',  range: 200, ability: 'Patriot Strike',   abilityDesc: 'Patriotic aura grants +20% attack speed' },
    'Samurai Manbun':     { attackType: 'melee',   range: 80,  ability: 'Bushido',          abilityDesc: 'First strike ignores 30% of target defence' },
    'Rasta Hat':          { attackType: 'ranged',  range: 170, ability: 'Irie Vibes',       abilityDesc: 'Slows enemy movement by 20% in radius' },
    'Tupac Bandana':      { attackType: 'ranged',  range: 160, ability: 'West Side',        abilityDesc: 'Called shots deal +30% damage' },
    'Heisenberg Hat':     { attackType: 'magical', range: 190, ability: 'Blue Sky',         abilityDesc: 'Lowers enemy tower range by 15%' },
  };
  return map[head] ?? { attackType: 'melee', range: 100, ability: 'Heavy Strike', abilityDesc: 'Powerful melee attack' };
}

// ──────────────────────────────────────────────
//  Mouth → additional attack modifier
// ──────────────────────────────────────────────
function mouthToAtkBonus(mouth: string): number {
  const high = ['Dab Rig', 'Cross Joint', 'Shroom Bite', 'Rainbow Puke'];
  const med  = ['Blunt', 'Joint', 'Gold Grillz', 'Canna-beard'];
  if (high.includes(mouth)) return 40;
  if (med.includes(mouth)) return 20;
  return 0;
}

// ──────────────────────────────────────────────
//  Eyes → elixir cost adjustment and bonus desc
// ──────────────────────────────────────────────
function eyesToCostAdjust(eyes: string): { costDelta: number; bonus: string } {
  const map: Record<string, { costDelta: number; bonus: string }> = {
    'White Glow':       { costDelta: -1, bonus: 'Costs 1 less elixir' },
    'Money Eye':        { costDelta: +1, bonus: 'Earns +2 elixir on each kill' },
    'Vigilante Mask':   { costDelta: 0,  bonus: '+30 extra range' },
    'Stoned':           { costDelta: -1, bonus: 'Costs 1 less elixir' },
    'Retro Shades':     { costDelta: 0,  bonus: '+10% attack speed' },
    'Bruised':          { costDelta: 0,  bonus: '+15% damage when below 50% HP' },
    'Led Shades':       { costDelta: 0,  bonus: '+25 illumination range' },
  };
  return map[eyes] ?? { costDelta: 0, bonus: '' };
}

// ──────────────────────────────────────────────
//  Background → speed bonus
// ──────────────────────────────────────────────
function backgroundToSpeed(bg: string): number {
  const fast = ['Starz And Stripez', 'Thc Labz', 'Gold'];
  const slow = ['Dark Gray', 'Beige'];
  if (fast.includes(bg)) return 70;
  if (slow.includes(bg)) return 45;
  return 55;
}

// ──────────────────────────────────────────────
//  Resolve IPFS / Arweave protocol URIs → proxy
// ──────────────────────────────────────────────
function resolveImageUri(uri: string | undefined | null): string {
  if (!uri) return '';
  let resolved = uri;
  if (uri.startsWith('ipfs://')) resolved = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  else if (uri.startsWith('ar://')) resolved = uri.replace('ar://', 'https://arweave.net/');
  // Route all external images through server proxy to avoid CORS / redirect issues
  if (resolved.startsWith('http')) {
    return `/api/image-proxy?url=${encodeURIComponent(resolved)}`;
  }
  return resolved;
}

// ──────────────────────────────────────────────
//  Main converter
// ──────────────────────────────────────────────
export function nftToGrowerzUnitCard(nft: any): GrowerzUnitCard {
  // Extract traits from NFT attributes array or direct object
  const attrs: Record<string, string> = {};
  if (Array.isArray(nft.attributes)) {
    nft.attributes.forEach((a: any) => {
      const key = (a.trait_type || '').toLowerCase();
      attrs[key] = a.value || '';
    });
  }
  // Also support direct trait objects
  const traits = {
    background: attrs['background'] || nft.background || 'Green',
    skin:       attrs['skin']       || nft.skin       || 'Brown',
    clothes:    attrs['clothes']    || nft.clothes     || 'Street Jacket',
    head:       attrs['head']       || nft.head        || 'Bald',
    mouth:      attrs['mouth']      || nft.mouth       || 'Blunt',
    eyes:       attrs['eyes']       || nft.eyes        || 'Stoned',
  };

  // NFT number / rank
  const rankMatch = (nft.name || '').match(/#(\d+)/);
  const nftNumber = rankMatch ? parseInt(rankMatch[1]) : 0;
  const rank = nft.rank || nft.howRareRank || nftNumber || 999;

  const tier = getGrowerzRarityTier(rank);
  const mult = rarityMultiplier(tier);

  // Base stats from traits
  const baseHealth  = Math.round(skinToHealth(traits.skin) * mult);
  const baseAttack  = Math.round((clothesToAttack(traits.clothes) + mouthToAtkBonus(traits.mouth)) * mult);
  const headData    = headToAbilities(traits.head);
  const eyeData     = eyesToCostAdjust(traits.eyes);
  const speed       = backgroundToSpeed(traits.background);

  let cost = rarityToCost(tier) + eyeData.costDelta;
  if (headData.attackType === 'magical') cost = Math.min(cost + 1, 9);
  cost = Math.max(3, Math.min(cost, 9));

  // Range boost from Vigilante Mask
  const range = traits.eyes === 'Vigilante Mask' ? headData.range + 30 : headData.range;

  // Build abilities list
  const abilities: string[] = [headData.ability];
  if (eyeData.bonus) abilities.push(eyeData.bonus);

  const description =
    `${tier} GROWERZ #${nftNumber} • ${headData.abilityDesc}` +
    (eyeData.bonus ? ` • ${eyeData.bonus}` : '');

  // Use real NFT name if it doesn't contain a recognisable #number pattern
  const displayName = nftNumber > 0 ? `GROWERZ #${nftNumber}` : (nft.name || `GROWERZ ${nft.mint?.slice(0, 6) || 'NFT'}`);

  return {
    id: `growerz-${nft.mint || nftNumber}-${nftNumber}`,
    name: displayName,
    image: resolveImageUri(nft.image || nft.imageUri || nft.uri),
    attack:  Math.max(80, baseAttack),
    health:  Math.max(300, baseHealth),
    cost,
    rarity:  tier.toLowerCase(),
    type:    'unit',
    class:   headData.attackType === 'magical' ? 'mage' : headData.attackType === 'ranged' ? 'archer' : 'warrior',
    abilities,
    description,
    attackType: headData.attackType,
    range,
    speed,
    isGrowerzUnit: true,
    nftMint:   nft.mint || '',
    nftRank:   rank,
    nftNumber,
    bgTrait:   traits.background,
    traits,
  };
}

// ──────────────────────────────────────────────
//  Batch convert wallet NFTs
// ──────────────────────────────────────────────
export function convertNFTsToUnitCards(nfts: any[]): GrowerzUnitCard[] {
  return nfts
    .filter(nft => nft)
    .map(nftToGrowerzUnitCard);
}

// ──────────────────────────────────────────────
//  Rarity badge color
// ──────────────────────────────────────────────
export function rarityColor(tier: string): string {
  const map: Record<string, string> = {
    mythic:   '#ff6b6b',
    epic:     '#c084fc',
    rare:     '#60a5fa',
    uncommon: '#4ade80',
    common:   '#9ca3af',
  };
  return map[tier.toLowerCase()] ?? '#9ca3af';
}
