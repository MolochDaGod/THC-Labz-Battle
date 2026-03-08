# THC CLASH — Game Integration & Systems Guide

This document covers how to build, extend, and connect the major game systems. Written for developers and AI agents integrating new features.

---

## Architecture Quick Reference

| Layer | Tech | Key Files |
|---|---|---|
| Battle engine | Canvas 2D + React state | `AuthenticTHCClashBattle.tsx` |
| FX engine | Canvas 2D, RAF loop | `BattleEffectsEngine.ts` |
| Card system | REST API + PostgreSQL | `server/routes/adminCards.ts` + `userCards.ts` |
| NFT layer | Solana RPC + HowRare.is | `server/routes.ts` → `/api/my-nfts` |
| Token economy | SPL tokens + DB balances | `server/routes.ts` + `Web3Purchase.ts` |
| AI image gen | Puter.js txt2img | `CardImageService.ts`, `GrowerzBattleSprite.ts` |

---

## System 1: Campaign Mode

### What exists now
- Single PvE battle against AI opponent with randomized AI deck
- 3 difficulty levels: Rookie / Veteran / OG Kush (controlled in `PreBattle.tsx`)
- AI selects from admin card pool weighted by difficulty
- Battle result (win/loss + trophy delta) sent to `BattleResults.tsx`

### How to build a Campaign system

**1. Campaign data model** — add a `campaigns` table:

```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL,  -- array of stage objects
  reward_budz INTEGER DEFAULT 0,
  reward_card_id TEXT,
  unlock_requirement INTEGER DEFAULT 0  -- trophies needed
);
```

**Stage JSON structure:**
```jsonc
{
  "stageNumber": 1,
  "name": "The Seedling Trials",
  "difficulty": "rookie",
  "ai_deck_ids": ["card-001", "card-015", ...],   // forced AI deck
  "gameboard_id": "gameboard_uuid",               // admin gameboard
  "rewards": {
    "budz": 50,
    "card_id": "og-kush-ranger",    // guaranteed drop
    "xp": 100
  },
  "lore": "Defeat the rookie growers in the nursery zone..."
}
```

**2. Campaign progress table:**

```sql
CREATE TABLE campaign_progress (
  wallet_address TEXT,
  campaign_id INTEGER,
  stage_number INTEGER,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (wallet_address, campaign_id, stage_number)
);
```

**3. Wire into battle flow** — in `PreBattle.tsx`, add `campaignStage` prop. When present:
- Force the AI deck to use `ai_deck_ids` from the stage
- On battle complete (`BattleResults.tsx`), call `POST /api/campaign/complete-stage`
- Grant `reward_budz` and insert `reward_card_id` into `user_cards`

**4. Campaign UI** — create `CampaignMap.tsx`:
- Render stages as a scrollable path map (like Clash Royale leagues)
- Lock stages until previous stage complete
- Show rewards preview per stage
- Boss stages (every 5th) use Legendary AI deck + bigger rewards

---

## System 2: PvP

### Architecture for real-time PvP

**Option A: WebSocket server (recommended)**

Add a WebSocket server in `server/pvp.ts`:

```typescript
import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 5001 });
const matchmaking: Map<string, WebSocket> = new Map();

// Message types: QUEUE | MATCH_FOUND | DEPLOY_CARD | GAME_STATE | GAME_OVER

wss.on('connection', (ws, req) => {
  const wallet = req.url?.split('wallet=')[1];
  // queue player, match them, sync game state
});
```

**PvP game state sync:**
- Each client runs its own battle simulation
- Server acts as authoritative tick source
- Clients send `{ type: 'DEPLOY', cardId, x, y, t }` events
- Server validates cost, replays on server simulation, broadcasts to opponent

**Matchmaking tiers** — use trophy count as MMR:
```
Tier 1: 0–499 trophies     → rookie pool
Tier 2: 500–1499 trophies  → veteran pool
Tier 3: 1500+ trophies     → OG Kush legends
```

**PvP rewards:**
- Win: +30 trophies, +10 BUDZ, +1 XP
- Loss: -20 trophies, +2 BUDZ (consolation)
- Top 100 weekly → GBUX rewards (existing `weeklyRewards.ts`)

**Option B: Turn-based PvP (simpler)**
- Each player submits their full deck + strategy profile
- Server simulates both decks against each other asynchronously
- Results posted within 60 seconds
- No WebSocket needed — uses polling `GET /api/pvp/result/:matchId`

---

## System 3: Collectables

### Cards as collectables

