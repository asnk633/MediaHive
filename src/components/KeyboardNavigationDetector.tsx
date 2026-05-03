'use client';

import { useEffect } from 'react';
import { enableKeyboardNavigationDetection } from '@/utils/a11y';

export function KeyboardNavigationDetector() {
  useEffect(() => {
    // Enable keyboard navigation detection
    enableKeyboardNavigationDetection();
  }, []);

  return null;
}
