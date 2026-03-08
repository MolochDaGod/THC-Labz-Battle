import React, { useState, useEffect } from 'react';
import { Target, Zap, Star, Gift, X } from 'lucide-react';

interface AIInfluenceGameProps {
  onGameComplete: (score: number, bonus: number) => void;
  onClose: () => void;
}

const AIInfluenceGame: React.FC<AIInfluenceGameProps> = ({ onGameComplete, onClose }) => {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'results'>('instructions');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number; type: 'good' | 'bad' | 'bonus' }>>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [clickedTargets, setClickedTargets] = useState<Set<number>>(new Set());

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setGameStarted(true);
    setScore(0);
    setTimeLeft(15);
    setClickedTargets(new Set());
    generateTargets();
  };

  // Generate random targets
  const generateTargets = () => {
    const newTargets = [];
    for (let i = 0; i < 12; i++) {
      const targetTypes = ['good', 'good', 'good', 'bad', 'bonus']; // More good targets
      const type = targetTypes[Math.floor(Math.random() * targetTypes.length)] as 'good' | 'bad' | 'bonus';
      
      newTargets.push({
        id: i,
        x: Math.random() * 80 + 10, // 10-90% of container width
        y: Math.random() * 70 + 15, // 15-85% of container height
        type
      });
    }
    setTargets(newTargets);
  };

  // Handle target click
  const handleTargetClick = (target: { id: number; type: 'good' | 'bad' | 'bonus' }) => {
    if (clickedTargets.has(target.id)) return;
    
    setClickedTargets(prev => new Set(prev).add(target.id));
    
    let points = 0;
    switch (target.type) {
      case 'good':
        points = 10;
        break;
      case 'bonus':
        points = 25;
        break;
      case 'bad':
        points = -15;
        break;
    }
    
    setScore(prev => Math.max(0, prev + points));
  };

  // Timer countdown
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted) {
      // Game ended
      setGameState('results');
      setGameStarted(false);
    }
  }, [gameStarted, timeLeft]);

  // Calculate AI bonus based on score
  const getAIBonus = (finalScore: number) => {
    if (finalScore >= 200) return 0.25; // 25% bonus
    if (finalScore >= 150) return 0.20; // 20% bonus
    if (finalScore >= 100) return 0.15; // 15% bonus
    if (finalScore >= 50) return 0.10; // 10% bonus
    return 0.05; // 5% bonus
  };

  const handleFinish = () => {
    const bonus = getAIBonus(score);
    onGameComplete(score, bonus);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-green-400 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-green-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            🎯 AI Influence Game
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {gameState === 'instructions' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-gray-300 mb-4">
                Test your reflexes to influence The Plug's AI helpfulness!
              </p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-400">Good targets: +10 points</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-400">Bonus targets: +25 points</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-red-400">Bad targets: -15 points</span>
              </div>
            </div>

            <div className="bg-gray-800 p-3 rounded text-center">
              <p className="text-xs text-gray-400">
                Higher scores = Better AI responses & missions!
              </p>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-bold"
              style={{ fontFamily: 'LemonMilk, sans-serif' }}
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Score: {score}</span>
              <span className="text-yellow-400">Time: {timeLeft}s</span>
            </div>
            
            <div className="relative bg-gray-800 rounded h-64 overflow-hidden">
              {targets.map(target => (
                <button
                  key={target.id}
                  onClick={() => handleTargetClick(target)}
                  disabled={clickedTargets.has(target.id)}
                  className={`absolute w-8 h-8 rounded-full transition-all duration-200 ${
                    clickedTargets.has(target.id) 
                      ? 'opacity-30 scale-75' 
                      : 'hover:scale-110 active:scale-95'
                  } ${
                    target.type === 'good' ? 'bg-green-500 hover:bg-green-400' :
                    target.type === 'bonus' ? 'bg-yellow-500 hover:bg-yellow-400' :
                    'bg-red-500 hover:bg-red-400'
                  }`}
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {target.type === 'good' && <Target className="w-4 h-4 text-white m-auto" />}
                  {target.type === 'bonus' && <Star className="w-4 h-4 text-white m-auto" />}
                  {target.type === 'bad' && <Zap className="w-4 h-4 text-white m-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'results' && (
          <div className="space-y-4 text-center">
            <div className="text-6xl mb-4">
              {score >= 150 ? '🏆' : score >= 100 ? '🥇' : score >= 50 ? '🥈' : '🥉'}
            </div>
            
            <div>
              <h4 className="text-2xl font-bold text-green-400 mb-2">Game Over!</h4>
              <p className="text-xl text-white mb-4">Final Score: {score}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded space-y-2">
              <h5 className="text-yellow-400 font-bold">AI Influence Bonus:</h5>
              <p className="text-lg text-green-400">+{(getAIBonus(score) * 100).toFixed(0)}% AI Helpfulness</p>
              <p className="text-xs text-gray-400">
                {score >= 200 ? 'Legendary influence! The Plug is extremely helpful.' :
                 score >= 150 ? 'Epic influence! The Plug provides excellent advice.' :
                 score >= 100 ? 'Great influence! The Plug is very helpful.' :
                 score >= 50 ? 'Good influence! The Plug is helpful.' :
                 'Basic influence. The Plug provides standard responses.'}
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-bold"
              style={{ fontFamily: 'LemonMilk, sans-serif' }}
            >
              Apply Bonus
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInfluenceGame;