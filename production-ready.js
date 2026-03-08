#!/usr/bin/env node

/**
 * THC Dope Budz - Production Server
 * Optimized for Replit and Puter deployment with comprehensive error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting THC Dope Budz Production Server...');
console.log('🔧 Configuring for Replit deployment...');

// Set environment for production deployment but keep development mode for compatibility
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.EXPRESS_ENV = 'development';
process.env.PORT = process.env.PORT || '5000';

// Bind to all interfaces for Replit deployment
process.env.HOST = '0.0.0.0';

console.log(`📡 Environment: ${process.env.NODE_ENV}`);
console.log(`🚪 Port: ${process.env.PORT}`);
console.log(`🌐 Host: ${process.env.HOST}`);

// Ensure database is ready
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not found - using fallback database');
}

console.log('✅ Starting server with tsx for TypeScript support...');

// Start the server with proper error handling
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { 
    ...process.env,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    NODE_ENV: process.env.NODE_ENV
  },
  cwd: process.cwd()
});

// Handle process errors
serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  console.error('🔄 Attempting restart in 3 seconds...');
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

// Handle process exit
serverProcess.on('exit', (code, signal) => {
  if (signal) {
    console.log(`⚡ Server terminated by signal: ${signal}`);
  } else {
    console.log(`🔄 Server process exited with code: ${code}`);
  }
  
  if (code !== 0 && code !== null) {
    console.error('💥 Server crashed - attempting restart...');
    setTimeout(() => {
      process.exit(code);
    }, 2000);
  }
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});

console.log('🎮 THC Dope Budz server starting...');