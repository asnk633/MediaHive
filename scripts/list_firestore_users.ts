
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

const db = admin.firestore();

async function main() {
    try {
        const snapshot = await db.collection('users').get();
        const users: any[] = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            users.push({
                id: doc.id,
                name: d.name || d.officialName,
                email: d.email,
                role: d.role,
                hasPhoto: !!(d.avatarUrl || d.photoURL)
            });
        });
        fs.writeFileSync('firestore_users.json', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}
main();
