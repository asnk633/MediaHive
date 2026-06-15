import { normalizeDate, getEventDays, safeFormat } from '@/features/events/utils/dateNormalization';

describe('dateNormalization', () => {
    describe('normalizeDate', () => {
        test('handles null, undefined, and empty inputs', () => {
            expect(normalizeDate(null)).toBeNull();
            expect(normalizeDate(undefined)).toBeNull();
            expect(normalizeDate('')).toBeNull();
        });

        test('handles Firestore/Supabase Timestamp style objects', () => {
            const timestamp = { seconds: 1772323200, nanoseconds: 0 }; // 2026-03-01T00:00:00.000Z
            const result = normalizeDate(timestamp as any);
            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe('2026-03-01T00:00:00.000Z');
        });

        test('handles valid ISO strings', () => {
            const isoString = '2026-06-15T10:30:00.000Z';
            const result = normalizeDate(isoString);
            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe(isoString);
        });

        test('handles malformed date strings using YYYY-MM-DD fallback', () => {
            const malformedString = '2026-06-15Tinvalid-timestamp';
            const result = normalizeDate(malformedString);
            expect(result).toBeInstanceOf(Date);
            expect(result?.getFullYear()).toBe(2026);
            expect(result?.getMonth()).toBe(5); // 0-indexed, so 5 is June
            expect(result?.getDate()).toBe(15);
        });

        test('returns null for completely invalid strings', () => {
            expect(normalizeDate('not-a-date')).toBeNull();
        });

        test('handles valid Date objects', () => {
            const date = new Date('2026-06-15T12:00:00Z');
            const result = normalizeDate(date);
            expect(result).toBeInstanceOf(Date);
            expect(result?.getTime()).toBe(date.getTime());
        });

        test('returns null for invalid Date objects', () => {
            const invalidDate = new Date('invalid');
            expect(normalizeDate(invalidDate)).toBeNull();
        });
    });

    describe('getEventDays', () => {
        test('returns empty array if start date is missing or invalid', () => {
            expect(getEventDays(null, '2026-06-15')).toEqual([]);
            expect(getEventDays('invalid', '2026-06-15')).toEqual([]);
        });

        test('returns single day if end date is missing or same as start', () => {
            expect(getEventDays('2026-06-15T10:00:00Z', null)).toEqual(['2026-06-15']);
            expect(getEventDays('2026-06-15T10:00:00Z', '2026-06-15T15:00:00Z')).toEqual(['2026-06-15']);
        });

        test('returns single day if end date is before start date', () => {
            expect(getEventDays('2026-06-15T10:00:00Z', '2026-06-14T10:00:00Z')).toEqual(['2026-06-15']);
        });

        test('expands to multiple days for multi-day events', () => {
            const start = '2026-06-15T10:00:00Z';
            const end = '2026-06-17T15:00:00Z';
            expect(getEventDays(start, end)).toEqual([
                '2026-06-15',
                '2026-06-16',
                '2026-06-17'
            ]);
        });

        test('performs boundary check when event ends exactly at midnight (start of day)', () => {
            // Event starts on June 15th at 12:00 PM and ends exactly on June 16th at 00:00 AM (midnight)
            const start = '2026-06-15T12:00:00';
            const end = '2026-06-16T00:00:00';
            
            // Should NOT include June 16th because it ends exactly at the start of that day
            const result = getEventDays(start, end);
            expect(result).toEqual(['2026-06-15']);
        });

        test('does include the day if event starts and ends exactly at midnight on same day', () => {
            const start = '2026-06-15T00:00:00';
            const end = '2026-06-15T00:00:00';
            const result = getEventDays(start, end);
            expect(result).toEqual(['2026-06-15']);
        });
    });

    describe('safeFormat', () => {
        test('returns formatted string for valid inputs', () => {
            const dateStr = '2026-06-15T10:30:00.000Z';
            // We use standard formatting format
            expect(safeFormat(dateStr, 'yyyy-MM-dd')).toBe('2026-06-15');
        });

        test('returns empty string for invalid/null inputs', () => {
            expect(safeFormat(null, 'yyyy-MM-dd')).toBe('');
            expect(safeFormat('invalid', 'yyyy-MM-dd')).toBe('');
        });
    });
});
