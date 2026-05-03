/**
 * Phase 10: Read-Only Policy Evaluation Engine
 * 
 * Pure function that provides declarative policy explanations
 * without any side effects or state mutations.
 */

import { TaskConflict } from './types';

export interface PolicyExplanation {
  id: string;
  title: string;
  description: string;
  applicable: boolean;
  context?: string;
  // NOTE: No suggestedAction, no priority, no boolean flags to prevent misuse
}

export interface PolicyEvaluationContext {
  conflict: TaskConflict;
  userRole: string;
  remoteUserRole: string;
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: number;
}

export interface PolicyEvaluationResult {
  explanations: PolicyExplanation[];
  context: PolicyEvaluationContext;
  // NOTE: No suggested outcome, no boolean result, no control flags
}

/**
 * Pure function to evaluate policy implications for a given conflict
 * 
 * Execution gates:
 * - isOnline: true
 * - !isReplaying: true
 * - !isPaused: true
 * - !hasPatch: true
 * - isBootComplete: true
 * 
 * @param context - The conflict and user context
 * @returns Declarative policy explanations
 */
export function evaluatePolicyImplications(context: PolicyEvaluationContext): PolicyEvaluationResult {
  const { conflict, userRole, remoteUserRole, field, localValue, remoteValue } = context;
  
  const explanations: PolicyExplanation[] = [];
  
  // Role hierarchy policy: Higher roles take precedence
  if (userRole !== remoteUserRole) {
    const roleHierarchy = {
      admin: 4,
      manager: 3,
      team: 2,
      guest: 1
    };
    
    const userPriority = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const remotePriority = roleHierarchy[remoteUserRole as keyof typeof roleHierarchy] || 0;
    
    if (userPriority > remotePriority) {
      explanations.push({
        id: 'role-hierarchy-local',
        title: 'Role Hierarchy',
        description: `Your role (${userRole}) has higher authority than the remote user's role (${remoteUserRole}). Local changes typically take precedence in authority-based conflicts.`,
        applicable: true,
        context: 'role-based authority'
      });
    } else if (remotePriority > userPriority) {
      explanations.push({
        id: 'role-hierarchy-remote',
        title: 'Role Hierarchy Override',
        description: `Remote user's role (${remoteUserRole}) has higher authority than yours (${userRole}). Remote changes typically take precedence in authority-based conflicts.`,
        applicable: true,
        context: 'role-based authority'
      });
    }
  }
  
  // Critical field policy: Some fields have special considerations
  if (['deleted', 'status'].includes(field)) {
    explanations.push({
      id: 'critical-field-' + field,
      title: 'Critical Field Change',
      description: `Changes to '${field}' affect task state fundamentally. Exercise caution when resolving conflicts in critical fields.`,
      applicable: true,
      context: 'field-criticality'
    });
  }
  
  // Priority field policy: Priority changes have implications
  if (field === 'priority') {
    const priorityValues = { low: 1, medium: 2, high: 3, urgent: 4 };
    const localPriority = priorityValues[localValue as keyof typeof priorityValues] || 0;
    const remotePriority = priorityValues[remoteValue as keyof typeof priorityValues] || 0;
    
    if (Math.abs(localPriority - remotePriority) >= 2) {
      explanations.push({
        id: 'priority-gap-large',
        title: 'Significant Priority Difference',
        description: `Large difference between local priority (${localValue}) and remote priority (${remoteValue}). Consider the impact of the priority level chosen.`,
        applicable: true,
        context: 'priority-difference'
      });
    }
  }
  
  // Assignment policy: Who can assign tasks to whom
  if (field === 'assigned_to') {
    if (userRole === 'admin' || userRole === 'manager') {
      explanations.push({
        id: 'assignment-authority',
        title: 'Assignment Authority',
        description: `Administrators and managers can reassign tasks. Your assignment change is within your role's authority.`,
        applicable: true,
        context: 'assignment-authority'
      });
    } else if (remoteUserRole === 'admin' || remoteUserRole === 'manager') {
      explanations.push({
        id: 'assignment-authority-override',
        title: 'Management Assignment',
        description: `Management has re-assigned this task. Their assignment typically takes precedence.`,
        applicable: true,
        context: 'assignment-authority'
      });
    }
  }
  
  // Structural change policy: Deletion and restoration have implications
  if (conflict.category === 'structural') {
    explanations.push({
      id: 'structural-change',
      title: 'Structural Change Detected',
      description: `This conflict involves a structural change (creation, deletion, or fundamental alteration). Such changes have broader system implications.`,
      applicable: true,
      context: 'change-type-structural'
    });
  }
  
  // Content change policy: Regular field modifications
  if (conflict.category === 'content') {
    explanations.push({
      id: 'content-change',
      title: 'Content Change',
      description: `This conflict involves a content change to the '${field}' field. Both parties modified the same field with different values.`,
      applicable: true,
      context: 'change-type-content'
    });
  }
  
  // Time-based policy: Recent changes may have more context
  const timeDiffHours = Math.abs(Date.now() - conflict.timestamp) / (1000 * 60 * 60);
  if (timeDiffHours < 1) {
    explanations.push({
      id: 'recent-change',
      title: 'Recent Conflict',
      description: `This conflict occurred recently. Both parties may have current context for this change.`,
      applicable: true,
      context: 'timing-recent'
    });
  }
  
  return {
    explanations,
    context
  };
}

/**
 * Helper function to check if policy evaluation is safe to run
 * 
 * @param isOnline - Whether the app is online
 * @param isReplaying - Whether replay is in progress
 * @param isPaused - Whether sync is paused
 * @param hasPatch - Whether the task has a local patch
 * @param isBootComplete - Whether app boot is complete
 * @returns Boolean indicating if evaluation is safe
 */
export function canEvaluatePolicy(
  isOnline: boolean,
  isReplaying: boolean,
  isPaused: boolean,
  hasPatch: boolean,
  isBootComplete: boolean
): boolean {
  // Execution gates: Policy evaluation runs only when:
  // - Online
  // - Not replaying
  // - Not paused
  // - No local patch
  // - Boot complete
  return isOnline && !isReplaying && !isPaused && !hasPatch && isBootComplete;
}
