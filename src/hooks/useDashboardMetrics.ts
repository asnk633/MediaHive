import { useMemo } from 'react';
import { Task } from '@/types/task';
import { AuthUser } from '@/contexts/AuthContextProvider';

interface DashboardMetrics {
    todo: number;
    inProgress: number;
    review: number;
    completed: number;
    pendingApproval: number;
    overdue: number;
}

export function useDashboardMetrics(tasks: Task[], user: AuthUser | null): DashboardMetrics {
    return useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Helper to check if a date is today
        const isToday = (dateField?: any) => {
            if (!dateField) return false;
            try {
                // Handle different date formats (Real Cloud Firestore Timestamps vs Mock Strings/Dates)
                const date = (dateField as any).seconds
                    ? new Date((dateField as any).seconds * 1000)
                    : new Date(dateField);

                if (isNaN(date.getTime())) return false;

                return date.toISOString().split('T')[0] === todayStr;
            } catch (e) {
                return false;
            }
        };

        const metrics = {
            todo: 0,
            inProgress: 0,
            review: 0,
            completed: 0,
            pendingApproval: 0,
            overdue: 0
        };

        tasks.forEach(task => {
            const status = task.status?.toLowerCase();
            const approval_status = task.approval_status?.toLowerCase();

            // 1. Tasks Due Today: due_date is today AND status !== completed
            if (isToday(task.due_date) && status !== 'completed') {
                metrics.todo++;
            }

            // 2. Completed Today: status === completed AND completed_at is today
            if (status === 'completed' && isToday(task.completed_at)) {
                metrics.completed++;
            }

            // 3. In Progress: status === in_progress
            if (status === 'in_progress' || status === 'in progress') {
                metrics.inProgress++;
            }

            // 4. Pending Review: approval_status === pending_review
            if (approval_status === 'pending_review' || approval_status === 'pending review') {
                metrics.review++;
            }

            // 5. Pending Approval (Admin only): approval_status === pending_approval
            if (user?.role === 'admin' && (approval_status === 'pending_approval' || approval_status === 'pending approval')) {
                metrics.pendingApproval++;
            }
        });

        return metrics;
    }, [tasks, user]);
}
