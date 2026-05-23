// @ts-nocheck
import React, { useMemo } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from "@/features/tasks/types/task";
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { TaskService } from '@/services/tasks';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { 
    CheckCircle2, Clock, 
    AlertCircle, Circle, 
    GripVertical, User 
} from 'lucide-react';
import { format } from 'date-fns';

interface TaskKanbanViewProps {
    tasks: Task[];
    loading?: boolean;
    onTaskClick?: (task: Task) => void;
    onTaskMutate?: (
        taskIds: string[],
        updates: Partial<Task>,
        apiCall: () => Promise<any>,
        options?: { errorMessage?: string; successMessage?: string; serializableOp?: any; }
    ) => Promise<void>;
}

// Columns definition
const COLUMNS = [
    { id: 'todo', label: 'To Do', color: 'slate', icon: Circle, status: 'todo' },
    { id: 'in_progress', label: 'Working', color: 'blue', icon: Clock, status: 'in_progress' },
    { id: 'review', label: 'On Hold', color: 'amber', icon: AlertCircle, status: 'review' },
    { id: 'done', label: 'Completed', color: 'emerald', icon: CheckCircle2, status: 'done' }
];

// Droppable Column Component
function KanbanColumn({ col, children }: { col: typeof COLUMNS[0]; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: col.id
    });

    const borderColors = {
        slate: 'border-slate-500/10 focus-within:border-slate-500/30',
        blue: 'border-blue-500/10 focus-within:border-blue-500/30',
        amber: 'border-amber-500/10 focus-within:border-amber-500/30',
        emerald: 'border-emerald-500/10 focus-within:border-emerald-500/30'
    };

    const count = React.Children.count(children);

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "flex flex-col h-full min-h-[500px] w-full bg-[#ffffff02] border rounded-2xl p-4 backdrop-blur-md transition-all duration-200",
                borderColors[col.color as keyof typeof borderColors],
                isOver && "bg-foreground/[0.025] scale-[1.01] border-primary/20 shadow-[0_0_20px_rgba(255,184,0,0.05)]"
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-foreground/[0.04]">
                <div className="flex items-center gap-2">
                    <col.icon size={14} className={cn(
                        col.color === 'slate' && 'text-slate-400',
                        col.color === 'blue' && 'text-blue-400',
                        col.color === 'amber' && 'text-amber-400',
                        col.color === 'emerald' && 'text-emerald-400'
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">{col.label}</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-foreground/[0.03] border border-foreground/[0.05] text-foreground/60">
                    {count}
                </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[700px] pr-1">
                {children}
                {count === 0 && (
                    <div className="flex-1 flex items-center justify-center py-12 border-2 border-dashed border-foreground/[0.03] rounded-xl text-center text-foreground/30 text-[10px] font-bold uppercase tracking-wider select-none">
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
}

// Draggable Card Component
function KanbanCard({ task, canDrag, onClick }: { task: Task; canDrag: boolean; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        disabled: !canDrag
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : undefined,
        zIndex: isDragging ? 9999 : undefined
    };

    const safeDate = (dateVal: any): Date | null => {
        if (!dateVal) return null;
        if (typeof dateVal === 'object' && 'seconds' in dateVal) return new Date(dateVal.seconds * 1000);
        if (typeof dateVal === 'string') return new Date(dateVal);
        return null;
    };

    const dueDateFormatted = useMemo(() => {
        const d = safeDate(task.dueDate || task.due_date);
        return d ? format(d, 'MMM d') : null;
    }, [task.dueDate, task.due_date]);

    const priorityColors = {
        high: 'bg-red-500/15 text-red-400 border-red-500/20',
        medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
        low: 'bg-slate-500/15 text-slate-400 border-slate-500/20'
    };

    const isOverdue = useMemo(() => {
        const d = safeDate(task.dueDate || task.due_date);
        return d ? d < new Date() && task.status !== 'done' : false;
    }, [task.dueDate, task.due_date, task.status]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => {
                // Prevent detail modal from launching when dragging starts
                if (transform) return;
                onClick();
            }}
            className={cn(
                "group relative bg-foreground/[0.01] hover:bg-foreground/[0.02] border border-foreground/[0.05] hover:border-foreground/[0.08] p-4 rounded-xl shadow-sm transition-all duration-200 select-none text-left flex flex-col justify-between gap-4 cursor-pointer active:scale-[0.98]",
                isDragging && "shadow-2xl border-primary/20 bg-background/80 cursor-grabbing"
            )}
        >
            {/* Top Row: Title */}
            <div className="flex items-start gap-2">
                {canDrag && (
                    <div 
                        {...attributes} 
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1.5 -mt-1 rounded hover:bg-foreground/5 text-foreground/30 hover:text-foreground/60 transition-colors duration-200"
                        title="Drag to reorder"
                    >
                        <GripVertical size={14} />
                    </div>
                )}
                <div className="flex-1 flex flex-col gap-1">
                    <h4 className={cn(
                        "text-xs font-bold leading-relaxed text-foreground/90 transition-colors duration-200 group-hover:text-foreground line-clamp-2",
                        task.status === 'done' && "line-through text-foreground/45"
                    )}>
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-[10px] text-foreground/40 line-clamp-2 leading-relaxed">
                            {task.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Row: Metadata */}
            <div className="flex items-center justify-between border-t border-foreground/[0.03] pt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Priority badge */}
                    <span className={cn(
                        "text-[8px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border",
                        priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.low
                    )}>
                        {task.priority || 'low'}
                    </span>

                    {/* Due Date */}
                    {dueDateFormatted && (
                        <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded border border-foreground/[0.05] bg-foreground/[0.02]",
                            isOverdue ? "text-red-400 border-red-500/25 bg-red-500/5 animate-pulse" : "text-foreground/50"
                        )}>
                            {dueDateFormatted}
                        </span>
                    )}
                </div>

                {/* Assignee / Requester */}
                <div className="flex items-center gap-1">
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                        <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignedTo.slice(0, 3).map((a, idx) => (
                                <div
                                    key={a.uid || idx}
                                    className="w-5 h-5 rounded-full border border-[#000] bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary uppercase select-none cursor-help"
                                    title={`Assignee: ${a.name}`}
                                >
                                    {a.name.slice(0, 2)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div 
                            className="w-5 h-5 rounded-full border border-foreground/5 bg-foreground/5 flex items-center justify-center text-foreground/30"
                            title="Unassigned"
                        >
                            <User size={10} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TaskKanbanViewComponent({ tasks, loading = false, onTaskClick, onTaskMutate }: TaskKanbanViewProps) {
    const { role: userRole } = usePermissions();

    // Drag capability check: Admins, Managers, and Team members can drag. Guests and ordinary members see a static board.
    const canDrag = useMemo(() => {
        return ['admin', 'manager', 'team'].includes(userRole?.toLowerCase());
    }, [userRole]);

    // Sensors setup (prevents accidental drag during taps)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    );

    // Group tasks into column status buckets
    const tasksByColumn = useMemo(() => {
        const buckets: Record<string, Task[]> = {
            todo: [],
            in_progress: [],
            review: [],
            done: []
        };

        tasks.forEach(t => {
            if (t.deleted) return;

            let colId = 'todo';
            if (t.status === 'in_progress') colId = 'in_progress';
            else if (t.status === 'review' || t.status === 'on_hold') colId = 'review';
            else if (t.status === 'done') colId = 'done';
            else if (t.status === 'pending' || t.status === 'todo') colId = 'todo';

            buckets[colId].push(t);
        });

        return buckets;
    }, [tasks]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = String(active.id);
        const targetColId = String(over.id);

        // Find the dragged task
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Map column ID to database status values
        let newStatus: Task['status'] = 'todo';
        if (targetColId === 'in_progress') newStatus = 'in_progress';
        else if (targetColId === 'review') newStatus = 'review';
        else if (targetColId === 'done') newStatus = 'done';

        // If status is identical, no change required
        if (task.status === newStatus) return;

        triggerHaptic();

        // Prepare updates mapping compatible with backend expectations
        const updates: Partial<Task> = { 
            status: newStatus,
            completed_at: newStatus === 'done' ? new Date().toISOString() : null,
            completedAt: newStatus === 'done' ? new Date().toISOString() : null
        };

        try {
            if (onTaskMutate) {
                await onTaskMutate(
                    [taskId],
                    updates,
                    () => TaskService.updateTask(taskId, updates),
                    {
                        successMessage: `Task status updated to ${newStatus === 'in_progress' ? 'Working' : newStatus === 'review' ? 'On Hold' : newStatus === 'done' ? 'Completed' : 'To Do'}`,
                        errorMessage: 'Failed to update task status'
                    }
                );
            }
        } catch (error) {
            console.error('[Kanban] Drag update failure:', error);
            toast.error('Failed to move task. Reverting position.');
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {Array(4).fill(0).map((_, idx) => (
                    <div key={idx} className="h-96 bg-foreground/[0.02] border border-foreground/[0.05] rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch w-full min-h-[600px]">
                {COLUMNS.map(col => (
                    <KanbanColumn key={col.id} col={col}>
                        {tasksByColumn[col.id].map(task => (
                            <KanbanCard
                                key={task.id}
                                task={task}
                                canDrag={canDrag}
                                onClick={() => onTaskClick?.(task)}
                            />
                        ))}
                    </KanbanColumn>
                ))}
            </div>
        </DndContext>
    );
}

export const TaskKanbanView = React.memo(TaskKanbanViewComponent);
