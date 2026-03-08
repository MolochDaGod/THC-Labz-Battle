/**
 * Local AI Assistant Component
 * Database-stored conversational AI assistant for gameplay guidance
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, X, Sparkles, Brain, Zap } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  gameAdvice?: string;
}

interface LocalAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  gameState: {
    money: number;
    debt: number;
    health: number;
    day: number;
    currentCity: string;
    reputation: number;
    inventory: Record<string, number>;
    lastEvent?: string;
  };
  drugs: Array<{
    name: string;
    price: number;
    userQuantity: number;
  }>;
}

export function LocalAIAssistant({ 
  isOpen, 
  onClose, 
  walletAddress, 
  gameState, 
  drugs 
}: LocalAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadAssistantInfo();
      loadConversationHistory();
    }
  }, [isOpen, walletAddress]);

  const loadAssistantInfo = async () => {
    try {
      const response = await fetch(`/api/ai-assistant/info/${walletAddress}`);
      const data = await response.json();
      
      if (data.success && data.assistant) {
        setAssistantInfo(data.assistant);
        console.log('🤖 Loaded AI assistant:', data.assistant.name);
      }
    } catch (error) {
      console.error('❌ Failed to load assistant info:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/ai-assistant/history/${walletAddress}?limit=20`);
      const data = await response.json();
      
      if (data.success && data.history) {
        const formattedHistory = data.history.map((msg: any) => ({
          role: msg.role,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
        }));
        
        setMessages(formattedHistory);
        console.log(`💬 Loaded ${data.history.length} conversation messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      role: 'user',
      message: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          message: userMessage,
          gameState,
          nftData: assistantInfo?.nftName ? {
            mintAddress: assistantInfo.nftMintAddress,
            name: assistantInfo.nftName,
            rarity: assistantInfo.nftRarity,
          } : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          message: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions,
          gameAdvice: data.gameAdvice,
        };
        setMessages(prev => [...prev, aiMessage]);
        console.log('🤖 AI response received:', data.response.slice(0, 100));
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Add fallback response
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        message: "Yo, I'm having some technical issues right now. Give me a moment to get back on track!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const startConversation = () => {
    const welcomeMessage = `Hey! I'm here to help you with THC Dope Warz. I'm on Day ${gameState.day} in ${gameState.currentCity} with $${gameState.money.toLocaleString()}. What should I focus on?`;
    setInputMessage(welcomeMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-green-400 w-full max-w-4xl h-[90vh] flex flex-col rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-green-400 bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-8 h-8 text-green-400" />
                {assistantInfo?.nftRarity && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                    assistantInfo.nftRarity === 'legendary' ? 'bg-yellow-400' :
                    assistantInfo.nftRarity === 'epic' ? 'bg-purple-400' :
                    assistantInfo.nftRarity === 'rare' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
                  {assistantInfo?.name || 'AI Assistant'}
                </h2>
                <p className="text-sm text-gray-400">
                  {assistantInfo?.nftName ? `${assistantInfo.nftName} Advisor` : 'Your Cannabis Trading Guide'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 text-2xl font-bold"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Game Context Bar */}
        <div className="p-3 bg-gray-800 border-b border-gray-600">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-green-400">Day {gameState.day}/45</span>
            <span className="text-blue-400">{gameState.currentCity}</span>
            <span className="text-yellow-400">${gameState.money.toLocaleString()}</span>
            <span className="text-red-400">Debt: ${gameState.debt.toLocaleString()}</span>
            <span className="text-purple-400">Health: {gameState.health}%</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-400 mb-2">Ready to Chat!</h3>
              <p className="text-gray-400 mb-4">Ask me about trading strategies, city recommendations, or game mechanics.</p>
              <button
                onClick={startConversation}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Start Conversation
              </button>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <Bot className="w-8 h-8 text-green-400 bg-gray-800 p-1 rounded-full" />
                  </div>
                )}
                
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                  <div className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-green-300 border border-green-500'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-400 font-semibold">Suggestions:</p>
                        {msg.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => useSuggestion(suggestion)}
                            className="block w-full text-left text-xs bg-gray-700 hover:bg-gray-600 p-2 rounded border border-gray-600 transition-colors"
                          >
                            <Zap className="w-3 h-3 inline mr-1" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.gameAdvice && (
                      <div className="mt-3 p-2 bg-yellow-900 border border-yellow-600 rounded text-yellow-200">
                        <p className="text-xs font-semibold flex items-center">
                          <Brain className="w-3 h-3 mr-1" />
                          Strategic Advice:
                        </p>
                        <p className="text-xs mt-1">{msg.gameAdvice}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 order-2">
                    <User className="w-8 h-8 text-blue-400 bg-gray-800 p-1 rounded-full" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Bot className="w-8 h-8 text-green-400 bg-gray-800 p-1 rounded-full" />
              <div className="bg-gray-800 border border-green-500 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-green-400 bg-gray-800">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about trading strategies, best cities to visit, or any game mechanics..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {assistantInfo && (
              <span className="text-green-400">
                {assistantInfo.personality === 'nft-based' ? 
                  `${assistantInfo.nftRarity} AI` : 
                  'Grench AI'
                } • Temp: {assistantInfo.aiTemperature}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}