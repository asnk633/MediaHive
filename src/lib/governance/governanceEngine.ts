/**
 * Phase 11: Governance Engine
 * 
 * Main governance engine that orchestrates policy enforcement,
 * audit logging, and escalation management while maintaining
 * hard separation from Phase 10 guidance.
 */

import { 
  Policy, 
  EnforcementContext, 
  EnforcementResult, 
  EnforcementType 
} from './policySchema';
import { enforcementEngine } from './enforcementEngine';
import { auditTrail } from './auditTrail';
import { escalationService } from './escalationService';

export interface GovernanceResult {
  allowed: boolean;
  enforcementResults: EnforcementResult[];
  auditEntryId?: string;
}

export interface GovernanceConfig {
  enableLogging: boolean;
  enableEscalation: boolean;
  requireExplicitApproval: boolean;
}

export class GovernanceEngine {
  private config: GovernanceConfig = {
    enableLogging: true,
    enableEscalation: true,
    requireExplicitApproval: false
  };

  constructor(config?: Partial<GovernanceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the governance engine
   */
  async initialize(): Promise<void> {
    await Promise.all([
      enforcementEngine.initialize(),
      auditTrail.initialize(),
      escalationService.initialize()
    ]);
  }

  /**
   * Register a policy for enforcement
   */
  registerPolicy(policy: Policy): void {
    enforcementEngine.registerPolicy(policy);
  }

  /**
   * Unregister a policy
   */
  unregisterPolicy(policyId: string): void {
    enforcementEngine.unregisterPolicy(policyId);
  }

  /**
   * Evaluate governance for an action
   * Returns whether the action is allowed and logs the result
   */
  async evaluateGovernance(context: EnforcementContext): Promise<GovernanceResult> {
    // First check if there's an active exception for this user and policy
    let hasActiveException = false;
    if (this.config.enableEscalation) {
      hasActiveException = await escalationService.hasActiveException(context.userId, context.policyId);
    }

    if (hasActiveException) {
      // If there's an active exception, allow the action
      return {
        allowed: true,
        enforcementResults: [{
          policyId: context.policyId,
          policyVersion: 'exception',
          enforcementType: EnforcementType.ALLOWED,
          reason: 'Active exception granted for this policy'
        }]
      };
    }

    // Evaluate enforcement using the enforcement engine
    const enforcementResults = enforcementEngine.evaluateEnforcement(context);
    let allowed = true;

    // Determine if the action is allowed based on enforcement results
    for (const result of enforcementResults) {
      if (result.enforcementType === EnforcementType.DISALLOWED) {
        allowed = false;
        break;
      }
      if (result.enforcementType === EnforcementType.REQUIRES_APPROVAL) {
        allowed = !this.config.requireExplicitApproval; // Depends on config
      }
    }

    // Log the enforcement result to the audit trail
    if (this.config.enableLogging) {
      for (const result of enforcementResults) {
        await auditTrail.logEnforcement(
          result,
          context.userId,
          context.userRole,
          context.action,
          context.resourceType,
          context.resourceId,
          context.field,
          context.additionalContext
        );
      }
    }

    return {
      allowed,
      enforcementResults
    };
  }

  /**
   * Request an exception to a policy
   */
  async requestException(
    policyId: string,
    context: EnforcementContext,
    reason: string,
    userName: string,
    userRole: string
  ): Promise<string> {
    if (!this.config.enableEscalation) {
      throw new Error('Escalation is not enabled in governance configuration');
    }

    return await escalationService.requestException(
      policyId,
      context,
      reason,
      userName,
      userRole
    );
  }

  /**
   * Get all registered policies
   */
  getAllPolicies(): Policy[] {
    return enforcementEngine.getAllPolicies();
  }

  /**
   * Get a specific policy
   */
  getPolicy(policyId: string): Policy | undefined {
    return enforcementEngine.getPolicy(policyId);
  }

  /**
   * Enable a policy
   */
  enablePolicy(policyId: string): boolean {
    return enforcementEngine.enablePolicy(policyId);
  }

  /**
   * Disable a policy
   */
  disablePolicy(policyId: string): boolean {
    return enforcementEngine.disablePolicy(policyId);
  }

  /**
   * Query audit entries
   */
  async queryAuditEntries(query?: any): Promise<any[]> {
    if (!this.config.enableLogging) {
      return [];
    }
    return await auditTrail.queryEntries(query);
  }

  /**
   * Query exception requests
   */
  async queryExceptionRequests(query?: any): Promise<any[]> {
    if (!this.config.enableEscalation) {
      return [];
    }
    return await escalationService.queryRequests(query);
  }

  /**
   * Approve an exception request
   */
  async approveException(
    requestId: string,
    reviewerId: string,
    reviewerName: string,
    approvedUntil?: number,
    notes?: string
  ): Promise<boolean> {
    if (!this.config.enableEscalation) {
      return false;
    }
    return await escalationService.approveException(
      requestId,
      reviewerId,
      reviewerName,
      approvedUntil,
      notes
    );
  }

  /**
   * Reject an exception request
   */
  async rejectException(
    requestId: string,
    reviewerId: string,
    reviewerName: string,
    notes?: string
  ): Promise<boolean> {
    if (!this.config.enableEscalation) {
      return false;
    }
    return await escalationService.rejectException(
      requestId,
      reviewerId,
      reviewerName,
      notes
    );
  }
}

// Create a singleton instance
export const governanceEngine = new GovernanceEngine();
