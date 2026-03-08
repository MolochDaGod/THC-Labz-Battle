import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
  type: 'terry_prediction' | 'police_peek' | 'police_shakedown' | 'police_stop' | 'police_bust' | 'police_raid' | 'plug_reward' | 'random_buyer' | 'mission_complete' | 'special_event';
  data?: any;
  duration?: number;
}

interface AnimatedCutsceneProps {
  cutscene: CutsceneData | null;
  onClose: () => void;
  onAction?: (action: string, data?: any) => void;
}

const CHARACTERS: Record<string, CutsceneCharacter> = {
  terry: {
    id: 'terry',
    name: 'Terry',
    image: '/attached_assets/1985ce84fdc5c_1753905458779.png',
    title: 'Market Prediction Expert',  
    backgroundColor: 'from-orange-900 to-yellow-900',
    textColor: 'text-orange-100'
  },
  cop: {
    id: 'cop',
    name: 'Officer Johnson',
    image: '/api/placeholder/150/150', // Placeholder for cop character
    title: 'Police Department',
    backgroundColor: 'from-blue-900 to-red-900',
    textColor: 'text-blue-100'
  },
  plug: {
    id: 'plug',
    name: 'The Plug',
    image: '', // Will use selected NFT image
    title: 'Your AI Assistant',
    backgroundColor: 'from-purple-900 to-pink-900',
    textColor: 'text-purple-100'
  },
  buyer: {
    id: 'buyer',
    name: 'Street Buyer',
    image: '/api/placeholder/150/150', // Placeholder for buyer character
    title: 'Potential Customer',
    backgroundColor: 'from-green-900 to-emerald-900',
    textColor: 'text-green-100'
  }
};

