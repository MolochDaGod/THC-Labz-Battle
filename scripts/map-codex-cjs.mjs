/** Plain JS copy of shared/mapCodexPlaySets.ts for the dump script. */
export const TCG_CHROME = 'https://duelyst.grudge-studio.com/tcg-chrome';
export const DUELYST_CDN = 'https://assets.grudge-studio.com/sprites/duelyst';
export const GW_CDN = 'https://assets.grudge-studio.com/sprites/grudawars';

export const PLAY_STYLE_SLOTS = [
  { key: 'melee', label: 'Melee', icon: `${TCG_CHROME}/slots/attack.png`, badge: `${TCG_CHROME}/slots/badge-attack.png` },
  { key: 'ranged', label: 'Range', icon: `${TCG_CHROME}/slots/mana.png`, badge: `${TCG_CHROME}/slots/badge-mana.png` },
  { key: 'splash', label: 'Splash', icon: `${TCG_CHROME}/slots/ability.png`, badge: `${TCG_CHROME}/slots/badge-ability.png` },
  { key: 'flying', label: 'Air', icon: `${TCG_CHROME}/slots/rarity.png`, badge: `${TCG_CHROME}/slots/badge-rarity.png` },
  { key: 'tank', label: 'Tank', icon: `${TCG_CHROME}/slots/type.png`, badge: `${TCG_CHROME}/slots/badge-type.png` },
  { key: 'charge', label: 'Rush', icon: `${TCG_CHROME}/slots/health.png`, badge: `${TCG_CHROME}/slots/badge-health.png` },
];

const ABILITY_FAMILY = { melee: 'demon', tank: 'demon', charge: 'demon', magical: 'fairy', splash: 'fairy', ranged: 'undead', flying: 'undead' };

