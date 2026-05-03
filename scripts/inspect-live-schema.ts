import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function inspectTable(table: string) {
    console.log(`--- Inspecting ${table} ---`);
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: table });

    if (error) {
        // Fallback: try selecting 1 row
        const { data: row, error: rowError } = await supabase.from(table).select('*').limit(1);
        if (rowError) {
            console.log(`Error: ${rowError.message}`);
        } else if (row && row.length > 0) {
            console.log(`Columns: ${Object.keys(row[0]).join(', ')}`);
        } else {
            console.log('Table exists but is empty. Cannot determine columns via select.');
        }
    } else {
        console.log(data);
    }
}

async function run() {
    const tables = ['tasks', 'events', 'campaigns'];
    for (const t of tables) await inspectTable(t);
}
run();
