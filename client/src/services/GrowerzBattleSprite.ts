/**
 * GrowerzBattleSprite
 * Generates full-body 2D battle sprite art for THC GROWERZ NFTs using Puter txt2img.
 * Sprites are inspired by the full-body GROWERZ character style:
 * — full body portrait, thick black outlines, vibrant cartoon colors, transparent-ish background.
 * All results cached in localStorage for 30 days.
 */

const CACHE_PREFIX = 'growerz_sprite_v2_';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry { url: string; ts: number; }

function cacheKey(id: string) { return CACHE_PREFIX + id; }

function loadCache(id: string): string | null {
  try {
    const raw = localStorage.getItem(cacheKey(id));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) { localStorage.removeItem(cacheKey(id)); return null; }
    return entry.url;
  } catch { return null; }
}

function saveCache(id: string, url: string) {
  try { localStorage.setItem(cacheKey(id), JSON.stringify({ url, ts: Date.now() })); } catch {}
}

/**
 * Build a Puter txt2img prompt that generates a full-body GROWERZ battle sprite.
 * Based on the style of the THC GROWERZ HUB NFT collection:
 *   — full-body cartoon character, thick outlines, vibrant colors, cannabis motifs.
 * 
 * When the user's actual NFT image is available in the app, it is passed as
 * `nftImageDescription` (a text description extracted from the image metadata / traits)
 * so the prompt can reference it directly.
 */
export function buildGrowerzSpritePrompt(traits: {
  name?: string;
  skin?: string;
  clothes?: string;
  head?: string;
  mouth?: string;
  eyes?: string;
  background?: string;
  rank?: number;
}): string {
  const skin       = traits.skin       || 'blue';
  const clothes    = traits.clothes    || 'floral shirt and jeans';
  const head       = traits.head       || 'cannabis plant halo';
  const mouth      = traits.mouth      || 'blunt';
  const eyes       = traits.eyes       || 'white glowing eyes';
  const rank       = traits.rank;
  const rankNote   = rank && rank <= 100 ? 'legendary glowing aura, golden highlights,' : '';

  return (
    `Full body 2D cartoon battle character, THC Growerz NFT art style, ` +
    `${skin} skin tone humanoid cannabis grower fighter, ` +
    `wearing ${clothes}, ${head} on head, ${eyes}, ${mouth}, ` +
    `${rankNote} ` +
    `battle-ready standing pose slight 3/4 angle, ` +
    `thick bold black outlines like comic book art, ` +
    `vibrant saturated neon colors, ` +
    `full body visible from head to toe, white or dark transparent background, ` +
    `Clash Royale card game fighter character sprite style, ` +
    `cannabis leaf motifs marijuana theme, ` +
    `2D flat art, no shadows, centered, no text, no background landscape`
  );
}

/**
 * Prompt for generating a battle sprite based on the user's actual NFT image
 * that is already loaded in the app. We describe the visible character to
 * puter txt2img and ask it to produce a clean full-body battle sprite version.
 *
 * Usage: pass the NFT's name + traits to get an img2img-style textual prompt.
 */
export function buildNFTImageBasedPrompt(nftName: string, traits: {
  skin?: string; clothes?: string; head?: string; mouth?: string; eyes?: string;
}): string {
  const skin    = traits.skin    || 'colorful';
  const clothes = traits.clothes || 'street outfit';
  const head    = traits.head    || 'cannabis accessory';
  const eyes    = traits.eyes    || 'distinctive eyes';

  return (
    `Recreate this THC Growerz NFT character as a full-body 2D battle game sprite: ` +
    `"${nftName}" — ${skin} skin, ${clothes}, ${head}, ${eyes}. ` +
    `Full body from head to toe, cartoon thick black outlines, ` +
    `vibrant colors, battle ready standing pose, ` +
    `clean background, Clash Royale fighter card art style, ` +
    `cannabis marijuana themed, 2D flat cartoon, no text`
  );
}

const pendingQueue = new Map<string, Promise<string>>();
let activeCount = 0;
const MAX_CONCURRENT = 1;
const generationQueue: Array<() => void> = [];

function enqueue(fn: () => void) {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    fn();
  } else {
    generationQueue.push(fn);
  }
}

function dequeue() {
  activeCount--;
  const next = generationQueue.shift();
  if (next) { activeCount++; next(); }
}

async function runPuterGeneration(prompt: string, spriteW: number, spriteH: number): Promise<string> {
  const puter = (window as any).puter;
  if (!puter?.ai?.txt2img) throw new Error('Puter not available');

  const img: HTMLImageElement = await puter.ai.txt2img(prompt, false);

  const canvas = document.createElement('canvas');
  canvas.width = spriteW;
  canvas.height = spriteH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas ctx');

  // Fit-contain draw: scale to fill portrait maintaining aspect ratio
  const iw = img.naturalWidth || spriteW;
  const ih = img.naturalHeight || spriteH;
  const scale = Math.max(spriteW / iw, spriteH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (spriteW - dw) / 2, (spriteH - dh) / 2, dw, dh);

  return canvas.toDataURL('image/png');
}

/**
 * Generate (or load from cache) a full-body battle sprite for a GROWERZ NFT.
 * @param id — Unique identifier (nftMint, nftName, or any stable key)
 * @param traits — NFT traits used to build the prompt
 * @param spriteW — Target canvas width for the sprite (default 128)
 * @param spriteH — Target canvas height for the sprite (default 220)
 */
export async function generateGrowerzSprite(
  id: string,
  traits: {
    name?: string; skin?: string; clothes?: string;
    head?: string; mouth?: string; eyes?: string;
    background?: string; rank?: number;
  },
  spriteW = 128,
  spriteH = 220
): Promise<string> {
  const cached = loadCache(id);
  if (cached) return cached;

  if (pendingQueue.has(id)) return pendingQueue.get(id)!;

  const promise = new Promise<string>((resolve, reject) => {
    enqueue(async () => {
      try {
        const prompt = buildGrowerzSpritePrompt(traits);
        console.debug(`[GrowerzSprite] Generating sprite for ${traits.name || id}...`);
        const url = await runPuterGeneration(prompt, spriteW, spriteH);
        saveCache(id, url);
        pendingQueue.delete(id);
        dequeue();
        resolve(url);
      } catch (err) {
        pendingQueue.delete(id);
        dequeue();
        reject(err);
      }
    });
  });

  pendingQueue.set(id, promise);
  return promise;
}

/**
 * Batch-generate sprites for a list of GROWERZ units. Non-blocking — fires and forgets.
 * Returns a map of id → promise so callers can await specific ones.
 */
export function batchGenerateSprites(
  units: Array<{
    id: string; name?: string; skin?: string; clothes?: string;
    head?: string; mouth?: string; eyes?: string; background?: string; rank?: number;
  }>,
  spriteW = 128,
  spriteH = 220
): Map<string, Promise<string>> {
  const results = new Map<string, Promise<string>>();
  units.forEach((unit, i) => {
    if (loadCache(unit.id)) {
      results.set(unit.id, Promise.resolve(loadCache(unit.id)!));
      return;
    }
    setTimeout(() => {
      const p = generateGrowerzSprite(unit.id, unit, spriteW, spriteH).catch(() => '');
      results.set(unit.id, p);
    }, i * 3500);
  });
  return results;
}

export function getCachedSprite(id: string): string | null {
  return loadCache(id);
}

export function clearSpriteCache() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
  });
}
