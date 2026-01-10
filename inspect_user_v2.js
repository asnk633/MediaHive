const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const uid = 'OEobNv8T1hXW8ty3SuHKytE3Oqu2';

async function checkUser() {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) {
            console.log('User NOT found');
        } else {
            console.log('User FOUND:', JSON.stringify(doc.data(), null, 2));
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

checkUser();
