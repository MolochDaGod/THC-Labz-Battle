import React, { useEffect, useCallback, useRef } from 'react';

// PSG1 Key mappings based on PlaySolana Unity SDK documentation
// PSG1 mimics Android gamepad with D-pad buttons
export interface PSG1KeyMap {
  // D-pad (directional pad)
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  
  // Face buttons (right side)
  buttonA: boolean;  // Bottom button
  buttonB: boolean;  // Right button
  buttonX: boolean;  // Left button
  buttonY: boolean;  // Top button
  
  // Shoulder buttons
  leftShoulder: boolean;   // L1
  rightShoulder: boolean;  // R1
  // Note: PSG1 does not have R2/L2 triggers
  
  // Menu buttons
  select: boolean;    // Select/Back button
  start: boolean;     // Start/Menu button
  
  // Analog sticks (if available)
  leftStickX: number;   // -1 to 1
  leftStickY: number;   // -1 to 1
  rightStickX: number;  // -1 to 1
  rightStickY: number;  // -1 to 1
  
  // Stick buttons
  leftStickButton: boolean;
  rightStickButton: boolean;
}

// Game action mappings for THC Clash
export interface GameActionMap {
  // Card game actions
  selectCard: boolean;
  deployCard: boolean;
  cancelAction: boolean;
  
  // Menu navigation
  navigateUp: boolean;
  navigateDown: boolean;
  navigateLeft: boolean;
  navigateRight: boolean;
  
  // UI actions
  openMenu: boolean;
  closeMenu: boolean;
  confirm: boolean;
  back: boolean;
  
  // Battle actions
  dragStart: boolean;
  dragEnd: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
}

interface PSG1InputSystemProps {
  isEnabled: boolean;
  onInputUpdate?: (gameActions: GameActionMap) => void;
  children: React.ReactNode;
}

