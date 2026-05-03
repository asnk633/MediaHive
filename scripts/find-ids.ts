import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findIds() {
    console.log('--- Searching for valid UUIDs ---');

    // Find a profile and its tenant/institution
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, institution_id, tenant_id') // Try both if possible
        .limit(5);

    if (pError) console.error('Profiles Error:', pError.message);
    else console.log('Profiles:', JSON.stringify(profiles, null, 2));

    // Find a tenant
    const { data: tenants, error: tError } = await supabase
        .from('tenants')
        .select('id, name')
        .limit(1);

    if (tError) console.error('Tenants Error:', tError.message);
    else console.log('Tenants:', JSON.stringify(tenants, null, 2));
}

findIds();
