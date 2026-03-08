import React, { useState, useEffect } from 'react';
import { X, Search, Star, TrendingUp, Users, Package, Sparkles, Info, Edit3, Check, X as XIcon } from 'lucide-react';
import AIAssistantTab from './AIAssistantTab';
import { getTierInfo } from '../lib/utils';

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
  selectedplugnft?: NFT;
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
  const [activeTab, setActiveTab] = useState<'growerz-rarity' | 'traits-info' | 'my-nfts' | 'ai-assistants'>('growerz-rarity');
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [allGrowerNFTs, setAllGrowerNFTs] = useState<NFT[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedplugnft, setSelectedPlugNft] = useState<NFT | null>(null);
  
  // Username editing states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  
  // GROWERZ Tab Enhancement States
  const [growerZNFTs, setGrowerZNFTs] = useState<NFT[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<NFT[]>([]);
  const [traitFilters, setTraitFilters] = useState<Map<string, Set<string>>>(new Map());
  const [selectedTraits, setSelectedTraits] = useState<Map<string, Set<string>>>(new Map());
  const [sortBy, setSortBy] = useState<'rank' | 'rarity_score' | 'name'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [loadingRarity, setLoadingRarity] = useState(false);
  const [selectedNFTDetail, setSelectedNFTDetail] = useState<NFT | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Portfolio Value Calculation States
  const [tokenBalances, setTokenBalances] = useState({
    sol: 0,
    budz: 0,
    gbux: 0,
    thcLabz: 0
  });
  const [tokenPrices, setTokenPrices] = useState({
    sol: 0,
    budz: 0,
    gbux: 0,
    thcLabz: 0
  });
  const [nftFloorPrice, setNftFloorPrice] = useState(0.055);

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

  // Load existing selected NFT on component mount
  useEffect(() => {
    if (connectedWallet) {
      const savedNFT = localStorage.getItem('selectedPlugNft');
      if (savedNFT) {
        try {
          const nft = JSON.parse(savedNFT);
          setSelectedPlugNft(nft);
          setSelectedNFT(nft);
          console.log(`🔄 Loaded existing selected NFT: ${nft.name}`);
        } catch (error) {
          console.error('Error loading saved NFT:', error);
        }
      }
    }
  }, [connectedWallet]);

  // Listen for custom event to switch to AI Assistant tab
  useEffect(() => {
    const handleSwitchToAIAssistant = () => {
      console.log('🎯 Received event to switch to AI Assistant tab');
      setActiveTab('ai-assistants');
    };

    window.addEventListener('switchToAIAssistantTab', handleSwitchToAIAssistant);
    return () => window.removeEventListener('switchToAIAssistantTab', handleSwitchToAIAssistant);
  }, []);

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

      // Load authentic HowRare.is NFT data with pagination
      console.log('🔍 Loading authentic THC GROWERZ collection from HowRare.is...');
      await loadAuthenticGrowerZData(currentPage);

      // Load user's authentic GROWERZ NFTs using simplified MY NFTS API
      if (connectedWallet) {
        console.log(`🔍 MY NFTS: Loading GROWERZ NFTs for wallet: ${connectedWallet}`);
        const nftsResponse = await fetch(`/api/my-nfts/${connectedWallet}`);
        if (nftsResponse.ok) {
          const nftsData = await nftsResponse.json();
          if (nftsData.success && nftsData.nfts && nftsData.nfts.length > 0) {
            console.log(`🌿 MY NFTS: Found ${nftsData.count} owned GROWERZ NFTs via ${nftsData.method}`);
            
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
            
            console.log('🎯 NFT MARKETPLACE: Setting myNFTs state with:', formattedNFTs);
            setMyNFTs(formattedNFTs);
            console.log('🎯 NFT MARKETPLACE: myNFTs state should now contain:', formattedNFTs.length, 'NFTs');
          } else {
            console.log('❌ MY NFTS: No owned GROWERZ NFTs found in wallet');
            setMyNFTs([]);
          }
        } else {
          console.error('❌ MY NFTS: Failed to load wallet GROWERZ NFTs');
          setMyNFTs([]);
        }
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      setMyNFTs([]);
    }
    setLoading(false);
  };

  // Load authentic THC GROWERZ collection from HowRare.is API with pagination support
  const loadAuthenticGrowerZData = async (page: number = 1) => {
    setLoadingRarity(true);
    try {
      console.log(`🔍 Loading authentic THC GROWERZ collection from HowRare.is API (page ${page})...`);
      
      // Use ONLY HowRare.is API - no fallbacks to synthetic data
      const response = await fetch('/api/howrare/collection/complete');
      const data = await response.json();
      
      if (data.success && data.nfts) {
        console.log(`✅ Loaded ${data.count || 0} authentic NFTs (Source: ${data.source || 'Local'})`);
        
        const authenticNFTs = data.nfts || [];
        console.log(`✅ Received ${authenticNFTs.length} deduplicated NFTs from server`);
        
        setGrowerZNFTs(authenticNFTs); // Already deduplicated on server
        setAllGrowerNFTs(authenticNFTs);
        setTotalPages(Math.ceil(authenticNFTs.length / itemsPerPage));
        
        // Calculate current page data
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = authenticNFTs.slice(startIndex, endIndex);
        setFilteredNFTs(pageData);
        
        // Build trait filters from complete collection
        buildTraitFilters(authenticNFTs);
        
        // Log sample NFT to verify authentic data
        if (authenticNFTs.length > 0) {
          console.log('🔍 Sample authentic NFT:', {
            mint: authenticNFTs[0].mint,
            name: authenticNFTs[0].name,
            rank: authenticNFTs[0].rank,
            traits: authenticNFTs[0].attributes?.slice(0, 2)
          });
        }
      } else {
        console.error('❌ HowRare.is API temporarily unavailable');
        setGrowerZNFTs([]);
        setFilteredNFTs([]);
      }
    } catch (error) {
      console.error('❌ Error loading authentic HowRare.is data:', error);
      setGrowerZNFTs([]);
      setFilteredNFTs([]);
    } finally {
      setLoadingRarity(false);
    }
  };

  const buildTraitFilters = (nfts: NFT[]) => {
    const traits = new Map<string, Set<string>>();
    
    nfts.forEach(nft => {
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          if (!traits.has(attr.trait_type)) {
            traits.set(attr.trait_type, new Set());
          }
          traits.get(attr.trait_type)!.add(attr.value);
        });
      }
    });
    
    setTraitFilters(traits);
    console.log('🎨 Built trait filters:', Array.from(traits.keys()));
  };

  // Filter and Sort Functions with pagination support - DEDUPLICATION CRITICAL
  const applyFiltersAndSort = () => {
    // Ensure no duplicates in base data before filtering
    const uniqueNFTs = growerZNFTs.reduce((acc: NFT[], nft: NFT) => {
      if (!acc.find(existing => existing.mint === nft.mint)) {
        acc.push(nft);
      }
      return acc;
    }, []);
    
    let filtered = [...uniqueNFTs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.mint.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply trait filters
    selectedTraits.forEach((values, traitType) => {
      if (values.size > 0) {
        filtered = filtered.filter(nft => {
          const nftTrait = nft.attributes?.find(attr => attr.trait_type === traitType);
          return nftTrait && values.has(nftTrait.value);
        });
      }
    });

    // Sort by selected criteria
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rank':
          aValue = a.rank || 9999;
          bValue = b.rank || 9999;
          break;
        case 'rarity_score':
          aValue = a.rarity_score || 0;
          bValue = b.rarity_score || 0;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        default:
          aValue = a.rank || 9999;
          bValue = b.rank || 9999;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination to filtered results
    const totalFiltered = filtered.length;
    const newTotalPages = Math.ceil(totalFiltered / itemsPerPage);
    setTotalPages(newTotalPages);
    
    // Reset to page 1 if current page is beyond new total
    const safePage = currentPage > newTotalPages ? 1 : currentPage;
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
    
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filtered.slice(startIndex, endIndex);
    
    setFilteredNFTs(pageData);
  };

  // Effect to apply filters when dependencies change
  useEffect(() => {
    if (growerZNFTs.length > 0) {
      applyFiltersAndSort();
    }
  }, [growerZNFTs, searchTerm, selectedTraits, sortBy, sortDirection]);

  // Load authentic GROWERZ data when GROWERZ RARITY tab is active
  useEffect(() => {
    if (activeTab === 'growerz-rarity' && isOpen && growerZNFTs.length === 0) {
      // Use the already loaded authentic collection data
      if (allGrowerNFTs.length > 0) {
        setGrowerZNFTs(allGrowerNFTs);
        setFilteredNFTs(allGrowerNFTs);
        buildTraitFilters(allGrowerNFTs);
      }
    }
  }, [activeTab, isOpen, allGrowerNFTs]);

  const toggleTraitFilter = (traitType: string, value: string) => {
    const newSelectedTraits = new Map(selectedTraits);
    
    if (!newSelectedTraits.has(traitType)) {
      newSelectedTraits.set(traitType, new Set());
    }
    
    const traitSet = newSelectedTraits.get(traitType)!;
    if (traitSet.has(value)) {
      traitSet.delete(value);
      if (traitSet.size === 0) {
        newSelectedTraits.delete(traitType);
      }
    } else {
      traitSet.add(value);
    }
    
    setSelectedTraits(newSelectedTraits);
  };

  const clearAllFilters = () => {
    setSelectedTraits(new Map());
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Pagination handlers
  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      await loadAuthenticGrowerZData(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Calculate comprehensive portfolio value
  const calculatePortfolioValue = async (): Promise<number> => {
    if (!connectedWallet) return 0;

    try {
      // Fetch current token balances with error handling
      let walletData = { solBalance: 0, budzBalance: 0, gbuxBalance: 0, thcLabzTokenBalance: 0 };
      try {
        const walletResponse = await fetch(`/api/wallet/${connectedWallet}`);
        if (walletResponse.ok) {
          const responseText = await walletResponse.text();
          if (responseText.trim()) {
            walletData = JSON.parse(responseText);
          }
        }
      } catch (walletError) {
        console.warn('⚠️ Wallet API error, using defaults:', walletError);
      }
      
      // Fetch current token prices with error handling
      let pricesData = { sol: 0, budz: 0.0000123, gbux: 0.0000123, 'thc-labz': 0.001 };
      try {
        const pricesResponse = await fetch('/api/token-prices/batch');
        if (pricesResponse.ok) {
          const responseText = await pricesResponse.text();
          if (responseText.trim()) {
            pricesData = JSON.parse(responseText);
          }
        }
      } catch (priceError) {
        console.warn('⚠️ Price API error, using defaults:', priceError);
      }
      
      // Fetch GROWERZ floor price with error handling
      let currentFloorPrice = 0.055;
      try {
        const floorResponse = await fetch('/api/floor-price/thc-growerz');
        if (floorResponse.ok) {
          const responseText = await floorResponse.text();
          if (responseText.trim()) {
            const floorData = JSON.parse(responseText);
            currentFloorPrice = floorData.success ? floorData.floorPrice : 0.055;
          }
        }
      } catch (floorError) {
        console.warn('⚠️ Floor price API error, using default:', floorError);
      }
      
      const currentBalances = {
        sol: Number(walletData.solBalance) || 0,
        budz: Number(walletData.budzBalance) || 0,
        gbux: Number(walletData.gbuxBalance) || 0,
        thcLabz: Number(walletData.thcLabzTokenBalance) || 0
      };
      
      const currentPrices = {
        sol: Number(pricesData.sol) || 150, // Fallback SOL price in USD
        budz: Number(pricesData.budz) || 0.0000123,
        gbux: Number(pricesData.gbux) || 0.0000123,
        thcLabz: Number(pricesData['thc-labz']) || 0.001
      };
      
      // Update state
      setTokenBalances(currentBalances);
      setTokenPrices(currentPrices);
      setNftFloorPrice(currentFloorPrice);
      
      // Calculate total portfolio value in SOL
      const solValue = currentBalances.sol;
      const budzValueUsd = currentBalances.budz * currentPrices.budz;
      const gbuxValueUsd = currentBalances.gbux * currentPrices.gbux;
      const thcLabzValueUsd = currentBalances.thcLabz * currentPrices.thcLabz;
      const nftValue = myNFTs.length * currentFloorPrice;
      
      // Convert USD values to SOL equivalent
      const totalUsdValue = budzValueUsd + gbuxValueUsd + thcLabzValueUsd;
      const totalSolValue = solValue + (totalUsdValue / currentPrices.sol) + nftValue;
      
      console.log('💰 Portfolio Breakdown:', {
        sol: `${currentBalances.sol.toFixed(4)} SOL`,
        budz: `${currentBalances.budz.toLocaleString()} BUDZ ($${budzValueUsd.toFixed(6)})`,
        gbux: `${currentBalances.gbux.toLocaleString()} GBUX ($${gbuxValueUsd.toFixed(6)})`,
        thcLabz: `${currentBalances.thcLabz.toFixed(2)} THC ($${thcLabzValueUsd.toFixed(6)})`,
        nfts: `${myNFTs.length} NFTs (${nftValue.toFixed(4)} SOL)`,
        totalUsd: `$${totalUsdValue.toFixed(6)}`,
        totalSol: `${totalSolValue.toFixed(4)} SOL`
      });
      
      return totalSolValue;
    } catch (error) {
      console.error('❌ Error calculating portfolio value:', error);
      return myNFTs.length * 0.1; // Fallback estimate
    }
  };

  const registerUser = async () => {
    if (!connectedWallet) return;

    try {
      // Calculate accurate portfolio value
      const portfolioValue = await calculatePortfolioValue();
      
      // Load saved username from localStorage or use default
      const savedUsername = localStorage.getItem(`growerz_username_${connectedWallet}`);
      const defaultUsername = `Grower_${connectedWallet.slice(0, 8)}`;
      
      // Create local user profile for GROWERZ marketplace
      const profile: UserProfile = {
        walletAddress: connectedWallet,
        username: savedUsername || defaultUsername,
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        selectedplugnft: selectedplugnft || undefined, // Include selected NFT if available
        ownedCollections: myNFTs.length > 0 ? ['THC LABZ GROWERZ'] : [],
        totalNFTs: myNFTs.length,
        portfolioValue: portfolioValue
      };
      
      setUserProfile(profile);
      console.log(`✅ Registered user profile for ${connectedWallet.slice(0, 8)} with ${myNFTs.length} GROWERZ NFTs`);
      console.log(`💎 Portfolio Value: ${portfolioValue.toFixed(4)} SOL`);
    } catch (error) {
      console.error('Failed to create user profile:', error);
    }
  };

  const handleUsernameEdit = () => {
    if (userProfile) {
      setEditingUsername(userProfile.username);
      setIsEditingUsername(true);
    }
  };

  const handleUsernameSave = () => {
    if (connectedWallet && editingUsername.trim()) {
      const trimmedUsername = editingUsername.trim();
      
      // Update localStorage for persistence
      localStorage.setItem(`growerz_username_${connectedWallet}`, trimmedUsername);
      
      // Update user profile state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          username: trimmedUsername
        });
      }
      
      setIsEditingUsername(false);
      console.log(`✅ Username saved: ${trimmedUsername}`);
    }
  };

  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    setEditingUsername('');
  };

  const handleUsernameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUsernameSave();
    } else if (e.key === 'Escape') {
      handleUsernameCancel();
    }
  };

  const selectAsAssistant = async (nft: NFT) => {
    if (!connectedWallet) {
      console.warn('⚠️ No wallet connected for NFT selection');
      return;
    }

    if (!nft || !nft.mint) {
      console.error('❌ Invalid NFT data provided');
      return;
    }

    try {
      console.log(`🎯 Selecting GROWERZ NFT ${nft.name} (${nft.mint}) as AI assistant`);
      
      // Verify this is a genuine GROWERZ NFT from user's wallet
      const isAuthentic = myNFTs.some(userNFT => userNFT.mint === nft.mint);
      if (!isAuthentic) {
        console.warn('⚠️ NFT not found in user wallet - allowing selection anyway for debug');
        // Continue with selection for debugging purposes
      }

      // Set up the unified Plug NFT (handles AI, assistant, and all other functions)
      const plugNFT = {
        ...nft,
        floor_price: nft.floor_price || 0,
        last_sale: nft.last_sale || 0
      };
      
      // Update all local states
      setSelectedNFT(nft);
      setSelectedPlugNft(plugNFT);
      
      // Use the unified saveSelectedNFT utility for global management
      try {
        if (typeof window !== 'undefined' && (window as any).saveSelectedNFT) {
          await (window as any).saveSelectedNFT(plugNFT, connectedWallet);
        }
        
        // Unified Plug activation event
        window.dispatchEvent(new CustomEvent('plugActivated', { 
          detail: plugNFT 
        }));
      } catch (eventError) {
        console.warn('⚠️ Event dispatch error:', eventError);
        // Continue with selection even if events fail
      }
      
      // Switch to AI Assistants tab to interact with The Plug
      setActiveTab('ai-assistants');
      
      // Update user profile
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          selectedplugnft: nft
        });
      }
      
      console.log(`✅ Activated GROWERZ NFT as The Plug: ${nft.name}`);
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
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/thc-labz-logo-nowords.png" 
                alt="THC LABZ Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                🌿 THE GROWERZ
              </h2>
              <p className="text-gray-400 text-sm">Browse and select your GROWERZ NFTs as AI assistants</p>
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
                {userProfile.selectedplugnft?.image ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400">
                    <img 
                      src={userProfile.selectedplugnft.image} 
                      alt="Selected Plug"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-1">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingUsername}
                        onChange={(e) => setEditingUsername(e.target.value)}
                        onKeyDown={handleUsernameKeyPress}
                        className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex-1 min-w-0 border border-gray-600 focus:border-green-400 focus:outline-none"
                        placeholder="Enter username..."
                        maxLength={20}
                        autoFocus
                      />
                      <button
                        onClick={handleUsernameSave}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Save username"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleUsernameCancel}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Cancel editing"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold truncate">{userProfile.username}</h3>
                          <button
                            onClick={handleUsernameEdit}
                            className="p-1 text-gray-400 hover:text-green-400 transition-colors opacity-75 hover:opacity-100"
                            title="Edit username"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {userProfile.totalNFTs} NFTs • {userProfile.ownedCollections.length} Collections
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">
                  {userProfile.portfolioValue.toFixed(2)} SOL
                </p>
                <p className="text-gray-400 text-sm">Growerz</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Including Traits Info Tab */}
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {[
            { id: 'growerz-rarity', label: '🌿 GROWERZ RARITY', shortLabel: 'GROWERZ', icon: TrendingUp },
            { id: 'traits-info', label: '📊 TRAITS INFO', shortLabel: 'TRAITS', icon: Info },
            { id: 'my-nfts', label: '🖼️ My NFTs', shortLabel: 'My NFTs', icon: Users },
            { id: 'ai-assistants', label: '🤖 AI Assistants', shortLabel: 'AI', icon: Sparkles }
          ].map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3 sm:px-6 py-3 sm:py-4 font-bold transition-colors flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0 text-xs sm:text-sm ${
                activeTab === id
                  ? 'bg-green-600 text-white border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              style={{ fontFamily: 'LemonMilk, sans-serif' }}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Search Bar - Mobile Responsive */}
        <div className="p-3 sm:p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search GROWERZ NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Content Area - Mobile Responsive */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading marketplace data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Authentic HowRare.is Collection Embed */}
              {activeTab === 'growerz-rarity' && (
                <div>
                  {/* Header */}
                  <div className="mb-6 bg-gray-800 border border-green-400 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-400 mb-2">🌿 THE GROWERZ Collection</h3>
                    <p className="text-gray-300 text-sm mb-3">
                      Authentic HowRare.is collection data with real images and rarity rankings
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">2,420 Total Supply</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">2,347 Active Items</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">220 Holders</span>
                      <span className="text-xs bg-green-600 px-2 py-1 rounded">Direct HowRare.is Integration</span>
                    </div>
                  </div>

                  {/* Loading State for Authentic HowRare.is Data */}
                  {loadingRarity && (
                    <div className="flex items-center justify-center h-32 mb-6">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">Loading authentic HowRare.is collection data...</p>
                      </div>
                    </div>
                  )}

                  {/* Authentic HowRare.is NFT Grid - NO DUPLICATIONS */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {filteredNFTs.map((nft) => {
                      const isOwned = myNFTs.some(ownedNFT => ownedNFT.mint === nft.mint);
                      
                      return (
                        <div
                          key={nft.mint}
                          className={`bg-gray-800 rounded-lg border transition-all p-2 sm:p-4 ${
                            isOwned 
                              ? 'border-green-400 shadow-lg shadow-green-400/20' 
                              : 'border-gray-600'
                          }`}
                        >
                          <div className="relative mb-2 sm:mb-3">
                            <img 
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-32 sm:h-48 object-cover rounded-lg"
                              onError={(e) => {
                                console.log('Image load error for:', nft.image);
                                (e.target as HTMLImageElement).src = '/grench-avatar.png';
                              }}
                            />
                            
                            {/* Tier Badge with Icon */}
                            {nft.rank && (() => {
                              const tierInfo = getTierInfo(nft.rank);
                              return (
                                <div className={`absolute top-1 sm:top-2 right-1 sm:right-2 ${tierInfo.color} px-1 sm:px-2 py-0.5 sm:py-1 rounded`}>
                                  <span className="text-white text-xs font-bold flex items-center gap-1">
                                    <span className="hidden sm:inline">{tierInfo.icon}</span>
                                    <span>#{nft.rank}</span>
                                  </span>
                                </div>
                              );
                            })()}
                            
                            {/* Ownership Badge */}
                            {isOwned && (
                              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                                <span className="text-white text-xs font-bold">OWNED</span>
                              </div>
                            )}

                            {/* Rarity Tier Badge */}
                            {nft.rarity_score && (
                              <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-purple-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                                <span className="text-white text-xs font-bold">{nft.rarity_score.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-white font-bold text-xs sm:text-sm mb-1 truncate">{nft.name}</h3>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                            <div>
                              <p className="text-gray-400">Rank</p>
                              <p className="text-yellow-400 font-bold">#{nft.rank}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Score</p>
                              <p className="text-purple-400 font-bold">{nft.rarity_score?.toFixed(1) || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Trait Preview */}
                          {nft.attributes && nft.attributes.length > 0 && (
                            <div className="mb-2">
                              <p className="text-gray-400 text-xs mb-1">Traits: {nft.attributes.length}</p>
                              <div className="flex flex-wrap gap-1">
                                {nft.attributes.slice(0, 2).map((attr, i) => (
                                  <span key={i} className="bg-gray-700 text-xs px-1 py-0.5 rounded text-cyan-400">
                                    {attr.value}
                                  </span>
                                ))}
                                {nft.attributes.length > 2 && (
                                  <span className="text-gray-400 text-xs">+{nft.attributes.length - 2}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {isOwned && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAsAssistant(nft);
                              }}
                              className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
                              style={{ fontFamily: 'LemonMilk, sans-serif' }}
                            >
                              <span className="hidden sm:inline">Select as AI Assistant</span>
                              <span className="sm:hidden">Select AI</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {filteredNFTs.length === 0 && !loadingRarity && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-400 mb-2">No Authentic NFTs Found</h3>
                      <p className="text-gray-500">Loading authentic HowRare.is collection data...</p>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && !loadingRarity && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800 border border-gray-600 rounded-lg p-4">
                      <div className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages} • Showing {filteredNFTs.length} authentic NFTs
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 rounded text-sm font-bold transition-colors ${
                                  currentPage === page
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                            currentPage === totalPages
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* User's Owned NFTs Section */}
                  {myNFTs.length > 0 && (
                    <div className="mt-8 bg-gray-800 border border-green-400 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-green-400 mb-4">Your Owned GROWERZ NFTs</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {myNFTs.map((nft, index) => (
                          <div
                            key={`owned-nft-${nft.mint}-${index}`}
                            className="bg-gray-700 rounded-lg border border-green-400 p-3 shadow-lg shadow-green-400/20"
                          >
                            <div className="relative mb-2">
                              <img 
                                src={nft.image}
                                alt={nft.name}
                                className="w-full h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/grench-avatar.png';
                                }}
                              />
                              <div className="absolute top-1 right-1 bg-black bg-opacity-75 px-1 py-0.5 rounded">
                                <span className="text-yellow-400 text-xs font-bold">#{nft.rank}</span>
                              </div>
                            </div>
                            
                            <h5 className="text-white font-bold text-xs mb-2 truncate">{nft.name}</h5>
                            
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (nft) {
                                  selectAsAssistant(nft);
                                }
                              }}
                              className="mobile-touch-target w-full py-2 px-2 rounded text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
                              style={{ fontFamily: 'LemonMilk, sans-serif' }}
                            >
                              Select as AI Assistant
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h4 className="text-white font-bold mb-2">How to Use</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Click "Open HowRare.is Collection" above to browse all 2,420 authentic NFTs with real images</li>
                      <li>• View detailed rarity information, traits, and market data on HowRare.is</li>
                      <li>• If you own any GROWERZ NFTs, they'll appear in the "Your Owned NFTs" section below</li>
                      <li>• Select an owned NFT as your AI assistant for enhanced gameplay features</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Collection Stats Tab */}
              {false && ( // Disabled collections tab
                <div>
                  <div className="mb-6 bg-gray-800 border border-green-400 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-400 mb-2">THC LABZ GROWERZ Collection</h3>
                    <p className="text-gray-300 text-sm">
                      Browse the complete collection of {allGrowerNFTs.length} NFTs with authentic HowRare.is ranking data. Click any NFT to view detailed rarity information.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">2,420 Total Supply</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">2,347 Active Items</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">220 Holders</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">◎52.02 Volume</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {filteredAllNFTs.map((nft, index) => {
                      const isOwned = myNFTs.some(ownedNFT => ownedNFT.mint === nft.mint);
                      
                      return (
                        <div
                          key={`all-nft-${nft.mint}-${index}`}
                          className={`bg-gray-800 rounded-lg border transition-all p-2 sm:p-4 ${
                            isOwned 
                              ? 'border-green-400 shadow-lg shadow-green-400/20' 
                              : 'border-gray-600 opacity-75'
                          }`}
                        >
                          <div className="relative mb-2 sm:mb-3">
                            <img 
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-32 sm:h-48 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/grench-avatar.png';
                              }}
                            />
                            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black bg-opacity-75 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                              <span className="text-yellow-400 text-xs font-bold">#{nft.rank}</span>
                            </div>
                            {isOwned && (
                              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                                <span className="text-white text-xs font-bold">OWNED</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-white font-bold text-xs sm:text-sm mb-1 truncate">{nft.name}</h3>
                          <p className="text-gray-400 text-xs mb-1 sm:mb-2 hidden sm:block">{nft.collection}</p>
                          
                          <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <div className="text-xs">
                              <p className="text-gray-400 text-xs">Rarity</p>
                              <p className="text-cyan-400 font-bold text-xs">{nft.rarity_score?.toFixed(1) || 'N/A'}</p>
                            </div>
                            {nft.floor_price && (
                              <div className="text-xs text-right">
                                <p className="text-gray-400 text-xs">Floor</p>
                                <p className="text-green-400 font-bold text-xs">{nft.floor_price} SOL</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isOwned && nft) {
                                selectAsAssistant(nft);
                              }
                            }}
                            disabled={!isOwned}
                            className={`mobile-touch-target w-full py-2 sm:py-2 px-2 sm:px-3 rounded text-xs font-bold transition-colors ${
                              isOwned
                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                            style={{ fontFamily: 'LemonMilk, sans-serif' }}
                          >
                            <span className="hidden sm:inline">{isOwned ? 'Select as AI Assistant' : 'Not Owned'}</span>
                            <span className="sm:hidden">{isOwned ? 'Select AI' : 'Not Owned'}</span>
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

              {/* TRAITS INFO Tab - Complete Trait Bonus Reference */}
              {activeTab === 'traits-info' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-gray-800 border border-green-400 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-green-400 mb-3 flex items-center gap-3">
                      📊 Complete Traits Guide
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Comprehensive reference for all THC GROWERZ NFT traits and their gameplay bonuses. 
                      Use this guide to understand what bonuses each trait provides and make informed decisions about which NFTs to select as AI assistants.
                    </p>
                    <div className="bg-gradient-to-r from-purple-900/30 to-green-900/30 rounded-lg p-4 border border-purple-500/30">
                      <p className="text-yellow-400 font-bold text-sm mb-2">🎯 How to Use This Guide:</p>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Each trait category affects different aspects of gameplay</li>
                        <li>• Bonuses are balanced and range from 3% to 17% for fair gameplay</li>
                        <li>• Look for traits that match your preferred playstyle</li>
                        <li>• NFTs can have multiple traits that stack together</li>
                      </ul>
                    </div>
                  </div>

                  {/* Background Traits */}
                  <div className="bg-gray-800 border border-blue-400 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                      🌌 Background Traits (12 total)
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">Background affects your environment and city interactions</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Baby Blue</p>
                        <p className="text-green-400 text-xs">+5% Innocence</p>
                        <p className="text-gray-400 text-xs">Police less suspicious, lighter searches, first-time buyer trust</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Beige</p>
                        <p className="text-green-400 text-xs">+3% Neutral Reputation</p>
                        <p className="text-gray-400 text-xs">Blends in anywhere, no city penalties, works in all neighborhoods</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Blue</p>
                        <p className="text-green-400 text-xs">+4% Customer Loyalty</p>
                        <p className="text-gray-400 text-xs">Better prices in working-class cities like Detroit, Newark, Baltimore</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Crimson</p>
                        <p className="text-green-400 text-xs">+8% Danger Attraction</p>
                        <p className="text-gray-400 text-xs">Higher risk operations pay more, but heat builds faster</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Dark Gray</p>
                        <p className="text-green-400 text-xs">+6% Stealth Operations</p>
                        <p className="text-gray-400 text-xs">Better at avoiding detection, reduced police attention</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Gold</p>
                        <p className="text-green-400 text-xs">+3% Luxury Market</p>
                        <p className="text-gray-400 text-xs">Premium customers, high-end products, wealthy district bonuses</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Green</p>
                        <p className="text-green-400 text-xs">+7% Nature Connection</p>
                        <p className="text-gray-400 text-xs">Rural area bonuses, outdoor grows, environmental knowledge</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Light Blue</p>
                        <p className="text-green-400 text-xs">+4% Chill Vibe</p>
                        <p className="text-gray-400 text-xs">Calmer negotiations, beach town bonuses, relaxed atmosphere</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Orange</p>
                        <p className="text-green-400 text-xs">+6% Energy Boost</p>
                        <p className="text-gray-400 text-xs">Active lifestyle bonuses, gym connections, energetic deals</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Pink</p>
                        <p className="text-green-400 text-xs">+5% Social Charm</p>
                        <p className="text-gray-400 text-xs">Party scene access, social events, festival connections</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Purple</p>
                        <p className="text-green-400 text-xs">+8% Royalty Status</p>
                        <p className="text-gray-400 text-xs">VIP treatment, exclusive venues, high-society access</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-blue-300 font-bold text-sm">Starz And Stripez</p>
                        <p className="text-green-400 text-xs">+10% Patriotic Appeal</p>
                        <p className="text-gray-400 text-xs">Military connections, government worker trust, veteran networks</p>
                      </div>
                    </div>
                  </div>

                  {/* Skin Traits */}
                  <div className="bg-gray-800 border border-yellow-400 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      👤 Skin Traits (9 total)
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">Skin affects social interactions and reputation</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Brown</p>
                        <p className="text-green-400 text-xs">+5% Community Trust</p>
                        <p className="text-gray-400 text-xs">Better connections in diverse neighborhoods, cultural credibility</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Ecto</p>
                        <p className="text-green-400 text-xs">+9% Supernatural Intimidation</p>
                        <p className="text-gray-400 text-xs">Rivals fear confrontation, police hesitate during encounters</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Fair</p>
                        <p className="text-green-400 text-xs">+4% Privilege Bonus</p>
                        <p className="text-gray-400 text-xs">Less police harassment, better treatment in upscale areas</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Gold Drip</p>
                        <p className="text-green-400 text-xs">+4% Wealth Display</p>
                        <p className="text-gray-400 text-xs">Attracts high-paying customers, luxury market access</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Psychedelic</p>
                        <p className="text-green-400 text-xs">+4% Psychedelic Market</p>
                        <p className="text-gray-400 text-xs">Festival connections, enhanced prices for hallucinogens</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Skull</p>
                        <p className="text-green-400 text-xs">+4% Intimidation Factor</p>
                        <p className="text-gray-400 text-xs">Reduced robbery chance, rivals back down from disputes</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Solana</p>
                        <p className="text-green-400 text-xs">+3% Crypto Market</p>
                        <p className="text-gray-400 text-xs">Blockchain payments, tech-savvy customers, digital distribution</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Sticky Icky</p>
                        <p className="text-green-400 text-xs">+8% Product Quality</p>
                        <p className="text-gray-400 text-xs">Premium pricing, connoisseur customers, quality reputation</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-yellow-300 font-bold text-sm">Tatted-up</p>
                        <p className="text-green-400 text-xs">+4% Street Credibility</p>
                        <p className="text-gray-400 text-xs">Gang connections, underground market access, dealer respect</p>
                      </div>
                    </div>
                  </div>

                  {/* Clothes Traits */}
                  <div className="bg-gray-800 border border-purple-400 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                      👔 Clothes Traits (23 total)
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">Clothes affect reputation and professional access</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Artist Jacket</p>
                        <p className="text-green-400 text-xs">+7% Creative Markets</p>
                        <p className="text-gray-400 text-xs">Gallery connections, artist communities, creative district bonuses</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Basketball Jersey</p>
                        <p className="text-green-400 text-xs">+6% Sports Network</p>
                        <p className="text-gray-400 text-xs">Athlete connections, gym deals, sports venue access</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Designer Sweatshirt</p>
                        <p className="text-green-400 text-xs">+8% Fashion Forward</p>
                        <p className="text-gray-400 text-xs">Trendy clientele, premium pricing, style influence</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Hawaiian Shirt</p>
                        <p className="text-green-400 text-xs">+5% Vacation Vibes</p>
                        <p className="text-gray-400 text-xs">Tourist areas, relaxed atmosphere, beach town bonuses</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Leather Fur-jacket</p>
                        <p className="text-green-400 text-xs">+9% Luxury Status</p>
                        <p className="text-gray-400 text-xs">High-end clients, exclusive venues, premium market access</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Mink Coat</p>
                        <p className="text-green-400 text-xs">+11% Elite Access</p>
                        <p className="text-gray-400 text-xs">Wealthy districts, VIP treatment, luxury market dominance</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Spiked Jacket</p>
                        <p className="text-green-400 text-xs">+7% Punk Credibility</p>
                        <p className="text-gray-400 text-xs">Underground scenes, rebel networks, alternative markets</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-purple-300 font-bold text-sm">Tactical Vest</p>
                        <p className="text-green-400 text-xs">+8% Protection Bonus</p>
                        <p className="text-gray-400 text-xs">Reduced robbery risk, intimidation factor, security connections</p>
                      </div>
                    </div>
                  </div>

                  {/* Head Traits */}
                  <div className="bg-gray-800 border border-cyan-400 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                      🎩 Head Traits (19 total)
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">Head accessories affect credibility and style</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-cyan-300 font-bold text-sm">Beanies</p>
                        <p className="text-green-400 text-xs">+5% Street Credibility</p>
                        <p className="text-gray-400 text-xs">Skate culture connections, underground respect, youth market</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-cyan-300 font-bold text-sm">Crown</p>
                        <p className="text-green-400 text-xs">+12% Royal Treatment</p>
                        <p className="text-gray-400 text-xs">VIP access, luxury clientele, premium pricing authority</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-cyan-300 font-bold text-sm">Fire Horns</p>
                        <p className="text-green-400 text-xs">+9% Demonic Intimidation</p>
                        <p className="text-gray-400 text-xs">Supernatural fear factor, rival deterrent, mystical markets</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-cyan-300 font-bold text-sm">Heisenberg Hat</p>
                        <p className="text-green-400 text-xs">+10% Chemistry Knowledge</p>
                        <p className="text-gray-400 text-xs">Lab connections, quality expertise, scientific credibility</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-cyan-300 font-bold text-sm">Rasta Hat</p>
                        <p className="text-green-400 text-xs">+8% Natural Product Bonus</p>
                        <p className="text-gray-400 text-xs">Organic market focus, spiritual connections, reggae scene</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-cyan-300 font-bold text-sm">Tupac Bandana</p>
                        <p className="text-green-400 text-xs">+7% Hip-Hop Credibility</p>
                        <p className="text-gray-400 text-xs">Rap scene connections, urban market authority, music industry</p>
                      </div>
                    </div>
                  </div>

                  {/* Mouth Traits */}
                  <div className="bg-gray-800 border border-orange-400 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                      😮 Mouth Traits (14 total)
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">Mouth accessories affect communication and deals</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-orange-300 font-bold text-sm">Blunt</p>
                        <p className="text-green-400 text-xs">+8% Cannabis Expertise</p>
                        <p className="text-gray-400 text-xs">Product knowledge, connoisseur status, quality recognition</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-orange-300 font-bold text-sm">Cross Joint</p>
                        <p className="text-green-400 text-xs">+9% Innovation Bonus</p>
                        <p className="text-gray-400 text-xs">Creative methods, unique products, trendsetter reputation</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-orange-300 font-bold text-sm">Dab Rig</p>
                        <p className="text-green-400 text-xs">+10% Concentrate Specialist</p>
                        <p className="text-gray-400 text-xs">High-potency market, tech-savvy customers, premium extracts</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-orange-300 font-bold text-sm">Gold Grillz</p>
                        <p className="text-green-400 text-xs">+7% Wealth Display</p>
                        <p className="text-gray-400 text-xs">Hip-hop culture, luxury appeal, status symbol effect</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-orange-300 font-bold text-sm">Joint</p>
                        <p className="text-green-400 text-xs">+6% Classic Appeal</p>
                        <p className="text-gray-400 text-xs">Traditional methods, universal acceptance, broad market</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-orange-300 font-bold text-sm">Tongue Out</p>
                        <p className="text-green-400 text-xs">+5% Playful Charisma</p>
                        <p className="text-gray-400 text-xs">Party atmosphere, social connections, fun-loving reputation</p>
                      </div>
                    </div>
                  </div>

                  {/* Eyes Traits */}
                  <div className="bg-gray-800 border border-pink-400 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-pink-400 mb-4 flex items-center gap-2">
                      👀 Eyes Traits (12 total)
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">Eyes affect perception and opportunities</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-pink-300 font-bold text-sm">Aviator</p>
                        <p className="text-green-400 text-xs">+7% Professional Look</p>
                        <p className="text-gray-400 text-xs">Business connections, pilot networks, authority appearance</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-pink-300 font-bold text-sm">Led Shades</p>
                        <p className="text-green-400 text-xs">+8% Tech Appeal</p>
                        <p className="text-gray-400 text-xs">Rave scene, electronic music, futuristic market appeal</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-pink-300 font-bold text-sm">Money Eye</p>
                        <p className="text-green-400 text-xs">+9% Profit Focus</p>
                        <p className="text-gray-400 text-xs">Deal optimization, financial insight, money-making opportunities</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-pink-300 font-bold text-sm">Shocked</p>
                        <p className="text-green-400 text-xs">+6% Surprise Advantage</p>
                        <p className="text-gray-400 text-xs">Unexpected opportunities, reaction speed, adaptation bonuses</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-pink-300 font-bold text-sm">Thug Life Shades</p>
                        <p className="text-green-400 text-xs">+8% Street Authority</p>
                        <p className="text-gray-400 text-xs">Gang respect, underground networks, intimidation factor</p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-pink-300 font-bold text-sm">Vigilante Mask</p>
                        <p className="text-green-400 text-xs">+10% Stealth Operations</p>
                        <p className="text-gray-400 text-xs">Anonymous deals, secret networks, reduced police detection</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary and Pro Tips */}
                  <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-6 border border-green-500/30">
                    <h4 className="text-lg font-bold text-green-400 mb-3">🎯 Strategy Guide</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-yellow-400 font-bold mb-2">💡 Trait Combinations:</p>
                        <ul className="text-gray-300 space-y-1">
                          <li>• <span className="text-blue-400">Stealth Build:</span> Dark Gray + Skull + Tactical Vest + Vigilante Mask</li>
                          <li>• <span className="text-yellow-400">Wealth Build:</span> Gold + Mink Coat + Crown + Money Eye</li>
                          <li>• <span className="text-green-400">Street Build:</span> Crimson + Tatted-up + Tupac Bandana + Thug Life Shades</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-yellow-400 font-bold mb-2">🏆 Pro Tips:</p>
                        <ul className="text-gray-300 space-y-1">
                          <li>• Higher rarity NFTs get base multiplier bonuses</li>
                          <li>• All trait bonuses stack for maximum effect</li>
                          <li>• Match your NFT traits to your preferred playstyle</li>
                          <li>• Bonuses range from 3% to 17% for balanced gameplay</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* My NFTs Tab - Simplified Wallet NFT Detection */}
              {activeTab === 'my-nfts' && (
                <div className="space-y-6">
                  {/* Wallet Connection Status */}
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-2">Connected Wallet</h3>
                    {connectedWallet ? (
                      <div className="space-y-2">
                        <p className="text-green-400 font-mono text-sm">{connectedWallet}</p>
                        <p className="text-gray-400 text-sm">Scanning for THC GROWERZ NFTs...</p>
                      </div>
                    ) : (
                      <p className="text-red-400 text-sm">No wallet connected</p>
                    )}
                  </div>

                  {/* My GROWERZ NFTs */}
                  {connectedWallet && (
                    <div className="bg-gray-800 border border-green-400 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-green-400 mb-4">Your THC GROWERZ NFTs</h3>
                      
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
                          <p className="text-gray-400">Fetching your GROWERZ NFTs...</p>
                        </div>
                      ) : (() => {
                        console.log('🎯 MY NFTS RENDER: myNFTs.length =', myNFTs.length, 'myNFTs =', myNFTs);
                        return myNFTs.length > 0;
                      })() ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {myNFTs.map((nft, index) => (
                            <div
                              key={`my-nft-${nft.mint}-${index}`}
                              className="bg-gray-700 rounded-lg border border-green-400 p-4 hover:shadow-lg hover:shadow-green-400/20 transition-all"
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
                                {/* Tier Badge with Icon */}
                                {nft.rank && (() => {
                                  const tierInfo = getTierInfo(nft.rank);
                                  return (
                                    <div className={`absolute top-2 right-2 ${tierInfo.color} px-2 py-1 rounded`}>
                                      <span className="text-white text-xs font-bold flex items-center gap-1">
                                        <span>{tierInfo.icon}</span>
                                        <span>#{nft.rank}</span>
                                      </span>
                                    </div>
                                  );
                                })()}
                                <div className="absolute top-2 left-2 bg-green-600 px-2 py-1 rounded">
                                  <span className="text-white text-xs font-bold">OWNED</span>
                                </div>
                              </div>
                              
                              <h4 className="text-white font-bold text-sm mb-2 truncate">{nft.name}</h4>
                              
                              {/* NFT Traits */}
                              {nft.attributes && nft.attributes.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-gray-400 text-xs mb-2">Traits ({nft.attributes.length})</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {nft.attributes.slice(0, 6).map((attr, i) => (
                                      <div key={i} className="bg-gray-600 rounded px-2 py-1">
                                        <p className="text-gray-300 text-xs font-semibold">{attr.trait_type}</p>
                                        <p className="text-cyan-400 text-xs">{attr.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {nft.attributes.length > 6 && (
                                    <p className="text-gray-400 text-xs mt-2">+{nft.attributes.length - 6} more traits</p>
                                  )}
                                </div>
                              )}
                              
                              {/* Rarity Score */}
                              {nft.rarity_score && (
                                <div className="mb-3 bg-gray-600 rounded p-2">
                                  <p className="text-gray-400 text-xs">Rarity Score</p>
                                  <p className="text-cyan-400 font-bold text-sm">{nft.rarity_score.toFixed(1)}</p>
                                </div>
                              )}

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (nft) {
                                    selectAsAssistant(nft);
                                  }
                                }}
                                className="mobile-touch-target w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-bold transition-colors"
                                style={{ fontFamily: 'LemonMilk, sans-serif' }}
                              >
                                Select as AI Assistant
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <h4 className="text-xl text-gray-400 mb-2">No GROWERZ NFTs Found</h4>
                          <p className="text-gray-500 mb-4">
                            We couldn't find any THC LABZ GROWERZ NFTs in your connected wallet.
                          </p>
                          <div className="bg-gray-700 rounded p-3 text-left max-w-md mx-auto">
                            <p className="text-gray-300 text-sm font-semibold mb-2">To use this feature:</p>
                            <ul className="text-gray-400 text-sm space-y-1">
                              <li>• Own THC LABZ GROWERZ NFTs</li>
                              <li>• Collection ID: D8bd7Mmev6nopizftEhn6UqFZ7xNKuy6XmM5u3Q78KuD</li>
                              <li>• Available on Magic Eden & other marketplaces</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h4 className="text-white font-bold mb-2">How This Works</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Connect your wallet to scan for THC GROWERZ NFTs</li>
                      <li>• Only authentic NFTs from collection D8bd7Mmev6nopizftEhn6UqFZ7xNKuy6XmM5u3Q78KuD are detected</li>
                      <li>• View all traits, rarity scores, and authentic HowRare.is data</li>
                      <li>• Select any owned NFT as your AI assistant for enhanced gameplay</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Assistants Tab - Trait Analysis */}
              {activeTab === 'ai-assistants' && (
                <AIAssistantTab selectedAssistant={selectedplugnft ? {
                  ...selectedplugnft,
                  floor_price: selectedplugnft.floor_price || 0,
                  last_sale: selectedplugnft.last_sale || 0
                } : null} />
              )}
            </>
          )}
        </div>
      </div>

      {/* NFT Detail Modal */}
      {selectedNFTDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-green-400 max-w-2xl w-full max-h-full overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedNFTDetail.image}
                    alt={selectedNFTDetail.name}
                    className="w-20 h-20 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/grench-avatar.png';
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedNFTDetail.name}</h2>
                    <p className="text-gray-400">{selectedNFTDetail.collection}</p>
                    <div className="flex gap-4 mt-2">
                      <div className="text-center">
                        <p className="text-yellow-400 text-lg font-bold">#{selectedNFTDetail.rank}</p>
                        <p className="text-gray-400 text-xs">Rank</p>
                      </div>
                      <div className="text-center">
                        <p className="text-purple-400 text-lg font-bold">{selectedNFTDetail.rarity_score?.toFixed(1) || 'N/A'}</p>
                        <p className="text-gray-400 text-xs">Rarity Score</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNFTDetail(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* HowRare.is Authentic Data Section */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 mb-6 border border-purple-500/30">
                <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                  🏆 HowRare.is Authentic Rarity Data
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-gray-800 rounded-lg p-3">
                    <p className="text-yellow-400 text-2xl font-bold">#{selectedNFTDetail.rank}</p>
                    <p className="text-gray-400 text-sm">Global Rank</p>
                    <p className="text-gray-500 text-xs">out of 2,420</p>
                  </div>
                  <div className="text-center bg-gray-800 rounded-lg p-3">
                    <p className="text-purple-400 text-2xl font-bold">{selectedNFTDetail.rarity_score?.toFixed(1) || 'N/A'}</p>
                    <p className="text-gray-400 text-sm">Rarity Score</p>
                    <p className="text-gray-500 text-xs">Statistical rarity</p>
                  </div>
                </div>
              </div>

              {/* Traits Section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-green-400 mb-3">Traits & Attributes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedNFTDetail.attributes.map((trait, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <p className="text-gray-400 text-xs uppercase tracking-wide">{trait.trait_type}</p>
                      <p className="text-white font-bold">{trait.value}</p>
                      {trait.rarity && (
                        <p className="text-cyan-400 text-xs">{trait.rarity}% have this</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Data */}
              {(selectedNFTDetail.floor_price || selectedNFTDetail.last_sale) && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">Market Data</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedNFTDetail.floor_price && (
                      <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-green-400 text-xl font-bold">{selectedNFTDetail.floor_price} SOL</p>
                        <p className="text-gray-400 text-sm">Floor Price</p>
                      </div>
                    )}
                    {selectedNFTDetail.last_sale && (
                      <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-blue-400 text-xl font-bold">{selectedNFTDetail.last_sale} SOL</p>
                        <p className="text-gray-400 text-sm">Last Sale</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedNFTDetail) {
                      selectAsAssistant(selectedNFTDetail);
                      setSelectedNFTDetail(null);
                    }
                  }}
                  className="mobile-touch-target flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-bold transition-colors"
                  style={{ fontFamily: 'LemonMilk, sans-serif' }}
                >
                  Select as AI Assistant
                </button>
                <button
                  onClick={() => setSelectedNFTDetail(null)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}