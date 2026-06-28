const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = {
    ...dotenv.parse(fs.readFileSync('.env')),
    ...dotenv.parse(fs.readFileSync('.env.local'))
};

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

async function checkUserAndTenant() {
    const email = 'media@thaibagarden.com';
    const url = `${supabaseUrl}/rest/v1/profiles?email=eq.${email}&select=*`;
    const response = await fetch(url, {
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        }
    });
    
    const data = await response.json();
    console.log('User Profile in Supabase:', JSON.stringify(data, null, 2));
}

checkUserAndTenant().catch(console.error);
