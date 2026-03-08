import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Gamepad2, Shield, Zap, Target } from 'lucide-react';

interface GameType {
  id: string;
  name: string;
  category: 'rpg' | 'strategy' | 'shooter' | 'racing' | 'puzzle' | 'adventure';
  description: string;
  nftImpactTypes: string[];
  isActive: boolean;
}

interface NFTBonus {
  id: string;
  traitType: string;
  traitValue: string;
  bonusType: 'stat' | 'ability' | 'cosmetic' | 'economy';
  bonusValue: number;
  gameTypes: string[];
  description: string;
}

interface AdminPanelProps {
  isAdmin: boolean;
  onClose: () => void;
}

function AdminPanel({ isAdmin, onClose }: AdminPanelProps) {
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [nftBonuses, setNftBonuses] = useState<NFTBonus[]>([]);
  const [activeTab, setActiveTab] = useState<'games' | 'bonuses'>('games');
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddBonus, setShowAddBonus] = useState(false);

  useEffect(() => {
    fetchGameTypes();
    fetchNFTBonuses();
  }, []);

  const fetchGameTypes = async () => {
    try {
      const response = await fetch('/api/admin/game-types');
      if (response.ok) {
        const data = await response.json();
        setGameTypes(data.gameTypes || []);
      }
    } catch (error) {
      console.error('Error fetching game types:', error);
    }
  };

  const fetchNFTBonuses = async () => {
    try {
      const response = await fetch('/api/admin/nft-bonuses');
      if (response.ok) {
        const data = await response.json();
        setNftBonuses(data.bonuses || []);
      }
    } catch (error) {
      console.error('Error fetching NFT bonuses:', error);
    }
  };

  const createGameType = async (gameData: Partial<GameType>) => {
    try {
      const response = await fetch('/api/admin/game-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      if (response.ok) {
        fetchGameTypes();
        setShowAddGame(false);
      }
    } catch (error) {
      console.error('Error creating game type:', error);
    }
  };

  const createNFTBonus = async (bonusData: Partial<NFTBonus>) => {
    try {
      const response = await fetch('/api/admin/nft-bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bonusData)
      });
      if (response.ok) {
        fetchNFTBonuses();
        setShowAddBonus(false);
      }
    } catch (error) {
      console.error('Error creating NFT bonus:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg">
          <h2 className="text-xl text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-4">Admin privileges required</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-5/6 h-5/6 rounded-lg overflow-hidden">
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <h2 className="text-2xl text-green-400 font-bold">THC GROWERZ Game Onboarding Admin</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex h-full">
          <div className="w-1/4 bg-gray-800 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('games')}
                className={`w-full text-left p-3 rounded flex items-center gap-2 ${
                  activeTab === 'games' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Gamepad2 size={20} />
                Game Types
              </button>
              <button
                onClick={() => setActiveTab('bonuses')}
                className={`w-full text-left p-3 rounded flex items-center gap-2 ${
                  activeTab === 'bonuses' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Zap size={20} />
                NFT Bonuses
              </button>
            </nav>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'games' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl text-white">Game Types Configuration</h3>
                  <button
                    onClick={() => setShowAddGame(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-500"
                  >
                    <Plus size={16} />
                    Add Game Type
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameTypes.map((game) => (
                    <div key={game.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-green-400 font-bold">{game.name}</h4>
                        <div className="flex gap-2">
                          <button className="text-blue-400 hover:text-blue-300">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{game.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          game.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                        }`}>
                          {game.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 bg-purple-600 text-white rounded text-xs">
                          {game.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Impact Types: {game.nftImpactTypes.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'bonuses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl text-white">NFT Trait Bonuses</h3>
                  <button
                    onClick={() => setShowAddBonus(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-500"
                  >
                    <Plus size={16} />
                    Add NFT Bonus
                  </button>
                </div>

                <div className="space-y-4">
                  {nftBonuses.map((bonus) => (
                    <div key={bonus.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-green-400 font-bold">
                            {bonus.traitType}: {bonus.traitValue}
                          </h4>
                          <p className="text-gray-300 text-sm">{bonus.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-blue-400 hover:text-blue-300">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          bonus.bonusType === 'stat' ? 'bg-blue-600' :
                          bonus.bonusType === 'ability' ? 'bg-purple-600' :
                          bonus.bonusType === 'cosmetic' ? 'bg-pink-600' :
                          'bg-yellow-600'
                        } text-white`}>
                          {bonus.bonusType}
                        </span>
                        <span className="text-green-400 font-bold">+{bonus.bonusValue}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Active in: {bonus.gameTypes.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GrowerzGameOnboarding() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [gameImpacts, setGameImpacts] = useState<any[]>([]);

  const connectWallet = async () => {
    try {
      if ('solana' in window) {
        const provider = (window as any).solana;
        if (provider.isPhantom || provider.isSolflare) {
          const response = await provider.connect();
          const address = response.publicKey.toString();
          setWalletAddress(address);
          
          // Check admin status
          const adminResponse = await fetch(`/api/admin/check/${address}`);
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            setIsAdmin(adminData.isAdmin || false);
          }
          
          fetchUserNFTs(address);
        }
      } else {
        alert('Please install a Solana wallet (Phantom, Solflare, etc.)');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const fetchUserNFTs = async (address: string) => {
    try {
      const response = await fetch(`/api/my-nfts/${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserNFTs(data.nfts || []);
          calculateGameImpacts(data.nfts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    }
  };

  const calculateGameImpacts = async (nfts: any[]) => {
    try {
      const response = await fetch('/api/calculate-game-impacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfts })
      });
      if (response.ok) {
        const data = await response.json();
        setGameImpacts(data.impacts || []);
      }
    } catch (error) {
      console.error('Error calculating game impacts:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
            THC GROWERZ
          </h1>
          <h2 className="text-2xl text-gray-300 mb-2">Universal Game NFT Integration Platform</h2>
          <p className="text-gray-400">
            Onboard your GROWERZ NFTs as game-impacting assets across multiple game types
          </p>
        </div>

        {!walletAddress ? (
          <div className="text-center">
            <button
              onClick={connectWallet}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-purple-600 text-white font-bold text-xl rounded-lg hover:from-green-500 hover:to-purple-500 transition-all"
            >
              Connect Wallet to Begin
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-green-400">Your GROWERZ Collection</h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded flex items-center gap-2 hover:bg-purple-500"
                  >
                    <Settings size={16} />
                    Admin Panel
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userNFTs.map((nft) => (
                  <div key={nft.mint} className="bg-gray-800 rounded-lg p-4">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <h4 className="text-white font-bold mb-2">{nft.name}</h4>
                    {nft.rank && (
                      <div className="text-yellow-400 font-bold mb-2">Rank #{nft.rank}</div>
                    )}
                    <div className="space-y-1">
                      {nft.attributes?.slice(0, 2).map((attr: any, index: number) => (
                        <div key={index} className="text-sm text-gray-300">
                          <span className="text-gray-400">{attr.trait_type}:</span> {attr.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-4">Game Impact Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameImpacts.map((impact, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-green-400 font-bold mb-2">{impact.gameType}</h4>
                    <div className="space-y-2">
                      {impact.bonuses?.map((bonus: any, bonusIndex: number) => (
                        <div key={bonusIndex} className="flex justify-between items-center">
                          <span className="text-gray-300">{bonus.type}</span>
                          <span className="text-green-400 font-bold">+{bonus.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAdmin && (
          <AdminPanel
            isAdmin={isAdmin}
            onClose={() => setShowAdmin(false)}
          />
        )}
      </div>
    </div>
  );
}