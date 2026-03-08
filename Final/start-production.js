#!/usr/bin/env node
/**
 * THC Dope Budz - Production Starter
 * Fixes black screen issues and ensures proper deployment
 */

const express = require('express');
const path = require('path');
const { readFileSync, existsSync } = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🎮 THC Dope Budz - Starting Production Server...');

// Enhanced CORS for all environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'THC Dope Budz Production'
  });
});

// Static assets with proper headers
app.use('/attached_assets', express.static(path.join(__dirname, 'attached_assets'), {
  setHeaders: (res, path, stat) => {
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// API fallback routes
app.get('/api/*', (req, res) => {
  console.log(`API fallback for: ${req.path}`);
  res.json({ 
    error: 'API service temporarily unavailable in static mode',
    fallback: true,
    message: 'Game runs in demo mode without backend features'
  });
});

// Try multiple static file locations
const staticPaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'client', 'dist'), 
  path.join(__dirname, 'client', 'public'),
  path.join(__dirname, 'public'),
  __dirname
];

let staticPath = null;
for (const p of staticPaths) {
  if (existsSync(p)) {
    staticPath = p;
    console.log(`✅ Serving static files from: ${staticPath}`);
    break;
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
} else {
  console.log('⚠️ No static files found, serving minimal fallback');
}

// Enhanced SPA fallback with multiple index.html locations
app.get('*', (req, res) => {
  const indexPaths = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'client', 'dist', 'index.html'),
    path.join(__dirname, 'client', 'index.html'),
    path.join(__dirname, 'index.html')
  ];

  let indexPath = null;
  for (const p of indexPaths) {
    if (existsSync(p)) {
      indexPath = p;
      break;
    }
  }

  if (indexPath) {
    try {
      const html = readFileSync(indexPath, 'utf8');
      res.send(html);
    } catch (error) {
      console.error('❌ Error reading index.html:', error);
      res.status(500).send(getFallbackHTML());
    }
  } else {
    console.log('⚠️ No index.html found, serving fallback HTML');
    res.send(getFallbackHTML());
  }
});

function getFallbackHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>THC Dope Budz</title>
    <style>
        body {
            background: linear-gradient(135deg, #000000, #1a4c20);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 40px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            text-shadow: 0 0 10px #00ff00;
        }
        .status {
            font-size: 1.2rem;
            margin: 20px 0;
        }
        .loading {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .retry-btn {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 15px 30px;
            font-size: 1.1rem;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
            font-weight: bold;
        }
        .retry-btn:hover {
            background: #00cc00;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌿 THC DOPE BUDZ</h1>
        <div class="status loading">Loading Production Game...</div>
        <p>If the game doesn't load automatically, try:</p>
        <ul style="text-align: left; display: inline-block;">
            <li>Refresh the page (Ctrl+F5)</li>
            <li>Clear browser cache</li>
            <li>Check JavaScript is enabled</li>
            <li>Try a different browser</li>
        </ul>
        <button class="retry-btn" onclick="location.reload()">🔄 Refresh Game</button>
    </div>
    
    <script>
        // Auto-refresh after 5 seconds
        setTimeout(() => {
            if (!document.querySelector('#root') && !document.querySelector('.game-container')) {
                console.log('Game not detected, attempting refresh...');
                location.reload();
            }
        }, 5000);
        
        // Check for game elements periodically
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            checkCount++;
            if (document.querySelector('#root') || document.querySelector('.game-container')) {
                document.querySelector('.status').textContent = '✅ Game Loaded Successfully!';
                clearInterval(checkInterval);
            } else if (checkCount > 20) {
                document.querySelector('.status').textContent = '⚠️ Game loading delayed. Please refresh.';
                clearInterval(checkInterval);
            }
        }, 1000);
    </script>
</body>
</html>
  `;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 THC Dope Budz production server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${__dirname}`);
  console.log(`🎮 Game ready for production deployment!`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});