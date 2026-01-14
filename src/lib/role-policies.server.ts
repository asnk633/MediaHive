import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { RolePolicy, RolePolicyRule, DEFAULT_ROLE_POLICY_RULE } from '@/types/role-policy';

const COLLECTION = 'role_notification_policies';
const CACHE_TTL = 60 * 1000;
const policyCache = new Map<string, { policy: RolePolicy | null, timestamp: number }>();

export const RolePolicyService = {
    /**
     * Get raw policy doc with caching
     */
    getPolicyDoc: async (scopeType: 'global' | 'institution', scopeId: string): Promise<RolePolicy | null> => {
        const key = `${scopeType}:${scopeId}`;
        const cached = policyCache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.policy;
        }

        try {
            const docId = `${scopeType}:${scopeId}`;
            const doc = await adminDb.collection(COLLECTION).doc(docId).get();
            if (doc.exists) {
                const data = doc.data() as RolePolicy;
                if (data.scopeType === scopeType) {
                    policyCache.set(key, { policy: data, timestamp: Date.now() });
                    return data;
                }
            }
            policyCache.set(key, { policy: null, timestamp: Date.now() });
            return null;
        } catch (e) {
            console.error("RolePolicy fetch error", e);
            return null;
        }
    },

    /**
     * Set policy
     */
    setPolicy: async (scopeType: 'global' | 'institution', scopeId: string, rules: { [key: string]: RolePolicyRule }) => {
        const policy: RolePolicy = {
            scopeType,
            scopeId,
            rules,
            updatedAt: new Date()
        };
        const docId = `${scopeType}:${scopeId}`;
        await adminDb.collection(COLLECTION).doc(docId).set(policy);
        policyCache.delete(`${scopeType}:${scopeId}`);
    },

    /**
     * Resolve Role Policy for Escalation
     */
    resolveRolePolicy: async (params: {
        institutionId: string;
        eventType: string;
        escalationLevel?: number;
        severity?: 'info' | 'important' | 'critical';
    }): Promise<{ allowed: boolean; reason?: string; source?: string }> => {
        const { institutionId, eventType, escalationLevel, severity } = params;

        // 1. Critical Override
        if (severity === 'critical') {
            return { allowed: true, reason: 'Critical Override', source: 'Severity' };
        }

        // 2. Resolve Rule (Institution -> Global -> Default)
        let rule: RolePolicyRule | undefined;
        let source = 'default';

        // Check Institution
        const instPolicy = await RolePolicyService.getPolicyDoc('institution', institutionId);
        if (instPolicy?.rules?.[eventType]) {
            rule = instPolicy.rules[eventType];
            source = 'institution';
        }

        // Check Global
        if (!rule) {
            const globalPolicy = await RolePolicyService.getPolicyDoc('global', 'global');
            if (globalPolicy?.rules?.[eventType]) {
                rule = globalPolicy.rules[eventType];
                source = 'global';
            }
        }

        // Default
        if (!rule) {
            rule = DEFAULT_ROLE_POLICY_RULE;
            source = 'default';
        }

        // 3. Logic
        if (!rule.enabled) {
            return { allowed: false, reason: 'Disabled by role policy', source };
        }

        if (escalationLevel !== undefined) {
            if (escalationLevel < rule.escalateAtLevel) {
                return { allowed: false, reason: `Level ${escalationLevel} < Threshold ${rule.escalateAtLevel}`, source };
            }
        }

        return { allowed: true, source };
    }
};
