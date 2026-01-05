
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { NotificationRuleServiceServer } from '@/lib/notificationRules.server';
import { SystemEvent } from '@/types/systemEvent';
import { NotificationRule } from '@/types/notificationRules';
import { Timestamp } from 'firebase-admin/firestore'; // Admin SDK types

export const dynamic = 'force-dynamic'; // Prevent caching

// Helper to calculate date difference in days (ignoring time)
const getDaysDifference = (date1: Date, date2: Date) => {
    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export async function GET(req: NextRequest) {
    // 1. Authorization Check
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb;
    const logsCollection = db.collection('notification_logs');
    const notificationsCollection = db.collection('notifications');
    const usersCollection = db.collection('users');

    try {
        // 2. Fetch Active Rules
        const rules = await NotificationRuleServiceServer.getActiveRules();
        if (rules.length === 0) {
            return NextResponse.json({ message: 'No active rules found' });
        }

        // 3. Fetch Upcoming System Events (Next 30 days to be safe)
        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + 30);

        const eventsSnapshot = await db.collection('system_events')
            .where('date', '>=', now)
            .where('date', '<=', futureLimit)
            .get();

        const events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: (doc.data().date as Timestamp).toDate() // Convert Firestore Timestamp to Date
        })) as any[]; // Cast as needed, we know the structure

        // 4. Fetch Users (for 'all' audience)
        // Optimization: In a real large app, we wouldn't fetch all users. 
        // But for this institutional app, user count is manageable.
        const usersSnapshot = await usersCollection.where('role', '!=', 'disabled').get();
        const allUserIds = usersSnapshot.docs.map(doc => doc.id);

        const results = [];

        // 5. Evaluate Rules
        for (const event of events) {
            const eventDate = event.date;
            const daysUntil = getDaysDifference(now, eventDate);

            for (const rule of rules) {
                if (rule.entityType !== 'system_event') continue;
                if (!rule.enabled) continue;

                // Check if this rule matches the current day offset
                // allowed +/- 0.5 day tolerance if the cron runs at odd times? 
                // Best to stick to strict day diff if run daily.
                if (daysUntil === rule.offsetDays) {

                    // IDEMPOTENCY CHECK
                    const logId = `${rule.id}_${event.id}`;
                    const logDoc = await logsCollection.doc(logId).get();

                    if (logDoc.exists) {
                        results.push({ rule: rule.id, event: event.title, status: 'skipped_already_sent' });
                        continue;
                    }

                    // GENERATE MESSAGE
                    let message = '';
                    switch (rule.templateKey) {
                        case 'event_reminder_15_days':
                            message = `📅 ${event.title} is in 15 days. Please plan activities accordingly.`;
                            break;
                        case 'event_reminder_7_days':
                            message = `⏳ One week remaining for ${event.title}.`;
                            break;
                        case 'event_reminder_1_day':
                            message = `📣 Tomorrow is ${event.title}.`;
                            break;
                        default:
                            message = `Reminder: ${event.title} is coming up.`;
                    }

                    // SEND NOTIFICATIONS (Batch write)
                    const batch = db.batch();

                    // Log the execution first
                    batch.set(logsCollection.doc(logId), {
                        ruleId: rule.id,
                        entityId: event.id,
                        targetDate: event.date,
                        sentAt: new Date(),
                        recipientCount: allUserIds.length,
                        status: 'success'
                    });

                    // Prepare notifications
                    allUserIds.forEach(userId => {
                        const notifRef = notificationsCollection.doc();
                        batch.set(notifRef, {
                            userId,
                            type: 'event_reminder',
                            title: `Event Reminder: ${event.title}`,
                            message,
                            entityType: 'event', // Mapping system_event to 'event' for now as per NotificationEntityType
                            entityId: event.id,
                            priority: daysUntil === 1 ? 'high' : 'medium',
                            isRead: false,
                            isArchived: false,
                            createdAt: new Date(),
                            metadata: {
                                ruleId: rule.id,
                                offsetDays: rule.offsetDays
                            }
                        });
                    });

                    await batch.commit();
                    results.push({ rule: rule.id, event: event.title, status: 'sent', recipientCount: allUserIds.length });
                }
            }
        }

        return NextResponse.json({
            success: true,
            processedEvents: events.length,
            actions: results
        });

    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
