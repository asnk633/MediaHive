
export interface AutomationRulePolicy {
    enabled: boolean;
    maxEscalationLevel?: number;
}

export interface InstitutionPolicy {
    institution_id: string;
    rules: {
        [eventType: string]: AutomationRulePolicy;
    };
    updated_at?: any; // Timestamp
}

export const SUPPORTED_AUTOMATION_EVENTS = [
    'task_status_suggestion', // Media Upload -> Suggest In Progress
    'task_ready_signal',      // Media Approved -> Suggest Ready
    'task_completed',         // Media Approved -> Auto Complete
    'stale_task_warning',      // Stale Task
    'stale_task_escalation'    // Stale Escalation
];

export const DEFAULT_GLOBAL_POLICY: InstitutionPolicy = {
    institution_id: 'global',
    rules: {
        'task_status_suggestion': { enabled: true },
        'task_ready_signal': { enabled: true },
        'task_completed': { enabled: false }, // Default off for safety
        'stale_task_warning': { enabled: true },
        'stale_task_escalation': { enabled: true, maxEscalationLevel: 2 }
    }
};
