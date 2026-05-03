
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
    // Fix newlines in private key
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing credentials in .env.local');
        console.log('Project:', projectId);
        console.log('Email:', clientEmail);
        console.log('Key Length:', privateKey ? privateKey.length : 0);
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
    const password = 'Verifier123!';

    try {
        try {
            const user = await admin.auth().getUserByEmail(email);
            console.log(`User ${email} exists (uid: ${user.uid}). Updating password...`);
            await admin.auth().updateUser(user.uid, { password });
            console.log('Password updated.');
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                console.log(`Creating user ${email}...`);
                const user = await admin.auth().createUser({
                    email,
                    password,
                    displayName: 'Verifier Bot'
                });
                console.log('User created:', user.uid);
            } else {
                throw e;
            }
        }

        // SYNC TO FIRESTORE
        const userRecord = await admin.auth().getUserByEmail(email);
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: email,
            name: 'Verifier Bot',
            role: 'team',
            isAdmin: false,
            isTeam: true,
            institutionId: '1',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Synced to Firestore users collection.');

    } catch (err) {
        console.error('Error managing user:', err);
        process.exit(1);
    }
}

main();
