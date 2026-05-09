// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSearchParams, useRouter } from 'next/navigation';
import { useItemNavigation } from '@/hooks/useItemNavigation';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { TaskListSkeleton } from './TaskListSkeleton';
import { Task } from "@/features/tasks/types/task";
import { format, isToday, isPast } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContextProvider';
import { withTenant } from '@/lib/tenantQuery';
import { UserService } from '@/services/userService';
import { TaskService } from '@/services/tasks';
import { BulkActionBar } from './BulkActionBar';
import { EditTaskDialog } from './EditTaskDialog';
import { TrashService } from '@/services/trashService';
import { PermanentDeleteDialog } from '@/components/trash/PermanentDeleteDialog';
import { ActivityHistory, buildActivityLabel } from '@/lib/activityHistory';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import {
    CheckCircle2, Clock,
    AlertCircle, Circle, Filter,
    Rows, List, Minus
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskRow } from './SortableTaskRow';
import { useDensityStore } from '@/stores/useDensityStore';
import { COPY } from '@/lib/copy';
import { DataIntegritySignal } from '@/components/ui/DataIntegritySignal';
import { usePermissions } from '@/hooks/usePermissions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import EmptyState from '@/components/ui/EmptyState';

interface TaskListViewProps {
    tasks: Task[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onTaskClick?: (task: Task) => void;
    onTaskMutate?: (
        taskIds: string[],
        updates: Partial<Task>,
        apiCall: () => Promise<any>,
        options?: { errorMessage?: string; successMessage?: string; serializableOp?: any; }
    ) => Promise<void>;
    mode?: 'default' | 'trash';
    onRefresh?: () => void;
}

const safeDate = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'object' && 'seconds' in date) return new Date(date.seconds * 1000);
    if (typeof date === 'string') return new Date(date);
    return null;
};

// --- Design Tokens ---

const PriorityBadge = React.forwardRef<HTMLSpanElement, any>(({ priority, className, ...props }, ref) => {
    const styles = {
        urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
        high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        low: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    return (
        <span
            ref={ref}
            className={cn(
                "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border cursor-pointer hover:bg-white/5 transition-colors",
                styles[(priority || 'low') as keyof typeof styles] || styles.low,
                className
            )}
            {...props}
        >
            {priority}
        </span>
    );
});
PriorityBadge.displayName = "PriorityBadge";

const StatusPill = React.forwardRef<HTMLSpanElement, any>(({ status, onClick, className, ...props }, ref) => {
    const config = {
        done: { color: 'emerald', icon: CheckCircle2, label: 'Completed' },
        in_progress: { color: 'blue', icon: Clock, label: 'Working' },
        review: { color: 'amber', icon: AlertCircle, label: 'On Hold' },
        todo: { color: 'slate', icon: Circle, label: 'To Do' },
        pending: { color: 'amber', icon: AlertCircle, label: 'Approval Needed' }
    };

    // @ts-ignore
    const { color, icon: Icon, label } = config[status] || config.pending;

    const colorStyles = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        slate: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    };

    return (
        <span
            ref={ref}
            onClick={onClick}
            className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold border flex items-center gap-1.5 transition-all select-none w-fit cursor-pointer hover:bg-white/5 active:scale-95",
                // @ts-ignore
                colorStyles[color],
                className
            )}
            {...props}
        >
            <Icon size={12} />
            {label}
        </span>
    );
});
StatusPill.displayName = "StatusPill";

