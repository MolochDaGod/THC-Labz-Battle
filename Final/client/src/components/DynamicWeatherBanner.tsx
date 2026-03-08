import React, { useState, useEffect } from 'react';

interface WeatherBannerProps {
  gameDay: number;
  currentCity: string;
  heatLevel: number;
}

interface WeatherPhase {
  name: string;
  gradient: string;
  sunOpacity: number;
  moonOpacity: number;
  starsOpacity: number;
  sunPosition: string;
  moonPosition: string;
}

const weatherPhases: Record<number, WeatherPhase> = {
  0: { // Early Dawn (00:00-02:00)
    name: 'Early Dawn',
    gradient: 'from-indigo-900 via-purple-800 to-indigo-700',
    sunOpacity: 0,
    moonOpacity: 0.8,
    starsOpacity: 0.9,
    sunPosition: 'left-[-10%]',
    moonPosition: 'right-[20%]'
  },
  1: { // Sunrise (02:00-04:00)
    name: 'Sunrise',
    gradient: 'from-orange-400 via-pink-400 to-purple-500',
    sunOpacity: 0.3,
    moonOpacity: 0.2,
    starsOpacity: 0.3,
    sunPosition: 'left-[10%]',
    moonPosition: 'right-[10%]'
  },
  2: { // Morning (04:00-06:00)
    name: 'Morning',
    gradient: 'from-blue-400 via-cyan-300 to-yellow-200',
    sunOpacity: 0.7,
    moonOpacity: 0,
    starsOpacity: 0,
    sunPosition: 'left-[25%]',
    moonPosition: 'right-[-10%]'
  },
  3: { // Midday (06:00-08:00)
    name: 'Midday',
    gradient: 'from-blue-300 via-blue-200 to-yellow-100',
    sunOpacity: 1,
    moonOpacity: 0,
    starsOpacity: 0,
    sunPosition: 'left-[45%]',
    moonPosition: 'right-[-20%]'
  },
  4: { // Afternoon (08:00-10:00)
    name: 'Afternoon',
    gradient: 'from-blue-400 via-blue-300 to-orange-200',
    sunOpacity: 0.9,
    moonOpacity: 0,
    starsOpacity: 0,
    sunPosition: 'left-[65%]',
    moonPosition: 'right-[-30%]'
  },
  5: { // Golden Hour (10:00-12:00)
    name: 'Golden Hour',
    gradient: 'from-orange-300 via-yellow-300 to-amber-200',
    sunOpacity: 0.8,
    moonOpacity: 0,
    starsOpacity: 0,
    sunPosition: 'left-[80%]',
    moonPosition: 'right-[-40%]'
  },
  6: { // Sunset (12:00-14:00)
    name: 'Sunset',
    gradient: 'from-red-400 via-orange-400 to-purple-400',
    sunOpacity: 0.5,
    moonOpacity: 0.1,
    starsOpacity: 0.2,
    sunPosition: 'left-[90%]',
    moonPosition: 'right-[-20%]'
  },
  7: { // Dusk (14:00-16:00)
    name: 'Dusk',
    gradient: 'from-purple-600 via-indigo-600 to-purple-700',
    sunOpacity: 0.2,
    moonOpacity: 0.4,
    starsOpacity: 0.5,
    sunPosition: 'left-[95%]',
    moonPosition: 'right-[-10%]'
  },
  8: { // Early Night (16:00-18:00)
    name: 'Early Night',
    gradient: 'from-indigo-800 via-purple-900 to-indigo-900',
    sunOpacity: 0,
    moonOpacity: 0.7,
    starsOpacity: 0.8,
    sunPosition: 'left-[100%]',
    moonPosition: 'right-[10%]'
  },
  9: { // Midnight (18:00-20:00)
    name: 'Midnight',
    gradient: 'from-gray-900 via-indigo-900 to-black',
    sunOpacity: 0,
    moonOpacity: 1,
    starsOpacity: 1,
    sunPosition: 'left-[100%]',
    moonPosition: 'right-[45%]'
  },
  10: { // Late Night (20:00-22:00)
    name: 'Late Night',
    gradient: 'from-indigo-900 via-purple-900 to-indigo-800',
    sunOpacity: 0,
    moonOpacity: 0.9,
    starsOpacity: 0.9,
    sunPosition: 'left-[100%]',
    moonPosition: 'right-[70%]'
  },
  11: { // Pre Dawn (22:00-00:00)
    name: 'Pre Dawn',
    gradient: 'from-purple-800 via-indigo-800 to-purple-700',
    sunOpacity: 0,
    moonOpacity: 0.6,
    starsOpacity: 0.7,
    sunPosition: 'left-[-5%]',
    moonPosition: 'right-[85%]'
  }
};

