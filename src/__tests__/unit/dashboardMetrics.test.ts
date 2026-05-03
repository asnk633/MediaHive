
import { computeDashboardMetrics } from '@/lib/dashboardMetrics';
import { normalizeTasks, normalizeEvents } from '@/lib/normalization';
import { Task } from '@/features/tasks/types/task';
import { Event } from '@/features/events/types/event';
import { addDays, subDays } from 'date-fns';

/**
 * PHASE-5 AUTOMATED PARITY TEST
 * 
 * Objective: Freeze dashboard semantics forever.
 * Target: src/lib/dashboardMetrics.ts
 */

describe('computeDashboardMetrics (Phase-5 Parity Lock)', () => {
    // freeze time to 2026-02-03T12:00:00 (Noon)
    const MOCK_NOW = new Date('2026-02-03T12:00:00');

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_NOW);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const mockTask = (overrides: Partial<Task>): Task => ({
        id: 'task-' + Math.random(),
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        institution_id: 'Thaiba Garden HQ',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: { uid: 'user-1', displayName: 'User One', email: 'u1@example.com' },
        assigned_to: [],
        ...overrides
    } as Task);

    const mockEvent = (overrides: Partial<Event>): Event => ({
        id: 'event-' + Math.random(),
        title: 'Test Event',
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
        type: 'meeting',
        institution_id: 'Thaiba Garden HQ',
        created_by: { uid: 'user-1', displayName: 'User One', email: 'u1@example.com' },
        ...overrides
    } as Event);

    const USER_1 = { uid: 'user-1', role: 'admin', institution_id: 'Thaiba Garden HQ' };

    // 1️⃣ Due Today (Legacy Merge)
    // Rule: Included if due <= Today AND not done.
    test('Rule 1: Due Today (Legacy Merge)', () => {
        const tasks: Task[] = [
            mockTask({ title: 'Due Yesterday', due_date: subDays(MOCK_NOW, 1), status: 'todo' }),
            mockTask({ title: 'Due Today', due_date: MOCK_NOW, status: 'todo' }),
            mockTask({ title: 'Due Tomorrow', due_date: addDays(MOCK_NOW, 1), status: 'todo' }),
            mockTask({ title: 'Done Today', due_date: MOCK_NOW, status: 'done', completed_at: MOCK_NOW }),
        ];

        const metrics = computeDashboardMetrics(normalizeTasks(tasks), [], USER_1);

        // Expectation: Due Yesterday + Due Today = 2
        expect(metrics.dueToday).toBe(2);
        // Tomorrow excluded
        // Done excluded
    });

    // 2️⃣ Overdue & GlobalOverdue
    // Rule: Strictly past AND not done.
    test('Rule 2: Overdue & GlobalOverdue', () => {
        const tasks: Task[] = [
            mockTask({ title: 'Overdue 1', due_date: subDays(MOCK_NOW, 1), status: 'todo' }),
            mockTask({ title: 'Overdue 2', due_date: subDays(MOCK_NOW, 5), status: 'in_progress' }),
            mockTask({ title: 'Due Today', due_date: MOCK_NOW, status: 'todo' }), // Not overdue yet (assuming startOfDay comparison or strict past?)
            // verify implementation uses isPast(due_date) which typically means < now?
            // User requested: "task due yesterday ... included in dueToday"
            // "overdue tasks counted strictly in overdue"
        ];

        // Note: isPast(today) is usually false if time is same, but let's see. 
        // dashboardMetrics uses `isPast`.
        // If due_date is exactly mocked MOCK_NOW (Noon), isPast(Noon) == false.

        const metrics = computeDashboardMetrics(normalizeTasks(tasks), [], USER_1);

        expect(metrics.overdue).toBe(2);
        expect(metrics.adminTotals.globalOverdue).toBe(2);
    });

    // 3️⃣ Completed Today
    // Rule: Done + CompletedAt Today.
    test('Rule 3: Completed Today', () => {
        const tasks: Task[] = [
            mockTask({ title: 'Done Today', status: 'done', completed_at: MOCK_NOW }),
            mockTask({ title: 'Done Yesterday', status: 'done', completed_at: subDays(MOCK_NOW, 1) }),
            mockTask({ title: 'Done Null', status: 'done', completed_at: null }), // should be safe
        ];

        const metrics = computeDashboardMetrics(normalizeTasks(tasks), [], USER_1);

        expect(metrics.completedToday).toBe(1);
    });

    // 4️⃣ On Hold
    // Rule: Only status "on_hold".
    test('Rule 4: On Hold Strictness', () => {
        const tasks: Task[] = [
            mockTask({ status: 'on_hold' }),
            mockTask({ status: 'review' }), // Phase-3 Rollback: Review NOT in OnHold
            mockTask({ status: 'in_progress' }),
        ];

        const metrics = computeDashboardMetrics(normalizeTasks(tasks), [], USER_1);

        expect(metrics.blocked).toBe(1); // mapped to onHold internally
        expect(metrics.adminTotals.onHold).toBe(1);
    });

    // 5️⃣ Review vs Pending Approvals
    // Rule: Review ⊆ Pending Approvals.
    // Rule: Approval Status "pending" also counted.
    test('Rule 5: Review & Pending Approvals', () => {
        const tasks: Task[] = [
            mockTask({ status: 'review', approval_status: 'approved' }), // Case A: Review
            mockTask({ status: 'in_progress', approval_status: 'pending' }), // Case B: Pending Approval (e.g. subtask?)
            mockTask({ status: 'review', approval_status: 'pending' }), // Case C: Both
            mockTask({ status: 'todo' }),
        ];

        const metrics = computeDashboardMetrics(normalizeTasks(tasks), [], USER_1);

        expect(metrics.review).toBe(2); // Case A + C
        expect(metrics.adminTotals.pendingApprovals).toBe(3); // Case A + B + C (Phase-3 requirement: Review OR Pending)
    });

    // 6️⃣ Created By Me
    // Rule: UID Match.
    test('Rule 6: Created By Me', () => {
        const tasks: Task[] = [
            mockTask({ created_by: { uid: 'user-1', displayName: 'Me', email: 'me' } }),
            mockTask({ created_by: 'user-1' as any }), // string fallback
            mockTask({ created_by: { uid: 'user-2', displayName: 'Other', email: 'other' } }),
            mockTask({ created_by: null }),
        ];

        const metrics = computeDashboardMetrics(normalizeTasks(tasks), [], USER_1);

        expect(metrics.adminTotals.createdMe).toBe(2);
    });

    // 7️⃣ Weekly Events
    test('Rule 7: Weekly Events', () => {
        // weekStart/End depends on locale, but assuming standard date-fns behavior
        // MOCK_NOW is Tuesday Feb 03 2026.
        // Week is likely Sunday Feb 01 - Sat Feb 07 (or Monday start).
        // Let's test explicit nearby days.

        const events: Event[] = [
            mockEvent({ date: MOCK_NOW }), // Today (Feb 3)
            mockEvent({ date: subDays(MOCK_NOW, 1) }), // Feb 2
            mockEvent({ date: addDays(MOCK_NOW, 2) }), // Feb 5
            mockEvent({ date: addDays(MOCK_NOW, 10) }), // Next week
            mockEvent({ date: subDays(MOCK_NOW, 10) }), // Last week
        ];

        const metrics = computeDashboardMetrics([], normalizeEvents(events), USER_1);

        // This Week Events logic uses `isWithinInterval(d, { start: weekStart, end: weekEnd })`
        // Should include at least Feb 2, 3, 5.
        // StartOfWeek usually defaults to Sunday or Monday. Feb 3 is Tuesday.
        // -1 (Feb 2 Mon) -> Included.
        // +2 (Feb 5 Thu) -> Included.
        // -10 (Jan 24) -> Excluded.
        // +10 (Feb 13) -> Excluded.

        expect(metrics.thisWeekEvents.length).toBe(3);
    });

    // 8️⃣ Next 7 Days Events
    // Rule: Today inclusive, Day 7 inclusive.
    test('Rule 8: Next 7 Days Events', () => {
        const events: Event[] = [
            mockEvent({ date: MOCK_NOW }), // Day 0
            mockEvent({ date: addDays(MOCK_NOW, 6) }), // Day 6
            mockEvent({ date: addDays(MOCK_NOW, 7) }), // Day 7 (Inclusive?)
            mockEvent({ date: addDays(MOCK_NOW, 8) }), // Day 8 (Excluded)
        ];

        // Logic: start: todayStart, end: next7DaysEnd (now + 7 days)
        // If now is Feb 3, +7 is Feb 10.
        // Interval is [Feb 3 start, Feb 10 end].
        // Day 0 (Feb 3) -> Yes
        // Day 6 (Feb 9) -> Yes
        // Day 7 (Feb 10) -> Yes
        // Day 8 (Feb 11) -> No

        const metrics = computeDashboardMetrics([], normalizeEvents(events), USER_1);

        const eventIds = metrics.next7DayEvents.map(e => e.id);
        expect(metrics.next7DayEvents.length).toBe(3);
    });

});
