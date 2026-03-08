import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sparkles, Crown, Star, TrendingUp, Shield, Target, Zap, Brain, MapPin, MessageCircle, RefreshCw, X } from 'lucide-react';
import { AIBonusDisplay } from './AIBonusDisplay';
import { deactivateAIBonuses } from '../lib/ai-bonus-manager';
import { getTierInfo } from '../lib/utils';

interface TraitBonus {
  type: string;
  value: number;
  description: string;
}

interface NFTGameBonus {
  rarityBonus: TraitBonus;
  traitBonuses: TraitBonus[];
  totalBonus: number;
  description: string;
}

interface NFTAnalysis {
  nft: {
    mint: string;
    name: string;
    rank: number;
    attributes: Array<{
      trait_type: string;
      value: string;
      rarity?: number;
    }>;
  };
  rarity_tier: string;
  game_bonuses: NFTGameBonus;
  analysis: {
    power_level: string;
    total_effectiveness: string;
    strongest_traits: string[];
    recommendation: string;
  };
}

interface SelectedNFTAssistant {
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
  floor_price: number;
  last_sale: number;
}

interface AIAssistantTabProps {
  selectedAssistant: SelectedNFTAssistant | null;
}

export default function AIAssistantTab({ selectedAssistant }: AIAssistantTabProps) {
  const [analysis, setAnalysis] = useState<NFTAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedSelectedAssistant, setStoredSelectedAssistant] = useState<string | null>(null);
  const [hasSelectedAssistant, setHasSelectedAssistant] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastAnalyzedMint, setLastAnalyzedMint] = useState<string | null>(null);

  const handleDeactivateAI = () => {
    deactivateAIBonuses();
    console.log('🚫 AI Assistant bonuses deactivated');
    // Clear selected assistant from localStorage
    localStorage.removeItem('selectedPlugNft');
    localStorage.removeItem('nft_bonuses_applied');
    // Trigger event to update The Plug component
    window.dispatchEvent(new CustomEvent('plugAvatarChanged', { detail: null }));
    // Reset state to force fresh initialization
    setIsInitialized(false);
    setLastAnalyzedMint(null);
    setAnalysis(null);
  };

  // One-time initialization on component mount
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    
    console.log('🔍 AI Assistant Detection:', {
      selectedAssistant: !!selectedAssistant?.mint,
      storedSelectedAssistant: !!localStorage.getItem('selectedPlugNft'),
      hasSelectedAssistant: !!selectedAssistant || !!localStorage.getItem('selectedPlugNft')
    });

    // Check if we already have applied bonuses for this session
    const appliedBonuses = localStorage.getItem('nft_bonuses_applied');
    
    let mintToAnalyze: string | null = null;
    
    if (selectedAssistant?.mint) {
      mintToAnalyze = selectedAssistant.mint;
    } else {
      const stored = localStorage.getItem('selectedPlugNft');
      if (stored) {
        try {
          const parsedNFT = JSON.parse(stored);
          if (parsedNFT.mint) {
            mintToAnalyze = parsedNFT.mint;
          }
        } catch (error) {
          console.error('Error parsing stored selected assistant:', error);
        }
      }
    }

    if (mintToAnalyze && mintToAnalyze !== lastAnalyzedMint && !appliedBonuses) {
      setLastAnalyzedMint(mintToAnalyze);
      fetchNFTAnalysis(mintToAnalyze);
    }
    
    setIsInitialized(true);
  }, []); // Empty dependency array for one-time initialization

  // Only re-analyze if selectedAssistant changes to a different NFT
  useEffect(() => {
    if (!isInitialized || !selectedAssistant?.mint) return;
    
    if (selectedAssistant.mint !== lastAnalyzedMint) {
      setLastAnalyzedMint(selectedAssistant.mint);
      fetchNFTAnalysis(selectedAssistant.mint);
    }
  }, [selectedAssistant?.mint, isInitialized, lastAnalyzedMint]);

  const fetchNFTAnalysis = async (mint: string) => {
    // Prevent duplicate calls for the same mint
    const bonusAppliedKey = `nft_bonuses_applied_${mint}`;
    if (localStorage.getItem(bonusAppliedKey)) {
      console.log(`⏭️ Skipping analysis - bonuses already applied for ${mint}`);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Analyzing NFT traits for ${mint}...`);
      const response = await fetch(`/api/nft/analyze/${mint}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data);
          console.log('✅ NFT analysis loaded:', data);
          
          // Initialize AI bonuses when analysis is successful
          const { initializeAIBonuses } = await import('../lib/ai-bonus-manager');
          const bonusActivated = await initializeAIBonuses(mint);
          if (bonusActivated) {
            console.log('✅ AI Assistant bonuses activated from analysis');
            // Mark bonuses as applied for this NFT
            localStorage.setItem(bonusAppliedKey, 'true');
            localStorage.setItem('nft_bonuses_applied', mint);
          }
        } else {
          setError(data.error || 'Failed to analyze NFT');
        }
      } else {
        setError(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching NFT analysis:', err);
      setError('Failed to load NFT analysis');
    } finally {
      setLoading(false);
    }
  };

  // Calculate rank-based bonuses - Updated tier boundaries: Mythic: 1-71, Epic: 72-361, Rare: 362-843, Uncommon: 844-1446, Common: 1447-2420
  const calculateRankBonuses = (rank: number) => {
    if (rank >= 1 && rank <= 71) return { tier: 'Mythic', tradingBonus: 25, negotiationBonus: 25, riskReduction: 25, heatReduction: 25, aiResponseQuality: 2.0, missionRewards: 50 };
    else if (rank >= 72 && rank <= 361) return { tier: 'Epic', tradingBonus: 20, negotiationBonus: 20, riskReduction: 20, heatReduction: 20, aiResponseQuality: 1.5, missionRewards: 30 };
    else if (rank >= 362 && rank <= 843) return { tier: 'Rare', tradingBonus: 15, negotiationBonus: 15, riskReduction: 15, heatReduction: 15, aiResponseQuality: 1.2, missionRewards: 20 };
    else if (rank >= 844 && rank <= 1446) return { tier: 'Uncommon', tradingBonus: 10, negotiationBonus: 10, riskReduction: 10, heatReduction: 10, aiResponseQuality: 0.8, missionRewards: 15 };
    else if (rank >= 1447 && rank <= 2420) return { tier: 'Common', tradingBonus: 5, negotiationBonus: 5, riskReduction: 5, heatReduction: 5, aiResponseQuality: 0.5, missionRewards: 10 };
    else return { tier: 'Common', tradingBonus: 5, negotiationBonus: 5, riskReduction: 5, heatReduction: 5, aiResponseQuality: 0.5, missionRewards: 10 }; // fallback
  };

  const getRarityColor = (tier: string) => {
    switch (tier) {
      case 'Mythic': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Epic': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'Rare': return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 'Uncommon': return 'bg-gradient-to-r from-green-400 to-green-600';
      case 'Common': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getTraitIcon = (traitType: string) => {
    switch (traitType.toLowerCase()) {
      case 'rarity_multiplier': return <Crown className="w-4 h-4" />;
      case 'death':
      case 'intimidation': return <Shield className="w-4 h-4" />;
      case 'wealth':
      case 'luxury': return <TrendingUp className="w-4 h-4" />;
      case 'tech':
      case 'crypto': return <Zap className="w-4 h-4" />;
      case 'wisdom':
      case 'enlightened': return <Brain className="w-4 h-4" />;
      case 'background': return <Zap className="w-4 h-4" />;
      case 'skin': return <Shield className="w-4 h-4" />;
      case 'clothes': return <TrendingUp className="w-4 h-4" />;
      case 'head': return <Brain className="w-4 h-4" />;
      case 'mouth': return <MessageCircle className="w-4 h-4" />;
      case 'eyes': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTraitGameplayBonus = (traitType: string, traitValue: string) => {
    const type = traitType.toLowerCase();
    
    switch (type) {
      case 'background':
        return {
          type: 'Environmental',
          value: 15,
          description: `${traitValue} environment provides city-specific advantages and better local market knowledge`
        };
      case 'skin':
        return {
          type: 'Social',
          value: 12,
          description: `${traitValue} appearance enhances social interactions and negotiation effectiveness`
        };
      case 'clothes':
        return {
          type: 'Reputation',
          value: 18,
          description: `${traitValue} style improves street credibility and reduces suspicion from authorities`
        };
      case 'head':
        return {
          type: 'Intelligence',
          value: 10,
          description: `${traitValue} headwear increases mission success rate and strategic thinking`
        };
      case 'mouth':
        return {
          type: 'Communication',
          value: 14,
          description: `${traitValue} expression improves deal closing and AI assistant interaction quality`
        };
      case 'eyes':
        return {
          type: 'Perception',
          value: 16,
          description: `${traitValue} eyes enhance market awareness and risk detection abilities`
        };
      default:
        return {
          type: 'Special',
          value: 8,
          description: `${traitValue} provides unique gameplay advantages and bonus multipliers`
        };
    }
  };

  // Initialize stored assistant on component mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedPlugNft');
    setStoredSelectedAssistant(stored);
  }, []);
  
  useEffect(() => {
    setHasSelectedAssistant(!!(selectedAssistant || storedSelectedAssistant));
  }, [selectedAssistant, storedSelectedAssistant]);
  
  // Show "SELECT A PLUG" state when no assistant is selected
  if (!selectedAssistant && !storedSelectedAssistant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Sparkles className="w-24 h-24 text-gray-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
              SELECT A PLUG
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Choose a THC GROWERZ NFT as your AI assistant to unlock trait-based gameplay bonuses
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-green-400 font-bold text-lg mb-4">🎯 How to Get Started:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <p className="text-gray-300 text-sm">Visit the <strong className="text-white">🖼️ My NFTs</strong> tab to see your owned GROWERZ NFTs</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <p className="text-gray-300 text-sm">Browse the <strong className="text-white">🌿 GROWERZ RARITY</strong> tab to explore all 2,420 NFTs</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <p className="text-gray-300 text-sm">Check the <strong className="text-white">📊 TRAITS INFO</strong> tab to understand trait bonuses</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                <p className="text-gray-300 text-sm">Click <strong className="text-green-400">Select as AI Assistant</strong> on any NFT you own</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
            <p className="text-yellow-400 font-bold text-sm mb-2">💡 Pro Tip:</p>
            <p className="text-gray-300 text-xs">
              Each NFT has unique traits that provide different gameplay bonuses. 
              Choose an NFT whose traits match your preferred strategy for maximum effectiveness.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Bonus Display - Only show when assistant is active */}
      <AIBonusDisplay onDeactivate={handleDeactivateAI} />
      
      {/* Selected Assistant Header */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <img 
              src={selectedAssistant?.image || ''} 
              alt={selectedAssistant?.name || 'NFT Assistant'}
              className="w-20 h-20 rounded-lg border-2 border-purple-400"
            />
            <div className="flex-1">
              <CardTitle className="text-xl text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>{selectedAssistant?.name || 'THC GROWERZ NFT'}</span>
              </CardTitle>
              <div className="flex items-center space-x-3 mt-2">
                {selectedAssistant?.rank && (() => {
                  const tierInfo = getTierInfo(selectedAssistant.rank);
                  return (
                    <Badge className={`${tierInfo.color} text-white border-0`}>
                      <span className="mr-1">{tierInfo.icon}</span>
                      #{selectedAssistant.rank} - {tierInfo.tier} Tier
                    </Badge>
                  );
                })()}
                <span className="text-gray-300">
                  Score: {selectedAssistant?.rarity_score || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Analyzing NFT traits and game bonuses...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Error: {error}</p>
            <Button 
              onClick={() => selectedAssistant?.mint && fetchNFTAnalysis(selectedAssistant.mint)}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Always show basic trait information */}
      {selectedAssistant && (
        <>
          {/* Comprehensive Rank Analysis */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <span>🏆 RANK POWER ANALYSIS</span>
              </CardTitle>
              <p className="text-gray-300 text-sm mt-2">
                Your NFT's position in the collection and tier-based bonuses
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rank Display */}
                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg p-6 border border-yellow-500/30">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">
                      #{selectedAssistant.rank}
                    </div>
                    <p className="text-gray-300 text-sm">Collection Rank</p>
                    <p className="text-gray-400 text-xs">Out of 2,347 NFTs</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Rarity Tier:</span>
                      <div className={`px-3 py-1 rounded-lg ${getTierInfo(selectedAssistant.rank).color}`}>
                        <span className="text-white text-sm font-bold flex items-center gap-1">
                          <span>{getTierInfo(selectedAssistant.rank).icon}</span>
                          <span>{getTierInfo(selectedAssistant.rank).tier}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Rarity Score:</span>
                      <span className="text-purple-400 font-bold">{selectedAssistant.rarity_score?.toFixed(1) || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Rank Bonus:</span>
                      <span className="text-green-400 font-bold">+{calculateRankBonuses(selectedAssistant.rank).tradingBonus}%</span>
                    </div>
                  </div>
                </div>

                {/* Tier Comparison */}
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-6 border border-blue-500/30">
                  <h4 className="text-white font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-blue-400 mr-2" />
                    Tier Performance
                  </h4>
                  
                  <div className="space-y-4">
                    {[
                      { tier: 'Mythic', range: '1-71', bonus: 25, icon: '👑', active: selectedAssistant.rank <= 71 },
                      { tier: 'Epic', range: '72-361', bonus: 20, icon: '⭐', active: selectedAssistant.rank >= 72 && selectedAssistant.rank <= 361 },
                      { tier: 'Rare', range: '362-843', bonus: 15, icon: '💎', active: selectedAssistant.rank >= 362 && selectedAssistant.rank <= 843 },
                      { tier: 'Uncommon', range: '844-1446', bonus: 10, icon: '🔹', active: selectedAssistant.rank >= 844 && selectedAssistant.rank <= 1446 },
                      { tier: 'Common', range: '1447-2420', bonus: 5, icon: '⚪', active: selectedAssistant.rank >= 1447 }
                    ].map((tierInfo, index) => (
                      <div key={index} className={`flex items-center justify-between p-2 rounded ${tierInfo.active ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-800/30'}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{tierInfo.icon}</span>
                          <div>
                            <span className={`text-sm font-medium ${tierInfo.active ? 'text-green-400' : 'text-gray-400'}`}>
                              {tierInfo.tier}
                            </span>
                            <p className="text-xs text-gray-500">#{tierInfo.range}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${tierInfo.active ? 'text-green-400' : 'text-gray-500'}`}>
                            +{tierInfo.bonus}%
                          </span>
                          {tierInfo.active && (
                            <p className="text-xs text-green-400">ACTIVE</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Trait Powers */}
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Zap className="w-6 h-6 text-green-400" />
                <span>⚡ TRAIT POWER BREAKDOWN</span>
              </CardTitle>
              <p className="text-gray-300 text-sm mt-2">
                Individual trait analysis and their specific gameplay bonuses
              </p>
            </CardHeader>
            <CardContent>
              {/* Trait Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/30 text-center">
                  <div className="text-2xl font-bold text-green-400">{selectedAssistant.attributes?.length || 0}</div>
                  <p className="text-sm text-gray-300">Active Traits</p>
                </div>
                <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    +{((selectedAssistant.attributes?.length || 0) * 12)}%
                  </div>
                  <p className="text-sm text-gray-300">Trait Bonuses</p>
                </div>
                <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    +{calculateRankBonuses(selectedAssistant.rank).tradingBonus + ((selectedAssistant.attributes?.length || 0) * 12)}%
                  </div>
                  <p className="text-sm text-gray-300">Total Power</p>
                </div>
              </div>

              {/* Individual Trait Analysis */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-2" />
                  Individual Trait Powers
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAssistant.attributes?.filter(trait => trait.trait_type !== 'Attribute count').map((trait, index) => {
                    const traitBonus = getTraitGameplayBonus(trait.trait_type, trait.value);
                    
                    return (
                      <div key={index} className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-lg p-4 border border-gray-600">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-semibold flex items-center gap-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
                              {trait.trait_type}
                            </h5>
                            {trait.rarity && (
                              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                {parseFloat(trait.rarity.toString()).toFixed(1)}% rarity
                              </span>
                            )}
                          </div>
                          <p className="text-cyan-400 font-medium">{trait.value}</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getTraitIcon(trait.trait_type)}
                                <span className="text-green-400 font-semibold text-sm">
                                  {traitBonus.type.toUpperCase()}
                                </span>
                              </div>
                              <span className="text-green-400 font-bold">+{traitBonus.value}%</span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {traitBonus.description}
                            </p>
                            
                            {/* Power Bar */}
                            <div className="mt-3">
                              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-1000"
                                  style={{ width: `${Math.min(100, (traitBonus.value / 30) * 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                Power Level: {traitBonus.value >= 20 ? 'Legendary' : traitBonus.value >= 15 ? 'Epic' : traitBonus.value >= 10 ? 'Rare' : 'Common'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combined Power Analysis */}
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                  Combined Trait Synergy
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-white font-semibold mb-3">Gameplay Impact</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Trading Efficiency:</span>
                        <span className="text-green-400 font-bold">
                          +{calculateRankBonuses(selectedAssistant.rank).tradingBonus}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Heat Reduction:</span>
                        <span className="text-blue-400 font-bold">
                          -{calculateRankBonuses(selectedAssistant.rank).heatReduction}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Negotiation Power:</span>
                        <span className="text-purple-400 font-bold">
                          +{calculateRankBonuses(selectedAssistant.rank).negotiationBonus}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Mission Success:</span>
                        <span className="text-orange-400 font-bold">
                          +{calculateRankBonuses(selectedAssistant.rank).missionRewards}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-white font-semibold mb-3">Strategic Advantages</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">Enhanced market negotiation power</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">Reduced police attention and heat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">Improved AI assistant responses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-gray-300">Faster achievement progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">Access to exclusive opportunities</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-black/20 rounded-lg">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    <strong className="text-white">Your {selectedAssistant.name}</strong> combines {selectedAssistant.attributes?.length || 0} unique traits 
                    with a rank of <strong className="text-yellow-400">#{selectedAssistant.rank}</strong> for a total effectiveness boost of{' '}
                    <strong className="text-green-400">+{calculateRankBonuses(selectedAssistant.rank).tradingBonus + ((selectedAssistant.attributes?.length || 0) * 12)}%</strong> 
                    across all game operations. This {getTierInfo(selectedAssistant.rank).tier} tier NFT provides significant advantages in the cannabis economy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {analysis && !loading && (
        <>
          {/* Comprehensive NFT Analysis Panel */}
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span>In-Depth NFT Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rarity Overview */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Rarity Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Collection Rank</div>
                    <div className="text-xl font-bold text-white">#{analysis.rank || selectedAssistant.rank}</div>
                    <div className="text-xs text-blue-400">Out of 2,420 NFTs</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Rarity Score</div>
                    <div className="text-xl font-bold text-purple-400">{analysis.rarity_score || selectedAssistant.rarity_score}</div>
                    <div className="text-xs text-purple-300">HowRare.is Verified</div>
                  </div>
                </div>
                
                {/* Tier Badge */}
                {selectedAssistant.rank && (() => {
                  const tierInfo = getTierInfo(selectedAssistant.rank);
                  return (
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tierInfo.icon}</span>
                          <div>
                            <div className="text-lg font-bold text-white">{tierInfo.tier} Tier</div>
                            <div className="text-sm text-gray-400">Rank {selectedAssistant.rank} Classification</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full ${tierInfo.color}`}>
                          <span className="text-white font-bold text-sm">{tierInfo.tier}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Detailed Trait Analysis */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Trait Breakdown & Bonuses
                </h3>
                <div className="space-y-3">
                  {selectedAssistant.attributes?.filter(trait => trait.trait_type !== 'Attribute count').map((trait, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTraitIcon(trait.trait_type)}
                          <span className="font-semibold text-white">{trait.trait_type}</span>
                        </div>
                        <span className="text-blue-400 font-bold">{trait.value}</span>
                      </div>
                      
                      {trait.rarity && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-xs text-gray-400">Rarity:</div>
                          <div className="text-xs font-bold text-yellow-400">{trait.rarity}%</div>
                          <div className="flex-1 bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-yellow-400 h-1 rounded-full" 
                              style={{ width: `${Math.min(100, (100 - parseFloat(trait.rarity?.toString() || '0')) * 1.2)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Trait-specific Gameplay Bonuses */}
                      <div className="text-xs text-gray-300 bg-gray-700 rounded px-2 py-1">
                        {trait.trait_type.toLowerCase().includes('background') && (
                          <span>🌍 Environment bonus: +15% city-specific advantages</span>
                        )}
                        {trait.trait_type.toLowerCase().includes('skin') && (
                          <span>👤 Social bonus: +10% negotiation effectiveness</span>
                        )}
                        {trait.trait_type.toLowerCase().includes('clothes') && (
                          <span>👔 Reputation bonus: +12% street credibility</span>
                        )}
                        {trait.trait_type.toLowerCase().includes('head') && (
                          <span>🧠 Intelligence bonus: +8% mission success rate</span>
                        )}
                        {trait.trait_type.toLowerCase().includes('mouth') && (
                          <span>💬 Communication bonus: +10% AI response quality</span>
                        )}
                        {trait.trait_type.toLowerCase().includes('eyes') && (
                          <span>👁️ Perception bonus: +15% risk detection</span>
                        )}
                        {!['background', 'skin', 'clothes', 'head', 'mouth', 'eyes'].some(type => 
                          trait.trait_type.toLowerCase().includes(type)
                        ) && (
                          <span>⭐ Special trait: Unique gameplay advantages</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gameplay Impact Summary */}
              {selectedAssistant.rank && (() => {
                const rankBonuses = calculateRankBonuses(selectedAssistant.rank);
                return (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Active Gameplay Bonuses
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-800/30 border border-green-500/30 rounded-lg p-3">
                        <div className="text-sm text-green-400 font-semibold">Trading Profits</div>
                        <div className="text-xl font-bold text-white">+{rankBonuses.tradingBonus}%</div>
                        <div className="text-xs text-green-300">Higher sale prices</div>
                      </div>
                      <div className="bg-blue-800/30 border border-blue-500/30 rounded-lg p-3">
                        <div className="text-sm text-blue-400 font-semibold">Negotiation</div>
                        <div className="text-xl font-bold text-white">+{rankBonuses.negotiationBonus}%</div>
                        <div className="text-xs text-blue-300">Better buy prices</div>
                      </div>
                      <div className="bg-purple-800/30 border border-purple-500/30 rounded-lg p-3">
                        <div className="text-sm text-purple-400 font-semibold">Risk Reduction</div>
                        <div className="text-xl font-bold text-white">-{rankBonuses.riskReduction}%</div>
                        <div className="text-xs text-purple-300">Safer operations</div>
                      </div>
                      <div className="bg-yellow-800/30 border border-yellow-500/30 rounded-lg p-3">
                        <div className="text-sm text-yellow-400 font-semibold">Mission Rewards</div>
                        <div className="text-xl font-bold text-white">+{rankBonuses.missionRewards}%</div>
                        <div className="text-xs text-yellow-300">Extra BUDZ earnings</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold text-sm">AI Response Quality</span>
                      </div>
                      <div className="text-white">
                        <span className="text-lg font-bold">{rankBonuses.aiResponseQuality}x</span>
                        <span className="text-gray-300 ml-2">multiplier for AI assistance</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {rankBonuses.tier} tier NFTs provide {rankBonuses.aiResponseQuality > 1 ? 'enhanced' : 'standard'} AI responses
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Market Analysis */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Market Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Floor Price</div>
                    <div className="text-lg font-bold text-green-400">◎{selectedAssistant.floor_price || '0.055'}</div>
                    <div className="text-xs text-gray-500">Magic Eden</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Last Sale</div>
                    <div className="text-lg font-bold text-blue-400">◎{selectedAssistant.last_sale || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Recent transaction</div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Collection Performance</div>
                  <div className="text-white font-medium">THC GROWERZ Collection</div>
                  <div className="text-xs text-gray-500">2,420 total NFTs • 220 unique holders</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Recommendations */}
          <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <span>Strategic Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAssistant.rank && (() => {
                const rankBonuses = calculateRankBonuses(selectedAssistant.rank);
                const tier = rankBonuses.tier;
                
                return (
                  <div className="space-y-4">
                    {/* Tier-specific Strategy */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        {tier} Tier Strategy
                      </h4>
                      {tier === 'Common' && (
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>• <strong className="text-white">Focus on consistent trading:</strong> Your +5% bonuses provide steady advantages</p>
                          <p>• <strong className="text-white">Build relationships slowly:</strong> Use your AI assistant for market analysis</p>
                          <p>• <strong className="text-white">Play it safe:</strong> 5% risk reduction helps avoid major losses</p>
                          <p>• <strong className="text-white">Complete daily missions:</strong> +10% mission rewards add up over time</p>
                        </div>
                      )}
                      {tier === 'Uncommon' && (
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>• <strong className="text-white">Balanced approach:</strong> 10% bonuses across all areas provide flexibility</p>
                          <p>• <strong className="text-white">Take calculated risks:</strong> Risk reduction allows for bolder moves</p>
                          <p>• <strong className="text-white">Leverage negotiations:</strong> Better prices mean higher profit margins</p>
                          <p>• <strong className="text-white">Mission focus:</strong> 15% bonus rewards make missions very profitable</p>
                        </div>
                      )}
                      {tier === 'Rare' && (
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>• <strong className="text-white">Aggressive trading:</strong> 15% bonuses enable high-volume strategies</p>
                          <p>• <strong className="text-white">Risk management:</strong> Significant risk reduction allows expansion</p>
                          <p>• <strong className="text-white">Enhanced AI quality:</strong> 1.2x AI responses provide better guidance</p>
                          <p>• <strong className="text-white">Mission mastery:</strong> 20% bonus makes all missions highly profitable</p>
                        </div>
                      )}
                      {tier === 'Epic' && (
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>• <strong className="text-white">Dominate markets:</strong> 20% bonuses enable market manipulation</p>
                          <p>• <strong className="text-white">Bold strategies:</strong> High risk reduction supports aggressive plays</p>
                          <p>• <strong className="text-white">Premium AI advice:</strong> 1.5x enhanced responses unlock advanced strategies</p>
                          <p>• <strong className="text-white">Mission empire:</strong> 30% bonus creates passive income streams</p>
                        </div>
                      )}
                      {tier === 'Mythic' && (
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>• <strong className="text-white">Market control:</strong> 25% bonuses enable complete market dominance</p>
                          <p>• <strong className="text-white">Fearless expansion:</strong> Maximum risk reduction supports any strategy</p>
                          <p>• <strong className="text-white">Elite AI partnership:</strong> 2.0x responses provide godlike strategic insight</p>
                          <p>• <strong className="text-white">Mission monopoly:</strong> 50% bonus generates massive passive income</p>
                        </div>
                      )}
                    </div>

                    {/* Trait-Based Tactics */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Trait-Based Tactics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {selectedAssistant.attributes?.filter(trait => trait.trait_type !== 'Attribute count').slice(0, 4).map((trait, index) => (
                          <div key={index} className="bg-gray-800 rounded p-3">
                            <div className="text-white font-medium mb-1">{trait.trait_type}: {trait.value}</div>
                            <div className="text-gray-300 text-xs">
                              {trait.trait_type.toLowerCase().includes('background') && (
                                <span>Leverage environmental advantages in specific cities</span>
                              )}
                              {trait.trait_type.toLowerCase().includes('skin') && (
                                <span>Excel in social situations and negotiations</span>
                              )}
                              {trait.trait_type.toLowerCase().includes('clothes') && (
                                <span>Build reputation faster in all interactions</span>
                              )}
                              {trait.trait_type.toLowerCase().includes('head') && (
                                <span>Higher success rates on complex missions</span>
                              )}
                              {trait.trait_type.toLowerCase().includes('mouth') && (
                                <span>Enhanced AI communication and advice quality</span>
                              )}
                              {trait.trait_type.toLowerCase().includes('eyes') && (
                                <span>Better detection of risks and opportunities</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Optimization */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        Performance Optimization
                      </h4>
                      <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                          <p><strong className="text-white">Daily Routine:</strong> Chat with your AI assistant every day to maintain maximum AI response quality</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                          <p><strong className="text-white">Market Timing:</strong> Use your negotiation bonuses during peak trading hours for maximum profit</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                          <p><strong className="text-white">Risk Management:</strong> Leverage your risk reduction to enter markets other players avoid</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                          <p><strong className="text-white">Mission Priority:</strong> Focus on high-reward missions to maximize your {rankBonuses.missionRewards}% bonus</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // Switch to chat with AI assistant
                    const event = new CustomEvent('switchToAIChat');
                    window.dispatchEvent(event);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with AI
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Refresh NFT analysis
                    if (selectedAssistant?.mint) {
                      fetchNFTAnalysis(selectedAssistant.mint);
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Analysis
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    // Switch to missions tab
                    const event = new CustomEvent('switchToMissions');
                    window.dispatchEvent(event);
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Missions
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeactivateAI}
                >
                  <X className="w-4 h-4 mr-2" />
                  Deactivate AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
        </>
      )}
    </div>
  );
};