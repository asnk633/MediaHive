const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const testEvent = {
        title: 'Test Event ' + Date.now(),
        start_time: new Date().toISOString(), // Trying start_time
        institution_id: 'd88e7d23-286d-4950-8911-c917ee72944b' // Example UUID from previous turns if any
    };

    const { data, error } = await supabase.from('events').insert([testEvent]).select();
    if (error) {
        console.error('Insert Error:', error.message);
        // If start_time fails, try start_at
        const { data: d2, error: e2 } = await supabase.from('events').insert([{ ...testEvent, start_at: testEvent.start_time }]).select();
        if (e2) {
            console.error('Insert with start_at also failed:', e2.message);
        } else {
            console.log('Insert with start_at SUCCEEDED!');
        }
    } else {
        console.log('Insert with start_time SUCCEEDED!');
    }
}
run();
