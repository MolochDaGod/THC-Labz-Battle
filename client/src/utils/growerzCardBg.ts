/**
 * Maps a GROWERZ NFT background trait value → card background image path.
 * Falls back to rarity-matched default if trait not found.
 */

const TRAIT_TO_BG: Record<string, string> = {
  'dark gray':        '/card-backgrounds/growerz/dark-gray.png',
  'dark grey':        '/card-backgrounds/growerz/dark-gray.png',
  'gold':             '/card-backgrounds/growerz/gold.png',
  'green':            '/card-backgrounds/growerz/green.png',
  'starz and stripez':'/card-backgrounds/growerz/starz-and-stripez.png',
  'stars and stripes':'/card-backgrounds/growerz/starz-and-stripez.png',
  'thc labz':         '/card-backgrounds/growerz/thc-labz.png',
  'thc labs':         '/card-backgrounds/growerz/thc-labz.png',
  'beige':            '/card-backgrounds/growerz/beige.png',
  'solana':           '/card-backgrounds/growerz/solana.png',
  'sunrise':          '/card-backgrounds/growerz/sunrise.png',
};

const RARITY_FALLBACKS: Record<string, string> = {
  legendary: '/card-backgrounds/growerz/gold.png',
  epic:      '/card-backgrounds/growerz/solana.png',
  rare:      '/card-backgrounds/growerz/green.png',
  uncommon:  '/card-backgrounds/growerz/sunrise.png',
  common:    '/card-backgrounds/growerz/dark-gray.png',
};

export function getGrowerzCardBg(
  bgTrait: string | undefined | null,
  rarity?: string
): string | null {
  if (bgTrait) {
    const key = bgTrait.toLowerCase().trim();
    if (TRAIT_TO_BG[key]) return TRAIT_TO_BG[key];
  }
  if (rarity) {
    return RARITY_FALLBACKS[rarity.toLowerCase()] ?? null;
  }
  return null;
}
