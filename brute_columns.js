const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const commonNames = ['start_time', 'start_at', 'date', 'event_date', 'scheduled_at', 'starts_at'];
    console.log('--- Testing columns for events ---');
    for (const name of commonNames) {
        const { error } = await supabase.from('events').select(name).limit(1);
        if (!error) {
            console.log(`✅ Column '${name}' EXISTS`);
        } else {
            console.log(`❌ Column '${name}' MISSING: ${error.message}`);
        }
    }
}
run();
