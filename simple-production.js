#!/usr/bin/env node

/**
 * Simple Production Server
 * A more flexible approach for Replit deployment
 */

import { exec } from 'child_process';
import fs from 'fs';

// Force production environment
process.env.NODE_ENV = 'production';
process.env.EXPRESS_ENV = 'production';

console.log('🚀 Starting THC Dope Budz in production mode...');
console.log('Environment:', process.env.NODE_ENV);

// Check if we have a built server
const distServerPath = './dist/index.js';
const devServerPath = './server/index.ts';

if (fs.existsSync(distServerPath)) {
  console.log('✅ Using built server bundle:', distServerPath);
  import(distServerPath);
} else {
  console.log('⚠️ Built server not found, using development server with production settings');
  // Use tsx to run the TypeScript server directly
  exec('tsx server/index.ts', (error, stdout, stderr) => {
    if (error) {
      console.error('Server error:', error);
      return;
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
}