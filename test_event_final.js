const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testEventInsert() {
    const eventData = {
        title: 'Post-Alignment Test Event',
        description: 'Verifying start_at/end_at alignment',
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 3600000).toISOString(),
        approval_status: 'approved',
        status: 'scheduled',
        institution_id: '02d1a3b0-a6f0-4444-b8df-97888b47f751',
        created_by: 'e3b0c442-98fc-1c14-9afb-f4c8996fb924' // Dummy UID
    };

    console.log('--- Testing Event Insert ---');
    const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select();

    if (error) {
        console.error('❌ Event Insert Failed:', error.message);
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Event Insert Succeeded:', data[0].id);
    }
}

testEventInsert();
