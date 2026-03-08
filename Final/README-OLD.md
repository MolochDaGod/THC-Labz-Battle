# THC Dope Warz

A comprehensive Web3-enabled cannabis trading game built on Solana blockchain with AI-powered gameplay assistance.

## Features

- **Web3 Integration**: Full Solana wallet support with real token balances
- **NFT-Gated Features**: THC LABZ GROWERZ collection integration
- **AI Assistant**: Conversational AI with market intelligence and trading advice
- **Achievement System**: 50 achievements with BUDZ token rewards (max 1250 per round)
- **Multi-Authentication**: Wallet, email OTP, phone OTP, and Discord OAuth
- **Real Token Economy**: BUDZ, GBUX, and THC LABZ token integration
- **45-Day Game Cycles**: Complete economic simulation with leaderboard rewards

## Deployment

### Quick Start
```bash
npm install
npm run dev
```

### Production Deployment
```bash
npm run build
npm start
```

### Environment Variables
Required for full functionality:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For AI assistant features
- `HELIUS_PROJECT_ID` - For enhanced blockchain data
- `DISCORD_CLIENT_ID` - Discord OAuth
- `DISCORD_CLIENT_SECRET` - Discord OAuth
- `DISCORD_REDIRECT_URI` - Discord OAuth callback

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Solana Web3.js integration
- **3D Graphics**: Three.js via React Three Fiber
- **State Management**: Zustand + TanStack Query

## Game Features

### Core Gameplay
- Economic simulation with 16 cities
- Dynamic pricing and market events
- Inventory management and trading
- Risk/reward mechanics with police encounters
- Health, reputation, and debt systems

### Web3 Features
- Authentic wallet connections (Phantom, Solflare, Magic Eden, Backpack)
- Real server-side SOL wallet creation via Crossmint
- Live token balance fetching with Helius API
- NFT ownership verification and bonuses
- Token rewards distribution system

### AI Integration
- Master of Ceremonies AI with comprehensive market intelligence
- NFT-based personality scaling (rarity affects AI creativity)
- Real-time trading advice and profit route guidance
- Dynamic market analysis for all 16 cities
- Conversational interface for gameplay assistance

## Deployment Ready

This application is fully configured for Replit deployment with:
- Production-optimized startup scripts
- Comprehensive error handling and fallback systems
- Real-time system health monitoring
- Database fallback mechanisms for uninterrupted gameplay
- Multi-environment support (development/production)

Deploy URL will be: `https://[repl-name].[username].replit.app`

## License

MIT