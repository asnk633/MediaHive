// src/app/featureFlagsOverview.ts
// Comprehensive overview of all feature flags with recommended production defaults

export interface FeatureFlagInfo {
  name: string;
  description: string;
  category: 'core' | 'ux' | 'admin' | 'safety' | 'onboarding' | 'experimental';
  recommendedDefault: boolean;
  emergencyKillSwitch: boolean;
  dependencies?: string[];
  purpose: string;
  productionReady: boolean;
  lastUpdated: string;
}

// Comprehensive feature flag overview
export const FEATURE_FLAG_OVERVIEW: FeatureFlagInfo[] = [
  {
    name: 'fabNotify',
    description: 'Floating Action Button notifications',
    category: 'ux',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: [],
    purpose: 'Enable FAB notifications for real-time updates',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'taskReview',
    description: 'Task review and approval workflow',
    category: 'core',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: [],
    purpose: 'Enable task review and approval functionality',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'optimisticUpdates',
    description: 'Optimistic UI updates',
    category: 'ux',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: [],
    purpose: 'Enable optimistic UI updates for better perceived performance',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'proofingLite',
    description: 'Media proofing functionality',
    category: 'core',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: [],
    purpose: 'Enable media proofing with comments and approval workflow',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'mediaVersioning',
    description: 'Media versioning system',
    category: 'core',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: ['proofingLite'],
    purpose: 'Enable multiple versions of media files with history tracking',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'mediaAwareAutomation',
    description: 'Media-aware automation hooks',
    category: 'core',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: ['proofingLite', 'mediaVersioning'],
    purpose: 'Enable automation hooks that respond to media upload and approval',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'taskStateAutomation',
    description: 'Task state automation',
    category: 'core',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: ['mediaAwareAutomation'],
    purpose: 'Enable automatic task state changes based on media status',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'workflowPowerTools',
    description: 'Advanced workflow tools',
    category: 'core',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: [],
    purpose: 'Enable bulk operations, advanced filters, and admin panels',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'uxPolishLayer',
    description: 'UX polish and micro-interactions',
    category: 'ux',
    recommendedDefault: true,
    emergencyKillSwitch: false,
    dependencies: [],
    purpose: 'Enable loading states, empty states, and visual feedback',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'onboardingLayer',
    description: 'Onboarding and demo data',
    category: 'onboarding',
    recommendedDefault: true,
    emergencyKillSwitch: true,
    dependencies: [],
    purpose: 'Enable demo data generation and guided onboarding',
    productionReady: true,
    lastUpdated: '2025-01-15'
  },
  {
    name: 'safetyLimits',
    description: 'Safety limits and guardrails',
    category: 'safety',
    recommendedDefault: true,
    emergencyKillSwitch: true,
    dependencies: [],
    purpose: 'Enable bulk operation limits and destructive action confirmations',
    productionReady: true,
    lastUpdated: '2025-01-15'
  }
];

// Recommended production configuration
export const PRODUCTION_FEATURE_FLAGS = {
  fabNotify: true,
  taskReview: true,
  optimisticUpdates: true,
  proofingLite: true,
  mediaVersioning: true,
  mediaAwareAutomation: true,
  taskStateAutomation: true,
  workflowPowerTools: true,
  uxPolishLayer: true,
  onboardingLayer: false, // Disable onboarding in production by default
  safetyLimits: true
};

// Emergency kill switches - features that can be disabled in case of issues
export const EMERGENCY_KILL_SWITCHES = [
  'onboardingLayer',
  'safetyLimits'
];

// Features grouped by category
export const FEATURES_BY_CATEGORY = {
  core: FEATURE_FLAG_OVERVIEW.filter(flag => flag.category === 'core'),
  ux: FEATURE_FLAG_OVERVIEW.filter(flag => flag.category === 'ux'),
  admin: FEATURE_FLAG_OVERVIEW.filter(flag => flag.category === 'admin'),
  safety: FEATURE_FLAG_OVERVIEW.filter(flag => flag.category === 'safety'),
  onboarding: FEATURE_FLAG_OVERVIEW.filter(flag => flag.category === 'onboarding'),
  experimental: FEATURE_FLAG_OVERVIEW.filter(flag => flag.category === 'experimental')
};

// Function to get recommended production defaults
export function getRecommendedProductionFlags(): Record<string, boolean> {
  return FEATURE_FLAG_OVERVIEW.reduce((acc, flag) => {
    acc[flag.name] = flag.recommendedDefault;
    return acc;
  }, {} as Record<string, boolean>);
}

// Function to check if a feature is an emergency kill switch
export function isEmergencyKillSwitch(featureName: string): boolean {
  return EMERGENCY_KILL_SWITCHES.includes(featureName);
}

// Function to get features by category
export function getFeaturesByCategory(category: string): FeatureFlagInfo[] {
  return FEATURES_BY_CATEGORY[category as keyof typeof FEATURES_BY_CATEGORY] || [];
}

// Function to get feature info
export function getFeatureInfo(featureName: string): FeatureFlagInfo | undefined {
  return FEATURE_FLAG_OVERVIEW.find(flag => flag.name === featureName);
}

// Function to validate feature flag dependencies
export function validateFeatureDependencies(featureFlags: Record<string, boolean>): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const flag of FEATURE_FLAG_OVERVIEW) {
    if (featureFlags[flag.name] && flag.dependencies) {
      for (const dependency of flag.dependencies) {
        if (!featureFlags[dependency]) {
          issues.push(`Feature '${flag.name}' requires dependency '${dependency}' to be enabled`);
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}