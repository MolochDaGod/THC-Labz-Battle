/**
 * Magic Eden API Integration for THC GROWERZ Collection Floor Price
 * Fetches real floor price and collection stats from Magic Eden
 */

interface MagicEdenCollectionStats {
  symbol: string;
  floorPrice: number;
  listedCount: number;
  avgPrice24hr: number;
  volumeAll: number;
}

interface MagicEdenFloorPriceResponse {
  success: boolean;
  floorPrice: number;
  currency: string;
  listedCount: number;
  source: string;
  lastUpdated: string;
  error?: string;
}

// Cache floor price for 10 minutes to reduce API calls
let floorPriceCache: {
  floorPrice: number;
  timestamp: number;
  listedCount: number;
} | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function fetchTHCGrowerZFloorPrice(): Promise<MagicEdenFloorPriceResponse> {
  // Check cache first
  if (floorPriceCache && (Date.now() - floorPriceCache.timestamp) < CACHE_DURATION) {
    console.log('🏠 Using cached THC GROWERZ floor price:', floorPriceCache.floorPrice, 'SOL');
    return {
      success: true,
      floorPrice: floorPriceCache.floorPrice,
      currency: 'SOL',
      listedCount: floorPriceCache.listedCount,
      source: 'Magic Eden (cached)',
      lastUpdated: new Date(floorPriceCache.timestamp).toISOString()
    };
  }

  try {
    // Try multiple Magic Eden API endpoints for THC GROWERZ
    const collectionSymbols = [
      'thc_labz_the_growerz',
      'the_growerz',
      'thc_growerz',
      'growerz'
    ];
    
    console.log(`🏠 Fetching THC GROWERZ floor price from Magic Eden...`);
    
    let floorPriceSOL = 0;
    let listedCount = 0;
    let apiSuccess = false;
    
    // Try different collection endpoints
    for (const symbol of collectionSymbols) {
      try {
        const url = `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`;
        console.log(`🔍 Trying Magic Eden API with symbol: ${symbol}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'THC-Dope-Budz/1.0',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data: MagicEdenCollectionStats = await response.json();
          console.log(`📊 Magic Eden response for ${symbol}:`, JSON.stringify(data, null, 2));
          
          // Check if we have valid floor price data
          if (data.floorPrice && !isNaN(data.floorPrice) && data.floorPrice > 0) {
            // Floor price might be in lamports or SOL, handle both
            floorPriceSOL = data.floorPrice > 1000000 ? data.floorPrice / 1000000000 : data.floorPrice;
            listedCount = data.listedCount || 0;
            apiSuccess = true;
            console.log(`✅ Found valid floor price: ${floorPriceSOL} SOL from ${symbol}`);
            break;
          }
        }
      } catch (symbolError) {
        console.log(`❌ Symbol ${symbol} failed:`, symbolError instanceof Error ? symbolError.message : String(symbolError));
        continue;
      }
    }
    
    console.log(`✅ Magic Eden THC GROWERZ floor price: ${floorPriceSOL} SOL (${listedCount} listed) - API Success: ${apiSuccess}`);
    
    // Update cache
    floorPriceCache = {
      floorPrice: floorPriceSOL,
      timestamp: Date.now(),
      listedCount: listedCount
    };
    
    // Only return successful responses with authentic data
    if (apiSuccess && floorPriceSOL > 0) {
      return {
        success: true,
        floorPrice: floorPriceSOL,
        currency: 'SOL',
        listedCount: listedCount,
        source: 'Magic Eden API',
        lastUpdated: new Date().toISOString()
      };
    } else {
      // No authentic data available
      return {
        success: false,
        floorPrice: 0,
        currency: 'SOL',
        listedCount: 0,
        source: 'Magic Eden API',
        lastUpdated: new Date().toISOString(),
        error: 'No floor price data available from Magic Eden'
      };
    }
    
  } catch (error) {
    console.error('❌ Error fetching THC GROWERZ floor price from Magic Eden:', error);
    
    // Return error response - no hardcoded fallbacks for authentic Web3 app
    return {
      success: false,
      floorPrice: 0,
      currency: 'SOL',
      listedCount: 0,
      source: 'Magic Eden API Error',
      lastUpdated: new Date().toISOString(),
      error: 'Floor price data unavailable - please try again later'
    };
  }
}

export function clearFloorPriceCache(): void {
  floorPriceCache = null;
  console.log('🗑️ Cleared THC GROWERZ floor price cache');
}