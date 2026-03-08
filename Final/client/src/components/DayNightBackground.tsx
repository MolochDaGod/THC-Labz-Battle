import React, { useState, useEffect, useRef } from 'react';

interface DayNightBackgroundProps {
  timeOfDay?: number; // 0-23 hours
  children?: React.ReactNode;
}

export const DayNightBackground: React.FC<DayNightBackgroundProps> = ({ 
  timeOfDay = new Date().getHours(),
  children 
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define sky phases based on time of day
  const phases = [
    {
      name: 'Early Dawn',
      timeRange: [4, 5],
      skyClass: 'from-slate-900 via-slate-700 to-orange-800',
      sunPosition: { left: '-10%', top: '220px', opacity: 0 },
      moonPosition: { left: '80%', top: '60px', opacity: 0.8 },
      starsOpacity: 0.6,
      cloudsOpacity: 0.3
    },
    {
      name: 'Sunrise',
      timeRange: [5, 7],
      skyClass: 'from-orange-400 via-orange-200 to-blue-300',
      sunPosition: { left: '5%', top: '180px', opacity: 0.8 },
      moonPosition: { left: '90%', top: '40px', opacity: 0.4 },
      starsOpacity: 0.2,
      cloudsOpacity: 0.6
    },
    {
      name: 'Morning',
      timeRange: [7, 10],
      skyClass: 'from-blue-400 via-blue-300 to-blue-100',
      sunPosition: { left: '20%', top: '120px', opacity: 1 },
      moonPosition: { left: '95%', top: '30px', opacity: 0 },
      starsOpacity: 0,
      cloudsOpacity: 0.8
    },
    {
      name: 'Midday',
      timeRange: [10, 15],
      skyClass: 'from-blue-500 via-blue-400 to-blue-200',
      sunPosition: { left: '50%', top: '30px', opacity: 1 },
      moonPosition: { left: '100%', top: '20px', opacity: 0 },
      starsOpacity: 0,
      cloudsOpacity: 0.9
    },
    {
      name: 'Afternoon',
      timeRange: [15, 17],
      skyClass: 'from-blue-400 via-orange-200 to-blue-600',
      sunPosition: { left: '70%', top: '80px', opacity: 1 },
      moonPosition: { left: '-10%', top: '50px', opacity: 0 },
      starsOpacity: 0,
      cloudsOpacity: 0.7
    },
    {
      name: 'Golden Hour',
      timeRange: [17, 18],
      skyClass: 'from-pink-400 via-purple-300 to-purple-500',
      sunPosition: { left: '85%', top: '140px', opacity: 0.9 },
      moonPosition: { left: '10%', top: '60px', opacity: 0.1 },
      starsOpacity: 0,
      cloudsOpacity: 0.6
    },
    {
      name: 'Sunset',
      timeRange: [18, 19],
      skyClass: 'from-red-500 via-orange-400 to-purple-600',
      sunPosition: { left: '95%', top: '180px', opacity: 0.7 },
      moonPosition: { left: '30%', top: '70px', opacity: 0.5 },
      starsOpacity: 0.3,
      cloudsOpacity: 0.5
    },
    {
      name: 'Dusk',
      timeRange: [19, 21],
      skyClass: 'from-slate-800 via-blue-800 to-purple-800',
      sunPosition: { left: '100%', top: '220px', opacity: 0.2 },
      moonPosition: { left: '50%', top: '60px', opacity: 0.8 },
      starsOpacity: 0.6,
      cloudsOpacity: 0.4
    },
    {
      name: 'Early Night',
      timeRange: [21, 23],
      skyClass: 'from-slate-900 via-slate-800 to-slate-700',
      sunPosition: { left: '105%', top: '250px', opacity: 0 },
      moonPosition: { left: '70%', top: '50px', opacity: 1 },
      starsOpacity: 0.8,
      cloudsOpacity: 0.3
    },
    {
      name: 'Midnight',
      timeRange: [23, 24],
      skyClass: 'from-slate-950 via-slate-900 to-slate-800',
      sunPosition: { left: '50%', top: '350px', opacity: 0 },
      moonPosition: { left: '50%', top: '40px', opacity: 1 },
      starsOpacity: 1,
      cloudsOpacity: 0.2
    },
    {
      name: 'Late Night',
      timeRange: [0, 2],
      skyClass: 'from-slate-950 via-slate-900 to-slate-800',
      sunPosition: { left: '-5%', top: '300px', opacity: 0 },
      moonPosition: { left: '30%', top: '50px', opacity: 0.9 },
      starsOpacity: 0.9,
      cloudsOpacity: 0.3
    },
    {
      name: 'Pre Dawn',
      timeRange: [2, 4],
      skyClass: 'from-slate-900 via-slate-800 to-blue-900',
      sunPosition: { left: '-8%', top: '250px', opacity: 0 },
      moonPosition: { left: '20%', top: '60px', opacity: 0.7 },
      starsOpacity: 0.7,
      cloudsOpacity: 0.4
    }
  ];

  // Find current phase based on time
  useEffect(() => {
    const getCurrentPhase = () => {
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const [start, end] = phase.timeRange;
        
        if (start <= end) {
          // Normal range (e.g., 7-10)
          if (timeOfDay >= start && timeOfDay < end) {
            return i;
          }
        } else {
          // Crossing midnight (e.g., 23-2)
          if (timeOfDay >= start || timeOfDay < end) {
            return i;
          }
        }
      }
      return 0; // Default to first phase
    };

    const newPhase = getCurrentPhase();
    if (newPhase !== currentPhase) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPhase(newPhase);
        setIsTransitioning(false);
      }, 300);
    }
  }, [timeOfDay, currentPhase, phases]);

  const currentPhaseData = phases[currentPhase] || phases[0];

  // Create stars based on current phase
  const createStars = () => {
    const stars = [];
    if (currentPhaseData.starsOpacity > 0) {
      const starPositions = [
        { left: '15%', top: '30px', size: '3px' },
        { left: '25%', top: '50px', size: '2px' },
        { left: '75%', top: '40px', size: '4px' },
        { left: '85%', top: '70px', size: '2px' },
        { left: '60%', top: '25px', size: '3px' },
        { left: '40%', top: '55px', size: '2px' },
        { left: '80%', top: '35px', size: '3px' },
        { left: '30%', top: '65px', size: '2px' },
        { left: '45%', top: '20px', size: '4px' },
        { left: '90%', top: '45px', size: '2px' }
      ];

      stars.push(...starPositions.map((star, index) => (
        <div
          key={`star-${index}`}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: currentPhaseData.starsOpacity,
            transition: 'opacity 3s ease-in-out',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
            animationDelay: `${index * 0.3}s`
          }}
        />
      )));
    }
    return stars;
  };

  // Create clouds
  const createClouds = () => {
    if (currentPhaseData.cloudsOpacity === 0) return null;

    return (
      <>
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: '80px',
            height: '30px',
            top: '60px',
            left: '20%',
            opacity: currentPhaseData.cloudsOpacity * 0.8,
            transition: 'opacity 3s ease-in-out',
          }}
        />
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: '60px',
            height: '25px',
            top: '80px',
            right: '25%',
            opacity: currentPhaseData.cloudsOpacity * 0.6,
            transition: 'opacity 3s ease-in-out',
          }}
        />
        <div
          className="absolute bg-white rounded-full"
          style={{
            width: '70px',
            height: '28px',
            top: '50px',
            left: '60%',
            opacity: currentPhaseData.cloudsOpacity * 0.7,
            transition: 'opacity 3s ease-in-out',
          }}
        />
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-gradient-to-b ${currentPhaseData.skyClass} transition-all duration-[3000ms] ease-in-out ${isTransitioning ? 'opacity-90' : 'opacity-100'}`}
      style={{ zIndex: -1 }}
    >
      {/* Stars */}
      {createStars()}
      
      {/* Sun */}
      <div
        className="absolute w-15 h-15 bg-gradient-radial from-yellow-300 to-orange-500 rounded-full transition-all duration-[3000ms] ease-in-out"
        style={{
          left: currentPhaseData.sunPosition.left,
          top: currentPhaseData.sunPosition.top,
          opacity: currentPhaseData.sunPosition.opacity,
          boxShadow: currentPhaseData.sunPosition.opacity > 0 ? '0 0 30px rgba(255, 235, 59, 0.6)' : 'none',
          width: '60px',
          height: '60px'
        }}
      />
      
      {/* Moon */}
      <div
        className="absolute w-12 h-12 bg-gradient-radial from-gray-100 to-gray-300 rounded-full transition-all duration-[3000ms] ease-in-out"
        style={{
          left: currentPhaseData.moonPosition.left,
          top: currentPhaseData.moonPosition.top,
          opacity: currentPhaseData.moonPosition.opacity,
          boxShadow: currentPhaseData.moonPosition.opacity > 0 ? '0 0 20px rgba(245, 245, 220, 0.5)' : 'none',
          width: '50px',
          height: '50px'
        }}
      />
      
      {/* Clouds */}
      {createClouds()}
      
      {/* Ground/Horizon */}
      <div className="absolute bottom-0 w-full h-20 bg-gradient-to-b from-green-800 to-green-900 opacity-80" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DayNightBackground;