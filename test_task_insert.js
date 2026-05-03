const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const taskData = {
        title: 'Test Task ' + Date.now(),
        status: 'todo',
        priority: 'medium',
        institution_id: 'd88e7d23-286d-4950-8911-c917ee72944b',
        created_by: 'e3b0c442-98fc-1c14-9afb-f4c8996fb924' // Example UID
    };

    const { data, error } = await supabase.from('tasks').insert([taskData]).select();
    if (error) {
        console.error('Task Insert Error:', error.message);
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log('Task Insert SUCCEEDED:', data[0].id);
    }
}
run();
