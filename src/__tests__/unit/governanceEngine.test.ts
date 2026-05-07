/**
 * Phase 11: Governance Engine Tests
 * 
 * Tests to verify the governance engine works properly
 * with deterministic enforcement and proper audit trails.
 */

import { 
  Policy, 
  EnforcementContext, 
  EnforcementType, 
  PolicyScope 
} from '@/lib/governance/policySchema';
import { governanceEngine } from '@/lib/governance/governanceEngine';

describe('Governance Engine Tests', () => {
  beforeEach(async () => {
    // Initialize the governance engine before each test
    await governanceEngine.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    // In a real scenario, we might want to clear test data
  });

  it('should register and evaluate a simple policy', async () => {
    // Create a test policy
    const testPolicy: Policy = {
      id: 'test-policy-1',
      name: 'Test Policy',
      description: 'A test policy for validation',
      owner: 'admin-user',
      scope: PolicyScope.ROLE_BASED,
      rule: {
        condition: 'Role-based restriction',
        target: 'task_update',
        action: 'update',
        parameters: { field: 'status', role: 'member' }
      },
      enforcementType: EnforcementType.DISALLOWED,
      version: '1.0.0',
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
      conditions: {
        role: 'member',
        field: 'status',
        action: 'update'
      }
    };

    // Register the policy
    governanceEngine.registerPolicy(testPolicy);

    // Create an enforcement context that should match the policy
    const context: EnforcementContext = {
      policyId: 'test-policy-1',
      userId: 'user-123',
      userRole: 'member',
      action: 'update',
      resourceType: 'task',
      field: 'status',
      newValue: 'completed',
      oldValue: 'in_progress',
      timestamp: Date.now()
    };

    // Evaluate governance
    const result = await governanceEngine.evaluateGovernance(context);

    // Verify the action is not allowed due to the policy
    expect(result.allowed).toBe(false);
    expect(result.enforcementResults).toHaveLength(1);
    expect(result.enforcementResults[0].enforcementType).toBe(EnforcementType.DISALLOWED);
    expect(result.enforcementResults[0].policyId).toBe('test-policy-1');
  });

  it('should allow actions when no matching policies exist', async () => {
    // Create an enforcement context that doesn't match any policies
    const context: EnforcementContext = {
      policyId: 'non-existent-policy',
      userId: 'user-123',
      userRole: 'admin',
      action: 'create',
      resourceType: 'task',
      field: 'title',
      newValue: 'New Task',
      oldValue: undefined,
      timestamp: Date.now()
    };

    // Evaluate governance
    const result = await governanceEngine.evaluateGovernance(context);

    // Verify the action is allowed (no policies to restrict it)
    expect(result.allowed).toBe(true);
    // Should return a default "allowed" result when no policies match
    expect(result.enforcementResults).toHaveLength(1);
    expect(result.enforcementResults[0].enforcementType).toBe(EnforcementType.ALLOWED);
  });

  it('should handle REQUIRES_APPROVAL enforcement type', async () => {
    // Create a policy that requires approval
    const approvalPolicy: Policy = {
      id: 'approval-policy-1',
      name: 'Approval Required Policy',
      description: 'Requires approval for certain actions',
      owner: 'admin-user',
      scope: PolicyScope.ORGANIZATION,
      rule: {
        condition: 'Sensitive field update',
        target: 'task_priority',
        action: 'update',
        parameters: { field: 'priority', value: 'urgent' }
      },
      enforcementType: EnforcementType.REQUIRES_APPROVAL,
      version: '1.0.0',
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
      conditions: {
        field: 'priority',
        action: 'update'
      }
    };

    // Register the policy
    governanceEngine.registerPolicy(approvalPolicy);

    // Create an enforcement context that should trigger the approval policy
    const context: EnforcementContext = {
      policyId: 'approval-policy-1',
      userId: 'user-123',
      userRole: 'team',
      action: 'update',
      resourceType: 'task',
      field: 'priority',
      newValue: 'urgent',
      oldValue: 'medium',
      timestamp: Date.now()
    };

    // Evaluate governance
    const result = await governanceEngine.evaluateGovernance(context);

    // Verify the action is not allowed without explicit approval (depending on config)
    expect(result.enforcementResults).toHaveLength(1);
    expect(result.enforcementResults[0].enforcementType).toBe(EnforcementType.REQUIRES_APPROVAL);
  });

  it('should handle exception requests and approvals', async () => {
    // Create a restrictive policy
    const restrictivePolicy: Policy = {
      id: 'restrictive-policy-1',
      name: 'Restrictive Policy',
      description: 'Blocks guest users from updating status',
      owner: 'admin-user',
      scope: PolicyScope.ROLE_BASED,
      rule: {
        condition: 'Role-based restriction',
        target: 'task_status',
        action: 'update',
        parameters: { role: 'member' }
      },
      enforcementType: EnforcementType.DISALLOWED,
      version: '1.0.0',
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
      conditions: {
        role: 'member',
        action: 'update'
      }
    };

    // Register the policy
    governanceEngine.registerPolicy(restrictivePolicy);

    // First, verify that the action is disallowed
    const context: EnforcementContext = {
      policyId: 'restrictive-policy-1',
      userId: 'guest-user-123',
      userRole: 'member',
      action: 'update',
      resourceType: 'task',
      field: 'status',
      newValue: 'completed',
      oldValue: 'in_progress',
      timestamp: Date.now()
    };

    // Evaluate governance
    result = await governanceEngine.evaluateGovernance(context);
    expect(result.allowed).toBe(false);

    // Request an exception
    const requestId = await governanceEngine.requestException(
      'restrictive-policy-1',
      context,
      'Business justification for status update',
      'Member User',
      'member'
    );

    expect(requestId).toBeDefined();

    // Approve the exception
    const approved = await governanceEngine.approveException(
      requestId,
      'admin-approver',
      'Admin Approver',
      Date.now() + (24 * 60 * 60 * 1000) // Valid for 24 hours
    );

    expect(approved).toBe(true);

    // Now the same action should be allowed due to the active exception
    result = await governanceEngine.evaluateGovernance(context);
    expect(result.allowed).toBe(true);
  });

  it('should maintain proper audit trails', async () => {
    // Create a policy
    const auditPolicy: Policy = {
      id: 'audit-policy-1',
      name: 'Audit Test Policy',
      description: 'Policy for testing audit functionality',
      owner: 'admin-user',
      scope: PolicyScope.ORGANIZATION,
      rule: {
        condition: 'Audit requirement',
        target: 'task_update',
        action: 'update',
        parameters: {}
      },
      enforcementType: EnforcementType.REQUIRES_APPROVAL,
      version: '1.0.0',
      enabled: true,
      created_at: Date.now(),
      updated_at: Date.now(),
      conditions: {
        action: 'update'
      }
    };

    // Register the policy
    governanceEngine.registerPolicy(auditPolicy);

    // Create an enforcement context
    const context: EnforcementContext = {
      policyId: 'audit-policy-1',
      userId: 'user-123',
      userRole: 'team',
      action: 'update',
      resourceType: 'task',
      field: 'description',
      newValue: 'Updated description',
      oldValue: 'Original description',
      timestamp: Date.now()
    };

    // Evaluate governance (which should log to audit trail)
    const result = await governanceEngine.evaluateGovernance(context);

    // Verify the enforcement result
    expect(result.enforcementResults).toHaveLength(1);
    expect(result.enforcementResults[0].enforcementType).toBe(EnforcementType.REQUIRES_APPROVAL);

    // Query audit entries to verify logging happened
    const auditEntries = await governanceEngine.queryAuditEntries({
      policyId: 'audit-policy-1',
      userId: 'user-123'
    });

    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].policyId).toBe('audit-policy-1');
    expect(auditEntries[0].userId).toBe('user-123');
    expect(auditEntries[0].action).toBe('update');
  });

  it('should properly separate from Phase 10 guidance system', () => {
    // Verify that governance engine doesn't depend on or interact with policy guidance
    // The governance engine operates independently with its own deterministic rules
    expect(governanceEngine).toBeDefined();
    expect(governanceEngine.evaluateGovernance).toBeDefined();
    expect(governanceEngine.registerPolicy).toBeDefined();
    expect(governanceEngine.requestException).toBeDefined();
  });
});
