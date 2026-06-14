import { RecurrenceService } from '@/features/events/services/recurrenceService';
import { Event } from '@/features/events/types/event';

describe('RecurrenceService', () => {
    const mockEvent = (overrides: Partial<Event>): Event => {
        return {
            id: 'series-1',
            title: 'Weekly Standup',
            start_at: '2026-06-15T09:00:00Z', // Monday
            end_at: '2026-06-15T10:00:00Z',
            is_recurring: false,
            type: 'meeting',
            created_by: { uid: 'user-1', name: 'User One' },
            created_at: new Date().toISOString(),
            ...overrides,
        } as Event;
    };

    describe('expandEvents', () => {
        test('passes non-recurring events through if they are in range', () => {
            const events = [
                mockEvent({ id: 'evt-1', start_at: '2026-06-15T10:00:00Z', end_at: '2026-06-15T11:00:00Z' }), // In range
                mockEvent({ id: 'evt-2', start_at: '2026-06-10T10:00:00Z', end_at: '2026-06-10T11:00:00Z' }), // Out of range (before)
                mockEvent({ id: 'evt-3', start_at: '2026-06-25T10:00:00Z', end_at: '2026-06-25T11:00:00Z' }), // Out of range (after)
            ];

            const rangeStart = new Date('2026-06-12T00:00:00Z');
            const rangeEnd = new Date('2026-06-20T23:59:59Z');

            const result = RecurrenceService.expandEvents(events, rangeStart, rangeEnd);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('evt-1');
        });

        test('correctly expands a simple weekly recurring event', () => {
            const weeklyStandup = mockEvent({
                id: 'weekly-series',
                is_recurring: true,
                recurrence_rule: 'DTSTART:20260615T090000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20260701T000000Z',
                start_at: '2026-06-15T09:00:00Z', // Monday June 15
                end_at: '2026-06-15T10:00:00Z'
            });

            const rangeStart = new Date('2026-06-12T00:00:00Z');
            const rangeEnd = new Date('2026-06-30T23:59:59Z'); // June 15, 22, 29 (3 occurrences)

            const result = RecurrenceService.expandEvents([weeklyStandup], rangeStart, rangeEnd);

            // FREQ=WEEKLY from June 15 to June 30 should yield 3 instances: June 15, June 22, June 29
            expect(result).toHaveLength(3);
            expect(result.every(e => e.original_series_id === 'weekly-series')).toBe(true);
            expect(result.every(e => e.is_recurring_instance === true)).toBe(true);

            expect(result[0].start_at).toContain('2026-06-15T09:00:00');
            expect(result[1].start_at).toContain('2026-06-22T09:00:00');
            expect(result[2].start_at).toContain('2026-06-29T09:00:00');

            // Ends should have the same duration (1 hour)
            expect(result[0].end_at).toContain('2026-06-15T10:00:00');
            expect(result[1].end_at).toContain('2026-06-22T10:00:00');
            expect(result[2].end_at).toContain('2026-06-29T10:00:00');
        });

        test('excludes occurrences that are marked as exceptions', () => {
            const weeklyStandup = mockEvent({
                id: 'weekly-series',
                is_recurring: true,
                recurrence_rule: 'DTSTART:20260615T090000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20260701T000000Z',
                start_at: '2026-06-15T09:00:00Z',
                end_at: '2026-06-15T10:00:00Z'
            });

            // Exception event that cancels/modifies June 22 occurrence
            const exceptionEvent = mockEvent({
                id: 'exception-instance',
                parent_event_id: 'weekly-series',
                recurrence_exception_date: '2026-06-22T09:00:00Z', // Mark this date as skipped/overridden
                start_at: '2026-06-23T10:00:00Z', // Rescheduled event is a normal event on Tuesday
                end_at: '2026-06-23T11:00:00Z',
                is_recurring: false
            });

            const rangeStart = new Date('2026-06-12T00:00:00Z');
            const rangeEnd = new Date('2026-06-30T23:59:59Z');

            const result = RecurrenceService.expandEvents([weeklyStandup, exceptionEvent], rangeStart, rangeEnd);

            // Expanded series: June 15, (June 22 skipped), June 29 (2 occurrences)
            // Plus the exception event itself (1 occurrence)
            // Total should be 3 events
            expect(result).toHaveLength(3);

            const seriesInstances = result.filter(e => e.original_series_id === 'weekly-series');
            expect(seriesInstances).toHaveLength(2);
            expect(seriesInstances[0].start_at).toContain('2026-06-15');
            expect(seriesInstances[1].start_at).toContain('2026-06-29');

            const customInstance = result.find(e => e.id === 'exception-instance');
            expect(customInstance).toBeDefined();
            expect(customInstance?.start_at).toContain('2026-06-23');
        });

        test('safely falls back and includes the original event if RRule parsing fails', () => {
            const badEvent = mockEvent({
                id: 'bad-series',
                is_recurring: true,
                recurrence_rule: 'INVALID_RULE_STRING',
                start_at: '2026-06-15T09:00:00Z',
                end_at: '2026-06-15T10:00:00Z'
            });

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const rangeStart = new Date('2026-06-12T00:00:00Z');
            const rangeEnd = new Date('2026-06-20T23:59:59Z');

            const result = RecurrenceService.expandEvents([badEvent], rangeStart, rangeEnd);
            
            // Should contain original bad event as a fallback
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('bad-series');
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('generateRuleString', () => {
        test('generates DAILY recurrence rule string', () => {
            const rule = RecurrenceService.generateRuleString({
                frequency: 'daily',
                interval: 2,
                startDate: new Date('2026-06-15T09:00:00Z'),
                count: 5
            });

            expect(rule).toContain('FREQ=DAILY');
            expect(rule).toContain('INTERVAL=2');
            expect(rule).toContain('COUNT=5');
        });

        test('generates WEEKLY recurrence rule string with day boundaries', () => {
            const rule = RecurrenceService.generateRuleString({
                frequency: 'weekly',
                interval: 1,
                startDate: new Date('2026-06-15T09:00:00Z'),
                until: new Date('2026-07-01T00:00:00Z')
            });

            expect(rule).toContain('FREQ=WEEKLY');
            expect(rule).toContain('INTERVAL=1');
            expect(rule).toContain('UNTIL=20260701T000000Z');
        });
    });
});
