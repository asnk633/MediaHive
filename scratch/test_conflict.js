const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = {
    ...dotenv.parse(fs.readFileSync('.env')),
    ...dotenv.parse(fs.readFileSync('.env.local'))
};

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
const anonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function runTest() {
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
    console.log('Successfully logged in. Token obtained.');

    const taskId = '26566911-924d-4f23-9882-28bd64024a4d';
    const putUrl = `http://localhost:3000/api/tasks/${taskId}`;

    function generateUUID() {
        return '11111111-2222-3333-4444-555555555555'.replace(/[12345]/g, () => Math.floor(Math.random() * 16).toString(16));
    }

    // Helper to fetch current task from Supabase DB to get current updated_at
    const fetchCurrentTask = async () => {
        const url = `${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}&select=*`;
        const res = await fetch(url, {
            headers: {
                'apikey': envConfig.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const data = await res.json();
        return data[0];
    };

    // --- TEST 1: Client Wins (client_timestamp is newer) ---
    console.log('\n--- TEST 1: Client Wins ---');
    let task = await fetchCurrentTask();
    console.log(`Current task title: "${task.title}"`);
    console.log(`Current task updated_at: ${task.updated_at}`);

    // Set client_timestamp to 2 minutes in the future compared to server updated_at
    const serverTime = new Date(task.updated_at).getTime();
    const clientTimeNewer = new Date(serverTime + 120000).toISOString();
    const newTitleClientWins = 'Title Client Wins ' + Date.now();

    console.log(`Sending client_timestamp (newer): ${clientTimeNewer}`);
    console.log(`Sending title: "${newTitleClientWins}"`);

    let putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': generateUUID()
        },
        body: JSON.stringify({
            title: newTitleClientWins,
            client_timestamp: clientTimeNewer
        })
    });

    if (!putResponse.ok) {
        console.error('PUT failed:', putResponse.status, await putResponse.text());
    } else {
        const data = await putResponse.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    }

    // --- TEST 2: Server Wins (client_timestamp is older) ---
    console.log('\n--- TEST 2: Server Wins ---');
    task = await fetchCurrentTask();
    console.log(`Current task title: "${task.title}"`);
    console.log(`Current task updated_at: ${task.updated_at}`);

    // Set client_timestamp to 2 minutes in the past compared to server updated_at
    const serverTime2 = new Date(task.updated_at).getTime();
    const clientTimeOlder = new Date(serverTime2 - 120000).toISOString();
    const newTitleServerWins = 'Title Server Wins ' + Date.now();

    console.log(`Sending client_timestamp (older): ${clientTimeOlder}`);
    console.log(`Sending title: "${newTitleServerWins}"`);

    putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': generateUUID()
        },
        body: JSON.stringify({
            title: newTitleServerWins,
            client_timestamp: clientTimeOlder
        })
    });

    if (!putResponse.ok) {
        console.error('PUT failed:', putResponse.status, await putResponse.text());
    } else {
        const data = await putResponse.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    }
}

runTest().catch(console.error);
