import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName: string) {
    console.log(`\n--- Inspecting ${tableName} ---`);

    // Attempting to use a raw query if it exists, or just checking data types via data.
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        const first = data[0];
        for (const [key, value] of Object.entries(first)) {
            console.log(`${key}: ${typeof value} (Example: ${value})`);
        }
    } else {
        console.log('Table is empty. Use SQL Editor to check schema.');
    }
}

async function run() {
    await inspectTable('tenants');
    await inspectTable('institutions');
    await inspectTable('tasks');
}

run();
