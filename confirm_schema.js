const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Checking events.start_at ---');
    const { error: e1 } = await supabase.from('events').select('start_at').limit(1);
    if (e1) console.log('start_at Error:', e1.message);
    else console.log('start_at EXISTS');

    console.log('--- Checking audit_log.timestamp ---');
    const { error: e2 } = await supabase.from('audit_log').select('timestamp').limit(1);
    if (e2) console.log('timestamp Error:', e2.message);
    else console.log('timestamp EXISTS');
}
run();
