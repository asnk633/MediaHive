require('ts-node').register({
    compilerOptions: {
        module: "commonjs",
        target: "es2019",
        esModuleInterop: true
    }
});

const path = require('path');
const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('../tsconfig.json');

tsConfigPaths.register({
    baseUrl: path.resolve(__dirname, '..'),
    paths: tsConfig.compilerOptions.paths
});

const dotenv = require('dotenv');
// Load envs
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { getAdminDb, getFirebaseAdminApp } = require('../src/lib/firebaseAdmin.ts');
const { ServerNotification } = require('../src/lib/server-notification.ts');
const { Timestamp } = require('firebase-admin/firestore');

const db = getAdminDb();

async function verifyPhase2A() {
    console.log("--- Starting Phase 2A Verification (TS-Node + Paths) ---");
    const testRunId = Date.now().toString();
    const userId = 'verify_user_' + testRunId;
    const adminId = 'verify_admin_' + testRunId;

    try {
        // --- 1. Verify Overdue Logic (Using actual ServerNotification.checkOverdue) ---
        console.log("\n1. Testing Overdue Task Logic...");
        const taskId = 'task_overdue_' + testRunId;
        const taskRef = db.collection('tasks').doc(taskId);

        // Create a past due task
        await taskRef.set({
            title: "Overdue Test Task",
            status: "todo",
            dueDate: Timestamp.fromMillis(Date.now() - 86400000), // 24h ago
            assignedTo: [userId],
            overdueNotified: false
        });

        // Run checkOverdue
        const result = await ServerNotification.checkOverdue();
        console.log("checkOverdue Result:", result);

        // Verify Notification
        const notifSnapshot = await db.collection('notifications')
            .where('type', '==', 'task_overdue')
            .where('entityId', '==', taskId)
            .get();

        if (notifSnapshot.empty) {
            console.error("❌ Notification NOT found for overdue task.");
        } else {
            console.log("✅ Notification found:", notifSnapshot.docs[0].data().title);
        }

        // Verify Task Updated
        const updatedTask = await taskRef.get();
        if (updatedTask.data().overdueNotified) {
            console.log("✅ Task parsed as notified (overdueNotified: true).");
        } else {
            console.error("❌ Task overdueNotified flag NOT set.");
        }

        // Cleanup
        await taskRef.delete();
        notifSnapshot.docs.forEach(d => d.ref.delete());


        // --- 2. Verify Comment Notification (Using helper) ---
        console.log("\n2. Testing notifyCommentAdded...");
        const commentTaskId = 'task_comment_' + testRunId;
        await ServerNotification.notifyCommentAdded(
            'task',
            commentTaskId,
            'Test Task',
            adminId,
            'Hello World',
            [userId]
        );

        const commentNotif = await db.collection('notifications')
            .where('type', '==', 'comment_added')
            .where('entityId', '==', commentTaskId)
            .where('userId', '==', userId)
            .get();

        if (!commentNotif.empty) {
            console.log("✅ Comment Notification found.");
        } else {
            console.error("❌ Comment Notification NOT found.");
        }
        // Cleanup
        commentNotif.docs.forEach(d => d.ref.delete());


        // --- 3. Verify Mention Notification ---
        console.log("\n3. Testing notifyMentioned...");
        await ServerNotification.notifyMentioned(
            'task',
            commentTaskId,
            'Test Task',
            adminId,
            userId
        );

        const mentionNotif = await db.collection('notifications')
            .where('type', '==', 'mention')
            .where('entityId', '==', commentTaskId)
            .where('userId', '==', userId)
            .get();

        if (!mentionNotif.empty) {
            const data = mentionNotif.docs[0].data();
            if (data.priority === 'high') {
                console.log("✅ Mention Notification found with HIGH priority.");
            } else {
                console.error("❌ Mention Notification found but WRONG priority:", data.priority);
            }
        } else {
            console.error("❌ Mention Notification NOT found.");
        }
        // Cleanup
        mentionNotif.docs.forEach(d => d.ref.delete());

        // --- 4. Verify Event Update Notification ---
        console.log("\n4. Testing notifyEventUpdated...");
        const eventId = 'event_' + testRunId;
        await ServerNotification.notifyEventUpdated(
            eventId,
            'Test Event',
            adminId,
            [userId],
            ['Date', 'Location']
        );

        const eventNotif = await db.collection('notifications')
            .where('type', '==', 'event_updated')
            .where('entityId', '==', eventId)
            .where('userId', '==', userId)
            .get();

        if (!eventNotif.empty) {
            const data = eventNotif.docs[0].data();
            console.log("✅ Event Update Notification found:", data.message);
        } else {
            console.error("❌ Event Update Notification NOT found.");
        }
        // Cleanup
        eventNotif.docs.forEach(d => d.ref.delete());

        console.log("\n--- Verification Complete ---");
        process.exit(0);

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    }
}

verifyPhase2A();
