import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PSG1InputSystem, { GameActionMap } from './PSG1InputSystem';

interface PSG1EmulatorProps {
  children: React.ReactNode;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const PSG1Emulator: React.FC<PSG1EmulatorProps> = ({ 
  children, 
  isEnabled, 
  onToggle 
}) => {
  const [deviceScale, setDeviceScale] = useState(1);
  const [currentInputs, setCurrentInputs] = useState<GameActionMap | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());
  
  // Handle PSG1 input updates
  const handleInputUpdate = (gameActions: GameActionMap) => {
    setCurrentInputs(gameActions);
    
    // Dispatch custom events for game to listen to
    const inputEvent = new CustomEvent('psg1-input', {
      detail: gameActions
    });
    window.dispatchEvent(inputEvent);
  };

  // Handle virtual button press
  const handleButtonPress = (buttonName: string) => {
    setPressedButtons(prev => new Set(prev).add(buttonName));
    
    // Create simulated input event
    const mockGameActions: GameActionMap = {
      selectCard: buttonName === 'A',
      deployCard: buttonName === 'A',
      cancelAction: buttonName === 'B',
      navigateUp: buttonName === 'dpadUp',
      navigateDown: buttonName === 'dpadDown', 
      navigateLeft: buttonName === 'dpadLeft',
      navigateRight: buttonName === 'dpadRight',
      openMenu: buttonName === 'start',
      closeMenu: buttonName === 'select',
      confirm: buttonName === 'A',
      back: buttonName === 'B',
      dragStart: buttonName === 'A',
      dragEnd: false,
      zoomIn: buttonName === 'R1',
      zoomOut: buttonName === 'L1'
    };
    
    handleInputUpdate(mockGameActions);
    
    // Auto-release button after short press
    setTimeout(() => {
      setPressedButtons(prev => {
        const next = new Set(prev);
        next.delete(buttonName);
        return next;
      });
    }, 150);
  };

