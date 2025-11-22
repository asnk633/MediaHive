import { db } from '@/db';
import { notifications } from '@/db/schema';

async function main() {
    const sampleNotifications = [
        {
            userId: 3,
            title: 'New Task Assigned',
            body: 'You have been assigned to \'Design new social media campaign\'',
            readAt: null,
            channel: 'ui',
            category: 'task_assigned',
            ttl: null,
            readReceipt: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 4,
            title: 'Task Due Soon',
            body: 'Task \'Update website content\' is due in 2 days',
            readAt: null,
            channel: 'ui',
            category: 'task_due',
            ttl: null,
            readReceipt: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 5,
            title: 'Urgent Task',
            body: 'Urgent task \'Create video content for Instagram\' needs attention',
            readAt: null,
            channel: 'ui',
            category: 'task_urgent',
            ttl: null,
            readReceipt: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            title: 'Guest Created Task',
            body: 'Guest One created a new task \'Photography for new products\'',
            readAt: null,
            channel: 'ui',
            category: 'guest_task_created',
            ttl: null,
            readReceipt: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            title: 'Task Completed',
            body: 'Task \'Social media audit\' has been completed',
            readAt: null,
            channel: 'ui',
            category: 'task_completed',
            ttl: null,
            readReceipt: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(notifications).values(sampleNotifications as any);
    
    console.log('✅ Notifications seeder completed successfully');
}

main();