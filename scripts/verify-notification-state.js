const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Load Env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2 && !line.startsWith('#')) {
            const key = parts[0].trim();
            let val = parts.slice(1).join('=').trim();
            // Remove quotes if present
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            process.env[key] = val;
        }
    });
}

async function main() {
    // 2. Init Admin
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing credentials in .env.local');
        process.exit(1);
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            projectId
        });
    }

    const email = 'verifier@thaiba.com';
    const db = admin.firestore();

    try {
        // Get User UID
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log(`Verifier UID: ${userRecord.uid}`);

        // Query notification_states
        console.log(`Querying notification_states for userId: ${userRecord.uid}`);

        // DEBUG: Dump all unrelated notifications to see what's happening
        console.log('DEBUG: Dumping last 10 notifications (any user)...');
        let snapshot = await db.collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        if (snapshot.empty) {
            console.log('No notifications found in the ENTIRE collection.');
        } else {
            console.log(`Found ${snapshot.size} global notifications.`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('--------------------------------------------------');
                console.log(`Document ID: ${doc.id}`);
                console.log(`User ID: ${data.userId}`);
                console.log(`Recipient ID: ${data.recipientId}`);
                console.log(`Task ID: ${data.taskId}`);
                console.log(`Type: ${data.type}`);
                console.log(`Data:`, JSON.stringify(data));
            });
        }
    } catch (err) {
        console.error('Error verifying notifications:', err);
    }
}

console.log('Script started...');
main().then(() => console.log('Script finished.'));
