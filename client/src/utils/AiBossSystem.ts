/**
 * AiBossSystem.ts
 * ───────────────
 * Defines the boss card for each map theme in THC Clash.
 * Each boss has:
 *  - Mega stats (balanced for a climactic fight)
 *  - Phase 2 triggered at 50% HP (enrage: +40% damage, +25% speed)
 *  - A special ability tag used by the battle engine
 *  - A unique name and flavour tied to the theme
 */

export interface BossCard {
  id: string;
  name: string;
  image: string;
  attack: number;
  health: number;
  maxHealth: number;
  cost: number;
  rarity: 'legendary';
  type: 'minion';
  class: string;
  abilities: string[];
  speed: number;
  range: number;
  attackCooldown: number;
  themeId: string;
  phaseLabel: string;       // shown in UI when phase 2 triggers
  enrageMultiplier: number; // damage multiplier on entering phase 2
  spawnMessage: string;     // battle-log line when boss spawns
  bossEmoji: string;        // displayed above boss sprite
  isEnraged?: boolean;
  enrageTriggered?: boolean;
}

const BOSS_POOL: Record<string, Omit<BossCard, 'maxHealth' | 'isEnraged' | 'enrageTriggered'>> = {
  cannabis: {
    id: 'boss-ancient-kush',
    name: 'The Ancient Kush Lord',
    image: '/card-art/raclavin-the-dank-king.png',
    attack: 420,
    health: 8000,
    cost: 0,
    rarity: 'legendary',
    type: 'minion',
    class: 'tank',
    abilities: ['aoe', 'heal_on_hit', 'shield', 'nft_powered'],
    speed: 1.4,
    range: 80,
    attackCooldown: 1200,
    themeId: 'cannabis',
    phaseLabel: '🌿 KUSH ENRAGE — The Ancient One awakens!',
    enrageMultiplier: 1.5,
    spawnMessage: '🌿 THE ANCIENT KUSH LORD rises from the grow!',
    bossEmoji: '👑',
  },
  volcano: {
    id: 'boss-magma-titan',
    name: 'Magma Titan Rex',
    image: 'https://i.imgur.com/KiiU4bg.png',
    attack: 480,
    health: 9000,
    cost: 0,
    rarity: 'legendary',
    type: 'minion',
    class: 'tank',
    abilities: ['aoe', 'splash', 'poison_trail'],
    speed: 1.2,
    range: 70,
    attackCooldown: 1400,
    themeId: 'volcano',
    phaseLabel: '🌋 MAGMA FURY — Titan Rex erupts!',
    enrageMultiplier: 1.6,
    spawnMessage: '🌋 MAGMA TITAN REX bursts from the volcano!',
    bossEmoji: '💥',
  },
  arctic: {
    id: 'boss-glacial-warden',
    name: 'Glacial Warden Prime',
    image: 'https://i.imgur.com/LKHfZYk.png',
    attack: 390,
    health: 8500,
    cost: 0,
    rarity: 'legendary',
    type: 'minion',
    class: 'magical',
    abilities: ['aoe', 'stun_chance', 'shield'],
    speed: 1.6,
    range: 120,
    attackCooldown: 1000,
    themeId: 'arctic',
    phaseLabel: '❄️ CRYO RAGE — Glacial Warden freezes all!',
    enrageMultiplier: 1.45,
    spawnMessage: '❄️ THE GLACIAL WARDEN PRIME descends from the frozen peaks!',
    bossEmoji: '🧊',
  },
  nightforest: {
    id: 'boss-void-specter',
    name: 'Void Specter Sovereign',
    image: 'https://i.imgur.com/I4Hf66H.png',
    attack: 450,
    health: 7500,
    cost: 0,
    rarity: 'legendary',
    type: 'minion',
    class: 'magical',
    abilities: ['flying', 'double_hit', 'stun_chance'],
    speed: 2.2,
    range: 100,
    attackCooldown: 900,
    themeId: 'nightforest',
    phaseLabel: '🌙 VOID UNLEASH — Specter Sovereign transcends!',
    enrageMultiplier: 1.55,
    spawnMessage: '🌙 THE VOID SPECTER SOVEREIGN emerges from the darkness!',
    bossEmoji: '👻',
  },
  desert: {
    id: 'boss-sandstorm-colossus',
    name: 'Sandstorm Colossus',
    image: 'https://i.imgur.com/aEEZOAq.png',
    attack: 400,
    health: 9500,
    cost: 0,
    rarity: 'legendary',
    type: 'minion',
    class: 'tank',
    abilities: ['aoe', 'splash', 'shield'],
    speed: 1.3,
    range: 90,
    attackCooldown: 1300,
    themeId: 'desert',
    phaseLabel: '🏜️ DESERT FURY — The Colossus rises!',
    enrageMultiplier: 1.5,
    spawnMessage: '🏜️ THE SANDSTORM COLOSSUS emerges from the dunes!',
    bossEmoji: '🌪️',
  },
  galaxy: {
    id: 'boss-cosmic-overlord',
    name: 'Cosmic Overlord Nexus',
    image: 'https://i.imgur.com/ZrNhsNQ.png',
    attack: 520,
    health: 10000,
    cost: 0,
    rarity: 'legendary',
    type: 'minion',
    class: 'magical',
    abilities: ['flying', 'aoe', 'double_hit', 'shield', 'nft_powered'],
    speed: 1.8,
    range: 140,
    attackCooldown: 850,
    themeId: 'galaxy',
    phaseLabel: '🌌 COSMIC COLLAPSE — Nexus enters singularity!',
    enrageMultiplier: 1.7,
    spawnMessage: '🌌 THE COSMIC OVERLORD NEXUS tears through the space-time barrier!',
    bossEmoji: '⭐',
  },
};

