import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCleanup() {
  console.log('🔍 Running Post-E2E Database Cleanup Verification...');

  const checks = [
    { name: 'Events', table: 'events', column: 'title' },
    { name: 'Tasks', table: 'tasks', column: 'title' },
    { name: 'Inventory Items', table: 'inventory_items', column: 'name' },
    { name: 'Chat Rooms', table: 'chat_rooms', column: 'name' },
    { name: 'Notifications', table: 'notifications', column: 'title' }
  ];

  let overallPassed = true;

  for (const check of checks) {
    const { name, table, column } = check;
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select(column, { count: 'exact', head: true })
        .like(column, 'E2E-%');

      if (error) {
        throw error;
      }

      const residueCount = count ?? 0;
      if (residueCount > 0) {
        console.warn(`⚠️  [FAILED] Table '${table}' has ${residueCount} leftover E2E entries!`);
        console.log(`🧹 Cleaning up leftovers in '${table}'...`);
        const { error: deleteError } = await supabaseAdmin
          .from(table)
          .delete()
          .like(column, 'E2E-%');
        
        if (deleteError) {
          console.error(`❌ Failed to delete leftovers in '${table}':`, deleteError.message);
        } else {
          console.log(`✅ Successfully cleaned up ${residueCount} leftovers in '${table}'.`);
        }
        overallPassed = false;
      } else {
        console.log(`✅  [PASSED] Table '${table}' is clean (0 E2E leftovers).`);
      }
    } catch (e: any) {
      console.error(`❌  Error checking table '${table}':`, e.message || e);
      overallPassed = false;
    }
  }

  if (overallPassed) {
    console.log('🎉 E2E cleanup verification PASSED. All test data successfully removed.');
    process.exit(0);
  } else {
    console.error('❌ E2E cleanup verification FAILED. Some residue E2E data remains in the database.');
    process.exit(1);
  }
}

verifyCleanup();
