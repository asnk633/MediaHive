
export type PolicyScopeType = 'global' | 'institution' | 'unit';

export interface AutomationRulePolicy {
    enabled: boolean;
    maxEscalationLevel?: number; // 0-5, or undefined for unlimited? Spec says "0-5 or Unlimited". Undefined = Unlimited.
}

export interface StructurePolicy {
    scopeType: PolicyScopeType;
    scopeId: string; // 'global', institution_id, or department_id
    rules: {
        [eventType: string]: AutomationRulePolicy;
    };
    updated_at?: any;
    // For UI inheritance display
    inheritedFrom?: PolicyScopeType;
}

export const SUPPORTED_AUTOMATION_EVENTS = [
    'task_due_soon',
    'task_overdue',
    'task_stale_warning',
    'task_stale_escalation',
    'inventory_due_soon',
    'inventory_overdue',
    'inventory_escalated',
    'system_update',
    // Keep media automation ones for completeness if needed? 
    // User list was "At minimum". I'll add the media ones too to not break prev feature.
    'task_status_suggestion',
    'task_ready_signal',
    'task_completed'
];

export const DEFAULT_GLOBAL_POLICY_RULES: { [key: string]: AutomationRulePolicy } = {
    // defaults: Enabled = true, Escalation = Unlimited
};

// Helper to get default rule if missing
export const getDefaultRule = (type: string): AutomationRulePolicy => ({
    enabled: true,
    maxEscalationLevel: undefined
});
