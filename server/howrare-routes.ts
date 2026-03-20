/**
 * HowRare.is API Routes - Authentic THC GROWERZ collection data
 */

import type { Express } from "express";
import { fetchAllHowRareNFTs, fetchHowRareCollection, convertHowRareNFT } from "./howrare-api-integration";

export function howRareAPIRoutes(app: Express) {
  
  /**
   * Get complete authentic THC GROWERZ collection from HowRare.is
   */
  app.get("/api/howrare/collection/complete", async (req, res) => {
    try {
      console.log("🔍 Fetching complete authentic THC GROWERZ collection from HowRare.is...");
      
      const rawNFTs = await fetchAllHowRareNFTs();
      
      if (rawNFTs.length === 0) {
        return res.status(503).json({
          success: false,
          error: "HowRare.is API temporarily unavailable",
          count: 0,
          nfts: []
        });
      }
      
      // Convert to our internal format
      const nfts = rawNFTs.map(convertHowRareNFT);
      
      console.log(`✅ Returning ${nfts.length} authentic NFTs from HowRare.is`);
      
      res.json({
        success: true,
        count: nfts.length,
        source: "HowRare.is API",
        timestamp: new Date().toISOString(),
        nfts: nfts
      });
      
    } catch (error) {
      console.error("❌ Error fetching HowRare.is collection:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch authentic collection data",
        count: 0,
        nfts: []
      });
    }
  });

  /**
   * Get paginated authentic THC GROWERZ collection from HowRare.is
   */
  app.get("/api/howrare/collection", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      
      console.log(`🔍 Fetching THC GROWERZ page ${page + 1} from HowRare.is...`);
      
      const rawNFTs = await fetchHowRareCollection(page, limit);
      
      if (rawNFTs.length === 0) {
        return res.json({
          success: true,
          count: 0,
          page: page,
          hasMore: false,
          nfts: []
        });
      }
      
      // Convert to our internal format
      const nfts = rawNFTs.map(convertHowRareNFT);
      
      console.log(`✅ Returning page ${page + 1} with ${nfts.length} authentic NFTs`);
      
      res.json({
        success: true,
        count: nfts.length,
        page: page,
        hasMore: nfts.length === limit,
        source: "HowRare.is API",
        nfts: nfts
      });
      
    } catch (error) {
      console.error("❌ Error fetching HowRare.is page:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch authentic collection page",
        count: 0,
        nfts: []
      });
    }
  });

  /**
   * Get specific NFT from HowRare.is by mint address
   */
  app.get("/api/howrare/nft/:mint", async (req, res) => {
    try {
      const { mint } = req.params;
      
      console.log(`🔍 Fetching NFT ${mint} from HowRare.is...`);
      
      // First try to get from complete collection cache
      const allNFTs = await fetchAllHowRareNFTs();
      const nft = allNFTs.find(n => n.mint === mint);
      
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: "NFT not found in HowRare.is collection",
          mint: mint
        });
      }
      
      const convertedNFT = convertHowRareNFT(nft);
      
      console.log(`✅ Found authentic NFT: ${nft.name} (Rank #${nft.rank})`);
      
      res.json({
        success: true,
        source: "HowRare.is API",
        nft: convertedNFT
      });
      
    } catch (error) {
      console.error("❌ Error fetching HowRare.is NFT:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch authentic NFT data",
        mint: req.params.mint
      });
    }
  });

  /**
   * Get collection statistics from HowRare.is
   */
  app.get("/api/howrare/stats", async (req, res) => {
    try {
      console.log("🔍 Fetching THC GROWERZ collection stats from HowRare.is...");
      
      const allNFTs = await fetchAllHowRareNFTs();
      
      if (allNFTs.length === 0) {
        return res.status(503).json({
          success: false,
          error: "HowRare.is API temporarily unavailable"
        });
      }
      
      // Calculate stats from authentic data
      const totalSupply = allNFTs.length;
      const ranks = allNFTs.map(nft => nft.rank).filter(rank => rank > 0);
      const minRank = Math.min(...ranks);
      const maxRank = Math.max(...ranks);
      
      // Get trait distribution
      const traitCounts = new Map<string, Map<string, number>>();
      
      allNFTs.forEach(nft => {
        nft.attributes.forEach(attr => {
          if (!traitCounts.has(attr.name)) {
            traitCounts.set(attr.name, new Map());
          }
          const traitMap = traitCounts.get(attr.name)!;
          traitMap.set(attr.value, (traitMap.get(attr.value) || 0) + 1);
        });
      });
      
      const traitTypes = Array.from(traitCounts.keys());
      
      console.log(`✅ Collection stats: ${totalSupply} NFTs, ranks ${minRank}-${maxRank}, ${traitTypes.length} trait types`);
      
      res.json({
        success: true,
        source: "HowRare.is API",
        stats: {
          totalSupply,
          mintedCount: totalSupply,
          minRank,
          maxRank,
          traitTypes,
          traitCounts: Object.fromEntries(
            Array.from(traitCounts.entries()).map(([type, values]) => [
              type,
              Object.fromEntries(values.entries())
            ])
          )
        }
      });
      
    } catch (error) {
      console.error("❌ Error fetching HowRare.is stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch authentic collection stats"
      });
    }
  });
}