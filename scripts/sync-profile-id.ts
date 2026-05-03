import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function syncProfile() {
    console.log('--- Syncing Profile UID ---');

    // 1. Find the real Auth user
    const { data: { users: authUsers }, error: aError } = await supabaseAdmin.auth.admin.listUsers();
    if (aError) {
        console.error('Auth List Error:', aError.message);
        return;
    }

    const authAdmin = authUsers.find(u => u.email === 'admin@thaiba.com');
    if (!authAdmin) {
        console.error('Admin NOT found in Auth users!');
        return;
    }
    console.log(`Real Auth UID for admin@thaiba.com: ${authAdmin.id}`);

    // 2. Find the current Profile
    const { data: profile, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', 'admin@thaiba.com')
        .single();

    if (pError) {
        console.log('Profile NOT found. Creating one...');
        // Create if missing
        const { error: iError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authAdmin.id,
                email: 'admin@thaiba.com',
                full_name: 'Super Admin',
                role: 'admin',
                tenant_id: '0f8e65be-3600-48a9-9793-04a78e524257', // From my previous view
                institution_id: '02d1a3b0-a6f0-4444-b8df-97888b47f751'
            });
        if (iError) console.error('Insert Error:', iError.message);
        else console.log('Profile created successfully.');
    } else {
        console.log(`Current Profile UID: ${profile.id}`);
        if (profile.id !== authAdmin.id) {
            console.log('MISMATCH! Updating profile ID...');
            // We can't easily update a primary key directly if others reference it, 
            // but we can delete and re-insert or just update the row if nothing references it yet.
            // Actually, we should probably delete the old and insert the new.
            const { error: dError } = await supabaseAdmin.from('profiles').delete().eq('id', profile.id);
            if (dError) console.error('Delete Error:', dError.message);

            const { error: iError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    ...profile,
                    id: authAdmin.id
                });
            if (iError) console.error('Re-insert Error:', iError.message);
            else console.log('Profile ID updated successfully.');
        } else {
            console.log('IDs match. No update needed.');
        }
    }
}

syncProfile();
