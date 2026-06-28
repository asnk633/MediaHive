const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from both .env and .env.local
const envConfig = {
    ...dotenv.parse(fs.readFileSync('.env')),
    ...dotenv.parse(fs.readFileSync('.env.local'))
};

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

async function checkTask() {
    const url = `${supabaseUrl}/rest/v1/tasks?id=eq.26566911-924d-4f23-9882-28bd64024a4d&select=*`;
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
    console.log('Task in Supabase DB:', JSON.stringify(data, null, 2));
}

checkTask().catch(console.error);
