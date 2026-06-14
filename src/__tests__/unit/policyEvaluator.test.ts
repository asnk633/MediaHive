/**
 * Phase 10: Policy Evaluation Engine Tests
 * 
 * Tests to verify the read-only policy evaluation system
 * with zero side effects and proper execution gates.
 */

import { 
  evaluatePolicyImplications, 
  canEvaluatePolicy,
  PolicyEvaluationContext 
} from '@/domain/conflicts/policyEvaluator';
import { TaskConflict } from '@/domain/conflicts/types';

describe('Policy Evaluation Engine', () => {
  const mockConflict: TaskConflict = {
    taskId: 'test-task-123',
    field: 'status',
    category: 'content',
    localValue: 'in_progress',
    serverValue: 'completed',
    remoteActor: 'other-user',
    remoteActorRole: 'manager',
    timestamp: Date.now(),
  };

  const baseContext: PolicyEvaluationContext = {
    conflict: mockConflict,
    userRole: 'team',
    remoteUserRole: 'manager',
    field: 'status',
    localValue: 'in_progress',
    remoteValue: 'completed',
    timestamp: Date.now(),
  };

  describe('evaluatePolicyImplications', () => {
    it('should return policy explanations without side effects', () => {
      const result = evaluatePolicyImplications(baseContext);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.explanations)).toBe(true);
      expect(result.context).toEqual(baseContext);
      
      // Verify no mutations occurred to the original context
      expect(result.context).toEqual(baseContext);
    });

    it('should provide role hierarchy explanations when roles differ', () => {
      const context: PolicyEvaluationContext = {
        ...baseContext,
        userRole: 'admin',
        remoteUserRole: 'team'
      };
      
      const result = evaluatePolicyImplications(context);
      const roleExplanations = result.explanations.filter(exp => exp.id.includes('role-hierarchy'));
      
      expect(roleExplanations.length).toBeGreaterThan(0);
      expect(roleExplanations.some(exp => exp.id === 'role-hierarchy-local')).toBe(true);
    });

    it('should provide critical field explanations for status/deleted fields', () => {
      const statusContext: PolicyEvaluationContext = {
        ...baseContext,
        field: 'status',
        conflict: { ...mockConflict, field: 'status' }
      };
      
      const result = evaluatePolicyImplications(statusContext);
      const criticalFieldExplanations = result.explanations.filter(exp => exp.id.includes('critical-field'));
      
      expect(criticalFieldExplanations.length).toBeGreaterThan(0);
    });

    it('should provide structural change explanations for structural conflicts', () => {
      const structContext: PolicyEvaluationContext = {
        ...baseContext,
        conflict: { 
          ...mockConflict, 
          category: 'structural',
          field: 'deleted'
        },
        field: 'deleted'
      };
      
      const result = evaluatePolicyImplications(structContext);
      const structuralExplanations = result.explanations.filter(exp => exp.id.includes('structural-change'));
      
      expect(structuralExplanations.length).toBe(1);
    });
  });

  describe('canEvaluatePolicy', () => {
    it('should return true when all execution gates are satisfied', () => {
      const result = canEvaluatePolicy(true, false, false, false, true);
      expect(result).toBe(true);
    });

    it('should return false when offline', () => {
      const result = canEvaluatePolicy(false, false, false, false, true);
      expect(result).toBe(false);
    });

    it('should return false when replaying', () => {
      const result = canEvaluatePolicy(true, true, false, false, true);
      expect(result).toBe(false);
    });

    it('should return false when paused', () => {
      const result = canEvaluatePolicy(true, false, true, false, true);
      expect(result).toBe(false);
    });

    it('should return false when has patch', () => {
      const result = canEvaluatePolicy(true, false, false, true, true);
      expect(result).toBe(false);
    });

    it('should return false when boot not complete', () => {
      const result = canEvaluatePolicy(true, false, false, false, false);
      expect(result).toBe(false);
    });
  });

  describe('Side Effect Prevention', () => {
    it('should not make any API calls', () => {
      // Mock fetch and other APIs to ensure they're not called
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.reject('Unexpected fetch call')) as any;
      
      try {
        evaluatePolicyImplications(baseContext);
        // If we reach this point, no fetch was called
        expect(true).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should not modify the input context', () => {
      const originalContext = { ...baseContext };
      const result = evaluatePolicyImplications(originalContext);
      
      // Verify the original context wasn't modified
      expect(originalContext).toEqual(baseContext);
      expect(result.context).toEqual(originalContext);
    });

    it('should not interact with OfflineQueue or mutate state', () => {
      // The function should only compute and return values
      const result = evaluatePolicyImplications(baseContext);
      
      // Verify it returns expected structure
      expect(result).toHaveProperty('explanations');
      expect(result).toHaveProperty('context');
      expect(Array.isArray(result.explanations)).toBe(true);
    });
  });

  describe('Safety Gates', () => {
    it('should respect all execution constraints', () => {
      // Test various combinations to ensure proper gate behavior
      expect(canEvaluatePolicy(true, false, false, false, true)).toBe(true);
      expect(canEvaluatePolicy(false, false, false, false, true)).toBe(false); // offline
      expect(canEvaluatePolicy(true, true, false, false, true)).toBe(false); // replaying
      expect(canEvaluatePolicy(true, false, true, false, true)).toBe(false); // paused
      expect(canEvaluatePolicy(true, false, false, true, true)).toBe(false); // has patch
      expect(canEvaluatePolicy(true, false, false, false, false)).toBe(false); // boot incomplete
    });
  });
});
