import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { AutomationRulePolicy, StructurePolicy, getDefaultRule, PolicyScopeType } from '@/types/structure-policy';

const COLLECTION = 'structure_policies';

// Simple memory cache (TTL 60s)
const CACHE_TTL = 60 * 1000;
const policyCache = new Map<string, { policy: StructurePolicy | null, timestamp: number }>();

const getCachedPolicy = (key: string): StructurePolicy | null | undefined => {
    const cached = policyCache.get(key);
    if (!cached) return undefined; // MISS
    if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.policy;
    }
    policyCache.delete(key);
    return undefined;
};

const setCachedPolicy = (key: string, policy: StructurePolicy | null) => {
    policyCache.set(key, { policy, timestamp: Date.now() });
};

export const StructurePolicyService = {
    /**
     * Fetch raw policy doc
     */
    getPolicyDoc: async (scopeType: 'global' | 'institution' | 'unit', scopeId: string): Promise<StructurePolicy | null> => {
        // Cache Key
        const key = `${scopeType}:${scopeId}`;
        const cached = getCachedPolicy(key);
        if (cached !== undefined) return cached;

        // Actually, let's just fetch. Performance optimization later if needed.
        // But for batch jobs, cache is good.
        // Let's rely on standard fetch.
        try {
            // Use composite key for safety
            const docId = `${scopeType}:${scopeId}`;
            const doc = await adminDb.collection(COLLECTION).doc(docId).get();
            if (doc.exists) {
                const data = doc.data() as StructurePolicy;
                // Double check scope matches
                if (data.scopeType === scopeType) {
                    policyCache.set(key, { policy: data, timestamp: Date.now() });
                    return data;
                }
            }
            policyCache.set(key, { policy: null, timestamp: Date.now() });
            return null;
        } catch (e) {
            console.error("StructurePolicy fetch error", e);
            return null;
        }
    },

    /**
     * Set policy (for Admin UI)
     */
    setPolicy: async (scopeType: PolicyScopeType, scopeId: string, rules: { [key: string]: AutomationRulePolicy }) => {
        const policy: StructurePolicy = {
            scopeType,
            scopeId,
            rules,
            updatedAt: new Date()
        };
        const docId = `${scopeType}:${scopeId}`;
        await adminDb.collection(COLLECTION).doc(docId).set(policy);
        // Invalidate cache
        policyCache.delete(`${scopeType}:${scopeId}`);
    },

    /**
     * Strict Resolution Check
     */
    resolveAutomationPolicy: async (params: {
        institutionId: string;
        departmentId?: string | null;
        eventType: string;
        escalationLevel?: number;
    }): Promise<{ allowed: boolean; reason?: string; source?: string }> => {
        const { institutionId, departmentId, eventType, escalationLevel } = params;

        // 1. Resolve Chain
        // Unit -> Institution -> Global
        let rule: AutomationRulePolicy | undefined;
        let source = 'default';

        // Check Unit
        if (departmentId) {
            const unitPolicy = await StructurePolicyService.getPolicyDoc('unit', departmentId);
            if (unitPolicy?.rules?.[eventType]) {
                rule = unitPolicy.rules[eventType];
                source = 'unit';
            }
        }

        // Check Institution
        if (!rule) {
            const instPolicy = await StructurePolicyService.getPolicyDoc('institution', institutionId);
            if (instPolicy?.rules?.[eventType]) {
                rule = instPolicy.rules[eventType];
                source = 'institution';
            }
        }

        // Check Global
        if (!rule) {
            const globalPolicy = await StructurePolicyService.getPolicyDoc('global', 'global');
            if (globalPolicy?.rules?.[eventType]) {
                rule = globalPolicy.rules[eventType];
                source = 'global';
            }
        }

        // Default
        if (!rule) {
            rule = getDefaultRule(eventType);
            source = 'default';
        }

        // 2. Apply Logic
        if (!rule.enabled) {
            return { allowed: false, reason: 'Disabled by policy', source };
        }

        if (escalationLevel !== undefined && rule.maxEscalationLevel !== undefined) {
            if (escalationLevel > rule.maxEscalationLevel) {
                return { allowed: false, reason: `Escalation ${escalationLevel} > Max ${rule.maxEscalationLevel}`, source };
            }
        }

        return { allowed: true, source };
    }
};
