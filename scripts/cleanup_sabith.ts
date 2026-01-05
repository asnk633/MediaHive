
require('dotenv').config({ path: '.env.local' });
import admin from 'firebase-admin';

if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            projectId,
        });
    }
}

const db = admin.firestore();
const GHOST_UID = '2J7Wi9zBfQV4nKi57GpEXCMmrkh1';
const ACTIVE_UID = '5bqy06hoIHRBpOAxIMjx8WJ7Fwg1';

async function main() {
    try {
        console.log('--- Cleaning up Sabith Accounts ---');

        // 1. Update Active Account Name
        console.log(`Updating Active Account (${ACTIVE_UID}) name to "Sabith Amjadi"...`);
        await db.collection('users').doc(ACTIVE_UID).set({
            name: 'Sabith Amjadi',
            officialName: 'Sabith Amjadi'
        }, { merge: true });
        console.log('✅ Name Updated.');

        // 2. Delete Ghost Account
        console.log(`Deleting Ghost Account (${GHOST_UID})...`);
        await db.collection('users').doc(GHOST_UID).delete();
        console.log('✅ Ghost Account Deleted.');

        console.log('--- Cleanup Complete ---');
    } catch (e) {
        console.error(e);
    }
}
main();
