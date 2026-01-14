import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import { TaskService } from '@/services/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/userService';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { EditTaskDialog } from './EditTaskDialog';
import { SafeAvatar } from "@/components/ui/SafeAvatar";
import { MoreVertical, Calendar, User as UserIcon, CheckCircle2, Clock, AlertCircle, Circle, Filter, Edit3, Layers } from 'lucide-react';
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
import { cn } from "@/lib/utils";
import { ResolvedStructureName } from "@/components/admin/structure/ResolvedStructureName";

interface TaskListViewProps {
    tasks: Task[];
    loading?: boolean;
    onTaskClick?: (task: Task) => void;
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const safeDate = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'object' && 'seconds' in date) return new Date(date.seconds * 1000);
    if (typeof date === 'string') return new Date(date);
    return null;
};

// Admin Intelligence Design Tokens
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    priority?: string;
    status?: string;
    onClick?: () => void;
}

const PriorityBadge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ priority, className, ...props }, ref) => {
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

const StatusPill = React.forwardRef<HTMLSpanElement, BadgeProps>(({ status, onClick, className, ...props }, ref) => {
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

const TaskListViewComponent: React.FC<TaskListViewProps> = ({ tasks, loading = false, onTaskClick, onTaskUpdate }) => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin' || (user as any)?.isSuperAdmin || user?.email === 'media@thaibagarden.com';

    // Filters & Views
    const [view, setView] = useState<'all' | 'mine' | 'overdue'>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    // Local State
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);

    React.useEffect(() => {
        const fetchTeam = async () => {
            const members = await UserService.getTeamMembers();
            setTeamMembers(members);
        };
        fetchTeam();
    }, []);

    // Signal to hide FAB when bulk actions are active
    React.useEffect(() => {
        if (selectedTaskIds.length > 0) {
            document.body.classList.add('hide-fab');
        } else {
            document.body.classList.remove('hide-fab');
        }
        return () => document.body.classList.remove('hide-fab');
    }, [selectedTaskIds.length]);

    // --- LOGIC ---
    /*
     * [CRITICAL SYSTEM PATH] - FEATURE FROZEN
     * Sorting and Filtering Logic is LOCKED.
     * Do not modify without approval.
     */
    const processedTasks = useMemo(() => {
        let result = [...tasks];

        if (view === 'mine' && user) {
            result = result.filter(t => {
                if (!t.assignedTo) return false;
                if (Array.isArray(t.assignedTo)) {
                    return t.assignedTo.some(a => (typeof a === 'string' ? a : a.uid) === user.uid);
                }
                return false;
            });
        }
        if (view === 'overdue') {
            const now = new Date();
            result = result.filter(t => {
                const due = safeDate(t.dueDate);
                return due && due < now && t.status !== 'done';
            });
        }

        if (filterStatus !== 'all') result = result.filter(t => t.status === filterStatus);
        if (filterPriority !== 'all') result = result.filter(t => t.priority === filterPriority);

        // Sorting: Overdue > Today > Soon
        result.sort((a, b) => {
            const dateA = safeDate(a.dueDate);
            const dateB = safeDate(b.dueDate);

            // Completed always last
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
        });

        return result;
    }, [tasks, view, filterStatus, filterPriority, user]);

    // INLINE ACTIONS
    const handleStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
        onTaskUpdate?.(taskId, { status: newStatus });
        await TaskService.updateTask(taskId, { status: newStatus });
    };

    const handlePriorityUpdate = async (taskId: string, newPriority: string) => {
        onTaskUpdate?.(taskId, { priority: newPriority as any });
        await TaskService.updateTask(taskId, { priority: newPriority as any });
    };

    const handleAssigneeToggle = async (taskId: string, member: { uid: string, name: string }) => {
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
    };

    const toggleSelection = (taskId: string) => {
        if (!isAdmin) return;
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    return (
        <div className="space-y-6">
            {/* Top Bar: Executive Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-[#ffffff1a] pb-6">

                {/* Views Pill */}
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                    {(['all', 'mine', 'overdue'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-6 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all",
                                view === v ? "bg-[#1e293b] text-white shadow-sm border border-[#ffffff1a]" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {v === 'mine' ? 'My Tasks' : v === 'overdue' ? 'Attention Needed' : 'All Tasks'}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-gray-500" />

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[140px] border-none bg-transparent hover:bg-white/[0.05] text-gray-400 hover:text-white h-auto py-1 px-2 rounded-lg shadow-none">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Status</SelectItem>
                            <SelectItem value="todo">Pending</SelectItem>
                            <SelectItem value="in_progress">Working</SelectItem>
                            <SelectItem value="review">On Hold</SelectItem>
                            <SelectItem value="done">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="w-px h-4 bg-white/10" />

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-[140px] border-none bg-transparent hover:bg-white/[0.05] text-gray-400 hover:text-white h-auto py-1 px-2 rounded-lg shadow-none">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Priority</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Pending Approvals Section (Admins Only) - Always visible regardless of filters */}
            {isAdmin && tasks.some(t => t.approvalStatus === 'pending') && (
                <div className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <h3 className="text-sm font-bold text-amber-200 uppercase tracking-widest">Pending Approvals</h3>
                        </div>
                        <span className="text-xs font-mono text-amber-500/60">{tasks.filter(t => t.approvalStatus === 'pending').length} Requests</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {tasks.filter(t => t.approvalStatus === 'pending').map(task => (
                            <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                                <div className="col-span-8 flex flex-col gap-1">
                                    <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                                        <span>Requested by <span className="text-white">{typeof task.createdBy === 'object' ? task.createdBy.name : 'Guest'}</span></span>
                                        <span>•</span>
                                        <span>{task.description ? 'Has Description' : 'No Details'}</span>
                                    </div>
                                </div>
                                <div className="col-span-4 flex justify-end gap-2">
                                    <button
                                        onClick={() => { setTaskToEdit(task); setEditDialogOpen(true); }}
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Review & Assign
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Task Table-List */}
            <div className="rounded-2xl border border-[#ffffff1a] bg-[#0f172a] shadow-2xl overflow-hidden min-h-[400px]">
                {/* Header Row */}
                {/* Header Row */}
                <div className="grid grid-cols-12 md:grid-cols-[3fr_2fr_1.4fr_1.2fr_0.9fr_0.7fr] gap-2 px-6 py-3 bg-black/20 border-b border-white/5 text-[10px] uppercase font-bold text-white/30 tracking-widest">
                    <div className="col-span-12 md:col-span-1">Task</div>
                    <div className="hidden md:block text-white/40">Requested By</div>
                    <div className="hidden md:block">Assignee</div>
                    <div className="hidden md:block">Status</div>
                    <div className="hidden md:block">Priority</div>
                    <div className="hidden md:block text-right">Due Date</div>
                </div>

                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full bg-white/5 rounded" />)}
                    </div>
                ) : processedTasks.filter(t => isAdmin ? t.approvalStatus !== 'pending' : true).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-white/40 font-medium">All clear.</h3>
                        <p className="text-white/20 text-sm mt-1">No tasks require attention.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {processedTasks.filter(t => isAdmin ? t.approvalStatus !== 'pending' : true).map(task => {
                            const dueDate = safeDate(task.dueDate);
                            const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';
                            const isSelected = selectedTaskIds.includes(task.id);

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick?.(task)}
                                    className={cn(
                                        "group grid grid-cols-12 md:grid-cols-[3fr_2fr_1.4fr_1.2fr_0.9fr_0.7fr] gap-2 px-6 py-4 items-center transition-all hover:bg-white/[0.02]",
                                        isSelected && "bg-blue-500/5",
                                        isOverdue && "bg-red-500/[0.02] shadow-[inset_2px_0_0_0_#ef4444]"
                                    )}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && onTaskClick?.(task)}
                                >
                                    {/* Task Column (Title ONLY) */}
                                    <div className="col-span-12 md:col-span-1 flex items-center gap-3 overflow-hidden">
                                        <div onClick={e => e.stopPropagation()} className="shrink-0 pt-1">
                                            {isAdmin ? (
                                                <div
                                                    onClick={() => toggleSelection(task.id)}
                                                    className={cn("w-4 h-4 rounded border cursor-pointer transition-colors flex items-center justify-center",
                                                        isSelected ? "bg-blue-500 border-blue-500" : "border-white/20 hover:border-white/40 bg-transparent"
                                                    )}
                                                >
                                                    {isSelected && <CheckCircle2 size={10} className="text-white" />}
                                                </div>
                                            ) : (
                                                <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5", isOverdue ? "bg-red-500" : "bg-white/10")} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex flex-col gap-1 w-full">
                                            <div className="flex items-center gap-2">
                                                <h3 className={cn("text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors", task.status === 'done' && "line-through opacity-50")}>{task.title}</h3>
                                            </div>

                                            {/* Mobile: Stacked Metadata */}
                                            <div className="md:hidden flex flex-col gap-1">
                                                <span className="text-xs text-white/50 truncate font-medium">
                                                    <ResolvedStructureName
                                                        id={task.departmentId || task.institutionId}
                                                        type={task.departmentId ? 'department' : 'institution'}
                                                        fallback={(!task.departmentId && !task.institutionId) ? task.department : undefined}
                                                    />
                                                </span>
                                                <div className="flex items-center justify-between text-[10px] text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <span>{task.status || 'todo'}</span>
                                                        {/* Mobile Priority Stacked under Status */}
                                                        <PriorityBadge priority={task.priority || 'low'} className="scale-90 origin-left" />
                                                    </div>
                                                    <span>{dueDate ? format(dueDate, 'MMM d') : '-'}</span>
                                                </div>
                                            </div>

                                            {isOverdue && (
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-1 md:hidden">
                                                    <AlertCircle size={10} /> Overdue
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop: Requested By */}
                                    <div className="hidden md:flex flex-col justify-center pr-4">
                                        <span className="text-sm text-white/70 font-medium line-clamp-2 leading-tight">
                                            <ResolvedStructureName
                                                id={task.departmentId || task.institutionId}
                                                type={task.departmentId ? 'department' : 'institution'}
                                                fallback={(!task.departmentId && !task.institutionId) ? task.department : undefined}
                                            />
                                        </span>
                                    </div>

                                    {/* Assignee */}
                                    <div className="hidden md:flex flex-col justify-center gap-1" onClick={e => isAdmin ? e.stopPropagation() : null}>
                                        {isAdmin ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="cursor-pointer hover:opacity-80 transition-opacity p-1 -ml-1 rounded hover:bg-white/5 min-h-[30px] flex flex-col justify-center">
                                                        {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                                            <div className="flex flex-col gap-1.5">
                                                                {task.assignedTo.map((assignee: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <SafeAvatar
                                                                            src={assignee.avatarUrl} // Assuming avatarUrl exists or will exist
                                                                            alt={typeof assignee === 'string' ? '?' : assignee.name || '?'}
                                                                            name={typeof assignee === 'object' ? assignee.name : undefined}
                                                                            size={20}
                                                                            className="text-[9px]"
                                                                        />
                                                                        <span className="text-xs text-gray-400 truncate max-w-[100px] leading-tight">
                                                                            {typeof assignee === 'object' ? assignee.name : 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-600 italic hover:text-white px-2 py-1">Unassigned</span>
                                                        )}
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="bg-[#1e293b] border-[#ffffff1a] text-white max-h-60 overflow-y-auto min-w-[200px]">
                                                    {teamMembers.length === 0 ? (
                                                        <div className="px-2 py-3 text-xs text-gray-500 text-center">
                                                            No team members found
                                                        </div>
                                                    ) : (
                                                        teamMembers.map(member => (
                                                            <DropdownMenuItem
                                                                key={member.uid}
                                                                onClick={() => handleAssigneeToggle(task.id, member)}
                                                                className="flex items-center gap-2 cursor-pointer hover:bg-white/5"
                                                            >
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded-full border flex items-center justify-center text-[8px]",
                                                                    Array.isArray(task.assignedTo) && task.assignedTo.some(a => (a as any).uid === member.uid)
                                                                        ? "bg-blue-500 border-blue-500 text-white"
                                                                        : "border-white/20 text-transparent"
                                                                )}>
                                                                    ✓
                                                                </div>
                                                                <span>{member.name}</span>
                                                            </DropdownMenuItem>
                                                        ))
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            /* Non-Admin View */
                                            Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                                <div className="flex flex-col gap-1.5">
                                                    {task.assignedTo.map((assignee: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <SafeAvatar
                                                                src={assignee.avatarUrl}
                                                                alt={typeof assignee === 'string' ? '?' : assignee.name || '?'}
                                                                name={typeof assignee === 'object' ? assignee.name : undefined}
                                                                size={20}
                                                                className="text-[9px]"
                                                            />
                                                            <span className="text-xs text-gray-400 truncate max-w-[100px] leading-tight">
                                                                {typeof assignee === 'object' ? assignee.name : 'Unknown'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">Unassigned</span>
                                            )
                                        )}
                                    </div>

                                    {/* Status */}
                                    {(() => {
                                        const isAssignee = Array.isArray(task.assignedTo) && task.assignedTo.some(a => (typeof a === 'string' ? a : a.uid) === user?.uid);
                                        const canEditStatus = isAdmin || isAssignee;

                                        return (
                                            <div className="hidden md:flex items-center" onClick={e => canEditStatus ? e.stopPropagation() : null}>
                                                {canEditStatus ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <div className="hover:opacity-80 transition-opacity">
                                                                <StatusPill status={task.status || 'todo'} />
                                                            </div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="bg-[#1e293b] border-[#ffffff1a] text-white">
                                                            {['todo', 'in_progress', 'review', 'done'].map(s => (
                                                                <DropdownMenuItem
                                                                    key={s}
                                                                    onClick={() => handleStatusUpdate(task.id, s as any)}
                                                                    className="capitalize cursor-pointer hover:bg-white/5"
                                                                >
                                                                    {s === 'in_progress' ? 'Working' : s === 'review' ? 'On Hold' : s === 'todo' ? 'Pending' : 'Completed'}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <StatusPill status={task.status || 'todo'} onClick={undefined} className="cursor-default hover:bg-transparent" />
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* NEW PRIORITY COLUMN */}
                                    <div className="hidden md:flex items-center" onClick={e => isAdmin ? e.stopPropagation() : null}>
                                        {isAdmin ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <PriorityBadge priority={task.priority || 'low'} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="bg-[#1e293b] border-[#ffffff1a] text-white">
                                                    {['urgent', 'high', 'medium', 'low'].map(p => (
                                                        <DropdownMenuItem
                                                            key={p}
                                                            onClick={() => handlePriorityUpdate(task.id, p)}
                                                            className="capitalize cursor-pointer hover:bg-white/5"
                                                        >
                                                            {p}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <PriorityBadge priority={task.priority || 'low'} className="cursor-default hover:bg-transparent" />
                                        )}
                                    </div>

                                    {/* Due Date */}
                                    <div className="hidden md:block text-right">
                                        <div className={cn("text-xs font-mono", isOverdue ? "text-red-400 font-bold" : "text-gray-400")}>
                                            {dueDate ? format(dueDate, 'MMM d') : '-'}
                                        </div>
                                        {dueDate && (
                                            <div className="text-[10px] text-gray-600">
                                                {format(dueDate, 'yyyy')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bulk Ops */}
            {isAdmin && selectedTaskIds.length > 0 && (
                <BulkOperationsToolbar
                    selectedTaskIds={selectedTaskIds}
                    tasks={processedTasks}
                    onOperationComplete={() => setSelectedTaskIds([])}
                    onClearSelection={() => setSelectedTaskIds([])}
                />
            )}

            {/* Edit Dialog */}
            {taskToEdit && (
                <EditTaskDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    task={taskToEdit}
                    onUpdate={async (updates) => {
                        await TaskService.updateTask(taskToEdit.id, updates);
                        return true;
                    }}
                />
            )}
        </div>
    );
};

export const TaskListView = React.memo(TaskListViewComponent);
