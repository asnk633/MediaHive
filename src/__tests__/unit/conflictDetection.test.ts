import { detectEventConflicts } from '@/features/events/utils/conflictDetection';
import { Event } from '@/features/events/types/event';

describe('detectEventConflicts', () => {
    const mockEvent = (overrides: Partial<Event>): Event => {
        return {
            id: 'evt-' + Math.random(),
            title: 'Mock Event',
            start_at: '10:00',
            end_at: '11:00',
            type: 'meeting',
            created_by: { uid: 'user-123', name: 'Test User' },
            created_at: new Date().toISOString(),
            ...overrides,
        } as Event;
    };

    test('returns empty array unmodified', () => {
        expect(detectEventConflicts([])).toEqual([]);
    });

    test('returns single event unmodified (no conflict)', () => {
        const event = mockEvent({ id: 'evt-1' });
        const result = detectEventConflicts([event]);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('evt-1');
        expect(result[0].hasConflict).toBeUndefined(); // unmodified
    });

    test('non-overlapping events are marked with hasConflict = false', () => {
        const events = [
            mockEvent({ id: 'evt-1', start_at: '10:00', end_at: '11:00' }),
            mockEvent({ id: 'evt-2', start_at: '11:00', end_at: '12:00' }), // adjacent
            mockEvent({ id: 'evt-3', start_at: '13:00', end_at: '14:00' }),
        ];

        const result = detectEventConflicts(events);
        expect(result).toHaveLength(3);
        expect(result.every(e => e.hasConflict === false)).toBe(true);
    });

    test('overlapping events are marked with hasConflict = true', () => {
        const events = [
            mockEvent({ id: 'evt-1', start_at: '10:00', end_at: '11:30' }),
            mockEvent({ id: 'evt-2', start_at: '11:00', end_at: '12:00' }), // overlaps with evt-1
            mockEvent({ id: 'evt-3', start_at: '13:00', end_at: '14:00' }), // no overlap
        ];

        const result = detectEventConflicts(events);
        expect(result).toHaveLength(3);
        
        const evt1 = result.find(e => e.id === 'evt-1');
        const evt2 = result.find(e => e.id === 'evt-2');
        const evt3 = result.find(e => e.id === 'evt-3');

        expect(evt1?.hasConflict).toBe(true);
        expect(evt2?.hasConflict).toBe(true);
        expect(evt3?.hasConflict).toBe(false);
    });

    test('handles ISO strings for start_at and end_at', () => {
        const events = [
            mockEvent({ id: 'evt-1', start_at: '2026-06-15T10:00:00.000Z', end_at: '2026-06-15T11:00:00.000Z' }),
            mockEvent({ id: 'evt-2', start_at: '2026-06-15T10:30:00.000Z', end_at: '2026-06-15T11:30:00.000Z' }),
        ];

        const result = detectEventConflicts(events);
        expect(result.every(e => e.hasConflict === true)).toBe(true);
    });

    test('handles Date objects for start_at and end_at', () => {
        const date1 = new Date();
        date1.setHours(10, 0, 0, 0);

        const date2 = new Date();
        date2.setHours(11, 0, 0, 0);

        const date3 = new Date();
        date3.setHours(10, 30, 0, 0);

        const events = [
            mockEvent({ id: 'evt-1', start_at: date1, end_at: date2 }),
            mockEvent({ id: 'evt-2', start_at: date3, end_at: date2 }),
        ];

        const result = detectEventConflicts(events);
        expect(result.every(e => e.hasConflict === true)).toBe(true);
    });

    test('defaults to 1-hour duration if end_at is missing', () => {
        const events = [
            mockEvent({ id: 'evt-1', start_at: '10:00', end_at: undefined }), // defaults to 11:00
            mockEvent({ id: 'evt-2', start_at: '10:45', end_at: '11:15' }),
        ];

        const result = detectEventConflicts(events);
        expect(result.every(e => e.hasConflict === true)).toBe(true);
    });

    test('ignores events with invalid/missing start_at time', () => {
        const events = [
            mockEvent({ id: 'evt-1', start_at: undefined, end_at: '11:00' }),
            mockEvent({ id: 'evt-2', start_at: '10:00', end_at: '11:00' }),
            mockEvent({ id: 'evt-3', start_at: '10:30', end_at: '11:30' }),
        ];

        const result = detectEventConflicts(events);
        
        const evt1 = result.find(e => e.id === 'evt-1');
        const evt2 = result.find(e => e.id === 'evt-2');
        const evt3 = result.find(e => e.id === 'evt-3');

        expect(evt1?.hasConflict).toBe(false); // Ignored/skipped
        expect(evt2?.hasConflict).toBe(true);  // Overlaps with evt-3
        expect(evt3?.hasConflict).toBe(true);
    });

    test('ignores events with malformed time strings', () => {
        const events = [
            mockEvent({ id: 'evt-1', start_at: 'invalid-time', end_at: '11:00' }),
            mockEvent({ id: 'evt-2', start_at: '10:00', end_at: '11:00' }),
            mockEvent({ id: 'evt-3', start_at: '10:30', end_at: '11:30' }),
        ];

        const result = detectEventConflicts(events);
        
        const evt1 = result.find(e => e.id === 'evt-1');
        const evt2 = result.find(e => e.id === 'evt-2');
        const evt3 = result.find(e => e.id === 'evt-3');

        expect(evt1?.hasConflict).toBe(false);
        expect(evt2?.hasConflict).toBe(true);
        expect(evt3?.hasConflict).toBe(true);
    });
});
