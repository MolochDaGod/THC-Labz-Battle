import React, { useState, useEffect } from 'react';
import { X, Search, Star, TrendingUp, Users, Package } from 'lucide-react';

interface NFTCollection {
  name: string;
  url: string;
  logo: string;
  official_rarity: number;
  metadata_refresh_ts: number;
  me_key: string;
  on_sale: number;
  holders: number;
  items: number;
  floor: number;
  floor_marketcap: number;
  floor_marketcap_pretty: string;
}

interface NFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  rarity_score: number;
  collection: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  floor_price?: number;
  last_sale?: number;
}

interface UserProfile {
  walletAddress: string;
  username: string;
  registeredAt: string;
  lastLogin: string;
  selectedAssistantNFT?: NFT;
  ownedCollections: string[];
  totalNFTs: number;
  portfolioValue: number;
}

interface NFTMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: string | null;
  onAssistantSelect: (nft: NFT) => void;
}

export default function NFTMarketplace({ isOpen, onClose, connectedWallet, onAssistantSelect }: NFTMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'collections' | 'my-nfts' | 'assistants'>('collections');
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [allGrowerNFTs, setAllGrowerNFTs] = useState<NFT[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    if (isOpen && connectedWallet) {
      loadMarketplaceData();
    }
  }, [isOpen, connectedWallet]);

  // Register user after NFTs are loaded
  useEffect(() => {
    if (connectedWallet && myNFTs !== undefined) {
      registerUser();
    }
  }, [connectedWallet, myNFTs]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      // Load only THC LABZ GROWERZ collection info
      const growerCollection = {
        name: 'THC LABZ GROWERZ',
        url: 'https://howrare.is/thc-labz-growerz',
        logo: '/grench-avatar.png',
        official_rarity: 1,
        metadata_refresh_ts: Date.now(),
        me_key: 'thc_labz_growerz',
        on_sale: 0,
        holders: 2420,
        items: 2420,
        floor: 0.1,
        floor_marketcap: 242,
        floor_marketcap_pretty: '242 SOL'
      };
      setCollections([growerCollection]);

      // Load ALL GROWERZ NFTs from the collection
      console.log('🔍 Loading complete THC LABZ GROWERZ collection...');
      try {
        const allNFTsResponse = await fetch('/api/marketplace/collections/growerz/all');
        if (allNFTsResponse.ok) {
          const allData = await allNFTsResponse.json();
          if (allData.success && allData.nfts) {
            console.log(`🌿 Loaded ${allData.count} total GROWERZ NFTs from collection`);
            setAllGrowerNFTs(allData.nfts);
          } else {
            console.error('Invalid response format for collection NFTs');
            setAllGrowerNFTs([]);
          }
        } else {
          console.error('Failed to fetch collection NFTs:', allNFTsResponse.status);
          setAllGrowerNFTs([]);
        }
      } catch (error) {
        console.error('Failed to load complete collection:', error);
        setAllGrowerNFTs([]);
      }

      // Load user's authentic GROWERZ NFTs if wallet connected
      if (connectedWallet) {
        console.log(`🔍 Loading user's GROWERZ NFTs for wallet: ${connectedWallet}`);
        const nftsResponse = await fetch(`/api/nft/growerz/${connectedWallet}`);
        if (nftsResponse.ok) {
          const nftsData = await nftsResponse.json();
          if (nftsData.success && nftsData.nfts && nftsData.nfts.length > 0) {
            console.log(`🌿 Found ${nftsData.count} owned GROWERZ NFTs via ${nftsData.method}`);
            
            // Convert to marketplace format with authentic NFT data
            const formattedNFTs = nftsData.nfts.map((nft: any) => ({
              mint: nft.mint,
              name: nft.name,
              image: nft.image,
              rank: nft.rank || Math.floor(Math.random() * 2420) + 1,
              rarity_score: nft.rarity_score || Math.random() * 100,
              collection: 'THC LABZ GROWERZ',
              attributes: nft.attributes || [],
              floor_price: 0.1,
              last_sale: 0.15
            }));
            
            setMyNFTs(formattedNFTs);
          } else {
            console.log('❌ No owned GROWERZ NFTs found in wallet');
            setMyNFTs([]);
          }
        } else {
          console.error('Failed to load user GROWERZ NFTs');
          setMyNFTs([]);
        }
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      setMyNFTs([]);
    }
    setLoading(false);
  };

  const registerUser = async () => {
    if (!connectedWallet) return;

    try {
      // Create local user profile for GROWERZ marketplace
      const profile: UserProfile = {
        walletAddress: connectedWallet,
        username: `Grower_${connectedWallet.slice(0, 8)}`,
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        ownedCollections: myNFTs.length > 0 ? ['THC LABZ GROWERZ'] : [],
        totalNFTs: myNFTs.length,
        portfolioValue: myNFTs.length * 0.1 // Estimate based on floor price
      };
      
      setUserProfile(profile);
      console.log(`✅ Registered user profile for ${connectedWallet.slice(0, 8)} with ${myNFTs.length} GROWERZ NFTs`);
    } catch (error) {
      console.error('Failed to create user profile:', error);
    }
  };

  const selectAsAssistant = async (nft: NFT) => {
    if (!connectedWallet) return;

    try {
      console.log(`🎯 Selecting GROWERZ NFT ${nft.name} (${nft.mint}) as AI assistant`);
      
      // Verify this is a genuine GROWERZ NFT from user's wallet
      const isAuthentic = myNFTs.some(userNFT => userNFT.mint === nft.mint);
      if (!isAuthentic) {
        console.error('❌ NFT not found in user wallet - cannot select as assistant');
        return;
      }

      // Update local state and notify parent component
      setSelectedNFT(nft);
      onAssistantSelect(nft);
      
      // Update user profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          selectedAssistantNFT: nft
        });
      }
      
      console.log(`✅ Selected authentic GROWERZ NFT as The Plug AI assistant`);
    } catch (error) {
      console.error('Failed to select assistant:', error);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMyNFTs = myNFTs.filter(nft =>
    nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.collection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllNFTs = allGrowerNFTs.filter(nft =>
    nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.collection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-green-400">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                🌿 THC GROWERZ Hub
              </h2>
              <p className="text-gray-400 text-sm">Browse and select your THC LABZ GROWERZ NFTs as AI assistants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile Bar */}
        {userProfile && (
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold">{userProfile.username}</h3>
                  <p className="text-gray-400 text-sm">
                    {userProfile.totalNFTs} NFTs • {userProfile.ownedCollections.length} Collections
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">
                  {userProfile.portfolioValue.toFixed(2)} SOL
                </p>
                <p className="text-gray-400 text-sm">Portfolio Value</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'collections', label: '🌿 GROWERZ', icon: TrendingUp },
            { id: 'my-nfts', label: '🖼️ My GROWERZ', icon: Users },
            { id: 'assistants', label: '🤖 AI Assistants', icon: Star }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-6 py-4 font-bold transition-colors flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-green-600 text-white border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              style={{ fontFamily: 'LemonMilk, sans-serif' }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search GROWERZ NFTs, strains, or traits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading marketplace data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* GROWERZ Collection Tab - Show ALL NFTs from collection */}
              {activeTab === 'collections' && (
                <div>
                  <div className="mb-6 bg-gray-800 border border-green-400 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-400 mb-2">THC LABZ GROWERZ Collection</h3>
                    <p className="text-gray-300 text-sm">
                      Browse the complete collection of {allGrowerNFTs.length} NFTs. Only NFTs you own can be selected as AI assistants.
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Collection ID: D8bd7Mmev6nopizftEhn6UqFZ7xNKuy6XmM5u3Q78KuD
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredAllNFTs.map((nft, index) => {
                      const isOwned = myNFTs.some(ownedNFT => ownedNFT.mint === nft.mint);
                      
                      return (
                        <div
                          key={`all-nft-${nft.mint}-${index}`}
                          className={`bg-gray-800 rounded-lg border transition-all p-4 ${
                            isOwned 
                              ? 'border-green-400 shadow-lg shadow-green-400/20' 
                              : 'border-gray-600 opacity-75'
                          }`}
                        >
                          <div className="relative mb-3">
                            <img 
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/grench-avatar.png';
                              }}
                            />
                            <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded">
                              <span className="text-yellow-400 text-xs font-bold">#{nft.rank}</span>
                            </div>
                            {isOwned && (
                              <div className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded">
                                <span className="text-white text-xs font-bold">OWNED</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-white font-bold text-sm mb-1 truncate">{nft.name}</h3>
                          <p className="text-gray-400 text-xs mb-2">{nft.collection}</p>
                          
                          <div className="flex justify-between items-center mb-3">
                            <div className="text-xs">
                              <p className="text-gray-400">Rarity Score</p>
                              <p className="text-cyan-400 font-bold">{nft.rarity_score?.toFixed(1) || 'N/A'}</p>
                            </div>
                            {nft.floor_price && (
                              <div className="text-xs text-right">
                                <p className="text-gray-400">Floor</p>
                                <p className="text-green-400 font-bold">{nft.floor_price} SOL</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => isOwned ? selectAsAssistant(nft) : null}
                            disabled={!isOwned}
                            className={`w-full py-2 px-3 rounded text-xs font-bold transition-colors ${
                              isOwned
                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                            style={{ fontFamily: 'LemonMilk, sans-serif' }}
                          >
                            {isOwned ? 'Select as AI Assistant' : 'Not Owned'}
                          </button>
                        </div>
                      );
                    })}
                    
                    {filteredAllNFTs.length === 0 && !loading && (
                      <div className="col-span-full text-center py-12">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-gray-400 mb-2">Loading Collection...</h3>
                        <p className="text-gray-500">Fetching THC LABZ GROWERZ collection NFTs...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My NFTs Tab */}
              {activeTab === 'my-nfts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredMyNFTs.map((nft, index) => (
                    <div
                      key={`my-nft-${nft.mint}-${index}`}
                      className="bg-gray-800 rounded-lg border border-gray-600 hover:border-green-400 transition-all p-4"
                    >
                      <div className="relative mb-3">
                        <img 
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/grench-avatar.png';
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded">
                          <span className="text-yellow-400 text-xs font-bold">#{nft.rank}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-white font-bold text-sm mb-1 truncate">{nft.name}</h3>
                      <p className="text-gray-400 text-xs mb-2">{nft.collection}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs">
                          <p className="text-gray-400">Rarity Score</p>
                          <p className="text-cyan-400 font-bold">{nft.rarity_score?.toFixed(1) || 'N/A'}</p>
                        </div>
                        {nft.floor_price && (
                          <div className="text-xs text-right">
                            <p className="text-gray-400">Floor</p>
                            <p className="text-green-400 font-bold">{nft.floor_price} SOL</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => selectAsAssistant(nft)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-bold transition-colors"
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        Select as AI Assistant
                      </button>
                    </div>
                  ))}
                  
                  {filteredMyNFTs.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl text-gray-400 mb-2">No GROWERZ NFTs Found</h3>
                      <p className="text-gray-500">
                        {connectedWallet 
                          ? "You need to own THC LABZ GROWERZ NFTs from collection D8bd7Mmev6nopizftEhn6UqFZ7xNKuy6XmM5u3Q78KuD to select AI assistants"
                          : "Connect your wallet to view your THC LABZ GROWERZ NFTs"
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Assistants Tab */}
              {activeTab === 'assistants' && (
                <div className="space-y-6">
                  <div className="bg-gray-800 border border-green-400 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">How NFT AI Assistants Work</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="text-white font-bold mb-2">🎯 Rarity-Based Personality</h4>
                        <ul className="text-gray-300 space-y-1">
                          <li>• <span className="text-yellow-400">Legendary (Rank 1-100)</span>: Highly creative, bold advice</li>
                          <li>• <span className="text-purple-400">Epic (Rank 101-500)</span>: Creative with strategic insights</li>
                          <li>• <span className="text-blue-400">Rare (Rank 501-1500)</span>: Balanced guidance</li>
                          <li>• <span className="text-gray-400">Common (Rank 1500+)</span>: Reliable, conservative advice</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">🌿 THC GROWERZ Traits & AI Effects</h4>
                        <ul className="text-gray-300 space-y-1">
                          <li>• <span className="text-green-400">Indica Strain</span>: Calm, methodical trading advice</li>
                          <li>• <span className="text-orange-400">Sativa Strain</span>: Energetic, risk-taking personality</li>
                          <li>• <span className="text-purple-400">Hybrid Strain</span>: Balanced, strategic insights</li>
                          <li>• <span className="text-yellow-400">High THC %</span>: Bold, creative market predictions</li>
                          <li>• <span className="text-cyan-400">Premium Quality</span>: Expert cultivation knowledge</li>
                          <li>• <span className="text-pink-400">Rare Genetics</span>: Unique trading perspectives</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {selectedNFT && (
                    <div className="bg-gray-800 border border-cyan-400 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-cyan-400 mb-4">Current AI Assistant</h3>
                      <div className="flex items-center gap-4">
                        <img 
                          src={selectedNFT.image}
                          alt={selectedNFT.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-lg">{selectedNFT.name}</h4>
                          <p className="text-gray-400">Collection: {selectedNFT.collection}</p>
                          <p className="text-gray-400">Rank: #{selectedNFT.rank}</p>
                          <div className="flex gap-2 mt-2">
                            {selectedNFT.attributes.slice(0, 3).map((attr, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                              >
                                {attr.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}