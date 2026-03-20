#!/usr/bin/env node

/**
 * THC Dope Budz - Production Deployment Starter
 * Fixed entry point for production deployment
 */

import { spawn } from 'child_process';

// Set proper environment for deployment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';
process.env.HOST = '0.0.0.0';

console.log('🚀 THC Dope Budz - Starting Production Deployment');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);
console.log(`Host: ${process.env.HOST}`);

// Start with tsx for TypeScript support like the working preview
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT,
    HOST: process.env.HOST
  }
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.kill('SIGINT');
});