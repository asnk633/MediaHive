import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sync() {
    const adminUid = 'e0a0d64a-3ed8-472c-8d9a-baad3ffb01f0';
    console.log('Inserting admin profile for id: ' + adminUid);

    // Cleanup first to avoid any unique constraint issues with email if it exists elsewhere
    await supabaseAdmin.from('profiles').delete().eq('email', 'admin@thaiba.com');
    await supabaseAdmin.from('profiles').delete().eq('id', adminUid);

    const { data, error } = await supabaseAdmin.from('profiles').insert({
        id: adminUid,
        email: 'admin@thaiba.com',
        full_name: 'Super Admin',
        role: 'admin',
        tenant_id: '0f8e65be-3600-48a9-9793-04a78e524257',
        institution_id: '02d1a3b0-a6f0-4444-b8df-97888b47f751'
    }).select();

    if (error) {
        console.error('INSERT_FAIL:', error.message);
        console.error('DETAILS:', error.details);
        console.error('HINT:', error.hint);
    } else {
        console.log('✅ INSERT_SUCCESS:', data[0].id);
    }
}

sync();
