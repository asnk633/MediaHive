const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = {
    ...dotenv.parse(fs.readFileSync('.env')),
    ...dotenv.parse(fs.readFileSync('.env.local'))
};

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
const anonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testUpdate() {
    // 1. Authenticate user
    const loginUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'apikey': anonKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'media@thaibagarden.com',
            password: 'media@thaiba'
        })
    });

    if (!loginResponse.ok) {
        console.error('Failed to log in:', loginResponse.status, await loginResponse.text());
        return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('Successfully logged in. Access token obtained.');

    // 2. Attempt patch
    const updateUrl = `${supabaseUrl}/rest/v1/tasks?id=eq.26566911-924d-4f23-9882-28bd64024a4d`;
    const updates = {
        title: 'Design: Album for reception purpose (web edit) ' + Date.now().toString(),
        updated_at: new Date().toISOString()
    };

    console.log('Sending patch to Supabase Rest API:', JSON.stringify(updates));
    const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
    });

    if (!updateResponse.ok) {
        console.error('Update failed with status:', updateResponse.status, await updateResponse.text());
    } else {
        const updateData = await updateResponse.json();
        console.log('Update succeeded. Response payload:', JSON.stringify(updateData, null, 2));
    }
}

testUpdate().catch(console.error);
