// src/components/FeatureFlagProvider.tsx
// Feature flag context provider for the frontend

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeatureFlag, isFeatureEnabled, getAllFeatureFlags } from '@/app/featureFlags';

interface FeatureFlagContextType {
  flags: Record<FeatureFlag, boolean>;
  isFeatureEnabled: (feature: FeatureFlag) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>(getAllFeatureFlags());

  const checkFeatureEnabled = (feature: FeatureFlag): boolean => {
    return flags[feature] ?? false;
  };

  const refreshFlags = async (): Promise<void> => {
    try {
      // In development, we can fetch from the API
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E === '1') {
        const response = await fetch('/api/admin/feature-flags');
        if (response.ok) {
          const data = await response.json();
          setFlags(data.flags);
          return;
        }
      }
      
      // In production, use the default implementation
      setFlags(getAllFeatureFlags());
    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
      // Fallback to default flags
      setFlags(getAllFeatureFlags());
    }
  };

  useEffect(() => {
    refreshFlags();
  }, []);

  return (
    <FeatureFlagContext.Provider value={{
      flags,
      isFeatureEnabled: checkFeatureEnabled,
      refreshFlags
    }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}