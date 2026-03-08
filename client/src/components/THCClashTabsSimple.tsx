import React, { useState, useEffect, useCallback } from 'react';
import { Swords, Crown, CreditCard, Gamepad2, Settings, ShoppingCart, Wallet, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNFTTraits } from '../contexts/NFTTraitContext';
import { useCardPurchase } from '../hooks/useCardPurchase';
import THCClashGameBoard from './THCClashGameBoard';
import THCClashRoyaleGame from './THCClashRoyaleGame';
import AuthenticTHCClashBattle from './AuthenticTHCClashBattle';
import { UnifiedCard } from './UnifiedCard';
import TraitBasedCardDisplay from './TraitBasedCardDisplay';
import NFTCardDeck from './NFTCardDeck';
import AdminPanel from './AdminPanel';
import { NFTTraitDisplay } from './NFTTraitDisplay';
import { ALL_CARDS, getUnlockedCards } from '../data/allCards';
import { LocalGameService } from '../services/LocalGameService';
import { PSG1Emulator } from './PSG1Emulator';
import GameSettings from './GameSettings';
import PSG1Demo from './PSG1Demo';
import { usePSG1Responsive } from '../utils/psg1-responsive';

// Authentic Clash Royale battlefield layout based on reference image https://i.imgur.com/dfkswLm.png
const getDefaultTHCZones = () => {
  return [
    // AI Towers (Top side - authentic Clash Royale positioning)
    { id: 'ai_tower_left', type: 'tower', x: 200, y: 120, width: 80, height: 80, name: 'AI Left Tower', color: 'rgba(244, 67, 54, 0.3)', team: 'ai', towerType: 'crown' },
    { id: 'ai_tower_right', type: 'tower', x: 520, y: 120, width: 80, height: 80, name: 'AI Right Tower', color: 'rgba(244, 67, 54, 0.3)', team: 'ai', towerType: 'crown' },
    { id: 'ai_castle', type: 'castle', x: 360, y: 50, width: 80, height: 100, name: 'AI King Castle', color: 'rgba(244, 67, 54, 0.5)', team: 'ai', towerType: 'king', health: 2500 },

    // Player Towers (Bottom side - in lower green area as shown in reference)
    { id: 'player_tower_left', type: 'tower', x: 200, y: 480, width: 80, height: 80, name: 'Player Left Tower', color: 'rgba(76, 175, 80, 0.3)', team: 'player', towerType: 'crown' },
    { id: 'player_tower_right', type: 'tower', x: 520, y: 480, width: 80, height: 80, name: 'Player Right Tower', color: 'rgba(76, 175, 80, 0.3)', team: 'player', towerType: 'crown' },
    { id: 'player_castle', type: 'castle', x: 360, y: 550, width: 80, height: 100, name: 'Player King Castle', color: 'rgba(76, 175, 80, 0.5)', team: 'player', towerType: 'king', health: 2500 },

    // Deployment zones - player can deploy in bottom area
    { id: 'player_deploy_left', type: 'deploy', x: 50, y: 350, width: 300, height: 150, name: 'Player Left Lane', color: 'rgba(33, 150, 243, 0.2)' },
    { id: 'player_deploy_right', type: 'deploy', x: 450, y: 350, width: 300, height: 150, name: 'Player Right Lane', color: 'rgba(33, 150, 243, 0.2)' },

    // Bridge area (middle river crossing - authentic position)
    { id: 'bridge', type: 'bridge', x: 0, y: 275, width: 800, height: 50, name: 'Bridge Area', color: 'rgba(96, 125, 139, 0.3)' }
  ];
};

interface TabsProps {
  onWalletConnect: () => void;
  playerWallet?: string;
  playerNFT?: any;
  onWalletDisconnect?: () => void;
  gameZones?: any[];
}

