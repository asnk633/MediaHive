'use client';

import { useEffect } from 'react';

function setStylePropertyIfChanged(name: string, value: string) {
  try {
    const root = document.documentElement;
    const current = root.style.getPropertyValue(name);
    if (current !== value) {
      root.style.setProperty(name, value);
    }
  } catch (e) {
    // Suppress errors silently in production
  }
}

function safeRequestAnimationFrame(callback: () => void): number {
  if (typeof document !== 'undefined' && document.hidden) {
    return window.setTimeout(callback, 16) as any;
  }
  return window.requestAnimationFrame(callback);
}

function safeCancelAnimationFrame(id: number) {
  if (typeof document !== 'undefined' && document.hidden) {
    window.clearTimeout(id);
    return;
  }
  window.cancelAnimationFrame(id);
}

/**
 * MobileViewportSafety
 * 
 * Handles dynamic viewport height and keyboard offset tracking.
 * This ensures that fixed elements like BottomNav and FAB respond correctly
 * to the mobile keyboard appearing/disappearing.
 */
export function MobileViewportSafety() {
  useEffect(() => {
    let resizeRafId: number | null = null;
    let visualViewportRafId: number | null = null;

    const setViewportHeight = () => {
      if (resizeRafId !== null) {
        safeCancelAnimationFrame(resizeRafId);
      }
      resizeRafId = safeRequestAnimationFrame(() => {
        resizeRafId = null;
        const vh = window.innerHeight;
        setStylePropertyIfChanged('--viewport-height', `${vh}px`);
      });
    };

    const handleVisualViewportChange = () => {
      if (!window.visualViewport) return;

      if (visualViewportRafId !== null) {
        safeCancelAnimationFrame(visualViewportRafId);
      }

      visualViewportRafId = safeRequestAnimationFrame(() => {
        visualViewportRafId = null;
        if (!window.visualViewport) return;

        const vv = window.visualViewport;
        const viewportHeight = vv.height;

        // Calculate keyboard height approx
        const keyboardHeight = Math.max(0, window.innerHeight - viewportHeight);

        setStylePropertyIfChanged('--keyboard-offset', `${keyboardHeight}px`);
        setStylePropertyIfChanged('--viewport-height', `${viewportHeight}px`);
        setStylePropertyIfChanged('--safe-bottom', 'env(safe-area-inset-bottom)');
      });
    };

    // Initial set
    setViewportHeight();
    handleVisualViewportChange();

    // Listen for changes
    window.addEventListener('resize', setViewportHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
      if (resizeRafId !== null) {
        safeCancelAnimationFrame(resizeRafId);
      }
      if (visualViewportRafId !== null) {
        safeCancelAnimationFrame(visualViewportRafId);
      }
    };
  }, []);

  return null;
}
