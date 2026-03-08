# THC CLASH — Card System Reference

Everything you need to create, design, balance, and script cards for THC CLASH.

---

## Card Data Schema

Every card in the game is a JSON object matching this structure:

```jsonc
{
  "id": "string",             // unique slug, e.g. "og-kush-ranger"
  "name": "string",           // display name, e.g. "OG Kush Ranger"
  "rarity": "common" | "uncommon" | "rare" | "epic" | "legendary",
  "type": "minion" | "spell" | "tower",
  "class": "melee" | "ranged" | "magical" | "tank" | "support" | "assassin",
  "cost": 1-10,               // elixir cost (integer)
  "attack": 1-999,            // damage per hit
  "health": 1-9999,           // total HP
  "speed": 1.0-4.0,           // movement speed multiplier (minion only)
  "range": 1.0-5.0,           // attack range in tiles
  "attackSpeed": 0.5-3.0,     // attacks per second
  "description": "string",    // 1-sentence flavour/effect description
  "abilities": ["string"],    // array of ability tags (see Abilities section)
  "image": "string",          // URL or /attached_assets/ path
  "isActive": true,           // whether card appears in game pool
  "isNFTConnected": false,    // true if this card is linked to a real NFT mint
  "nftMint": "string | null"  // Solana pubkey if minted on-chain
}
```

---

## Card Zones — Canvas Layout

When a card is rendered by `drawCardFace()` in `PackOpeningModal.tsx`, the canvas is divided into these zones. All Y values are expressed as a fraction of total card height `H`, so the card scales to any size.

```
┌─────────────────────────────────────────┐  [0, 0]
│  outer rarity border (2.5px)            │
│  inner border × 2 (α-tinted)           │
│                                         │
│  ┌──── HEADER ─────────────────────┐    │  y: 10 → H*0.115+10
│  │  ◉ COST ORB   |   CLASS LABEL   │    │  orb at x=22, class right-aligned
│  └─────────────────────────────────┘    │  blue radial gradient orb
│                                         │
│  ┌──── ART WINDOW ─────────────────┐    │  y: H*0.12+17 → H*0.60
│  │   [full-bleed artwork]           │    │  aspect-fill, clipped
│  │   top vignette (black, 28%)      │    │
│  │   bottom vignette (black, 35%)   │    │  corner bracket accents
│  │   [if no image: canvas leaf]     │    │  matches rarity color
│  └─────────────────────────────────┘    │
│                                         │
│  ─── RARITY DIVIDER + GEM ─────────    │  y: H*0.60+7  (gradient line + orb)
│                                         │
│  ┌──── NAME PLATE ─────────────────┐    │  y: H*0.62 → H*0.70
│  │  RARITY LABEL  (rarity color)   │    │  all-caps, tiny
│  │  CARD NAME     (white bold)     │    │  auto-truncates with ellipsis
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──── ABILITY ZONE ───────────────┐    │  y: H*0.70 → H*0.82
│  │  ✦ Ability or description text  │    │  semi-transparent rarity bg
│  └─────────────────────────────────┘    │  auto-truncates with ellipsis
│                                         │
│  ┌──── STATS FOOTER ───────────────┐    │  y: H*0.83 → H-8
│  │  ⚔ ATK pill  |  ♥ HP pill      │    │  red/green pills, equal width
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘  [W, H]
```

**Pixel values at default card size (W=260, H=380):**

| Zone | Y start | Y end | Height |
|---|---|---|---|
| Header | 10 | 52 | 42px |
| Art Window | 59 | 228 | 169px |
| Rarity divider | 235 | 238 | 3px |
| Name plate | 241 | 267 | 26px |
| Ability zone | 270 | 312 | 42px |
| Stats footer | 315 | 372 | 57px |

---

## Rarity Tiers

