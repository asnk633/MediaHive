
import { NotificationRuleService } from '../services/notificationRuleService';
import { SystemEvent } from '../types/systemEvent';
import { TimestampLike } from '@/types/timestamp';

// Mock dependencies if needed, but the logic tested here is pure function mostly.
// checking is_media_off_day does not call DB, it takes systemEvents as arg.

describe('NotificationRuleService', () => {
    describe('is_media_off_day', () => {
        const mockSystemEvents: SystemEvent[] = [
            {
                id: '1',
                title: 'Media Holiday',
                type: 'holiday',
                isRecurring: false,
                date: new Date('2025-12-25T00:00:00').toISOString() as TimestampLike, // Fixed date
                is_media_off_day: true,
                created_at: new Date().toISOString() as TimestampLike,
                created_by: { uid: '1', name: 'Admin' }
            },
            {
                id: '2',
                title: 'General Meeting',
                type: 'company',
                isRecurring: false,
                date: new Date('2025-12-26T00:00:00').toISOString() as TimestampLike,
                is_media_off_day: false, // NOT an off day
                created_at: new Date().toISOString() as TimestampLike,
                created_by: { uid: '1', name: 'Admin' }
            }
        ];

        it('should identify Sunday as an off day', () => {
            // Dec 28 2025 is Sunday
            const sunday = new Date('2025-12-28T10:00:00');
            const result = NotificationRuleService.is_media_off_day(sunday, []);
            expect(result.isOff).toBe(true);
            expect(result.reason).toBe('Sunday');
        });

        it('should identify a System Event marked as Media Off Day', () => {
            const holiday = new Date('2025-12-25T10:00:00');
            const result = NotificationRuleService.is_media_off_day(holiday, mockSystemEvents);
            expect(result.isOff).toBe(true);
            expect(result.reason).toContain('Holiday: Media Holiday');
        });

        it('should NOT identify a System Event NOT marked as Media Off Day', () => {
            const meetingDay = new Date('2025-12-26T10:00:00'); // Friday
            const result = NotificationRuleService.is_media_off_day(meetingDay, mockSystemEvents);
            expect(result.isOff).toBe(false);
        });

        it('should NOT identify a regular weekday with no events as off day', () => {
            const regularDay = new Date('2025-12-29T10:00:00'); // Monday
            const result = NotificationRuleService.is_media_off_day(regularDay, mockSystemEvents);
            expect(result.isOff).toBe(false);
        });
    });
});
