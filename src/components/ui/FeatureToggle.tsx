// src/components/ui/FeatureToggle.tsx
"use client";

import { useEffect, useState } from 'react';

interface FeatureToggleProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureToggle({ featureName, children, fallback }: FeatureToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check for feature flag in localStorage or environment
    const localStorageFlag = typeof window !== 'undefined' 
      ? localStorage.getItem(featureName) 
      : null;
    
    const envFlag = process.env[featureName];
    
    setIsEnabled(
      localStorageFlag === 'true' || 
      envFlag === 'true' || 
      false
    );
  }, [featureName]);

  return isEnabled ? children : (fallback || null);
}