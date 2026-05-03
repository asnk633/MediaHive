import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from "bcryptjs";

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function provisionAdmin() {
    const email = 'admin@thaiba.com';
    const password = 'ChangeMe123!';

    console.log(`--- Provisioning ${email} ---`);

    // 1. Create Auth User
    const { data: { user: authUser }, error: aError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    if (aError) {
        if (aError.message.includes('already registered')) {
            console.log('User already exists in Auth.');
            // We need the ID
            const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
            const existingAdmin = allUsers.find(u => u.email === email);
            if (existingAdmin) {
                syncProfile(existingAdmin.id);
            }
        } else {
            console.error('Auth Create Error:', aError.message);
        }
    } else if (authUser) {
        console.log(`Created Auth User: ${authUser.id}`);
        syncProfile(authUser.id);
    }
}

async function syncProfile(authUserId: string) {
    // 2. Clear old profile for this email if it has the wrong ID
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', 'admin@thaiba.com')
        .single();

    if (profile && profile.id !== authUserId) {
        console.log(`Deleting old profile with ID: ${profile.id}`);
        await supabaseAdmin.from('profiles').delete().eq('id', profile.id);
    }

    // 3. Create/Update Profile with correct ID
    console.log(`Inserting/Updating Profile with ID: ${authUserId}`);
    const { error: iError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: authUserId,
            email: 'admin@thaiba.com',
            full_name: 'Super Admin',
            role: 'admin',
            tenant_id: '0f8e65be-3600-48a9-9793-04a78e524257',
            institution_id: '02d1a3b0-a6f0-4444-b8df-97888b47f751'
        });

    if (iError) console.error('Profile Sync Error:', iError.message);
    else console.log('✅ Admin Provisioned Successfully.');
}

provisionAdmin();