export const AnimatedCutscene: React.FC<AnimatedCutsceneProps> = ({
  cutscene,
  onClose,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (cutscene) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Start animation sequence
      setTimeout(() => {
        setShowContent(true);
      }, 500);

      // Auto-close after duration (default 8 seconds)
      const duration = cutscene.duration || 8000;
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(autoCloseTimer);
    }
  }, [cutscene]);

  const handleClose = () => {
    setShowContent(false);
    setIsAnimating(false);
    
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 500);
  };

  const handleAction = (action: string, data?: any) => {
    if (onAction) {
      onAction(action, data);
    }
    handleClose();
  };

  if (!cutscene || !isVisible) return null;

  const character = CHARACTERS[cutscene.character.id] || cutscene.character;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Background overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          showContent ? 'bg-opacity-70' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Animated cutscene container */}
      <div 
        className={`absolute bottom-0 left-0 right-0 transform transition-all duration-700 ease-out ${
          isAnimating 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0'
        }`}
      >
        {/* Character and content panel */}
        <div className={`bg-gradient-to-r ${character.backgroundColor} border-t-4 border-yellow-400 shadow-2xl`}>
          <div className="flex items-start p-6 max-w-6xl mx-auto">
            {/* Character image */}
            <div className="flex-shrink-0 mr-6">
              <div className="relative">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-32 h-32 object-contain rounded-full border-4 border-yellow-400 bg-black bg-opacity-30"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }}
                />
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                  {character.name}
                </div>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-[120px]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-2xl font-bold ${character.textColor}`} style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
                    {cutscene.title}
                  </h3>
                  <p className="text-yellow-300 text-sm">{character.title}</p>
                </div>
                
                <button
                  onClick={handleClose}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`${character.textColor} text-lg leading-relaxed mb-4`}>
                {cutscene.message}
              </div>

              {/* Terry's Enhanced Market Intelligence Display */}
              {cutscene.type === 'terry_prediction' && cutscene.data && (
                <div className="bg-black bg-opacity-40 rounded-lg p-4 border border-yellow-400">
                  <h4 className="text-yellow-400 font-bold mb-3 text-center">🐕📈 TERRY'S MARKET INTELLIGENCE - NEXT 2-4 DAYS</h4>
                  <div className="space-y-3">
                    {cutscene.data.predictions?.map((prediction: any, index: number) => (
                      <div key={index} className="bg-gray-900 bg-opacity-60 rounded-lg p-3 border border-gray-600">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-white font-bold text-lg">{prediction.product}</div>
                          <div className={`text-xl font-bold px-2 py-1 rounded ${
                            prediction.change > 0 
                              ? 'text-green-400 bg-green-900 bg-opacity-30' 
                              : 'text-red-400 bg-red-900 bg-opacity-30'
                          }`}>
                            {prediction.change > 0 ? '📈 +' : '📉 '}{Math.abs(prediction.change)}%
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-300 mb-1">
                          <strong>Target Day:</strong> Day {prediction.targetDay} 
                          {prediction.cityHint && (
                            <span className="ml-2">
                              <strong>Location Intel:</strong> <span className="text-yellow-300">{prediction.cityHint}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-blue-300">
                            {prediction.confidence}% confidence
                          </div>
                          <div className={`text-xs font-bold ${
                            prediction.isPriceIncrease ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {prediction.isPriceIncrease ? '🚀 BUY NOW!' : '💰 SELL BEFORE CRASH!'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <button
                      onClick={() => handleAction('view_predictions', cutscene.data)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold"
                    >
                      📊 View Full Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Police Peek/Surveillance Events */}
              {cutscene.type === 'police_peek' && cutscene.data && (
                <div className="bg-yellow-900 bg-opacity-60 rounded-lg p-4 border border-yellow-400">
                  <h4 className="text-yellow-400 font-bold mb-2 text-center">👁️ UNDER SURVEILLANCE</h4>
                  <p className="text-center text-yellow-200 mb-3">
                    Heat Level: {cutscene.data.heatLevel}/5 - Risk: {cutscene.data.riskLevel}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction('act_natural', cutscene.data)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      😇 Act Natural
                    </button>
                    <button
                      onClick={() => handleAction('leave_quickly', cutscene.data)}
                      className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      🏃 Leave Area ($50)
                    </button>
                  </div>
                </div>
              )}

              {/* Police Shakedown/Corrupt Cop Events */}
              {cutscene.type === 'police_shakedown' && cutscene.data && (
                <div className="bg-orange-900 bg-opacity-60 rounded-lg p-4 border border-orange-400">
                  <h4 className="text-orange-400 font-bold mb-2 text-center">💰 CROOKED COP ENCOUNTER</h4>
                  <p className="text-center text-orange-200 mb-3">
                    Heat Level: {cutscene.data.heatLevel}/5 - Bribe Cost: ${cutscene.data.bribeCost}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction('pay_bribe', cutscene.data)}
                      className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      💰 Pay Bribe (${cutscene.data.bribeCost})
                    </button>
                    <button
                      onClick={() => handleAction('refuse_bribe', cutscene.data)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      ❌ Refuse & Risk It
                    </button>
                    <button
                      onClick={() => handleAction('intimidate_cop', cutscene.data)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      😠 Try to Intimidate
                    </button>
                  </div>
                </div>
              )}

              {/* Police Stop/Search Events */}
              {cutscene.type === 'police_stop' && cutscene.data && (
                <div className="bg-blue-900 bg-opacity-60 rounded-lg p-4 border border-blue-400">
                  <h4 className="text-blue-400 font-bold mb-2 text-center">🚔 POLICE STOP</h4>
                  <p className="text-center text-blue-200 mb-3">
                    Heat Level: {cutscene.data.heatLevel}/5 - Search Risk: {cutscene.data.searchRisk > 0 ? 'HIGH' : 'LOW'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction('cooperate_search', cutscene.data)}
                      className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      🤝 Cooperate Fully
                    </button>
                    <button
                      onClick={() => handleAction('refuse_search', cutscene.data)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      📋 Assert Rights
                    </button>
                    <button
                      onClick={() => handleAction('flee_scene', cutscene.data)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      🏃 Attempt Escape
                    </button>
                  </div>
                </div>
              )}

              {/* Major Police Bust Events */}
              {cutscene.type === 'police_bust' && cutscene.data && (
                <div className="bg-red-900 bg-opacity-60 rounded-lg p-4 border border-red-400">
                  <h4 className="text-red-400 font-bold mb-2 text-center">🚨 MAJOR POLICE BUST</h4>
                  <p className="text-center text-red-200 mb-3">
                    Heat Level: {cutscene.data.heatLevel}/5 - Risk: {cutscene.data.riskLevel}
                  </p>
                  <p className="text-center text-red-300 text-sm mb-3">
                    All three officers: {cutscene.data.officers?.join(', ')}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction('try_escape', cutscene.data)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      🏃 Try to Escape
                    </button>
                    <button
                      onClick={() => handleAction('surrender_peacefully', cutscene.data)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      🤲 Surrender (2 days jail)
                    </button>
                    <button
                      onClick={() => handleAction('massive_bribe', cutscene.data)}
                      className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      💰 Massive Bribe ($2000)
                    </button>
                  </div>
                </div>
              )}

              {/* SWAT Property Raid Events */}
              {cutscene.type === 'police_raid' && cutscene.data && (
                <div className="bg-black bg-opacity-80 rounded-lg p-4 border border-red-500">
                  <h4 className="text-red-500 font-bold mb-2 text-center">🏠 SWAT PROPERTY RAID</h4>
                  <p className="text-center text-red-200 mb-3">
                    Heat Level: {cutscene.data.heatLevel}/5 - Risk: {cutscene.data.riskLevel}
                  </p>
                  <p className="text-center text-red-300 text-sm mb-3">
                    Led by: {cutscene.data.officers?.[0]} with full tactical team
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction('hide_evidence', cutscene.data)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      📦 Hide Evidence ($200)
                    </button>
                    <button
                      onClick={() => handleAction('cooperate_fully', cutscene.data)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      🤝 Cooperate Fully
                    </button>
                    <button
                      onClick={() => handleAction('resist_arrest', cutscene.data)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-bold text-sm"
                    >
                      ⚔️ Resist Arrest
                    </button>
                  </div>
                </div>
              )}

              {cutscene.type === 'plug_reward' && cutscene.data && (
                <div className="bg-purple-900 bg-opacity-60 rounded-lg p-4 border border-purple-400">
                  <h4 className="text-purple-400 font-bold mb-2 text-center">🎁 PLUG BONUS REWARD</h4>
                  <p className="text-center text-purple-200 mb-3">
                    Reward: ${cutscene.data.amount} • Reason: {cutscene.data.reason}
                  </p>
                  <div className="text-center">
                    <button
                      onClick={() => handleAction('claim_reward', cutscene.data)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold"
                    >
                      💎 Claim Reward
                    </button>
                  </div>
                </div>
              )}

              {cutscene.type === 'random_buyer' && cutscene.data && (
                <div className="bg-green-900 bg-opacity-60 rounded-lg p-4 border border-green-400">
                  <h4 className="text-green-400 font-bold mb-2 text-center">🤝 SPECIAL BUYER OFFER</h4>
                  <p className="text-center text-green-200 mb-3">
                    Wants: {cutscene.data.product} • Offering: ${cutscene.data.price} each
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAction('accept_deal', cutscene.data)}
                      className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      ✅ Accept Deal
                    </button>
                    <button
                      onClick={() => handleAction('negotiate', cutscene.data)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded font-bold text-sm"
                    >
                      💬 Negotiate
                    </button>
                  </div>
                </div>
              )}

              {cutscene.type === 'mission_complete' && cutscene.data && (
                <div className="bg-blue-900 bg-opacity-60 rounded-lg p-4 border border-blue-400">
                  <h4 className="text-blue-400 font-bold mb-2 text-center">✅ MISSION COMPLETED</h4>
                  <p className="text-center text-blue-200 mb-3">
                    Mission: {cutscene.data.missionName} • Reward: ${cutscene.data.reward}
                  </p>
                  <div className="text-center">
                    <button
                      onClick={() => handleAction('collect_mission_reward', cutscene.data)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
                    >
                      💰 Collect Reward
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick dismiss hint */}
      <div className="absolute bottom-2 right-4 text-white text-xs opacity-60">
        Press ESC or click background to dismiss
      </div>
    </div>
  );
};

export default AnimatedCutscene;