const THCClashTabsSimple: React.FC<TabsProps> = ({ 
  onWalletConnect, 
  playerWallet: propWallet, 
  playerNFT: propNFT,
  onWalletDisconnect,
  gameZones 
}) => {
  const [activeTab, setActiveTab] = useState<'nft' | 'cards' | 'admin' | 'battle' | 'game' | 'deck' | 'nft-original' | 'demo'>('nft');
  const [isInBattle, setIsInBattle] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<any[]>([]);
  const [psg1Enabled, setPsg1Enabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [isDeckVisible, setIsDeckVisible] = useState(true);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const maxDeckSize = 6;

  // PSG1 responsive utilities
  const psg1Responsive = usePSG1Responsive();

  // Enhanced mobile detection and responsive scaling with device recognition
  const [isMobile, setIsMobile] = useState(false);
  const [isWebView, setIsWebView] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'Desktop',
    os: 'Unknown',
    browser: 'Unknown',
    screen: '1920x1080',
    dpr: 1,
    orientation: 'Portrait',
    touch: 'No'
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenWidth(width);

      // Enhanced mobile detection for optimal phone display
      const isMobileSize = width < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPortrait = height > width;

      setIsMobile(isMobileSize || isTouchDevice);

      // Comprehensive device detection for Web3 browsers
      const userAgent = navigator.userAgent;
      const isWeb3Browser = /trustwallet|phantom|solflare|glow|backpack/i.test(userAgent);
      const isMobileUA = /android|iphone|ipad|ipod|mobile/i.test(userAgent);

      setIsWebView(isWeb3Browser || isMobileUA);

      // Device info for optimal UI adaptation
      const deviceType = isMobileSize || isMobileUA || isTouchDevice ? 'Mobile' : 'Desktop';
      const os = /windows/i.test(userAgent) ? 'Windows 10' : 
                /mac/i.test(userAgent) ? 'macOS' :
                /android/i.test(userAgent) ? 'Android' :
                /iphone|ipad|ipod/i.test(userAgent) ? 'iOS' : 'Unknown';

      const browser = /chrome/i.test(userAgent) ? 'Chrome 138' :
                     /firefox/i.test(userAgent) ? 'Firefox' :
                     /safari/i.test(userAgent) ? 'Safari' :
                     /edge/i.test(userAgent) ? 'Edge' : 'Unknown';

      const newDeviceInfo = {
        type: deviceType,
        os,
        browser,
        screen: `${width}x${height}`,
        dpr: window.devicePixelRatio || 1,
        orientation: isPortrait ? 'Portrait' : 'Landscape',
        touch: isTouchDevice ? 'Yes' : 'No'
      };

      setDeviceInfo(newDeviceInfo);
      console.log('📱 Device Detection:', newDeviceInfo);
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, []);

  // PSG1 Emulator settings listener
  useEffect(() => {
    const handlePsg1Toggle = (event: CustomEvent) => {
      setPsg1Enabled(event.detail.enabled);
    };

    window.addEventListener('psg1-toggle', handlePsg1Toggle as EventListener);

    // Load PSG1 setting from localStorage
    const savedSettings = localStorage.getItem('thc-clash-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setPsg1Enabled(settings.psg1Enabled || false);
      } catch (e) {
        console.error('Error loading PSG1 settings:', e);
      }
    }

    return () => {
      window.removeEventListener('psg1-toggle', handlePsg1Toggle as EventListener);
    };
  }, []);

  // Use NFT trait context for unified data management
  const { 
    battleCards, 
    captainCard, 
    nftBonuses, 
    playerNFT: contextNFT, 
    playerWallet: contextWallet,
    nftBenefits,
    updateNFTData
  } = useNFTTraits();

  // Get wallet info from props or context  
  const playerWallet = propWallet || contextWallet;
  const playerNFT = propNFT || contextNFT;

  // Card purchase system
  const {
    budzBalance,
    purchasedCards,
    loading: purchaseLoading,
    purchaseCard,
    isCardPurchased,
    addBudz
  } = useCardPurchase(1000); // Start with 1000 BUDZ for testing

  // SOL Balance state
  const [solBalance, setSolBalance] = useState<number>(0);

  // Deck management functions with auto-captain card
  const addToDeck = (card: any) => {
    if (selectedDeck.length < maxDeckSize) {
      setSelectedDeck([...selectedDeck, { ...card, deckId: Date.now() }]);
    }
  };

  const removeFromDeck = (deckId: number) => {
    setSelectedDeck(selectedDeck.filter(card => card.deckId !== deckId));
  };

  // Real wallet balance fetching function
  const fetchRealBalances = useCallback(async () => {
    if (!playerWallet) return;

    try {
      // Fetch real wallet balances from server API
      console.log(`💰 Fetching wallet balances for: ${playerWallet}`);
      const response = await fetch(`/api/wallet/${playerWallet}`);
      const data = await response.json();

      if (response.ok && data) {
        setSolBalance(data.solBalance || 0);
        console.log(`✅ Wallet balances updated:`, {
          sol: data.solBalance,
          budz: data.budzBalance,
          gbux: data.gbuxBalance,
          thcLabz: data.thcLabzTokenBalance
        });
      } else {
        console.error('❌ Failed to fetch wallet balances:', data);
        setSolBalance(0); // Show 0 instead of fake data
      }
    } catch (error) {
      console.error('❌ Error updating wallet balances:', error);
      setSolBalance(0); // Show 0 on error instead of fake data
    }
  }, [playerWallet]);

  // Fetch SOL balance on wallet connection and periodically
  useEffect(() => {
    fetchRealBalances();
    // Refresh real balances every 30 seconds
    const interval = setInterval(fetchRealBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchRealBalances]);

  // Auto-add captain card to deck when NFT is detected
  useEffect(() => {
    if (captainCard && selectedDeck.length === 0) {
      console.log('🔥 Auto-adding captain card to deck:', captainCard.name);
      addToDeck(captainCard);
    }
  }, [captainCard]);

  // Check admin status when wallet connects
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (playerWallet) {
        setAdminCheckLoading(true);
        try {
          const response = await fetch(`/api/admin/check/${playerWallet}`);
          const data = await response.json();
          setIsAdmin(data.success && data.isAdmin);
          console.log('🔒 Admin check result:', data.isAdmin ? 'Admin access granted' : 'Regular user access');
        } catch (error) {
          console.error('❌ Admin check failed:', error);
          setIsAdmin(false);
        } finally {
          setAdminCheckLoading(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [playerWallet]);

  // Initialize local player data when wallet connects
  useEffect(() => {
    if (playerWallet) {
      console.log('💾 Local Storage: Initializing player data for', playerWallet);
      LocalGameService.savePlayerData(playerWallet, playerNFT).then(() => {
        console.log('💾 Local Storage: Player data initialized successfully');
      }).catch(error => {
        console.error('❌ Local Storage: Failed to initialize player data:', error);
      });

      // Save NFT bonuses to local storage
      if (nftBonuses) {
        LocalGameService.saveNFTBonuses(playerWallet, nftBonuses).then(() => {
          console.log('💾 Local Storage: NFT bonuses saved successfully');
        }).catch(error => {
          console.error('❌ Local Storage: Failed to save NFT bonuses:', error);
        });
      }
    }
  }, [playerWallet, playerNFT, nftBonuses]);

  // Handle card purchases
  const handleCardPurchase = async (cardId: string, price: number) => {
    const result = await purchaseCard(cardId, price, playerWallet || '');
    if (result.success) {
      console.log('✅ Card purchased successfully:', cardId);
      // Add BUDZ reward for testing
      addBudz(100); // Reward for testing purchases
    } else {
      console.error('❌ Card purchase failed:', result.message);
    }
  };

  // State for admin cards (single source of truth)
  const [adminCards, setAdminCards] = useState<any[]>([]);
  const [loadingAdminCards, setLoadingAdminCards] = useState(true);

  // Load admin cards on mount
  useEffect(() => {
    const loadAdminCards = async () => {
      try {
        const response = await fetch('/api/admin/cards');
        if (response.ok) {
          const data = await response.json();
          const cardsWithPurchaseStatus = (data.cards || []).map((card: any) => ({
            ...card,
            isUnlocked: card.isUnlocked || isCardPurchased(card.id),
            budzPrice: card.budzPrice || 0
          }));
          setAdminCards(cardsWithPurchaseStatus);
        }
      } catch (error) {
        console.error('Failed to load admin cards:', error);
      } finally {
        setLoadingAdminCards(false);
      }
    };
    loadAdminCards();
  }, []);

  // Get unlocked cards for NFT tab (user's NFT cards only)
  const userNFTCards = battleCards || [];

  // Get all cards for Cards tab (from admin source)
  // Remove free cards and add rarity-based pricing
  const getRarityPrice = (rarity: string) => {
    const prices = {
      'legendary': 500,
      'epic': 300,
      'rare': 150,
      'uncommon': 75,
      'common': 25
    };
    return prices[rarity as keyof typeof prices] || 50;
  };

  const allAvailableCards = adminCards.map(card => ({
    ...card,
    budzPrice: getRarityPrice(card.rarity),
    isUnlocked: false, // All cards start locked and must be purchased
    isPurchasable: true
  }));



  console.log('🎮 Using NFT trait-based cards from context:', battleCards?.length || 0);
  console.log('🔌 Wallet connected:', !!playerWallet, 'NFT:', !!playerNFT);
  console.log('📊 NFT Data Status:', {
    hasNFT: !!playerNFT,
    hasCards: battleCards?.length > 0,
    hasEnhancedDeck: nftBenefits?.enhancedDeck?.length > 0,
    hasBonuses: !!nftBonuses,
    attackBonus: nftBonuses?.attackBonus,
    abilities: nftBonuses?.specialAbilities?.length || 0
  });

  // Update NFT context when props change
  useEffect(() => {
    if (propNFT && propWallet) {
      console.log('🔄 Updating NFT context with props:', propNFT.name, propWallet);
      updateNFTData(propNFT, propWallet);
    }
  }, [propNFT, propWallet, updateNFTData]);

  // Hide tabs until wallet is connected AND NFT data is properly loaded
  const hasNFTData = playerNFT && (battleCards?.length > 0 || nftBenefits?.enhancedDeck?.length > 0);
  const hasTraitData = nftBonuses && (nftBonuses.attackBonus > 10 || nftBonuses.specialAbilities?.length > 0);

  if (!playerWallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900">
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <h1 className="text-4xl font-bold mb-6 text-white">THC CLASH</h1>
            <p className="text-xl mb-8 text-gray-300">Connect your Solana wallet to access the game</p>
            <button
              onClick={onWalletConnect}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!playerNFT || !hasNFTData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-green-900">
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <h1 className="text-4xl font-bold mb-6 text-white">THC CLASH</h1>
            <p className="text-xl mb-4 text-gray-300">Wallet Connected: {playerWallet.slice(0, 8)}...</p>
            <div className="bg-black/50 border border-yellow-500 rounded-lg p-6 mb-6">
              <p className="text-yellow-300 mb-4">Loading your GROWERZ NFT and generating trait-based cards...</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                <span className="text-yellow-400">Analyzing NFT traits and abilities</span>
              </div>
            </div>
            {!playerNFT && (
              <p className="text-red-400 text-sm">No GROWERZ NFT found in wallet. You need a GROWERZ NFT to play THC CLASH.</p>
            )}
            {onWalletDisconnect && (
              <button
                onClick={onWalletDisconnect}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter tabs based on admin status
  const tabs = [
    { 
      id: 'nft' as const, 
      name: 'NFT', 
      icon: CreditCard, 
      description: 'Your connected NFT info' 
    },
    { 
      id: 'cards' as const, 
      name: 'Cards', 
      icon: ShoppingCart, 
      description: 'Cards for sale with BUDZ' 
    },
    { 
      id: 'demo' as const, 
      name: 'PSG1', 
      icon: Gamepad2, 
      description: 'PSG1 Controller Demo' 
    },
    ...(isAdmin ? [{ 
      id: 'admin' as const, 
      name: 'Admin', 
      icon: Settings, 
      description: 'Manage cards' 
    }] : [])
  ];

  // Enhanced start battle function with admin gameboard validation
  const startBattle = async () => {
    if (selectedDeck.length === 0) {
      alert('Please add cards to your deck before entering battle!');
      return;
    }

    // Validate admin gameboard exists before starting battle
    try {
      console.log('🔍 Validating admin gameboard before battle...');

      const response = await fetch('/api/admin/load-pve-gameboard');
      const result = await response.json();

      let hasValidGameboard = false;

      if (result.success && result.gameboard) {
        // Check if gameboard has required elements
        const towers = result.gameboard.elements?.filter((el: any) => 
          el.type === 'tower' || el.type === 'castle'
        ) || [];
        const playerTowers = towers.filter((t: any) => t.team === 'player');
        const aiTowers = towers.filter((t: any) => t.team === 'ai');

        if (playerTowers.length > 0 && aiTowers.length > 0) {
          hasValidGameboard = true;
          console.log('✅ Valid admin gameboard found:', {
            elements: result.gameboard.elements?.length || 0,
            playerTowers: playerTowers.length,
            aiTowers: aiTowers.length
          });
        }
      }

      if (!hasValidGameboard) {
        // Fallback check local storage
        const localBoard = localStorage.getItem('thc-clash-pve-gameboard');
        if (localBoard) {
          const boardData = JSON.parse(localBoard);
          const towers = boardData.elements?.filter((el: any) => 
            el.type === 'tower' || el.type === 'castle'
          ) || [];
          const playerTowers = towers.filter((t: any) => t.team === 'player');
          const aiTowers = towers.filter((t: any) => t.team === 'ai');

          if (playerTowers.length > 0 && aiTowers.length > 0) {
            hasValidGameboard = true;
            console.log('✅ Valid admin gameboard found in local storage');
          }
        }
      }

      if (!hasValidGameboard) {
        alert(`❌ NO ADMIN GAMEBOARD FOUND!

🔧 REQUIRED ACTION:
1. Go to the ADMIN tab
2. Create a gameboard with towers for both teams
3. Click "Save Official PvE Gameboard"
4. Return here to start battles

⚠️ PvE battles require admin-created gameboards to function properly.`);
        return;
      }

    } catch (error) {
      console.error('❌ Failed to validate admin gameboard:', error);
      alert('❌ Failed to validate gameboard. Please ensure admin interface is working properly.');
      return;
    }

    console.log(`🎮 Starting enhanced battle with deck:`, selectedDeck.map(c => c.name));
    console.log(`🤖 AI Difficulty: ${difficulty.toUpperCase()}`);
    console.log('🎮 Using NFT trait-based cards from context:', battleCards?.length || 0);
    console.log('🔌 Wallet connected:', !!playerWallet, 'NFT:', !!playerNFT);
    console.log('📊 NFT Data Status:', {
      hasNFT: !!playerNFT,
      hasCards: battleCards?.length > 0,
      hasEnhancedDeck: nftBenefits?.enhancedDeck?.length > 0,
      hasBonuses: !!nftBonuses,
      attackBonus: nftBonuses?.attackBonus,
      abilities: nftBonuses?.specialAbilities?.length || 0,
      difficulty: difficulty
    });

    // Fetch real wallet balances before battle  
    if (playerWallet) {
      fetchRealBalances();
    }

    setIsInBattle(true);
    setActiveTab('battle');
  };

  // End battle function - Enhanced to match VisualBattleSystem
  const endBattle = (winner: 'player' | 'ai', results: any) => {
    const victory = winner === 'player';
    console.log('🏆 Battle ended:', victory ? 'Victory' : 'Defeat', results);
    setIsInBattle(false);
    setActiveTab('cards'); // Return to cards tab after battle

    // Add BUDZ rewards for battle completion
    if (victory) {
      addBudz(100); // Reward for winning
      console.log('🏆 Victory! Earned 100 BUDZ');
    } else {
      addBudz(25); // Consolation prize for participating
      console.log('💪 Good effort! Earned 25 BUDZ');
    }
  };

  return (
    <PSG1Emulator 
      isEnabled={psg1Enabled}
      onToggle={(enabled) => setPsg1Enabled(enabled)}
    >
      <div 
        className="h-full flex flex-col relative"
        style={{
          backgroundImage: 'url(blob:https://imgur.com/3f0f26bd-5c03-4425-9093-7510ee01cbd9)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: isMobile || isWebView ? 'scroll' : 'fixed'
        }}
      >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-0"></div>
      {/* Tab Navigation - Mobile Optimized with Balance Display */}
      <div className="bg-black/80 backdrop-blur-md border-b border-green-400/50 relative z-10">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between px-2">
          {/* Tab Buttons - Full width on mobile */}
          <div className="flex justify-center flex-1 order-2 sm:order-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-all flex-1 max-w-[100px] sm:max-w-[120px] justify-center touch-manipulation ${
                  activeTab === tab.id
                    ? 'text-green-400 border-b-2 border-green-400 bg-green-900/30'
                    : 'text-gray-400 hover:text-green-300 hover:bg-gray-800/50'
                }`}
              >
                <tab.icon size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden text-[10px] leading-tight">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Balance Display - Top on mobile, right on desktop */}
          <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-4 text-xs sm:text-sm py-1 sm:py-0 order-1 sm:order-2">
            {/* SOL Balance */}
            <div className="flex items-center gap-1 bg-purple-900/50 px-1 sm:px-2 py-1 rounded border border-purple-400/30">
              <Wallet size={12} className="text-purple-400" />
              <span className="text-purple-300 font-semibold text-[10px] sm:text-sm">
                {solBalance.toFixed(2)} SOL
              </span>
            </div>

            {/* BUDZ Balance */}
            <div className="flex items-center gap-1 bg-green-900/50 px-1 sm:px-2 py-1 rounded border border-green-400/30">
              <Crown size={12} className="text-green-400" />
              <span className="text-green-300 font-semibold text-[10px] sm:text-sm">
                {budzBalance} BUDZ
              </span>
            </div>

            {/* Settings Button */}
            <motion.button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 bg-gray-800/50 px-1 sm:px-2 py-1 rounded border border-gray-500/30 hover:border-blue-400/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={12} className="text-gray-400" />
              <span className="text-gray-300 font-semibold text-[10px] sm:text-sm hidden sm:inline">
                Settings
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        {activeTab === 'nft' && (
          <div className="p-1 sm:p-2 h-full overflow-y-auto bg-black/10 backdrop-blur-sm max-w-full">
            <NFTTraitDisplay onAddToDeck={addToDeck} />
          </div>
        )}

        {/* Keep the original nft content as fallback */}
        {activeTab === 'nft-original' && (
          <div className="p-4 h-full overflow-y-auto bg-black/10 backdrop-blur-sm">
            {playerWallet && playerNFT ? (
              <div className="space-y-6">
                {/* NFT Header */}
                <div className="bg-black/60 backdrop-blur-md border border-green-400/50 rounded-lg p-6 shadow-2xl">
                  <div className="flex flex-col lg:flex-row items-start gap-6">
                    {/* NFT Image */}
                    <div className="flex-shrink-0">
                      <img 
                        src={playerNFT.image} 
                        alt={playerNFT.name}
                        className="w-48 h-48 rounded-lg shadow-2xl border-2 border-purple-400 object-cover"
                        style={{ 
                          imageRendering: 'crisp-edges',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                    </div>

                    {/* NFT Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold text-purple-400">{playerNFT.name}</h2>
                        <p className="text-xl text-purple-300">THC GROWERZ Collection</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Rank Tooltip */}
                        <div className="bg-black/50 rounded-lg p-3 border border-purple-400/30 relative group cursor-help">
                          <p className="text-sm text-gray-400">Rank</p>
                          <p className="text-xl font-bold text-purple-400">#{playerNFT.rank}</p>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 border border-purple-400/50">
                            <div className="font-bold text-purple-400 mb-1">NFT Rank #{playerNFT.rank}</div>
                            <div>Rarity: {playerNFT.rank <= 100 ? 'Legendary' : playerNFT.rank <= 500 ? 'Epic' : playerNFT.rank <= 1000 ? 'Rare' : playerNFT.rank <= 1500 ? 'Uncommon' : 'Common'}</div>
                            <div>Collection: THC GROWERZ</div>
                            <div>Rank determines universal bonuses</div>
                          </div>
                        </div>

                        {/* Attack Bonus Tooltip */}
                        <div className="bg-black/50 rounded-lg p-3 border border-green-400/30 relative group cursor-help">
                          <p className="text-sm text-gray-400">Attack Bonus</p>
                          <p className="text-xl font-bold text-green-400">+{nftBenefits?.bonuses?.attackBonus || 0}</p>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 border border-green-400/50">
                            <div className="font-bold text-green-400 mb-1">Attack Enhancement</div>
                            <div>Base Attack: +{nftBenefits?.bonuses?.attackBonus || 0}</div>
                            <div>Applied to: All battle cards</div>
                            <div>Source: NFT rank + traits</div>
                            <div>Effect: Increases damage output</div>
                          </div>
                        </div>

                        {/* Health Bonus Tooltip */}
                        <div className="bg-black/50 rounded-lg p-3 border border-blue-400/30 relative group cursor-help">
                          <p className="text-sm text-gray-400">Health Bonus</p>
                          <p className="text-xl font-bold text-blue-400">+{nftBenefits?.bonuses?.healthBonus || 0}</p>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 border border-blue-400/50">
                            <div className="font-bold text-blue-400 mb-1">Health Enhancement</div>
                            <div>Base Health: +{nftBenefits?.bonuses?.healthBonus || 0}</div>
                            <div>Applied to: All battle cards</div>
                            <div>Source: NFT rank + traits</div>
                            <div>Effect: Increases survivability</div>
                          </div>
                        </div>

                        {/* Total Cards Tooltip */}
                        <div className="bg-black/50 rounded-lg p-3 border border-yellow-400/30 relative group cursor-help">
                          <p className="text-sm text-gray-400">Total Cards</p>
                          <p className="text-xl font-bold text-yellow-400">{(battleCards || nftBenefits?.enhancedDeck)?.length || 0}</p>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 border border-yellow-400/50">
                            <div className="font-bold text-yellow-400 mb-1">Trait-Unlocked Cards</div>
                            <div>Total Cards: {(battleCards || nftBenefits?.enhancedDeck)?.length || 0}</div>
                            <div>Source: NFT trait analysis</div>
                            <div>Each trait unlocks 1-2 specific cards</div>
                            <div>Enhanced with rank bonuses</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-purple-300 mb-2">NFT Traits & Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {/* Universal Rank Bonuses Tooltip */}
                          <div className="relative group cursor-help">
                            <p className="text-gray-300 hover:text-purple-300 transition-colors">• Universal rank bonuses applied to all cards</p>
                            <div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-64 z-50 border border-purple-400/50">
                              <div className="font-bold text-purple-400 mb-1">Universal Rank Bonuses</div>
                              <div>Rank #{playerNFT.rank} provides:</div>
                              <div>• Attack: +{nftBenefits?.bonuses?.attackBonus || 0} to all cards</div>
                              <div>• Health: +{nftBenefits?.bonuses?.healthBonus || 0} to all cards</div>
                              <div>• Defense: +{nftBenefits?.bonuses?.defenseBonus || 0}</div>
                              <div>Better ranks = higher bonuses</div>
                            </div>
                          </div>

                          {/* Captain Card Tooltip */}
                          <div className="relative group cursor-help">
                            <p className="text-gray-300 hover:text-yellow-300 transition-colors">• Automatic captain card generation</p>
                            <div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-64 z-50 border border-yellow-400/50">
                              <div className="font-bold text-yellow-400 mb-1">Captain Card System</div>
                              <div>Legendary captain auto-generated from:</div>
                              <div>• NFT image and name</div>
                              <div>• Rank-based stats</div>
                              <div>• Special abilities</div>
                              <div>• 5-8 elixir cost (trait-based)</div>
                              <div>Deployable like any other card</div>
                            </div>
                          </div>

                          {/* Enhanced Battle Deck Tooltip */}
                          <div className="relative group cursor-help">
                            <p className="text-gray-300 hover:text-green-300 transition-colors">• Enhanced battle deck with trait-based abilities</p>
                            <div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-64 z-50 border border-green-400/50">
                              <div className="font-bold text-green-400 mb-1">Trait-Based Card Unlocking</div>
                              <div>Your NFT traits unlock specific cards:</div>
                              <div>• Each trait = 1-2 unique cards</div>
                              <div>• Cards enhanced with rank bonuses</div>
                              <div>• Total: {(battleCards || nftBenefits?.enhancedDeck)?.length || 0} unlocked cards</div>
                              <div>• Plus captain card and purchasable cards</div>
                            </div>
                          </div>

                          {/* Exclusive Access Tooltip */}
                          <div className="relative group cursor-help">
                            <p className="text-gray-300 hover:text-blue-300 transition-colors">• Exclusive access to THC CLASH gameplay</p>
                            <div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-64 z-50 border border-blue-400/50">
                              <div className="font-bold text-blue-400 mb-1">Exclusive Web3 Gaming</div>
                              <div>NFT holder benefits:</div>
                              <div>• Full battle system access</div>
                              <div>• Enhanced BUDZ token rewards</div>
                              <div>• Cross-game integration</div>
                              <div>• Future exclusive features</div>
                              <div>• Community tournament access</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Enhanced Battle Cards Preview */}
                <div className="bg-black/60 backdrop-blur-md border border-green-400/50 rounded-lg p-6 shadow-2xl">
                  <div className="relative group">
                    <h3 className="text-2xl font-bold text-green-400 mb-4 cursor-help">🎮 Enhanced Battle Cards</h3>
                    <div className="absolute left-0 top-full mt-2 px-4 py-3 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-80 z-50 border border-green-400/50">
                      <div className="font-bold text-green-400 mb-2">Trait-Based Card System</div>
                      <div className="space-y-1 text-xs">
                        <div>• Total Unlocked: {(battleCards || nftBenefits?.enhancedDeck)?.length || 0} cards</div>
                        <div>• Source: Your NFT's {playerNFT.attributes?.length || 0} traits</div>
                        <div>• Each trait unlocks 1-2 specific cards</div>
                        <div>• All cards enhanced with rank bonuses</div>
                        <div>• Attack Bonus: +{nftBenefits?.bonuses?.attackBonus || 0}</div>
                        <div>• Health Bonus: +{nftBenefits?.bonuses?.healthBonus || 0}</div>
                        <div>• Cards differ based on trait rarity</div>
                        <div>• Higher ranks = better base stats</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-green-200 mb-6 text-lg">
                    Your NFT generates {(battleCards || nftBenefits?.enhancedDeck)?.length || 0} enhanced battle cards with trait-based bonuses and rarity backgrounds.
                  </p>

                  {(battleCards || nftBenefits?.enhancedDeck) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                      {(battleCards || nftBenefits?.enhancedDeck)?.slice(0, 12).map((card: any, index: number) => (
                        <div key={`nft-preview-${index}`} className="relative group cursor-help transform transition-all duration-300 hover:scale-105 hover:z-10">
                          <UnifiedCard
                            card={{
                              id: `preview-${index}`,
                              name: card.name,
                              image: card.image || playerNFT.image,
                              attack: card.attack,
                              health: card.health,
                              cost: card.cost,
                              rarity: card.rarity || 'rare',
                              type: card.type === 'basic' ? 'minion' : 
                                    card.type === 'spell' ? 'spell' : 
                                    card.type === 'tower' ? 'tower' : 'minion',
                              class: card.class || card.type || 'warrior',
                              description: card.description || `Enhanced by ${playerNFT.name}`,
                              abilities: card.abilities || [],
                              isNFTConnected: true,
                              nftTraitBonus: {
                                bonusEffect: `+${(card.attack || 50) - 50} ATK, +${(card.health || 100) - 100} HP from NFT`
                              }
                            }}
                            size="large"
                            showAddToDeck={false}
                          />

                          {/* Card-specific trait tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 z-50 border border-green-400/50">
                            <div className="font-bold text-green-400 mb-1">{card.name}</div>
                            <div className="space-y-1">
                              <div>Type: {card.type} • Class: {card.class || card.type || 'warrior'}</div>
                              <div>Rarity: {card.rarity || 'rare'}</div>
                              <div>Base Stats: {card.attack - (nftBenefits?.bonuses?.attackBonus || 0)} ATK / {card.health - (nftBenefits?.bonuses?.healthBonus || 0)} HP</div>
                              <div>Enhanced: +{nftBenefits?.bonuses?.attackBonus || 0} ATK / +{nftBenefits?.bonuses?.healthBonus || 0} HP</div>
                              <div>Cost: {card.cost} elixir</div>
                              {card.abilities && card.abilities.length > 0 && (
                                <div>Abilities: {card.abilities.join(', ')}</div>
                              )}
                              <div className="text-yellow-300 mt-1">Unlocked by NFT trait</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(battleCards || nftBenefits?.enhancedDeck)?.length > 12 && (
                        <div className="flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg p-4">
                          <span className="text-gray-400 text-sm">+{(battleCards || nftBenefits?.enhancedDeck)?.length - 12} more cards</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex justify-center">
                    <button 
                      onClick={() => setActiveTab('cards')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-bold flex items-center gap-1 text-xs"
                    >
                      <Gamepad2 size={14} />
                      View Cards
                    </button>
                  </div>
                </div>


              </div>
            ) : (
              <div className="p-4 text-center h-full flex items-center justify-center">
                <div className="bg-gray-800/50 border border-yellow-500 rounded-lg p-4 max-w-sm mx-2">
                  <h2 className="text-lg font-bold text-yellow-400 mb-3">Connect Your NFT</h2>
                  <p className="text-yellow-200 mb-4 text-sm">
                    Connect wallet with GROWERZ NFTs to view bonuses and cards
                  </p>
                  <button 
                    onClick={onWalletConnect}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="p-2 sm:p-4 h-full overflow-y-auto bg-black/10 backdrop-blur-sm max-w-full overflow-x-hidden">
            {playerWallet && playerNFT ? (
              <div className="space-y-4 sm:space-y-6 max-w-full">
                {/* Card Marketplace Section - Strictly BUDZ purchasable cards */}
                <div className="bg-black/60 backdrop-blur-md border border-yellow-400/50 rounded-lg p-3 sm:p-6 shadow-2xl max-w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <ShoppingCart size={20} />
                        Card Marketplace
                      </h2>
                      <p className="text-yellow-300 text-sm">
                        Browse and purchase cards with BUDZ tokens. Each card shows enhanced stats with your NFT bonuses.
                      </p>
                    </div>
                    <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-2 sm:p-3 min-w-[120px] relative group cursor-help">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Wallet size={16} />
                        <span className="font-bold text-sm sm:text-base">{budzBalance} BUDZ</span>
                      </div>
                      <p className="text-yellow-300 text-xs">Balance</p>

                      {/* BUDZ Balance Tooltip */}
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 z-50 border border-yellow-400/50">
                        <div className="font-bold text-yellow-400 mb-1">BUDZ Token Balance</div>
                        <div className="space-y-1">
                          <div>Current Balance: {budzBalance} BUDZ</div>
                          <div>Earn BUDZ from:</div>
                          <div>• Battle Victory: +100 BUDZ</div>
                          <div>• Battle Participation: +25 BUDZ</div>
                          <div>• Challenges & Events</div>
                          <div className="text-yellow-300 mt-1">Use BUDZ to buy new cards</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {loadingAdminCards ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400">Loading official cards...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* NFT Marketplace Grid Layout */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                      {allAvailableCards.map((card) => {
                        // Apply NFT trait bonuses if user has NFT
                        const enhancedCard = nftBenefits ? {
                          ...card,
                          attack: card.attack + (nftBenefits.bonuses?.attackBonus || 0),
                          health: card.health + (nftBenefits.bonuses?.healthBonus || 0),
                          nftBonuses: {
                            attackBonus: nftBenefits.bonuses?.attackBonus || 0,
                            healthBonus: nftBenefits.bonuses?.healthBonus || 0,
                            specialAbilities: nftBonuses?.specialAbilities || []
                          }
                        } : card;

                        return (
                          <div 
                            key={card.id} 
                            className="group bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md border-2 border-yellow-400/30 hover:border-yellow-300/70 rounded-2xl p-4 transition-all duration-500 shadow-2xl hover:shadow-yellow-400/40 transform hover:scale-[1.03] hover:-translate-y-3 relative overflow-hidden"
                          >
                            {/* Premium NFT Style Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Enhanced Card Display */}
                            <div className="relative mb-4">
                              <div className="relative aspect-[3/4]">
                                <UnifiedCard
                                  card={enhancedCard}
                                  size="large"
                                  showAddToDeck={false}
                                />

                                {/* Premium Overlay Effects */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg"></div>

                                {/* Rarity Gem Badge */}
                                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-xl border-2 border-white/30 z-10 ${
                                  card.rarity === 'legendary' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                                  card.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' :
                                  card.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                                  card.rarity === 'uncommon' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : 
                                  'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                }`}>
                                  {card.rarity === 'legendary' ? '👑' :
                                   card.rarity === 'epic' ? '💎' :
                                   card.rarity === 'rare' ? '⭐' :
                                   card.rarity === 'uncommon' ? '🔹' : '⚪'}
                                </div>

                                {/* Marketplace Badge */}
                                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold shadow-xl border-2 border-white/20 z-10">
                                  🛒 NFT
                                </div>
                              </div>

                              {/* Hover Stats Overlay */}
                              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center text-white p-3">
                                <div className="text-center space-y-2">
                                  <h3 className="font-bold text-sm">{card.name}</h3>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-red-500/20 px-2 py-1 rounded">
                                      <div className="text-red-400">⚔️ {enhancedCard.attack}</div>
                                    </div>
                                    <div className="bg-green-500/20 px-2 py-1 rounded">
                                      <div className="text-green-400">❤️ {enhancedCard.health}</div>
                                    </div>
                                    <div className="bg-purple-500/20 px-2 py-1 rounded">
                                      <div className="text-purple-400">⚡ {enhancedCard.cost}</div>
                                    </div>
                                  </div>
                                  {nftBenefits && (
                                    <div className="text-blue-300 text-xs">
                                      NFT Bonus: +{nftBenefits.bonuses?.attackBonus || 0} ATK
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Information */}
                            <div className="space-y-3 relative z-10">
                              {/* Card Name */}
                              <div className="text-center">
                                <h3 className="text-white font-bold text-sm group-hover:text-yellow-300 transition-colors line-clamp-1">
                                  {card.name}
                                </h3>
                              </div>

                              {/* Rarity Badge */}
                              <div className="flex justify-center">
                                <div className={`inline-block text-xs px-2 py-1 rounded-full font-bold ${
                                  card.rarity === 'legendary' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                                  card.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                                  card.rarity === 'rare' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                                  card.rarity === 'uncommon' ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 
                                  'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                                }`}>
                                  {card.rarity?.toUpperCase() || 'COMMON'}
                                </div>
                              </div>

                              {/* Price Section */}
                              <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                                <div className="text-center">
                                  <div className="text-yellow-400 font-bold text-lg">💰 {card.budzPrice}</div>
                                  <div className="text-yellow-300 text-xs">BUDZ</div>
                                </div>
                                <div className="text-xs text-gray-400 text-center mt-1">
                                  Balance: {budzBalance} BUDZ
                                </div>
                              </div>

                              {/* Purchase Button */}
                              <button
                                onClick={() => {
                                  console.log(`🛒 NFT Marketplace Purchase: ${card.name} for ${card.budzPrice} BUDZ`);
                                  handleCardPurchase(card.id, card.budzPrice);
                                }}
                                disabled={budzBalance < card.budzPrice}
                                className={`w-full px-3 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-xs relative overflow-hidden ${
                                  budzBalance >= card.budzPrice
                                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:shadow-green-500/50 active:scale-95'
                                    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {budzBalance >= card.budzPrice ? (
                                  <>
                                    <span>🛒</span>
                                    <span>BUY NFT</span>
                                  </>
                                ) : (
                                  <>
                                    <span>❌</span>
                                    <span>NEED {card.budzPrice - budzBalance}</span>
                                  </>
                                )}

                                {/* Button Shine Effect */}
                                {budzBalance >= card.budzPrice && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>

                {/* BUDZ Economy Instructions */}
                <div className="bg-black/60 backdrop-blur-md border border-blue-400/50 rounded-lg p-4 mb-20 shadow-2xl">
                  <div className="relative group">
                    <h3 className="text-lg font-bold text-blue-400 mb-2 cursor-help">💰 BUDZ Token Economy</h3>
                    <div className="absolute left-0 top-full mt-2 px-4 py-3 bg-black/95 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-80 z-50 border border-blue-400/50">
                      <div className="font-bold text-blue-400 mb-2">BUDZ Token System</div>
                      <div className="space-y-1 text-xs">
                        <div>• Primary reward currency in THC CLASH</div>
                        <div>• Earned through battle participation</div>
                        <div>• Used to purchase new cards from marketplace</div>
                        <div>• Cards range from 25-500 BUDZ based on rarity</div>
                        <div>• Purchased cards enhanced with your NFT bonuses</div>
                        <div>• Real Solana SPL token integration coming soon</div>
                        <div>• Cross-game currency for THC ecosystem</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-blue-300 text-sm">
                    Earn BUDZ tokens by winning battles and completing challenges. Use BUDZ to purchase new cards for your collection. Purchased cards can then be added to your battle deck.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-900/30 p-2 rounded border border-green-500/50 relative group cursor-help">
                      <span className="text-green-400 font-bold">Battle Victory:</span>
                      <span className="text-green-300 ml-1">+100 BUDZ</span>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 z-50 border border-green-400/50">
                        <div className="font-bold text-green-400 mb-1">Victory Rewards</div>
                        <div>Complete battle victory: +100 BUDZ</div>
                        <div>Destroy all enemy towers</div>
                        <div>Automatically distributed</div>
                        <div>Balance refreshes immediately</div>
                      </div>
                    </div>
                    <div className="bg-yellow-900/30 p-2 rounded border border-yellow-500/50 relative group cursor-help">
                      <span className="text-yellow-400 font-bold">Battle Participation:</span>
                      <span className="text-yellow-300 ml-1">+25 BUDZ</span>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 z-50 border border-yellow-400/50">
                        <div className="font-bold text-yellow-400 mb-1">Participation Rewards</div>
                        <div>Join any battle: +25 BUDZ</div>
                        <div>Even if you lose</div>
                        <div>Encourages active gameplay</div>
                        <div>Build your collection gradually</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="bg-gray-800/50 border border-yellow-500 rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Connect Wallet to Access Marketplace</h2>
                  <p className="text-yellow-200 mb-6">
                    Connect your Solana wallet to purchase cards with BUDZ tokens and build your collection
                  </p>
                  <button 
                    onClick={onWalletConnect}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Old deck tab removed - now using smart bottom deck interface */}
        {false && activeTab === 'deck' && (
          <div className="p-4 h-full overflow-y-auto">
            {playerWallet && playerNFT ? (
              <div className="space-y-6">
                {/* Deck Builder Header */}
                <div className="bg-black/80 border border-blue-500 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                        <Crown size={28} />
                        Battle Deck Builder
                      </h2>
                      <p className="text-blue-300">Build your 8-card battle deck for Clash Royale gameplay</p>
                    </div>
                    <button 
                      onClick={() => selectedDeck.length === maxDeckSize ? setActiveTab('game') : null}
                      disabled={selectedDeck.length !== maxDeckSize}
                      className={`px-6 py-3 rounded-lg font-bold text-lg flex items-center gap-2 transition-colors ${
                        selectedDeck.length === maxDeckSize 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Swords size={20} />
                      {selectedDeck.length === maxDeckSize ? 'Start Battle' : `Need ${maxDeckSize - selectedDeck.length} more cards`}
                    </button>
                  </div>
                </div>

                {/* Current Deck (8 cards max) */}
                <div className="bg-black/50 border border-yellow-500 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">🎯 Your Battle Deck ({selectedDeck.length}/{maxDeckSize})</h3>
                  <div className="grid grid-cols-4 gap-4 min-h-[220px] border-2 border-dashed border-gray-600 rounded-lg p-4">
                    {Array.from({length: maxDeckSize}).map((_, index) => (
                      <div key={index} className="aspect-[3/4] relative">
                        {selectedDeck[index] ? (
                          <div className="relative h-full w-full">
                            <div className="w-full h-full">
                              <UnifiedCard
                                card={selectedDeck[index]}
                                size="medium"
                                showAddToDeck={false}
                              />
                            </div>
                            <button
                              onClick={() => removeFromDeck(selectedDeck[index].deckId)}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold z-10 shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-500 rounded-lg flex flex-col items-center justify-center bg-gray-800/30 h-full w-full">
                            <span className="text-gray-500 text-sm">Empty</span>
                            <span className="text-gray-600 text-xs">Slot {index + 1}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedDeck.length === maxDeckSize && (
                    <div className="mt-4 p-3 bg-green-600/20 border border-green-500 rounded-lg">
                      <p className="text-green-400 text-center font-bold">✅ Deck Complete! Ready for battle.</p>
                    </div>
                  )}
                </div>

                {/* Captain Card - Fits in deck slot */}
                {(captainCard || nftBenefits?.captainCard) && (
                  <div className="bg-black/50 border border-purple-500 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                      <Crown size={24} />
                      Captain Card (Deployable)
                    </h3>
                    <p className="text-purple-300 mb-4">Your captain costs elixir like any other card - balanced for fair gameplay</p>
                    <div className="grid grid-cols-4 gap-4 min-h-[220px] border-2 border-dashed border-purple-600 rounded-lg p-4">
                      {/* Captain in first slot to show it fits */}
                      <div className="aspect-[3/4] relative">
                        <div className="relative h-full w-full">
                          <div className="w-full h-full">
                            <UnifiedCard
                              card={{
                                id: 'captain-deck',
                                name: (captainCard || nftBenefits?.captainCard)?.name || playerNFT.name,
                                image: (captainCard || nftBenefits?.captainCard)?.image || playerNFT.image,
                                attack: (captainCard || nftBenefits?.captainCard)?.attack || 100,
                                health: (captainCard || nftBenefits?.captainCard)?.health || 200,
                                cost: Math.max(5, Math.min(8, (captainCard || nftBenefits?.captainCard)?.cost || 6)),
                                rarity: 'legendary',
                                type: 'minion',
                                class: 'captain',
                                description: `Captain from ${playerNFT.name}`,
                                abilities: (captainCard || nftBenefits?.captainCard)?.abilities || [],
                                isNFTConnected: true
                              }}
                              isHero={true}
                              size="medium"
                              showAddToDeck={false}
                            />
                          </div>
                          <div className="absolute -top-2 -left-2 bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold z-10 shadow-lg">
                            👑
                          </div>
                        </div>
                      </div>
                      {/* Show 3 empty slots to demonstrate it fits in deck */}
                      {Array.from({length: 3}).map((_, index) => (
                        <div key={`captain-demo-${index}`} className="aspect-[3/4] relative">
                          <div className="border-2 border-dashed border-gray-500 rounded-lg flex flex-col items-center justify-center bg-gray-800/30 h-full w-full">
                            <span className="text-gray-500 text-sm">Empty</span>
                            <span className="text-gray-600 text-xs">Slot {index + 2}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Cards for Deck Building */}
                <div className="bg-black/50 border border-green-500 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-green-400 mb-4">📋 Available Cards for Deck</h3>
                  <p className="text-green-300 mb-4">Build your battle deck with {maxDeckSize} cards from admin collection and your NFT enhanced cards</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* NFT Enhanced Cards */}
                    {(battleCards || nftBenefits?.enhancedDeck)?.map((card: any, index: number) => {
                        const cardData = {
                          id: `deck-${index}`,
                          name: card.name,
                          image: card.image || playerNFT.image,
                          attack: card.attack,
                          health: card.health,
                          cost: card.cost,
                          rarity: card.rarity || 'rare',
                          type: (card.type === 'spell' ? 'spell' : 
                                card.type === 'tower' ? 'tower' : 'minion') as 'minion' | 'spell' | 'tower',
                          class: card.class || card.type || 'warrior',
                          description: card.description || `Enhanced by ${playerNFT.name}`,
                          abilities: card.abilities || [],
                          isNFTConnected: true,
                          nftTraitBonus: {
                            bonusEffect: `+${(card.attack || 50) - 50} ATK, +${(card.health || 100) - 100} HP from NFT`
                          }
                        };

                        const canAddToDeck = selectedDeck.length < maxDeckSize;

                        return (
                          <div key={`deck-card-${index}`} className="flex flex-col transform transition-all duration-300 hover:scale-105">
                            <UnifiedCard
                              card={cardData}
                              size="large"
                              showAddToDeck={false}
                            />
                            {/* Add to Deck Button Below Card */}
                            <div className="mt-2">
                              {canAddToDeck ? (
                                <button
                                  onClick={() => addToDeck(cardData)}
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-all"
                                >
                                  <Crown className="w-3 h-3" />
                                  Add to Deck
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold opacity-50 cursor-not-allowed"
                                >
                                  Deck Full
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {/* Admin Cards (Unlocked) */}
                    {adminCards.filter(card => card.isUnlocked || isCardPurchased(card.id)).map((card) => {
                      const enhancedCard = nftBenefits ? {
                        ...card,
                        id: `admin-${card.id}`,
                        attack: card.attack + (nftBenefits.bonuses?.attackBonus || 0),
                        health: card.health + (nftBenefits.bonuses?.healthBonus || 0)
                      } : { ...card, id: `admin-${card.id}` };

                      const canAddToDeck = selectedDeck.length < maxDeckSize;

                      return (
                        <div key={`admin-deck-card-${card.id}`} className="flex flex-col">
                          <div className="relative">
                            <UnifiedCard
                              card={enhancedCard}
                              size="medium"
                              showAddToDeck={false}
                            />
                            {nftBenefits && (nftBenefits.bonuses?.attackBonus > 0 || nftBenefits.bonuses?.healthBonus > 0) && (
                              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                               ADMIN+
                              </div>
                            )}
                          </div>
                          {/* Add to Deck Button Below Card */}
                          <div className="mt-2">
                            {canAddToDeck ? (
                              <button
                                onClick={() => addToDeck(enhancedCard)}
                                className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-all"
                              >
                                <Crown className="w-3 h-3" />
                                Add to Deck
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold opacity-50 cursor-not-allowed"
                              >
                                Deck Full
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="bg-gray-800/50 border border-yellow-500 rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Connect Wallet for Deck Building</h2>
                  <p className="text-yellow-200 mb-6">
                    Connect your Solana wallet with THC GROWERZ NFTs to build your battle deck
                  </p>
                  <button 
                    onClick={onWalletConnect}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Old battle tab removed - now using ClashRoyaleBattleSystem overlay */}

        {activeTab === 'demo' && (
          <div className="h-full bg-black/10 backdrop-blur-sm">
            <PSG1Demo isEnabled={psg1Enabled} />
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="h-full bg-black/10 backdrop-blur-sm">
            <AdminPanel />
          </div>
        )}
      </div>

      {/* Collapsible Bottom Deck Interface with Framer Motion - Shows on Cards and NFT tabs */}
      <AnimatePresence>
        {!isInBattle && (activeTab === 'cards' || activeTab === 'nft') && (
          <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t-2 border-green-400/60 z-40 shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: isDeckVisible ? "0%" : "100%" }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
          >
          {/* Deck Toggle Tab with Motion */}
          <motion.button
            onClick={() => setIsDeckVisible(!isDeckVisible)}
            className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 border border-green-400/60 border-b-0 rounded-t-lg px-4 py-1 flex items-center gap-2 ${
              isDeckVisible 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-yellow-400 hover:text-yellow-300 shadow-lg'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            animate={!isDeckVisible ? { y: [0, -5, 0] } : {}}
            transition={!isDeckVisible ? { 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut" 
            } : { duration: 0.2 }}
          >
            {isDeckVisible ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span className="text-xs font-bold">
              {isDeckVisible ? 'HIDE DECK' : `DECK (${selectedDeck.length}/${maxDeckSize})`}
            </span>
          </motion.button>

          <div className="p-2 sm:p-3">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="text-yellow-400" size={16} />
                  <h3 className="text-sm font-bold text-yellow-400">Deck ({selectedDeck.length}/{maxDeckSize})</h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* AI Difficulty Selector */}
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-xs relative z-[9999]"
                    style={{ zIndex: 9999 }}
                  >
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                  <button
                    onClick={startBattle}
                    className={`px-3 py-1 rounded font-bold flex items-center gap-1 transition-all duration-300 ${
                      selectedDeck.length > 0 || allAvailableCards.length > 0
                        ? 'bg-green-700 hover:bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Swords size={16} />
                    {selectedDeck.length > 0 ? 'START BATTLE' : allAvailableCards.length > 0 ? 'AUTO-BUILD & BATTLE' : 'NO CARDS'}
                  </button>
                </div>
              </div>

              {/* Deck Preview - 6 Cards with Optimized Compact Layout */}
              <div className="flex gap-0.5 sm:gap-1 justify-center items-start w-full px-1">
                <AnimatePresence>
                  {Array.from({length: maxDeckSize}).map((_, index) => {
                    const card = selectedDeck[index];
                    const isCapitanCard = card?.id === 'captain' || card?.class === 'captain' || card?.rarity === 'legendary';

                    return (
                      <motion.div 
                        key={`deck-slot-${index}`}
                        className="relative flex-shrink-0"
                        style={{ 
                          width: 'calc(16.66% - 2px)', 
                          minWidth: screenWidth < 480 ? '60px' : screenWidth < 640 ? '70px' : '85px',
                          maxWidth: screenWidth < 480 ? '75px' : screenWidth < 640 ? '90px' : '110px'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          scale: isCapitanCard ? 1.1 : 1,
                          zIndex: isCapitanCard ? 10 : 1
                        }}
                        whileHover={{ 
                          scale: isCapitanCard ? 1.15 : 1.05,
                          y: -5,
                          transition: { duration: 0.2 }
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 30 
                        }}
                      >
                        {card ? (
                          <motion.div 
                            className="relative"
                            layout
                          >
                            <div className="w-full">
                              <UnifiedCard
                                card={card}
                                size={screenWidth < 480 ? "tiny" : screenWidth < 640 ? "small" : "medium"}
                                showAddToDeck={false}
                                isHero={isCapitanCard}
                              />
                            </div>
                            {/* Optimized compact remove button */}
                            <motion.button
                              onClick={() => removeFromDeck(card.deckId)}
                              className={`absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center font-bold z-30 shadow-sm ${
                                screenWidth < 480 
                                  ? 'w-3 h-3 text-[8px]' 
                                  : screenWidth < 640 
                                  ? 'w-3.5 h-3.5 text-[10px]' 
                                  : 'w-4 h-4 text-xs'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.8 }}
                              transition={{ duration: 0.1 }}
                            >
                              ×
                            </motion.button>
                            {/* Compact captain indicator */}
                            {isCapitanCard && (
                              <motion.div 
                                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-bold z-20 rounded ${
                                  screenWidth < 480 ? 'text-[6px] px-0.5' : screenWidth < 640 ? 'text-[7px] px-1' : 'text-[8px] px-1'
                                }`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                              >
                                {screenWidth < 480 ? 'C' : screenWidth < 640 ? 'CAP' : 'CAPTAIN'}
                              </motion.div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="aspect-[3/4] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800/50"
                            whileHover={{ 
                              borderColor: '#10B981', 
                              backgroundColor: 'rgba(16, 185, 129, 0.1)' 
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.span 
                              className="text-gray-500 text-sm font-bold"
                              whileHover={{ scale: 1.2, color: '#10B981' }}
                            >
                              +
                            </motion.span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentic THC CLASH Battle System - Uses uploaded gameboard image and admin validation */}
      {isInBattle && (
        <AuthenticTHCClashBattle
          playerDeck={selectedDeck.length > 0 ? selectedDeck : (battleCards || nftBenefits?.enhancedDeck || adminCards.filter(c => c.isUnlocked)).slice(0, 8)}
          captainCard={captainCard || nftBenefits?.captainCard}
          onBattleEnd={endBattle}
          difficulty={difficulty}
          nftData={playerNFT ? {
            nft: { image: playerNFT.image, name: playerNFT.name },
            bonuses: nftBonuses ? { attackBonus: nftBonuses.attackBonus } : undefined
          } : undefined}
          playerWallet={playerWallet}
        />
      )}

      {/* Game Settings Modal */}
      <GameSettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
    </PSG1Emulator>
  );
};

export default THCClashTabsSimple;