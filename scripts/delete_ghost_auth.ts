
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

const auth = admin.auth();
const GHOST_UID = '2J7Wi9zBfQV4nKi57GpEXCMmrkh1';

async function main() {
    try {
        console.log(`Deleting Auth User (${GHOST_UID})...`);
        await auth.deleteUser(GHOST_UID);
        console.log('✅ Auth User Deleted Successfully.');
    } catch (e) {
        console.error('Error deleting user:', e);
    }
}
main();
