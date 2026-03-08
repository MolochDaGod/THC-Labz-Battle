/**
 * OpenAI Event Listener Component for THC Dope Budz
 * Handles real-time AI assistant events and notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { Bot, Zap, MessageCircle, TrendingUp } from 'lucide-react';

interface AIEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface OpenAIEventListenerProps {
  onAIInfluence?: () => void;
  onGameAdvice?: (advice: { type: string; messageId: string }) => void;
  onNotification?: (message: string) => void;
}

export default function OpenAIEventListener({ 
  onAIInfluence, 
  onGameAdvice, 
  onNotification 
}: OpenAIEventListenerProps) {
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [isListening, setIsListening] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  /**
   * Poll for new AI events
   */
  const pollForEvents = useCallback(async () => {
    if (!isListening) return;

    try {
      const response = await fetch(`/api/openai/events?since=${lastEventTime}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.events.length > 0) {
          setEvents(prev => [...prev, ...data.events].slice(-20)); // Keep last 20 events
          setLastEventTime(data.currentTime);
          
          // Process new events
          data.events.forEach((event: AIEvent) => {
            handleAIEvent(event);
          });
        }
      }
    } catch (error) {
      console.error('Failed to poll AI events:', error);
    }
  }, [lastEventTime, isListening]);

  /**
   * Handle specific AI event types
   */
  const handleAIEvent = useCallback((event: AIEvent) => {
    console.log(`🤖 AI Event received: ${event.type}`, event.data);

    switch (event.type) {
      case 'ai_message_completed':
        setNotificationCount(prev => prev + 1);
        onNotification?.('The Plug has new advice for you!');
        break;

      case 'ai_run_completed':
        if (event.data.shouldTriggerInfluence) {
          onAIInfluence?.();
          onNotification?.('AI analysis complete - bonuses applied!');
        }
        break;

      case 'game_advice_received':
        onGameAdvice?.(event.data);
        
        // Show specific advice notifications
        const adviceMessages = {
          heatWarning: 'The Plug warns about heat levels!',
          priceAlert: 'The Plug spotted price opportunities!',
          strategyTip: 'The Plug shared strategy insights!',
          locationAdvice: 'The Plug recommends city changes!'
        };
        
        const message = adviceMessages[event.data.type] || 'The Plug provided game advice!';
        onNotification?.(message);
        break;

      case 'ai_run_failed':
        console.error('AI run failed:', event.data.error);
        break;

      default:
        console.log(`Unhandled AI event: ${event.type}`);
    }
  }, [onAIInfluence, onGameAdvice, onNotification]);

  /**
   * Clear notification count
   */
  const clearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  /**
   * Toggle event listening
   */
  const toggleListening = useCallback(() => {
    setIsListening(prev => !prev);
  }, []);

  // Setup polling interval
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(pollForEvents, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [pollForEvents, isListening]);

  // Initial poll
  useEffect(() => {
    pollForEvents();
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* AI Event Status Indicator */}
      <div className="flex items-center gap-2 bg-gray-900 border border-green-400 rounded-lg p-2 shadow-lg">
        <Bot 
          className={`w-5 h-5 ${isListening ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} 
        />
        <span className="text-xs text-green-400">
          AI {isListening ? 'Active' : 'Paused'}
        </span>
        
        {/* Notification Badge */}
        {notificationCount > 0 && (
          <div 
            className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer animate-pulse"
            onClick={clearNotifications}
            title="New AI notifications - click to clear"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </div>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={toggleListening}
          className="text-green-400 hover:text-green-300 transition-colors"
          title={isListening ? 'Pause AI events' : 'Resume AI events'}
        >
          {isListening ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4 opacity-50" />}
        </button>
      </div>

      {/* Recent Events Debug Panel (hidden in production) */}
      {process.env.NODE_ENV === 'development' && events.length > 0 && (
        <div className="mt-2 bg-gray-900 border border-green-400 rounded-lg p-3 max-w-sm">
          <h3 className="text-green-400 text-sm font-bold mb-2 flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            Recent AI Events
          </h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.slice(-5).map((event, index) => (
              <div key={index} className="text-xs text-gray-400 border-l-2 border-green-400 pl-2">
                <div className="font-semibold">{event.type}</div>
                <div className="text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for AI event integration
 */
export function useOpenAIEvents() {
  const [hasNewAdvice, setHasNewAdvice] = useState(false);
  const [lastAdviceType, setLastAdviceType] = useState<string | null>(null);

  const handleAIInfluence = useCallback(() => {
    // Trigger AI influence system
    console.log('🎯 AI influence triggered via webhook');
    
    // Could trigger game state updates here
    window.dispatchEvent(new CustomEvent('aiInfluenceTriggered', {
      detail: { source: 'webhook', timestamp: Date.now() }
    }));
  }, []);

  const handleGameAdvice = useCallback((advice: { type: string; messageId: string }) => {
    setHasNewAdvice(true);
    setLastAdviceType(advice.type);
    
    // Auto-clear after 5 seconds
    setTimeout(() => {
      setHasNewAdvice(false);
      setLastAdviceType(null);
    }, 5000);
  }, []);

  const handleNotification = useCallback((message: string) => {
    // Could integrate with toast system or other UI notifications
    console.log('📢 AI Notification:', message);
  }, []);

  return {
    hasNewAdvice,
    lastAdviceType,
    handleAIInfluence,
    handleGameAdvice,
    handleNotification
  };
}