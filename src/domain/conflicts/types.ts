import { PolicyResult } from './conflictPolicies';

export type ConflictCategory = 'benign' | 'content' | 'structural';

export interface TaskConflict {
    taskId: string;
    field: string;
    category: ConflictCategory;
    localValue: any;
    serverValue: any;
    remoteActor: string;
    remoteActorRole?: string;
    timestamp: number;
    policyGuidance?: PolicyResult;
}
