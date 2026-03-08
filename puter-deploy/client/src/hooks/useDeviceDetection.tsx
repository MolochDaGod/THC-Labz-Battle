import { useState, useEffect } from 'react';
import { isMobile, isTablet, isDesktop, isBrowser, osName, osVersion, browserName, browserVersion } from 'react-device-detect';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isBrowser: boolean;
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
  isTouchDevice: boolean;
  isHighDPI: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile,
    isTablet,
    isDesktop,
    isBrowser,
    osName,
    osVersion,
    browserName,
    browserVersion,
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : true,
    isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
    isHighDPI: typeof window !== 'undefined' ? window.devicePixelRatio > 1.5 : false,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isBrowser,
        osName,
        osVersion,
        browserName,
        browserVersion,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        isLandscape: window.innerWidth > window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth,
        isTouchDevice: 'ontouchstart' in window,
        isHighDPI: window.devicePixelRatio > 1.5,
      });
    };

    // Update on resize and orientation change
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    // Initial update
    updateDeviceInfo();

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

export default useDeviceDetection;