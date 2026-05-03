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
        console.error('Missing credentials');
        process.exit(1);
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            projectId
        });
    }

    const db = admin.firestore();

    try {
        console.log('--- DEBUG START ---');
        const tasksSnapshot = await db.collection('tasks')
            .where('title', '==', 'Test Notification Assignment')
            .get();

        if (tasksSnapshot.empty) {
            console.log('Task NOT found!');
            return;
        }

        const taskDoc = tasksSnapshot.docs[0];
        const data = taskDoc.data();

        console.log(`Task ID: ${taskDoc.id}`);
        console.log(`Title: ${data.title}`);
        console.log(`CreatedBy Value:`, data.createdBy);
        console.log(`CreatedBy Type:`, typeof data.createdBy);

        console.log('--- NOTIFICATIONS ---');
        // Check for ANY notification linked to this task
        const notifs = await db.collection('notification_states') // Using notification_states? Wait, implementation might check 'notifications' collection?
            // The code uses `ServerNotification.create` which writes to `notifications` (or `notification_states`).
            // `server-notification.ts` line 11 says `const NOTIFICATIONS_COLLECTION = 'notifications';`.
            // BUT user prompt earlier said "Refactor Smart Notifications... remove notification state from Task... implement `notification_states`".
            // AND `verify-notification-state.js` checked `notification_states`.
            // This is a conflict. 
            // `server-notification.ts` seems to write to 'notifications'.
            // `verify-notification-state.js` reads 'notification_states'.
            // I need to check if they are same or different.
            // Let's check 'notifications' collection too.
            .where('entityId', '==', taskDoc.id)
            .get();

        console.log(`Found ${notifs.size} docs in 'notification_states'`);

        const legacyNotifs = await db.collection('notifications')
            .where('entityId', '==', taskDoc.id)
            .get();

        console.log(`Found ${legacyNotifs.size} docs in 'notifications'`);
        legacyNotifs.forEach(d => {
            console.log(`[Notification] ID: ${d.id}, To: ${d.data().userId} (${typeof d.data().userId}), Type: ${d.data().type}`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