// Realistic weather patterns based on actual U.S. city climates
const cityWeatherPatterns: Record<string, { rainChance: number; snowChance: number; stormChance: number; heatWaveChance: number; minTemp: number; maxTemp: number }> = {
  'hometown': { rainChance: 0.3, snowChance: 0.2, stormChance: 0.2, heatWaveChance: 0.1, minTemp: 20, maxTemp: 80 }, // Upstate NY
  'newyork': { rainChance: 0.4, snowChance: 0.3, stormChance: 0.2, heatWaveChance: 0.2, minTemp: 25, maxTemp: 85 },
  'miami': { rainChance: 0.6, snowChance: 0, stormChance: 0.4, heatWaveChance: 0.7, minTemp: 70, maxTemp: 95 }, // Hot & humid, frequent storms
  'chicago': { rainChance: 0.4, snowChance: 0.4, stormChance: 0.3, heatWaveChance: 0.2, minTemp: 10, maxTemp: 85 }, // Cold winters, hot summers
  'detroit': { rainChance: 0.4, snowChance: 0.5, stormChance: 0.2, heatWaveChance: 0.1, minTemp: 15, maxTemp: 82 }, // Snow belt region
  'boston': { rainChance: 0.4, snowChance: 0.4, stormChance: 0.2, heatWaveChance: 0.1, minTemp: 20, maxTemp: 80 },
  'losangeles': { rainChance: 0.1, snowChance: 0, stormChance: 0.05, heatWaveChance: 0.3, minTemp: 50, maxTemp: 90 }, // Mediterranean climate
  'seattle': { rainChance: 0.7, snowChance: 0.1, stormChance: 0.1, heatWaveChance: 0.05, minTemp: 35, maxTemp: 75 }, // Rainy Pacific Northwest
  'phoenix': { rainChance: 0.05, snowChance: 0, stormChance: 0.2, heatWaveChance: 0.8, minTemp: 40, maxTemp: 115 }, // Desert heat
  'denver': { rainChance: 0.2, snowChance: 0.5, stormChance: 0.3, heatWaveChance: 0.1, minTemp: 5, maxTemp: 88 }, // High altitude, snowy
  'atlanta': { rainChance: 0.5, snowChance: 0.1, stormChance: 0.4, heatWaveChance: 0.4, minTemp: 30, maxTemp: 90 }, // Hot, humid summers
  'houston': { rainChance: 0.5, snowChance: 0, stormChance: 0.5, heatWaveChance: 0.6, minTemp: 45, maxTemp: 95 }, // Hot, humid, stormy
  'philadelphia': { rainChance: 0.4, snowChance: 0.3, stormChance: 0.2, heatWaveChance: 0.2, minTemp: 25, maxTemp: 85 },
  'lasvegas': { rainChance: 0.02, snowChance: 0, stormChance: 0.1, heatWaveChance: 0.9, minTemp: 35, maxTemp: 110 }, // Extreme desert heat
  'portland': { rainChance: 0.6, snowChance: 0.1, stormChance: 0.1, heatWaveChance: 0.05, minTemp: 35, maxTemp: 80 }, // Pacific Northwest
  'nashville': { rainChance: 0.4, snowChance: 0.2, stormChance: 0.4, heatWaveChance: 0.3, minTemp: 25, maxTemp: 88 }
};

