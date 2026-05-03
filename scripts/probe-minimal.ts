import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function probeMinimal() {
    console.log('--- Probing tasks (Minimal) ---');
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title: 'Minimal Probe',
            institution_id: 1
        })
        .select();

    if (error) {
        console.log('Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS:', JSON.stringify(data, null, 2));
    }
}

probeMinimal();
