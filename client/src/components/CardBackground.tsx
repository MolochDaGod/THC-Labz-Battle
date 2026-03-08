import React from 'react';

interface CardBackgroundProps {
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  children: React.ReactNode;
  className?: string;
}

const rarityStyles = {
  common: {
    background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    border: '#6b7280',
    glow: '0 0 10px rgba(107, 114, 128, 0.3)'
  },
  uncommon: {
    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    border: '#10b981',
    glow: '0 0 15px rgba(16, 185, 129, 0.4)'
  },
  rare: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    border: '#3b82f6',
    glow: '0 0 20px rgba(59, 130, 246, 0.5)'
  },
  epic: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    border: '#8b5cf6',
    glow: '0 0 25px rgba(139, 92, 246, 0.6)'
  },
  legendary: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    border: '#f59e0b',
    glow: '0 0 30px rgba(245, 158, 11, 0.8)'
  }
};

export const CardBackground: React.FC<CardBackgroundProps> = ({ 
  rarity, 
  children, 
  className = "" 
}) => {
  const style = rarityStyles[rarity];
  
  return (
    <div 
      className={`
        relative w-56 h-80 rounded-lg overflow-hidden
        border-2 transform transition-all duration-300
        hover:scale-105 hover:shadow-lg
        ${className}
      `}
      style={{
        background: style.background,
        borderColor: style.border,
        boxShadow: style.glow
      }}
    >
      {/* Inner card content area */}
      <div className="relative w-full h-full bg-black/10 backdrop-blur-sm">
        {/* Top rarity indicator */}
        <div 
          className="absolute top-1 left-1 right-1 h-1 rounded-full opacity-80"
          style={{ backgroundColor: style.border }}
        />
        
        {/* Card content */}
        <div className="p-2 h-full flex flex-col">
          {children}
        </div>
        
        {/* Bottom rarity indicator */}
        <div 
          className="absolute bottom-1 left-1 right-1 h-1 rounded-full opacity-80"
          style={{ backgroundColor: style.border }}
        />
      </div>
      
      {/* Corner decorations */}
      <div 
        className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 rounded-tl-lg"
        style={{ borderColor: style.border }}
      />
      <div 
        className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 rounded-tr-lg"
        style={{ borderColor: style.border }}
      />
      <div 
        className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 rounded-bl-lg"
        style={{ borderColor: style.border }}
      />
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 rounded-br-lg"
        style={{ borderColor: style.border }}
      />
    </div>
  );
};