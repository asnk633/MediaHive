
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function testFiles() {
    const institutionId = '0f8a1ca7-eb0a-4444-b8df-97888b47f751';
    
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('status', 'active')
        .eq('institution_id', institutionId);

    if (error) {
        console.error('Error fetching files:', error);
        return;
    }

    console.log('Files found:', data?.length);
    console.log('First file:', data?.[0]);
}

testFiles();
