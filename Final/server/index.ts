import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'https://growerz.thc-labz.xyz',
    'https://cannabis-cultivator-grudgedev.replit.app',
    'https://grudge-thc-growrez.replit.app',
    /.*\.thc-labz\.xyz$/,
    /.*\.replit\.dev$/,
    /.*\.replit\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://growerz.thc-labz.xyz", "https://*.thc-labz.xyz"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:", "https://pagead2.googlesyndication.com"],
    },
  },
  frameOptions: { action: 'sameorigin' }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Inject AdMob environment variables into the client
app.get('/admob-config.js', (req, res) => {
  const config = `
    window.ADMOB_APP_ID = ${JSON.stringify(process.env.ADMOB_APP_ID || '')};
    window.ADMOB_REWARDED_AD_UNIT_ID = ${JSON.stringify(process.env.ADMOB_REWARDED_AD_UNIT_ID || '')};
    console.log('📱 AdMob configuration loaded:', {
      appId: window.ADMOB_APP_ID ? 'Configured' : 'Not configured',
      rewardedAdUnitId: window.ADMOB_REWARDED_AD_UNIT_ID ? 'Configured' : 'Not configured'
    });
  `;
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(config);
});

// Serve static files
app.use(express.static('client/dist'));

// Serve attached assets
const attachedAssetsPath = path.resolve('attached_assets');
if (fs.existsSync(attachedAssetsPath)) {
  app.use('/attached_assets', express.static(attachedAssetsPath));
}

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve('client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 THC Dope Budz server running on port ${PORT}`);
  console.log(`📱 AdMob integration: ${process.env.ADMOB_APP_ID ? 'Configured' : 'Development mode'}`);
});

export default app;