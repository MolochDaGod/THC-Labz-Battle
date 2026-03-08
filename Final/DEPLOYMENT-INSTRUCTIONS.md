# THC Dope Warz - Deployment Instructions

## Quick Deploy to Replit

### Step 1: Upload Final Directory
1. Upload the entire `Final` directory contents to a new Replit project
2. Ensure all files and folders are correctly transferred

### Step 2: Configure Environment Variables
Add these secrets in your Replit project:
- `DATABASE_URL` - Your PostgreSQL connection string
- `OPENAI_API_KEY` - For AI assistant features (optional but recommended)
- `HELIUS_PROJECT_ID` - For enhanced blockchain data (optional)
- `DISCORD_CLIENT_ID` - Discord OAuth (optional)
- `DISCORD_CLIENT_SECRET` - Discord OAuth (optional)
- `DISCORD_REDIRECT_URI` - Discord OAuth callback URL (optional)

### Step 3: Deploy
1. Click the "Deploy" button in your Replit project
2. Replit will automatically use the configuration in `deployment.toml`
3. Your app will be live at: `https://[your-repl-name].[your-username].replit.app`

## File Structure Verification

```
Final/
├── client/                 # React frontend
│   ├── src/               # React components and logic
│   ├── public/            # Static assets
│   └── index.html         # Main HTML file
├── server/                # Express backend
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database configuration
│   └── [other services]  # AI, achievements, etc.
├── shared/                # Shared TypeScript schemas
├── attached_assets/       # Game assets and media
├── package.json          # Dependencies and scripts
├── .replit               # Replit configuration
├── deployment.toml       # Deployment settings
├── start-production.js   # Production startup script
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── drizzle.config.ts     # Database ORM configuration
└── README.md             # Project documentation
```

## Features Included

### ✅ Complete Web3 Integration
- Multi-wallet Solana support (Phantom, Solflare, Magic Eden, Backpack)
- Real token balance fetching (BUDZ, GBUX, THC LABZ)
- Server-side wallet creation via Crossmint
- NFT ownership verification for THC LABZ GROWERZ collection

### ✅ AI-Powered Gameplay
- Conversational AI assistant with market intelligence
- NFT-based personality scaling
- Real-time trading advice for all 16 cities
- Dynamic market events and analysis

### ✅ Complete Achievement System
- 50 working achievements with BUDZ token rewards
- Maximum 1250 BUDZ per complete 45-day round
- AI agent wallet for reward distribution
- Progress tracking tied to complete game cycles

### ✅ Multi-Authentication Support
- SOL wallet connection (primary)
- Email OTP authentication
- Phone OTP authentication  
- Discord OAuth integration

### ✅ Production-Ready Features
- Comprehensive error handling and fallback systems
- Database fallback for uninterrupted gameplay
- Real-time system health monitoring
- Performance optimizations and memory management

## Deployment URL

Once deployed, your THC Dope Warz game will be accessible at:
**`https://[your-repl-name].[your-username].replit.app`**

## Support

If you encounter any issues during deployment:
1. Check that all required environment variables are set
2. Verify the database connection is working
3. Review the server logs for any startup errors
4. Ensure all files were transferred correctly to the Final directory

The application includes comprehensive fallback systems, so it will run even without all optional API keys configured.