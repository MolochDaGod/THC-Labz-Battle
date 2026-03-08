import React, { useEffect, useState } from 'react';
import { Zap, Heart, Flame, Snowflake } from 'lucide-react';

interface SpellEffectProps {
  type: 'lightning' | 'heal' | 'fire' | 'ice' | 'poison' | 'shield';
  position: { x: number; y: number };
  onComplete: () => void;
}

export const SpellEffect: React.FC<SpellEffectProps> = ({ type, position, onComplete }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const renderEffect = () => {
    switch (type) {
      case 'lightning':
        return (
          <div className={`absolute transition-all duration-1500 ${animate ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative">
              <Zap size={48} className="text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg animate-ping opacity-75"></div>
              <div className="absolute -inset-2 bg-blue-400 rounded-full blur-xl animate-pulse opacity-50"></div>
            </div>
          </div>
        );

      case 'heal':
        return (
          <div className={`absolute transition-all duration-1500 ${animate ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative">
              <Heart size={48} className="text-green-400 animate-bounce" />
              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg animate-pulse opacity-75"></div>
              {/* Healing particles */}
              <div className="absolute -top-2 -left-2 w-2 h-2 bg-green-300 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-3 w-1 h-1 bg-green-400 rounded-full animate-ping delay-200"></div>
              <div className="absolute -bottom-2 -right-1 w-2 h-2 bg-green-300 rounded-full animate-ping delay-400"></div>
              <div className="absolute -bottom-1 -left-3 w-1 h-1 bg-green-400 rounded-full animate-ping delay-600"></div>
            </div>
          </div>
        );

      case 'fire':
        return (
          <div className={`absolute transition-all duration-1500 ${animate ? 'scale-300 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative">
              <Flame size={48} className="text-red-500 animate-pulse" />
              <div className="absolute inset-0 bg-red-500 rounded-full blur-lg animate-pulse opacity-75"></div>
              <div className="absolute -inset-4 bg-orange-500 rounded-full blur-xl animate-pulse opacity-50"></div>
              {/* Fire particles */}
              <div className="absolute -top-4 left-2 w-3 h-3 bg-red-400 rounded-full animate-bounce"></div>
              <div className="absolute -top-2 right-1 w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -top-6 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-200"></div>
              <div className="absolute -top-3 -right-2 w-1 h-1 bg-red-300 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        );

      case 'ice':
        return (
          <div className={`absolute transition-all duration-1500 ${animate ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative">
              <Snowflake size={48} className="text-cyan-400 animate-spin" />
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-lg animate-pulse opacity-75"></div>
              <div className="absolute -inset-2 bg-blue-300 rounded-full blur-xl animate-pulse opacity-50"></div>
              {/* Ice crystals */}
              <div className="absolute -top-3 -left-3 w-2 h-2 bg-cyan-300 rounded transform rotate-45 animate-ping"></div>
              <div className="absolute -top-2 -right-2 w-1 h-1 bg-blue-200 rounded transform rotate-45 animate-ping delay-200"></div>
              <div className="absolute -bottom-3 -right-3 w-2 h-2 bg-cyan-300 rounded transform rotate-45 animate-ping delay-400"></div>
              <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-blue-200 rounded transform rotate-45 animate-ping delay-600"></div>
            </div>
          </div>
        );

      case 'poison':
        return (
          <div className={`absolute transition-all duration-1500 ${animate ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative">
              <div className="text-6xl">☠️</div>
              <div className="absolute inset-0 bg-green-600 rounded-full blur-lg animate-pulse opacity-75"></div>
              <div className="absolute -inset-3 bg-purple-600 rounded-full blur-xl animate-pulse opacity-50"></div>
              {/* Poison bubbles */}
              <div className="absolute -top-2 -left-2 w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
              <div className="absolute -top-4 right-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
              <div className="absolute -bottom-3 -left-1 w-1 h-1 bg-purple-300 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        );

      case 'shield':
        return (
          <div className={`absolute transition-all duration-1500 ${animate ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative">
              <div className="text-6xl">🛡️</div>
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg animate-pulse opacity-75"></div>
              <div className="absolute -inset-2 bg-white rounded-full blur-xl animate-pulse opacity-50"></div>
              {/* Shield sparkles */}
              <div className="absolute -top-3 -left-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-3 w-1 h-1 bg-blue-200 rounded-full animate-ping delay-200"></div>
              <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-white rounded-full animate-ping delay-400"></div>
              <div className="absolute -bottom-3 -left-3 w-1 h-1 bg-blue-200 rounded-full animate-ping delay-600"></div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ 
        left: position.x - 24, 
        top: position.y - 24,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {renderEffect()}
    </div>
  );
};

export default SpellEffect;