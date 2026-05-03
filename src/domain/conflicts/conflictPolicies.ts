import { TaskConflict } from './types';

export interface PolicyResult {
    suggestedAction: 'local' | 'server' | 'none';
    reason: string;
    blockOverride?: boolean;
}

export interface ConflictPolicy {
    id: string;
    name: string;
    description: string;
    /** UI Metadata */
    metadata: {
        scope: 'Roles' | 'Safety' | 'General';
        trigger: string;
        suggestedOutcome: string;
    };
    evaluate: (conflict: TaskConflict, currentUser: any) => PolicyResult | null;
}

const ROLE_RANKS: Record<string, number> = {
    'admin': 100,
    'manager': 50,
    'team': 10,
    'guest': 0
};

export const defaultPolicies: ConflictPolicy[] = [
    {
        id: 'policy-role-hierarchy',
        name: 'Role Hierarchy Precedence',
        description: 'Changes made by higher-ranking roles (e.g., Admins) take precedence over changes by lower-ranking roles.',
        metadata: {
            scope: 'Roles',
            trigger: 'Conflict between actors with different roles',
            suggestedOutcome: 'Defer to the highest authority'
        },
        evaluate: (conflict, currentUser) => {
            // We need a way to know the remote actor's role. For now, since remoteActor is just a name,
            // we will simulate this by checking if the remote actor is explicitly labeled an Admin
            // or if we add a 'remoteActorRole' to the Conflict object later.
            // Assuming `conflict.remoteActorRole` exists for robust implementation
            const localRank = ROLE_RANKS[currentUser?.role] ?? 0;
            const remoteRank = ROLE_RANKS[(conflict as any).remoteActorRole] ?? 10; // Default team rank if unknown

            if (remoteRank > localRank) {
                return {
                    suggestedAction: 'server',
                    reason: `Changes by ${conflict.remoteActor} (Higher Role) take precedence.`,
                    blockOverride: true // Only admins could override this anyway, but this effectively blocks 'team' from overriding 'admin'
                };
            }
            if (localRank > remoteRank) {
                return {
                    suggestedAction: 'local',
                    reason: `Your change takes precedence as an Admin/Manager.`,
                    blockOverride: false
                };
            }
            return null;
        }
    },
    {
        id: 'policy-deletion-safety',
        name: 'Deletion Safety',
        description: 'If someone else restored a task while you deleted it, default to keeping it restored.',
        metadata: {
            scope: 'Safety',
            trigger: 'Concurrent Delete and Restore operations',
            suggestedOutcome: 'Prioritize data retention (Restored)'
        },
        evaluate: (conflict, currentUser) => {
            if (conflict.field === 'deleted' && conflict.serverValue === false && conflict.localValue === true) {
                return {
                    suggestedAction: 'server',
                    reason: `Task was recently restored by ${conflict.remoteActor}. It is safer to keep it.`,
                    blockOverride: false
                };
            }
            return null;
        }
    }
];

export function evaluatePolicies(conflict: TaskConflict, currentUser: any): PolicyResult {
    for (const policy of defaultPolicies) {
        const result = policy.evaluate(conflict, currentUser);
        if (result) {
            return result;
        }
    }

    return {
        suggestedAction: 'none',
        reason: 'No specific policy applies. Please review manually.'
    };
}
