import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTestUsers() {
    console.log('--- Finding All Profiles ---');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role, full_name, institution_id')
        .order('role', { ascending: true });

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(JSON.stringify(profiles, null, 2));
}

findTestUsers();
