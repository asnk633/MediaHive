// @ts-nocheck

require('dotenv').config({ path: '.env.local' });
import admin from 'firebase-admin';

// Initialize Admin SDK
if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            projectId,
        });
        console.log('Firebase Admin Initialized');
    } else {
        console.error('Missing credentials in .env.local');
        process.exit(1);
    }
}

const auth = admin.auth();
const db = admin.firestore();

const TARGET_UID = '5bqy06hoIHRBpOAxIMjx8WJ7Fwg1';

async function main() {
    try {
        console.log("--- Searching for Sabith ---");

        // 1. List Users
        const listUsers = await auth.listUsers();
        let found = false;

        for (const user of listUsers.users) {
            const name = user.displayName || '';
            const email = user.email || '';

            if (name.toLowerCase().includes('sabith') || email.toLowerCase().includes('sabith') || user.uid === TARGET_UID) {
                console.log(`User Found:`);
                console.log(` - UID: ${user.uid}`);
                console.log(` - Name: ${user.displayName}`);
                console.log(` - Email: ${user.email}`);

                // Check Firestore
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    console.log(` - Firestore Role: ${doc.data()?.role}`);
                } else {
                    console.log(` - Firestore Doc: MISSING`);
                }

                // Check Claims
                console.log(` - Claims: ${JSON.stringify(user.customClaims)}`);
                console.log('-----------------------------------');
            }
        }

        console.log(`\n--- Fixing Target User: ${TARGET_UID} ---`);

        // 2. Fix Firestore
        await db.collection('users').doc(TARGET_UID).set({
            role: 'team',
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Updated Firestore role to "team"');

        // 3. Fix Custom Claims
        await auth.setCustomUserClaims(TARGET_UID, { role: 'team' });
        console.log('✅ Updated Auth Claims to "team"');

    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