export const PSG1InputSystem: React.FC<PSG1InputSystemProps> = ({
  isEnabled,
  onInputUpdate,
  children
}) => {
  const gamepadRef = useRef<Gamepad | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  
  // Convert PSG1 inputs to game actions
  const mapPSG1ToGameActions = useCallback((psg1Keys: PSG1KeyMap): GameActionMap => {
    return {
      // Card selection and deployment
      selectCard: psg1Keys.buttonA,
      deployCard: psg1Keys.buttonA,
      cancelAction: psg1Keys.buttonB,
      
      // Navigation using D-pad
      navigateUp: psg1Keys.dpadUp,
      navigateDown: psg1Keys.dpadDown,
      navigateLeft: psg1Keys.dpadLeft,
      navigateRight: psg1Keys.dpadRight,
      
      // Menu actions
      openMenu: psg1Keys.start,
      closeMenu: psg1Keys.select || psg1Keys.buttonB,
      confirm: psg1Keys.buttonA,
      back: psg1Keys.buttonB,
      
      // Battle actions
      dragStart: psg1Keys.buttonA,
      dragEnd: !psg1Keys.buttonA,
      zoomIn: psg1Keys.rightShoulder,
      zoomOut: psg1Keys.leftShoulder
    };
  }, []);
  
  // Parse gamepad state to PSG1 key map
  const parseGamepadToPSG1 = useCallback((gamepad: Gamepad): PSG1KeyMap => {
    const buttons = gamepad.buttons;
    const axes = gamepad.axes;
    
    return {
      // D-pad buttons (usually buttons 12-15 on standard gamepad)
      dpadUp: buttons[12]?.pressed || false,
      dpadDown: buttons[13]?.pressed || false,
      dpadLeft: buttons[14]?.pressed || false,
      dpadRight: buttons[15]?.pressed || false,
      
      // Face buttons (A=0, B=1, X=2, Y=3)
      buttonA: buttons[0]?.pressed || false,
      buttonB: buttons[1]?.pressed || false,
      buttonX: buttons[2]?.pressed || false,
      buttonY: buttons[3]?.pressed || false,
      
      // Shoulder buttons (L1=4, R1=5)
      leftShoulder: buttons[4]?.pressed || false,
      rightShoulder: buttons[5]?.pressed || false,
      
      // Menu buttons (Select=8, Start=9)
      select: buttons[8]?.pressed || false,
      start: buttons[9]?.pressed || false,
      
      // Analog sticks
      leftStickX: axes[0] || 0,
      leftStickY: axes[1] || 0,
      rightStickX: axes[2] || 0,
      rightStickY: axes[3] || 0,
      
      // Stick buttons (L3=10, R3=11)
      leftStickButton: buttons[10]?.pressed || false,
      rightStickButton: buttons[11]?.pressed || false,
    };
  }, []);
  
  // Input polling loop
  const pollGamepadInput = useCallback(() => {
    if (!isEnabled) return;
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use first gamepad
    
    if (gamepad) {
      gamepadRef.current = gamepad;
      
      // Convert gamepad input to PSG1 format
      const psg1Keys = parseGamepadToPSG1(gamepad);
      
      // Map PSG1 keys to game actions
      const gameActions = mapPSG1ToGameActions(psg1Keys);
      
      // Only call update if something changed
      const currentTime = Date.now();
      if (currentTime - lastUpdateRef.current > 16) { // ~60fps
        onInputUpdate?.(gameActions);
        lastUpdateRef.current = currentTime;
      }
    }
    
    // Continue polling
    animationFrameRef.current = requestAnimationFrame(pollGamepadInput);
  }, [isEnabled, parseGamepadToPSG1, mapPSG1ToGameActions, onInputUpdate]);
  
  // Initialize PSG1 input system
  useEffect(() => {
    if (!isEnabled) {
      // Stop polling if disabled
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    
    console.log('🎮 PSG1 Input System: Initializing...');
    
    // Start polling for gamepad input
    pollGamepadInput();
    
    // Gamepad connection events
    const handleGamepadConnected = (event: GamepadEvent) => {
      console.log('🎮 PSG1 Gamepad connected:', event.gamepad);
      gamepadRef.current = event.gamepad;
    };
    
    const handleGamepadDisconnected = (event: GamepadEvent) => {
      console.log('🎮 PSG1 Gamepad disconnected:', event.gamepad);
      if (gamepadRef.current?.index === event.gamepad.index) {
        gamepadRef.current = null;
      }
    };
    
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
    
    // Check for already connected gamepads
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        console.log('🎮 PSG1 Found existing gamepad:', gamepad);
        gamepadRef.current = gamepad;
        break;
      }
    }
    
    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, [isEnabled, pollGamepadInput]);
  
  // Add keyboard fallback for testing PSG1 controls
  useEffect(() => {
    if (!isEnabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Map keyboard keys to PSG1 actions for testing
      const keyToPSG1: Record<string, Partial<PSG1KeyMap>> = {
        'ArrowUp': { dpadUp: true },
        'ArrowDown': { dpadDown: true },
        'ArrowLeft': { dpadLeft: true },
        'ArrowRight': { dpadRight: true },
        'KeyZ': { buttonA: true },
        'KeyX': { buttonB: true },
        'KeyC': { buttonX: true },
        'KeyV': { buttonY: true },
        'KeyQ': { leftShoulder: true },
        'KeyE': { rightShoulder: true },
        'Enter': { start: true },
        'Escape': { select: true }
      };
      
      const psg1Keys = keyToPSG1[event.code];
      if (psg1Keys) {
        // Create full PSG1 state with only this key pressed
        const fullPSG1State: PSG1KeyMap = {
          dpadUp: false, dpadDown: false, dpadLeft: false, dpadRight: false,
          buttonA: false, buttonB: false, buttonX: false, buttonY: false,
          leftShoulder: false, rightShoulder: false,
          select: false, start: false,
          leftStickX: 0, leftStickY: 0, rightStickX: 0, rightStickY: 0,
          leftStickButton: false, rightStickButton: false,
          ...psg1Keys
        };
        
        const gameActions = mapPSG1ToGameActions(fullPSG1State);
        onInputUpdate?.(gameActions);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, mapPSG1ToGameActions, onInputUpdate]);
  
  return (
    <div className={`psg1-input-container ${isEnabled ? 'psg1-enabled' : ''}`}>
      {isEnabled && (
        <div className="fixed top-4 right-4 bg-black/80 text-green-400 px-3 py-2 rounded-lg text-sm font-mono z-50">
          🎮 PSG1 Controller Active
          {gamepadRef.current && (
            <div className="text-xs text-green-300 mt-1">
              {gamepadRef.current.id}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default PSG1InputSystem;