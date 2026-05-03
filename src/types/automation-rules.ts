
export type RuleScopeType = 'global' | 'institution' | 'unit';
export type RuleAction = 'notify' | 'escalate' | 'suppress' | 'audit';
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

export interface RuleCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
}

export interface AutomationRule {
    id: string; // `${scopeType}:${scopeId}:${ruleKey}:${version}`
    ruleKey: string; // Stable identifier
    version: number;
    scopeType: RuleScopeType;
    scopeId: string;
    eventType: string;
    conditions: RuleCondition[];
    action: RuleAction;
    priority: number;
    enabled: boolean;
    locked: boolean; // Immutable/Finalized
    created_at?: any;
    updated_at?: any;
}

export interface RuleEvaluationResult {
    matched: boolean;
    allowed: boolean;
    action: RuleAction;
    ruleId?: string;
    reason?: string;
}

// Default System Rules
// These effectively act as priority 0 fallback rules
export const DEFAULT_SYSTEM_RULES: Partial<Record<string, Partial<AutomationRule>>> = {
    'task_due_soon': {
        ruleKey: 'sys_default_due_soon',
        action: 'notify',
        conditions: [
            { field: 'hoursUntilDue', operator: 'lte', value: 24 },
            { field: 'hoursUntilDue', operator: 'gt', value: 0 }
        ]
    },
    'task_overdue': {
        ruleKey: 'sys_default_overdue',
        action: 'notify',
        conditions: [
            { field: 'hoursOverdue', operator: 'gt', value: 0 }
        ]
    },
    'task_stale_warning': {
        ruleKey: 'sys_default_stale_warning',
        action: 'notify',
        conditions: [
            { field: 'daysSinceUpdate', operator: 'gte', value: 3 }
        ]
    },
    'task_stale_escalation': {
        ruleKey: 'sys_default_stale_escalation',
        action: 'escalate',
        conditions: [
            { field: 'daysSinceUpdate', operator: 'gte', value: 5 }
        ]
    },
    'inventory_due_soon': {
        ruleKey: 'sys_default_inv_due_soon',
        action: 'notify',
        conditions: [
            { field: 'hoursUntilReturn', operator: 'lte', value: 24 },
            { field: 'hoursUntilReturn', operator: 'gt', value: 0 }
        ]
    },
    'inventory_overdue': {
        ruleKey: 'sys_default_inv_overdue',
        action: 'notify',
        conditions: [
            { field: 'hoursOverdue', operator: 'gt', value: 0 }
        ]
    },
    'inventory_escalated': {
        ruleKey: 'sys_default_inv_escalated',
        action: 'escalate',
        conditions: [
            { field: 'hoursOverdue', operator: 'gte', value: 48 }
        ]
    }
};
