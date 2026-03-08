import React, { useState, useEffect } from 'react';
import { X, MessageCircle, MapPin, ShoppingBag, Gift, Send, Bot, Sparkles } from 'lucide-react';
import { saveSelectedNFT } from '../lib/utils';
// AIInfluenceGame removed - now using automatic AI influence system

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

interface Mission {
  id: string;
  title: string;
  description: string;
  city: string;
  reward: number;
  type: 'travel' | 'purchase' | 'sell' | 'daily';
  completed: boolean;
  day: number;
}

interface SpecialEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'market_crash' | 'police_raid' | 'supplier_bonus' | 'territory_war' | 'festival' | 'drought' | 'windfall';
  effect: {
    moneyMultiplier?: number;
    priceChange?: { [key: string]: number };
    riskLevel?: number;
    duration?: number;
  };
  triggerDay: number;
  isActive: boolean;
  aiGenerated: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'plug' | 'system';
  message: string;
  timestamp: Date;
}

interface ThePlugAssistantProps {
  connectedWallet: string;
  gameState: {
    currentCity: string;
    day: number;
    money: number;
  };
  onMissionComplete: (missionId: string, reward: number) => void;
  smokingBuffs?: {
    active: boolean;
    drug: string;
    traits: string[];
  };
  onChatInteraction?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onAvatarChange?: (avatar: string | null) => void;
}

