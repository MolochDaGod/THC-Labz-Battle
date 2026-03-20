/**
 * HowRare.is API Routes - Authentic THC GROWERZ collection data
 * Provides paginated access to real NFT data from HowRare.is
 */

import express from 'express';
import { fetchHowRareCollection, convertHowRareNFT, searchNFTs, filterNFTsByTraits } from './howrare-api-integration.js';

const router = express.Router();

/**
 * GET /api/howrare/collection - Get paginated THC GROWERZ collection from HowRare.is
 */
router.get('/collection', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';

    console.log(`🔍 Fetching HowRare.is collection - Page: ${page + 1}, Limit: ${limit}`);

    // Fetch authentic NFT data from HowRare.is
    const howrareNFTs = await fetchHowRareCollection(page, limit);
    
    if (!howrareNFTs || howrareNFTs.length === 0) {
      console.warn('⚠️ No NFTs returned from HowRare.is API');
      return res.json({
        success: true,
        nfts: [],
        count: 0,
        page: page,
        totalPages: 0,
        totalCount: 0
      });
    }

    // Convert to our internal format with authentic images
    const convertedNFTs = howrareNFTs.map(convertHowRareNFT);

    // Apply search if provided
    let filteredNFTs = convertedNFTs;
    if (search.trim()) {
      filteredNFTs = searchNFTs(convertedNFTs, search);
    }

    console.log(`✅ Returning ${filteredNFTs.length} authentic NFTs from HowRare.is`);

    res.json({
      success: true,
      nfts: filteredNFTs,
      count: filteredNFTs.length,
      page: page,
      totalPages: Math.ceil(2420 / limit), // Total collection size
      totalCount: 2420,
      source: 'HowRare.is API',
      authentic: true
    });

  } catch (error) {
    console.error('❌ Error fetching HowRare.is collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch authentic NFT data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/howrare/nft/:id - Get specific NFT data from HowRare.is
 */
router.get('/nft/:id', async (req, res) => {
  try {
    const nftId = parseInt(req.params.id);
    
    if (isNaN(nftId) || nftId < 1 || nftId > 2420) {
      return res.status(400).json({
        success: false,
        error: 'Invalid NFT ID. Must be between 1 and 2420.'
      });
    }

    console.log(`🔍 Fetching NFT #${nftId} from HowRare.is...`);

    // For now, return data from the collection endpoint
    // In a production app, you'd call a specific NFT endpoint
    const collectionData = await fetchHowRareCollection(0, 50);
    const targetNFT = collectionData.find(nft => nft.id === nftId);

    if (!targetNFT) {
      return res.status(404).json({
        success: false,
        error: `NFT #${nftId} not found in HowRare.is collection`
      });
    }

    const convertedNFT = convertHowRareNFT(targetNFT);

    res.json({
      success: true,
      nft: convertedNFT,
      source: 'HowRare.is API',
      authentic: true
    });

  } catch (error) {
    console.error(`❌ Error fetching NFT #${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT data'
    });
  }
});

/**
 * GET /api/howrare/search - Search NFTs by traits or name
 */
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string || '';
    const traits = req.query.traits as string || '';
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    console.log(`🔍 Searching HowRare.is collection: "${searchTerm}"`);

    // Fetch collection data
    const howrareNFTs = await fetchHowRareCollection(page, limit);
    let convertedNFTs = howrareNFTs.map(convertHowRareNFT);

    // Apply search filter
    if (searchTerm.trim()) {
      convertedNFTs = searchNFTs(convertedNFTs, searchTerm);
    }

    // Apply trait filters if provided
    if (traits.trim()) {
      try {
        const traitFilters = new Map<string, Set<string>>();
        const traitPairs = traits.split(',');
        
        traitPairs.forEach(pair => {
          const [traitType, value] = pair.split(':');
          if (traitType && value) {
            if (!traitFilters.has(traitType)) {
              traitFilters.set(traitType, new Set());
            }
            traitFilters.get(traitType)!.add(value);
          }
        });

        convertedNFTs = filterNFTsByTraits(convertedNFTs, traitFilters);
      } catch (error) {
        console.warn('⚠️ Error parsing trait filters:', error);
      }
    }

    res.json({
      success: true,
      nfts: convertedNFTs,
      count: convertedNFTs.length,
      searchTerm: searchTerm,
      source: 'HowRare.is API',
      authentic: true
    });

  } catch (error) {
    console.error('❌ Error searching HowRare.is collection:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

export default router;