# THC CLASH — Cannabis-Themed Clash Royale Card Battle Game

## Overview
THC CLASH is a Web3-enabled Clash Royale-style card battle game built in React + TypeScript. Players use their THC GROWERZ NFT collection as deployable battle units, competing in real-time PvE battles on a procedural canvas arena. The game has a full Solana token economy (BUDZ, GBUX, THC LABZ), NFT trait-driven card stats, compressed NFT minting via Crossmint, a card pack shop, and AI-generated artwork using Puter.js.

---

## User Preferences
- Communication: Simple everyday language, no jargon, concise.
- Card display: Emoji-enhanced stats — ⚡ cost (top-right), ⚔️ attack (bottom-left), ❤️ health (bottom-right). Full image, no clipping.
- Background: Authentic admin-uploaded cannabis gameboard (`Pot60u6_1754231881681.png`) as battle background.
- Canvas: `maxWidth: 100%`, `height: auto` — scales to viewport. Max-height `calc(100vh - 280px)`.
- Arena dimensions: 800×640px, 32px tile grid (25×20 tiles). Bridge positions fixed: left at x=160, right at x=640, river at y=320. Do NOT change these.

---

## Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI primitives
- **State**: Zustand (global), TanStack Query (server data)
- **Canvas Rendering**: Two-canvas system — main game canvas (units, terrain, towers, health bars) + transparent FX overlay canvas (effects engine)
- **Animations**: Custom `BattleEffectsEngine` (see below)

### Backend
- **Framework**: Express.js + TypeScript on Node.js
- **Database**: Helium PostgreSQL (primary, shared with Dope-Budz via `GAME_DATABASE_URL`); Neon serverless (fallback via `DATABASE_URL`)
- **ORM**: Drizzle ORM

### Database Schema
- `users` — wallet auth, token balances (BUDZ/GBUX/THC_LABZ), battle stats (101 rows, 79 cols)
- `admin_cards` — 74 seeded cannabis cards (15 common, 15 uncommon, 16 rare, 16 epic, 12 legendary)
- `user_cards` — card ownership per wallet, NFT mint address, source (starter/purchased/reward/nft)
- `card_trades` — NFT trade listings (seller, card, price, status)
- Leaderboards, achievements, AI assistants, NFT bonuses tables

---

## Key Systems

### Battle Engine (`AuthenticTHCClashBattle.tsx`, 2790 lines)
The core battle component. Two canvas layers:
1. **Game canvas** (`canvasRef`) — draws terrain, units, towers, health bars, projectiles, UI
2. **FX canvas** (`fxCanvasRef`) — transparent overlay, driven by `BattleEffectsEngine`, `pointer-events: none`

Both canvases live inside the same `transform: scale(zoomLevel)` div so zoom applies to both.

**Game systems:**
- Elixir: starts at 5, regenerates +1 every 2.8s, max 10, doubles in last 60s
- Units: AABB pathfinding, bridge routing, target prioritization (units > towers)
- Projectiles: ranged/magical units fire projectiles; hit detection by proximity
- Towers: 6 total (3 per side), health bars, destruction triggers crown scoring
- Victory: King Tower destroyed, or most crowns after 3-min timeout (+ overtime)

**Zoom system**: Mouse wheel + pinch-to-zoom (0.55×–2.4×), +/−/reset buttons. Applied via CSS `transform: scale()`.

### BattleEffectsEngine (`client/src/utils/BattleEffectsEngine.ts`)
Standalone canvas effects engine — no React, no external libs. Driven by its own RAF loop in the FX canvas component.

