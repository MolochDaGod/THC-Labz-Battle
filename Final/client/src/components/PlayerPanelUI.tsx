import React, { useState, useEffect } from 'react';
import { 
  MapPin, User, Heart, Shield, AlertTriangle, Eye, 
  Package, Coins, Star, Badge, TrendingUp, Activity,
  Home, Building, Users, Car, Phone, Briefcase,
  Search, Target, Zap, Lock, Unlock, Camera,
  FileText, Clock, DollarSign, Settings, Truck,
  Gift, Sparkles, ArrowRight, X, CheckCircle, BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PlayerPanelUIProps {
  gameState: any;
  currentCity: string;
  connectedWallet: string;
  selectedNFT: any;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
  selectedCityForInfo?: string; // New prop for showing specific city info
}

interface CityReputation {
  level: number;
  status: string;
  color: string;
  warrants: string[];
  heatLevel: number;
}

interface SkillAction {
  id: string;
  name: string;
  description: string;
  icon: any;
  requiredSkill: string;
  requiredLevel: number;
  available: boolean;
  cooldown?: number;
}

// Special Products Data
const specialProducts = [
  {
    id: 'stealth_package',
    name: 'Stealth Package',
    icon: '📦',
    category: 'Security',
    price: 2500,
    description: 'Advanced stealth gear for high-risk operations. Includes signal jammers, thermal blockers, and route masking technology.',
    effects: {
      'Heat Reduction': 40,
      'Police Evasion': 35,
      'Mission Success': 25
    }
  },
  {
    id: 'premium_transport',
    name: 'Premium Transport',
    icon: '🚐',
    category: 'Logistics',
    price: 3500,
    description: 'High-end transportation solution with armored plating, GPS scramblers, and emergency protocols.',
    effects: {
      'Cargo Capacity': 50,
      'Transport Speed': 30,
      'Damage Resistance': 45
    }
  },
  {
    id: 'ai_coordinator',
    name: 'AI Coordinator',
    icon: '🤖',
    category: 'Intelligence',
    price: 4000,
    description: 'Advanced AI system for real-time route optimization, risk assessment, and tactical coordination.',
    effects: {
      'Route Efficiency': 60,
      'Risk Analysis': 50,
      'Communication': 40
    }
  },
  {
    id: 'encrypted_comms',
    name: 'Encrypted Communications',
    icon: '📱',
    category: 'Security',
    price: 1800,
    description: 'Military-grade encrypted communication system for secure coordination and intelligence sharing.',
    effects: {
      'Security Rating': 70,
      'Network Access': 45,
      'Information Flow': 35
    }
  }
];

// Delivery Missions Data
const deliveryMissions = [
  {
    id: 'stealth_night_drop',
    title: 'Stealth Night Drop',
    icon: '🌙',
    description: 'High-value client requires discrete delivery under cover of darkness. Advanced stealth protocols required.',
    reward: { min: 2000, max: 3000 },
    duration: '2-4 hours',
    riskLevel: 'High',
    requirements: ['Stealth Package']
  },
  {
    id: 'vip_client_delivery',
    title: 'VIP Client Delivery',
    icon: '👤',
    description: 'Celebrity client needs premium product delivery with maximum security and discretion.',
    reward: { min: 1500, max: 2500 },
    duration: '1-3 hours',
    riskLevel: 'Medium',
    requirements: ['Premium Transport']
  },
  {
    id: 'multi_point_coordination',
    title: 'Multi-Point Coordination',
    icon: '🎯',
    description: 'Complex operation requiring AI-coordinated deliveries across multiple city districts simultaneously.',
    reward: { min: 2500, max: 4000 },
    duration: '3-6 hours',
    riskLevel: 'Low',
    requirements: ['AI Coordinator', 'Encrypted Communications']
  }
];

// Active Missions (example data)
const activeMissions: any[] = [];

// Skill Actions Data
const skillActions: SkillAction[] = [
  {
    id: 'scout_area',
    name: 'Scout Area',
    description: 'Gather intelligence about current location',
    icon: Search,
    requiredSkill: 'streetwise',
    requiredLevel: 1,
    available: true
  },
  {
    id: 'network_connect',
    name: 'Network Connect',
    description: 'Find new suppliers and customers',
    icon: Users,
    requiredSkill: 'networking',
    requiredLevel: 2,
    available: false
  },
  {
    id: 'stealth_movement',
    name: 'Stealth Move',
    description: 'Move without increasing heat',
    icon: Eye,
    requiredSkill: 'stealth',
    requiredLevel: 1,
    available: false
  }
];

// City names mapping
const cityNames: Record<string, string> = {
  hometown: 'Home Town',
  neighborhood: 'The Neighborhood', 
  central: 'Central City',
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
  denver: 'Denver',
  chicago: 'Chicago'
};

const PlayerPanelUI: React.FC<PlayerPanelUIProps> = ({
  gameState,
  currentCity,
  connectedWallet,
  selectedNFT,
  onClose,
  onAction,
  selectedCityForInfo
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'skills' | 'reputation' | 'cases' | 'traphouse' | 'cityinfo' | 'info' | 'stats'>('overview');
  
  // Add Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-switch to cityinfo tab when selectedCityForInfo is provided
  useEffect(() => {
    if (selectedCityForInfo) {
      setActiveTab('cityinfo');
    }
  }, [selectedCityForInfo]);
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'special' | 'missions'>('skills');
  const [tooltipInfo, setTooltipInfo] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0
  });
  const [showSpecialProducts, setShowSpecialProducts] = useState(false);
  const [showDeliveryMission, setShowDeliveryMission] = useState(false);
  const [selectedSpecialProduct, setSelectedSpecialProduct] = useState<any>(null);
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [showCityPriceGraphs, setShowCityPriceGraphs] = useState(false);
  const [cityPriceData, setCityPriceData] = useState<any>(null);
  
  // Generate comprehensive city price data for all products with enhanced market dynamics
  const generateCityPriceData = () => {
    const cities = Object.keys(cityNames);
    const products = ['Weed', 'Speed', 'Heroin', 'Coke', 'Meth', 'Dope', 'Shrooms', 'Fentanyl'];
    
    const priceData: any = {};
    
    products.forEach(product => {
      const cityPrices = cities.map((city) => {
        // Generate realistic price variations by product and city with supply/demand factors
        const basePrice = getBasePrice(product);
        const variation = 0.2 + Math.random() * 0.6; // 20-80% variation
        return Math.round(basePrice * variation);
      });

      priceData[product] = {
        cities: cities.map(city => cityNames[city]),
        prices: cityPrices,
        averagePrice: 0,
        highestCity: '',
        lowestCity: '',
        priceRange: 0
      };
      
      // Calculate statistics
      priceData[product].averagePrice = Math.round(
        priceData[product].prices.reduce((a: number, b: number) => a + b, 0) / priceData[product].prices.length
      );
      
      const maxPrice = Math.max(...priceData[product].prices);
      const minPrice = Math.min(...priceData[product].prices);
      priceData[product].highestCity = priceData[product].cities[priceData[product].prices.indexOf(maxPrice)];
      priceData[product].lowestCity = priceData[product].cities[priceData[product].prices.indexOf(minPrice)];
      priceData[product].priceRange = maxPrice - minPrice;
    });
    
    return priceData;
  };
  
  const getBasePrice = (product: string): number => {
    const basePrices: Record<string, number> = {
      'Weed': 600,
      'Speed': 150,
      'Heroin': 6500,
      'Coke': 17000,
      'Meth': 4400,
      'Dope': 13000,
      'Shrooms': 800,
      'Fentanyl': 2500
    };
    return basePrices[product] || 500;
  };
  
  const fetchCityPrices = () => {
    const data = generateCityPriceData();
    setCityPriceData(data);
    setShowCityPriceGraphs(true);
  };
  
  const getProductIcon = (product: string): string => {
    const icons: Record<string, string> = {
      'Weed': '🌿',
      'Speed': '⚡', 
      'Heroin': '💉',
      'Coke': '❄️',
      'Meth': '🧪',
      'Dope': '💊',
      'Shrooms': '🍄',
      'Fentanyl': '☠️'
    };
    return icons[product] || '💰';
  };
  
  const getProductColor = (product: string, opacity: number): string => {
    const colors: Record<string, string> = {
      'Weed': `rgba(34, 197, 94, ${opacity})`,    // Green
      'Speed': `rgba(234, 179, 8, ${opacity})`,   // Yellow  
      'Heroin': `rgba(239, 68, 68, ${opacity})`,  // Red
      'Coke': `rgba(96, 165, 250, ${opacity})`,   // Blue
      'Meth': `rgba(168, 85, 247, ${opacity})`,   // Purple
      'Dope': `rgba(245, 101, 101, ${opacity})`,  // Rose
      'Shrooms': `rgba(251, 146, 60, ${opacity})`, // Orange
      'Fentanyl': `rgba(107, 114, 128, ${opacity})` // Gray
    };
    return colors[product] || `rgba(156, 163, 175, ${opacity})`;
  };

  // City names mapping
  const cityNames: Record<string, string> = {
    hometown: 'Home Town',
    neighborhood: 'The NeighborHood',
    central: 'Central Park',
    newyork: 'New York City',
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

  // Special Products Database for Command Center
  const specialProducts = [
    {
      id: 'stealth_package',
      name: 'Stealth Package',
      description: 'Military-grade concealment system for high-risk deliveries',
      icon: '📦',
      price: 750,
      image: '/cutout-stealth-package.png',
      unlockLevel: 3,
      category: 'delivery',
      effects: { heatReduction: 25, successRate: 90 }
    },
    {
      id: 'premium_transport',
      name: 'Premium Transport',
      description: 'Luxury delivery service with enhanced security protocols',
      icon: '🚗',
      price: 1200,
      image: '/cutout-premium-car.png',
      unlockLevel: 5,
      category: 'delivery',
      effects: { speed: 200, heatReduction: 15, successRate: 95 }
    },
    {
      id: 'ai_coordinator',
      name: 'AI Coordinator',
      description: 'Advanced AI system for optimizing delivery routes and timing',
      icon: '🤖',
      price: 2000,
      image: '/cutout-ai-system.png',
      unlockLevel: 7,
      category: 'intelligence',
      effects: { routeOptimization: 40, riskPrediction: 85 }
    },
    {
      id: 'encrypted_comms',
      name: 'Encrypted Communications',
      description: 'Military-grade encrypted communication system',
      icon: '📡',
      price: 850,
      image: '/cutout-radio-system.png',
      unlockLevel: 4,
      category: 'security',
      effects: { communicationSecurity: 95, coordinationBonus: 30 }
    }
  ];

  // Generate AI-powered delivery missions
  const generateDeliveryMissions = () => {
    const missionTypes = [
      {
        type: 'stealth_delivery',
        title: 'Stealth Night Drop',
        description: 'Deliver high-value package under cover of darkness',
        reward: 1500,
        risk: 'high',
        timeLimit: 4,
        requirements: ['stealth_package']
      },
      {
        type: 'premium_courier',
        title: 'VIP Client Delivery',
        description: 'Discrete delivery to high-profile client location',
        reward: 2200,
        risk: 'medium',
        timeLimit: 6,
        requirements: ['premium_transport']
      },
      {
        type: 'coordinated_drop',
        title: 'Multi-Point Coordination',
        description: 'Coordinate simultaneous deliveries across city zones',
        reward: 3000,
        risk: 'low',
        timeLimit: 8,
        requirements: ['ai_coordinator', 'encrypted_comms']
      }
    ];

    return missionTypes.map((mission, index) => ({
      ...mission,
      id: `delivery_${index}_${Date.now()}`,
      city: currentCity,
      day: gameState.day,
      active: false,
      progress: 0
    }));
  };

  // Get city reputation data
  const getCityReputation = (city: string): CityReputation => {
    const rep = gameState.reputation || 50;
    const heat = gameState.heat || 0;
    
    // Base reputation varies by city danger level
    const dangerousCities = ['newyork', 'baltimore', 'detroit', 'miami', 'oakland'];
    const baseRep = dangerousCities.includes(city) ? rep - 20 : rep;
    
    let level = Math.max(0, Math.min(100, baseRep));
    let status = 'Unknown';
    let color = 'text-gray-400';
    let warrants: string[] = [];
    
    if (level >= 80) {
      status = 'Respected';
      color = 'text-green-400';
    } else if (level >= 60) {
      status = 'Known';
      color = 'text-blue-400';
    } else if (level >= 40) {
      status = 'Neutral';
      color = 'text-yellow-400';
    } else if (level >= 20) {
      status = 'Suspicious';
      color = 'text-orange-400';
      if (heat > 6) warrants.push('Drug Possession');
    } else {
      status = 'Wanted';
      color = 'text-red-400';
      if (heat > 4) warrants.push('Drug Trafficking');
      if (heat > 7) warrants.push('Resisting Arrest');
    }
    
    return { level, status, color, warrants, heatLevel: heat };
  };

  // Get available skill actions based on NFT traits and player skills
  const getSkillActions = (): SkillAction[] => {
    const skills = gameState.skills || {};
    const nftTraits = selectedNFT?.attributes || [];
    
    const actions: SkillAction[] = [
      {
        id: 'scout_area',
        name: 'Scout Area',
        description: 'Use streetwise to identify safe dealing spots and police patrol patterns',
        icon: Eye,
        requiredSkill: 'streetwise',
        requiredLevel: 1,
        available: (skills.streetwise || 0) >= 1
      },
      {
        id: 'network_connect',
        name: 'Network Connect',
        description: 'Use networking skills to find new suppliers and customers',
        icon: Users,
        requiredSkill: 'networking',
        requiredLevel: 2,
        available: (skills.networking || 0) >= 2
      },
      {
        id: 'stealth_move',
        name: 'Stealth Movement',
        description: 'Use stealth to reduce heat while moving through the city',
        icon: Lock,
        requiredSkill: 'stealth',
        requiredLevel: 1,
        available: (skills.stealth || 0) >= 1
      },
      {
        id: 'police_bribe',
        name: 'Police Connections',
        description: 'Use police connections to reduce heat or avoid arrest',
        icon: Badge,
        requiredSkill: 'policeConnections',
        requiredLevel: 3,
        available: (skills.policeConnections || 0) >= 3
      },
      {
        id: 'intimidate_rival',
        name: 'Intimidate Rivals',
        description: 'Use intimidation to claim territory or get better deals',
        icon: Target,
        requiredSkill: 'intimidation',
        requiredLevel: 2,
        available: (skills.intimidation || 0) >= 2
      }
    ];

    // Add NFT trait-based actions
    if (nftTraits.some((trait: any) => trait.trait_type === 'Background' && trait.value === 'Blue')) {
      actions.push({
        id: 'blue_background_bonus',
        name: 'Ocean Calm',
        description: 'Your blue background trait provides enhanced negotiation in coastal cities',
        icon: Zap,
        requiredSkill: 'none',
        requiredLevel: 0,
        available: ['miami', 'oakland'].includes(currentCity)
      });
    }

    return actions;
  };

  // Enhanced inventory with emojis and categorization
  const getEnhancedInventory = () => {
    const drugs = gameState.drugs || [];
    const categorized = {
      cannabis: drugs.filter((d: any) => ['weed', 'hash', 'sour diesel', 'purple haze', 'white widow'].includes(d.name.toLowerCase())),
      concentrates: drugs.filter((d: any) => ['thc vapes', 'dab', 'oil', 'shatter'].includes(d.name.toLowerCase())),
      edibles: drugs.filter((d: any) => ['edibles', 'gummies', 'brownies'].includes(d.name.toLowerCase())),
      other: drugs.filter((d: any) => !['weed', 'hash', 'sour diesel', 'purple haze', 'white widow', 'thc vapes', 'dab', 'oil', 'shatter', 'edibles', 'gummies', 'brownies'].includes(d.name.toLowerCase()))
    };

    return categorized;
  };

  // Tooltip handlers
  const showTooltip = (content: string, event: React.MouseEvent) => {
    setTooltipInfo({
      show: true,
      content,
      x: event.clientX,
      y: event.clientY - 40
    });
  };

  const hideTooltip = () => {
    setTooltipInfo({ show: false, content: '', x: 0, y: 0 });
  };

  const cityRep = getCityReputation(currentCity);
  const skillActions = getSkillActions();
  const inventory = getEnhancedInventory();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-900 border border-green-400 w-full max-w-4xl h-full max-h-[90vh] flex flex-col rounded-lg overflow-hidden"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-green-400 bg-gray-800">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-green-400" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
              {cityNames[currentCity] || currentCity} - Command Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg bg-red-900 hover:bg-red-800 transition-colors border border-red-600 hover:border-red-500 z-10"
            title="Close Command Center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'skills', label: 'Hustlers Handbook', icon: Zap },
            { id: 'reputation', label: 'Rep Status', icon: Star },
            { id: 'cases', label: 'Legal', icon: FileText },
            { id: 'traphouse', label: 'Properties', icon: Building },
            { id: 'cityinfo', label: 'City Intel', icon: MapPin },
            { id: 'stats', label: 'Plug Stats', icon: TrendingUp },
            { id: 'info', label: 'Command Center', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-green-400 text-green-400 bg-gray-700'
                  : 'border-transparent text-gray-400 hover:text-green-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Player Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-gray-400">Health</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{gameState.health || 100}%</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${gameState.health || 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-gray-400">Heat Level</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{gameState.heat || 0}/10</div>
                  <div className="flex gap-1 mt-2">
                    {Array.from({length: 10}, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded ${
                          i < (gameState.heat || 0) ? 'bg-yellow-400' : 'bg-gray-600'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Money</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">${(gameState.money || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Bank: ${(gameState.bankAccount || 0).toLocaleString()}</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-400">Reputation</span>
                  </div>
                  <div className={`text-2xl font-bold ${cityRep.color}`}>{cityRep.level}</div>
                  <div className={`text-xs ${cityRep.color} mt-1`}>{cityRep.status}</div>
                </div>
              </div>

              {/* City Information */}
              <div className="bg-gray-800 p-4 rounded-lg border border-green-400">
                <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Current Location: {cityNames[currentCity]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Security Level</div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({length: 5}, (_, i) => (
                          <Shield 
                            key={i}
                            className={`w-4 h-4 ${
                              i < 3 ? 'text-green-400' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-green-400">Moderate</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Market Activity</div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400">Active</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Your Status</div>
                    <div className={`flex items-center gap-2 ${cityRep.color}`}>
                      <Eye className="w-4 h-4" />
                      <span>{cityRep.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions with Tooltips */}
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-400">
                <h3 className="text-lg font-bold text-blue-400 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    className="p-3 bg-green-700 hover:bg-green-600 rounded-lg transition-colors flex flex-col items-center gap-2 relative group"
                    onClick={() => onAction('scout_area')}
                    title={`Scout Area (Streetwise Lv.${gameState.skills?.streetwise || 0})`}
                  >
                    <Search className="w-5 h-5 text-white" />
                    <span className="text-xs text-white">Scout</span>
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 w-48 border border-green-400">
                      <div className="font-bold text-green-400 mb-1">🕵️ Scout Area</div>
                      <div className="text-gray-300 mb-2">Use streetwise skills to gather intel on safe spots and police patterns</div>
                      <div className="text-yellow-400 text-xs">
                        <div>• Base: Find 1-2 safe spots</div>
                        <div>• Lv.3+: Find police schedules</div>
                        <div>• Lv.5+: Discover rival territories</div>
                        <div>• Lv.7+: Find VIP customer locations</div>
                      </div>
                      <div className="text-blue-300 text-xs mt-1">Current: Streetwise Lv.{gameState.skills?.streetwise || 0}</div>
                    </div>
                  </button>
                  
                  <button 
                    className="p-3 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors flex flex-col items-center gap-2 relative group"
                    onClick={() => onAction('check_market')}
                    title={`Market Analysis (Negotiation Lv.${gameState.skills?.negotiation || 0})`}
                  >
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="text-xs text-white">Market</span>
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 w-48 border border-blue-400">
                      <div className="font-bold text-blue-400 mb-1">📊 Market Analysis</div>
                      <div className="text-gray-300 mb-2">Access detailed market data and pricing intelligence</div>
                      <div className="text-yellow-400 text-xs">
                        <div>• Base: Basic price charts</div>
                        <div>• Lv.3+: Profit predictions</div>
                        <div>• Lv.5+: Supply shortage alerts</div>
                        <div>• Lv.7+: Price manipulation tips</div>
                      </div>
                      <div className="text-blue-300 text-xs mt-1">Current: Negotiation Lv.{gameState.skills?.negotiation || 0}</div>
                    </div>
                  </button>
                  
                  <button 
                    className="p-3 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors flex flex-col items-center gap-2 relative group"
                    onClick={() => onAction('network')}
                    title={`Network Contacts (Networking Lv.${gameState.skills?.networking || 0})`}
                  >
                    <Users className="w-5 h-5 text-white" />
                    <span className="text-xs text-white">Network</span>
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 w-48 border border-purple-400">
                      <div className="font-bold text-purple-400 mb-1">🤝 Network Contacts</div>
                      <div className="text-gray-300 mb-2">Use connections to find suppliers, customers, and market opportunities</div>
                      <div className="text-yellow-400 text-xs">
                        <div>• Base: Find basic suppliers</div>
                        <div>• Lv.3+: Better drug prices</div>
                        <div>• Lv.5+: VIP customer referrals</div>
                        <div>• Lv.7+: Cartel connections</div>
                      </div>
                      <div className="text-blue-300 text-xs mt-1">Current: Networking Lv.{gameState.skills?.networking || 0}</div>
                    </div>
                  </button>
                  
                  <button 
                    className="p-3 bg-orange-700 hover:bg-orange-600 rounded-lg transition-colors flex flex-col items-center gap-2 relative group"
                    onClick={() => onAction('lay_low')}
                    title={`Lay Low (Mastermind Lv.${gameState.skills?.mastermind || 0})`}
                  >
                    <Eye className="w-5 h-5 text-white" />
                    <span className="text-xs text-white">Lay Low</span>
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 w-48 border border-orange-400">
                      <div className="font-bold text-orange-400 mb-1">👁️ Lay Low</div>
                      <div className="text-gray-300 mb-2">Use strategic thinking to reduce police attention and heat</div>
                      <div className="text-yellow-400 text-xs">
                        <div>• Base: -2 heat reduction</div>
                        <div>• Lv.3+: -3 heat + dodge raids</div>
                        <div>• Lv.5+: -4 heat + reputation bonus</div>
                        <div>• Lv.7+: -5 heat + market intel</div>
                      </div>
                      <div className="text-blue-300 text-xs mt-1">Current: Mastermind Lv.{gameState.skills?.mastermind || 0}</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Enhanced Inventory
              </h3>

              {/* Cannabis Products */}
              <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                  🌿 Cannabis Products
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {inventory.cannabis.map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                      onMouseEnter={(e) => showTooltip(`${item.name} - Quality: ${item.quality || 'Standard'}\nValue: $${item.price}/unit`, e)}
                      onMouseLeave={hideTooltip}
                      onClick={() => onAction('view_item', item)}
                    >
                      <div className="text-2xl mb-2">🌿</div>
                      <div className="text-sm font-medium text-green-400">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.owned} units</div>
                      <div className="text-xs text-yellow-400">${item.price}/each</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concentrates */}
              <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
                <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                  💨 Concentrates & Vapes
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {inventory.concentrates.map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                      onMouseEnter={(e) => showTooltip(`${item.name} - Premium concentrate\nValue: $${item.price}/unit`, e)}
                      onMouseLeave={hideTooltip}
                    >
                      <div className="text-2xl mb-2">💨</div>
                      <div className="text-sm font-medium text-purple-400">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.owned} units</div>
                      <div className="text-xs text-yellow-400">${item.price}/each</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edibles */}
              <div className="bg-gray-800 p-4 rounded-lg border border-orange-500">
                <h4 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
                  🍪 Edibles & Treats
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {inventory.edibles.map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                      onMouseEnter={(e) => showTooltip(`${item.name} - Discrete edible\nValue: $${item.price}/unit`, e)}
                      onMouseLeave={hideTooltip}
                    >
                      <div className="text-2xl mb-2">🍪</div>
                      <div className="text-sm font-medium text-orange-400">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.owned} units</div>
                      <div className="text-xs text-yellow-400">${item.price}/each</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Command Center Special Products */}
              <div className="bg-gray-800 p-4 rounded-lg border border-cyan-500">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                    🎯 Command Center Special Products
                  </h4>
                  <button
                    onClick={() => setShowSpecialProducts(true)}
                    className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all text-xs font-bold"
                  >
                    Browse Special Products
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {specialProducts.slice(0, 4).map((product) => (
                    <div 
                      key={product.id}
                      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors border border-cyan-600"
                      onClick={() => {
                        setSelectedSpecialProduct(product);
                        setShowSpecialProducts(true);
                      }}
                    >
                      <div className="text-2xl mb-2">{product.icon}</div>
                      <div className="text-sm font-medium text-cyan-400">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.category}</div>
                      <div className="text-xs text-yellow-400">${product.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Delivery Missions */}
              <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-green-400 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Active Delivery Missions
                  </h4>
                  <button
                    onClick={() => setShowDeliveryMission(true)}
                    className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all text-xs font-bold"
                  >
                    Start Mission
                  </button>
                </div>
                <div className="text-center py-4">
                  {activeMissions.length === 0 ? (
                    <div className="text-gray-400">
                      <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active delivery missions</p>
                      <p className="text-xs">Use special products to unlock AI-powered delivery missions</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeMissions.map((mission) => (
                        <div key={mission.id} className="bg-gray-700 p-3 rounded-lg">
                          <div className="text-sm font-bold text-green-400">{mission.title}</div>
                          <div className="text-xs text-gray-400">{mission.description}</div>
                          <div className="mt-2 w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-400 h-2 rounded-full transition-all"
                              style={{ width: `${mission.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Stats */}
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-400">
                <h4 className="text-lg font-bold text-blue-400 mb-3">Inventory Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{gameState.coatSpace - (gameState.spaceUsed || 0)}</div>
                    <div className="text-sm text-gray-400">Space Left</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{(gameState.drugs || []).length}</div>
                    <div className="text-sm text-gray-400">Product Types</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      ${(gameState.drugs || []).reduce((sum: number, drug: any) => sum + (drug.owned * drug.price), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Total Value</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hustlers Handbook Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-green-400 mb-2" 
                    style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  📚 HUSTLERS HANDBOOK 📚
                </h3>
                <div className="text-sm text-gray-400">
                  Master your skills, gear, and operations
                </div>
              </div>

              {/* Sub-tabs for Hustlers Handbook */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-800 p-1 rounded-lg flex space-x-1">
                  <button
                    onClick={() => setActiveSubTab('skills')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeSubTab === 'skills'
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    ⚡ Skills
                  </button>
                  <button
                    onClick={() => setActiveSubTab('special')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeSubTab === 'special'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    📦 Special Gear
                  </button>
                  <button
                    onClick={() => setActiveSubTab('missions')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeSubTab === 'missions'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    🚚 Missions
                  </button>
                </div>
              </div>

              {/* Skills Sub-tab Content */}
              {activeSubTab === 'skills' && (
                <>
                  {/* Skill Tree Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                  {
                    name: 'Streetwise',
                    level: gameState.skills?.streetwise || 0,
                    maxLevel: 5,
                    icon: '🕵️',
                    color: 'from-blue-600 to-blue-400',
                    description: 'Street knowledge & area scouting',
                    actions: ['Scout Area', 'Find Safe Routes']
                  },
                  {
                    name: 'Networking',
                    level: gameState.skills?.networking || 0,
                    maxLevel: 5,
                    icon: '🤝',
                    color: 'from-purple-600 to-purple-400',
                    description: 'Connect with suppliers & customers',
                    actions: ['Network Connect', 'Find Suppliers']
                  },
                  {
                    name: 'Stealth',
                    level: gameState.skills?.stealth || 0,
                    maxLevel: 5,
                    icon: '🥷',
                    color: 'from-gray-600 to-gray-400',
                    description: 'Move unseen, reduce heat',
                    actions: ['Stealth Movement', 'Heat Reduction']
                  },
                  {
                    name: 'Police Connections',
                    level: gameState.skills?.policeConnections || 0,
                    maxLevel: 5,
                    icon: '👮',
                    color: 'from-red-600 to-red-400',
                    description: 'Law enforcement contacts',
                    actions: ['Bribe Officers', 'Avoid Arrest']
                  },
                  {
                    name: 'Intimidation',
                    level: gameState.skills?.intimidation || 0,
                    maxLevel: 5,
                    icon: '💪',
                    color: 'from-orange-600 to-orange-400',
                    description: 'Claim territory & better deals',
                    actions: ['Intimidate Rivals', 'Territory Control']
                  },
                  {
                    name: 'Negotiation',
                    level: gameState.skills?.negotiation || 0,
                    maxLevel: 5,
                    icon: '🗣️',
                    color: 'from-green-600 to-green-400',
                    description: 'Better buying prices',
                    actions: ['Price Negotiation', 'Deal Making']
                  }
                ].map((skill) => (
                  <div 
                    key={skill.name}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-600 hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20"
                  >
                    {/* Skill Header */}
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-2">{skill.icon}</div>
                      <h4 className="font-bold text-white text-sm">{skill.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{skill.description}</p>
                    </div>

                    {/* Level Display */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Level</span>
                        <span className="text-xs font-bold text-white">
                          {skill.level}/{skill.maxLevel}
                        </span>
                      </div>
                      
                      {/* XP Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${skill.color} transition-all duration-500`}
                          style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                        />
                      </div>
                      
                      {/* Stars */}
                      <div className="flex justify-center mt-2 gap-1">
                        {[...Array(skill.maxLevel)].map((_, i) => (
                          <span 
                            key={i}
                            className={`text-lg ${
                              i < skill.level 
                                ? 'text-yellow-400' 
                                : 'text-gray-600'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Available Actions */}
                    <div className="space-y-1">
                      {skill.actions.map((action, i) => {
                        const isUnlocked = skill.level > i;
                        return (
                          <div 
                            key={action}
                            className={`text-xs p-2 rounded-lg border ${
                              isUnlocked 
                                ? 'bg-green-900/30 border-green-500/50 text-green-300' 
                                : 'bg-gray-700 border-gray-600 text-gray-500'
                            }`}
                          >
                            <span className="mr-1">
                              {isUnlocked ? '✅' : '🔒'}
                            </span>
                            {action}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                    ))}
                  </div>

              {/* Active Skills Section */}
              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  🎯 ACTIVE ABILITIES
                </h4>
                
                <div className="grid gap-3">
                  {skillActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => action.available && onAction(action.id)}
                      disabled={!action.available}
                      className={`p-4 rounded-lg border transition-all duration-300 text-left ${
                        action.available 
                          ? 'bg-gradient-to-r from-green-800/40 to-blue-800/40 border-green-500/50 hover:border-green-400 hover:from-green-700/60 hover:to-blue-700/60 cursor-pointer transform hover:scale-105 hover:shadow-lg hover:shadow-green-400/20' 
                          : 'bg-gray-800/50 border-gray-600/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          action.available 
                            ? 'bg-green-600/80 text-green-100' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className={`font-bold ${
                              action.available ? 'text-green-300' : 'text-gray-400'
                            }`}>
                              {action.name}
                            </h5>
                            {!action.available && (
                              <span className="text-xs bg-red-900/80 text-red-300 px-2 py-1 rounded-full border border-red-700/50">
                                🔒 Requires {action.requiredSkill} Lv.{action.requiredLevel}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${
                            action.available ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {action.description}
                          </p>
                        </div>
                        {action.available && (
                          <div className="text-green-400 animate-pulse">
                            ▶️
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NFT Trait Bonuses */}
              {selectedNFT && (
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    🌟 ACTIVE NFT BONUSES
                  </h4>
                  <div className="grid gap-2">
                    {selectedNFT.attributes?.map((trait: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-purple-900/20 border border-purple-700/30 p-3 rounded-lg">
                        <span className="text-sm text-purple-200 font-medium">{trait.trait_type}: {trait.value}</span>
                        <span className="text-xs text-purple-400 bg-purple-800/50 px-2 py-1 rounded-full">+{trait.rarity || 0}% bonus</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                  {/* Skill Upgrade Tip */}
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <div className="text-yellow-400 font-bold mb-2">💡 PRO TIP</div>
                    <p className="text-sm text-yellow-200">
                      Complete deals, missions, and actions to gain XP and level up your skills!
                    </p>
                  </div>
                </>
              )}

              {/* Special Gear Sub-tab Content */}
              {activeSubTab === 'special' && (
                <div className="space-y-6">
                  {/* City Price Intelligence */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        📊 CITY PRICE INTELLIGENCE
                      </h4>
                      <button
                        onClick={fetchCityPrices}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105"
                      >
                        📊 View Price Graphs
                      </button>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">
                      Access comprehensive price analysis across all 16 cities. View real-time market data, profit opportunities, and strategic trading insights.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-blue-800/30 p-2 rounded-lg">
                        <div className="text-blue-300 font-bold">📈 Price Trends</div>
                        <div className="text-gray-400">Market analysis</div>
                      </div>
                      <div className="bg-green-800/30 p-2 rounded-lg">
                        <div className="text-green-300 font-bold">💰 Profit Maps</div>
                        <div className="text-gray-400">Best opportunities</div>
                      </div>
                      <div className="bg-yellow-800/30 p-2 rounded-lg">
                        <div className="text-yellow-300 font-bold">🎯 City Rankings</div>
                        <div className="text-gray-400">Highest/lowest prices</div>
                      </div>
                      <div className="bg-purple-800/30 p-2 rounded-lg">
                        <div className="text-purple-300 font-bold">📊 Statistics</div>
                        <div className="text-gray-400">Market averages</div>
                      </div>
                    </div>
                  </div>

                  {/* Special Products Section */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-cyan-500">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Special Equipment & Gear
                      </h4>
                      <button
                        onClick={() => setShowSpecialProducts(true)}
                        className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all text-xs font-bold"
                      >
                        Browse All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {specialProducts.slice(0, 4).map((product) => (
                        <div 
                          key={product.id}
                          className="bg-gray-700 p-3 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors border border-cyan-600"
                          onClick={() => {
                            setSelectedSpecialProduct(product);
                            setShowSpecialProducts(true);
                          }}
                        >
                          <div className="text-2xl mb-2">{product.icon}</div>
                          <div className="text-sm font-medium text-cyan-400">{product.name}</div>
                          <div className="text-xs text-gray-400">{product.category}</div>
                          <div className="text-xs text-yellow-400">${product.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Missions Sub-tab Content */}
              {activeSubTab === 'missions' && (
                <div className="space-y-6">
                  {/* Active Delivery Missions */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-green-400 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Active Delivery Missions
                      </h4>
                      <button
                        onClick={() => setShowDeliveryMission(true)}
                        className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all text-xs font-bold"
                      >
                        Start Mission
                      </button>
                    </div>
                    <div className="text-center py-4">
                      {activeMissions.length === 0 ? (
                        <div className="text-gray-400">
                          <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No active delivery missions</p>
                          <p className="text-xs">Use special products to unlock AI-powered delivery missions</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeMissions.map((mission) => (
                            <div key={mission.id} className="bg-gray-700 p-3 rounded-lg">
                              <div className="text-sm font-bold text-green-400">{mission.title}</div>
                              <div className="text-xs text-gray-400">{mission.description}</div>
                              <div className="mt-2 w-full bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-green-400 h-2 rounded-full transition-all"
                                  style={{ width: `${mission.progress}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reputation Tab */}
          {activeTab === 'reputation' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <Star className="w-6 h-6" />
                Reputation Status
              </h3>

              {/* Current City Status */}
              <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-3">
                  {cityNames[currentCity]} Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className={`w-5 h-5 ${cityRep.color}`} />
                      <span className="text-sm text-gray-400">Reputation Level</span>
                    </div>
                    <div className={`text-3xl font-bold ${cityRep.color}`}>{cityRep.level}/100</div>
                    <div className={`text-sm ${cityRep.color}`}>{cityRep.status}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cityRep.level}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-gray-400">Heat Level</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{cityRep.heatLevel}/10</div>
                    <div className="flex gap-1 mt-2">
                      {Array.from({length: 10}, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-6 rounded ${
                            i < cityRep.heatLevel ? 'bg-yellow-400' : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Cities Overview */}
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
                <h4 className="text-lg font-bold text-blue-400 mb-3">All Cities Overview</h4>
                <div className="grid gap-3">
                  {Object.keys(cityNames).map((cityKey) => {
                    const cityRep = getCityReputation(cityKey);
                    return (
                      <div key={cityKey} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-4 h-4 ${cityKey === currentCity ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className={`font-medium ${cityKey === currentCity ? 'text-green-400' : 'text-gray-300'}`}>
                            {cityNames[cityKey]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`text-sm ${cityRep.color}`}>{cityRep.status}</div>
                          <div className="text-sm text-gray-400">{cityRep.level}/100</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Legal/Cases Tab */}
          {activeTab === 'cases' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Legal Status & Cases
              </h3>

              {/* Active Warrants */}
              <div className="bg-gray-800 p-4 rounded-lg border border-red-500">
                <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Active Warrants
                </h4>
                {cityRep.warrants.length > 0 ? (
                  <div className="space-y-2">
                    {cityRep.warrants.map((warrant, index) => (
                      <div key={index} className="bg-red-900 p-3 rounded border border-red-600">
                        <div className="flex items-center justify-between">
                          <span className="text-red-300 font-medium">{warrant}</span>
                          <span className="text-xs text-red-400">{cityNames[currentCity]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Shield className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400">No active warrants</p>
                    <p className="text-sm text-gray-400">Keep it clean!</p>
                  </div>
                )}
              </div>

              {/* Legal Actions */}
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
                <h4 className="text-lg font-bold text-blue-400 mb-3">Legal Actions</h4>
                <div className="grid gap-3">
                  <button 
                    className="p-3 bg-green-700 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-3"
                    onClick={() => onAction('hire_lawyer')}
                  >
                    <Briefcase className="w-5 h-5 text-white" />
                    <div className="text-left">
                      <div className="text-white font-medium">Hire Lawyer</div>
                      <div className="text-xs text-green-300">Reduce heat and clear minor charges</div>
                    </div>
                  </button>
                  
                  <button 
                    className="p-3 bg-yellow-700 hover:bg-yellow-600 rounded-lg transition-colors flex items-center gap-3"
                    onClick={() => onAction('pay_fine')}
                  >
                    <DollarSign className="w-5 h-5 text-white" />
                    <div className="text-left">
                      <div className="text-white font-medium">Pay Fine</div>
                      <div className="text-xs text-yellow-300">Clear minor infractions with cash</div>
                    </div>
                  </button>

                  <button 
                    className="p-3 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors flex items-center gap-3"
                    onClick={() => onAction('police_bribe')}
                    disabled={!skillActions.find(a => a.id === 'police_bribe')?.available}
                  >
                    <Badge className="w-5 h-5 text-white" />
                    <div className="text-left">
                      <div className="text-white font-medium">Use Police Connections</div>
                      <div className="text-xs text-purple-300">Leverage your connections (Requires skill)</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trap House Tab */}
          {activeTab === 'traphouse' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <Building className="w-6 h-6" />
                Properties & Connections
              </h3>

              {/* Current City Property Status */}
              <div className="bg-gray-800 p-4 rounded-lg border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-3">
                  {cityNames[currentCity]} Property Status
                </h4>
                
                {/* Check if player has property in current city */}
                <div className="text-center py-6">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No property established in {cityNames[currentCity]}</p>
                  
                  <button 
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    onClick={() => onAction('establish_traphouse')}
                  >
                    Establish Trap House
                  </button>
                  
                  <div className="mt-4 text-sm text-gray-400">
                    <p>Required: $5,000+ and Reputation Level 30+</p>
                  </div>
                </div>
              </div>

              {/* Property Options */}
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-500">
                <h4 className="text-lg font-bold text-blue-400 mb-3">Available Properties</h4>
                
                <div className="grid gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => onAction('view_property', { type: 'apartment', cost: 5000 })}>
                    <div className="flex items-center gap-3 mb-2">
                      <Home className="w-5 h-5 text-blue-400" />
                      <h5 className="font-bold text-blue-400">Abandoned Apartment</h5>
                      <span className="text-green-400 font-bold">$5,000</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">Basic security, low profile operations</p>
                    <div className="text-xs text-gray-400">
                      • 2 staff slots • Basic security • $200-400/day income
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => onAction('view_property', { type: 'store', cost: 15000 })}>
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-5 h-5 text-purple-400" />
                      <h5 className="font-bold text-purple-400">Corner Store</h5>
                      <span className="text-green-400 font-bold">$15,000</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">Medium traffic, decent cover for operations</p>
                    <div className="text-xs text-gray-400">
                      • 4 staff slots • Medium security • $800-1200/day income
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-400 cursor-pointer transition-colors"
                       onClick={() => onAction('view_property', { type: 'condo', cost: 30000 })}>
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <h5 className="font-bold text-yellow-400">Luxury Condo</h5>
                      <span className="text-green-400 font-bold">$30,000</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">High-end clientele, maximum security</p>
                    <div className="text-xs text-gray-400">
                      • 6 staff slots • High security • $1500-2500/day income
                    </div>
                  </div>
                </div>
              </div>

              {/* City Connections */}
              <div className="bg-gray-800 p-4 rounded-lg border border-purple-500">
                <h4 className="text-lg font-bold text-purple-400 mb-3">City Connections</h4>
                
                <div className="text-center py-4">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">No active connections in {cityNames[currentCity]}</p>
                  <p className="text-sm text-gray-500">Establish property or increase reputation to unlock connections</p>
                </div>
              </div>
            </div>
          )}

          {/* City Intelligence Tab */}
          {activeTab === 'cityinfo' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                City Intelligence - {cityNames[selectedCityForInfo || currentCity] || 'Unknown City'}
              </h3>

              {/* City Overview Card */}
              <div className="bg-gray-800 p-6 rounded-lg border border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-blue-400">Market Overview</h4>
                  <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
                    Intelligence Report
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Market Activity</div>
                    <div className="text-lg font-bold text-green-400">High Volume</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Risk Level</div>
                    <div className="text-lg font-bold text-yellow-400">Moderate</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Competition</div>
                    <div className="text-lg font-bold text-red-400">Intense</div>
                  </div>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedCityForInfo === 'newyork' ? 
                    "The Big Apple's underground market is as fast-paced as Wall Street. High-volume trading with premium prices, but increased police presence and territorial competition make every deal a calculated risk. Times Square tourists provide excellent cover for discrete transactions." :
                  selectedCityForInfo === 'miami' ?
                    "Miami's beachfront lifestyle masks a thriving party drug scene. Tourist influx creates high demand for premium products, especially during Art Basel and Ultra. Ocean access provides unique smuggling opportunities, but DEA maritime patrols are vigilant." :
                  selectedCityForInfo === 'chicago' ?
                    "The Windy City's industrial corridors hide extensive distribution networks. Deep-dish pizza shops and blues clubs offer perfect money laundering fronts. Winter months see increased indoor operations, while summer brings heightened street activity." :
                  selectedCityForInfo === 'detroit' ?
                    "Motor City's abandoned factories create ideal storage and processing facilities. Economic hardship drives high local demand, while proximity to Canadian border opens cross-border opportunities. Police focus on violent crime creates market gaps for smart operators." :
                  selectedCityForInfo === 'houston' ?
                    "Oil money and international shipping make Houston a distribution hub. Energy sector workers create steady demand for stimulants, while port access enables large-scale imports. Chemical industry provides cover for synthetic operations." :
                  selectedCityForInfo === 'cleveland' ?
                    "Blue-collar Cleveland offers working-class customer base seeking affordable relief. Sports venues and concert halls provide mass distribution opportunities. Lake Erie shoreline enables discreet transport routes." :
                  selectedCityForInfo === 'baltimore' ?
                    "Baltimore's harbor city status creates import/export opportunities. Working-class neighborhoods provide steady customer base, while downtown gentrification brings affluent clientele seeking premium products." :
                  selectedCityForInfo === 'atlanta' ?
                    "ATL's music industry connections create high-end celebrity clientele. Hip-hop culture drives trendy product demand, while major airport hub enables national distribution networks." :
                  "Local market dynamics vary by neighborhood demographics, law enforcement presence, and economic conditions. Study patterns carefully before establishing operations."
                  }
                </p>
              </div>

              {/* Pricing Intelligence */}
              <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Pricing Intelligence
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { product: 'Weed', icon: '🌿', trend: 'stable', price: '$400-800' },
                    { product: 'Concentrates', icon: '💎', trend: 'rising', price: '$1,200-2,500' },
                    { product: 'Edibles', icon: '🍪', trend: 'rising', price: '$20-60/unit' },
                    { product: 'Vapes', icon: '💨', trend: 'stable', price: '$80-150/cart' }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-bold text-white text-sm">{item.product}</span>
                      </div>
                      <div className="text-xs text-green-400 mb-1">{item.price}</div>
                      <div className={`text-xs ${
                        item.trend === 'rising' ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {item.trend === 'rising' ? '📈 Rising' : '📊 Stable'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gray-800 p-6 rounded-lg border border-red-500">
                <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Assessment
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-yellow-400" />
                      <span className="text-white">Police Presence</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({length: 5}, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded ${
                            i < 3 ? 'bg-yellow-400' : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-red-400" />
                      <span className="text-white">Territory Disputes</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({length: 5}, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded ${
                            i < 2 ? 'bg-red-400' : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Surveillance Level</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({length: 5}, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded ${
                            i < 3 ? 'bg-blue-400' : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Tips */}
              <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Strategic Tips
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-900 bg-opacity-30 rounded-lg">
                    <span className="text-green-400 text-sm">💡</span>
                    <div className="text-sm text-green-300">
                      <strong>Best Hours:</strong> Peak activity typically 8PM-2AM for street operations, 10AM-6PM for business front transactions.
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-900 bg-opacity-30 rounded-lg">
                    <span className="text-blue-400 text-sm">🎯</span>
                    <div className="text-sm text-blue-300">
                      <strong>Target Demographics:</strong> College districts for party supplies, business areas for professionals seeking quality products.
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-yellow-900 bg-opacity-30 rounded-lg">
                    <span className="text-yellow-400 text-sm">⚠️</span>
                    <div className="text-sm text-yellow-300">
                      <strong>Avoid Zones:</strong> Government buildings, schools, known police patrol routes during shift changes.
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-purple-900 bg-opacity-30 rounded-lg">
                    <span className="text-purple-400 text-sm">🤝</span>
                    <div className="text-sm text-purple-300">
                      <strong>Network Building:</strong> Establish relationships with local suppliers, transportation contacts, and information brokers.
                    </div>
                  </div>
                </div>
              </div>

              {/* Transportation & Logistics */}
              <div className="bg-gray-800 p-6 rounded-lg border border-purple-500">
                <h4 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Transportation & Logistics
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-bold text-white text-sm">Entry Routes</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Highway access: Multiple routes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">Public transit: Extensive network</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">Airports: International access</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-bold text-white text-sm">Storage Options</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Warehouses: Industrial district</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">Safe houses: Residential areas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">Storage units: Self-storage facilities</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Command Center Tab (former popup, now integrated) */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 mb-2" 
                    style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  🎯 COMMAND CENTER 🎯
                </h3>
                <div className="text-sm text-gray-400">
                  Advanced operations, special gear, and mission control
                </div>
              </div>

              {/* Sub-tabs for Command Center */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-800 p-1 rounded-lg flex space-x-1">
                  <button
                    onClick={() => setActiveSubTab('skills')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeSubTab === 'skills'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    ⚡ SKILLZ
                  </button>
                  <button
                    onClick={() => setActiveSubTab('special')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeSubTab === 'special'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    📦 Special Products
                  </button>
                  <button
                    onClick={() => setActiveSubTab('missions')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeSubTab === 'missions'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    🚚 AI Missions
                  </button>
                </div>
              </div>

              {/* SKILLZ Sub-tab Content */}
              {activeSubTab === 'skills' && (
                <>
                  {/* Enhanced SKILLZ Tab UI */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        name: 'Streetwise',
                        level: gameState.skills?.streetwise || 0,
                        maxLevel: 5,
                        icon: '🕵️',
                        color: 'from-blue-600 to-blue-400',
                        description: 'Street knowledge & area scouting',
                        actions: ['Scout Area', 'Find Safe Routes']
                      },
                      {
                        name: 'Networking',
                        level: gameState.skills?.networking || 0,
                        maxLevel: 5,
                        icon: '🤝',
                        color: 'from-purple-600 to-purple-400',
                        description: 'Connect with suppliers & customers',
                        actions: ['Network Connect', 'Find Suppliers']
                      },
                      {
                        name: 'Stealth',
                        level: gameState.skills?.stealth || 0,
                        maxLevel: 5,
                        icon: '🥷',
                        color: 'from-gray-600 to-gray-400',
                        description: 'Move unseen, reduce heat',
                        actions: ['Stealth Movement', 'Heat Reduction']
                      },
                      {
                        name: 'Police Connections',
                        level: gameState.skills?.policeConnections || 0,
                        maxLevel: 5,
                        icon: '👮',
                        color: 'from-red-600 to-red-400',
                        description: 'Law enforcement contacts',
                        actions: ['Bribe Officers', 'Avoid Arrest']
                      },
                      {
                        name: 'Intimidation',
                        level: gameState.skills?.intimidation || 0,
                        maxLevel: 5,
                        icon: '💪',
                        color: 'from-orange-600 to-orange-400',
                        description: 'Claim territory & better deals',
                        actions: ['Intimidate Rivals', 'Territory Control']
                      },
                      {
                        name: 'Chemistry',
                        level: gameState.skills?.chemistry || 0,
                        maxLevel: 5,
                        icon: '⚗️',
                        color: 'from-green-600 to-green-400',
                        description: 'Product enhancement & synthesis',
                        actions: ['Enhance Products', 'Create Compounds']
                      }
                    ].map((skill) => (
                  <div key={skill.name} className={`bg-gradient-to-br ${skill.color} p-4 rounded-xl border border-gray-600 hover:border-gray-400 transition-all duration-300 transform hover:scale-105`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{skill.icon}</span>
                        <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                          {skill.name}
                        </h4>
                      </div>
                      <div className="flex">
                        {Array.from({ length: skill.maxLevel }, (_, i) => (
                          <span key={i} className={`text-lg ${i < skill.level ? 'text-yellow-400' : 'text-gray-600'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-white mb-1">
                        <span>Level {skill.level}/{skill.maxLevel}</span>
                        <span>XP: {skill.level * 100}/{skill.maxLevel * 100}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-200 mb-3">{skill.description}</p>
                    
                    {/* Action Unlock Indicators */}
                    <div className="space-y-1">
                      {skill.actions.map((action, index) => (
                        <div key={action} className={`text-xs flex items-center gap-2 ${skill.level > index ? 'text-green-300' : 'text-gray-500'}`}>
                          {skill.level > index ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Abilities Section */}
              <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Active Abilities
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skillActions.filter(action => action.available).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onAction(action.id)}
                      className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 rounded-lg border border-green-400 hover:border-green-300 transition-all duration-300 transform hover:scale-105"
                    >
                      <action.icon className="w-6 h-6 text-white" />
                      <span className="text-sm font-bold text-white">{action.name}</span>
                      <span className="text-xs text-green-200 text-center">{action.description}</span>
                    </button>
                  ))}
                </div>
                
                {skillActions.filter(action => action.available).length === 0 && (
                  <div className="text-center py-4">
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">No abilities unlocked yet</p>
                    <p className="text-sm text-gray-500">Level up skills to unlock abilities</p>
                  </div>
                )}
              </div>

              {/* NFT Bonuses Display */}
              {selectedNFT && (
                <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-lg border border-purple-500">
                  <h4 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <Badge className="w-5 h-5" />
                    NFT Trait Bonuses
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedNFT.attributes?.map((trait: any, index: number) => (
                      <div key={index} className="bg-gradient-to-br from-purple-800 to-blue-800 p-3 rounded-lg border border-purple-400">
                        <div className="text-sm font-bold text-purple-300">{trait.trait_type}</div>
                        <div className="text-sm text-white">{trait.value}</div>
                        <div className="text-xs text-purple-200">+{Math.floor(trait.rarity / 10)}% bonus</div>
                      </div>
                    )) || (
                      <div className="col-span-full text-center py-4">
                        <span className="text-gray-400">No NFT bonuses active</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
                </>
              )}

              {/* Special Products Sub-tab Content */}
              {activeSubTab === 'special' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specialProducts.map((product) => (
                      <div 
                        key={product.id}
                        className="bg-gray-800 rounded-lg p-6 border border-cyan-500 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{product.icon}</span>
                          <div>
                            <h4 className="text-lg font-bold text-cyan-400">{product.name}</h4>
                            <span className="px-2 py-1 bg-cyan-900 text-cyan-300 rounded text-xs">
                              {product.category}
                            </span>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-xl font-bold text-green-400">${product.price}</div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-4">{product.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                          {Object.entries(product.effects).map(([key, value]) => (
                            <div key={key} className="bg-gray-700 p-2 rounded">
                              <span className="text-gray-400">{key}:</span>
                              <span className="text-cyan-400 ml-1">{value}%</span>
                            </div>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => {
                            if (gameState.money >= product.price) {
                              onAction('purchase_special_product', product);
                            }
                          }}
                          disabled={gameState.money < product.price}
                          className={`w-full py-2 px-4 rounded-lg font-bold transition-all ${
                            gameState.money >= product.price
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {gameState.money >= product.price ? 'Purchase' : 'Insufficient Funds'}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* AI Coordination Explanation */}
                  <div className="bg-gradient-to-r from-blue-900 to-cyan-900 p-6 rounded-lg border border-blue-500">
                    <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Coordination System
                    </h3>
                    <p className="text-sm text-blue-200 mb-2">
                      Advanced AI handles route optimization, risk assessment, and timing coordination for maximum success rates.
                    </p>
                    <ul className="text-xs text-blue-300 space-y-1">
                      <li>• Real-time traffic and police pattern analysis</li>
                      <li>• Dynamic risk mitigation strategies</li>
                      <li>• Automated client communication</li>
                      <li>• Performance analytics and optimization</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Missions Sub-tab Content */}
              {activeSubTab === 'missions' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {deliveryMissions.map((mission) => (
                      <div 
                        key={mission.id}
                        className="bg-gray-800 rounded-lg p-6 border border-blue-500 hover:border-blue-400 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{mission.icon}</span>
                          <div>
                            <h4 className="text-lg font-bold text-blue-400">{mission.title}</h4>
                            <div className="text-xs text-green-400 font-bold">
                              ${mission.reward.min} - ${mission.reward.max}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-4">{mission.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="text-xs">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white ml-1">{mission.duration}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">Risk Level:</span>
                            <span className={`ml-1 ${mission.riskLevel === 'Low' ? 'text-green-400' : mission.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                              {mission.riskLevel}
                            </span>
                          </div>
                          {mission.requirements.length > 0 && (
                            <div className="text-xs">
                              <span className="text-gray-400">Requirements:</span>
                              <div className="mt-1 space-y-1">
                                {mission.requirements.map((req, index) => (
                                  <div key={index} className="text-red-400">• {req}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            // Check requirements
                            const hasRequirements = mission.requirements.every(req => 
                              specialProducts.some(product => 
                                product.name.toLowerCase().includes(req.toLowerCase()) &&
                                (gameState.inventory || []).includes(product.id)
                              )
                            );
                            
                            if (hasRequirements) {
                              onAction('start_delivery_mission', mission);
                            }
                          }}
                          disabled={mission.requirements.length > 0}
                          className={`w-full py-2 px-4 rounded-lg font-bold transition-all ${
                            mission.requirements.length === 0
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {mission.requirements.length === 0 ? 'Start Mission' : 'Requirements Needed'}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Active Missions Display */}
                  <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
                    <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Active Missions
                    </h4>
                    
                    {activeMissions.length === 0 ? (
                      <div className="text-center py-4">
                        <Truck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">No active delivery missions</p>
                        <p className="text-xs text-gray-500">Use special products to unlock AI-powered delivery missions</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeMissions.map((mission) => (
                          <div key={mission.id} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-green-400">{mission.title}</span>
                              <span className="text-xs text-gray-400">{mission.timeRemaining}</span>
                            </div>
                            <div className="text-sm text-gray-300 mb-2">{mission.description}</div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-green-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${mission.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plug Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mb-2" 
                    style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                  📊 PLUG PERFORMANCE STATS
                </h3>
                <div className="text-sm text-gray-400">
                  Your trading performance and Plug NFT statistics
                </div>
              </div>

              {/* Current Plug NFT Display */}
              {selectedNFT && (
                <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-lg border border-purple-500">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={selectedNFT.image} 
                      alt={selectedNFT.name}
                      className="w-16 h-16 rounded-lg border border-purple-400"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-purple-400">{selectedNFT.name}</h4>
                      <div className="text-sm text-purple-300">Rank #{selectedNFT.rank} • Rarity Score: {selectedNFT.rarity_score}</div>
                      <div className="text-xs text-purple-200">Your Active Plug</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-purple-800/30 p-3 rounded-lg">
                      <div className="text-purple-300 font-bold text-sm">Trading Bonus</div>
                      <div className="text-white text-lg">+{(selectedNFT.rank > 2000 ? 5 : selectedNFT.rank > 1500 ? 10 : selectedNFT.rank > 800 ? 15 : selectedNFT.rank > 400 ? 20 : 25)}%</div>
                    </div>
                    <div className="bg-blue-800/30 p-3 rounded-lg">
                      <div className="text-blue-300 font-bold text-sm">Heat Reduction</div>
                      <div className="text-white text-lg">-{(selectedNFT.rank > 2000 ? 5 : selectedNFT.rank > 1500 ? 10 : selectedNFT.rank > 800 ? 15 : selectedNFT.rank > 400 ? 20 : 25)}%</div>
                    </div>
                    <div className="bg-green-800/30 p-3 rounded-lg">
                      <div className="text-green-300 font-bold text-sm">Mission Success</div>
                      <div className="text-white text-lg">+{(selectedNFT.rank > 2000 ? 10 : selectedNFT.rank > 1500 ? 15 : selectedNFT.rank > 800 ? 20 : selectedNFT.rank > 400 ? 25 : 30)}%</div>
                    </div>
                    <div className="bg-yellow-800/30 p-3 rounded-lg">
                      <div className="text-yellow-300 font-bold text-sm">AI Quality</div>
                      <div className="text-white text-lg">+{(selectedNFT.rank > 2000 ? 0.5 : selectedNFT.rank > 1500 ? 0.7 : selectedNFT.rank > 800 ? 1.0 : selectedNFT.rank > 400 ? 1.3 : 1.5).toFixed(1)}x</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trading Performance Stats */}
              <div className="bg-gray-800 p-6 rounded-lg border border-green-400">
                <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trading Performance
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Total Trades</div>
                    <div className="text-2xl font-bold text-green-400">{gameState.totalPurchases || 0}</div>
                    <div className="text-xs text-gray-500">Lifetime deals</div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Best Day</div>
                    <div className="text-2xl font-bold text-blue-400">${Math.max(...(gameState.actionLog || []).filter((action: any) => typeof action === 'string' && action.includes('sale')).map((action: any) => {
                      const match = action.match(/\$(\d+)/);
                      return match ? parseInt(match[1]) : 0;
                    }), 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Single transaction</div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Current Streak</div>
                    <div className="text-2xl font-bold text-purple-400">{gameState.day || 1}</div>
                    <div className="text-xs text-gray-500">Days active</div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Net Worth</div>
                    <div className="text-2xl font-bold text-yellow-400">${((gameState.money || 0) + (gameState.bankAccount || 0) - (gameState.debt || 0)).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total assets</div>
                  </div>
                </div>
              </div>

              {/* Risk Management Stats */}
              <div className="bg-gray-800 p-6 rounded-lg border border-red-400">
                <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Management
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Current Heat</div>
                    <div className="text-2xl font-bold text-orange-400">{gameState.heat || 0}/10</div>
                    <div className="flex gap-1 mt-2">
                      {Array.from({length: 10}, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-3 rounded ${
                            i < (gameState.heat || 0) ? 'bg-orange-400' : 'bg-gray-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Health Status</div>
                    <div className="text-2xl font-bold text-red-400">{gameState.health || 100}%</div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                      <div 
                        className="bg-red-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${gameState.health || 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Safe Days</div>
                    <div className="text-2xl font-bold text-green-400">{Math.max(0, (gameState.day || 1) - Math.floor((gameState.heat || 0) / 2))}</div>
                    <div className="text-xs text-gray-500">Low heat periods</div>
                  </div>
                </div>
              </div>

              {/* Achievement Progress */}
              <div className="bg-gray-800 p-6 rounded-lg border border-yellow-400">
                <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Achievement Progress
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-yellow-400">Trading Milestones</span>
                      <span className="text-xs text-gray-400">{Math.min(100, Math.floor(((gameState.totalPurchases || 0) / 50) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.floor(((gameState.totalPurchases || 0) / 50) * 100))}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{gameState.totalPurchases || 0}/50 trades completed</div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-blue-400">Survival Expert</span>
                      <span className="text-xs text-gray-400">{Math.min(100, Math.floor(((gameState.day || 1) / 30) * 100))}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.floor(((gameState.day || 1) / 30) * 100))}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{gameState.day || 1}/30 days survived</div>
                  </div>
                </div>
              </div>

              {/* Plug NFT Trait Analysis */}
              {selectedNFT && selectedNFT.attributes && (
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-lg border border-indigo-500">
                  <h4 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
                    <Badge className="w-5 h-5" />
                    NFT Trait Power Analysis
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedNFT.attributes.map((trait: any, index: number) => {
                      const powerLevel = trait.rarity < 5 ? 'Legendary' : trait.rarity < 15 ? 'Epic' : trait.rarity < 30 ? 'Rare' : 'Common';
                      const powerColor = trait.rarity < 5 ? 'text-yellow-400' : trait.rarity < 15 ? 'text-purple-400' : trait.rarity < 30 ? 'text-blue-400' : 'text-green-400';
                      
                      return (
                        <div key={index} className="bg-indigo-800/30 p-4 rounded-lg border border-indigo-400/30">
                          <div className="text-sm font-bold text-indigo-300 mb-1">{trait.trait_type}</div>
                          <div className="text-sm text-white mb-2">{trait.value}</div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold ${powerColor}`}>{powerLevel}</span>
                            <span className="text-xs text-gray-400">{trait.rarity}% rarity</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                trait.rarity < 5 ? 'bg-yellow-400' : 
                                trait.rarity < 15 ? 'bg-purple-400' : 
                                trait.rarity < 30 ? 'bg-blue-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${Math.max(10, 100 - trait.rarity)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-indigo-200 mt-1">+{Math.floor((100 - trait.rarity) / 10)}% gameplay bonus</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No NFT Selected State */}
              {!selectedNFT && (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">No Plug NFT Selected</h3>
                  <p className="text-gray-500 mb-4">Connect a GROWERZ NFT to see your Plug performance statistics</p>
                  <div className="text-sm text-gray-600">
                    Visit the Command Center tab to select your NFT assistant
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Close Button */}
        <div className="flex justify-center items-center p-4 border-t border-green-400 bg-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors border border-red-500 hover:border-red-400 flex items-center gap-2"
            title="Close Command Center"
          >
            <X className="w-4 h-4" />
            Close Command Center
          </button>
        </div>
      </div>

      {/* Special Products Overlay Modal */}
      {showSpecialProducts && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-cyan-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                🎯 Command Center Special Products
              </h2>
              <button
                onClick={() => setShowSpecialProducts(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {specialProducts.map((product) => (
                <div 
                  key={product.id}
                  className={`bg-gray-800 rounded-lg p-4 border transition-all hover:scale-105 cursor-pointer ${
                    selectedSpecialProduct?.id === product.id ? 'border-cyan-400' : 'border-gray-600'
                  }`}
                  onClick={() => setSelectedSpecialProduct(product)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{product.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-cyan-400 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-300 mb-3">{product.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-xs">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white ml-1">{product.category}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Unlock:</span>
                          <span className="text-white ml-1">Level {product.unlockLevel}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-green-400 mb-1">Effects:</h4>
                        <div className="text-xs text-gray-300 space-y-1">
                          {Object.entries(product.effects).map(([key, value]) => (
                            <div key={key}>
                              {key}: +{value}{typeof value === 'number' && value < 10 ? '%' : ''}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-yellow-400">${product.price}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Purchase logic here
                            onAction('purchase_special_product', product);
                            setShowSpecialProducts(false);
                          }}
                          disabled={gameState.money < product.price}
                          className={`px-4 py-2 rounded-lg font-bold transition-all ${
                            gameState.money >= product.price
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {gameState.money >= product.price ? 'Purchase' : 'Insufficient Funds'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Mission Overlay Modal */}
      {showDeliveryMission && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-green-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <Truck className="w-6 h-6" />
                AI-Powered Delivery Missions
              </h2>
              <button
                onClick={() => setShowDeliveryMission(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {generateDeliveryMissions().map((mission) => (
                <div key={mission.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-green-400 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-400 mb-1">{mission.title}</h3>
                      <p className="text-sm text-gray-300 mb-2">{mission.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-xs">
                          <span className="text-gray-400">Reward:</span>
                          <span className="text-yellow-400 ml-1 font-bold">${mission.reward}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Risk:</span>
                          <span className={`ml-1 font-bold ${
                            mission.risk === 'high' ? 'text-red-400' : 
                            mission.risk === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>{mission.risk}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Time Limit:</span>
                          <span className="text-white ml-1">{mission.timeLimit}h</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-cyan-400 mb-1">Requirements:</h4>
                        <div className="flex flex-wrap gap-2">
                          {mission.requirements.map((req) => {
                            const product = specialProducts.find(p => p.id === req);
                            const hasProduct = false; // Check if player owns this product
                            return (
                              <span 
                                key={req}
                                className={`text-xs px-2 py-1 rounded ${
                                  hasProduct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                }`}
                              >
                                {product?.name || req}
                                {hasProduct ? ' ✓' : ' ✗'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      AI will handle: Route optimization, risk assessment, timing coordination
                    </div>
                    <button
                      onClick={() => {
                        // Start mission logic
                        const newMission = { ...mission, active: true, progress: 0 };
                        setActiveMissions(prev => [...prev, newMission]);
                        onAction('start_delivery_mission', mission);
                        setShowDeliveryMission(false);
                      }}
                      disabled={mission.requirements.some(req => !specialProducts.find(p => p.id === req))}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        mission.requirements.every(req => specialProducts.find(p => p.id === req))
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 inline mr-2" />
                      Start Mission
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-500">
              <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Mission System
              </h3>
              <p className="text-sm text-blue-200 mb-2">
                Our advanced AI handles route optimization, risk assessment, and timing coordination for maximum success rates.
              </p>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Real-time traffic and police pattern analysis</li>
                <li>• Dynamic risk mitigation strategies</li>
                <li>• Automated client communication</li>
                <li>• Performance analytics and optimization</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* City Price Graphs Modal */}
      {showCityPriceGraphs && cityPriceData && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-blue-500/50 w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                📊 CITY PRICE INTELLIGENCE DASHBOARD
              </h2>
              <button
                onClick={() => setShowCityPriceGraphs(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {Object.entries(cityPriceData).map(([product, data]: [string, any]) => (
                  <div key={product} className="bg-gray-800 p-6 rounded-xl border border-gray-600">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      {getProductIcon(product)} {product} - Market Analysis
                    </h3>
                    
                    {/* Price Line Chart */}
                    <div className="mb-6" style={{ height: '300px' }}>
                      <Line
                        data={{
                          labels: data.cities,
                          datasets: [{
                            label: `${product} Price ($)`,
                            data: data.prices,
                            borderColor: getProductColor(product, 1),
                            backgroundColor: getProductColor(product, 0.1),
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: getProductColor(product, 1),
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: { color: '#fff' }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleColor: '#fff',
                              bodyColor: '#fff',
                              borderColor: getProductColor(product, 1),
                              borderWidth: 1
                            }
                          },
                          scales: {
                            x: {
                              ticks: { 
                                color: '#9CA3AF',
                                maxRotation: 45,
                                font: { size: 10 }
                              },
                              grid: { color: '#374151' }
                            },
                            y: {
                              ticks: { 
                                color: '#9CA3AF',
                                callback: function(value: any) {
                                  return '$' + value;
                                }
                              },
                              grid: { color: '#374151' }
                            }
                          },
                          interaction: {
                            intersect: false,
                            mode: 'index'
                          }
                        }}
                      />
                    </div>
                    
                    {/* Market Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-blue-900/30 p-3 rounded-lg">
                        <div className="text-blue-300 font-bold">Average</div>
                        <div className="text-white">${data.averagePrice}</div>
                      </div>
                      <div className="bg-green-900/30 p-3 rounded-lg">
                        <div className="text-green-300 font-bold">Highest</div>
                        <div className="text-white text-xs">{data.highestCity}</div>
                        <div className="text-yellow-400">${Math.max(...data.prices)}</div>
                      </div>
                      <div className="bg-red-900/30 p-3 rounded-lg">
                        <div className="text-red-300 font-bold">Lowest</div>
                        <div className="text-white text-xs">{data.lowestCity}</div>
                        <div className="text-green-400">${Math.min(...data.prices)}</div>
                      </div>
                      <div className="bg-purple-900/30 p-3 rounded-lg">
                        <div className="text-purple-300 font-bold">Range</div>
                        <div className="text-white">${data.priceRange}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Comprehensive Multi-Product Line Graph */}
              <div className="bg-gray-800 p-6 rounded-xl border border-cyan-500 mb-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  📈 ALL PRODUCTS - CROSS-CITY PRICE COMPARISON
                </h3>
                <div className="mb-4" style={{ height: '500px' }}>
                  <Line
                    data={{
                      labels: Object.values(cityPriceData || {})[0]?.cities || [],
                      datasets: Object.entries(cityPriceData).map(([product, data]: [string, any]) => ({
                        label: `${product}`,
                        data: data.prices,
                        borderColor: getProductColor(product, 1),
                        backgroundColor: getProductColor(product, 0.1),
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: getProductColor(product, 1),
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      }))
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { 
                            color: '#fff',
                            font: { size: 12 },
                            usePointStyle: true
                          },
                          position: 'top'
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: '#6366f1',
                          borderWidth: 1,
                          mode: 'index',
                          intersect: false,
                          callbacks: {
                            title: function(context: any) {
                              return `${context[0].label}`;
                            },
                            label: function(context: any) {
                              return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: { 
                            color: '#9CA3AF',
                            maxRotation: 45,
                            font: { size: 11 }
                          },
                          grid: { color: '#374151' },
                          title: {
                            display: true,
                            text: 'Cities',
                            color: '#D1D5DB',
                            font: { size: 14, weight: 'bold' }
                          }
                        },
                        y: {
                          ticks: { 
                            color: '#9CA3AF',
                            callback: function(value: any) {
                              return '$' + value.toLocaleString();
                            }
                          },
                          grid: { color: '#374151' },
                          title: {
                            display: true,
                            text: 'Price ($)',
                            color: '#D1D5DB',
                            font: { size: 14, weight: 'bold' }
                          }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                </div>
                
                {/* Chart Legend and Instructions */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <h4 className="text-lg font-bold text-cyan-300 mb-2">📊 How to Read This Chart</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300 mb-2">
                        <span className="text-cyan-400 font-bold">Each colored line</span> represents one product's price across all 16 cities.
                      </p>
                      <p className="text-gray-300">
                        <span className="text-green-400 font-bold">Higher peaks</span> = expensive cities for that product. 
                        <span className="text-red-400 font-bold"> Lower valleys</span> = cheap cities.
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 mb-2">
                        <span className="text-yellow-400 font-bold">Strategy:</span> Buy products in cities where their line is low, sell where it's high.
                      </p>
                      <p className="text-gray-300">
                        <span className="text-purple-400 font-bold">Hover</span> over any point to see exact prices and city names.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Profit Opportunity Analysis */}
              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  💰 PROFIT OPPORTUNITY ANALYSIS
                </h3>
                <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                  <p className="text-sm text-blue-200">
                    <span className="font-bold text-blue-300">Market Intelligence:</span> Buy low in source cities, sell high in demand cities. 
                    Factor in travel costs and heat levels for maximum profit margins.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(cityPriceData).map(([product, data]: [string, any]) => {
                    const maxPrice = Math.max(...data.prices);
                    const minPrice = Math.min(...data.prices);
                    const profitMargin = maxPrice - minPrice;
                    const profitPercent = Math.round((profitMargin / minPrice) * 100);
                    
                    return (
                      <div key={product} className="bg-gray-800/50 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getProductIcon(product)}</span>
                          <span className="font-bold text-white">{product}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Max Profit:</span>
                            <span className="text-green-400 font-bold">${profitMargin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Profit %:</span>
                            <span className="text-yellow-400 font-bold">{profitPercent}%</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Buy: {data.lowestCity} → Sell: {data.highestCity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltipInfo.show && (
        <div 
          className="fixed bg-black bg-opacity-90 text-white p-2 rounded text-xs max-w-xs z-50 pointer-events-none"
          style={{ left: tooltipInfo.x, top: tooltipInfo.y }}
        >
          {tooltipInfo.content.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerPanelUI;