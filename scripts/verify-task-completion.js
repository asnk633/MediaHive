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
        console.log('Searching for task "Test Notification Assignment"...');
        const snapshot = await db.collection('tasks')
            .where('title', '==', 'Test Notification Assignment')
            .get();

        if (snapshot.empty) {
            console.log('Task NOT found!');
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`Task ID: ${doc.id}`);
                console.log(`Title: ${data.title}`);
                console.log(`Status: ${data.status}`);
                console.log(`Updated At: ${data.updatedAt ? data.updatedAt.toDate() : 'N/A'}`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
