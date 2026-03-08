#!/usr/bin/env node
/**
 * THC Dope Budz - Universal Starter
 * Automatically detects environment and starts appropriate server
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const hasServerFiles = existsSync(join(__dirname, 'server'));
const hasBuiltAssets = existsSync(join(__dirname, 'dist'));

console.log('🎮 THC Dope Budz - Starting up...');
console.log(`📍 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`📁 Server files: ${hasServerFiles ? 'Found' : 'Missing'}`);
console.log(`🏗️ Built assets: ${hasBuiltAssets ? 'Found' : 'Missing'}`);

let command, args;

if (hasServerFiles && isDevelopment) {
  // Development mode with full backend
  console.log('🔧 Starting development server with backend...');
  command = 'npm';
  args = ['run', 'dev'];
} else if (hasBuiltAssets) {
  // Production mode with built assets
  console.log('🚀 Starting production server...');
  command = 'node';
  args = ['production-ready.js'];
} else {
  // Fallback to simple static server
  console.log('⚡ Starting simple static server...');
  command = 'node';
  args = ['production-ready.js'];
}

// Start the appropriate server
const child = spawn(command, args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, PORT: process.env.PORT || '5000' }
});

child.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`🔄 Server exited with code: ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down...');
  child.kill('SIGINT');
});