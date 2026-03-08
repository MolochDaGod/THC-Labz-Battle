#!/usr/bin/env node

/**
 * Simple Puter Server for THC Dope Budz
 * Lightweight server for Puter App deployment
 */

import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const APP_ID = 'app-8e279a43-403f-4783-a3ca-e1ea8f74b228';

// MIME types for static file serving
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Simple HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Add CORS headers for Puter compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Puter-App-ID');
  res.setHeader('X-Puter-Compatible', 'true');
  res.setHeader('X-Puter-App-ID', APP_ID);

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`📡 ${req.method} ${pathname}`);

  // Routes
  switch (pathname) {
    case '/':
      servePuterHomepage(res);
      break;
    
    case '/health':
      serveHealth(res);
      break;
    
    case '/puter-app.json':
      servePuterAppJson(res);
      break;
    
    case '/game':
      serveGameRedirect(res);
      break;
    
    default:
      // Try to serve static file
      serveStaticFile(pathname, res);
  }
});

// Serve Puter homepage
function servePuterHomepage(res) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>THC Dope Budz - Puter App</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          max-width: 800px;
          padding: 40px 20px;
        }
        .logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          background: url('/attached_assets/thclogo.png') center/contain no-repeat;
          border-radius: 50%;
          border: 3px solid #00ff88;
        }
        h1 {
          font-size: 2.5em;
          margin: 20px 0;
          background: linear-gradient(45deg, #00ff88, #0066ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .status {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid #00ff88;
          border-radius: 10px;
          padding: 20px;
          margin: 30px 0;
        }
        .launch-btn {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(45deg, #00ff88, #0066ff);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          font-size: 1.1em;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
        }
        .launch-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 255, 136, 0.3);
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        .feature {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.9em;
        }
        .puter-badge {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ff6b6b;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: bold;
        }
        .app-id {
          font-size: 0.7em;
          opacity: 0.6;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="puter-badge">🌐 Puter App</div>
      <div class="container">
        <div class="logo"></div>
        <h1>THC Dope Budz</h1>
        <p>Web3 Cannabis Trading Game</p>
        
        <div class="status">
          <h3>🚀 Ready for Puter</h3>
          <p>Full Web3 wallet integration • Real crypto rewards • 70 achievements</p>
        </div>
        
        <button class="launch-btn" onclick="launchGame()">🎮 Launch Game</button>
        
        <div class="features">
          <div class="feature">
            <h4>🌿 70 Achievements</h4>
            <p>Earn BUDZ tokens</p>
          </div>
          <div class="feature">
            <h4>🤖 AI Assistant</h4>
            <p>NFT-gated guide</p>
          </div>
          <div class="feature">
            <h4>💰 Real Crypto</h4>
            <p>BUDZ, GBUX, THC LABZ</p>
          </div>
          <div class="feature">
            <h4>🏆 Leaderboards</h4>
            <p>Weekly prizes</p>
          </div>
        </div>
        
        <div class="app-id">
          App ID: ${APP_ID}
        </div>
      </div>
      
      <script>
        console.log('🌐 THC Dope Budz Puter App loaded');
        console.log('📱 App ID: ${APP_ID}');
        
        // Puter integration
        if (window.puter) {
          console.log('✅ Puter environment detected');
          window.puter.ready(() => {
            console.log('🚀 Puter ready for THC Dope Budz');
          });
        }
        
        function launchGame() {
          // For now, redirect to main game server
          window.location.href = 'http://localhost:5000';
        }
        
        // Check for Web3 wallets
        if (window.solana || window.phantom) {
          console.log('🔗 Web3 wallet detected');
          document.querySelector('.status h3').textContent = '🔗 Web3 Wallet Ready';
        }
      </script>
    </body>
    </html>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

// Serve health check
function serveHealth(res) {
  const health = {
    status: 'healthy',
    app: 'THC Dope Budz',
    platform: 'Puter',
    appId: APP_ID,
    timestamp: new Date().toISOString(),
    features: {
      web3: true,
      phantom: true,
      solana: true,
      achievements: 70,
      tokens: ['BUDZ', 'GBUX', 'THC LABZ']
    }
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(health, null, 2));
}

// Serve Puter app manifest
function servePuterAppJson(res) {
  const manifest = {
    name: 'THC Dope Budz',
    version: '1.0.0',
    description: 'Web3 Cannabis Trading Game',
    author: 'THC Labz',
    category: 'games',
    appId: APP_ID,
    web3: {
      supported: true,
      networks: ['solana'],
      wallets: ['phantom', 'solflare', 'backpack']
    },
    permissions: [
      'wallet.connect',
      'blockchain.read',
      'storage.local'
    ]
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(manifest, null, 2));
}

// Serve game redirect
function serveGameRedirect(res) {
  res.writeHead(302, { 'Location': 'http://localhost:5000' });
  res.end();
}

// Serve static files
function serveStaticFile(pathname, res) {
  const filePath = path.join(__dirname, pathname);
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Internal Server Error</h1>');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 THC Dope Budz - Puter App Server');
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌐 App ID: ${APP_ID}`);
  console.log(`🔗 Access: http://localhost:${PORT}`);
  console.log(`💊 Health: http://localhost:${PORT}/health`);
  console.log('✅ Ready for Puter deployment!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down Puter app...');
  server.close(() => {
    process.exit(0);
  });
});