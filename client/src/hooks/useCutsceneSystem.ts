import { useState, useCallback, useEffect } from 'react';

interface CutsceneCharacter {
  id: string;
  name: string;
  image: string;
  title: string;
  backgroundColor: string;
  textColor: string;
}

interface CutsceneData {
  character: CutsceneCharacter;
  title: string;
  message: string;
  type: 'terry_prediction' | 'cop_raid' | 'plug_reward' | 'random_buyer' | 'mission_complete' | 'special_event';
  data?: any;
  duration?: number;
}

interface GameState {
  day: number;
  money: number;
  heat: number;
  currentCity: string;
  networkingLevel: number;
  inventory: any[];
  [key: string]: any;
}

export const useCutsceneSystem = (gameState: GameState, selectedPlugNFT?: any) => {
  const [activeCutscene, setActiveCutscene] = useState<CutsceneData | null>(null);
  const [cutsceneQueue, setCutsceneQueue] = useState<CutsceneData[]>([]);
  const [lastTerryDay, setLastTerryDay] = useState<number>(0);
  const [cutsceneHistory, setCutsceneHistory] = useState<string[]>([]);

  // Enhanced Terry Market Prediction System with Accurate Market Intelligence
  const triggerTerryPrediction = useCallback(() => {
    if (gameState.day <= lastTerryDay + 2) return; // Minimum 2 days between Terry visits

    // Calculate Terry appearance chance based on networking level
    const baseChance = 0.15; // 15% base chance
    const networkingBonus = (gameState.networkingLevel || 0) * 0.05; // +5% per networking level
    const terryChance = Math.min(baseChance + networkingBonus, 0.4); // Max 40% chance

    if (Math.random() < terryChance) {
      // Generate accurate market predictions that will actually happen
      const drugMapping = {
        'weed': 'Reggie',
        'mids': 'Mids',
        'kush': 'OG Kush',
        'sour': 'Sour Diesel',
        'purple': 'Purple Haze',
        'white': 'White Widow',
        'gelato': 'Gelato',
        'runtz': 'Runtz'
      };

      const allProducts = Object.keys(drugMapping);
      
      // Select 3-4 products for predictions
      const selectedProducts = allProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 2)); // 3-4 products

      // Generate predictions with specific cities
      const cities = ['New York', 'Miami', 'Chicago', 'Detroit', 'Los Angeles', 'Houston', 'Philadelphia', 'Boston', 'Atlanta', 'Seattle', 'Denver', 'Las Vegas', 'Phoenix', 'Portland', 'San Francisco', 'The Neighborhood'];
      
      const predictions = selectedProducts.map(productId => {
        const priceIncrease = Math.random() < 0.7; // 70% chance for price increase
        const changePercent = priceIncrease 
          ? Math.floor(Math.random() * 80) + 20  // +20% to +100% increase
          : -(Math.floor(Math.random() * 30) + 10); // -10% to -40% decrease
        
        const predictedCity = Math.random() < 0.6 
          ? cities[Math.floor(Math.random() * cities.length)]
          : null; // 60% chance to mention specific city
        
        return {
          productId,
          product: drugMapping[productId],
          change: changePercent,
          confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
          targetDay: gameState.day + Math.floor(Math.random() * 3) + 2, // 2-4 days from now
          cityHint: predictedCity,
          isPriceIncrease: priceIncrease
        };
      }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)); // Sort by magnitude of change

      // Create Terry's message with specific product and city intelligence
      let terryMessage = "Woof! My nose is picking up some serious market intelligence! ";
      
      if (predictions.some(p => p.isPriceIncrease)) {
        const topRising = predictions.filter(p => p.isPriceIncrease)[0];
        terryMessage += `${topRising.product} is about to see a HUGE surge in ${topRising.targetDay - gameState.day} days - buy now! `;
      }
      
      const cityPrediction = predictions.find(p => p.cityHint && !p.isPriceIncrease);
      if (cityPrediction) {
        terryMessage += `Also, ${cityPrediction.cityHint} is having massive sales on ${cityPrediction.product} - prices will crash by ${Math.abs(cityPrediction.change)}% in the next few days!`;
      }

      const terryEvent: CutsceneData = {
        character: {
          id: 'terry',
          name: 'Terry',
          image: '/attached_assets/1985ce84fdc5c_1753905458779.png',
          title: 'Market Intelligence Dog',
          backgroundColor: 'from-orange-900 to-yellow-900',
          textColor: 'text-orange-100'
        },
        title: 'TERRY TIME! 🐕📈',
        message: terryMessage,
        type: 'terry_prediction',
        data: {
          predictions,
          validUntilDay: gameState.day + 5,
          accuracy: 95 + (gameState.networkingLevel || 0) * 1, // Terry is highly accurate
          predictionDay: gameState.day
        },
        duration: 15000 // 15 seconds for detailed predictions
      };

      setLastTerryDay(gameState.day);
      
      // Store Terry's predictions globally for price generation system
      if (typeof window !== 'undefined') {
        const existingPredictions = JSON.parse(window.localStorage.getItem('terryPredictions') || '[]');
        const newPredictions = [...existingPredictions, ...predictions.map(p => ({
          ...p,
          predictionDay: gameState.day,
          walletAddress: window.localStorage.getItem('connectedWallet') || 'unknown'
        }))];
        window.localStorage.setItem('terryPredictions', JSON.stringify(newPredictions));
        console.log('🐕 Terry made predictions for:', predictions.map(p => `${p.product} ${p.change > 0 ? '+' : ''}${p.change}%`).join(', '));
      }
      
      queueCutscene(terryEvent);
    }
  }, [gameState.day, gameState.networkingLevel, lastTerryDay]);

  // Enhanced Multi-Officer Police System
  const triggerPoliceEncounter = useCallback(() => {
    if (gameState.heat >= 2) {
      const encounterChance = (gameState.heat - 1) * 0.15; // 15% per heat level above 1
      
      if (Math.random() < encounterChance) {
        // Define the three police officers
        const policeOfficers = [
          {
            id: 'martinez',
            name: 'Officer Martinez',
            image: '/attached_assets/eUOASsw_1753906068538.png',
            title: 'Patrol Officer - Aggressive Division',
            personality: 'intimidating',
            description: 'The bald cop with sunglasses - known for aggressive tactics',
            backgroundColor: 'from-red-900 to-gray-900',
            textColor: 'text-red-100'
          },
          {
            id: 'johnson',
            name: 'Officer Johnson',
            image: '/attached_assets/OEnuzI4_1753906070523.png',
            title: 'Senior Detective - Vice Squad',
            personality: 'corrupt',
            description: 'The decorated officer - rumored to take bribes',
            backgroundColor: 'from-blue-900 to-purple-900',
            textColor: 'text-blue-100'
          },
          {
            id: 'williams',
            name: 'Officer Williams',
            image: '/attached_assets/7EBiEdQ_1753906078020.png',
            title: 'Rookie Officer - Beat Patrol',
            personality: 'rookie',
            description: 'The young cop with a hat - still learning the ropes',
            backgroundColor: 'from-gray-900 to-blue-900',
            textColor: 'text-gray-100'
          }
        ];

        // Heat Level 2-3: Single Officer Encounters
        if (gameState.heat <= 3) {
          const officer = policeOfficers[Math.floor(Math.random() * policeOfficers.length)];
          const encounterTypes = [
            // Peek/Surveillance Event
            {
              character: officer,
              title: '👁️ Suspicious Activity',
              message: `${officer.name} is watching you from across the street. ${officer.description}. You notice them taking notes...`,
              type: 'police_peek',
              data: {
                officerId: officer.id,
                officer: officer.name,
                heatLevel: gameState.heat,
                riskLevel: 'LOW'
              },
              duration: 8000
            },
            // Corrupt Cop Shakedown
            {
              character: officer,
              title: '💰 Crooked Cop Demand',
              message: officer.personality === 'corrupt' 
                ? `${officer.name} approaches with a knowing look. "I think we can work something out here... for the right price."`
                : `${officer.name} stops you for questioning. "I've been watching your activities. This can go easy or hard for you."`,
              type: 'police_shakedown',
              data: {
                officerId: officer.id,
                officer: officer.name,
                heatLevel: gameState.heat,
                bribeCost: officer.personality === 'corrupt' ? 250 : 400,
                resistanceRisk: officer.personality === 'intimidating' ? 'HIGH' : 'MEDIUM'
              },
              duration: 10000
            },
            // Traffic Stop/Search
            {
              character: officer,
              title: '🚔 Police Stop',
              message: `${officer.name} pulls you over. "${officer.personality === 'rookie' ? 'License and registration please. I need to search your vehicle.' : 'Step out of the vehicle. We have reports of suspicious activity.'}"`,
              type: 'police_stop',
              data: {
                officerId: officer.id,
                officer: officer.name,
                heatLevel: gameState.heat,
                searchRisk: gameState.inventory?.length || 0
              },
              duration: 9000
            }
          ];
          
          const encounter = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
          queueCutscene(encounter);
        }

        // Heat Level 4-5: Multi-Officer Operations
        else if (gameState.heat >= 4) {
          const operationTypes = [
            // Coordinated Bust
            {
              character: {
                id: 'task_force',
                name: 'Police Task Force',
                image: policeOfficers[1].image, // Johnson leads
                title: 'Metro Police Task Force',
                backgroundColor: 'from-red-900 to-black',
                textColor: 'text-red-100'
              },
              title: '🚨 COORDINATED BUST',
              message: `All three officers surround you! Martinez blocks the front, Johnson approaches with papers, and Williams covers the rear. "You're under arrest for narcotics trafficking!"`,
              type: 'police_bust',
              data: {
                officers: policeOfficers.map(o => o.name),
                heatLevel: gameState.heat,
                riskLevel: 'EXTREME',
                jailTime: 3,
                fineAmount: 1000,
                massiveBribeCost: 2000
              },
              duration: 12000
            },
            // Property Raid
            {
              character: {
                id: 'swat_team',
                name: 'SWAT Team Leader',
                image: policeOfficers[0].image, // Martinez leads SWAT
                title: 'Special Weapons and Tactics',
                backgroundColor: 'from-black to-red-900',
                textColor: 'text-white'
              },
              title: '🏠 PROPERTY RAID',
              message: `Martinez leads a full SWAT team to your location! "SEARCH WARRANT! Johnson, take the back! Williams, secure the perimeter!" They're tearing the place apart...`,
              type: 'police_raid',
              data: {
                officers: policeOfficers.map(o => o.name),
                heatLevel: gameState.heat,
                riskLevel: 'MAXIMUM',
                inventoryLoss: Math.floor((gameState.inventory?.length || 0) * 0.7),
                resistArrestRisk: 'DEADLY'
              },
              duration: 15000
            }
          ];
          
          const operation = operationTypes[Math.floor(Math.random() * operationTypes.length)];
          queueCutscene(operation);
        }
      }
    }
  }, [gameState.heat, gameState.inventory]);

  // Plug Reward System
  const triggerPlugReward = useCallback(() => {
    if (!selectedPlugNFT) return;

    const rewardChance = 0.08; // 8% chance
    
    if (Math.random() < rewardChance) {
      const rewardAmount = Math.floor(Math.random() * 300) + 100; // $100-$400
      const reasons = [
        'Excellent trading performance',
        'Smart risk management',
        'Networking skill improvement',
        'Market timing bonus',
        'Heat reduction achievement'
      ];

      const plugEvent: CutsceneData = {
        character: {
          id: 'plug',
          name: selectedPlugNFT.name || 'The Plug',
          image: selectedPlugNFT.image || '/api/placeholder/150/150',
          title: 'Your AI Assistant',
          backgroundColor: 'from-purple-900 to-pink-900',
          textColor: 'text-purple-100'
        },
        title: 'PLUG BONUS! 💎',
        message: `Your performance has been impressive! I've secured a bonus reward for your excellent work. Keep up the smart trading strategies!`,
        type: 'plug_reward',
        data: {
          amount: rewardAmount,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          nftBonus: selectedPlugNFT.rank ? Math.floor(rewardAmount * 0.1) : 0
        },
        duration: 8000
      };

      queueCutscene(plugEvent);
    }
  }, [selectedPlugNFT]);

  // Random Buyer System
  const triggerRandomBuyer = useCallback(() => {
    if (gameState.inventory?.length === 0) return;

    const buyerChance = 0.12; // 12% chance
    
    if (Math.random() < buyerChance) {
      const products = ['Weed', 'Speed', 'Heroin', 'Coke', 'Meth', 'Dope', 'Shrooms', 'Fentanyl'];
      const product = products[Math.floor(Math.random() * products.length)];
      const basePrice = Math.floor(Math.random() * 50) + 25; // $25-$75 base
      const multiplier = 1.2 + Math.random() * 0.8; // 1.2x to 2.0x multiplier
      const offerPrice = Math.floor(basePrice * multiplier);

      const buyerEvent: CutsceneData = {
        character: {
          id: 'buyer',
          name: 'Street Buyer',
          image: '/api/placeholder/150/150',
          title: 'Potential Customer',
          backgroundColor: 'from-green-900 to-emerald-900',
          textColor: 'text-green-100'
        },
        title: 'SPECIAL BUYER! 🤝',
        message: `Hey, I heard you might have some quality ${product}. I'm willing to pay premium prices for the right stuff. What do you say?`,
        type: 'random_buyer',
        data: {
          product,
          price: offerPrice,
          quantity: Math.floor(Math.random() * 5) + 1,
          negotiationRoom: Math.floor(offerPrice * 0.15) // 15% negotiation room
        },
        duration: 10000
      };

      queueCutscene(buyerEvent);
    }
  }, [gameState.inventory]);

  // Mission Complete Celebrations
  const triggerMissionComplete = useCallback((missionData: any) => {
    const missionEvent: CutsceneData = {
      character: {
        id: 'plug',
        name: selectedPlugNFT?.name || 'Mission Control',
        image: selectedPlugNFT?.image || '/api/placeholder/150/150',
        title: 'Mission Coordinator',
        backgroundColor: 'from-blue-900 to-cyan-900',
        textColor: 'text-blue-100'
      },
      title: 'MISSION SUCCESS! ✅',
      message: `Outstanding work completing the ${missionData.name}! Your skills and strategic thinking paid off. Here's your well-earned reward.`,
      type: 'mission_complete',
      data: {
        missionName: missionData.name,
        reward: missionData.reward,
        bonusReason: missionData.bonusReason,
        experienceGained: missionData.experienceGained
      },
      duration: 8000
    };

    queueCutscene(missionEvent);
  }, [selectedPlugNFT]);

  // Queue management
  const queueCutscene = useCallback((cutscene: CutsceneData) => {
    setCutsceneQueue(prev => [...prev, cutscene]);
    setCutsceneHistory(prev => [...prev, `${cutscene.type}_${Date.now()}`]);
  }, []);

  const showNextCutscene = useCallback(() => {
    if (cutsceneQueue.length > 0 && !activeCutscene) {
      const nextCutscene = cutsceneQueue[0];
      setCutsceneQueue(prev => prev.slice(1));
      setActiveCutscene(nextCutscene);
    }
  }, [cutsceneQueue, activeCutscene]);

  const closeCutscene = useCallback(() => {
    setActiveCutscene(null);
  }, []);

  const handleCutsceneAction = useCallback((action: string, data?: any) => {
    // Actions will be handled by the parent component
    return { action, data };
  }, []);

  // Auto-trigger cutscenes based on game state changes
  useEffect(() => {
    if (gameState.day > 0) {
      // Daily random event checks
      if (Math.random() < 0.3) { // 30% chance of some event per day
        const eventRoll = Math.random();
        
        if (eventRoll < 0.4) triggerTerryPrediction();
        else if (eventRoll < 0.6) triggerPoliceEncounter();
        else if (eventRoll < 0.8) triggerPlugReward();
        else triggerRandomBuyer();
      }
    }
  }, [gameState.day, triggerTerryPrediction, triggerPoliceEncounter, triggerPlugReward, triggerRandomBuyer]);

  // Process cutscene queue
  useEffect(() => {
    if (!activeCutscene && cutsceneQueue.length > 0) {
      const timer = setTimeout(showNextCutscene, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeCutscene, cutsceneQueue.length, showNextCutscene]);

  return {
    activeCutscene,
    closeCutscene,
    handleCutsceneAction,
    triggerMissionComplete,
    queueCutscene,
    cutsceneHistory: cutsceneHistory.slice(-10) // Keep last 10 events
  };
};

export default useCutsceneSystem;