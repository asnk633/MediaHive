import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { NotificationRule } from '@/types/notificationRules';

export const NotificationRuleServiceServer = {
    // Defaults matching client service for consistency
    getDefaultRules: (): NotificationRule[] => {
        return [
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
    },

    getActiveRules: async (): Promise<NotificationRule[]> => {
        try {
            const snapshot = await adminDb.collection('notification_rules').where('enabled', '==', true).get();
            if (snapshot.empty) {
                return NotificationRuleServiceServer.getDefaultRules();
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationRule));
        } catch (error) {
            console.error('NotificationRuleServiceServer.getActiveRules error:', error);
            return NotificationRuleServiceServer.getDefaultRules();
        }
    }
};
