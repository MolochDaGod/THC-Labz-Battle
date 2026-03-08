import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageCircle, X, Brain, DollarSign } from 'lucide-react';

interface Drug {
  id: string;
  name: string;
  owned: number;
  currentPrice: number;
  basePrice: number;
}

interface ProfitInsight {
  bestSeller: string;
  bestSellerPrice: number;
  bestSellerProfit: number;
  recommendedAction: string;
  marketTrend: 'bullish' | 'bearish' | 'stable';
  profitForecast: string;
  dailyNews: string;
}

interface ProfitAssistantProps {
  drugs: { [key: string]: Drug };
  currentCity: string;
  gameDay: number;
  totalPortfolioValue: number;
  onClose: () => void;
}

export const ProfitAssistant: React.FC<ProfitAssistantProps> = ({
  drugs,
  currentCity,
  gameDay,
  totalPortfolioValue,
  onClose
}) => {
  const [insights, setInsights] = useState<ProfitInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cities = {
    hometown: 'Home Town',
    neighborhood: 'The NeighborHood', 
    centralpark: 'Central Park',
    newyork: 'New York',
    stlouis: 'St. Louis',
    memphis: 'Memphis',
    baltimore: 'Baltimore',
    miami: 'Miami',
    atlanta: 'Atlanta',
    detroit: 'Detroit',
    kansascity: 'Kansas City',
    houston: 'Houston',
    neworleans: 'New Orleans',
    cleveland: 'Cleveland',
    oakland: 'Oakland',
    denver: 'Denver'
  };

  const generateProfitInsights = async () => {
    setIsLoading(true);
    
    // Simulate AI analysis (in production this would call OpenAI API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const ownedDrugs = Object.values(drugs).filter(drug => drug.owned > 0);
    const allDrugs = Object.values(drugs);
    
    // Find best selling opportunity
    const bestOpportunity = allDrugs.reduce((best, drug) => {
      const profitMargin = ((drug.currentPrice - drug.basePrice) / drug.basePrice) * 100;
      const bestMargin = ((best.currentPrice - best.basePrice) / best.basePrice) * 100;
      return profitMargin > bestMargin ? drug : best;
    }, allDrugs[0]);

    // Generate market trend analysis
    const avgPriceRatio = allDrugs.reduce((sum, drug) => sum + (drug.currentPrice / drug.basePrice), 0) / allDrugs.length;
    const marketTrend: 'bullish' | 'bearish' | 'stable' = 
      avgPriceRatio > 1.2 ? 'bullish' : 
      avgPriceRatio < 0.9 ? 'bearish' : 'stable';

    // Generate daily news based on current conditions
    const newsTemplates = [
      `Breaking: ${bestOpportunity.name} prices surge in ${cities[currentCity as keyof typeof cities]} - dealers report 400% profit margins!`,
      `Market Alert: High demand for premium BUDZ in ${cities[currentCity as keyof typeof cities]} - smart dealers moving weight fast!`,
      `Street Intelligence: ${bestOpportunity.name} supply shortage hits ${cities[currentCity as keyof typeof cities]} - prices expected to climb!`,
      `Profit Opportunity: Local connect reports ${bestOpportunity.name} moving for $${bestOpportunity.currentPrice}/gram in ${cities[currentCity as keyof typeof cities]}!`,
      `Underground Report: ${cities[currentCity as keyof typeof cities]} buyers specifically requesting ${bestOpportunity.name} - capitalize now!`
    ];

    const insights: ProfitInsight = {
      bestSeller: bestOpportunity.name,
      bestSellerPrice: bestOpportunity.currentPrice,
      bestSellerProfit: ((bestOpportunity.currentPrice - bestOpportunity.basePrice) / bestOpportunity.basePrice) * 100,
      recommendedAction: ownedDrugs.length > 0 
        ? `Sell your ${ownedDrugs.find(d => d.currentPrice > d.basePrice * 1.3)?.name || ownedDrugs[0].name} for maximum profit!`
        : `Buy ${bestOpportunity.name} - currently undervalued with high profit potential!`,
      marketTrend,
      profitForecast: marketTrend === 'bullish' 
        ? `Market conditions favor sellers - expect 20-40% profit margins today!`
        : marketTrend === 'bearish'
        ? `Buyer's market detected - stock up on discounted premium strains!`
        : `Stable market - focus on volume trading and location arbitrage!`,
      dailyNews: newsTemplates[Math.floor(Math.random() * newsTemplates.length)]
    };

    setInsights(insights);
    setIsLoading(false);
  };

  useEffect(() => {
    generateProfitInsights();
  }, [gameDay, currentCity]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-900 border border-purple-400 rounded-lg max-w-md w-full p-6 transform animate-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-purple-300">The Plug's Daily Brief</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-purple-300">Analyzing market conditions...</p>
          </div>
        ) : insights && (
          <div className="space-y-4">
            {/* Daily News */}
            <div className="p-3 bg-red-900 bg-opacity-50 border border-red-400 rounded">
              <h3 className="text-red-300 font-bold mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Street Intel - Day {gameDay}
              </h3>
              <p className="text-red-100 text-sm">{insights.dailyNews}</p>
            </div>

            {/* Best Profit Opportunity */}
            <div className="p-3 bg-green-900 bg-opacity-50 border border-green-400 rounded">
              <h3 className="text-green-300 font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Profit Play
              </h3>
              <div className="text-green-100 text-sm space-y-1">
                <p><strong>{insights.bestSeller}</strong> - ${insights.bestSellerPrice}/gram</p>
                <p>Profit margin: <span className="text-green-300 font-bold">+{insights.bestSellerProfit.toFixed(1)}%</span></p>
              </div>
            </div>

            {/* Market Analysis */}
            <div className="p-3 bg-blue-900 bg-opacity-50 border border-blue-400 rounded">
              <h3 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Market Forecast
              </h3>
              <div className="text-blue-100 text-sm space-y-1">
                <p>Trend: <span className={`font-bold ${
                  insights.marketTrend === 'bullish' ? 'text-green-400' :
                  insights.marketTrend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }`}>{insights.marketTrend.toUpperCase()}</span></p>
                <p>{insights.profitForecast}</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-purple-900 bg-opacity-50 border border-purple-400 rounded">
              <h3 className="text-purple-300 font-bold mb-2">💡 The Plug Recommends</h3>
              <p className="text-purple-100 text-sm">{insights.recommendedAction}</p>
            </div>

            {/* Portfolio Summary */}
            <div className="p-3 bg-gray-800 border border-gray-600 rounded text-center">
              <p className="text-gray-300 text-sm">
                Current Portfolio: <span className="text-green-400 font-bold">${totalPortfolioValue.toLocaleString()}</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Location: {cities[currentCity as keyof typeof cities]} | Day {gameDay}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};