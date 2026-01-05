
const { NotificationService } = require('../services/notificationService');
const { getFirebaseDb } = require('../firebase/client');
const { collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

async function testNotification() {
    console.log('--- Starting Notification Service Test ---');
    try {
        // 1. Create a Test Notification
        const testUserId = 'test_user_' + Date.now();
        console.log(`Creating notification for user: ${testUserId}`);

        const notificationId = await NotificationService.createNotification({
            userId: testUserId,
            sourceUserId: 'admin_test',
            type: 'announcement', // generic type
            title: 'Test Notification',
            message: 'This is a verification test.',
            entityType: 'announcement',
            entityId: 'test_id',
            priority: 'low'
        });

        if (!notificationId) {
            console.error('FAILED: Notification ID returned null.');
            return;
        }
        console.log('✅ Notification Created. ID:', notificationId);

        // 2. Verify it exists in Firestore
        // Since we are running in node, we can query it back
        // But we need to use the Client SDK imported above
        console.log('Verifying fetching...');
        const notifications = await NotificationService.getUserNotifications(testUserId);

        const found = notifications.find(n => n.id === notificationId);
        if (found) {
            console.log('✅ Verified: Notification successfully fetched from Firestore.');
            console.log('   Title:', found.title);
            console.log('   Message:', found.message);
        } else {
            console.error('❌ FAILED: Notification not found in fetch results.');
        }

        // 3. Cleanup
        console.log('Cleaning up...');
        const db = await getFirebaseDb();
        await deleteDoc(doc(db, 'notifications', notificationId));
        console.log('✅ Cleanup complete.');

    } catch (error) {
        console.error('❌ Test Failed with Error:', error);
    }
}

// Since we are in a text environment, we might not be able to execute this directly via 'node' if it relies on browser-only Firebase Auth or specific environment vars.
// However, the Service uses 'getFirebaseDb' which might work if config is present.
// If this script fails to run due to environment, I will rely on code review confidence.
console.log("Ready to running manual verification if environment allows.");
