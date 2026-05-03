import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function sync() {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const adminUid = 'e0a0d64a-3ed8-472c-8d9a-baad3ffb01f0';
    console.log('Inserting admin profile for id: ' + adminUid);

    const { data, error } = await supabaseAdmin.from('profiles').upsert({
        id: adminUid,
        email: 'admin@thaiba.com',
        full_name: 'Super Admin',
        role: 'admin',
        institution_id: '02d1a3b0-a6f0-4444-b8df-97888b47f751'
    }).select();

    if (error) {
        console.error('INSERT_FAIL:', error.message);
    } else {
        console.log('✅ INSERT_SUCCESS');
    }
}

sync();
