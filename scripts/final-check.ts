import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const au = users.find(u => u.email === 'admin@thaiba.com');
    const { data: pr } = await supabaseAdmin.from('profiles').select('id').eq('email', 'admin@thaiba.com').single();
    console.log(`Auth ID: ${au?.id}`);
    console.log(`Profile ID: ${pr?.id}`);
    if (au?.id === pr?.id && au?.id) console.log('✅ MATCH');
    else console.log('❌ MISMATCH');
}
check();
