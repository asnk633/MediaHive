import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const sql = `
        SELECT conname, pg_get_constraintdef(c.oid) 
        FROM pg_constraint c 
        JOIN pg_class t ON t.oid = c.conrelid 
        WHERE t.relname = 'profiles'
    `;

    // Trying run_sql as it's common in some setups
    const { data, error } = await (supabaseAdmin as any).rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('ERROR:', error.message);
    } else {
        console.log('CONSTRAINTS:', JSON.stringify(data, null, 2));
    }
}

check();
