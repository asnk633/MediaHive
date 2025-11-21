// src/app/featureFlags.ts
// Simple runtime feature flags system

// Define available features
export type FeatureFlag = 
  | 'kanbanView'
  | 'fabNotify'
  | 'taskReview'
  | 'optimisticUpdates';

// Default feature flag values
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  kanbanView: true,
  fabNotify: true,
  taskReview: true,
  optimisticUpdates: true
};

// Environment-based overrides (for dev/testing)
const ENV_OVERRIDES: Record<FeatureFlag, string | undefined> = {
  kanbanView: process.env.FEATURE_KANBAN_VIEW,
  fabNotify: process.env.FEATURE_FAB_NOTIFY,
  taskReview: process.env.FEATURE_TASK_REVIEW,
  optimisticUpdates: process.env.FEATURE_OPTIMISTIC_UPDATES
};

/**
 * Check if a feature is enabled
 * 
 * @param feature The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Check for environment override first
  const envValue = ENV_OVERRIDES[feature];
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  
  // Return default value
  return DEFAULT_FLAGS[feature];
}

/**
 * Get all feature flags
 * 
 * @returns Record of all feature flags and their values
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
  
  for (const feature of Object.keys(DEFAULT_FLAGS) as FeatureFlag[]) {
    flags[feature] = isFeatureEnabled(feature);
  }
  
  return flags;
}