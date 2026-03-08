/**
 * THC CLASH — Route Registration for Dope-Budz Integration
 * 
 * Add this to your Express app after `import app from './app'`
 * 
 * Usage:
 *   import { registerTHCClashRoutes } from './thc-clash-integration/server/register-routes';
 *   registerTHCClashRoutes(app);
 */

import { Express } from 'express';
import adminCardsRouter from './routes/adminCards';
import userCardsRouter from './routes/userCardsOwnership';
import cardTradesRouter from './routes/cardTrades';
import { aiAgentManagementRoutes } from './routes/aiAgentManagement';

export function registerTHCClashRoutes(app: Express): void {
  app.use('/api', adminCardsRouter);
  app.use('/api', userCardsRouter);
  app.use('/api', cardTradesRouter);
  app.use('/api/ai-agent/management', aiAgentManagementRoutes);

  console.log('✅ THC CLASH routes registered');
}

/**
 * PACK SHOP — Add these to your main routes.ts manually,
 * as they require access to the PACK_CONFIG and adminCards ORM model.
 *
 * POST /api/card-shop/open-pack  { walletAddress, packType, paymentToken }
 * POST /api/card-shop/free-pack  { walletAddress }
 * POST /api/card-shop/verify-tx  { signature, walletAddress, packType, paymentToken }
 *
 * Copy the PACK_CONFIG block and related functions from:
 *   server/routes.ts (lines ~1830–2100)
 */