Every card in `user_cards` is already a collectable. Extend with:

**Foil / holographic variants:**
```sql
ALTER TABLE user_cards ADD COLUMN variant TEXT DEFAULT 'standard';
-- variants: 'standard' | 'foil' | 'holographic' | 'growerz_nft'
```

Foil variant triggers a shimmer animation in `drawCardFace()`:
```typescript
if (card.variant === 'foil') {
  const shimmer = ctx.createLinearGradient(0, 0, W, H);
  shimmer.addColorStop(0, 'rgba(255,255,255,0)');
  shimmer.addColorStop(0.45 + Math.sin(Date.now()/1000)*0.1, 'rgba(255,255,255,0.15)');
  shimmer.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shimmer;
  ctx.fillRect(0, 0, W, H);
}
```

**Card leveling:**
- Combine 3 copies of same card → upgrade to next level (max 5)
- Level increases stats by 10% per level
- Track in `user_cards.level` (already in schema)

**Collection completion bonus:**
- Complete full set of same rarity → award exclusive foil variant
- Track in `user_stats.collection_sets` JSONB

**Collection gallery view:**
- Add a `/collection` screen that renders all cards in a scrollable grid using `MiniTCGCard` canvas component
- Filter by rarity, class, NFT status
- Cards with `isOwned: false` render as silhouette + "?" text

---

## System 4: Gambling / Wagering

### BUDZ wagering on battles

**Wager system:**
```sql
CREATE TABLE battle_wagers (
  id SERIAL PRIMARY KEY,
  match_id TEXT UNIQUE,
  player1_wallet TEXT,
  player2_wallet TEXT,
  amount_budz INTEGER,
  winner_wallet TEXT,
  settled_at TIMESTAMPTZ
);
```

**Flow:**
1. Player creates a challenge with wager amount: `POST /api/wager/create { opponentWallet, amountBudz }`
2. Server debits both wallets into escrow (`wager_escrow_balance` column on users)
3. After battle, winner receives `2 × amountBudz`, loser loses their stake
4. Server prevents wagering more than 10% of current BUDZ balance (anti-drain protection)

**Pack gambling (scratch card mini-game):**
- Add a "Lucky Bud" scratch card: pay 10 BUDZ, reveal 1 of 5 hidden outcomes:
  - Lose (50%)
  - Win pack (25%)
  - Win 2× BUDZ (15%)
  - Win rare card (8%)
  - Win legendary card (2%)
- Implement as a canvas scratch effect — grey layer over outcome, user "scratches" via mouse/touch drag

**Daily spin wheel:**
- Free spin every 24h
- 8 segments: +BUDZ, +GBUX, card pack, duplicate card, nothing, rare card, small BUDZ, XP
- Uses weighted random, server-side seed to prevent manipulation
- Endpoint: `POST /api/spin-wheel` → returns `{ outcome, amount, cardId? }`

---

## System 5: Area Ownership

### Map territory control

**Concept:** The battle arena is divided into 5 "grow zones". Winning battles in specific zones earns zone ownership. Owners collect passive BUDZ per hour.

**Zone schema:**
```sql
CREATE TABLE grow_zones (
  zone_id TEXT PRIMARY KEY,  -- e.g. 'cannabis-garden', 'lava-fields'
  owner_wallet TEXT,
  captured_at TIMESTAMPTZ,
  budz_per_hour INTEGER DEFAULT 5,
  capture_count INTEGER DEFAULT 0
);
```

**Ownership flow:**
1. Pre-battle screen shows which zone this battle is in (matches map theme)
2. Win the battle → call `POST /api/zones/capture { zoneId, walletAddress }`
3. Server checks if zone is already owned:
   - If unowned or owned by same player: capture/reinforce (no battle needed)
   - If owned by another player: initiates a siege (automatic defense replay)
4. Owners see a BUDZ income ticker on the GameHub screen

**BUDZ income claiming:**
```
GET /api/zones/income/:walletAddress
→ { pendingBudz: 47, ownedZones: ['cannabis-garden'] }

POST /api/zones/claim/:walletAddress
→ { claimed: 47, newBalance: 312 }
```

**Zone defense:** When your zone is attacked:
- Last winning deck is auto-replayed as the defense team
- If attacker beats your replay → they capture the zone
- You get a notification and +5 BUDZ as consolation ("defender's payout")

**Leaderboard integration:** Zone ownership count appears on the existing leaderboard table as a new column `zones_owned`.

---

## System 6: GROWERZ Hub Connection

