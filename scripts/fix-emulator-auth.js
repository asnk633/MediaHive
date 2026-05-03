const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

// Set emulator hosts
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

async function main() {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-thaiba';

    if (!admin.apps.length) {
        admin.initializeApp({ projectId });
    }

    const auth = admin.auth();
    const db = admin.firestore();

    console.log('=== Firebase Auth Emulator - User Inspection ===\n');

    try {
        // List all users
        const listUsersResult = await auth.listUsers(1000);
        console.log(`Total users in emulator: ${listUsersResult.users.length}\n`);

        if (listUsersResult.users.length === 0) {
            console.log('No users found in emulator.\n');
        } else {
            console.log('Existing users:');
            listUsersResult.users.forEach(user => {
                console.log(`  - ${user.email} (UID: ${user.uid})`);
            });
            console.log('');
        }

        // Check for specific users
        const requiredUsers = [
            { email: 'media@thaibagarden.com', password: 'Admin@123', role: 'admin', displayName: 'Media Admin' },
            { email: 'verifier@thaiba.com', password: 'Verifier@123', role: 'team', displayName: 'Verifier User' }
        ];

        for (const userData of requiredUsers) {
            let user;
            try {
                user = await auth.getUserByEmail(userData.email);
                console.log(`✓ User exists: ${userData.email} (UID: ${user.uid})`);

                // Update password to ensure it's correct
                await auth.updateUser(user.uid, { password: userData.password });
                console.log(`  → Password updated to: ${userData.password}`);

            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.log(`✗ User missing: ${userData.email}`);
                    console.log(`  → Creating user...`);

                    user = await auth.createUser({
                        email: userData.email,
                        password: userData.password,
                        displayName: userData.displayName,
                        emailVerified: true
                    });

                    console.log(`  ✓ Created: ${userData.email} (UID: ${user.uid})`);
                    console.log(`  → Password: ${userData.password}`);
                } else {
                    throw error;
                }
            }

            // Ensure Firestore user document exists with correct role
            const userDocRef = db.collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (!userDoc.exists) {
                console.log(`  → Creating Firestore user document...`);
                await userDocRef.set({
                    email: userData.email,
                    displayName: userData.displayName,
                    role: userData.role,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`  ✓ Firestore document created with role: ${userData.role}`);
            } else {
                const data = userDoc.data();
                if (data.role !== userData.role) {
                    console.log(`  → Updating role from ${data.role} to ${userData.role}...`);
                    await userDocRef.update({ role: userData.role });
                    console.log(`  ✓ Role updated`);
                } else {
                    console.log(`  ✓ Firestore document exists with correct role: ${userData.role}`);
                }
            }
            console.log('');
        }

        console.log('=== Summary ===');
        console.log('Auth setup complete. Test credentials:');
        console.log('  Admin:    media@thaibagarden.com / Admin@123');
        console.log('  Verifier: verifier@thaiba.com / Verifier@123');
        console.log('');
        console.log('You can now log in to http://localhost:3000/login');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    process.exit(0);
}

main();
