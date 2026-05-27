export type FeatureKey =
    | 'tasks'
    | 'events'
    | 'inventory'
    | 'campaigns'
    | 'automationEngine'
    | 'aiAssistant'
    | 'intelligenceDashboard'
    | 'productionCenter'
    | 'governance'
    | 'leave_management'
    | 'reports'
    | 'policySimulation'
    | 'testDemoData'
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
    automationEngine: { enabled: false, minRole: 'admin', isLabs: true },
    aiAssistant: { enabled: false, minRole: 'team', isLabs: true },
    intelligenceDashboard: { enabled: true, minRole: 'admin', isLabs: true },
    productionCenter: { enabled: true, minRole: 'team', isLabs: true },
    governance: { enabled: true, minRole: 'admin' },
    leave_management: { enabled: true, minRole: 'team' },
    reports: { enabled: true, minRole: 'manager' },
    policySimulation: { enabled: true, minRole: 'admin', isLabs: true },
    testDemoData: { enabled: false, minRole: 'admin', isLabs: true },
    labs: { enabled: true, minRole: 'admin' },
};