export default function ThePlugAssistant({ connectedWallet, gameState, onMissionComplete, smokingBuffs, onChatInteraction, isOpen = false, onClose, onAvatarChange }: ThePlugAssistantProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [growerNFTs, setGrowerNFTs] = useState<NFT[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'missions' | 'specials'>('chat');
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hasChosenNFT, setHasChosenNFT] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Remove showInfluenceGame state - now handled automatically
  const [aiInfluenceBonus, setAiInfluenceBonus] = useState(0.1); // Base 10% bonus
  const [infiniteMode, setInfiniteMode] = useState(false);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [lastEventDay, setLastEventDay] = useState(0);

  // THC LABZ GROWERZ collection ID
  const GROWERZ_COLLECTION = 'D8bd7Mmev6nopizftEhn6UqFZ7xNKuy6XmM5u3Q78KuD';

  // Fetch user's GROWERZ NFTs
  const fetchGrowerNFTs = async () => {
    if (!connectedWallet) return;
    
    setLoading(true);
    try {
      console.log(`🔍 [AI Assistant] Fetching GROWERZ NFTs for wallet: ${connectedWallet}`);
      
      try {
        // Use the new MY NFTS API with authentic HowRare.is data
        const response = await fetch(`/api/my-nfts/${connectedWallet}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`📡 [AI Assistant] NFT API response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 [AI Assistant] NFT API response data:`, data);
          
          if (data.success && data.nfts && data.nfts.length > 0) {
            console.log(`🌿 [AI Assistant] Found ${data.count} authentic GROWERZ NFTs via ${data.source}`);
            
            // Convert HowRare.is format to component format
            const convertedNFTs = data.nfts.map((nft: any) => ({
              mint: nft.mint,
              name: nft.name,
              image: nft.image,
              description: `Rank #${nft.rank} with rarity score ${nft.rarity_score}`,
              attributes: nft.attributes || [],
              rank: nft.rank,
              rarity_score: nft.rarity_score
            }));
            
            console.log(`🎯 [AI Assistant] Setting ${convertedNFTs.length} NFTs in state:`, convertedNFTs);
            setGrowerNFTs(convertedNFTs);
            
            // Auto-select NFT for single NFT holders who haven't previously chosen one
            if (!selectedNFT && !hasChosenNFT) {
              if (convertedNFTs.length === 1) {
                console.log(`✅ [AI Assistant] Auto-selecting single NFT: ${convertedNFTs[0].name}`);
                // User has exactly one GROWERZ NFT - auto-select it
                console.log(`🎯 Auto-selecting single GROWERZ NFT: ${convertedNFTs[0].name}`);
                handleNFTSelection(convertedNFTs[0]);
              } else if (convertedNFTs.length > 1) {
                // User has multiple NFTs - show notification to select manually
                console.log(`📢 User has ${convertedNFTs.length} GROWERZ NFTs - manual selection required`);
              }
            }
          } else {
            console.log(`⚠️ ${data.message || 'No GROWERZ NFTs found'}`);
            setGrowerNFTs([]);
          }
        } else {
          console.log(`❌ MY NFTS API request failed with status ${response.status}`);
          setGrowerNFTs([]);
        }
      } catch (fetchError) {
        console.error('Error fetching authentic GROWERZ NFTs:', fetchError);
        setGrowerNFTs([]);
      }
    } catch (error) {
      console.error('Error fetching GROWERZ NFTs:', error);
    }
    setLoading(false);
  };

  // Generate missions based on game day
  const generateMissions = () => {
    const baseMissions: Omit<Mission, 'id' | 'completed'>[] = [
      {
        title: "Welcome to The Plug",
        description: "Travel to The NeighborHood to establish your first connection",
        city: "neighborhood",
        reward: 500,
        type: 'travel',
        day: 1
      },
      {
        title: "East Coast Expansion",
        description: "Make your first deal in New York for premium pricing",
        city: "newyork",
        reward: 750,
        type: 'travel',
        day: 5
      },
      {
        title: "Southern Strategy",
        description: "Purchase 10+ items in Memphis for bulk discounts",
        city: "memphis",
        reward: 1000,
        type: 'purchase',
        day: 10
      },
      {
        title: "Midwest Connection",
        description: "Travel to Kansas City and establish operations",
        city: "kansascity",
        reward: 800,
        type: 'travel',
        day: 15
      },
      {
        title: "Oil Money",
        description: "Sell premium strains in Houston for maximum profit",
        city: "houston",
        reward: 1200,
        type: 'sell',
        day: 20
      },
      {
        title: "Big Easy Deals",
        description: "Complete 5 transactions in New Orleans",
        city: "neworleans",
        reward: 900,
        type: 'purchase',
        day: 25
      },
      {
        title: "West Coast Finale",
        description: "Establish your empire in Oakland",
        city: "oakland",
        reward: 1500,
        type: 'travel',
        day: 35
      },
      {
        title: "Mile High Club",
        description: "Complete your journey in Denver with a celebration deal",
        city: "denver",
        reward: 2000,
        type: 'travel',
        day: 40
      }
    ];

    const generatedMissions = baseMissions.map((mission, index) => ({
      ...mission,
      id: `mission_${index}`,
      completed: false
    }));

    setMissions(generatedMissions);
  };

  // Check for mission completion
  useEffect(() => {
    if (missions.length === 0) return;

    missions.forEach(mission => {
      if (mission.completed || gameState.day < mission.day) return;

      let shouldComplete = false;

      switch (mission.type) {
        case 'travel':
          if (gameState.currentCity === mission.city) {
            shouldComplete = true;
          }
          break;
        case 'daily':
          if (gameState.day >= mission.day) {
            shouldComplete = true;
          }
          break;
        // Additional mission types can be handled by parent component
      }

      if (shouldComplete) {
        setMissions(prev => prev.map(m => 
          m.id === mission.id ? { ...m, completed: true } : m
        ));
        onMissionComplete(mission.id, mission.reward);
      }
    });
  }, [gameState.currentCity, gameState.day, missions, onMissionComplete]);

  // Initialize missions on mount
  useEffect(() => {
    generateMissions();
  }, []);

  // Load saved NFT selection from localStorage
  useEffect(() => {
    if (connectedWallet) {
      const savedNFTKey = `theplug_nft_${connectedWallet}`;
      const savedNFT = localStorage.getItem(savedNFTKey);
      if (savedNFT) {
        try {
          const nftData = JSON.parse(savedNFT);
          setSelectedNFT(nftData);
          setHasChosenNFT(true);
          onAvatarChange?.(nftData.image);
        } catch (error) {
          console.error('Error loading saved NFT:', error);
        }
      } else {
        // No NFT selected, use fallback
        onAvatarChange?.(null);
      }
      fetchGrowerNFTs();
    }
  }, [connectedWallet, onAvatarChange]);

  // Auto-switch to appropriate tab based on NFT selection
  useEffect(() => {
    if (selectedNFT && hasChosenNFT) {
      // If user has an NFT selected, default to chat tab
      console.log('✅ [ThePlugAssistant] NFT selected, staying on current tab:', activeTab);
    } else if (!selectedNFT && !hasChosenNFT && (activeTab === 'chat' || activeTab === 'missions' || activeTab === 'specials')) {
      // If no NFT selected and trying to access AI features, show appropriate message
      console.log('⚠️ [ThePlugAssistant] No NFT selected, user needs to select one first');
    }
  }, [selectedNFT, hasChosenNFT, activeTab]);

  // Save NFT selection to localStorage
  // Calculate universal rank-based bonuses for ANY GROWERZ NFT
  const calculateRankBonuses = (rank: number) => {
    if (!rank || rank < 1 || rank > 2347) return null;
    
    // Universal rank-based bonus system for all 2,347 GROWERZ NFTs
    const bonuses = {
      tradingBonus: 0,
      negotiationBonus: 0,
      riskReduction: 0,
      heatReduction: 0,
      aiResponseQuality: 0,
      missionRewards: 0,
      tier: 'Common'
    };
    
    // Mythic Tier (Rank 1-71) - Ultra rare bonuses
    if (rank <= 71) {
      bonuses.tradingBonus = 25; // +25% trading profits
      bonuses.negotiationBonus = 20; // +20% better prices
      bonuses.riskReduction = 30; // -30% risk from events
      bonuses.heatReduction = 25; // -25% heat accumulation
      bonuses.aiResponseQuality = 0.9; // Premium AI responses
      bonuses.missionRewards = 50; // +50% mission rewards
      bonuses.tier = 'Mythic';
    }
    // Epic Tier (Rank 72-361) - High bonuses
    else if (rank <= 361) {
      bonuses.tradingBonus = 20;
      bonuses.negotiationBonus = 15;
      bonuses.riskReduction = 25;
      bonuses.heatReduction = 20;
      bonuses.aiResponseQuality = 0.8;
      bonuses.missionRewards = 40;
      bonuses.tier = 'Epic';
    }
    // Rare Tier (Rank 362-843) - Good bonuses
    else if (rank <= 843) {
      bonuses.tradingBonus = 15;
      bonuses.negotiationBonus = 12;
      bonuses.riskReduction = 20;
      bonuses.heatReduction = 15;
      bonuses.aiResponseQuality = 0.7;
      bonuses.missionRewards = 30;
      bonuses.tier = 'Rare';
    }
    // Uncommon Tier (Rank 844-1446) - Moderate bonuses
    else if (rank <= 1446) {
      bonuses.tradingBonus = 10;
      bonuses.negotiationBonus = 8;
      bonuses.riskReduction = 15;
      bonuses.heatReduction = 10;
      bonuses.aiResponseQuality = 0.6;
      bonuses.missionRewards = 20;
      bonuses.tier = 'Uncommon';
    }
    // Common Tier (Rank 1447-2420) - Base bonuses
    else {
      bonuses.tradingBonus = 5;
      bonuses.negotiationBonus = 5;
      bonuses.riskReduction = 5;
      bonuses.heatReduction = 5;
      bonuses.aiResponseQuality = 0.5;
      bonuses.missionRewards = 10;
      bonuses.tier = 'Common';
    }
    
    return bonuses;
  };

  // Get current active NFT bonuses for consistent gameplay
  const getActiveNFTBonuses = () => {
    if (!connectedWallet) return null;
    
    try {
      const bonusKey = `nft_bonuses_${connectedWallet}`;
      const savedBonuses = localStorage.getItem(bonusKey);
      return savedBonuses ? JSON.parse(savedBonuses) : null;
    } catch (error) {
      console.error('Error loading NFT bonuses:', error);
      return null;
    }
  };

  // Universal NFT selection system - wrapper for shared utility
  const handleNFTSelection = (nft: NFT) => {
    if (connectedWallet) {
      // Use shared utility for universal selection
      const selectedNFTData = saveSelectedNFT(nft, connectedWallet);
      
      // Update local component state
      setSelectedNFT(nft);
      setHasChosenNFT(true);
      
      // Update parent component avatar
      onAvatarChange?.(nft.image);
      
      // Calculate rank bonuses for chat message - Updated tier boundaries: Mythic: 1-71, Epic: 72-361, Rare: 362-843, Uncommon: 844-1446, Common: 1447-2420
      const calculateRankBonuses = (rank: number) => {
        if (rank >= 1 && rank <= 71) return { tier: 'Mythic', tradingBonus: 25, negotiationBonus: 25, riskReduction: 25, heatReduction: 25, aiResponseQuality: 2.0, missionRewards: 50 };
        else if (rank >= 72 && rank <= 361) return { tier: 'Epic', tradingBonus: 20, negotiationBonus: 20, riskReduction: 20, heatReduction: 20, aiResponseQuality: 1.5, missionRewards: 30 };
        else if (rank >= 362 && rank <= 843) return { tier: 'Rare', tradingBonus: 15, negotiationBonus: 15, riskReduction: 15, heatReduction: 15, aiResponseQuality: 1.2, missionRewards: 20 };
        else if (rank >= 844 && rank <= 1446) return { tier: 'Uncommon', tradingBonus: 10, negotiationBonus: 10, riskReduction: 10, heatReduction: 10, aiResponseQuality: 0.8, missionRewards: 15 };
        else if (rank >= 1447 && rank <= 2420) return { tier: 'Common', tradingBonus: 5, negotiationBonus: 5, riskReduction: 5, heatReduction: 5, aiResponseQuality: 0.5, missionRewards: 10 };
        else return { tier: 'Common', tradingBonus: 5, negotiationBonus: 5, riskReduction: 5, heatReduction: 5, aiResponseQuality: 0.5, missionRewards: 10 }; // fallback
      };
      
      const rankBonuses = calculateRankBonuses((nft as any).rank || 2420);
      
      // Add system message showing the selection
      setChatMessages(prev => [...prev, {
        id: `selection_${Date.now()}`,
        sender: 'system',
        message: `🤖 ${nft.name} (Rank #${(nft as any).rank || 2420} - ${rankBonuses.tier} Tier) is now your Plug! Active bonuses: +${rankBonuses.tradingBonus}% trading profits, +${rankBonuses.negotiationBonus}% better prices, -${rankBonuses.riskReduction}% event risks, +${rankBonuses.missionRewards}% mission rewards.`,
        timestamp: new Date()
      }]);
      
      // Switch to chat tab when NFT is selected
      setActiveTab('chat');
      
      console.log(`🎯 [ThePlugAssistant] NFT selected via shared utility: ${nft.name}`);
    }
  };

  // Get AI assistant avatar and name
  const getAssistantInfo = () => {
    if (selectedNFT?.image) {
      return {
        avatar: selectedNFT.image,
        name: selectedNFT.name || 'The Plug',
        personality: getAITemperature(selectedNFT.attributes)
      };
    }
    
    // Grench fallback for users without GROWERZ NFTs
    return {
      avatar: '/grench-avatar.png',
      name: 'Grench',
      personality: 0.7
    };
  };

  // Calculate AI temperature based on NFT attributes
  const getAITemperature = (attributes: any[]) => {
    let temperature = 0.5; // Default
    
    attributes?.forEach(attr => {
      if (attr.trait_type?.toLowerCase().includes('rarity')) {
        // Rarer NFTs get higher temperature (more creative responses)
        if (attr.value?.toLowerCase().includes('legendary')) temperature = 0.9;
        else if (attr.value?.toLowerCase().includes('epic')) temperature = 0.8;
        else if (attr.value?.toLowerCase().includes('rare')) temperature = 0.7;
        else temperature = 0.6;
      }
      
      if (attr.trait_type?.toLowerCase().includes('energy') || attr.trait_type?.toLowerCase().includes('power')) {
        // Higher energy/power = higher temperature
        const value = parseInt(attr.value) || 50;
        temperature = Math.min(0.9, 0.4 + (value / 100) * 0.5);
      }
    });
    
    return temperature;
  };

  // Advanced AI response using OpenAI GPT-4o-mini through The Plug controller
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      console.log('🤖 The Plug generating advanced AI response...');
      
      // Use advanced AI controller for sophisticated responses
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          gameState: {
            ...gameState,
            health: 100,
            timeLeftInDay: 12,
            dealsCompleted: 0,
            totalTransactions: 0,
            timesArrested: 0,
            timesRobbed: 0,
            recentSales: []
          },
          playerNFTs: growerNFTs || [],
          walletAddress: connectedWallet
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🧠 DOPE_BUDZ_AI Response Generated:', data.message);
        console.log('🔧 System Status:', data.systemStatus);
        
        if (data.issues && data.issues.length > 0) {
          console.log('⚠️ System Issues Detected:', data.issues);
        }
        
        if (data.recommendations && data.recommendations.length > 0) {
          console.log('💡 AI Recommendations:', data.recommendations);
        }
        
        return data.message;
      }
    } catch (error) {
      console.error('Advanced AI Response Error:', error);
    }
    
    // Fallback to local responses if AI service unavailable
    const assistant = getAssistantInfo();
    const fallbackResponses = [
      `Yo, ${userMessage.toLowerCase().includes('budz') ? 'I see you know the good stuff' : 'let me tell you about some quality BUDZ'}! Day ${gameState.day} in ${gameState.currentCity} - DOPE_BUDZ_AI is momentarily recalibrating, but the hustle never stops.`,
      `Listen up - that BUDZ ain't gonna sell itself. In ${gameState.currentCity}, you got opportunities everywhere. The AI is running system diagnostics, so let's keep pushing. What's your next move?`,
      `${gameState.day > 30 ? 'You been grinding hard' : 'Still early in the game'} - DOPE_BUDZ_AI is ensuring all your missions stay completable and the game runs smooth. Infinite mode means infinite possibilities!`,
      `From my experience in the streets, ${gameState.currentCity} is where the real action happens. The DOPE_BUDZ_AI system is validating all game systems to ensure optimal performance.`,
      `Day ${gameState.day} and counting... The most advanced AI system is monitoring your gameplay for perfect synchronization. Everything's being optimized in real-time!`
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  };

  // Generate AI-powered special events that happen every 4-7 days
  const generateSpecialEvent = (): SpecialEvent => {
    const eventTypes = [
      {
        type: 'market_crash' as const,
        titles: ['Market Meltdown', 'Supply Chain Crisis', 'Economic Downturn'],
        descriptions: [
          'The REGZ market just crashed! Prices are volatile but opportunity knocks.',
          'Supply chains disrupted - smart traders can capitalize on the chaos.',
          'Economic uncertainty hits the streets - adapt or get left behind.'
        ],
        effects: { moneyMultiplier: 0.7, priceChange: { all: -0.3 }, riskLevel: 1.5 }
      },
      {
        type: 'police_raid' as const,
        titles: ['Heat Wave', 'Five-O Crackdown', 'Street Sweep'],
        descriptions: [
          'Police activity increased citywide - lay low and move smart.',
          'Major bust went down nearby - security is tight everywhere.',
          'Task force active in the area - time to be extra careful.'
        ],
        effects: { riskLevel: 2.0, moneyMultiplier: 0.8 }
      },
      {
        type: 'supplier_bonus' as const,
        titles: ['Connect Hookup', 'Quality Score', 'VIP Treatment'],
        descriptions: [
          'Your supplier hooked you up with premium REGZ at wholesale prices!',
          'Quality reputation earned you exclusive access to top-shelf product.',
          'VIP status unlocked - your connects are treating you right.'
        ],
        effects: { moneyMultiplier: 1.4, priceChange: { buy: -0.2 } }
      },
      {
        type: 'territory_war' as const,
        titles: ['Turf Battle', 'Territory Dispute', 'Block Wars'],
        descriptions: [
          'Rival crews are fighting for territory - dangerous but profitable.',
          'Territory dispute created a power vacuum - time to make moves.',
          'Block wars mean chaos, but chaos means opportunity for the bold.'
        ],
        effects: { moneyMultiplier: 1.6, riskLevel: 1.8, priceChange: { sell: 0.3 } }
      },
      {
        type: 'festival' as const,
        titles: ['Street Festival', 'Block Party', 'Community Celebration'],
        descriptions: [
          'Local festival brings crowds - perfect cover for business.',
          'Block party atmosphere means relaxed security and high demand.',
          'Community celebration creates the perfect sales environment.'
        ],
        effects: { moneyMultiplier: 1.3, riskLevel: 0.7, priceChange: { sell: 0.2 } }
      },
      {
        type: 'drought' as const,
        titles: ['Supply Shortage', 'Dry Spell', 'Market Drought'],
        descriptions: [
          'REGZ shortage citywide - prices skyrocketing for available product.',
          'Supply drought hit the market - whoever has product controls the game.',
          'Dry spell means premium prices for quality REGZ inventory.'
        ],
        effects: { priceChange: { sell: 0.5, buy: 0.3 }, moneyMultiplier: 1.2 }
      },
      {
        type: 'windfall' as const,
        titles: ['Lucky Break', 'Windfall Score', 'Golden Opportunity'],
        descriptions: [
          'Unexpected opportunity landed in your lap - pure profit!',
          'Lucky connection came through with a windfall deal.',
          'Golden opportunity presented itself - fortune favors the prepared.'
        ],
        effects: { moneyMultiplier: 1.8, duration: 2 }
      }
    ];

    const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const titleIndex = Math.floor(Math.random() * selectedType.titles.length);
    const descIndex = Math.floor(Math.random() * selectedType.descriptions.length);

    return {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: selectedType.titles[titleIndex],
      description: selectedType.descriptions[descIndex],
      eventType: selectedType.type,
      effect: {
        moneyMultiplier: selectedType.effects.moneyMultiplier,
        priceChange: selectedType.effects.priceChange || {},
        riskLevel: selectedType.effects.riskLevel,
        duration: selectedType.effects.duration
      },
      triggerDay: gameState.day,
      isActive: true,
      aiGenerated: true
    };
  };

  // Check if it's time for a new special event (every 4-7 days)
  useEffect(() => {
    const daysSinceLastEvent = gameState.day - lastEventDay;
    const shouldTriggerEvent = daysSinceLastEvent >= 4 && Math.random() < (daysSinceLastEvent - 3) * 0.3;

    if (shouldTriggerEvent || (gameState.day === 7 && specialEvents.length === 0)) {
      const newEvent = generateSpecialEvent();
      setSpecialEvents(prev => [...prev.filter(e => e.isActive), newEvent]);
      setLastEventDay(gameState.day);
      
      // Add AI message about the event
      const eventMsg: ChatMessage = {
        id: `event_msg_${Date.now()}`,
        sender: 'plug',
        message: `🚨 BREAKING: ${newEvent.title}! ${newEvent.description} This changes the game for the next few days - adapt your strategy!`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, eventMsg]);
    }

    // Deactivate old events (3-5 day duration)
    setSpecialEvents(prev => 
      prev.map(event => ({
        ...event,
        isActive: gameState.day - event.triggerDay < (event.effect.duration || 3)
      }))
    );
  }, [gameState.day, lastEventDay, specialEvents.length]);

  // Get currently active special events
  const activeSpecialEvents = specialEvents.filter(event => event.isActive);

  // Handle sending chat message
  // Automatic AI influence system - triggers randomly on good interactions
  const triggerAutomaticAIInfluence = (messageQuality: 'good' | 'great' | 'excellent' = 'good') => {
    // Random chance to trigger AI influence based on message quality
    const triggerChances = {
      good: 0.15,      // 15% chance for normal good conversations
      great: 0.35,     // 35% chance for great interactions
      excellent: 0.60  // 60% chance for excellent interactions
    };
    
    const shouldTrigger = Math.random() < triggerChances[messageQuality];
    
    if (shouldTrigger) {
      // Calculate bonus based on quality and current state
      const bonusAmount = {
        good: 0.05,      // +5% bonus
        great: 0.10,     // +10% bonus  
        excellent: 0.15  // +15% bonus
      };
      
      const newBonus = Math.min(aiInfluenceBonus + bonusAmount[messageQuality], 0.5); // Max 50% total bonus
      setAiInfluenceBonus(newBonus);
      
      // Show temporary notification
      const bonusPercent = (bonusAmount[messageQuality] * 100).toFixed(0);
      console.log(`✨ AI Enhancement triggered! +${bonusPercent}% bonus from ${messageQuality} interaction`);
      
      // Bonus decays over time (every 2 minutes, reduce by 1%)
      setTimeout(() => {
        setAiInfluenceBonus(prev => Math.max(prev - 0.01, 0.1));
      }, 120000);
    }
  };

  // Analyze message quality for AI influence triggers
  const analyzeMessageQuality = (userMessage: string, aiResponse: string): 'good' | 'great' | 'excellent' => {
    const msg = userMessage.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    // Excellent quality indicators
    if (
      (msg.includes('strategy') || msg.includes('optimize') || msg.includes('maximize')) ||
      (msg.length > 50 && (msg.includes('help') || msg.includes('advice'))) ||
      (response.includes('optimization') || response.includes('strategy') || response.length > 100)
    ) {
      return 'excellent';
    }
    
    // Great quality indicators  
    if (
      (msg.includes('budz') || msg.includes('earn') || msg.includes('profit')) ||
      (msg.includes('what') || msg.includes('how') || msg.includes('where')) ||
      (response.includes('reputation') || response.includes('deals') || response.length > 50)
    ) {
      return 'great';
    }
    
    // Default to good for any meaningful interaction
    return 'good';
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: currentMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    const messageText = currentMessage;
    setCurrentMessage('');
    setIsTyping(true);
    
    // Track chat interaction for achievements
    if (onChatInteraction) {
      onChatInteraction();
    }
    
    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(messageText);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'plug',
        message: aiResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      
      // Analyze conversation quality and potentially trigger AI influence
      const messageQuality = analyzeMessageQuality(messageText, aiResponse);
      triggerAutomaticAIInfluence(messageQuality);
      
    }, 1000 + Math.random() * 2000); // 1-3 second delay for realism
  };

  // Enable infinite mode beyond 45 days
  useEffect(() => {
    if (gameState.day >= 45 && !infiniteMode) {
      setInfiniteMode(true);
      const welcomeMsg: ChatMessage = {
        id: 'infinite_welcome',
        sender: 'plug',
        message: `Congratulations! You've unlocked INFINITE MODE! The 45-day cycle is complete, but the REGZ hustle never stops. Welcome to unlimited gameplay where every day brings new opportunities!`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, welcomeMsg]);
    }
  }, [gameState.day, infiniteMode]);

  // Special offers based on current city and day
  const getSpecialOffers = () => {
    const offers = [];
    
    if (gameState.day <= 10) {
      offers.push({
        title: "Starter Pack Special",
        description: "20% off all Reggie purchases for new players",
        discount: 20,
        type: "reggie"
      });
    }

    if (gameState.currentCity === 'miami') {
      offers.push({
        title: "Miami Vice Special",
        description: "Double profit on all premium strain sales",
        multiplier: 2,
        type: "premium_sales"
      });
    }

    if (gameState.currentCity === 'denver') {
      offers.push({
        title: "Mile High Discount",
        description: "25% off all purchases in Denver",
        discount: 25,
        type: "all_purchases"
      });
    }

    if (gameState.day % 7 === 0) {
      offers.push({
        title: "Weekly Grower Bonus",
        description: "10% extra profit on all sales today",
        multiplier: 1.1,
        type: "all_sales"
      });
    }

    return offers;
  };

  // Initialize component and listen for NFT selection changes
  useEffect(() => {
    if (connectedWallet) {
      // Fetch NFTs on mount  
      fetchGrowerNFTs();
      
      // Load any previously selected NFT from localStorage
      const savedNFTKey = `theplug_nft_${connectedWallet}`;
      const savedNFT = localStorage.getItem(savedNFTKey);
      if (savedNFT) {
        try {
          const nft = JSON.parse(savedNFT);
          setSelectedNFT(nft);
          setHasChosenNFT(true);
          onAvatarChange?.(nft.image);
          
          // Restore global bonuses for the loaded NFT
          const bonusKey = `nft_bonuses_${connectedWallet}`;
          const savedBonuses = localStorage.getItem(bonusKey);
          if (savedBonuses) {
            (window as any).activeNFTBonuses = JSON.parse(savedBonuses);
          }
        } catch (error) {
          console.error('Error loading saved NFT:', error);
        }
      }
      
      // Listen for NFT selection changes from other components
      const handleNFTSelectionChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { nft, bonuses, walletAddress } = customEvent.detail;
        if (walletAddress === connectedWallet) {
          setSelectedNFT(nft);
          setHasChosenNFT(true);
          onAvatarChange?.(nft.image);
          console.log(`🔄 [NFT Selection] Updated from external source: ${nft.name}`);
        }
      };
      
      // Listen specifically for plugAvatarChanged events
      const handlePlugAvatarChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        const nftData = customEvent.detail;
        if (nftData && nftData.image && connectedWallet) {
          console.log(`🎯 [ThePlugAssistant] Received plugAvatarChanged event:`, nftData.name);
          setSelectedNFT(nftData);
          setHasChosenNFT(true);
          onAvatarChange?.(nftData.image);
          
          // Add system message to indicate the change
          setChatMessages(prev => [...prev, {
            id: `avatar_change_${Date.now()}`,
            sender: 'system',
            message: `🔄 ${nftData.name} is now your active Plug assistant!`,
            timestamp: new Date()
          }]);
        }
      };
      
      // Unified Plug activation event listener
      const handlePlugActivated = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { nft, bonuses, walletAddress } = customEvent.detail;
        if (walletAddress === connectedWallet) {
          setSelectedNFT(nft);
          setHasChosenNFT(true);
          onAvatarChange?.(nft.image);
          console.log(`🎯 [ThePlugAssistant] Activated Plug: ${nft.name}`);
          
          // Add system message to indicate the activation
          setChatMessages(prev => [...prev, {
            id: `plug_activated_${Date.now()}`,
            sender: 'system',
            message: `🎯 ${nft.name} is now your active Plug assistant!`,
            timestamp: new Date()
          }]);
        }
      };
      
      // Add unified event listener
      window.addEventListener('plugActivated', handlePlugActivated);
      
      // Cleanup function
      return () => {
        window.removeEventListener('plugActivated', handlePlugActivated);
      };
    }
  }, [connectedWallet, onAvatarChange]);

  // Generate missions on component mount
  useEffect(() => {
    generateMissions();
  }, []);

  // Listen for external events like tab switching
  useEffect(() => {
    const handleSwitchToChatTab = () => {
      console.log('🎯 [ThePlugAssistant] Switching to chat tab via event');
      setActiveTab('chat');
    };
    
    window.addEventListener('switchToPlugChatTab', handleSwitchToChatTab);
    
    return () => {
      window.removeEventListener('switchToPlugChatTab', handleSwitchToChatTab);
    };
  }, []);

  const availableMissions = missions.filter(m => m.day <= gameState.day && !m.completed);
  const completedMissions = missions.filter(m => m.completed);
  const specialOffers = getSpecialOffers();

  if (!connectedWallet) return null;

  // Mobile floating bubble interface (shows on phones when not in modal)
  if (!isOpen && window.innerWidth <= 640) {
    return (
      <>
        {/* Floating Plug Bubble for Mobile */}
        <div 
          onClick={() => setShowFloatingChat(true)}
          className="fixed bottom-4 right-4 z-40 mobile-touch-target"
        >
          <div className="relative">
            {/* Bubble container */}
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-green-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-pointer transform hover:scale-105 transition-all">
              {selectedNFT?.image ? (
                <img 
                  src={selectedNFT.image} 
                  alt="The Plug"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <Bot className="w-8 h-8 text-white" />
              )}
            </div>
            
            {/* Notification dot (if there are new messages or missions) */}
            {availableMissions.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{availableMissions.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Full-screen floating chat modal */}
        {showFloatingChat && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="w-full h-full max-w-md bg-gray-900 flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-green-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedNFT?.image && (
                    <img 
                      src={selectedNFT.image} 
                      alt="The Plug"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{getAssistantInfo().name}</h3>
                    <p className="text-sm opacity-90">
                      {infiniteMode ? 'Infinite Mode Active' : `Day ${gameState.day}/45`} • Your AI Cannabis Advisor
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFloatingChat(false)}
                  className="text-white hover:text-gray-200 transition-colors mobile-touch-target"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat content - Full height */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Bot className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-lg font-semibold mb-2">Welcome to The Plug!</p>
                      <p className="text-sm">
                        {hasChosenNFT 
                          ? "Your AI assistant is ready to help with market intelligence and strategy advice."
                          : "Select a GROWERZ NFT to unlock your personal AI cannabis advisor."
                        }
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] px-4 py-2 rounded-lg ${
                            msg.sender === 'user'
                              ? 'bg-green-600 text-white'
                              : msg.sender === 'system'
                              ? 'bg-gray-700 text-gray-300 border border-gray-600'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-purple-600 text-white px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={hasChosenNFT ? "Ask The Plug for advice..." : "Select an NFT to chat..."}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                      disabled={!hasChosenNFT}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || !hasChosenNFT}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors mobile-touch-target"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop modal interface (unchanged)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Assistant Panel - Mobile Responsive */}
      <div className="w-full max-w-md max-h-[500px] bg-gray-900 rounded-lg shadow-2xl border border-green-400 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-green-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedNFT?.image && (
                <img 
                  src={selectedNFT.image} 
                  alt="The Plug"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
              )}
              <div>
                <h3 className="font-bold text-lg">{getAssistantInfo().name}</h3>
                <p className="text-sm opacity-90">
                  {infiniteMode ? 'Infinite Mode Active' : `Day ${gameState.day}/45`} • Your AI Cannabis Advisor
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose?.()}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Mobile Responsive */}
        <div className="border-b border-gray-700">
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="mobile-touch-target w-full flex items-center justify-between px-4 py-4 text-white bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' && <><MessageCircle className="w-4 h-4" /> Chat</>}
                  {activeTab === 'missions' && <><MapPin className="w-4 h-4" /> Missions</>}
                  {activeTab === 'specials' && <><ShoppingBag className="w-4 h-4" /> Specials</>}
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {showMobileMenu && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-600 z-[9999] shadow-xl">
                  {[
                    { id: 'chat', label: 'Chat', icon: MessageCircle, requiresNFT: true },
                    { id: 'missions', label: 'Missions', icon: MapPin, requiresNFT: true },
                    { id: 'specials', label: 'Specials', icon: ShoppingBag, requiresNFT: true }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isDisabled = tab.requiresNFT && !selectedNFT;
                    const isAvailable = !isDisabled;
                    
                    return (
                      <button
                        key={tab.id}
                        data-nft-tab={tab.id}
                        onClick={() => {
                          if (isAvailable) {
                            setActiveTab(tab.id as any);
                            setShowMobileMenu(false);
                          }
                        }}
                        disabled={isDisabled}
                        className={`mobile-touch-target w-full px-4 py-4 text-left font-medium transition-colors border-b border-gray-700 last:border-b-0 flex items-center gap-2 ${
                          activeTab === tab.id && isAvailable
                            ? 'text-green-400 bg-gray-700' 
                            : isDisabled
                            ? 'text-gray-600 cursor-not-allowed opacity-50'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer'
                        }`}
                        title={isDisabled ? 'Select a GROWERZ NFT to access AI features' : ''}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {isDisabled && <span className="text-xs text-red-400 ml-auto">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:flex">
            {[
              { id: 'chat', label: 'Chat', icon: MessageCircle, requiresNFT: true },
              { id: 'missions', label: 'Missions', icon: MapPin, requiresNFT: true },
              { id: 'specials', label: 'Specials', icon: ShoppingBag, requiresNFT: true }
            ].map(tab => {
              const Icon = tab.icon;
              const isDisabled = tab.requiresNFT && !selectedNFT;
              const isAvailable = !isDisabled;
              
              return (
                <button
                  key={tab.id}
                  data-nft-tab={tab.id}
                  onClick={() => isAvailable && setActiveTab(tab.id as any)}
                  disabled={isDisabled}
                  className={`flex-1 p-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id && isAvailable
                      ? 'text-green-400 border-b-2 border-green-400 bg-gray-800' 
                      : isDisabled
                      ? 'text-gray-600 cursor-not-allowed opacity-50'
                      : 'text-gray-400 hover:text-white cursor-pointer'
                  }`}
                  title={isDisabled ? 'Select a GROWERZ NFT to access AI features' : ''}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  {tab.label}
                  {isDisabled && <span className="text-xs text-red-400 ml-1">🔒</span>}
                </button>
              );
            })}
          </div>
        </div>lassName="block text-xs mt-1">🔒</span>}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="space-y-3">
                {!selectedNFT ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h4 className="text-red-400 font-bold mb-2">AI Chat Locked</h4>
                    <p className="text-gray-400 text-sm">Select a GROWERZ NFT to unlock The Plug AI assistant</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-green-400 font-bold">Talk to {getAssistantInfo().name}</h4>
                
                {/* Chat Messages */}
                <div className="bg-gray-800 rounded p-3 h-48 overflow-y-auto space-y-2">
                  {chatMessages.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-8">
                      Start a conversation about the REGZ game, strategies, or anything else!
                    </div>
                  )}
                  
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`p-2 rounded text-sm ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white ml-8' 
                          : msg.sender === 'system'
                          ? 'bg-yellow-600 text-white mx-4'
                          : 'bg-green-600 text-white mr-8'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1">
                        {msg.sender === 'user' 
                          ? 'You' 
                          : msg.sender === 'system'
                          ? 'System'
                          : getAssistantInfo().name}
                      </div>
                      {msg.message}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="bg-green-600 text-white p-2 rounded text-sm mr-8">
                      <div className="font-semibold text-xs mb-1">{getAssistantInfo().name}</div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* AI Influence Game Button */}
                {/* AI Influence Status - Shows when bonus is active */}
                {aiInfluenceBonus > 0.1 && (
                  <div className="mb-3 bg-gradient-to-r from-purple-900/30 to-green-900/30 border border-purple-500/50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-semibold">AI Enhancement Active</span>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      Bonus: +{((aiInfluenceBonus - 0.1) * 100).toFixed(0)}% from good vibes
                    </p>
                  </div>
                )}

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about REGZ, cities, strategies..."
                    className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:border-green-400 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                </>
                )}
              </div>
            )}

            {activeTab === 'missions' && (
              <div className="space-y-3">
                {!selectedNFT ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h4 className="text-red-400 font-bold mb-2">Missions Locked</h4>
                    <p className="text-gray-400 text-sm">Select a GROWERZ NFT to unlock AI-powered missions</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-green-400 font-bold">Active Missions</h4>
                {availableMissions.length > 0 ? (
                  availableMissions.map(mission => (
                    <div key={mission.id} className="bg-gray-800 p-3 rounded border border-green-400">
                      <h5 className="text-white font-bold text-sm">{mission.title}</h5>
                      <p className="text-gray-300 text-xs mb-2">{mission.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400 text-xs">Day {mission.day}+</span>
                        <span className="text-green-400 text-xs font-bold">+${mission.reward}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No active missions. Keep playing to unlock more!</p>
                )}
                
                {completedMissions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-gray-400 font-bold text-sm">Completed ({completedMissions.length})</h4>
                    <div className="text-green-400 text-xs mt-1">
                      Total Earned: +${completedMissions.reduce((sum, m) => sum + m.reward, 0)}
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            )}

            {activeTab === 'specials' && (
              <div className="space-y-3">
                {!selectedNFT ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h4 className="text-red-400 font-bold mb-2">Specials Locked</h4>
                    <p className="text-gray-400 text-sm">Select a GROWERZ NFT to unlock special events and buffs</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-green-400 font-bold">Active Smoking Buffs</h4>
                
                {/* Smoking Enhancement Display */}
                {smokingBuffs?.active ? (
                  <div className="bg-purple-900 bg-opacity-50 p-3 rounded border border-purple-400">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-purple-400 font-bold text-sm">🌿 Cannabis Enhancement Active</h5>
                      <span className="text-xs text-green-400">Until Next Session</span>
                    </div>
                    <p className="text-gray-300 text-xs mb-2">
                      Your AI assistant is enhanced by {smokingBuffs.drug} effects, providing deeper insights and advanced market analysis.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      {smokingBuffs.traits?.map((trait, index) => (
                        <span key={index} className="px-2 py-1 rounded bg-purple-600 text-white">
                          {trait}
                        </span>
                      ))}
                    </div>
                    
                    <div className="bg-gray-800 p-2 rounded text-xs">
                      <p className="text-green-400 font-semibold mb-1">Enhancement Effects:</p>
                      <ul className="text-gray-300 space-y-1">
                        <li>• More detailed market predictions</li>
                        <li>• Enhanced risk assessment capabilities</li>
                        <li>• Strain-specific trading insights</li>
                        <li>• Improved event probability analysis</li>
                      </ul>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Smoke cannabis from your inventory (once per day) to enhance AI analysis
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 p-4 rounded border border-gray-600 text-center">
                    <p className="text-gray-400 text-sm mb-2">No Active Smoking Buffs</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Smoke cannabis from your inventory to enhance your AI assistant's capabilities.
                      Each strain provides different analytical improvements.
                    </p>
                    <div className="text-xs text-purple-400 space-y-1">
                      <p><strong>Indica:</strong> Enhanced risk analysis</p>
                      <p><strong>Sativa:</strong> Improved market predictions</p>
                      <p><strong>Hybrid:</strong> Balanced analytical enhancement</p>
                    </div>
                  </div>
                )}

                <h4 className="text-green-400 font-bold mt-6">Special Events</h4>
                
                {activeSpecialEvents.length > 0 ? (
                  activeSpecialEvents.map(event => (
                    <div key={event.id} className="bg-gray-800 p-3 rounded border border-yellow-400">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-yellow-400 font-bold text-sm">{event.title}</h5>
                        <span className="text-xs text-green-400">Day {event.triggerDay}</span>
                      </div>
                      <p className="text-gray-300 text-xs mb-2">{event.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {event.effect.moneyMultiplier && (
                          <span className={`px-2 py-1 rounded ${
                            event.effect.moneyMultiplier > 1 ? 'bg-green-600' : 'bg-red-600'
                          } text-white`}>
                            {event.effect.moneyMultiplier > 1 ? '+' : ''}{Math.round((event.effect.moneyMultiplier - 1) * 100)}% Money
                          </span>
                        )}
                        {event.effect.riskLevel && (
                          <span className={`px-2 py-1 rounded ${
                            event.effect.riskLevel > 1 ? 'bg-red-600' : 'bg-green-600'
                          } text-white`}>
                            {event.effect.riskLevel > 1 ? 'High' : 'Low'} Risk
                          </span>
                        )}
                        {event.effect.priceChange && (
                          <span className="px-2 py-1 rounded bg-blue-600 text-white">
                            Price Changes
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-400">
                        Duration: {event.effect.duration || 3} days • AI Generated
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-800 p-4 rounded border border-gray-600 text-center">
                    <p className="text-gray-400 text-sm mb-2">No active events</p>
                    <p className="text-xs text-gray-500">
                      Special events occur every 4-7 days and change the game dynamics.
                      Each event is AI-generated and never plays the same way twice.
                    </p>
                  </div>
                )}
                
                {specialEvents.filter(e => !e.isActive).length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-gray-400 font-bold text-sm mb-2">Recent Events</h5>
                    <div className="space-y-1">
                      {specialEvents.filter(e => !e.isActive).slice(-3).map(event => (
                        <div key={event.id} className="text-xs text-gray-500">
                          Day {event.triggerDay}: {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            )}


          </div>
      </div>
      

    </div>
  );
}