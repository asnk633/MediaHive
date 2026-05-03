import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

let report = '';
function log(msg: string, ...args: any[]) {
    const formatted = msg + (args.length > 0 ? ' ' + args.map(a => JSON.stringify(a)).join(' ') : '') + '\n';
    console.log(msg, ...args);
    report += formatted;
}

async function inspectTable(tableName: string) {
    log(`\n--- Inspecting Table: ${tableName} ---`);

    // Attempt to select one row to see columns
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        log(`Error selecting from ${tableName}: ${error.message}`);
        return;
    }

    if (data && data.length > 0) {
        log(`Columns found in ${tableName}: ${Object.keys(data[0]).join(', ')}`);
    } else {
        log(`Table ${tableName} is empty, attempting targeted select for common columns...`);
        const columns = ['id', 'institution_id', 'name', 'status', 'created_at', 'updated_at', 'tenant_id', 'owner_id', 'read', 'type'];
        for (const col of columns) {
            const { error: colError } = await supabase.from(tableName).select(col).limit(1);
            if (colError) {
                log(`[MISSING] Column ${col} in ${tableName}`);
            } else {
                log(`[FOUND] Column ${col} in ${tableName}`);
            }
        }
    }
}

async function run() {
    try {
        await inspectTable('campaigns');
        await inspectTable('notifications');
        await inspectTable('users');
        await inspectTable('audit_log');

        fs.writeFileSync('schema-final-report-v2.txt', report, 'utf8');
        console.log('Report written to schema-final-report-v2.txt');
    } catch (err: any) {
        console.error('Run error:', err.message);
    }
}

run();
