const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            projectId
        });
    }

    const email = 'verifier@thaibagarden.com';
    const password = 'Verifier123!';

    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { password });
        console.log(`Updated password for ${email}`);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            const user = await admin.auth().createUser({ email, password, displayName: 'Verifier' });
            console.log(`Created user ${email}`);
            // Add 'team' role
            await admin.firestore().collection('users').doc(user.uid).set({
                email,
                role: 'team',
                name: 'Verifier',
                uid: user.uid
            }, { merge: true });
        } else {
            console.error(e);
        }
    }
}

main();
