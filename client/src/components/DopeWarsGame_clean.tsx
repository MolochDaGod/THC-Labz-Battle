import { useState, useEffect } from 'react';
import { NFTRarityShowcase } from './NFTRarityShowcase';

// Simple working GROWERZ NFT interface
interface NFT {
  mint: string;
  name: string;
  image: string;
  description: string;
  rank?: number;
  rarity_score?: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface GrowerNFTsDisplayProps {
  walletAddress: string | null;
}

function GrowerNFTsDisplay({ walletAddress }: GrowerNFTsDisplayProps) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState<string | null>(null);
  const [showcaseNft, setShowcaseNft] = useState<string | null>(null);

  const fetchNFTs = async () => {
    if (!walletAddress) return;
    
    console.log(`🔍 Fetching GROWERZ NFTs for wallet: ${walletAddress}`);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/my-nfts/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.nfts) {
          setNfts(data.nfts);
          console.log(`✅ Found ${data.nfts.length} GROWERZ NFTs`);
        }
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchNFTs();
  }, [walletAddress]);

  return (
    <div className="p-6 bg-gray-900 bg-opacity-90 rounded-lg">
      <h2 className="text-2xl font-bold text-green-400 mb-4">
        THC GROWERZ Collection
      </h2>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="text-green-400">Loading your GROWERZ NFTs...</div>
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <div
              key={nft.mint}
              className={`bg-gray-800 rounded-lg p-4 cursor-pointer border-2 transition-all ${
                selectedNft === nft.mint 
                  ? 'border-green-400 shadow-lg shadow-green-400/20' 
                  : 'border-gray-600 hover:border-green-500'
              }`}
              onClick={() => setSelectedNft(nft.mint)}
            >
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-48 object-cover rounded-lg mb-3"
              />
              
              <h3 className="text-white font-bold text-lg mb-2">{nft.name}</h3>
              
              {nft.rank && (
                <div className="text-yellow-400 font-bold mb-2">
                  Rank #{nft.rank}
                </div>
              )}
              
              {nft.rarity_score && (
                <div className="text-purple-400 mb-2">
                  Rarity Score: {nft.rarity_score.toFixed(2)}
                </div>
              )}
              
              <div className="space-y-1">
                {nft.attributes.slice(0, 3).map((attr, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    <span className="text-gray-400">{attr.trait_type}:</span> {attr.value}
                  </div>
                ))}
                {nft.attributes.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{nft.attributes.length - 3} more traits
                  </div>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowcaseNft(nft.mint);
                }}
                className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors"
              >
                View Full Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400">
            {walletAddress 
              ? "No GROWERZ NFTs found in your wallet" 
              : "Connect your wallet to view your GROWERZ collection"
            }
          </div>
        </div>
      )}
      
      {showcaseNft && (
        <NFTRarityShowcase
          nftMint={showcaseNft}
          onClose={() => setShowcaseNft(null)}
        />
      )}
    </div>
  );
}

export default function DopeWarsGame() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const connectWallet = async () => {
    try {
      if ('solana' in window) {
        const provider = (window as any).solana;
        if (provider.isPhantom || provider.isSolflare) {
          const response = await provider.connect();
          setWalletAddress(response.publicKey.toString());
          setGameStarted(true);
          console.log('Connected wallet:', response.publicKey.toString());
        }
      } else {
        alert('Please install a Solana wallet (Phantom, Solflare, etc.)');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  return (
    <div className="w-full h-screen text-green-400 font-mono relative overflow-hidden bg-black">
      <div className="flex items-center justify-center h-full p-4">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-green-400">
              THC DOPE BUDZ
            </h1>
            <p className="text-xl mb-6 text-green-300">
              Web3 Cannabis Empire Game - GROWERZ NFT Integration
            </p>
          </div>

          {!gameStarted ? (
            <div className="text-center">
              <button
                onClick={connectWallet}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-lg transition-colors"
              >
                Connect Wallet & View GROWERZ
              </button>
              <p className="text-sm text-gray-400 mt-4">
                Connect your Solana wallet to view your THC GROWERZ NFT collection
              </p>
            </div>
          ) : (
            <GrowerNFTsDisplay walletAddress={walletAddress} />
          )}
        </div>
      </div>
    </div>
  );
}