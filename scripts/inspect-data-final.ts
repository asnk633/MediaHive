import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfile() {
    console.log('--- Profile ---');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');
    if (pError) console.error(pError.message);
    else console.log(JSON.stringify(profiles, null, 2));

    console.log('--- Tenants ---');
    const { data: tenants, error: tError } = await supabase
        .from('tenants')
        .select('*');
    if (tError) console.error(tError.message);
    else console.log(JSON.stringify(tenants, null, 2));

    console.log('--- Institutions (First 2) ---');
    const { data: insts, error: iError } = await supabase
        .from('institutions')
        .select('*')
        .limit(2);
    if (iError) console.error(iError.message);
    else console.log(JSON.stringify(insts, null, 2));
}

inspectProfile();
