
export type RolePolicyScopeType = 'global' | 'institution';

export interface RolePolicyRule {
    enabled: boolean;
    escalateAtLevel: number; // default 2
}

export interface RolePolicy {
    scopeType: RolePolicyScopeType;
    scopeId: string; // 'global' or institutionId
    rules: {
        [eventType: string]: RolePolicyRule;
    };
    updatedAt?: any;
}

export const ESCALATION_EVENTS = [
    'task_stale_escalation',
    'inventory_escalated'
];

export const DEFAULT_ROLE_POLICY_RULE: RolePolicyRule = {
    enabled: true,
    escalateAtLevel: 2
};
