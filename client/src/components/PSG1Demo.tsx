import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PSG1DemoProps {
  isEnabled: boolean;
}

export const PSG1Demo: React.FC<PSG1DemoProps> = ({ isEnabled }) => {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ x: 427, y: 240 }); // Center of 854x480

  useEffect(() => {
    if (!isEnabled) return;

    const handlePSG1Input = (event: CustomEvent) => {
      const gameActions = event.detail;
      const timestamp = new Date().toLocaleTimeString();
      
      // Track inputs for demonstration
      const inputs = [];
      if (gameActions.navigateUp) inputs.push('↑');
      if (gameActions.navigateDown) inputs.push('↓');
      if (gameActions.navigateLeft) inputs.push('←');
      if (gameActions.navigateRight) inputs.push('→');
      if (gameActions.deployCard) inputs.push('A');
      if (gameActions.cancelAction) inputs.push('B');
      if (gameActions.openMenu) inputs.push('Start');
      if (gameActions.zoomIn) inputs.push('L1');
      if (gameActions.zoomOut) inputs.push('R1');

      if (inputs.length > 0) {
        const inputString = `${timestamp}: ${inputs.join(' + ')}`;
        setCurrentInput(inputString);
        setInputHistory(prev => [inputString, ...prev.slice(0, 9)]); // Keep last 10 inputs
      }

      // Move cursor for demonstration
      setCursorPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = 5;
        
        if (gameActions.navigateUp) newY = Math.max(20, prev.y - moveSpeed);
        if (gameActions.navigateDown) newY = Math.min(460, prev.y + moveSpeed);
        if (gameActions.navigateLeft) newX = Math.max(20, prev.x - moveSpeed);
        if (gameActions.navigateRight) newX = Math.min(834, prev.x + moveSpeed);
        
        return { x: newX, y: newY };
      });
    };

    window.addEventListener('psg1-input', handlePSG1Input as EventListener);
    
    return () => {
      window.removeEventListener('psg1-input', handlePSG1Input as EventListener);
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900 to-black">
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold text-white mb-4">THC CLASH</h2>
          <p className="text-green-400 mb-4">Cannabis Card Battle Game</p>
          <p className="text-gray-300 text-sm">Enable PSG1 Console mode in settings to test controller input</p>
          <div className="mt-6 text-xs text-gray-500">
            Standard web browser mode active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-green-900 via-black to-green-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Demo Cursor */}
      <motion.div
        className="absolute w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg z-20"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          scale: currentInput ? [1, 1.5, 1] : 1
        }}
        transition={{ duration: 0.3 }}
      />

      {/* PSG1 Demo Interface */}
      <div className="absolute inset-0 flex flex-col justify-between p-8">
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            className="text-4xl font-bold text-white mb-2"
            animate={{ 
              textShadow: currentInput ? ['0 0 0px #22c55e', '0 0 20px #22c55e', '0 0 0px #22c55e'] : '0 0 0px #22c55e'
            }}
            transition={{ duration: 0.5 }}
          >
            🎮 PSG1 CONTROLLER ACTIVE
          </motion.h1>
          <p className="text-green-400 text-lg">THC CLASH - Cannabis Card Battle</p>
          <div className="mt-4 px-4 py-2 bg-black/50 rounded-lg inline-block">
            <p className="text-yellow-300 text-sm">Console Mode: 854×480 Native Resolution</p>
          </div>
        </div>

        {/* Current Input Display */}
        <div className="text-center">
          <motion.div
            className="bg-black/80 rounded-xl p-6 border border-green-400/50"
            animate={{
              scale: currentInput ? [1, 1.05, 1] : 1,
              borderColor: currentInput ? ['rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 1)', 'rgba(34, 197, 94, 0.5)'] : 'rgba(34, 197, 94, 0.5)'
            }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-white font-bold mb-2">Controller Input</h3>
            <div className="text-green-400 text-xl font-mono min-h-[28px]">
              {currentInput || 'Press any PSG1 controller button...'}
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p>Cursor Position: X:{Math.round(cursorPosition.x)} Y:{Math.round(cursorPosition.y)}</p>
            </div>
          </motion.div>
        </div>

        {/* Control Guide */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/60 rounded-lg p-4">
            <h4 className="text-white font-bold mb-2">🕹️ D-Pad Controls</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>↑↓←→ Move cursor</div>
              <div>←→ Select cards (in battle)</div>
              <div>↑↓ Navigate menus</div>
            </div>
          </div>
          
          <div className="bg-black/60 rounded-lg p-4">
            <h4 className="text-white font-bold mb-2">🎯 Action Buttons</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>A Deploy/Confirm</div>
              <div>B Cancel/Back</div>
              <div>Start Menu</div>
              <div>L1/R1 Zoom</div>
            </div>
          </div>
        </div>

        {/* Input History */}
        {inputHistory.length > 0 && (
          <div className="bg-black/40 rounded-lg p-3 max-h-32 overflow-y-auto">
            <h4 className="text-white text-sm font-bold mb-2">Recent Inputs:</h4>
            <div className="space-y-1">
              {inputHistory.map((input, index) => (
                <div 
                  key={index} 
                  className="text-green-300 text-xs font-mono"
                  style={{ opacity: 1 - (index * 0.1) }}
                >
                  {input}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-8 border border-green-400/20 rounded-full"
            style={{
              left: `${20 + i * 170}px`,
              top: `${100 + (i % 2) * 200}px`
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 10 + i * 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 3 + i, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default PSG1Demo;