**Effect types emitted during battle:**
| Event | Effect |
|---|---|
| Melee/tank attack lands | `emitSlash` — directional arc swing + `emitImpact` burst |
| Ranged unit fires | `emitArrow` — moving arrowhead with wind trail |
| Magical unit fires | `emitMagicShot` — orb with spiral trail + `emitMagicCharge` ring |
| Projectile hits unit | `emitImpact` + `emitDamageNumber` (colored by attack type) |
| Projectile hits tower | `emitTowerBeam` flash + `emitDamageNumber` + `emitAoERing` for spells |
| Unit dies | `emitDeath` — radial particle burst + shockwave ring |
| Unit deployed (player) | `emitDeploy` — green stamp circle |
| Unit deployed (AI) | `emitDeploy` — red stamp circle |
| Spell AoE | `emitAoERing` — expanding dashed ring with inner glow |
| Tower destroyed | `emitDeath` + `emitAoERing` — orange explosion ring |
| Critical hit | `emitDamageNumber` with `isCrit=true` — larger CRIT! label |

**Performance**: Replaces the old `setAoeAnimations(prev => prev.filter(...))` antipattern (calling React setState inside RAF = re-render cascade). AOE animations now live entirely in the FX engine with zero React state.

### Map Themes (`client/src/utils/MapThemes.ts`)
6 themes: Cannabis Garden, Lava Fields, Frozen Tundra, Moonlit Forest, Desert Oasis, Galaxy Station.
Each has: fallback procedural canvas renderer (grid-by-grid terrain tiles, river shimmer, bridges, vignette) + `puterPrompt` for AI-generated backgrounds.

### GROWERZ Battle Sprite System (`client/src/services/GrowerzBattleSprite.ts`)
- Uses Puter.js `txt2img` to generate full-body 2D cartoon battle sprites from NFT traits
- Prompt built from: skin, clothes, head, mouth, eyes, background, rank
- Style reference: THC GROWERZ HUB NFT — full-body portrait, thick black outlines, vibrant colors, cannabis motifs
- Cached in `localStorage` (`growerz_sprite_v2_<id>`) for 30 days
- Auto-triggered when `puterReady` and GROWERZ cards are in deck
- Status shown in battle header: "🌿 Generating…" / "🌿 Sprites ready"
- Render: 46×76px rounded rect portrait with team-color glow border + floor vignette
- Fallback: if generation fails, original card image renders unchanged

### GROWERZ NFT Unit System (`client/src/utils/GrowerzUnitSystem.ts`)
Converts owned GROWERZ NFTs into battle units:
- Skin → HP, Clothes → Attack, Head → AttackType+Ability, Mouth → AtkBonus, Eyes → CostAdjust, Background → Speed
- Rank → Rarity tier (Mythic ≤71, Epic ≤361, Rare ≤843, Uncommon ≤1446, Common)
- 8-unit AI pool with pre-defined traits injected into AI deck each battle

### Card Image Service (`client/src/services/CardImageService.ts`)
- Puter.js `txt2img` generates per-card cannabis-themed artwork
- Cannabis + rarity + class-specific prompts (e.g. "legendary golden glowing" for legendary tier)
- Cached in `localStorage` (`thc_card_art_v1_<id>`) for 30 days

### Pack Art Service (`client/src/services/PackArtService.ts`)
- Puter.js `txt2img` / `txt2vid` for pack artwork generation

### Card Pack Shop
- 3 tiers: Green Bag (common/uncommon), Dank Pack (rare+), Legendary Kush (epic/legendary)
- Payment: GBUX (DB balance) or Game Token (on-chain SPL)
- Canvas-painted TCG card reveal: mana orb, art window, rarity gem divider, stat pills
- Free pack available daily (timer in `FreePackTimer.tsx`, filters common/uncommon only)

### Crossmint cNFT Minting
- Collection: `2397b172-1803-403f-9d30-4dc553776c58`
- Endpoint: `POST /api/cards/mint-nft`
- `user_cards` promoted to on-chain NFT: `card.nftMint` = Solana pubkey

### NFT Trade System
- Route: `/trade` → `NFTTradePage`
- `card_trades` DB table: seller, card, asking price in BUDZ, status, buyer
- API: `GET /api/trades`, `POST /api/trades/list`, `POST /api/trades/:id/accept`

---

## File Structure (Key Files)
```
client/src/
  components/
    AuthenticTHCClashBattle.tsx   — Main battle renderer (2790 lines)
    PackOpeningModal.tsx          — Canvas TCG card reveal system
    FreePackTimer.tsx             — Daily free pack (common/uncommon filter)
    BattleResults.tsx             — Win/loss screen
    GameHub.tsx                   — Main hub
  utils/
    BattleEffectsEngine.ts        — Standalone FX canvas engine
    MapThemes.ts                  — 6 battle map themes (procedural + AI)
    GrowerzUnitSystem.ts          — NFT trait → unit stat conversion
    EnhancedCardAbilities.ts      — Card ability definitions
    BalancedCardStats.ts          — Balanced stats system
    BattleReplayRecorder.ts       — Battle replay system
  services/
    GrowerzBattleSprite.ts        — Puter txt2img GROWERZ sprite generation
    CardImageService.ts           — Puter txt2img card artwork
    PackArtService.ts             — Puter txt2img/txt2vid pack art
server/
  routes.ts                       — Main API routes
  crossmint.ts                    — Crossmint cNFT minting
  routes/
    purchase.ts                   — Card purchase + user_cards write
    adminCards.ts                 — Admin card management
    userCards.ts                  — User card ownership CRUD
```

---

## Web3 / Solana
- **Wallet Auth**: `POST /api/auth/wallet` — validates wallet, creates/finds DB user
- **Tokens**: BUDZ (`BmwJNuA...`), GBUX (`55TpSoMN...`), THC LABZ (`9WzDXwBb...`)
- **RPC Priority**: `SOLANA_RPC_URL` → `HELIUS_API_KEY` → public mainnet-beta
- **NFT Detection**: HowRare.is API for GROWERZ collection ranks; Helius/Metaplex for wallet scan
- **Buffer Polyfill**: `vite-plugin-node-polyfills` + manual inject in `main.tsx`
- **Supported Wallets**: Phantom, Solflare, Backpack, Magic Eden, Coinbase

---

## External Services
- **Puter.js** (`https://js.puter.com/v2/`) — Free AI image generation (`txt2img`) for card art, map backgrounds, GROWERZ battle sprites
- **HowRare.is API** — GROWERZ NFT rarity ranks
- **Crossmint** — Compressed NFT minting, multi-auth (wallet/email/phone/Discord)
- **Helius API** — NFT metadata + RPC
- **OpenAI API** — AI assistant + Dope Budz game validation
- **Jupiter Price API** — Token price feeds
- **Twilio** — SMS OTP for phone-based Crossmint auth

---

## Crossmint Integration Files

| File | Purpose |
|------|---------|
| `server/crossmint.ts` | Server SDK — wallet creation |
| `server/crossmint-auth.ts` | Multi-auth: wallet, email, phone, Discord |
| `server/crossmint-ai-agent.ts` | AI price protection for token swaps |
| `client/src/config/crossmint.ts` | Client-side config constants |
| `client/src/services/CrossmintService.ts` | Client API wrapper |
| `client/src/hooks/useCrossmint.ts` | React auth hook |
| `client/src/components/CrossmintWalletConnect.tsx` | Drop-in auth UI |
| `client/src/types/crossmint.d.ts` | TypeScript types |

---

## Dope Budz Bridge Files

| File | Purpose |
|------|---------|
| `server/dope-budz-ai-controller.ts` | OpenAI game validation |
| `server/routes/dopeBudz.ts` | REST API bridge (`/api/dope-budz/*`) |
| `client/src/services/DopeBudzService.ts` | Client service for Dope Budz |
| `client/src/types/dopeBudz.d.ts` | TypeScript types |
| `MERGE_README.md` | Full merge instructions |

---

## Token Config
- Central token config: `client/src/config/tokens.ts`
- All token mints, decimals, icons, prices, and reward amounts in one file
- Used by `Web3Purchase.ts`, `DopeBudzService.ts`, and all payment components
