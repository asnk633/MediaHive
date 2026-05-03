/**
 * Phase 10: Read-Only Policy Guidance Hook
 * 
 * Provides policy explanations without any side effects or state mutations.
 * This hook only computes and provides guidance - it does not influence decisions.
 */

import { useMemo } from 'react';
import { 
  evaluatePolicyImplications, 
  canEvaluatePolicy, 
  PolicyEvaluationContext, 
  PolicyEvaluationResult 
} from '@/domain/conflicts/policyEvaluator';
import { TaskConflict } from '@/domain/conflicts/types';

interface UsePolicyGuidanceProps {
  conflict: TaskConflict;
  userRole: string;
  remoteUserRole: string;
  isOnline: boolean;
  isReplaying: boolean;
  isPaused: boolean;
  hasPatch: boolean;
  isBootComplete: boolean;
}

export function usePolicyGuidance({
  conflict,
  userRole,
  remoteUserRole,
  isOnline,
  isReplaying,
  isPaused,
  hasPatch,
  isBootComplete
}: UsePolicyGuidanceProps): PolicyEvaluationResult | null {
  const policyResult = useMemo(() => {
    // Check execution gates before evaluating policy
    if (!canEvaluatePolicy(isOnline, isReplaying, isPaused, hasPatch, isBootComplete)) {
      return null;
    }

    // Create evaluation context from the provided parameters
    const context: PolicyEvaluationContext = {
      conflict,
      userRole,
      remoteUserRole,
      field: conflict.field,
      localValue: conflict.localValue,
      remoteValue: conflict.serverValue,
      timestamp: Date.now()
    };

    // Evaluate policy implications (pure function with no side effects)
    return evaluatePolicyImplications(context);
  }, [
    conflict,
    userRole,
    remoteUserRole,
    isOnline,
    isReplaying,
    isPaused,
    hasPatch,
    isBootComplete
  ]);

  return policyResult;
}