/**
 * Returns the boss card for a given map theme, fully initialised.
 * Call this when spawn conditions are met.
 */
export function getBossForTheme(themeId: string): BossCard {
  const key = themeId in BOSS_POOL ? themeId : 'cannabis';
  const template = BOSS_POOL[key];
  return {
    ...template,
    maxHealth: template.health,
    isEnraged: false,
    enrageTriggered: false,
  };
}

/**
 * Checks if a boss should enter phase 2 and mutates the boss in place.
 * Returns true if enrage just triggered (so caller can show UI).
 */
export function checkBossEnrage(boss: BossCard): boolean {
  if (boss.enrageTriggered) return false;
  if (boss.health <= boss.maxHealth * 0.5) {
    boss.isEnraged = true;
    boss.enrageTriggered = true;
    boss.attack = Math.round(boss.attack * boss.enrageMultiplier);
    boss.speed = Math.min(3.5, boss.speed * 1.25);
    boss.attackCooldown = Math.round(boss.attackCooldown * 0.7);
    return true;
  }
  return false;
}

/**
 * Converts a BossCard into a Unit-compatible object for the battle engine.
 * The lane is forced to 'left' for dramatic center-lane boss entry.
 */
export function bossToUnit(boss: BossCard, canvasWidth: number, canvasHeight: number, isPlayerSide: boolean) {
  // Boss spawns at the top-center (AI side) advancing toward player
  const spawnX = canvasWidth / 2 + (Math.random() - 0.5) * 60;
  const spawnY = isPlayerSide ? canvasHeight - 80 : 80;

  return {
    id: `boss-unit-${boss.id}-${Date.now()}`,
    x: spawnX,
    y: spawnY,
    health: boss.health,
    maxHealth: boss.maxHealth,
    damage: boss.attack,
    speed: boss.speed,
    isPlayer: false,
    cardId: boss.id,
    target: null,
    lastAttack: 0,
    range: boss.range,
    lane: 'left' as const,
    attackType: boss.class.includes('magical') ? 'magical' as const : 'melee' as const,
    cardClass: boss.class,
    cardType: boss.type,
    deployTime: Date.now(),
    attackCooldown: boss.attackCooldown,
    isAttacking: false,
    // Boss-specific metadata
    isBoss: true,
    bossEmoji: boss.bossEmoji,
    bossTheme: boss.themeId,
  };
}
