import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function dump() {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authList = users.map(u => ({ id: u.id, email: u.email }));

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');

    const result = {
        auth: authList,
        profiles: profiles
    };

    fs.writeFileSync('db_dump.json', JSON.stringify(result, null, 2));
    console.log('Dumped to db_dump.json');
}

dump();
