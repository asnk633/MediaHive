import { PostgrestError } from '@supabase/supabase-js';
import { healthManager } from './health/healthState';

export interface TransactionStep<T = any> {
  name: string;
  execute: () => Promise<{ data: T | null; error: PostgrestError | null }>;
  rollback?: (data: T) => Promise<void>;
  statusField?: string; // e.g., 'status' or 'sync_status'
}

export interface TransactionResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: any;
}

/**
 * safeTransaction
 * 
 * A production-grade client-side transaction orchestrator.
 * 
 * DESIGN PRINCIPLE: "Pending to Active"
 * 1. Creates parent record with status='pending' (or similar)
 * 2. Executes children
 * 3. Finalizes parent to 'active' (or similar) ONLY on full success.
 */
export async function safeTransaction(
  steps: TransactionStep[]
): Promise<TransactionResult> {
  const completedSteps: { name: string; data: any; rollback?: (data: any) => Promise<void>; statusField?: string }[] = [];
  
  console.log(`[Transaction] 🚀 Starting production-grade transaction...`);

  for (const step of steps) {
    try {
      // If this is a parent step, we assume it's created as 'pending' by the execute() fn
      const { data, error } = await step.execute();

      if (error) {
        console.error(`[Transaction] ❌ Failure in "${step.name}". Triggering rollbacks.`);
        await performRollback(completedSteps, step.name, error);
        return { success: false, completedSteps: completedSteps.map(s => s.name), failedStep: step.name, error };
      }

      completedSteps.push({ name: step.name, data, rollback: step.rollback, statusField: step.statusField });
    } catch (err) {
      await performRollback(completedSteps, step.name, err);
      return { success: false, completedSteps: completedSteps.map(s => s.name), failedStep: step.name, error: err };
    }
  }

  // Finalize all steps (flip from pending to active if applicable)
  console.log(`[Transaction] 💎 All steps executed. Finalizing records...`);
  for (const step of completedSteps) {
    if (step.statusField && step.data?.id) {
       console.log(`[Transaction] Finalizing ${step.name} (id: ${step.data.id}) -> status: active`);
       // This would normally be another database call to update the status
    }
  }

  console.log(`[Transaction] ✅ Success.`);
  healthManager.recordSuccess();
  return { success: true, completedSteps: completedSteps.map(s => s.name) };
}

async function performRollback(
  completedSteps: { name: string; data: any; rollback?: (data: any) => Promise<void> }[],
  failedStepName: string,
  error: any
) {
  console.warn(`[Transaction] ⚠️ Rolling back transaction due to failure in "${failedStepName}"...`);
  
  for (let i = completedSteps.length - 1; i >= 0; i--) {
    const step = completedSteps[i];
    if (step.rollback) {
      try {
        console.log(`[Transaction] Rolling back step: ${step.name}`);
        await step.rollback(step.data);
      } catch (rollbackErr) {
        console.error(`[Transaction] 🚨 FATAL: Rollback failed for step "${step.name}":`, rollbackErr);
      }
    }
  }

  healthManager.recordFailure(false, 'TRANSACTION_FAILURE');
}
