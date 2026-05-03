import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { cookies } from 'next/headers'; // This won't work in a standalone script.

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function debugVerifyUser() {
    // We can't easily mock the session from here, 
    // but we can check if the profile exists for the known admin email.

    const email = 'admin@thaiba.com';
    console.log(`Checking profile for email: ${email}`);

    const { data: profile, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (pError) {
        console.error('Profile Lookup Error:', pError.message);
    } else {
        console.log('Profile Found:', JSON.stringify(profile, null, 2));
    }

    // Now let's see if we can find any other profiles
    const { data: allProfiles, error: aError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role');

    console.log('All Profiles Count:', allProfiles?.length);
    console.log('Sample IDs:', allProfiles?.map(p => p.id));
}

debugVerifyUser();
