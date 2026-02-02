const path = require('path');
const fs = require('fs');

console.log("Setting up script environment...");

// 1. Mock server-only
const mockPath = path.join(__dirname, 'mock-server-only.js');
if (!fs.existsSync(mockPath)) {
    fs.writeFileSync(mockPath, 'module.exports = {};');
}
require('module-alias').addAlias('server-only', mockPath);

// 2. Register ts-node
require('ts-node').register({
    compilerOptions: {
        module: "commonjs",
        target: "es2022", // Updated target
        esModuleInterop: true,
        allowJs: true,
        skipLibCheck: true,
        moduleResolution: "node"
    },
    transpileOnly: true
});

// 3. Register paths
const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('../tsconfig.json');
tsConfigPaths.register({
    baseUrl: path.resolve(__dirname, '..'),
    paths: tsConfig.compilerOptions.paths
});

// 4. Load envs
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
    console.log("Attempting to load project modules...");
    let adminDb, ServerNotification, Timestamp;

    try {
        console.log("Requiring firebase/server...");
        const firebaseServer = require('../src/lib/firebase/server.ts');
        adminDb = firebaseServer.adminDb;

        console.log("Requiring server-notification...");
        const serverNotif = require('../src/lib/server-notification.ts');
        ServerNotification = serverNotif.ServerNotification;

        console.log("Requiring firestore...");
        Timestamp = require('firebase-admin/firestore').Timestamp;

        if (!adminDb || !ServerNotification) {
            throw new Error("Missing exported modules from implementation.");
        }
        console.log("Modules loaded successfully.");
    } catch (err) {
        console.error("CRITICAL: Failed to load modules.");
        if (err.diagnosticCodes) {
            console.error("TS Diagnostics:", err.diagnosticCodes);
        }
        console.error(err);
        process.exit(1);
    }

    try {
        const db = adminDb;
        console.log("--- Starting Phase 2A Verification ---");
        const testRunId = Date.now().toString();
        const userId = 'verify_user_' + testRunId;
        const adminId = 'verify_admin_' + testRunId;

        // --- 1. Verify Overdue Logic ---
        console.log("\n1. Testing Overdue Task Logic...");
        const taskId = 'task_overdue_' + testRunId;
        const taskRef = db.collection('tasks').doc(taskId);

        await taskRef.set({
            title: "Overdue Test Task",
            status: "todo",
            dueDate: Timestamp.fromMillis(Date.now() - 86400000), // 24h ago
            assignedTo: [userId],
            overdueNotified: false
        });

        const result = await ServerNotification.checkOverdue();
        console.log("checkOverdue Result:", result);

        const notifSnapshot = await db.collection('notifications')
            .where('type', '==', 'task_overdue')
            .where('entityId', '==', taskId)
            .get();

        if (notifSnapshot.empty) {
            console.error("❌ Notification NOT found for overdue task.");
        } else {
            console.log("✅ Notification found:", notifSnapshot.docs[0].data().title);
        }

        const updatedTask = await taskRef.get();
        if (updatedTask.data().overdueNotified) {
            console.log("✅ Task marked as notified.");
        } else {
            console.error("❌ Task overdueNotified flag NOT set.");
        }

        await taskRef.delete();
        notifSnapshot.docs.forEach(d => d.ref.delete());

        // --- 2. Verify Comment Notification ---
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
            console.log("✅ Mention Notification found.");
        } else {
            console.error("❌ Mention Notification NOT found.");
        }
        mentionNotif.docs.forEach(d => d.ref.delete());

        console.log("\n--- Verification Complete ---");
        process.exit(0);

    } catch (err) {
        console.error("Verification failed during test execution:", err);
        process.exit(1);
    }
}

run();
