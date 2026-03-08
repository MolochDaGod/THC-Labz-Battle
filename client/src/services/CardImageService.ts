const CACHE_PREFIX = 'thc_card_art_v1_';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry { url: string; ts: number; }

function cacheKey(cardId: string) { return CACHE_PREFIX + cardId; }

function loadFromCache(cardId: string): string | null {
  try {
    const raw = localStorage.getItem(cacheKey(cardId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_DURATION) { localStorage.removeItem(cacheKey(cardId)); return null; }
    return entry.url;
  } catch { return null; }
}

function saveToCache(cardId: string, url: string) {
  try {
    localStorage.setItem(cacheKey(cardId), JSON.stringify({ url, ts: Date.now() }));
  } catch {}
}

function buildPrompt(card: {
  name: string;
  rarity: string;
  class: string;
  description?: string;
}): string {
  const rarityStyle: Record<string, string> = {
    legendary: 'golden legendary epic glowing aura, ornate, masterpiece quality',
    epic: 'epic purple magical glowing, premium quality',
    rare: 'rare blue shimmering, high quality',
    uncommon: 'uncommon green vibrant',
    common: 'common grey clean',
  };

  const classStyle: Record<string, string> = {
    melee: 'fierce warrior with weapons, ready for battle',
    ranged: 'archer or gunner at a distance, poised to shoot',
    magical: 'mystical mage with glowing spells and arcane energy',
    tank: 'massive armored tank warrior with thick shield and heavy armor',
    spell: 'swirling magical explosion or energy burst',
    tower: 'fortified defense tower structure',
  };

  const rarityStr = rarityStyle[card.rarity.toLowerCase()] || rarityStyle.common;
  const classStr = classStyle[card.class?.toLowerCase() || 'melee'] || classStyle.melee;

  return (
    `THC cannabis themed ${card.name}, ${classStr}, ${rarityStr}, ` +
    `cannabis leaf motifs, marijuana plant elements, psychedelic colors, ` +
    `cartoon game card art style, thick black outline, vibrant colors, ` +
    `square format, centered composition, no text, high contrast`
  );
}

const pending = new Map<string, Promise<string>>();

export async function generateCardImage(card: {
  id: string;
  name: string;
  rarity: string;
  class: string;
  description?: string;
}): Promise<string> {
  const cached = loadFromCache(card.id);
  if (cached) return cached;

  if (pending.has(card.id)) return pending.get(card.id)!;

  const promise = (async () => {
    try {
      const puter = (window as any).puter;
      if (!puter?.ai?.txt2img) throw new Error('puter not available');

      const prompt = buildPrompt(card);
      const img: HTMLImageElement = await puter.ai.txt2img(prompt);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas ctx');
      ctx.drawImage(img, 0, 0, 512, 512);
      const url = canvas.toDataURL('image/png');

      console.debug(`[CardImageService] Generated art for ${card.name}`);
      saveToCache(card.id, url);
      pending.delete(card.id);
      return url;
    } catch (err) {
      pending.delete(card.id);
      throw err;
    }
  })();

  pending.set(card.id, promise);
  return promise;
}

export function getCachedCardImage(cardId: string): string | null {
  return loadFromCache(cardId);
}

export function preloadCardImages(cards: Array<{ id: string; name: string; rarity: string; class: string }>) {
  cards.forEach((card, i) => {
    if (!loadFromCache(card.id)) {
      setTimeout(() => generateCardImage(card).catch(() => {}), i * 2000 + Math.random() * 1000);
    }
  });
}
