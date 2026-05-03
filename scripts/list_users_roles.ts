// @ts-nocheck

require('dotenv').config({ path: '.env.local' });
import admin from 'firebase-admin';
import fs from 'fs';

if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            projectId,
        });
    } else {
        console.error('Missing credentials');
        process.exit(1);
    }
}

const auth = admin.auth();
const db = admin.firestore();

async function main() {
    try {
        const listUsers = await auth.listUsers();
        let report = [];

        for (const u of listUsers.users) {
            const doc = await db.collection('users').doc(u.uid).get();
            const data = doc.exists ? doc.data() : {};

            report.push({
                name: u.displayName || data?.officialName || 'No Name',
                email: u.email,
                uid: u.uid,
                role: data?.role || 'MISSING',
                authClaim: u.customClaims?.role || 'none'
            });
        }

        fs.writeFileSync('users_report.json', JSON.stringify(report, null, 2));
        console.log('Report saved to users_report.json');
    } catch (e) {
        console.error(e);
    }
}
main();
