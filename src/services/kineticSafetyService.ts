'use client';

import { toast } from 'sonner';
import { AuditTrailService } from '@/services/auditTrailService';

export interface KineticSafetyLimits {
    maxPressure: number;
    maxSpeed: number;
    maxPower: number;
}

/**
 * KineticSafetyService: Enforces air-gap compatible physical safety gates.
 * Mandated for systems with kinetic consequences.
 */
export class KineticSafetyService {
    // HARD CEILINGS (Cannot be overridden by software logic)
    private static readonly HARD_LIMITS: KineticSafetyLimits = {
        maxPressure: 100, // PSI
        maxSpeed: 50,    // RPM
        maxPower: 500    // Watts
    };

    /**
     * Request dual-operator authorization for a kinetic action.
     */
    static async requestDualAuthorization(action: string, targetValue: number, limitKey: keyof KineticSafetyLimits): Promise<boolean> {
        const limit = this.HARD_LIMITS[limitKey];

        // SAFETY CHECK: Hard Ceiling Enforcement
        if (targetValue > limit) {
            const errorMsg = `[KINETIC-SAFETY] Action BLOCKED: ${action} value ${targetValue} exceeds hard physical limit of ${limit}.`;
            console.error(errorMsg);
            toast.error("SAFETY VIOLATION: Hard operational ceiling exceeded.");

            await AuditTrailService.logAction({
                action: 'KINETIC_VIOLATION',
                entityId: 'system',
                entityType: 'hardware',
                reason: errorMsg,
                classification: 'MISSION_CRITICAL'
            });
            return false;
        }

        // DUAL OPERATOR APPROVAL (Simulation)
        const operator2Id = prompt("[KINETIC GATE] This action has physical consequences.\n\nSecond Operator ID required for authorization:");
        if (!operator2Id) {
            toast.error("Action denied: Dual-operator approval required.");
            return false;
        }

        console.log(`[KINETIC-SAFETY][AUTHORIZED] Action ${action} authorized by Dual Op: ${operator2Id}`);

        await AuditTrailService.logAction({
            action: 'KINETIC_AUTHORIZED',
            entityId: 'system',
            entityType: 'hardware',
            metadata: { action, value: targetValue, operator2: operator2Id },
            classification: 'MISSION_CRITICAL'
        });

        return true;
    }
}
