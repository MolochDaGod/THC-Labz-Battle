/**
 * Batch Token Price API - Reduce rate limiting by fetching all prices in one call
 */
import { Request, Response } from 'express';

const TOKENS = {
  GBUX: '55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray',
  BUDZ: '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ',
  THC_LABZ: 'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT'
};

interface BatchPriceResponse {
  gbux: number;
  budz: number;
  thcLabz: number;
  timestamp: number;
  source: string;
}

// Cache prices for 30 minutes to reduce API calls
let priceCache: BatchPriceResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Batch fetch token prices to reduce API rate limiting
 * POST /api/token-prices/batch
 */
export async function getBatchTokenPrices(req: Request, res: Response) {
  try {
    // Check cache first
    if (priceCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log('📦 Using cached batch prices');
      return res.json(priceCache);
    }

    // Support both GET and POST requests for flexibility
    const tokens = req.body?.tokens || [TOKENS.GBUX, TOKENS.BUDZ, TOKENS.THC_LABZ];
    
    // Always proceed with default tokens if none provided
    console.log('💰 Fetching batch token prices...');

    let batchPrices: BatchPriceResponse;

    try {
      // Try Jupiter batch API first
      const tokenIds = tokens.join(',');
      const jupiterResponse = await fetch(`https://price.jup.ag/v6/price?ids=${tokenIds}`);
      
      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json();
        
        batchPrices = {
          gbux: jupiterData.data?.[TOKENS.GBUX]?.price || 0.0000123,
          budz: jupiterData.data?.[TOKENS.BUDZ]?.price || 0.0000123,
          thcLabz: jupiterData.data?.[TOKENS.THC_LABZ]?.price || 0.001,
          timestamp: Date.now(),
          source: 'Jupiter'
        };
        
        console.log(`💰 Jupiter batch prices: GBUX=$${batchPrices.gbux}, BUDZ=$${batchPrices.budz}, THC LABZ=$${batchPrices.thcLabz}`);
      } else {
        throw new Error('Jupiter batch API failed');
      }
    } catch (jupiterError) {
      console.log('Jupiter batch API failed, using fallback prices');
      
      // Use fallback prices to prevent rate limiting
      batchPrices = {
        gbux: 0.0000123,
        budz: 0.0000123,
        thcLabz: 0.001,
        timestamp: Date.now(),
        source: 'Fallback'
      };
      
      console.log('💰 Using fallback batch prices');
    }

    // Cache the result
    priceCache = batchPrices;
    cacheTimestamp = Date.now();
    
    res.json(batchPrices);
    
  } catch (error) {
    console.error('Batch token price error:', error);
    
    // Always return fallback prices to prevent frontend errors
    const fallbackPrices = {
      gbux: 0.0000123,
      budz: 0.0000123,
      thcLabz: 0.001,
      timestamp: Date.now(),
      source: 'Error Fallback'
    };
    
    res.json(fallbackPrices);
  }
}

/**
 * Clear price cache (for testing)
 * POST /api/token-prices/clear-cache
 */
export async function clearPriceCache(req: Request, res: Response) {
  priceCache = null;
  cacheTimestamp = 0;
  console.log('🗑️ Price cache cleared');
  res.json({ message: 'Cache cleared' });
}