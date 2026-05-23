// src/components/ui/FeatureToggle.tsx
"use client";

import React, { useEffect, useState } from 'react';

interface FeatureToggleProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function FeatureToggleComponent({ featureName, children, fallback }: FeatureToggleProps) {
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

const FeatureToggle = React.memo(FeatureToggleComponent);
export default FeatureToggle;
