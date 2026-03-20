import React from 'react';

interface CardRarityBackgroundProps {
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const CardRarityBackground: React.FC<CardRarityBackgroundProps> = ({ rarity }) => {
  const getBackgroundContent = () => {
    switch (rarity) {
      case 'legendary':
        return (
          <div className="absolute inset-0 overflow-hidden">
             <style dangerouslySetInnerHTML={{ __html: `
              @keyframes rotate-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes rotate-medium {
                from { transform: rotate(0deg); }
                to { transform: rotate(-360deg); }
              }
              @keyframes rotate-fast {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}} />
            <div className="absolute inset-0 bg-[#2a1500]" />
            <div 
              className="absolute inset-[-50%] opacity-40 animate-[rotate-slow_10s_linear_infinite]"
              style={{
                background: 'radial-gradient(circle, #5c3300 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <div 
              className="absolute inset-[-50%] opacity-30 animate-[rotate-medium_7s_linear_infinite]"
              style={{
                background: 'radial-gradient(circle, #ffd700 0%, transparent 60%)',
                filter: 'blur(15px)',
              }}
            />
            <div 
              className="absolute inset-[-50%] opacity-20 animate-[rotate-fast_5s_linear_infinite]"
              style={{
                background: 'radial-gradient(circle, #ffffff 0%, transparent 50%)',
                filter: 'blur(10px)',
              }}
            />
          </div>
        );
      case 'epic':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes pulse-glow {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.1); }
              }
            `}} />
            <div className="absolute inset-0 bg-[#1a0a2e]" />
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] to-[#3d1a6e]"
            />
            <div 
              className="absolute inset-0 opacity-60 animate-[pulse-glow_2s_ease-in-out_infinite]"
              style={{
                background: 'radial-gradient(circle at center, #8b5cf6 0%, transparent 70%)',
              }}
            />
          </div>
        );
      case 'rare':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes shimmer-sweep {
                0% { transform: translateX(-100%) skewX(-20deg); }
                100% { transform: translateX(200%) skewX(-20deg); }
              }
            `}} />
            <div className="absolute inset-0 bg-[#0a1628]" />
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#1a3a5c]"
            />
            <div 
              className="absolute inset-0 w-1/2 h-full opacity-30 animate-[shimmer-sweep_3s_linear_infinite]"
              style={{
                background: 'linear-gradient(to right, transparent, #60a5fa, transparent)',
              }}
            />
          </div>
        );
      case 'uncommon':
      case 'common':
      default:
        const isUncommon = rarity === 'uncommon';
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className={isUncommon ? "absolute inset-0 bg-[#0d210d]" : "absolute inset-0 bg-[#1a2e1a]"} />
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${isUncommon ? 'from-[#0d210d] to-[#1e3a1e]' : 'from-[#1a2e1a] to-[#2d4a2d]'}`}
            />
            {/* Subtle leaf/radial pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, #4ade80 0%, transparent 20%), 
                                  radial-gradient(circle at 80% 80%, #4ade80 0%, transparent 20%),
                                  radial-gradient(circle at 50% 50%, #22c55e 0%, transparent 40%)`,
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {getBackgroundContent()}
    </div>
  );
};

export default CardRarityBackground;
