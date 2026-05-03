const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('tasks').insert([{ title: 'Test', created_by: { uid: '123' } }]).select();
    if (error) {
        console.log('--- tasks error for JSON ---');
        console.log(error.message);
    } else {
        console.log('--- tasks success for JSON ---');
    }

    const { error: error2 } = await supabase.from('tasks').insert([{ title: 'Test2', created_by: '123' }]).select();
    if (error2) {
        console.log('--- tasks error for STRING ---');
        console.log(error2.message);
    } else {
        console.log('--- tasks success for STRING ---');
    }
}
run();