### What GROWERZ Hub is
The [growerz.thc-labz.xyz](https://growerz.thc-labz.xyz) site is the NFT community portal for THC GROWERZ (Solana NFT collection, 2335 items). THC CLASH gives NFT holders in-game benefits.

### Current integration
- Wallet scan on login → `GET /api/my-nfts/:walletAddress`
- HowRare.is API fetches all 2335 NFTs with traits + ranks
- Owned GROWERZ auto-generate unit cards with trait-derived stats via `GrowerzUnitSystem.ts`
- `GrowerzBattleSprite.ts` generates unique full-body battle sprites using Puter.js txt2img
- Rank bonuses: `rankMultiplier = Math.max(1.0, (2335 - rank) / 2335 × 2.0 + 1.0)`

### Extending the GROWERZ integration

**1. GROWERZ-exclusive game modes:**
- PvP tournaments restricted to GROWERZ holders only
- Entry requires owning at least 1 GROWERZ NFT
- Prizes: rare cards + GBUX + GROWERZ Hub badges

**2. Trait evolution:**
- Each GROWERZ unit earns XP by winning battles
- After 10 wins: unit upgrades visually (sprite gets a glow border + level badge)
- After 50 wins: unit gains a new ability tag based on its original NFT traits

**3. GROWERZ Hub leaderboard:**
- Expose `GET /api/growerz/rankings` → top GROWERZ by battle wins
- Embed as an iframe widget on the GROWERZ Hub site
- Leaderboard shows: NFT name, rank, wins, losses, zone count, BUDZ earned

**4. Cross-site rewards:**
- GROWERZ Hub can call `POST /api/rewards/growerz-activity` with a signed message
- This grants BUDZ for off-chain GROWERZ Hub activity (staking, voting, social tasks)
- Verify with: `nacl.sign.detached.verify(message, signature, pubkey)` in server routes

**5. GROWERZ-exclusive cards:**
- Cards with `isNFTConnected: true` cannot be traded or sold — bound to the wallet
- These "soul-bound" cards show an NFT badge and the GROWERZ mint address on the card face
- They are excluded from the trade market (`card_trades` table rejects them)

---

## System 7: Dope Budz Connection

### What Dope Budz is
Dope Budz is the parent app sharing the Helium PostgreSQL database with THC CLASH. It's the main BUDZ token economy hub. THC CLASH reads and writes to shared tables.

### Current connection
- Shared `users` table: `budz_balance`, `gbux_balance`, `thc_labz_balance` columns are read/written by both apps
- BUDZ token: `BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT` (SPL token)
- DB at: `postgresql://postgres:password@helium/heliumdb` (via `GAME_DATABASE_URL`)

### BUDZ economy flows

| Action | BUDZ delta |
|---|---|
| Win PvE battle | +15 |
| Win PvP battle | +30 |
| Daily login bonus | +5 |
| Open free pack | 0 (free) |
| Open Green Bag pack | -20 |
| Open Dank Pack | -60 |
| Open Legendary Kush | -150 |
| Wager win | +wager amount |
| Collect zone income | +varies |
| Scratch card win | +varies |
| Trade a card (seller) | +asking price |
| Buy traded card | -asking price |

### Extending BUDZ utility

**1. BUDZ staking (earn while idle):**
```sql
CREATE TABLE budz_stakes (
  wallet_address TEXT PRIMARY KEY,
  staked_amount INTEGER,
  staked_at TIMESTAMPTZ,
  lock_days INTEGER DEFAULT 7,
  apy_percent NUMERIC DEFAULT 12.0
);
```
- `POST /api/stake/create` — lock BUDZ for 7/14/30 days
- `POST /api/stake/claim` — claim accrued interest
- Staked BUDZ are deducted from spendable balance but show in portfolio

**2. BUDZ → GBUX conversion:**
- Rate: 10 BUDZ = 1 GBUX (already defined in app)
- Endpoint: `POST /api/convert/budz-to-gbux { amount }`
- Minimum conversion: 100 BUDZ (10 GBUX)

**3. BUDZ leaderboard:**
- Add `total_budz_earned` cumulative column to `users` (never decremented on spend)
- Weekly top earners receive GBUX bonus automatically (existing `weeklyRewards.ts`)

**4. Dope Budz → THC CLASH bridge events:**
- If Dope Budz fires an event webhook to `POST /api/webhooks/budz-event`:
  ```json
  { "type": "DOPE_REWARD", "wallet": "...", "amount": 50, "reason": "daily-checkin" }
  ```
- THC CLASH credits the BUDZ and shows a banner: "🌿 +50 BUDZ from Dope Budz!"
- Prevents double-credit via `budz_events` deduplication table with `event_id` unique key

**5. Shared leaderboard:**
- Expose `GET /api/leaderboard/combined` that reads from shared helium DB
- Merges THC CLASH battle trophies with Dope Budz BUDZ balance into one ranked list
- Displayed on both apps using the same endpoint

---

## AI Integration Points

### Using OpenAI in THC CLASH

The game has an OpenAI integration (`javascript_openai` connector). Use it to:

**1. AI dungeon master for campaign lore:**
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are the battle narrator for THC CLASH, a cannabis-themed card battle game. Describe battle events in 1-2 sentences with stoner humour.' },
    { role: 'user', content: `Player deployed ${card.name}. Generate a deployment quip.` }
  ],
  max_tokens: 80
});
```

**2. AI card balancing assistant:**
- Feed the AI a list of card stats + win rates
- Ask it to suggest balance adjustments (nerfs/buffs)
- Apply suggestions via the admin card edit endpoint

**3. AI campaign stage generator:**
- Give AI the campaign theme + target difficulty
- It outputs a full JSON stage object (see Campaign section above)
- Auto-populates admin panel stage creation form

**4. Dynamic battle commentary:**
- Subscribe to battle events (unit kill, tower destroyed, low health)
- Send event to AI → receive short commentary string
- Display as floating text above the arena

### Using Puter.js for asset generation

Puter.js (`window.puter.ai.txt2img`) is the free image generation layer. No API key required.

```typescript
// Check availability before calling
if (!window.puter?.ai?.txt2img) {
  console.warn('Puter not available — using fallback image');
  return null;
}

