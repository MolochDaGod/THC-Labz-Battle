import React, { useEffect, useState, useRef } from 'react';
import { GameActionMap } from './PSG1InputSystem';

interface PSG1BattleControllerProps {
  isEnabled: boolean;
  onCardSelect?: (cardIndex: number) => void;
  onCardDeploy?: (x: number, y: number) => void;
  onMenuToggle?: () => void;
  children: React.ReactNode;
}

export const PSG1BattleController: React.FC<PSG1BattleControllerProps> = ({
  isEnabled,
  onCardSelect,
  onCardDeploy,
  onMenuToggle,
  children
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 400, y: 240 }); // Center of 854x480
  const [isDragging, setIsDragging] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const lastInputRef = useRef<GameActionMap>();

  // PSG1 Input Event Listener
  useEffect(() => {
    if (!isEnabled) return;

    const handlePSG1Input = (event: CustomEvent<GameActionMap>) => {
      const gameActions = event.detail;
      const lastInput = lastInputRef.current;
      
      // Card selection with D-pad left/right
      if (gameActions.navigateLeft && !lastInput?.navigateLeft) {
        const newIndex = Math.max(0, selectedCardIndex - 1);
        setSelectedCardIndex(newIndex);
        onCardSelect?.(newIndex);
        console.log('🎮 PSG1: Selected card', newIndex);
      }
      
      if (gameActions.navigateRight && !lastInput?.navigateRight) {
        const newIndex = Math.min(3, selectedCardIndex + 1); // Max 4 cards in hand
        setSelectedCardIndex(newIndex);
        onCardSelect?.(newIndex);
        console.log('🎮 PSG1: Selected card', newIndex);
      }
      
      // Cursor movement with D-pad or analog stick
      setCursorPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = 8;
        
        if (gameActions.navigateUp && !isDragging) {
          newY = Math.max(0, prev.y - moveSpeed);
          setShowCursor(true);
        }
        if (gameActions.navigateDown && !isDragging) {
          newY = Math.min(480, prev.y + moveSpeed);
          setShowCursor(true);
        }
        if (gameActions.navigateLeft && isDragging) {
          newX = Math.max(0, prev.x - moveSpeed);
          setShowCursor(true);
        }
        if (gameActions.navigateRight && isDragging) {
          newX = Math.min(854, prev.x + moveSpeed);
          setShowCursor(true);
        }
        
        return { x: newX, y: newY };
      });
      
      // Card deployment with A button
      if (gameActions.deployCard && !lastInput?.deployCard) {
        if (!isDragging) {
          setIsDragging(true);
          setShowCursor(true);
          console.log('🎮 PSG1: Started dragging card', selectedCardIndex);
        } else {
          // Deploy card at cursor position
          onCardDeploy?.(cursorPosition.x, cursorPosition.y);
          setIsDragging(false);
          setShowCursor(false);
          console.log('🎮 PSG1: Deployed card at', cursorPosition);
        }
      }
      
      // Cancel action with B button
      if (gameActions.cancelAction && !lastInput?.cancelAction) {
        setIsDragging(false);
        setShowCursor(false);
        console.log('🎮 PSG1: Cancelled action');
      }
      
      // Menu toggle with Start button
      if (gameActions.openMenu && !lastInput?.openMenu) {
        onMenuToggle?.();
        console.log('🎮 PSG1: Menu toggled');
      }
      
      lastInputRef.current = gameActions;
    };

    window.addEventListener('psg1-input', handlePSG1Input as EventListener);
    
    return () => {
      window.removeEventListener('psg1-input', handlePSG1Input as EventListener);
    };
  }, [isEnabled, selectedCardIndex, cursorPosition, isDragging, onCardSelect, onCardDeploy, onMenuToggle]);

  // Auto-hide cursor after inactivity
  useEffect(() => {
    if (!showCursor) return;

    const timeout = setTimeout(() => {
      if (!isDragging) {
        setShowCursor(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [showCursor, isDragging]);

  return (
    <div className="relative w-full h-full">
      {children}
      
      {/* PSG1 UI Overlay */}
      {isEnabled && (
        <>
          {/* Virtual Cursor for PSG1 */}
          {showCursor && (
            <div
              className={`absolute pointer-events-none z-50 transition-all duration-150 ${
                isDragging ? 'animate-pulse' : ''
              }`}
              style={{
                left: `${cursorPosition.x}px`,
                top: `${cursorPosition.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isDragging 
                  ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50' 
                  : 'bg-green-500 border-green-300 shadow-lg shadow-green-500/50'
              }`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          )}
          
          {/* Card Selection Indicator */}
          <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg z-40">
            <div className="text-xs font-bold mb-1">PSG1 Controls</div>
            <div className="text-xs space-y-1">
              <div>Selected Card: {selectedCardIndex + 1}</div>
              <div className="flex gap-2 text-xs opacity-70">
                <span>←→ Select</span>
                <span>A Deploy</span>
                <span>B Cancel</span>
              </div>
            </div>
          </div>
          
          {/* Drag State Indicator */}
          {isDragging && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-lg z-40 animate-bounce">
              <div className="text-sm font-bold">🎮 Deploying Card {selectedCardIndex + 1}</div>
              <div className="text-xs">Use D-pad to position, A to deploy, B to cancel</div>
            </div>
          )}
          
          {/* Control Guide */}
          <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs z-40">
            <div className="font-bold mb-1">PSG1 Guide</div>
            <div className="space-y-1 opacity-80">
              <div>D-pad: Navigate/Move</div>
              <div>A: Select/Deploy</div>
              <div>B: Cancel/Back</div>
              <div>Start: Menu</div>
              <div>L1/R1: Zoom</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PSG1BattleController;