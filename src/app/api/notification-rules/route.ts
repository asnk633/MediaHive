import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { NotificationRule } from '@/types/notificationRules';

const DEFAULT_RULES: NotificationRule[] = [
    {
        id: 'system_event_15_days',
        name: 'System Event - 15 Days Notice',
        entityType: 'system_event',
        trigger: 'before_event_date',
        offsetDays: 15,
        audience: 'all',
        enabled: true,
        templateKey: 'event_reminder_15_days',
        description: 'Sent 15 days before a system event for planning.'
    },
    {
        id: 'system_event_7_days',
        name: 'System Event - 7 Days Notice',
        entityType: 'system_event',
        trigger: 'before_event_date',
        offsetDays: 7,
        audience: 'all',
        enabled: true,
        templateKey: 'event_reminder_7_days',
        description: 'Sent 1 week before a system event.'
    },
    {
        id: 'system_event_1_day',
        name: 'System Event - 1 Day Notice',
        entityType: 'system_event',
        trigger: 'before_event_date',
        offsetDays: 1,
        audience: 'all',
        enabled: true,
        templateKey: 'event_reminder_1_day',
        description: 'Sent 1 day before a system event.'
    }
];


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = adminDb;
        const rulesRef = db.collection('notification_rules');
        const snapshot = await rulesRef.get();

        if (snapshot.empty) {
            // Auto-seed defaults
            const batch = db.batch();
            DEFAULT_RULES.forEach(rule => {
                const docRef = rulesRef.doc(rule.id);
                batch.set(docRef, rule);
            });
            await batch.commit();

            return Response.json({ rules: DEFAULT_RULES });
        }

        const rules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return Response.json({ rules });
    } catch (error: any) {
        console.error('Error fetching notification rules:', error);
        return Response.json({ error: error.message || 'Failed to fetch rules' }, { status: 500 });
    }
}
