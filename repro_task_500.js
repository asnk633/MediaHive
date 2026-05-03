const fetch = require('node-fetch');

async function testTaskCreate() {
    const url = 'http://localhost:3000/api/tasks';
    const payload = {
        title: "Test Task from Script",
        description: "Reproduction",
        status: "todo",
        priority: "medium",
        department_id: "00000000-0000-0000-0000-000000000000" // Example UUID
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Assuming session cookies are handled by local dev server if we send them, 
                // but for a script we might need to mock auth or send a valid token.
                // However, the error from subagent was 500, not 401.
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const text = await response.text();
        console.log('Status:', status);
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

testTaskCreate();