| Rarity | Color | Pull Label | Particles | Glow |
|---|---|---|---|---|
| Common | `#94a3b8` (slate) | — | 0 | subtle |
| Uncommon | `#a855f7` (purple) | — | 6 | medium |
| Rare | `#22c55e` (green) | RARE PULL! | 14 | strong |
| Epic | `#c084fc` (violet) | EPIC PULL! | 22 | intense |
| Legendary | `#ffd700` (gold) | LEGENDARY PULL! | 32 | max shimmer |

**Balance guideline:** Each tier should be roughly 2× stronger than the tier below it in total stats (attack × health ÷ cost).

---

## Class Types

| Class | Role | Attack Type | Range | Speed |
|---|---|---|---|---|
| `melee` | Front-line fighter | Physical | 1.5 tiles | 2.0 |
| `tank` | Damage absorber | Physical | 1.5 tiles | 1.2 |
| `ranged` | Back-line attacker | Physical | 3.5 tiles | 1.8 |
| `magical` | Burst damage | Magical | 3.0 tiles | 1.5 |
| `support` | Healer/buffer | Magical | 2.5 tiles | 1.6 |
| `assassin` | Fast burst | Physical | 1.5 tiles | 3.5 |

---

## Ability Tags

Abilities are short string tags stored in the `abilities[]` array. The battle engine reads these to apply special logic.

| Tag | Effect |
|---|---|
| `"flying"` | Unit ignores ground units, only targets towers + air |
| `"aoe"` | Attacks hit all enemies within 1 tile of target |
| `"heal_on_hit"` | Restores 15% of damage dealt to own HP |
| `"double_hit"` | Attacks twice per swing (second hit = 50% damage) |
| `"splash"` | Projectile explodes on hit (0.75 tile radius) |
| `"stun_chance"` | 20% chance to stun target for 0.5s |
| `"fast_deploy"` | Deploy animation is skipped (instant action) |
| `"shield"` | Absorbs first 30% of HP in damage before taking health damage |
| `"poison_trail"` | Leaves a damage zone behind while moving |
| `"nft_powered"` | Trait bonuses from linked GROWERZ NFT apply in battle |
| `"budz_drain"` | Kills reward +1 BUDZ to the player |
| `"grower"` | Passive: GROWERZ unit — benefits from GROWERZ Hub synergies |

---

## Stat Balancing Guide

Use these formulas to balance new cards:

### Power Score
```
powerScore = (attack × attackSpeed × 60) + (health × 0.25)
```

### Elixir Efficiency
```
efficiency = powerScore / (cost × cost)
```

| Rarity | Target Efficiency |
|---|---|
| Common | 8–12 |
| Uncommon | 11–16 |
| Rare | 15–22 |
| Epic | 20–32 |
| Legendary | 30–50 |

### Reference Cards (Common Baseline)

```jsonc
// GROUND UNIT baseline — common melee
{ "cost": 3, "attack": 80, "health": 320, "speed": 2.0, "range": 1.5, "attackSpeed": 1.0 }
// powerScore = (80 × 1 × 60) + (320 × 0.25) = 4800 + 80 = 4880
// efficiency = 4880 / 9 = 542  ← use this ratio as your baseline multiplier

// RANGED UNIT baseline — common ranged
{ "cost": 3, "attack": 60, "health": 220, "speed": 1.8, "range": 3.5, "attackSpeed": 0.8 }

// TANK baseline — common tank  
{ "cost": 5, "attack": 90, "health": 900, "speed": 1.2, "range": 1.5, "attackSpeed": 0.7 }

// SPELL baseline — common magical
{ "cost": 4, "attack": 200, "health": 180, "speed": 1.5, "range": 3.0, "attackSpeed": 0.9 }
```

---

## Creating a Card — Step by Step

### Option 1: Admin Panel (no code)
1. Navigate to `/admingame` in the game
2. Click "Add Card" in the card management section
3. Fill in all fields using the schema above
4. Upload or paste an artwork URL
5. Set `isActive: true` to make it available in packs

### Option 2: Database seeding (scriptable)

