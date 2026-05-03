const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('institutions').select('id').limit(1);
    if (data && data.length > 0) {
        console.log('FIRST_INSTITUTION_ID:', data[0].id);
    }
}
run();
