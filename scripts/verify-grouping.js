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

const { groupNotifications } = require('../src/lib/notification-grouping.ts');

// Mock Notification Factory
const createNotif = (id, type, entityId, timeOffsetMinutes, isRead = false) => ({
    id: `notif_${id}`,
    type,
    entityType: 'task',
    entityId,
    title: `Notification ${id}`,
    message: 'Message',
    isRead,
    createdAt: new Date(Date.now() - timeOffsetMinutes * 60000).toISOString(),
    priority: 'medium',
    userId: 'user1'
});

const runTest = () => {
    console.log("--- Testing Notification Grouping ---");

    // Test 1: Basic Grouping
    // 3 comments on task_1, 5 mins apart.
    const groupable = [
        createNotif('1', 'comment_added', 'task_1', 5),
        createNotif('2', 'comment_added', 'task_1', 10),
        createNotif('3', 'comment_added', 'task_1', 15),
    ];

    const result1 = groupNotifications(groupable);
    if (result1.length === 1 && result1[0].isGroup && result1[0].count === 3) {
        console.log("✅ Basic Grouping: PASSED");
    } else {
        console.error("❌ Basic Grouping: FAILED", JSON.stringify(result1, null, 2));
    }

    // Test 2: Exclusion Rules
    // 3 mentions on task_1. Mentions should NEVER group.
    const mentions = [
        createNotif('m1', 'mention', 'task_1', 5),
        createNotif('m2', 'mention', 'task_1', 10),
    ];

    const result2 = groupNotifications(mentions);
    if (result2.length === 2 && !result2[0].isGroup) {
        console.log("✅ Exclusion (Mentions): PASSED");
    } else {
        console.error("❌ Exclusion (Mentions): FAILED", result2);
    }

    // Test 3: Time Window
    // 2 comments, 60 mins apart. Should NOT group (window is 30m).
    const timed = [
        createNotif('t1', 'comment_added', 'task_1', 5),
        createNotif('t2', 'comment_added', 'task_1', 65), // 60 mins diff
    ];

    const result3 = groupNotifications(timed);
    if (result3.length === 2) {
        console.log("✅ Time Window: PASSED");
    } else {
        console.error("❌ Time Window: FAILED (Grouped incorrectly)", result3);
    }

    // Test 4: Identity Mismatch
    // 2 comments on DIFFERENT tasks.
    const diffTasks = [
        createNotif('d1', 'comment_added', 'task_1', 5),
        createNotif('d2', 'comment_added', 'task_2', 10),
    ];
    const result4 = groupNotifications(diffTasks);
    if (result4.length === 2) {
        console.log("✅ Identity Check: PASSED");
    } else {
        console.error("❌ Identity Check: FAILED", result4);
    }

    // Test 5: Read Status
    // Read notifications should NOT group.
    const readRefs = [
        createNotif('r1', 'comment_added', 'task_1', 5, true), // Read
        createNotif('r2', 'comment_added', 'task_1', 10, true), // Read
    ];
    const result5 = groupNotifications(readRefs);
    if (result5.length === 2 && !result5[0].isGroup) {
        console.log("✅ Read Status Exclusion: PASSED");
    } else {
        console.error("❌ Read Status Exclusion: FAILED", result5);
    }

    console.log("--- Test Complete ---");
};

runTest();