function hash32(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function abilityIconFor(name, index, cls) {
  const family = ABILITY_FAMILY[cls] || 'demon';
  const n = (Math.abs(hash32(name) + index) % 12) + 1;
  return `${TCG_CHROME}/objects/${family}/Icon${n}.png`;
}

function asRarity(v) {
  const r = String(v || 'common').toLowerCase();
  if (['mythic', 'glitch', 'legendary', 'epic', 'rare', 'uncommon', 'common'].includes(r)) return r;
  return 'common';
}

function classFromStyles(playStyles, keywords, fallback) {
  const on = new Set((playStyles || []).filter((p) => p.on).map((p) => p.key));
  const keys = new Set([...on, ...keywords.map((k) => String(k).toLowerCase())]);
  if (keys.has('tank')) return 'tank';
  if (keys.has('ranged') || keys.has('range')) return 'ranged';
  if (keys.has('melee')) return 'melee';
  if (keys.has('spell') || keys.has('magical') || keys.has('splash')) return 'magical';
  return fallback;
}

function typeFromKind(kind, role) {
  const k = `${kind} ${role}`.toLowerCase();
  if (k.includes('structure') || k.includes('tower') || k.includes('obelysk')) return 'tower';
  if (k.includes('spell') && !k.includes('troop')) return 'spell';
  return 'minion';
}

export function mapBadBudzCard(raw) {
  const duelystId = String(raw.duelystId || raw.id || '');
  const playStyles = Array.isArray(raw.playStyles) ? raw.playStyles : [];
  const keywords = Array.isArray(raw.keywords) ? raw.keywords.map(String) : [];
  const abilities = Array.isArray(raw.abilityNames) && raw.abilityNames.length
    ? raw.abilityNames.map(String)
    : keywords.filter(Boolean);
  const cls = classFromStyles(playStyles, keywords, 'melee');
  const rarity = asRarity(raw.rarity);
  const chrome = raw.chrome || {};
  return {
    id: `badbudz:${duelystId}`,
    name: String(raw.name || duelystId),
    image: `${DUELYST_CDN}/units/${duelystId}.png`,
    cost: Number(raw.cost ?? 3),
    attack: Number(raw.attack ?? 3),
    health: Number(raw.health ?? 4),
    description: String(raw.passive || raw.flavor || raw.strainBlurb || ''),
    rarity,
    class: cls,
    type: typeFromKind(String(raw.kind || 'troop'), String(raw.role || '')),
    abilities,
    abilityDesc: [raw.passive, raw.flavor].filter(Boolean).join(' '),
    traitRequirements: [],
    isNFTConnected: String(raw.role || '') === 'seed' || String(raw.kind || '') === 'seed',
    cardSet: 'badbudz',
    playStyles,
    keywords,
    duelystId,
    sheet: `${DUELYST_CDN}/units/${duelystId}.png`,
    plist: `${DUELYST_CDN}/plists/${duelystId}.plist`,
    artKind: 'duelyst-plist',
    chromeBg: chrome.bg ? `${TCG_CHROME}/${chrome.bg}` : `${TCG_CHROME}/thc/bg-${rarity}.png`,
    chromeBuds: chrome.buds ? `${TCG_CHROME}/${chrome.buds}` : undefined,
    statScale: 'duelyst',
    abilityIcons: abilities.map((n, i) => abilityIconFor(n, i, cls)),
    range: raw.range,
    speed: raw.speed,
    effect: raw.effect,
  };
}

function gwSlug(id) { return String(id || '').replace(/^gw_/, ''); }
function gwClipUrl(url) {
  const rel = String(url || '');
  if (/^https?:/i.test(rel)) return rel;
  return rel.replace(/^\/gw\//, `${GW_CDN}/`);
}
function gwClass(h) {
  const n = `${h.id} ${h.name} ${Object.keys(h.clips || {}).join(' ')}`.toLowerCase();
  if (/mage|wizard|priest|necro|elemental|witch/.test(n)) return 'magical';
  if (/archer|ranger|crossbow|gun|bolt/.test(n)) return 'ranged';
  if (/knight|tank|armored|golem|ogre|colossus|guardian|templar/.test(n)) return 'tank';
  return 'melee';
}
function gwRarity(h) {
  const n = `${h.id} ${h.name}`.toLowerCase();
  if (/boss|cthulu|dragon/.test(n)) return 'legendary';
  if (/elite|templar|king|captain|myth/.test(n)) return 'epic';
  if (/armored|dark|fire|frost|crystal|shadow/.test(n)) return 'rare';
  return 'uncommon';
}
function gwStats(rarity, cls) {
  const table = {
    common: { cost: 2, attack: 2, health: 3 },
    uncommon: { cost: 3, attack: 3, health: 4 },
    rare: { cost: 3, attack: 4, health: 5 },
    epic: { cost: 4, attack: 4, health: 6 },
    legendary: { cost: 5, attack: 5, health: 10 },
    mythic: { cost: 6, attack: 6, health: 12 },
    glitch: { cost: 6, attack: 6, health: 12 },
  };
  const s = { ...table[rarity] };
  if (cls === 'tank') { s.health += 2; s.attack = Math.max(1, s.attack - 1); }
  if (cls === 'ranged') s.health = Math.max(2, s.health - 1);
  if (cls === 'magical') s.cost += 1;
  return s;
}
function gwAbilities(h, cls) {
  const n = `${h.id} ${h.name} ${Object.keys(h.clips || {}).join(' ')}`.toLowerCase();
  const playStyles = PLAY_STYLE_SLOTS.map((s) => {
    let on = false;
    if (s.key === 'melee') on = cls === 'melee' || cls === 'tank';
    if (s.key === 'ranged') on = cls === 'ranged' || /projectile/.test(n);
    if (s.key === 'splash') on = cls === 'magical' || /mage|wizard|dragon|boss/.test(n);
    if (s.key === 'flying') on = /dragon|vulture|air|fly/.test(n);
    if (s.key === 'tank') on = cls === 'tank';
    if (s.key === 'charge') on = /rush|lancer|rider|barbarian/.test(n);
    return { key: s.key, on };
  });
  const names = playStyles.filter((p) => p.on).map((p) => PLAY_STYLE_SLOTS.find((s) => s.key === p.key).label);
  if (!names.length) names.push('Hand-to-Hand');
  return { names, playStyles };
}

export function mapGrudaWarsHero(h) {
  const slug = gwSlug(h.id);
  const cls = gwClass(h);
  const rarity = gwRarity(h);
  const stats = gwStats(rarity, cls);
  const { names, playStyles } = gwAbilities(h, cls);
  const clips = h.clips || {};
  const idle = gwClipUrl(clips.idle || clips.Idle || `/gw/${slug}/idle.png`);
  const title = String(h.name || slug).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: `grudawars:${slug}`,
    name: title.startsWith('Gw ') ? title.slice(3) : title,
    image: idle,
    cost: stats.cost,
    attack: stats.attack,
    health: stats.health,
    description: `GrudaWars · ${cls} ${rarity}. Codex idle strip.`,
    rarity,
    class: cls,
    type: 'minion',
    abilities: names,
    abilityDesc: names.join(' · '),
    traitRequirements: [],
    isNFTConnected: false,
    cardSet: 'grudawars',
    playStyles,
    keywords: names.map((n) => n.toLowerCase()),
    idleStrip: idle,
    artKind: 'gw-strip',
    statScale: 'duelyst',
    abilityIcons: names.map((n, i) => abilityIconFor(n, i, cls)),
  };
}

export function mapCodexCatalogs(badbudzJson, catalogJson) {
  const bb = Array.isArray(badbudzJson?.cards) ? badbudzJson.cards : Array.isArray(badbudzJson) ? badbudzJson : [];
  const heroes = Array.isArray(catalogJson?.heroes) ? catalogJson.heroes : [];
  const gw = heroes.filter((h) => String(h.id || '').startsWith('gw_') || h.source === 'grudawars-2d');
  const seen = new Set();
  const unique = [];
  for (const h of gw) {
    if (seen.has(h.id)) continue;
    seen.add(h.id);
    unique.push(h);
  }
  return { badbudz: bb.map(mapBadBudzCard), grudawars: unique.map(mapGrudaWarsHero) };
}
