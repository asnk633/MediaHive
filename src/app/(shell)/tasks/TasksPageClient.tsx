'use client';

import React, { useEffect, useState } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { OfflinePlaceholder } from "@/components/OfflinePlaceholder";
import { useNative } from "@/hooks/useNative";
import { Task } from "@/types/task";
import { useAuth } from "@/contexts/AuthContextProvider";
import AppLink from "@/components/AppLink";
import { useRouter, useSearchParams } from "next/navigation";
import { nativeNavigate } from "@/lib/utils";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { TaskService } from "@/services/tasks";
import { PAGE_SETTLE_MS } from "@/config/performanceThresholds";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components
const TaskListView = dynamic(() => import("@/components/tasks/TaskListView").then(mod => mod.TaskListView), {
    loading: () => <div className="p-6 space-y-4"><div className="h-12 w-full bg-white/5 animate-pulse rounded" /></div>
});
const TaskDetailModalV2 = dynamic(() => import("@/components/tasks/TaskDetailModalV2").then(mod => mod.TaskDetailModalV2));
const EditTaskDialog = dynamic(() => import("@/components/tasks/EditTaskDialog").then(mod => mod.EditTaskDialog));

export default function TasksPageClient() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { isNative } = useNative();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, authStatus } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Modal States
    const taskIdFromUrl = searchParams.get('id');
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Derived state for Detail Modal
    const selectedTask = React.useMemo(() =>
        tasks.find(t => t.id === taskIdFromUrl) || null
        , [tasks, taskIdFromUrl]);

    const fetchTasks = React.useCallback(async () => {
        if (isNative) return;
        if (typeof document !== 'undefined' && document.hidden) return;

        // Only fetch if strictly authenticated to avoid 401s from racing conditions
        if (user && authStatus === 'authenticated') {
            // PERFORMANCE INSTRUMENTATION: Mark start of task list fetch
            const startTime = performance.now();

            try {
                const fetchedTasks = await CanonicalDataService.getTasks({
                    role: user.role,
                    userId: user.uid,
                    includeDemoData: true
                });

                setTasks(fetchedTasks);
                setError(null); // Clear error on success
                setLoading(false);

                // PERFORMANCE INSTRUMENTATION: Calculate duration
                const duration = performance.now() - startTime;

                if (duration > PAGE_SETTLE_MS) {
                    console.warn(
                        `[PERF] Task list fetch slow: ${duration.toFixed(0)}ms ` +
                        `(threshold: ${PAGE_SETTLE_MS}ms, overage: +${(duration - PAGE_SETTLE_MS).toFixed(0)}ms)`
                    );
                }

                // (Legacy marks removed to prevent race conditions)
            } catch (err: any) {
                console.error('[TasksPageClient] Error fetching tasks:', err);
                if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
                    // Suppress 401s during auth transitions
                    return;
                }
                setError('Tasks couldn’t be loaded');
            }
        }
    }, [isNative, user, authStatus]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        fetchTasks();

        // Only poll on Web
        if (!Capacitor.isNativePlatform()) {
            intervalId = setInterval(fetchTasks, 30000);
        }

        // Handles Task 84: Stale Data Truthfulness (Silent Refresh on Focus)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (intervalId) clearInterval(intervalId);
            } else {
                fetchTasks();
                // Only restore poll on Web
                if (!Capacitor.isNativePlatform()) {
                    intervalId = setInterval(fetchTasks, 30000);
                }
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [user, fetchTasks]);

    const handleTaskClick = (task: Task) => {
        // Update URL to trigger modal
        const params = new URLSearchParams(searchParams);
        params.set('id', task.id);
        nativeNavigate(`/tasks?${params.toString()}`, router, 'TasksPage (Modal Open)');
    };

    const handleCloseModal = () => {
        const returnTo = searchParams.get('returnTo');
        if (returnTo === 'home') {
            nativeNavigate('/home', router, 'TasksPage (Return to Home)');
        } else {
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            params.delete('returnTo');
            nativeNavigate(`/tasks?${params.toString()}`, router, 'TasksPage (Modal Close)');
        }
    };

    const handleEditFromModal = () => {
        if (selectedTask) {
            setTaskToEdit(selectedTask);
            setEditDialogOpen(true);
        }
    };

    const handleTaskUpdate = async (updates: Partial<Task>) => {
        if (taskToEdit) {
            await TaskService.updateTask(taskToEdit.id, updates);
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === taskToEdit.id ? { ...t, ...updates } : t));
            return true;
        }
        return false;
    };

    const handleOptimisticUpdate = (taskId: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    // TODO: [Future Sync]
    // Allow render (view-only).
    /*
    // Mobile/Offline Guard
    if (isNative) {
        // TODO: [Future Sync]
        // When offline sync is implemented, this guard should check:
        // if (isNative && !syncService.isReady) ...
        // Instead of hard blocking all native access.
        return (
            <PageLayout mode="plain">
                <PageHeader
                    title="Tasks"
                    description="Accountability-focused task management."
                />
                <OfflinePlaceholder
                    title="Tasks Sync"
                    message="Tasks are currently online-only. Offline task management coming soon."
                    icon={CheckSquare}
                />
            </PageLayout>
        );
    }
    */

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Tasks"
                description="Accountability-focused task management."
                actions={
                    <AppLink href="/tasks/new">
                        <button
                            aria-label="New Task"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg dark:shadow-blue-900/50 light:shadow-blue-200 transition-all active:scale-95 text-sm font-semibold"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">New Task</span>
                        </button>
                    </AppLink>
                }
            />

            {/* Content */}
            <div className="flex-1">
                <TaskListView
                    tasks={tasks}
                    loading={loading}
                    error={error}
                    onRetry={fetchTasks}
                    onTaskClick={handleTaskClick}
                    onTaskUpdate={handleOptimisticUpdate}
                />
            </div>

            {/* Detail Modal */}
            <TaskDetailModalV2
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={handleCloseModal}
                onEdit={handleEditFromModal}
            />

            {/* Edit Modal (Page Level) */}
            {
                taskToEdit && (
                    <EditTaskDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        task={taskToEdit}
                        onUpdate={handleTaskUpdate}
                    />
                )
            }
        </PageLayout >
    );
}
