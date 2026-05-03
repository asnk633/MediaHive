// @ts-nocheck

require('dotenv').config({ path: '.env.local' });
import admin from 'firebase-admin';

// Initialize Admin SDK
if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Handle private key newlines
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

async function main() {
    try {
        const user = await auth.getUserByEmail('amarthaibachannel@gmail.com');
        console.log(`Found user: ${user.uid}`);

        // Update Firestore Role
        await db.collection('users').doc(user.uid).update({ role: 'guest' });
        console.log('Successfully demoted to guest in Firestore');

        // Update Custom Claims (just in case)
        await auth.setCustomUserClaims(user.uid, { role: 'guest' });
        console.log('Updated custom claims to guest');

    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
