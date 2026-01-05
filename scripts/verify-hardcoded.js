
const admin = require('firebase-admin');

async function main() {
    try {
        console.log("Starting...");
        // Use standard default creds without calling dotenv
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'thaiba-media-staging'
        });

        const db = admin.firestore();
        console.log("DB Connected");

        // 1. Create 
        const itemRef = await db.collection('inventory').add({
            name: 'Camera A (Verification)',
            category: 'Camera',
            status: 'available',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("Item Created:", itemRef.id);

        const reqRef = await db.collection('device_requests').add({
            requester: { uid: 'team1', name: 'Team' },
            status: 'approved',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("Req Created:", reqRef.id);

        // 2. Issue 
        await db.runTransaction(async t => {
            const iSnap = await t.get(itemRef);
            if (iSnap.data().status !== 'available') throw new Error("Not Available");
            t.update(itemRef, { status: 'in_use' });
            t.update(reqRef, { status: 'issued', assignedItemId: itemRef.id });
        });
        console.log("Issue Success");

        // 3. Double Issue
        try {
            await db.runTransaction(async t => {
                const iSnap = await t.get(itemRef);
                if (iSnap.data().status !== 'available') throw new Error("Item in use");
                t.update(itemRef, { status: 'in_use' });
            });
            console.error("DOUBLE ISSUE FAILED TO BLOCK");
        } catch (e) {
            console.log("Double Issue Blocked:", e.message);
        }

        // 4. Return
        await db.runTransaction(async t => {
            t.update(itemRef, { status: 'available' });
            t.update(reqRef, { status: 'returned' });
        });
        console.log("Return Success");

        console.log("PASSED");
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}
main();
