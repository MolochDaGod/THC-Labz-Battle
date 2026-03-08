#!/usr/bin/env node
/**
 * THC Dope Budz - Production Server
 * Optimized for Replit and Puter deployment with comprehensive error handling
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS for production
app.use(cors({
  origin: ['https://thc-growerz.puter.site', 'https://replit.app', /\.replit\.app$/, /\.puter\.site$/],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets with proper headers
app.use('/attached_assets', express.static(join(__dirname, 'attached_assets'), {
  setHeaders: (res, path, stat) => {
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'THC Dope Budz',
    version: '1.0.0'
  });
});

// API routes fallback
app.get('/api/*', (req, res) => {
  console.log(`API fallback for: ${req.path}`);
  res.json({ 
    error: 'API service temporarily unavailable',
    fallback: true,
    timestamp: new Date().toISOString()
  });
});

// Serve built frontend
const distPath = join(__dirname, 'dist', 'public');
const clientDistPath = join(__dirname, 'client', 'dist');

if (existsSync(distPath)) {
  console.log('✅ Serving from dist/public');
  app.use(express.static(distPath));
} else if (existsSync(clientDistPath)) {
  console.log('✅ Serving from client/dist');
  app.use(express.static(clientDistPath));
} else {
  console.log('⚠️ No built assets found, serving development files');
  app.use(express.static(join(__dirname, 'client', 'public')));
}

// Catch-all for SPA routing
app.get('*', (req, res) => {
  try {
    let indexPath;
    
    if (existsSync(join(distPath, 'index.html'))) {
      indexPath = join(distPath, 'index.html');
    } else if (existsSync(join(clientDistPath, 'index.html'))) {
      indexPath = join(clientDistPath, 'index.html');
    } else if (existsSync(join(__dirname, 'client', 'index.html'))) {
      indexPath = join(__dirname, 'client', 'index.html');
    } else {
      throw new Error('No index.html found');
    }
    
    const html = readFileSync(indexPath, 'utf8');
    res.send(html);
  } catch (error) {
    console.error('❌ Error serving index.html:', error);
    res.status(500).send(`
      <html>
        <head><title>THC Dope Budz</title></head>
        <body style="background: #000; color: #0f0; font-family: monospace; padding: 20px;">
          <h1>🌿 THC Dope Budz Loading...</h1>
          <p>Service temporarily unavailable. Please refresh the page.</p>
          <script>setTimeout(() => location.reload(), 3000);</script>
        </body>
      </html>
    `);
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Production server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 THC Dope Budz production server running on port ${PORT}`);
  console.log(`🌐 Access via: http://localhost:${PORT}`);
  console.log(`📁 Serving from: ${__dirname}`);
  console.log(`🎮 Game ready for production deployment!`);
});