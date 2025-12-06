// scripts/validate-firebase-sa.js
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use require for firebase-admin to ensure compatibility if it's CJS
const adminPkg = require('firebase-admin');

async function run() {
    const saPath = process.env.FIREBASE_ADMIN_SA_PATH || './service-account.json';
    try {
        if (!fs.existsSync(saPath)) {
            console.error('SERVICE ACCOUNT FILE NOT FOUND at', saPath);
            process.exit(2);
        }
        const raw = fs.readFileSync(saPath, 'utf8');
        let json;
        try { json = JSON.parse(raw); } catch (e) {
            console.error('JSON PARSE ERROR:', e.message);
            process.exit(3);
        }

        console.log('Initializing firebase-admin from', saPath);
        console.log(`Project ID from JSON: ${json.project_id}`);

        if (!adminPkg.apps.length) {
            adminPkg.initializeApp({ credential: adminPkg.credential.cert(json) });
        }

        const testEmail = process.env.E2E_TEST_EMAIL || 'smoke@test.local';
        const testPassword = process.env.E2E_TEST_PW || 'Pass123';

        console.log('Trying to create or get user:', testEmail);
        try {
            const existing = await adminPkg.auth().getUserByEmail(testEmail);
            console.log(`User exists: ${existing.uid}`);
            await adminPkg.auth().setCustomUserClaims(existing.uid, { role: 'admin' });
            console.log('Updated custom claims for existing user.');
            process.exit(0);
        } catch (err) {
            // "auth/user-not-found" is expected
            console.log('User check result:', err.code || err.message);
        }

        console.log('Creating user...');
        const created = await adminPkg.auth().createUser({ email: testEmail, password: testPassword, emailVerified: true });
        console.log('User created uid=', created.uid);
        await adminPkg.auth().setCustomUserClaims(created.uid, { role: 'admin' });
        console.log('Set custom claims; success.');
        process.exit(0);
    } catch (err) {
        console.error('UNEXPECTED ERROR', err && err.stack || err);
        process.exit(4);
    }
}

run();
