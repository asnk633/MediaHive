// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from "react";
import { Task } from "@/features/tasks/types/task";
import { useAuth } from "@/contexts/AuthContextProvider";
import { TrashService } from "@/services/trashService";
import { useOptimisticTasks } from "@/features/tasks/hooks/useOptimisticTasks";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const TaskListView = dynamic(() => import("@/components/tasks/TaskListView").then(mod => mod.TaskListView), {
    loading: () => <div className="p-6 space-y-4"><div className="h-12 w-full bg-foreground/5 animate-pulse rounded" /></div>
});

export default function TrashPageClient() {
    const [serverTasks, setServerTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // We can use optimistic tasks just like TrashView did
    const { displayTasks, mutate } = useOptimisticTasks(serverTasks, setServerTasks as React.Dispatch<React.SetStateAction<Task[]>>);
    const visibleTasks = displayTasks.filter(t => t.deleted !== false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await TrashService.getTrash();
            setServerTasks(data);
        } catch {
            toast.error('Failed to load Trash');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Trash"
                description={visibleTasks.length === 0 ? "Empty" : `${visibleTasks.length} deleted tasks · auto-purged after 30 days`}
            />

            <div className="flex-1">
                <TaskListView
                    tasks={visibleTasks}
                    loading={loading}
                    mode="trash"
                    onTaskMutate={mutate}
                    onRefresh={load} /* So restore/delete can trigger reload */
                />
            </div>
        </PageLayout>
    );
}
