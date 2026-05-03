import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: schemas, error: sError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: "SELECT DISTINCT table_schema FROM information_schema.tables"
    });

    if (sError) {
        console.error('SCHEMA ERROR:', sError.message);
    } else {
        console.log('SCHEMAS:', JSON.stringify(schemas));
    }

    const { data: tables, error: tError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'profiles'"
    });

    if (tError) {
        console.error('TABLE ERROR:', tError.message);
    } else {
        console.log('TABLES FOUND:', JSON.stringify(tables));
    }
}

check();
