// scripts/seed-e2e-user.js
// Node 18+ has native fetch. If on older node, we might need a polyfill.
// Usage: node scripts/seed-e2e-user.js

const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const email = process.env.E2E_TEST_EMAIL || 'smoke@test.local';
const password = process.env.E2E_TEST_PW || 'Pass123';
const payload = { email, password, role: 'admin' };

const endpoints = [
    '/api/test-utils/seed-user',
    '/api/test-utils/seed',
    '/api/auth/register',
    '/api/users',
    '/api/admin/create-test-user'
];

async function tryPost(url) {
    try {
        // Try native fetch first
        let doFetch = global.fetch;
        if (!doFetch) {
            // Fallback to dynamic import for node-fetch if native not available
            const mod = await import('node-fetch');
            doFetch = mod.default;
        }

        const res = await doFetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
    } catch (err) {
        return { ok: false, status: 0, text: err.message || String(err) };
    }
}

(async () => {
    console.log(`Targeting Base URL: ${base}`);

    for (const ep of endpoints) {
        const url = `${base.replace(/\/$/, '')}${ep}`;
        console.log(`Trying ${url} ...`);
        const r = await tryPost(url);
        console.log(`-> status=${r.status} ok=${r.ok}`);
        if (r.ok) {
            console.log('Seed succeeded at', url);
            console.log('Response:', r.text);
            process.exit(0);
        } else {
            // Truncate long error responses
            const snippet = r.text.length > 200 ? r.text.substring(0, 200) + '...' : r.text;
            console.log('Response or error:', snippet);
        }
    }
    console.error('All seed endpoints returned non-2xx or failed.');
    console.error('Options:');
    console.error('- Ensure FIREBASE_ADMIN_SA env var is set or service-account.json exists.');
    console.error('- Check server logs for 500 errors.');
    process.exit(2);
})();
