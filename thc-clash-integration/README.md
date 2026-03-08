# THC CLASH — Dope-Budz Integration Package

This folder contains everything needed to add the full THC CLASH card battle system
to the `Dope-Budz` Replit project (`@grudgedev/Dope-Budz`).

## What's Included

```
thc-clash-integration/
├── db/
│   └── migrations.sql           ← Run this first (creates tables)
├── server/
│   ├── register-routes.ts       ← Wire into your Express app
│   └── routes/
│       ├── adminCards.ts        ← Admin card CRUD (74-card database)
│       ├── userCardsOwnership.ts ← Player card inventory
│       ├── cardTrades.ts        ← Peer-to-peer BUDZ marketplace
│       └── aiAgentManagement.ts ← AI agent wallet, auctions, prices
├── shared/
│   └── classificationCardDatabase.ts ← 74 unique cannabis card definitions
├── client/
│   └── utils/
│       └── Web3Purchase.ts      ← Solana transaction builder
└── assets/
    └── card-art/                ← Pack backgrounds + special card art
```

---

## Step 1 — Run DB Migrations

Connect to the helium database and run:
```bash
PGPASSWORD=password psql "postgresql://postgres:password@helium/heliumdb?sslmode=disable" \
  -f thc-clash-integration/db/migrations.sql
```

This creates:
- `admin_cards` — master card collection (74 unique cannabis cards already seeded)
- `user_cards` — player card ownership (with dedup constraint)
- `card_trades` — BUDZ-settled peer-to-peer marketplace

---

## Step 2 — Set Environment Variable

In the Dope-Budz Replit secrets panel, add:
```
GAME_DATABASE_URL = postgresql://postgres:password@helium/heliumdb?sslmode=disable
```

---

## Step 3 — Copy Server Files

Copy the `server/routes/` folder contents into:
```
dope-budz/server/routes/
```

Then copy `register-routes.ts` and add to your Express app initialization:
```typescript
// In server/index.ts or server/routes.ts
import { registerTHCClashRoutes } from './routes/register-routes';
registerTHCClashRoutes(app);
```

---

## Step 4 — Copy Card Shop Pack Endpoints

The pack opening endpoints (open-pack, free-pack, verify-tx) need to be copied
from `server/routes.ts` lines ~1830–2100 of the THC CLASH source into Dope-Budz's
main routes file. They reference internal PACK_CONFIG and require access to the
`adminCards` Drizzle ORM table.

---

## Step 5 — Copy Client Assets

Copy `assets/card-art/` into:
```
dope-budz/client/public/card-art/
```

---

## Step 6 — Add Client Components (Optional)

If you want the full pack shop and trading UI in Dope-Budz, copy these from
the THC CLASH source:
```
client/src/components/CardPackShop.tsx    → Dope-Budz pack shop
client/src/components/NFTTradePage.tsx    → Card marketplace
client/src/utils/Web3Purchase.ts          → Already in integration/client/utils/
```

---

## API Reference (All Routes)

### Card Collection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/cards` | All 74 cards (query: `?rarity=epic`) |
| GET | `/api/admin/cards/:id` | Single card |
| POST | `/api/admin/cards` | Add new card (admin) |

### Player Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards/owned/:wallet` | Player's owned cards (auto-seeds common starter pack) |
| POST | `/api/cards/owned/add` | Add card to inventory |
| PATCH | `/api/cards/owned/set-mint` | Link NFT mint to card |

### Card Marketplace (BUDZ)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades` | All active listings |
| GET | `/api/trades/my/:wallet` | Your listings |
| POST | `/api/trades/list` | List a card for sale |
| POST | `/api/trades/:id/accept` | Buy a card (deducts BUDZ from buyer, credits seller) |
| DELETE | `/api/trades/:id` | Cancel your listing |

### Pack Shop
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/card-shop/open-pack` | `{walletAddress, packType, paymentToken}` | Open with GBUX (server-side balance) |
| POST | `/api/card-shop/free-pack` | `{walletAddress}` | Free 3-card common pack |
| POST | `/api/card-shop/verify-tx` | `{signature, walletAddress, packType, paymentToken}` | Verify on-chain SOL/SPL payment and deliver cards |

Pack types: `green-bag` ($0.10 / 20 GBUX), `dank-pack` ($0.30 / 60 GBUX), `legend-kush` ($0.75 / 150 GBUX)

### AI Agent Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai-agent/management/prices` | Live token prices (SOL, GBUX, BUDZ, THC) |
| GET | `/api/ai-agent/management/pack-quote/:packType` | USD → token quotes for any pack |
| GET | `/api/ai-agent/management/treasury` | Treasury SOL balance |
| GET | `/api/ai-agent/management/dashboard` | Full status dashboard |
| POST | `/api/ai-agent/management/auction/list` | List card in auction |
| GET | `/api/ai-agent/management/auction/list` | Active auctions |
| POST | `/api/ai-agent/management/auction/:id/bid` | Place bid |
| POST | `/api/ai-agent/management/purchase-pack` | AI agent buys pack on-chain |
| POST | `/api/ai-agent/management/send-sol` | Server-side SOL transfer |

---

## Token Addresses (Solana Mainnet)

| Token | Mint Address |
|-------|-------------|
| GBUX | `55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray` |
| BUDZ | `2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ` |
| THC LABZ | `BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT` |
| Treasury | `2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ` |

---

## Database Summary

All data lives in the shared helium PostgreSQL database:
- **101 users** — existing Dope-Budz players automatically compatible
- **74 cards** in `admin_cards` — seeded and ready
- **user_cards** — persists across sessions (pack opens, trades all recorded)
- **card_trades** — full BUDZ settlement on buy/sell

---

## Card Rarity Distribution

| Rarity | Count | Pack Drop Rate (Green Bag) |
|--------|-------|---------------------------|
| Common | 15 | 70% |
| Uncommon | 15 | 25% |
| Rare | 16 | 5% |
| Epic | 16 | 0% |
| Legendary | 12 | 0% |

| Rarity | Dank Pack | Legendary Kush |
|--------|-----------|----------------|
| Common | 15% | 0% |
| Uncommon | 40% | 5% |
| Rare | 30% | 30% |
| Epic | 12% | 40% |
| Legendary | 3% | 25% |
