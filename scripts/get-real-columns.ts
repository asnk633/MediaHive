import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function getRealColumns(table: string) {
    // We try a query that uses a non-existent column to trigger a Postgres error that reveals real columns
    // or just use information_schema if we have permission via RPC (unlikely)
    // Actually, we can just try to select * and see the keys of the returned object (if any)
    // But tables are empty. 
    // Let's use a raw SQL query if we have an RPC for it.
    // If not, we can use the Supabase 'rest' error message which sometimes lists valid columns.

    const { error } = await supabase.from(table).select('non_existent_column_123');
    console.log(`--- ${table} ---`);
    console.log(error?.message);
}

async function run() {
    const tables = ['tasks', 'events', 'campaigns'];
    for (const t of tables) await getRealColumns(t);
}
run();
