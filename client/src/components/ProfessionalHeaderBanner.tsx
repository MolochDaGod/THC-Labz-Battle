import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface ProfessionalHeaderBannerProps {
  gameDay: number;
  currentCity: string;
  heatLevel: number;
}

interface DayPhase {
  name: string;
  gameHour: number;
  gradient: string;
  sunPosition: string;
  sunOpacity: number;
  moonPosition: string;
  moonOpacity: number;
  starsOpacity: number;
  cloudsOpacity: number;
}

const ProfessionalHeaderBanner: React.FC<ProfessionalHeaderBannerProps> = ({
  gameDay,
  currentCity,
  heatLevel
}) => {
  const [currentPhase, setCurrentPhase] = useState<DayPhase>({
    name: 'Midday',
    gameHour: 12,
    gradient: 'from-blue-400 via-blue-300 to-blue-100',
    sunPosition: 'left-1/2',
    sunOpacity: 1,
    moonPosition: 'left-full',
    moonOpacity: 0,
    starsOpacity: 0,
    cloudsOpacity: 0.8
  });

  const bannerRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement[]>([]);
  const starsRef = useRef<HTMLDivElement[]>([]);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);

  const phases: DayPhase[] = [
    {
      name: 'Early Dawn',
      gameHour: 5,
      gradient: 'from-indigo-900 via-purple-800 to-pink-600',
      sunPosition: '-left-10',
      sunOpacity: 0,
      moonPosition: 'left-4/5',
      moonOpacity: 0.8,
      starsOpacity: 0.6,
      cloudsOpacity: 0.3
    },
    {
      name: 'Sunrise',
      gameHour: 6,
      gradient: 'from-orange-400 via-pink-400 to-purple-500',
      sunPosition: 'left-1/12',
      sunOpacity: 0.8,
      moonPosition: 'left-11/12',
      moonOpacity: 0.4,
      starsOpacity: 0.2,
      cloudsOpacity: 0.6
    },
    {
      name: 'Morning',
      gameHour: 8,
      gradient: 'from-blue-300 via-blue-200 to-yellow-100',
      sunPosition: 'left-1/4',
      sunOpacity: 1,
      moonPosition: 'left-full',
      moonOpacity: 0,
      starsOpacity: 0,
      cloudsOpacity: 0.8
    },
    {
      name: 'Midday',
      gameHour: 12,
      gradient: 'from-blue-400 via-blue-300 to-blue-100',
      sunPosition: 'left-1/2',
      sunOpacity: 1,
      moonPosition: 'left-full',
      moonOpacity: 0,
      starsOpacity: 0,
      cloudsOpacity: 0.9
    },
    {
      name: 'Afternoon',
      gameHour: 15,
      gradient: 'from-blue-400 via-yellow-300 to-orange-200',
      sunPosition: 'left-3/4',
      sunOpacity: 1,
      moonPosition: '-left-10',
      moonOpacity: 0,
      starsOpacity: 0,
      cloudsOpacity: 0.7
    },
    {
      name: 'Golden Hour',
      gameHour: 17,
      gradient: 'from-orange-400 via-yellow-400 to-pink-300',
      sunPosition: 'left-5/6',
      sunOpacity: 0.9,
      moonPosition: 'left-1/12',
      moonOpacity: 0.1,
      starsOpacity: 0,
      cloudsOpacity: 0.6
    },
    {
      name: 'Sunset',
      gameHour: 18,
      gradient: 'from-red-500 via-orange-500 to-purple-600',
      sunPosition: 'left-11/12',
      sunOpacity: 0.7,
      moonPosition: 'left-1/3',
      moonOpacity: 0.5,
      starsOpacity: 0.3,
      cloudsOpacity: 0.5
    },
    {
      name: 'Dusk',
      gameHour: 19,
      gradient: 'from-purple-700 via-indigo-800 to-gray-900',
      sunPosition: 'left-full',
      sunOpacity: 0.2,
      moonPosition: 'left-1/2',
      moonOpacity: 0.8,
      starsOpacity: 0.6,
      cloudsOpacity: 0.4
    },
    {
      name: 'Early Night',
      gameHour: 21,
      gradient: 'from-gray-900 via-indigo-900 to-black',
      sunPosition: 'left-full',
      sunOpacity: 0,
      moonPosition: 'left-3/4',
      moonOpacity: 1,
      starsOpacity: 0.8,
      cloudsOpacity: 0.3
    },
    {
      name: 'Midnight',
      gameHour: 0,
      gradient: 'from-black via-gray-900 to-indigo-900',
      sunPosition: 'left-1/2',
      sunOpacity: 0,
      moonPosition: 'left-1/2',
      moonOpacity: 1,
      starsOpacity: 1,
      cloudsOpacity: 0.2
    },
    {
      name: 'Late Night',
      gameHour: 2,
      gradient: 'from-indigo-900 via-gray-900 to-black',
      sunPosition: '-left-5',
      sunOpacity: 0,
      moonPosition: 'left-1/3',
      moonOpacity: 0.9,
      starsOpacity: 0.9,
      cloudsOpacity: 0.3
    },
    {
      name: 'Pre Dawn',
      gameHour: 4,
      gradient: 'from-gray-900 via-indigo-800 to-purple-700',
      sunPosition: '-left-8',
      sunOpacity: 0,
      moonPosition: 'left-1/4',
      moonOpacity: 0.7,
      starsOpacity: 0.7,
      cloudsOpacity: 0.4
    }
  ];

  // Calculate current phase based on game time
  const calculatePhase = () => {
    const currentHour = new Date().getHours();
    const closestPhase = phases.reduce((prev, curr) => {
      return Math.abs(curr.gameHour - currentHour) < Math.abs(prev.gameHour - currentHour) ? curr : prev;
    });
    setCurrentPhase(closestPhase);
  };

  // Smooth animations with GSAP
  useEffect(() => {
    calculatePhase();
    const interval = setInterval(calculatePhase, 120000); // Update every 2 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!bannerRef.current) return;

    // Animate sky gradient transition
    gsap.to(bannerRef.current, {
      duration: 2,
      ease: "power2.inOut"
    });

    // Animate sun position
    if (sunRef.current) {
      gsap.to(sunRef.current, {
        duration: 2,
        opacity: currentPhase.sunOpacity,
        ease: "power2.inOut"
      });
    }

    // Animate moon position
    if (moonRef.current) {
      gsap.to(moonRef.current, {
        duration: 2,
        opacity: currentPhase.moonOpacity,
        ease: "power2.inOut"
      });
    }

    // Animate stars
    starsRef.current.forEach((star, index) => {
      if (star) {
        gsap.to(star, {
          duration: 2,
          opacity: currentPhase.starsOpacity,
          delay: index * 0.1,
          ease: "power2.inOut"
        });
      }
    });

    // Animate clouds
    cloudsRef.current.forEach((cloud, index) => {
      if (cloud) {
        gsap.to(cloud, {
          duration: 3,
          x: `${10 + Math.sin(Date.now() / 10000 + index) * 20}px`,
          opacity: currentPhase.cloudsOpacity,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    });

  }, [currentPhase]);

  // Generate stars
  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 20; i++) {
      const left = 10 + Math.random() * 80;
      const top = 20 + Math.random() * 40;
      const delay = Math.random() * 3;
      
      stars.push(
        <div
          key={`star-${i}`}
          ref={el => starsRef.current[i] = el!}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${delay}s`,
            opacity: currentPhase.starsOpacity
          }}
        />
      );
    }
    return stars;
  };

  // Generate clouds
  const generateClouds = () => {
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      const left = 15 + i * 20;
      const top = 25 + Math.random() * 20;
      
      clouds.push(
        <div
          key={`cloud-${i}`}
          ref={el => cloudsRef.current[i] = el!}
          className="absolute bg-white bg-opacity-60 rounded-full"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: '80px',
            height: '30px',
            opacity: currentPhase.cloudsOpacity
          }}
        >
          <div className="absolute -top-3 left-3 w-6 h-6 bg-white bg-opacity-60 rounded-full" />
          <div className="absolute -top-4 right-3 w-8 h-8 bg-white bg-opacity-60 rounded-full" />
        </div>
      );
    }
    return clouds;
  };

  return (
    <div 
      ref={bannerRef}
      className="absolute top-0 left-0 w-full overflow-hidden transition-all duration-[2s] ease-in-out"
      style={{ 
        height: 'calc(100vh * 0.25)', // 25vh equivalent
        zIndex: -5,
        pointerEvents: 'none'
      }}
    >
      {/* Sky Gradient Background - More transparent */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b ${currentPhase.gradient} transition-all duration-[2s] ease-in-out opacity-70`}
      />

      {/* Sun */}
      <div 
        ref={sunRef}
        className={`absolute top-8 w-16 h-16 bg-gradient-radial from-yellow-300 to-orange-400 rounded-full shadow-lg transition-all duration-[2s] ease-in-out ${currentPhase.sunPosition}`}
        style={{ 
          opacity: currentPhase.sunOpacity,
          boxShadow: '0 0 40px rgba(255, 235, 59, 0.6)'
        }}
      >
        <div className="absolute inset-2 bg-gradient-radial from-yellow-200 to-yellow-400 rounded-full animate-pulse" />
      </div>

      {/* Moon */}
      <div 
        ref={moonRef}
        className={`absolute top-12 w-12 h-12 bg-gradient-radial from-gray-200 to-gray-400 rounded-full shadow-md transition-all duration-[2s] ease-in-out ${currentPhase.moonPosition}`}
        style={{ 
          opacity: currentPhase.moonOpacity,
          boxShadow: '0 0 25px rgba(245, 245, 220, 0.4)'
        }}
      >
        <div className="absolute top-2 left-2 w-2 h-2 bg-gray-500 rounded-full opacity-40" />
        <div className="absolute top-6 left-8 w-1 h-1 bg-gray-500 rounded-full opacity-30" />
      </div>

      {/* Stars */}
      {generateStars()}

      {/* Clouds */}
      {generateClouds()}

      {/* Ground/Horizon Line */}
      <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-green-800 via-green-700 to-transparent opacity-80" />

      {/* Game Info Overlay - Moved up 5 points with black text outlines */}
      <div className="absolute bottom-9 left-4 text-sm font-medium bg-white bg-opacity-80 px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-300">
        <div className="flex items-center gap-3">
          <span className="text-yellow-600 font-bold" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>Day {gameDay}</span>
          <span className="text-black font-bold" style={{ textShadow: '1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white' }}>{currentPhase.name}</span>
          <span className="text-green-600 font-bold capitalize" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>{currentCity}</span>
          {heatLevel > 0 && (
            <span className="text-red-600 font-bold" style={{ textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black' }}>Heat: {heatLevel}</span>
          )}
        </div>
      </div>

      {/* Professional Gradient Overlay for smooth transition to tabs */}
      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-black via-gray-900 to-transparent opacity-40" />
    </div>
  );
};

export default ProfessionalHeaderBanner;