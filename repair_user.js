const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const uid = 'OEobNv8T1hXW8ty3SuHKytE3Oqu2';
const userData = {
    name: 'Super Admin',
    email: 'admin@thaibagarden.com', // Placeholder, updating essential fields
    role: 'admin',
    institutionId: 'pmjlS2zRwJpfBCDhoU4W', // From logs: 'Fetching issues for institution: pmjlS2zRwJpfBCDhoU4W'
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

async function repairUser() {
    try {
        await db.collection('users').doc(uid).set(userData, { merge: true });
        console.log('User document recreated successfully for UID:', uid);
    } catch (error) {
        console.error('Error repairing user:', error);
    }
}

repairUser();