export const DynamicWeatherBanner: React.FC<WeatherBannerProps> = ({ 
  gameDay, 
  currentCity, 
  heatLevel 
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [weather, setWeather] = useState<{ type: string; intensity: number }>({ type: 'clear', intensity: 0 });

  useEffect(() => {
    // Calculate phase based on game time (24-hour cycle divided into 12 phases = 2 hours each)
    const now = new Date();
    const gameTime = new Date(now.getTime() + (gameDay * 24 * 60 * 60 * 1000));
    const hour = gameTime.getHours();
    const phase = Math.floor(hour / 2);
    setCurrentPhase(phase);

    // Determine weather based on city and heat level
    const cityPattern = cityWeatherPatterns[currentCity] || cityWeatherPatterns['hometown'];
    let weatherType = 'clear';
    let weatherIntensity = 0;

    // Higher heat levels increase storm probability
    const heatMultiplier = heatLevel >= 3 ? 1.5 : 1;
    
    const random = Math.random();
    if (random < cityPattern.stormChance * heatMultiplier) {
      weatherType = 'storm';
      weatherIntensity = Math.random() * 0.8 + 0.2;
    } else if (random < cityPattern.rainChance) {
      weatherType = 'rain';
      weatherIntensity = Math.random() * 0.6 + 0.2;
    } else if (random < cityPattern.snowChance && (phase < 3 || phase > 8)) {
      weatherType = 'snow';
      weatherIntensity = Math.random() * 0.5 + 0.3;
    }

    setWeather({ type: weatherType, intensity: weatherIntensity });
  }, [gameDay, currentCity, heatLevel]);

  const phase = weatherPhases[currentPhase] || weatherPhases[0];

  // Generate stars for night phases - reduced count for performance
  const generateStars = () => {
    if (phase.starsOpacity === 0) return null;
    
    const stars = [];
    for (let i = 0; i < 50; i++) {
      const size = Math.random() < 0.3 ? 'w-1 h-1' : 'w-0.5 h-0.5';
      const color = Math.random() < 0.2 ? 'bg-yellow-200' : Math.random() < 0.5 ? 'bg-blue-100' : 'bg-white';
      const delay = Math.random() * 3;
      
      stars.push(
        <div
          key={i}
          className={`absolute ${size} ${color} rounded-full animate-pulse`}
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 80 + 10}%`,
            opacity: phase.starsOpacity,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    return stars;
  };

  // Generate weather effects - optimized for performance
  const generateWeatherEffects = () => {
    if (weather.type === 'clear') return null;

    const effects = [];
    const count = Math.floor(weather.intensity * 30) + 20;

    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 1 + Math.random() * 2;

      if (weather.type === 'rain') {
        effects.push(
          <div
            key={`rain-${i}`}
            className="absolute w-0.5 h-4 bg-blue-300 opacity-60 animate-pulse"
            style={{
              left: `${left}%`,
              top: '-20px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: 'rotate(10deg)'
            }}
          />
        );
      } else if (weather.type === 'snow') {
        effects.push(
          <div
            key={`snow-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-80 animate-bounce"
            style={{
              left: `${left}%`,
              top: '-10px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration + 1}s`
            }}
          />
        );
      } else if (weather.type === 'storm') {
        if (i < 5) {
          effects.push(
            <div
              key={`lightning-${i}`}
              className="absolute inset-0 bg-yellow-300 opacity-20 animate-pulse"
              style={{
                animationDelay: `${delay * 2}s`,
                animationDuration: '0.1s'
              }}
            />
          );
        }
      }
    }

    return effects;
  };

  return (
    <div className="absolute inset-0 w-full h-32 overflow-hidden transition-all duration-[2000ms] ease-in-out" style={{ zIndex: -10, pointerEvents: 'none' }}>
      {/* Sky Gradient Background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b ${phase.gradient} transition-all duration-[2000ms] ease-in-out`}
      />

      {/* Clouds - Limited to background area */}
      <div className="absolute inset-0">
        <div className="absolute w-12 h-6 bg-white bg-opacity-20 rounded-full top-8 left-[20%] animate-float" 
             style={{ animationDuration: '8s' }} />
        <div className="absolute w-10 h-5 bg-white bg-opacity-15 rounded-full top-12 left-[60%] animate-float" 
             style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute w-14 h-7 bg-white bg-opacity-20 rounded-full top-6 left-[80%] animate-float" 
             style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      {/* Sun */}
      <div 
        className={`absolute top-8 w-12 h-12 bg-yellow-300 rounded-full shadow-lg transition-all duration-[2000ms] ease-in-out ${phase.sunPosition}`}
        style={{ opacity: phase.sunOpacity }}
      >
        <div className="absolute inset-0 bg-yellow-200 rounded-full animate-pulse" />
      </div>

      {/* Moon */}
      <div 
        className={`absolute top-12 w-8 h-8 bg-gray-200 rounded-full shadow-md transition-all duration-[2000ms] ease-in-out ${phase.moonPosition}`}
        style={{ opacity: phase.moonOpacity }}
      >
        <div className="absolute top-1 left-1 w-2 h-2 bg-gray-400 rounded-full opacity-50" />
        <div className="absolute top-3 left-4 w-1 h-1 bg-gray-400 rounded-full opacity-30" />
      </div>

      {/* Stars */}
      {generateStars()}

      {/* Weather Effects */}
      {generateWeatherEffects()}

      {/* Game Info Overlay - Positioned right under Heat status */}
      <div className="absolute top-16 left-2 text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded-lg">
        Day {gameDay} • {phase.name} • {currentCity.charAt(0).toUpperCase() + currentCity.slice(1)}
        {weather.type !== 'clear' && (
          <span className="ml-2 capitalize">• {weather.type}</span>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(10px) translateY(-5px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default DynamicWeatherBanner;