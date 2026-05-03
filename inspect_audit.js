const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('audit_log').select('*').order('id', { ascending: false }).limit(1);
    if (data && data.length > 0) {
        console.log('--- audit_log keys ---');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('No data in audit_log');
    }
}
run();
