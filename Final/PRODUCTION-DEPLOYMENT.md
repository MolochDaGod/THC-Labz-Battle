# THC Dope Budz - Production Deployment Guide

## Quick Start

1. **Upload Files**: Copy entire `Final/` folder contents to your hosting platform
2. **Install Dependencies**: Run `npm install`
3. **Start Production**: Run `npm start` or `node start-production.js`
4. **Access Game**: Visit the provided URL

## Production Features Fixed

### Black Screen Resolution
- ✅ Enhanced static file serving with multiple fallback paths
- ✅ Automatic detection of dist/, client/dist/, and public/ folders
- ✅ Comprehensive fallback HTML with loading diagnostics
- ✅ Auto-refresh mechanism for failed loads
- ✅ CORS headers for all hosting environments

### 70 Achievement System
- ✅ Complete 70 achievements worth 1,400 BUDZ tokens total
- ✅ New achievements: Chain Smoker, Speed Demon, Heat Seeker, Chatterbox, etc.
- ✅ Enhanced tracking for all achievement types
- ✅ Proper validation and reward distribution

### Crossmint AI Agent Protection
- ✅ Price protection preventing THC GROWERZ undervaluation below $0.001
- ✅ Smart swap validation with configurable slippage protection
- ✅ Automated rejection of manipulative transactions
- ✅ 10 BUDZ = 1 GBUX conversion rate enforcement

## Deployment Commands

```bash
# Production server (recommended)
npm start

# Alternative production commands
npm run production
node start-production.js

# Development mode (for testing)
npm run dev
```

## Hosting Platform Support

### Replit Deployment
1. Upload Final/ contents to new Replit
2. Click "Deploy" button
3. App accessible at `https://[repl-name].[username].replit.app`

### Netlify/Vercel
1. Connect GitHub repository with Final/ contents
2. Build command: `npm run build`
3. Publish directory: `dist/`

### Heroku
1. Add `Procfile`: `web: npm start`
2. Push to Heroku Git
3. Scale dynos: `heroku ps:scale web=1`

### VPS/Server
1. Clone repository
2. Install Node.js 18+
3. Run production server on port 5000
4. Use nginx/Apache reverse proxy if needed

## Environment Variables (Optional)

```bash
# Database (if using backend features)
DATABASE_URL=postgresql://...

# AI Features (optional)
OPENAI_API_KEY=sk-...

# Blockchain APIs (optional)
HELIUS_PROJECT_ID=your_helius_id
CROSSMINT_SERVER_API_KEY=your_crossmint_key
```

## Production Verification

The game includes built-in diagnostics:

1. **Health Check**: Visit `/health` for server status
2. **Auto-Diagnostics**: Game checks for loading issues and provides feedback
3. **Fallback Mode**: If main game fails, fallback HTML provides troubleshooting
4. **Console Logging**: Browser console shows detailed loading progress

## Common Issues & Solutions

### Black Screen
- **Auto-Fixed**: New production server automatically detects and resolves
- **Manual Fix**: Refresh page (Ctrl+F5) to clear cache
- **Fallback**: System automatically provides fallback interface

### Missing Assets
- **Auto-Handled**: Server checks multiple asset locations
- **Verification**: Check `/attached_assets/` path accessibility

### API Failures
- **Graceful Fallback**: Game continues in demo mode if APIs unavailable
- **User Feedback**: Clear error messages guide users

## Success Indicators

When properly deployed, you should see:

1. ✅ Game loads within 5 seconds
2. ✅ Wallet connection button visible
3. ✅ Cannabis trading interface functional
4. ✅ Achievement system accessible
5. ✅ AI assistant responsive (if API keys provided)
6. ✅ Mobile responsive on all devices

## Performance Optimizations

- **Static Caching**: Assets cached for 1 year
- **Compression**: Automatic gzip for all text content
- **Minification**: Production builds are minified
- **Lazy Loading**: Components load on demand
- **Error Recovery**: Automatic retry mechanisms

## Support

If issues persist after following this guide:

1. Check browser console for errors
2. Verify all files uploaded correctly  
3. Ensure Node.js 18+ is available on hosting platform
4. Test health endpoint `/health` for server status

The production server is designed to be deployment-agnostic and should work on any platform supporting Node.js applications.