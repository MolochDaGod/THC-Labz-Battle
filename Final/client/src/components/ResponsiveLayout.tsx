import React from 'react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { cn } from '../lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  const device = useDeviceDetection();

  // Apply device-specific classes
  const layoutClasses = cn(
    'w-full h-full relative',
    {
      // Mobile-specific styles
      'mobile-layout': device.isMobile,
      'touch-device': device.isTouchDevice,
      'high-dpi': device.isHighDPI,
      
      // Tablet-specific styles
      'tablet-layout': device.isTablet,
      
      // Desktop-specific styles
      'desktop-layout': device.isDesktop,
      
      // Orientation-specific styles
      'landscape-mode': device.isLandscape,
      'portrait-mode': device.isPortrait,
      
      // Screen size specific
      'small-screen': device.screenWidth < 375,
      'medium-screen': device.screenWidth >= 375 && device.screenWidth < 768,
      'large-screen': device.screenWidth >= 768,
    },
    className
  );

  // Log device info for debugging
  React.useEffect(() => {
    console.log('📱 Device Detection:', {
      type: device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop',
      os: `${device.osName} ${device.osVersion}`,
      browser: `${device.browserName} ${device.browserVersion}`,
      screen: `${device.screenWidth}x${device.screenHeight}`,
      dpr: device.devicePixelRatio,
      orientation: device.isLandscape ? 'Landscape' : 'Portrait',
      touch: device.isTouchDevice ? 'Yes' : 'No'
    });
  }, [device]);

  return (
    <div className={layoutClasses} data-device-type={device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop'}>
      {children}
    </div>
  );
}