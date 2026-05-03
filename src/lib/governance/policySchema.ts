/**
 * Phase 11: Governance Engine - Policy Schema
 * 
 * Defines the structure for governance policies with explicit enforcement.
 */

export enum EnforcementType {
  ALLOWED = 'allowed',
  REQUIRES_APPROVAL = 'requires_approval',
  DISALLOWED = 'disallowed'
}

export enum PolicyScope {
  ORGANIZATION = 'organization',
  ROLE_BASED = 'role_based',
  TEAM = 'team',
  USER = 'user'
}

export interface PolicyRule {
  condition: string; // Descriptive condition for the rule
  target: string; // What the rule applies to (e.g., 'task_status_change', 'field_assignment')
  action: string; // The action being governed (e.g., 'create', 'update', 'delete')
  parameters: Record<string, any>; // Additional parameters for the rule
}

export interface EnforcementResult {
  policyId: string;
  policyVersion: string;
  enforcementType: EnforcementType;
  reason: string;
  details?: Record<string, any>;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  owner: string; // User ID of policy owner
  scope: PolicyScope;
  rule: PolicyRule;
  enforcementType: EnforcementType;
  escalationPath?: string; // Path to request exception
  version: string;
  enabled: boolean;
  created_at: number;
  updated_at: number;
  conditions: {
    role?: string;
    field?: string;
    action?: string;
    resourceType?: string;
  };
}

export interface EnforcementContext {
  policyId: string;
  userId: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  field?: string;
  newValue?: any;
  oldValue?: any;
  timestamp: number;
  additionalContext?: Record<string, any>;
}