const TaskListViewComponent: React.FC<TaskListViewProps> = ({ tasks, loading = false, error = null, onRetry, onTaskClick, onTaskMutate, mode = 'default', onRefresh }) => {
    console.log(`[TRASH_DEBUG] TaskListView Render. Mode: ${mode}, Tasks: ${tasks.length}`);
    const { user } = useAuth();
    const { role: userRole, canManageAllTasks: canManage } = usePermissions();
    const { density, toggleDensity } = useDensityStore();

    // Filters & Views
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlFilter = searchParams.get('filter');
    const urlStatus = searchParams.get('status') || 'all';
    const urlPriority = searchParams.get('priority') || 'all';

    const [view, setView] = useState<'today' | 'all' | 'mine' | 'overdue' | 'due_today' | 'upcoming'>('today');

    useEffect(() => {
        if (urlFilter && ['overdue', 'due_today', 'upcoming', 'mine', 'all'].includes(urlFilter)) {
            setView(urlFilter as any);
        }
    }, [urlFilter]);

    const [filterStatus, setFilterStatus] = useState<string>(urlStatus);
    const [filterPriority, setFilterPriority] = useState<string>(urlPriority);

    // Synchronize local state with URL for back/forward navigation
    useEffect(() => {
        setFilterStatus(urlStatus);
    }, [urlStatus]);

    useEffect(() => {
        setFilterPriority(urlPriority);
    }, [urlPriority]);

    const debouncedUpdateUrl = useMemo(() => 
        debounce((updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            let changed = false;
            Object.entries(updates).forEach(([key, value]) => {
                if (params.get(key) !== value) {
                    if (value === 'all') params.delete(key);
                    else params.set(key, value);
                    changed = true;
                }
            });
            
            if (changed) {
                router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
            }
        }, 200), [searchParams, router]);

    const updateUrl = useCallback((updates: Record<string, string>) => {
        debouncedUpdateUrl(updates);
    }, [debouncedUpdateUrl]);

    const handleStatusChange = (status: string) => {
        setFilterStatus(status);
        updateUrl({ status });
    };

    const handlePriorityChange = (priority: string) => {
        setFilterPriority(priority);
        updateUrl({ priority });
    };

    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);

    // A2: Progressive Disclosure
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // Delayed Empty State (Phase 33-A)
    const [showEmptyState, setShowEmptyState] = useState(false);

    // --- Trash Mode State ---
    const [opLoading, setOpLoading] = useState(false);
    const [permDialog, setPermDialog] = useState(false);
    const [permTargets, setPermTargets] = useState<string[]>([]);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const [taskToSoftDelete, setTaskToSoftDelete] = useState<string | null>(null);


    useEffect(() => {
        if (!loading && tasks.length === 0) {
            const t = setTimeout(() => setShowEmptyState(true), 400);
            return () => clearTimeout(t);
        }
        setShowEmptyState(false);
    }, [loading, tasks.length]);

    const toggleExpand = (taskId: string) => {
        const newSet = new Set(expandedTasks);
        if (newSet.has(taskId)) {
            newSet.delete(taskId);
        } else {
            newSet.add(taskId);
        }
        setExpandedTasks(newSet);
    };

    React.useEffect(() => {
        if (canManage) {
            const fetchTeam = async () => {
                try {
                    const members = await UserService.getTeamMembers();
                    setTeamMembers(members);
                } catch (error) {
                    console.error("Failed to fetch team members", error);
                }
            };
            fetchTeam();
        }
    }, [canManage]);

    // --- LOGIC ---
    const processedTasks = useMemo(() => {
        const activeTasks: Task[] = [];
        const completedTasks: Task[] = [];

        // 1. Separation & Basic View/Attr Filtering
        tasks.forEach(t => {
            // In Trash mode, skip normal view & segregation, just apply local dropdown filters
            if (mode === 'trash') {
                if (filterStatus !== 'all' && t.status !== filterStatus) return;
                if (filterPriority !== 'all' && t.priority !== filterPriority) return;
                activeTasks.push(t);
                return;
            }

            // Filter: Status & Priority Dropdowns
            if (filterStatus !== 'all' && t.status !== filterStatus) return;
            if (filterPriority !== 'all' && t.priority !== filterPriority) return;

            // Filter: "Mine" View (Applies to everything)
            if (view === 'mine' && user) {
                const isAssigned = t.assignedTo && Array.isArray(t.assignedTo) && t.assignedTo.some(a => a.uid === user.uid);
                const isCreatedBy = t.createdBy?.uid === user.uid;
                if (!isAssigned && !isCreatedBy) return;
            }

            // Segregate
            if (t.status === 'done') {
                completedTasks.push(t);
            } else {
                // Active Tasks Logic
                // Filter: "Today" / "Overdue" View (Applies only to Active)
                if (view === 'today') {
                    // Legacy 'today' view can be handled as due_today equivalent or kept standard
                    // For now, keeping standard behaviour but checking filters
                    const due = safeDate(t.dueDate);
                    if (!due) return;
                    if (!(isToday(due) || isPast(due))) return;
                } else if (view === 'overdue') {
                    const due = safeDate(t.dueDate);
                    if (!due || !isPast(due) || isToday(due)) return;
                } else if (view === 'due_today') {
                    const due = safeDate(t.dueDate);
                    if (!due || !isToday(due)) return;
                } else if (view === 'upcoming') {
                    const due = safeDate(t.dueDate);
                    if (!due || due <= new Date()) return;
                }

                activeTasks.push(t);
            }
        });

        // 2. Sort Active Tasks (Due Date ASC, then Priority)
        activeTasks.sort((a, b) => {
            const dateA = safeDate(a.dueDate);
            const dateB = safeDate(b.dueDate);

            // Compare Dates
            if (dateA && dateB) {
                const diff = dateA.getTime() - dateB.getTime();
                if (diff !== 0) return diff;
            }
            if (dateA && !dateB) return -1; // Date first
            if (!dateA && dateB) return 1;

            // Compare Priority (Urgent > High > Medium > Low)
            const getPrioWeight = (p: string | undefined) => {
                switch (p) { case 'urgent': return 0; case 'high': return 1; case 'medium': return 2; case 'low': return 3; default: return 4; }
            };
            return getPrioWeight(a.priority) - getPrioWeight(b.priority);
        });

        if (mode === 'trash') {
            return activeTasks; // Deleted tasks are already correctly separated by the caller
        }

        // 3. Sort Completed Tasks (Most Recent First)
        completedTasks.sort((a, b) => {
            const cA = safeDate(a.completedAt) || safeDate(a.updatedAt) || safeDate(a.createdAt);
            const cB = safeDate(b.completedAt) || safeDate(b.updatedAt) || safeDate(b.createdAt);
            if (!cA) return 1; if (!cB) return -1;
            return cB.getTime() - cA.getTime();
        });

        // 4. Limit Completed to Top 10
        const recentCompleted = completedTasks.slice(0, 10);

        // 5. Combine (Active + Recent Completed)
        return [...activeTasks, ...recentCompleted];

    }, [tasks, view, filterStatus, filterPriority, user]);

    // Use processedTasks directly as the source of truth for ordering
    const orderedTasks = processedTasks;

    // --- Bulk Selection (Phase 5B) ---
    const orderedIds = useMemo(() => orderedTasks.map(t => t.id), [orderedTasks]);

    const {
        selectedIds,
        isSelected,
        isAllSelected,
        isIndeterminate,
        toggle,
        selectAll,
        selectRange,
        clear,
    } = useBulkSelection<string>({ allIds: orderedIds });

    // Track last clicked index for shift+click range selection
    const lastClickedIndexRef = useRef<number | null>(null);

    // Clear selection whenever filter/sort/view changes
    useEffect(() => {
        clear();
        lastClickedIndexRef.current = null;
    }, [view, filterStatus, filterPriority]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync FAB visibility with selection state
    useEffect(() => {
        if (selectedIds.size > 0) {
            document.body.classList.add('hide-fab');
        } else {
            document.body.classList.remove('hide-fab');
        }
        return () => document.body.classList.remove('hide-fab');
    }, [selectedIds.size]);


    const handleRestore = useCallback(async (ids: string[]) => {
        console.log(`[TRASH_DEBUG] handleRestore triggered. Actual Role: ${userRole}, IDs:`, ids);

        const allowed = userRole === 'admin' || (userRole === 'manager' || userRole === 'member');
        console.log(`[TRASH_DEBUG] Restore Guard Check: ${allowed ? 'PASS' : 'FAIL'} (Role: ${userRole})`);

        if (!allowed) {
            console.warn(`[TRASH_DEBUG] Restore BLOCKED for role: ${userRole}.`);
            toast.error("You do not have permission to restore tasks.");
            return;
        }

        const n = ids.length;
        const word = n === 1 ? 'task' : 'tasks';
        console.log(`[TRASH_DEBUG] Starting restore mutation for ${n} ${word}...`);
        setOpLoading(true);
        try {
            if (onTaskMutate) {
                await onTaskMutate(
                    ids,
                    { deleted: false },
                    async () => {
                        console.log('[TRASH_DEBUG] Calling TrashService.restore API...');
                        const res = await TrashService.restore(ids);
                        console.log('[TRASH_DEBUG] Restore API result:', res);

                        ids.forEach(id => {
                            ActivityHistory.push(id, {
                                action: 'restored',
                                label: buildActivityLabel('restored', undefined, n),
                                actorUid: user?.uid ?? '',
                                actorName: user?.name ?? 'Admin',
                                scope: n,
                            });
                        });
                        return { success: true };
                    },
                    { successMessage: `${n} ${word} restored` }
                );
            }
            console.log('[TRASH_DEBUG] Restore mutation completed. Clearing selection...');
            clear();
            if (process.env.NEXT_PUBLIC_DEV_NO_API !== 'true') {
                onRefresh?.();
            }
        } catch (error) {
            console.error('[TRASH_DEBUG] Restore error:', error);
            toast.error("Failed to restore tasks.");
        } finally {
            setOpLoading(false);
        }
    }, [user, userRole, clear, onRefresh, onTaskMutate]);


    const handlePermanentDelete = useCallback(async () => {
        const finalTargets = taskToDelete ? [taskToDelete] : permTargets;
        console.log(`[TRASH_DEBUG] handlePermanentDelete triggered.`);
        console.log(`[TRASH_DEBUG] Actual Role:`, userRole);
        console.log(`[TRASH_DEBUG] finalTargets:`, finalTargets);

        const allowed = userRole === 'admin';
        console.log(`[TRASH_DEBUG] Permanent Delete Guard Check: ${allowed ? 'PASS' : 'FAIL'}`);

        if (!allowed) {
            console.warn(`[TRASH_DEBUG] Permanent Delete BLOCKED for role: ${userRole}.`);
            toast.error("Only administrators can permanently delete tasks.");
            setPermDialog(false);
            setTaskToDelete(null);
            return;
        }

        if (finalTargets.length === 0) {
            console.error('[TRASH_DEBUG] ERROR: No targets for permanent delete.');
            return;
        }

        console.log(`[TRASH_DEBUG] PROCEEDING with Permanent Delete for ${finalTargets.length} tasks.`);
        setOpLoading(true);
        try {
            if (onTaskMutate) {
                console.log('[TRASH_DEBUG] Using onTaskMutate for optimistic delete.');
                await onTaskMutate(
                    finalTargets,
                    { _purged: true } as any,
                    () => TrashService.permanentDelete(finalTargets),
                    {
                        serializableOp: { type: 'deleteTasks', args: [finalTargets] },
                        successMessage: `${finalTargets.length} ${finalTargets.length === 1 ? 'task' : 'tasks'} permanently deleted`
                    }
                );
            } else {
                console.log('[TRASH_DEBUG] Falling back to direct TrashService call (no onTaskMutate).');
                const res = await TrashService.permanentDelete(finalTargets);
                console.log('[TRASH_DEBUG] Permanent Delete API result:', res);
                const n = finalTargets.length;
                toast.success(`${n} ${n === 1 ? 'task' : 'tasks'} permanently deleted`);
            }

            console.log('[TRASH_DEBUG] Deletion sequence complete. Resetting UI state...');
            setPermDialog(false);
            setPermTargets([]);
            setTaskToDelete(null);
            clear();
            if (process.env.NEXT_PUBLIC_DEV_NO_API !== 'true') {
                onRefresh?.();
            }
        } catch (error) {
            console.error('[TRASH_DEBUG] Permanent delete failed:', error);
            // mutate handles its own toasts usually, but we catch for safety
        } finally {
            setOpLoading(false);
        }
    }, [user, userRole, permTargets, taskToDelete, clear, onRefresh, onTaskMutate]);

    const handleSoftDelete = useCallback(async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        console.log(`[TRASH_DEBUG] handleSoftDelete triggered. taskId: ${taskId}, Role: ${userRole}`);

        if (!task) {
            console.error('[TRASH_DEBUG] Task not found for soft delete:', taskId);
            return;
        }

        const isCreator = (typeof task.created_by === 'string' ? task.created_by : task.created_by?.uid) === user?.uid;
        const allowed = userRole === 'admin' || (userRole === 'manager' || userRole === 'member') || (userRole === 'member' && isCreator);
        console.log(`[TRASH_DEBUG] Soft Delete Guard Check: ${allowed ? 'PASS' : 'FAIL'} (isCreator: ${isCreator})`);

        if (!allowed) {
            console.warn(`[TRASH_DEBUG] Soft Delete BLOCKED for role ${userRole}.`);
            toast.error("You do not have permission to delete this task.");
            return;
        }

        setOpLoading(true);
        try {
            console.log(`[TRASH_DEBUG] Starting soft delete mutation for task ${taskId}...`);
            if (onTaskMutate) {
                await onTaskMutate(
                    [taskId],
                    { deleted: true },
                    async () => {
                        console.log('[TRASH_DEBUG] Calling TaskService.updateTask (soft delete)...');
                        const tenantId = user?.tenant_id;
                        if (!tenantId) {
                            console.error("[TRASH_DEBUG] Soft Delete blocked: No tenant context");
                            throw new Error("No tenant context");
                        }
                        await withTenant(
                            supabase.from('tasks').update({ deleted: true }),
                            tenantId
                        ).eq('id', taskId);
                        ActivityHistory.push(taskId, {
                            action: 'deleted',
                            label: buildActivityLabel('deleted', undefined, 1),
                            actorUid: user?.uid ?? '',
                            actorName: user?.name ?? 'Anonymous',
                            scope: 1,
                        });
                        return { success: true };
                    },
                    { successMessage: "Task moved to trash" }
                );
            }
            if (process.env.NEXT_PUBLIC_DEV_NO_API !== 'true') {
                onRefresh?.();
            }
        } catch (error) {
            console.error('[TRASH_DEBUG] Soft delete error:', error);
            toast.error("Failed to move task to trash.");
        } finally {
            setOpLoading(false);
        }
    }, [user, userRole, tasks, onTaskMutate, onRefresh]);


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            // Future: Call API to persist order.
            // Local state mutation using arrayMove was removed here to prevent layout/reconciliation panics 
            // when filters or task statuses change concurrently. Real implementation should store sequence numbers.
            console.log('Reordered:', active.id, '->', over?.id);
        }
    };

    // INLINE ACTIONS (Preserved)
    const handleStatusUpdate = useCallback(async (taskId: string, newStatus: Task['status']) => {
        triggerHaptic();

        const updates: Partial<Task> = { status: newStatus };

        // Handle completed_at logic securely on client for immediate feedback
        if (newStatus === 'done') {
            updates.completed_at = new Date().toISOString(); // or new Date() depending on type, but string is safer for ISO
        } else {
            updates.completed_at = null; // Clear if re-opened
        }

        onTaskMutate?.(
            [taskId],
            updates,
            () => TaskService.updateTask(taskId, updates),
            { serializableOp: { type: 'updateTask', args: [taskId, updates] } }
        );
    }, [onTaskMutate]);

    const handlePriorityUpdate = useCallback(async (taskId: string, newPriority: string) => {
        onTaskMutate?.(
            [taskId],
            { priority: newPriority as any },
            () => TaskService.updateTask(taskId, { priority: newPriority as any }),
            { serializableOp: { type: 'updateTask', args: [taskId, { priority: newPriority as any }] } }
        );
    }, [onTaskMutate]);

    const handleAssigneeToggle = useCallback(async (taskId: string, member: { uid: string, name: string }) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const currentAssignees = task.assignedTo || [];
            const exists = Array.isArray(currentAssignees) && currentAssignees.some(a => a.uid === member.uid);
            let newAssignees;
            if (exists) {
                newAssignees = currentAssignees.filter(a => a.uid !== member.uid);
            } else {
                newAssignees = [...currentAssignees, member];
            }
            onTaskMutate?.(
                [taskId],
                { assignedTo: newAssignees },
                () => TaskService.updateTask(taskId, { assignedTo: newAssignees }),
                { serializableOp: { type: 'assignUsers', args: [taskId, { assignedTo: newAssignees }] } }
            );
        }
    }, [tasks, onTaskMutate]);

    // Phase 5B: Selection handler with shift+click range support
    const handleToggleSelection = useCallback((id: string, shiftHeld: boolean) => {
        const currentIndex = orderedIds.indexOf(id);
        if (currentIndex === -1) return;

        if (shiftHeld && lastClickedIndexRef.current !== null) {
            selectRange(lastClickedIndexRef.current, currentIndex);
        } else {
            toggle(id);
        }
        lastClickedIndexRef.current = currentIndex;
    }, [orderedIds, toggle, selectRange]);

    // Phase 36-B: Keyboard Navigation
    const { activeId } = useItemNavigation({
        items: processedTasks,
        getItemId: (t) => t.id,
        onSelect: (t) => onTaskClick?.(t),
        onComplete: (t) => handleStatusUpdate(t.id, 'done'),
        onSnooze: (t) => console.log('Snooze triggered for', t.id) // Future: Snooze logic
    });

    // Phase 14: List Virtualization setup
    const parentRef = useRef<HTMLDivElement>(null);

    // Track previously visible top item index to preserve scroll on density switch
    const prevVirtualItemsRef = useRef<any[]>([]);

    const virtualizer = useVirtualizer({
        count: orderedTasks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: useCallback(() => density === 'compact' ? 56 : 72, [density]),
        overscan: 5,
    });

    // Save the top visible item index on scroll
    useEffect(() => {
        const virtualItems = virtualizer.getVirtualItems();
        if (virtualItems.length > 0) {
            prevVirtualItemsRef.current = virtualItems;
        }
    }, [virtualizer.getVirtualItems()]); // Subscribes to scroll events essentially via getVirtualItems

    // Preserve scroll index when density changes
    useEffect(() => {
        if (prevVirtualItemsRef.current.length > 0) {
            const firstVisibleIndex = prevVirtualItemsRef.current[0].index;
            // Allow layout to settle before scrolling
            requestAnimationFrame(() => {
                virtualizer.scrollToIndex(firstVisibleIndex, { align: 'start' });
            });
        }
    }, [density, virtualizer]);


    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Top Bar: A4 Today Mode Toggle & Filters */}
            {mode !== 'trash' && (
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-[#ffffff1a] pb-6 relative">
                    {/* A4: Primary Time Scope Toggle */}
                    <div className="flex bg-white/[0.01] p-1 rounded-lg border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setView('today')}
                            className={cn(
                                "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2",
                                view === 'today' ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20 z-10" : "text-white/60 hover:text-white/80"
                            )}
                        >
                            Today <span className="text-[9px] opacity-80">Focus</span>
                        </button>
                        <button
                            onClick={() => setView('all')}
                            className={cn(
                                "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                view === 'all' ? "bg-white/5 text-white shadow-sm border border-white/10 z-10" : "text-white/60 hover:text-white/80"
                            )}
                        >
                            All Tasks
                        </button>
                        <div className="w-px h-4 bg-white/5 mx-1 self-center" />
                        <button
                            onClick={() => setView('mine')}
                            className={cn(
                                "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                view === 'mine' ? "text-white bg-white/5 z-10" : "text-white/60 hover:text-white/80"
                            )}
                        >
                            Mine
                        </button>
                    </div>

                    {/* Filters & KPI */}
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#0F1218] border border-white/5 rounded-full mr-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">System Healthy</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 bg-white/5 rounded-xl border border-white/10 px-2 py-1.5">
                            <button
                                onClick={toggleDensity}
                                className={cn(
                                    "h-8 w-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 text-white/85",
                                    density === 'compact' && "bg-blue-500/10 text-blue-400"
                                )}
                                title={density === 'compact' ? "Switch to Comfortable View" : "Switch to Compact View"}
                            >
                                {density === 'compact' ? <List size={16} /> : <Rows size={16} />}
                            </button>

                            <div className="w-px h-4 bg-white/10 mx-1" />

                            <Filter className="w-4 h-4 text-white/85" />
                            <Select value={filterStatus} onValueChange={handleStatusChange}>
                                <SelectTrigger aria-label="Filter status" className={cn(
                                    "w-[130px] border-none bg-transparent hover:bg-white/5 h-8 text-xs transition-colors rounded-lg",
                                    filterStatus !== 'all' ? "text-white/85 font-medium" : "text-white/60"
                                )}>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="backdrop-blur-md border-white/10 shadow-lg shadow-black/30 bg-slate-900/95">
                                    <SelectItem value="all">Any Status</SelectItem>
                                    <SelectItem value="todo">Pending</SelectItem>
                                    <SelectItem value="in_progress">Working</SelectItem>
                                    <SelectItem value="review">On Hold</SelectItem>
                                    <SelectItem value="done">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPriority} onValueChange={handlePriorityChange}>
                                <SelectTrigger aria-label="Filter priority" className={cn(
                                    "w-[130px] border-none bg-transparent hover:bg-white/5 h-8 text-xs transition-colors rounded-lg",
                                    filterPriority !== 'all' ? "text-white/85 font-medium" : "text-white/60"
                                )}>
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent className="backdrop-blur-md border-white/10 shadow-lg shadow-black/30 bg-slate-900/95">
                                    <SelectItem value="all">Any Priority</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Admin Priority Radar */}
                    {canManage && (
                        <div className="flex flex-wrap gap-2 mb-2 px-1">
                            {(() => {
                                const overdueCount = tasks.filter(t => t.status !== 'done' && t.due_date && isPast(safeDate(t.due_date)!) && !isToday(safeDate(t.due_date)!)).length;
                                const reviewCount = tasks.filter(t => t.status === 'review').length;
                                const progressCount = tasks.filter(t => t.status === 'in_progress').length;
                                const completedTodayCount = tasks.filter(t => t.status === 'done' && t.completed_at && isToday(safeDate(t.completed_at)!)).length;

                                return (
                                    <>
                                        {overdueCount > 0 && (
                                            <button onClick={() => updateUrl({ filter: 'overdue' })} className="group flex items-center gap-1.5 px-3 py-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-full transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" />
                                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide group-hover:text-red-300">Overdue {overdueCount}</span>
                                            </button>
                                        )}
                                        {reviewCount > 0 && (
                                            <button onClick={() => handleStatusChange('review')} className="group flex items-center gap-1.5 px-3 py-1 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-full transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide group-hover:text-amber-400">On Hold {reviewCount}</span>
                                            </button>
                                        )}
                                        {progressCount > 0 && (
                                            <button onClick={() => handleStatusChange('in_progress')} className="group flex items-center gap-1.5 px-3 py-1 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-full transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide group-hover:text-blue-300">In Progress {progressCount}</span>
                                            </button>
                                        )}
                                        {completedTodayCount > 0 && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                                                <CheckCircle2 size={10} className="text-emerald-500" />
                                                <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wide">Completed Today {completedTodayCount}</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Main Task List Console */}
            <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-soft bg-surface shadow-sm overflow-hidden">
                {/* Unified Header Row */}
                <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[40px_3fr_1.5fr_0.8fr_1.5fr_1.2fr_1.2fr_1.2fr] gap-2 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-slate-300 tracking-widest uppercase shrink-0">
                    <div
                        role="checkbox"
                        aria-checked={isAllSelected ? true : isIndeterminate ? 'mixed' : false}
                        aria-label="Select all tasks"
                        tabIndex={0}
                        onClick={() => isAllSelected ? clear() : selectAll()}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); isAllSelected ? clear() : selectAll(); } }}
                        className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all border-white/20 hover:border-white/40"
                        style={{ background: isAllSelected ? '#3b82f6' : isIndeterminate ? 'rgba(59,130,246,0.3)' : undefined, borderColor: (isAllSelected || isIndeterminate) ? '#3b82f6' : undefined }}
                    >
                        {isAllSelected && <CheckCircle2 size={10} className="text-white" />}
                        {isIndeterminate && <Minus size={10} className="text-blue-400" />}
                    </div>
                    <div className="flex items-center gap-2">Institutional Task <DataIntegritySignal meta={(tasks as any).__meta} variant="muted" /></div>
                    <div className="hidden md:block">Requested By</div>
                    <div className="hidden md:block">Priority</div>
                    <div className="hidden md:block">Assignee</div>
                    <div className="hidden md:block text-right">Due Date</div>
                    <div className="hidden md:block text-right">Completed</div>
                    <div className="hidden md:block">Status</div>
                </div>

                {loading ? (
                    <TaskListSkeleton count={6} />
                ) : processedTasks.length === 0 ? (
                    showEmptyState ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title={COPY.emptyStates.generic}
                            description={view === 'today' ? COPY.emptyStates.tasks.today : COPY.emptyStates.tasks.all}
                            action={view === 'today' ? (
                                <button
                                    onClick={() => setView('all')}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                                >
                                    View All Tasks
                                </button>
                            ) : undefined}
                            className="bg-white/[0.01]"
                        />
                    ) : (
                        <TaskListSkeleton count={1} />
                    )
                ) : (
                    <div ref={parentRef} className="flex-1 min-h-0 overflow-auto divide-y divide-soft">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={orderedIds}
                                strategy={verticalListSortingStrategy}
                            >
                                <div
                                    style={{
                                        height: `${virtualizer.getTotalSize()}px`,
                                        width: '100%',
                                        position: 'relative',
                                    }}
                                >
                                    {virtualizer.getVirtualItems().map((virtualItem) => {
                                        const task = orderedTasks[virtualItem.index];
                                        return (
                                            <div
                                                key={task.id}
                                                ref={virtualizer.measureElement}
                                                data-index={virtualItem.index}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    transform: `translateY(${virtualItem.start}px)`,
                                                }}
                                            >
                                                <SortableTaskRow
                                                    task={task}
                                                    activeId={activeId}
                                                    isSelected={isSelected(task.id)}
                                                    expandedTasks={expandedTasks}
                                                    density={density}
                                                    currentUser={user}
                                                    canManage={canManage}
                                                    toggleExpand={(id) => {
                                                        toggleExpand(id);
                                                        setTimeout(() => virtualizer.measure(), 0);
                                                    }}
                                                    onTaskClick={(t) => onTaskClick?.(t)}
                                                    onToggleSelection={handleToggleSelection}
                                                    onStatusChange={mode !== 'trash' ? (newStatus) => handleStatusUpdate(task.id, newStatus) : undefined}
                                                    mode={mode}
                                                    onRestore={(id) => handleRestore([id])}
                                                    onPermanentDelete={(id) => {
                                                        console.log('[TRASH_DEBUG] UI: Single-row permanent delete clicked for ID:', id);
                                                        setTaskToDelete(id);
                                                        setPermTargets([]);
                                                        setPermDialog(true);
                                                    }}
                                                    onSoftDelete={handleSoftDelete}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar - Outside Card Container */}
            {/* Unified Bulk Action Bar */}
            <BulkActionBar
                mode={mode}
                selectedCount={selectedIds.size}
                selectedIds={selectedIds}
                tasks={orderedTasks}
                user={user}
                onClear={clear}
                onRestore={handleRestore}
                onPermanentDelete={(ids) => {
                    console.log('[TRASH_DEBUG] Bulk: Permanent delete clicked for IDs:', ids);
                    setPermTargets(ids);
                    setTaskToDelete(null); // Clear single target since this is bulk
                    setPermDialog(true);
                }}
                isLoading={opLoading}
                onOperationComplete={() => {
                    clear();
                    lastClickedIndexRef.current = null;
                }}
                onTaskMutate={onTaskMutate}
            />

            {/* Permanent Delete Dialog */}
            {mode === 'trash' && (
                <PermanentDeleteDialog
                    open={permDialog}
                    count={taskToDelete ? 1 : permTargets.length}
                    isLoading={opLoading}
                    onConfirm={() => {
                        console.log('[TRASH_DEBUG] PermanentDeleteDialog onConfirm clicked.');
                        handlePermanentDelete();
                    }}
                    onCancel={() => {
                        console.log('[TRASH_DEBUG] PermanentDeleteDialog onCancel clicked.');
                        setPermDialog(false);
                        setPermTargets([]);
                        setTaskToDelete(null);
                    }}
                />
            )}
        </div>
    );
};

export const TaskListView = React.memo(TaskListViewComponent);
