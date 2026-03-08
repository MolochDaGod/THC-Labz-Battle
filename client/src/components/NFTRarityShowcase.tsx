import React, { useState, useEffect } from 'react';

interface NFTAttribute {
  trait_type: string;
  value: string;
  rarity: number;
}

interface HowRareNFTData {
  mint: string;
  name: string;
  rank: number;
  rarity_score: number;
  rarity_tier: string;
  collection: string;
  floor_price: number;
  last_sale: number;
  attributes: NFTAttribute[];
  total_supply: number;
  owners: number;
  listed: boolean;
  last_updated: string;
}

interface NFTRarityShowcaseProps {
  nftMint: string;
  onClose: () => void;
}

export function NFTRarityShowcase({ nftMint, onClose }: NFTRarityShowcaseProps) {
  const [nftData, setNftData] = useState<HowRareNFTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNFTRarityData();
  }, [nftMint]);

  const fetchNFTRarityData = async () => {
    if (!nftMint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🏆 Fetching comprehensive HowRare data for NFT: ${nftMint}`);
      const response = await fetch(`/api/howrare/nft/${nftMint}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 HowRare API response:', result);
        
        if (result.success && result.nft) {
          // Transform the API response to match our interface
          const transformedData: HowRareNFTData = {
            mint: result.nft.mint,
            name: result.nft.name,
            rank: result.nft.rank,
            rarity_score: result.nft.rarity_score,
            rarity_tier: result.nft.rarity_tier || 'Common',
            collection: result.nft.collection || 'THC GROWERZ',
            floor_price: result.nft.floor_price || 0,
            last_sale: result.nft.last_sale || 0,
            attributes: result.nft.attributes || [],
            total_supply: 2347,
            owners: 1,
            listed: false,
            last_updated: new Date().toISOString()
          };
          
          setNftData(transformedData);
          console.log(`✅ Loaded HowRare data for ${transformedData.name} - Rank #${transformedData.rank}`);
        } else {
          setError('Failed to load NFT rarity data');
        }
      } else {
        setError(`API request failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching NFT rarity data:', err);
      setError('Failed to fetch NFT rarity information');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'text-yellow-400 bg-yellow-400/10';
      case 'epic': return 'text-purple-400 bg-purple-400/10';
      case 'rare': return 'text-blue-400 bg-blue-400/10';
      case 'uncommon': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTraitRarityColor = (rarity: number) => {
    if (rarity <= 5) return 'text-red-400';
    if (rarity <= 15) return 'text-orange-400';
    if (rarity <= 30) return 'text-yellow-400';
    if (rarity <= 50) return 'text-green-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
            <span className="text-white">Loading NFT rarity data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg border border-red-500 max-w-md">
          <h3 className="text-red-400 font-bold mb-2">Error Loading NFT Data</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={fetchNFTRarityData}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!nftData) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{nftData.name}</h2>
            <p className="text-gray-400 text-sm">{nftData.collection}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Rank Card */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 p-4 rounded-lg border border-yellow-700/30">
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Rarity Rank</h3>
              <div className="text-3xl font-bold text-yellow-300">#{nftData.rank}</div>
              <p className="text-yellow-200/70 text-sm">out of {nftData.total_supply.toLocaleString()}</p>
            </div>

            {/* Rarity Score Card */}
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded-lg border border-purple-700/30">
              <h3 className="text-purple-400 font-bold text-lg mb-2">Rarity Score</h3>
              <div className="text-3xl font-bold text-purple-300">{nftData.rarity_score.toFixed(1)}</div>
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getRarityColor(nftData.rarity_tier)}`}>
                {nftData.rarity_tier}
              </div>
            </div>

            {/* Market Data Card */}
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded-lg border border-green-700/30">
              <h3 className="text-green-400 font-bold text-lg mb-2">Market Data</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Floor Price:</span>
                  <span className="text-green-300 font-medium">{nftData.floor_price}◎</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Sale:</span>
                  <span className="text-green-300 font-medium">{nftData.last_sale}◎</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Listed:</span>
                  <span className={nftData.listed ? 'text-red-400' : 'text-gray-400'}>
                    {nftData.listed ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Traits Section */}
          <div className="mb-8">
            <h3 className="text-white font-bold text-xl mb-4">Unique Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nftData.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-gray-400 text-sm font-medium">{attr.trait_type}</h4>
                    <span className={`text-xs font-bold ${getTraitRarityColor(attr.rarity)}`}>
                      {attr.rarity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-white font-medium">{attr.value}</div>
                  <div className="mt-2 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        attr.rarity <= 5 ? 'bg-red-400' :
                        attr.rarity <= 15 ? 'bg-orange-400' :
                        attr.rarity <= 30 ? 'bg-yellow-400' :
                        attr.rarity <= 50 ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.max(100 - attr.rarity, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collection Stats */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-3">Collection Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{nftData.total_supply.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Total Supply</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{nftData.owners}</div>
                <div className="text-gray-400 text-sm">Unique Owner{nftData.owners !== 1 ? 's' : ''}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{nftData.floor_price}◎</div>
                <div className="text-gray-400 text-sm">Floor Price</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">#{nftData.rank}</div>
                <div className="text-gray-400 text-sm">Your Rank</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-500">
            <span>Data from HowRare.is API</span>
            <span>Last updated: {new Date(nftData.last_updated).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}