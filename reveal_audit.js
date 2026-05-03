const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { error } = await supabase.from('audit_log').insert([{ action: 'test' }]).select();
    if (error) {
        console.log('--- audit_log columns ---');
        console.log(error.message);
    } else {
        console.log('--- audit_log Success ---');
    }
}
run();