Insert directly into the `admin_cards` PostgreSQL table via the API:

```http
POST /api/admin/cards
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Sativa Sniper",
  "rarity": "rare",
  "type": "minion",
  "class": "ranged",
  "cost": 4,
  "attack": 120,
  "health": 280,
  "speed": 1.8,
  "range": 3.5,
  "attackSpeed": 0.85,
  "description": "A long-range cannabis cultivar with deadly precision.",
  "abilities": ["double_hit"],
  "image": "/attached_assets/sativa_sniper.png",
  "isActive": true
}
```

### Option 3: Bulk JSON import

Create a JSON array and POST to `/api/admin/cards/bulk`:

```json
[
  { "name": "Blue Dream Tank", "rarity": "epic", "type": "minion", ... },
  { "name": "Kush Wizard", "rarity": "legendary", "type": "minion", ... }
]
```

---

## GROWERZ NFT Card Injection

When a player connects a wallet holding GROWERZ NFTs, the system auto-generates cards from trait data via `GrowerzUnitSystem.ts`. These cards use `"isNFTConnected": true` and `"abilities": ["nft_powered", "grower"]`.

**Trait → stat mapping:**

| Trait | Stat affected |
|---|---|
| Skin (color) | Base HP modifier |
| Clothes | Base Attack modifier |
| Head accessory | Attack type + first ability |
| Mouth expression | Attack bonus % |
| Eyes | Elixir cost adjustment |
| Background | Movement speed |
| Rank (1–2335) | Rarity tier + global multiplier |

**Rank → Rarity:**

| Rank range | Rarity tier |
|---|---|
| 1–71 | Legendary |
| 72–361 | Epic |
| 362–843 | Rare |
| 844–1446 | Uncommon |
| 1447–2335 | Common |

---

## Card Image Generation (Puter.js)

Each card can have AI-generated artwork using `CardImageService.ts`:

```typescript
import { generateCardImage } from '../services/CardImageService';

const imageUrl = await generateCardImage({
  name: 'Sativa Sniper',
  rarity: 'rare',
  class: 'ranged',
  description: 'A long-range cannabis cultivar with deadly precision.',
});
// returns a blob URL, cached in localStorage for 30 days
```

**Prompt template used:**
```
[rarity adjective] cannabis [class] warrior character, full body, 
vibrant neon colors, thick black outlines, Clash Royale game art style, 
[name] theme, transparent background
```

Rarity adjectives: `common (earthy)`, `uncommon (glowing)`, `rare (crystalline blue)`, `epic (amethyst pulsing)`, `legendary (golden radiant)`

---

## Pack Configuration

Packs are configured in `CardPackShop.tsx` → `PACK_TYPES`. Each pack has a weighted rarity distribution:

```typescript
weights: {
  common: 55, uncommon: 30, rare: 12, epic: 3, legendary: 0
}
```

To create a new pack tier, add an entry to `PACK_TYPES`:

```typescript
{
  id: 'ultra-kush',
  name: 'Ultra Kush',
  strain: 'ULTRA KUSH',
  tag: 'ULTRA',
  gbuxCost: 300,
  usd: 1.50,
  color: '#ff00ff',
  weights: { common: 10, uncommon: 20, rare: 35, epic: 30, legendary: 5 },
  bgImage: null,
}
```

---

## Card Back Design

The card back is drawn by `drawCardBack()` in `PackOpeningModal.tsx`. It renders:
- Deep green gradient fill (`#0b1d0e` → `#050e07`)
- Diagonal line texture
- Triple nested rounded-rect border in `packColor`
- Concentric ring ornament
- **Cannabis leaf** (7-leaflet, serrated, with midribs and stem) — drawn via `drawCannabisLeaf()`
- `THC CLASH` label below leaf

The `drawCannabisLeaf(ctx, cx, cy, size, color, alpha)` function draws a proper botanical cannabis leaf using bezier curves — no emoji used anywhere.
