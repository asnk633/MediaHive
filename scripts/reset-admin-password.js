
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

    const email = 'media@thaibagarden.com';
    const password = 'Admin123!';
    let uid = '';

    try {
        // 3. Update/Create Auth User
        try {
            const user = await admin.auth().getUserByEmail(email);
            uid = user.uid;
            console.log(`User ${email} exists (uid: ${uid}). Updating password...`);
            await admin.auth().updateUser(uid, { password });
            console.log('Password updated.');
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                console.log(`Creating user ${email}...`);
                const user = await admin.auth().createUser({
                    email,
                    password,
                    displayName: 'Super Admin'
                });
                uid = user.uid;
                console.log('User created:', uid);
            } else {
                throw e;
            }
        }

        // 4. Set Custom Claims
        const customClaims = {
            superAdmin: true,
            admin: true,
            isTeam: true,
        };
        await admin.auth().setCustomUserClaims(uid, customClaims);
        console.log('Custom claims set:', customClaims);

        // 5. Sync to Firestore
        const db = admin.firestore();
        await db.collection('users').doc(uid).set({
            uid: uid,
            email: email,
            name: 'Super Admin',
            role: 'admin',
            isAdmin: true,
            isTeam: true,
            institutionId: 'thaiba-media-main',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Synced to Firestore users collection.');

    } catch (err) {
        console.error('Error managing user:', err);
        process.exit(1);
    }
}

main();