  // Handle mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (!isEnabled) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    setScrollY(prev => {
      const newScrollY = prev + delta * 0.5;
      // Limit scroll range
      return Math.max(-200, Math.min(200, newScrollY));
    });
  };

  useEffect(() => {
    const calculateScale = () => {
      if (!isEnabled) return;
      
      // Enhanced PSG1 console screen dimensions - optimized for THC CLASH
      const psg1Width = 1024;  // Wider for better game visibility
      const psg1Height = 900; // Extended height for full gameboard and hand visibility
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate scale to fit enhanced PSG1 dimensions in current window
      // Leave space for controller areas (20% on each side)
      const availableWidth = windowWidth * 0.6; // 60% for screen, 40% for controllers
      const availableHeight = windowHeight * 0.85; // 85% for screen, 15% for console details
      
      const scaleX = availableWidth / psg1Width;
      const scaleY = availableHeight / psg1Height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      setDeviceScale(scale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [isEnabled]);

  if (!isEnabled) {
    return (
      <PSG1InputSystem isEnabled={false} onInputUpdate={handleInputUpdate}>
        {children}
      </PSG1InputSystem>
    );
  }

  return (
    <PSG1InputSystem isEnabled={isEnabled} onInputUpdate={handleInputUpdate}>
      <div 
        className="psg1-emulator-container"
        onWheel={handleWheel}
      >
      {/* PSG1 Console Frame */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center overflow-hidden">
        
        {/* PSG1 Console Housing - Increased height by 20px */}
        <div className="relative w-full h-full max-w-7xl bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl border-4 border-gray-600 p-8" style={{ maxHeight: 'calc(100vh + 120px)' }}>
          
          {/* Console Top Panel */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-700 px-6 py-2 rounded-full border border-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-xs">PSG1 CONSOLE</span>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>

          {/* Main Console Container */}
          <div className="flex items-center justify-center w-full h-full relative mt-8">
          
          {/* Left Controller Side */}
          <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-gray-700 to-gray-800 rounded-2xl border border-gray-600 shadow-inner mx-4">
            {/* D-Pad */}
            <div className="relative mb-8">
              <div className="text-white text-xs mb-2 text-center">D-PAD</div>
              <div className="relative w-24 h-24">
                {/* Up */}
                <motion.button
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-8 rounded-t-lg ${
                    pressedButtons.has('dpadUp') ? 'bg-blue-500' : 'bg-gray-600'
                  } border border-gray-400 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('dpadUp')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  ↑
                </motion.button>
                
                {/* Down */}
                <motion.button
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-8 rounded-b-lg ${
                    pressedButtons.has('dpadDown') ? 'bg-blue-500' : 'bg-gray-600'
                  } border border-gray-400 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('dpadDown')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  ↓
                </motion.button>
                
                {/* Left */}
                <motion.button
                  className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-6 rounded-l-lg ${
                    pressedButtons.has('dpadLeft') ? 'bg-blue-500' : 'bg-gray-600'
                  } border border-gray-400 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('dpadLeft')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  ←
                </motion.button>
                
                {/* Right */}
                <motion.button
                  className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-6 rounded-r-lg ${
                    pressedButtons.has('dpadRight') ? 'bg-blue-500' : 'bg-gray-600'
                  } border border-gray-400 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('dpadRight')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  →
                </motion.button>
                
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-800 border border-gray-400 rounded"></div>
              </div>
            </div>

            {/* Left Shoulder */}
            <motion.button
              className={`w-16 h-8 rounded-lg ${
                pressedButtons.has('L1') ? 'bg-yellow-500' : 'bg-gray-600'
              } border border-gray-400 flex items-center justify-center text-white text-xs font-bold mb-4 origin-center`}
              onMouseDown={() => handleButtonPress('L1')}
              whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
              transition={{ duration: 0.1 }}
              style={{ transformOrigin: 'center center' }}
            >
              L1
            </motion.button>

            {/* Select Button */}
            <motion.button
              className={`w-12 h-6 rounded-lg ${
                pressedButtons.has('select') ? 'bg-gray-400' : 'bg-gray-700'
              } border border-gray-500 flex items-center justify-center text-white text-xs origin-center`}
              onMouseDown={() => handleButtonPress('select')}
              whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
              transition={{ duration: 0.1 }}
              style={{ transformOrigin: 'center center' }}
            >
              SELECT
            </motion.button>
          </div>

          {/* Console Bezel - Center Screen */}
          <div className="relative p-8 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-3xl shadow-2xl mx-4 border-2 border-gray-500">
            {/* Screen Bezel */}
            <div className="bg-black p-4 rounded-2xl shadow-inner border-2 border-gray-900">
              {/* Screen Container */}
              <div 
                className="relative bg-black rounded-lg overflow-hidden shadow-inner border border-gray-800"
                style={{
                  width: `${1024 * deviceScale}px`,
                  height: `${900 * deviceScale}px`,
                  maxWidth: '70vw',
                  maxHeight: '85vh'
                }}
              >
              {/* Scanlines Effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black to-transparent opacity-5 bg-repeat-y bg-scanlines"></div>
              
              {/* CRT Screen Curve */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black opacity-20"></div>
              
              {/* Game Content with scroll offset - Optimized for PSG1 */}
              <div 
                className="w-full h-full transform origin-top-left transition-transform duration-100"
                style={{
                  transform: `scale(${deviceScale}) translateY(${scrollY}px)`,
                  width: '1024px',
                  height: '900px'
                }}
              >
                {children}
              </div>
            </div>
          
            {/* Screen Status Panel */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gray-800 px-4 py-1 rounded-full border border-gray-600">
              <div className="flex items-center space-x-3 text-xs">
                {/* Resolution Indicator */}
                <div className="text-green-400 font-mono">1024×900</div>
                
                {/* Scroll Indicator */}
                <div className="text-blue-400">
                  Y:{scrollY.toFixed(0)}
                </div>
                
                {/* Scale Indicator */}
                <div className="text-yellow-400">
                  {(deviceScale * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Right Controller Side */}
          <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-b from-gray-700 to-gray-800 rounded-2xl border border-gray-600 shadow-inner mx-4">
            {/* Face Buttons */}
            <div className="relative mb-8">
              <div className="text-white text-xs mb-2 text-center">ACTION</div>
              <div className="relative w-24 h-24">
                {/* Y Button (Top) */}
                <motion.button
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full ${
                    pressedButtons.has('Y') ? 'bg-yellow-400' : 'bg-yellow-600'
                  } border-2 border-yellow-300 flex items-center justify-center text-black text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('Y')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  Y
                </motion.button>
                
                {/* B Button (Right) */}
                <motion.button
                  className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full ${
                    pressedButtons.has('B') ? 'bg-red-400' : 'bg-red-600'
                  } border-2 border-red-300 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('B')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  B
                </motion.button>
                
                {/* A Button (Bottom) */}
                <motion.button
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full ${
                    pressedButtons.has('A') ? 'bg-green-400' : 'bg-green-600'
                  } border-2 border-green-300 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('A')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  A
                </motion.button>
                
                {/* X Button (Left) */}
                <motion.button
                  className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full ${
                    pressedButtons.has('X') ? 'bg-blue-400' : 'bg-blue-600'
                  } border-2 border-blue-300 flex items-center justify-center text-white text-xs font-bold origin-center`}
                  onMouseDown={() => handleButtonPress('X')}
                  whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ transformOrigin: 'center center' }}
                >
                  X
                </motion.button>
              </div>
            </div>

            {/* Right Shoulder */}
            <motion.button
              className={`w-16 h-8 rounded-lg ${
                pressedButtons.has('R1') ? 'bg-yellow-500' : 'bg-gray-600'
              } border border-gray-400 flex items-center justify-center text-white text-xs font-bold mb-4 origin-center`}
              onMouseDown={() => handleButtonPress('R1')}
              whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
              transition={{ duration: 0.1 }}
              style={{ transformOrigin: 'center center' }}
            >
              R1
            </motion.button>

            {/* Start Button */}
            <motion.button
              className={`w-12 h-6 rounded-lg ${
                pressedButtons.has('start') ? 'bg-gray-400' : 'bg-gray-700'
              } border border-gray-500 flex items-center justify-center text-white text-xs origin-center`}
              onMouseDown={() => handleButtonPress('start')}
              whileTap={{ scale: 0.95, originX: 0.5, originY: 0.5 }}
              transition={{ duration: 0.1 }}
              style={{ transformOrigin: 'center center' }}
            >
              START
            </motion.button>
          </div>

          </div>

          {/* Console Bottom Panel */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-6 bg-gray-700 px-8 py-3 rounded-full border border-gray-500">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">SYSTEM READY</span>
            </div>
            
            {/* Game Mode */}
            <div className="text-cyan-400 text-xs font-mono">THC-CLASH.PSG</div>
            
            {/* Exit Console */}
            <motion.button
              onClick={() => onToggle(false)}
              className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full transition-colors border border-red-400"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⏏ EXIT
            </motion.button>
          </div>

        </div>
      </div>
      
      <style>{`
        .bg-scanlines {
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.03) 2px,
            rgba(0, 255, 0, 0.03) 4px
          );
        }
        
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, transparent 0%, transparent 70%, rgba(0,0,0,0.2) 100%);
        }
      `}</style>
      </div>
    </PSG1InputSystem>
  );
};

// PSG1 Settings Component
export const PSG1Settings: React.FC<{
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}> = ({ isEnabled, onToggle }) => {
  return (
    <div className="bg-gray-800/90 rounded-lg p-4 border border-gray-700">
      <h3 className="text-white font-bold mb-3 flex items-center">
        🎮 PSG1 Console Emulator
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">
            Enable PSG1 Console Mode
          </span>
          <motion.button
            onClick={() => onToggle(!isEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isEnabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
              animate={{
                x: isEnabled ? 20 : 0
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
        
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded border border-gray-600"
          >
            <p className="mb-2">
              <strong>PSG1 Console Mode Active:</strong>
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Screen: 1024×768 enhanced resolution</li> 
              <li>• Controls: Virtual gamepad with clickable buttons</li>
              <li>• Scrolling: Mouse wheel to scroll game view</li>
              <li>• Performance: Optimized for PSG1 hardware</li>
              <li>• Display: Enhanced CRT-style visual effects</li>
              <li>• Layout: Proper PSG1 console housing</li>
              <li>• D-Pad: Navigate menus and UI</li>
              <li>• A Button: Select/Deploy cards</li>
              <li>• B Button: Cancel/Back</li>
              <li>• L1/R1: Zoom controls</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PSG1Emulator;