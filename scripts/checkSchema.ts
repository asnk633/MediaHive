import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const tables: Record<string, string[]> = {
    tasks: ['id', 'title', 'status', 'institution_id', 'created_by', 'department_id', 'tenant_id'],
    events: ['id', 'title', 'start_at', 'end_at', 'institution_id', 'on_behalf_of', 'organizer', 'created_by', 'tenant_id'],
    campaigns: ['id', 'name', 'start_date', 'institution_id', 'owner_id', 'tenant_id'],
    audit_log: ['id', 'action', 'created_at']
};

async function checkSchema() {
    console.log('\x1b[36m%s\x1b[0m', '🔍 MediaHive Schema Validation Starting...');
    let healthy = true;

    for (const [table, _] of Object.entries(tables)) {
        const columns = tables[table as keyof typeof tables];
        try {
            const { error } = await supabase
                .from(table)
                .select(columns.join(','))
                .limit(1);

            if (error) {
                console.error('\x1b[31m%s\x1b[0m', `❌ Table ${table} is DRIFTED or MISSING!`);
                console.error(`   Error: ${error.message}`);
                healthy = false;
            } else {
                console.log('\x1b[32m%s\x1b[0m', `✅ Table ${table} is aligned.`);
            }
        } catch (err: any) {
            console.error('\x1b[31m%s\x1b[0m', `❌ Table ${table} check failed: ${err.message}`);
            healthy = false;
        }
    }

    if (!healthy) {
        console.warn('\n\x1b[33m%s\x1b[0m', '⚠️  DATABASE SCHEMA MISMATCH DETECTED!');
        console.warn('   Please check src/db/migrations/ and run missing SQL in Supabase.');
    } else {
        console.log('\n\x1b[32m%s\x1b[0m', '✨ Database schema is perfectly aligned.');
    }
}

checkSchema();
