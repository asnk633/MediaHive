
import { NotificationRule } from '@/types/notificationRules';
import { SystemEvent } from '@/features/events/types/systemEvent';
import { apiClient } from '@/lib/apiClient';

const RULES_COLLECTION = 'notification_rules';

export const NotificationRuleService = {
    // defaults hardcoded for Phase 1 as requested
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

    // In future phases, this would fetch from Firestore
    getActiveRules: async (): Promise<NotificationRule[]> => {
        try {
            const response = await apiClient('/api/notification-rules', {
                method: 'GET'
            });

            return response.rules || [];
        } catch (error) {
            // If API call fails, return default rules
            return NotificationRuleService.getDefaultRules();
        }
    },

    updateRule: async (ruleId: string, updates: Partial<NotificationRule>) => {
        await apiClient(`/api/notification-rules/${ruleId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    // For Phase 1 Admin Controls
    toggleRule: async (ruleId: string, enabled: boolean) => {
        await apiClient(`/api/notification-rules/${ruleId}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ enabled })
        });
    },

    is_media_off_day: (date: Date, systemEvents: SystemEvent[]): { isOff: boolean; reason?: string } => {
        // 1. Check for Sunday (Core default rule)
        if (date.getDay() === 0) {
            return { isOff: true, reason: 'Sunday' };
        }

        // 2. Check System Events on this date
        // Normalize date for comparison (midnight to midnight)
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const matchingEvent = systemEvents.find(event => {
            if (!event.date) return false;
            const eventDate = (event.date as any).toDate ? (event.date as any).toDate() : new Date(event.date as any);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === checkDate.getTime() && event.is_media_off_day;
        });

        if (matchingEvent) {
            return { isOff: true, reason: `Holiday: ${matchingEvent.title}` };
        }

        return { isOff: false };
    }
};
