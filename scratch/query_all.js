const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const tables = ['tasks', 'events', 'inventory'];
    for (const table of tables) {
        console.log(`\n--- Querying ${table} ---`);
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(1);

        if (error) {
            console.error(`Error in ${table}:`, error);
        } else {
            console.log(`Success in ${table}. Count: ${count}. Sample:`, data);
        }
    }
}
run();
