import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useItemNavigation } from '@/hooks/useItemNavigation';
import { TaskListSkeleton } from './TaskListSkeleton';
import { Task } from '@/types/task';
import { format, isToday, isPast } from 'date-fns';
import { TaskService } from '@/services/tasks';
import { useAuth } from '@/contexts/AuthContextProvider';
import { UserService } from '@/services/userService';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { EditTaskDialog } from './EditTaskDialog';
import { SafeAvatar } from "@/components/ui/SafeAvatar";
import {
    MoreVertical, Calendar, User as UserIcon, CheckCircle2, Clock,
    AlertCircle, Circle, Filter, Edit3, Layers, UserPlus,
    ChevronRight, ChevronDown, Globe, Rows, List
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
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskRow } from './SortableTaskRow';
import { useDensityStore } from '@/stores/useDensityStore';
import { COPY } from '@/lib/copy';
import { DataIntegritySignal } from '@/components/ui/DataIntegritySignal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ResolvedStructureName } from "@/components/admin/structure/ResolvedStructureName";
import { triggerHaptic } from "@/lib/haptics";
import {
    canEditTask,
    canChangeStatus,
    canEditPriority,
    canAssignTask,
    canManageAllTasks
} from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskListViewProps {
    tasks: Task[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onTaskClick?: (task: Task) => void;
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
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

const TaskListViewComponent: React.FC<TaskListViewProps> = ({ tasks, loading = false, error = null, onRetry, onTaskClick, onTaskUpdate }) => {
    const { user } = useAuth();
    const canManage = canManageAllTasks(user);
    const { density, toggleDensity } = useDensityStore();

    // Filters & Views
    // A4: Default to 'today' for calm focused view
    const [view, setView] = useState<'today' | 'all' | 'mine' | 'overdue'>('today');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    // Local State
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);

    // A2: Progressive Disclosure
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // Delayed Empty State (Phase 33-A)
    const [showEmptyState, setShowEmptyState] = useState(false);

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

    React.useEffect(() => {
        if (selectedTaskIds.length > 0) {
            document.body.classList.add('hide-fab');
        } else {
            document.body.classList.remove('hide-fab');
        }
        return () => document.body.classList.remove('hide-fab');
    }, [selectedTaskIds.length]);

    // --- LOGIC ---
    const processedTasks = useMemo(() => {
        let result = [...tasks];
        const now = new Date();

        // 1. View Filter
        if (view === 'today') {
            result = result.filter(t => {
                const due = safeDate(t.dueDate);
                if (!due) return false;
                // Include Overdue + Today
                return (isToday(due) || (isPast(due) && t.status !== 'done'));
            });
        }
        else if (view === 'mine' && user) {
            result = result.filter(t => {
                const isAssigned = t.assignedTo && Array.isArray(t.assignedTo) && t.assignedTo.some(a => (typeof a === 'string' ? a : a.uid) === user.uid);
                const isCreatedBy = (typeof t.createdBy === 'string' ? t.createdBy : t.createdBy?.uid) === user.uid;
                return isAssigned || isCreatedBy;
            });
        }
        else if (view === 'overdue') {
            result = result.filter(t => {
                const due = safeDate(t.dueDate);
                return due && due < now && t.status !== 'done';
            });
        }

        // 2. Attribute Filters
        if (filterStatus !== 'all') result = result.filter(t => t.status === filterStatus);
        if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority);

        // 3. Sorting (Preserved logic)
        result.sort((a, b) => {
            const isDoneA = a.status === 'done';
            const isDoneB = b.status === 'done';
            if (isDoneA && !isDoneB) return 1;
            if (!isDoneA && isDoneB) return -1;
            if (isDoneA && isDoneB) {
                const cA = safeDate(a.completedAt) || safeDate(a.updatedAt) || safeDate(a.createdAt);
                const cB = safeDate(b.completedAt) || safeDate(b.updatedAt) || safeDate(b.createdAt);
                if (!cA) return 1; if (!cB) return -1;
                return cB.getTime() - cA.getTime();
            }
            const dateA = safeDate(a.dueDate);
            const dateB = safeDate(b.dueDate);
            if ((!dateA && !dateB) || (dateA && dateB && dateA.getTime() === dateB.getTime())) {
                const getPrioWeight = (p: string | undefined) => {
                    switch (p) { case 'urgent': return 0; case 'high': return 1; case 'medium': return 2; case 'low': return 3; default: return 4; }
                };
                return getPrioWeight(a.priority) - getPrioWeight(b.priority);
            }
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
        });

        return result;
    }, [tasks, view, filterStatus, filterPriority, user]);

    // Phase 37: Drag & Drop State
    const [orderedTasks, setOrderedTasks] = useState(processedTasks);

    useEffect(() => {
        setOrderedTasks(processedTasks);
    }, [processedTasks]);

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
            setOrderedTasks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            // Future: Call API to persist order
            console.log('Reordered:', active.id, '->', over?.id);
        }
    };

    // INLINE ACTIONS (Preserved)
    const handleStatusUpdate = useCallback(async (taskId: string, newStatus: Task['status']) => {
        triggerHaptic();
        onTaskUpdate?.(taskId, { status: newStatus });
        await TaskService.updateTask(taskId, { status: newStatus });
    }, [onTaskUpdate]);

    const handlePriorityUpdate = useCallback(async (taskId: string, newPriority: string) => {
        onTaskUpdate?.(taskId, { priority: newPriority as any });
        await TaskService.updateTask(taskId, { priority: newPriority as any });
    }, [onTaskUpdate]);

    const handleAssigneeToggle = useCallback(async (taskId: string, member: { uid: string, name: string }) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const currentAssignees = task.assignedTo || [];
            const exists = Array.isArray(currentAssignees) && currentAssignees.some(a => (typeof a === 'string' ? a : a.uid) === member.uid);
            let newAssignees;
            if (exists) {
                newAssignees = currentAssignees.filter(a => (typeof a === 'string' ? a : a.uid) !== member.uid);
            } else {
                newAssignees = [...currentAssignees, member];
            }
            onTaskUpdate?.(taskId, { assignedTo: newAssignees });
        }
        await TaskService.toggleTaskAssignee(taskId, member);
    }, [tasks, onTaskUpdate]);

    const toggleSelection = useCallback((taskId: string) => {
        if (!canManage) return;
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    }, [canManage]);

    // Phase 36-B: Keyboard Navigation
    const { activeId } = useItemNavigation({
        items: processedTasks,
        getItemId: (t) => t.id,
        onSelect: (t) => onTaskClick?.(t),
        onComplete: (t) => handleStatusUpdate(t.id, 'done'),
        onSnooze: (t) => console.log('Snooze triggered for', t.id) // Future: Snooze logic
    });

    return (
        <div className="space-y-6">
            {/* Top Bar: A4 Today Mode Toggle & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-[#ffffff1a] pb-6">

                {/* A4: Primary Time Scope Toggle */}
                <div className="flex bg-surface/20 p-1 rounded-lg border border-soft">
                    <button
                        onClick={() => setView('today')}
                        className={cn(
                            "px-6 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all flex items-center gap-2",
                            view === 'today' ? "bg-blue-500/10 text-blue-400 shadow-sm border border-blue-500/20" : "text-muted hover:text-foreground"
                        )}
                    >
                        Today <span className="text-[10px] opacity-60">Focus</span>
                    </button>
                    <button
                        onClick={() => setView('all')}
                        className={cn(
                            "px-6 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all",
                            view === 'all' ? "bg-card text-foreground shadow-sm border border-subtle" : "text-muted hover:text-foreground"
                        )}
                    >
                        All Tasks
                    </button>
                    {/* Secondary Context */}
                    <div className="w-px h-4 bg-white/5 mx-1 self-center" />
                    <button
                        onClick={() => setView('mine')}
                        className={cn(
                            "px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all",
                            view === 'mine' ? "text-foreground bg-white/5" : "text-muted hover:text-foreground"
                        )}
                    >
                        Mine
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    {/* Density Toggle */}
                    <button
                        onClick={toggleDensity}
                        className={cn(
                            "h-9 w-9 flex items-center justify-center rounded-md border border-subtle transition-all hover:bg-white/5 text-muted hover:text-white",
                            density === 'compact' && "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}
                        title={density === 'compact' ? "Switch to Comfortable View" : "Switch to Compact View"}
                    >
                        {density === 'compact' ? <List size={16} /> : <Rows size={16} />}
                    </button>

                    <div className="w-px h-4 bg-white/5 mx-1" />

                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger aria-label="Filter status" className="w-[130px] border-none bg-surface/20 text-muted h-9 text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent><SelectItem value="all">Any Status</SelectItem><SelectItem value="todo">Pending</SelectItem><SelectItem value="in_progress">Working</SelectItem><SelectItem value="review">On Hold</SelectItem><SelectItem value="done">Completed</SelectItem></SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger aria-label="Filter priority" className="w-[130px] border-none bg-surface/20 text-muted h-9 text-xs">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent><SelectItem value="all">Any Priority</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>

            {/* Task Table-List */}
            <div className="rounded-2xl border border-soft bg-surface shadow-sm overflow-hidden min-h-[400px]">
                {/* Header Row */}
                <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[40px_3fr_2fr_1.4fr_1.2fr_0.9fr_1fr] gap-2 px-6 py-3 bg-muted/5 border-b border-soft text-[11px] font-bold text-foreground/70 tracking-wide uppercase">
                    <div className="w-6"></div> {/* Expander Column */}
                    <div className="flex items-center gap-2">Task <DataIntegritySignal meta={(tasks as any).__meta} variant="muted" /></div>
                    <div className="hidden md:block text-muted">Requested By</div>
                    <div className="hidden md:block">Assignee</div>
                    <div className="hidden md:block">Status</div>
                    <div className="hidden md:block">Priority</div>
                    <div className="hidden md:block text-right">Due</div>
                </div>

                {loading ? (
                    <TaskListSkeleton count={6} />
                ) : processedTasks.length === 0 ? (
                    showEmptyState ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center bg-glass backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4 shadow-sm">
                                <CheckCircle2 className="w-8 h-8 text-muted/50" />
                            </div>
                            <h3 className="text-foreground/70 font-bold">{COPY.emptyStates.generic}</h3>
                            <p className="text-muted text-sm mt-1">{view === 'today' ? COPY.emptyStates.tasks.today : COPY.emptyStates.tasks.all}</p>
                            {view === 'today' && <button onClick={() => setView('all')} className="mt-4 text-xs text-blue-400 hover:text-blue-300">View All Tasks</button>}
                        </div>
                    ) : (
                        /* Initial mount or fast filter switch where we don't want to show empty state immediately */
                        <TaskListSkeleton count={1} />
                    )
                ) : (
                    <div className="divide-y divide-soft">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={orderedTasks.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {orderedTasks.map(task => (
                                    <SortableTaskRow
                                        key={task.id}
                                        task={task}
                                        activeId={activeId}
                                        selectedTaskIds={selectedTaskIds}
                                        expandedTasks={expandedTasks}
                                        density={density}
                                        currentUser={user}
                                        canManage={canManage}
                                        toggleExpand={toggleExpand}
                                        onTaskClick={(t) => onTaskClick?.(t)}
                                        toggleSelection={toggleSelection}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* Bulk Ops */}
                {canManage && selectedTaskIds.length > 0 && (
                    <BulkOperationsToolbar
                        selectedTaskIds={selectedTaskIds}
                        tasks={processedTasks}
                        onOperationComplete={() => setSelectedTaskIds([])}
                        onClearSelection={() => setSelectedTaskIds([])}
                    />
                )}

                {/* Helper Props Pass-through */}
                {taskToEdit && (
                    <EditTaskDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        task={taskToEdit}
                        onUpdate={async (updates) => { await TaskService.updateTask(taskToEdit.id, updates); return true; }}
                    />
                )}
            </div>
        </div>
    );
};

export const TaskListView = React.memo(TaskListViewComponent);
