// THC CLASH Card Database — Full redesign with unique names, abilities & mechanics
// Card Types: minion, tower, spell | Classes: ranged, melee, magical, tank
// New special types: AOE spells (tokens/seeds/canisters), enhancements/debuffs (jars), buildings (grow houses)

export interface ClassificationCard {
  id: string;
  name: string;
  image: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  class: 'ranged' | 'magical' | 'tank' | 'melee';
  type: 'tower' | 'minion' | 'spell';
  subtype?: 'aoe-spell' | 'enhancement' | 'debuff' | 'building' | 'beast';
  abilities: string[];
  abilityDesc?: string;
  duration?: number;
  aoeRadius?: number;
  traitRequirements: string[];
  isNFTConnected: boolean;
  nftTraitBonus?: { traitType: string; traitValue: string; bonusEffect: string };
  rarityBackground?: string;
}

export const CLASSIFICATION_CARD_DATABASE: ClassificationCard[] = [

  // ═══════════════════════════════════════
  //  COMMON CARDS
  // ═══════════════════════════════════════

  {
    id: 'image-0',
    name: 'Recon Bud Turret',
    image: 'https://i.imgur.com/9MIRkig.png',
    cost: 2, attack: 60, health: 300,
    rarity: 'common', class: 'ranged', type: 'tower',
    description: 'A basic guard turret sprouted from a clipped bud. Fires seed pellets at the nearest enemy without hesitation.',
    abilities: ['Sentinel', 'Rapid Fire'],
    abilityDesc: 'Sentinel: Never loses target lock on moving units. Rapid Fire: Every 5th shot fires in a burst of 3.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-1',
    name: 'Sapling Watch Post',
    image: 'https://i.imgur.com/xYICWlW.png',
    cost: 1, attack: 45, health: 220,
    rarity: 'common', class: 'ranged', type: 'tower',
    description: 'Cheapest defense in the grow. A scraggly sapling perched on a post — still surprisingly accurate when properly motivated.',
    abilities: ['Low Profile', 'Cheap Shot'],
    abilityDesc: 'Low Profile: Enemies ignore this tower until all other towers are destroyed. Cheap Shot: 15% chance to deal double damage per shot.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-11',
    name: 'Bud Tender',
    image: 'https://i.imgur.com/xUULDbU.png',
    cost: 1, attack: 85, health: 120,
    rarity: 'common', class: 'melee', type: 'minion',
    description: 'Your most loyal soldier. A seasoned bud tender armed with a trimming blade, ready to trim more than just fan leaves.',
    abilities: ['Rush', 'Harvest Strike'],
    abilityDesc: 'Rush: Moves 20% faster than all other common minions. Harvest Strike: On kill, restores 30 HP to your base tower.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-38',
    name: 'Rookie Scout',
    image: 'https://i.imgur.com/TNwQ9gN.png',
    cost: 2, attack: 70, health: 110,
    rarity: 'common', class: 'ranged', type: 'minion',
    description: 'First week on the grow and already carrying a sling-shot full of dried seeds. Eager, energetic, and surprisingly dangerous.',
    abilities: ['Recon', 'Volley Shot'],
    abilityDesc: 'Recon: Reveals cloaked units within 2 tiles. Volley Shot: Every 8 seconds fires 3 seeds in a fan arc.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-40',
    name: 'Sprout Soldier',
    image: 'https://i.imgur.com/vQOANIg.png',
    cost: 1, attack: 75, health: 100,
    rarity: 'common', class: 'melee', type: 'minion',
    description: 'Barely germinated but already dangerous. A tiny warrior who punches above its terpene weight in every engagement.',
    abilities: ['Tenacity', 'Underdog'],
    abilityDesc: 'Tenacity: Cannot be stunned or frozen. Underdog: Gains +20 ATK when fighting enemies with 3x or more of its own health.',
    traitRequirements: [], isNFTConnected: false,
  },

  // ═══════════════════════════════════════
  //  UNCOMMON CARDS
  // ═══════════════════════════════════════

  {
    id: 'image-2',
    name: 'Strain Sentry Post',
    image: 'https://i.imgur.com/dHAvPGk.png',
    cost: 2, attack: 80, health: 420,
    rarity: 'uncommon', class: 'ranged', type: 'tower',
    description: 'Upgraded watch post infused with terpene concentrate. Shoots pressurized resin blasts that slow anything they hit.',
    abilities: ['Resin Blast', 'Fortified'],
    abilityDesc: 'Resin Blast: Shots slow targets by 15% for 2 sec. Fortified: Takes 10% less damage from all melee attacks.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-3',
    name: "Grower's Rampart",
    image: 'https://i.imgur.com/PLOIquA.png',
    cost: 3, attack: 95, health: 550,
    rarity: 'uncommon', class: 'ranged', type: 'tower',
    description: 'A fortified grow-room outpost manned by seasoned cultivators. Passively boosts adjacent towers and slowly repairs itself.',
    abilities: ['Tower Aura', 'Reinforced Walls'],
    abilityDesc: 'Tower Aura: Adjacent towers gain +15 ATK. Reinforced Walls: Tower repairs itself for 12 HP per second.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-10',
    name: 'Trimmer Champion',
    image: 'https://i.imgur.com/ue3ujBh.png',
    cost: 2, attack: 110, health: 180,
    rarity: 'uncommon', class: 'melee', type: 'minion',
    description: 'Years of trimming shears have made this warrior brutally efficient. Fast hands, even faster blade work.',
    abilities: ['Precision Cut', 'Dual Wield'],
    abilityDesc: 'Precision Cut: 25% chance to deal critical hit for 2x damage. Dual Wield: Attacks twice per swing cycle.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-12',
    name: 'Terpene Sharpshooter',
    image: 'https://i.imgur.com/9ziSpeK.png',
    cost: 3, attack: 120, health: 160,
    rarity: 'uncommon', class: 'ranged', type: 'minion',
    description: 'Trained in mountain grows, she fires terpene-tipped arrows that leave a lingering sticky damage trail on impact.',
    abilities: ['Terpene Trail', 'Eagle Eye'],
    abilityDesc: 'Terpene Trail: Arrows leave a sticky patch slowing enemies in a 1-tile area for 4 sec. Eagle Eye: +30% attack range.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-29',
    name: 'Kush Crossbow Monk',
    image: 'https://i.imgur.com/PFIADLs.png',
    cost: 3, attack: 115, health: 155,
    rarity: 'uncommon', class: 'ranged', type: 'minion',
    description: 'Devoted to the Kush traditions, this monk fires spiritually-charged bolts that pierce through multiple enemies in a line.',
    abilities: ['Pierce Shot', 'Meditate'],
    abilityDesc: 'Pierce Shot: Bolts pass through up to 3 enemies in a line. Meditate: Heals 20 HP every 5 seconds when not actively attacking.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-31',
    name: 'Hash Hawk',
    image: 'https://i.imgur.com/aWgeCua.png',
    cost: 2, attack: 100, health: 140,
    rarity: 'uncommon', class: 'ranged', type: 'minion',
    description: 'Quick and aerial, the Hash Hawk swoops in to deal precision burst damage before retreating out of retaliation range.',
    abilities: ['Swoop Strike', 'Evasion'],
    abilityDesc: 'Swoop Strike: First attack every engagement deals 2x damage. Evasion: 20% chance to dodge any incoming attack.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-32',
    name: 'Resin Blade Runner',
    image: 'https://i.imgur.com/eQCL0s8.png',
    cost: 2, attack: 130, health: 140,
    rarity: 'uncommon', class: 'melee', type: 'minion',
    description: 'Dipped her blades in live resin before battle. Whatever she cuts sticks around — and so do the effects on their target.',
    abilities: ['Resin Coat', 'Speed Demon'],
    abilityDesc: 'Resin Coat: Every hit applies a Resin stack (max 5) — each stack slows target by 8%. Speed Demon: Fastest melee unit in the entire game.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-33',
    name: 'Cannachemist',
    image: 'https://i.imgur.com/xmCBt7g.png',
    cost: 3, attack: 105, health: 165,
    rarity: 'uncommon', class: 'magical', type: 'minion',
    description: 'Part scientist, part sorcerer. Brews volatile terpene potions that he throws with terrifying accuracy into enemy clusters.',
    abilities: ['Terpene Flask', 'Lab Coat'],
    abilityDesc: 'Terpene Flask: Attack hits in a small 0.5-tile splash radius. Lab Coat: Completely immune to all debuff spells.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-34',
    name: 'Pollen Puncher',
    image: 'https://i.imgur.com/n63nk0d.png',
    cost: 2, attack: 125, health: 160,
    rarity: 'uncommon', class: 'melee', type: 'minion',
    description: 'Hands permanently stained bright yellow — this bruiser coats enemies in pollen that chokes their abilities on contact.',
    abilities: ['Pollen Cloud', 'Heavy Handed'],
    abilityDesc: 'Pollen Cloud: On hit, 30% chance to silence enemy abilities for 3 seconds. Heavy Handed: Knocks back enemies on kill.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-35',
    name: 'Sativa Sniper',
    image: 'https://i.imgur.com/3YzVz0q.png',
    cost: 3, attack: 135, health: 130,
    rarity: 'uncommon', class: 'ranged', type: 'minion',
    description: 'Energized by pure sativa genetics, this sniper has the longest effective range on the field — though his hits are like a featherweight.',
    abilities: ['Ultra Range', 'Head Rush'],
    abilityDesc: 'Ultra Range: +60% attack range — highest in class. Head Rush: Every 10 seconds enters hyperfocus, guaranteeing 3 consecutive critical hits.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-36',
    name: 'Entourage Sage',
    image: 'https://i.imgur.com/5jxAREw.png',
    cost: 2, attack: 90, health: 175,
    rarity: 'uncommon', class: 'magical', type: 'minion',
    description: 'Channels the entourage effect to amplify all nearby allies. Alone she is weak; surrounded she is extraordinary.',
    abilities: ['Entourage Aura', 'Synergy Stack'],
    abilityDesc: 'Entourage Aura: Nearby allied minions gain +12% ATK. Synergy Stack: Effect stacks additively if multiple Sages are deployed simultaneously.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-37',
    name: 'Trim Machine',
    image: 'https://i.imgur.com/ixhyfOr.png',
    cost: 2, attack: 140, health: 120,
    rarity: 'uncommon', class: 'melee', type: 'minion',
    description: 'Pure muscle and machine. This trimming automaton hits anything in its path with merciless speed and zero hesitation.',
    abilities: ['Machine Speed', 'Blade Frenzy'],
    abilityDesc: 'Machine Speed: Attacks 35% faster than standard melee units. Blade Frenzy: At 50% HP, attack speed doubles for 5 seconds.',
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Uncommon Spell ───────────────────
  {
    id: 'image-18',
    name: 'Smoke Screen',
    image: 'https://i.imgur.com/kseCLoO.png',
    cost: 2, attack: 0, health: 0,
    rarity: 'uncommon', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'Release a dense smoke cloud over the battlefield. Enemies caught in the zone become confused and miss 40% of all their attacks.',
    abilities: ['Blind Zone', 'Lingering Smoke'],
    abilityDesc: 'Blind Zone: Enemies in 2-tile radius miss 40% of attacks for 8 seconds. Lingering Smoke: Smoke cloud stays active for 5 additional seconds after cast.',
    aoeRadius: 2, duration: 8,
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Uncommon AOE Attack (Seed) ───────
  {
    id: 'seed-indica',
    name: 'Forbidden Indica Bomb',
    image: '/card-art/seed-indica.png',
    cost: 3, attack: 0, health: 0,
    rarity: 'uncommon', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'Launch a dense indica seed at the target tile. It absorbs atmospheric pressure mid-flight and detonates in a concussive blast that knocks survivors off their feet.',
    abilities: ['Concussive Blast', 'Indica Haze'],
    abilityDesc: 'Concussive Blast: Deals 180 damage to all enemies in 2-tile radius. Indica Haze: All surviving hit targets are slowed by 35% for 4 seconds.',
    aoeRadius: 2,
    traitRequirements: [], isNFTConnected: false,
  },

  // ═══════════════════════════════════════
  //  RARE CARDS
  // ═══════════════════════════════════════

  {
    id: 'image-4',
    name: 'Dank Deadeye',
    image: 'https://i.imgur.com/fSgTMOt.png',
    cost: 4, attack: 180, health: 220,
    rarity: 'rare', class: 'ranged', type: 'minion',
    description: 'A seasoned marksman from the highland grows. Never misses and marks enemies for increased damage from the entire team.',
    abilities: ['Mark Target', 'Headshot'],
    abilityDesc: 'Mark Target: Marked enemies take 20% increased damage from all sources for 6 sec. Headshot: 10% chance to instantly kill any non-legendary enemy.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-5',
    name: 'Kush Ranger',
    image: 'https://i.imgur.com/jNWxvLY.png',
    cost: 4, attack: 165, health: 260,
    rarity: 'rare', class: 'ranged', type: 'minion',
    description: 'A battle-hardened ranger who has patrolled the kush highlands for decades. Fires continuously while moving and ignores terrain penalties.',
    abilities: ['Mobile Assault', 'Terrain Expert'],
    abilityDesc: 'Mobile Assault: Continues to fire while moving at full attack speed. Terrain Expert: Cannot be slowed, rooted, or penalized by any ground effects.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-14',
    name: 'Pheno Hunter',
    image: 'https://i.imgur.com/6ydCCOj.png',
    cost: 3, attack: 155, health: 210,
    rarity: 'rare', class: 'ranged', type: 'minion',
    description: 'Obsessively cataloging unique phenotypes across the grow. Fires specialized rounds tuned to exploit each enemy\'s genetic weakness.',
    abilities: ['Pheno Tag', 'Strain Scan'],
    abilityDesc: 'Pheno Tag: First hit applies a weakness tag — target takes +35% damage from all ranged attacks. Strain Scan: On deploy, reveals stats and active abilities of all visible enemies.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-15',
    name: 'Rosin Rhino',
    image: 'https://i.imgur.com/FlKHvfu.png',
    cost: 4, attack: 145, health: 460,
    rarity: 'rare', class: 'tank', type: 'minion',
    description: 'Armored in solid hardened rosin plates, the Rosin Rhino soaks up incredible punishment — and its hide gets stickier with every hit it absorbs.',
    abilities: ['Rosin Armor', 'Sticky Charge'],
    abilityDesc: 'Rosin Armor: Reduces all incoming damage by 20%. Sticky Charge: When it charges, the first enemy hit is ensnared in rosin for 2.5 seconds.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-16',
    name: 'Budwitch',
    image: 'https://i.imgur.com/lIcPe4r.png',
    cost: 3, attack: 160, health: 190,
    rarity: 'rare', class: 'magical', type: 'minion',
    description: 'A woodland witch who grows dark herbs and brews vicious curses. She hexes enemies into turning on their own allies with horrifying results.',
    abilities: ['Hex Bolt', 'Confusion Curse'],
    abilityDesc: 'Hex Bolt: 20% chance per attack to curse target — cursed units deal 30% of their damage to their own allies for 3 sec. Confusion Curse: Active ability forces one enemy to attack its own allies for 2 sec (10 sec cooldown).',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-20',
    name: 'Clone Sniper',
    image: 'https://i.imgur.com/1YpsT0V.png',
    cost: 4, attack: 200, health: 190,
    rarity: 'rare', class: 'ranged', type: 'minion',
    description: 'Cloned from the most precise genetic lineage known to growers. Fires with precision impossible in nature — every shot lands.',
    abilities: ['Genetic Precision', 'Clone Protocol'],
    abilityDesc: 'Genetic Precision: Every single attack is an automatic critical hit. Clone Protocol: On death, a 50% HP clone spawns and fights for 5 seconds.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-39',
    name: 'Hash Hex Caster',
    image: 'https://i.imgur.com/LX5mDzr.png',
    cost: 4, attack: 170, health: 200,
    rarity: 'rare', class: 'magical', type: 'minion',
    description: 'Inscribes dark hash hexes directly onto enemy units. The hexes slowly burn through all defenses — and then they explode violently on death.',
    abilities: ['Death Hex', 'Chain Burn'],
    abilityDesc: 'Death Hex: Hexed enemies explode on death dealing 100 damage to all adjacent units. Chain Burn: Each tick of burn has 30% chance to spread to a nearby unhexed enemy.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-41',
    name: 'Resin Berserker',
    image: 'https://i.imgur.com/gbf1Lny.png',
    cost: 4, attack: 210, health: 240,
    rarity: 'rare', class: 'melee', type: 'minion',
    description: 'Coated head-to-toe in combustible sticky resin that he ignites mid-battle. Everything he touches burns, and he loves every second of it.',
    abilities: ['Resin Ignition', 'Berserker Rage'],
    abilityDesc: 'Resin Ignition: Every 4th attack ignites target causing 80 burn damage over 4 sec. Berserker Rage: Below 30% HP gains +50% attack speed and +40% movement speed.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-42',
    name: 'Trichome Warlock',
    image: 'https://i.imgur.com/ZfwNzNS.png',
    cost: 4, attack: 175, health: 205,
    rarity: 'rare', class: 'magical', type: 'minion',
    description: 'Channels ancient trichome magic to drain enemy strength and transfer it directly to allied minions standing nearby.',
    abilities: ['Life Siphon', 'Trichome Shield'],
    abilityDesc: 'Life Siphon: Heals himself for 30% of all damage dealt. Trichome Shield: Once per battle — creates a shield on the nearest ally absorbing 200 damage.',
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Rare Spell (Harvest AOE) ──────────
  {
    id: 'image-30',
    name: 'Harvest Blade Storm',
    image: 'https://i.imgur.com/QQEIv7C.png',
    cost: 3, attack: 0, health: 0,
    rarity: 'rare', class: 'melee', type: 'spell',
    subtype: 'aoe-spell',
    description: 'Summons a vortex of spinning harvest blades that shreds everything in a target zone before dissolving back into the grow.',
    abilities: ['Blade Vortex', 'Shred Armor'],
    abilityDesc: 'Blade Vortex: Deals 220 damage to all enemies in 1.5-tile radius. Shred Armor: Targets hit have their armor reduced by 20% for 6 seconds.',
    aoeRadius: 2,
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Rare Token Spell (AOE) ────────────
  {
    id: 'token-sthc',
    name: 'STHC Protocol Strike',
    image: '/card-art/token-sthc.png',
    cost: 3, attack: 0, health: 0,
    rarity: 'rare', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'Activate the STHC protocol — a targeted market strike that floods enemy troops with disorienting THC vapor across a wide radius.',
    abilities: ['Protocol Burst', 'Vulnerability Mark'],
    abilityDesc: 'Protocol Burst: Deals 150 damage to all enemies in 2-tile radius. Vulnerability Mark: Surviving enemies take +30% damage from all sources for 6 seconds.',
    aoeRadius: 2,
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Rare AOE Attack (Canister) ────────
  {
    id: 'canister-co2',
    name: 'CO2 Extraction Bomb',
    image: '/card-art/canister-co2.png',
    cost: 4, attack: 0, health: 0,
    rarity: 'rare', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'Hurl a pressurized CO2 canister into enemy lines. The explosive decompression blast freezes everything in a 2x3 zone completely solid.',
    abilities: ['Pressure Burst', 'Cryo-Lock'],
    abilityDesc: 'Pressure Burst: Deals 240 damage to all enemies in a 2x3 tile area. Cryo-Lock: Every target hit is frozen in place for 1.5 seconds.',
    aoeRadius: 2,
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Rare Debuff Jar ──────────────────
  {
    id: 'jar-live-rosin',
    name: 'Live Rosin Protocol',
    image: '/card-art/jar-live-rosin.png',
    cost: 3, attack: 0, health: 0,
    rarity: 'rare', class: 'magical', type: 'spell',
    subtype: 'debuff',
    description: 'Smash a jar of live rosin directly over enemy lines. The sticky concentrate seeps into armor joints — enemies are weakened and sluggish for the duration.',
    abilities: ['Rosin Soak', 'Mobility Drain'],
    abilityDesc: 'Rosin Soak: All enemy minions lose 40% ATK for 15 seconds. Mobility Drain: Enemy movement speed reduced by 25% for the same 15 seconds.',
    duration: 15,
    traitRequirements: [], isNFTConnected: false,
  },

  // ═══════════════════════════════════════
  //  EPIC CARDS
  // ═══════════════════════════════════════

  {
    id: 'image-6',
    name: 'Hydroponic Fortress',
    image: 'https://i.imgur.com/ggfyOEs.png',
    cost: 5, attack: 200, health: 1100,
    rarity: 'epic', class: 'ranged', type: 'tower',
    description: 'A fully automated hydroponic facility converted into a war machine. Rains nutrient-charged bolts on every target in range simultaneously.',
    abilities: ['Nutrient Bolt', 'Self-Sustaining', 'Fortified Core'],
    abilityDesc: 'Nutrient Bolt: Every shot slows target 25% for 3 sec. Self-Sustaining: Regenerates 30 HP/sec from internal water systems. Fortified Core: Gains a 400 HP regenerating shield every 60 seconds.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-7',
    name: 'Chronic Citadel',
    image: 'https://i.imgur.com/wpAX667.png',
    cost: 5, attack: 240, health: 950,
    rarity: 'epic', class: 'ranged', type: 'tower',
    description: 'The most fortified structure in the entire grow kingdom. Dual-barrel resin cannons fire simultaneously on two separate targets.',
    abilities: ['Dual Barrels', 'Overcharge'],
    abilityDesc: 'Dual Barrels: Simultaneously attacks 2 different targets. Overcharge: Once per battle charges all shots — next 5 attacks deal triple damage.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-13',
    name: 'Dab Rig Marksman',
    image: 'https://i.imgur.com/6nLHyR8.png',
    cost: 5, attack: 280, health: 300,
    rarity: 'epic', class: 'ranged', type: 'minion',
    description: 'Uses a weaponized dab rig as a long-range cannon. Vaporized concentrate travels across the entire field and hits like a freight train.',
    abilities: ['Dab Cannon', 'Concentrates Expert'],
    abilityDesc: 'Dab Cannon: Shots pierce through 2 enemies in a line. Concentrates Expert: Each shot deals 50% splash damage to all adjacent targets.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-17',
    name: 'Cosmic Terpene Shaman',
    image: 'https://i.imgur.com/PjDTJXy.png',
    cost: 5, attack: 260, health: 280,
    rarity: 'epic', class: 'magical', type: 'minion',
    description: 'Calls upon ancient terpene spirits to devastate enemy formations from the spirit plane. Her spells smell absolutely terrifying.',
    abilities: ['Spirit Gust', 'Terpene Tornado', 'Ancestral Ward'],
    abilityDesc: 'Spirit Gust: Knocks all enemies in a cone backwards. Terpene Tornado: Every 20 sec creates a 3-tile tornado that pulls and damages enemies continuously. Ancestral Ward: On deploy, all friendly minions gain a 150 HP shield.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-21',
    name: 'Widow Maker Gunner',
    image: 'https://i.imgur.com/ChHlRyi.png',
    cost: 5, attack: 290, health: 290,
    rarity: 'epic', class: 'ranged', type: 'minion',
    description: 'Named after the legendary Black Widow strain, this gunner fires in all directions at once — no enemy in range is safe.',
    abilities: ['Widow Spin', 'Web Shot'],
    abilityDesc: 'Widow Spin: Every 8 sec fires in a full 360-degree burst hitting all nearby enemies simultaneously. Web Shot: 20% chance per shot to root target for 2 seconds.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-27',
    name: 'Blade of the Budmaster',
    image: 'https://i.imgur.com/saAO71C.png',
    cost: 5, attack: 320, health: 350,
    rarity: 'epic', class: 'melee', type: 'minion',
    description: 'The legendary Budmaster himself descended into battle. His blade is forged from compressed crystalline trichomes and cuts through any armor known.',
    abilities: ['Crystal Cleave', 'Budmaster Aura', 'Last Stand'],
    abilityDesc: 'Crystal Cleave: Every attack hits all enemies within a 1-tile arc. Budmaster Aura: Nearby allies gain +20% ATK and +15% HP. Last Stand: When brought below 20% HP — heals to 40% and deals 200 damage to all surrounding enemies.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'image-43',
    name: 'Aurora Pheno Witch',
    image: 'https://i.imgur.com/F9GY0a0.png',
    cost: 5, attack: 255, health: 310,
    rarity: 'epic', class: 'magical', type: 'minion',
    description: 'The rarest phenotype ever cultivated. She bends aurora light into weapons and transforms fallen enemies into healing nodes for her allies.',
    abilities: ['Aurora Beam', 'Pheno Convert', 'Lunar Cycle'],
    abilityDesc: 'Aurora Beam: Primary attack is a sustained piercing laser through all enemies in a line. Pheno Convert: On kill, fallen enemy becomes a healing node restoring 50 HP/sec to nearby allies. Lunar Cycle: Every 30 sec resets all ability cooldowns for all allied units on the field.',
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Epic Spell (AOE) ─────────────────
  {
    id: 'image-19',
    name: 'Terp Tsunami',
    image: 'https://i.imgur.com/fYUgwEK.png',
    cost: 4, attack: 0, health: 0,
    rarity: 'epic', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'Unleash a cascading wave of super-concentrated terpenes. This tidal force erases entire lanes of enemies in one devastating surge.',
    abilities: ['Wave Crush', 'Drown Zone', 'Tidal Pull'],
    abilityDesc: 'Wave Crush: Deals 350 damage to all enemies in a 3-tile lane. Drown Zone: Soaked area deals 50 damage/sec for 5 additional seconds. Tidal Pull: All hit enemies are dragged backwards 2 tiles.',
    aoeRadius: 3,
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Epic Enhancement Jar ─────────────
  {
    id: 'jar-full-spectrum',
    name: 'Full Spectrum Extract',
    image: '/card-art/jar-full-spectrum.png',
    cost: 4, attack: 0, health: 0,
    rarity: 'epic', class: 'magical', type: 'spell',
    subtype: 'enhancement',
    description: 'Crack open a jar of full-spectrum extract and let the entourage effect sweep your entire army. Every friendly unit hits their true genetic potential.',
    abilities: ['Entourage Effect', 'Genetic Surge'],
    abilityDesc: 'Entourage Effect: All friendly minions gain +25% ATK and +30% max HP for 20 seconds. Genetic Surge: All friendly towers fire 20% faster for the same 20 second duration.',
    duration: 20,
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── Epic Building (Grow House) ───────
  {
    id: 'grow-house',
    name: 'Cannabis Greenhouse',
    image: '/card-art/grow-house.png',
    cost: 5, attack: 0, health: 800,
    rarity: 'epic', class: 'ranged', type: 'tower',
    subtype: 'building',
    description: 'A glass greenhouse fortified for battle. Continuously grows and deploys Bud Tender soldiers for free. Toggle to grow Kush Archers instead.',
    abilities: ['Bud Production', 'Archer Mode', 'Greenhouse Repair'],
    abilityDesc: 'Bud Production: Spawns 1 Bud Tender every 12 seconds at no mana cost. Archer Mode: Toggle to spawn 1 Kush Archer (ranged, 2-cost stats) every 16 seconds. Greenhouse Repair: Self-heals at 50 HP per second.',
    traitRequirements: [], isNFTConnected: false,
  },

  // ═══════════════════════════════════════
  //  LEGENDARY BEAST CARDS
  // ═══════════════════════════════════════

  {
    id: 'image-22',
    name: 'Chronos the Hash Specter',
    image: 'https://i.imgur.com/I4Hf66H.png',
    cost: 8, attack: 380, health: 600,
    rarity: 'legendary', class: 'magical', type: 'minion',
    subtype: 'beast',
    description: 'An ancient specter formed entirely from solidified hash oil. Time itself bends around its crystallized body — it can rewind its own death.',
    abilities: ['Temporal Rewind', 'Hash Aura', 'Spectral Form', 'Phase Shift'],
    abilityDesc: 'Temporal Rewind: Once per battle — when HP hits 0, resets to 100% HP instead of dying. Hash Aura: All enemies within 3 tiles deal 25% less damage. Spectral Form: Phases directly through walls and terrain. Phase Shift: Every 15 sec becomes fully invulnerable for 2 seconds.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Background', traitValue: 'Cosmic', bonusEffect: 'Temporal Rewind triggers twice instead of once per battle' },
  },
  {
    id: 'image-23',
    name: 'Solara the Sungrown Sentinel',
    image: 'https://i.imgur.com/aEEZOAq.png',
    cost: 8, attack: 360, health: 640,
    rarity: 'legendary', class: 'ranged', type: 'minion',
    subtype: 'beast',
    description: 'Born from pure sunlight filtered through 1,000 crystalline trichomes. Solara fires solar rays so powerful they permanently scorch the ground beneath enemies.',
    abilities: ['Solar Ray', 'Sungrown Ascendance', 'Daybreak Aura', 'Scorched Earth'],
    abilityDesc: 'Solar Ray: Sustained beam dealing 500 DPS for 3 sec (15 sec cooldown). Sungrown Ascendance: Once per battle heals to 80% HP and gains +50% ATK for 10 sec. Daybreak Aura: All allied minions gain Haste (+25% move speed). Scorched Earth: On kill, target location burns for 5 sec dealing 60 dmg/sec to anything nearby.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Eyes', traitValue: 'Green', bonusEffect: 'Solar Ray cooldown reduced to 8 seconds' },
  },
  {
    id: 'image-24',
    name: 'Gruntox the Resin Titan',
    image: 'https://i.imgur.com/KiiU4bg.png',
    cost: 7, attack: 420, health: 780,
    rarity: 'legendary', class: 'melee', type: 'minion',
    subtype: 'beast',
    description: 'The single largest unit in the grow. Armored in 10 layers of compressed rosin and powerful enough to throw enemies clear across the entire arena.',
    abilities: ['Titan Slam', 'Rosin Mountain', 'Unstoppable Force', 'Ground Quake'],
    abilityDesc: 'Titan Slam: Attacks hit ALL enemies in a 2-tile radius for full damage. Rosin Mountain: Reduces all incoming damage by 35%. Unstoppable Force: Immune to stuns, freezes, slows, and knockbacks. Ground Quake: On deploy stuns all enemies on field for 2 seconds.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Background', traitValue: 'Purple', bonusEffect: 'Titan Slam radius increased from 2 to 3 tiles' },
  },
  {
    id: 'image-25',
    name: 'Ironleaf the Ancient Guardian',
    image: 'https://i.imgur.com/lQZm3qN.png',
    cost: 7, attack: 300, health: 1100,
    rarity: 'legendary', class: 'tank', type: 'minion',
    subtype: 'beast',
    description: 'A living cannabis tree of impossible age. Ironleaf walked the earth before cultivation existed. Its roots crack towers and its bark deflects every spell cast at it.',
    abilities: ['Ironbark Armor', 'Root Network', 'Ancient Regrowth', 'Spell Deflect'],
    abilityDesc: 'Ironbark Armor: Minimum damage per hit is capped at 10 regardless of source. Root Network: All allied towers within 3 tiles gain +200 HP permanently. Ancient Regrowth: Heals 80 HP per second continuously. Spell Deflect: All offensive spells aimed at Ironleaf are reflected back at the caster.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Body', traitValue: 'Crystalline', bonusEffect: 'Ironbark Armor minimum hit reduced to 1 — nearly unkillable' },
  },
  {
    id: 'image-26',
    name: 'Cryocannis the Terp Stalker',
    image: 'https://i.imgur.com/LKHfZYk.png',
    cost: 8, attack: 340, health: 580,
    rarity: 'legendary', class: 'ranged', type: 'minion',
    subtype: 'beast',
    description: 'A ghost hunter of the terpene realm. Stalks enemies from beyond visibility range and strikes from the shadows with razor crystalline spikes.',
    abilities: ['Stealth Approach', 'Cryo Spike Barrage', 'Thermal Vision', 'Permafrost'],
    abilityDesc: 'Stealth Approach: Invisible until it attacks or enters 1-tile range of an enemy. Cryo Spike Barrage: Every 12 sec fires 6 cryo spikes in a cone — each dealing 200 damage and freezing for 3 sec. Thermal Vision: Cannot be hidden or cloaked by any enemy spell. Permafrost: On death freezes all enemies in 3-tile radius for 4 seconds.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Hat', traitValue: 'Ice Crown', bonusEffect: 'Stealth persists even after attacking — only breaks on taking damage' },
  },
  {
    id: 'image-28',
    name: 'Zephyrix the Wind Grower',
    image: 'https://i.imgur.com/Omr6Q3H.png',
    cost: 7, attack: 350, health: 610,
    rarity: 'legendary', class: 'ranged', type: 'minion',
    subtype: 'beast',
    description: 'Master of wind-pollination and aerial combat. Zephyrix calls cannabis pollen storms that make entire enemy armies attack each other in total confusion.',
    abilities: ['Pollen Storm', 'Crosswind Shield', 'Genetic Scatter', 'Aerial Dominance'],
    abilityDesc: 'Pollen Storm: Fills 4-tile radius with pollen — enemies attack random targets for 8 sec. Crosswind Shield: Ranged projectiles have 40% chance to be deflected away. Genetic Scatter: On kill, drops seeds that grow into free Bud Tender units. Aerial Dominance: +50% attack range and flies over all obstacles.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Eyes', traitValue: 'Storm', bonusEffect: 'Pollen Storm duration increased from 8 to 16 seconds' },
  },

  // ─── New Legendary Beasts (from attached images) ──────
  {
    id: 'beast-dank-hound',
    name: 'Dank Hound',
    image: '/card-art/beast-dank-hound.png',
    cost: 6, attack: 310, health: 520,
    rarity: 'legendary', class: 'melee', type: 'minion',
    subtype: 'beast',
    description: "The grow's most dangerous guard dog. His terpene-scanning goggles detect enemies across the entire field, and his GBUX medallion recharges with every confirmed kill.",
    abilities: ['Terp Scan', 'GBUX Medallion', 'Hound Frenzy', 'Loyalty Pact'],
    abilityDesc: 'Terp Scan: Permanently reveals all invisible and stealthed units on the field. GBUX Medallion: Player earns 5 GBUX per kill scored by this unit. Hound Frenzy: Below 40% HP — attack speed triples and becomes immune to all crowd control. Loyalty Pact: Cannot be confused, converted, or mind-controlled by any enemy ability.',
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'beast-mary-jane',
    name: 'Mary Jane',
    image: '/card-art/beast-mary-jane.png',
    cost: 7, attack: 365, health: 590,
    rarity: 'legendary', class: 'magical', type: 'minion',
    subtype: 'beast',
    description: "The most powerful mage in the grow kingdom. Her hat conceals a bottomless sack of enchanted seeds. She repositions across dimensions at will and heals her entire army.",
    abilities: ['Teleport', 'Seed Bomb Barrage', 'Grow Magic Aura', 'Holiday Surge'],
    abilityDesc: 'Teleport: Instantly relocates to any tile on the board (8 sec cooldown). Seed Bomb Barrage: Active — throws 5 homing seed bombs at the highest-HP enemy (30 sec cooldown, each deals 280 damage). Grow Magic Aura: All allied minions regenerate 20 HP/sec passively. Holiday Surge: Once per battle — heals all allies to 100% HP and simultaneously deals 400 damage to all enemies.',
    traitRequirements: [], isNFTConnected: false,
  },

  // ─── 5 Additional Legendary Beasts ────
  {
    id: 'beast-cosmic-bear',
    name: 'Ursus the Cosmic Budlord',
    image: 'https://i.imgur.com/lIEaocK.png',
    cost: 8, attack: 400, health: 720,
    rarity: 'legendary', class: 'melee', type: 'minion',
    subtype: 'beast',
    description: "A cosmic purple bear crowned with living cannabis leaves. Ursus channels gravitational forces from distant grow planets — everything orbits him and everything eventually gets crushed.",
    abilities: ['Cosmic Gravity', 'Star Paw Slam', 'Cannabis Crown', 'Orbital Pull'],
    abilityDesc: 'Cosmic Gravity: All enemies on the entire field move 30% slower while Ursus is alive. Star Paw Slam: Every 10 sec performs a massive ground slam dealing 450 damage in 3-tile radius. Cannabis Crown: Heals 50 HP/sec and grants all allied beast-subtype units +15% ATK. Orbital Pull: Each attack pulls a random distant enemy to melee range.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Background', traitValue: 'Galaxy', bonusEffect: 'Cosmic Gravity slows enemies by 60% instead of 30%' },
  },
  {
    id: 'beast-crystal-mantis',
    name: 'Terpene Mantis Prime',
    image: 'https://i.imgur.com/ZrNhsNQ.png',
    cost: 9, attack: 440, health: 650,
    rarity: 'legendary', class: 'melee', type: 'minion',
    subtype: 'beast',
    description: "A praying mantis sculpted from pure crystallized terpenes. Its wings refract sunlight into prismatic kill beams. Its shard blades bypass all armor and shield mechanics.",
    abilities: ['Prism Wings', 'Shard Blades', 'Crystal Exo-Shell', 'Terpene Prism Blast'],
    abilityDesc: 'Prism Wings: On deploy fires 8 prismatic beams in all directions dealing 200 each. Shard Blades: All attacks ignore armor and shields completely. Crystal Exo-Shell: Absorbs the first 600 damage dealt to this unit on entry. Terpene Prism Blast: Every 20 sec fires a 5-direction prism beam dealing 300 each.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Eyes', traitValue: 'Crystal', bonusEffect: 'Crystal Exo-Shell fully regenerates every 45 seconds' },
  },
  {
    id: 'beast-cactus-golem',
    name: 'Resin Colossus',
    image: 'https://i.imgur.com/1idodNr.png',
    cost: 8, attack: 350, health: 950,
    rarity: 'legendary', class: 'tank', type: 'minion',
    subtype: 'beast',
    description: "An ancient cactus-golem whose body drips with living amber resin. Centuries of battles have fused its stone skin into near-indestructibility — spells literally shatter off its chest.",
    abilities: ['Living Amber', 'Stone Resin Skin', 'Cactus Spine Storm', 'Ancient Heal'],
    abilityDesc: 'Living Amber: Any melee attacker who hits Resin Colossus gets entangled in resin for 3 seconds. Stone Resin Skin: Magical damage reduced by 60%. Cactus Spine Storm: Every 15 sec fires 12 spines in all directions each dealing 150 damage. Ancient Heal: Heals 120 HP/sec — highest regeneration in the entire game.',
    traitRequirements: [], isNFTConnected: true,
    nftTraitBonus: { traitType: 'Body', traitValue: 'Stone', bonusEffect: 'Stone Resin Skin also reduces physical damage by an additional 40%' },
  },

  // ─── Legendary Token Spells (AOE — most rare) ──────
  {
    id: 'token-void-warp',
    name: 'Void Warp Token',
    image: '/card-art/token-void-warp.png',
    cost: 5, attack: 0, health: 0,
    rarity: 'epic', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'A swirling galaxy token that tears a brief dimensional void at the target location. All nearby enemies are violently pulled to the epicenter and crushed by the collapse.',
    abilities: ['Graviton Pull', 'Void Crush', 'Dimensional Tear'],
    abilityDesc: 'Graviton Pull: All enemies within 3 tiles are instantly dragged to the target point. Void Crush: All pulled enemies take 380 damage from the collapse. Dimensional Tear: The void persists for 4 seconds continuously pulling new enemies who wander into range.',
    aoeRadius: 3,
    traitRequirements: [], isNFTConnected: false,
  },
  {
    id: 'token-thc-genesis',
    name: 'THC Genesis Coin',
    image: '/card-art/token-thc-genesis.png',
    cost: 6, attack: 0, health: 0,
    rarity: 'legendary', class: 'magical', type: 'spell',
    subtype: 'aoe-spell',
    description: 'The original THC genesis token. Detonating it releases the primordial terpene frequency — every single enemy on the entire field takes devastating damage at the same instant.',
    abilities: ['Genesis Detonation', 'Tower Reset', 'Ancestral Echo'],
    abilityDesc: 'Genesis Detonation: Deals 500 damage to every enemy on the field simultaneously. Tower Reset: Immediately resets all friendly tower attack cooldowns to zero. Ancestral Echo: Leaves a persistent field for 8 seconds dealing 80 dmg/sec to any enemy that enters it.',
    aoeRadius: 999,
    traitRequirements: [], isNFTConnected: false,
  },
];

// ──────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────

export function getAvailableCardsForUser(userNFTTraits: Array<{trait_type: string, value: string}>): ClassificationCard[] {
  const userTraitValues = userNFTTraits.map(t => t.value.toLowerCase());
  return CLASSIFICATION_CARD_DATABASE.filter(card => {
    if (!card.isNFTConnected) return true;
    if (card.traitRequirements.length === 0) return true;
    return card.traitRequirements.some(req => userTraitValues.includes(req.toLowerCase()));
  });
}

export function getNFTHeroCard(nftData: any): ClassificationCard | null {
  if (!nftData) return null;
  const traits: Array<{trait_type: string, value: string}> = nftData.attributes || [];
  const backgroundTrait = traits.find(t => t.trait_type === 'Background');
  const eyesTrait = traits.find(t => t.trait_type === 'Eyes');
  const rank = nftData.rank || 1000;
  const rarity: ClassificationCard['rarity'] = rank <= 100 ? 'legendary' : rank <= 300 ? 'epic' : rank <= 700 ? 'rare' : rank <= 1500 ? 'uncommon' : 'common';
  return {
    id: `nft_hero_${nftData.mint}`,
    name: `${nftData.name} Hero`,
    image: nftData.image,
    cost: 0,
    attack: Math.min(450, Math.floor(220 + (2420 - rank) / 8)),
    health: Math.min(600, Math.floor(300 + (2420 - rank) / 6)),
    description: `Your personal hero — ${nftData.name}. Rank #${rank}. Connected from the THC GROWERZ NFT collection.`,
    rarity,
    class: eyesTrait?.value === 'Red' ? 'magical' : eyesTrait?.value === 'Green' ? 'ranged' : backgroundTrait?.value === 'Purple' ? 'tank' : 'melee',
    type: 'minion',
    subtype: 'beast',
    abilities: ['NFT Power', 'Hero Aura', 'Grower Pride'],
    abilityDesc: 'NFT Power: Stats scale with your NFT rank on the leaderboard. Hero Aura: All friendly minions deal +10% increased damage. Grower Pride: Cannot be confused, converted, or mind-controlled by any enemy ability.',
    traitRequirements: [],
    isNFTConnected: true,
    nftTraitBonus: { traitType: backgroundTrait?.trait_type || 'Background', traitValue: backgroundTrait?.value || 'Default', bonusEffect: `Rank #${rank} Power: Enhanced stats based on rarity tier` },
  };
}

export function generateUserDeck(userNFTData: any, userNFTTraits: Array<{trait_type: string, value: string}>): ClassificationCard[] {
  const deck: ClassificationCard[] = [];
  const heroCard = getNFTHeroCard(userNFTData);
  if (heroCard) deck.push(heroCard);
  const available = getAvailableCardsForUser(userNFTTraits);
  const sorted = available.sort((a, b) => {
    const order = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    return order[b.rarity] - order[a.rarity];
  });
  for (let i = 0; i < 7 && i < sorted.length; i++) deck.push(sorted[i]);
  return deck;
}
