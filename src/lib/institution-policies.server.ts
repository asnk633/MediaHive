import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { InstitutionPolicy, DEFAULT_GLOBAL_POLICY, AutomationRulePolicy } from '@/types/institution-policy';

const COLLECTION = 'institution_policies';

export const InstitutionPolicyService = {
    /**
     * Resolve effective policy for an institution
     * Priority: Institution Doc -> Global Doc -> Hardcoded Default
     */
    resolve: async (institutionId: string): Promise<InstitutionPolicy> => {
        try {
            // 1. Fetch Institution Policy
            const docSnap = await adminDb.collection(COLLECTION).doc(institutionId).get();
            if (docSnap.exists) {
                return docSnap.data() as InstitutionPolicy;
            }

            // 2. Fetch Global Policy (Configurable in DB)
            const globalSnap = await adminDb.collection(COLLECTION).doc('global').get();
            if (globalSnap.exists) {
                return globalSnap.data() as InstitutionPolicy;
            }

            // 3. Fallback to Hardcoded Default
            return DEFAULT_GLOBAL_POLICY;
        } catch (error) {
            console.error(`[InstitutionPolicy] Failed to resolve for ${institutionId}`, error);
            return DEFAULT_GLOBAL_POLICY; // Fail safe
        }
    },

    /**
     * Check if an automation event is allowed
     */
    isParamsAllowed: async (
        institutionId: string,
        eventType: string,
        escalationLevel?: number
    ): Promise<{ allowed: boolean; reason?: string }> => {
        const policy = await InstitutionPolicyService.resolve(institutionId);
        const rule = policy.rules[eventType];

        if (!rule) {
            // If rule not defined in policy, check Global (or default to Disabled if restrictive? 
            // DEFAULT_GLOBAL_POLICY has the defaults. merge logic should handle this, 
            // but if merged object is missing key, it means not configured.
            // Let's assume strict: if missing in resolved policy, check default directly).
            const defaultRule = DEFAULT_GLOBAL_POLICY.rules[eventType];
            if (!defaultRule?.enabled) {
                return { allowed: false, reason: 'Rule not configured/enabled by default' };
            }
            return { allowed: true };
        }

        if (!rule.enabled) {
            return { allowed: false, reason: 'Disabled by institution policy' };
        }

        if (escalationLevel !== undefined && rule.maxEscalationLevel !== undefined) {
            if (escalationLevel > rule.maxEscalationLevel) {
                return { allowed: false, reason: `Escalation level ${escalationLevel} exceeds limit ${rule.maxEscalationLevel}` };
            }
        }

        return { allowed: true };
    },

    /**
     * Update Policy (Admin)
     */
    updatePolicy: async (institutionId: string, rules: { [key: string]: AutomationRulePolicy }) => {
        await adminDb.collection(COLLECTION).doc(institutionId).set({
            institutionId,
            rules,
            updatedAt: new Date()
        }, { merge: true });
    }
};
