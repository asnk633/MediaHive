/**
 * Phase 11: Governance Engine - Enforcement Engine
 * 
 * Creates deterministic enforcement that evaluates policies
 * and returns clear enforcement outcomes (ALLOWED, REQUIRES_APPROVAL, DISALLOWED).
 */

import { Policy, EnforcementResult, EnforcementContext, EnforcementType, PolicyRule } from './policySchema';

export class EnforcementEngine {
  private policies: Map<string, Policy> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Load any persisted policies here if needed
    this.isInitialized = true;
  }

  /**
   * Register a policy for enforcement
   */
  registerPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Unregister a policy
   */
  unregisterPolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get all active policies
   */
  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values()).filter(policy => policy.enabled);
  }

  /**
   * Evaluate enforcement for a given context
   * Returns deterministic enforcement outcomes: ALLOWED, REQUIRES_APPROVAL, DISALLOWED
   */
  evaluateEnforcement(context: EnforcementContext): EnforcementResult[] {
    const applicablePolicies = this.getApplicablePolicies(context);
    const results: EnforcementResult[] = [];

    for (const policy of applicablePolicies) {
      const result = this.evaluatePolicy(policy, context);
      if (result) {
        results.push(result);
      }
    }

    // If no policies matched, return allowed by default
    if (results.length === 0) {
      return [{
        policyId: 'default',
        policyVersion: '1.0.0',
        enforcementType: EnforcementType.ALLOWED,
        reason: 'No applicable policies found'
      }];
    }

    return results;
  }

  /**
   * Check if an action is allowed based on policies
   */
  isActionAllowed(context: EnforcementContext): boolean {
    const results = this.evaluateEnforcement(context);
    
    // For an action to be allowed, ALL applicable policies must allow it
    // If any policy disallows it, the action is blocked
    // If any policy requires approval, the action needs approval
    for (const result of results) {
      if (result.enforcementType === EnforcementType.DISALLOWED) {
        return false;
      }
      if (result.enforcementType === EnforcementType.REQUIRES_APPROVAL) {
        return false; // For simplicity, treat approval-required as not allowed until approved
      }
    }
    
    return true;
  }

  /**
   * Get applicable policies for a given context
   */
  private getApplicablePolicies(context: EnforcementContext): Policy[] {
    return Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .filter(policy => this.matchesConditions(policy, context));
  }

  /**
   * Check if a policy's conditions match the given context
   */
  private matchesConditions(policy: Policy, context: EnforcementContext): boolean {
    const { conditions } = policy;
    
    // Check role condition
    if (conditions.role && conditions.role !== context.userRole) {
      return false;
    }
    
    // Check field condition
    if (conditions.field && conditions.field !== context.field) {
      return false;
    }
    
    // Check action condition
    if (conditions.action && conditions.action !== context.action) {
      return false;
    }
    
    // Check resource type condition
    if (conditions.resourceType && conditions.resourceType !== context.resourceType) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate a single policy against the context
   */
  private evaluatePolicy(policy: Policy, context: EnforcementContext): EnforcementResult | null {
    // Check if the policy rule matches the context
    if (!this.ruleMatches(policy.rule, context)) {
      return null;
    }

    return {
      policyId: policy.id,
      policyVersion: policy.version,
      enforcementType: policy.enforcementType,
      reason: `Policy "${policy.name}" triggered for action: ${context.action}`,
      details: {
        policyName: policy.name,
        userRole: context.userRole,
        action: context.action,
        field: context.field,
        timestamp: context.timestamp
      }
    };
  }

  /**
   * Check if the policy rule matches the context
   */
  private ruleMatches(rule: PolicyRule, context: EnforcementContext): boolean {
    // Basic matching based on rule target and action
    if (rule.target && !context.action.toLowerCase().includes(rule.action.toLowerCase())) {
      return false;
    }

    // More sophisticated rule matching could be implemented here
    // For now, we'll do basic checks based on the rule parameters
    const { parameters } = rule;
    
    // Check if the rule has specific parameter requirements
    if (parameters.resourceType && parameters.resourceType !== context.resourceType) {
      return false;
    }

    if (parameters.field && parameters.field !== context.field) {
      return false;
    }

    return true;
  }

  /**
   * Enable a policy
   */
  enablePolicy(policyId: string): boolean {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = true;
      policy.updated_at = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Disable a policy
   */
  disablePolicy(policyId: string): boolean {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.enabled = false;
      policy.updated_at = Date.now();
      return true;
    }
    return false;
  }
}

// Create a singleton instance
export const enforcementEngine = new EnforcementEngine();
