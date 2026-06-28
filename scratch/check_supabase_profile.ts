const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = {
    ...dotenv.parse(fs.readFileSync('.env')),
    ...dotenv.parse(fs.readFileSync('.env.local'))
};

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

async function checkProfile() {
    const userId = 'a83c7cac-0c05-4334-908c-eb9e3300b870';
    const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
    const response = await fetch(url, {
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        }
    });
    
    if (!response.ok) {
        console.error('Failed to fetch from Supabase:', response.status, await response.text());
        return;
    }

    const data = await response.json();
    console.log('Profile in Supabase DB:', JSON.stringify(data, null, 2));
}

checkProfile().catch(console.error);
