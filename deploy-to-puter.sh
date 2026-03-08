#!/bin/bash

# THC Dope Budz - Puter Deployment Script
# Automates the deployment process for Puter App hosting

echo "🚀 THC Dope Budz - Puter Deployment"
echo "==================================="

# Check if we're in the right directory
if [ ! -f "puter-deployment.js" ]; then
    echo "❌ Error: puter-deployment.js not found. Run this script from the project root."
    exit 1
fi

# Create puter deployment directory
echo "📁 Creating Puter deployment directory..."
mkdir -p ./puter-deploy

# Copy essential files for Puter
echo "📋 Copying files for Puter deployment..."
cp puter-deployment.js ./puter-deploy/
cp puter-app.json ./puter-deploy/
cp puter-wallet-adapter.js ./puter-deploy/
cp puter-package.json ./puter-deploy/package.json
cp -r attached_assets ./puter-deploy/
cp -r client ./puter-deploy/
cp -r server ./puter-deploy/
cp -r shared ./puter-deploy/

# Copy configuration files
cp package.json ./puter-deploy/package-full.json
cp tsconfig.json ./puter-deploy/
cp tailwind.config.ts ./puter-deploy/
cp vite.config.ts ./puter-deploy/
cp postcss.config.js ./puter-deploy/
cp drizzle.config.ts ./puter-deploy/

# Create simplified start script
cat > ./puter-deploy/start.js << 'EOF'
#!/usr/bin/env node

// Simple starter for Puter deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🌐 Starting THC Dope Budz for Puter...');

// Start the Puter deployment server
const server = spawn('node', ['puter-deployment.js'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: 'production',
        PUTER_APP_ID: 'app-8e279a43-403f-4783-a3ca-e1ea8f74b228'
    }
});

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});
EOF

chmod +x ./puter-deploy/start.js

# Create README for Puter deployment
cat > ./puter-deploy/README.md << 'EOF'
# THC Dope Budz - Puter Deployment

## Quick Start
```bash
node start.js
```

## Manual Start
```bash
node puter-deployment.js
```

## App ID
app-8e279a43-403f-4783-a3ca-e1ea8f74b228

## Features
- Web3 Solana wallet integration
- 70 achievements with BUDZ rewards
- NFT-gated AI assistant
- Dynamic music system
- Real cryptocurrency balances
EOF

echo "✅ Puter deployment package created in ./puter-deploy/"
echo ""
echo "Next steps:"
echo "1. cd ./puter-deploy/"
echo "2. node start.js"
echo "3. Access your game at http://localhost:3000"
echo ""
echo "🌐 Your Puter App ID: app-8e279a43-403f-4783-a3ca-e1ea8f74b228"