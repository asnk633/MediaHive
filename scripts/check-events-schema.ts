import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const sql = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'events'
    `;

    // We confirmed 'dump-db.ts' works with .from('profiles').select('*')
    // So columns for 'events' should also be accessible via a standard query if we select *
    const { data: sample } = await supabaseAdmin.from('events').select('*').limit(1);
    if (sample && sample[0]) {
        console.log('SAMPLE_ROW:', JSON.stringify(Object.keys(sample[0])));
    } else {
        console.log('NO_SAMPLE_DATA');
    }
}

check();
