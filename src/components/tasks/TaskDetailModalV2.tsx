// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from "@/features/tasks/types/task";
import { TaskService as taskService } from '@/services/tasks';
import { Clock, Calendar, CheckCircle2, User as UserIcon, AlertCircle, X, Edit2, UploadCloud, FileCheck, Circle, User, Activity, Trash2, Users, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContextProvider';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { useRouter } from 'next/navigation';
import { AttachmentSection } from '@/components/tasks/AttachmentSection';
import { DeliverablesList } from '@/components/deliverables/DeliverablesList';
import { DeliverableUploadModal } from '@/components/deliverables/DeliverableUploadModal';
import { supabase } from '@/lib/supabaseClient';
import { withTenant } from '@/lib/tenantQuery';
import { toast } from 'sonner';
import { useDevWiring } from '@/hooks/useDevWiring';
import { TaskRatingComponent } from '@/components/tasks/TaskRatingComponent';
import { UserService } from '@/services/userService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResolvedStructureName } from "@/components/admin/structure/ResolvedStructureName";
import { useModalHistory } from "@/hooks/useModalHistory";
import { TaskComments } from '@/components/tasks/TaskComments';
import { TaskSubtasks } from '@/components/tasks/TaskSubtasks';
import {
    getAdminSeverity,
    getSeverityColor
} from '@/lib/adminSeverity';
import { cn } from "@/lib/utils";
import { AuditTimeline } from '@/components/tasks/audit/AuditTimeline';
import { TaskActivityFeed } from '@/components/tasks/TaskActivityFeed';
import { useEntityPresence } from '@/hooks/useEntityPresence';
import { PresencePile } from '@/components/collaboration/PresencePile';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { AuditLog } from '@/types/audit';
import { UndoManager, buildSnapshot } from '@/lib/undoManager';
import { ActivityHistory, buildActivityLabel } from '@/lib/activityHistory';

// Props definition removed from here (merged below)

const statusIcons = {
    pending: <Circle size={14} className="text-amber-500" />,
    todo: <Circle size={14} className="text-slate-400" />,
    'in_progress': <Clock size={14} className="text-blue-500" />,
    on_hold: <Circle size={14} className="text-orange-500" />,
    review: <AlertCircle size={14} className="text-purple-500" />,
    done: <CheckCircle2 size={14} className="text-emerald-500" />,
};

const priorityColors = {
    high: 'text-red-400 border-red-400/30 bg-red-400/15',
    urgent: 'text-red-600 border-red-600/30 bg-red-600/15',
    medium: 'text-orange-400 border-orange-400/30 bg-orange-400/15',
    low: 'text-blue-400 border-blue-400/30 bg-blue-400/15',
};

export interface TaskDetailsModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onTaskMutate?: (
        taskIds: string[],
        updates: Partial<Task>,
        apiCall: () => Promise<any>,
        options?: { errorMessage?: string; successMessage?: string; serializableOp?: any }
    ) => Promise<void>;
}

