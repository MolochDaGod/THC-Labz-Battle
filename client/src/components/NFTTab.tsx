import React, { useState, useEffect } from 'react';
import { Crown, Star, Zap, Shield, Sword, Grid } from 'lucide-react';
import { toast } from 'sonner';

interface NFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface NFTTabProps {
  walletAddress?: string;
  onCaptainSelect?: (nft: NFT) => void;
}

export default function NFTTab({ walletAddress, onCaptainSelect }: NFTTabProps) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedCaptain, setSelectedCaptain] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nftBonuses, setNftBonuses] = useState<any>(null);

  useEffect(() => {
    if (walletAddress) {
      fetchUserNFTs();
    }
  }, [walletAddress]);

  const fetchUserNFTs = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/my-nfts/${walletAddress}`);
      const data = await response.json();
      
      if (data.success && data.nfts) {
        setNfts(data.nfts);
        
        // Auto-select first NFT if none selected
        if (data.nfts.length > 0 && !selectedCaptain) {
          setSelectedCaptain(data.nfts[0]);
          calculateNFTBonuses(data.nfts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      toast.error('Failed to load your NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNFTBonuses = async (nft: NFT) => {
    try {
      const response = await fetch('/api/calculate-nft-benefits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          nft
        })
      });

      const data = await response.json();
      if (data.success) {
        setNftBonuses(data.data);
      }
    } catch (error) {
      console.error('Failed to calculate NFT bonuses:', error);
    }
  };

  const selectCaptain = (nft: NFT) => {
    setSelectedCaptain(nft);
    calculateNFTBonuses(nft);
    onCaptainSelect?.(nft);
    toast.success(`${nft.name} selected as captain!`);
  };

  const getTraitColor = (traitType: string) => {
    const colors = {
      'Background': 'bg-purple-900/50 text-purple-300',
      'Strain': 'bg-green-900/50 text-green-300',
      'Eyes': 'bg-blue-900/50 text-blue-300',
      'Mouth': 'bg-red-900/50 text-red-300',
      'Accessory': 'bg-yellow-900/50 text-yellow-300',
    };
    return colors[traitType as keyof typeof colors] || 'bg-gray-900/50 text-gray-300';
  };

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Crown className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
        <p className="text-gray-400">Connect your wallet to view your GROWER NFTs</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
        <p className="text-gray-300">Loading your GROWER NFTs...</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Crown className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No GROWER NFTs Found</h3>
        <p className="text-gray-400 mb-4">You don't have any GROWER NFTs in your wallet</p>
        <p className="text-gray-500 text-sm">You can still play the game, but NFT holders get special bonuses!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Captain Info */}
      {selectedCaptain && nftBonuses && (
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-400/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <img
              src={selectedCaptain.image}
              alt={selectedCaptain.name}
              className="w-20 h-20 rounded-xl object-cover border-2 border-yellow-400"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Captain: {selectedCaptain.name}</h3>
              </div>
              <p className="text-yellow-400 text-sm mb-3">Rank #{selectedCaptain.rank}</p>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Sword className="w-4 h-4 text-red-400" />
                  <span className="text-white">+{nftBonuses.bonuses.attackBonus} ATK</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-white">+{nftBonuses.bonuses.healthBonus} HP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span className="text-white">{nftBonuses.bonuses.specialAbilities.length} Abilities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft) => (
          <div
            key={nft.mint}
            onClick={() => selectCaptain(nft)}
            className={`cursor-pointer border-2 rounded-xl p-4 transition-all transform hover:scale-105 ${
              selectedCaptain?.mint === nft.mint
                ? 'border-yellow-400 bg-yellow-400/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-green-400'
            }`}
          >
            <div className="relative mb-4">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              {selectedCaptain?.mint === nft.mint && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full p-2">
                  <Crown className="w-4 h-4" />
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="text-white text-sm font-bold">#{nft.rank}</span>
              </div>
            </div>

            <h4 className="text-white font-bold text-sm mb-2 truncate">{nft.name}</h4>

            {/* Traits */}
            <div className="space-y-1 mb-3">
              {nft.attributes.slice(0, 3).map((trait, index) => (
                <div key={index} className={`text-xs px-2 py-1 rounded-full ${getTraitColor(trait.trait_type)}`}>
                  <span className="font-medium">{trait.trait_type}:</span> {trait.value}
                </div>
              ))}
              {nft.attributes.length > 3 && (
                <div className="text-xs text-gray-400 px-2">
                  +{nft.attributes.length - 3} more traits
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">Captain Bonus</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectCaptain(nft);
                }}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  selectedCaptain?.mint === nft.mint
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedCaptain?.mint === nft.mint ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Unlocked Cards from 1-66 Collection */}
      {selectedCaptain && nftBonuses && nftBonuses.traitAnalysis && (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-400/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <Grid className="w-5 h-5 text-green-400 mr-2" />
            Unlocked Cards ({nftBonuses.traitAnalysis.unlockedCards} from Collection 1-66)
          </h4>
          
          <div className="mb-4">
            <div className="flex items-center space-x-4 text-sm">
              <span className="bg-green-400/20 border border-green-400/30 text-green-300 px-3 py-1 rounded-full font-medium">
                {nftBonuses.traitAnalysis.rankTier} Tier
              </span>
              <span className="text-gray-300">
                Cards: {nftBonuses.traitAnalysis.cardNumbers.join(', ')}
              </span>
            </div>
          </div>

          {/* Card Numbers Grid */}
          <div className="grid grid-cols-8 md:grid-cols-12 gap-2 mb-4">
            {nftBonuses.traitAnalysis.cardNumbers.map((cardNumber: number) => (
              <div
                key={cardNumber}
                className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-lg p-2 text-center transition-all hover:scale-105 hover:border-blue-400/60"
              >
                <div className="text-white font-bold text-sm">#{cardNumber}</div>
                <div className="text-blue-300 text-xs">
                  {cardNumber > 50 ? 'Legendary' : cardNumber > 30 ? 'Epic' : cardNumber > 15 ? 'Rare' : 'Common'}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-gray-400 text-sm">
            Your NFT rank #{selectedCaptain.rank} grants access to these authentic THC cards from the 1-66 collection.
            Use these cards in battle for enhanced gameplay with real abilities and balanced stats.
          </p>
        </div>
      )}

      {/* Captain Abilities */}
      {selectedCaptain && nftBonuses && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-400 mr-2" />
            Captain Abilities
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {nftBonuses.bonuses.specialAbilities.map((ability: string, index: number) => (
              <div key={index} className="bg-purple-900/30 border border-purple-400/30 rounded-lg p-3 text-center">
                <span className="text-purple-300 text-sm font-medium">{ability}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}