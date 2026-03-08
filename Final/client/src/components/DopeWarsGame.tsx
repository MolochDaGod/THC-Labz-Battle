import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Briefcase, AlertTriangle, Shield, DollarSign, Users, Calendar, TrendingUp, TrendingDown, Clock, HardHat, Zap, Target, Eye, Truck, Star, CreditCard, Menu, X, Bot, BarChart3, ChevronDown } from 'lucide-react';
import PhysicsRenderer from './PhysicsRenderer';
import AdminPanel from './AdminPanel';
import ThePlugAssistant from './ThePlugAssistant';
import AIEventSystem from './AIEventSystem';
import AISystemValidator from './AISystemValidator';
import UserProfileAuth from './UserProfileAuth';
import NFTMarketplace from './NFTMarketplace';
import OpenAIEventListener, { useOpenAIEvents } from './OpenAIEventListener';
import { ProfitAssistant } from './ProfitAssistant';
import { AchievementDisplay } from './AchievementDisplay';
import { NFTRarityShowcase } from './NFTRarityShowcase';
import { CharacterInfoTab } from './CharacterInfoTab';
import PlayerPanelUI from './PlayerPanelUI';
import EnvironmentalSystem from './EnvironmentalSystem';
import AnimatedCutscene from './AnimatedCutscene';
import { useCutsceneSystem } from '../hooks/useCutsceneSystem';
import ProfessionalHeaderBanner from './ProfessionalHeaderBanner';

import { EmbeddedAIChat } from './EmbeddedAIChat';

import { createBouncyMoney, createBouncyDrug, shakeScreen } from '../lib/physics';
import { useAudio } from '../lib/stores/useAudio';
import { saveSelectedNFT } from '../lib/utils';
import { 
  initializeAIBonuses, 
  deactivateAIBonuses, 
  applyMarketBonus, 
  applyHeatReduction, 
  applyProfitBonus,
  getAIBonusSummary 
} from '../lib/ai-bonus-manager';
// Smoke effect will be implemented inline

// GROWERZ NFTs Display Component
interface NFT {
  mint: string;
  name: string;
  image: string;
  description: string;
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
  const [collectionFloorPrice, setCollectionFloorPrice] = useState<number>(0.055);

  // Fetch real-time floor price from Magic Eden
  const fetchFloorPrice = async () => {
    try {
      const response = await fetch('/api/floor-price/thc-growerz');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.floorPrice) {
          setCollectionFloorPrice(data.floorPrice);
          console.log(`🏠 Updated THC GROWERZ floor price: ${data.floorPrice} SOL`);
        }
      }
    } catch (error) {
      console.error('Error fetching floor price:', error);
    }
  };

  const fetchNFTs = async () => {
    if (!walletAddress) {
      console.log('🔍 No wallet address provided to fetchNFTs');
      return;
    }
    
    console.log(`🔍 Fetching GROWERZ NFTs with HowRare data for connected wallet: ${walletAddress}`);
    setLoading(true);
    try {
      const response = await fetch(`/api/my-nfts/${walletAddress}`);
      console.log(`📡 NFT API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 NFT API response data:', data);
        
        if (data.success && data.nfts && data.nfts.length > 0) {
          console.log(`✅ Found ${data.nfts.length} GROWERZ NFTs with HowRare data`);
          
          // NFTs already come with HowRare.is data from the /api/my-nfts endpoint
          setNfts(data.nfts);
          console.log(`🎯 Set ${data.nfts.length} GROWERZ NFTs with HowRare data`);
        } else {
          console.log('❌ No NFTs found in API response');
          setNfts([]);
        }
      } else {
        console.error('❌ NFT API request failed:', response.status);
        setNfts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching NFTs:', error);
      setNfts([]);
    }
    setLoading(false);
  };

  // Load selected NFT from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedPlugNft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedNft(parsed.mint);
      } catch (e) {
        console.error('Error loading saved NFT selection:', e);
      }
    }
  }, []);

  // Universal NFT selection system - wrapper for shared utility
  const handleNftSelect = async (nft: any) => {
    if (!walletAddress) return;
    
    console.log(`🎯 [DopeWarsGame] Selecting GROWERZ NFT ${nft.name} via shared utility`);
    setSelectedNft(nft.mint);
    
    // Use shared utility for universal selection
    const selectedNFTData = saveSelectedNFT(nft, walletAddress);
    
    // Legacy compatibility - trigger old custom event
    window.dispatchEvent(new CustomEvent('plugAvatarChanged', { 
      detail: selectedNFTData 
    }));
    
    // Initialize AI Assistant bonuses
    const bonusActivated = await initializeAIBonuses(nft.mint);
    if (bonusActivated) {
      console.log('✅ AI Assistant bonuses activated for gameplay');
    } else {
      console.log('❌ Failed to activate AI Assistant bonuses');
    }
    
    // Automatically open THE GROWERZ AI Assistant after NFT selection
    console.log('🎯 Opening AI Assistant for selected NFT...');
    // Note: AI Assistant will be accessible via the main game interface
    
    console.log(`✅ [DopeWarsGame] Selected authentic GROWERZ NFT via shared utility: ${nft.name}`);
  };

  useEffect(() => {
    console.log(`🔄 GrowerNFTsDisplay useEffect triggered for wallet: ${walletAddress}`);
    if (walletAddress) {
      fetchNFTs();
      fetchFloorPrice();
      
      // Listen for NFT selection changes from other components (AI Assistant)
      const handleNFTSelectionChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { nft, bonuses, walletAddress: eventWallet } = customEvent.detail;
        if (eventWallet === walletAddress) {
          setSelectedNft(nft.mint);
          console.log(`🔄 [DopeWarsGame] Updated NFT selection from external source: ${nft.name}`);
        }
      };
      
      window.addEventListener('nftSelectionChanged', handleNFTSelectionChange);
      
      return () => {
        window.removeEventListener('nftSelectionChanged', handleNFTSelectionChange);
      };
    }
  }, [walletAddress]);

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading NFTs...</div>;
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm mb-2">No GROWERZ NFTs found</p>
        <p className="text-xs text-gray-500">
          Own THC LABZ GROWERZ collection NFTs to customize your AI assistant
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400">
        Found {nfts.length} GROWERZ NFT{nfts.length !== 1 ? 's' : ''} in your wallet
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
        {nfts.map(nft => {
          // Use HowRare authentic data if available, otherwise fallback to basic attributes
          const howRareRarity = (nft as any).howrare?.rarity_tier || (nft as any).rarityTier;
          const rarity = howRareRarity || nft.attributes?.find(attr => attr.trait_type === 'Rarity')?.value || 'Common';
          const rank = (nft as any).howrare?.rank || (nft as any).rank;
          const rarityScore = (nft as any).howrare?.rarity_score || (nft as any).rarityScore;
          const strain = nft.attributes?.find(attr => attr.trait_type === 'Strain')?.value;
          const thcLevel = nft.attributes?.find(attr => attr.trait_type === 'THC Level')?.value;
          const isSelected = selectedNft === nft.mint;
          
          return (
            <div 
              key={nft.mint}
              onClick={() => handleNftSelect(nft)}
              className={`bg-gray-900 p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-green-400 bg-green-900/20 shadow-lg' 
                  : 'border-gray-600 hover:border-green-400'
              }`}
            >
              <div className="relative">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="w-full h-20 object-cover rounded mb-2"
                />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    ✓
                  </div>
                )}
                {/* Enhanced HowRare Rank Badge */}
                {rank && (
                  <div className="absolute -top-1 -left-1 bg-yellow-500 text-black text-xs rounded px-2 py-1 font-bold shadow-lg">
                    #{rank}
                  </div>
                )}
              </div>
              <p className="text-white text-sm font-medium mb-1" title={nft.name}>{nft.name}</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    rarity === 'Legendary' ? 'text-yellow-400' :
                    rarity === 'Epic' ? 'text-purple-400' :
                    rarity === 'Rare' ? 'text-blue-400' :
                    rarity === 'Uncommon' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {rarity}
                  </span>
                  {rarityScore && <span className="text-orange-400 text-sm font-bold">{rarityScore.toFixed(1)}</span>}
                </div>
                {/* Real Magic Eden Floor Price */}
                <div className="text-sm text-purple-300 font-medium">
                  Floor: {collectionFloorPrice.toFixed(3)}◎
                </div>
                {strain && <div className="text-gray-400 text-sm">{strain}</div>}
                {isSelected && (
                  <div className="text-green-400 text-sm mt-2 text-center font-bold bg-green-900/30 py-1 px-2 rounded">
                    🤖 Selected Plug
                  </div>
                )}
              </div>
              {/* Enhanced Action Buttons */}
              <div className="space-y-2 mt-3">
                {!isSelected ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNftSelect(nft);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded font-medium transition-colors"
                  >
                    Select as Plug
                  </button>
                ) : null}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowcaseNft(nft.mint);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3 rounded font-medium transition-colors"
                >
                  🏆 View Rarity Stats
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={fetchNFTs}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs transition-colors"
      >
        🔄 Refresh NFTs
      </button>
      
      {/* NFT Rarity Showcase Modal */}
      {showcaseNft && (
        <NFTRarityShowcase
          nftMint={showcaseNft}
          onClose={() => setShowcaseNft(null)}
        />
      )}
    </div>
  );
}

// Web3 types for multiple Solana wallets
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      isConnected: boolean;
    };
    phantom?: {
      solana?: {
        connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
        disconnect(): Promise<void>;
        isConnected: boolean;
      };
    };
    // Magic Eden wallet
    magicEden?: {
      solana?: {
        connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
        disconnect(): Promise<void>;
        isConnected: boolean;
      };
    };
    // Solflare wallet
    solflare?: {
      connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      isConnected: boolean;
    };
    // Backpack wallet
    backpack?: {
      solana?: {
        connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
        disconnect(): Promise<void>;
        isConnected: boolean;
      };
    };
    // Coinbase wallet
    coinbaseSolana?: {
      connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      isConnected: boolean;
    };
    // Generic wallet adapter
    walletStandard?: any;
  }
}

interface Drug {
  id: string;
  name: string;
  baseName?: string; // Base name without modifiers
  basePrice: number;
  currentPrice: number;
  owned: number;
  totalBought: number;
  totalSold: number;
  totalSpent: number;
  totalEarned: number;
  averageBuyPrice: number;
  highestSellPrice: number;
  lowestBuyPrice: number;
  traits: string[]; // THC GROWERZ traits
  isRare?: boolean; // Whether this is a rare variant
  baseDescription?: string; // Base description
}

interface DopeWarsGameProps {}

interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  icon: string;
  prerequisites: string[];
  category: 'dealing' | 'survival' | 'business';
}

interface GameState {
  money: number;
  debt: number;
  health: number;
  day: number;
  currentCity: string;
  coatSpace: number;
  reputation: number;
  timeLeftInDay: number; // in seconds (600 = 10 minutes)
  isWorking: boolean;
  workDaysLeft: number;
  daysWorkedThisWeek: number;
  weekStartDay: number;
  bankAccount: number;
  skills: Record<string, number>; // skill_id -> level
  heat: number; // Heat level 0-5 (police attention)
  daysInCurrentCity: number; // Track how long player stays in one city
  recentSales: Array<{city: string, amount: number, day: number}>; // Track recent sales
  // Game statistics
  totalTransactions: number;
  totalProfit: number;
  highestDailyProfit: number;
  citiesVisited: string[];
  dealsCompleted: number;
  timesRobbed: number;
  timesArrested: number;
  loansRepaid: number;
  maxConcurrentDebt: number;
  // New achievement tracking fields
  strainsSmoked?: string[];
  nightDeals?: number;
  maxCitiesPerDay?: number;
  maxHeatReached?: number;
  bargainDeals?: number;
  highRiskPurchases?: number;
  aiChatCount?: number;
  dailyCities?: string[];
  lastDayForCityCount?: number;
  // Anti-cheat protection fields
  sessionId?: string; // Unique session identifier
  lastPriceGeneration?: number; // Timestamp of last price generation
  dayStartedAt?: number; // Timestamp when current day started
  completedMissions?: string[]; // Track completed missions to prevent re-completion
  cityPriceSeeds?: Record<string, string>; // Store price seeds per city per day
  // Missing properties from usage
  // Rewarded Video Ad Tracking
  watchedWorkAd?: boolean; // Track if user watched ad during current work period
  totalAdsWatched?: number; // Track total ads watched for analytics
  lastAdWatchTime?: number; // Timestamp of last ad watch to prevent spam
  adBonusEarnings?: number; // Total money earned from ad bonuses
  consecutiveWorkAds?: number; // Track consecutive work ad views for scaling rewards
  missionCompletionTimes?: Record<string, number>; // Track mission completion times
  timeElapsed?: number; // Time elapsed in current day
  totalPurchases?: number; // Total purchases made
  consecutiveSmokingDays?: number; // Consecutive smoking days for achievement
  drugs?: Drug[]; // Drugs inventory
  skillzCarOwner?: boolean; // Whether player owns Skillz Car for self-driving
  
  // Enhanced Legal Status & Reputation Systems
  legalStatus?: string; // Current legal standing: 'Clean', 'Suspect', 'Wanted', 'Most Wanted'
  streetRep?: number; // Street reputation points (0-1000)
  consecutiveVideoStreak?: number; // Days with 2 videos watched without missing
  lastVideoDay?: number; // Last day player watched videos
  missedVideoDays?: number; // Count of days missed in streak
  legalCases?: Array<{
    type: string;
    severity: number;
    city: string;
    day: number;
    resolved?: boolean;
  }>; // Active legal cases
  policeWarrants?: Array<{
    city: string;
    severity: string;
    day: number;
    expires?: number;
  }>; // Police warrants in specific cities
  currentDay?: number; // Track current day for ad calculations
  adsWatchedToday?: Record<number, number>; // Track ads watched per day
}

export default function DopeWarsGame({}: DopeWarsGameProps = {}) {
  // Dynamic Music System
  const { initializeMusicTracks, updateMusicBasedOnGameState, switchToTrack, isMuted, toggleMute } = useAudio();

  const [gameState, setGameState] = useState<GameState>({
    money: 80,
    debt: 0,
    health: 100,
    day: 1,
    currentCity: 'hometown',
    coatSpace: 5,
    reputation: 0,
    timeLeftInDay: 600, // 10 minutes in seconds
    isWorking: false,
    workDaysLeft: 0,
    daysWorkedThisWeek: 0,
    weekStartDay: 1,
    bankAccount: 0,
    skills: {},
    heat: 0, // Start with no heat
    daysInCurrentCity: 1, // Start in hometown
    recentSales: [], // Track recent sales
    // Game statistics
    totalTransactions: 0,
    totalProfit: 0,
    highestDailyProfit: 0,
    citiesVisited: ['hometown'],
    dealsCompleted: 0,
    timesRobbed: 0,
    timesArrested: 0,
    loansRepaid: 0,
    maxConcurrentDebt: 0,
    // New achievement tracking fields
    strainsSmoked: [] as string[],
    nightDeals: 0,
    maxCitiesPerDay: 0,
    maxHeatReached: 0,
    bargainDeals: 0,
    highRiskPurchases: 0,
    aiChatCount: 0,
    dailyCities: [] as string[],
    lastDayForCityCount: 1,
    // Anti-cheat protection fields
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    lastPriceGeneration: 0,
    dayStartedAt: Date.now(),
    completedMissions: [] as string[],
    missionCompletionTimes: {} as Record<string, number>,
    cityPriceSeeds: {} as Record<string, string>,
    // Missing properties initialization
    timeElapsed: 0,
    totalPurchases: 0,
    consecutiveSmokingDays: 0,
    drugs: [] as Drug[],
    // Rewarded Video Ad Tracking initialization
    watchedWorkAd: false,
    totalAdsWatched: 0,
    lastAdWatchTime: 0,
    adBonusEarnings: 0,
    consecutiveWorkAds: 0,
    skillzCarOwner: false,
    
    // Enhanced Legal Status & Reputation Systems initialization
    legalStatus: 'Clean',
    streetRep: 0,
    consecutiveVideoStreak: 0,
    lastVideoDay: 0,
    missedVideoDays: 0,
    legalCases: [],
    policeWarrants: [],
    currentDay: 1,
    adsWatchedToday: {}
  });

  const [currentView, setCurrentView] = useState<'market' | 'travel' | 'bank' | 'status' | 'work' | 'command'>('market');
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [eventMessage, setEventMessage] = useState<string>('');
  const [showEvent, setShowEvent] = useState(false);
  const [buyAmount, setBuyAmount] = useState<Record<string, number>>({});
  const [sellAmount, setSellAmount] = useState<Record<string, number>>({});
  const [tradeSlider, setTradeSlider] = useState<Record<string, number>>({});
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [debtPayAmount, setDebtPayAmount] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(1);
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(true);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showGameEnd, setShowGameEnd] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<Array<{name: string, score: number, day: number}>>([]);

  // City Info Modal states
  const [showCityInfo, setShowCityInfo] = useState(false);
  const [selectedCityInfo, setSelectedCityInfo] = useState<{
    id: string;
    name: string;
    insights: {
      pricingTrends: string;
      riskLevel: string;
      reputation: string;
      specialty: string;
      tips: string[];
    };
  } | null>(null);
  const [showWeb3Modal, setShowWeb3Modal] = useState<boolean>(false);
  const [showGrowerzModal, setShowGrowerzModal] = useState<boolean>(false);
  const [showNFTMarketplace, setShowNFTMarketplace] = useState<boolean>(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState<boolean>(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(!localStorage.getItem('connectedWallet'));
  const [showProfitAssistant, setShowProfitAssistant] = useState<boolean>(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState<boolean>(false);
  const [selectedCityForInfo, setSelectedCityForInfo] = useState<string>('');
  const [showLifetimeLeaderboard, setShowLifetimeLeaderboard] = useState<boolean>(false);
  const [lifetimeLeaderboard, setLifetimeLeaderboard] = useState<any[]>([]);
  const [showStreetzModal, setShowStreetzModal] = useState<boolean>(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState<boolean>(false);
  const [hoveredCity, setHoveredCity] = useState<string>('');
  const [showDopeBudzModal, setShowDopeBudzModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeCommandTab, setActiveCommandTab] = useState<'skills' | 'special' | 'missions' | 'inventory' | 'chat'>('skills');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showActionLog, setShowActionLog] = useState<boolean>(false);
  const [showCharacterInfo, setShowCharacterInfo] = useState<boolean>(false);
  const [showMarketInsights, setShowMarketInsights] = useState<boolean>(false);
  const [serverWallet, setServerWallet] = useState<string>('');
  const [budzBalance, setBudzBalance] = useState<number>(0);
  const [gbuxBalance, setGbuxBalance] = useState<number>(0);
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [connectedWalletType, setConnectedWalletType] = useState<string>('');
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  
  // Event Animation States
  const [showDealerAnimation, setShowDealerAnimation] = useState(false);
  const [dealerMessage, setDealerMessage] = useState('');
  const [showRobberAnimation, setShowRobberAnimation] = useState(false);
  const [robberPeekActive, setRobberPeekActive] = useState(false);
  const [showPoliceAnimation, setShowPoliceAnimation] = useState(false);
  const [policeIntensity, setPoliceIntensity] = useState(1); // 1-3 cops based on severity
  const [showGrowerNFTAnimation, setShowGrowerNFTAnimation] = useState(false);
  const [animatingGrowerNFT, setAnimatingGrowerNFT] = useState<any>(null);
  const [showNFTRequest, setShowNFTRequest] = useState(false);
  const [requestingNFT, setRequestingNFT] = useState<any>(null);
  const [requestedDrug, setRequestedDrug] = useState('');
  const [nftBonusAvailable, setNftBonusAvailable] = useState(false);

  
  // Game pause system - Auto-pause when player disengages
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [swapAmount, setSwapAmount] = useState<number>(0);
  const [swapDirection, setSwapDirection] = useState<'budz-to-gbux' | 'gbux-to-budz' | 'budz-to-thc' | 'gbux-to-thc' | 'thc-to-budz'>('budz-to-gbux');
  const [gbuxPrice, setGbuxPrice] = useState<number>(0);
  const [budzPrice, setBudzPrice] = useState<number>(0);
  const [thcGrowerTokenBalance, setThcGrowerTokenBalance] = useState<number>(0);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'wallet' | 'profile' | 'game'>('wallet');
  const [authState, setAuthState] = useState<any>(null);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [aiNotificationCount, setAiNotificationCount] = useState<number>(0);
  const [collectionFloorPrice, setCollectionFloorPrice] = useState<number>(0.055);
  
  // Smoke Animation State
  const [smokeEffects, setSmokeEffects] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [smokeCounter, setSmokeCounter] = useState(0);

  // Selected NFT for cutscenes and AI assistant
  const [selectedPlugNFT] = useState(() => {
    const saved = localStorage.getItem('selectedPlugNft') || localStorage.getItem('selectedNFT') || localStorage.getItem('selectedAssistant');
    return saved ? JSON.parse(saved) : null;
  });

  // Initialize cutscene system
  const {
    activeCutscene,
    closeCutscene,
    handleCutsceneAction,
    triggerMissionComplete,
    queueCutscene
  } = useCutsceneSystem(gameState, selectedPlugNFT);
  
  // Travel Options State for 300+ mile trips
  const [showTravelOptions, setShowTravelOptions] = useState(false);
  const [selectedCityForTravel, setSelectedCityForTravel] = useState('');
  
  // Travel Cutscene States
  const [showTravelCutscene, setShowTravelCutscene] = useState(false);
  
  // Game Info Popup
  const [showGameInfoPopup, setShowGameInfoPopup] = useState(false);
  
  // Enhanced Work System with scaling rewards
  const [consecutiveWorkAds, setConsecutiveWorkAds] = useState(0);
  const [dailyWorkAdsWatched, setDailyWorkAdsWatched] = useState(0);
  const [lastWorkAdDay, setLastWorkAdDay] = useState(0);
  const [travelCutsceneMethod, setTravelCutsceneMethod] = useState<'bus' | 'flight' | 'skillz_car'>('bus');
  const [selectedPlugImage, setSelectedPlugImage] = useState<string>('');
  const [selectedAssistantAvatar, setSelectedAssistantAvatar] = useState<string>('');
  
  // Missing state variables for LSP fix
  const [thcLabzBalance, setThcLabzBalance] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  
  // New Character Info Tab System
  const [showCharacterTab, setShowCharacterTab] = useState<boolean>(false);
  const [characterTabActiveSection, setCharacterTabActiveSection] = useState<'info' | 'stats' | 'actions' | 'nft-visits'>('info');
  
  // NFT Visitor System - AI-powered GROWERZ interactions
  const [nftVisitors, setNftVisitors] = useState<Array<{
    id: string;
    name: string;
    image: string;
    rank: number;
    rarity_score: number;
    visitType: 'purchase' | 'mission' | 'trade';
    offer: string;
    requiresResponse: boolean;
    timeLimit: number;
    reward: number;
  }>>([]);
  const [activeNftVisit, setActiveNftVisit] = useState<any>(null);

  // NFT visitor handlers
  const handleAcceptNFTVisit = useCallback((visitor: any) => {
    console.log('✅ Accepted NFT visit:', visitor);
    
    // Apply rewards based on visit type
    setGameState(prev => ({
      ...prev,
      money: prev.money + visitor.reward,
      reputation: prev.reputation + 5
    }));
    
    // Remove visitor from list
    setNftVisitors(prev => prev.filter(v => v.id !== visitor.id));
    
    // Show success message
    setDealerMessage(`🎉 Successful collaboration with ${visitor.name}! Earned $${visitor.reward} and +5 reputation!`);
    setShowDealerAnimation(true);
    setTimeout(() => setShowDealerAnimation(false), 4000);
  }, []);

  const handleDeclineNFTVisit = useCallback((visitor: any) => {
    console.log('❌ Declined NFT visit:', visitor);
    
    // Remove visitor from list
    setNftVisitors(prev => prev.filter(v => v.id !== visitor.id));
    
    // Small reputation hit for declining
    setGameState(prev => ({
      ...prev,
      reputation: Math.max(0, prev.reputation - 1)
    }));
  }, []);
  
  // OpenAI Event Integration
  const { 
    hasNewAdvice, 
    lastAdviceType, 
    handleAIInfluence, 
    handleGameAdvice, 
    handleNotification 
  } = useOpenAIEvents();

  // Add notification when AI has new advice
  useEffect(() => {
    if (hasNewAdvice && !showAIAssistant) {
      setAiNotificationCount(prev => prev + 1);
      console.log('🔔 The Plug has new advice - notification count increased');
    }
  }, [hasNewAdvice, showAIAssistant]);

  // Load selected NFT avatar on page load and listen for changes
  useEffect(() => {
    // Load selected NFT from localStorage on startup
    const loadSelectedNFT = () => {
      const saved = localStorage.getItem('selectedPlugNft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.image) {
            setSelectedAssistantAvatar(parsed.image);
            console.log('🖼️ Loaded saved Plug avatar image:', parsed.name);
          }
        } catch (e) {
          console.error('Error loading saved NFT avatar:', e);
        }
      }
    };

    // Load on component mount
    loadSelectedNFT();

    // Listen for NFT selection changes
    const handlePlugAvatarChange = (event: CustomEvent) => {
      const nftData = event.detail;
      if (nftData?.image) {
        setSelectedAssistantAvatar(nftData.image);
        console.log('🎯 Updated Plug avatar image:', nftData.name);
      }
    };

    window.addEventListener('plugAvatarChanged', handlePlugAvatarChange as EventListener);
    
    return () => {
      window.removeEventListener('plugAvatarChanged', handlePlugAvatarChange as EventListener);
    };
  }, []);

  // Fetch real THC GROWERZ floor price from Magic Eden
  useEffect(() => {
    const fetchFloorPrice = async () => {
      try {
        const response = await fetch('/api/floor-price/thc-growerz');
        if (response.ok) {
          const data = await response.json();
          if (data.floorPrice && !isNaN(data.floorPrice) && data.floorPrice > 0) {
            setCollectionFloorPrice(data.floorPrice);
            console.log(`🏠 Updated THC GROWERZ floor price: ${data.floorPrice} SOL (${data.source})`);
          }
        }
      } catch (error) {
        console.error('Error fetching floor price:', error);
      }
    };

    // Fetch floor price on load and every 10 minutes
    fetchFloorPrice();
    const interval = setInterval(fetchFloorPrice, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Test function to simulate AI notifications
  const testAINotification = useCallback(() => {
    setAiNotificationCount(prev => prev + 1);
    console.log('🧪 Test notification added - count:', aiNotificationCount + 1);
  }, [aiNotificationCount]);

  // Start Game Function - Simple start button handler
  const startGameRound = useCallback(() => {
    if (!connectedWallet) {
      console.log('❌ Cannot start game - no wallet connected');
      return;
    }

    console.log('🚀 Starting 45-day challenge round');
    setGameStarted(true);
  }, [connectedWallet]);

  // Original complex start function kept for reference but not used
  const resetGameState = useCallback(() => {
    // Reset game state for fresh round with challenging starting conditions
    setGameState({
      money: 80,
      debt: 0,
      health: 100,
      day: 1,
      currentCity: 'hometown',
      coatSpace: 5,
      reputation: 0,
      timeLeftInDay: 600,
      isWorking: false,
      workDaysLeft: 0,
      daysWorkedThisWeek: 0,
      weekStartDay: 1,
      bankAccount: 0,
      skills: {},
      heat: 0,
      daysInCurrentCity: 1,
      recentSales: [],
      totalTransactions: 0,
      totalProfit: 0,
      highestDailyProfit: 0,
      citiesVisited: ['hometown'],
      dealsCompleted: 0,
      timesRobbed: 0,
      timesArrested: 0,
      loansRepaid: 0,
      maxConcurrentDebt: 0,
      strainsSmoked: [],
      nightDeals: 0,
      maxCitiesPerDay: 1,
      maxHeatReached: 0,
      bargainDeals: 0,
      highRiskPurchases: 0,
      aiChatCount: 0,
      dailyCities: ['hometown'],
      lastDayForCityCount: 1,
      sessionId: `${connectedWallet}_${Date.now()}`,
      dayStartedAt: Date.now(),
      lastPriceGeneration: 0,
      cityPriceSeeds: {},
      completedMissions: [],
      missionCompletionTimes: {},
      totalPurchases: 0,
      consecutiveSmokingDays: 0,
      timeElapsed: 0,
      drugs: []
    });
    
    // Clear action log for new round
    setActionLog([]);
    
    // Generate new unique game round ID for this session
    const newGameRoundId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentGameRoundId(newGameRoundId);
    
    // Start the game by setting day to 1
    // Game state was already reset above
    
    console.log(`🎮 New game round started: ${newGameRoundId}`);
  }, [connectedWallet]);

  // Handle click smoke effect
  const createSmokeEffect = useCallback((x: number, y: number) => {
    const newId = smokeCounter + 1;
    setSmokeCounter(newId);
    setSmokeEffects(prev => [...prev, { id: newId, x, y }]);
    
    // Remove smoke after 2 seconds
    setTimeout(() => {
      setSmokeEffects(prev => prev.filter(p => p.id !== newId));
    }, 2000);
  }, [smokeCounter]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    createSmokeEffect(e.clientX, e.clientY);
  }, [createSmokeEffect]);
  const [currentGameRoundId, setCurrentGameRoundId] = useState<string>('');

  const [showIntroVideo, setShowIntroVideo] = useState<boolean>(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState<boolean>(false);
  const [videoAudioEnabled, setVideoAudioEnabled] = useState<boolean>(false);
  
  // Preparation/Setup Mode State
  const [gameMode, setGameMode] = useState<'preparation' | 'playing' | 'completed'>('preparation');
  
  // Smoke effect states temporarily disabled to fix initialization issue
  // const [smokeParticles, setSmokeParticles] = useState<Array<{id: number, x: number, y: number, intensity: number, startTime: number}>>([]);
  
  // End-game video and celebration states
  const [showEndGameVideo, setShowEndGameVideo] = useState<boolean>(false);
  const [endGameVideoCompleted, setEndGameVideoCompleted] = useState<boolean>(false);
  const [showAchievementRewards, setShowAchievementRewards] = useState<boolean>(false);
  const [achievementBudzEarned, setAchievementBudzEarned] = useState<number>(0);
  const [leaderboardPosition, setLeaderboardPosition] = useState<number>(0);
  const [finalRewards, setFinalRewards] = useState<{achievements: number, completion: number, position: number}>({achievements: 0, completion: 100, position: 0});
  
  // Smoking session states
  const [lastSmokingDay, setLastSmokingDay] = useState<number>(0);
  const [showSmokingVideo, setShowSmokingVideo] = useState<boolean>(false);
  const [smokingAudioEnabled, setSmokingAudioEnabled] = useState<boolean>(false);
  const [selectedDrugForSmoking, setSelectedDrugForSmoking] = useState<string>('');
  
  // Game start overlay state
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [highlightedProduct, setHighlightedProduct] = useState<string>('');
  const [smokingBuffs, setSmokingBuffs] = useState<{active: boolean, drug: string, traits: string[]}>({active: false, drug: '', traits: []});
  
  // Travel animation states
  const [isTraveling, setIsTraveling] = useState<boolean>(false);
  const [travelingFrom, setTravelingFrom] = useState<string>('');
  const [travelingTo, setTravelingTo] = useState<string>('');
  const [travelProgress, setTravelProgress] = useState<number>(0);
  const [travelDistance, setTravelDistance] = useState<number>(0);
  const [travelCost, setTravelCost] = useState<number>(0);
  const [currentDayExpenses, setCurrentDayExpenses] = useState<number>(0);
  
  // Real-time clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Admin wallet addresses
  const adminWallets = ['98jzgFFkPhrw9sfr5YyttTpCBiJyid6tzxxJjXrj7xXK', 'ErSGeWkLuKqmW2MNrcFWPsYryNPXDW224GmgNBf8ZT65', 'Fyfu65hZv3npv6wChMFQXqjUfc2hWmq3mGSZbVLDJc9n'];
  const isAdmin = connectedWallet && adminWallets.includes(connectedWallet);

  // Calculate final achievement rewards
  const calculateFinalAchievements = async () => {
    if (!connectedWallet) return;
    
    try {
      const gameRoundId = `${connectedWallet}_${Date.now()}`;
      const finalScore = gameState.money + gameState.bankAccount - gameState.debt;
      
      const achievementResponse = await fetch('/api/achievements/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: connectedWallet,
          gameState: {
            money: gameState.money,
            debt: gameState.debt,
            health: gameState.health,
            day: gameState.day,
            currentCity: gameState.currentCity,
            reputation: gameState.reputation,
            inventory: gameState.drugs?.reduce((inv, drug) => {
              if (drug.owned > 0) inv[drug.id] = drug.owned;
              return inv;
            }, {} as Record<string, number>) || {},
            finalScore,
            gameRoundId,
            // Include new achievement tracking fields
            strainsSmoked: gameState.strainsSmoked || [],
            nightDeals: gameState.nightDeals || 0,
            maxCitiesPerDay: gameState.maxCitiesPerDay || 0,
            maxHeatReached: gameState.maxHeatReached || 0,
            bargainDeals: gameState.bargainDeals || 0,
            highRiskPurchases: gameState.highRiskPurchases || 0,
            aiChatCount: gameState.aiChatCount || 0
          }
        })
      });

      if (achievementResponse.ok) {
        const achievementData = await achievementResponse.json();
        const achievementBudz = achievementData.success ? achievementData.totalBudzEarned || 0 : 0;
        setFinalRewards(prev => ({...prev, achievements: achievementBudz}));
        console.log(`🏆 Calculated ${achievementBudz} BUDZ from achievements`);
        
        // Trigger automatic AI influence for completing achievements (great quality interaction)
        if (achievementBudz > 0) {
          console.log('✨ Achievements unlocked - triggering great AI influence');
        }
      } else {
        setFinalRewards(prev => ({...prev, achievements: 0}));
      }
    } catch (error) {
      console.error('❌ Achievement calculation failed:', error);
      setFinalRewards(prev => ({...prev, achievements: 0}));
    }
  };

  // Test functions for admin panel
  const handleTestEndGameVideo = () => {
    console.log('🎬 Admin triggered end-game video test');
    calculateFinalAchievements();
    setShowEndGameVideo(true);
  };

  const handleTestAchievementRewards = () => {
    console.log('🏆 Admin triggered achievement rewards test');
    // Set test rewards data
    setFinalRewards({ achievements: 850, completion: 100, position: 3 });
    setLeaderboardPosition(3);
    setShowAchievementRewards(true);
  };

  // Generate Growerz URL with player data
  const getGrowerzUrl = useCallback(() => {
    const baseUrl = 'https://growerz.thc-labz.xyz/';
    
    // Create URL parameters with player data and wallet connection
    const paramData: Record<string, string> = {
      playerMoney: gameState.money.toString(),
      playerDay: gameState.day.toString(),
      playerHealth: gameState.health.toString(),
      playerDebt: gameState.debt.toString(),
      playerCity: gameState.currentCity,
      autoLogin: 'true',
      source: 'dopeboys'
    };

    // Add wallet connection data if connected
    if (connectedWallet) {
      paramData.walletAddress = connectedWallet;
      paramData.walletConnected = 'true';
      paramData.walletType = connectedWalletType || 'unknown';
    }

    // Add server wallet if available
    if (serverWallet) {
      paramData.serverWallet = serverWallet;
    }

    // Add token balances if available
    if (budzBalance !== null) {
      paramData.budzBalance = budzBalance.toString();
    }
    if (gbuxBalance !== null) {
      paramData.gbuxBalance = gbuxBalance.toString();
    }

    const params = new URLSearchParams(paramData);
    return `${baseUrl}?${params.toString()}`;
  }, [gameState, connectedWallet, connectedWalletType, serverWallet, budzBalance, gbuxBalance]);

  // Generate Cannabis Cultivator URL with player data
  const getStreetsUrl = useCallback(() => {
    const baseUrl = 'https://cannabis-cultivator-grudgedev.replit.app/';
    
    // Create URL parameters with player data for seamless login
    const paramData: Record<string, string> = {
      playerMoney: gameState.money.toString(),
      playerDay: gameState.day.toString(),
      playerHealth: gameState.health.toString(),
      playerDebt: gameState.debt.toString(),
      playerCity: gameState.currentCity,
      playerReputation: gameState.reputation.toString(),
      autoLogin: 'true',
      source: 'dopeboys'
    };
    const params = new URLSearchParams(paramData);

    return `${baseUrl}?${params.toString()}`;
  }, [gameState]);

  // Generate Web3 URL with player data
  const getWeb3Url = useCallback(() => {
    const baseUrl = 'https://grudge-thc-growrez.replit.app/';
    
    // Create URL parameters with player data for seamless login
    const paramData: Record<string, string> = {
      playerMoney: gameState.money.toString(),
      playerDay: gameState.day.toString(),
      playerHealth: gameState.health.toString(),
      playerDebt: gameState.debt.toString(),
      playerCity: gameState.currentCity,
      playerReputation: gameState.reputation.toString(),
      autoLogin: 'true',
      source: 'dopebuds'
    };
    const params = new URLSearchParams(paramData);

    return `${baseUrl}?${params.toString()}`;
  }, [gameState]);



  // City Information and Insights Data - ALL cities from travel tab
  const cityInsights: Record<string, {
    name: string;
    insights: {
      pricingTrends: string;
      riskLevel: string;
      reputation: string;
      specialty: string;
      tips: string[];
    };
  }> = {
    hometown: {
      name: "Home Town",
      insights: {
        pricingTrends: "Most stable prices, good for beginners. Low market volatility with predictable profit margins.",
        riskLevel: "Very Safe - Heat reduction: 2 points when traveling here. Police rarely patrol this area.",
        reputation: "Neutral starting reputation. Local connections provide protection from criminal activity.",
        specialty: "Safe trading hub with basic cannabis varieties. Ideal for learning the market without major risks.",
        tips: [
          "Start here to learn pricing patterns safely",
          "Use as safe haven when heat gets too high",
          "Profit margins are lower but consistent",
          "Good place to store money in bank safely"
        ]
      }
    },
    neighborhood: {
      name: "The NeighborHood", 
      insights: {
        pricingTrends: "Moderate price swings, good for medium-risk trading. Local customer base provides steady demand.",
        riskLevel: "Safe - Heat reduction: 2 points. Known dealers have established territories here.",
        reputation: "Building local connections improves pricing. Long-term presence increases profit potential.",
        specialty: "Community-based trading with repeat customers. Social connections unlock better deals.",
        tips: [
          "Build reputation for better long-term pricing",
          "Regular customers provide steady income",
          "Lower competition than downtown areas",
          "Good balance of safety and profit potential"
        ]
      }
    },
    central: {
      name: "Central Park",
      insights: {
        pricingTrends: "Tourist demand creates premium pricing opportunities. Weekend spikes common for recreational varieties.",
        riskLevel: "Moderate - Heat reduction: 1 point. Occasional police patrols but generally overlooked.",
        reputation: "Anonymous trading environment. Reputation matters less, cash talks more.",
        specialty: "High-volume tourist market with premium pricing for quality products.",
        tips: [
          "Target tourists for premium pricing",
          "Weekend sales generate higher profits",
          "Quality strains fetch better prices here",
          "Watch for undercover operations"
        ]
      }
    },
    newyork: {
      name: "New York",
      insights: {
        pricingTrends: "Volatile market with extreme price swings. High risk, high reward trading environment.",
        riskLevel: "High Risk - No heat reduction. Heavy police presence and competitor activity.",
        reputation: "Cutthroat business environment. Respect earned through successful high-stakes deals.",
        specialty: "Major metropolitan hub with diverse customer base and premium product demand.",
        tips: [
          "Bring serious money for bulk opportunities",
          "Competition is fierce - be prepared",
          "High-value deals possible but risky",
          "Establish connections quickly or get burned"
        ]
      }
    },
    stlouis: {
      name: "St. Louis",
      insights: {
        pricingTrends: "Mid-west pricing with moderate volatility. Gateway city creates decent trafficking opportunities.",
        riskLevel: "Moderate Risk - Variable police enforcement. Some areas safer than others.",
        reputation: "Midwest politeness with underlying street culture. Respect and consistency matter.",
        specialty: "Transportation hub market with travelers and locals. Good for medium-volume deals.",
        tips: [
          "Research neighborhoods before operating",
          "Transportation connections useful for supply",
          "Moderate competition allows room to grow",
          "Build relationships with local distributors"
        ]
      }
    },
    memphis: {
      name: "Memphis",
      insights: {
        pricingTrends: "Southern market with blues culture influence. Music scene creates steady demand.",
        riskLevel: "Moderate Risk - Music district safer than outer areas. Know your locations.",
        reputation: "Music and culture respect. Artists and venue workers are good customers.",
        specialty: "Music scene market with musicians and tourists. Blues culture creates loyal customer base.",
        tips: [
          "Target music venues and studios",
          "Musicians are steady repeat customers",
          "Tourist areas have higher profit margins",
          "Respect local music culture and connections"
        ]
      }
    },
    baltimore: {
      name: "Baltimore",
      insights: {
        pricingTrends: "East Coast pricing with port city dynamics. Dockworker market provides bulk opportunities.",
        riskLevel: "High Risk - Complex neighborhood dynamics. Police enforcement varies by area.",
        reputation: "Harbor city toughness. Industrial workers respect straightforward dealing.",
        specialty: "Port city market with shipping connections. Blue-collar customer base with steady income.",
        tips: [
          "Focus on dockworker shifts for timing",
          "Industrial areas have better volume potential",
          "Port connections can provide supply advantages",
          "Build trust slowly with harbor community"
        ]
      }
    },
    miami: {
      name: "Miami",
      insights: {
        pricingTrends: "Seasonal tourist market with party culture driving demand. Spring break and winter months peak.",
        riskLevel: "Very High Risk - Federal and local enforcement active. International drug corridor surveillance.",
        reputation: "Flashy culture rewards bold operators. Style and connections more important than street smarts.",
        specialty: "Party and club market with high-end clientele seeking premium experiences.",
        tips: [
          "Tourist seasons = higher profits",
          "Club connections essential for big money",
          "Federal attention means serious consequences",
          "Image and style matter as much as product"
        ]
      }
    },
    atlanta: {
      name: "Atlanta",
      insights: {
        pricingTrends: "Southern hub with music industry money. Hip-hop culture drives premium strain demand.",
        riskLevel: "High Risk - Music industry brings federal attention. Celebrity connections increase scrutiny.",
        reputation: "Music industry respect system. Success in hip-hop scene opens doors but brings risks.",
        specialty: "Music industry market with artists and producers. High-end strains for creative communities.",
        tips: [
          "Music industry connections pay premium prices",
          "Studio sessions create regular demand",
          "Celebrity clientele means serious security risks",
          "Quality and discretion more important than volume"
        ]
      }
    },
    detroit: {
      name: "Detroit",
      insights: {
        pricingTrends: "Rust Belt economics create price-sensitive market. Auto industry cycles affect demand.",
        riskLevel: "High Risk - Economic desperation creates unpredictable situations. Territory disputes common.",
        reputation: "Motor City toughness. Industrial decline creates both opportunities and dangers.",
        specialty: "Industrial city market with auto workers. Economic hardship creates demand but reduces buying power.",
        tips: [
          "Auto industry payday cycles affect sales",
          "Economic hardship means price competition",
          "Industrial skills useful for operation security",
          "Territory boundaries change frequently"
        ]
      }
    },
    kansascity: {
      name: "Kansas City",
      insights: {
        pricingTrends: "Heartland pricing with agricultural influence. BBQ culture creates social selling opportunities.",
        riskLevel: "Low Risk - Midwest policing focuses on other crimes. Generally overlooked market.",
        reputation: "Midwest friendliness with agricultural work ethic. Consistency and reliability valued.",
        specialty: "Agricultural community with BBQ culture. Social selling through food events and gatherings.",
        tips: [
          "BBQ events are great for networking",
          "Agricultural workers have seasonal money",
          "Low competition means room to establish territory",
          "Community reputation matters more than flash"
        ]
      }
    },
    houston: {
      name: "Houston",
      insights: {
        pricingTrends: "Oil money creates boom-bust cycles. Economic cycles directly affect customer spending power.",
        riskLevel: "High Risk - Border proximity means heavy federal presence. Cartel activity complicates operations.", 
        reputation: "Texas-sized deals and Texas-sized consequences. Big money moves fast but attention follows.",
        specialty: "Energy sector workers with disposable income during oil booms. Industrial-scale opportunities.",
        tips: [
          "Time operations with oil price cycles",
          "Energy workers spend big during booms",
          "Border proximity brings serious heat",
          "Large-scale operations possible but dangerous"
        ]
      }
    },
    neworleans: {
      name: "New Orleans",
      insights: {
        pricingTrends: "Tourist-driven market with Mardi Gras peaks. Festival seasons create massive demand spikes.",
        riskLevel: "Moderate Risk - Tourist focus means police prioritize other crimes during events.",
        reputation: "Party culture with laid-back enforcement. Music and festival connections valuable.",
        specialty: "Festival and party market with tourists and musicians. Jazz culture creates artistic customer base.",
        tips: [
          "Festival seasons bring huge profit opportunities",
          "Jazz musicians are steady customers year-round",
          "Tourist areas have premium pricing potential",
          "Party culture means less law enforcement scrutiny"
        ]
      }
    },
    cleveland: {
      name: "Cleveland",
      insights: {
        pricingTrends: "Industrial market with working-class demand. Steady prices with bulk purchase opportunities.",
        riskLevel: "Moderate Risk - Limited police focus on small-time dealing. Focus on violent crime instead.",
        reputation: "Blue-collar respect system. Hard work and consistency build strong local reputation.",
        specialty: "Working-class market prefers quantity over exotic quality. Bulk deals common.",
        tips: [
          "Volume over premium pricing strategy",
          "Build relationships with dock workers",
          "Industrial shift workers are steady customers",
          "Less flashy operations attract less attention"
        ]
      }
    },
    oakland: {
      name: "Oakland",
      insights: {
        pricingTrends: "West Coast pricing with tech money influence. High demand for premium and exotic strains.",
        riskLevel: "High Risk - Complex gang territories and police dynamics. Know the areas before operating.",
        reputation: "Street credibility essential. Tech workers create premium market but locals control territory.",
        specialty: "Dual market: street-level and premium tech worker clientele with different expectations.",
        tips: [
          "Learn territory boundaries quickly",
          "Tech workers pay premium for quality",
          "Respect local operations and hierarchies",
          "Morning commuter market very profitable"
        ]
      }
    },
    denver: {
      name: "Denver",
      insights: {
        pricingTrends: "Legal cannabis state creates complex market. Black market competes with dispensaries.",
        riskLevel: "Low Risk - Legal cannabis means relaxed enforcement on small operations.",
        reputation: "Cannabis-friendly culture with outdoor enthusiasts. Quality and organic focus important.",
        specialty: "Legal state market with outdoor recreation culture. Premium organic strains preferred.",
        tips: [
          "Compete with legal dispensaries on price and quality",
          "Outdoor enthusiasts value organic products",
          "Skiing and hiking communities are loyal customers",
          "Legal environment means less paranoia, more volume"
        ]
      }
    }
  };

  // Function to open city info in PlayerPanelUI tab
  const openCityInfo = (cityId: string) => {
    setSelectedCityForInfo(cityId);
    setShowPlayerPanel(true);
  };

  // Skill Tree Definition - Enhanced with 8 new skills
  const skillTree: Record<string, Skill> = {
    streetwise: {
      id: 'streetwise',
      name: 'Streetwise',
      description: 'Reduce chance of bad events by 10% per level',
      cost: 500,
      maxLevel: 3,
      currentLevel: gameState.skills.streetwise || 0,
      icon: '🕵️',
      prerequisites: [],
      category: 'survival'
    },
    negotiation: {
      id: 'negotiation',
      name: 'Negotiation',
      description: 'Get 5% better prices when buying per level',
      cost: 800,
      maxLevel: 5,
      currentLevel: gameState.skills.negotiation || 0,
      icon: '🤝',
      prerequisites: [],
      category: 'dealing'
    },
    intimidation: {
      id: 'intimidation',
      name: 'Intimidation',
      description: 'Get 5% better prices when selling per level',
      cost: 800,
      maxLevel: 5,
      currentLevel: gameState.skills.intimidation || 0,
      icon: '😤',
      prerequisites: [],
      category: 'dealing'
    },
    networking: {
      id: 'networking',
      name: 'Networking',
      description: 'Find free drugs 15% more often per level',
      cost: 1200,
      maxLevel: 4,
      currentLevel: gameState.skills.networking || 0,
      icon: '🌐',
      prerequisites: ['negotiation'],
      category: 'dealing'
    },
    inventory: {
      id: 'inventory',
      name: 'Bigger Coat',
      description: '+20 carry capacity per level',
      cost: 1000,
      maxLevel: 10,
      currentLevel: gameState.skills.inventory || 0,
      icon: '🧥',
      prerequisites: [],
      category: 'business'
    },
    megacoat: {
      id: 'megacoat',
      name: 'Mega Coat',
      description: '+50 carry capacity per level',
      cost: 5000,
      maxLevel: 8,
      currentLevel: gameState.skills.megacoat || 0,
      icon: '🎒',
      prerequisites: ['inventory'],
      category: 'business'
    },
    cargocoat: {
      id: 'cargocoat',
      name: 'Cargo Coat',
      description: '+100 carry capacity per level',
      cost: 15000,
      maxLevel: 5,
      currentLevel: gameState.skills.cargocoat || 0,
      icon: '📦',
      prerequisites: ['megacoat'],
      category: 'business'
    },
    resilience: {
      id: 'resilience',
      name: 'Resilience',
      description: 'Take 20% less damage from events per level',
      cost: 1500,
      maxLevel: 3,
      currentLevel: gameState.skills.resilience || 0,
      icon: '💪',
      prerequisites: ['streetwise'],
      category: 'survival'
    },
    connections: {
      id: 'connections',
      name: 'Police Connections',
      description: 'Reduce police event damage by 50% per level',
      cost: 2000,
      maxLevel: 2,
      currentLevel: gameState.skills.connections || 0,
      icon: '👮',
      prerequisites: ['streetwise', 'networking'],
      category: 'survival'
    },
    mastermind: {
      id: 'mastermind',
      name: 'Drug Lord',
      description: 'Earn 25% more from all sales per level',
      cost: 5000,
      maxLevel: 2,
      currentLevel: gameState.skills.mastermind || 0,
      icon: '👑',
      prerequisites: ['intimidation', 'networking', 'inventory'],
      category: 'business'
    },
    // 8 NEW SKILLS ADDED FOR ENHANCED GAMEPLAY
    stealth: {
      id: 'stealth',
      name: 'Stealth Mode',
      description: 'Reduce heat gain by 25% per level when making deals',
      cost: 1200,
      maxLevel: 4,
      currentLevel: gameState.skills.stealth || 0,
      icon: '🥷',
      prerequisites: ['streetwise'],
      category: 'survival'
    },
    chemistry: {
      id: 'chemistry',
      name: 'Street Chemistry',
      description: 'Find special drug deals 20% more often per level',
      cost: 2000,
      maxLevel: 3,
      currentLevel: gameState.skills.chemistry || 0,
      icon: '🧪',
      prerequisites: ['networking'],
      category: 'dealing'
    },
    loyalty: {
      id: 'loyalty',
      name: 'Gang Loyalty',
      description: 'Protect 10% more stash from police raids per level',
      cost: 3000,
      maxLevel: 3,
      currentLevel: gameState.skills.loyalty || 0,
      icon: '🤝',
      prerequisites: ['connections'],
      category: 'survival'
    },
    transport: {
      id: 'transport',
      name: 'Fast Transport',
      description: 'Reduce travel time by 25% per level',
      cost: 1800,
      maxLevel: 4,
      currentLevel: gameState.skills.transport || 0,
      icon: '🚗',
      prerequisites: ['inventory'],
      category: 'business'
    },
    market: {
      id: 'market',
      name: 'Market Analysis',
      description: 'See price trends and predictions +1 day ahead per level',
      cost: 2500,
      maxLevel: 3,
      currentLevel: gameState.skills.market || 0,
      icon: '📊',
      prerequisites: ['negotiation', 'intimidation'],
      category: 'dealing'
    },
    reputation: {
      id: 'reputation',
      name: 'Street Reputation',
      description: 'Unlock exclusive high-value deals +15% per level',
      cost: 4000,
      maxLevel: 2,
      currentLevel: gameState.skills.reputation || 0,
      icon: '⭐',
      prerequisites: ['loyalty', 'chemistry'],
      category: 'business'
    },
    security: {
      id: 'security',
      name: 'Security Network',
      description: '30% less robbery losses, 20% chance to dodge raids per level',
      cost: 3500,
      maxLevel: 2,
      currentLevel: gameState.skills.security || 0,
      icon: '🛡️',
      prerequisites: ['stealth', 'transport'],
      category: 'survival'
    },
    empire: {
      id: 'empire',
      name: 'Drug Empire',
      description: 'Passive income generation +$500 per day per level',
      cost: 8000,
      maxLevel: 3,
      currentLevel: gameState.skills.empire || 0,
      icon: '🏰',
      prerequisites: ['mastermind', 'reputation', 'security'],
      category: 'business'
    }
  };

  // Enhanced wallet detection with Web3 browser support
  const detectWallets = useCallback(() => {
    const wallets: string[] = [];
    
    // Detect browser type for optimized wallet support
    const userAgent = navigator.userAgent.toLowerCase();
    const isPhantomBrowser = userAgent.includes('phantom') || window.solana?.isPhantom;
    const isBrave = !!(window as any).brave;
    const isOpera = userAgent.includes('opr/') || userAgent.includes('opera');
    
    console.log('🌐 Browser Detection:', {
      isPhantomBrowser,
      isBrave,
      isOpera,
      userAgent: userAgent.substring(0, 50) + '...'
    });
    
    console.log('🔍 Scanning for wallet extensions...');
    console.log('window.solana:', window.solana);
    console.log('window.phantom:', window.phantom);
    console.log('window.solflare:', window.solflare);
    console.log('window.backpack:', window.backpack);
    console.log('window.magicEden:', window.magicEden);
    
    // Enhanced Phantom detection (prioritized for Phantom Browser)
    if (window.solana?.isPhantom) {
      wallets.push('Phantom');
      console.log('✅ Phantom wallet detected via window.solana');
    } else if (window.phantom?.solana) {
      wallets.push('Phantom');
      console.log('✅ Phantom wallet detected via window.phantom');
    }
    
    // Enhanced Solflare detection with multiple methods
    if (window.solflare || 
        (window as any).solflare || 
        (window.solana as any)?.isSolflare ||
        (window as any).solflareWallet) {
      wallets.push('Solflare');
      console.log('✅ Solflare wallet detected via enhanced detection');
    }
    
    // Backpack detection
    if (window.backpack?.solana) {
      wallets.push('Backpack');
      console.log('✅ Backpack wallet detected');
    }
    
    // Enhanced Magic Eden detection with multiple methods
    if (window.magicEden?.solana || 
        (window as any).magicEden || 
        (window.solana as any)?.isMagicEden ||
        (window as any).MagicEden ||
        (window as any).magicEdenWallet) {
      wallets.push('Magic Eden');
      console.log('✅ Magic Eden wallet detected via enhanced detection');
    }
    
    // Coinbase detection
    if (window.coinbaseSolana) {
      wallets.push('Coinbase');
      console.log('✅ Coinbase wallet detected');
    }
    
    // Glow detection (mobile-friendly)
    if (window.glow) {
      wallets.push('Glow');
      console.log('✅ Glow wallet detected');
    }
    
    // Generic Solana wallet fallback
    if (wallets.length === 0 && window.solana) {
      wallets.push('Solana Wallet');
      console.log('✅ Generic Solana wallet detected');
    }
    
    // Web3 browser specific optimizations
    if (isPhantomBrowser && wallets.length > 0) {
      console.log('🚀 Phantom Browser detected - optimizing for Web3 experience');
    }
    
    if (isBrave && wallets.length > 0) {
      console.log('🛡️ Brave Browser detected - privacy-focused wallet support enabled');
    }
    
    console.log('🔍 Final detected wallets:', wallets);
    setDetectedWallets(wallets);
    return wallets;
  }, []);

  // Connect to specific wallet with enhanced error handling
  const connectSpecificWallet = async (walletType: string) => {
    console.log(`🔗 Attempting to connect to ${walletType} wallet...`);
    
    try {
      let wallet;
      let walletName = walletType;
      
      switch (walletType) {
        case 'Phantom':
          // Try multiple Phantom detection paths
          if (window.solana?.isPhantom) {
            wallet = window.solana;
            console.log('📱 Using window.solana for Phantom');
          } else if (window.phantom?.solana) {
            wallet = window.phantom.solana;
            console.log('📱 Using window.phantom.solana for Phantom');
          } else {
            throw new Error('Phantom wallet not detected. Please install Phantom from phantom.app');
          }
          break;
          
        case 'Magic Eden':
          // Try multiple Magic Eden detection paths with enhanced fallbacks
          if (window.magicEden?.solana) {
            wallet = window.magicEden.solana;
            console.log('📱 Using window.magicEden.solana for Magic Eden');
          } else if ((window as any).magicEden?.solana) {
            wallet = (window as any).magicEden.solana;
            console.log('📱 Using window.magicEden.solana alternative for Magic Eden');
          } else if ((window as any).magicEden) {
            wallet = (window as any).magicEden;
            console.log('📱 Using window.magicEden fallback for Magic Eden');
          } else if ((window as any).MagicEden?.solana) {
            wallet = (window as any).MagicEden.solana;
            console.log('📱 Using window.MagicEden.solana for Magic Eden');
          } else if ((window as any).magicEdenWallet) {
            wallet = (window as any).magicEdenWallet;
            console.log('📱 Using window.magicEdenWallet for Magic Eden');
          } else if ((window.solana as any)?.isMagicEden) {
            wallet = window.solana;
            console.log('📱 Using window.solana for Magic Eden');
          } else {
            throw new Error('Magic Eden wallet not detected. Please:\n1. Install Magic Eden wallet from magiceden.io\n2. Refresh the page\n3. Try connecting again');
          }
          break;
          
        case 'Solflare':
          // Try multiple Solflare detection paths with enhanced fallbacks
          if (window.solflare) {
            wallet = window.solflare;
            console.log('📱 Using window.solflare for Solflare');
          } else if ((window as any).solflare) {
            wallet = (window as any).solflare;
            console.log('📱 Using window.solflare alternative for Solflare');
          } else if ((window as any).solflareWallet) {
            wallet = (window as any).solflareWallet;
            console.log('📱 Using window.solflareWallet for Solflare');
          } else if ((window.solana as any)?.isSolflare) {
            wallet = window.solana;
            console.log('📱 Using window.solana for Solflare');
          } else {
            throw new Error('Solflare wallet not detected. Please:\n1. Install Solflare from solflare.com\n2. Refresh the page\n3. Make sure Solflare extension is enabled\n4. Try connecting again');
          }
          
          console.log('📱 Using Solflare wallet, checking connection status...');
          
          // Check if already connected
          if (wallet.isConnected) {
            console.log('✅ Solflare already connected, getting public key...');
            try {
              const connectResult = await wallet.connect({ onlyIfTrusted: true });
              if (connectResult?.publicKey) {
                return {
                  walletAddress: connectResult.publicKey.toString(),
                  walletName: 'Solflare'
                };
              }
            } catch (error) {
              console.log('⚠️ Trusted connection failed, will try full connection');
            }
          }
          break;
          
        case 'Backpack':
          if (!window.backpack?.solana) {
            throw new Error('Backpack wallet not available');
          }
          wallet = window.backpack.solana;
          break;
          
        case 'Coinbase':
          if (!window.coinbaseSolana) {
            throw new Error('Coinbase wallet not available');
          }
          wallet = window.coinbaseSolana;
          break;
          
        case 'Glow':
          if (!window.glow) {
            throw new Error('Glow wallet not available');
          }
          wallet = window.glow;
          break;
          
        case 'Solana Wallet':
          if (!window.solana) {
            throw new Error('Solana wallet not available');
          }
          wallet = window.solana;
          break;
          
        default:
          throw new Error(`Unsupported wallet: ${walletType}`);
      }
      
      console.log(`🔌 Wallet object found for ${walletType}:`, wallet);
      
      // Ensure wallet is not already connected to avoid conflicts
      if (wallet.isConnected) {
        console.log(`🔄 Wallet already connected, attempting disconnect first...`);
        try {
          await wallet.disconnect();
          // Wait a bit for disconnect to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (disconnectError) {
          console.log('⚠️ Disconnect error (continuing anyway):', disconnectError);
        }
      }
      
      console.log(`🚀 Attempting connection to ${walletType}...`);
      
      let response;
      if (walletType === 'Solflare') {
        // Solflare-specific connection with retry logic
        console.log('🔧 Using Solflare-specific connection method...');
        try {
          // First try: Standard connection
          response = await Promise.race([
            wallet.connect({ onlyIfTrusted: false }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 10000)
            )
          ]);
        } catch (error) {
          console.log('⚠️ First Solflare connection attempt failed, trying alternative method...');
          
          // Second try: Without options
          try {
            response = await Promise.race([
              wallet.connect(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Second connection timeout')), 10000)
              )
            ]);
          } catch (secondError) {
            console.log('⚠️ Second Solflare connection attempt failed, trying trusted connection...');
            
            // Third try: Trusted connection if available
            try {
              response = await Promise.race([
                wallet.connect({ onlyIfTrusted: true }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Trusted connection timeout')), 10000)
                )
              ]);
            } catch (thirdError) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              throw new Error(`Solflare connection failed after 3 attempts. Please try:\n1. Refresh the page\n2. Disconnect and reconnect Solflare\n3. Clear browser cache\n\nError: ${errorMessage}`);
            }
          }
        }
      } else if (walletType === 'Magic Eden') {
        // Magic Eden-specific connection with enhanced retry logic
        console.log('🔧 Using Magic Eden-specific connection method...');
        try {
          // First try: Standard connection
          response = await Promise.race([
            wallet.connect({ onlyIfTrusted: false }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Magic Eden connection timeout')), 12000)
            )
          ]);
        } catch (error) {
          console.log('⚠️ First Magic Eden connection attempt failed, trying alternative method...');
          
          // Second try: Without options
          try {
            response = await Promise.race([
              wallet.connect(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Magic Eden secondary connection timeout')), 12000)
              )
            ]);
          } catch (secondError) {
            console.log('⚠️ Second Magic Eden connection attempt failed, trying trusted connection...');
            
            // Third try: Trusted connection if available
            try {
              response = await Promise.race([
                wallet.connect({ onlyIfTrusted: true }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Magic Eden trusted connection timeout')), 10000)
                )
              ]);
            } catch (thirdError) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              throw new Error(`Magic Eden connection failed after 3 attempts. Please try:\n1. Refresh the page\n2. Disconnect and reconnect Magic Eden wallet\n3. Clear browser cache\n4. Restart Magic Eden extension\n\nError: ${errorMessage}`);
            }
          }
        }
      } else {
        // Standard connection for other wallets
        response = await Promise.race([
          wallet.connect({ onlyIfTrusted: false }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 8000)
          )
        ]);
      }
      
      console.log(`📡 Connection response from ${walletType}:`, response);
      
      if (!response?.publicKey) {
        throw new Error(`${walletType} did not return a public key`);
      }
      
      const walletAddress = response.publicKey.toString();
      console.log(`✅ Successfully connected ${walletType} wallet:`, walletAddress);
      
      return { walletAddress, walletName };
    } catch (error) {
      console.error(`❌ Error connecting ${walletType} wallet:`, error);
      throw error;
    }
  };

  // Universal wallet connection function
  const connectWallet = async (preferredWallet?: string) => {
    console.log('🔗 Starting wallet connection process...');
    setIsConnectingWallet(true);
    
    try {
      // Detect available wallets
      let availableWallets = detectWallets();
      
      if (availableWallets.length === 0) {
        console.log('❌ No Solana wallets detected');
        
        // Wait a moment and try again in case wallets are still loading
        console.log('🔄 Waiting for wallet extensions to load...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const retryWallets = detectWallets();
        if (retryWallets.length === 0) {
          // Detect browser type for better recommendations
          const userAgent = navigator.userAgent.toLowerCase();
          const isPhantomBrowser = userAgent.includes('phantom');
          const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
          
          let walletMessage = 'No Solana wallets detected!\n\nSupported wallets:\n';
          
          if (isPhantomBrowser) {
            walletMessage += '• Phantom (Built-in for Phantom Browser)\n';
          } else {
            walletMessage += '• Phantom (phantom.app)\n';
          }
          
          walletMessage += '• Magic Eden (magiceden.io)\n• Solflare (solflare.com)\n• Backpack (backpack.app)\n';
          
          if (!isMobile) {
            walletMessage += '• Coinbase (coinbase.com)\n';
          } else {
            walletMessage += '• Glow (glow.app) - Mobile Optimized\n';
          }
          
          if (isPhantomBrowser) {
            walletMessage += '\nNote: You\'re using Phantom Browser - wallet should be automatically available.';
          } else {
            walletMessage += '\nInstall any wallet extension and refresh to continue.';
          }
          
          alert(walletMessage);
          setIsConnectingWallet(false);
          return;
        }
        availableWallets = retryWallets;
        console.log('✅ Wallets detected on retry:', retryWallets);
      }

      // Use preferred wallet or first available
      const walletToConnect = preferredWallet && availableWallets.includes(preferredWallet) 
        ? preferredWallet 
        : availableWallets[0];
      
      console.log(`🔗 Connecting to ${walletToConnect} (${availableWallets.length} wallets available)`);
      
      const { walletAddress, walletName } = await connectSpecificWallet(walletToConnect);
      console.log('✅ Connected wallet:', walletAddress);
      
      console.log('📡 Creating server wallet for:', walletAddress);
      // Create server wallet
      const serverResponse = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solanaWallet: walletAddress })
      });
      
      console.log('Server response status:', serverResponse.status);
      const serverData = await serverResponse.json();
      console.log('Server data:', serverData);
      
      if (serverResponse.ok) {
        console.log('✅ Server wallet created successfully');
        setConnectedWallet(walletAddress);
        setServerWallet(serverData.serverWallet);
        setBudzBalance(serverData.budzBalance);
        setGbuxBalance(serverData.gbuxBalance);
        setConnectedWalletType(walletName);
        setShowWalletModal(false);
        
        // Store in localStorage for persistence
        localStorage.setItem('connectedWallet', walletAddress);
        localStorage.setItem('serverWallet', serverData.serverWallet);
        localStorage.setItem('walletType', walletName);
        
        // Close welcome screen and trigger intro video
        setShowWelcomeScreen(false);
        
        // Check if intro video has been played for this session
        const hasPlayedIntroKey = `introPlayed_${walletAddress}`;
        const hasPlayedIntroSession = localStorage.getItem(hasPlayedIntroKey);
        
        if (!hasPlayedIntroSession) {
          console.log('🎬 Playing intro video for new session');
          setShowIntroVideo(true);
          setHasPlayedIntro(false);
          // Don't set localStorage here - set it after video ends
        } else {
          console.log('🎬 Intro video already played, starting game directly');
          setHasPlayedIntro(true);
          setGameState(prev => ({ ...prev, money: 80 })); // Start with improved initial money
        }
        
        console.log('✅ Game ready to start with wallet:', walletAddress);
        alert(`${walletName} wallet connected successfully! You can now play and earn BUDZ tokens!`);
      } else {
        console.log('❌ Server wallet creation failed:', serverData);
        throw new Error(serverData.error || 'Failed to create server wallet');
      }
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Disconnect from Phantom wallet if available
      if (window.solana && window.solana.isConnected) {
        await window.solana.disconnect();
      }
    } catch (error) {
      console.log('Error disconnecting from Phantom:', error);
    }
    
    // Complete localStorage cleanup to fix persistent state issues
    localStorage.clear();
    console.log('Complete localStorage cleared');
    
    // Clear window globals
    if (typeof window !== 'undefined') {
      delete (window as any).selectedPlugNft;
      delete (window as any).selectedNFT;
      delete (window as any).selectedAssistant;
    }
    
    // Broadcast clear event
    window.dispatchEvent(new CustomEvent('nftDeselected', { detail: { cleared: true } }));
    
    // Clear local state
    setConnectedWallet('');
    setServerWallet('');
    setBudzBalance(0);
    setGbuxBalance(0);
    setThcLabzBalance(0);
    setSolBalance(0);
    setShowWelcomeScreen(true);
    setHasPlayedIntro(false);
    setShowIntroVideo(false);
    
    alert('Wallet disconnected successfully!');
  };

  const updateWalletBalances = useCallback(async () => {
    if (!connectedWallet) return;
    
    setIsLoadingBalances(true);
    try {
      console.log(`🔍 Fetching real balances for wallet: ${connectedWallet}`);
      const response = await fetch(`/api/wallet/${connectedWallet}`);
      const data = await response.json();
      
      console.log('📊 Raw wallet response:', data);
      
      if (response.ok) {
        setBudzBalance(data.budzBalance || 0);
        setGbuxBalance(data.gbuxBalance || 0);
        setThcGrowerTokenBalance(data.thcLabzTokenBalance || 0);
        console.log('💰 Updated wallet balances:', { 
          budz: data.budzBalance, 
          gbux: data.gbuxBalance,
          thcLabz: data.thcLabzTokenBalance,
          sol: data.solBalance
        });
      } else {
        console.error('❌ Failed to fetch wallet balances:', data);
      }
    } catch (error) {
      console.error('❌ Error updating wallet balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [connectedWallet]);

  // Fetch real-time token prices with standby mode for NFT users
  const updateTokenPrices = useCallback(async (forceUpdate = false) => {
    try {
      // Standby mode: Only update if user has NFT or force update requested
      const hasNFT = connectedWallet && serverWallet;
      if (!hasNFT && !forceUpdate) {
        console.log('⏸️ Standby mode: No NFT user, skipping price update to conserve API limits');
        return;
      }

      console.log('💰 Updating token prices via batch API...');
      
      // Use single batch call to reduce API requests
      const batchResponse = await fetch('/api/token-prices/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: [
            '55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray', // GBUX
            '2i7TjYvmTfyU8P22x8HkX2Wv8nmEtsHbyR8QnThxnsiQ', // BUDZ
            'BmwJNuAAjFdKMfE9sWFb1YJJReJJGHLFsENPLkhjLbuT'  // THC LABZ
          ]
        })
      });
      
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        setGbuxPrice(batchData.gbux || 0.0000123);
        setBudzPrice(batchData.budz || 0.0000123);
        console.log('🔄 Batch prices updated - GBUX:', batchData.gbux, 'BUDZ:', batchData.budz, 'THC LABZ:', batchData.thcLabz);
      } else {
        // Fallback to individual calls only if batch fails
        console.log('📦 Batch API failed, using fallback prices');
        setGbuxPrice(0.0000123);
        setBudzPrice(0.0000123);
      }
    } catch (error) {
      console.error('Error fetching token prices:', error);
    }
  }, [connectedWallet, serverWallet]);

  // Token swap function
  const executeTokenSwap = useCallback(async () => {
    if (!connectedWallet || !serverWallet || swapAmount <= 0) return;
    
    setIsSwapping(true);
    try {
      const response = await fetch('/api/swap-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: connectedWallet,
          serverWallet: serverWallet,
          amount: swapAmount,
          direction: swapDirection,
          aiAgentWallet: 'ErSGeWkLuKqmW2MNrcFWPsYryNPXDW224GmgNBf8ZT65'
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Swap successful! Transaction: ${data.transactionId}`);
        updateWalletBalances();
        setSwapAmount(0);
      } else {
        alert(`Swap failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      alert('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  }, [connectedWallet, serverWallet, swapAmount, swapDirection, updateWalletBalances]);

  // Make saveSelectedNFT utility available globally for all components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).saveSelectedNFT = saveSelectedNFT;
      console.log('🌍 Made saveSelectedNFT utility globally available');
    }
  }, []);

  // Initialize NFT bonuses at game start
  const initializeNFTBonuses = async (walletAddress: string) => {
    try {
      console.log('🔍 Checking for GROWERZ NFTs in wallet:', walletAddress);
      
      // Check if bonuses have already been applied for this wallet
      const bonusAppliedKey = `nft_bonuses_applied_${walletAddress}`;
      if (localStorage.getItem(bonusAppliedKey)) {
        console.log('⏭️ NFT bonuses already applied for this wallet session');
        return;
      }

      // Fetch user's NFTs
      const response = await fetch(`/api/my-nfts/${walletAddress}`);
      if (!response.ok) {
        console.log('❌ Failed to fetch NFTs for wallet');
        return;
      }

      const data = await response.json();
      if (!data.success || !data.nfts || data.nfts.length === 0) {
        console.log('📭 No GROWERZ NFTs found in wallet');
        return;
      }

      const nfts = data.nfts;
      console.log(`🎯 Found ${nfts.length} GROWERZ NFT(s) in wallet`);

      if (nfts.length === 1) {
        // Auto-select single NFT as "the plug"
        const singleNFT = nfts[0];
        console.log(`🤖 Auto-selecting single NFT as plug: ${singleNFT.name}`);
        
        // Store selected NFT
        localStorage.setItem('selectedPlugNft', JSON.stringify(singleNFT));
        
        // Apply bonuses immediately
        const { initializeAIBonuses } = await import('../lib/ai-bonus-manager');
        const bonusActivated = await initializeAIBonuses(singleNFT.mint);
        
        if (bonusActivated) {
          console.log('✅ Auto-applied NFT bonuses for single GROWERZ NFT');
          localStorage.setItem(bonusAppliedKey, 'true');
          
          // Trigger event to update The Plug component
          window.dispatchEvent(new CustomEvent('plugAvatarChanged', { detail: singleNFT }));
        }
      } else {
        // Multiple NFTs found - prompt user to visit MY NFTS tab
        console.log(`🔄 Multiple NFTs found (${nfts.length}) - user should select one`);
        
        // Show a notification to guide user to select a plug
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #6b46c1, #7c3aed); color: white; padding: 16px; border-radius: 12px; z-index: 9999; max-width: 300px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
            <div style="font-weight: bold; margin-bottom: 8px;">🌿 Multiple GROWERZ NFTs Found!</div>
            <div style="font-size: 14px; margin-bottom: 12px;">Visit the "🖼️ My NFTs" tab to select one as your AI assistant for gameplay bonuses.</div>
            <button onclick="
              // Navigate to AI Assistant tab and set to MY NFTS section
              document.querySelector('[data-tab=\"assistant\"]')?.click();
              setTimeout(() => {
                const nftTab = document.querySelector('[data-nft-tab=\"nft\"]');
                if (nftTab) nftTab.click();
              }, 100);
              this.parentElement.parentElement.remove();
            " style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Take me there!</button>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
          }
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Error initializing NFT bonuses:', error);
    }
  };

  // Load wallet from localStorage on component mount
  useEffect(() => {
    const initializeWalletConnection = async () => {
      console.log('🔍 Initializing wallet connection and detection...');
      
      // First detect available wallets with enhanced logging
      const detectedWallets = detectWallets();
      console.log('🔍 Available wallets:', detectedWallets);
      
      const savedWallet = localStorage.getItem('connectedWallet');
      const savedServerWallet = localStorage.getItem('serverWallet');
      const savedWalletType = localStorage.getItem('walletType');
      
      console.log('💾 Saved wallet data:', { savedWallet, savedServerWallet, savedWalletType });
      
      if (savedWallet && savedServerWallet) {
        console.log('🔄 Found saved wallet connection, verifying...');
        
        // Verify the wallet still exists and is connected
        try {
          const response = await fetch(`/api/wallet/${savedWallet}`);
          if (response.ok) {
            const walletData = await response.json();
            console.log('✅ Verified saved wallet is valid:', walletData);
            
            setConnectedWallet(savedWallet);
            setServerWallet(savedServerWallet);
            setConnectedWalletType(savedWalletType || 'Unknown');
            
            // Load balances for saved wallet
            updateWalletBalances();
            updateTokenPrices(true);
            
            // Check if intro has been played for this wallet
            const hasPlayedIntroKey = `introPlayed_${savedWallet}`;
            const hasPlayedIntroSession = localStorage.getItem(hasPlayedIntroKey);
            
            if (hasPlayedIntroSession) {
              console.log('🎬 Intro already played, checking for saved game...');
              setShowWelcomeScreen(false);
              setHasPlayedIntro(true);
              
              // Initialize NFT bonuses at game start
              await initializeNFTBonuses(savedWallet);
              
              // Check if game was recently restarted
              const gameRestarted = localStorage.getItem(`gameRestarted_${savedWallet}`);
              
              if (gameRestarted) {
                console.log('🔄 Game restart detected - entering preparation mode');
                // Clear the restart flag
                localStorage.removeItem(`gameRestarted_${savedWallet}`);
                // Enter preparation mode instead of starting game directly
                console.log('🎮 Entering preparation mode for new round setup');
                setGameMode('preparation');
                setCurrentGameRoundId(`${savedWallet}_${Date.now()}`);
                // Clear action log for fresh start
                setActionLog([]);
              } else {
                // Try to load existing save
                const savedGame = loadLatestGameSave();
                if (savedGame && savedGame.day > 1) {
                  console.log(`🔄 Restoring progress from day ${savedGame.day} - entering playing mode`);
                  // Ensure all required fields exist with proper defaults
                  const gameStateWithDefaults = {
                    ...savedGame,
                    recentSales: Array.isArray(savedGame.recentSales) ? savedGame.recentSales : [], // Ensure recentSales is always an array
                    citiesVisited: Array.isArray(savedGame.citiesVisited) ? savedGame.citiesVisited : ['hometown'],
                    strainsSmoked: Array.isArray(savedGame.strainsSmoked) ? savedGame.strainsSmoked : [],
                    dailyCities: Array.isArray(savedGame.dailyCities) ? savedGame.dailyCities : []
                  };
                  setGameState(gameStateWithDefaults);
                  setCurrentGameRoundId(savedGame.gameRoundId || `${savedWallet}_${Date.now()}`);
                  setGameMode('playing'); // Continue existing game
                } else {
                  console.log('🎮 New user - entering preparation mode');
                  setGameMode('preparation'); // New players start in preparation mode
                  setCurrentGameRoundId(`${savedWallet}_${Date.now()}`);
                }
              }
            } else {
              console.log('🎬 Intro not played yet, showing welcome screen first');
              setShowWelcomeScreen(false); // Skip welcome but show intro after connection
            }
          } else {
            console.log('❌ Saved wallet no longer valid, clearing...');
            localStorage.removeItem('connectedWallet');
            localStorage.removeItem('serverWallet');
            localStorage.removeItem('walletType');
            setShowWelcomeScreen(true);
          }
        } catch (error) {
          console.error('❌ Error verifying saved wallet:', error);
          localStorage.removeItem('connectedWallet');
          localStorage.removeItem('serverWallet');
          localStorage.removeItem('walletType');
          setShowWelcomeScreen(true);
        }
      } else {
        console.log('🔍 No saved wallet found, showing welcome screen');
        setShowWelcomeScreen(true);
      }
    };
    
    // Wait for wallet extensions to load, then initialize
    setTimeout(initializeWalletConnection, 1500);
  }, [updateWalletBalances, updateTokenPrices, detectWallets]);

  // Set up automatic price updates every 30 minutes (1800000ms) to reduce API calls
  useEffect(() => {
    const priceUpdateInterval = setInterval(() => {
      updateTokenPrices(); // Uses standby mode - only updates for NFT users
    }, 1800000); // 30 minutes - reduced from 6 minutes to prevent rate limiting

    return () => clearInterval(priceUpdateInterval);
  }, [updateTokenPrices]);



  // Add manual price update button for users
  const forceUpdatePrices = useCallback(() => {
    updateTokenPrices(true); // Force update regardless of NFT status
  }, [updateTokenPrices]);

  // Update player progress for enhanced real-time leaderboard
  const updatePlayerProgress = useCallback(async (gameStateSave: any) => {
    if (!connectedWallet || !serverWallet) return;

    try {
      const progressData = {
        walletAddress: connectedWallet,
        name: (serverWallet.replace('demo_', '').substring(0, 8)) || 'Player',
        gameState: gameStateSave,
        selectedNFT: (selectedPlugNft as any)?.mint || null,
        nftRank: (selectedPlugNft as any)?.rank || null,
        nftRarity: (selectedPlugNft as any)?.rarity || null,
        gameRoundId: currentGameRoundId
      };

      const response = await fetch('/api/player-progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📊 Player progress updated for leaderboard: Day ${gameStateSave.day}, Money: $${(gameStateSave.money + (gameStateSave.bank || 0)).toLocaleString()}`);
      } else {
        console.error('❌ Failed to update player progress:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error updating player progress:', error);
    }
  }, [connectedWallet, serverWallet, currentGameRoundId]);

  // Enhanced game state management with daily saves to prevent progress loss
  // Player action logging system
  const [actionLog, setActionLog] = useState<Array<{
    id: string;
    day: number;
    time: string;
    type: string;
    description: string;
    details: any;
    result: string;
  }>>([]);

  const logPlayerAction = useCallback((type: string, description: string, details: any = {}, result: string = 'success') => {
    const action = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      day: gameState.day,
      time: new Date().toLocaleTimeString(),
      type,
      description,
      details,
      result,
      timestamp: new Date().toISOString()
    };

    setActionLog(prev => {
      const newLog = [action, ...prev].slice(0, 200); // Keep last 200 actions
      return newLog;
    });

    console.log(`📝 Logged action: ${type} - ${description}`);
  }, [gameState.day]);

  const saveGameStateDaily = useCallback((currentGameState: typeof gameState, currentDrugs?: any) => {
    if (!connectedWallet) return;
    
    const dailySaveKey = `dopeWars_dailySave_${connectedWallet}_day${currentGameState.day}`;
    
    // Enhanced save with complete inventory and action log
    const gameStateSave = {
      ...currentGameState,
      // Complete inventory data - use parameter or current drugs state
      inventory: currentDrugs ? 
        Object.entries(currentDrugs || {}).reduce((inv, [drugId, drug]: [string, any]) => {
          if (drug.owned > 0) {
            inv[drugId] = drug.owned;
          }
          return inv;
        }, {} as Record<string, number>) : {},
      // Action log for gameplay tracking
      actionLog: actionLog,
      // Enhanced metadata
      savedAt: Date.now(),
      walletAddress: connectedWallet,
      serverWallet: serverWallet,
      gameRoundId: currentGameRoundId,
      saveType: 'daily_progress',
      saveVersion: '2.0',
      // Additional tracking data
      totalTransactions: currentGameState.totalPurchases || 0,
      totalProfits: currentGameState.money - 2000, // Starting money was 2000
      currentInventoryValue: currentDrugs ? 
        Object.entries(currentDrugs || {}).reduce((total, [drugId, drug]: [string, any]) => {
          return total + (drug.owned * drug.currentPrice);
        }, 0) : 0
    };
    
    try {
      localStorage.setItem(dailySaveKey, JSON.stringify(gameStateSave));
      localStorage.setItem(`dopeWars_lastSave_${connectedWallet}`, JSON.stringify({
        day: currentGameState.day,
        timestamp: Date.now(),
        key: dailySaveKey,
        hasInventory: Object.keys(gameStateSave.inventory || {}).length > 0,
        actionCount: actionLog.length
      }));
      
      // Log the save action itself
      logPlayerAction('save', `Game progress saved on day ${currentGameState.day}`, {
        location: currentGameState.currentCity,
        money: currentGameState.money,
        inventoryItems: Object.keys((gameStateSave.inventory) || {}).length,
        totalValue: gameStateSave.currentInventoryValue
      });
      
      console.log(`💾 Enhanced save completed for day ${currentGameState.day} - Money: $${currentGameState.money.toLocaleString()}, Inventory: ${Object.keys(gameStateSave.inventory || {}).length} items, Actions: ${actionLog.length}`);
      
      // Update real-time player progress tracking for enhanced leaderboard
      updatePlayerProgress(gameStateSave);
    } catch (error) {
      console.error('❌ Failed to save daily progress:', error);
    }
  }, [connectedWallet, serverWallet, currentGameRoundId, actionLog, logPlayerAction]);

  // Load most recent save with enhanced inventory and action log restoration
  const loadLatestGameSave = useCallback(() => {
    if (!connectedWallet) return null;
    
    try {
      const lastSaveInfo = localStorage.getItem(`dopeWars_lastSave_${connectedWallet}`);
      if (lastSaveInfo) {
        const saveInfo = JSON.parse(lastSaveInfo);
        const savedGameState = localStorage.getItem(saveInfo.key);
        
        if (savedGameState) {
          const gameData = JSON.parse(savedGameState);
          
          // Restore inventory to drugs state
          if (gameData.inventory && Object.keys(gameData.inventory || {}).length > 0) {
            console.log(`📦 Restoring inventory: ${Object.keys(gameData.inventory || {}).length} items`);
            
            // Update drugs state with saved inventory
            setTimeout(() => {
              setDrugs(prev => {
                const restored = { ...prev };
                Object.entries(gameData.inventory || {}).forEach(([drugId, quantity]) => {
                  if (restored[drugId]) {
                    restored[drugId] = { ...restored[drugId], owned: quantity as number };
                  }
                });
                return restored;
              });
            }, 100);
          }

          // Restore action log
          if (gameData.actionLog && Array.isArray(gameData.actionLog)) {
            console.log(`📝 Restoring action log: ${gameData.actionLog.length} actions`);
            setActionLog(gameData.actionLog);
          }
          
          console.log(`🔄 Enhanced save loaded from day ${gameData.day} (${new Date(saveInfo.timestamp).toLocaleString()}) - ${saveInfo.hasInventory ? 'With inventory' : 'No inventory'}, ${saveInfo.actionCount || 0} actions`);
          return gameData;
        }
      }
    } catch (error) {
      console.error('❌ Failed to load game save:', error);
    }
    return null;
  }, [connectedWallet]);

  // Player Panel Action Handler
  const handlePlayerPanelAction = (action: string, data?: any) => {
    console.log(`🎯 [Player Panel] Action: ${action}`, data);
    
    switch(action) {
      case 'scout_area':
        // Enhanced stat-based scouting with progressive bonuses
        const streetwiseLevel = gameState.skills?.streetwise || 0;
        let scoutResults: string[] = [];
        let heatReduction = 0;
        let reputationGain = 0;
        
        if (streetwiseLevel >= 1) {
          scoutResults.push('Found 1-2 safe dealing spots');
          heatReduction = 1;
          reputationGain = 5;
        }
        if (streetwiseLevel >= 3) {
          scoutResults.push('Mapped police patrol schedules');
          heatReduction += 1;
          reputationGain += 5;
        }
        if (streetwiseLevel >= 5) {
          scoutResults.push('Discovered rival territory boundaries');
          heatReduction += 1;
          reputationGain += 10;
          // Chance to find special products or customers
          if (Math.random() < 0.4) {
            scoutResults.push('Located VIP customer hideout');
            setGameState(prev => ({ ...prev, money: prev.money + 200 }));
          }
        }
        if (streetwiseLevel >= 7) {
          scoutResults.push('Found exclusive VIP customer locations');
          heatReduction += 2;
          reputationGain += 15;
          // Higher chance for big finds
          if (Math.random() < 0.6) {
            scoutResults.push('Uncovered underground market entrance');
            setGameState(prev => ({ ...prev, money: prev.money + 500 }));
          }
        }
        
        if (streetwiseLevel === 0) {
          setActionLog(prev => [...prev, `❌ Scouting failed - Need Streetwise skill level 1+`]);
        } else {
          setActionLog(prev => [...prev, `🕵️ Scouted ${cities[gameState.currentCity as keyof typeof cities]}:\n${scoutResults.join('\n• ')}`]);
          setGameState(prev => ({ 
            ...prev, 
            heat: Math.max(0, prev.heat - heatReduction),
            reputation: (prev.reputation || 0) + reputationGain
          }));
          
          setEventMessage(`🕵️ SCOUTING COMPLETE!\n\n${scoutResults.join('\n• ')}\n\n🧊 Heat: -${heatReduction}\n📈 Rep: +${reputationGain}`);
          setShowEvent(true);
          setTimeout(() => setShowEvent(false), 4000);
        }
        break;
        
      case 'check_market':
        // Open market analysis
        setCurrentView('market');
        setShowPlayerPanel(false);
        break;
        
      case 'network':
        // Enhanced stat-based networking with progressive connections
        const networkingLevel = gameState.skills?.networking || 0;
        let networkResults: string[] = [];
        let moneyGain = 0;
        let priceImprovement = false;
        
        if (networkingLevel >= 1) {
          networkResults.push('Connected with basic street suppliers');
          moneyGain = 100;
        }
        if (networkingLevel >= 3) {
          networkResults.push('Found better drug pricing sources');
          priceImprovement = true;
          moneyGain += 150;
          // Generate new prices with networking bonus
          generatePrices(gameState.currentCity, gameState.day);
        }
        if (networkingLevel >= 5) {
          networkResults.push('Gained VIP customer referrals');
          moneyGain += 250;
          // Chance for special customer connection
          if (Math.random() < 0.5) {
            networkResults.push('Celebrity client wants private meeting');
            setGameState(prev => ({ ...prev, money: prev.money + 800 }));
            moneyGain += 800;
          }
        }
        if (networkingLevel >= 7) {
          networkResults.push('Established cartel connections');
          moneyGain += 500;
          // High chance for exclusive deals
          if (Math.random() < 0.7) {
            networkResults.push('Cartel offers exclusive product line');
            setGameState(prev => ({ ...prev, money: prev.money + 1500 }));
            moneyGain += 1500;
          }
        }
        
        if (networkingLevel === 0) {
          setActionLog(prev => [...prev, `❌ Networking failed - Need Networking skill level 1+`]);
        } else {
          setActionLog(prev => [...prev, `🤝 Networking in ${cities[gameState.currentCity as keyof typeof cities]}:\n${networkResults.join('\n• ')}`]);
          setGameState(prev => ({ 
            ...prev, 
            money: prev.money + moneyGain,
            reputation: (prev.reputation || 0) + (networkingLevel * 3)
          }));
          
          setEventMessage(`🤝 NETWORKING SUCCESS!\n\n${networkResults.join('\n• ')}\n\n💰 Earned: $${moneyGain}\n📈 Rep: +${networkingLevel * 3}${priceImprovement ? '\n📊 New market prices generated!' : ''}`);
          setShowEvent(true);
          setTimeout(() => setShowEvent(false), 5000);
        }
        break;
        
      case 'lay_low':
        // Enhanced stat-based laying low with progressive benefits
        const mastermindLevel = gameState.skills?.mastermind || 0;
        let layLowResults: string[] = [];
        let layLowHeatReduction = 2; // Base heat reduction
        let bonusEffects: string[] = [];
        
        if (mastermindLevel >= 1) {
          layLowResults.push('Successfully avoided police attention');
          layLowHeatReduction = 2;
        }
        if (mastermindLevel >= 3) {
          layLowResults.push('Dodged potential police raids');
          layLowHeatReduction = 3;
          // Chance to avoid random events
          if (Math.random() < 0.4) {
            bonusEffects.push('Avoided rival gang encounter');
          }
        }
        if (mastermindLevel >= 5) {
          layLowResults.push('Built strategic reputation while staying hidden');
          layLowHeatReduction = 4;
          setGameState(prev => ({ ...prev, reputation: (prev.reputation || 0) + 10 }));
          bonusEffects.push('Reputation +10');
        }
        if (mastermindLevel >= 7) {
          layLowResults.push('Gathered valuable market intelligence while laying low');
          layLowHeatReduction = 5;
          // Market intelligence bonus
          if (Math.random() < 0.6) {
            generatePrices(gameState.currentCity, gameState.day);
            bonusEffects.push('New market intelligence gathered');
          }
          // Money bonus from strategic positioning
          setGameState(prev => ({ ...prev, money: prev.money + 300 }));
          bonusEffects.push('Strategic positioning bonus: $300');
        }
        
        if (mastermindLevel === 0) {
          setActionLog(prev => [...prev, `❌ Laying low failed - Need Mastermind skill level 1+`]);
        } else {
          setActionLog(prev => [...prev, `🤫 Laying low in ${cities[gameState.currentCity as keyof typeof cities]}:\n${layLowResults.join('\n• ')}`]);
          setGameState(prev => ({ 
            ...prev, 
            heat: Math.max(0, prev.heat - layLowHeatReduction)
          }));
          
          const bonusText = bonusEffects.length > 0 ? `\n\n🎯 Bonus Effects:\n${bonusEffects.join('\n• ')}` : '';
          setEventMessage(`🤫 LAYING LOW SUCCESS!\n\n${layLowResults.join('\n• ')}\n\n🧊 Heat: -${layLowHeatReduction}${bonusText}`);
          setShowEvent(true);
          setTimeout(() => setShowEvent(false), 4000);
        }
        break;
        
      case 'establish_traphouse':
        // Check requirements for trap house
        if (gameState.money >= 5000 && gameState.reputation >= 30) {
          setActionLog(prev => [...prev, `🏠 Established trap house in ${cities[gameState.currentCity as keyof typeof cities]} - $5,000 investment`]);
          setGameState(prev => ({ ...prev, money: prev.money - 5000 }));
        } else {
          setActionLog(prev => [...prev, `❌ Cannot establish trap house - Need $5,000 and 30+ reputation`]);
        }
        break;
        
      case 'hire_lawyer':
        if (gameState.money >= 2000) {
          setActionLog(prev => [...prev, `⚖️ Hired lawyer - Heat reduced, $2,000 spent`]);
          setGameState(prev => ({ 
            ...prev, 
            money: prev.money - 2000,
            heat: Math.max(0, prev.heat - 3)
          }));
        }
        break;
        
      case 'pay_fine':
        if (gameState.money >= 500) {
          setActionLog(prev => [...prev, `💰 Paid fine - Minor charges cleared, $500 spent`]);
          setGameState(prev => ({ 
            ...prev, 
            money: prev.money - 500,
            heat: Math.max(0, prev.heat - 1)
          }));
        }
        break;
        
      case 'police_bribe':
        if ((gameState.skills?.policeConnections || 0) >= 3 && gameState.money >= 1000) {
          setActionLog(prev => [...prev, `🚔 Used police connections - Heat significantly reduced, $1,000 spent`]);
          setGameState(prev => ({ 
            ...prev, 
            money: prev.money - 1000,
            heat: Math.max(0, prev.heat - 4)
          }));
        }
        break;
        
      case 'view_item':
        // Show detailed item information
        if (data) {
          setActionLog(prev => [...prev, `🔍 Examined ${data.name} - Quality: ${data.quality || 'Standard'}, Value: $${data.price}`]);
        }
        break;
        
      case 'view_property':
        // Show property purchase options
        if (data) {
          setActionLog(prev => [...prev, `🏢 Viewing ${data.type} property - Cost: $${data.cost}`]);
        }
        break;
        
      default:
        console.log(`🤷 [Player Panel] Unknown action: ${action}`);
    }
  };

  // Standalone restart game function for hamburger menu
  const restartGame = useCallback(() => {
    if (!confirm('Are you sure you want to restart your game? This will reset all progress but keep your wallet connected.')) {
      return;
    }

    // Set restart flag to prevent automatic save loading
    if (connectedWallet) {
      localStorage.setItem(`gameRestarted_${connectedWallet}`, 'true');
    }

    // Complete localStorage cleanup - remove ALL persistent data
    const allKeys = Object.keys(localStorage || {});
    const keysToRemove = allKeys.filter(key => 
      key.includes('selectedPlugNft') ||
      key.includes('selectedNft') ||
      key.includes('selectedAssistant') ||
      key.includes('grench') ||
      key.includes('aiAssistant') ||
      key.includes('thePlugAssistant') ||
      key.includes('nftSelection') ||
      key.includes('assistantSelection') ||
      key.includes('dopeWars_') ||
      key.includes('_dailySave_') ||
      key.includes('_lastSave_') ||
      key.includes('_save_') ||
      key.includes('_actionLog') ||
      (connectedWallet && key.includes(connectedWallet))
    );
    
    console.log(`🗑️ COMPLETE CLEANUP: Clearing ${keysToRemove.length} localStorage keys`);
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
    });

    // Reset complete game state with enhanced tracking fields and challenging start
    setGameState({
      money: 80,
      debt: 0,
      health: 100,
      day: 1,
      currentCity: 'hometown',
      coatSpace: 5,
      reputation: 0,
      timeLeftInDay: 600,
      isWorking: false,
      workDaysLeft: 0,
      daysWorkedThisWeek: 0,
      weekStartDay: 1,
      bankAccount: 0,
      skills: {},
      heat: 0,
      daysInCurrentCity: 1,
      recentSales: [],
      totalTransactions: 0,
      totalProfit: 0,
      highestDailyProfit: 0,
      citiesVisited: ['hometown'],
      dealsCompleted: 0,
      timesRobbed: 0,
      timesArrested: 0,
      loansRepaid: 0,
      maxConcurrentDebt: 0,
      strainsSmoked: [],
      nightDeals: 0,
      maxCitiesPerDay: 0,
      maxHeatReached: 0,
      bargainDeals: 0,
      highRiskPurchases: 0,
      aiChatCount: 0,
      dailyCities: [],
      lastDayForCityCount: 1,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastPriceGeneration: 0,
      dayStartedAt: Date.now(),
      completedMissions: [],
      cityPriceSeeds: {}
    });

    // Reset drugs inventory completely
    setDrugs(prev => {
      const resetDrugs = { ...prev };
      Object.keys(resetDrugs || {}).forEach(drugId => {
        resetDrugs[drugId] = {
          ...resetDrugs[drugId],
          owned: 0,
          totalBought: 0,
          totalSold: 0,
          totalSpent: 0,
          totalEarned: 0,
          averageBuyPrice: 0,
          highestSellPrice: 0,
          lowestBuyPrice: 999999,
          currentPrice: resetDrugs[drugId].basePrice
        };
      });
      return resetDrugs;
    });

    // Clear action log completely
    setActionLog([]);

    // Reset ALL other persistent game states
    setShowGameEnd(false);
    setShowAchievementRewards(false);
    setLastSmokingDay(0);
    setSmokingBuffs({active: false, drug: '', traits: []});
    setShowEndGameVideo(false);
    setEndGameVideoCompleted(false);
    setShowIntroVideo(false);
    // Don't clear the avatar on restart - let users keep their selected NFT
    // setSelectedAssistantAvatar(null);
    setCurrentGameRoundId(`round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    setShowAchievements(false);
    setShowAIAssistant(false);
    setAiNotificationCount(0);
    
    // Reset input amounts
    setBuyAmount({});
    setSellAmount({});
    setDepositAmount(0);
    setWithdrawAmount(0);
    setDebtPayAmount(0);
    setLoanAmount(1);
    
    // Clear saved game data for fresh start
    if (connectedWallet) {
      localStorage.removeItem(`thc_dope_wars_save_${connectedWallet}`);
      localStorage.removeItem(`thc_dope_wars_save_daily_${connectedWallet}`);
      // Clear all daily saves for this wallet
      for (let day = 1; day <= 45; day++) {
        localStorage.removeItem(`dopeWars_dailySave_${connectedWallet}_day${day}`);
      }
      localStorage.removeItem(`dopeWars_lastSave_${connectedWallet}`);
      console.log('🔄 Game completely restarted - All progress and action log cleared');
    }
    
    setCurrentView('market');
    
    // Log the restart action
    setTimeout(() => {
      logPlayerAction('restart', 'Game completely restarted', {
        walletAddress: connectedWallet,
        timestamp: new Date().toISOString(),
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }, 100);
    
    console.log('🔄 Game restarted successfully - All progress reset, action log cleared');
  }, [connectedWallet, logPlayerAction]);

  // Auto-save at end of each day
  // Track last saved day to prevent repeated saves
  const lastSavedDayRef = useRef<number>(0);
  
  useEffect(() => {
    if (connectedWallet && gameState.day > 1 && gameState.day !== lastSavedDayRef.current) {
      lastSavedDayRef.current = gameState.day;
      saveGameStateDaily(gameState, drugs);
    }
  }, [gameState.day, connectedWallet, saveGameStateDaily]);

  const [drugs, setDrugs] = useState<Record<string, Drug>>({
    reggie: { 
      id: 'reggie', name: 'Regz (Low Grade)', basePrice: 50, currentPrice: 50, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Indica Strain', 'Questionable Quality']
    },
    mids: { 
      id: 'mids', name: 'Midz (Mid Grade)', basePrice: 120, currentPrice: 120, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Hybrid Strain']
    },
    kush: { 
      id: 'kush', name: 'OG Kush', basePrice: 280, currentPrice: 280, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Indica Strain', 'High THC %', 'Rare Genetics']
    },
    // Weapons deliveries - new to the game
    glock: { 
      id: 'glock', name: 'Glock 19 (Basic)', basePrice: 800, currentPrice: 800, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Protection', 'Street Cred', 'Self Defense']
    },
    ak47: { 
      id: 'ak47', name: 'AK-47 (Military)', basePrice: 2400, currentPrice: 2400, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['High Power', 'Territory Control', 'Premium Defense']
    },
    // Special pickup items 
    specialPickup: { 
      id: 'specialPickup', name: 'Special Pickup Package', basePrice: 500, currentPrice: 500, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Exclusive', 'City Connections', 'GROWERZ NFT Required']
    },
    exclusiveDropoff: { 
      id: 'exclusiveDropoff', name: 'Exclusive Dropoff Mission', basePrice: 1200, currentPrice: 1200, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['VIP Access', 'High Reward', 'Interactive GROWERZ NFT Cutscene']
    },
    // Continue with existing THC products
    sour: { 
      id: 'sour', name: 'Sour Diesel', basePrice: 320, currentPrice: 320, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Sativa Strain', 'High THC %', 'Premium Quality']
    },
    purple: { 
      id: 'purple', name: 'Purple Haze', basePrice: 380, currentPrice: 380, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Sativa Strain', 'Rare Genetics']
    },
    white: { 
      id: 'white', name: 'White Widow', basePrice: 450, currentPrice: 450, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Hybrid Strain', 'Premium Quality', 'Rare Genetics']
    },
    gelato: { 
      id: 'gelato', name: 'Gelato', basePrice: 520, currentPrice: 520, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Hybrid Strain', 'High THC %', 'Premium Quality']
    },
    runtz: { 
      id: 'runtz', name: 'Runtz (Premium)', basePrice: 600, currentPrice: 600, owned: 0,
      totalBought: 0, totalSold: 0, totalSpent: 0, totalEarned: 0, averageBuyPrice: 0,
      highestSellPrice: 0, lowestBuyPrice: 999999,
      traits: ['Hybrid Strain', 'High THC %', 'Premium Quality', 'Rare Genetics']
    }
  });

  // Enhanced city system with factual US map coordinates and distances
  const cities = {
    hometown: 'Home Town',
    neighborhood: 'The NeighborHood', 
    central: 'Central Park',
    newyork: 'New York',
    stlouis: 'St. Louis',
    memphis: 'Memphis',
    baltimore: 'Baltimore',
    miami: 'Miami',
    atlanta: 'Atlanta',
    detroit: 'Detroit',
    kansascity: 'Kansas City',
    houston: 'Houston',
    neworleans: 'New Orleans',
    cleveland: 'Cleveland',
    oakland: 'Oakland',
    denver: 'Denver'
  };

  // Factual US map coordinates for accurate distance calculations
  const cityCoordinates = {
    hometown: { lat: 42.8864, lng: -78.8784 }, // Upstate NY (205 miles from NYC)
    neighborhood: { lat: 42.8864, lng: -78.8784 }, // Same as hometown
    central: { lat: 40.7829, lng: -73.9654 }, // Central Park, NYC
    newyork: { lat: 40.7128, lng: -74.0060 }, // NYC
    stlouis: { lat: 38.6270, lng: -90.1994 }, // St. Louis, MO
    memphis: { lat: 35.1495, lng: -90.0490 }, // Memphis, TN
    baltimore: { lat: 39.2904, lng: -76.6122 }, // Baltimore, MD
    miami: { lat: 25.7617, lng: -80.1918 }, // Miami, FL
    atlanta: { lat: 33.7490, lng: -84.3880 }, // Atlanta, GA
    detroit: { lat: 42.3314, lng: -83.0458 }, // Detroit, MI
    kansascity: { lat: 39.0997, lng: -94.5786 }, // Kansas City, MO
    houston: { lat: 29.7604, lng: -95.3698 }, // Houston, TX
    neworleans: { lat: 29.9511, lng: -90.0715 }, // New Orleans, LA
    cleveland: { lat: 41.4993, lng: -81.6944 }, // Cleveland, OH
    oakland: { lat: 37.8044, lng: -122.2712 }, // Oakland, CA
    denver: { lat: 39.7392, lng: -104.9903 } // Denver, CO
  };

  // Calculate distance between two cities using geolib
  const calculateDistance = useCallback((from: string, to: string): number => {
    const fromCoords = cityCoordinates[from as keyof typeof cityCoordinates];
    const toCoords = cityCoordinates[to as keyof typeof cityCoordinates];
    
    if (!fromCoords || !toCoords) return 100; // Default distance
    
    // Use geolib to calculate distance in miles
    // Using haversine formula for distance calculation
    const getDistance = (coords1: any, coords2: any) => {
      const toRad = (deg: number) => deg * (Math.PI / 180);
      const R = 3959; // Earth radius in miles
      const dLat = toRad(coords2.lat - coords1.lat);
      const dLon = toRad(coords2.lng - coords1.lng);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    const distanceInMiles = Math.round(getDistance(fromCoords, toCoords));
    
    return Math.max(distanceInMiles, 25); // Minimum 25 miles for gameplay balance
  }, []);

  // Calculate travel cost based on distance and current economy
  const calculateTravelCost = useCallback((from: string, to: string, method?: 'flight' | 'drive' | 'bus' | 'skillz_car'): number => {
    const distance = calculateDistance(from, to);
    
    // For distances over 300 miles, apply method-specific pricing (2x INCREASED COSTS)
    if (distance > 300 && method) {
      let baseCost: number;
      
      switch (method) {
        case 'flight':
          // Most expensive, fastest, highest risk
          baseCost = 300 + (distance * 1.6); // 2x increase
          break;
        case 'drive':
          // Medium cost, medium risk
          baseCost = 100 + (distance * 0.8); // 2x increase
          break;
        case 'bus':
          // Cheapest, slowest, lowest risk
          baseCost = 50 + (distance * 0.4); // 2x increase
          break;
        case 'skillz_car':
          // Only fuel cost, no rental - very affordable
          baseCost = 20 + (distance * 0.2); // 2x increase
          break;
        default:
          baseCost = 30; // 2x increase
          break;
      }
      
      // Add city danger premium (dangerous cities cost more to reach)
      const dangerousCities = ['newyork', 'baltimore', 'detroit', 'miami', 'oakland'];
      const dangerPremium = dangerousCities.includes(to) ? 50 : 0; // 2x increase
      
      return baseCost + dangerPremium;
    }
    
    // Standard pricing for distances under 300 miles (2x INCREASED COSTS)
    const baseCost = 30; // 2x increase
    const perMileCost = 16; // 2x increase
    const distanceCost = Math.ceil(distance / 100) * perMileCost;
    
    // Add city danger premium (dangerous cities cost more to reach)
    const dangerousCities = ['newyork', 'baltimore', 'detroit', 'miami', 'oakland'];
    const dangerPremium = dangerousCities.includes(to) ? 50 : 0; // 2x increase
    
    return baseCost + distanceCost + dangerPremium;
  }, [calculateDistance]);

  // Daily expenses system based on current game state
  const calculateDailyExpenses = useCallback((): number => {
    const baseLiving = 75; // Increased from previous suggestions for difficulty
    
    // Skills maintenance cost (higher level skills cost more to maintain)
    const totalSkillLevels = Object.values(gameState.skills || {}).length > 0 ? Object.values(gameState.skills || {}).reduce((sum, level) => sum + level, 0) : 0;
    const skillsCost = Math.ceil(totalSkillLevels / 3) * 12; // $12 per 3 skill levels
    
    // Operation overhead based on capacity and reputation
    const capacityOverhead = Math.ceil((gameState.coatSpace || 100) / 25) * 8; // $8 per 25 capacity
    const reputationCost = Math.ceil((gameState.reputation || 0) / 10) * 15; // Higher rep = higher costs
    
    // City cost modifier (expensive cities cost more to operate in)
    const expensiveCities = {
      'newyork': 45,
      'miami': 35,
      'oakland': 40,
      'denver': 25,
      'atlanta': 20,
      'houston': 15
    };
    const cityCost = expensiveCities[gameState.currentCity as keyof typeof expensiveCities] || 10;
    
    return baseLiving + skillsCost + capacityOverhead + reputationCost + cityCost;
  }, [gameState.skills, gameState.coatSpace, gameState.reputation, gameState.currentCity]);

  // Smoking session function
  const startSmokingSession = useCallback((drugId: string) => {
    // Check if already smoked today
    if (lastSmokingDay === gameState.day) {
      alert('You can only smoke once per day with your AI assistant!');
      return;
    }

    const drug = drugs[drugId];
    if (!drug || drug.owned < 1) {
      alert('You need at least 1 unit of this product to smoke!');
      return;
    }

    // Consume 1 unit of the product
    setDrugs(prev => ({
      ...prev,
      [drugId]: {
        ...prev[drugId],
        owned: prev[drugId].owned - 1
      }
    }));

    // Set smoking session data
    setSelectedDrugForSmoking(drugId);
    setLastSmokingDay(gameState.day);
    setSmokingBuffs({active: true, drug: drug.name, traits: drug.traits});
    setShowSmokingVideo(true);
    
    // Keep background music playing during smoking animation
    const { updateMusicBasedOnGameState } = useAudio.getState();
    updateMusicBasedOnGameState(gameState);
    
    // Track strains smoked for achievements
    setGameState(prev => {
      const newStrainsSmoked = prev.strainsSmoked || [];
      if (!newStrainsSmoked.includes(drug.name)) {
        return {...prev, strainsSmoked: [...newStrainsSmoked, drug.name]};
      }
      return prev;
    });
    
    console.log(`🌿 Started smoking session with ${drug.name} (Traits: ${drug.traits.join(', ')})`);
  }, [drugs, gameState.day, lastSmokingDay]);

  // Handle smoking video completion
  const handleSmokingVideoEnd = useCallback(() => {
    setShowSmokingVideo(false);
    
    // Re-enable background music after smoking video
    const { updateMusicBasedOnGameState } = useAudio.getState();
    updateMusicBasedOnGameState(gameState);
    
    // Show AI assistant with smoking buffs
    const drug = drugs[selectedDrugForSmoking];
    if (drug) {
      alert(`🌿 Smoking session complete! Your AI assistant is now enhanced with ${drug.name} effects: ${drug.traits.join(', ')}`);
    }
  }, [drugs, selectedDrugForSmoking]);

  // Generate random prices for current city with anti-cheat protection
  const generatePrices = useCallback(() => {
    const now = Date.now();
    const currentDay = gameState.day;
    const currentCity = gameState.currentCity;
    const sessionId = gameState.sessionId;
    
    // Anti-cheat: Prevent rapid price generation (price refresh exploit)
    if (gameState.lastPriceGeneration && (now - gameState.lastPriceGeneration) < 30000) {
      console.log('🚫 Anti-cheat: Price generation blocked - too frequent (< 30 seconds)');
      return;
    }

    // Anti-cheat: Use deterministic seed for each day+city combination
    const priceKey = `${currentDay}_${currentCity}_${sessionId}`;
    let existingSeed = gameState.cityPriceSeeds?.[priceKey];
    
    if (!existingSeed) {
      // Generate new seed only if none exists for this day+city
      existingSeed = `${currentDay}_${currentCity}_${now}_${Math.random().toString(36).substr(2, 9)}`;
      
      setGameState(prev => ({
        ...prev,
        cityPriceSeeds: {
          ...(prev.cityPriceSeeds || {}),
          [priceKey]: existingSeed
        },
        lastPriceGeneration: now
      }));
    }
    
    // Create deterministic random generator from seed
    const seedValue = existingSeed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Seeded random function
    let seedRandom = Math.abs(seedValue);
    const seededRandom = () => {
      seedRandom = (seedRandom * 9301 + 49297) % 233280;
      return seedRandom / 233280;
    };

    // Check for Terry's market predictions and apply them
    let terryPredictions: any[] = [];
    try {
      terryPredictions = JSON.parse(localStorage.getItem('terryPredictions') || '[]');
    } catch (e) {
      terryPredictions = [];
    }

    setDrugs(prev => {
      const newDrugs = { ...prev };
      Object.keys(newDrugs || {}).forEach(drugId => {
        const drug = newDrugs[drugId];
        
        // Start with seeded random for consistent base prices
        let multiplier = 0.5 + seededRandom() * 2.5;
        
        // Check if Terry made a prediction for this product that should now take effect
        const relevantPrediction = terryPredictions.find(p => 
          p.productId === drugId && 
          p.targetDay === currentDay &&
          (!p.cityHint || p.cityHint === cities[currentCity as keyof typeof cities])
        );
        
        if (relevantPrediction) {
          // Terry's prediction comes true! Apply the predicted change
          const baseMultiplier = 0.5 + seededRandom() * 2.5;
          const predictionMultiplier = 1 + (relevantPrediction.change / 100);
          multiplier = baseMultiplier * predictionMultiplier;
          
          // Ensure dramatic price changes as predicted
          if (relevantPrediction.isPriceIncrease) {
            multiplier = Math.max(multiplier, 2.0); // At least 2x base price for rises
          } else {
            multiplier = Math.min(multiplier, 0.6); // At least 40% reduction for crashes
          }
          
          console.log(`🐕 Terry's prediction came true! ${drug.name} ${relevantPrediction.change > 0 ? 'surged' : 'crashed'} by ${Math.abs(relevantPrediction.change)}% as predicted!`);
          
          // Show notification that Terry's prediction came true
          logPlayerAction('terry_prediction_accurate', `Terry's market intelligence proved accurate - ${drug.name} ${relevantPrediction.change > 0 ? 'surged' : 'crashed'} by ${Math.abs(relevantPrediction.change)}% as predicted!`, {
            product: drug.name,
            predictedChange: relevantPrediction.change,
            targetDay: relevantPrediction.targetDay,
            city: relevantPrediction.cityHint || currentCity,
            confidence: relevantPrediction.confidence
          });
        }
        
        newDrugs[drugId] = {
          ...drug,
          currentPrice: Math.round(drug.basePrice * multiplier)
        };
        
        // RARE DRUGS SYSTEM - Chemistry skill increases chance
        const chemistryLevel = gameState.skills.chemistry || 0;
        const baseRareChance = 0.05; // 5% base chance
        const rareDrugChance = baseRareChance + (chemistryLevel * 0.20); // +20% per chemistry level
        
        if (seededRandom() < rareDrugChance) {
          // This drug becomes a rare variant with special properties
          const rarePrefixes = ['Premium', 'Exotic', 'Lab-Grade', 'Imported', 'Organic', 'Medical'];
          const rarePrefix = rarePrefixes[Math.floor(seededRandom() * rarePrefixes.length)];
          
          newDrugs[drugId] = {
            ...newDrugs[drugId],
            name: `${rarePrefix} ${drug.baseName || drug.name}`,
            currentPrice: Math.round(newDrugs[drugId].currentPrice * (2 + seededRandom())), // 2-3x price
            isRare: true,
            rareBonus: 0.5 + seededRandom() * 0.5, // 50-100% bonus profit
            description: `Rare ${rarePrefix.toLowerCase()} quality with enhanced effects`
          };
          
          if (chemistryLevel > 0) {
            console.log(`🧪 Chemistry skill helped you find rare drug: ${newDrugs[drugId].name}`);
          }
        } else {
          // Reset to normal if not rare this time
          newDrugs[drugId] = {
            ...newDrugs[drugId],
            name: drug.baseName || drug.name,
            isRare: false,
            rareBonus: 0,
            description: drug.baseDescription || ''
          };
        }
      });
      return newDrugs;
    });
    
    // Clean up old Terry predictions (predictions older than 7 days)
    try {
      const existingPredictions = JSON.parse(localStorage.getItem('terryPredictions') || '[]');
      const activePredictions = existingPredictions.filter((p: any) => 
        currentDay - p.predictionDay <= 7 // Keep predictions for 7 days
      );
      if (activePredictions.length !== existingPredictions.length) {
        localStorage.setItem('terryPredictions', JSON.stringify(activePredictions));
        console.log(`🧹 Cleaned up ${existingPredictions.length - activePredictions.length} old Terry predictions`);
      }
    } catch (e) {
      // Clean start if predictions are corrupted
      localStorage.setItem('terryPredictions', '[]');
    }
    
    console.log(`💰 Prices generated for ${currentCity} on day ${currentDay} (seed: ${existingSeed.substr(-6)})`);
  }, [gameState.day, gameState.currentCity, gameState.sessionId, gameState.lastPriceGeneration, gameState.cityPriceSeeds, logPlayerAction]);

  // Heat management functions
  const increaseHeat = useCallback((amount: number, reason?: string) => {
    setGameState(prev => {
      const newHeat = Math.min(5, prev.heat + amount);
      if (newHeat > prev.heat && reason) {
        console.log(`🚨 Heat increased by ${amount} (${reason}): ${prev.heat} → ${newHeat}`);
      }
      // Track max heat reached for achievements
      const maxHeatReached = Math.max(prev.maxHeatReached || 0, newHeat === 5 ? (prev.maxHeatReached || 0) + 1 : prev.maxHeatReached || 0);
      return { ...prev, heat: newHeat, maxHeatReached };
    });
  }, []);

  const decreaseHeat = useCallback((amount: number, reason?: string) => {
    setGameState(prev => {
      const newHeat = Math.max(0, prev.heat - amount);
      if (newHeat < prev.heat && reason) {
        console.log(`❄️ Heat decreased by ${amount} (${reason}): ${prev.heat} → ${newHeat}`);
      }
      return { ...prev, heat: newHeat };
    });
  }, []);

  // Random events with heat-based probability
  const triggerRandomEvent = useCallback(() => {
    const currentHeat = gameState.heat;
    
    // Heat-based police events (higher heat = more likely)
    const policeEvents = [
      { 
        message: "DEA raid nearby! Prices are going up!", 
        effect: () => {
          setDrugs(prev => {
            const newDrugs = { ...prev };
            Object.keys(newDrugs || {}).forEach(drugId => {
              newDrugs[drugId] = { ...newDrugs[drugId], currentPrice: Math.round(newDrugs[drugId].currentPrice * 1.3) };
            });
            return newDrugs;
          });
          increaseHeat(2, "DEA raid in area");
        }
      },
      { 
        message: "A cop eyes you suspiciously...", 
        effect: () => {
          const resilienceLevel = gameState.skills.resilience || 0;
          const connectionsLevel = gameState.skills.connections || 0;
          let damage = 10;
          
          // Apply resilience damage reduction
          if (resilienceLevel > 0) {
            const resilienceReduction = resilienceLevel * 0.2; // 20% per level
            damage = damage * (1 - resilienceReduction);
            console.log(`💪 Resilience skill: ${(resilienceReduction * 100).toFixed(0)}% damage reduction`);
          }
          
          // Apply police connections damage reduction (for police events only)
          if (connectionsLevel > 0) {
            const connectionsReduction = connectionsLevel * 0.5; // 50% per level
            damage = damage * (1 - connectionsReduction);
            console.log(`👮 Police Connections: ${(connectionsReduction * 100).toFixed(0)}% police damage reduction`);
          }
          
          setGameState(prev => ({ ...prev, health: Math.max(0, prev.health - Math.round(damage)) }));
          increaseHeat(1, "Suspicious police activity");
        }
      },
      { 
        message: "🚨 POLICE RAID! 🚨\nThey found some of your stash!", 
        effect: () => {
          const resilienceLevel = gameState.skills.resilience || 0;
          const connectionsLevel = gameState.skills.connections || 0;
          const securityLevel = gameState.skills.security || 0;
          const loyaltyLevel = gameState.skills.loyalty || 0;
          let damage = 20;
          let drugLossPercentage = 0.3; // Base 30% loss
          
          // Apply Security skill - chance to completely dodge police raids
          if (securityLevel > 0 && Math.random() < (securityLevel * 0.2)) { // 20% dodge chance per level
            console.log(`🛡️ Security Network activated: Police raid avoided!`);
            setEventMessage(`🛡️ Your security network warned you in time - you avoided the raid!`);
            setShowEvent(true);
            setTimeout(() => setShowEvent(false), 3000);
            return; // Exit early, no damage or losses
          }
          
          // Trigger police animation with multiple officers based on heat level
          const policeCount = Math.min(3, Math.max(1, currentHeat));
          setPoliceIntensity(policeCount);
          triggerPoliceAnimation();
          
          // Apply resilience damage reduction
          if (resilienceLevel > 0) {
            const resilienceReduction = resilienceLevel * 0.2; // 20% per level
            damage = damage * (1 - resilienceReduction);
            console.log(`💪 Resilience skill: ${(resilienceReduction * 100).toFixed(0)}% damage reduction`);
          }
          
          // Apply police connections damage reduction (for police events only)
          if (connectionsLevel > 0) {
            const connectionsReduction = connectionsLevel * 0.5; // 50% per level
            damage = damage * (1 - connectionsReduction);
            console.log(`👮 Police Connections: ${(connectionsReduction * 100).toFixed(0)}% police damage reduction`);
          }
          
          // Apply Gang Loyalty - reduce drug losses
          if (loyaltyLevel > 0) {
            const loyaltyReduction = loyaltyLevel * 0.1; // 10% reduction per level
            drugLossPercentage = drugLossPercentage * (1 - loyaltyReduction);
            console.log(`🤝 Gang Loyalty: ${(loyaltyReduction * 100).toFixed(0)}% stash protection`);
          }
          
          setGameState(prev => ({ ...prev, health: Math.max(0, prev.health - Math.round(damage)), timesArrested: prev.timesArrested + 1 }));
          setDrugs(prev => {
            const newDrugs = { ...prev };
            Object.keys(newDrugs || {}).forEach(drugId => {
              newDrugs[drugId] = { ...newDrugs[drugId], owned: Math.floor(newDrugs[drugId].owned * (1 - drugLossPercentage)) };
            });
            return newDrugs;
          });
          decreaseHeat(2, "Police raid - heat reduced after bust");
        }
      },
      { 
        message: "🚔 BUSTED! 🚔\nPaid a heavy fine to avoid arrest!", 
        effect: () => {
          const resilienceLevel = gameState.skills.resilience || 0;
          const connectionsLevel = gameState.skills.connections || 0;
          let damage = 15;
          
          // Apply resilience damage reduction
          if (resilienceLevel > 0) {
            const resilienceReduction = resilienceLevel * 0.2; // 20% per level
            damage = damage * (1 - resilienceReduction);
            console.log(`💪 Resilience skill: ${(resilienceReduction * 100).toFixed(0)}% damage reduction`);
          }
          
          // Apply police connections damage reduction (for police events only)
          if (connectionsLevel > 0) {
            const connectionsReduction = connectionsLevel * 0.5; // 50% per level
            damage = damage * (1 - connectionsReduction);
            console.log(`👮 Police Connections: ${(connectionsReduction * 100).toFixed(0)}% police damage reduction`);
          }
          
          setGameState(prev => ({ 
            ...prev, 
            money: Math.max(0, prev.money - 500),
            health: Math.max(0, prev.health - Math.round(damage)),
            timesArrested: prev.timesArrested + 1
          }));
          decreaseHeat(1, "Paid fine - heat reduced");
        }
      }
    ];

    // Neutral/positive events
    const neutralEvents = [
      { 
        message: "You found some regz someone dropped!", 
        effect: () => setDrugs(prev => ({ ...prev, reggie: { ...prev.reggie, owned: prev.reggie.owned + Math.floor(Math.random() * 3) + 1 }}))
      },
      { 
        message: "A grower hooked you up with free midz!", 
        effect: () => setDrugs(prev => ({ ...prev, mids: { ...prev.mids, owned: prev.mids.owned + Math.floor(Math.random() * 2) + 1 }}))
      },
      { 
        message: "You got robbed by some street punks!", 
        effect: () => {
          // Trigger robber animation for robbery event
          triggerRobberAnimation(true); // Full robbery animation
          
          const securityLevel = gameState.skills.security || 0;
          let lossPercentage = 0.5; // Base 50% loss
          
          // Apply Security skill - reduce losses from robbery
          if (securityLevel > 0) {
            const securityReduction = securityLevel * 0.3; // 30% reduction per level
            lossPercentage = lossPercentage * (1 - securityReduction);
            console.log(`🛡️ Security skill: ${(securityReduction * 100).toFixed(0)}% loss reduction`);
          }
          
          setGameState(prev => {
            const stolenAmount = Math.floor(prev.money * lossPercentage);
            return { 
              ...prev, 
              money: prev.money - stolenAmount, 
              timesRobbed: prev.timesRobbed + 1 
            };
          });
          increaseHeat(2, "Robbery incident attracts attention");
        }
      },
      { 
        message: "Narcs are watching! Better lay low.", 
        effect: () => {
          const resilienceLevel = gameState.skills.resilience || 0;
          let damage = 15;
          
          // Apply resilience damage reduction
          if (resilienceLevel > 0) {
            const resilienceReduction = resilienceLevel * 0.2; // 20% per level
            damage = damage * (1 - resilienceReduction);
            console.log(`💪 Resilience skill: ${(resilienceReduction * 100).toFixed(0)}% damage reduction`);
          }
          
          setGameState(prev => ({ 
            ...prev, 
            health: Math.max(0, prev.health - Math.round(damage)),
            timesArrested: prev.timesArrested + 1
          }));
          increaseHeat(3, "Narcotics officers investigating");
        }
      },
      { 
        message: "You found a stash house with cash!", 
        effect: () => setGameState(prev => ({ ...prev, money: prev.money + Math.floor(Math.random() * 800) + 200 }))
      },
      { 
        message: "Competition got busted! Demand is high!", 
        effect: () => {
          setDrugs(prev => {
            const newDrugs = { ...prev };
            Object.keys(newDrugs || {}).forEach(drugId => {
              newDrugs[drugId] = { ...newDrugs[drugId], currentPrice: Math.round(newDrugs[drugId].currentPrice * 1.2) };
            });
            return newDrugs;
          });
        }
      },
      {
        message: "You laid low and avoided police attention.",
        effect: () => decreaseHeat(1, "Keeping a low profile")
      }
    ];

    // Heat-based event selection
    const heatProbability = Math.min(0.8, currentHeat * 0.15); // Max 80% chance of police events
    const randomValue = Math.random();
    
    console.log(`🎲 Random event check: Heat=${currentHeat}, Probability=${(heatProbability * 100).toFixed(1)}%, Roll=${(randomValue * 100).toFixed(1)}%`);
    
    let selectedEvents;
    if (randomValue < heatProbability && currentHeat > 0) {
      selectedEvents = policeEvents;
      console.log(`🚨 Police event triggered due to high heat (${currentHeat}/5)`);
    } else {
      selectedEvents = neutralEvents;
    }
    
    // Apply Streetwise skill - reduce chance of bad events
    const streetwiseLevel = gameState.skills.streetwise || 0;
    const badEventReduction = streetwiseLevel * 0.1; // 10% reduction per level
    const eventSkipChance = 0.3 + badEventReduction; // Base 30% + streetwise bonus
    
    // Skip event sometimes to avoid being too frequent
    if (Math.random() < eventSkipChance) {
      console.log(`⏭️ Skipping random event this time${streetwiseLevel > 0 ? ` (Streetwise skill helped avoid trouble)` : ''}`);
      return;
    }
    
    const randomEvent = selectedEvents[Math.floor(Math.random() * selectedEvents.length)];
    randomEvent.effect();
    
    setEventMessage(randomEvent.message);
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 2500); // Shortened to 2.5 seconds
    
    // Trigger special music for police events
    if (selectedEvents === policeEvents) {
      switchToTrack('police_chase', 500); // Quick transition for police events
    }
  }, [gameState.heat, increaseHeat, decreaseHeat]);

  // Buy drugs with enhanced tracking, AI bonuses, and skill effects
  const buyDrug = useCallback((drugId: string, amount: number) => {
    const drug = drugs[drugId];
    
    // Apply AI Assistant market bonuses to buying
    const marketBonus = applyMarketBonus(drug.currentPrice, 'buy');
    let adjustedPrice = marketBonus.finalPrice;
    
    // Apply skill bonuses - Negotiation skill
    const negotiationLevel = gameState.skills.negotiation || 0;
    if (negotiationLevel > 0) {
      const negotiationBonus = negotiationLevel * 0.05; // 5% per level
      adjustedPrice = adjustedPrice * (1 - negotiationBonus);
      console.log(`💼 Negotiation skill applied: ${(negotiationBonus * 100).toFixed(1)}% discount`);
    }
    
    // Apply skill bonuses - Market Analysis skill (future price prediction)
    const marketAnalysisLevel = gameState.skills.market || 0;
    if (marketAnalysisLevel > 0) {
      // Market analysis provides better timing information
      console.log(`📊 Market Analysis: This price is favorable for buying`);
    }
    
    const totalCost = adjustedPrice * amount;
    
    // Log AI bonus application
    if (marketBonus.bonus > 0) {
      console.log(`🤖 AI Assistant buy bonus: ${marketBonus.bonus.toFixed(1)}% (${marketBonus.description})`);
      console.log(`💰 Price adjusted: $${drug.currentPrice} → $${adjustedPrice} per unit`);
    }
    const totalSpace = Object.values(drugs || {}).length > 0 ? Object.values(drugs || {}).reduce((sum, d) => sum + d.owned, 0) : 0;
    
    if (gameState.money >= totalCost && totalSpace + amount <= gameState.coatSpace) {
      // Check if this is a high-risk purchase (90% of money)
      const isHighRisk = totalCost >= gameState.money * 0.9;
      
      // Check if this is a bargain deal (50% below base price)
      const isBargain = drug.currentPrice <= drug.basePrice * 0.5 && amount >= 100;
      
      // Check if this is a night deal (assuming 11 PM+ is night)
      const currentHour = new Date().getHours();
      const isNightDeal = currentHour >= 23 || currentHour < 6;
      
      setGameState(prev => ({ 
        ...prev, 
        money: prev.money - totalCost,
        totalTransactions: prev.totalTransactions + 1,
        dealsCompleted: prev.dealsCompleted + 1,
        // Track achievement metrics
        highRiskPurchases: isHighRisk ? (prev.highRiskPurchases || 0) + 1 : prev.highRiskPurchases,
        bargainDeals: isBargain ? (prev.bargainDeals || 0) + 1 : prev.bargainDeals,
        nightDeals: isNightDeal ? (prev.nightDeals || 0) + 1 : prev.nightDeals
      }));
      
      setDrugs(prev => {
        const currentDrug = prev[drugId];
        const newTotalBought = currentDrug.totalBought + amount;
        const newTotalSpent = currentDrug.totalSpent + totalCost;
        const newAverageBuyPrice = newTotalBought > 0 ? newTotalSpent / newTotalBought : 0;
        const newLowestBuyPrice = Math.min(currentDrug.lowestBuyPrice, drug.currentPrice);
        
        return {
          ...prev,
          [drugId]: { 
            ...currentDrug, 
            owned: currentDrug.owned + amount,
            totalBought: newTotalBought,
            totalSpent: newTotalSpent,
            averageBuyPrice: newAverageBuyPrice,
            lowestBuyPrice: newLowestBuyPrice === 999999 ? drug.currentPrice : newLowestBuyPrice
          }
        };
      });
      setBuyAmount(prev => ({ ...prev, [drugId]: 0 }));
      
      // Apply AI Assistant heat reduction bonuses
      let baseHeatIncrease = 0;
      if (totalCost > 5000) {
        baseHeatIncrease = totalCost > 15000 ? 2 : 1;
      }
      
      // Apply Stealth skill heat reduction
      const stealthLevel = gameState.skills.stealth || 0;
      if (stealthLevel > 0 && baseHeatIncrease > 0) {
        const stealthReduction = stealthLevel * 0.25; // 25% reduction per level
        baseHeatIncrease = baseHeatIncrease * (1 - stealthReduction);
        console.log(`🥷 Stealth Mode level ${stealthLevel}: Heat reduction ${(stealthReduction * 100).toFixed(0)}%`);
      }
      
      if (baseHeatIncrease > 0) {
        const heatReduction = applyHeatReduction(baseHeatIncrease);
        const finalHeatIncrease = Math.round(heatReduction.finalHeat);
        
        if (heatReduction.reduction > 0) {
          console.log(`🤖 AI Assistant heat reduction: ${heatReduction.reduction.toFixed(1)}% (${heatReduction.description})`);
          console.log(`🚨 Heat increase: ${baseHeatIncrease} → ${finalHeatIncrease}`);
        }
        
        if (finalHeatIncrease > 0) {
          increaseHeat(finalHeatIncrease, `${totalCost > 15000 ? 'Major' : 'Large'} ${drug.name} purchase ($${totalCost})`);
        }
      }
      
      // Log the purchase action with AI bonus info
      logPlayerAction('buy', `Bought ${amount} ${drug.name} for $${totalCost.toLocaleString()}${marketBonus.bonus > 0 ? ` (AI bonus: ${marketBonus.bonus.toFixed(1)}%)` : ''}`, {
        item: drug.name,
        quantity: amount,
        originalPrice: drug.currentPrice,
        adjustedPrice: adjustedPrice,
        total: totalCost,
        location: gameState.currentCity,
        isBargain,
        isHighRisk,
        isNightDeal,
        aiBonus: marketBonus.bonus,
        aiBonusDescription: marketBonus.description
      });

      // Trigger automatic AI influence for successful deals
      if (isBargain) {
        console.log('✨ Bargain deal completed - triggering great AI influence');
        setAiNotificationCount(prev => prev + 1);
      } else if (isHighRisk && totalCost > 10000) {
        console.log('✨ High-risk successful purchase - triggering excellent AI influence');
        setAiNotificationCount(prev => prev + 1);
      } else if (totalCost > 5000) {
        console.log('✨ Successful large deal - triggering good AI influence');
        setAiNotificationCount(prev => prev + 1);
      }
      
      // Apply Networking skill - chance for free drugs after purchases
      const networkingLevel = gameState.skills.networking || 0;
      if (networkingLevel > 0 && Math.random() < (networkingLevel * 0.15)) { // 15% per level
        const freeDrugs = Math.floor(Math.random() * 5) + 1; // 1-5 free drugs
        const randomDrugId = Object.keys(drugs || {})[Math.floor(Math.random() * Object.keys(drugs || {}).length)];
        setDrugs(prev => ({
          ...prev,
          [randomDrugId]: {
            ...prev[randomDrugId],
            owned: prev[randomDrugId].owned + freeDrugs
          }
        }));
        console.log(`🌐 Networking skill activated: Found ${freeDrugs} free ${drugs[randomDrugId].name}!`);
        setEventMessage(`🌐 Your connections hooked you up with ${freeDrugs} free ${drugs[randomDrugId].name}!`);
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
      }
      
      // Apply Chemistry skill - chance for special deals after purchases
      const chemistryLevel = gameState.skills.chemistry || 0;
      if (chemistryLevel > 0 && Math.random() < (chemistryLevel * 0.2)) { // 20% per level
        // Create a special high-potency version of purchased drug with bonus profit potential
        console.log(`🧪 Street Chemistry activated: Special enhanced batch created!`);
        setEventMessage(`🧪 Your chemistry knowledge created an enhanced batch! Quality boosted!`);
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
      }
    }
  }, [drugs, gameState.money, gameState.coatSpace, increaseHeat, logPlayerAction, gameState.currentCity]);

  // Sell drugs with enhanced tracking, AI bonuses, and skill effects
  const sellDrug = useCallback((drugId: string, amount: number) => {
    const drug = drugs[drugId];
    
    // Apply AI Assistant market bonuses to selling
    const marketBonus = applyMarketBonus(drug.currentPrice, 'sell');
    let adjustedPrice = marketBonus.finalPrice;
    
    // Apply skill bonuses - Intimidation skill
    const intimidationLevel = gameState.skills.intimidation || 0;
    if (intimidationLevel > 0) {
      const intimidationBonus = intimidationLevel * 0.05; // 5% per level
      adjustedPrice = adjustedPrice * (1 + intimidationBonus);
      console.log(`😤 Intimidation skill applied: ${(intimidationBonus * 100).toFixed(1)}% price increase`);
    }
    
    // Apply skill bonuses - Mastermind skill
    const mastermindLevel = gameState.skills.mastermind || 0;
    if (mastermindLevel > 0) {
      const mastermindBonus = mastermindLevel * 0.25; // 25% per level
      adjustedPrice = adjustedPrice * (1 + mastermindBonus);
      console.log(`👑 Drug Lord skill applied: ${(mastermindBonus * 100).toFixed(1)}% bonus earnings`);
    }
    

    
    // Apply skill bonuses - Reputation skill (unlock exclusive deals)
    const reputationLevel = gameState.skills.reputation || 0;
    if (reputationLevel > 0) {
      const reputationBonus = reputationLevel * 0.15; // 15% per level
      adjustedPrice = adjustedPrice * (1 + reputationBonus);
      console.log(`⭐ Street Reputation: Exclusive deal bonus ${(reputationBonus * 100).toFixed(1)}%`);
    }
    
    const totalEarnings = adjustedPrice * amount;
    
    // Log AI bonus application
    if (marketBonus.bonus > 0) {
      console.log(`🤖 AI Assistant sell bonus: ${marketBonus.bonus.toFixed(1)}% (${marketBonus.description})`);
      console.log(`💰 Price adjusted: $${drug.currentPrice} → $${adjustedPrice} per unit`);
    }
    
    if (drug.owned >= amount) {
      // Apply AI Assistant profit bonuses to earnings
      const profitBonus = applyProfitBonus(totalEarnings);
      const finalEarnings = profitBonus.finalMoney;
      const profit = finalEarnings - (drug.averageBuyPrice * amount);
      
      // Log AI profit bonus application
      if (profitBonus.bonus > 0) {
        console.log(`🤖 AI Assistant profit bonus: ${profitBonus.bonus.toFixed(1)}% (${profitBonus.description})`);
        console.log(`💰 Earnings boosted: $${totalEarnings} → $${finalEarnings}`);
      }
      
      setGameState(prev => ({ 
        ...prev, 
        money: prev.money + finalEarnings,
        totalTransactions: prev.totalTransactions + 1,
        totalProfit: prev.totalProfit + profit,
        dealsCompleted: prev.dealsCompleted + 1
      }));
      
      setDrugs(prev => {
        const currentDrug = prev[drugId];
        const newTotalSold = currentDrug.totalSold + amount;
        const newTotalEarned = currentDrug.totalEarned + finalEarnings;
        const newHighestSellPrice = Math.max(currentDrug.highestSellPrice, adjustedPrice);
        
        return {
          ...prev,
          [drugId]: { 
            ...currentDrug, 
            owned: currentDrug.owned - amount,
            totalSold: newTotalSold,
            totalEarned: newTotalEarned,
            highestSellPrice: newHighestSellPrice
          }
        };
      });
      setSellAmount(prev => ({ ...prev, [drugId]: 0 }));
      
      // Track recent sales and increase heat for large sales
      setGameState(prev => {
        const newSale = { city: prev.currentCity, amount: finalEarnings, day: prev.day };
        const existingSales = Array.isArray(prev.recentSales) ? prev.recentSales : []; // Ensure recentSales is always an array
        const updatedSales = [...existingSales, newSale]
          .filter(sale => sale && typeof sale.day === 'number' && prev.day - sale.day <= 3) // Keep only last 3 days
          .slice(-10); // Keep max 10 recent sales
        
        return {
          ...prev,
          recentSales: updatedSales
        };
      });

      // Apply AI Assistant heat reduction bonuses for sales
      let baseHeatIncrease = 0;
      if (finalEarnings > 8000) {
        baseHeatIncrease = finalEarnings > 20000 ? 2 : 1;
      }
      
      if (baseHeatIncrease > 0) {
        const heatReduction = applyHeatReduction(baseHeatIncrease);
        const finalHeatIncrease = Math.round(heatReduction.finalHeat);
        
        if (heatReduction.reduction > 0) {
          console.log(`🤖 AI Assistant sell heat reduction: ${heatReduction.reduction.toFixed(1)}% (${heatReduction.description})`);
          console.log(`🚨 Heat increase: ${baseHeatIncrease} → ${finalHeatIncrease}`);
        }
        
        if (finalHeatIncrease > 0) {
          increaseHeat(finalHeatIncrease, `${finalEarnings > 20000 ? 'Major' : 'Large'} ${drug.name} sale ($${finalEarnings})`);
        }
      }
      
      // Log the sale action with AI bonus info
      logPlayerAction('sell', `Sold ${amount} ${drug.name} for $${finalEarnings.toLocaleString()}${marketBonus.bonus > 0 || profitBonus.bonus > 0 ? ` (AI bonuses applied)` : ''}`, {
        item: drug.name,
        quantity: amount,
        originalPrice: drug.currentPrice,
        adjustedPrice: adjustedPrice,
        originalEarnings: totalEarnings,
        finalEarnings: finalEarnings,
        profit: profit,
        location: gameState.currentCity,
        averageBuyPrice: drug.averageBuyPrice,
        marketBonus: marketBonus.bonus,
        profitBonus: profitBonus.bonus,
        marketBonusDescription: marketBonus.description,
        profitBonusDescription: profitBonus.description
      });

      // Trigger event animations for successful sales
      if (profit > 5000) {
        // Trigger dealer animation for good sales
        triggerDealerAnimation(`💰 Great sale! Earned $${finalEarnings.toLocaleString()} profit!`);
        
        // 30% chance to trigger GROWERZ NFT sale animation for big sales
        if (Math.random() < 0.3 && nfts.length > 0) {
          triggerGrowerNFTSaleAnimation(nfts);
        }
      }
      
      // Trigger automatic AI influence for successful sales
      if (profit > 10000) {
        console.log('✨ High-profit sale completed - triggering excellent AI influence');
        setAiNotificationCount(prev => prev + 1);
      } else if (totalEarnings > 15000) {
        console.log('✨ Large sale completed - triggering great AI influence');
        setAiNotificationCount(prev => prev + 1);
      } else if (profit > 2000) {
        console.log('✨ Profitable sale completed - triggering good AI influence');
        setAiNotificationCount(prev => prev + 1);
      }

      // Check for excessive selling in current city
      const currentCitySales = (Array.isArray(gameState.recentSales) ? gameState.recentSales : []).filter(sale => 
        sale && sale.city === gameState.currentCity && 
        typeof sale.day === 'number' && gameState.day - sale.day <= 2 // Last 2 days
      );
      
      if (currentCitySales.length >= 3) {
        increaseHeat(1, `Selling too much in ${cities[gameState.currentCity as keyof typeof cities]} recently`);
      }
    }
  }, [drugs, increaseHeat, logPlayerAction, gameState.currentCity]);

  // Handle AI Event System choices
  const handleAIEventChoice = useCallback((eventId: string, choiceId: string, effects: any) => {
    console.log('🤖 AI Event Choice:', { eventId, choiceId, effects });
    
    // Apply effects to game state
    setGameState(prev => {
      const newState = { ...prev };
      
      // Apply money changes
      if (effects.money) {
        newState.money = Math.max(0, newState.money + effects.money);
      }
      
      // Apply heat changes
      if (effects.heat) {
        newState.heat = Math.max(0, Math.min(5, newState.heat + effects.heat));
      }
      
      // Apply reputation changes
      if (effects.reputation) {
        newState.reputation = Math.max(0, Math.min(100, newState.reputation + effects.reputation));
      }
      
      // Apply time changes
      if (effects.time) {
        newState.timeLeftInDay = Math.max(0, newState.timeLeftInDay + effects.time);
      }
      
      // Track achievement progress
      newState.totalTransactions = (newState.totalTransactions || 0) + 1;
      
      return newState;
    });
    
    // Apply inventory changes
    if (effects.inventory && Array.isArray(Object.values(drugs))) {
      setDrugs(prevDrugs => {
        const newDrugs = { ...prevDrugs };
        Object.entries(effects.inventory).forEach(([strainName, change]) => {
          const drugId = Object.keys(newDrugs || {}).find(id => 
            newDrugs[id].name.toLowerCase() === strainName.toLowerCase()
          );
          if (drugId) {
            newDrugs[drugId] = {
              ...newDrugs[drugId],
              owned: Math.max(0, newDrugs[drugId].owned + (change as number))
            };
          }
        });
        return newDrugs;
      });
    }
  }, [drugs]);

  // Advance to next day with comprehensive anti-cheat protection - MUST BE DEFINED FIRST
  const advanceDay = useCallback(() => {
    const now = Date.now();
    
    // Anti-cheat: Prevent rapid day advancement
    if (gameState.dayStartedAt && (now - gameState.dayStartedAt) < 60000) {
      console.log('🚫 Anti-cheat: Day advancement blocked - current day too recent (< 1 minute)');
      return;
    }
    
    setGameState(prev => {
      const newDay = prev.day + 1;
      const isNewWeek = newDay - prev.weekStartDay >= 7;
      
      // Pay worker if working
      let newMoney = prev.money;
      if (prev.isWorking) {
        newMoney += 18; // $18 per day
      }
      
      // Check if staying in one city too long
      const daysInCity = prev.daysInCurrentCity + 1;
      let heatIncrease = 0;
      if (daysInCity >= 5) {
        heatIncrease = 1;
        console.log(`🔥 Heat increased by 1 - staying in ${cities[prev.currentCity as keyof typeof cities]} for ${daysInCity} days`);
      }

      return {
        ...prev,
        day: newDay,
        timeLeftInDay: 600, // Reset to 10 minutes
        money: newMoney,
        debt: Math.round(prev.debt * 1.1), // Interest on debt
        heat: Math.max(0, prev.heat - 0.5 + heatIncrease), // Heat naturally decreases but increases if staying too long
        daysInCurrentCity: daysInCity,
        // Reset work week if it's a new week
        daysWorkedThisWeek: isNewWeek ? 0 : prev.daysWorkedThisWeek,
        weekStartDay: isNewWeek ? newDay : prev.weekStartDay,
        dayStartedAt: now,
        lastHealthCheck: now
      };
    });
    
    // Generate new prices after day advancement
    generatePrices();
    
    console.log(`📅 Advanced to day ${gameState.day + 1}`);
  }, [gameState.day, gameState.dayStartedAt, cities, generatePrices]);

  // Event Animation Functions
  const triggerDealerAnimation = useCallback((message: string) => {
    setDealerMessage(message);
    setShowDealerAnimation(true);
    setTimeout(() => setShowDealerAnimation(false), 4000);
  }, []);

  const triggerRobberAnimation = useCallback((isRobbery: boolean = false) => {
    if (isRobbery) {
      setShowRobberAnimation(true);
      setTimeout(() => setShowRobberAnimation(false), 3000);
    } else {
      // Just a peek warning
      setRobberPeekActive(true);
      setTimeout(() => setRobberPeekActive(false), 2000);
    }
  }, []);

  const triggerPoliceAnimation = useCallback((intensity: number = 1) => {
    setPoliceIntensity(Math.min(3, Math.max(1, intensity)));
    setShowPoliceAnimation(true);
    setTimeout(() => setShowPoliceAnimation(false), 5000);
  }, []);

  const triggerGrowerNFTSaleAnimation = useCallback((availableNFTs: any[] = []) => {
    // Get a random GROWERZ NFT for the animation
    if (availableNFTs.length > 0) {
      const randomNFT = availableNFTs[Math.floor(Math.random() * availableNFTs.length)];
      setAnimatingGrowerNFT(randomNFT);
      setShowGrowerNFTAnimation(true);
      setTimeout(() => {
        setShowGrowerNFTAnimation(false);
        setAnimatingGrowerNFT(null);
      }, 3000);
    }
  }, []);

  const triggerRandomNFTRequest = useCallback((availableNFTs: any[] = []) => {
    if (availableNFTs.length > 0 && Math.random() < 0.3) { // 30% chance during day
      const randomNFT = availableNFTs[Math.floor(Math.random() * availableNFTs.length)];
      const drugs = ['weed', 'coke', 'speed', 'heroin', 'acid', 'shrooms'];
      const requestedDrug = drugs[Math.floor(Math.random() * drugs.length)];
      
      setRequestingNFT(randomNFT);
      setRequestedDrug(requestedDrug);
      setShowNFTRequest(true);
      setNftBonusAvailable(true);
      
      // Auto-close after 10 seconds
      setTimeout(() => {
        setShowNFTRequest(false);
        setNftBonusAvailable(false);
      }, 10000);
    }
  }, []);

  // Function to purchase Skillz Car
  const purchaseSkillzCar = useCallback(() => {
    const carCost = 7500;
    
    if (gameState.money < carCost) {
      setEventMessage(`You need $${carCost} to buy the Skillz Car. You have $${gameState.money}.`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000);
      return;
    }
    
    if (gameState.skillzCarOwner) {
      setEventMessage("You already own the Skillz Car!");
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      money: prev.money - carCost,
      skillzCarOwner: true
    }));
    
    setEventMessage("🚗 Skillz Car purchased! You can now drive yourself between cities with your Plug behind the wheel!");
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 4000);
    
    console.log('🚗 Skillz Car purchased successfully');
  }, [gameState.money, gameState.skillzCarOwner]);

  // Enhanced travel system with factual distances, costs, and animations
  const travelToCity = useCallback((cityId: string, travelMethod?: 'flight' | 'drive' | 'bus' | 'skillz_car') => {
    if (showGameEnd) return; // Block travel if game has ended
    
    if (gameState.isWorking) {
      setEventMessage("You can't travel while working!");
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }

    // Calculate distance and travel cost
    const fromCity = gameState.currentCity;
    const distance = calculateDistance(fromCity, cityId);
    
    // For distances over 300 miles, require travel method selection
    if (distance > 300 && !travelMethod) {
      setSelectedCityForTravel(cityId);
      setShowTravelOptions(true);
      return;
    }

    // Calculate travel cost with method
    const cost = calculateTravelCost(fromCity, cityId, travelMethod);

    // Check if player can afford travel
    if (gameState.money < cost) {
      setEventMessage(`You need $${cost} to travel to ${cities[cityId as keyof typeof cities]}. You have $${gameState.money}.`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000);
      return;
    }

    // Calculate daily expenses that will be due
    const dailyExpenses = calculateDailyExpenses();

    // Warn if travel + daily expenses will put player in financial trouble
    if (gameState.money - cost < dailyExpenses && gameState.money - cost > 0) {
      const remaining = gameState.money - cost;
      setEventMessage(`Warning: After travel ($${cost}), you'll have $${remaining} but need $${dailyExpenses} for daily expenses!`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 4000);
      // Allow travel but warn player
    }

    // Set up travel animation and cutscene
    const fromCityName = cities[fromCity as keyof typeof cities];
    const toCityName = cities[cityId as keyof typeof cities];
    
    setTravelingFrom(fromCityName);
    setTravelingTo(toCityName);
    setTravelDistance(distance);
    setTravelCost(cost);
    setTravelProgress(0);
    
    // Show appropriate travel cutscene based on method
    if (distance > 300 || travelMethod === 'skillz_car') {
      if (travelMethod === 'flight') {
        setTravelCutsceneMethod('flight');
      } else if (travelMethod === 'bus') {
        setTravelCutsceneMethod('bus');
      } else if (travelMethod === 'skillz_car') {
        setTravelCutsceneMethod('skillz_car');
      }
      setShowTravelCutscene(true);
      
      // Hide cutscene after 3 seconds and start normal travel animation
      setTimeout(() => {
        setShowTravelCutscene(false);
        setIsTraveling(true);
      }, 3000);
    } else {
      setIsTraveling(true);
    }

    // Deduct travel cost immediately
    setGameState(prev => ({
      ...prev,
      money: prev.money - cost
    }));

    // Calculate travel time reduction from Fast Transport skill
    const transportLevel = gameState.skills.transport || 0;
    const travelTimeReduction = transportLevel * 0.25; // 25% reduction per level
    const baseTravelTime = Math.max(0.5, distance / 500); // Base time based on distance (1 day per 500 miles)
    const actualTravelTime = Math.max(0.1, baseTravelTime - (baseTravelTime * travelTimeReduction)); // Minimum 2.4 hours

    console.log(`🚗 Traveling ${distance} miles from ${fromCityName} to ${toCityName} (Cost: $${cost})`);
    
    if (transportLevel > 0) {
      console.log(`🚗 Fast Transport level ${transportLevel}: Travel time reduced by ${(travelTimeReduction * 100).toFixed(0)}%`);
      console.log(`⏱️ Travel time: ${actualTravelTime.toFixed(2)} days instead of ${baseTravelTime.toFixed(2)} days`);
    }

    // Animate travel progress
    const animationDuration = 2000; // 2 seconds animation
    const steps = 20;
    const stepDelay = animationDuration / steps;
    
    let currentStep = 0;
    const animateTravel = () => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setTravelProgress(progress);
      
      if (currentStep < steps) {
        setTimeout(animateTravel, stepDelay);
      } else {
        // Travel animation complete
        setTimeout(() => {
          setIsTraveling(false);
          setTravelProgress(0);
          
          // Apply actual game effects after animation
          completeTravel(cityId, actualTravelTime, transportLevel, distance, cost);
        }, 500);
      }
    };

    // Start animation
    setTimeout(animateTravel, 100);
  }, [gameState.currentCity, gameState.money, gameState.isWorking, gameState.skills, calculateDistance, calculateTravelCost, calculateDailyExpenses, cities, showGameEnd]);

  // Complete travel after animation
  const completeTravel = useCallback((cityId: string, actualTravelTime: number, transportLevel: number, distance: number, cost: number) => {
    // Define safe cities that reduce heat when traveling
    const safeCities = {
      'hometown': 2,      // Very safe - reduces heat by 2
      'neighborhood': 2,  // Very safe - reduces heat by 2  
      'central': 1,       // Safe - reduces heat by 1
      'denver': 1,        // Safe - reduces heat by 1
      'houston': 1,       // Safe - reduces heat by 1
      'kansascity': 1,    // Safe - reduces heat by 1
      'neworleans': 0,    // Neutral
      'stlouis': 0,       // Neutral
      'oakland': 0,       // Neutral
      'cleveland': 0,     // Neutral
      'memphis': 0,       // Neutral
      'atlanta': 0,       // Neutral
      'miami': 0,         // Neutral
      'detroit': 0,       // Neutral
      'baltimore': 0,     // Neutral
      'newyork': 0        // Neutral
    };
    
    const heatReduction = safeCities[cityId as keyof typeof safeCities] || 0;
    if (heatReduction > 0) {
      const cityName = cities[cityId as keyof typeof cities];
      setGameState(prev => ({
        ...prev,
        heat: Math.max(0, prev.heat - heatReduction)
      }));
      console.log(`🚗 Traveling to ${cityName} reduced heat by ${heatReduction}`);
    }
    
    // Log the travel action
    const fromCity = cities[gameState.currentCity as keyof typeof cities];
    const toCity = cities[cityId as keyof typeof cities];
    logPlayerAction('travel', `Traveled from ${fromCity} to ${toCity} (${distance} miles, $${cost})${transportLevel > 0 ? ` (Fast Transport: ${actualTravelTime.toFixed(2)} days)` : ''}`, {
      from: gameState.currentCity,
      to: cityId,
      fromCity,
      toCity,
      distance,
      cost,
      heatReduction,
      travelTime: actualTravelTime,
      transportLevel
    });
    
    setGameState(prev => {
      // Track daily city visits for achievements
      let newDailyCities = prev.dailyCities || [];
      let newMaxCitiesPerDay = prev.maxCitiesPerDay || 0;
      
      // Reset daily cities if it's a new day
      if (prev.lastDayForCityCount !== prev.day) {
        newDailyCities = [cityId];
        newMaxCitiesPerDay = Math.max(newMaxCitiesPerDay, 1);
      } else if (!newDailyCities.includes(cityId)) {
        newDailyCities = [...newDailyCities, cityId];
        newMaxCitiesPerDay = Math.max(newMaxCitiesPerDay, newDailyCities.length);
      }
      
      return {
        ...prev, 
        currentCity: cityId,
        daysInCurrentCity: prev.currentCity === cityId ? prev.daysInCurrentCity + 1 : 1,
        citiesVisited: prev.citiesVisited.includes(cityId) 
          ? prev.citiesVisited 
          : [...prev.citiesVisited, cityId],
        dailyCities: newDailyCities,
        maxCitiesPerDay: newMaxCitiesPerDay,
        lastDayForCityCount: prev.day,
        // Apply travel time with Fast Transport bonus
        timeElapsed: (prev.timeElapsed || 0) + actualTravelTime
      };
    });
    
    // Apply travel time - if it's less than a full day, don't advance day
    if (actualTravelTime >= 1.0) {
      // Full day or more of travel
      const fullDays = Math.floor(actualTravelTime);
      const remainingTime = actualTravelTime - fullDays;
      
      for (let i = 0; i < fullDays; i++) {
        advanceDay();
      }
      
      if (remainingTime > 0) {
        setGameState(prev => ({
          ...prev,
          timeElapsed: (prev.timeElapsed || 0) + remainingTime
        }));
      }
    } else {
      // Partial day travel - just add to time elapsed
      setGameState(prev => ({
        ...prev,
        timeElapsed: (prev.timeElapsed || 0) + actualTravelTime
      }));
    }

    // Auto-advance day if time elapsed reaches 1.0
    setGameState(prev => {
      if ((prev.timeElapsed || 0) >= 1.0) {
        advanceDay();
        return {
          ...prev,
          timeElapsed: (prev.timeElapsed || 0) - 1.0
        };
      }
      return prev;
    });

    console.log(`✅ Travel completed: Arrived in ${cities[cityId as keyof typeof cities]}`);
  }, [gameState.currentCity, cities, logPlayerAction, advanceDay]);

  // Travel animation overlay component
  const TravelAnimation = () => {
    if (!isTraveling) return null;

    const selectedPlugNft = localStorage.getItem('selectedPlugNft');
    let plugImage = '';
    
    if (selectedPlugNft) {
      try {
        const nft = JSON.parse(selectedPlugNft);
        plugImage = nft.image || '';
      } catch (e) {
        console.log('Failed to parse selected NFT');
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-green-400 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
            Traveling...
          </h2>
          
          {plugImage && (
            <div className="mb-6 flex justify-center">
              <img 
                src={plugImage} 
                alt="Your Plug" 
                className="w-20 h-20 rounded-lg border-2 border-green-400 animate-bounce"
                style={{
                  transform: `translateX(${(travelProgress - 50) * 2}px)`
                }}
              />
            </div>
          )}
          
          <div className="mb-4">
            <div className="text-white mb-2">
              <strong>{travelingFrom}</strong> → <strong>{travelingTo}</strong>
            </div>
            <div className="text-sm text-gray-300">
              Distance: {travelDistance} miles • Cost: ${travelCost}
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-green-400 h-3 rounded-full transition-all duration-100"
              style={{ width: `${travelProgress}%` }}
            />
          </div>
          
          <div className="text-green-400 font-bold">
            {Math.round(travelProgress)}% Complete
          </div>
        </div>
      </div>
    );
  };

  // Mission completion anti-cheat validation system
  const validateMissionCompletion = useCallback((missionId: string, currentState: typeof gameState) => {
    const now = Date.now();
    const sessionId = currentState.sessionId;
    
    // Anti-cheat: Check if mission already completed in this session
    if (currentState.completedMissions.includes(missionId)) {
      console.log(`🚫 Anti-cheat: Mission ${missionId} already completed in session ${sessionId}`);
      return { valid: false, reason: 'Mission already completed this session' };
    }
    
    // Anti-cheat: Check minimum time between mission completions (prevent rapid farming)
    const lastCompletionTime = currentState.missionCompletionTimes[missionId];
    if (lastCompletionTime && (now - lastCompletionTime) < 300000) { // 5 minutes minimum
      console.log(`🚫 Anti-cheat: Mission ${missionId} completed too recently (< 5 minutes)`);
      return { valid: false, reason: 'Mission completed too recently' };
    }
    
    // Anti-cheat: Basic mission requirements validation
    const missionRequirements = {
      'daily_trader': { minDay: 1, minMoney: 0, minTransactions: 1 },
      'profit_master': { minDay: 1, minMoney: 10000, minTransactions: 5 },
      'city_explorer': { minDay: 2, minCities: 3, minTransactions: 2 },
      'risk_taker': { minDay: 3, minHeat: 2, minTransactions: 3 },
      'entrepreneur': { minDay: 5, minMoney: 50000, minTransactions: 10 }
    };
    
    const requirements = missionRequirements[missionId as keyof typeof missionRequirements];
    if (requirements) {
      if (currentState.day < requirements.minDay) {
        console.log(`🚫 Anti-cheat: Mission ${missionId} requires minimum day ${requirements.minDay}`);
        return { valid: false, reason: `Requires minimum day ${requirements.minDay}` };
      }
      
      if (requirements.minMoney && currentState.money < requirements.minMoney) {
        console.log(`🚫 Anti-cheat: Mission ${missionId} requires minimum money $${requirements.minMoney}`);
        return { valid: false, reason: `Requires minimum $${requirements.minMoney}` };
      }
      
      if (requirements.minTransactions && currentState.totalTransactions < requirements.minTransactions) {
        console.log(`🚫 Anti-cheat: Mission ${missionId} requires minimum ${requirements.minTransactions} transactions`);
        return { valid: false, reason: `Requires minimum ${requirements.minTransactions} transactions` };
      }
      
      if (requirements.minCities && currentState.citiesVisited.length < requirements.minCities) {
        console.log(`🚫 Anti-cheat: Mission ${missionId} requires visiting ${requirements.minCities} cities`);
        return { valid: false, reason: `Requires visiting ${requirements.minCities} cities` };
      }
      
      if (requirements.minHeat && currentState.heat < requirements.minHeat) {
        console.log(`🚫 Anti-cheat: Mission ${missionId} requires minimum heat level ${requirements.minHeat}`);
        return { valid: false, reason: `Requires minimum heat level ${requirements.minHeat}` };
      }
    }
    
    console.log(`✅ Anti-cheat: Mission ${missionId} validation passed`);
    return { valid: true, reason: 'Validation passed' };
  }, []);

  // Complete mission with anti-cheat protection
  const completeMission = useCallback((missionId: string, rewards: { money?: number, budz?: number, experience?: number }) => {
    const validation = validateMissionCompletion(missionId, gameState);
    
    if (!validation.valid) {
      console.log(`🚫 Mission completion blocked: ${validation.reason}`);
      alert(`Mission cannot be completed: ${validation.reason}`);
      return false;
    }
    
    const now = Date.now();
    
    // Update game state with mission completion tracking
    setGameState(prev => ({
      ...prev,
      completedMissions: [...prev.completedMissions, missionId],
      missionCompletionTimes: {
        ...prev.missionCompletionTimes,
        [missionId]: now
      },
      money: prev.money + (rewards.money || 0),
      totalTransactions: prev.totalTransactions + 1
    }));
    
    // Log the mission completion
    logPlayerAction('mission', `Completed mission: ${missionId}`, {
      missionId,
      rewards,
      validationPassed: true,
      sessionId: gameState.sessionId
    });
    
    console.log(`🎯 Mission ${missionId} completed with anti-cheat validation - Rewards: $${rewards.money || 0}, ${rewards.budz || 0} BUDZ`);
    return true;
  }, [gameState, validateMissionCompletion, logPlayerAction]);

  // Enhanced wallet detection with retry mechanism
  useEffect(() => {
    const performWalletDetection = () => {
      const wallets: string[] = [];
      
      console.log('🔍 Performing enhanced wallet detection...');
      console.log('window.solana:', window.solana);
      console.log('window.phantom:', window.phantom);
      
      if (window.solana?.isPhantom) {
        wallets.push('Phantom');
        console.log('✅ Phantom wallet detected via window.solana');
      } else if (window.phantom?.solana) {
        wallets.push('Phantom');
        console.log('✅ Phantom wallet detected via window.phantom');
      }
      
      if (window.magicEden?.solana) {
        wallets.push('Magic Eden');
        console.log('✅ Magic Eden wallet detected');
      }
      
      if (window.solflare) {
        wallets.push('Solflare');
        console.log('✅ Solflare wallet detected');
      }
      
      if (window.backpack?.solana) {
        wallets.push('Backpack');
        console.log('✅ Backpack wallet detected');
      }
      
      console.log('🔍 Final detected wallets:', wallets);
      setDetectedWallets(wallets);
      
      // Retry detection if no wallets found (wait for extensions to load)
      if (wallets.length === 0) {
        console.log('⏳ No wallets detected, retrying in 2 seconds...');
        setTimeout(performWalletDetection, 2000);
      }
    };
    
    // Initial detection
    performWalletDetection();
  }, []);

  // Rest and smoke break - skip 1 day and restore health to 100%
  const takeRestBreak = useCallback(() => {
    if (showGameEnd) return;
    
    if (gameState.isWorking) {
      setEventMessage("You can't rest while working at McShits!");
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }
    
    setGameState(prev => ({ ...prev, health: 100 }));
    advanceDay();
    generatePrices();
    triggerRandomEvent();
    
    setEventMessage("💨 Took a smoke break and rested up! 💨\nHealth restored to 100%");
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 2000);
    setCurrentView('market');
  }, [gameState.isWorking, advanceDay, generatePrices, triggerRandomEvent, showGameEnd]);

  // Start working at McShitz
  const startWork = useCallback(() => {
    if (showGameEnd) return; // Block work if game has ended
    
    if (gameState.daysWorkedThisWeek >= 4) {
      setEventMessage("You can only work 4 days per week!");
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      isWorking: true,
      workDaysLeft: 5,
      daysWorkedThisWeek: prev.daysWorkedThisWeek + 1,
      watchedWorkAd: false // Reset ad availability for new work period
    }));
    
    // Working reduces heat by keeping a low profile
    decreaseHeat(1, "Working at McShitz - keeping low profile");
    
    setEventMessage("Started working at McShits! You'll earn $18/day for 5 days.\n🧊 Working helps cool down heat!");
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 3000);
  }, [gameState.daysWorkedThisWeek, showGameEnd, decreaseHeat]);

  // Quit job early
  const quitJob = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isWorking: false,
      workDaysLeft: 0,
      watchedWorkAd: false // Reset ad availability when quitting
    }));
    
    setEventMessage("You quit your job at McShits!");
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 2000);
  }, []);

  // Real Google AdMob Rewarded Video Ad System - Actual Revenue Generation
  const playRewardedVideo = useCallback(async (adType: 'work_bonus' | 'overtime_pay') => {
    if (showGameEnd) return;
    
    const now = Date.now();
    const COOLDOWN_TIME = 300000; // 5 minutes between ads
    
    // Check daily ad limit (2 ads per game day)
    const currentDay = gameState.currentDay || 1;
    const adsWatchedToday = gameState.adsWatchedToday || {};
    const todayCount = adsWatchedToday[currentDay] || 0;
    
    if (todayCount >= 2) {
      setEventMessage(`📺 Daily ad limit reached!\n\nYou've watched 2 ads today (maximum allowed)\nCome back tomorrow for more earning opportunities!`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 4000);
      return;
    }
    
    // Anti-spam protection (5 minutes between ads)
    if (gameState.lastAdWatchTime && (now - gameState.lastAdWatchTime) < COOLDOWN_TIME) {
      const remainingTime = Math.ceil((COOLDOWN_TIME - (now - gameState.lastAdWatchTime)) / 60000);
      setEventMessage(`⏰ Please wait ${remainingTime} minutes before watching another ad`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000);
      return;
    }
    
    // Scaling reward system: $500 base + $100 per consecutive watch
    const consecutiveWorkAds = gameState.consecutiveWorkAds || 0;
    const rewardAmount = 500 + (consecutiveWorkAds * 100);
    
    console.log(`📺 [AdMob] Starting real rewarded video ad: ${adType} - Expected reward: $${rewardAmount}`);
    
    try {
      // Import real AdMob service
      const { adMobService } = await import('../lib/admob-integration');
      
      // Check if ad is ready
      if (!adMobService.isAdReady()) {
        setEventMessage('⏳ Loading advertisement, please wait...');
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
      }

      // Show real AdMob rewarded video (will use simulation in development)
      const adCompleted = await adMobService.showRewardedAd(adType);

      if (adCompleted) {
        // Update daily ad tracking
        const updatedAdsToday = { ...adsWatchedToday };
        updatedAdsToday[currentDay] = todayCount + 1;
        
        // Enhanced Legal Status & Reputation System Logic
        const lastVideoDay = gameState.lastVideoDay || 0;
        const consecutiveVideoStreak = gameState.consecutiveVideoStreak || 0;
        const currentStreetRep = gameState.streetRep || 0;
        
        // Check if player maintained consecutive streak (watched 2 videos daily)
        let newStreak = consecutiveVideoStreak;
        let streakBonus = 0;
        let missedDays = gameState.missedVideoDays || 0;
        
        if (updatedAdsToday[currentDay] === 2) { // Completed daily requirement
          if (lastVideoDay === currentDay - 1) {
            newStreak += 1; // Maintain streak
            streakBonus = newStreak * 100; // $100 bonus per streak day
            missedDays = 0; // Reset missed days
          } else if (lastVideoDay < currentDay - 1) {
            newStreak = 1; // Reset streak if missed days
            missedDays = Math.max(0, currentDay - lastVideoDay - 1);
          }
        }
        
        // Calculate total reward with progressive bonuses
        const baseReward = 500 + (consecutiveWorkAds * 100);
        const finalReward = baseReward + streakBonus;
        
        // Calculate reputation gain (more for consecutive streaks)
        const repGain = 15 + (newStreak * 5); // Base 15 + 5 per streak day
        const newStreetRep = Math.min(1000, currentStreetRep + repGain);
        
        // Heat reduction - more effective with higher reputation
        const heatReduction = Math.min(3, Math.floor(newStreetRep / 200) + 1);
        
        // Legal status progression based on reputation and heat
        let newLegalStatus = gameState.legalStatus || 'Clean';
        if (newStreetRep >= 750 && gameState.heat <= 1) {
          newLegalStatus = 'Respected Citizen';
        } else if (newStreetRep >= 500 && gameState.heat <= 2) {
          newLegalStatus = 'Good Standing';
        } else if (newStreetRep >= 250) {
          newLegalStatus = 'Clean Record';
        }
        
        // Ad completed successfully - apply comprehensive bonuses
        setGameState(prev => ({
          ...prev,
          money: prev.money + finalReward,
          totalAdsWatched: (prev.totalAdsWatched || 0) + 1,
          lastAdWatchTime: now,
          adBonusEarnings: (prev.adBonusEarnings || 0) + finalReward,
          adsWatchedToday: updatedAdsToday,
          consecutiveWorkAds: (prev.consecutiveWorkAds || 0) + 1,
          // Enhanced Legal & Reputation Systems
          streetRep: newStreetRep,
          consecutiveVideoStreak: newStreak,
          lastVideoDay: updatedAdsToday[currentDay] === 2 ? currentDay : lastVideoDay,
          missedVideoDays: missedDays,
          legalStatus: newLegalStatus,
          heat: Math.max(0, prev.heat - heatReduction)
        }));
        
        // Apply heat reduction effect
        if (heatReduction > 0) {
          decreaseHeat(heatReduction, `Legitimate work reduces police attention (-${heatReduction} heat)`);
        }
        
        // Log real ad completion for revenue tracking
        const revenueInfo = adMobService.getRevenuePotential();
        console.log(`✅ [AdMob] Real rewarded video completed - User earned $${rewardAmount}`);
        console.log(`💰 [Revenue] Developer earned: ${revenueInfo.perView} per view`);
        console.log(`📊 [Analytics] Total ads watched: ${(gameState.totalAdsWatched || 0) + 1}, Total ad earnings: $${(gameState.adBonusEarnings || 0) + rewardAmount}`);
        
        // Show comprehensive completion message with all benefits
        const remainingAds = 2 - (todayCount + 1);
        const repMessage = repGain > 0 ? `\n📈 Street Rep: +${repGain} (${newStreetRep}/1000)` : '';
        const heatMessage = heatReduction > 0 ? `\n🧊 Heat Reduced: -${heatReduction} (Legitimate work)` : '';
        const streakMessage = streakBonus > 0 ? `\n🔥 Streak Bonus: +$${streakBonus} (${newStreak} day streak!)` : '';
        const legalMessage = newLegalStatus !== gameState.legalStatus ? `\n⚖️ Legal Status: ${newLegalStatus}` : '';
        
        setEventMessage(`🎉 WORK COMPLETED! 🎉\n\n💰 Total Earned: $${finalReward}${streakMessage}${repMessage}${heatMessage}${legalMessage}\n\n📺 Daily Progress: ${todayCount + 1}/2 videos\n${remainingAds > 0 ? `🎬 ${remainingAds} more video(s) available today!` : '🏁 Daily requirement complete!'}\n\n✨ Available in ALL cities - Keep building your reputation!`);
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 6000);
        
        // Trigger money animation effect
        if (typeof createBouncyMoney === 'function') {
          createBouncyMoney(rewardAmount);
        }
        
      } else {
        // Ad was cancelled or failed
        setEventMessage('❌ Advertisement cancelled - No reward earned');
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
      }

    } catch (error) {
      console.error('❌ [AdMob] Error showing rewarded video:', error);
      setEventMessage('⚠️ Advertisement service temporarily unavailable, please try again later');
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000);
    }
    
  }, [gameState.lastAdWatchTime, gameState.totalAdsWatched, gameState.adBonusEarnings, showGameEnd]);

  // Bank functions
  const depositMoney = useCallback((amount: number) => {
    if (showGameEnd) return; // Block banking if game has ended
    
    if (gameState.money >= amount && amount > 0) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - amount,
        bankAccount: prev.bankAccount + amount
      }));
      setDepositAmount(0);
      setEventMessage(`Deposited $${amount.toLocaleString()} into your bank account.`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
    }
  }, [gameState.money, showGameEnd]);

  const withdrawMoney = useCallback((amount: number) => {
    if (showGameEnd) return; // Block banking if game has ended
    
    if (gameState.bankAccount >= amount && amount > 0) {
      setGameState(prev => ({
        ...prev,
        money: prev.money + amount,
        bankAccount: prev.bankAccount - amount
      }));
      setWithdrawAmount(0);
      setEventMessage(`Withdrew $${amount.toLocaleString()} from your bank account.`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2500); // Shortened to 2.5 seconds
    }
  }, [gameState.bankAccount, showGameEnd]);

  const payOffDebt = useCallback((amount: number) => {
    if (showGameEnd) return; // Block debt payment if game has ended
    
    const actualPayment = Math.min(amount, gameState.debt, gameState.money);
    if (actualPayment > 0) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - actualPayment,
        debt: prev.debt - actualPayment,
        loansRepaid: actualPayment === prev.debt ? prev.loansRepaid + 1 : prev.loansRepaid
      }));
      setDebtPayAmount(0);
      
      // Paying off debt reduces heat (looking more legitimate)
      if (actualPayment >= 1000) {
        decreaseHeat(1, `Paid off large debt amount ($${actualPayment})`);
      }
      
      if (actualPayment === gameState.debt) {
        setEventMessage(`💰 DEBT FREE! 💰\nPaid off all $${actualPayment.toLocaleString()} debt!\n🧊 Reduced heat by looking legitimate!`);
      } else {
        setEventMessage(`Paid $${actualPayment.toLocaleString()} towards debt.${actualPayment >= 1000 ? '\n🧊 Large payment reduces heat!' : ''}`);
      }
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000); // Shortened to 3 seconds
    }
  }, [gameState.money, gameState.debt, showGameEnd, decreaseHeat]);



  // Loan system
  const takeLoan = useCallback((increments: number) => {
    if (showGameEnd) return; // Block loans if game has ended
    
    const loanTotal = increments * 1000;
    const maxLoanLimit = 5000;
    
    // Check if loan would exceed the $5,000 limit
    if (gameState.debt + loanTotal > maxLoanLimit) {
      const remainingLimit = maxLoanLimit - gameState.debt;
      if (remainingLimit <= 0) {
        setEventMessage(`❌ Loan limit reached!\nMaximum debt allowed: $5,000\nCurrent debt: $${gameState.debt.toLocaleString()}`);
      } else {
        setEventMessage(`❌ Loan too large!\nMaximum remaining loan: $${remainingLimit.toLocaleString()}\nCurrent debt: $${gameState.debt.toLocaleString()}`);
      }
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000); // Shortened to 3 seconds for error messages
      return;
    }
    
    setGameState(prev => {
      const newDebt = prev.debt + loanTotal;
      return {
        ...prev,
        money: prev.money + loanTotal,
        debt: newDebt,
        maxConcurrentDebt: Math.max(prev.maxConcurrentDebt, newDebt)
      };
    });
    
    // Physics effects for loan
    if (physicsEnabled) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 3;
      createBouncyMoney(centerX, centerY, loanTotal);
      shakeScreen(Math.min(loanTotal / 15000, 2));
    }
    
    setLoanAmount(1);
    setEventMessage(`💳 Borrowed $${loanTotal.toLocaleString()}!\nRemember: 10% interest per day!\nRemaining loan limit: $${(maxLoanLimit - gameState.debt - loanTotal).toLocaleString()}`);
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 3500); // Shortened to 3.5 seconds
  }, [physicsEnabled, showGameEnd, gameState.debt]);

  // Leaderboard functions
  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }, []);

  const loadLifetimeLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard/lifetime');
      if (response.ok) {
        const data = await response.json();
        setLifetimeLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to load lifetime leaderboard:', error);
    }
  }, []);



  // Generate action log summary for high score submission
  const generateActionLogSummary = useCallback(() => {
    const summary = {
      trades: actionLog.filter(a => a.type === 'buy' || a.type === 'sell').length,
      travels: actionLog.filter(a => a.type === 'travel').length,
      events: actionLog.filter(a => a.type === 'event').length,
      missions: actionLog.filter(a => a.type === 'mission').length,
      achievements: actionLog.filter(a => a.type === 'achievement').length,
      totalActions: actionLog.length,
      profitableTrades: actionLog.filter(a => a.details?.profit > 0).length,
      totalProfit: actionLog
        .filter(a => a.details?.profit)
        .reduce((sum, a) => sum + (a.details.profit || 0), 0)
    };

    return {
      text: `📊 45-DAY GAMEPLAY SUMMARY
🏪 Trades: ${summary.trades} | ✈️ Travels: ${summary.travels} | ⚡ Events: ${summary.events}
🎯 Missions: ${summary.missions} | 🏆 Achievements: ${summary.achievements}
💰 Net Profit: $${summary.totalProfit.toLocaleString()} | 📈 Total Actions: ${summary.totalActions}
🎯 Success Rate: ${summary.profitableTrades}/${summary.trades} profitable trades`,
      data: summary
    };
  }, [actionLog]);

  const submitScore = useCallback(async () => {
    if (!playerName.trim()) return;
    
    // Production mode requires wallet connection
    if (!connectedWallet) {
      alert('Connect your wallet to submit scores and earn BUDZ tokens!\n\nClick hamburger menu → Web3 to connect.');
      return;
    }
    
    const finalScore = gameState.money + gameState.bankAccount - gameState.debt;
    const actionSummary = generateActionLogSummary();
    
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          score: finalScore,
          day: gameState.day,
          walletAddress: connectedWallet,
          serverWallet: serverWallet,
          // Include action log summary as part of the high score
          actionLogSummary: actionSummary.text,
          gameplayStats: actionSummary.data,
          gameRoundId: currentGameRoundId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Log the high score submission with action summary
        logPlayerAction('high_score', `High score submitted: $${finalScore.toLocaleString()}`, {
          finalScore,
          gameRoundId: currentGameRoundId,
          actionLogSummary: actionSummary.text,
          gameplayStats: actionSummary.data
        });
        
        // Get current leaderboard position after submission
        await loadLeaderboard();
        
        // Find player's position on leaderboard
        const currentLeaderboard = await fetch('/api/leaderboard').then(r => r.json());
        const playerPosition = currentLeaderboard.findIndex((entry: any) => 
          entry.walletAddress === connectedWallet
        ) + 1;
        
        setLeaderboardPosition(playerPosition);
        setFinalRewards(prev => ({...prev, position: playerPosition}));
        
        console.log(`🏆 Final 45-day completion! Position: ${playerPosition}, Total BUDZ: ${finalRewards.achievements + finalRewards.completion}`);
        console.log(`📊 Action Log Summary:`, actionSummary.text);

        setShowGameEnd(false);
        setShowAchievementRewards(true); // Show achievement rewards modal instead of leaderboard
        loadLifetimeLeaderboard();
        
        // Track completion
        trackPlayerProgress('completed', 'Successfully completed 45-day cycle');
        
        // Update wallet balances after successful submission
        updateWalletBalances();
      } else {
        const errorData = await response.json();
        alert(`Failed to submit score: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      alert('Network error. Please try again.');
    }
  }, [playerName, gameState, loadLeaderboard, loadLifetimeLeaderboard, connectedWallet, serverWallet, updateWalletBalances, generateActionLogSummary, logPlayerAction, currentGameRoundId, finalRewards]);

  // Load leaderboard on component mount
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Skill functions
  const upgradeSkill = useCallback((skillId: string) => {
    const skill = skillTree[skillId];
    if (!skill) return;

    const currentLevel = gameState.skills[skillId] || 0;
    const upgradeCost = skill.cost * Math.pow(2, currentLevel);

    // Check prerequisites
    const hasPrereqs = skill.prerequisites.every(prereq => 
      (gameState.skills[prereq] || 0) > 0
    );

    if (currentLevel >= skill.maxLevel) {
      setEventMessage("Skill is already maxed out!");
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }

    if (!hasPrereqs) {
      setEventMessage("You need to unlock prerequisite skills first!");
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }

    if (gameState.money < upgradeCost) {
      setEventMessage(`Not enough money! Need $${upgradeCost.toLocaleString()}`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 2000);
      return;
    }

    // Apply skill upgrade
    setGameState(prev => ({
      ...prev,
      money: prev.money - upgradeCost,
      skills: {
        ...prev.skills,
        [skillId]: currentLevel + 1
      },
      // Apply coat space skills immediately
      coatSpace: ['inventory', 'megacoat', 'cargocoat'].includes(skillId) 
        ? prev.coatSpace + (skillId === 'inventory' ? 20 : skillId === 'megacoat' ? 50 : 100)
        : prev.coatSpace
    }));

    setEventMessage(`📈 ${skill.name} upgraded to level ${currentLevel + 1}!`);
    setShowEvent(true);
    setTimeout(() => setShowEvent(false), 3000);
  }, [gameState.money, gameState.skills, skillTree]);

  const canUpgradeSkill = useCallback((skillId: string) => {
    const skill = skillTree[skillId];
    if (!skill) return false;

    const currentLevel = gameState.skills[skillId] || 0;
    const upgradeCost = skill.cost * Math.pow(2, currentLevel);

    const hasPrereqs = skill.prerequisites.every(prereq => 
      (gameState.skills[prereq] || 0) > 0
    );

    return currentLevel < skill.maxLevel && 
           gameState.money >= upgradeCost && 
           hasPrereqs;
  }, [gameState.money, gameState.skills, skillTree]);

  // Handle mission completion from The Plug assistant - Server-side validation prevents exploits
  const handleMissionComplete = useCallback(async (missionId: string, reward: number, missionTitle?: string) => {
    if (!connectedWallet) {
      console.error('❌ Mission completion failed: No wallet connected');
      return;
    }

    try {
      console.log(`🎯 Attempting to complete mission: ${missionId} for +$${reward}`);
      
      const completionData = {
        walletAddress: connectedWallet,
        gameRoundId: currentGameRoundId,
        missionId,
        missionTitle: missionTitle || `Mission ${missionId}`,
        reward,
        gameDay: gameState.day,
        city: gameState.currentCity
      };

      const response = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Server confirmed mission completion - apply reward
        setGameState(prev => ({
          ...prev,
          money: prev.money + reward,
          completedMissions: [...(prev.completedMissions || []), missionId]
        }));
        
        setEventMessage(`🎯 Mission Complete! +$${reward} from The Plug`);
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
        
        // Create bouncy money effect for mission reward
        if (physicsEnabled) {
          createBouncyMoney(reward);
        }
        
        console.log(`✅ Mission ${missionId} completed successfully by server validation`);
        console.log('✨ Mission completed - triggering excellent AI influence');
      } else if (result.alreadyCompleted) {
        // Mission already completed - block duplicate reward
        console.log(`🚫 Mission ${missionId} already completed, blocked duplicate reward`);
        setEventMessage(`⚠️ Mission Already Completed!`);
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
      } else {
        console.error('❌ Mission completion failed:', result.error);
        setEventMessage(`❌ Mission failed to complete`);
        setShowEvent(true);
        setTimeout(() => setShowEvent(false), 3000);
      }
    } catch (error) {
      console.error('❌ Mission completion error:', error);
      setEventMessage(`❌ Connection error during mission`);
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 3000);
    }
  }, [connectedWallet, currentGameRoundId, gameState.day, gameState.currentCity, physicsEnabled]);

  // Real-time clock system with 6-minute game days
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // 6-minute game days: advance game time every minute in real time
      if (!isPaused && gameStarted) {
        setGameState(prev => {
          const newTimeLeftInDay = Math.max(0, prev.timeLeftInDay - 60); // Reduce by 1 minute each real minute
          const shouldAdvanceDay = newTimeLeftInDay === 0;
          
          if (shouldAdvanceDay) {
            console.log(`🌅 New day ${prev.day + 1} starting after 6 minutes real time`);
          }
          
          return {
            ...prev,
            timeLeftInDay: shouldAdvanceDay ? 360 : newTimeLeftInDay, // 6 minutes = 360 seconds
            day: shouldAdvanceDay ? prev.day + 1 : prev.day,
            lastRealTimeUpdate: now.getTime()
          };
        });
      }
    };

    // Update clock every minute for game progression
    const clockInterval = setInterval(updateClock, 60000); // Every minute
    
    // Initial update
    updateClock();

    return () => clearInterval(clockInterval);
  }, [isPaused, gameStarted]);

  // Day timer countdown
  // Auto-pause system - Monitor user activity and browser events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab/window is hidden - pause the game
        setIsPaused(true);
        setPausedAt(Date.now());
        console.log('⏸️ Game paused - tab/window hidden');
      } else {
        // Tab/window is visible again - resume the game
        if (isPaused) {
          setIsPaused(false);
          setPausedAt(null);
          setLastActiveTime(Date.now());
          console.log('▶️ Game resumed - tab/window visible');
        }
      }
    };

    const handleBeforeUnload = () => {
      // Player is closing/refreshing - save and pause
      if (connectedWallet && gameState.day > 0) {
        saveGameStateDaily(gameState, drugs);
        console.log('💾 Emergency save before page unload');
      }
    };

    const handleUserActivity = () => {
      setLastActiveTime(Date.now());
      
      // Clear any pending auto-pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      
      // Resume if paused due to inactivity
      if (isPaused) {
        setIsPaused(false);
        setPausedAt(null);
        console.log('▶️ Game resumed - user activity detected');
      }
      
      // Set new auto-pause timeout (5 minutes of inactivity)
      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(true);
        setPausedAt(Date.now());
        console.log('⏸️ Game auto-paused - 5 minutes of inactivity');
      }, 300000); // 5 minutes
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    // Initial activity setup
    handleUserActivity();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [isPaused, connectedWallet, gameState.day, saveGameStateDaily]);

  useEffect(() => {
    if (showGameEnd || isPaused || !gameStarted) return; // Stop timer if game has ended, is paused, or not started
    
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeftInDay <= 1) {
          // Day is over, advance to next day
          const newDay = prev.day + 1;
          
          // Check if game should end at day 45
          if (newDay > 45) {
            setTimeout(() => {
              // Calculate achievements and trigger end-game video
              calculateFinalAchievements();
              setShowEndGameVideo(true);
            }, 100);
            return { ...prev, timeLeftInDay: 0 }; // Stop timer completely
          }
          
          const isNewWeek = newDay - prev.weekStartDay >= 7;
          
          // Pay worker if working
          let newMoney = prev.money;
          if (prev.isWorking) {
            newMoney += 18; // $18 per day
          }
          
          return {
            ...prev,
            day: newDay,
            timeLeftInDay: 600, // Reset to 10 minutes
            money: newMoney,
            debt: Math.round(prev.debt * 1.1), // Interest on debt
            heat: Math.max(0, prev.heat - 0.5), // Heat naturally decreases over time
            // Reset work week if it's a new week
            daysWorkedThisWeek: isNewWeek ? 0 : prev.daysWorkedThisWeek,
            weekStartDay: isNewWeek ? newDay : prev.weekStartDay,
            // Stop working if work days are done
            isWorking: prev.workDaysLeft > 1 ? prev.isWorking : false,
            workDaysLeft: prev.workDaysLeft > 0 ? prev.workDaysLeft - 1 : 0
          };
        } else {
          return {
            ...prev,
            timeLeftInDay: prev.timeLeftInDay - 1
          };
        }
      });
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [showGameEnd, isPaused, gameStarted]);

  // Initialize prices on start
  useEffect(() => {
    generatePrices();
  }, [generatePrices]);

  // Load selected Plug image for travel cutscenes
  useEffect(() => {
    const savedPlug = localStorage.getItem('selectedNFT') || localStorage.getItem('selectedPlugNft') || localStorage.getItem('selectedAssistant');
    if (savedPlug) {
      try {
        const nft = JSON.parse(savedPlug);
        if (nft?.image) {
          setSelectedPlugImage(nft.image);
          console.log('🚗 Loaded Plug image for travel cutscenes');
        }
      } catch (e) {
        console.log('No valid NFT image found for travel cutscenes');
      }
    }
  }, []);

  // Initialize dynamic music system on component mount
  useEffect(() => {
    console.log('🎵 Initializing dynamic music system...');
    initializeMusicTracks().then(() => {
      console.log('🎵 Dynamic music system ready');
      // Start with calm music
      updateMusicBasedOnGameState(gameState);
    });
  }, [initializeMusicTracks]);

  // Track player progress for analytics
  const trackPlayerProgress = useCallback(async (status: 'active' | 'completed' | 'abandoned', quitReason?: string) => {
    if (!connectedWallet || !playerName.trim()) return;

    const currentScore = gameState.money + gameState.bankAccount - gameState.debt;
    const progress = {
      walletAddress: connectedWallet,
      playerName: playerName.trim(),
      currentDay: gameState.day,
      currentScore,
      lastPlayed: new Date(),
      totalPlayTime: 0, // Could be enhanced with actual time tracking
      achievementsUnlocked: 0, // Could be enhanced with achievement count
      tokensEarned: 0, // Could be enhanced with actual token earnings
      completionStatus: status,
      quitReason
    };

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
      console.log(`📊 Tracked progress: Day ${gameState.day}, Status: ${status}`);
    } catch (error) {
      console.error('Failed to track progress:', error);
    }
  }, [connectedWallet, playerName, gameState]);

  // Track progress on game state changes
  useEffect(() => {
    if (connectedWallet && playerName.trim() && gameState.day > 1) {
      trackPlayerProgress('active');
    }
  }, [gameState.day, trackPlayerProgress]);

  // Update music when game state changes
  useEffect(() => {
    updateMusicBasedOnGameState(gameState);
  }, [gameState.heat, gameState.money, gameState.currentCity, gameState.health, gameState.day, updateMusicBasedOnGameState]);

  // Animation state variables (animatingGrowerNFT and showGrowerNFTAnimation are already declared above)

  // Animation trigger functions (all animation functions are already declared above)

  // Regenerate prices when day changes
  useEffect(() => {
    generatePrices();
  }, [gameState.day, generatePrices]);

  const totalSpace = Object.values(drugs || {}).length > 0 ? Object.values(drugs || {}).reduce((sum, drug) => sum + drug.owned, 0) : 0;
  const totalValue = Object.values(drugs || {}).length > 0 ? Object.values(drugs || {}).reduce((sum, drug) => sum + (drug.owned * drug.currentPrice), 0) : 0;

  const getPriceColor = (currentPrice: number, basePrice: number) => {
    if (currentPrice > basePrice * 1.5) return 'text-red-400'; // High price
    if (currentPrice < basePrice * 0.8) return 'text-green-400'; // Low price
    return 'text-white';
  };

  const getPriceIcon = (currentPrice: number, basePrice: number) => {
    if (currentPrice > basePrice * 1.5) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (currentPrice < basePrice * 0.8) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return null;
  };

  // Show preparation interface before game starts
  if (gameState.day === 0 && !showWelcomeScreen && hasPlayedIntro && connectedWallet) {
    return (
      <div 
        className="w-full min-h-screen text-green-400 relative flex flex-col bg-black"
        style={{ fontFamily: 'LemonMilk, sans-serif' }}
        onClick={handleClick}
      >
        {/* Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-20"
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/intro-video.mp4" type="video/mp4" />
        </video>

        {/* Smoke Effect Particles */}
        {smokeEffects.map(effect => (
          <div
            key={effect.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: effect.x - 15,
              top: effect.y - 15,
              animation: 'smokeFloat 2s ease-out forwards'
            }}
          >
            <div className="text-2xl opacity-80">💨</div>
          </div>
        ))}

        {/* Header */}
        <div className="relative z-10 bg-black bg-opacity-90 p-4 text-center border-b border-green-400">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">THC DOPE BUDZ</h1>
          <p className="text-lg text-green-300">Game Setup & Configuration</p>
          <p className="text-sm text-gray-400 mt-2">
            Configure your settings and select your AI assistant before starting your 45-day challenge
          </p>
        </div>

        {/* Main Setup Interface */}
        <div className="relative z-10 flex-1 p-6 bg-black bg-opacity-80 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Wallet Information Card */}
            <div className="bg-gray-900 border border-green-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                <span>💰</span> Wallet Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-green-500 mb-1">Connected Wallet:</p>
                    <p className="text-xs text-white font-mono break-all">
                      {connectedWallet}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-green-500 mb-1">Server Wallet:</p>
                    <p className="text-xs text-white font-mono break-all">
                      {serverWallet || 'Creating...'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-500">BUDZ Balance</p>
                      <p className="text-xs text-gray-400">Game Rewards</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">{budzBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-500">GBUX Balance</p>
                      <p className="text-xs text-gray-400">Tradeable Token</p>
                    </div>
                    <p className="text-lg font-bold text-yellow-400">{gbuxBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant Selection Card */}
            <div className="bg-gray-900 border border-purple-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span>🤖</span> AI Assistant Configuration
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Select a GROWERZ NFT to serve as "The Plug" - your AI assistant throughout the game. 
                  The Plug provides strategic advice, market intelligence, and gameplay bonuses based on your NFT's rarity.
                </p>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
                  style={{ fontFamily: 'LemonMilk, sans-serif' }}
                >
                  🎯 Configure AI Assistant
                </button>
              </div>
            </div>

            {/* Game Settings Card */}
            <div className="bg-gray-900 border border-blue-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <span>⚙️</span> Game Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Visual Effects</p>
                    <p className="text-sm text-gray-400">Enable physics and animation effects</p>
                  </div>
                  <button
                    onClick={() => setPhysicsEnabled(!physicsEnabled)}
                    className={`py-2 px-4 font-bold rounded-lg transition-colors ${
                      physicsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                  >
                    {physicsEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Settings Panel</p>
                    <p className="text-sm text-gray-400">Access profile and game configuration</p>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Game Rules Card */}
            <div className="bg-gray-900 border border-yellow-400 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span>📋</span> 45-Day Challenge Rules
              </h2>
              <div className="space-y-3 text-gray-300">
                <p>• <strong>Objective:</strong> Build the largest cannabis empire in 45 timed days</p>
                <p>• <strong>Starting Capital:</strong> $2,000 cash with $5,500 debt to Street Loanz</p>
                <p>• <strong>Time Limit:</strong> 10 minutes per day (600 seconds)</p>
                <p>• <strong>Achievement System:</strong> Earn up to 1,250 BUDZ tokens per round</p>
                <p>• <strong>Leaderboard:</strong> Top 10 players receive daily BUDZ rewards</p>
                <p>• <strong>AI Assistant:</strong> NFT-gated strategic advisor and market intelligence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Game Button moved to header - keeping this space for visual balance */}
        <div className="relative z-10 bg-black bg-opacity-90 p-6 border-t border-green-400">
          <div className="max-w-md mx-auto text-center">
            <p className="text-gray-400 text-lg">
              🚀 Ready to begin your 45-day challenge?
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Click the START button in the header above to begin!
            </p>
          </div>
        </div>

        {/* The Plug AI Assistant Modal */}
        <ThePlugAssistant 
          connectedWallet={connectedWallet}
          gameState={{
            currentCity: 'hometown',
            day: 1,
            money: 2000
          }}
          onMissionComplete={() => {}}
          smokingBuffs={smokingBuffs}
          onChatInteraction={() => {}}
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onAvatarChange={setSelectedAssistantAvatar}
        />

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-green-400 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-green-400 flex justify-between items-center">
                <h2 className="text-xl font-bold text-green-400">Game Settings</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-auto max-h-[70vh]">
                <div className="space-y-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-green-400 font-bold mb-3">Audio Controls</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Background Music</p>
                          <p className="text-sm text-gray-400">Control background music throughout the game</p>
                        </div>
                        <button
                          onClick={toggleMute}
                          className={`py-2 px-4 font-bold rounded-lg transition-colors ${
                            !isMuted ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                          }`}
                        >
                          {!isMuted ? '🔊 ON' : '🔇 OFF'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Video Audio</p>
                          <p className="text-sm text-gray-400">Control audio for all video content</p>
                        </div>
                        <button
                          onClick={() => setVideoAudioEnabled(!videoAudioEnabled)}
                          className={`py-2 px-4 font-bold rounded-lg transition-colors ${
                            videoAudioEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                          }`}
                        >
                          {videoAudioEnabled ? '🔊 ON' : '🔇 OFF'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Smoking Video Audio</p>
                          <p className="text-sm text-gray-400">Control audio for smoking session videos</p>
                        </div>
                        <button
                          onClick={() => setSmokingAudioEnabled(!smokingAudioEnabled)}
                          className={`py-2 px-4 font-bold rounded-lg transition-colors ${
                            smokingAudioEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                          }`}
                        >
                          {smokingAudioEnabled ? '🔊 ON' : '🔇 OFF'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-green-400 font-bold mb-3">Profile Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Wallet:</strong> {connectedWallet}</p>
                      <p><strong>Server Wallet:</strong> {serverWallet}</p>
                      <p><strong>Connection Type:</strong> {connectedWalletType}</p>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-green-400 font-bold mb-3">Token Balances</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>BUDZ:</strong> {budzBalance.toLocaleString()}</p>
                      <p><strong>GBUX:</strong> {gbuxBalance.toLocaleString()}</p>
                      <p><strong>THC LABZ:</strong> {(thcLabzBalance || 0).toLocaleString()}</p>
                      <p><strong>SOL:</strong> {solBalance.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Production Welcome Screen - Requires wallet connection
  if (showWelcomeScreen) {
    return (
      <div 
        className="w-full min-h-screen text-green-400 relative flex flex-col" 
        style={{ 
          fontFamily: 'LemonMilk, sans-serif'
        }}
        onClick={handleClick}
      >
        {/* Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/intro-video.mp4" type="video/mp4" />
          {/* Fallback background image if video fails */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ 
              backgroundImage: `url(/attached_assets/THCDopeBuds_1752203150964.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </video>
        
        <div className="bg-black bg-opacity-80 p-8 rounded-lg text-center w-full max-w-md mx-auto relative z-10">
          <h1 className="text-3xl font-bold text-purple-400 mb-4" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
            THC Labz Dope Budz
          </h1>
          <h2 className="text-xl text-green-400 mb-6">
            Real Web3 Cannabis Trading
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg text-left">
              <h3 className="text-purple-300 font-bold mb-2">🌐 Web3 Features</h3>
              <p className="text-sm text-gray-300 mb-2">
                Connect your Solana wallet to play and earn real BUDZ tokens
              </p>
              <div className="space-y-1">
                <p className="text-xs text-green-400">✓ Daily BUDZ token rewards (100-1000 tokens)</p>
                <p className="text-xs text-green-400">✓ Top 10 leaderboard pays at midnight CST</p>
                <p className="text-xs text-green-400">✓ Lifetime leaderboard for records</p>
                <p className="text-xs text-green-400">✓ Server-side wallet security</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {detectedWallets.length > 0 ? (
              detectedWallets.map((wallet) => (
                <button
                  key={wallet}
                  onClick={async () => {
                    console.log(`Connect ${wallet} button clicked!`);
                    await connectWallet(wallet);
                  }}
                  className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-base rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'ThumbsDown, sans-serif' }}
                >
                  <span>🔗</span>
                  <span>Connect {wallet} Wallet</span>
                </button>
              ))
            ) : (
              <button
                onClick={() => {
                  alert('No Solana wallets detected!\n\nSupported wallets:\n• Phantom (phantom.app)\n• Magic Eden (magiceden.io)\n• Solflare (solflare.com)\n• Backpack (backpack.app)\n\nInstall any of these and refresh to continue.');
                }}
                className="w-full py-4 px-6 bg-gray-600 text-white font-bold text-lg rounded-lg"
                style={{ fontFamily: 'ThumbsDown, sans-serif' }}
              >
                ⚠️ Install Solana Wallet
              </button>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400">
              Requires Solana wallet for score submission and token rewards
            </p>
            
            {detectedWallets.length > 0 ? (
              <p className="text-xs text-green-400">
                ✅ {detectedWallets.length} wallet{detectedWallets.length > 1 ? 's' : ''} detected: {detectedWallets.join(', ')}
              </p>
            ) : (
              <p className="text-xs text-red-400">
                ⚠️ No Solana wallets detected - Install any supported wallet above
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen text-green-400 font-mono relative overflow-y-auto"
      style={{
        backgroundImage: `url(/attached_assets/THC_banner_1752098551109.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000000'
      }}
      onClick={handleClick}
    >
      {/* Smoke Effects Overlay */}
      {smokeEffects.map((smoke) => (
        <div
          key={smoke.id}
          className="smoke-effect"
          style={{
            left: smoke.x - 25,
            top: smoke.y - 25,
          }}
        >
          💨
        </div>
      ))}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: 0.6 }}
      ></div>
      {/* Environmental System - Day/Night Cycle with Weather */}
      <div className="fixed top-0 left-0 w-full pointer-events-none" style={{ zIndex: -1 }}>
        <EnvironmentalSystem 
          gameState={gameState} 
          isGameStarted={gameStarted} 
        />
      </div>


      <div className="relative z-10">
{/* Removed duplicate weather banner - moved to under header */}
        
        {/* Game End Overlay - Completely blocks all interactions */}
      {showGameEnd && (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-40 pointer-events-auto">
          <div className="absolute inset-0 cursor-not-allowed" />
        </div>
      )}
      
      {/* Physics Renderer */}
      <PhysicsRenderer enabled={physicsEnabled && !showGameEnd} />
      
{/* Removed duplicate weather banner - moved to under header */}
      
      {/* Header with Professional Banner and Navigation Tabs - Mobile Optimized */}
      <div className="relative z-20">
        {/* Professional Header Banner Section */}
        <div className="relative border-b border-green-400">
          {/* Professional Header Banner as Background */}
          <div className="absolute inset-0 pointer-events-none">
            <ProfessionalHeaderBanner 
              gameDay={gameState.day}
              currentCity={gameState.currentCity}
              heatLevel={gameState.heat}
            />
          </div>
          {/* Header Content */}
          <div className="bg-black bg-opacity-60 p-3 md:p-4 relative z-10">
            <div className="flex justify-between items-center gap-3 md:gap-4">
              {/* Left: Logo + DOPE BUDZ title */}
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="THC LABZ" 
                  className="h-8 md:h-10 object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 0 6px rgba(0, 255, 0, 0.4))'
                  }}
                />
                <button 
                  onClick={() => setShowDopeBudzModal(true)}
                  className="text-xl md:text-2xl font-bold text-green-400 hover:text-green-300 transition-colors cursor-pointer border-2 border-yellow-400 px-3 py-1 rounded-lg" 
                  style={{ 
                    fontFamily: 'ThumbsDown, sans-serif',
                    textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 0 0 8px rgba(255, 215, 0, 0.6)',
                    borderColor: '#FFD700',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)'
                  }}
                  title="Open Dope Budz Platform"
                >
                  DOPE BUDZ
                </button>
              </div>
              
              {/* Center: Start Button (only show in preparation mode) */}
              {gameMode === 'preparation' && (
                <div className="flex-1 flex justify-center">
                  <button
                    onClick={startGameRound}
                    className="py-2 px-6 bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-black font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-400/50"
                    style={{ fontFamily: 'LemonMilk, sans-serif' }}
                  >
                    🚀 START 45-DAY CHALLENGE
                  </button>
                </div>
              )}
              
              {/* Right: Game stats and menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-sm md:text-base">
                  <span className="text-yellow-400 font-bold" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>${gameState.money.toLocaleString()}</span>
                  {gameState.debt > 0 && (
                    <span className="text-red-400 font-bold" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>Debt: ${gameState.debt.toLocaleString()}</span>
                  )}
                  
                  {/* Day counter with black outline */}
                  <span className="text-black font-bold" style={{ textShadow: '1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white' }}>Day {gameState.day}</span>
                  
                  {/* Heat Level Display with Stars */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-red-400 font-bold text-lg" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>
                      Heat
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-2xl ${star <= gameState.heat ? 'text-red-500' : 'text-gray-600'}`}
                          style={{ 
                            textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                            filter: star <= gameState.heat ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.8))' : 'none'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
                
                {/* Hamburger Menu Button - Relative Container */}
                <div className="relative">
                  <button
                    onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                    className="p-2 rounded bg-green-600 hover:bg-green-700 active:bg-green-800 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center text-black"
                    title="Menu"
                  >
                    {showHamburgerMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showHamburgerMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-black bg-opacity-95 border border-green-400 rounded-lg shadow-lg p-2 z-[9999] min-w-[160px]">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            setShowGameInfoPopup(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-purple-600 hover:bg-purple-700 active:bg-purple-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🎮 Game Info
                        </button>

                        <button
                          onClick={() => {
                            setShowNFTMarketplace(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🌿 GROWERZ Info
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowGrowerzModal(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-green-600 hover:bg-green-700 active:bg-green-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🌱 THE GROWERZ HUB
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowWalletModal(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-purple-600 hover:bg-purple-700 active:bg-purple-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🌐 Web3
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowStreetzModal(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 active:bg-orange-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🏙️ Streetz
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowLifetimeLeaderboard(true);
                            loadLifetimeLeaderboard();
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🏆 Leaderboard
                        </button>

                        <button
                          onClick={() => {
                            setShowAchievements(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🏅 Achievements
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAboutModal(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          📖 About & How to Play
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowActionLog(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-slate-600 hover:bg-slate-700 active:bg-slate-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          📝 Action Log
                        </button>

                        <button
                          onClick={() => {
                            restartGame();
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 active:bg-orange-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          🔄 Restart Game
                        </button>

                        <button
                          onClick={() => {
                            setShowSettingsModal(true);
                            setShowHamburgerMenu(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-gray-600 hover:bg-gray-700 active:bg-gray-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          ⚙️ Settings
                        </button>
                        
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setShowAdminPanel(true);
                              setShowHamburgerMenu(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-red-600 hover:bg-red-700 active:bg-red-800 touch-manipulation min-h-[40px] text-black w-full text-left"
                            style={{ fontFamily: 'LemonMilk, sans-serif' }}
                          >
                            🔧 Admin
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Positioned directly under header banner */}
        <div className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm shadow-lg">
          {/* Mobile Dropdown Navigation (< sm screens) */}
          <div className="sm:hidden">
            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-full flex items-center justify-between px-4 py-3 text-white bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {currentView === 'market' && '🏪'}
                    {currentView === 'travel' && '🚗'}
                    {currentView === 'work' && '💼'}
                    {currentView === 'bank' && '🏦'}
                    {currentView === 'command' && '🎮'}
                    {currentView === 'status' && '📊'}
                  </span>
                  <span className="font-bold">
                    {currentView === 'market' && 'Market'}
                    {currentView === 'travel' && 'Travel'}
                    {currentView === 'work' && 'Work'}
                    {currentView === 'bank' && 'Bank'}
                    {currentView === 'command' && 'Command'}
                    {currentView === 'status' && 'Status'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMobileMenu && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-600 z-[9999] shadow-xl">
                  {[
                    { id: 'market', label: '🏪 Market', color: 'text-purple-400' },
                    { id: 'travel', label: '🚗 Travel', color: 'text-green-400' },
                    { id: 'work', label: '💼 Work', color: 'text-orange-400' },
                    { id: 'bank', label: '🏦 Bank', color: 'text-blue-400' },
                    { id: 'command', label: '🎮 Command', color: 'text-cyan-400' },
                    { id: 'status', label: '📊 Status', color: 'text-yellow-400' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCurrentView(tab.id as any);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left font-bold transition-colors border-b border-gray-700 last:border-b-0 ${
                        currentView === tab.id
                          ? `${tab.color} bg-gray-700`
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Tab Navigation (sm+ screens) */}
          <div className="hidden sm:flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'market', label: '🏪 Market', color: 'text-purple-400' },
              { id: 'travel', label: '🚗 Travel', color: 'text-green-400' },
              { id: 'work', label: '💼 Work', color: 'text-orange-400' },
              { id: 'bank', label: '🏦 Bank', color: 'text-blue-400' },
              { id: 'command', label: '🎮 Command', color: 'text-cyan-400' },
              { id: 'status', label: '📊 Status', color: 'text-yellow-400' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`flex-none px-3 py-2 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  currentView === tab.id
                    ? `${tab.color} border-current bg-gray-800`
                    : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>



        




        {/* START GAME Button - Prominent Central Location */}
        {gameState.day === 1 && !gameStarted && (
          <div className="flex justify-center mb-4">
            <button
              onClick={startGameRound}
              className="mobile-touch-target px-6 py-4 md:px-8 md:py-3 text-base md:text-lg bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-black font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-400/30 border-2 border-green-300"
              style={{ fontFamily: 'ThumbsDown, sans-serif' }}
              title="Begin your 45-day cannabis trading challenge"
            >
              🚀 START GAME
            </button>
          </div>
        )}

        {/* Status Information Row */}
        <div className="flex flex-wrap justify-between items-center text-sm md:text-base mt-2 gap-3 md:gap-4 px-2">
          <div className="flex items-center gap-2">
            {/* Terry Market Predictions Button */}
            <button
              onClick={() => {
                // Trigger Terry's market prediction cutscene
                const terryPrediction = {
                  id: 'terry_manual_prediction',
                  type: 'terry_prediction' as const,
                  character: 'Terry',
                  title: '🐕 Terry Time Perk!',
                  message: "Woof! Your networking skills caught my attention. Let me share some market predictions I've sniffed out...",
                  image: '/attached_assets/1985ce84fdc5c_1753905458779.png',
                  actions: [
                    { 
                      id: 'view_predictions', 
                      label: '📊 View Market Predictions', 
                      style: 'primary' as const 
                    }
                  ],
                  data: {
                    predictions: [
                      { product: 'Weed', change: '+15%', confidence: 'High', reason: 'Weekend demand spike expected' },
                      { product: 'Coke', change: '-8%', confidence: 'Medium', reason: 'Supply increase in major cities' },
                      { product: 'Meth', change: '+22%', confidence: 'High', reason: 'Distribution disruptions reported' },
                      { product: 'Heroin', change: '+5%', confidence: 'Low', reason: 'Seasonal demand variations' }
                    ],
                    networkingLevel: gameState.networkingLevel || 1
                  }
                };
                queueCutscene(terryPrediction);
              }}
              className="mobile-touch-target w-8 h-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center bg-gradient-to-br from-orange-600 to-yellow-600 hover:ring-2 hover:ring-orange-400 hover:ring-opacity-50"
              title="🐕 Terry's Market Predictions - Get market insights from Terry the prediction dog!"
            >
              <BarChart3 className="w-4 h-4 text-white" />
            </button>
            {/* Interactive City Tools Button */}
            <button
              onClick={() => setShowPlayerPanel(true)}
              className="mobile-touch-target flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-green-400"
              style={{ fontFamily: 'LemonMilk, sans-serif' }}
              title="Access city tools, player info, and advanced interactions"
            >
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[120px] md:max-w-none font-medium">
                {cities[gameState.currentCity as keyof typeof cities]}
              </span>
              <Target className="w-3 h-3 opacity-75" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="font-mono text-yellow-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span className="text-white font-semibold" style={{ fontFamily: 'LemonMilk, sans-serif' }}>Day {gameState.day}</span>
          <div className="flex items-center gap-2">
            {/* The Plug AI Assistant Button - Enhanced with Glow & Notifications */}
            <button
              data-tab="assistant"
              onClick={() => {
                setShowAIAssistant(!showAIAssistant);
                // Clear notification count when opening AI
                if (!showAIAssistant) {
                  setAiNotificationCount(0);
                }
                
                // If opening AI Assistant and user has selected NFT, navigate to Chat tab to show Plug info
                if (!showAIAssistant && selectedAssistantAvatar) {
                  // Small delay to ensure modal opens first
                  setTimeout(() => {
                    const chatTab = document.querySelector('[data-nft-tab="chat"]');
                    if (chatTab) {
                      (chatTab as HTMLElement).click();
                    }
                  }, 100);
                }
              }}
              className={`mobile-touch-target w-10 h-10 md:w-8 md:h-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative overflow-hidden ${
                aiNotificationCount > 0 
                  ? 'bg-gradient-to-br from-purple-600 to-green-600 animate-pulse ring-2 ring-purple-400 ring-opacity-75' 
                  : 'bg-gradient-to-br from-purple-600 to-green-600 hover:ring-2 hover:ring-green-400 hover:ring-opacity-50'
              }`}
              title={`The Plug AI Assistant${aiNotificationCount > 0 ? ` (${aiNotificationCount} new)` : ''}`}
            >
              {selectedAssistantAvatar ? (
                <img 
                  src={selectedAssistantAvatar} 
                  alt="The Plug AI"
                  className={`w-8 h-8 rounded-full object-cover transition-all duration-300 ${
                    aiNotificationCount > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                />
              ) : (
                <img 
                  src="/attached_assets/thclogo.png" 
                  alt="The Plug AI"
                  className={`w-6 h-6 object-cover transition-all duration-300 ${
                    aiNotificationCount > 0 ? 'drop-shadow-lg' : ''
                  }`}
                />
              )}
              
              {/* Notification Badge */}
              {aiNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-lg border border-white">
                  {aiNotificationCount > 9 ? '9+' : aiNotificationCount}
                </span>
              )}
              
              {/* Glow Effect */}
              {aiNotificationCount > 0 && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-green-400 opacity-30 animate-ping"></div>
              )}
            </button>

            {/* Trophy Leaderboard Button - Next to Plug bubble */}
            <button
              onClick={() => {
                setShowLifetimeLeaderboard(true);
                loadLifetimeLeaderboard();
              }}
              className="mobile-touch-target w-10 h-10 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:ring-2 hover:ring-yellow-400 hover:ring-opacity-50"
              title="View Leaderboard"
            >
              <span className="text-lg">🏆</span>
            </button>
            
            <span className={`font-semibold ${gameState.health > 75 ? 'text-green-400' : gameState.health > 50 ? 'text-yellow-400' : 'text-red-400'}`} style={{ fontFamily: 'LemonMilk, sans-serif' }}>
              HP {gameState.health}%
            </span>
          </div>
        </div>
        
        {/* Compact Control Row: Heat, Next Day, AI System */}
        <div className="flex items-center justify-between mt-3 px-4 md:px-6 gap-3 md:gap-4">
          {/* Heat Level Display */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>Heat:</span>
            <div className="flex gap-1">
              {gameState.day <= 5 ? (
                <span className="text-gray-400 text-sm">Unknown</span>
              ) : (
                [1, 2, 3, 4, 5].map(star => {
                  // Each star represents 2 heat levels (star 1 = heat 1-2, star 2 = heat 3-4, etc.)
                  const heatForThisStar = (star - 1) * 2; // 0, 2, 4, 6, 8
                  const isFilled = gameState.heat > heatForThisStar; // Filled when heat > base level
                  const hasRedBorder = gameState.heat === heatForThisStar + 1; // Red border for odd numbers
                  const isDangerous = gameState.heat >= 6;
                  
                  return (
                    <span 
                      key={star}
                      className={`text-sm transition-all duration-300 relative ${
                        isFilled 
                          ? gameState.heat <= 4 
                            ? 'text-yellow-400' 
                            : gameState.heat <= 6 
                            ? 'text-orange-400' 
                            : isDangerous && gameState.heat >= 8
                            ? 'text-red-500 animate-pulse' 
                            : 'text-red-500'
                          : 'text-gray-600'
                      }`}
                      style={{ 
                        textShadow: (isFilled && isDangerous) || hasRedBorder ? '0 0 8px currentColor' : 'none',
                        filter: isFilled && gameState.heat === 10 ? 'drop-shadow(0 0 6px currentColor)' : 'none',
                        WebkitTextStroke: hasRedBorder ? '1px red' : 'none',
                        textStroke: hasRedBorder ? '1px red' : 'none'
                      }}
                      title={`Heat Level: ${gameState.heat}/10 ${
                        gameState.heat === 0 ? '(Clean)' :
                        gameState.heat <= 2 ? '(Low attention)' :
                        gameState.heat <= 4 ? '(Being watched)' :
                        gameState.heat <= 6 ? '(Police interest)' :
                        gameState.heat <= 8 ? '(DANGER! High priority target!)' :
                        '(MAXIMUM HEAT! Run now!)'
                      }`}
                    >
                      {isFilled ? '★' : hasRedBorder ? '☆' : '☆'}
                    </span>
                  );
                })
              )}
            </div>
            <span className="text-xs ml-1" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
              {gameState.day <= 5 ? (
                null // Remove duplicate unknown status text
              ) : (
                <>
                  {gameState.heat === 0 && <span className="text-green-400">Clean</span>}
                  {gameState.heat >= 1 && gameState.heat <= 2 && <span className="text-yellow-300">Noticed</span>}
                  {gameState.heat >= 3 && gameState.heat <= 4 && <span className="text-yellow-400">Watched</span>}
                  {gameState.heat >= 5 && gameState.heat <= 6 && <span className="text-orange-300">Tracked</span>}
                  {gameState.heat >= 7 && gameState.heat <= 8 && <span className="text-orange-400 animate-pulse">WANTED</span>}
                  {gameState.heat >= 9 && gameState.heat <= 10 && <span className="text-red-500 animate-pulse font-bold">MAX HEAT!</span>}
                </>
              )}
            </span>
          </div>




        </div>

        {/* DOPE_BUDZ_AI System Validator (Hidden) */}
        <div className="hidden">
          <AISystemValidator
            gameState={{
              currentCity: gameState.currentCity,
              day: gameState.day,
              money: gameState.money,
              heat: gameState.heat,
              reputation: gameState.reputation,
              health: gameState.health,
              timeLeftInDay: gameState.timeLeftInDay,
              dealsCompleted: gameState.dealsCompleted || 0,
              totalTransactions: gameState.totalTransactions || 0,
              timesArrested: gameState.timesArrested || 0,
              timesRobbed: gameState.timesRobbed || 0,
              inventory: Array.isArray(drugs) ? drugs.reduce((acc, drug) => ({ ...acc, [drug.name]: drug.owned }), {}) : {},
              recentSales: gameState.recentSales || []
            }}
            connectedWallet={connectedWallet}
            onValidationComplete={(results) => {
              console.log('🧠 DOPE_BUDZ_AI Validation Results:', results);
              // Store validation results globally for other components
              (window as any).dopeBudzAIResults = results;
            }}
          />
        </div>
        {gameState.isWorking && (
          <div className="text-center text-yellow-400 text-xs mt-1">
            🍟 Working at McShitz - {gameState.workDaysLeft} days left
          </div>
        )}
      </div>

      {/* Event popup - Enhanced with Smooth Animations */}
      {showEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-900 border border-green-400 p-4 md:p-6 max-w-sm w-full text-center rounded-lg shadow-2xl transform animate-bounce-in scale-105 hover:scale-110 transition-all duration-500 relative">
            <button
              onClick={() => setShowEvent(false)}
              className="absolute top-2 right-2 text-green-400 hover:text-green-300 text-xl font-bold leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-green-400 hover:text-black transition-all duration-200"
              title="Close announcement"
            >
              ×
            </button>
            <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 mx-auto mb-3 animate-pulse" />
            <p className="text-green-400 text-sm md:text-base leading-relaxed whitespace-pre-line animate-slide-up pr-6">{eventMessage}</p>
            <div className="mt-4 bg-green-400 h-1 rounded-full animate-progress-bar"></div>
          </div>
        </div>
      )}

      {/* Game Start Info Popup */}
      {showGameInfoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-green-400 p-6 max-w-lg w-full text-center rounded-lg shadow-2xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                🎮 Welcome to THC Dope Budz!
              </h2>
              <p className="text-green-300 text-lg mb-4">Your Ultimate Cannabis Trading Adventure</p>
            </div>
            
            <div className="text-left space-y-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                <h3 className="text-green-400 font-bold mb-2">💰 Starting Challenge</h3>
                <p className="text-green-300 text-sm">
                  You begin with only $20 and 5 coat spaces. Use your wits and trading skills to build your empire from the ground up!
                </p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
                <h3 className="text-purple-400 font-bold mb-2">📺 Scaling Work Rewards</h3>
                <p className="text-purple-300 text-sm">
                  Watch ads to earn money! First ad pays $500, then each consecutive ad earns $100 more. Max 2 ads per day.
                </p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500">
                <h3 className="text-yellow-400 font-bold mb-2">🏆 70 Achievements</h3>
                <p className="text-yellow-300 text-sm">
                  Complete achievements to earn real BUDZ tokens paid to your wallet. Up to 1,250+ BUDZ per playthrough!
                </p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
                <h3 className="text-blue-400 font-bold mb-2">🤖 AI Assistant</h3>
                <p className="text-blue-300 text-sm">
                  Connect your GROWERZ NFT to unlock The Plug AI assistant for trading advice and market intelligence.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowGameInfoPopup(false)}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                🚀 Start Playing!
              </button>
              <p className="text-gray-400 text-xs">
                Good luck building your cannabis empire! 🌿
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Streets Modal - Coming Soon */}
      {showStreetzModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-green-400 p-6 max-w-md w-full text-center rounded-lg">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-green-400 mb-2" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                🏙️ The Streetz
              </h2>
              <p className="text-green-300 text-lg mb-4">Coming Soon!</p>
              <p className="text-green-500 text-sm mb-6">
                Join our Discord community to stay updated on the latest features and connect with other players.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => window.open('https://discord.gg/Eu4w7MfAKh', '_blank')}
                className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                🎮 Join Discord
              </button>
              <button
                onClick={() => setShowStreetzModal(false)}
                className="w-full py-3 px-6 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dope Budz Platform Modal */}
      {showDopeBudzModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-400 w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-green-400">
              <h2 className="text-xl font-bold text-green-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                🌿 Dope Budz Platform
              </h2>
              <button
                onClick={() => setShowDopeBudzModal(false)}
                className="text-red-400 hover:text-red-300 text-2xl font-bold"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                ref={(iframe) => {
                  if (iframe) {
                    iframe.onload = () => {
                      // Send wallet data to Dope Budz platform
                      const walletData = {
                        type: 'WALLET_STATE',
                        gameState: {
                          money: gameState.money,
                          day: gameState.day,
                          health: gameState.health,
                          debt: gameState.debt,
                          currentCity: gameState.currentCity,
                          reputation: gameState.reputation
                        },
                        wallet: {
                          address: connectedWallet,
                          type: connectedWalletType,
                          connected: !!connectedWallet,
                          serverWallet: serverWallet,
                          budzBalance: budzBalance,
                          gbuxBalance: gbuxBalance
                        }
                      };
                      
                      console.log('🌿 Dope Budz: Sending wallet data to iframe:', walletData);
                      iframe.contentWindow?.postMessage(walletData, 'https://www.thc-labz.xyz');
                      
                      // Also set wallet data in localStorage for iframe access
                      try {
                        localStorage.setItem('parentWalletState', JSON.stringify(walletData));
                        localStorage.setItem('parentWalletAddress', connectedWallet || '');
                        localStorage.setItem('parentWalletType', connectedWalletType || '');
                        localStorage.setItem('parentServerWallet', serverWallet || '');
                        console.log('🌿 Dope Budz: Wallet data stored in localStorage');
                      } catch (e) {
                        console.warn('Could not store wallet state in localStorage:', e);
                      }
                    };
                  }
                }}
                src="https://www.thc-labz.xyz/"
                className="w-full h-full border border-gray-600 rounded"
                title="Dope Budz Platform"
                allow="clipboard-write; payment; microphone; camera"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
              />
            </div>
            
            {/* Footer with instructions */}
            <div className="p-4 border-t border-gray-600 bg-gray-800">
              <p className="text-sm text-gray-400 text-center">
                🌿 Access the complete Dope Budz ecosystem • Your wallet state is shared automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* End-Game Video Player - Plays first on 45-day completion */}
      {showEndGameVideo && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="relative w-full h-full">
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted={!videoAudioEnabled}
              onEnded={() => {
                setEndGameVideoCompleted(true);
                setShowEndGameVideo(false);
                setShowGameEnd(true); // Show score submission after video
              }}
              onLoadedData={() => console.log('🎬 End-game celebration video loaded')}
            >
              <source src="/attached_assets/SMOKEWEEDWITH_1752341770440.mp4" type="video/mp4" />
            </video>
            
            {/* Video Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  setEndGameVideoCompleted(true);
                  setShowEndGameVideo(false);
                  setShowGameEnd(true);
                }}
                className="bg-black bg-opacity-50 text-white px-3 py-2 rounded hover:bg-opacity-70"
              >
                Skip Video
              </button>
            </div>
            
            {/* Celebration Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black bg-opacity-30">
              <div className="absolute bottom-8 left-8 text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-2" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  🎉 45 DAYS COMPLETE! 🎉
                </h1>
                <p className="text-xl md:text-2xl text-green-400">
                  Celebrating your THC Dope Budz journey...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Rewards Modal - Shows after score submission */}
      {showAchievementRewards && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-yellow-400 p-6 max-w-md w-full text-center rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">🏆 45-DAY COMPLETION REWARDS! 🏆</h2>
            
            {/* Final Score Display */}
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <p className="text-lg font-semibold text-green-400 mb-2">
                Final Score: ${(gameState.money + gameState.bankAccount - gameState.debt).toLocaleString()}
              </p>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Cash: ${gameState.money.toLocaleString()}</div>
                <div>Bank: ${gameState.bankAccount.toLocaleString()}</div>
                <div>Debt: -${gameState.debt.toLocaleString()}</div>
              </div>
            </div>

            {/* Leaderboard Position */}
            <div className="bg-purple-900 bg-opacity-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-bold text-purple-400 mb-2">🥇 Leaderboard Position</h3>
              <p className="text-2xl font-bold text-yellow-400">
                #{leaderboardPosition > 0 ? leaderboardPosition : '?'}
              </p>
              <p className="text-sm text-gray-400">
                {leaderboardPosition <= 10 ? 'Top 10! Extra daily BUDZ rewards!' : 'Great effort! Keep grinding for top 10!'}
              </p>
            </div>

            {/* BUDZ Rewards Breakdown */}
            <div className="bg-green-900 bg-opacity-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-bold text-green-400 mb-3">💰 BUDZ Token Rewards</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-300">Achievement Rewards:</span>
                  <span className="text-green-400 font-bold">+{finalRewards.achievements} BUDZ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">45-Day Completion Bonus:</span>
                  <span className="text-green-400 font-bold">+{finalRewards.completion} BUDZ</span>
                </div>
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Total Earned:</span>
                    <span className="text-yellow-400 font-bold text-lg">+{finalRewards.achievements + finalRewards.completion} BUDZ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAchievementRewards(false);
                  setShowLeaderboard(true);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 p-3 font-bold rounded"
              >
                View Leaderboard
              </button>
              <button
                onClick={() => {
                  setShowAchievementRewards(false);
                  setShowAchievements(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 p-3 font-bold rounded"
              >
                View Achievements
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Returning to preparation mode for new round');
                  setShowAchievementRewards(false);
                  setGameMode('preparation');
                  // Reset game state for new round
                  resetToStartingState();
                }}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 p-3 font-bold rounded"
              >
                New Round
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-4">
              BUDZ tokens will be distributed to your server wallet within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Smoking Video Modal - Shows when user smokes cannabis */}
      {showSmokingVideo && (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
          <div className="relative w-full h-full">
            <video
              className="w-full h-full object-cover smoking-video"
              autoPlay
              playsInline
              controls={false}
              onLoadedData={(e) => {
                const video = e.target as HTMLVideoElement;
                console.log('🌿 Smoking video loaded, attempting to play with sound...');
                // Set volume and try to play with sound
                video.volume = 0.8;
                video.muted = false;
                
                // User interaction is required for audio in most browsers
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.then(() => {
                    setSmokingAudioEnabled(!video.muted);
                    console.log('🌿 Smoking video playing with audio:', !video.muted);
                  }).catch(() => {
                    console.log('🌿 Autoplay with sound failed, trying muted...');
                    video.muted = true;
                    setSmokingAudioEnabled(false);
                    return video.play();
                  });
                }
              }}
              onClick={(e) => {
                // Enable audio on user click
                const video = e.target as HTMLVideoElement;
                if (video.muted) {
                  video.muted = false;
                  setSmokingAudioEnabled(true);
                  console.log('🌿 Audio enabled by user click');
                }
              }}
              onEnded={() => {
                console.log('🌿 Smoking video completed');
                handleSmokingVideoEnd();
              }}
              onError={(e) => {
                console.error('🌿 Error playing smoking video:', e);
                handleSmokingVideoEnd();
              }}
            >
              <source src="/attached_assets/SMOKEWEEDWITH_1752360428007.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Video Controls - Same as Intro Video */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  console.log('🌿 Smoking video skipped by user');
                  handleSmokingVideoEnd();
                }}
                className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg hover:bg-opacity-70 transition-opacity"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Skip Video
              </button>
            </div>
            
            {/* Audio Enable Overlay - Same as Intro Video */}
            {!smokingAudioEnabled && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="bg-black bg-opacity-70 text-white p-4 rounded-lg text-center">
                  <div className="text-4xl mb-2">🔊</div>
                  <p className="text-lg font-bold mb-2" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                    Click to Enable Audio
                  </p>
                  <p className="text-sm text-gray-300">
                    Click anywhere on the video to unmute
                  </p>
                </div>
              </div>
            )}

            {/* Smoking Session Overlay */}
            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                🌿 SMOKING SESSION 🌿
              </h2>
              <p className="text-lg" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                Enjoying {drugs[selectedDrugForSmoking]?.name || 'premium cannabis'}...
              </p>
              {smokingBuffs.active && (
                <div className="text-sm text-green-400 mt-2">
                  <p>AI Assistant Enhancement: {smokingBuffs.traits.join(', ')}</p>
                  <p className="text-xs text-gray-300">Effects last until next smoking session</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game End Modal - Mobile Optimized */}
      {showGameEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-yellow-400 p-4 md:p-6 max-w-md w-full text-center rounded-lg">
            <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-4">🎉 GAME OVER 🎉</h2>
            <div className="text-green-400 mb-4">
              <p className="text-base md:text-lg">45 Days Complete!</p>
              <p className="text-sm md:text-base mt-2 font-semibold">Final Score: ${(gameState.money + gameState.bankAccount - gameState.debt).toLocaleString()}</p>
              <div className="text-xs md:text-sm text-gray-400 mt-3 space-y-1">
                <div>Cash: ${gameState.money.toLocaleString()}</div>
                <div>Bank: ${gameState.bankAccount.toLocaleString()}</div>
                <div>Debt: -${gameState.debt.toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm md:text-base text-green-400 mb-2">Enter your name for the leaderboard:</label>
              <input
                type="text"
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-gray-800 border border-green-400 p-3 text-green-400 text-center touch-manipulation min-h-[44px] rounded"
                placeholder="Your name..."
                onKeyPress={(e) => e.key === 'Enter' && submitScore()}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitScore}
                disabled={!playerName.trim()}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 p-2 font-bold"
              >
                Submit Score
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-green-600 hover:bg-green-700 p-2 font-bold"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-400 p-6 max-w-lg mx-4 w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-400">🏆 LEADERBOARD 🏆</h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Countdown Timer */}
            <div className="bg-gray-800 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-400">⏰ Next Payout:</span>
                <span className="text-lg font-bold text-yellow-400 font-mono">
                  {(() => {
                    const now = new Date();
                    const nextMidnight = new Date();
                    nextMidnight.setUTCHours(6, 0, 0, 0); // 6 UTC = Midnight CST
                    if (now > nextMidnight) {
                      nextMidnight.setDate(nextMidnight.getDate() + 1);
                    }
                    const diff = nextMidnight.getTime() - now.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  })()}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Top 10 players earn 100-1000 BUDZ tokens
              </div>
            </div>
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 border rounded ${
                      index === 0 ? 'border-yellow-400 bg-yellow-900 bg-opacity-20' :
                      index === 1 ? 'border-gray-300 bg-gray-800 bg-opacity-20' :
                      index === 2 ? 'border-orange-400 bg-orange-900 bg-opacity-20' :
                      'border-green-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' :
                        'text-green-400'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-white font-bold">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">${entry.score.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Day {entry.day}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No scores yet. Be the first to complete the game!
                </div>
              )}
            </div>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 p-2 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Responsive Navigation - Tabs on larger screens, Dropdown on small */}
      <div className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm shadow-lg">
        {/* Mobile Dropdown Navigation (< sm screens) */}
        <div className="sm:hidden">
          <div className="relative">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between px-4 py-3 text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {currentView === 'market' && '🏪'}
                  {currentView === 'travel' && '🚗'}
                  {currentView === 'work' && '💼'}
                  {currentView === 'bank' && '🏦'}
                  {currentView === 'command' && '🎮'}
                  {currentView === 'status' && '📊'}
                </span>
                <span className="font-bold">
                  {currentView === 'market' && 'Market'}
                  {currentView === 'travel' && 'Travel'}
                  {currentView === 'work' && 'Work'}
                  {currentView === 'bank' && 'Bank'}
                  {currentView === 'command' && 'Command'}
                  {currentView === 'status' && 'Status'}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${showMobileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMobileMenu && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-600 z-[9999] shadow-xl">
                {[
                  { id: 'market', label: '🏪 Market', color: 'text-purple-400' },
                  { id: 'travel', label: '🚗 Travel', color: 'text-green-400' },
                  { id: 'work', label: '💼 Work', color: 'text-orange-400' },
                  { id: 'bank', label: '🏦 Bank', color: 'text-blue-400' },
                  { id: 'command', label: '🎮 Command', color: 'text-cyan-400' },
                  { id: 'status', label: '📊 Status', color: 'text-yellow-400' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentView(tab.id as any);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left font-bold transition-colors border-b border-gray-700 last:border-b-0 ${
                      currentView === tab.id
                        ? `${tab.color} bg-gray-700`
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Tab Navigation (sm+ screens) */}
        <div className="hidden sm:flex overflow-x-auto scrollbar-hide">
          {[
            { id: 'market', label: '🏪 Market', color: 'text-purple-400' },
            { id: 'travel', label: '🚗 Travel', color: 'text-green-400' },
            { id: 'work', label: '💼 Work', color: 'text-orange-400' },
            { id: 'bank', label: '🏦 Bank', color: 'text-blue-400' },
            { id: 'command', label: '🎮 Command', color: 'text-cyan-400' },
            { id: 'status', label: '📊 Status', color: 'text-yellow-400' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`flex-none px-3 py-2 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-2 ${
                currentView === tab.id
                  ? `${tab.color} border-current bg-gray-800`
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="p-2 md:p-4 pb-20 md:pb-24">
        {currentView === 'market' && (
          <div style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 mb-4 border border-green-500/30">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-green-400" />
                <span className="text-green-400">🍃 Market Hub</span>
                <span className="text-gray-400 text-sm">- {cities[gameState.currentCity as keyof typeof cities]}</span>
              </h2>
              
              {selectedAssistantAvatar && (
                <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedAssistantAvatar} 
                      alt="The Plug AI"
                      className="w-8 h-8 rounded border border-blue-400"
                    />
                    <div className="flex-1">
                      <div className="text-blue-400 font-bold text-sm">💡 Pro Tip from The Plug AI</div>
                      <div className="text-xs text-gray-300">Visit the Plug Hub for market analysis and trading strategies</div>
                    </div>
                    <button
                      onClick={() => setCurrentView('command')}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs font-bold transition-all"
                    >
                      Chat Now
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile-Optimized Stats Card */}
            <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4">
                  <div className="text-xs sm:text-sm text-gray-300">
                    <span className="block sm:inline">Space:</span> 
                    <span className="text-white font-bold ml-1">{totalSpace}/{gameState.coatSpace}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">
                    <span className="block sm:inline">Value:</span> 
                    <span className="text-green-400 font-bold ml-1">${totalValue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <button
                    onClick={() => setShowProfitAssistant(true)}
                    className="flex-1 sm:flex-none px-2 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs rounded-lg transition-all flex items-center justify-center gap-1 font-bold min-h-[36px]"
                    title="Get daily profit analysis and market insights"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span className="hidden xs:inline">Daily Brief</span>
                    <span className="xs:hidden">Brief</span>
                  </button>
                  <button
                    onClick={() => setShowActionLog(true)}
                    className="flex-1 sm:flex-none px-2 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs rounded-lg transition-all flex items-center justify-center gap-1 font-bold min-h-[36px]"
                    title="View complete action log and game history"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="hidden xs:inline">Log ({actionLog.length})</span>
                    <span className="xs:hidden">({actionLog.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile-First Inventory Display */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-900 bg-opacity-95 border border-green-400 rounded-lg">
              <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-green-300 flex items-center gap-2">
                📦 <span>INVENTORY</span>
                <span className="text-xs text-gray-400 ml-auto">{Object.values(drugs).filter(drug => drug.owned > 0).length} items</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                {Object.values(drugs).filter(drug => drug.owned > 0).map(drug => (
                  <div 
                    key={drug.id} 
                    className={`relative border rounded-lg overflow-hidden h-28 sm:h-32 bg-gray-800 cursor-pointer transition-all duration-300 ${
                      highlightedProduct === drug.id 
                        ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50' 
                        : 'border-green-400 hover:border-green-300'
                    }`}
                    onClick={() => {
                      setHighlightedProduct(highlightedProduct === drug.id ? '' : drug.id);
                      // Scroll to market section if product is highlighted
                      if (highlightedProduct !== drug.id) {
                        setTimeout(() => {
                          const marketSection = document.querySelector('[data-market-grid]');
                          if (marketSection) {
                            marketSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 100);
                      }
                    }}
                  >
                    {/* Strain Background Image */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: drug.id === 'reggie' ? 'url(/attached_assets/Regz_1752183158112.jpg)' :
                                        drug.id === 'mids' ? 'url(/attached_assets/Mids_1752183315749.jpg)' :
                                        drug.id === 'kush' ? 'url(/attached_assets/OGKush_1752183385525.jpg)' :
                                        drug.id === 'sour' ? 'url(/attached_assets/SourDiesel2_1752185001725.jpg)' :
                                        drug.id === 'purple' ? 'url(/attached_assets/purplehaze_1752183464779.jpg)' :
                                        drug.id === 'white' ? 'url(/attached_assets/whitewidow_1752183483730.jpg)' :
                                        drug.id === 'gelato' ? 'url(/attached_assets/gelato_1752183529839.jpg)' :
                                        drug.id === 'runtz' ? 'url(/attached_assets/runtz1_1752183634093.jpg)' : 
                                        'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    
                    {/* Mobile-Optimized Content */}
                    <div className="relative z-10 flex flex-col h-full p-1.5 sm:p-2 bg-black bg-opacity-60">
                      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                        <div className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">{drug.owned}</div>
                        <div className="text-xs text-green-300 text-center leading-tight break-words w-full px-1">{drug.name}</div>
                      </div>
                      
                      {/* Responsive Smoking Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent inventory item click
                          startSmokingSession(drug.id);
                        }}
                        disabled={lastSmokingDay === gameState.day}
                        className={`w-full py-1 px-1 text-xs font-semibold rounded transition-colors min-h-[28px] ${
                          lastSmokingDay === gameState.day
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                        title={lastSmokingDay === gameState.day ? "Already smoked today!" : `Smoke 1 oz of ${drug.name}`}
                      >
                        <span className="hidden xs:inline">🌿 Smoke</span>
                        <span className="xs:hidden">🌿</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {Object.values(drugs).filter(drug => drug.owned > 0).length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-4">
                    No items in inventory
                  </div>
                )}
              </div>
            </div>

            {/* Mobile-First Market Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 pb-8 md:pb-12" data-market-grid>
              {Object.values(drugs).map(drug => (
                <div 
                  key={drug.id} 
                  className={`border p-3 transition-all duration-300 ${
                    highlightedProduct === drug.id 
                      ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50 bg-yellow-900 bg-opacity-20' 
                      : 'border-green-400'
                  }`}
                  style={drug.id === 'reggie' ? {
                    backgroundImage: 'url(/attached_assets/Regz_1752183158112.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'mids' ? {
                    backgroundImage: 'url(/attached_assets/Mids_1752183315749.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'kush' ? {
                    backgroundImage: 'url(/attached_assets/OGKush_1752183385525.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'sour' ? {
                    backgroundImage: 'url(/attached_assets/SourDiesel2_1752185001725.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'purple' ? {
                    backgroundImage: 'url(/attached_assets/purplehaze_1752183464779.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'white' ? {
                    backgroundImage: 'url(/attached_assets/whitewidow_1752183483730.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'gelato' ? {
                    backgroundImage: 'url(/attached_assets/gelato_1752183529839.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : drug.id === 'runtz' ? {
                    backgroundImage: 'url(/attached_assets/runtz1_1752183634093.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative'
                  } : {}}
                >
                  {drug.id === 'reggie' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'mids' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'kush' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'sour' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'purple' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'white' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'gelato' ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  ) : drug.id === 'runtz' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded"></div>
                  )}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base">{drug.name}</span>
                      {getPriceIcon(drug.currentPrice, drug.basePrice)}
                    </div>
                    <div className={`font-bold text-sm md:text-base ${getPriceColor(drug.currentPrice, drug.basePrice)}`}>
                      ${drug.currentPrice.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className={`text-lg md:text-xl mb-1 font-bold ${drug.owned > 0 ? 'text-yellow-400' : 'text-green-400'}`}>Owned: {drug.owned}</div>
                  
                  {/* Smoke Bonus Button */}
                  {drug.owned > 0 && (
                    <button
                      onClick={() => startSmokingSession(drug.id)}
                      disabled={lastSmokingDay === gameState.day}
                      className={`w-full mb-2 py-2 px-3 text-sm font-bold rounded-lg transition-all ${
                        lastSmokingDay === gameState.day
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                          : 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-400'
                      }`}
                      title={lastSmokingDay === gameState.day ? "Already smoked today!" : `Smoke 1 oz of ${drug.name} for bonus effects`}
                    >
                      {lastSmokingDay === gameState.day ? '💨 Smoked Today' : '💨 Smoke for Bonus'}
                    </button>
                  )}
                  
                  {/* THC GROWERZ Strain Traits */}
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      {drug.traits.map((trait, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 rounded-full bg-green-600 text-white font-semibold border border-green-400"
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Trade Interface */}
                  <div className="space-y-3">
                    {/* Quick Buy Input */}
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="0"
                        max={Math.floor(gameState.money / drug.currentPrice)}
                        value={buyAmount[drug.id] || 0}
                        onChange={(e) => setBuyAmount(prev => ({ ...prev, [drug.id]: parseInt(e.target.value) || 0 }))}
                        className="flex-1 bg-gray-900 border border-green-400 p-2 text-green-400 text-sm touch-manipulation min-h-[40px]"
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <button
                        onClick={(event) => {
                          const amount = buyAmount[drug.id] || 0;
                          
                          if (amount > 0) {
                            buyDrug(drug.id, amount);
                            
                            // Physics effects
                            if (physicsEnabled) {
                              const rect = (event.target as HTMLElement).getBoundingClientRect();
                              const x = rect.left + rect.width / 2;
                              const y = rect.top + rect.height / 2;
                              const totalCost = drug.currentPrice * amount;
                              
                              createBouncyMoney(x, y, totalCost);
                              createBouncyDrug(x + 100, y - 50, drug.name);
                              
                              if (totalCost > 5000) {
                                shakeScreen(Math.min(totalCost / 10000, 2));
                              }
                            }
                            
                            setEventMessage(`💰 FUCK YOU PAY ME! 💰\nBought ${amount} oz of ${drug.name} for $${(drug.currentPrice * amount).toLocaleString()}`);
                            setShowEvent(true);
                            setTimeout(() => setShowEvent(false), 2000);
                          }
                        }}
                        disabled={!buyAmount[drug.id] || gameState.money < drug.currentPrice * (buyAmount[drug.id] || 0)}
                        className="bg-gray-500 active:bg-green-700 disabled:bg-black-600 px-3 py-2 text-sm font-semibold touch-manipulation min-h-[40px]"
                      >
                        Buy
                      </button>
                    </div>
                    
                    {/* Interactive Buy/Sell Slider */}
                    <div className="w-full">
                      {(() => {
                        const maxAffordable = Math.floor(gameState.money / drug.currentPrice);
                        const spaceAvailable = gameState.coatSpace - totalSpace;
                        const maxCanBuy = Math.min(maxAffordable, spaceAvailable);
                        const maxCanSell = drug.owned;
                        const sliderValue = tradeSlider[drug.id] || 0;
                        
                        // Calculate if we're buying or selling
                        const isBuying = sliderValue > 0;
                        const isSelling = sliderValue < 0;
                        const amount = Math.abs(sliderValue);
                        
                        return (
                          <>
                            {/* Slider Container */}
                            <div className="relative bg-gray-800 p-3 rounded-lg border border-gray-600">
                              {/* Slider Labels */}
                              <div className="flex justify-between items-center mb-2">
                                {maxCanSell > 0 && <span className="text-xs text-red-400 font-bold">SELL ALL ({maxCanSell})</span>}
                                {maxCanSell === 0 && <span></span>}
                                <span className="text-xs text-green-400 font-bold">BUY MAX ({maxCanBuy})</span>
                              </div>
                              
                              {/* Main Slider */}
                              <div className="relative">
                                <input
                                  type="range"
                                  min={maxCanSell > 0 ? -maxCanSell : 0}
                                  max={maxCanBuy}
                                  value={maxCanSell > 0 ? sliderValue : Math.max(0, sliderValue)}
                                  onChange={(e) => {
                                    const newValue = parseInt(e.target.value);
                                    setTradeSlider(prev => ({ ...prev, [drug.id]: newValue }));
                                  }}
                                  className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-thumb"
                                  style={{
                                    background: maxCanSell > 0 
                                      ? `linear-gradient(to right, #dc2626 0%, #dc2626 ${((maxCanSell + sliderValue) / (maxCanSell + maxCanBuy)) * 50}%, #374151 50%, #16a34a ${50 + ((sliderValue) / (maxCanSell + maxCanBuy)) * 50}%, #16a34a 100%)`
                                      : `linear-gradient(to right, #16a34a 0%, #16a34a 100%)`
                                  }}
                                />
                                
                                {/* Center indicator - only show when there's inventory to sell */}
                                {maxCanSell > 0 && (
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full pointer-events-none"></div>
                                )}
                              </div>
                              

                              
                              {/* Execute Button */}
                              <button
                                onClick={(event) => {
                                  if (sliderValue === 0) return;
                                  
                                  const executeAmount = Math.abs(sliderValue);
                                  
                                  if (isBuying) {
                                    buyDrug(drug.id, executeAmount);
                                    setEventMessage(`💰 FUCK YOU PAY ME! 💰\nBought ${executeAmount} oz of ${drug.name} for $${(drug.currentPrice * executeAmount).toLocaleString()}`);
                                  } else {
                                    sellDrug(drug.id, executeAmount);
                                    setEventMessage(`💵 CHA-CHING! 💵\nSold ${executeAmount} oz of ${drug.name} for $${(drug.currentPrice * executeAmount).toLocaleString()}`);
                                  }
                                  
                                  // Physics effects
                                  if (physicsEnabled) {
                                    const rect = (event.target as HTMLElement).getBoundingClientRect();
                                    const x = rect.left + rect.width / 2;
                                    const y = rect.top + rect.height / 2;
                                    const totalAmount = drug.currentPrice * executeAmount;
                                    
                                    createBouncyMoney(x, y, totalAmount);
                                    if (isBuying) {
                                      createBouncyDrug(x + 100, y - 50, drug.name);
                                    }
                                    
                                    if (totalAmount > 3000) {
                                      shakeScreen(Math.min(totalAmount / 10000, 2));
                                    }
                                  }
                                  
                                  // Reset slider
                                  setTradeSlider(prev => ({ ...prev, [drug.id]: 0 }));
                                  setShowEvent(true);
                                  setTimeout(() => setShowEvent(false), 2000);
                                }}
                                disabled={sliderValue === 0 || (isBuying && (gameState.money < drug.currentPrice * amount || totalSpace >= gameState.coatSpace)) || (isSelling && drug.owned < amount)}
                                className={`w-full mt-2 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 touch-manipulation min-h-[40px] ${
                                  sliderValue === 0 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' :
                                  isBuying ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white' :
                                  'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                                }`}
                              >
                                {sliderValue === 0 ? (maxCanSell > 0 ? 'Move slider to trade' : '') :
                                 isBuying ? `BUY ${amount} oz` :
                                 `SELL ${amount} oz`}
                              </button>
                            </div>
                          </>
                        );
                      })()}
                      <button
                        onClick={() => startSmokingSession(drug.id)}
                        disabled={drug.owned < 1 || lastSmokingDay === gameState.day}
                        className="bg-purple-600 border border-purple-400 active:bg-purple-700 disabled:bg-gray-600 disabled:border-gray-500 px-2 py-2 text-xs font-semibold touch-manipulation min-h-[40px] text-white"
                        title={lastSmokingDay === gameState.day ? "Already smoked today!" : `Smoke 1 oz of ${drug.name} with AI Assistant`}
                      >
                        🌿 Smoke
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        <input
                          type="number"
                          min="0"
                          max={drug.owned}
                          value={sellAmount[drug.id] || 0}
                          onChange={(e) => setSellAmount(prev => ({ ...prev, [drug.id]: parseInt(e.target.value) || 0 }))}
                          className="flex-1 bg-gray-800 border border-green-400 p-2 text-green-400 text-sm touch-manipulation min-h-[40px]"
                          placeholder="0"
                          inputMode="numeric"
                        />
                        <button
                          onClick={(event) => {
                            const amount = sellAmount[drug.id] || 0;
                            
                            if (amount > 0) {
                              sellDrug(drug.id, amount);
                              
                              // Physics effects for selling
                              if (physicsEnabled) {
                                const rect = (event.target as HTMLElement).getBoundingClientRect();
                                const x = rect.left + rect.width / 2;
                                const y = rect.top + rect.height / 2;
                                const totalEarned = drug.currentPrice * amount;
                                
                                createBouncyMoney(x, y, totalEarned);
                                
                                if (totalEarned > 3000) {
                                  shakeScreen(Math.min(totalEarned / 12000, 1.5));
                                }
                              }
                              
                              setEventMessage(`💵 CHA-CHING! 💵\nSold ${amount} oz of ${drug.name} for $${(drug.currentPrice * amount).toLocaleString()}`);
                              setShowEvent(true);
                              setTimeout(() => setShowEvent(false), 2000);
                            }
                          }}
                          disabled={!sellAmount[drug.id] || drug.owned < (sellAmount[drug.id] || 0)}
                          className="bg-red-600 active:bg-red-700 disabled:bg-gray-600 px-3 py-2 text-sm font-semibold touch-manipulation min-h-[40px]"
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'travel' && (
          <div style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg p-4 mb-4 border border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-400" />
                  <span className="text-blue-400">🗺️ Travel Hub</span>
                </h2>
                <button
                  onClick={() => setShowInteractiveMap(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 py-2 rounded-lg flex items-center gap-2 text-white font-bold transition-all transform hover:scale-105 shadow-lg"
                  title="Open Interactive Map"
                >
                  <span className="text-2xl">🗺️</span>
                  <span className="hidden sm:inline">Interactive Map</span>
                </button>
              </div>
              
              {selectedAssistantAvatar && (
                <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedAssistantAvatar} 
                      alt="The Plug AI"
                      className="w-8 h-8 rounded border border-cyan-400"
                    />
                    <div className="flex-1">
                      <div className="text-cyan-400 font-bold text-sm">🧭 Travel Tip from The Plug AI</div>
                      <div className="text-xs text-gray-300">Ask me about the best routes and city information before traveling</div>
                    </div>
                    <button
                      onClick={() => setCurrentView('command')}
                      className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-white text-xs font-bold transition-all"
                    >
                      Get Advice
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Mobile-First City Grid */}
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(cities).map(([cityId, cityName]) => {
                const distance = cityId !== gameState.currentCity ? calculateDistance(gameState.currentCity, cityId) : 0;
                const cost = cityId !== gameState.currentCity ? calculateTravelCost(gameState.currentCity, cityId) : 0;
                const travelTime = distance > 0 ? Math.round((distance / 300) * 24) : 0; // Hours based on 300 mph average speed
                
                return (
                  <div key={cityId} className="flex gap-1 md:gap-2">
                    <button
                      onClick={() => travelToCity(cityId)}
                      disabled={cityId === gameState.currentCity || gameState.isWorking}
                      className={`flex-1 p-2 md:p-3 border border-green-400 text-left rounded transition-colors ${
                        cityId === gameState.currentCity 
                          ? 'bg-green-900 bg-opacity-30 text-green-400 cursor-not-allowed border-green-600' 
                          : gameState.isWorking
                          ? 'bg-gray-800 bg-opacity-50 text-gray-400 cursor-not-allowed border-gray-600'
                          : gameState.money < cost
                          ? 'bg-red-900 bg-opacity-30 text-red-400 cursor-not-allowed border-red-600'
                          : 'bg-black bg-opacity-60 hover:bg-black hover:bg-opacity-80 text-green-300 hover:text-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm md:text-base truncate">
                            {cityName} {cityId === gameState.currentCity && '📍'}
                          </div>
                          {cityId !== gameState.currentCity && (
                            <div className="text-xs text-gray-400 leading-tight">
                              <div className="hidden sm:block">
                                {distance} miles • {travelTime}h • ${cost}
                                {gameState.money < cost && ' (Need more $)'}
                              </div>
                              <div className="sm:hidden">
                                {distance}mi • ${cost}
                                {gameState.money < cost && ' (Need $)'}
                              </div>
                            </div>
                          )}
                          {cityId === gameState.currentCity && (
                            <div className="text-xs text-green-600">Current location</div>
                          )}
                        </div>
                        {cityId !== gameState.currentCity && (
                          <div className="text-right text-xs ml-2">
                            <div className="text-yellow-400 text-base">🗺️</div>
                          </div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => openCityInfo(cityId)}
                      className="px-2 md:px-3 py-2 md:py-3 border border-blue-400 bg-blue-900 bg-opacity-80 hover:bg-blue-800 text-blue-300 hover:text-blue-200 transition-colors rounded min-w-[40px] flex items-center justify-center"
                      title={`View insights for ${cityName}`}
                    >
                      <span className="text-sm">ℹ️</span>
                    </button>
                  </div>
                );
              })}
              
              {/* Mobile-Optimized Rest & Smoke Break */}
              <div className="mt-4 border border-purple-400 rounded">
                <button
                  onClick={() => takeRestBreak()}
                  disabled={gameState.isWorking || gameState.health === 100}
                  className={`w-full p-3 text-left rounded transition-colors ${
                    gameState.isWorking
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : gameState.health === 100
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-900 hover:bg-purple-800 text-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base md:text-lg">💨</span>
                    <span className="font-bold text-sm md:text-base">Rest & Smoke Break</span>
                  </div>
                  <div className="text-xs md:text-sm opacity-80 leading-tight">
                    <span className="hidden sm:inline">Skip 1 day • Restore health to 100%</span>
                    <span className="sm:hidden">Skip day • Restore health</span>
                    {gameState.health === 100 && (
                      <span className="block sm:inline">
                        <span className="hidden sm:inline"> (Already at full health)</span>
                        <span className="sm:hidden"> (Full health)</span>
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
            {/* Mobile-Responsive Warning */}
            <div className="mt-4 p-2 md:p-3 border border-yellow-400 text-yellow-400 text-xs md:text-sm rounded bg-yellow-900/10">
              <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="leading-tight">
                {gameState.isWorking 
                  ? "Can't travel while working!"
                  : "Travel advances 1 day & may trigger events!"
                }
              </span>
            </div>
          </div>
        )}

        {/* Travel Options Modal for 300+ mile trips */}
        {showTravelOptions && selectedCityForTravel && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-purple-400 font-lemon-milk">Choose Travel Method</h3>
                <button
                  onClick={() => setShowTravelOptions(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 text-center">
                <p className="text-gray-300 text-sm mb-2">
                  Distance to {cities[selectedCityForTravel as keyof typeof cities]}: 
                  <span className="text-yellow-400 font-bold ml-1">
                    {calculateDistance(gameState.currentCity, selectedCityForTravel)} miles
                  </span>
                </p>
                <p className="text-gray-400 text-xs">
                  Long distance travel requires choosing your transportation method
                </p>
              </div>

              <div className="space-y-3">
                {/* Flight Option - Expensive, Fast, High Risk */}
                <button
                  onClick={() => {
                    const cost = calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'flight');
                    if (gameState.money >= cost) {
                      travelToCity(selectedCityForTravel, 'flight');
                      setShowTravelOptions(false);
                    } else {
                      setEventMessage(`You need $${cost} for a flight. You have $${gameState.money}.`);
                      setShowEvent(true);
                      setTimeout(() => setShowEvent(false), 3000);
                    }
                  }}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    gameState.money >= calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'flight')
                      ? 'border-red-500 bg-red-900 bg-opacity-30 hover:bg-red-800 text-red-200'
                      : 'border-gray-600 bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={gameState.money < calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'flight')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">✈️</span>
                      <span className="font-bold">Flight</span>
                    </div>
                    <span className="text-lg font-bold text-red-300">
                      ${calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'flight')}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>⚡ Fastest travel time</div>
                    <div>⚠️ High risk of police attention</div>
                    <div>💰 Most expensive option</div>
                  </div>
                </button>

                {/* Drive Option - Medium Cost/Risk */}
                <button
                  onClick={() => {
                    const cost = calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'drive');
                    if (gameState.money >= cost) {
                      travelToCity(selectedCityForTravel, 'drive');
                      setShowTravelOptions(false);
                    } else {
                      setEventMessage(`You need $${cost} to drive. You have $${gameState.money}.`);
                      setShowEvent(true);
                      setTimeout(() => setShowEvent(false), 3000);
                    }
                  }}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    gameState.money >= calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'drive')
                      ? 'border-yellow-500 bg-yellow-900 bg-opacity-30 hover:bg-yellow-800 text-yellow-200'
                      : 'border-gray-600 bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={gameState.money < calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'drive')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚗</span>
                      <span className="font-bold">Drive</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-300">
                      ${calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'drive')}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>🕒 Medium travel time</div>
                    <div>⚠️ Medium risk level</div>
                    <div>💰 Balanced cost option</div>
                  </div>
                </button>

                {/* Bus Option - Cheap, Slow, Low Risk */}
                <button
                  onClick={() => {
                    const cost = calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'bus');
                    if (gameState.money >= cost) {
                      travelToCity(selectedCityForTravel, 'bus');
                      setShowTravelOptions(false);
                    } else {
                      setEventMessage(`You need $${cost} for a bus ticket. You have $${gameState.money}.`);
                      setShowEvent(true);
                      setTimeout(() => setShowEvent(false), 3000);
                    }
                  }}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    gameState.money >= calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'bus')
                      ? 'border-green-500 bg-green-900 bg-opacity-30 hover:bg-green-800 text-green-200'
                      : 'border-gray-600 bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={gameState.money < calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'bus')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚌</span>
                      <span className="font-bold">Bus</span>
                    </div>
                    <span className="text-lg font-bold text-green-300">
                      ${calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'bus')}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>⏳ Slowest travel time</div>
                    <div>✅ Lowest risk of detection</div>
                    <div>💰 Cheapest travel option</div>
                  </div>
                </button>

                {/* Skillz Car Option - Ultra Low Cost, Cool Factor */}
                {gameState.skillzCarOwner && (
                  <button
                    onClick={() => {
                      const cost = calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'skillz_car');
                      if (gameState.money >= cost) {
                        travelToCity(selectedCityForTravel, 'skillz_car');
                        setShowTravelOptions(false);
                      } else {
                        setEventMessage(`You need $${cost} for gas. You have $${gameState.money}.`);
                        setShowEvent(true);
                        setTimeout(() => setShowEvent(false), 3000);
                      }
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      gameState.money >= calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'skillz_car')
                        ? 'border-purple-500 bg-purple-900 bg-opacity-30 hover:bg-purple-800 text-purple-200'
                        : 'border-gray-600 bg-gray-800 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={gameState.money < calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'skillz_car')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🚗</span>
                        <span className="font-bold">Skillz Car</span>
                      </div>
                      <span className="text-lg font-bold text-purple-300">
                        ${calculateTravelCost(gameState.currentCity, selectedCityForTravel, 'skillz_car')}
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>😎 Your Plug drives the car</div>
                      <div>💰 Ultra-low fuel costs only</div>
                      <div>🔥 Coolest travel method</div>
                    </div>
                  </button>
                )}
              </div>

              <div className="mt-4 p-3 border border-blue-400 bg-blue-900 bg-opacity-20 rounded text-xs text-blue-200">
                <div className="font-bold mb-1">💡 Travel Strategy Tips:</div>
                <ul className="space-y-1 text-blue-300">
                  <li>• Flight: Fast but attracts attention</li>
                  <li>• Drive: Balanced risk vs speed</li>
                  <li>• Bus: Safest for carrying contraband</li>
                  {gameState.skillzCarOwner && (
                    <li>• Skillz Car: Your own ride with ultra-low costs</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Travel Cutscene Modal */}
        {showTravelCutscene && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Bus Travel Cutscene */}
              {travelCutsceneMethod === 'bus' && (
                <div className="text-center">
                  <img 
                    src="https://i.imgur.com/xiv4xny.png" 
                    alt="Bus Travel" 
                    className="max-w-md max-h-96 mx-auto rounded-lg"
                  />
                  <div className="mt-4 text-white text-xl font-bold">
                    🚌 Taking the bus to {cities[selectedCityForTravel as keyof typeof cities]}...
                  </div>
                </div>
              )}

              {/* Flight Travel Cutscene */}
              {travelCutsceneMethod === 'flight' && (
                <div className="text-center">
                  <img 
                    src="https://i.imgur.com/VdSyxZf.png" 
                    alt="Air Travel" 
                    className="max-w-md max-h-96 mx-auto rounded-lg"
                  />
                  <div className="mt-4 text-white text-xl font-bold">
                    ✈️ Flying to {cities[selectedCityForTravel as keyof typeof cities]}...
                  </div>
                </div>
              )}

              {/* Skillz Car Travel Cutscene */}
              {travelCutsceneMethod === 'skillz_car' && (
                <div className="text-center relative">
                  <div className="relative inline-block">
                    <img 
                      src="https://i.imgur.com/NngbtlI.png" 
                      alt="Skillz Car" 
                      className="max-w-md max-h-96 mx-auto rounded-lg"
                    />
                    {/* Plug NFT behind the wheel */}
                    {selectedPlugImage && (
                      <img 
                        src={selectedPlugImage}
                        alt="Your Plug driving"
                        className="absolute top-1/4 left-1/3 w-16 h-16 rounded-full border-2 border-white opacity-80"
                      />
                    )}
                  </div>
                  <div className="mt-4 text-white text-xl font-bold">
                    🚗 Your Plug is driving to {cities[selectedCityForTravel as keyof typeof cities]}...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Animation Components */}
        
        {/* Dealer Animation - Emerges from bottom with good news */}
        {showDealerAnimation && (
          <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none">
            <div className="mb-16 p-4 bg-green-900 bg-opacity-90 border border-green-400 rounded-t-lg animate-bounce">
              <div className="flex items-center gap-3">
                <img 
                  src="https://i.imgur.com/UvqFUAe.png" 
                  alt="Dealer" 
                  className="w-16 h-20 object-contain transform translate-y-2"
                />
                <div className="text-green-200 font-bold">
                  {dealerMessage}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Robber Animation - Full appearance for robbery, peek for warning */}
        {showRobberAnimation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="text-center">
              <img 
                src="https://i.imgur.com/13GNrdd.png" 
                alt="Robber" 
                className="w-32 h-40 mx-auto animate-pulse"
              />
              <div className="mt-4 text-red-400 font-bold text-xl">
                🔫 You're being robbed!
              </div>
            </div>
          </div>
        )}

        {/* Robber Peek Warning - Just peeking from side */}
        {robberPeekActive && (
          <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40 pointer-events-none">
            <div className="transform translate-x-1/2 opacity-70">
              <img 
                src="https://i.imgur.com/13GNrdd.png" 
                alt="Robber Peek" 
                className="w-16 h-20 object-contain animate-ping"
              />
            </div>
          </div>
        )}

        {/* Police Animation - Multiple cops with spinning lights */}
        {showPoliceAnimation && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            {/* Police Lights Effect */}
            <div className="absolute inset-0 animate-pulse">
              <div className="w-full h-full bg-red-500 opacity-20 animate-ping"></div>
              <div className="absolute inset-0 w-full h-full bg-blue-500 opacity-20 animate-ping" style={{animationDelay: '0.5s'}}></div>
            </div>
            
            {/* Police Officers */}
            <div className="flex items-center justify-center h-full gap-8">
              {Array.from({length: policeIntensity}, (_, i) => (
                <div key={i} className="text-center animate-bounce" style={{animationDelay: `${i * 0.2}s`}}>
                  <img 
                    src={
                      i === 0 ? "https://i.imgur.com/7EBiEdQ.png" :
                      i === 1 ? "https://i.imgur.com/OEnuzI4.png" :
                      "https://i.imgur.com/eUOASsw.png"
                    }
                    alt={`Police Officer ${i + 1}`} 
                    className="w-24 h-32 mx-auto"
                  />
                  <div className="text-blue-400 font-bold text-sm mt-2">
                    👮‍♂️ FREEZE!
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROWERZ NFT Sale Animation - Crosses bottom of screen */}
        {showGrowerNFTAnimation && animatingGrowerNFT && (
          <div className="fixed bottom-0 left-0 w-full h-24 z-40 pointer-events-none overflow-hidden">
            <div className="absolute bottom-2 animate-bounce" style={{
              left: '-100px',
              animation: 'slideAcross 3s linear'
            }}>
              <div className="flex items-center gap-2 bg-green-900 bg-opacity-80 p-2 rounded border border-green-400">
                <img 
                  src={animatingGrowerNFT.image || "https://via.placeholder.com/50"} 
                  alt="GROWERZ NFT" 
                  className="w-12 h-12 rounded"
                />
                <div className="text-green-200 text-sm font-bold">
                  💰 Sale Complete!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Random NFT Request Animation */}
        {showNFTRequest && requestingNFT && (
          <div className="fixed top-1/4 right-4 z-50 bg-purple-900 bg-opacity-90 border border-purple-400 rounded-lg p-4 max-w-xs">
            <div className="flex items-center gap-3">
              <img 
                src={requestingNFT.image || "https://via.placeholder.com/50"} 
                alt="Requesting NFT" 
                className="w-12 h-12 rounded animate-bounce"
              />
              <div className="text-purple-200">
                <div className="font-bold text-sm">
                  {requestingNFT.name}
                </div>
                <div className="text-xs">
                  Looking for <span className="text-yellow-300">{requestedDrug}</span>
                </div>
                <div className="text-xs text-green-300 mt-1">
                  🎁 Bonus if you have it!
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // Check if player has the requested drug
                const hasDrug = gameState.drugs?.some(drug => 
                  drug.name.toLowerCase().includes(requestedDrug.toLowerCase())
                );
                if (hasDrug) {
                  const bonus = Math.floor(Math.random() * 500) + 200;
                  setGameState(prev => ({...prev, money: prev.money + bonus}));
                  triggerDealerAnimation(`🎉 ${requestingNFT.name} bought your ${requestedDrug} for a $${bonus} bonus!`);
                } else {
                  setEventMessage(`You don't have any ${requestedDrug} to sell.`);
                  setShowEvent(true);
                  setTimeout(() => setShowEvent(false), 2000);
                }
                setShowNFTRequest(false);
                setNftBonusAvailable(false);
              }}
              className="w-full mt-2 py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold"
            >
              Check Inventory
            </button>
          </div>
        )}

        {currentView === 'command' && (
          <div style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-center justify-center">
              <Bot className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400">AI Command Center</span>
            </h2>
            
            {/* Quick AI Chat Access - Always Visible */}
            {selectedAssistantAvatar && (
              <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={selectedAssistantAvatar} 
                    alt="The Plug AI"
                    className="w-10 h-10 rounded-lg border border-blue-400"
                  />
                  <div className="flex-1">
                    <div className="text-blue-400 font-bold">The Plug AI is Online</div>
                    <div className="text-xs text-gray-400">Ready for strategic guidance</div>
                  </div>
                  <button
                    onClick={() => setActiveCommandTab('chat')}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-bold text-sm transition-all"
                  >
                    💬 Quick Chat
                  </button>
                </div>
              </div>
            )}

            {/* UNIFIED SKILLZ SYSTEM - INTEGRATED GAME SYSTEMS ACCESS */}
            <div className="space-y-4 mb-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400" 
                    style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  ⚡ UNIFIED SKILLZ SYSTEMS
                </h3>
                <div className="text-xs text-gray-400">
                  Access all major game systems through integrated SKILLZ interface
                </div>
              </div>

              {/* Market Analytics Integration */}
              <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-4">
                <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  📊 MARKET ANALYTICS & INTELLIGENCE
                </h4>
                <p className="text-sm text-gray-300 mb-3">
                  Access comprehensive price analysis across all 16 cities with professional line graph visualization and strategic trading insights.
                </p>
                <button
                  onClick={() => setShowPlayerPanel(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  📊 VIEW CITY PRICE INTELLIGENCE DASHBOARD
                </button>
              </div>
              
              {/* AI Systems Integration */}
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4">
                <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  🤖 AI SYSTEMS & PLUG MISSIONS
                </h4>
                <p className="text-sm text-gray-300 mb-3">
                  Access AI-powered delivery missions, special products, and NFT-enhanced gameplay systems through Command Center tabs.
                </p>
                <button
                  onClick={() => setActiveCommandTab('missions')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  🤖 ACCESS AI PLUG MISSIONS
                </button>
              </div>
              
              {/* Travel & Interactive Map Systems */}
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4">
                <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  🗺️ TRAVEL & INTERACTIVE MAP
                </h4>
                <p className="text-sm text-gray-300 mb-3">
                  Navigate to different cities, view interactive map, and access comprehensive city intelligence and travel systems.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentView('travel')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                  >
                    🗺️ TRAVEL HUB
                  </button>
                  <button
                    onClick={() => setShowInteractiveMap(true)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                  >
                    🗺️ INTERACTIVE MAP
                  </button>
                </div>
              </div>
            </div>
            
            {/* Command Center Content - Inline instead of modal */}
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 mb-2" 
                    style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  🎯 COMMAND CENTER
                </h3>
                <div className="text-sm text-gray-400">
                  Advanced operations, special gear, and mission control
                </div>
              </div>

              {/* Enhanced Sub-tabs for Command Center - Chat First */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-2 flex gap-2 border border-gray-700/50 shadow-xl">
                  <button
                    onClick={() => setActiveCommandTab('chat')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all transform ${
                      activeCommandTab === 'chat'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl scale-105 border border-blue-400/50'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/70 hover:scale-102'
                    }`}
                  >
                    🤖 AI Chat
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('skills')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all transform ${
                      activeCommandTab === 'skills'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xl scale-105 border border-cyan-400/50'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/70 hover:scale-102'
                    }`}
                  >
                    ⚡ SKILLZ
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('special')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all transform ${
                      activeCommandTab === 'special'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl scale-105 border border-purple-400/50'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/70 hover:scale-102'
                    }`}
                  >
                    📦 Gear
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('missions')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all transform ${
                      activeCommandTab === 'missions'
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl scale-105 border border-orange-400/50'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/70 hover:scale-102'
                    }`}
                  >
                    🔌 Missions
                  </button>
                  <button
                    onClick={() => setActiveCommandTab('inventory')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all transform ${
                      activeCommandTab === 'inventory'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl scale-105 border border-green-400/50'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/70 hover:scale-102'
                    }`}
                  >
                    📋 Storage
                  </button>
                </div>
              </div>

              {/* Command Center Tab Content */}
              <div className="bg-gray-800 rounded-lg p-6 border border-cyan-500">
                {activeCommandTab === 'skills' && (
                  <div>
                    <h4 className="text-lg font-bold text-cyan-400 mb-4">⚡ COMPREHENSIVE SKILLZ PURCHASING</h4>
                    <p className="text-gray-300 mb-4">Purchase and upgrade all 16 skills with direct purchasing power and real-time bonuses.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {/* Core Skills */}
                      <div className="bg-gray-700 p-3 rounded-lg border border-cyan-400">
                        <h5 className="text-sm font-bold text-cyan-400 mb-1">🗣️ Negotiation</h5>
                        <p className="text-xs text-gray-300 mb-2">Lv {gameState.skills?.negotiation || 0}/5 • 5% better buy prices</p>
                        <button 
                          onClick={() => onAction('upgrade_skill', { skill: 'negotiation', cost: 1000 })}
                          disabled={gameState.money < 1000}
                          className={`w-full py-1 px-2 text-xs rounded ${gameState.money >= 1000 ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          ${1000}
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded-lg border border-red-400">
                        <h5 className="text-sm font-bold text-red-400 mb-1">👊 Intimidation</h5>
                        <p className="text-xs text-gray-300 mb-2">Lv {gameState.skills?.intimidation || 0}/5 • 5% better sell prices</p>
                        <button 
                          onClick={() => onAction('upgrade_skill', { skill: 'intimidation', cost: 1200 })}
                          disabled={gameState.money < 1200}
                          className={`w-full py-1 px-2 text-xs rounded ${gameState.money >= 1200 ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          ${1200}
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded-lg border border-purple-400">
                        <h5 className="text-sm font-bold text-purple-400 mb-1">🧠 Mastermind</h5>
                        <p className="text-xs text-gray-300 mb-2">Lv {gameState.skills?.mastermind || 0}/5 • 25% bonus earnings</p>
                        <button 
                          onClick={() => onAction('upgrade_skill', { skill: 'mastermind', cost: 2000 })}
                          disabled={gameState.money < 2000}
                          className={`w-full py-1 px-2 text-xs rounded ${gameState.money >= 2000 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          ${2000}
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded-lg border border-yellow-400">
                        <h5 className="text-sm font-bold text-yellow-400 mb-1">🕵️ Streetwise</h5>
                        <p className="text-xs text-gray-300 mb-2">Lv {gameState.skills?.streetwise || 0}/5 • 10% less bad events</p>
                        <button 
                          onClick={() => onAction('upgrade_skill', { skill: 'streetwise', cost: 1500 })}
                          disabled={gameState.money < 1500}
                          className={`w-full py-1 px-2 text-xs rounded ${gameState.money >= 1500 ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          ${1500}
                        </button>
                      </div>
                    </div>
                    
                    {/* Market Analytics Section */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-4 mb-4">
                      <h5 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        📊 MARKET ANALYTICS & INTELLIGENCE
                      </h5>
                      <p className="text-sm text-gray-300 mb-3">
                        Access comprehensive price analysis across all 16 cities with professional line graph visualization and strategic trading insights.
                      </p>
                      <button
                        onClick={() => setShowPlayerPanel(true)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                      >
                        📊 VIEW CITY PRICE INTELLIGENCE DASHBOARD
                      </button>
                    </div>
                    
                    {/* AI Systems Integration */}
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4 mb-4">
                      <h5 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        🤖 AI SYSTEMS & PLUG MISSIONS
                      </h5>
                      <p className="text-sm text-gray-300 mb-3">
                        AI-powered delivery missions, special products, and NFT-enhanced operations with The Plug coordination.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-purple-300 mb-3">
                        <div>• AI-coordinated delivery missions</div>
                        <div>• Special products and equipment</div>
                        <div>• NFT-enhanced AI operations</div>
                        <div>• Advanced mission management</div>
                      </div>
                      <button
                        onClick={() => setShowPlayerPanel(true)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                      >
                        🤖 ACCESS AI SYSTEMS & MISSIONS
                      </button>
                    </div>
                    
                    {/* Travel Systems Integration */}
                    <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 border border-green-500/30 rounded-xl p-4 mb-4">
                      <h5 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        🗺️ TRAVEL & INTERACTIVE MAP
                      </h5>
                      <p className="text-sm text-gray-300 mb-3">
                        Advanced travel systems with interactive map, city intelligence, and strategic travel planning.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-green-300 mb-3">
                        <div>• Interactive city map interface</div>
                        <div>• Real-time travel cost analysis</div>
                        <div>• City intelligence and insights</div>
                        <div>• Strategic travel planning</div>
                      </div>
                      <button
                        onClick={() => setCurrentView('travel')}
                        className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                      >
                        🗺️ ACCESS TRAVEL & MAP SYSTEMS
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowPlayerPanel(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-lg transition-all mb-4"
                    >
                      🎯 ACCESS FULL SKILLZ CENTER (All 16 Skills)
                    </button>
                  </div>
                )}

                {activeCommandTab === 'special' && (
                  <div>
                    <h4 className="text-lg font-bold text-purple-400 mb-4">📦 ENHANCED SPECIAL PRODUCTS</h4>
                    <p className="text-gray-300 mb-4">Military-grade equipment and AI-powered delivery systems for advanced operations with detailed information and purchase capabilities.</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-700 p-4 rounded-lg border border-purple-400">
                        <div className="text-purple-400 font-bold text-lg mb-2">📦 Stealth Package</div>
                        <div className="text-sm text-gray-300 mb-2">Military-grade concealment technology that reduces heat generation by 30% during operations.</div>
                        <div className="text-green-400 font-bold text-lg mb-2">$750</div>
                        <button 
                          onClick={() => onAction('purchase_special', { item: 'stealth_package', cost: 750 })}
                          disabled={gameState.money < 750}
                          className={`w-full py-2 px-3 text-sm rounded ${gameState.money >= 750 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          Purchase
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg border border-purple-400">
                        <div className="text-purple-400 font-bold text-lg mb-2">🚗 Premium Transport</div>
                        <div className="text-sm text-gray-300 mb-2">Luxury delivery service with armored vehicles and professional drivers for high-value shipments.</div>
                        <div className="text-green-400 font-bold text-lg mb-2">$1,200</div>
                        <button 
                          onClick={() => onAction('purchase_special', { item: 'premium_transport', cost: 1200 })}
                          disabled={gameState.money < 1200}
                          className={`w-full py-2 px-3 text-sm rounded ${gameState.money >= 1200 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          Purchase
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg border border-purple-400">
                        <div className="text-purple-400 font-bold text-lg mb-2">🤖 AI Coordinator</div>
                        <div className="text-sm text-gray-300 mb-2">Advanced route optimization AI that increases mission success rates by 40% and unlocks premium missions.</div>
                        <div className="text-green-400 font-bold text-lg mb-2">$2,000</div>
                        <button 
                          onClick={() => onAction('purchase_special', { item: 'ai_coordinator', cost: 2000 })}
                          disabled={gameState.money < 2000}
                          className={`w-full py-2 px-3 text-sm rounded ${gameState.money >= 2000 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          Purchase
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg border border-purple-400">
                        <div className="text-purple-400 font-bold text-lg mb-2">📡 Encrypted Comms</div>
                        <div className="text-sm text-gray-300 mb-2">Military-grade encrypted communications that provide early warning systems and reduce police attention.</div>
                        <div className="text-green-400 font-bold text-lg mb-2">$850</div>
                        <button 
                          onClick={() => onAction('purchase_special', { item: 'encrypted_comms', cost: 850 })}
                          disabled={gameState.money < 850}
                          className={`w-full py-2 px-3 text-sm rounded ${gameState.money >= 850 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowPlayerPanel(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition-all"
                    >
                      🛒 ACCESS FULL SPECIAL PRODUCTS STORE
                    </button>
                  </div>
                )}

                {activeCommandTab === 'missions' && (
                  <div>
                    <h4 className="text-lg font-bold text-orange-400 mb-4">🔌 ENHANCED PLUG MISSIONS</h4>
                    <p className="text-gray-300 mb-4">NFT-powered delivery missions with dynamic rewards, risk assessment, and AI coordination through The Plug network.</p>
                    <div className="space-y-4 mb-4">
                      <div className="bg-gray-700 p-4 rounded-lg border border-orange-400">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-orange-400 font-bold text-lg">🌙 Stealth Night Drop</div>
                            <div className="text-sm text-gray-300">Low-risk midnight delivery with encrypted coordinates</div>
                          </div>
                          <div className="text-green-400 font-bold text-lg">$1,500</div>
                        </div>
                        <button 
                          onClick={() => onAction('start_mission', { mission: 'stealth_night', reward: 1500 })}
                          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded text-sm"
                        >
                          Start Mission
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg border border-orange-400">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-orange-400 font-bold text-lg">💼 VIP Client Delivery</div>
                            <div className="text-sm text-gray-300">High-value client service with Plug network protection</div>
                          </div>
                          <div className="text-green-400 font-bold text-lg">$2,500</div>
                        </div>
                        <button 
                          onClick={() => onAction('start_mission', { mission: 'vip_delivery', reward: 2500 })}
                          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded text-sm"
                        >
                          Start Mission
                        </button>
                      </div>
                      
                      <div className="bg-gray-700 p-4 rounded-lg border border-orange-400">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-orange-400 font-bold text-lg">🎯 Multi-Point Coordination</div>
                            <div className="text-sm text-gray-300">Complex route optimization with AI assistance</div>
                          </div>
                          <div className="text-green-400 font-bold text-lg">$3,000</div>
                        </div>
                        <button 
                          onClick={() => onAction('start_mission', { mission: 'multi_point', reward: 3000 })}
                          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded text-sm"
                        >
                          Start Mission
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowPlayerPanel(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-lg transition-all"
                    >
                      🔌 ACCESS FULL PLUG MISSIONS CENTER
                    </button>
                  </div>
                )}

                {activeCommandTab === 'inventory' && (
                  <div>
                    <h4 className="text-lg font-bold text-green-400 mb-4">📋 INVENTORY MANAGEMENT</h4>
                    <p className="text-gray-300 mb-4">View your special products, active missions, and equipment status.</p>
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📦</div>
                      <div>No special products in inventory</div>
                      <div className="text-sm">Complete missions to earn equipment</div>
                    </div>
                    
                    <button
                      onClick={() => setShowPlayerPanel(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg transition-all mt-4"
                    >
                      📋 ACCESS FULL INVENTORY CENTER
                    </button>
                  </div>
                )}

                {activeCommandTab === 'chat' && (
                  <div>
                    <h4 className="text-lg font-bold text-blue-400 mb-4">💬 THE PLUG AI CHAT</h4>
                    
                    {selectedAssistantAvatar ? (
                      <div className="bg-gray-800 border border-blue-400 rounded-lg p-4">
                        {/* NFT Header */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-600">
                          <img 
                            src={selectedAssistantAvatar} 
                            alt="Selected Plug NFT"
                            className="w-10 h-10 rounded-lg border border-blue-400"
                          />
                          <div>
                            <div className="text-blue-400 font-bold text-sm">The Plug AI</div>
                            <div className="text-xs text-gray-400">NFT-Powered Assistant</div>
                          </div>
                        </div>
                        
                        {/* Embedded Chat Interface */}
                        <EmbeddedAIChat 
                          walletAddress={connectedWallet || ''} 
                          gameState={{
                            money: gameState.money,
                            debt: gameState.debt,
                            health: gameState.health,
                            day: gameState.day,
                            currentCity: gameState.currentCity,
                            reputation: gameState.reputation,
                            inventory: Object.values(drugs || {}).length > 0 ? Object.values(drugs || {}).reduce((acc, drug) => ({
                              ...acc,
                              [drug.name]: drug.owned
                            }), {} as Record<string, number>) : {},
                            lastEvent: eventMessage
                          }}
                          drugs={Object.values(drugs || {}).map(drug => ({
                            name: drug.name,
                            price: drug.currentPrice,
                            userQuantity: drug.owned
                          }))}
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 text-center">
                        <div className="text-4xl mb-3">🔌</div>
                        <div className="text-gray-400 mb-2">No Plug Connected</div>
                        <div className="text-sm text-gray-500 mb-4">Connect a GROWERZ NFT to activate The Plug AI assistant for advanced guidance and strategic support.</div>
                        <button
                          onClick={() => setShowPlayerPanel(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                        >
                          Connect Your Plug
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'work' && (
          <div style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            <div className="bg-gradient-to-r from-green-900/30 to-yellow-900/30 rounded-lg p-4 mb-4 border border-green-500/30">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-green-400">💰 Video Ad Revenue Center</span>
              </h2>
              <p className="text-gray-300 text-sm">Watch sponsored ads to earn legitimate cash rewards with scaling bonuses for consistent viewing.</p>
            </div>
            
            <div className="space-y-4">
              <div 
                className="border border-purple-400 p-6 bg-black bg-opacity-80 relative rounded-lg"
                style={{
                  backgroundImage: 'url(/attached_assets/mcds_1752186817166.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg"></div>
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-2">📺</div>
                    <div className="text-xl font-bold text-purple-400">Watch & Earn</div>
                    <div className="text-sm text-gray-400">Sponsored Video Monetization</div>
                    <div className="text-xs text-purple-300 mt-1">Real Google AdMob Integration</div>
                  </div>

                  {/* Daily Ad System */}
                  {(() => {
                    const currentDay = gameState.currentDay || 1;
                    const adsWatchedToday = gameState.adsWatchedToday || {};
                    const todayCount = adsWatchedToday[currentDay] || 0;
                    const remainingAds = 2 - todayCount;
                    
                    return remainingAds > 0 ? (
                      <div className="space-y-4">
                        <div className="border border-purple-400 p-4 rounded-lg bg-purple-900 bg-opacity-40">
                          <div className="text-center mb-4">
                            <div className="text-purple-300 font-bold text-lg mb-2">💰 AVAILABLE WORK</div>
                            <div className="text-sm text-gray-300 mb-3">Get paid watching ads - fast cash for more deals!</div>
                            <div className="text-3xl font-bold text-green-400 mb-2">${500 + (consecutiveWorkAds * 100)} per video</div>
                            <div className="text-sm text-blue-300">
                              📺 Videos available today: {remainingAds}/2
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Consecutive bonus: +${consecutiveWorkAds * 100}
                            </div>
                            <div className="text-xs text-purple-300 mt-1">
                              Next reward: ${500 + ((consecutiveWorkAds + 1) * 100)}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => playRewardedVideo('work_bonus')}
                            className="w-full bg-purple-600 hover:bg-purple-700 p-4 rounded-lg font-bold text-lg transition-colors"
                          >
                            📺 Watch Video for +${500 + (consecutiveWorkAds * 100)}
                            {gameState.consecutiveVideoStreak > 0 && (
                              <div className="text-sm text-yellow-300 mt-1">
                                🔥 +${gameState.consecutiveVideoStreak * 100} Streak Bonus!
                              </div>
                            )}
                          </button>
                          
                          <div className="text-xs text-gray-400 mt-3 text-center space-y-1">
                            <div>• Quick 30-60 second videos</div>
                            <div>• Money hits your pocket instantly</div>
                            <div>• 5-minute break between ad gigs</div>
                            <div>• Growing rewards for consistency</div>
                          </div>
                        </div>
                      </div>
                    ) : todayCount >= 2 ? (
                      <div className="border border-gray-600 p-4 rounded-lg bg-gray-800 bg-opacity-50">
                        <div className="text-center">
                          <div className="text-gray-400 font-bold text-lg mb-2">🏁 DAILY WORK COMPLETE</div>
                          <div className="text-sm text-gray-500 mb-2">
                            You've watched {todayCount}/2 videos today
                          </div>
                          <div className="text-2xl font-bold text-green-400 mb-2">
                            Total earned: $500
                          </div>
                          <div className="text-xs text-blue-400">
                            Fresh ad gigs reset tomorrow - keep earning!
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Legal Status & Reputation Display */}
                  <div className="mt-4 border border-yellow-400 p-4 rounded-lg bg-yellow-900 bg-opacity-20">
                    <div className="text-center">
                      <div className="text-yellow-300 font-bold text-sm mb-3">⚖️ LEGAL STATUS & REPUTATION</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-black bg-opacity-40 p-3 rounded">
                          <div className="text-gray-400">Legal Status</div>
                          <div className="text-green-400 font-bold text-lg">{gameState.legalStatus || 'Clean'}</div>
                        </div>
                        <div className="bg-black bg-opacity-40 p-3 rounded">
                          <div className="text-gray-400">Street Rep</div>
                          <div className="text-blue-400 font-bold text-lg">{gameState.streetRep || 0}/1000</div>
                        </div>
                        <div className="bg-black bg-opacity-40 p-3 rounded col-span-2">
                          <div className="text-gray-400">Video Streak</div>
                          <div className="text-yellow-400 font-bold text-lg">
                            {gameState.consecutiveVideoStreak || 0} days 
                            {gameState.consecutiveVideoStreak > 0 && (
                              <span className="text-green-400 text-sm ml-2">
                                (+${gameState.consecutiveVideoStreak * 100} bonus!)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ad Revenue Stats */}
                  <div className="mt-4 border border-blue-400 p-4 rounded-lg bg-blue-900 bg-opacity-20">
                    <div className="text-center">
                      <div className="text-blue-300 font-bold text-sm mb-3">📊 YOUR EARNINGS HISTORY</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-black bg-opacity-40 p-3 rounded">
                          <div className="text-gray-400">Total Videos</div>
                          <div className="text-white font-bold text-lg">{gameState.totalAdsWatched || 0}</div>
                        </div>
                        <div className="bg-black bg-opacity-40 p-3 rounded">
                          <div className="text-gray-400">Total Earned</div>
                          <div className="text-green-400 font-bold text-lg">${gameState.adBonusEarnings || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedAssistantAvatar && (
                <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedAssistantAvatar} 
                      alt="The Plug AI"
                      className="w-8 h-8 rounded border border-cyan-400"
                    />
                    <div className="flex-1">
                      <div className="text-cyan-400 font-bold text-sm">💼 Work Strategy from The Plug AI</div>
                      <div className="text-xs text-gray-300">Ask me about maximizing video earnings and career planning</div>
                    </div>
                    <button
                      onClick={() => setCurrentView('command')}
                      className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-white text-xs font-bold transition-all"
                    >
                      Get Tips
                    </button>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <button
                  onClick={() => setCurrentView('market')}
                  className="w-full bg-gray-600 hover:bg-gray-700 p-3 rounded font-medium transition-colors"
                >
                  💰 Go Shopping at Market
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'bank' && (
          <div style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 mb-4 border border-green-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <span className="text-green-400">🏦 Financial Services Hub</span>
                </h2>
              </div>
              <p className="text-gray-300 text-sm">Manage your cash flow, savings, and street credit with professional financial services.</p>
            </div>
            
            {/* Enhanced Account Summary */}
            <div 
              className="border-2 border-green-400 p-6 mb-6 bg-black bg-opacity-90 relative rounded-xl shadow-2xl"
              style={{
                backgroundImage: 'url(/attached_assets/bank1_1752188062383.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-gray-900 opacity-75 rounded-xl"></div>
              <div className="relative z-10">
                <h3 className="font-bold mb-4 text-lg text-center text-green-300 border-b border-green-400 pb-2">💰 Account Overview</h3>
                <div className="grid grid-cols-2 gap-6 text-base">
                  <div className="flex justify-between items-center bg-black bg-opacity-40 p-3 rounded-lg">
                    <span className="text-gray-300">💵 Cash:</span>
                    <span className="text-green-400 font-bold text-lg">${gameState.money.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black bg-opacity-40 p-3 rounded-lg">
                    <span className="text-gray-300">🏦 Savings:</span>
                    <span className="text-blue-400 font-bold text-lg">${gameState.bankAccount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black bg-opacity-40 p-3 rounded-lg">
                    <span className="text-gray-300">📉 Debt:</span>
                    <span className="text-red-400 font-bold text-lg">${gameState.debt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black bg-opacity-40 p-3 rounded-lg border border-yellow-400">
                    <span className="text-gray-300">💎 Net Worth:</span>
                    <span className="text-yellow-400 font-bold text-lg">${(gameState.money + gameState.bankAccount - gameState.debt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-First Banking Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              {/* Mobile-Optimized Street Loanz Card */}
              <div className="border-2 border-purple-400 p-3 md:p-4 bg-gradient-to-br from-purple-900 to-black bg-opacity-90 rounded-xl min-h-[200px] md:min-h-[240px] flex flex-col shadow-xl hover:shadow-purple-400/20 transition-all duration-300">
                <div className="flex-shrink-0 mb-3 md:mb-4">
                  <h3 className="font-bold text-purple-300 text-center text-base md:text-lg mb-2">💳 Street Loanz</h3>
                  <div className="text-xs text-gray-300 text-center mb-2 md:mb-3 px-1 md:px-2 leading-tight">Need cash fast? Loan sharks got you covered (10% daily interest)</div>
                  <div className="text-xs md:text-sm text-yellow-300 text-center font-semibold bg-purple-800 bg-opacity-50 rounded p-2">
                    Available: ${Math.max(0, 5000 - gameState.debt).toLocaleString()}
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-between gap-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={Math.max(1, Math.floor((5000 - gameState.debt) / 1000))}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Math.max(1, Math.min(parseInt(e.target.value) || 1, Math.floor((5000 - gameState.debt) / 1000))))}
                      placeholder="# of $1k"
                      className="flex-1 bg-gray-900 border border-purple-400 p-3 text-purple-400 text-sm rounded"
                      disabled={gameState.debt >= 5000}
                    />
                    <div className="flex items-center px-3 bg-gray-800 border border-purple-400 text-purple-400 text-sm rounded">
                      ${(loanAmount * 1000).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => takeLoan(loanAmount)}
                    disabled={gameState.debt >= 5000 || gameState.debt + (loanAmount * 1000) > 5000}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 font-bold text-sm rounded transition-colors"
                  >
                    {gameState.debt >= 5000 ? 'Limit Reached' : `Take Loan`}
                  </button>
                  <div className="text-xs text-purple-300 text-center">
                    Daily interest: ${Math.round(loanAmount * 1000 * 0.1).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Pay Off Debt Card */}
              <div className="border-2 border-red-400 p-4 bg-gradient-to-br from-red-900 to-black bg-opacity-90 rounded-xl min-h-[240px] flex flex-col shadow-xl hover:shadow-red-400/20 transition-all duration-300">
                <div className="flex-shrink-0 mb-4">
                  <h3 className="font-bold text-red-300 text-center text-lg mb-2">💰 Pay Off Debt</h3>
                  <div className="text-xs text-gray-300 text-center mb-3">Pay down what you owe: ${gameState.debt.toLocaleString()}</div>
                  <div className="text-sm text-yellow-300 text-center font-semibold bg-red-800 bg-opacity-50 rounded p-2">
                    Daily interest: 10%
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-between gap-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={Math.min(gameState.money, gameState.debt)}
                      value={debtPayAmount || ''}
                      onChange={(e) => setDebtPayAmount(parseInt(e.target.value) || 0)}
                      placeholder="Amount"
                      className="flex-1 bg-gray-900 border border-red-400 p-3 text-green-400 text-sm rounded"
                    />
                    <button
                      onClick={() => payOffDebt(debtPayAmount)}
                      disabled={debtPayAmount <= 0 || debtPayAmount > gameState.money || gameState.debt === 0}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-3 text-sm rounded transition-colors"
                    >
                      Pay
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDebtPayAmount(Math.min(gameState.money, gameState.debt))}
                      disabled={gameState.debt === 0 || gameState.money === 0}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 px-3 py-2 text-sm rounded transition-colors"
                    >
                      Pay All
                    </button>
                    <button
                      onClick={() => setDebtPayAmount(Math.min(gameState.money, Math.floor(gameState.debt / 2)))}
                      disabled={gameState.debt === 0 || gameState.money === 0}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 px-3 py-2 text-sm rounded transition-colors"
                    >
                      Pay Half
                    </button>
                  </div>
                </div>
              </div>

              {/* Deposit Money Card */}
              <div className="border-2 border-blue-400 p-4 bg-gradient-to-br from-blue-900 to-black bg-opacity-90 rounded-xl min-h-[240px] flex flex-col shadow-xl hover:shadow-blue-400/20 transition-all duration-300">
                <div className="flex-shrink-0 mb-4">
                  <h3 className="font-bold text-blue-300 text-center text-lg mb-2">💵 Deposit Money</h3>
                  <div className="text-xs text-gray-300 text-center mb-3 px-2">Stash your cash safely - can't get robbed here</div>
                  <div className="text-sm text-yellow-300 text-center font-semibold bg-blue-800 bg-opacity-50 rounded p-2">
                    Cash: ${gameState.money.toLocaleString()}
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-between gap-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={gameState.money}
                      value={depositAmount || ''}
                      onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                      placeholder="Amount"
                      className="flex-1 bg-gray-900 border border-blue-400 p-3 text-green-400 text-sm rounded"
                    />
                    <button
                      onClick={() => depositMoney(depositAmount)}
                      disabled={depositAmount <= 0 || depositAmount > gameState.money}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 text-sm rounded transition-colors"
                    >
                      Deposit
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDepositAmount(gameState.money)}
                      disabled={gameState.money === 0}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 px-3 py-2 text-sm rounded transition-colors"
                    >
                      All Cash
                    </button>
                    <button
                      onClick={() => setDepositAmount(Math.floor(gameState.money / 2))}
                      disabled={gameState.money === 0}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 px-3 py-2 text-sm rounded transition-colors"
                    >
                      Half Cash
                    </button>
                  </div>
                </div>
              </div>

              {/* Withdraw Money Card */}
              <div className="border-2 border-green-400 p-4 bg-gradient-to-br from-green-900 to-black bg-opacity-90 rounded-xl min-h-[240px] flex flex-col shadow-xl hover:shadow-green-400/20 transition-all duration-300">
                <div className="flex-shrink-0 mb-4">
                  <h3 className="font-bold text-green-300 text-center text-lg mb-2">🏦 Withdraw Money</h3>
                  <div className="text-xs text-gray-300 text-center mb-3 px-2">Get cash from savings for bigger deals</div>
                  <div className="text-sm text-yellow-300 text-center font-semibold bg-green-800 bg-opacity-50 rounded p-2">
                    Savings: ${gameState.bankAccount.toLocaleString()}
                  </div>
                </div>
                <div className="flex-grow flex flex-col justify-between gap-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={gameState.bankAccount}
                      value={withdrawAmount || ''}
                      onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)}
                      placeholder="Amount"
                      className="flex-1 bg-gray-900 border border-green-400 p-3 text-green-400 text-sm rounded"
                    />
                    <button
                      onClick={() => withdrawMoney(withdrawAmount)}
                      disabled={withdrawAmount <= 0 || withdrawAmount > gameState.bankAccount}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 text-sm rounded transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWithdrawAmount(gameState.bankAccount)}
                      disabled={gameState.bankAccount === 0}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 px-3 py-2 text-sm rounded transition-colors"
                    >
                      All Savings
                    </button>
                    <button
                      onClick={() => setWithdrawAmount(Math.floor(gameState.bankAccount / 2))}
                      disabled={gameState.bankAccount === 0}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 px-3 py-2 text-sm rounded transition-colors"
                    >
                      Half Savings
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedAssistantAvatar && (
              <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedAssistantAvatar} 
                    alt="The Plug AI"
                    className="w-8 h-8 rounded border border-cyan-400"
                  />
                  <div className="flex-1">
                    <div className="text-cyan-400 font-bold text-sm">💰 Financial Advice from The Plug AI</div>
                    <div className="text-xs text-gray-300">Ask me about money management, loans, and investment strategies</div>
                  </div>
                  <button
                    onClick={() => setCurrentView('command')}
                    className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded text-white text-xs font-bold transition-all"
                  >
                    Get Advice
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'status' && (
          <div style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 mb-4 border border-blue-500/30">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-400" />
                <span className="text-blue-400">📊 Player Status Dashboard</span>
              </h2>
              <p className="text-gray-300 text-sm">Your current character statistics, progression, and performance metrics.</p>
            </div>
            
            {/* Mobile-First Status Layout */}
            <div className="space-y-3 md:space-y-4">
              {/* Enhanced Mobile Status Overview */}
              <div className="border-2 border-blue-400 p-3 md:p-4 bg-gradient-to-br from-blue-900/50 to-black/80 rounded-xl shadow-xl">
                <h3 className="text-base md:text-lg font-bold text-blue-300 mb-3 md:mb-4 text-center border-b border-blue-400 pb-2">
                  ⚡ Core Status
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                  <div className="bg-black/30 p-2 md:p-3 rounded-lg flex justify-between items-center">
                    <span className="text-gray-300">💵 Cash:</span>
                    <span className="text-green-400 font-bold">${gameState.money.toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 p-2 md:p-3 rounded-lg flex justify-between items-center">
                    <span className="text-gray-300">📉 Debt:</span>
                    <span className="text-red-400 font-bold">${gameState.debt.toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 p-2 md:p-3 rounded-lg flex justify-between items-center">
                    <span className="text-gray-300">📅 Day:</span>
                    <span className="text-white font-bold">{gameState.day}/45</span>
                  </div>
                  <div className="bg-black/30 p-2 md:p-3 rounded-lg flex justify-between items-center">
                    <span className="text-gray-300">❤️ Health:</span>
                    <span className={`font-bold ${gameState.health > 70 ? 'text-green-400' : gameState.health > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {gameState.health}%
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 md:p-3 rounded-lg flex justify-between items-center xs:col-span-2 lg:col-span-1">
                    <span className="text-gray-300">🌍 City:</span>
                    <span className="text-cyan-400 font-bold text-right break-words">{cities[gameState.currentCity as keyof typeof cities]}</span>
                  </div>
                  <div className="bg-black/30 p-2 md:p-3 rounded-lg flex justify-between items-center xs:col-span-2 lg:col-span-1">
                    <span className="text-gray-300">👜 Space:</span>
                    <span className={`font-bold ${totalSpace >= gameState.coatSpace * 0.8 ? 'text-red-400' : 'text-green-400'}`}>
                      {totalSpace}/{gameState.coatSpace}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile-Optimized Trading Stats */}
              <div className="border border-green-400 p-3 bg-black bg-opacity-80 rounded-lg">
                <h3 className="font-bold mb-2 text-base md:text-lg">🌿 Trading History</h3>
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  {Object.values(drugs).filter(drug => drug.totalBought > 0 || drug.owned > 0).map(drug => {
                    const currentValue = drug.owned * drug.currentPrice;
                    const invested = drug.owned * drug.averageBuyPrice;
                    const unrealizedProfit = currentValue - invested;
                    const totalProfit = drug.totalEarned - drug.totalSpent;
                    
                    return (
                      <div key={drug.id} className="border border-gray-600 p-2 md:p-3 bg-gray-800 rounded">
                        <div className="font-bold text-green-400 mb-2 text-sm md:text-base">{drug.name}</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="text-gray-400">Owned</span>
                            <span className="font-semibold">{drug.owned} oz</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Avg Buy</span>
                            <span className="font-semibold">${Math.round(drug.averageBuyPrice)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Total Bought</span>
                            <span className="font-semibold">{drug.totalBought}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Total Sold</span>
                            <span className="font-semibold">{drug.totalSold}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Invested</span>
                            <span className="font-semibold">${Math.round(invested)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Current Value</span>
                            <span className="font-semibold">${Math.round(currentValue)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Unrealized</span>
                            <span className={`font-semibold ${unrealizedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${Math.round(unrealizedProfit)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400">Total Profit</span>
                            <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${Math.round(totalProfit)}
                            </span>
                          </div>
                          {drug.lowestBuyPrice < 999999 && (
                            <div className="flex flex-col">
                              <span className="text-gray-400">Lowest Buy</span>
                              <span className="font-semibold">${drug.lowestBuyPrice}</span>
                            </div>
                          )}
                          {drug.highestSellPrice > 0 && (
                            <div className="flex flex-col">
                              <span className="text-gray-400">Highest Sell</span>
                              <span className="font-semibold">${drug.highestSellPrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(drugs).every(drug => drug.totalBought === 0 && drug.owned === 0) && (
                    <div className="text-gray-400 text-center py-4">No trading history yet - start dealing to see stats</div>
                  )}
                </div>
                
                {/* Mobile-Responsive Game Stats */}
                <div className="mt-4 border-t border-gray-600 pt-3">
                  <h4 className="font-bold text-yellow-400 mb-3 text-sm md:text-base">📊 Game Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 text-xs">
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Total Deals</span>
                      <span className="font-semibold text-white">{gameState.dealsCompleted}</span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Cities Visited</span>
                      <span className="font-semibold text-white">{gameState.citiesVisited.length}</span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Total Profit</span>
                      <span className={`font-semibold ${gameState.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${Math.round(gameState.totalProfit)}
                      </span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Transactions</span>
                      <span className="font-semibold text-white">{gameState.totalTransactions}</span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Times Robbed</span>
                      <span className="font-semibold text-red-400">{gameState.timesRobbed}</span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Times Arrested</span>
                      <span className="font-semibold text-red-400">{gameState.timesArrested}</span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Loans Repaid</span>
                      <span className="font-semibold text-blue-400">{gameState.loansRepaid}</span>
                    </div>
                    <div className="flex flex-col bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-400">Max Debt</span>
                      <span className="font-semibold text-red-400">${gameState.maxConcurrentDebt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Over Check */}
      {gameState.health <= 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="bg-gray-900 border border-red-400 p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">GAME OVER</h2>
            <p className="text-green-400 mb-4">The streets got you this time...</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 px-4 py-2"
            >
              Rise Again
            </button>
          </div>
        </div>
      )}

      {/* NFT Marketplace Modal */}
      <NFTMarketplace
        isOpen={showNFTMarketplace}
        onClose={() => setShowNFTMarketplace(false)}
        connectedWallet={connectedWallet}
        onAssistantSelect={(nft) => {
          // NFT selection is now handled internally within NFTMarketplace
          // This callback is kept for backward compatibility but may not be needed
          console.log('🎯 NFT selected (handled internally):', nft);
        }}
      />

      {/* Profit Assistant Modal */}
      {showProfitAssistant && (
        <ProfitAssistant
          drugs={drugs}
          currentCity={gameState.currentCity}
          gameDay={gameState.day}
          totalPortfolioValue={totalValue}
          onClose={() => setShowProfitAssistant(false)}
        />
      )}

      {/* Web3 Modal */}
      {showWeb3Modal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-400 w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-purple-400">
              <h2 className="text-xl font-bold text-purple-400">🌐 Sell to Web3</h2>
              <button
                onClick={() => setShowWeb3Modal(false)}
                className="text-red-400 hover:text-red-300 text-2xl font-bold"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                ref={(iframe) => {
                  if (iframe) {
                    iframe.onload = () => {
                      const walletData = {
                        type: 'WALLET_STATE',
                        gameState: {
                          money: gameState.money,
                          day: gameState.day,
                          health: gameState.health,
                          debt: gameState.debt,
                          currentCity: gameState.currentCity,
                          reputation: gameState.reputation
                        }
                      };
                      iframe.contentWindow?.postMessage(walletData, '*');
                      
                      // Also set wallet data in localStorage for iframe access
                      try {
                        localStorage.setItem('parentWalletState', JSON.stringify(walletData));
                      } catch (e) {
                        console.warn('Could not store wallet state in localStorage:', e);
                      }
                    };
                  }
                }}
                src={getWeb3Url()}
                className="w-full h-full border border-gray-600 rounded"
                title="THC Growrez Web3 Platform"
                allow="clipboard-write; payment; microphone; camera"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
              />
            </div>
            <div className="p-4 border-t border-purple-400 text-center text-sm text-gray-400">
              <p>Connected to THC Growrez Web3 Platform</p>
              <p className="text-xs mt-1">Trade your virtual earnings for real Web3 assets</p>
            </div>
          </div>
        </div>
      )}

      {/* Growerz Modal */}
      {showGrowerzModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-green-400 w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-green-400">
              <h2 className="text-xl font-bold text-green-400">🌱 THE GROWERZ HUB</h2>
              <button
                onClick={() => setShowGrowerzModal(false)}
                className="text-red-400 hover:text-red-300 text-2xl font-bold"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                ref={(iframe) => {
                  if (iframe) {
                    iframe.onload = () => {
                      const walletData = {
                        type: 'WALLET_STATE',
                        gameState: {
                          money: gameState.money,
                          day: gameState.day,
                          health: gameState.health,
                          debt: gameState.debt,
                          currentCity: gameState.currentCity,
                          reputation: gameState.reputation
                        },
                        wallet: {
                          address: connectedWallet,
                          type: connectedWalletType,
                          connected: !!connectedWallet,
                          serverWallet: serverWallet,
                          budzBalance: budzBalance,
                          gbuxBalance: gbuxBalance
                        }
                      };
                      
                      console.log('🌱 Growerz: Sending wallet data to iframe:', walletData);
                      iframe.contentWindow?.postMessage(walletData, 'https://growerz.thc-labz.xyz');
                      
                      // Also set wallet data in localStorage for iframe access
                      try {
                        localStorage.setItem('parentWalletState', JSON.stringify(walletData));
                        localStorage.setItem('parentWalletAddress', connectedWallet || '');
                        localStorage.setItem('parentWalletType', connectedWalletType || '');
                        localStorage.setItem('parentServerWallet', serverWallet || '');
                        console.log('🌱 Growerz: Wallet data stored in localStorage');
                      } catch (e) {
                        console.warn('Could not store wallet state in localStorage:', e);
                      }
                    };
                  }
                }}
                src={getGrowerzUrl()}
                className="w-full h-full border border-gray-600 rounded"
                title="THE GROWERZ HUB Platform"
                allow="clipboard-write; payment; microphone; camera; web-share; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation allow-modals allow-pointer-lock"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="p-4 border-t border-green-400 text-center text-sm text-gray-400">
              <p>Connected to THE GROWERZ HUB - Wallet & Player Data Synced</p>
              <p className="text-xs mt-1">
                {connectedWallet ? `Wallet: ${connectedWallet.slice(0, 8)}...${connectedWallet.slice(-4)} | ` : 'Demo Mode | '}
                Money: ${gameState.money.toLocaleString()} | Day: {gameState.day}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Mobile-Optimized Tabbed Interface */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-green-400 w-full max-w-md sm:max-w-2xl lg:max-w-4xl rounded-lg my-4 max-h-[95vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-3 sm:p-6 border-b border-green-400">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-2xl font-bold text-green-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  ⚙️ Settings
                </h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-green-400 hover:text-green-300 text-xl sm:text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Mobile-First Tab Navigation - Horizontal on top */}
            <div className="sm:hidden bg-black/30 border-b border-green-400">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveSettingsTab('wallet')}
                  className={`flex-shrink-0 px-4 py-3 text-xs font-bold transition-colors ${
                    activeSettingsTab === 'wallet' 
                      ? 'bg-green-600 text-white border-b-2 border-green-300' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  💰 Wallet
                </button>
                <button
                  onClick={() => setActiveSettingsTab('profile')}
                  className={`flex-shrink-0 px-4 py-3 text-xs font-bold transition-colors ${
                    activeSettingsTab === 'profile' 
                      ? 'bg-green-600 text-white border-b-2 border-green-300' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => setActiveSettingsTab('game')}
                  className={`flex-shrink-0 px-4 py-3 text-xs font-bold transition-colors ${
                    activeSettingsTab === 'game' 
                      ? 'bg-green-600 text-white border-b-2 border-green-300' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🎮 Game
                </button>
              </div>
            </div>

            {/* Desktop Tab Layout */}
            <div className="hidden sm:flex">
              {/* Tab Navigation - Desktop */}
              <div className="w-1/4 bg-black/30 border-r border-green-400">
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveSettingsTab('wallet')}
                    className={`w-full text-left py-2 px-3 rounded transition-colors ${
                      activeSettingsTab === 'wallet' 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    style={{ fontFamily: 'LemonMilk, sans-serif' }}
                  >
                    💰 Wallet
                  </button>

                  <button
                    onClick={() => setActiveSettingsTab('profile')}
                    className={`w-full text-left py-2 px-3 rounded transition-colors ${
                      activeSettingsTab === 'profile' 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    style={{ fontFamily: 'LemonMilk, sans-serif' }}
                  >
                    👤 Profile
                  </button>

                  <button
                    onClick={() => setActiveSettingsTab('game')}
                    className={`w-full text-left py-2 px-3 rounded transition-colors ${
                      activeSettingsTab === 'game' 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    style={{ fontFamily: 'LemonMilk, sans-serif' }}
                  >
                    🎮 Game
                  </button>
                </div>
              </div>

              {/* Tab Content - Desktop */}
              <div className="w-3/4 p-6 overflow-y-auto max-h-[70vh]">
                
                {/* Wallet Tab */}
                {activeSettingsTab === 'wallet' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">Wallet Management</h3>
              
              {/* Wallet Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-green-300 mb-3">Wallet Information</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-green-500 mb-1">Connected Wallet:</p>
                    <p className="text-xs text-white font-mono break-all">
                      {connectedWallet || 'Not Connected (Demo Mode)'}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-green-500 mb-1">THC Dope Wars SOL Wallet:</p>
                    <p className="text-xs text-white font-mono break-all">
                      {serverWallet || 'Creating wallet...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Balances */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-green-300 mb-3">Token Balances</h3>
                <div className="space-y-3">
                  <div className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-500">BUDZ Balance</p>
                      <p className="text-xs text-gray-400">In-Game Token</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">{budzBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-500">GBUX Balance</p>
                      <p className="text-xs text-gray-400">Swappable Token</p>
                    </div>
                    <p className="text-lg font-bold text-yellow-400">{gbuxBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Game Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-green-300 mb-3">Game Actions</h3>
                <div className="space-y-3">
                  {connectedWallet && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to logout? This will disconnect your wallet and return to the welcome screen.')) {
                          // Clear wallet connection
                          localStorage.removeItem('connectedWallet');
                          localStorage.removeItem('serverWallet');
                          localStorage.removeItem('walletType');
                          
                          // Reset states
                          setConnectedWallet('');
                          setServerWallet('');
                          setBudzBalance(0);
                          setGbuxBalance(0);
                          setShowWelcomeScreen(true);
                          setShowSettingsModal(false);
                          
                          // Reset game state to fresh start
                          setGameState({
                            money: 0,
                            debt: 0,
                            health: 100,
                            day: 1,
                            currentCity: 'hometown',
                            coatSpace: 100,
                            reputation: 0,
                            timeLeftInDay: 600,
                            isWorking: false,
                            workDaysLeft: 0,
                            daysWorkedThisWeek: 0,
                            weekStartDay: 1,
                            bankAccount: 0,
                            skills: {},
                            totalTransactions: 0,
                            totalProfit: 0,
                            highestDailyProfit: 0,
                            citiesVisited: ['hometown'],
                            dealsCompleted: 0,
                            timesRobbed: 0,
                            timesArrested: 0,
                            loansRepaid: 0,
                            maxConcurrentDebt: 0
                          });
                          
                          alert('Successfully logged out! Connect a wallet to play again.');
                        }
                      }}
                      className="w-full py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                      style={{ fontFamily: 'LemonMilk, sans-serif' }}
                    >
                      🚪 Logout & Disconnect Wallet
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setPhysicsEnabled(!physicsEnabled);
                    }}
                    className={`w-full py-3 px-6 font-bold rounded-lg transition-colors ${
                      physicsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                    }`}
                    style={{ fontFamily: 'LemonMilk, sans-serif' }}
                  >
                    ⚡ FX Effects {physicsEnabled ? 'ON' : 'OFF'}
                  </button>
                  

                  
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-green-500 mb-1">Leaderboard Info:</p>
                    <p className="text-xs text-gray-400">
                      Complete 45 days to post your score. Top 10 players get daily BUDZ rewards!
                    </p>
                  </div>
                </div>
              </div>
                  </div>
                )}



                {/* Game Tab */}
                {activeSettingsTab === 'game' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">Game Stats & Settings</h3>
                    
                    {/* Game Settings */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-green-400 font-bold mb-3">⚙️ Settings</h4>
                      <button
                        onClick={() => {
                          setPhysicsEnabled(!physicsEnabled);
                        }}
                        className={`w-full py-3 px-6 font-bold rounded-lg transition-colors ${
                          physicsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                        style={{ fontFamily: 'LemonMilk, sans-serif' }}
                      >
                        ⚡ FX Effects {physicsEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Current Game Status */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
                      <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                        <span>🎮</span> Current Game Status
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Day:</span>
                            <span className="text-white font-bold">{gameState.day}/45</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Money:</span>
                            <span className="text-green-400 font-bold">${gameState.money.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Bank:</span>
                            <span className="text-blue-400">${gameState.bankAccount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Debt:</span>
                            <span className="text-red-400">${gameState.debt.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Health:</span>
                            <span className={`font-bold ${gameState.health > 80 ? 'text-green-400' : gameState.health > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {gameState.health}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">City:</span>
                            <span className="text-white capitalize">{gameState.currentCity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Heat:</span>
                            <span className={`font-bold ${gameState.heat >= 4 ? 'text-red-400' : gameState.heat >= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {'★'.repeat(gameState.heat || 0)}{'☆'.repeat(5 - (gameState.heat || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Reputation:</span>
                            <span className="text-purple-400">{gameState.reputation}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ad Revenue Tracking */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
                      <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                        <span>📺</span> Advertisement Revenue
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Ads Watched:</span>
                            <span className="text-purple-400 font-bold">{gameState.totalAdsWatched || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Work Ad Status:</span>
                            <span className={`font-bold ${gameState.watchedWorkAd ? 'text-green-400' : 'text-yellow-400'}`}>
                              {gameState.watchedWorkAd ? 'Watched' : 'Available'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Ad Earnings:</span>
                            <span className="text-green-400 font-bold">${(gameState.adBonusEarnings || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Avg Per Ad:</span>
                            <span className="text-blue-400">
                              ${gameState.totalAdsWatched ? Math.round((gameState.adBonusEarnings || 0) / gameState.totalAdsWatched) : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trading Stats */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                        <span>📊</span> Trading Performance
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total Transactions:</span>
                            <span className="text-white">{gameState.totalTransactions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Deals Completed:</span>
                            <span className="text-white">{gameState.dealsCompleted || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Cities Visited:</span>
                            <span className="text-white">{gameState.citiesVisited?.length || 1}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total Profit:</span>
                            <span className="text-green-400">${gameState.totalProfit?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Best Day:</span>
                            <span className="text-green-400">${gameState.highestDailyProfit?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Times Robbed:</span>
                            <span className="text-red-400">{gameState.timesRobbed || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Assistant & NFT Bonuses */}
                    {(() => {
                      // Use universal NFT loading system to check for selected NFT
                      const selectedNFT = connectedWallet ? (() => {
                        try {
                          const keys = [
                            'selectedPlugNft',
                            `theplug_nft_${connectedWallet}`,
                            `selectedNFT_${connectedWallet}`,
                            'selectedAssistant'
                          ];
                          
                          for (const key of keys) {
                            const stored = localStorage.getItem(key);
                            if (stored) {
                              const nftData = JSON.parse(stored);
                              if (nftData?.mint && nftData?.name) {
                                return nftData;
                              }
                            }
                          }
                          return null;
                        } catch (error) {
                          return null;
                        }
                      })() : null;

                      return selectedNFT ? (
                        <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
                          <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                            <span>🤖</span> The Plug AI Assistant
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Selected NFT:</span>
                              <span className="text-white font-bold">{selectedNFT.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Rarity Rank:</span>
                              <span className="text-yellow-400">#{selectedNFT.rank || 'N/A'}</span>
                            </div>
                            {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                              <>
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="text-gray-400 text-xs mb-2">Active Trait Bonuses:</div>
                                  <div className="space-y-1">
                                    {selectedNFT.attributes.slice(0, 4).map((attr, index) => (
                                      <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-300">{attr.trait_type}:</span>
                                        <span className="text-green-400 font-bold">+15% {attr.trait_type.toLowerCase()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">AI Chats:</span>
                              <span className="text-blue-400">{gameState.aiChatCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-500">
                          <h4 className="text-gray-400 font-bold mb-3 flex items-center gap-2">
                            <span>🤖</span> The Plug AI Assistant
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="text-center py-4">
                              <p className="text-gray-400 mb-2">No AI Assistant Selected</p>
                              <p className="text-xs text-gray-500">
                                Select a GROWERZ NFT to activate The Plug AI assistant
                              </p>
                              <button
                                onClick={() => setShowAIAssistant(true)}
                                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-colors"
                              >
                                Select The Plug
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Smoking & Enhancement Stats */}
                    {(gameState.strainsSmoked?.length > 0 || smokingBuffs?.active) && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                        <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                          <span>🌿</span> Cannabis Enhancement
                        </h4>
                        <div className="space-y-3 text-sm">
                          {smokingBuffs?.active && (
                            <div className="bg-green-900 p-2 rounded border border-green-500">
                              <div className="flex justify-between items-center">
                                <span className="text-green-300 font-bold">Active Strain:</span>
                                <span className="text-white">{smokingBuffs.drug}</span>
                              </div>
                              {smokingBuffs.traits && smokingBuffs.traits.length > 0 && (
                                <div className="mt-1 text-xs text-green-200">
                                  Effects: {smokingBuffs.traits.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-300">Strains Tried:</span>
                            <span className="text-white">{gameState.strainsSmoked?.length || 0}/8</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Consecutive Days:</span>
                            <span className="text-white">{gameState.consecutiveSmokingDays || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Achievement Progress */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                        <span>🏆</span> Achievement Progress
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Unlocked:</span>
                            <span className="text-yellow-400 font-bold">0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Available:</span>
                            <span className="text-white">70</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">BUDZ Earned:</span>
                            <span className="text-green-400 font-bold">0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Completion:</span>
                            <span className="text-purple-400">
                              0%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Tab */}
                {activeSettingsTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-green-400 mb-4">User Profile & Authentication</h3>
                    
                    {/* Current Wallet Status */}
                    {connectedWallet && (
                      <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                        <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                          <span>👤</span> Current Profile
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Wallet Address:</span>
                            <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                              {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-8)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">THC Dope Budz Wallet:</span>
                            <span className="text-blue-400 font-mono text-xs">
                              {serverWallet || 'Generating...'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Connection Type:</span>
                            <span className="text-green-400 font-bold">Web3 Wallet</span>
                          </div>
                          {connectedWallet && (
                            <>
                              <div className="border-t border-gray-600 pt-2 mt-2">
                                <div className="text-gray-400 text-xs mb-2">Token Balances:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">BUDZ:</span>
                                    <span className="text-yellow-400">{budzBalance?.toLocaleString() || '0'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">GBUX:</span>
                                    <span className="text-green-400">{gbuxBalance?.toLocaleString() || '0'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">THC LABZ:</span>
                                    <span className="text-purple-400">{thcGrowerTokenBalance?.toLocaleString() || '0'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-300">SOL:</span>
                                    <span className="text-blue-400">0.0000</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Authentication Methods */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-green-400 font-bold mb-3">🔐 Authentication Methods</h4>
                      <div className="space-y-3">
                        
                        {/* Wallet Authentication */}
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔗</span>
                            <div>
                              <div className="text-white font-medium">Solana Wallet</div>
                              <div className="text-xs text-gray-400">
                                {connectedWallet ? 'Connected' : 'Not connected'}
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded text-xs font-bold ${
                            connectedWallet ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {connectedWallet ? 'ACTIVE' : 'INACTIVE'}
                          </div>
                        </div>

                        {/* Email Authentication */}
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📧</span>
                            <div>
                              <div className="text-white font-medium">Email OTP</div>
                              <div className="text-xs text-gray-400">Email verification system</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              alert('Email OTP system will be implemented. This allows users to authenticate via email verification codes.');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                          >
                            SETUP
                          </button>
                        </div>

                        {/* Phone Authentication */}
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📱</span>
                            <div>
                              <div className="text-white font-medium">Phone OTP</div>
                              <div className="text-xs text-gray-400">SMS verification system</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              alert('Phone OTP system will be implemented. This allows users to authenticate via SMS verification codes.');
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold"
                          >
                            SETUP
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Profile Actions */}
                    {connectedWallet && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-green-400 font-bold mb-3">⚙️ Profile Actions</h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              if (updateWalletBalances) {
                                updateWalletBalances();
                                alert('Wallet balances refreshed!');
                              }
                            }}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm"
                          >
                            🔄 Refresh Balances
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('This will disconnect your wallet and clear all local data. Continue?')) {
                                // Clear all wallet data
                                setConnectedWallet('');
                                setServerWallet('');
                                setBudzBalance(0);
                                setGbuxBalance(0);
                                setThcGrowerTokenBalance(0);
                                localStorage.clear();
                                alert('Wallet disconnected successfully!');
                              }
                            }}
                            className="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded transition-colors text-sm"
                          >
                            🚪 Disconnect Wallet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Mobile Tab Content Area */}
            <div className="sm:hidden p-3 overflow-y-auto max-h-[80vh]">
              
              {/* Mobile Wallet Tab */}
              {activeSettingsTab === 'wallet' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-green-400 mb-3">Wallet Management</h3>
              
                {/* Mobile Wallet Information */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-green-300 mb-2">Wallet Information</h4>
                  <div className="space-y-2">
                    <div className="bg-gray-800 p-2 rounded-lg">
                      <p className="text-xs text-green-500 mb-1">Connected Wallet:</p>
                      <p className="text-xs text-white font-mono break-words">
                        {connectedWallet || 'Not Connected (Demo Mode)'}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-2 rounded-lg">
                      <p className="text-xs text-green-500 mb-1">THC Dope Wars SOL Wallet:</p>
                      <p className="text-xs text-white font-mono break-words">
                        {serverWallet || 'Creating wallet...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Token Balances */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-green-300 mb-2">Token Balances</h4>
                  <div className="space-y-2">
                    <div className="bg-gray-800 p-2 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-green-500">BUDZ Balance</p>
                        <p className="text-xs text-gray-400">In-Game Token</p>
                      </div>
                      <p className="text-sm font-bold text-green-400">{budzBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-800 p-2 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs text-green-500">GBUX Balance</p>
                        <p className="text-xs text-gray-400">Swappable Token</p>
                      </div>
                      <p className="text-sm font-bold text-yellow-400">{gbuxBalance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Game Actions */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-green-300 mb-2">Game Actions</h4>
                  <div className="space-y-2">
                    {connectedWallet && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to logout? This will disconnect your wallet and return to the welcome screen.')) {
                            localStorage.removeItem('connectedWallet');
                            localStorage.removeItem('serverWallet'); 
                            localStorage.removeItem('walletType');
                            
                            setConnectedWallet('');
                            setServerWallet('');
                            setBudzBalance(0);
                            setGbuxBalance(0);
                            setShowWelcomeScreen(true);
                            setShowSettingsModal(false);
                            
                            setGameState({
                              money: 0,
                              debt: 0,
                              health: 100,
                              day: 1,
                              currentCity: 'hometown',
                              coatSpace: 100,
                              reputation: 0,
                              timeLeftInDay: 600,
                              isWorking: false,
                              workDaysLeft: 0,
                              daysWorkedThisWeek: 0,
                              weekStartDay: 1,
                              bankAccount: 0,
                              skills: {},
                              totalTransactions: 0,
                              totalProfit: 0,
                              highestDailyProfit: 0,
                              citiesVisited: ['hometown'],
                              dealsCompleted: 0,
                              timesRobbed: 0,
                              timesArrested: 0,
                              loansRepaid: 0,
                              maxConcurrentDebt: 0
                            });
                            
                            alert('Successfully logged out! Connect a wallet to play again.');
                          }
                        }}
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-xs"
                      >
                        🚪 Logout & Disconnect Wallet
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setPhysicsEnabled(!physicsEnabled);
                      }}
                      className={`w-full py-2 px-4 font-bold rounded-lg transition-colors text-xs ${
                        physicsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      ⚡ FX Effects {physicsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                </div>
              )}

              {/* Mobile Game Tab */}
              {activeSettingsTab === 'game' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-green-400 mb-3">Game Stats & Settings</h3>
                  
                  {/* Mobile Game Settings */}
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="text-green-400 font-bold mb-2 text-xs">⚙️ Settings</h4>
                    <button
                      onClick={() => {
                        setPhysicsEnabled(!physicsEnabled);
                      }}
                      className={`w-full py-2 px-4 font-bold rounded-lg transition-colors text-xs ${
                        physicsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      ⚡ FX Effects {physicsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Mobile Current Game Status */}
                  <div className="bg-gray-800 p-3 rounded-lg border border-blue-500">
                    <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2 text-xs">
                      <span>🎮</span> Current Game Status
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Day:</span>
                          <span className="text-white font-bold">{gameState.day}/45</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Money:</span>
                          <span className="text-green-400 font-bold">${gameState.money.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Bank:</span>
                          <span className="text-blue-400">${gameState.bankAccount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Debt:</span>
                          <span className="text-red-400">${gameState.debt.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Health:</span>
                          <span className={`font-bold ${gameState.health > 80 ? 'text-green-400' : gameState.health > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {gameState.health}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">City:</span>
                          <span className="text-white capitalize text-xs break-words">{gameState.currentCity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Heat:</span>
                          <span className={`font-bold ${gameState.heat >= 4 ? 'text-red-400' : gameState.heat >= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {'★'.repeat(gameState.heat || 0)}{'☆'.repeat(5 - (gameState.heat || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Rep:</span>
                          <span className="text-purple-400 text-xs">{gameState.reputation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Profile Tab */}
              {activeSettingsTab === 'profile' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-green-400 mb-3">User Profile & Authentication</h3>
                  
                  {/* Mobile Current Wallet Status */}
                  {connectedWallet && (
                    <div className="bg-gray-800 p-3 rounded-lg border border-green-500">
                      <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2 text-xs">
                        <span>👤</span> Current Profile
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Wallet Address:</span>
                          <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded break-words">
                            {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-8)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">THC Dope Budz Wallet:</span>
                          <span className="text-blue-400 font-mono text-xs break-words">
                            {serverWallet || 'Generating...'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Connection Type:</span>
                          <span className="text-green-400 font-bold">Web3 Wallet</span>
                        </div>
                        {connectedWallet && (
                          <>
                            <div className="border-t border-gray-600 pt-2 mt-2">
                              <div className="text-gray-400 text-xs mb-2">Token Balances:</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-300">BUDZ:</span>
                                  <span className="text-yellow-400">{budzBalance?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">GBUX:</span>
                                  <span className="text-green-400">{gbuxBalance?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">THC LABZ:</span>
                                  <span className="text-purple-400">{thcGrowerTokenBalance?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-300">SOL:</span>
                                  <span className="text-blue-400">0.0000</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}

      {/* Lifetime Leaderboard Modal */}
      {showLifetimeLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-purple-400 p-6 max-w-lg w-full rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-4" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                🏆 Lifetime Leaderboard
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                All-time high scores preserved for posterity. Daily leaderboard clears after rewards.
              </p>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lifetimeLeaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No lifetime scores yet</p>
                ) : (
                  lifetimeLeaderboard.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`p-3 rounded-lg flex justify-between items-center ${
                        index === 0 ? 'bg-yellow-900 border border-yellow-600' :
                        index === 1 ? 'bg-gray-700 border border-gray-500' :
                        index === 2 ? 'bg-orange-900 border border-orange-600' :
                        'bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <div className="text-white font-bold">{entry.name}</div>
                          <div className="text-xs text-gray-400">
                            Day {entry.day} • {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                          {entry.walletAddress && (
                            <div className="text-xs text-purple-400 font-mono">
                              {entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-4)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-lg">
                          ${entry.score.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLifetimeLeaderboard(false)}
                className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal - Web3 Connection */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-purple-400 p-6 max-w-lg w-full rounded-lg my-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                <img src="/thz-logo.png" alt="THC GROWERZ" className="w-8 h-8" />
                Web3 Wallet Manager
              </h2>
              
              {!connectedWallet ? (
                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-purple-300 mb-2">Connect Your Wallet</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Connect your Solana wallet to earn BUDZ tokens from leaderboard rewards and participate in Web3 features.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-green-400">✓ Daily leaderboard rewards in BUDZ tokens</p>
                      <p className="text-xs text-green-400">✓ Server-side wallet creation for security</p>
                      <p className="text-xs text-green-400">✓ Token swapping between BUDZ and GBUX</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-purple-300 mb-2">Token Info</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">BUDZ Token:</span>
                        <span className="text-xs text-green-400 font-mono">2i7T...nsiQ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">GBUX Token:</span>
                        <span className="text-xs text-yellow-400 font-mono">55Tp...nray</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {detectedWallets.length > 0 ? (
                      detectedWallets.map((wallet) => (
                        <button
                          key={wallet}
                          onClick={() => connectWallet(wallet)}
                          disabled={isConnectingWallet}
                          className={`w-full py-3 px-6 ${
                            isConnectingWallet 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-purple-600 hover:bg-purple-500'
                          } text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2`}
                          style={{ fontFamily: 'LemonMilk, sans-serif' }}
                        >
                          {isConnectingWallet ? 'Connecting...' : `🔗 Connect ${wallet} Wallet`}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-red-400 mb-3">No Solana wallets detected</p>
                        <p className="text-gray-400 text-sm mb-3">Install any supported wallet:</p>
                        <div className="text-xs text-purple-400 space-y-1">
                          <p>• Phantom (phantom.app)</p>
                          <p>• Magic Eden (magiceden.io)</p>
                          <p>• Solflare (solflare.com)</p>
                          <p>• Backpack (backpack.app)</p>
                        </div>
                        <p className="text-gray-400 text-sm mt-3">Refresh after installation</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-full overflow-y-auto">
                  <div className="space-y-4">
                    {/* Connected Wallet Section */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-purple-400 mb-2">Connected SOL Wallet</h3>
                      <p className="text-xs text-purple-200 font-mono break-all mb-2">{connectedWallet}</p>
                      <p className="text-xs text-gray-400">Your main Solana wallet for game access</p>
                    </div>

                    {/* Server Wallet Section */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-green-400 mb-2">THC Dope Budz Wallet</h3>
                      <p className="text-xs text-green-200 font-mono break-all mb-2">{serverWallet}</p>
                      <p className="text-xs text-gray-400">THC Dope Budz managed wallet for rewards and BUDZ distribution</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Token Balances */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-yellow-400 mb-3">Token Balances</h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-xs text-green-400 font-semibold">BUDZ</p>
                          <p className="text-sm font-bold text-green-300 break-all">{budzBalance.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">${(budzPrice * budzBalance).toFixed(6)}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-xs text-blue-400 font-semibold">GBUX</p>
                          <p className="text-sm font-bold text-blue-300 break-all">{gbuxBalance.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">${(gbuxPrice * gbuxBalance).toFixed(6)}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-xs text-purple-400 font-semibold">THC LABZ</p>
                          <p className="text-sm font-bold text-purple-300 break-all">{thcGrowerTokenBalance.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">${(0.001 * thcGrowerTokenBalance).toFixed(4)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Token Prices */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-yellow-400 mb-2">Live Token Prices</h3>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-green-400">BUDZ/USD:</p>
                          <p className="text-white">${budzPrice > 0 ? budzPrice.toFixed(8) : '0.00001230'}</p>
                        </div>
                        <div>
                          <p className="text-blue-400">GBUX/USD:</p>
                          <p className="text-white">${gbuxPrice > 0 ? gbuxPrice.toFixed(8) : '0.00001230'}</p>
                          <p className="text-xs text-gray-500">Live via Helius API</p>
                        </div>
                        <div>
                          <p className="text-purple-400">THC LABZ:</p>
                          <p className="text-white">$0.001000</p>
                          <p className="text-xs text-gray-500">Min. price via Helius</p>
                        </div>
                      </div>
                      <div className="flex justify-center mt-3">
                        <button
                          onClick={forceUpdatePrices}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded text-sm transition-colors"
                        >
                          🔄 Update Prices Now
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <p>• Auto-updates every 6 minutes for NFT users</p>
                        <p>• Standby mode conserves API limits</p>
                      </div>
                    </div>

                    {/* Token Swap Section */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-orange-400 mb-3">Token Swap (1:1 Ratio)</h3>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSwapDirection('budz-to-thc')}
                            className={`flex-1 py-2 px-3 rounded text-sm ${
                              swapDirection === 'budz-to-thc' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            BUDZ → THC
                          </button>
                          <button
                            onClick={() => setSwapDirection('gbux-to-thc')}
                            className={`flex-1 py-2 px-3 rounded text-sm ${
                              swapDirection === 'gbux-to-thc' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            GBUX → THC
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSwapDirection('budz-to-gbux')}
                            className={`flex-1 py-2 px-3 rounded text-sm ${
                              swapDirection === 'budz-to-gbux' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            BUDZ → GBUX
                          </button>
                          <button
                            onClick={() => setSwapDirection('gbux-to-budz')}
                            className={`flex-1 py-2 px-3 rounded text-sm ${
                              swapDirection === 'gbux-to-budz' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            GBUX → BUDZ
                          </button>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSwapDirection('thc-to-budz')}
                            className={`w-full py-2 px-3 rounded text-sm ${
                              swapDirection === 'thc-to-budz' 
                                ? 'bg-yellow-600 text-white' 
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            THC LABZ → BUDZ
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max={
                              swapDirection === 'budz-to-gbux' || swapDirection === 'budz-to-thc' ? budzBalance 
                              : swapDirection === 'gbux-to-budz' || swapDirection === 'gbux-to-thc' ? gbuxBalance
                              : swapDirection === 'thc-to-budz' ? thcGrowerTokenBalance
                              : 0
                            }
                            value={swapAmount || ''}
                            onChange={(e) => setSwapAmount(parseInt(e.target.value) || 0)}
                            placeholder="Amount to swap"
                            className="flex-1 bg-gray-900 border border-gray-600 p-2 text-white rounded"
                          />
                          <button
                            onClick={() => setSwapAmount(
                              swapDirection === 'budz-to-gbux' || swapDirection === 'budz-to-thc' ? budzBalance 
                              : swapDirection === 'gbux-to-budz' || swapDirection === 'gbux-to-thc' ? gbuxBalance
                              : swapDirection === 'thc-to-budz' ? thcGrowerTokenBalance
                              : 0
                            )}
                            className="bg-gray-600 hover:bg-gray-500 px-3 py-2 text-sm rounded"
                          >
                            MAX
                          </button>
                        </div>

                        <div className="text-xs text-gray-400">
                          {swapDirection === 'budz-to-gbux' 
                            ? `Burn ${swapAmount} BUDZ → Receive ${Math.floor(swapAmount / 10)} GBUX (10:1 rate, AI Agent processes)`
                            : swapDirection === 'gbux-to-budz'
                            ? `Burn ${swapAmount} GBUX → Receive ${swapAmount * 10} BUDZ (1:10 rate, AI Agent processes)`
                            : swapDirection === 'budz-to-thc'
                            ? `Burn ${swapAmount} BUDZ → Receive ${Math.floor(Math.floor(swapAmount / 81.3) * 0.97)} THC LABZ ($0.001 each, 3% AI fee)`
                            : swapDirection === 'gbux-to-thc'
                            ? `Send ${swapAmount} GBUX to AI → Receive ${Math.floor(Math.floor(swapAmount / 81.3) * 0.97)} THC LABZ ($0.001 each, 3% AI fee)`
                            : swapDirection === 'thc-to-budz'
                            ? `Send ${swapAmount} THC LABZ → Receive ${Math.floor(swapAmount * 81.3 * 0.95)} BUDZ (81.3:1 rate)`
                            : ''
                          }
                        </div>

                        <button
                          onClick={executeTokenSwap}
                          disabled={isSwapping || swapAmount <= 0}
                          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                        >
                          {isSwapping ? 'Processing Swap...' : '🔄 Execute Swap (3% AI Agent Fee)'}
                        </button>
                      </div>
                    </div>

                    {/* AI Agent Info */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-red-400 mb-2">AI Agent Services</h3>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>🤖 Agent Wallet: ErSG...ZT65</p>
                        <p>💰 Off-boarding Fee: 3% per transaction</p>
                        <p>🔥 BUDZ burns to SOL burn address</p>
                        <p>⚡ GBUX burns to AI Agent for game economy</p>
                        <p>📊 Prices based on GBUX/SOL on-chain data</p>
                      </div>
                    </div>

                    <button
                      onClick={updateWalletBalances}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                      disabled={isLoadingBalances}
                    >
                      {isLoadingBalances ? 'Updating...' : '🔄 Refresh All Balances & Prices'}
                    </button>
                  </div>

                  {/* User Selected NFT from GROWERZ Collection */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-green-300 mb-2">👤 User Selected NFT from GROWERZ Collection</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Click any NFT below to set as your "The Plug" AI assistant avatar
                    </p>
                    <GrowerNFTsDisplay walletAddress={connectedWallet} key={connectedWallet} />
                  </div>

                  {/* Leaderboard Info */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-green-300 mb-2">Leaderboard Info</h3>
                    <p className="text-sm text-gray-400">
                      Complete 45 days and submit your score to compete for daily BUDZ rewards. 
                      Top 10 players earn between 100-1000 BUDZ tokens daily at midnight CST.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={disconnectWallet}
                className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                🔌 Disconnect Wallet
              </button>
              <button
                onClick={() => setShowWalletModal(false)}
                className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-green-400 p-6 max-w-4xl w-full rounded-lg max-h-[95vh] overflow-y-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-green-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  🍃 THC Labz Dope Budz
                </h2>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* Hero Image */}
              <div 
                className="w-full h-32 bg-cover bg-center rounded-lg mb-6"
                style={{
                  backgroundImage: 'url(/attached_assets/THC_banner_1752098551109.png)',
                }}
              ></div>
              
              <div className="text-green-300 text-lg mb-6">
                🚀 <strong>The most immersive Web3 cannabis empire game</strong> featuring real blockchain rewards, NFT-powered AI assistants, and 70 achievements worth up to 1,400 BUDZ tokens per round! Experience the underground economy like never before.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Game Overview */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  🎮 Game Overview
                </h3>
                <ul className="text-green-300 space-y-2 text-sm">
                  <li>• <strong>⚡ Challenging Mode:</strong> Start with only $20 and 5 coat space - survival difficulty!</li>
                  <li>• <strong>🤖 AI Command Center:</strong> Advanced AI missions, special products, and delivery operations</li>
                  <li>• <strong>📊 Price Intelligence:</strong> Chart.js graphs showing real-time city pricing analytics</li>
                  <li>• <strong>🎯 70 Achievement System:</strong> Earn up to 1,400 BUDZ per round + completion bonus</li>
                  <li>• <strong>🏆 Daily Championships:</strong> Top 10 players get 100-1000 BUDZ daily at midnight CST</li>
                  <li>• <strong>🌍 16 Unique Cities:</strong> From Miami beaches to Detroit streets, each with distinct markets</li>
                  <li>• <strong>💰 Scaling Work Rewards:</strong> Ad monetization system with consecutive viewing bonuses</li>
                  <li>• <strong>💎 Multi-Token Economy:</strong> BUDZ, GBUX, THC LABZ integration with real Solana contracts</li>
                </ul>
              </div>

              {/* How to Play */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  🚀 How to Play - Challenging Mode
                </h3>
                <ol className="text-green-300 space-y-2 text-sm">
                  <li><strong>1. 🔗 Connect & Create:</strong> Link Solana wallet to get your THC Dope Budz server wallet</li>
                  <li><strong>2. ⚡ Survive the Start:</strong> Begin with only $20 and 5 coat space - every decision matters!</li>
                  <li><strong>3. 💪 Earn Through Work:</strong> Watch ads for $500+ rewards, scaling with consecutive views</li>
                  <li><strong>4. 🤖 AI-Powered Strategy:</strong> Access Command Center for AI missions, special products & delivery operations</li>
                  <li><strong>5. 🌿 Smart Trading:</strong> Use City Price Intelligence graphs to find profitable trade routes</li>
                  <li><strong>6. 🎯 Achievement Hunt:</strong> Complete 70 challenges for massive BUDZ rewards (up to 1,400 per round)</li>
                  <li><strong>7. 🏃‍♂️ Expand Carefully:</strong> Travel costs are factual US distances - manage your resources wisely</li>
                  <li><strong>8. 🏆 Dominate Leaderboards:</strong> Submit 45-day scores for daily token rewards (Top 10 get 100-1000 BUDZ)</li>
                </ol>
              </div>

              {/* Strain Gallery */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  🌿 Premium Strains
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Reggie', img: '/attached_assets/Regz_1752183158112.jpg' },
                    { name: 'OG Kush', img: '/attached_assets/OGKush_1752183385525.jpg' },
                    { name: 'Sour Diesel', img: '/attached_assets/SourDiesel2_1752185001725.jpg' },
                    { name: 'Purple Haze', img: '/attached_assets/purplehaze_1752183464779.jpg' },
                  ].map((strain) => (
                    <div key={strain.name} className="text-center">
                      <div 
                        className="w-full h-20 bg-cover bg-center rounded border border-green-400"
                        style={{ backgroundImage: `url(${strain.img})` }}
                      ></div>
                      <p className="text-green-300 text-xs mt-1">{strain.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Features */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  ⭐ Game Features
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">Trading</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>• Market dynamics</li>
                      <li>• Price fluctuations</li>
                      <li>• Bulk trading</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">Banking</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>• Secure deposits</li>
                      <li>• Loan system</li>
                      <li>• Interest rates</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">Command Center</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>• AI-powered missions</li>
                      <li>• Special products</li>
                      <li>• Enhanced SKILLZ</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">Work</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>• Ad monetization</li>
                      <li>• Scaling rewards</li>
                      <li>• Daily limits</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cities */}
              <div className="bg-gray-800 p-4 rounded-lg lg:col-span-2">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  🏙️ Trading Locations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    { city: 'Home Town', specialty: 'Safe starting area', risk: 'Low' },
                    { city: 'The NeighborHood', specialty: 'Local connections', risk: 'Medium' },
                    { city: 'Central Park', specialty: 'Tourist prices', risk: 'Low' },
                    { city: 'New York', specialty: 'High-end clientele', risk: 'Medium' },
                    { city: 'St. Louis', specialty: 'Midwest prices', risk: 'Medium' },
                    { city: 'Memphis', specialty: 'Southern market', risk: 'High' },
                    { city: 'Baltimore', specialty: 'East coast deals', risk: 'High' },
                    { city: 'Miami', specialty: 'Premium rates', risk: 'Low' },
                    { city: 'Atlanta', specialty: 'Southern hub', risk: 'Medium' },
                    { city: 'Detroit', specialty: 'Industrial prices', risk: 'High' },
                    { city: 'Kansas City', specialty: 'Central market', risk: 'Medium' },
                    { city: 'Houston', specialty: 'Oil money', risk: 'Low' },
                    { city: 'New Orleans', specialty: 'Party scene', risk: 'Medium' },
                    { city: 'Cleveland', specialty: 'Rust belt deals', risk: 'High' },
                    { city: 'Oakland', specialty: 'West coast prices', risk: 'High' },
                    { city: 'Denver', specialty: 'Mountain high', risk: 'Low' }
                  ].map((location) => (
                    <div key={location.city} className="bg-gray-700 p-3 rounded border border-green-400">
                      <h4 className="text-green-400 font-bold">{location.city}</h4>
                      <p className="text-green-300 text-xs">{location.specialty}</p>
                      <p className="text-yellow-400 text-xs">Risk: {location.risk}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards System */}
              <div className="bg-gray-800 p-4 rounded-lg lg:col-span-2">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  💰 Reward System
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-900 bg-opacity-30 p-3 rounded border border-yellow-400">
                    <h4 className="text-yellow-400 font-bold text-center">🥇 Top 3</h4>
                    <p className="text-center text-2xl font-bold text-yellow-400">1000 BUDZ</p>
                    <p className="text-center text-yellow-300 text-sm">Daily Champions</p>
                  </div>
                  <div className="bg-gray-700 bg-opacity-30 p-3 rounded border border-gray-400">
                    <h4 className="text-gray-300 font-bold text-center">🥈 Rank 4-7</h4>
                    <p className="text-center text-2xl font-bold text-gray-300">500 BUDZ</p>
                    <p className="text-center text-gray-400 text-sm">Strong Performers</p>
                  </div>
                  <div className="bg-orange-900 bg-opacity-30 p-3 rounded border border-orange-400">
                    <h4 className="text-orange-400 font-bold text-center">🥉 Rank 8-10</h4>
                    <p className="text-center text-2xl font-bold text-orange-400">100 BUDZ</p>
                    <p className="text-center text-orange-300 text-sm">Top 10 Club</p>
                  </div>
                </div>
                <div className="mt-4 bg-purple-900 bg-opacity-30 p-3 rounded border border-purple-400">
                  <p className="text-center text-purple-300">
                    <strong>⏰ Daily Payouts at Midnight CST</strong><br />
                    Complete 45 days • Submit your score • Compete for rewards
                  </p>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gray-800 p-4 rounded-lg lg:col-span-2">
                <h3 className="text-xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  💡 Pro Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">Trading Strategy</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>• Start in The Bronx for diverse options</li>
                      <li>• Buy when prices crash, sell at peaks</li>
                      <li>• Use your coat space efficiently</li>
                      <li>• Watch for market events and opportunities</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">Risk Management</h4>
                    <ul className="text-green-300 space-y-1">
                      <li>• Keep some money in the bank</li>
                      <li>• Don't max out your debt early</li>
                      <li>• Monitor your health carefully</li>
                      <li>• Work at McShitz when needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setShowAboutModal(false)}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                🚀 Start Playing!
              </button>
              <a 
                href="/thc-dope-budz-enhanced-advert.html" 
                target="_blank"
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 text-white font-bold rounded-lg transition-colors inline-block"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                📢 View Full Advert
              </a>
            </div>
          </div>
        </div>
      )}

      {/* The Plug AI Assistant */}
      <ThePlugAssistant 
        connectedWallet={connectedWallet}
        gameState={{
          currentCity: gameState.currentCity,
          day: gameState.day,
          money: gameState.money
        }}
        onMissionComplete={handleMissionComplete}
        smokingBuffs={smokingBuffs}
        onChatInteraction={() => {
          setGameState(prev => ({
            ...prev,
            aiChatCount: (prev.aiChatCount || 0) + 1
          }));
        }}
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onAvatarChange={setSelectedAssistantAvatar}
      />

      {/* Achievement Display Modal */}
      {showAchievements && connectedWallet && (
        <AchievementDisplay
          walletAddress={connectedWallet}
          gameRoundId={currentGameRoundId}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* Full-Screen Intro Video Player */}
      {showIntroVideo && (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
          <div className="relative w-full h-full">
            <video
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              controls={false}
              onLoadedData={(e) => {
                const video = e.target as HTMLVideoElement;
                console.log('🎬 Video loaded, attempting to play with sound...');
                // Set volume and try to play with sound
                video.volume = 0.8;
                video.muted = false;
                
                // User interaction is required for audio in most browsers
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.then(() => {
                    setVideoAudioEnabled(!video.muted);
                    console.log('🎬 Video playing with audio:', !video.muted);
                  }).catch(() => {
                    console.log('🎬 Autoplay with sound failed, trying muted...');
                    video.muted = true;
                    setVideoAudioEnabled(false);
                    return video.play();
                  });
                }
              }}
              onClick={(e) => {
                // Enable audio on user click
                const video = e.target as HTMLVideoElement;
                if (video.muted) {
                  video.muted = false;
                  setVideoAudioEnabled(true);
                  console.log('🎬 Audio enabled by user click');
                }
              }}
              onEnded={() => {
                console.log('🎬 Intro video completed');
                setShowIntroVideo(false);
                setHasPlayedIntro(true);
                setGameState(prev => ({ ...prev, money: 80 })); // Start with improved initial money
                
                // Mark intro as played for this wallet
                if (connectedWallet) {
                  const hasPlayedIntroKey = `introPlayed_${connectedWallet}`;
                  localStorage.setItem(hasPlayedIntroKey, 'true');
                }
              }}
              onError={(e) => {
                console.error('🎬 Error playing intro video:', e);
                setShowIntroVideo(false);
                setGameState(prev => ({ ...prev, money: 80 })); // Start with improved initial money
              }}
            >
              <source src="/attached_assets/SMOKEWEEDWITH_1752341770440.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Video Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  console.log('🎬 Intro video skipped by user');
                  setShowIntroVideo(false);
                  setHasPlayedIntro(true);
                  setGameState(prev => ({ ...prev, money: 80 })); // Start with improved initial money
                  
                  // Mark intro as played for this wallet
                  if (connectedWallet) {
                    const hasPlayedIntroKey = `introPlayed_${connectedWallet}`;
                    localStorage.setItem(hasPlayedIntroKey, 'true');
                  }
                }}
                className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg hover:bg-opacity-70 transition-opacity"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Skip Intro
              </button>
            </div>
            
            {/* Audio Enable Overlay */}
            {!videoAudioEnabled && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="bg-black bg-opacity-70 text-white p-4 rounded-lg text-center">
                  <div className="text-4xl mb-2">🔊</div>
                  <p className="text-lg font-bold mb-2" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                    Click to Enable Audio
                  </p>
                  <p className="text-sm text-gray-300">
                    Click anywhere on the video to unmute
                  </p>
                </div>
              </div>
            )}

            {/* THC Dope Budz Logo Overlay */}
            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                THC DOPE BUDZ
              </h2>
              <p className="text-lg" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                Welcome to the Game
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous AI Event System */}
      <AIEventSystem
        gameState={{
          currentCity: gameState.currentCity,
          day: gameState.day,
          money: gameState.money,
          heat: gameState.heat,
          reputation: gameState.reputation,
          inventory: Array.isArray(drugs) ? drugs.reduce((acc, drug) => ({ ...acc, [drug.name]: drug.owned }), {}) : {}
        }}
        onEventChoice={handleAIEventChoice}
        connectedWallet={connectedWallet}
        isActive={gameState.day <= 45 && gameState.health > 0}
      />

      {/* OpenAI Event Listener removed - AI status indicator no longer needed */}

      {/* Action Log Modal */}
      {showActionLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-green-400 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                Action Log
              </h2>
              <button
                onClick={() => setShowActionLog(false)}
                className="text-gray-300 hover:text-white text-2xl"
                title="Close action log"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 text-sm text-gray-300">
              <div className="flex justify-between items-center">
                <span>Total Actions: {actionLog.length}</span>
                <span>Current Day: {gameState.day}</span>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh] space-y-2">
              {actionLog.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No actions recorded yet</p>
                  <p className="text-sm">Start buying, selling, or traveling to see your action history</p>
                </div>
              ) : (
                actionLog.slice().reverse().map((action, index) => (
                  <div
                    key={`${action.day}-${action.time}-${index}`}
                    className={`p-3 rounded-lg border ${
                      action.type === 'buy' ? 'bg-red-900 bg-opacity-30 border-red-600' :
                      action.type === 'sell' ? 'bg-green-900 bg-opacity-30 border-green-600' :
                      action.type === 'travel' ? 'bg-blue-900 bg-opacity-30 border-blue-600' :
                      action.type === 'event' ? 'bg-orange-900 bg-opacity-30 border-orange-600' :
                      action.type === 'police' ? 'bg-red-900 bg-opacity-50 border-red-500' :
                      'bg-gray-800 bg-opacity-50 border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          action.type === 'buy' ? 'bg-red-600 text-white' :
                          action.type === 'sell' ? 'bg-green-600 text-white' :
                          action.type === 'travel' ? 'bg-blue-600 text-white' :
                          action.type === 'event' ? 'bg-orange-600 text-white' :
                          action.type === 'police' ? 'bg-red-500 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {action.type.toUpperCase()}
                        </span>
                        <span className="text-white font-medium">
                          {action.description}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <div>Day {action.day}</div>
                        <div>{action.time}</div>
                      </div>
                    </div>
                    
                    {/* Action Details */}
                    {action.details && Object.keys(action.details || {}).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-300 mt-2">
                        {action.details.item && (
                          <div>
                            <span className="text-gray-500">Item:</span> {action.details.item}
                          </div>
                        )}
                        {action.details.quantity && (
                          <div>
                            <span className="text-gray-500">Qty:</span> {action.details.quantity}
                          </div>
                        )}
                        {action.details.price && (
                          <div>
                            <span className="text-gray-500">Price:</span> ${action.details.price.toLocaleString()}
                          </div>
                        )}
                        {action.details.total && (
                          <div>
                            <span className="text-gray-500">Total:</span> ${action.details.total.toLocaleString()}
                          </div>
                        )}
                        {action.details.profit !== undefined && (
                          <div className={action.details.profit > 0 ? 'text-green-400' : 'text-red-400'}>
                            <span className="text-gray-500">Profit:</span> ${action.details.profit.toLocaleString()}
                          </div>
                        )}
                        {action.details.location && (
                          <div>
                            <span className="text-gray-500">Location:</span> {action.details.location}
                          </div>
                        )}
                        {action.details.fromCity && action.details.toCity && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Route:</span> {action.details.fromCity} → {action.details.toCity}
                          </div>
                        )}
                        {action.details.heatReduction && (
                          <div className="text-blue-400">
                            <span className="text-gray-500">Heat:</span> -{action.details.heatReduction}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
              <span>Most recent actions shown first</span>
              <button
                onClick={() => setShowActionLog(false)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Info Tab */}
      {showCharacterInfo && (
        <CharacterInfoTab
          gameState={gameState}
          connectedWallet={connectedWallet}
          selectedPlugNft={JSON.parse(localStorage.getItem('selectedPlugNft') || localStorage.getItem('selectedNFT') || localStorage.getItem('selectedAssistant') || 'null')}
          onClose={() => setShowCharacterInfo(false)}
          onSkillUpgrade={(skillName) => {
            handleSkillUpgrade(skillName);
          }}
          onSmokingSession={(strain) => {
            startSmokingSession(strain);
          }}
        />
      )}

      {/* Market Insights Modal */}
      {showMarketInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-purple-400 max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="sticky top-0 bg-gray-900 border-b border-purple-400 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                <BarChart3 className="w-6 h-6" />
                📊 {cities[gameState.currentCity as keyof typeof cities]} Market Analysis
              </h2>
              <button
                onClick={() => setShowMarketInsights(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Current Market Overview */}
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-400 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                  🏪 Current Market Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-black bg-opacity-40 p-3 rounded-lg">
                    <div className="text-green-400 text-lg font-bold">${gameState.money.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Your Cash</div>
                  </div>
                  <div className="bg-black bg-opacity-40 p-3 rounded-lg">
                    <div className="text-blue-400 text-lg font-bold">{gameState.coatSpace - (gameState.drugs || []).reduce((sum, drug) => sum + drug.quantity, 0)}</div>
                    <div className="text-xs text-gray-400">Free Space</div>
                  </div>
                  <div className="bg-black bg-opacity-40 p-3 rounded-lg">
                    <div className="text-yellow-400 text-lg font-bold">Day {gameState.day}</div>
                    <div className="text-xs text-gray-400">Game Progress</div>
                  </div>
                  <div className="bg-black bg-opacity-40 p-3 rounded-lg">
                    <div className="text-purple-400 text-lg font-bold">{gameState.heat}/5</div>
                    <div className="text-xs text-gray-400">Heat Level</div>
                  </div>
                </div>
              </div>

              {/* Available Products */}
              <div className="bg-gray-800 border border-green-400 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  🌿 Available Products
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(gameState.drugs || []).map((drug, index) => {
                    const currentPrice = gameState.drugPrices[drug.name] || 0;
                    const maxPrice = Math.max(...Object.values(gameState.drugPrices || {}));
                    const pricePercent = maxPrice > 0 ? (currentPrice / maxPrice) * 100 : 0;
                    const priceColor = pricePercent > 75 ? 'text-green-400' : pricePercent > 50 ? 'text-yellow-400' : 'text-red-400';
                    
                    return (
                      <div key={index} className="bg-gray-900 border border-gray-600 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">{drug.name}</div>
                          <div className={`font-bold ${priceColor}`}>
                            ${currentPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          You have: {drug.quantity} units
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${pricePercent > 75 ? 'bg-green-400' : pricePercent > 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${pricePercent}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Market strength: {pricePercent.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Market Trends */}
              <div className="bg-gray-800 border border-blue-400 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                  📈 Market Trends & Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-green-400 font-bold">Best Seller:</span>
                      <span className="ml-2 text-white">
                        {Object.entries(gameState.drugPrices || {}).length > 0 ? Object.entries(gameState.drugPrices || {}).reduce((a, b) => (gameState.drugPrices?.[a[0]] || 0) > (gameState.drugPrices?.[b[0]] || 0) ? a : b)[0] || 'None' : 'None'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-red-400 font-bold">Cheapest:</span>
                      <span className="ml-2 text-white">
                        {Object.entries(gameState.drugPrices || {}).length > 0 ? Object.entries(gameState.drugPrices || {}).reduce((a, b) => (gameState.drugPrices?.[a[0]] || 0) < (gameState.drugPrices?.[b[0]] || 0) ? a : b)[0] || 'None' : 'None'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-yellow-400 font-bold">Total Inventory Value:</span>
                      <span className="ml-2 text-white">
                        ${(gameState.drugs || []).reduce((sum, drug) => sum + (drug.quantity * (gameState.drugPrices[drug.name] || 0)), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-purple-400 font-bold">Potential Profit:</span>
                      <span className="ml-2 text-green-400">
                        +${(gameState.drugs || []).reduce((sum, drug) => sum + (drug.quantity * (gameState.drugPrices[drug.name] || 0) * 0.15), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trading Tips */}
              <div className="bg-gray-800 border border-yellow-400 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  💡 Trading Tips for {cities[gameState.currentCity as keyof typeof cities]}
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• Monitor price variations throughout the day for optimal selling opportunities</div>
                  <div>• Consider your coat space when planning bulk purchases</div>
                  <div>• Higher heat levels may affect your negotiation abilities</div>
                  <div>• Travel to different cities when local prices are unfavorable</div>
                  <div>• Keep some cash reserve for emergency situations</div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowMarketInsights(false)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
                  style={{ fontFamily: 'LemonMilk, sans-serif' }}
                >
                  Close Market Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Info Modal */}
      {showCityInfo && selectedCityInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-green-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-green-400 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-green-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                📍 {selectedCityInfo.name} - Market Intelligence
              </h2>
              <button
                onClick={() => setShowCityInfo(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Pricing Trends */}
              <div className="bg-gray-800 border border-blue-400 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                  📈 Market Pricing Trends
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedCityInfo.insights.pricingTrends}
                </p>
              </div>

              {/* Risk Level */}
              <div className="bg-gray-800 border border-red-400 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                  ⚠️ Risk Assessment
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedCityInfo.insights.riskLevel}
                </p>
              </div>

              {/* Reputation */}
              <div className="bg-gray-800 border border-purple-400 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                  🤝 Reputation & Networks
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedCityInfo.insights.reputation}
                </p>
              </div>

              {/* Market Specialty */}
              <div className="bg-gray-800 border border-yellow-400 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                  🎯 Market Specialty
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedCityInfo.insights.specialty}
                </p>
              </div>

              {/* Strategic Tips */}
              <div className="bg-gray-800 border border-green-400 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                  💡 Strategic Tips
                </h3>
                <ul className="space-y-2">
                  {selectedCityInfo.insights.tips.map((tip, index) => (
                    <li key={index} className="text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 text-sm">•</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-green-400 p-4 flex gap-3">
              <button
                onClick={() => {
                  setShowCityInfo(false);
                  if (selectedCityInfo.id !== gameState.currentCity && !gameState.isWorking) {
                    travelToCity(selectedCityInfo.id);
                  }
                }}
                disabled={selectedCityInfo.id === gameState.currentCity || gameState.isWorking}
                className={`flex-1 py-3 px-6 font-bold rounded-lg transition-colors ${
                  selectedCityInfo.id === gameState.currentCity
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : gameState.isWorking
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                {selectedCityInfo.id === gameState.currentCity 
                  ? '📍 Current Location' 
                  : gameState.isWorking
                  ? '🔒 Can\'t Travel (Working)'
                  : `✈️ Travel to ${selectedCityInfo.name}`
                }
              </button>
              <button
                onClick={() => setShowCityInfo(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Travel Animation Overlay */}
      <TravelAnimation />

      {/* Interactive Map Modal */}
      {showInteractiveMap && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-blue-500 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                🗺️ Interactive City Map
              </h3>
              <button
                onClick={() => setShowInteractiveMap(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6 text-center">
              <p className="text-gray-300 mb-2">Click any city to travel instantly or view detailed information</p>
              <p className="text-sm text-gray-400">Current Location: <span className="text-green-400 font-bold">{cities[gameState.currentCity as keyof typeof cities]}</span></p>
            </div>

            {/* Interactive Map Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(cities).map(([cityId, cityName]) => {
                const distance = cityId !== gameState.currentCity ? calculateDistance(gameState.currentCity, cityId) : 0;
                const cost = cityId !== gameState.currentCity ? calculateTravelCost(gameState.currentCity, cityId) : 0;
                const travelTime = distance > 0 ? Math.round((distance / 300) * 24) : 0;
                const isCurrentCity = cityId === gameState.currentCity;
                const canAfford = gameState.money >= cost;

                return (
                  <div
                    key={cityId}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                      isCurrentCity
                        ? 'bg-green-900 border-green-400 shadow-lg shadow-green-400/30'
                        : canAfford
                        ? 'bg-gray-800 border-blue-400 hover:border-blue-300 shadow-lg hover:shadow-blue-400/20'
                        : 'bg-red-900 border-red-500 opacity-60'
                    }`}
                    onMouseEnter={() => setHoveredCity(cityId)}
                    onMouseLeave={() => setHoveredCity('')}
                    onClick={() => {
                      if (!isCurrentCity && canAfford) {
                        setShowInteractiveMap(false);
                        travelToCity(cityId);
                      }
                    }}
                  >
                    {/* City Icon */}
                    <div className="text-center mb-3">
                      <div className="text-4xl mb-2">
                        {isCurrentCity ? '📍' : '🏙️'}
                      </div>
                      <h4 className="font-bold text-white text-lg">{cityName}</h4>
                    </div>

                    {/* City Info */}
                    <div className="text-center text-sm">
                      {isCurrentCity ? (
                        <div className="text-green-400 font-bold">You're Here</div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-gray-300">{distance} miles</div>
                          <div className="text-yellow-400">${cost}</div>
                          <div className="text-blue-400">{travelTime}h travel</div>
                          {!canAfford && (
                            <div className="text-red-400 text-xs">Need ${(cost - gameState.money).toLocaleString()} more</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover Tooltip */}
                    {hoveredCity === cityId && !isCurrentCity && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full bg-black border border-gray-400 rounded px-3 py-2 text-xs text-white z-10 whitespace-nowrap">
                        <div className="font-bold text-blue-400">{cityName}</div>
                        <div>Distance: {distance} miles</div>
                        <div>Cost: ${cost}</div>
                        <div>Travel Time: {travelTime} hours</div>
                        {canAfford ? (
                          <div className="text-green-400 mt-1">Click to travel</div>
                        ) : (
                          <div className="text-red-400 mt-1">Insufficient funds</div>
                        )}
                      </div>
                    )}

                    {/* Info Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInteractiveMap(false);
                        openCityInfo(cityId);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                      title={`View ${cityName} insights`}
                    >
                      ℹ️
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Map Legend */}
            <div className="border-t border-gray-600 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-400 font-bold mb-1">📍 Current Location</div>
                  <div className="text-gray-400">Your current city</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold mb-1">🏙️ Available Cities</div>
                  <div className="text-gray-400">Click to travel instantly</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-bold mb-1">🚫 Insufficient Funds</div>
                  <div className="text-gray-400">Need more money to travel</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Insights Modal */}
      {showMarketInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-purple-400 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                📊 Market Analysis - {cities[gameState.currentCity as keyof typeof cities]}
              </h2>
              <button
                onClick={() => setShowMarketInsights(false)}
                className="text-purple-400 hover:text-purple-300 text-2xl font-bold leading-none"
                title="Close Market Analysis"
              >
                ×
              </button>
            </div>

            {/* Current Market Overview */}
            <div className="mb-6 p-4 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-500">
              <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                📈 Market Trends & Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-green-400 font-bold">Best Seller:</span>
                    <span className="ml-2 text-white">
                      {(() => {
                        const priceEntries = Object.entries(gameState.drugPrices || {});
                        if (priceEntries.length === 0) return 'None';
                        const bestSeller = priceEntries.reduce((a, b) => (gameState.drugPrices?.[a[0]] || 0) > (gameState.drugPrices?.[b[0]] || 0) ? a : b);
                        return bestSeller[0] || 'None';
                      })()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-400 font-bold">Cheapest:</span>
                    <span className="ml-2 text-white">
                      {(() => {
                        const priceEntries = Object.entries(gameState.drugPrices || {});
                        if (priceEntries.length === 0) return 'None';
                        const cheapest = priceEntries.reduce((a, b) => (gameState.drugPrices?.[a[0]] || 0) < (gameState.drugPrices?.[b[0]] || 0) ? a : b);
                        return cheapest[0] || 'None';
                      })()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-yellow-400 font-bold">Total Inventory Value:</span>
                    <span className="ml-2 text-white">
                      ${(gameState.drugs || []).reduce((sum, drug) => sum + (drug.quantity * (gameState.drugPrices[drug.name] || 0)), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-purple-400 font-bold">Available Space:</span>
                    <span className="ml-2 text-white">
                      {gameState.coatSpace - (gameState.drugs || []).reduce((sum, drug) => sum + drug.quantity, 0)} / {gameState.coatSpace}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(gameState.drugPrices || {}).map(([drugName, price]) => {
                const drugInInventory = gameState.drugs.find(d => d.name === drugName);
                const owned = drugInInventory?.quantity || 0;
                const totalValue = owned * price;
                
                // Price strength indicator (0-100%)
                const maxPrice = Math.max(...Object.values(gameState.drugPrices || {}));
                const priceStrength = price > 0 ? (price / maxPrice) * 100 : 0;
                
                return (
                  <div
                    key={drugName}
                    className="bg-gray-800 border border-gray-600 p-4 rounded-lg hover:border-purple-400 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-white text-lg">{drugName}</h4>
                      <span className="text-2xl">💊</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Price:</span>
                        <span className="text-green-400 font-bold">${price.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Owned:</span>
                        <span className="text-white">{owned}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Value:</span>
                        <span className="text-yellow-400">${totalValue.toLocaleString()}</span>
                      </div>
                      
                      {/* Price Strength Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Market Strength</span>
                          <span className="text-purple-400">{Math.round(priceStrength)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              priceStrength >= 80 ? 'bg-green-500' :
                              priceStrength >= 60 ? 'bg-yellow-500' :
                              priceStrength >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${priceStrength}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trading Tips */}
            <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
              <h3 className="text-lg font-bold text-purple-400 mb-3">💡 Trading Tips for {cities[gameState.currentCity as keyof typeof cities]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-green-400 font-bold mb-2">Buy Strategy:</div>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Focus on products with low market strength</li>
                    <li>• Buy when prices are 20-30% below average</li>
                    <li>• Consider your coat space limitations</li>
                  </ul>
                </div>
                <div>
                  <div className="text-yellow-400 font-bold mb-2">Sell Strategy:</div>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Sell products with high market strength</li>
                    <li>• Travel to cities with better demand</li>
                    <li>• Monitor price trends across days</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowMarketInsights(false)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                style={{ fontFamily: 'LemonMilk, sans-serif' }}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Panel UI */}
      {showPlayerPanel && (
        <PlayerPanelUI
          gameState={gameState}
          currentCity={gameState.currentCity}
          connectedWallet={connectedWallet || ''}
          selectedNFT={(() => {
            try {
              const savedPlug = localStorage.getItem('selectedNFT') || 
                              localStorage.getItem('selectedPlugNft') || 
                              localStorage.getItem('selectedAssistant');
              return savedPlug ? JSON.parse(savedPlug) : null;
            } catch (e) {
              return null;
            }
          })()}
          onAction={handlePlayerPanelAction}
          onClose={() => {
            setShowPlayerPanel(false);
            setSelectedCityForInfo(''); // Clear city selection when closing
          }}
          selectedCityForInfo={selectedCityForInfo}
        />
      )}

      {/* Animated Cutscene System */}
      <AnimatedCutscene
        cutscene={activeCutscene}
        onClose={closeCutscene}
        onAction={(action, data) => {
          const result = handleCutsceneAction(action, data);
          
          // Handle cutscene actions
          switch (action) {
            case 'view_predictions':
              // Terry's market predictions - store for player reference
              console.log('📊 Terry Predictions:', data);
              break;
              
            // Police Peek/Surveillance Actions
            case 'act_natural':
              setGameState(prev => ({
                ...prev,
                heat: Math.max(0, prev.heat - 1)
              }));
              setEventMessage(`😇 You played it cool with ${data.officer}. Heat slightly reduced.`);
              setShowEvent(true);
              break;
              
            case 'leave_quickly':
              if (gameState.money >= 50) {
                setGameState(prev => ({
                  ...prev,
                  money: prev.money - 50,
                  heat: Math.max(0, prev.heat - 2)
                }));
                setEventMessage(`🏃 Quick exit cost $50, but you avoided ${data.officer}. Heat reduced.`);
                setShowEvent(true);
              } else {
                setEventMessage('❌ Not enough money to leave quickly!');
                setShowEvent(true);
              }
              break;

            // Police Shakedown/Corrupt Cop Actions
            case 'pay_bribe':
              const bribeCost = data.bribeCost || 200;
              if (gameState.money >= bribeCost) {
                setGameState(prev => ({
                  ...prev,
                  money: prev.money - bribeCost,
                  heat: Math.max(0, prev.heat - 3)
                }));
                setEventMessage(`💰 ${data.officer} took $${bribeCost} bribe. Heat significantly reduced.`);
                setShowEvent(true);
              } else {
                setEventMessage('❌ Not enough money for the bribe!');
                setShowEvent(true);
              }
              break;
              
            case 'refuse_bribe':
              const intimidation = gameState.skills.intimidation || 0;
              if (Math.random() < (intimidation * 0.15)) {
                setGameState(prev => ({ ...prev, heat: Math.max(0, prev.heat - 1) }));
                setEventMessage(`😤 Your intimidation worked on ${data.officer}!`);
              } else {
                setGameState(prev => ({
                  ...prev,
                  heat: Math.min(5, prev.heat + 2),
                  health: Math.max(0, prev.health - 15)
                }));
                setEventMessage(`⚔️ ${data.officer} didn't like that. Heat and health damage taken!`);
              }
              setShowEvent(true);
              break;
              
            case 'intimidate_cop':
              const intimidationSkill = gameState.skills.intimidation || 0;
              if (Math.random() < (intimidationSkill * 0.2)) {
                setGameState(prev => ({ ...prev, heat: Math.max(0, prev.heat - 2) }));
                setEventMessage(`😠 Your intimidation scared off ${data.officer}!`);
              } else {
                setGameState(prev => ({
                  ...prev,
                  heat: Math.min(5, prev.heat + 3),
                  health: Math.max(0, prev.health - 25)
                }));
                setEventMessage(`💥 ${data.officer} called for backup! Major heat increase!`);
              }
              setShowEvent(true);
              break;

            // Police Stop/Search Actions
            case 'cooperate_search':
              const hasInventory = Object.values(gameState.drugs || {}).some((drug: any) => drug.owned > 0);
              if (hasInventory && Math.random() < 0.4) {
                const confiscatedValue = Math.floor(Math.random() * 500) + 200;
                setGameState(prev => ({
                  ...prev,
                  money: Math.max(0, prev.money - confiscatedValue),
                  heat: Math.min(5, prev.heat + 1)
                }));
                setEventMessage(`🚔 ${data.officer} found something. Lost $${confiscatedValue}.`);
              } else {
                setGameState(prev => ({ ...prev, heat: Math.max(0, prev.heat - 1) }));
                setEventMessage(`🤝 Clean search with ${data.officer}. Heat reduced for cooperation.`);
              }
              setShowEvent(true);
              break;
              
            case 'refuse_search':
              const streetwise = gameState.skills.streetwise || 0;
              if (Math.random() < (streetwise * 0.15)) {
                setEventMessage(`📋 Your knowledge of rights impressed ${data.officer}. No search conducted.`);
              } else {
                setGameState(prev => ({ ...prev, heat: Math.min(5, prev.heat + 1) }));
                setEventMessage(`⚖️ ${data.officer} is suspicious of your refusal. Heat increased.`);
              }
              setShowEvent(true);
              break;
              
            case 'flee_scene':
              const stealth = gameState.skills.stealth || 0;
              if (Math.random() < (stealth * 0.2 + 0.3)) {
                setEventMessage(`🏃 Successfully escaped from ${data.officer}!`);
              } else {
                setGameState(prev => ({
                  ...prev,
                  heat: Math.min(5, prev.heat + 3),
                  health: Math.max(0, prev.health - 20),
                  day: prev.day + 1 // 1 day jail time
                }));
                setEventMessage(`🚨 Caught fleeing! 1 day jail time, heat increase, and injuries!`);
              }
              setShowEvent(true);
              break;

            // Major Police Bust Actions
            case 'try_escape':
              const escapeChance = (gameState.skills.stealth || 0) * 0.1;
              if (Math.random() < escapeChance) {
                setGameState(prev => ({ ...prev, heat: Math.max(1, prev.heat - 1) }));
                setEventMessage('🏃 Miraculous escape from the major bust!');
              } else {
                setGameState(prev => ({
                  ...prev,
                  day: prev.day + 3,
                  money: Math.max(0, prev.money - 1000),
                  heat: Math.max(1, prev.heat - 2),
                  health: Math.max(10, prev.health - 30)
                }));
                setEventMessage('🚨 Caught! 3 days jail, $1000 fine, major injuries!');
              }
              setShowEvent(true);
              break;
              
            case 'surrender_peacefully':
              setGameState(prev => ({
                ...prev,
                day: prev.day + 2,
                heat: Math.max(0, prev.heat - 2),
                money: Math.max(0, prev.money - 500)
              }));
              setEventMessage('🤲 Peaceful surrender: 2 days jail, $500 fine. Heat reduced for cooperation.');
              setShowEvent(true);
              break;
              
            case 'massive_bribe':
              if (gameState.money >= 2000) {
                setGameState(prev => ({
                  ...prev,
                  money: prev.money - 2000,
                  heat: Math.max(0, prev.heat - 4)
                }));
                setEventMessage('💰 $2000 bribe cleared the major bust! Heat significantly reduced.');
                setShowEvent(true);
              } else {
                setEventMessage('❌ Not enough money for massive bribe!');
                setShowEvent(true);
              }
              break;

            // SWAT Property Raid Actions
            case 'hide_evidence':
              if (gameState.money >= 200) {
                setGameState(prev => ({
                  ...prev,
                  money: prev.money - 200,
                  heat: Math.max(0, prev.heat - 2)
                }));
                setEventMessage('📦 Evidence hidden! $200 cost, but heat reduced from SWAT raid.');
                setShowEvent(true);
              } else {
                setEventMessage('❌ Not enough money to hide evidence!');
                setShowEvent(true);
              }
              break;
              
            case 'cooperate_fully':
              setGameState(prev => ({
                ...prev,
                day: prev.day + 1,
                money: Math.max(0, prev.money - 300),
                heat: Math.max(0, prev.heat - 3)
              }));
              setEventMessage('🤝 Full cooperation: 1 day jail, $300 fine. Heat greatly reduced.');
              setShowEvent(true);
              break;
              
            case 'resist_arrest':
              setGameState(prev => ({
                ...prev,
                day: prev.day + 5,
                money: Math.max(0, prev.money - 2000),
                heat: Math.min(5, prev.heat + 2),
                health: Math.max(5, prev.health - 50)
              }));
              setEventMessage('⚔️ Resisted SWAT! 5 days jail, $2000 fine, major injuries, heat increased!');
              setShowEvent(true);
              break;
              
            case 'claim_reward':
              // Plug reward - add money
              setGameState(prev => ({
                ...prev,
                money: prev.money + (data?.amount || 0)
              }));
              setEventMessage(`💎 Plug bonus claimed: $${data?.amount || 0}!`);
              setShowEvent(true);
              break;
              
            case 'accept_deal':
              // Random buyer - accept the deal
              setGameState(prev => ({
                ...prev,
                money: prev.money + (data?.price * data?.quantity || 0)
              }));
              setEventMessage(`🤝 Deal accepted! Earned $${data?.price * data?.quantity || 0}`);
              setShowEvent(true);
              break;
              
            case 'negotiate':
              // Random buyer - try to negotiate
              const bonus = Math.floor((data?.negotiationRoom || 0) * Math.random());
              const finalPrice = (data?.price || 0) + bonus;
              setGameState(prev => ({
                ...prev,
                money: prev.money + (finalPrice * data?.quantity || 0)
              }));
              setEventMessage(`💬 Negotiation successful! Extra $${bonus} per item!`);
              setShowEvent(true);
              break;
              
            case 'collect_mission_reward':
              // Mission completion reward
              setGameState(prev => ({
                ...prev,
                money: prev.money + (data?.reward || 0)
              }));
              setEventMessage(`✅ Mission reward collected: $${data?.reward || 0}!`);
              setShowEvent(true);
              break;
              
            // GROWERZ NFT Interactive Cutscenes for Special Pickups
            case 'start_growerz_pickup':
              // Interactive GROWERZ NFT cutscene for special pickup missions
              const selectedNFT = (() => {
                try {
                  const savedPlug = localStorage.getItem('selectedPlugNft') || 
                                  localStorage.getItem('selectedNFT') || 
                                  localStorage.getItem('selectedAssistant');
                  return savedPlug ? JSON.parse(savedPlug) : null;
                } catch (e) {
                  return null;
                }
              })();
              
              if (selectedNFT) {
                // Trigger GROWERZ NFT animated cutscene for exclusive pickup
                setActiveCutscene({
                  type: 'growerz_pickup',
                  title: '🌿 GROWERZ NFT Special Pickup',
                  character: 'growerz_nft',
                  content: `Your GROWERZ NFT "${selectedNFT.name}" has secured an exclusive pickup opportunity. This NFT-gated mission provides premium rewards and city connections.`,
                  characterImage: selectedNFT.image || '/attached_assets/1985ce84fdc5c_1753905458779.png',
                  actions: [
                    { id: 'accept_pickup', label: '🚚 Accept Pickup Mission', cost: 0 },
                    { id: 'negotiate_terms', label: '💬 Negotiate Better Terms', cost: 100 },
                    { id: 'decline_politely', label: '❌ Decline Mission', cost: 0 }
                  ],
                  data: {
                    nftRank: selectedNFT.rank || 'Unknown',
                    nftName: selectedNFT.name || 'GROWERZ NFT',
                    baseReward: 800,
                    bonusReward: Math.floor((selectedNFT.rank || 1000) * 0.5)
                  }
                });
              } else {
                setEventMessage('❌ GROWERZ NFT required for special pickup missions!');
                setShowEvent(true);
              }
              break;
              
            case 'accept_pickup':
              // Player accepts GROWERZ NFT pickup mission
              const pickupReward = (data?.baseReward || 800) + (data?.bonusReward || 0);
              setGameState(prev => ({
                ...prev,
                money: prev.money + pickupReward,
                heat: Math.max(0, prev.heat - 1) // Slight heat reduction from exclusive connection
              }));
              setEventMessage(`🌿 GROWERZ pickup completed! Earned $${pickupReward} + heat reduction!`);
              setShowEvent(true);
              break;
              
            case 'negotiate_terms':
              // Player negotiates better terms using NFT status
              if (gameState.money >= 100) {
                const negotiatedReward = ((data?.baseReward || 800) + (data?.bonusReward || 0)) * 1.3;
                setGameState(prev => ({
                  ...prev,
                  money: prev.money - 100 + Math.floor(negotiatedReward),
                  heat: Math.max(0, prev.heat - 2)
                }));
                setEventMessage(`💬 GROWERZ NFT status secured premium deal! Net: $${Math.floor(negotiatedReward) - 100}!`);
                setShowEvent(true);
              } else {
                setEventMessage('❌ Need $100 to negotiate terms!');
                setShowEvent(true);
              }
              break;
              
            case 'start_growerz_dropoff':
              // Interactive GROWERZ NFT cutscene for exclusive dropoff missions
              const currentNFT = (() => {
                try {
                  const savedPlug = localStorage.getItem('selectedPlugNft') || 
                                  localStorage.getItem('selectedNFT') || 
                                  localStorage.getItem('selectedAssistant');
                  return savedPlug ? JSON.parse(savedPlug) : null;
                } catch (e) {
                  return null;
                }
              })();
              
              if (currentNFT) {
                // Trigger GROWERZ NFT animated cutscene for exclusive dropoff
                setActiveCutscene({
                  type: 'growerz_dropoff',
                  title: '🎯 GROWERZ NFT VIP Dropoff',
                  character: 'growerz_nft',
                  content: `Your GROWERZ NFT "${currentNFT.name}" has VIP access to an exclusive dropoff location. This high-reward mission comes with premium city connections and bonuses.`,
                  characterImage: currentNFT.image || '/attached_assets/1985ce84fdc5c_1753905458779.png',
                  actions: [
                    { id: 'execute_dropoff', label: '🎯 Execute VIP Dropoff', cost: 0 },
                    { id: 'request_escort', label: '🛡️ Request Security Escort', cost: 200 },
                    { id: 'cancel_dropoff', label: '❌ Cancel Mission', cost: 0 }
                  ],
                  data: {
                    nftRank: currentNFT.rank || 'Unknown',
                    nftName: currentNFT.name || 'GROWERZ NFT',
                    vipReward: 1500,
                    rankBonus: Math.floor((currentNFT.rank || 1000) * 0.8)
                  }
                });
              } else {
                setEventMessage('❌ GROWERZ NFT required for VIP dropoff missions!');
                setShowEvent(true);
              }
              break;
              
            case 'execute_dropoff':
              // Player executes GROWERZ NFT VIP dropoff
              const dropoffReward = (data?.vipReward || 1500) + (data?.rankBonus || 0);
              setGameState(prev => ({
                ...prev,
                money: prev.money + dropoffReward,
                heat: Math.max(0, prev.heat - 2), // Greater heat reduction for VIP access
                reputation: (prev.reputation || 0) + 50 // Reputation bonus
              }));
              setEventMessage(`🎯 VIP dropoff completed! Earned $${dropoffReward} + major bonuses!`);
              setShowEvent(true);
              break;
              
            case 'request_escort':
              // Player requests security escort for safer dropoff
              if (gameState.money >= 200) {
                const secureReward = ((data?.vipReward || 1500) + (data?.rankBonus || 0)) * 0.9; // Slightly reduced for security cost
                setGameState(prev => ({
                  ...prev,
                  money: prev.money - 200 + Math.floor(secureReward),
                  heat: Math.max(0, prev.heat - 3), // Maximum heat reduction for security
                  reputation: (prev.reputation || 0) + 75 // Higher reputation for professional approach
                }));
                setEventMessage(`🛡️ Secure escort ensured safe VIP dropoff! Net: $${Math.floor(secureReward) - 200}!`);
                setShowEvent(true);
              } else {
                setEventMessage('❌ Need $200 for security escort!');
                setShowEvent(true);
              }
              break;
          }
        }}
      />

      </div>
    </div>
  );
}

export default DopeWarsGame;