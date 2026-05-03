import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function sync() {
    const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    console.log('Logging in...');
    const { data: authData, error: aError } = await supabaseAnon.auth.signInWithPassword({
        email: 'admin@thaiba.com',
        password: 'ChangeMe123!'
    });

    if (aError) {
        console.error('LOGIN ERROR:', aError.message);
        return;
    }

    const token = authData.session.access_token;
    const userId = authData.user.id;
    console.log('Login success for ' + userId);

    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: 'Bearer ' + token } }
    });

    console.log('Attempting authenticated insert...');
    const { data, error } = await supabaseAuth.from('profiles').insert({
        id: userId,
        email: 'admin@thaiba.com',
        full_name: 'Super Admin',
        role: 'admin',
        institution_id: '02d1a3b0-a6f0-4444-b8df-97888b47f751',
        tenant_id: '0f8e65be-3600-48a9-9793-04a78e524257'
    }).select();

    if (error) {
        console.error('AUTH_INSERT_ERROR:', error.message);
    } else {
        console.log('✅ AUTH_INSERT_SUCCESS');
    }
}

sync();
