# THC Dope Budz - Puter Deployment Instructions

## ✅ Ready for Puter Deployment!

Your THC Dope Budz game is now configured and ready for Puter App deployment with your dedicated App ID: **app-8e279a43-403f-4783-a3ca-e1ea8f74b228**

## 🚀 Quick Deployment Steps

### 1. Navigate to Puter Deployment Directory
```bash
cd ./puter-deploy
```

### 2. Start the Puter Server
```bash
node simple-puter-server.js
```

### 3. Access Your Puter App
- **Homepage**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **App Manifest**: http://localhost:3000/puter-app.json
- **Launch Game**: http://localhost:3000/game (redirects to main game)

## 📁 Deployment Package Contents

Your `./puter-deploy/` directory contains:

### Core Files
- `simple-puter-server.js` - Lightweight Puter server
- `puter-app.json` - App manifest with your App ID
- `package.json` - Puter-specific package configuration

### Assets & Code
- `attached_assets/` - Game assets (logo, images, videos)
- `client/` - Frontend React application
- `server/` - Backend API and services
- `shared/` - Shared types and schemas

### Configuration
- `tailwind.config.ts` - Styling configuration
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration

## 🌐 Puter App Features

Your deployment includes:

### Web3 Integration
- **Solana Wallet Support**: Phantom, Solflare, Backpack, Magic Eden
- **Real Token Balances**: BUDZ, GBUX, THC LABZ tokens
- **NFT Detection**: GROWERZ collection for AI assistant
- **Phantom Browser Optimized**: Enhanced for Web3 browsers

### Game Features
- **70 Achievements**: Up to 1,400 BUDZ tokens per round
- **AI Assistant**: NFT-gated conversational AI
- **Dynamic Music**: State-based soundtrack
- **Leaderboards**: Weekly crypto rewards
- **Mobile Optimized**: Touch-friendly interface

## 📱 App Configuration

### App ID
```
app-8e279a43-403f-4783-a3ca-e1ea8f74b228
```

### Permissions
- `wallet.connect` - Connect Solana wallets
- `blockchain.read` - Read blockchain data
- `storage.local` - Local storage for game state

### CORS Setup
Your app is configured for Puter with proper CORS headers:
- `*.puter.com` domains whitelisted
- `X-Puter-App-ID` header included
- Web3 wallet permissions enabled

## 🔧 Testing Your Deployment

### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "app": "THC Dope Budz",
  "platform": "Puter",
  "appId": "app-8e279a43-403f-4783-a3ca-e1ea8f74b228",
  "features": {
    "web3": true,
    "phantom": true,
    "solana": true,
    "achievements": 70,
    "tokens": ["BUDZ", "GBUX", "THC LABZ"]
  }
}
```

### 2. App Manifest
```bash
curl http://localhost:3000/puter-app.json
```

### 3. Homepage
Open http://localhost:3000 in your browser to see the Puter app interface

## 🎮 Game Launch

### Method 1: Direct Launch
Click "🎮 Launch Game" button on the homepage

### Method 2: Direct URL
Navigate to http://localhost:3000/game

### Method 3: Main Game Server
Your main game runs on port 5000: http://localhost:5000

## 🔧 Production Deployment

### For Puter Cloud Hosting
1. Upload your `./puter-deploy/` directory to Puter
2. Register your app with Puter using your App ID
3. Configure environment variables if needed
4. Start the server with `node simple-puter-server.js`

### Environment Variables (Optional)
```bash
PORT=3000                                          # Server port
PUTER_APP_ID=app-8e279a43-403f-4783-a3ca-e1ea8f74b228  # Your App ID
```

## 🌟 Key Benefits

### Puter-Optimized
- Lightweight server (no external dependencies)
- Automatic Puter environment detection
- Proper CORS and security headers
- Health monitoring endpoints

### Web3 Ready
- Full Solana wallet integration
- Real cryptocurrency rewards
- NFT-gated features
- Phantom Browser optimized

### Production Ready
- Error handling and logging
- Graceful shutdown
- Static file serving
- API proxying to main game

## 📞 Support

### Common Issues
1. **Port 3000 busy**: Change port with `PORT=3001 node simple-puter-server.js`
2. **CORS errors**: Check Puter domain configuration
3. **Wallet connection**: Ensure Web3 wallet is installed

### Logs
Server logs include:
- Request routing
- Health checks
- Error handling
- Puter integration status

## 🎯 Next Steps

1. **Test locally**: Verify http://localhost:3000 works
2. **Deploy to Puter**: Upload files and register app
3. **Configure domains**: Set up custom domain if needed
4. **Monitor health**: Use /health endpoint for monitoring

Your THC Dope Budz game is now fully ready for Puter deployment with complete Web3 functionality and your dedicated App ID!