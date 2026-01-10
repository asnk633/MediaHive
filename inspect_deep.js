const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const uid = 'OEobNv8T1hXW8ty3SuHKytE3Oqu2';

async function check() {
    // 1. Check User Role
    const user = await db.collection('users').doc(uid).get();
    console.log('User Role:', user.data()?.role);
    console.log('User Inst:', user.data()?.institutionId);

    // 2. Check Inventory Issues (Sample)
    const issues = await db.collection('inventory_issues').limit(1).get();
    if (issues.empty) {
        console.log('No inventory issues found.');
    } else {
        issues.forEach(doc => {
            console.log('Sample Issue Inst:', doc.data().institutionId);
        });
    }
}
check();
