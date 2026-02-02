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
            const approvalStatus = task.approvalStatus?.toLowerCase();

            // 1. Tasks Due Today: dueDate is today AND status !== completed
            if (isToday(task.dueDate) && status !== 'completed') {
                metrics.todo++;
            }

            // 2. Completed Today: status === completed AND completedAt is today
            if (status === 'completed' && isToday(task.completedAt)) {
                metrics.completed++;
            }

            // 3. In Progress: status === in_progress
            if (status === 'in_progress' || status === 'in progress') {
                metrics.inProgress++;
            }

            // 4. Pending Review: approvalStatus === pending_review
            if (approvalStatus === 'pending_review' || approvalStatus === 'pending review') {
                metrics.review++;
            }

            // 5. Pending Approval (Admin only): approvalStatus === pending_approval
            if (user?.isAdmin && (approvalStatus === 'pending_approval' || approvalStatus === 'pending approval')) {
                metrics.pendingApproval++;
            }
        });

        return metrics;
    }, [tasks, user]);
}
