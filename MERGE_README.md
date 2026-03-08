# THC CLASH × DOPE BUDZ — Merge Guide

This document describes every file, integration point, and token that needs to be merged when combining **THC CLASH** (this repo) with the **Dope Budz** game.

---

## 1. Shared Token Economy

All three tokens are shared across both games:

| Token     | Mint                                          | Decimals | Role                          |
|-----------|-----------------------------------------------|----------|-------------------------------|
| BUDZ      | `2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ` | 6        | Primary cross-game currency   |
| GBUX      | `55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray` | 6        | Clash battle rewards          |
| THC LABZ  | `BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT` | 6        | Premium NFT utility token     |

Central config: `client/src/config/tokens.ts`

---

## 2. Crossmint Integration

### Required Environment Variables

```env
CROSSMINT_SERVER_API_KEY=...          # Server-side Crossmint key
CROSSMINT_PROJECT_ID=...              # Project ID from Crossmint console
VITE_CROSSMINT_CLIENT_API_KEY=...     # Client-side (public) key
VITE_CROSSMINT_PROJECT_ID=...         # Same project ID for client
VITE_CROSSMINT_ENV=production         # or 'staging' for test
```

### Files

| File | Purpose |
|------|---------|
| `server/crossmint.ts` | Server SDK — wallet creation, transactions |
| `server/crossmint-auth.ts` | Multi-auth: wallet, email, phone, Discord |
| `server/crossmint-ai-agent.ts` | AI price protection for token swaps |
| `client/src/config/crossmint.ts` | Client-side config and constants |
| `client/src/services/CrossmintService.ts` | Client API wrapper class |
| `client/src/hooks/useCrossmint.ts` | React hook for auth state |
| `client/src/components/CrossmintWalletConnect.tsx` | Drop-in auth UI component |
| `client/src/types/crossmint.d.ts` | TypeScript type definitions |

### Auth Flow

1. User clicks Connect → `CrossmintWalletConnect` component
2. Chooses: Solana wallet / Email OTP / Phone OTP / Discord
3. Server creates or retrieves user → issues JWT token
4. Token stored in `localStorage` → `CrossmintService.loadSession()` restores on page load
5. Server wallet created automatically via Crossmint API

### NFT Minting

Cards can be minted as on-chain Solana NFTs:
```ts
await CrossmintService.mintNFT({
  collectionId: 'thc-growerz',
  recipient:    'walletAddress:solana:ABC123...',
  metadata:     { name, image, description, attributes },
});
```

---

## 3. Dope Budz Bridge

### Files

| File | Purpose |
|------|---------|
| `server/dope-budz-ai-controller.ts` | OpenAI-powered game validation |
| `server/routes/dopeBudz.ts` | REST API for Dope Budz game ↔ THC CLASH |
| `client/src/services/DopeBudzService.ts` | Client service for all Dope Budz calls |
| `client/src/types/dopeBudz.d.ts` | TypeScript type definitions |

### API Routes (`/api/dope-budz/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/player/:wallet` | Get player profile + stats |
| POST | `/state` | Save game state to DB |
| GET  | `/state/:wallet` | Load game state from DB |
| GET  | `/market/:city` | Get seeded market prices for city |
| GET  | `/missions/:wallet` | Get available missions + progress |
| POST | `/missions/claim` | Claim mission reward |
| GET  | `/leaderboard` | Top players by score |
| GET  | `/bridge/:wallet` | Cross-game stats bridge |
| POST | `/ai-validate` | AI game state validation |
| POST | `/validate` | Full AI validation + optimization |

### Cross-Game Events

When a THC CLASH battle ends, call `DopeBudzService.recordClashResult()` to:
- Award BUDZ tokens for the battle result
- Update the cross-game bridge stats
- Sync win streak / achievement data

```ts
const service = new DopeBudzService(walletAddress);
await service.recordClashResult({
  won:          true,
  trophyChange: +30,
  streakCount:  3,
  isPerfectWin: false,
});
```

---

## 4. GROWERZ NFT Integration

### NFT → Battle Card Conversion

`client/src/utils/GrowerzUnitSystem.ts` — `nftToGrowerzUnitCard(nft)`

