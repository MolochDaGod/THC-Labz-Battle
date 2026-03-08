/**
 * Embedded AI Chat Component
 * Compact chat interface for Command Center integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  gameAdvice?: string;
}

interface EmbeddedAIChatProps {
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

export function EmbeddedAIChat({ 
  walletAddress, 
  gameState, 
  drugs 
}: EmbeddedAIChatProps) {
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
    if (walletAddress) {
      loadAssistantInfo();
      loadConversationHistory();
    }
  }, [walletAddress]);

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
      const response = await fetch(`/api/ai-assistant/history/${walletAddress}?limit=10`);
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

  return (
    <div className="h-80 flex flex-col bg-gray-900 rounded-lg">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-gray-400 text-sm">
              Start a conversation with The Plug AI!
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Ask about strategies, market analysis, or game advice
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex items-start gap-2 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <Bot className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            )}
            <div
              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100 border border-blue-400/20'
              }`}
            >
              <div>{msg.message}</div>
              <div className={`text-xs mt-1 ${
                msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <User className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-2">
            <Bot className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
            <div className="bg-gray-700 border border-blue-400/20 p-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-xs text-gray-400 ml-2">The Plug is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask The Plug AI..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          Press Enter to send • The Plug AI provides strategic guidance
        </div>
      </div>
    </div>
  );
}