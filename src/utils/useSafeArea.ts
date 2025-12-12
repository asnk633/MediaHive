'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to get safe area insets for mobile devices
 * Returns safe area top and bottom offsets
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0
  });

  useEffect(() => {
    // Function to update CSS variables and state
    const updateSafeArea = () => {
      // Try to get values from CSS env variables first
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')) || 0;
      const bottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom')) || 0;
      
      setSafeArea({ top, bottom });
      
      // Also update CSS variables for backward compatibility
      document.documentElement.style.setProperty('--safe-area-top', `${top}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${bottom}px`);
    };

    // Set initial values
    updateSafeArea();

    // Listen for orientation changes and window resizes
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * Hook to get safe top offset
 */
export function useSafeTopOffset() {
  const { top } = useSafeArea();
  return top;
}

/**
 * Hook to get safe bottom offset
 */
export function useSafeBottomOffset() {
  const { bottom } = useSafeArea();
  return bottom;
}