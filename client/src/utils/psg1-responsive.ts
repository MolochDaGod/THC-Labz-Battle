/**
 * PSG1 Responsive Utilities
 * Optimizes UI elements for PSG1 console emulator mode
 */

export interface PSG1Dimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export const PSG1_SCREEN: PSG1Dimensions = {
  width: 1024,
  height: 768,
  aspectRatio: 1.33
};

/**
 * Detects if the app is running in PSG1 emulator mode
 */
export const isPSG1Mode = (): boolean => {
  // Check for PSG1 emulator container
  return document.querySelector('.psg1-emulator-container') !== null;
};

/**
 * Gets optimal dimensions for game components in PSG1 mode
 */
export const getPSG1GameDimensions = () => {
  if (!isPSG1Mode()) {
    return {
      gameWidth: window.innerWidth,
      gameHeight: window.innerHeight,
      canvasWidth: 800,
      canvasHeight: 600,
      scale: 1
    };
  }

  // PSG1 optimized dimensions
  return {
    gameWidth: PSG1_SCREEN.width,
    gameHeight: PSG1_SCREEN.height,
    canvasWidth: 960, // Leave margin for UI
    canvasHeight: 640, // Optimized for game area
    scale: 1.2 // Slightly larger for better visibility
  };
};

/**
 * Gets PSG1-optimized card dimensions
 */
export const getPSG1CardDimensions = () => {
  if (!isPSG1Mode()) {
    return {
      cardWidth: 80,
      cardHeight: 100,
      spacing: 8
    };
  }

  return {
    cardWidth: 90,  // Larger cards for console viewing
    cardHeight: 110,
    spacing: 12
  };
};

/**
 * Gets PSG1-optimized UI scaling
 */
export const getPSG1UIScale = () => {
  return isPSG1Mode() ? 1.1 : 1.0;
};

/**
 * PSG1-optimized font sizes
 */
export const getPSG1FontSizes = () => {
  const baseScale = isPSG1Mode() ? 1.15 : 1.0;
  
  return {
    small: `${0.75 * baseScale}rem`,
    medium: `${0.875 * baseScale}rem`,
    large: `${1.0 * baseScale}rem`,
    xlarge: `${1.125 * baseScale}rem`
  };
};

/**
 * Hook for PSG1-responsive values
 */
export const usePSG1Responsive = () => {
  const isEmulator = isPSG1Mode();
  
  return {
    isEmulator,
    dimensions: getPSG1GameDimensions(),
    cardDimensions: getPSG1CardDimensions(),
    uiScale: getPSG1UIScale(),
    fontSizes: getPSG1FontSizes()
  };
};