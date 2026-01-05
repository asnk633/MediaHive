// src/app/featureFlags.ts
// Simple runtime feature flags system

// Define available features
export type FeatureFlag =
  | 'fabNotify'
  | 'taskReview'
  | 'optimisticUpdates'
  | 'proofingLite'
  | 'mediaVersioning'
  | 'mediaAwareAutomation'
  | 'taskStateAutomation'
  | 'workflowPowerTools'
  | 'uxPolishLayer'
  | 'onboardingLayer'
  | 'safetyLimits'
  | 'inviteAccessLayer';

// Defaults
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  fabNotify: true,
  taskReview: true,
  optimisticUpdates: true,
  proofingLite: true,
  mediaVersioning: true,
  mediaAwareAutomation: true,
  taskStateAutomation: true,
  workflowPowerTools: true,
  uxPolishLayer: true,
  onboardingLayer: true,
  safetyLimits: true,
  inviteAccessLayer: true
};

// Environment-based overrides (for dev/testing)
const ENV_OVERRIDES: Record<FeatureFlag, string | undefined> = {
  fabNotify: process.env.FEATURE_FAB_NOTIFY,
  taskReview: process.env.FEATURE_TASK_REVIEW,
  optimisticUpdates: process.env.FEATURE_OPTIMISTIC_UPDATES,
  proofingLite: process.env.FEATURE_PROOFING_LITE,
  mediaVersioning: process.env.FEATURE_MEDIA_VERSIONING,
  mediaAwareAutomation: process.env.FEATURE_MEDIA_AWARE_AUTOMATION,
  taskStateAutomation: process.env.FEATURE_TASK_STATE_AUTOMATION,
  workflowPowerTools: process.env.FEATURE_WORKFLOW_POWER_TOOLS,
  uxPolishLayer: process.env.FEATURE_UX_POLISH_LAYER,
  onboardingLayer: process.env.FEATURE_ONBOARDING_LAYER,
  safetyLimits: process.env.FEATURE_SAFETY_LIMITS,
  inviteAccessLayer: process.env.FEATURE_INVITE_ACCESS_LAYER
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