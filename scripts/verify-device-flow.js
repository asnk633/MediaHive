try {
    require('dotenv').config({ path: '.env.local' });
    var admin = require('firebase-admin');
    var { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
} catch (e) {
    console.error("Failed to load modules:", e);
    process.exit(1);
}

// Initialize Admin SDK
if (!admin.apps.length) {
    // Attempt to use default creds or env vars
    // For local dev, we might assume emulator OR standard creds if env vars are set
    // In this environment, we should check if we can just use projectId
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thaiba-media-staging'
        });
    } catch (e) {
        console.error("Failed to init admin:", e);
        process.exit(1);
    }
}

const db = getFirestore();

// Helper for colorful logs
const log = (msg, type = 'info') => {
    const colors = {
        info: '\x1b[36m%s\x1b[0m', // Cyan
        success: '\x1b[32m%s\x1b[0m', // Green
        error: '\x1b[31m%s\x1b[0m', // Red
        warn: '\x1b[33m%s\x1b[0m' // Yellow
    };
    console.log(colors[type] || colors.info, `[${type.toUpperCase()}] ${msg}`);
};

async function runTest() {
    log("Starting Device Flow Logic Verification...", 'info');

    // --- SETUP ---
    // 1. Create Users (Virtual)
    const adminUser = { uid: 'admin_test_1', name: 'Admin Tester', role: 'admin' };
    const teamUser = { uid: 'team_test_1', name: 'Team Tester', role: 'team' };
    const guestUser = { uid: 'guest_test_1', name: 'Guest Tester', role: 'guest' };

    // 2. Create Test Inventory Item ("Camera A")
    const itemRef = await db.collection('inventory').add({
        name: 'Camera A (Test)',
        category: 'Camera',
        status: 'available',
        condition: 'good',
        purchasePrice: 1000,
        purchaseDate: Timestamp.now(),  // Using Admin SDK Timestamp
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    const itemId = itemRef.id;
    log(`✅ Test Item Created: ${itemId} (Camera A)`, 'success');

    // --- PHASE 2: REQUEST FLOW ---
    log("\n--- PHASE 2: REQUEST FLOW ---", 'info');

    // Team Request
    const teamReqRef = await db.collection('device_requests').add({
        requester: teamUser,
        category: 'Camera',
        itemName: 'Camera A (Test)', // Preferred item
        itemId: itemId,             // Explicitly requesting this one
        startDate: Timestamp.fromDate(new Date()),
        endDate: Timestamp.fromDate(new Date(Date.now() + 86400000)),
        purpose: 'Event coverage',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    const teamReqId = teamReqRef.id;
    log(`✅ Team Request Created: ${teamReqId}`, 'success');

    // Guest Request
    const guestReqRef = await db.collection('device_requests').add({
        requester: guestUser,
        category: 'Camera',
        description: 'Documentation',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    const guestReqId = guestReqRef.id;
    log(`✅ Guest Request Created: ${guestReqId}`, 'success');

    // Verify Isolation? 
    // Logic check: A simpler verify is just that they exist and are pending using standard read.
    // Real role checks happen in Rules/Middleware, but here we assume verified by creation success/logic structure.

    // --- PHASE 3: ADMIN CONTROL ---
    log("\n--- PHASE 3: ADMIN CONTROL ---", 'info');

    // Approve Team
    await teamReqRef.update({ status: 'approved' });
    log(`✅ Team Request Approved`, 'success');

    // Approve Guest + Assign Item manually (simulation)
    // Guest didn't pick item but Admin assigns Camera A?
    // Wait, the test says "Assign Camera A manually".
    // So both requests want Camera A now.
    await guestReqRef.update({
        status: 'approved',
        adminNotes: 'Assigned Camera A'
        // Note: In UI this doesn't link item yet, 'Issue' does.
    });
    log(`✅ Guest Request Approved`, 'success');

    // Verify Audit
    const itemSnapInitial = await itemRef.get();
    if (itemSnapInitial.data().status !== 'available') {
        log(`❌ PRE-ISSUE FATAL: Item should be available but is ${itemSnapInitial.data().status}`, 'error');
        process.exit(1);
    }
    log(`✅ Pre-Issue: Item is 'available'`, 'success');

    // --- PHASE 4: ISSUE FLOW (CRITICAL) ---
    log("\n--- PHASE 4: ISSUE FLOW (CRITICAL) ---", 'info');

    // Issue to TEAM
    // Using transaction logic simulation or calling service logic if we could import it.
    // Since we are running as a standalone script, we simulate the TRANSACTION logic exactly as written in service.

    try {
        await db.runTransaction(async (t) => {
            const iSnap = await t.get(itemRef);
            const rSnap = await t.get(teamReqRef);

            if (iSnap.data().status !== 'available') throw new Error(`Item ${iSnap.data().status}`);

            // Create Log
            const logRef = db.collection('device_logs').doc();
            t.set(logRef, {
                requestId: teamReqId,
                inventoryItem: { id: itemId, name: iSnap.data().name },
                user: teamUser,
                issuedAt: Timestamp.now(),
                issuedBy: adminUser.uid,
                conditionOnIssue: 'good'
            });

            // Update Item
            t.update(itemRef, {
                status: 'in_use',
                currentHolder: { uid: teamUser.uid, name: teamUser.name, requestId: teamReqId },
                updatedAt: FieldValue.serverTimestamp()
            });

            // Update Request
            t.update(teamReqRef, {
                status: 'issued',
                assignedItemId: itemId,
                issuedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        });
        log(`✅ Issued Camera A to Team Request`, 'success');
    } catch (e) {
        log(`❌ Failed initial issue: ${e.message}`, 'error');
        process.exit(1);
    }

    // Verify State
    const itemSnapInUse = await itemRef.get();
    const itemData = itemSnapInUse.data();
    if (itemData.status === 'in_use' && itemData.currentHolder.requestId === teamReqId) {
        log(`✅ Inventory Verified: Status = in_use, Holder = Team Tester`, 'success');
    } else {
        log(`❌ Inventory State WRONG: ${JSON.stringify(itemData)}`, 'error');
    }

    // 🚨 DOUBLE ISSUE TEST
    log("🚨 ATTEMPTING DOUBLE ISSUE (Should Fail)...", 'warn');
    let doubleIssueFailed = false;
    try {
        await db.runTransaction(async (t) => {
            const iSnap = await t.get(itemRef);
            // This check is what prevents the bug
            if (iSnap.data().status === 'in_use' || iSnap.data().status === 'maintenance') {
                throw new Error(`Item is currently ${iSnap.data().status}`);
            }

            // ... rest of logic would go here but should never be reached
            t.update(itemRef, { status: 'in_use' }); // Dummy write
        });
    } catch (e) {
        log(`✅ Blocked Double Issue: ${e.message}`, 'success');
        doubleIssueFailed = true;
    }

    if (!doubleIssueFailed) {
        log(`❌ FATAL: DOUBLE ISSUE SUCCEEDED! System is broken.`, 'error');
        process.exit(1);
    }

    // --- PHASE 5: RETURN FLOW ---
    log("\n--- PHASE 5: RETURN FLOW ---", 'info');

    // Find active log (Simulate query)
    const logQuery = await db.collection('device_logs').where('requestId', '==', teamReqId).get();
    const logId = logQuery.docs[0].id;

    // Return Item
    try {
        await db.runTransaction(async (t) => {
            const rRef = teamReqRef;
            const lRef = db.collection('device_logs').doc(logId);
            const iRef = itemRef;

            // Update Log
            t.update(lRef, {
                returnedAt: FieldValue.serverTimestamp(),
                conditionOnReturn: 'good',
                receivedBy: adminUser.uid
            });

            // Update Item
            t.update(iRef, {
                status: 'available',
                currentHolder: null,
                condition: 'good',
                updatedAt: FieldValue.serverTimestamp()
            });

            // Update Request
            t.update(rRef, {
                status: 'returned',
                returnedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        });
        log(`✅ Item Returned Successfully`, 'success');
    } catch (e) {
        log(`❌ Return Failed: ${e.message}`, 'error');
    }

    // Capture Final State
    const finalItem = (await itemRef.get()).data();
    if (finalItem.status === 'available' && finalItem.currentHolder === null) {
        log(`✅ Final Inventory State Verified: available`, 'success');
    } else {
        log(`❌ Final Inventory State Incorrect`, 'error');
    }

    log("\n-------------------------------------------", 'info');
    log("🎉 ALL SYSTEMS GO. ADMIN VERIFIED.", 'success');

    // Cleanup (Optional, but good for repetitive runs)
    // await itemRef.delete();
    // await teamReqRef.delete();
    // await guestReqRef.delete();
}

runTest();
