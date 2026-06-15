"use client";
import { nativeNavigate } from '@/lib/utils';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskDetailModalV2 } from '@/components/tasks/TaskDetailModalV2';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import { TaskService } from '@/services/tasks';
import { Task } from '@/features/tasks/types/task';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { toast } from 'sonner';

export default function TaskStandalonePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchTask = async () => {
            try {
                const data = await TaskService.getTaskById(id);
                
                if (data) {
                    setTask(data);
                } else {
                    toast.error("Task not found");
                    nativeNavigate('/tasks', router, 'page.tsx');
                }
            } catch (err) {
                console.error("Failed to fetch task for standalone page", err);
                toast.error("An error occurred while loading the task");
                nativeNavigate('/tasks', router, 'page.tsx');
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id, router]);

    if (loading) {
        return (
            <PageLayout mode="plain">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </PageLayout>
        );
    }

    if (!task) return null;

    return (
        <PageLayout mode="plain">
            <TaskDetailModalV2
                task={task}
                isOpen={true}
                onClose={() => nativeNavigate('/tasks', router, 'page.tsx')}
                onEdit={() => setIsEditDialogOpen(true)}
                onTaskMutate={async (ids, updates, apiCall) => {
                    if (apiCall) await apiCall();
                    // Refetch or refresh to keep standalone state in sync
                    const updated = await TaskService.getTaskById(id);
                    if (updated) setTask(updated);
                    router.refresh();
                }}
            />

            {isEditDialogOpen && (
                <EditTaskDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    task={task}
                    onUpdate={async (updates) => {
                        try {
                            await TaskService.updateTask(task.id, updates);
                            const updated = await TaskService.getTaskById(task.id);
                            if (updated) setTask(updated);
                            return true;
                        } catch (e) {
                            console.error(e);
                            return false;
                        }
                    }}
                />
            )}
        </PageLayout>
    );
}
