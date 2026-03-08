const CACHE_PREFIX = 'thc_pack_art_v1_';
const VIDEO_CACHE_PREFIX = 'thc_pack_vid_v1_';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

export type PackArtKey = 'common' | 'rare' | 'legendary' | 'opening_video';

const PACK_PROMPTS: Record<PackArtKey, string> = {
  common: 'green glowing booster card pack with cannabis leaf logo, dark background, magical smoke swirling around it, cartoon game art style, vibrant neon green glow, centered composition, dramatic lighting',
  rare: 'purple holographic booster card pack with star burst effect, dark background, mystical purple and violet energy swirling, cosmic particles, cartoon game art style, glowing, centered',
  legendary: 'golden legendary card pack booster box with crown and epic golden aura, dark background, divine golden light rays, fire and sparks, cartoon game art style, cinematic, centered composition',
  opening_video: 'a glowing card pack bursting open with magical light, three cannabis themed trading cards fly out spinning and glowing, dramatic explosion of particles and energy, cinematic game animation style',
};

function loadFromCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { url, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return url;
  } catch { return null; }
}

function saveToCache(key: string, url: string) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ url, ts: Date.now() })); } catch {}
}

function loadVideoFromCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(VIDEO_CACHE_PREFIX + key);
    if (!raw) return null;
    const { url, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(VIDEO_CACHE_PREFIX + key); return null; }
    return url;
  } catch { return null; }
}

function saveVideoToCache(key: string, url: string) {
  try { localStorage.setItem(VIDEO_CACHE_PREFIX + key, JSON.stringify({ url, ts: Date.now() })); } catch {}
}

async function imgToDataUrl(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 560;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('no ctx')); return; }
    const draw = () => { ctx.drawImage(img, 0, 0, 400, 560); resolve(canvas.toDataURL('image/jpeg', 0.85)); };
    if (img.complete && img.naturalWidth > 0) draw();
    else { img.onload = draw; img.onerror = reject; }
  });
}

const pending = new Map<string, Promise<string | null>>();

export function getCachedPackArt(key: PackArtKey): string | null {
  return loadFromCache(key);
}

export function getCachedPackVideo(): string | null {
  return loadVideoFromCache('opening');
}

export async function generatePackArt(key: PackArtKey): Promise<string | null> {
  const cached = loadFromCache(key);
  if (cached) return cached;
  if (pending.has(key)) return pending.get(key)!;

  const promise = (async () => {
    try {
      const puter = (window as any).puter;
      if (!puter?.ai?.txt2img) return null;
      const img: HTMLImageElement = await puter.ai.txt2img(PACK_PROMPTS[key]);
      const url = await imgToDataUrl(img);
      saveToCache(key, url);
      pending.delete(key);
      return url;
    } catch {
      pending.delete(key);
      return null;
    }
  })();

  pending.set(key, promise);
  return promise;
}

export async function generatePackOpeningVideo(): Promise<string | null> {
  const cached = loadVideoFromCache('opening');
  if (cached) return cached;
  if (pending.has('video')) return pending.get('video')!;

  const promise = (async () => {
    try {
      const puter = (window as any).puter;
      if (!puter?.ai?.txt2vid) return null;
      const result = await puter.ai.txt2vid(PACK_PROMPTS.opening_video);
      let url: string | null = null;
      if (result instanceof HTMLVideoElement) {
        url = result.src;
      } else if (typeof result === 'string') {
        url = result;
      } else if (result?.src) {
        url = result.src;
      }
      if (url) { saveVideoToCache('opening', url); }
      pending.delete('video');
      return url;
    } catch {
      pending.delete('video');
      return null;
    }
  })();

  pending.set('video', promise);
  return promise;
}

export function preloadPackArts() {
  (['common', 'rare', 'legendary'] as PackArtKey[]).forEach(key => {
    if (!getCachedPackArt(key)) {
      setTimeout(() => generatePackArt(key).catch(() => {}), Math.random() * 2000 + 500);
    }
  });
}
