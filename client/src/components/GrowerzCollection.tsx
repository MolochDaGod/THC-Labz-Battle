import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, ArrowUpDown, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface NFT {
  mint: string;
  name: string;
  image: string;
  rank: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  rarity?: string;
  price?: number;
}

interface TraitFilter {
  trait_type: string;
  values: string[];
}

interface FilterState {
  traits: Record<string, string[]>;
  rankRange: [number, number];
  priceRange: [number, number];
  searchTerm: string;
}

export default function GrowerzCollection() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'name'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [paginatedNfts, setPaginatedNfts] = useState<NFT[]>([]);
  
  const [availableTraits, setAvailableTraits] = useState<Record<string, string[]>>({});
  const [filters, setFilters] = useState<FilterState>({
    traits: {},
    rankRange: [1, 10000],
    priceRange: [0, 1000],
    searchTerm: ''
  });

  // Load GROWERZ collection data
  useEffect(() => {
    loadCollection();
  }, []);

  // Apply filters whenever filters or nfts change
  useEffect(() => {
    applyFilters();
  }, [filters, nfts, sortBy, sortOrder]);

  // Update pagination when filtered NFTs change
  useEffect(() => {
    updatePagination();
  }, [filteredNfts, currentPage]);

  const updatePagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedNfts(filteredNfts.slice(startIndex, endIndex));
  };

  const totalPages = Math.ceil(filteredNfts.length / itemsPerPage);

  const loadCollection = async () => {
    try {
      setLoading(true);
      
      // Load complete collection data from HowRare.is API
      const response = await fetch('/api/howrare/collection/complete');
      const data = await response.json();
      
      if (data.success && data.nfts) {
        setNfts(data.nfts);
        extractTraits(data.nfts);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractTraits = (nftList: NFT[]) => {
    const traits: Record<string, Set<string>> = {};
    
    nftList.forEach(nft => {
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          if (!traits[attr.trait_type]) {
            traits[attr.trait_type] = new Set();
          }
          traits[attr.trait_type].add(attr.value);
        });
      }
    });

    // Convert sets to arrays and sort
    const traitOptions: Record<string, string[]> = {};
    Object.keys(traits).forEach(traitType => {
      traitOptions[traitType] = Array.from(traits[traitType]).sort();
    });

    setAvailableTraits(traitOptions);
  };

  const applyFilters = () => {
    let filtered = [...nfts];

    // Apply search term
    if (filters.searchTerm) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        nft.mint.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Apply trait filters
    Object.entries(filters.traits).forEach(([traitType, selectedValues]) => {
      if (selectedValues.length > 0) {
        filtered = filtered.filter(nft => {
          const nftTrait = nft.attributes?.find(attr => attr.trait_type === traitType);
          return nftTrait && selectedValues.includes(nftTrait.value);
        });
      }
    });

    // Apply rank range
    filtered = filtered.filter(nft => 
      nft.rank >= filters.rankRange[0] && nft.rank <= filters.rankRange[1]
    );

    // Apply price range (if price data available)
    if (filtered.some(nft => nft.price)) {
      filtered = filtered.filter(nft => 
        !nft.price || (nft.price >= filters.priceRange[0] && nft.price <= filters.priceRange[1])
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredNfts(filtered);
  };

  const updateTraitFilter = (traitType: string, value: string, checked: boolean) => {
    setFilters(prev => {
      const newTraits = { ...prev.traits };
      
      if (!newTraits[traitType]) {
        newTraits[traitType] = [];
      }
      
      if (checked) {
        newTraits[traitType] = [...newTraits[traitType], value];
      } else {
        newTraits[traitType] = newTraits[traitType].filter(v => v !== value);
      }
      
      // Remove empty arrays
      if (newTraits[traitType].length === 0) {
        delete newTraits[traitType];
      }
      
      return { ...prev, traits: newTraits };
    });
  };

  const clearFilters = () => {
    setFilters({
      traits: {},
      rankRange: [1, 10000],
      priceRange: [0, 1000],
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters.traits).length + 
           (filters.searchTerm ? 1 : 0) +
           (filters.rankRange[0] !== 1 || filters.rankRange[1] !== 10000 ? 1 : 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Loading GROWERZ Collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">GROWERZ Collection</h1>
              <p className="text-green-400">
                {filteredNfts.length} of {nfts.length} NFTs • Page {currentPage} of {totalPages}
              </p>
            </div>
            
            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or mint..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none w-full sm:w-64"
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List size={20} />
                </button>
              </div>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as any);
                  setSortOrder(order as any);
                }}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:outline-none"
              >
                <option value="rank-asc">Rank: Low to High</option>
                <option value="rank-desc">Rank: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white hover:bg-gray-700 transition-colors"
              >
                <Filter size={20} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 h-full">
        <div className="flex gap-6 h-full">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 h-fit sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  Clear All
                </button>
              </div>

              {/* Rank Range */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Rank Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.rankRange[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      rankRange: [parseInt(e.target.value) || 1, prev.rankRange[1]]
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.rankRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      rankRange: [prev.rankRange[0], parseInt(e.target.value) || 10000]
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Trait Filters */}
              {Object.entries(availableTraits).map(([traitType, values]) => (
                <div key={traitType} className="mb-6">
                  <label className="block text-white font-semibold mb-2">{traitType}</label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {values.map(value => (
                      <label key={value} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.traits[traitType]?.includes(value) || false}
                          onChange={(e) => updateTraitFilter(traitType, value, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm">{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NFT Grid/List */}
          <div className="flex-1 overflow-y-auto">
            {paginatedNfts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No NFTs found matching your filters</p>
              </div>
            ) : (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                    : "space-y-4"
                }>
                  {paginatedNfts.map(nft => (
                    <div
                      key={nft.mint}
                      className={`bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-gray-700/50 transition-colors cursor-pointer border border-gray-700/50 hover:border-green-500/30 ${
                        viewMode === 'list' ? 'flex gap-4 p-4' : 'p-3'
                      }`}
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className={`rounded-lg ${
                          viewMode === 'list' ? 'w-20 h-20 object-cover' : 'w-full aspect-square object-cover mb-3'
                        }`}
                        loading="lazy"
                      />
                      <div className={viewMode === 'list' ? 'flex-1' : ''}>
                        <h3 className="text-white font-semibold mb-1 text-sm truncate">{nft.name}</h3>
                        <p className="text-green-400 text-xs mb-2">Rank #{nft.rank}</p>
                        {nft.price && (
                          <p className="text-gray-300 text-xs mb-2">{nft.price} SOL</p>
                        )}
                        {viewMode === 'grid' && nft.attributes && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {nft.attributes.slice(0, 2).map(attr => (
                              <span
                                key={`${attr.trait_type}-${attr.value}`}
                                className="bg-gray-700 text-xs px-1 py-0.5 rounded text-gray-300 truncate"
                                title={`${attr.trait_type}: ${attr.value}`}
                              >
                                {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                        {viewMode === 'list' && nft.attributes && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {nft.attributes.slice(0, 3).map(attr => (
                              <span
                                key={`${attr.trait_type}-${attr.value}`}
                                className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300"
                              >
                                {attr.trait_type}: {attr.value}
                              </span>
                            ))}
                            {nft.attributes.length > 3 && (
                              <span className="text-gray-400 text-xs">+{nft.attributes.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8 mb-4">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        if (totalPages > 10) {
                          // Show first 3, current +/- 2, last 3
                          if (pageNum <= 3 || pageNum >= totalPages - 2 || 
                              (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg ${
                                  currentPage === pageNum
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          if (pageNum === 4 && currentPage > 6) {
                            return <span key="dots1" className="text-gray-400">...</span>;
                          }
                          if (pageNum === totalPages - 3 && currentPage < totalPages - 5) {
                            return <span key="dots2" className="text-gray-400">...</span>;
                          }
                          return null;
                        } else {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}