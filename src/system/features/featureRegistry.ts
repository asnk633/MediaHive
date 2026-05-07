export type FeatureKey =
    | 'tasks'
    | 'events'
    | 'inventory'
    | 'campaigns'
    | 'flowboard'
    | 'automationEngine'
    | 'aiAssistant'
    | 'intelligenceDashboard'
    | 'productionCenter'
    | 'governance'
    | 'leave_management'
    | 'reports'
    | 'policySimulation'
    | 'labs';

export interface FeatureConfig {
    enabled: boolean;
    minRole?: 'member' | 'team' | 'manager' | 'admin';
    isLabs?: boolean;
}

export const FEATURE_REGISTRY: Record<FeatureKey, FeatureConfig> = {
    tasks: { enabled: true, minRole: 'member' },
    events: { enabled: true, minRole: 'member' },
    inventory: { enabled: true, minRole: 'member' },
    campaigns: { enabled: true, minRole: 'team' },
    flowboard: { enabled: true, minRole: 'team', isLabs: true },
    automationEngine: { enabled: false, minRole: 'admin', isLabs: true },
    aiAssistant: { enabled: false, minRole: 'team', isLabs: true },
    intelligenceDashboard: { enabled: true, minRole: 'admin', isLabs: true },
    productionCenter: { enabled: true, minRole: 'team', isLabs: true },
    governance: { enabled: true, minRole: 'manager' },
    leave_management: { enabled: true, minRole: 'team' },
    reports: { enabled: true, minRole: 'manager' },
    policySimulation: { enabled: true, minRole: 'admin', isLabs: true },
    labs: { enabled: true, minRole: 'admin' },
};
