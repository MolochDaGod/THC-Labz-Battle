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
