# THC Dope Budz - Puter App Deployment Guide

## Overview

THC Dope Budz is now fully compatible with Puter App deployment, providing seamless Web3 integration within the Puter ecosystem. This deployment maintains all game features while optimizing for Puter's environment.

## Quick Deployment

### Option 1: Direct Puter Deployment
```bash
# Copy files to Puter app directory
cp puter-deployment.js /path/to/puter/apps/thc-dope-budz/
cp puter-app.json /path/to/puter/apps/thc-dope-budz/
cp puter-wallet-adapter.js /path/to/puter/apps/thc-dope-budz/

# Start the Puter app
node puter-deployment.js
```

### Option 2: Development Mode
```bash
# Run in Puter development mode
npm run puter
```

## Puter App Configuration

### App Manifest (puter-app.json)
- **Name**: THC Dope Budz
- **Category**: Games > Strategy
- **Web3**: Full Solana integration
- **Permissions**: Wallet connect, blockchain read, local storage
- **Features**: 70 achievements, NFT gating, crypto rewards

### Wallet Support in Puter
- ✅ Phantom (Primary)
- ✅ Solflare
- ✅ Backpack
- ✅ Magic Eden
- ✅ Glow (Mobile)
- ✅ Phantom Browser optimized

## Features in Puter Environment

### Web3 Integration
- **Solana Wallet Connection**: Automatic detection and connection
- **Real Token Balances**: BUDZ, GBUX, THC LABZ tokens
- **NFT Detection**: GROWERZ collection for AI assistant
- **Transaction Signing**: Full transaction support

### Game Features
- **70 Achievements**: Earn up to 1,400 BUDZ per round
- **AI Assistant**: NFT-gated conversational AI
- **Dynamic Music**: State-based soundtrack
- **Leaderboards**: Weekly crypto rewards
- **Mobile Optimized**: Touch-friendly interface

### Puter Optimizations
- **Environment Detection**: Automatic Puter compatibility
- **Enhanced CORS**: Puter domain support
- **Health Checks**: `/health` endpoint for monitoring
- **Proxy Support**: API proxying for seamless integration

## API Endpoints

### Core Endpoints
- `GET /` - Puter app homepage
- `GET /health` - Health check
- `GET /puter-app.json` - App metadata
- `GET /game` - Launch game interface

### Wallet Integration
- Automatic wallet detection
- Multi-wallet support
- Transaction signing
- Balance fetching

## Environment Variables

### Required
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection

### Optional
- `OPENAI_API_KEY` - AI assistant (recommended)
- `HELIUS_PROJECT_ID` - Enhanced blockchain data
- `NODE_ENV` - Set to 'puter' for Puter-only mode

## Deployment Steps

### 1. Prepare Files
```bash
# Copy core files
cp -r client/ /puter/apps/thc-dope-budz/
cp -r server/ /puter/apps/thc-dope-budz/
cp -r shared/ /puter/apps/thc-dope-budz/
cp -r attached_assets/ /puter/apps/thc-dope-budz/

# Copy Puter-specific files
cp puter-deployment.js /puter/apps/thc-dope-budz/
cp puter-app.json /puter/apps/thc-dope-budz/
cp puter-wallet-adapter.js /puter/apps/thc-dope-budz/
```

### 2. Install Dependencies
```bash
cd /puter/apps/thc-dope-budz/
npm install express cors
```

### 3. Start App
```bash
node puter-deployment.js
```

### 4. Register with Puter
```bash
# Register app with Puter system using your App ID
puter app register app-8e279a43-403f-4783-a3ca-e1ea8f74b228
```

## Testing in Puter

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. App Metadata
```bash
curl http://localhost:3000/puter-app.json
```

### 3. Wallet Connection
- Open app in Puter
- Connect Phantom or other Solana wallet
- Verify real token balances load

## Troubleshooting

### Common Issues

#### Wallet Not Detected
- Ensure Phantom or Solflare is installed
- Check browser console for wallet detection logs
- Verify Puter environment permissions

#### CORS Issues
- Puter domains are whitelisted in CORS config
- Check `Access-Control-Allow-Origin` headers

#### Database Connection
- Ensure `DATABASE_URL` is set
- Check PostgreSQL connection in Puter environment

### Debug Mode
```bash
NODE_ENV=development node puter-deployment.js
```

## Security Considerations

### Web3 Security
- All wallet connections are client-side
- No private keys stored on server
- Transaction signing requires user approval

### Puter Environment
- Sandboxed execution
- Limited file system access
- Network restrictions apply

## Performance Optimization

### Puter-Specific
- Minimal resource usage
- Efficient wallet detection
- Optimized API responses

### Game Performance
- Asset caching
- Lazy loading
- Mobile optimizations

## Support

### Game Issues
- Check console logs for wallet detection
- Verify Web3 wallet permissions
- Ensure Solana network connectivity

### Puter Issues
- Check Puter app permissions
- Verify app registration
- Review Puter documentation

## Updates

### Version 1.0.0
- Initial Puter compatibility
- Full Web3 integration
- 70 achievement system
- NFT-gated AI assistant
- Dynamic music system
- Mobile optimization

---

**Ready for Puter deployment!** Your THC Dope Budz game is now fully compatible with Puter App hosting while maintaining all Web3 features and crypto rewards.