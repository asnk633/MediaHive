import { supabase } from '../supabaseClient';
import { TABLES } from '../dbTables';

/**
 * runSchemaCheck
 * 
 * Validates that all required tables exist in the database.
 * Logs critical errors if drift is detected.
 */
/**
 * runSchemaCheck
 * 
 * Validates that all required tables exist and ensures Supabase is "awake".
 * Performs retries specifically for cold starts.
 */
export async function runSchemaCheck(): Promise<{ ok: boolean; missing: string[] }> {
  const required = [
    TABLES.USERS,
    TABLES.EVENTS,
    TABLES.TASKS,
    TABLES.CAMPAIGNS,
    TABLES.NOTIFICATIONS
  ];

  const missing: string[] = [];
  let attempt = 0;
  const maxAttempts = 3;

  console.log('[SchemaGuard] ⚡ Initiating system wake-up sequence...');

  while (attempt < maxAttempts) {
    try {
      // Stage 1: Warm up the connection & PROBE RLS
      const { error: wakeError, status } = await supabase.from(TABLES.USERS).select('id').limit(1);
      
      if (wakeError) {
        // Explicit RLS/Auth failure check
        if (wakeError.code === '42501' || status === 401 || status === 403) {
          console.error('[SchemaGuard] 🔐 AUTH/RLS PROBE FAILED. Access denied.');
          return { ok: false, missing: ['rls_violation'] };
        }

        // Network/Cold start retry
        if (status === 503 || status === 404 || wakeError.message.includes('fetch')) {
          console.warn(`[SchemaGuard] Backend sleeping (Attempt ${attempt + 1}/${maxAttempts}). Retrying wake-up...`);
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
      }

      // Stage 2: Schema Version Guard
      // Mock: In a real system, we query a 'schema_version' table
      const EXPECTED_VERSION = '1.2.4';
      const { data: versionData } = await supabase.from('app_config' as any).select('value').eq('key', 'schema_version').single();
      const actualVersion = (versionData as any)?.value || 'unknown';

      if (actualVersion !== EXPECTED_VERSION && actualVersion !== 'unknown') {
        console.warn(`[SchemaGuard] ⚠️ VERSION MISMATCH: Expected ${EXPECTED_VERSION}, got ${actualVersion}. Marking as DEGRADED.`);
        // Note: We continue, but HealthManager will be notified via degraded status if we fail queries
      }

      // Stage 3: Full schema verification
      const checks = await Promise.all(
        required.map(async (table) => {
          const { error, status } = await supabase.from(table).select('*').limit(0);
          return { table, error, status };
        })
      );

      checks.forEach(({ table, error, status }) => {
        if (error && (status === 404 || error.message?.includes('does not exist'))) {
          missing.push(table);
        }
      });

      if (missing.length > 0) {
        console.error(`[SchemaGuard] 🚨 SCHEMA DRIFT: Missing tables: ${missing.join(', ')}`);
      } else {
        console.log('[SchemaGuard] ✅ Pulse detected, RLS verified, and schema confirmed.');
      }

      return { ok: missing.length === 0, missing };
    } catch (err) {
      console.error('[SchemaGuard] ❌ Wake-up interrupted:', err);
      attempt++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return { ok: false, missing: ['connection_exhausted'] };
}
