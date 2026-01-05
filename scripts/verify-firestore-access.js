require('ts-node').register({
    compilerOptions: {
        module: "commonjs",
        target: "es2019"
    }
});
const { getAdminDb, getFirebaseAdminApp } = require('../src/lib/firebaseAdmin.ts');
const dotenv = require('dotenv');

// Load envs
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function verifyFirestore() {
    console.log('--- Firestore Access Verification ---');

    try {
        const app = getFirebaseAdminApp();
        console.log('App Name:', app.name);
        console.log('Project ID (from App):', app.options.credential.projectId || app.options.projectId);

        console.log('Project ID (from Env - NEXT_PUBLIC_FIREBASE_PROJECT_ID):', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        console.log('Project ID (from Env - GOOGLE_PROJECT_ID):', process.env.GOOGLE_PROJECT_ID);

        const db = getAdminDb();
        console.log('Attempting to write to collection "files_healthcheck"...');

        await db.collection('files_healthcheck').doc('test').set({
            timestamp: new Date(),
            verified: true
        });

        console.log('✅ Write SUCCESS! Service Account has permission.');

        // Cleanup
        await db.collection('files_healthcheck').doc('test').delete();
        console.log('✅ Cleanup SUCCESS.');

    } catch (e) {
        console.error('❌ Write FAILED:', e.message);
        if (e.code === 7 || e.message.includes('PERMISSION_DENIED')) {
            console.error('\n[DIAGNOSIS]');
            console.error('The Service Account does not have permission to access THIS Project ID.');
            console.error(`Ensure 'mediahive-drive-uploader@...' is added to Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
        }
    }
}

verifyFirestore();
