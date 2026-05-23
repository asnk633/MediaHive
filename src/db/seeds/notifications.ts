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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            userId: 5,
            title: 'High Priority Task',
            body: 'High priority task \'Create video content for Instagram\' needs attention',
            readAt: null,
            channel: 'ui',
            category: 'task_high',
            ttl: null,
            readReceipt: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            userId: 1,
            title: 'Member Created Task',
            body: 'Member One created a new task \'Photography for new products\'',
            readAt: null,
            channel: 'ui',
            category: 'member_task_created',
            ttl: null,
            readReceipt: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ];

    await db.insert(notifications).values(sampleNotifications as any);
    
    console.log('✅ Notifications seeder completed successfully');
}

main();
