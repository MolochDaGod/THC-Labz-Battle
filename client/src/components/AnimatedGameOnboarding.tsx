import React, { useState, useEffect } from 'react';
import { Wallet, Play, Shield, Zap, Crown, Gamepad2, TrendingUp, Users, Trophy, Sparkles, ArrowRight, CheckCircle, Info, Star, Target } from 'lucide-react';
import THCClashCardGame from './THCClashCardGame';

interface AnimatedGameOnboardingProps {
  walletAddress: string;
  connectedNFTs: any[];
  onConnectWallet: () => void;
  onStartGame: () => void;
  loading: boolean;
}

const AnimatedGameOnboarding: React.FC<AnimatedGameOnboardingProps> = ({
  walletAddress,
  connectedNFTs,
  onConnectWallet,
  onStartGame,
  loading
}) => {
  const [showCardGame, setShowCardGame] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const steps = [
    {
      title: "Connect Your Wallet",
      description: "Link your Solana wallet to unlock NFT-powered gaming",
      icon: Wallet,
      completed: !!walletAddress
    },
    {
      title: "Scan for GROWERZ NFTs",
      description: "Automatic detection of your THC GROWERZ collection",
      icon: Shield,
      completed: connectedNFTs.length > 0
    },
    {
      title: "Analyze Gaming Benefits",
      description: "Calculate trait-based bonuses across all games",
      icon: Zap,
      completed: connectedNFTs.length > 0
    },
    {
      title: "Ready to Play",
      description: "Access enhanced gameplay with your NFTs",
      icon: Play,
      completed: connectedNFTs.length > 0
    }
  ];

  const gameFeatures = [
    {
      icon: Crown,
      title: "THC CLASH",
      description: "Strategic tower defense with 40 unique THC-themed minions",
      benefits: ["3-castle battlefields", "NFT commander cards", "Trait-based abilities"],
      color: "from-purple-600 to-blue-600"
    },
    {
      icon: Gamepad2,
      title: "Multi-Game Platform",
      description: "Universal NFT integration across gaming experiences",
      benefits: ["Cross-game bonuses", "Persistent progression", "Trait multipliers"],
      color: "from-green-600 to-teal-600"
    },
    {
      icon: Trophy,
      title: "Competitive Play",
      description: "Ranked matches with NFT-enhanced strategies",
      benefits: ["Global leaderboards", "Tournament modes", "Skill-based matchmaking"],
      color: "from-yellow-600 to-orange-600"
    }
  ];

  const nftBenefits = [
    {
      trait: "Eyes",
      values: ["Red Eyes", "Green Eyes", "Blue Eyes"],
      benefits: ["Burning Gaze", "Nature Sight", "Ice Stare"],
      description: "Eye traits determine special vision abilities and attack modifiers"
    },
    {
      trait: "Clothes",
      values: ["THC Hoodie", "Lab Coat", "Street Wear"],
      benefits: ["Stealth Mode", "Science Boost", "Urban Camouflage"],
      description: "Clothing affects defensive capabilities and special abilities"
    },
    {
      trait: "Head",
      values: ["Crown", "Bandana", "Cap"],
      benefits: ["Royal Command", "Gang Leader", "Street Smart"],
      description: "Head gear influences leadership bonuses and team effects"
    },
    {
      trait: "Background",
      values: ["Lab", "Forest", "City"],
      benefits: ["Tech Support", "Natural Healing", "Urban Tactics"],
      description: "Environment backgrounds provide contextual gameplay bonuses"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (walletAddress && connectedNFTs.length > 0) {
      setActiveStep(3);
      setTimeout(() => setShowFeatures(true), 1000);
    } else if (walletAddress) {
      setActiveStep(1);
    }
  }, [walletAddress, connectedNFTs]);

  const FloatingParticle = ({ delay = 0 }) => (
    <div 
      className="absolute w-2 h-2 bg-green-400 rounded-full opacity-70 animate-pulse"
      style={{
        animation: `float 3s ease-in-out infinite ${delay}s`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`
      }}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.2} />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header with Animated Title */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              THC GROWERZ
            </h1>
            <div className="text-lg sm:text-xl font-semibold text-purple-400 mb-2">
              Web3 Battle Arena
            </div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Transform your GROWERZ NFTs into powerful gaming assets across multiple experiences
            </p>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
              <div className="text-2xl font-bold text-green-400">2,347</div>
              <div className="text-sm text-gray-400">Total GROWERZ</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">40+</div>
              <div className="text-sm text-gray-400">Game Minions</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
              <div className="text-2xl font-bold text-purple-400">100+</div>
              <div className="text-sm text-gray-400">Trait Bonuses</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400">∞</div>
              <div className="text-sm text-gray-400">Possibilities</div>
            </div>
          </div>
        </div>

        {!walletAddress ? (
          /* Onboarding Steps Animation */
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className={`relative p-6 rounded-lg border-2 transition-all duration-500 ${
                      activeStep >= index
                        ? 'bg-green-900/30 border-green-400 transform scale-105'
                        : 'bg-gray-800/30 border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`mx-auto mb-4 p-3 rounded-full transition-colors duration-300 ${
                        step.completed ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="text-white" size={24} />
                        ) : (
                          <Icon className="text-white" size={24} />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                    
                    {activeStep === index && !step.completed && (
                      <div className="absolute -top-2 -right-2">
                        <Sparkles className="text-yellow-400 animate-spin" size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connect Wallet CTA */}
            <div className="text-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-green-500/30 max-w-md mx-auto">
                <Wallet className="mx-auto mb-4 text-green-400 animate-bounce" size={48} />
                <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-gray-300 mb-6">
                  Start your journey by connecting your Solana wallet to unlock the power of your GROWERZ NFTs
                </p>
                <button
                  onClick={onConnectWallet}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Connect Wallet
                      <ArrowRight size={20} />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Connected State with Enhanced Features */
          <div className="space-y-8">
            {/* Wallet Connected Success */}
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-green-900/50 to-blue-900/50 backdrop-blur-sm rounded-lg p-6 border border-green-400/50">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Wallet Connected Successfully!</h3>
                  <p className="text-green-400 font-mono">{walletAddress.slice(0, 12)}...{walletAddress.slice(-12)}</p>
                  <p className="text-gray-300">{connectedNFTs.length} GROWERZ NFTs detected</p>
                </div>
              </div>
            </div>

            {/* NFT Trait Benefits */}
            {connectedNFTs.length > 0 && (
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 border border-purple-500/30">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Star className="text-yellow-400" />
                  Your NFT Gaming Benefits
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nftBenefits.map((benefit, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-400 mb-2">{benefit.trait} Traits</h4>
                      <div className="space-y-2 mb-3">
                        {benefit.values.map((value, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-gray-300 text-sm">{value}</span>
                            <span className="text-green-400 text-sm font-semibold">{benefit.benefits[idx]}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Game Features Showcase */}
            {showFeatures && (
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 border border-blue-500/30">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Available Gaming Experiences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {gameFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className={`bg-gradient-to-br ${feature.color} p-6 rounded-lg transform hover:scale-105 transition-all duration-300 cursor-pointer`}
                        style={{
                          animation: `slideInUp 0.6s ease-out ${index * 0.2}s both`
                        }}
                      >
                        <div className="text-center mb-4">
                          <Icon className="mx-auto mb-3 text-white" size={40} />
                          <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                          <p className="text-gray-200 text-sm">{feature.description}</p>
                        </div>
                        
                        <div className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle className="text-green-300" size={16} />
                              <span className="text-white text-sm">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Start Gaming CTA */}
                <div className="text-center">
                  <button
                    onClick={() => setShowCardGame(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded transition-all transform hover:scale-105 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Play size={24} />
                      Start THC CLASH Battle
                      <Sparkles size={24} />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* No NFTs Message */}
            {connectedNFTs.length === 0 && (
              <div className="max-w-2xl mx-auto bg-yellow-900/20 backdrop-blur-sm rounded-lg p-8 border border-yellow-500/30">
                <div className="text-center">
                  <Info className="mx-auto mb-4 text-yellow-400" size={48} />
                  <h3 className="text-xl font-bold text-white mb-4">No GROWERZ NFTs Found</h3>
                  <p className="text-gray-300 mb-6">
                    This wallet doesn't contain any THC GROWERZ collection NFTs. You can still explore the platform, but you'll miss out on NFT-powered gaming bonuses.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => window.open('https://magiceden.io/marketplace/thc_growerz', '_blank')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      Browse Collection
                    </button>
                    <button
                      onClick={() => setShowCardGame(true)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      Play Without NFTs
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-16 bg-black/30 backdrop-blur-sm rounded-lg p-8 border border-gray-600/30">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">How NFT Gaming Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Trait Analysis</h4>
              <p className="text-gray-400 text-sm">Your NFT attributes are automatically scanned and converted into gameplay bonuses and special abilities.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Dynamic Bonuses</h4>
              <p className="text-gray-400 text-sm">Each trait provides specific advantages like increased damage, special abilities, or enhanced mana generation.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trophy className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Competitive Edge</h4>
              <p className="text-gray-400 text-sm">Your unique NFT combination creates a personalized gaming strategy that no other player can replicate.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {showCardGame && (
        <THCClashCardGame 
          playerNFTs={connectedNFTs}
          onBack={() => setShowCardGame(false)}
        />
      )}
    </div>
  );
};

export default AnimatedGameOnboarding;