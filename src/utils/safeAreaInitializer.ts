/**
 * Safe Area Initializer
 * 
 * This script runs before React hydration to set CSS variables for safe areas.
 * It computes actual safe area values using multiple methods to ensure compatibility
 * across different browsers and environments (especially Android WebView).
 */

if (typeof window !== 'undefined') {
  (function () {
    try {
      // Function to get safe area values
      function getSafeAreaValue(property: string): number {
        // Try to get value from CSS env variable first
        try {
          const value = getComputedStyle(document.documentElement).getPropertyValue(property);
          if (value && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              return numValue;
            }
          }
        } catch (e) {
          // Ignore errors
        }

        // Fallback: Try to compute from window.visualViewport if available
        if (window.visualViewport) {
          switch (property) {
            case '--safe-area-top':
              // Approximate top safe area by comparing viewport offset to page
              return window.visualViewport.offsetTop || 0;
            case '--safe-area-bottom':
              // Approximate bottom safe area
              const viewportHeight = window.visualViewport.height;
              const windowHeight = window.innerHeight;
              return Math.max(0, windowHeight - viewportHeight - (window.visualViewport.offsetTop || 0));
          }
        }

        // Final fallback: return 0
        return 0;
      }

      // Set CSS variables
      const safeAreaTop = getSafeAreaValue('--safe-area-top');
      const safeAreaBottom = getSafeAreaValue('--safe-area-bottom');

      document.documentElement.style.setProperty('--computed-safe-top', `${safeAreaTop}px`);
      document.documentElement.style.setProperty('--computed-safe-bottom', `${safeAreaBottom}px`);

      // Also set the original variables for backward compatibility
      document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    } catch (e) {
      // Ensure we don't break the page if something goes wrong
      console.warn('Safe area initializer failed:', e);
    }
  })();
}
