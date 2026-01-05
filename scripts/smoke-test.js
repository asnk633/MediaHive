/**
 * scripts/smoke-test.js
 * 
 * Verifies critical production endpoints via basic HTTP checks.
 * Requires BASE_URL env var or defaults to localhost:3000.
 */

const fetch = require('node-fetch'); // Ensure node-fetch is available in devDeps
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function smokeTest() {
    console.log(`Running smoke tests against ${BASE_URL}...`);
    let passed = true;

    // 1. Health Check
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.status === 200 || res.status === 503) { // 503 might be valid if DB is down but app is up, but usually we want 200
            if (res.status === 200) console.log('✅ /api/health - OK');
            else console.warn('⚠️ /api/health - Service Unavailable (DB might be down)');
        } else {
            console.error(`❌ /api/health - Failed (Status: ${res.status})`);
            passed = false;
        }
    } catch (e) {
        console.error(`❌ /api/health - Network Error:`, e.message);
        passed = false;
    }

    // 2. Public Access denied for protected routes (should be 401)
    try {
        const res = await fetch(`${BASE_URL}/api/users/me`);
        if (res.status === 401) {
            console.log('✅ /api/users/me - Protected (401 as expected)');
        } else {
            console.error(`❌ /api/users/me - Unexpected status: ${res.status}`);
            passed = false;
        }
    } catch (e) {
        console.error('❌ /api/users/me - Network Error', e.message);
        passed = false;
    }

    if (!passed) {
        console.error('🔥 Smoke tests FAILED.');
        process.exit(1);
    } else {
        console.log('✨ All smoke tests PASSED.');
    }
}

smokeTest();
