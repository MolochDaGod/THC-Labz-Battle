import React, { useEffect, useState, useRef } from 'react';
import './EnvironmentalSystem.css';

interface EnvironmentalSystemProps {
  gameState: any;
  isGameStarted: boolean;
}

interface WeatherType {
  name: string;
  skyClass: string;
  probability: number;
  locationMultiplier?: { [key: string]: number };
}

interface TimePhase {
  name: string;
  skyClass: string;
  sunPosition: { left: string; top: string };
  sunOpacity: number;
  moonPosition: { left: string; top: string };
  moonOpacity: number;
  starsOpacity: number;
  cloudsOpacity: number;
}

const EnvironmentalSystem: React.FC<EnvironmentalSystemProps> = ({ gameState, isGameStarted }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [weatherActive, setWeatherActive] = useState<WeatherType | false>(false);
  const [rainDrops, setRainDrops] = useState<Array<{ id: number; left: number; animationDuration: number }>>([]);
  const [snowFlakes, setSnowFlakes] = useState<Array<{ id: number; left: number; animationDuration: number }>>([]);
  const [showLightning, setShowLightning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 12 detailed time phases based on in-game time
  const phases: TimePhase[] = [
    {
      name: 'Early Dawn',
      skyClass: 'early-dawn',
      sunPosition: { left: '-10%', top: '220px' },
      sunOpacity: 0,
      moonPosition: { left: '80%', top: '60px' },
      moonOpacity: 0.8,
      starsOpacity: 0.6,
      cloudsOpacity: 0.3
    },
    {
      name: 'Sunrise',
      skyClass: 'sunrise',
      sunPosition: { left: '5%', top: '180px' },
      sunOpacity: 0.8,
      moonPosition: { left: '90%', top: '40px' },
      moonOpacity: 0.4,
      starsOpacity: 0.2,
      cloudsOpacity: 0.6
    },
    {
      name: 'Morning',
      skyClass: 'morning',
      sunPosition: { left: '20%', top: '120px' },
      sunOpacity: 1,
      moonPosition: { left: '95%', top: '30px' },
      moonOpacity: 0,
      starsOpacity: 0,
      cloudsOpacity: 0.8
    },
    {
      name: 'Midday',
      skyClass: 'midday',
      sunPosition: { left: '50%', top: '30px' },
      sunOpacity: 1,
      moonPosition: { left: '100%', top: '20px' },
      moonOpacity: 0,
      starsOpacity: 0,
      cloudsOpacity: 0.9
    },
    {
      name: 'Afternoon',
      skyClass: 'afternoon',
      sunPosition: { left: '70%', top: '80px' },
      sunOpacity: 1,
      moonPosition: { left: '-10%', top: '50px' },
      moonOpacity: 0,
      starsOpacity: 0,
      cloudsOpacity: 0.7
    },
    {
      name: 'Golden Hour',
      skyClass: 'golden-hour',
      sunPosition: { left: '85%', top: '140px' },
      sunOpacity: 0.9,
      moonPosition: { left: '10%', top: '60px' },
      moonOpacity: 0.1,
      starsOpacity: 0,
      cloudsOpacity: 0.6
    },
    {
      name: 'Sunset',
      skyClass: 'sunset',
      sunPosition: { left: '95%', top: '180px' },
      sunOpacity: 0.7,
      moonPosition: { left: '30%', top: '70px' },
      moonOpacity: 0.5,
      starsOpacity: 0.3,
      cloudsOpacity: 0.5
    },
    {
      name: 'Dusk',
      skyClass: 'dusk',
      sunPosition: { left: '100%', top: '220px' },
      sunOpacity: 0.2,
      moonPosition: { left: '50%', top: '60px' },
      moonOpacity: 0.8,
      starsOpacity: 0.6,
      cloudsOpacity: 0.4
    },
    {
      name: 'Early Night',
      skyClass: 'early-night',
      sunPosition: { left: '105%', top: '250px' },
      sunOpacity: 0,
      moonPosition: { left: '70%', top: '50px' },
      moonOpacity: 1,
      starsOpacity: 0.8,
      cloudsOpacity: 0.3
    },
    {
      name: 'Midnight',
      skyClass: 'midnight',
      sunPosition: { left: '50%', top: '350px' },
      sunOpacity: 0,
      moonPosition: { left: '50%', top: '40px' },
      moonOpacity: 1,
      starsOpacity: 1,
      cloudsOpacity: 0.2
    },
    {
      name: 'Late Night',
      skyClass: 'late-night',
      sunPosition: { left: '-5%', top: '300px' },
      sunOpacity: 0,
      moonPosition: { left: '30%', top: '50px' },
      moonOpacity: 0.9,
      starsOpacity: 0.9,
      cloudsOpacity: 0.3
    },
    {
      name: 'Pre Dawn',
      skyClass: 'pre-dawn',
      sunPosition: { left: '-8%', top: '250px' },
      sunOpacity: 0,
      moonPosition: { left: '20%', top: '60px' },
      moonOpacity: 0.7,
      starsOpacity: 0.7,
      cloudsOpacity: 0.4
    }
  ];

  // Location-based weather probabilities
  const weatherTypes: WeatherType[] = [
    {
      name: 'rain',
      skyClass: 'rainy',
      probability: 0.15,
      locationMultiplier: {
        'miami': 1.5,
        'neworleans': 1.4,
        'houston': 1.3,
        'atlanta': 1.2,
        'baltimore': 1.1,
        'denver': 0.7,
        'oakland': 0.8
      }
    },
    {
      name: 'snow',
      skyClass: 'snowy',
      probability: 0.10,
      locationMultiplier: {
        'denver': 2.0,
        'cleveland': 1.8,
        'detroit': 1.6,
        'kansascity': 1.4,
        'hometown': 1.2,
        'miami': 0.1,
        'houston': 0.2,
        'neworleans': 0.1
      }
    },
    {
      name: 'storm',
      skyClass: 'stormy',
      probability: 0.08,
      locationMultiplier: {
        'houston': 1.6,
        'miami': 1.5,
        'neworleans': 1.4,
        'kansas city': 1.3,
        'stlouis': 1.2,
        'denver': 1.4
      }
    }
  ];

  // Calculate current phase based on in-game time
  const calculatePhaseFromGameTime = (): number => {
    if (!gameState?.timeElapsed) return 0;
    
    // Convert game time to hours (assuming timeElapsed is in minutes)
    const gameMinutes = gameState.timeElapsed;
    const gameHours = (gameMinutes / 60) % 24; // 24-hour cycle
    
    // Map 24 hours to 12 phases (2 hours per phase)
    return Math.floor(gameHours / 2) % 12;
  };

  // Check for location-based weather
  const checkLocationWeather = (): WeatherType | false => {
    const currentCity = gameState?.currentCity || 'hometown';
    
    // Reset weather
    let selectedWeather: WeatherType | false = false;
    
    // Random chance for weather during certain phases (avoid midday for most weather)
    if (currentPhase !== 3) { // Skip midday (index 3) for weather
      let cumulativeProbability = 0;
      const randomValue = Math.random();
      
      for (const weather of weatherTypes) {
        const locationMultiplier = weather.locationMultiplier?.[currentCity] || 1.0;
        const adjustedProbability = weather.probability * locationMultiplier;
        cumulativeProbability += adjustedProbability;
        
        if (randomValue < cumulativeProbability) {
          selectedWeather = weather;
          break;
        }
      }
    }
    
    return selectedWeather;
  };

  // Create weather elements
  const createRainDrops = () => {
    const drops = [];
    for (let i = 0; i < 50; i++) {
      drops.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 0.5 + Math.random() * 0.5
      });
    }
    setRainDrops(drops);
  };

  const createSnowFlakes = () => {
    const flakes = [];
    for (let i = 0; i < 30; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 2 + Math.random() * 3
      });
    }
    setSnowFlakes(flakes);
  };

  // Lightning effect
  const triggerLightning = () => {
    setShowLightning(true);
    setTimeout(() => setShowLightning(false), 150);
    
    // Random additional flashes
    if (Math.random() < 0.6) {
      setTimeout(() => {
        setShowLightning(true);
        setTimeout(() => setShowLightning(false), 100);
      }, 300);
    }
  };

  // Main update cycle
  useEffect(() => {
    if (!isGameStarted) return;

    const updateEnvironment = () => {
      // Update phase based on game time
      const newPhase = calculatePhaseFromGameTime();
      setCurrentPhase(newPhase);
      
      // Check for weather changes
      const newWeather = checkLocationWeather();
      setWeatherActive(newWeather);
      
      // Create weather effects
      if (newWeather) {
        if (newWeather.name === 'rain') {
          createRainDrops();
        } else if (newWeather.name === 'snow') {
          createSnowFlakes();
        } else if (newWeather.name === 'storm') {
          createRainDrops();
          if (Math.random() < 0.3) {
            triggerLightning();
          }
        }
      } else {
        setRainDrops([]);
        setSnowFlakes([]);
      }
    };

    // Initial update
    updateEnvironment();
    
    // Update every 4 seconds (like the original system)
    intervalRef.current = setInterval(updateEnvironment, 4000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isGameStarted, gameState?.timeElapsed, gameState?.currentCity]);

  // Lightning timer for storms
  useEffect(() => {
    if (weatherActive && weatherActive.name === 'storm') {
      const lightningInterval = setInterval(() => {
        if (Math.random() < 0.4) {
          triggerLightning();
        }
      }, 2000 + Math.random() * 3000);
      
      return () => clearInterval(lightningInterval);
    }
  }, [weatherActive]);

  if (!isGameStarted) return null;

  const currentPhaseData = phases[currentPhase];
  const skyClass = weatherActive ? weatherActive.skyClass : currentPhaseData.skyClass;

  return (
    <div className="environmental-banner">
      <div className={`env-sky ${skyClass}`}>
        {/* Sun */}
        <div 
          className="env-sun"
          style={{
            left: currentPhaseData.sunPosition.left,
            top: currentPhaseData.sunPosition.top,
            opacity: currentPhaseData.sunOpacity
          }}
        />
        
        {/* Moon */}
        <div 
          className="env-moon"
          style={{
            left: currentPhaseData.moonPosition.left,
            top: currentPhaseData.moonPosition.top,
            opacity: currentPhaseData.moonOpacity
          }}
        />
        
        {/* Stars */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="env-star"
            style={{
              width: `${2 + Math.floor(i % 3)}px`,
              height: `${2 + Math.floor(i % 3)}px`,
              top: `${20 + (i * 7) % 50}px`,
              left: `${15 + (i * 23) % 70}%`,
              opacity: currentPhaseData.starsOpacity,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
        
        {/* Clouds */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`env-cloud env-cloud${i}`}
            style={{ opacity: currentPhaseData.cloudsOpacity }}
          />
        ))}
        
        {/* Weather Effects */}
        {rainDrops.map((drop) => (
          <div
            key={`rain-${drop.id}`}
            className="env-rain-drop"
            style={{
              left: `${drop.left}%`,
              animationDuration: `${drop.animationDuration}s`
            }}
          />
        ))}
        
        {snowFlakes.map((flake) => (
          <div
            key={`snow-${flake.id}`}
            className="env-snow-flake"
            style={{
              left: `${flake.left}%`,
              animationDuration: `${flake.animationDuration}s`
            }}
          >
            ❄
          </div>
        ))}
        
        {/* Lightning */}
        {showLightning && <div className="env-lightning" />}
        
        {/* Ground */}
        <div 
          className={`env-ground ${
            weatherActive && weatherActive.name === 'snow' ? 'winter-ground' : 
            currentPhaseData.starsOpacity > 0.5 ? 'night-ground' : ''
          }`} 
        />
      </div>
    </div>
  );
};

export default EnvironmentalSystem;