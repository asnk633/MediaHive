const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('institutions').select('id, name').limit(5);
    if (error) {
        console.error('Institutions Error:', error.message);
    } else {
        console.log('--- Valid Institutions ---');
        console.log(JSON.stringify(data, null, 2));
    }
}
run();
