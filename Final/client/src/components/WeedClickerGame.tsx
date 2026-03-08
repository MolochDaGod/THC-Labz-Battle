import { useState, useEffect, useCallback } from 'react';
import { MapPin, Briefcase, AlertTriangle, Gun, Shield, DollarSign, Users, Calendar } from 'lucide-react';

interface Drug {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  quantity: number;
  maxCarry: number;
}

interface City {
  id: string;
  name: string;
  prices: Record<string, number>;
  events: string[];
}

interface GameState {
  money: number;
  debt: number;
  health: number;
  day: number;
  currentCity: string;
  inventory: Record<string, number>;
  coatSpace: number;
  reputation: number;
}

export default function WeedClickerGame() {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    money: 2000,
    debt: 5500,
    health: 100,
    day: 1,
    currentCity: 'bronx',
    inventory: {
      weed: 0,
      cocaine: 0,
      heroin: 0,
      acid: 0,
      pcp: 0,
      shrooms: 0,
      speed: 0,
      ludes: 0
    },
    coatSpace: 100,
    reputation: 0
  });

  const [currentView, setCurrentView] = useState<'market' | 'travel' | 'bank' | 'status'>('market');
  const [eventMessage, setEventMessage] = useState<string>('');
  const [showEvent, setShowEvent] = useState(false);

  // Drug definitions
  const drugs: Record<string, Drug> = {
    weed: { id: 'weed', name: 'Weed', price: 315, basePrice: 315, quantity: 0, maxCarry: 30 },
    cocaine: { id: 'cocaine', name: 'Cocaine', price: 15000, basePrice: 15000, quantity: 0, maxCarry: 10 },
    heroin: { id: 'heroin', name: 'Heroin', price: 6400, basePrice: 6400, quantity: 0, maxCarry: 15 },
    acid: { id: 'acid', name: 'Acid', price: 1000, basePrice: 1000, quantity: 0, maxCarry: 50 },
    pcp: { id: 'pcp', name: 'PCP', price: 2500, basePrice: 2500, quantity: 0, maxCarry: 20 },
    shrooms: { id: 'shrooms', name: 'Shrooms', price: 630, basePrice: 630, quantity: 0, maxCarry: 25 },
    speed: { id: 'speed', name: 'Speed', price: 90, basePrice: 90, quantity: 0, maxCarry: 40 },
    ludes: { id: 'ludes', name: 'Ludes', price: 11, basePrice: 11, quantity: 0, maxCarry: 60 }
  };

  // Cities
  const cities: Record<string, City> = {
    hometown: { id: 'hometown', name: 'Home Town', prices: {}, events: ['Cops', 'Mugging', 'Deal'] },
    neighborhood: { id: 'neighborhood', name: 'The NeighborHood', prices: {}, events: ['Cops', 'Cheap Drugs', 'Rival'] },
    central: { id: 'central', name: 'Central Park', prices: {}, events: ['Rich Buyer', 'Cops'] },
    newyork: { id: 'newyork', name: 'New York', prices: {}, events: ['High Prices', 'Police Raid'] },
    stlouis: { id: 'stlouis', name: 'St. Louis', prices: {}, events: ['Tourists', 'Gang Fight'] },
    memphis: { id: 'memphis', name: 'Memphis', prices: {}, events: ['Cheap Rent', 'Mugging'] },
    baltimore: { id: 'baltimore', name: 'Baltimore', prices: {}, events: ['Cops', 'Deal'] },
    miami: { id: 'miami', name: 'Miami', prices: {}, events: ['High Prices', 'Rich Buyer'] },
    atlanta: { id: 'atlanta', name: 'Atlanta', prices: {}, events: ['Gang Fight', 'Mugging'] },
    detroit: { id: 'detroit', name: 'Detroit', prices: {}, events: ['Cheap Drugs', 'Rival'] },
    kansascity: { id: 'kansascity', name: 'Kansas City', prices: {}, events: ['Police Raid', 'Cops'] },
    houston: { id: 'houston', name: 'Houston', prices: {}, events: ['Deal', 'High Prices'] },
    neworleans: { id: 'neworleans', name: 'New Orleans', prices: {}, events: ['Tourists', 'Rich Buyer'] },
    cleveland: { id: 'cleveland', name: 'Cleveland', prices: {}, events: ['Cheap Rent', 'Gang Fight'] },
    oakland: { id: 'oakland', name: 'Oakland', prices: {}, events: ['Rival', 'Mugging'] },
    denver: { id: 'denver', name: 'Denver', prices: {}, events: ['Cops', 'Deal'] }
  };

  const [marketPrices, setMarketPrices] = useState<Record<string, Record<string, number>>>({});

  // Create a new plant
  const plantSeed = useCallback(() => {
    const newPlant: Plant = {
      id: Date.now().toString(),
      growth: 0,
      maxGrowth: 100,
      value: 10 + (ownedUpgrades.genetics * 5),
      stage: 'seed'
    };
    setPlants(prev => [...prev, newPlant]);
  }, [ownedUpgrades.genetics]);

  // Click to grow plant
  const growPlant = useCallback((plantId: string) => {
    setPlants(prev => prev.map(plant => {
      if (plant.id === plantId && plant.stage !== 'ready') {
        const newGrowth = Math.min(plant.growth + clickPower, plant.maxGrowth);
        let newStage = plant.stage;
        
        if (newGrowth >= 100) newStage = 'ready';
        else if (newGrowth >= 75) newStage = 'flowering';
        else if (newGrowth >= 40) newStage = 'growing';
        else if (newGrowth >= 10) newStage = 'sprout';
        
        return { ...plant, growth: newGrowth, stage: newStage };
      }
      return plant;
    }));
  }, [clickPower]);

  // Harvest plant for money
  const harvestPlant = useCallback((plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant && plant.stage === 'ready') {
      const value = plant.value * (1 + (ownedUpgrades.genetics * 0.5));
      setMoney(prev => prev + value);
      setPlants(prev => prev.filter(p => p.id !== plantId));
    }
  }, [plants, ownedUpgrades.genetics]);

  // Buy upgrade
  const buyUpgrade = useCallback((upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const cost = upgrade.cost * Math.pow(1.5, ownedUpgrades[upgradeId]);
    
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setOwnedUpgrades(prev => ({
        ...prev,
        [upgradeId]: prev[upgradeId] + 1
      }));

      // Apply upgrade effects
      if (upgradeId === 'fertilizer' || upgradeId === 'hydro') {
        setClickPower(prev => prev + upgrade.effect);
      } else if (upgradeId === 'lights' || upgradeId === 'greenhouse') {
        setAutoGrowRate(prev => prev + upgrade.effect);
      }
    }
  }, [money, ownedUpgrades, upgrades]);

  // Auto-growth effect
  useEffect(() => {
    if (autoGrowRate > 0) {
      const interval = setInterval(() => {
        setPlants(prev => prev.map(plant => {
          if (plant.stage !== 'ready') {
            const newGrowth = Math.min(plant.growth + autoGrowRate, plant.maxGrowth);
            let newStage = plant.stage;
            
            if (newGrowth >= 100) newStage = 'ready';
            else if (newGrowth >= 75) newStage = 'flowering';
            else if (newGrowth >= 40) newStage = 'growing';
            else if (newGrowth >= 10) newStage = 'sprout';
            
            return { ...plant, growth: newGrowth, stage: newStage };
          }
          return plant;
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoGrowRate]);

  // Start with one plant
  useEffect(() => {
    if (plants.length === 0) {
      plantSeed();
    }
  }, [plants.length, plantSeed]);

  const getPlantEmoji = (stage: Plant['stage']) => {
    switch (stage) {
      case 'seed': return '🌰';
      case 'sprout': return '🌱';
      case 'growing': return '🌿';
      case 'flowering': return '🌸';
      case 'ready': return '🌿✨';
      default: return '🌰';
    }
  };

  const getPlantColor = (stage: Plant['stage']) => {
    switch (stage) {
      case 'seed': return 'bg-amber-100';
      case 'sprout': return 'bg-green-100';
      case 'growing': return 'bg-green-200';
      case 'flowering': return 'bg-purple-200';
      case 'ready': return 'bg-yellow-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white">
      {/* Header */}
      <div className="bg-black bg-opacity-30 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-400" />
          <span className="text-xl font-bold">Weed Empire</span>
        </div>
        <div className="flex items-center gap-2 text-xl font-bold text-yellow-400">
          <DollarSign className="w-5 h-5" />
          ${money.toFixed(0)}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex bg-black bg-opacity-20">
        <button
          onClick={() => setCurrentView('grow')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 ${
            currentView === 'grow' ? 'bg-green-600' : 'bg-transparent'
          }`}
        >
          <Home className="w-5 h-5" />
          Grow Room
        </button>
        <button
          onClick={() => setCurrentView('shop')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 ${
            currentView === 'shop' ? 'bg-green-600' : 'bg-transparent'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          Shop
        </button>
        <button
          onClick={() => setCurrentView('upgrades')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 ${
            currentView === 'upgrades' ? 'bg-green-600' : 'bg-transparent'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Stats
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {currentView === 'grow' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Grow Room</h2>
              <button
                onClick={plantSeed}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold"
              >
                Plant Seed
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {plants.map(plant => (
                <div
                  key={plant.id}
                  className={`${getPlantColor(plant.stage)} rounded-lg p-4 border-2 border-green-600`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getPlantEmoji(plant.stage)}</div>
                    <div className="text-black font-semibold capitalize mb-2">
                      {plant.stage}
                    </div>
                    
                    {/* Growth Bar */}
                    <div className="bg-gray-300 rounded-full h-2 mb-3">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${plant.growth}%` }}
                      />
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">
                      Growth: {plant.growth.toFixed(0)}%
                    </div>
                    
                    {plant.stage === 'ready' ? (
                      <button
                        onClick={() => harvestPlant(plant.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded font-semibold w-full"
                      >
                        Harvest ${plant.value}
                      </button>
                    ) : (
                      <button
                        onClick={() => growPlant(plant.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-semibold w-full"
                      >
                        Grow (+{clickPower})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'shop' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Upgrade Shop</h2>
            <div className="space-y-3">
              {upgrades.map(upgrade => {
                const cost = upgrade.cost * Math.pow(1.5, ownedUpgrades[upgrade.id]);
                const canAfford = money >= cost;
                
                return (
                  <div
                    key={upgrade.id}
                    className="bg-black bg-opacity-30 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{upgrade.icon}</div>
                      <div>
                        <div className="font-semibold">{upgrade.name}</div>
                        <div className="text-sm text-gray-300">{upgrade.description}</div>
                        <div className="text-xs text-green-400">
                          Owned: {ownedUpgrades[upgrade.id]}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyUpgrade(upgrade.id)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded font-semibold ${
                        canAfford
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      ${cost.toFixed(0)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'upgrades' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="bg-black bg-opacity-30 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Production Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-300">Click Power</div>
                    <div className="text-xl font-bold text-green-400">+{clickPower}</div>
                  </div>
                  <div>
                    <div className="text-gray-300">Auto Growth</div>
                    <div className="text-xl font-bold text-blue-400">+{autoGrowRate}/sec</div>
                  </div>
                  <div>
                    <div className="text-gray-300">Total Plants</div>
                    <div className="text-xl font-bold text-purple-400">{plants.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-300">Ready to Harvest</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {plants.filter(p => p.stage === 'ready').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}