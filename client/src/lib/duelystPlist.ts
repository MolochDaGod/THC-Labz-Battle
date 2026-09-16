/**
 * Same clip parser as duelyst.grudge-studio.com/runtime/DuelystSprite.js
 * Packed sheet + plist rects. Not a guessed L-R walk across the atlas.
 */

export const CLIP_NAMES = [
  'castendsample', 'attackprojectile', 'caststart', 'castloop', 'castend',
  'breathing', 'breathe', 'projectile', 'explode', 'impact', 'attack',
  'idle', 'run', 'walk', 'death2', 'death', 'hit', 'hurt', 'damage',
  'casting', 'cast', 'spawn', 'summon', 'crawl', 'open', 'move', 'movement',
  'die', 'breath',
];

const ALIAS: Record<string, string> = {
  breathe: 'breathing',
  breath: 'breathing',
  hurt: 'hit',
  damage: 'hit',
  die: 'death',
  move: 'run',
  movement: 'run',
  walk: 'run',
  attackprojectile: 'projectile',
  casting: 'cast',
  castendsample: 'castend',
};

export function clipOf(frameName: string) {
  const stem = String(frameName)
    .replace(/\.(png|jpg)$/i, '')
    .toLowerCase()
    .replace(/_\d+$/, '');
  const found = CLIP_NAMES.find((c) => {
    const cL = c.toLowerCase();
    return stem.endsWith('_' + cL) || stem === cL;
  });
  const raw = found ? found.toLowerCase() : (stem.match(/_([a-z][a-z0-9]+)$/) || [])[1] || 'other';
  return ALIAS[raw] || raw;
}

export type PlistFrame = { name: string; x: number; y: number; w: number; h: number; anim: string };

export function parsePlist(xml: string): PlistFrame[] {
  const frames: PlistFrame[] = [];
  const re = /<key>([^<]+\.png)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const name = m[1].trim();
    const inner = m[2];
    const fm = inner.match(/<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/);
    if (!fm) continue;
    frames.push({
      name,
      x: +fm[1],
      y: +fm[2],
      w: +fm[3],
      h: +fm[4],
      anim: clipOf(name),
    });
  }
  frames.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return frames;
}

export function groupAnims(frames: PlistFrame[]) {
  const o: Record<string, PlistFrame[]> = {};
  for (const f of frames) (o[f.anim] ||= []).push(f);
  return o;
}

export type CodexCard = {
  uuid: string;
  sourceKey: string;
  slug: string;
  name: string;
  cost?: number;
  attack?: number;
  health?: number;
  abilityNames?: string[];
  anims?: string[];
};

/** BadBudz catalog row — Magmar reskin face. Not cards.json Magmar originals. */
export type BadBudzRow = {
  id: string;
  duelystId: string;
  name: string;
  cost?: number;
  attack?: number;
  health?: number;
  abilityNames?: string[];
  playStyles?: Array<{ key: string; on: boolean }>;
  keywords?: string[];
  passive?: string;
  flavor?: string;
};

let badBudzPromise: Promise<Map<string, BadBudzRow>> | null = null;

export function loadBadBudzCatalog() {
  if (!badBudzPromise) {
    badBudzPromise = fetch('https://duelyst.grudge-studio.com/catalog/badbudz.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const map = new Map<string, BadBudzRow>();
        for (const c of j?.cards || []) {
          const row: BadBudzRow = {
            id: String(c.id || ''),
            duelystId: String(c.duelystId || c.id || ''),
            name: String(c.name || ''),
            cost: c.cost,
            attack: c.attack,
            health: c.health,
            abilityNames: Array.isArray(c.abilityNames) ? c.abilityNames.map(String) : [],
            playStyles: Array.isArray(c.playStyles) ? c.playStyles : [],
            keywords: Array.isArray(c.keywords) ? c.keywords.map(String) : [],
            passive: c.passive ? String(c.passive) : '',
            flavor: c.flavor ? String(c.flavor) : '',
          };
          if (row.id) map.set(row.id, row);
          if (row.duelystId) map.set(row.duelystId, row);
          map.set(`badbudz:${row.id || row.duelystId}`, row);
        }
        return map;
      })
      .catch(() => new Map());
  }
  return badBudzPromise;
}

let registryPromise: Promise<Map<string, CodexCard>> | null = null;

export function loadCodexRegistry() {
  if (!registryPromise) {
    registryPromise = fetch('https://duelyst.grudge-studio.com/catalog/cards.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const map = new Map<string, CodexCard>();
        for (const c of j?.cards || []) {
          const row: CodexCard = {
            uuid: String(c.uuid || ''),
            sourceKey: String(c.sourceKey || ''),
            slug: String(c.slug || ''),
            name: String(c.name || ''),
            cost: c.cost,
            attack: c.attack,
            health: c.health,
            abilityNames: c.abilityNames,
            anims: c.anims,
          };
          if (row.sourceKey) map.set(row.sourceKey, row);
          if (row.slug) map.set(row.slug, row);
          if (row.uuid) map.set(row.uuid, row);
        }
        return map;
      })
      .catch(() => new Map());
  }
  return registryPromise;
}

const plistCache = new Map<string, Promise<Record<string, PlistFrame[]>>>();

export function loadPlistAnims(plistUrl: string) {
  let p = plistCache.get(plistUrl);
  if (!p) {
    p = fetch(plistUrl)
      .then((r) => r.text())
      .then((xml) => groupAnims(parsePlist(xml)))
      .catch(() => ({} as Record<string, PlistFrame[]>));
    plistCache.set(plistUrl, p);
  }
  return p;
}

export function loadSheet(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('sheet ' + src));
    im.src = src;
  });
}
