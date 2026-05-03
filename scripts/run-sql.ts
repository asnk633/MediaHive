import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql(filePath: string) {
    console.log(`🚀 Running SQL from ${filePath}...`);

    try {
        const sql = fs.readFileSync(path.resolve(filePath), 'utf8');

        // Split by semicolon to run multiple statements if needed, 
        // though Supabase RPC/REST might have limitations on complex scripts.
        // For simple ALTER TABLE/ADD COLUMN, we'll try a single execution first.

        const { data, error } = await (supabase as any).rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Fallback: If exec_sql RPC is not available, we might need another way.
            // In many Supabase setups, you can't run arbitrary SQL via the client without a custom function.
            console.error('❌ SQL Execution failed:', error.message);
            console.warn('💡 Tip: If "exec_sql" is missing, you must run the SQL manually in Supabase SQL Editor.');

            // Log the SQL to help the user if needed
            console.log('\n--- SQL START ---');
            console.log(sql);
            console.log('--- SQL END ---\n');

            process.exit(1);
        }

        console.log('✅ SQL executed successfully.');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Error reading or running SQL:', err.message);
        process.exit(1);
    }
}

const file = process.argv[2];
if (!file) {
    console.error('Usage: npx tsx scripts/run-sql.ts <path-to-sql-file>');
    process.exit(1);
}

runSql(file);
