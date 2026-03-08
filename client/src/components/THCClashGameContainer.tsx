import React, { useState, useEffect } from 'react';
import THCClashCardGame from './THCClashCardGame';
import { Crown, Gamepad2, Smartphone, Monitor, Wifi } from 'lucide-react';

interface GameContainerProps {
  onBack: () => void;
  playerNFTs: any[];
}

export const THCClashGameContainer: React.FC<GameContainerProps> = ({
  onBack,
  playerNFTs
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Detect device type and orientation
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
      
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.log('Fullscreen not supported');
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.log('Exit fullscreen failed');
      }
    }
  };

  // Mobile landscape recommendation
  const showLandscapeHint = deviceType === 'mobile' && orientation === 'portrait';

  return (
    <div className={`
      ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} 
      bg-gradient-to-br from-gray-900 via-green-900 to-gray-900
      ${deviceType === 'mobile' ? 'overflow-hidden' : ''}
    `}>
      {/* Game Header - Optimized for all devices */}
      <div className={`
        bg-gradient-to-r from-green-800 to-green-600 
        ${deviceType === 'mobile' ? 'p-2' : 'p-4'} 
        flex justify-between items-center border-b-2 border-green-500
        ${isFullscreen ? 'relative z-10' : ''}
      `}>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Crown className="text-yellow-400 w-6 h-6 md:w-8 md:h-8" />
          <div>
            <h1 className="text-white font-bold text-lg md:text-2xl">THC CLASH</h1>
            <p className="text-green-200 text-xs md:text-sm">
              {playerNFTs.length} NFTs • {deviceType.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Device indicators */}
          <div className="flex items-center space-x-2">
            {deviceType === 'mobile' && <Smartphone className="text-green-200 w-4 h-4" />}
            {deviceType === 'tablet' && <Monitor className="text-green-200 w-4 h-4" />}
            {deviceType === 'desktop' && <Monitor className="text-green-200 w-4 h-4" />}
            <Wifi className="text-green-400 w-4 h-4" />
          </div>

          {/* Fullscreen toggle for mobile */}
          {deviceType !== 'desktop' && (
            <button
              onClick={toggleFullscreen}
              className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {isFullscreen ? 'Exit' : 'Full'}
            </button>
          )}

          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Landscape hint for mobile users */}
      {showLandscapeHint && !isFullscreen && (
        <div className="bg-yellow-600 text-black p-3 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <Smartphone className="w-4 h-4 transform rotate-90" />
            <span>Rotate your device for the best gameplay experience!</span>
          </div>
        </div>
      )}

      {/* Game Content Container */}
      <div className={`
        ${showLandscapeHint && !isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-80px)]'}
        ${isFullscreen ? 'h-[calc(100vh-60px)]' : ''}
        relative overflow-hidden
      `}>
        {/* Mobile-optimized controls hint */}
        {deviceType === 'mobile' && (
          <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none">
            <div className="bg-black/50 text-white text-xs p-2 rounded text-center">
              Tap cards to select • Tap battlefield to deploy • Pinch to zoom (coming soon)
            </div>
          </div>
        )}

        {/* Main Game Component */}
        <THCClashCardGame
          onBack={onBack}
          playerNFTs={playerNFTs}
        />

        {/* Mobile game overlay controls */}
        {deviceType === 'mobile' && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="flex justify-between items-end">
              {/* Quick stats */}
              <div className="bg-black/70 text-white p-2 rounded text-xs">
                <div className="flex items-center space-x-2">
                  <Gamepad2 className="w-3 h-3" />
                  <span>THC CLASH</span>
                </div>
              </div>

              {/* Performance indicator */}
              <div className="bg-green-600/80 text-white p-2 rounded text-xs">
                <span>READY</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom safe area */}
      {deviceType === 'mobile' && (
        <div className="h-4 bg-gradient-to-r from-green-800 to-green-600" />
      )}
    </div>
  );
};

export default THCClashGameContainer;