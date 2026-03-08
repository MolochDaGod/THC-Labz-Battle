import React, { useState, useEffect } from 'react';
import { X, MessageCircle, MapPin, ShoppingBag, Gift, Send, Bot, Sparkles } from 'lucide-react';

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
  sender: 'user' | 'plug';
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
}

export default function ThePlugAssistant({ connectedWallet, gameState, onMissionComplete, smokingBuffs, onChatInteraction }: ThePlugAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [growerNFTs, setGrowerNFTs] = useState<NFT[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'missions' | 'specials' | 'nft'>('chat');
  const [hasChosenNFT, setHasChosenNFT] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
      console.log(`🔍 Fetching GROWERZ NFTs for wallet: ${connectedWallet}`);
      
      try {
        // Using our server API endpoint to fetch NFTs
        const response = await fetch(`/api/nft/growerz/${connectedWallet}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            if (data.nfts && data.nfts.length > 0) {
              if (data.fallback) {
                console.log(`🔄 Using fallback GROWERZ NFTs: ${data.message}`);
              } else {
                console.log(`🌿 Found ${data.count} authentic GROWERZ NFTs via ${data.method}`);
              }
              setGrowerNFTs(data.nfts);
              
              // Only auto-select if user hasn't chosen an NFT yet
              if (!selectedNFT && !hasChosenNFT) {
                setSelectedNFT(data.nfts[0]);
              }
              
              // If user had a previously selected NFT, try to find it again
              if (selectedNFT && data.nfts.length > 0) {
                const existingNFT = data.nfts.find((nft: NFT) => nft.mint === selectedNFT.mint);
                if (existingNFT) {
                  setSelectedNFT(existingNFT);
                }
              }
            } else {
              console.log('❌ No GROWERZ NFTs found in your wallet - you need to own THC LABZ GROWERZ collection NFTs');
              setGrowerNFTs([]);
              setSelectedNFT(null);
            }
          } else {
            console.log('API response failed');
            setGrowerNFTs([]);
          }
        } else {
          console.error('Failed to fetch GROWERZ NFTs:', response.status, response.statusText);
          setGrowerNFTs([]);
          setSelectedNFT(null);
          console.log('❌ NFT API completely failed - unable to fetch authentic NFTs');
        }
      } catch (fetchError) {
        console.error('Error fetching NFTs:', fetchError);
        setGrowerNFTs([]);
        setSelectedNFT(null);
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
        } catch (error) {
          console.error('Error loading saved NFT:', error);
        }
      }
      fetchGrowerNFTs();
    }
  }, [connectedWallet]);

  // Save NFT selection to localStorage
  const saveSelectedNFT = (nft: NFT) => {
    if (connectedWallet) {
      const savedNFTKey = `theplug_nft_${connectedWallet}`;
      localStorage.setItem(savedNFTKey, JSON.stringify(nft));
      setSelectedNFT(nft);
      setHasChosenNFT(true);
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

  // Generate AI response (mock for now, will use OpenAI when key is provided)
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const assistant = getAssistantInfo();
    const responses = [
      `Yo, ${userMessage.toLowerCase().includes('budz') ? 'I see you know the good stuff' : 'let me tell you about some quality BUDZ'}! Day ${gameState.day} in ${gameState.currentCity} - perfect timing.`,
      `Listen up - that BUDZ ain't gonna sell itself. In ${gameState.currentCity}, you got opportunities everywhere. What's your next move?`,
      `${gameState.day > 30 ? 'You been grinding hard' : 'Still early in the game'} - but infinite mode means infinite possibilities. This BUDZ game never stops.`,
      `From my experience in the streets, ${gameState.currentCity} is where the real action happens. Got some premium BUDZ connects if you need 'em.`,
      `Day ${gameState.day} and counting... but here's the thing - we ain't stopping at 45 days. This BUDZ empire can go on forever if you play it smart.`
    ];
    
    // Simple response selection based on message content
    if (userMessage.toLowerCase().includes('budz') || userMessage.toLowerCase().includes('weed')) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (userMessage.toLowerCase().includes('day') || userMessage.toLowerCase().includes('45')) {
      return `Forget 45 days - we're in infinite mode now! This BUDZ hustle never ends. Day ${gameState.day} is just the beginning.`;
    }
    
    if (userMessage.toLowerCase().includes('city') || userMessage.toLowerCase().includes('travel')) {
      return `${gameState.currentCity} is solid, but every city got its own BUDZ game. Want me to hook you up with a travel mission?`;
    }
    
    if (userMessage.toLowerCase().includes('event') || userMessage.toLowerCase().includes('special')) {
      const currentEvents = activeSpecialEvents;
      if (currentEvents.length > 0) {
        const event = currentEvents[0];
        return `Right now we got "${event.title}" going down! ${event.description} Smart players adapt to these events - they never happen the same way twice.`;
      } else {
        return `No special events right now, but keep your eyes open. The streets always got something cooking every 4-7 days. When it hits, it changes everything.`;
      }
    }
    
    if (userMessage.toLowerCase().includes('money') || userMessage.toLowerCase().includes('profit')) {
      const currentEvents = activeSpecialEvents;
      if (currentEvents.length > 0 && currentEvents[0].effect.moneyMultiplier) {
        const multiplier = currentEvents[0].effect.moneyMultiplier;
        return `With ${currentEvents[0].title} happening, your money game is ${multiplier > 1 ? 'boosted' : 'challenged'}. Use it to your advantage!`;
      }
      return `Money talks in the REGZ game. Day ${gameState.day} means you should be thinking bigger - infinite mode means infinite opportunities.`;
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
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
      effect: selectedType.effects,
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
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: currentMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setCurrentMessage('');
    setIsTyping(true);
    
    // Track chat interaction for achievements
    if (onChatInteraction) {
      onChatInteraction();
    }
    
    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(currentMessage);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'plug',
        message: aiResponse,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
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

  const availableMissions = missions.filter(m => m.day <= gameState.day && !m.completed);
  const completedMissions = missions.filter(m => m.completed);
  const specialOffers = getSpecialOffers();

  if (!connectedWallet) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Assistant Button */}
      <div 
        className={`relative transition-all duration-300 ${isOpen ? 'transform scale-110' : ''}`}
      >
        <button
          onClick={() => {
            // If no NFT is chosen and NFTs are available, open to NFT selection tab
            if (!hasChosenNFT && growerNFTs.length > 0 && !isOpen) {
              setActiveTab('nft');
            }
            setIsOpen(!isOpen);
          }}
          className="w-16 h-16 bg-gradient-to-br from-purple-600 to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative"
        >
          {getAssistantInfo().avatar ? (
            <img 
              src={getAssistantInfo().avatar} 
              alt={getAssistantInfo().name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <Bot className="w-8 h-8 text-white" />
          )}
          
          {/* Choose NFT indicator */}
          {!hasChosenNFT && growerNFTs.length > 0 && (
            <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
          
          {/* Notification badge */}
          {availableMissions.length > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{availableMissions.length}</span>
            </div>
          )}
        </button>
        
        {/* Label */}
        <div className="absolute bottom-0 right-20 bg-black bg-opacity-80 text-white px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {!hasChosenNFT && growerNFTs.length > 0 ? 'Choose Your NFT' : getAssistantInfo().name}
        </div>
      </div>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 max-h-[500px] bg-gray-900 rounded-lg shadow-2xl border border-green-400 overflow-hidden">
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
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'chat', label: 'Chat', icon: MessageCircle },
              { id: 'missions', label: 'Missions', icon: MapPin },
              { id: 'specials', label: 'Specials', icon: ShoppingBag },
              { id: 'nft', label: 'Growerz', icon: Gift }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 p-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'text-green-400 border-b-2 border-green-400 bg-gray-800' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {activeTab === 'chat' && (
              <div className="space-y-3">
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
                          : 'bg-green-600 text-white mr-8'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1">
                        {msg.sender === 'user' ? 'You' : getAssistantInfo().name}
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
              </div>
            )}

            {activeTab === 'missions' && (
              <div className="space-y-3">
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
              </div>
            )}

            {activeTab === 'specials' && (
              <div className="space-y-3">
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
              </div>
            )}

            {activeTab === 'nft' && (
              <div className="space-y-3">
                <h4 className="text-green-400 font-bold">Your GROWERZ Collection</h4>
                {!hasChosenNFT && growerNFTs.length > 0 && (
                  <div className="bg-yellow-900 border border-yellow-600 p-2 rounded text-xs">
                    <p className="text-yellow-200">Choose your NFT to personalize The Plug assistant!</p>
                  </div>
                )}
                {loading ? (
                  <p className="text-gray-400 text-sm">Loading your NFTs...</p>
                ) : growerNFTs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {growerNFTs.map(nft => {
                      const rarity = nft.attributes?.find(attr => attr.trait_type === 'Rarity')?.value || 'Common';
                      const strain = nft.attributes?.find(attr => attr.trait_type === 'Strain')?.value;
                      const thcLevel = nft.attributes?.find(attr => attr.trait_type === 'THC Level')?.value;
                      
                      return (
                        <div 
                          key={nft.mint}
                          onClick={() => saveSelectedNFT(nft)}
                          className={`bg-gray-800 p-2 rounded cursor-pointer transition-colors border ${
                            selectedNFT?.mint === nft.mint ? 'border-green-400 ring-2 ring-green-400' : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <img 
                            src={nft.image} 
                            alt={nft.name}
                            className="w-full h-20 object-cover rounded mb-1"
                          />
                          <p className="text-white text-xs font-medium truncate">{nft.name}</p>
                          <div className="flex justify-between text-xs mt-1">
                            <span className={`${
                              rarity === 'Legendary' ? 'text-yellow-400' :
                              rarity === 'Epic' ? 'text-purple-400' :
                              rarity === 'Rare' ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                              {rarity}
                            </span>
                            {thcLevel && <span className="text-green-400">{thcLevel}</span>}
                          </div>
                          {strain && <div className="text-gray-400 text-xs truncate">{strain}</div>}
                          {selectedNFT?.mint === nft.mint && (
                            <div className="text-green-400 text-xs mt-1 font-bold">✓ Selected</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">No GROWERZ NFTs found</p>
                    <a 
                      href="https://magiceden.us/marketplace/the_growerz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-xs underline"
                    >
                      Get yours on Magic Eden
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}