/**
 * Live HowRare.is API Integration
 * Enhanced integration using official HowRare API endpoints with proper error handling
 * Based on HowRare Solana Proxy architecture for production reliability
 */

import { Request, Response } from 'express';

interface HowRareLiveNFT {
  name: string;
  rank: number;
  rarity_score: number;
  attributes: Array<{
    trait_type: string;
    value: string;
    trait_count: number;
    rarity: number;
  }>;
  image?: string;
  description?: string;
}

interface HowRareCollection {
  name: string;
  slug: string;
  total_supply: number;
  floor_price: number;
  volume_24h?: number;
  listed_count?: number;
  unique_holders?: number;
}

class HowRareLiveService {
  private baseUrl = 'https://api.howrare.is/v0.1';
  private fallbackUrls = [
    'https://api.howrare.is/v0.1',
    'https://howrare.is/api/v0.1'
  ];
  private requestDelay = 150; // Rate limiting
  private lastRequestTime = 0;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Rate-limited request with caching
   */
  private async makeRequest(endpoint: string): Promise<any> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Using cached HowRare data for: ${endpoint}`);
      return cached.data;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();

    // Try multiple endpoints for reliability
    for (const baseUrl of this.fallbackUrls) {
      try {
        const url = `${baseUrl}${endpoint}`;
        console.log(`🌐 Fetching from HowRare: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'THC-Dope-Budz/1.0',
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ HowRare API success for: ${endpoint}`);
          
          // Cache successful response
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        } else {
          console.log(`⚠️ HowRare API response ${response.status} for: ${url}`);
        }
      } catch (error) {
        console.log(`❌ HowRare API error for ${baseUrl}: ${error}`);
        continue;
      }
    }
    
    throw new Error('All HowRare API endpoints failed');
  }

  /**
   * Get live NFT data from HowRare.is
   */
  async getLiveNFTData(mint: string): Promise<HowRareLiveNFT | null> {
    const collectionSlugs = [
      'thc-labz-growerz',
      'thc_labz_growerz', 
      'growerz',
      'thc-growerz',
      'thc_growerz'
    ];

    for (const slug of collectionSlugs) {
      try {
        console.log(`🔍 Trying HowRare collection: ${slug} for mint: ${mint}`);
        const data = await this.makeRequest(`/collections/${slug}/tokens/${mint}`);
        
        if (data && data.rank) {
          console.log(`✅ Found live NFT data in collection: ${slug}`);
          return data;
        }
      } catch (error) {
        console.log(`⚠️ Collection ${slug} failed: ${error}`);
        continue;
      }
    }

    console.log(`❌ NFT ${mint} not found in any HowRare collection`);
    return null;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionSlug: string): Promise<HowRareCollection | null> {
    try {
      console.log(`📊 Fetching collection stats for: ${collectionSlug}`);
      const data = await this.makeRequest(`/collections/${collectionSlug}`);
      
      if (data) {
        console.log(`✅ Retrieved collection stats for: ${collectionSlug}`);
        return data;
      }
    } catch (error) {
      console.log(`❌ Collection stats error for ${collectionSlug}: ${error}`);
    }
    
    return null;
  }

  /**
   * Get trending collections
   */
  async getTrendingCollections(): Promise<HowRareCollection[]> {
    try {
      console.log(`📈 Fetching trending collections from HowRare`);
      const data = await this.makeRequest('/collections/trending');
      
      if (Array.isArray(data)) {
        console.log(`✅ Retrieved ${data.length} trending collections`);
        return data;
      }
    } catch (error) {
      console.log(`❌ Trending collections error: ${error}`);
    }
    
    return [];
  }

  /**
   * Search NFTs by attributes
   */
  async searchNFTsByAttributes(collectionSlug: string, attributes: Record<string, string>): Promise<HowRareLiveNFT[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(attributes).forEach(([trait, value]) => {
        queryParams.append(trait, value);
      });
      
      console.log(`🔍 Searching NFTs with attributes: ${JSON.stringify(attributes)}`);
      const data = await this.makeRequest(`/collections/${collectionSlug}/search?${queryParams}`);
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} NFTs matching attributes`);
        return data;
      }
    } catch (error) {
      console.log(`❌ NFT search error: ${error}`);
    }
    
    return [];
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log(`🗑️ HowRare cache cleared`);
  }
}

export const howRareLiveService = new HowRareLiveService();

/**
 * Enhanced API Routes with Live HowRare Integration
 */
export const howRareLiveRoutes = {
  
  /**
   * Get live NFT rarity data
   * GET /api/howrare/live/nft/:mint
   */
  async getLiveNFTRarity(req: Request, res: Response) {
    try {
      const { mint } = req.params;
      
      if (!mint) {
        return res.status(400).json({ error: 'NFT mint address is required' });
      }

      console.log(`🏆 Fetching live HowRare data for NFT: ${mint}`);
      
      const liveData = await howRareLiveService.getLiveNFTData(mint);
      
      if (liveData) {
        const transformedData = {
          mint: mint,
          name: liveData.name,
          rank: liveData.rank,
          rarity_score: liveData.rarity_score,
          rarity_tier: liveData.rank <= 50 ? 'Legendary' : liveData.rank <= 200 ? 'Epic' : liveData.rank <= 500 ? 'Rare' : 'Common',
          collection: "THC LABZ GROWERZ",
          attributes: liveData.attributes?.map(attr => ({
            trait_type: attr.trait_type,
            value: attr.value,
            rarity: attr.rarity || ((attr.trait_count / 2420) * 100)
          })) || [],
          total_supply: 2420,
          last_updated: new Date().toISOString()
        };

        console.log(`✅ Returning live HowRare data for ${liveData.name} - Rank #${liveData.rank}`);
        
        res.json({
          success: true,
          data: transformedData,
          source: "HowRare.is Live API",
          authentic: true,
          live: true
        });
      } else {
        // Fallback to verified data
        res.json({
          success: false,
          error: 'NFT not found in HowRare database',
          fallback_available: true
        });
      }
    } catch (error) {
      console.error('Live HowRare API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch live NFT data',
        fallback_available: true
      });
    }
  },

  /**
   * Get collection statistics
   * GET /api/howrare/live/collection/:slug
   */
  async getCollectionStats(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      
      console.log(`📊 Fetching live collection stats for: ${slug}`);
      const stats = await howRareLiveService.getCollectionStats(slug);
      
      if (stats) {
        res.json({
          success: true,
          data: stats,
          source: "HowRare.is Live API"
        });
      } else {
        res.status(404).json({ error: 'Collection not found' });
      }
    } catch (error) {
      console.error('Collection stats error:', error);
      res.status(500).json({ error: 'Failed to fetch collection stats' });
    }
  },

  /**
   * Clear HowRare cache
   * POST /api/howrare/live/clear-cache
   */
  async clearCache(req: Request, res: Response) {
    try {
      howRareLiveService.clearCache();
      res.json({ 
        success: true, 
        message: 'HowRare cache cleared successfully' 
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }
};

export default howRareLiveService;