export const TaskDetailModalV2: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose, onEdit, onTaskMutate }) => {
    const { user } = useAuth();
    const router = useRouter();
    const canDelete = user?.role === 'admin';
    const [showDeliverableUpload, setShowDeliverableUpload] = useState(false);
    const [deliverableRefreshTrigger, setDeliverableRefreshTrigger] = useState(0);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string; avatar_url?: string }[]>([]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Real-time Presence
    const { activeUsers } = useEntityPresence('task', task?.id);

    const handleDelete = async () => {
        if (!task || isDeleting) return;

        // Capture snapshot before deleting (for undo)
        const snapshot = buildSnapshot([task], 'delete');

        setIsDeleting(true);
        setError(null);
        try {
            if (onTaskMutate) {
                await onTaskMutate(
                    [task.id],
                    { deleted: true } as any,
                    async () => {
                        await withTenant(
                            supabase.from('tasks').delete(),
                            user?.tenant_id
                        ).eq('id', task.id);
                        ActivityHistory.push(task.id, {
                            action: 'deleted',
                            label: buildActivityLabel('deleted'),
                            actorUid: user?.uid ?? '',
                            actorName: user?.name ?? 'Admin',
                            scope: 1,
                        });
                        const undoId = UndoManager.push({
                            operation: 'delete',
                            snapshot,
                            taskIds: [task.id],
                        });
                        toast.success('Task deleted', {
                            duration: 8000,
                            action: {
                                label: 'Undo',
                                onClick: async () => {
                                    const entry = UndoManager.consume(undoId);
                                    if (!entry) return;

                                    const { OfflineQueue } = await import('@/lib/offlineQueue');
                                    const allQueued = await OfflineQueue.getAll();
                                    const queuedMatch = allQueued.reverse().find(q =>
                                        q.mutationType === 'deleteTasks' &&
                                        q.taskIds.includes(task.id)
                                    );

                                    if (queuedMatch) {
                                        await OfflineQueue.remove(queuedMatch.id);
                                        toast.success('Offline delete cancelled.');
                                        window.dispatchEvent(new Event('offline-undo'));
                                        return;
                                    }

                                    try {
                                        const snap = entry.snapshot.get(task.id);
                                        if (snap) {
                                            await withTenant(
                                                supabase.from('tasks').update(snap),
                                                user?.tenant_id
                                            ).eq('id', task.id);
                                        }
                                        ActivityHistory.push(task.id, {
                                            action: 'restored',
                                            label: buildActivityLabel('restored'),
                                            actorUid: user?.uid ?? '',
                                            actorName: user?.name ?? 'Admin',
                                            scope: 1,
                                        });
                                        toast.success('Task restored');
                                    } catch {
                                        toast.error('Undo failed — please refresh.');
                                    }
                                },
                            },
                        });
                    },
                    {
                        serializableOp: { type: 'deleteTasks', args: [task.id] }
                    }
                );
            } else {
                await withTenant(
                    supabase.from('tasks').delete(),
                    user?.tenant_id
                ).eq('id', task.id);

                // Log activity
                ActivityHistory.push(task.id, { action: 'deleted', label: buildActivityLabel('deleted'), actorUid: user?.uid ?? '', actorName: user?.name ?? 'Admin', scope: 1 });

                // Enqueue undo
                const undoId = UndoManager.push({ operation: 'delete', snapshot, taskIds: [task.id] });

                toast.success('Task deleted', {
                    duration: 8000,
                    action: {
                        label: 'Undo',
                        onClick: async () => {
                            const entry = UndoManager.consume(undoId);
                            if (!entry) return;
                            try {
                                const snap = entry.snapshot.get(task.id);
                                if (snap) {
                                    await withTenant(
                                        supabase.from('tasks').update(snap),
                                        user?.tenant_id
                                    ).eq('id', task.id);
                                }
                                toast.success('Task restored');
                            } catch {
                                toast.error('Undo failed — please refresh.');
                            }
                        }
                    }
                });
            }

            onClose();

        } catch (e) {
            console.error(e);
            setError('Task couldn’t be deleted');
        } finally {
            setIsDeleting(false);
        }
    };

    const [fullTask, setFullTask] = useState<Task>(task || {} as Task);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Phase 8: Multi-user awareness
    const safeDateLocal = (date: any): Date | null => {
        if (!date) return null;
        if (typeof date === 'object' && 'seconds' in date) return new Date(date.seconds * 1000);
        if (typeof date === 'string') return new Date(date);
        return null;
    };
    const isRecentlyUpdatedByOther = fullTask.updatedBy &&
        fullTask.updatedBy.uid !== user?.uid &&
        fullTask.updatedAt &&
        (Date.now() - new Date(fullTask.updatedAt).getTime() < 60000); // 60s window

    const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [linkedEvent, setLinkedEvent] = useState<any>(null);

    useEffect(() => {
        const fetchLinkedEvent = async () => {
            if (!task?.event_id) return;
            const { data, error } = await supabase
                .from('events')
                .select('id, title')
                .eq('id', task.event_id)
                .single();
            if (data) setLinkedEvent(data);
        };
        if (isOpen && task?.event_id) {
            fetchLinkedEvent();
        } else {
            setLinkedEvent(null);
        }
    }, [isOpen, task?.event_id]);

    // Fetch team members & Fresh Task Data
    React.useEffect(() => {
        const fetchTeam = async () => {
            const members = await UserService.getTeamMembers();
            const filtered = members.filter(m => {
                const role = (m as any).role?.toLowerCase().trim();
                const name = m.name?.toLowerCase() || '';
                return ['manager', 'team', 'member'].includes(role) && 
                       !name.includes('admin') && 
                       role !== 'admin' && 
                       role !== 'superadmin';
            });
            setTeamMembers(filtered.map(m => ({
                uid: m.uid,
                name: m.name || 'Unknown',
                avatar_url: m.avatar_url || m.photoURL
            })));
        };

        if (isOpen) {
            // Only fetch team members for Admin or Team roles
            if (user?.role === 'admin' || (user?.role === 'manager' || user?.role === 'member')) {
                fetchTeam();
            }
            if (task?.id) {
                // PERCEPTUAL SIGNAL: Set loading state immediately
                setIsLoadingDetails(true);

                // Ensure we display latest task info immediately
                setFullTask(task);
                // Then hydrate with fresh data from server
                taskService.getTaskById(task.id).then((freshTask) => {
                    if (freshTask) setFullTask(freshTask);
                }).finally(() => {
                    setIsLoadingDetails(false);
                });

                // Phase-12: Fetch Audit History (Non-blocking)
                setIsLoadingHistory(true);
                CanonicalDataService.getTaskHistory(task.id)
                    .then(logs => setHistoryLogs(logs))
                    .catch(err => console.error('History fetch failed', err))
                    .finally(() => setIsLoadingHistory(false));
            }
        }
    }, [isOpen, task]);

    const handleToggleAssign = async (member: { uid: string, name: string }) => {
        if (!task) return;
        setError(null);
        try {
            const wasAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some((current: any) => {
                const currentUid = current.userId;
                return currentUid === member.uid;
            });

            // await Promise.resolve(); // Handled optimistic or via updates directly elsewhere. removed from Phase 3A toggle.

            // Log activity
            const action = wasAssigned ? 'unassigned' : 'assigned';
            ActivityHistory.push(task.id, {
                action,
                label: buildActivityLabel(action, member.name),
                actorUid: user?.uid ?? '',
                actorName: user?.name ?? 'Admin',
                scope: 1,
            });

            if (!wasAssigned) {
                const { pushNotification } = await import('@/services/alertService');
                await pushNotification({
                    user_id: member.uid,
                    created_by: user!.uid,
                    type: 'task_assigned',
                    title: 'New Assignment',
                    message: `You have been assigned to "${task.title}"`,
                    entity_type: 'task',
                    entity_id: task.id,
                    action_url: `/tasks/view?id=${task.id}`,
                    priority: 'high'
                });
            }

            onEdit?.();
        } catch (err: any) {
            console.error(err);
            setError('Assignment didn’t go through');
        }
    };

    useDevWiring('TaskDetailModalV2', [
        { name: 'Delete Task', handler: handleDelete, visible: !!canDelete, destructive: true, permissionVerified: !!canDelete },
        { name: 'Edit Task', handler: onEdit || (() => { }), visible: true },
        { name: 'Deliverable Upload', handler: () => setShowDeliverableUpload(true), visible: (user?.role === 'admin' || (user?.role === 'manager' || user?.role === 'member')) }
    ]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Close on Escape (Task 79)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus Management (Task 73)
    useEffect(() => {
        if (isOpen && mounted) {
            // Save current focus
            const previousFocus = document.activeElement as HTMLElement;

            // Find modal and focus it (or first interactive element)
            // We use a small timeout to ensure Portal is rendered
            setTimeout(() => {
                const modal = document.querySelector('[role="dialog"]');
                if (modal instanceof HTMLElement) {
                    modal.focus();
                }
            }, 50);

            return () => {
                // Restore focus on close
                if (previousFocus && previousFocus.focus) {
                    previousFocus.focus();
                }
            };
        }
    }, [isOpen, mounted]);

    // DISABLED: useModalHistory was causing unwanted navigation back to /home
    // useModalHistory(isOpen, onClose);

    if (!task) return null;
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div key="task-detail-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0B0E14]/98 backdrop-blur-sm"
                    />

                    {/* Modal - Minimal Aesthetic Layer */}
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh] bg-[#0B0E14] shadow-[0_20px_50px_rgba(0,0,0,0.5)] outline-none"
                        style={{}}
                        role="dialog"
                        aria-modal="true"
                        tabIndex={-1}
                    >
                        {/* 3px Status-colored Accent Strip */}
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-[3px] z-30",
                            getSeverityColor(getAdminSeverity(task.priority === 'urgent' ? 6 : task.priority === 'high' ? 4 : 2))
                        )} />
                        {/* HEADER BLOCK - Identity, Authoritative, 180px */}
                        <div
                            className="relative shrink-0 border-b-2 border-soft bg-muted/10"
                            style={{
                                height: '180px',
                            }}
                        >
                             {/* Action Buttons - Top Right, Minimal */}
                             <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
                                 <PresencePile users={activeUsers} />
                                 <div className="h-6 w-px bg-white/10 hidden sm:block" />
                                 <div className="flex items-center gap-2">
                                     {(user?.role === 'admin' || (user?.role === 'manager' || user?.role === 'member') || user?.uid === task?.createdBy?.uid) && (
                                         <>
                                             <button
                                                 onClick={async () => {
                                                     if (confirm("Are you sure you want to move this task to trash?")) {
                                                         await handleDelete();
                                                     }
                                                 }}
                                                 disabled={isDeleting}
                                                 className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 backdrop-blur-sm shadow-sm disabled:opacity-50"
                                                 title="Move to Trash"
                                             >
                                                 <Trash2 size={18} />
                                             </button>
                                             <button
                                                 onClick={onEdit}
                                                 disabled={isDeleting}
                                                 className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors text-foreground backdrop-blur-sm shadow-sm disabled:opacity-50"
                                                 title="Edit Task"
                                             >
                                                 <Edit2 size={18} />
                                             </button>
                                         </>
                                     )}
                                     <button
                                         onClick={onClose}
                                         disabled={isDeleting}
                                         className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors text-foreground backdrop-blur-sm shadow-sm disabled:opacity-50"
                                     >
                                         <X size={18} />
                                     </button>
                                 </div>
                             </div>

                            {/* Identity Content - Centered, Grouped */}
                            <div className="absolute inset-0 flex flex-col justify-center px-8">
                                {/* Badges - Small, Subordinate */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border ${priorityColors[task.priority!] || priorityColors.low}`}>
                                        {task.priority || 'low'}
                                    </span>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-soft text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {statusIcons[task.status]}
                                        <span className="text-foreground">{task.status.replace('_', ' ')}</span>
                                    </div>
                                    {/* Promoted Due Date - Answering 'Why it matters' */}
                                    {task.dueDate && task.status !== 'done' && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                            <span className="w-1 h-1 rounded-full bg-border-strong" />
                                            <span>
                                                Due {(() => {
                                                    const date = new Date(task.dueDate);
                                                    return !isNaN(date.getTime()) ? format(date, 'MMM d') : '';
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Completed Date (Structural Requirement) */}
                                    {task.status === 'done' && task.completedAt && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                                            <span>
                                                Completed on {(() => {
                                                    const date = new Date(task.completedAt);
                                                    return !isNaN(date.getTime()) ? format(date, 'd MMMM yyyy, h:mm a') : 'Completed — date unavailable';
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Title - Large, Bold, Centered */}
                                <h2 className="text-2xl font-bold text-white text-center leading-tight tracking-tight">
                                    {fullTask.title || 'Untitled Task'}
                                </h2>

                                {/* Temporal Context Micro-label */}
                                <div className="flex flex-col items-center justify-center gap-1 mt-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] italic">
                                            Synced moments ago
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-white/5" />
                                        <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.15em]">
                                            Institutional Record
                                        </span>
                                    </div>
                                    {isRecentlyUpdatedByOther && !(task as any)?.hasExternalChangePending && (
                                        <div className="flex items-center justify-center gap-1 text-[10px] text-white/40 italic mt-0.5">
                                            <Activity size={10} className="text-blue-400 animate-pulse" />
                                            <span>Updated by {fullTask.updated_by!.name.split(' ')[0]} · just now</span>
                                        </div>
                                    )}
                                    {(task as any)?.hasExternalChangePending && (
                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 animate-pulse" title="Someone else updated this task remotely while you are editing it.">
                                            Remote Update Pending
                                        </div>
                                    )}
                                    {(task as any)?.hasUnresolvedConflicts && (
                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5" title="This task has unresolved conflicts.">
                                            <AlertCircle size={10} />
                                            Needs Review
                                        </div>
                                    )}
                                    {(task as any)?.isPendingSync && (
                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] uppercase font-bold text-amber-500/70 border border-amber-500/20 rounded px-1.5 py-0.5" title="Offline Queue">
                                            Offline (Pending Sync)
                                        </div>
                                    )}
                                </div>
                                {isDeleting && (
                                    <div className="flex items-center justify-center gap-2 mt-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-400/30 border-t-red-400" />
                                        <span>Deleting...</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center justify-center gap-3 py-2 mt-2 animate-in fade-in slide-in-from-top-2 bg-red-400/10 rounded-lg border border-red-400/20 max-w-sm mx-auto">
                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{error}</span>
                                        <div className="w-1 h-1 bg-red-400/30 rounded-full" />
                                        <button
                                            onClick={() => setError(null)}
                                            className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BODY - Reading Surface, Calm, Scrollable */}
                        <div
                            className="flex-1 overflow-y-auto px-8 py-8 bg-background"
                        >
                            <TaskRatingComponent
                                task={task}
                                onRatingSubmitted={onClose}
                            />

                            {/* Section 1: Perspective */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Perspective & Description</span>
                                </div>
                                <div
                                    className="text-sm text-white/70 leading-relaxed max-w-prose bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl"
                                    style={{ lineHeight: '1.8' }}
                                >
                                    {task.description || <span className="italic text-white/20">No institutional description provided.</span>}
                                </div>
                            </div>

                            {/* Section 2: Request Info */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Request Context</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl group hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-1">
                                                    {(task.on_behalf_of || task.departmentId || task.institutionId) ? 'Requested On behalf of' : 'Requested By'}
                                                </p>
                                                <p className="text-sm font-semibold text-white/90 truncate">
                                                    {task.on_behalf_of?.name ? task.on_behalf_of.name : (
                                                        <ResolvedStructureName
                                                            id={task.departmentId || task.institutionId}
                                                            type={task.departmentId ? 'department' : 'institution'}
                                                            fallback={(!task.departmentId && !task.institutionId) ? (task.department || task.createdBy?.name) : undefined}
                                                        />
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {linkedEvent && (
                                        <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl group hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                                                    <Calendar size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-1">Timeline Context</p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold text-white/90 truncate">{linkedEvent.title}</p>
                                                        <button 
                                                            onClick={() => router.push(`/events?id=${linkedEvent.id}`)}
                                                            className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1 shrink-0"
                                                        >
                                                            Visit Event →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Task Assignment */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Task Assignment</span>
                                </div>
                                <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl group hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                                            <Users size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-white/30">Assigned Team Members</p>
                                                {(user?.role === 'admin') && (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                                                                Manage Team
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-56 p-2 bg-[#0d0e17] border border-white/10 text-white z-[110] shadow-2xl rounded-xl" align="end" side="bottom">
                                                            <div className="text-[9px] font-bold text-white/30 px-2 py-1 mb-1 tracking-widest uppercase">SELECT MEMBER</div>
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                {teamMembers.map((m) => {
                                                                    const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(current => (current as any).uid === m.uid);
                                                                    return (
                                                                        <div
                                                                            key={m.uid}
                                                                            onClick={() => handleToggleAssign(m)}
                                                                            className={cn(
                                                                                "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-all",
                                                                                isAssigned ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5 text-white/60'
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                                                isAssigned ? 'bg-blue-500 border-blue-500' : 'border-white/20'
                                                                            )}>
                                                                                {isAssigned && <CheckCircle2 size={10} className="text-white" />}
                                                                            </div>
                                                                            <span className="truncate text-xs font-medium">{m.name}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                                                    task.assignedTo.map((assignee: any, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-white/[0.05] px-3 py-1.5 rounded-xl border border-white/[0.05] hover:bg-white/[0.1] transition-all">
                                                            <SafeAvatar
                                                                src={assignee.avatarUrl}
                                                                name={assignee.name}
                                                                size={18}
                                                            />
                                                            <span className="text-xs text-white/80 font-medium">{assignee.name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-4 w-full bg-white/[0.01] border border-dashed border-white/10 rounded-xl">
                                                        <UserPlus size={20} className="text-white/10 mb-2" />
                                                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">No Team Assigned</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments Section - Consolidated */}
                            <div
                                className="pt-6 mt-8 -mx-8 px-8 pb-8 border-t border-soft bg-muted/5"
                            >
                                <AttachmentSection
                                    task={fullTask}
                                    onUpdate={() => {
                                        // Just trigger local refresh, not full page refresh
                                        withTenant(
                                            supabase.from('tasks').select('*'),
                                            user?.tenant_id
                                        ).eq('id', task.id).single().then(({ data }) => data && setFullTask(data as any));
                                    }}
                                />
                            </div>

                            {/* Subtasks Section */}
                            {((fullTask.subtasks?.length ?? 0) > 0 || user?.role === 'admin' || (user?.role === 'manager' || user?.role === 'member')) && (
                                <div className="pt-6 mt-8 -mx-8 px-8 pb-8 border-t border-soft bg-muted/5">
                                    <TaskSubtasks
                                        taskId={task.id}
                                        subtasks={fullTask.subtasks || []}
                                        onUpdate={() => {
                                            supabase.from('tasks').select('*').eq('id', task.id).single().then(({ data }) => data && setFullTask(data as any));
                                        }}
                                    />
                                </div>
                            )}

                            {/* Comments Section */}
                            <div className="pt-6 mt-8 -mx-8 px-8 pb-8 border-t border-soft bg-muted/5">
                                <TaskComments
                                    taskId={task.id}
                                    activity={fullTask.activity || []}
                                    onCommentAdded={() => {
                                        supabase.from('tasks').select('*').eq('id', task.id).single().then(({ data }) => data && setFullTask(data as any));
                                    }}
                                />
                            </div>

                            {/* Phase-12: Task History Section */}
                            <div className="pt-6 mt-8 -mx-8 px-8 pb-8 border-t border-soft bg-muted/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-muted-foreground" />
                                    Recent Activity
                                </h3>
                                <div className="pl-2 mb-6">
                                    {/* Phase 5C: client-side human-readable activity feed */}
                                    <TaskActivityFeed taskId={task.id} user={user} />
                                </div>
                                {/* Server-side audit log (admin/team) */}
                                {(user?.role === 'admin' || (user?.role === 'manager' || user?.role === 'member')) && (
                                    <div className="pl-2 mt-4 pt-4 border-t border-white/5">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">System Log</p>
                                        <AuditTimeline logs={historyLogs} isLoading={isLoadingHistory} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}


        </AnimatePresence>,
        document.body
    );
};