Each NFT becomes a `GrowerzUnitCard` with:
- `bgTrait` — background trait → card background image via `getGrowerzCardBg()`
- `traits` — all 6 trait types (background, skin, clothes, head, mouth, eyes)
- Stats derived deterministically from traits

### Background Images

Pre-generated AI backgrounds in `client/public/card-backgrounds/growerz/`:
- `dark-gray.png`, `gold.png`, `green.png`, `starz-and-stripez.png`
- `thc-labz.png`, `beige.png`, `solana.png`, `sunrise.png`

Mapped by trait name in `client/src/utils/growerzCardBg.ts`.

### Dope Budz NFT Bonuses

| Background Trait | Dope Budz Bonus |
|-----------------|-----------------|
| Gold             | +20% BUDZ earnings |
| Starz and Stripez | Heat -1 per city |
| THC Labz         | Unlock exclusive THC Labz OG strain |
| Solana           | +10% sell price in all cities |
| Sunrise          | +1 inventory slot per trait |
| Green            | Reputation never drops below 30 |
| Dark Gray        | Police bribe cost -25% |
| Beige            | Travel cost -50% |

---

## 5. Database

### Shared DB Connection

Both games use the **same Helium PostgreSQL database** via `GAME_DATABASE_URL`.

```env
GAME_DATABASE_URL=postgresql://...    # Primary — Helium shared DB
DATABASE_URL=postgresql://...         # Fallback — Neon serverless
```

### Key Tables Used

| Table | Used By |
|-------|---------|
| `users` | Auth, BUDZ/GBUX/THC balances |
| `player_progress` | Game state, scores, sessions |
| `admin_cards` | THC CLASH card pool |
| `user_cards` | Card ownership, NFT mints |
| `leaderboard` | High scores |
| `nft_bonuses` | Trait → game bonus mappings |

---

## 6. Files to Copy When Merging

### Copy FROM this repo to Dope Budz

```
client/src/config/tokens.ts
client/src/config/crossmint.ts
client/src/types/crossmint.d.ts
client/src/types/dopeBudz.d.ts
client/src/services/CrossmintService.ts
client/src/hooks/useCrossmint.ts
client/src/components/CrossmintWalletConnect.tsx
client/src/services/DopeBudzService.ts
client/src/utils/GrowerzUnitSystem.ts
client/src/utils/growerzCardBg.ts
client/public/card-backgrounds/growerz/ (entire folder)
```

### Copy FROM Dope Budz to this repo

```
DopeWarsGame component + routes
Dope Budz market price oracle
Strain inventory system
City travel logic
```

---

## 7. Required NPM Packages

Already installed in `package.json`:

```
@crossmint/connect        ^0.11.0-alpha.1
@crossmint/server-sdk     ^1.2.59
@crossmint/wallets-sdk    ^0.19.0
@solana/web3.js           ^1.98.4
@solana/spl-token         ^0.4.13
twilio                    ^5.12.2       (for SMS OTP)
```

---

## 8. Environment Secrets Checklist

```env
# Crossmint
CROSSMINT_SERVER_API_KEY=
CROSSMINT_PROJECT_ID=
VITE_CROSSMINT_CLIENT_API_KEY=
VITE_CROSSMINT_PROJECT_ID=
VITE_CROSSMINT_ENV=production

# Solana
VITE_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=...
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...

# Database
GAME_DATABASE_URL=postgresql://...
DATABASE_URL=postgresql://...

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# OpenAI (AI validation)
OPENAI_API_KEY=
OPENAI_API_KEY_DOPE_BUDZ=

# Optional
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

---

## 9. Quick Integration Test

After merging, verify these endpoints:

```bash
# Dope Budz routes
curl /api/dope-budz/market/Bronx
curl /api/dope-budz/leaderboard
curl /api/dope-budz/player/<wallet>

# Battle rewards
curl -X POST /api/battle/win-reward -d '{"walletAddress":"...","budzReward":10000}'

# Crossmint auth
curl -X POST /api/auth/wallet -d '{"walletAddress":"...","signature":"...","nonce":"..."}'
```
