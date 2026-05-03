import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listColumns(tableName: string) {
    console.log(`--- Columns in ${tableName} ---`);
    // Attempting to select 0 rows to get column names from response if possible,
    // or just checking what the client knows.
    // In many environments, the API doesn't expose full schema easily,
    // so we'll try a targeted select of everything.
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('Table is empty, trying to probe common columns...');
        // If empty, we can't easily get names via select *.
    }
}

async function run() {
    await listColumns('tasks');
    await listColumns('events');
    await listColumns('campaigns');
    await listColumns('departments');
}

run();
