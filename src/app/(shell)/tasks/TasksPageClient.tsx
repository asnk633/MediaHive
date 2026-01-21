'use client';

import React, { useEffect, useState } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { Task } from "@/types/task";
import { TaskListView } from "@/components/tasks/TaskListView";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { TaskDetailModalV2 } from "@/components/tasks/TaskDetailModalV2";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { TaskService } from "@/services/tasks";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";

export default function TasksPageClient() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        let isSubscribed = true;
        let intervalId: NodeJS.Timeout | null = null;

        const fetchTasks = async () => {
            if (typeof document !== 'undefined' && document.hidden) return;

            // Only fetch if strictly authenticated to avoid 401s from racing conditions
            if (user && authStatus === 'authenticated') {
                try {
                    const fetchedTasks = await CanonicalDataService.getTasks({
                        role: user.role,
                        userId: user.uid,
                        includeDemoData: true
                    });

                    if (isSubscribed) {
                        setTasks(fetchedTasks);
                        setLoading(false);
                    }
                } catch (error: any) {
                    if (isSubscribed) {
                        setLoading(false);
                        const msg = error.message?.toLowerCase() || '';
                        if (msg.includes('429') || msg.includes('401') || msg.includes('unauthorized')) {
                            if (msg.includes('429')) console.warn('[TasksPage] Rate limited.');
                        } else {
                            console.error('[TasksPage] Failed to fetch tasks:', error);
                        }
                    }
                }
            }
        };

        fetchTasks();
        intervalId = setInterval(fetchTasks, 30000);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (intervalId) clearInterval(intervalId);
            } else {
                fetchTasks();
                intervalId = setInterval(fetchTasks, 30000);
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            isSubscribed = false;
            if (intervalId) clearInterval(intervalId);
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [user]);

    const handleTaskClick = (task: Task) => {
        // Update URL to trigger modal
        const params = new URLSearchParams(searchParams);
        params.set('id', task.id);
        router.push(`/tasks?${params.toString()}`);
    };

    const handleCloseModal = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('id');
        router.push(`/tasks?${params.toString()}`);
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

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Tasks"
                description="Accountability-focused task management."
                actions={
                    <Link href="/tasks/new">
                        <button
                            aria-label="New Task"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg dark:shadow-blue-900/50 light:shadow-blue-200 transition-all active:scale-95 text-sm font-semibold"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">New Task</span>
                        </button>
                    </Link>
                }
            />

            {/* Content */}
            <div className="flex-1">
                <TaskListView
                    tasks={tasks}
                    loading={loading}
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
            {taskToEdit && (
                <EditTaskDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    task={taskToEdit}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </PageLayout>
    );
}
