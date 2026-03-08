import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, TrendingUp, TrendingDown, Users, MapPin, X, Check, AlertCircle } from 'lucide-react';

interface AIEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'market_shift' | 'police_activity' | 'supplier_issue' | 'opportunity' | 'crisis' | 'territory_war' | 'weather' | 'social_media' | 'informant' | 'rival_gang';
  choices: Array<{
    id: string;
    text: string;
    consequence: string;
    effects: {
      money?: number;
      heat?: number;
      reputation?: number;
      inventory?: Record<string, number>;
      time?: number;
      cityAccess?: string[];
    };
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeLimit?: number;
  location?: string;
  aiGenerated: boolean;
}

interface AIEventSystemProps {
  gameState: {
    currentCity: string;
    day: number;
    money: number;
    heat: number;
    reputation: number;
    inventory: Record<string, number>;
  };
  onEventChoice: (eventId: string, choiceId: string, effects: any) => void;
  connectedWallet: string;
  isActive: boolean;
}

const AIEventSystem: React.FC<AIEventSystemProps> = ({
  gameState,
  onEventChoice,
  connectedWallet,
  isActive
}) => {
  const [currentEvent, setCurrentEvent] = useState<AIEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventHistory, setEventHistory] = useState<string[]>([]);

  // Generate AI event every 3-7 minutes during active gameplay
  useEffect(() => {
    if (!isActive) return;

    const generateEventInterval = setInterval(() => {
      if (!currentEvent && Math.random() < 0.7) { // 70% chance to generate event
        generateAIEvent();
      }
    }, Math.random() * 240000 + 180000); // 3-7 minutes

    return () => clearInterval(generateEventInterval);
  }, [isActive, currentEvent, gameState]);

  // Timer countdown for events
  useEffect(() => {
    if (currentEvent && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentEvent) {
      // Auto-dismiss event or choose default option
      handleEventTimeout();
    }
  }, [timeLeft, currentEvent]);

  const generateAIEvent = async () => {
    if (isGenerating || currentEvent) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameState: {
            ...gameState,
            previousEvents: eventHistory.slice(-5), // Last 5 events for context
            timeOfDay: getTimeOfDay(),
            weatherCondition: getRandomWeather(),
            marketTrend: getMarketTrend(),
            health: 100,
            timeLeftInDay: 12,
            dealsCompleted: 0,
            totalTransactions: 0,
            timesArrested: 0,
            timesRobbed: 0,
            recentSales: []
          },
          walletAddress: connectedWallet
        })
      });

      if (response.ok) {
        const eventData = await response.json();
        const aiEvent = createDynamicEvent(eventData);
        
        // Ensure no duplicate events
        if (!eventHistory.includes(aiEvent.title)) {
          setCurrentEvent(aiEvent);
          setEventHistory(prev => [...prev, aiEvent.title]);
          setTimeLeft(aiEvent.timeLimit || 30);
        }
      } else {
        generateFallbackEvent();
      }
    } catch (error) {
      console.error('Error generating AI event:', error);
      generateFallbackEvent();
    } finally {
      setIsGenerating(false);
    }
  };

  const createDynamicEvent = (aiData: any): AIEvent => {
    const baseEvent: AIEvent = {
      id: `ai_event_${Date.now()}`,
      title: aiData.title || "Unexpected Development",
      description: aiData.description || "Something unexpected is happening in the streets.",
      eventType: aiData.eventType || 'opportunity',
      choices: aiData.choices || [],
      urgency: aiData.urgency || 'medium',
      timeLimit: aiData.timeLimit || 30,
      location: aiData.location || gameState.currentCity,
      aiGenerated: true
    };

    // Enhance with dynamic choices if AI didn't provide enough
    if (baseEvent.choices.length < 2) {
      baseEvent.choices = generateDynamicChoices(baseEvent);
    }

    return baseEvent;
  };

  const generateDynamicChoices = (event: AIEvent) => {
    const dynamicChoices = [
      {
        id: 'aggressive',
        text: 'Take aggressive action',
        consequence: 'High risk, high reward approach',
        effects: {
          money: Math.floor(Math.random() * 1000) + 500,
          heat: Math.floor(Math.random() * 2) + 1,
          reputation: Math.floor(Math.random() * 10) + 5
        },
        riskLevel: 'high' as const
      },
      {
        id: 'cautious',
        text: 'Play it safe',
        consequence: 'Lower risk, modest gains',
        effects: {
          money: Math.floor(Math.random() * 300) + 100,
          heat: Math.max(0, gameState.heat - 1),
          reputation: Math.floor(Math.random() * 5) + 2
        },
        riskLevel: 'low' as const
      },
      {
        id: 'negotiate',
        text: 'Try to negotiate',
        consequence: 'Diplomatic approach with variable outcomes',
        effects: {
          money: Math.floor(Math.random() * 600) + 200,
          reputation: Math.floor(Math.random() * 15) + 3
        },
        riskLevel: 'medium' as const
      },
      {
        id: 'ignore',
        text: 'Ignore the situation',
        consequence: 'Minimal immediate impact',
        effects: {
          time: -5, // Lose some time
          reputation: Math.floor(Math.random() * 3) - 1
        },
        riskLevel: 'low' as const
      }
    ];

    return dynamicChoices.slice(0, Math.floor(Math.random() * 2) + 2);
  };

  const generateFallbackEvent = () => {
    const fallbackEvents = [
      {
        title: "Street Intel",
        description: "Your contact has information about a potential opportunity, but it comes with risks.",
        eventType: 'opportunity',
        timeLimit: 25
      },
      {
        title: "Market Fluctuation",
        description: "Sudden changes in street demand are affecting prices across the city.",
        eventType: 'market_shift',
        timeLimit: 20
      },
      {
        title: "Territory Dispute",
        description: "Competition is heating up in your area. Your next move could determine your standing.",
        eventType: 'territory_war',
        timeLimit: 35
      }
    ];

    const randomEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    const event: AIEvent = {
      id: `fallback_event_${Date.now()}`,
      ...randomEvent,
      choices: generateDynamicChoices({} as AIEvent),
      urgency: 'medium',
      location: gameState.currentCity,
      aiGenerated: false
    };

    setCurrentEvent(event);
    setTimeLeft(event.timeLimit || 30);
  };

  const handleChoice = (choiceId: string) => {
    if (!currentEvent) return;

    const choice = currentEvent.choices.find(c => c.id === choiceId);
    if (choice) {
      onEventChoice(currentEvent.id, choiceId, choice.effects);
      setCurrentEvent(null);
      setTimeLeft(0);
    }
  };

  const handleEventTimeout = () => {
    if (currentEvent) {
      // Auto-select the safest option
      const safeChoice = currentEvent.choices.find(c => c.riskLevel === 'low') || currentEvent.choices[0];
      handleChoice(safeChoice.id);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  };

  const getRandomWeather = () => {
    const weather = ['clear', 'rainy', 'foggy', 'hot', 'cold'];
    return weather[Math.floor(Math.random() * weather.length)];
  };

  const getMarketTrend = () => {
    return Math.random() > 0.5 ? 'rising' : 'falling';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-900';
      case 'high': return 'border-orange-500 bg-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-900';
      default: return 'border-blue-500 bg-blue-900';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'market_shift': return <TrendingUp className="w-6 h-6" />;
      case 'police_activity': return <AlertTriangle className="w-6 h-6" />;
      case 'opportunity': return <DollarSign className="w-6 h-6" />;
      case 'crisis': return <AlertCircle className="w-6 h-6" />;
      case 'territory_war': return <Users className="w-6 h-6" />;
      default: return <MapPin className="w-6 h-6" />;
    }
  };

  if (!currentEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className={`max-w-md w-full mx-4 p-6 rounded-lg border-2 ${getUrgencyColor(currentEvent.urgency)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-white">
              {getEventIcon(currentEvent.eventType)}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                {currentEvent.title}
              </h3>
              <p className="text-gray-300 text-xs">
                {currentEvent.location} • {currentEvent.urgency.toUpperCase()} PRIORITY
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white font-mono">{timeLeft}s</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-100 text-sm mb-3">
            {currentEvent.description}
          </p>
          {currentEvent.aiGenerated && (
            <div className="bg-purple-900 bg-opacity-50 p-2 rounded text-xs">
              <span className="text-purple-300">🤖 AI Generated Event</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {currentEvent.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              className={`w-full text-left p-3 rounded border transition-all duration-200 hover:bg-opacity-20 ${
                choice.riskLevel === 'high' ? 'border-red-400 hover:bg-red-500' :
                choice.riskLevel === 'medium' ? 'border-yellow-400 hover:bg-yellow-500' :
                'border-green-400 hover:bg-green-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{choice.text}</p>
                  <p className="text-gray-300 text-xs mt-1">{choice.consequence}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  choice.riskLevel === 'high' ? 'bg-red-600 text-white' :
                  choice.riskLevel === 'medium' ? 'bg-yellow-600 text-black' :
                  'bg-green-600 text-white'
                }`}>
                  {choice.riskLevel.toUpperCase()}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs">
            Auto-selects safest option when time expires
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIEventSystem;