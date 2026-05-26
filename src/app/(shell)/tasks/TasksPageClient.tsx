// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from "react";
import { Plus, CheckSquare, Building2, LayoutGrid, List as ListIcon, BarChart3 } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { OfflinePlaceholder } from "@/components/OfflinePlaceholder";
import { useNative } from "@/hooks/useNative";
import { Task } from "@/features/tasks/types/task";
import { useAuth } from "@/contexts/AuthContextProvider";
import { useWorkspace } from "@/system/workspace/WorkspaceProvider";
import AppLink from "@/components/AppLink";
import { useRouter, useSearchParams } from "next/navigation";
import { nativeNavigate, cn } from "@/lib/utils";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { supabase } from '@/lib/supabaseClient';
import { useOptimisticTasks } from "@/features/tasks/hooks/useOptimisticTasks";
import { useConnectivity } from "@/hooks/useConnectivity";
import { PERFORMANCE_THRESHOLDS } from '@/domain/system/performanceThresholds';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { usePermissions } from "@/hooks/usePermissions";
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components
const TaskListView = dynamic(() => import("@/components/tasks/TaskListView").then(mod => mod.TaskListView), {
    loading: () => <div className="p-6 space-y-4 min-h-[400px]"><div className="h-12 w-full bg-foreground/5 animate-pulse rounded-xl" /><div className="h-64 w-full bg-foreground/5 animate-pulse rounded-xl" /></div>
});
const TaskKanbanView = dynamic(() => import("@/components/tasks/TaskKanbanView").then(mod => mod.TaskKanbanView), {
    loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse"><div className="h-96 bg-foreground/5 animate-pulse rounded-xl" /></div>
});
const TaskConfidenceView = dynamic(() => import("@/components/tasks/TaskConfidenceView").then(mod => mod.TaskConfidenceView));
const TaskDetailModalV2 = dynamic(() => import("@/components/tasks/TaskDetailModalV2").then(mod => mod.TaskDetailModalV2));
const EditTaskDialog = dynamic(() => import("@/components/tasks/EditTaskDialog").then(mod => mod.EditTaskDialog));
import { ConflictResolutionPanel } from "@/components/tasks/ConflictResolutionPanel";
import { PolicySimulationPanel } from "@/components/tasks/PolicySimulationPanel";
import { AlertTriangle, Box } from "lucide-react";
import { ConflictAwarenessBadge } from "@/components/tasks/ConflictAwarenessBadge";
import { TaskSummaryWidget } from "@/features/tasks/components/TaskSummaryWidget";

