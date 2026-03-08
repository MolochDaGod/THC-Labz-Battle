import React, { useState, useEffect } from 'react';
import React from 'react';
import THCClashGameContainer from './THCClashGameContainer';

interface NFTData {
  name: string;
  image: string;
  rank: number;
  mint: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

interface NFTBenefits {
  bonuses: {
    attackBonus: number;
    healthBonus: number;
    defenseBonus: number;
    manaBonus: number;
    specialAbilities: string[];
    deckSize: number;
  };
  captainCard: {
    name: string;
    image: string;
    attack: number;
    health: number;
    abilities: string[];
    rarity: string;
  };
  enhancedDeck: Array<{
    name: string;
    attack: number;
    health: number;
    cost: number;
    type: string;
    description: string;
  }>;
  traitAnalysis: {
    totalTraits: number;
    rareTraits: number;
  };
}

interface THCClashTabsProps {
  playerWallet: string | null;
  playerNFT: NFTData | null;
  onWalletConnect: () => void;
  onWalletDisconnect: () => void;
}

const THCClashTabs: React.FC<THCClashTabsProps> = ({
  playerWallet,
  playerNFT,
  onWalletConnect,
  onWalletDisconnect
}) => {
  const [nftBenefits, setNftBenefits] = useState<NFTBenefits | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real NFT benefits when wallet/NFT changes
  useEffect(() => {
    if (playerWallet && playerNFT) {
      setLoading(true);
      fetch('/api/calculate-nft-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: playerWallet, 
          nft: playerNFT 
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('🎮 Real NFT benefits loaded:', data.data);
          setNftBenefits(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load NFT benefits:', err);
        setLoading(false);
      });
    }
  }, [playerWallet, playerNFT]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-900 via-black to-purple-900">
      <Tabs defaultValue="game" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/50 backdrop-blur-sm">
          <TabsTrigger value="game" className="text-white data-[state=active]:bg-green-600">
            🎮 Battle
          </TabsTrigger>
          <TabsTrigger value="deck" className="text-white data-[state=active]:bg-blue-600">
            🃏 Deck & NFT
          </TabsTrigger>
          <TabsTrigger value="wallet" className="text-white data-[state=active]:bg-purple-600">
            👛 Wallet
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-white data-[state=active]:bg-orange-600">
            🏆 Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="h-full mt-0">
          <THCClashGameContainer 
            playerWallet={playerWallet}
            playerNFT={playerNFT}
            nftBenefits={nftBenefits}
          />
        </TabsContent>

        <TabsContent value="deck" className="p-4 h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">NFT Deck Analysis</h2>
            
            {!playerWallet ? (
              <Card className="bg-black/50 border-red-500">
                <CardHeader>
                  <CardTitle className="text-white">Connect Wallet Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Connect your Solana wallet to see your NFT deck benefits</p>
                  <button 
                    onClick={onWalletConnect}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                  >
                    Connect Wallet
                  </button>
                </CardContent>
              </Card>
            ) : !playerNFT ? (
              <Card className="bg-black/50 border-yellow-500">
                <CardHeader>
                  <CardTitle className="text-white">No GROWERZ NFT Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Wallet: {playerWallet.slice(0, 8)}...{playerWallet.slice(-8)}
                  </p>
                  <p className="text-gray-300">No THC GROWERZ NFTs detected in this wallet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Captain NFT Card */}
                <Card className="bg-black/50 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-white">Captain NFT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <img 
                        src={playerNFT.image} 
                        alt={playerNFT.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white">{playerNFT.name}</h3>
                        <p className="text-green-400">Rank #{playerNFT.rank}</p>
                        <p className="text-gray-300">Mint: {playerNFT.mint.slice(0, 8)}...</p>
                      </div>
                    </div>
                    
                    {nftBenefits?.captainCard && (
                      <div className="mt-4 p-3 bg-green-900/30 rounded-lg">
                        <p className="text-white font-semibold">Captain Stats:</p>
                        <p className="text-red-300">Attack: {nftBenefits.captainCard.attack}</p>
                        <p className="text-blue-300">Health: {nftBenefits.captainCard.health}</p>
                        <p className="text-purple-300">Rarity: {nftBenefits.captainCard.rarity}</p>
                        {nftBenefits.captainCard.abilities.length > 0 && (
                          <p className="text-yellow-300">Abilities: {nftBenefits.captainCard.abilities.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Real Trait Bonuses */}
                <Card className="bg-black/50 border-blue-500">
                  <CardHeader>
                    <CardTitle className="text-white">Real Trait Bonuses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-white">Loading trait analysis...</p>
                    ) : nftBenefits ? (
                      <div className="space-y-2">
                        <p className="text-red-300">Attack Bonus: +{nftBenefits.bonuses.attackBonus}</p>
                        <p className="text-blue-300">Health Bonus: +{nftBenefits.bonuses.healthBonus}</p>
                        <p className="text-purple-300">Defense Bonus: +{nftBenefits.bonuses.defenseBonus}</p>
                        <p className="text-green-300">Mana Bonus: +{Math.round(nftBenefits.bonuses.manaBonus * 100)}%</p>
                        <p className="text-orange-300">Deck Size: {nftBenefits.bonuses.deckSize} cards</p>
                        
                        {nftBenefits.bonuses.specialAbilities.length > 0 && (
                          <div className="mt-3 p-2 bg-purple-900/30 rounded">
                            <p className="text-white font-semibold">Special Abilities:</p>
                            {nftBenefits.bonuses.specialAbilities.map((ability, i) => (
                              <span key={i} className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded mr-1 mt-1">
                                {ability}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-300">No trait data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* NFT Traits */}
                <Card className="bg-black/50 border-purple-500">
                  <CardHeader>
                    <CardTitle className="text-white">NFT Traits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {playerNFT.attributes?.map((trait, index) => (
                        <div key={index} className="bg-gray-800 p-2 rounded">
                          <p className="text-gray-400 text-xs">{trait.trait_type}</p>
                          <p className="text-white font-semibold">{trait.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Deck */}
                <Card className="bg-black/50 border-orange-500">
                  <CardHeader>
                    <CardTitle className="text-white">Enhanced Deck ({nftBenefits?.enhancedDeck?.length || 0} cards)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {nftBenefits?.enhancedDeck?.map((card, index) => (
                        <div key={index} className="bg-gray-800 p-2 rounded flex justify-between">
                          <div>
                            <p className="text-white font-semibold">{card.name}</p>
                            <p className="text-gray-400 text-xs">{card.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-300">{card.attack} ATK</p>
                            <p className="text-blue-300">{card.health} HP</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="p-4 h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Wallet Management</h2>
            
            {playerWallet ? (
              <div className="space-y-4">
                <Card className="bg-black/50 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-white">Connected Wallet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-400 font-mono">{playerWallet}</p>
                    <button 
                      onClick={onWalletDisconnect}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                    >
                      Disconnect Wallet
                    </button>
                  </CardContent>
                </Card>

                {playerNFT && (
                  <Card className="bg-black/50 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-white">Detected NFTs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <img 
                          src={playerNFT.image} 
                          alt={playerNFT.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div>
                          <p className="text-white font-semibold">{playerNFT.name}</p>
                          <p className="text-blue-400">Rank #{playerNFT.rank}</p>
                          <p className="text-gray-400 text-sm">THC GROWERZ Collection</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-black/50 border-purple-500">
                <CardHeader>
                  <CardTitle className="text-white">Connect Your Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">
                    Connect your Solana wallet to access NFT-powered gameplay benefits and view your THC GROWERZ collection.
                  </p>
                  <button 
                    onClick={onWalletConnect}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg"
                  >
                    Connect Solana Wallet
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="p-4 h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Leaderboard</h2>
            
            <Card className="bg-black/50 border-yellow-500">
              <CardHeader>
                <CardTitle className="text-white">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Leaderboard functionality will be implemented to track player battles, victories, and NFT-powered achievements.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default THCClashTabs;