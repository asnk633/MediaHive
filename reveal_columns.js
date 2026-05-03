const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('events').insert([{ title: 'Temp' }]).select();
    if (error) {
        console.log('--- ERROR REVEALING COLUMNS ---');
        console.log(error.message);
        console.log(error.details);
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log('--- SUCCESS REVEALING COLUMNS ---');
        console.log(Object.keys(data[0]));
    }
}
run();