export default function TasksPageClient() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { isNative } = useNative();
    const { isOnline } = useConnectivity();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, authStatus } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const role = user?.role;
    const router = useRouter();
    const searchParams = useSearchParams();

    const { canManageAllTasks } = usePermissions();
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'confidence'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tasks-view-pref');
            return (saved === 'kanban' || saved === 'confidence' || saved === 'list') ? saved : 'list';
        }
        return 'list';
    });

    const handleViewModeChange = (mode: 'list' | 'kanban' | 'confidence') => {
        setViewMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tasks-view-pref', mode);
        }
    };

    // Modal States
    const taskIdFromUrl = searchParams.get('id');
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { displayTasks, mutate, syncRemoteTasks, isReplaying, conflictBuffer, resolveConflict } = useOptimisticTasks(tasks, setTasks);

    // Conflict UI State
    const [isConflictPanelOpen, setIsConflictPanelOpen] = useState(false);
    const [isSimulationOpen, setIsSimulationOpen] = useState(false);
    const conflictCount = Object.keys(conflictBuffer).length;

    // Filter out deleted tasks for active view
    const visibleTasks = React.useMemo(() =>
        displayTasks.filter(t => !t.deleted)
        , [displayTasks]);

    // Derived state for Detail Modal
    const selectedTask = React.useMemo(() =>
        visibleTasks.find(t => t.id === taskIdFromUrl) || null
        , [visibleTasks, taskIdFromUrl]);

    // Phase 14 Dev Seeder removed

    // UI-P1.1 — Explicit Auth Gate
    const authReady = !!user && !!role;

    const fetchData = useCallback(async () => {
        if (!authReady) return;
        if (isNative) return;
        if (typeof document !== 'undefined' && document.hidden) return;

        // Phase 8: Pause real-time sync when offline or replaying offline mutations.
        if (!isOnline || isReplaying) return;

        setLoading(true);
        const startTime = performance.now();

        const unsubscribe = CanonicalDataService.subscribeToTasks(
            {
                role,
                userId: user?.uid,
                institutionId: currentWorkspaceId,
                includeDemoData: true,
                includeAllHistory: true
            },
            (fetchedTasks) => {
                syncRemoteTasks(fetchedTasks, user);
                setError(null);
                setLoading(false);

                const duration = performance.now() - startTime;
                if (duration > PERFORMANCE_THRESHOLDS.PAGE_SETTLE_MS) {
                    console.warn(`[PERF] Task real-time fetch slow: ${duration.toFixed(0)}ms`);
                }
            },
            (err) => {
                console.error('[TasksPageClient] Sync error:', err);
                if (err.message && (err.message.includes('Unauthorized') || err.message.includes('401'))) {
                    return;
                }
                setError('Live sync failed');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [authReady, isNative, user?.uid, role, isOnline, isReplaying, currentWorkspaceId]);

    useEffect(() => {
        if (!authReady) return;
        setTasks([]); // Clear tasks immediately on workspace change to avoid data bleed
        fetchData();
    }, [authReady, fetchData, currentWorkspaceId]);

    const handleTaskClick = (task: Task) => {
        // Update URL to trigger modal (Soft Navigation)
        const params = new URLSearchParams(searchParams);
        params.set('id', task.id);

        // Use soft navigation to avoid full page reload
        router.replace(`/tasks?${params.toString()}`, { scroll: false });
    };

    const handleCloseModal = () => {
        const returnTo = searchParams.get('returnTo');
        if (returnTo === 'home') {
            router.push('/home');
        } else {
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            params.delete('returnTo');
            // Soft replace
            router.replace(`/tasks?${params.toString()}`, { scroll: false });
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
            try {
                const success = await CanonicalDataService.patchFields(
                    'tasks', 
                    taskToEdit.id, 
                    updates, 
                    'task',
                    taskToEdit.updatedAt,
                    taskToEdit.version
                );
                
                if (success) {
                    // Optimistic update
                    setTasks(prev => prev.map(t => t.id === taskToEdit.id ? { ...t, ...updates } : t));
                    return true;
                }
            } catch (err) {
                console.error('[TasksPageClient] Failed to patch task:', err);
            }
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
                    <div className="flex items-center gap-3">
                        {canManageAllTasks && (
                            <div className="flex items-center bg-foreground/[0.03] p-1 rounded-full border border-foreground/10 mr-2 backdrop-blur-md">
                                <button
                                    title="List View"
                                    onClick={() => handleViewModeChange('list')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200 border border-transparent",
                                        viewMode === 'list' ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" : "text-foreground/60 hover:text-foreground/90"
                                    )}
                                >
                                    <ListIcon size={16} />
                                </button>
                                <button
                                    title="Kanban Board"
                                    onClick={() => handleViewModeChange('kanban')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200 border border-transparent",
                                        viewMode === 'kanban' ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" : "text-foreground/60 hover:text-foreground/90"
                                    )}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    title="Admin Confidence Panel"
                                    onClick={() => handleViewModeChange('confidence')}
                                    className={cn(
                                        "p-2 rounded-full transition-all duration-200 border border-transparent",
                                        viewMode === 'confidence' ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" : "text-foreground/60 hover:text-foreground/90"
                                    )}
                                >
                                    <BarChart3 size={16} />
                                </button>
                            </div>
                        )}

                        <AppLink href="/tasks/new">
                            <button
                                aria-label="New Task"
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl transition-all active:scale-95 text-sm font-bold tracking-wide"
                            >
                                <Plus size={18} className="drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]" />
                                <span className="hidden sm:inline">New Task</span>
                            </button>
                        </AppLink>
                    </div>
                }
            />

            {/* Content */}
            <div className="flex-1">
                <TaskSummaryWidget tasks={visibleTasks} />
                {viewMode === 'kanban' ? (
                    <TaskKanbanView
                        tasks={visibleTasks}
                        loading={loading}
                        onTaskClick={handleTaskClick}
                        onTaskMutate={mutate}
                    />
                ) : viewMode === 'confidence' ? (
                    <TaskConfidenceView
                        tasks={visibleTasks}
                        loading={loading}
                        onTaskClick={handleTaskClick}
                    />
                ) : (
                    <TaskListView
                        tasks={visibleTasks}
                        loading={loading}
                        error={error}
                        onTaskClick={handleTaskClick}
                        onTaskMutate={mutate}
                    />
                )}
            </div>

            {/* Detail Modal */}
            <TaskDetailModalV2
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={handleCloseModal}
                onEdit={handleEditFromModal}
                onTaskMutate={mutate}
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
