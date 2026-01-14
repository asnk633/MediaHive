import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { AutomationRule, RuleCondition, DEFAULT_SYSTEM_RULES, RuleAction, RuleEvaluationResult } from '@/types/automation-rules';

const COLLECTION = 'automation_rules';
const CACHE_TTL = 60 * 1000;
const rulesCache = new Map<string, { rules: AutomationRule[], timestamp: number }>();

export const AutomationRulesService = {
    /**
     * Get active rules for a scope
     * Logic: Query all rules for scope -> Group by ruleKey -> Pick highest version
     */
    getScopeRules: async (scopeType: 'global' | 'institution' | 'unit', scopeId: string): Promise<AutomationRule[]> => {
        const key = `${scopeType}:${scopeId}`;
        const cached = rulesCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.rules;
        }

        try {
            // Query all rules for this scope
            // Note: This relies on scopeId being indexed. 
            // Composite index scopeType+scopeId might be needed if volume is high, but scopeId is usually unique enough or we filter in memory.
            const snap = await adminDb.collection(COLLECTION)
                .where('scopeType', '==', scopeType)
                .where('scopeId', '==', scopeId)
                .get();

            if (snap.empty) {
                rulesCache.set(key, { rules: [], timestamp: Date.now() });
                return [];
            }

            const allRules = snap.docs.map(d => d.data() as AutomationRule);

            // Group by ruleKey and pick highest version
            const ruleMap = new Map<string, AutomationRule>();

            for (const r of allRules) {
                const current = ruleMap.get(r.ruleKey);
                if (!current || (r.version > current.version)) {
                    ruleMap.set(r.ruleKey, r);
                }
            }

            const activeRules = Array.from(ruleMap.values());
            rulesCache.set(key, { rules: activeRules, timestamp: Date.now() });
            return activeRules;

        } catch (e) {
            console.error("AutomationRules fetch error", e);
            return [];
        }
    },

    /**
     * Evaluate a single condition
     */
    evaluateCondition: (condition: RuleCondition, context: any): boolean => {
        const { field, operator, value } = condition;
        const actualValue = context[field];

        if (actualValue === undefined || actualValue === null) return false;

        switch (operator) {
            case 'eq': return actualValue == value;
            case 'neq': return actualValue != value;
            case 'gt': return actualValue > value;
            case 'gte': return actualValue >= value;
            case 'lt': return actualValue < value;
            case 'lte': return actualValue <= value;
            case 'contains':
                return Array.isArray(actualValue) ? actualValue.includes(value) : String(actualValue).includes(value);
            default: return false;
        }
    },

    /**
     * Evaluate context against rules
     */
    evaluate: async (params: {
        institutionId: string;
        departmentId?: string | null;
        eventType: string;
        context: Record<string, any>;
    }): Promise<RuleEvaluationResult> => {
        const { institutionId, departmentId, eventType, context } = params;

        // 1. Gather all rules
        let candidates: AutomationRule[] = [];

        // Unit
        if (departmentId) {
            const unitRules = await AutomationRulesService.getScopeRules('unit', departmentId);
            candidates.push(...unitRules);
        }

        // Institution
        const instRules = await AutomationRulesService.getScopeRules('institution', institutionId);
        candidates.push(...instRules);

        // Global
        const globalRules = await AutomationRulesService.getScopeRules('global', 'global');
        candidates.push(...globalRules);

        // 2. Filter by eventType and Enabled
        // Note: We ignore 'locked' for evaluation eligibility as per standard active rule logic (Active = Highest Version).
        // If 'locked' meant 'Draft', we would check !locked. Assuming locked=Immutable/Active.
        candidates = candidates.filter(r => r.eventType === eventType && r.enabled !== false);

        // 3. Sort by Priority (Descending)
        candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // 4. Evaluate Matches
        for (const rule of candidates) {
            const matches = rule.conditions.every(c => AutomationRulesService.evaluateCondition(c, context));
            if (matches) {
                // Determine allowed status based on action
                // 'suppress' -> allowed: false? Or allowed: true, action: 'suppress'?
                // The consumer (ServerNotification) needs to know if it should proceed.
                // Standard convention: 
                // allowed = true (Proceed to execute Action)
                // allowed = false (Stop)
                // However, 'suppress' is an action of "Stop".
                // If we return allowed: true, action: 'suppress', the consumer must handle 'suppress'.
                // If we return allowed: false, the consumer stops.
                // Let's return allowed: true with the specific action.
                return { matched: true, allowed: true, action: rule.action, ruleId: rule.id };
            }
        }

        // 5. Fallback to System Defaults
        // If no explicit rule matched, we check system defaults.
        const systemDefault = DEFAULT_SYSTEM_RULES[eventType];
        if (systemDefault && systemDefault.conditions) {
            const matches = systemDefault.conditions.every(c => AutomationRulesService.evaluateCondition(c, context));
            if (matches) {
                return {
                    matched: true,
                    allowed: true,
                    action: systemDefault.action as RuleAction,
                    ruleId: 'system_default',
                    reason: 'System Default'
                };
            }
        }

        // 6. Default Fallback (No Match)
        // If no rule matched (and system default didn't match), we do NOT trigger.
        return { matched: false, allowed: true, action: 'notify', reason: 'no_match' };
    }
};
