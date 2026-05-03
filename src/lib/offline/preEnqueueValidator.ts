import * as Sentry from "@sentry/nextjs";
import { MutationSchemaRegistry } from './mutationSchemas';

/**
 * Pre-Enqueue Validator
 * Acts as the last gatekeeper before a mutation enters IndexedDB.
 * Prevents "poison pill" mutations from clogging the sync queue.
 */
export function validateMutationPayload(type: string, payload: any): void {
  const schema = MutationSchemaRegistry[type];

  // 1. Unknown Type: Warning only (Passthrough for future-proofing)
  if (!schema) {
    console.warn(`[Validator] ⚠️ No schema defined for mutation type: ${type}. Bypassing validation.`);
    Sentry.captureMessage(`Unknown mutation type queued: ${type}`, {
      level: 'warning',
      extra: { type, payload }
    });
    return;
  }

  // 2. Validation Check
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorDetails = result.error.format();
    const errorMessage = `Validation failed for ${type}: ${JSON.stringify(errorDetails)}`;
    
    console.error(`[Validator] ❌ ${errorMessage}`);

    // Capture to Sentry with high priority
    Sentry.captureException(new Error(`Pre-Enqueue Validation Failed: ${type}`), {
      level: 'error',
      extra: {
        mutationType: type,
        payload,
        validationErrors: result.error.issues
      }
    });

    // Throw to prevent enqueueing
    throw new Error(`[OfflineEngine] Blocked malformed mutation: ${errorMessage}`);
  }

  // 3. Success: Passthrough
  console.log(`[Validator] ✅ Payload valid for ${type}`);
}
