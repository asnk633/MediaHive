
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

async function main() {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
        }
        const db = admin.firestore();
        console.log("DB Initialized");

        // 1. Create Logic
        const itemRef = await db.collection('inventory').add({
            name: 'Camera A (Verification)',
            category: 'Camera',
            status: 'available',
            condition: 'good',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const itemId = itemRef.id;
        console.log("Item Created:", itemId);

        // 2. Request Logic
        const reqRef = await db.collection('device_requests').add({
            requester: { uid: 'team1', name: 'Team' },
            status: 'approved',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const reqId = reqRef.id;
        console.log("Request Created:", reqId);

        // 3. Issue Logic (Transaction)
        await db.runTransaction(async t => {
            const iSnap = await t.get(itemRef);
            if (iSnap.data().status !== 'available') throw new Error("Not Available");

            t.update(itemRef, { status: 'in_use', currentHolder: { requestId: reqId } });
            t.update(reqRef, { status: 'issued', assignedItemId: itemId });
        });
        console.log("Issue Transaction Success");

        // 4. Double Issue Logic (Transaction)
        let failed = false;
        try {
            await db.runTransaction(async t => {
                const iSnap = await t.get(itemRef);
                if (iSnap.data().status !== 'available') throw new Error("Item is in_use");
                t.update(itemRef, { status: 'in_use' });
            });
        } catch (e) {
            console.log("Double Issue Blocked:", e.message);
            failed = true;
        }

        if (!failed) {
            console.error("DOUBLE ISSUE SUCCEEDED - FAIL");
            process.exit(1);
        }

        // 5. Return Logic
        await db.runTransaction(async t => {
            t.update(itemRef, { status: 'available', currentHolder: null, condition: 'good' });
            t.update(reqRef, { status: 'returned' });
        });
        console.log("Return Success");
        console.log("VERIFICATION PASSED");

        // Cleanup
        await itemRef.delete();
        await reqRef.delete();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