const img = await window.puter.ai.txt2img(
  'THC CLASH game card art, [card name], cannabis themed, vibrant neon cartoon, thick black outlines, Clash Royale art style',
  false  // false = no nsfw
);

// img is an HTMLImageElement — convert to blob URL for storage:
const canvas = document.createElement('canvas');
canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
canvas.getContext('2d')!.drawImage(img, 0, 0);
const url = canvas.toDataURL('image/webp', 0.85);
localStorage.setItem(`thc_card_art_v1_${cardId}`, JSON.stringify({ url, ts: Date.now() }));
```

**Cache pattern:** Always check `localStorage` before generating. TTL = 30 days (`ts + 30 * 86400000`).

---

## API Endpoints Reference

### Core game APIs

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/cards/active/gameplay` | All active cards for battle |
| POST | `/api/admin/cards` | Create card (admin auth) |
| GET | `/api/cards/owned/:wallet` | Player's owned cards |
| POST | `/api/cards/owned/add` | Add card to wallet |
| POST | `/api/cards/mint-nft` | Mint card as cNFT |
| GET | `/api/my-nfts/:wallet` | GROWERZ NFTs in wallet |
| POST | `/api/auth/wallet` | Wallet auth + user creation |
| GET | `/api/wallet/:wallet` | Token balances |

### Economy APIs

| Method | Path | Description |
|---|---|---|
| POST | `/api/card-shop/open-pack` | Open a card pack |
| POST | `/api/card-shop/verify-tx` | Verify on-chain payment |
| GET | `/api/trades` | Active trade listings |
| POST | `/api/trades/list` | List a card for trade |
| POST | `/api/trades/:id/accept` | Accept a trade |
| GET | `/api/leaderboard/weekly` | Top players this week |

---

## Environment Variables Reference

| Variable | Purpose |
|---|---|
| `GAME_DATABASE_URL` | Helium PostgreSQL (primary, shared with Dope Budz) |
| `DATABASE_URL` | Neon fallback PostgreSQL |
| `HELIUS_API_KEY` | Helius RPC for Solana NFT data |
| `SOLANA_RPC_URL` | Custom RPC endpoint |
| `OPENAI_API_KEY` | OpenAI for AI features |
| `AI_AGENT_PRIVATE_KEY` | BUDZ distributor wallet (server-side) |

---

## Deployment Notes

- App runs on port 5000 (Express + Vite SSR dev / static prod)
- Canvas-based battle runs entirely client-side — no server render
- Puter.js is loaded from CDN at `https://js.puter.com/v2/` — no key required
- GROWERZ NFT scan is expensive (~6s) — result cached in React state for session duration
- All Solana RPC calls go through `SOLANA_RPC_URL` → `HELIUS_API_KEY` → public mainnet-beta fallback
