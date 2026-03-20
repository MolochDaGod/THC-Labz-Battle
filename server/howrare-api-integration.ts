/**
 * HowRare.is API Integration - Real THC GROWERZ collection data
 * Uses authentic API response structure and images
 */

import fetch from 'node-fetch';

export interface HowRareNFT {
  id: number;
  mint: string;
  link: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    name: string;
    value: string;
    rarity: string;
  }>;
  rank: number;
  rank_algo: string;
  all_ranks: {
    [key: string]: number;
  };
}

export interface HowRareCollectionResponse {
  api_version: string;
  result: {
    api_code: number;
    api_response: string;
    data: {
      collection: string;
      ranking_url: string;
      official_rarity: number;
      twitter: string;
      discord: string;
      website: string;
      description: string;
      logo: string;
      items: HowRareNFT[];
    };
  };
}

// Cache for API responses
const apiCache = new Map<string, any>();
const CACHE_DURATION = 300000; // 5 minutes

/**
 * Fetch complete THC GROWERZ collection from HowRare.is API
 */
export async function fetchHowRareCollection(page: number = 0, limit: number = 100): Promise<HowRareNFT[]> {
  const cacheKey = `howrare_collection_page_${page}_limit_${limit}`;
  
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Using cached HowRare.is data for page ${page + 1}`);
      return cached.data;
    }
  }

  try {
    console.log(`🔍 Fetching THC GROWERZ page ${page + 1} from HowRare.is API...`);
    
    const url = `https://api.howrare.is/v0.1/collections/the_growerz/?page=${page}&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'THC-GROWERZ-Integration/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.warn(`⚠️ HowRare.is API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json() as HowRareCollectionResponse;
    
    if (!data.result || !data.result.data || !data.result.data.items) {
      console.warn('⚠️ Invalid API response structure');
      return [];
    }

    const nfts = data.result.data.items;
    
    // Cache the result
    apiCache.set(cacheKey, {
      data: nfts,
      timestamp: Date.now()
    });

    console.log(`✅ Fetched ${nfts.length} authentic NFTs from HowRare.is`);
    return nfts;

  } catch (error) {
    console.error(`❌ Error fetching HowRare.is collection:`, error);
    return [];
  }
}

/**
 * Fetch all THC GROWERZ NFTs from HowRare.is API with pagination
 */
export async function fetchAllHowRareNFTs(): Promise<HowRareNFT[]> {
  const cacheKey = 'howrare_complete_collection';
  
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Using cached complete HowRare.is collection`);
      return cached.data;
    }
  }

  try {
    console.log(`🔍 Fetching complete THC GROWERZ collection from HowRare.is...`);
    
    let allNFTs: HowRareNFT[] = [];
    let page = 0;
    let hasMore = true;
    const limit = 100;
    
    while (hasMore && page < 30) { // Safety limit of 30 pages (3000 NFTs max)
      const nfts = await fetchHowRareCollection(page, limit);
      
      if (nfts.length === 0) {
        hasMore = false;
      } else {
        allNFTs = allNFTs.concat(nfts);
        page++;
        
        // If we got less than the limit, we've reached the end
        if (nfts.length < limit) {
          hasMore = false;
        }
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Remove duplicates by mint address to prevent frontend duplication
    const uniqueNFTs = allNFTs.reduce((acc: HowRareNFT[], nft: HowRareNFT) => {
      if (!acc.find(existing => existing.mint === nft.mint)) {
        acc.push(nft);
      }
      return acc;
    }, []);
    
    console.log(`🔍 Deduplicated: ${allNFTs.length} -> ${uniqueNFTs.length} authentic NFTs`);
    
    // Cache the deduplicated collection
    apiCache.set(cacheKey, {
      data: uniqueNFTs,
      timestamp: Date.now()
    });
    
    console.log(`✅ Fetched complete collection: ${uniqueNFTs.length} authentic NFTs from HowRare.is`);
    return uniqueNFTs;
    
  } catch (error) {
    console.error(`❌ Error fetching complete HowRare.is collection:`, error);
    return [];
  }
}

/**
 * Convert HowRare.is NFT to our internal format (preserving all authentic data)
 */
export function convertHowRareNFT(howrareNFT: HowRareNFT) {
  return {
    mint: howrareNFT.mint,
    name: howrareNFT.name,
    image: howrareNFT.image, // Use exact HowRare.is image URL
    rank: howrareNFT.rank,
    rarity_score: howrareNFT.rank ? (2500 - howrareNFT.rank) / 10 : 0, // Calculate from rank like HowRare.is
    attributes: howrareNFT.attributes.map(attr => ({
      trait_type: attr.name,
      value: attr.value,
      rarity: parseFloat(attr.rarity)
    })),
    collection: "THC GROWERZ",
    last_sale: undefined,
    floor_price: 0.055
  };
}



/**
 * Search NFTs by name or traits
 */
export function searchNFTs(nfts: any[], searchTerm: string): any[] {
  if (!searchTerm.trim()) return nfts;
  
  const term = searchTerm.toLowerCase();
  
  return nfts.filter(nft => {
    // Search in name
    if (nft.name.toLowerCase().includes(term)) return true;
    
    // Search in trait values
    return nft.attributes.some((attr: any) => 
      attr.value.toLowerCase().includes(term) ||
      attr.trait_type.toLowerCase().includes(term)
    );
  });
}

/**
 * Filter NFTs by traits
 */
export function filterNFTsByTraits(nfts: any[], traitFilters: Map<string, Set<string>>): any[] {
  if (traitFilters.size === 0) return nfts;
  
  return nfts.filter(nft => {
    for (const [traitType, values] of traitFilters.entries()) {
      if (values.size === 0) continue;
      
      const nftTrait = nft.attributes.find((attr: any) => attr.trait_type === traitType);
      if (!nftTrait || !values.has(nftTrait.value)) {
        return false;
      }
    }
    return true;
  });
}