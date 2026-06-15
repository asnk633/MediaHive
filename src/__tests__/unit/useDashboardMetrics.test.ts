import { renderHook } from '@testing-library/react';
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics';
import { Task } from '@/features/tasks/types/task';

describe('useDashboardMetrics hook', () => {
    // Freeze system time to 2026-06-15T12:00:00
    const MOCK_TODAY = new Date('2026-06-15T12:00:00');

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(MOCK_TODAY);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const mockTask = (overrides: Partial<Task>): Task => {
        return {
            id: 'task-' + Math.random(),
            title: 'Mock Task',
            status: 'todo',
            priority: 'medium',
            due_date: '2026-06-15T17:00:00.000Z',
            created_by: { uid: 'user-1', name: 'User One', role: 'member' },
            assigned_by: { uid: 'user-2', name: 'User Two', role: 'admin' },
            created_at: new Date().toISOString(),
            ...overrides,
        } as Task;
    };

    const mockUser = {
        uid: 'user-1',
        name: 'User One',
        role: 'member',
        email: 'u1@example.com'
    };

    const mockAdmin = {
        uid: 'admin-1',
        name: 'Admin One',
        role: 'admin',
        email: 'a1@example.com'
    };

    test('returns all zero metrics for empty task array', () => {
        const { result } = renderHook(() => useDashboardMetrics([], mockUser));
        expect(result.current).toEqual({
            todo: 0,
            inProgress: 0,
            review: 0,
            completed: 0,
            pendingApproval: 0,
            overdue: 0
        });
    });

    test('counts todo tasks that are due today and not completed', () => {
        const tasks = [
            mockTask({ title: 'Due Today', due_date: '2026-06-15T09:00:00Z', status: 'todo' }),
            mockTask({ title: 'Due Today In Progress', due_date: '2026-06-15T10:00:00Z', status: 'in_progress' }), // also counts as todo if due today
            mockTask({ title: 'Due Tomorrow', due_date: '2026-06-16T12:00:00Z', status: 'todo' }), // Excluded (not today)
            mockTask({ title: 'Completed Today', due_date: '2026-06-15T12:00:00Z', status: 'completed' }) // Excluded (completed)
        ];

        const { result } = renderHook(() => useDashboardMetrics(tasks, mockUser));
        expect(result.current.todo).toBe(2);
    });

    test('counts completed tasks completed today', () => {
        const tasks = [
            mockTask({ title: 'Completed Today', status: 'completed', completed_at: '2026-06-15T11:00:00Z' }),
            mockTask({ title: 'Completed Yesterday', status: 'completed', completed_at: '2026-06-14T23:59:59Z' }), // Excluded
            mockTask({ title: 'Completed Date Object', status: 'completed', completed_at: new Date('2026-06-15T08:00:00Z') }),
            mockTask({ title: 'Completed Missing Date', status: 'completed', completed_at: undefined }), // Excluded
            mockTask({ title: 'Not Completed', status: 'todo', completed_at: '2026-06-15T11:00:00Z' }) // Excluded
        ];

        const { result } = renderHook(() => useDashboardMetrics(tasks, mockUser));
        expect(result.current.completed).toBe(2);
    });

    test('counts in progress tasks', () => {
        const tasks = [
            mockTask({ title: 'Task 1', status: 'in_progress' }),
            mockTask({ title: 'Task 2', status: 'in progress' as any }), // case variation
            mockTask({ title: 'Task 3', status: 'todo' }),
            mockTask({ title: 'Task 4', status: 'completed' })
        ];

        const { result } = renderHook(() => useDashboardMetrics(tasks, mockUser));
        expect(result.current.inProgress).toBe(2);
    });

    test('counts pending review tasks', () => {
        const tasks = [
            mockTask({ title: 'Review 1', approval_status: 'pending_review' }),
            mockTask({ title: 'Review 2', approval_status: 'pending review' as any }),
            mockTask({ title: 'Review 3', approval_status: 'approved' }),
            mockTask({ title: 'Review 4', approval_status: undefined })
        ];

        const { result } = renderHook(() => useDashboardMetrics(tasks, mockUser));
        expect(result.current.review).toBe(2);
    });

    test('counts pending approval tasks only for admin role', () => {
        const tasks = [
            mockTask({ title: 'Approval 1', approval_status: 'pending_approval' }),
            mockTask({ title: 'Approval 2', approval_status: 'pending approval' as any }),
            mockTask({ title: 'Approval 3', approval_status: 'approved' })
        ];

        // Member user
        const { result: memberResult } = renderHook(() => useDashboardMetrics(tasks, mockUser));
        expect(memberResult.current.pendingApproval).toBe(0);

        // Admin user
        const { result: adminResult } = renderHook(() => useDashboardMetrics(tasks, mockAdmin));
        expect(adminResult.current.pendingApproval).toBe(2);
    });

    test('handles different timestamp object formats', () => {
        const tasks = [
            // Firestore timestamp format: { seconds, nanoseconds }
            mockTask({
                title: 'Firestore Timestamp',
                due_date: { seconds: Math.floor(MOCK_TODAY.getTime() / 1000), nanoseconds: 0 },
                status: 'todo'
            }),
            // Invalid date string
            mockTask({
                title: 'Invalid Date',
                due_date: 'invalid-date-string',
                status: 'todo'
            })
        ];

        const { result } = renderHook(() => useDashboardMetrics(tasks, mockUser));
        expect(result.current.todo).toBe(1);
    });
});
