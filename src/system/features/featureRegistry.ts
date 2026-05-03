export type FeatureKey =
    | 'tasks'
    | 'events'
    | 'inventory'
    | 'campaigns'
    | 'flowboard'
    | 'automationEngine'
    | 'aiAssistant'
    | 'intelligenceDashboard'
    | 'labs';

export interface FeatureConfig {
    enabled: boolean;
    minRole?: 'guest' | 'viewer' | 'standard' | 'admin' | 'owner';
    isLabs?: boolean;
}

export const FEATURE_REGISTRY: Record<FeatureKey, FeatureConfig> = {
    tasks: { enabled: true, minRole: 'guest' },
    events: { enabled: true, minRole: 'guest' },
    inventory: { enabled: true, minRole: 'guest' },
    campaigns: { enabled: true, minRole: 'standard' },
    flowboard: { enabled: true, minRole: 'standard', isLabs: true },
    automationEngine: { enabled: false, minRole: 'admin', isLabs: true },
    aiAssistant: { enabled: false, minRole: 'standard', isLabs: true },
    intelligenceDashboard: { enabled: true, minRole: 'admin', isLabs: true },
    labs: { enabled: true, minRole: 'admin' },
};
