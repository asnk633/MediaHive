"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types/task';
import { Clock, Calendar, CheckCircle2, User as UserIcon, AlertCircle, X, Edit2, UploadCloud, FileCheck, Circle, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContextProvider';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { useRouter } from 'next/navigation';
import { AttachmentSection } from '@/components/tasks/AttachmentSection';
import { DeliverablesList } from '@/components/deliverables/DeliverablesList';
import { DeliverableUploadModal } from '@/components/deliverables/DeliverableUploadModal';
import { TaskService } from '@/services/tasks';
import { toast } from 'sonner';
import { useDevWiring } from '@/hooks/useDevWiring';
import { TaskRatingComponent } from '@/components/tasks/TaskRatingComponent';
import { UserService } from '@/services/userService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResolvedStructureName } from "@/components/admin/structure/ResolvedStructureName";
import { useModalHistory } from "@/hooks/useModalHistory";
import { TaskComments } from '@/components/tasks/TaskComments';
import { TaskSubtasks } from '@/components/tasks/TaskSubtasks';

interface TaskDetailsModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
}

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

export const TaskDetailModalV2: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose, onEdit }) => {
    const { user } = useAuth();
    const router = useRouter();
    const canDelete = user?.role === 'admin';
    const [showDeliverableUpload, setShowDeliverableUpload] = useState(false);
    const [deliverableRefreshTrigger, setDeliverableRefreshTrigger] = useState(0);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string; avatarUrl?: string }[]>([]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!task || isDeleting) return;

        setIsDeleting(true);
        setError(null);
        try {
            await TaskService.deleteTask(task.id);
            onClose(); // Only close after success
        } catch (e) {
            console.error(e);
            setError('Task couldn’t be deleted');
            setIsDeleting(false);
        }
    };

    const [fullTask, setFullTask] = useState<Task>(task || {} as Task);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Fetch team members & Fresh Task Data
    React.useEffect(() => {
        const fetchTeam = async () => {
            const members = await UserService.getTeamMembers();
            setTeamMembers(members.map(m => ({
                uid: m.uid,
                name: m.name || 'Unknown',
                avatarUrl: m.avatarUrl || m.photoURL
            })));
        };

        if (isOpen) {
            // Only fetch team members for Admin or Team roles
            if (user?.role === 'admin' || user?.role === 'team') {
                fetchTeam();
            }
            if (task?.id) {
                // PERCEPTUAL SIGNAL: Set loading state immediately
                setIsLoadingDetails(true);

                // Ensure we display latest task info immediately
                setFullTask(task);
                // Then hydrate with fresh data from server
                TaskService.getTask(task.id).then(fresh => {
                    if (fresh) setFullTask(fresh);
                }).finally(() => {
                    setIsLoadingDetails(false);
                });
            }
        }
    }, [isOpen, task]);

    const handleToggleAssign = async (member: { uid: string, name: string }) => {
        if (!task) return;
        setError(null);
        try {
            await TaskService.toggleTaskAssignee(task.id, { uid: member.uid, name: member.name });

            const isCurrentlyAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some((current: any) => {
                const currentUid = typeof current === 'string' ? current : current.uid;
                return currentUid === member.uid;
            });

            if (!isCurrentlyAssigned) {
                const { NotificationService } = await import('@/services/notificationService');
                await NotificationService.createNotification({
                    userId: member.uid,
                    sourceUserId: user!.uid,
                    type: 'task_assigned',
                    title: 'New Assignment',
                    message: `You have been assigned to "${task.title}"`,
                    entityType: 'task',
                    entityId: task.id,
                    actionUrl: `/tasks/view?id=${task.id}`,
                    priority: 'high'
                });
            }

            onEdit();
        } catch (err: any) {
            console.error(err);
            setError('Assignment didn’t go through');
        }
    };

    useDevWiring('TaskDetailModalV2', [
        { name: 'Delete Task', handler: handleDelete, visible: !!canDelete, destructive: true, permissionVerified: !!canDelete },
        { name: 'Edit Task', handler: onEdit, visible: true },
        { name: 'Deliverable Upload', handler: () => setShowDeliverableUpload(true), visible: (user?.role === 'admin' || user?.role === 'team') }
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
                        className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-soft flex flex-col max-h-[90vh] bg-gradient-to-br from-card to-background shadow-strong outline-none"
                        style={{}}
                        role="dialog"
                        aria-modal="true"
                        tabIndex={-1}
                    >
                        {/* HEADER BLOCK - Identity, Authoritative, 180px */}
                        <div
                            className="relative shrink-0 border-b-2 border-soft bg-muted/10"
                            style={{
                                height: '180px',
                            }}
                        >
                            {/* Action Buttons - Top Right, Minimal */}
                            <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                                {(user?.role === 'admin' || user?.role === 'team' || user?.uid === task?.createdBy?.uid) && (
                                    <button
                                        onClick={onEdit}
                                        disabled={isDeleting}
                                        className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors text-foreground backdrop-blur-sm shadow-sm disabled:opacity-50"
                                        title="Edit Task"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors text-foreground backdrop-blur-sm shadow-sm disabled:opacity-50"
                                >
                                    <X size={18} />
                                </button>
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
                                    {task.dueDate && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                                            <span className="w-1 h-1 rounded-full bg-border-strong" />
                                            <span>
                                                Due {(() => {
                                                    const date = (task.dueDate as any).seconds
                                                        ? new Date((task.dueDate as any).seconds * 1000)
                                                        : new Date(task.dueDate);
                                                    return !isNaN(date.getTime()) ? format(date, 'MMM d') : '';
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Title - Large, Bold, Centered */}
                                <h2 className="text-2xl font-bold text-foreground text-center leading-tight">
                                    {fullTask.title || 'Untitled Task'}
                                </h2>

                                {/* PERCEPTUAL SIGNAL: Loading indicator */}
                                {isLoadingDetails && (
                                    <p className="text-xs text-muted/60 text-center mt-2">
                                        Loading details...
                                    </p>
                                )}
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

                            {/* Description - Primary Reading */}
                            <div
                                className="text-base text-muted-foreground mb-8 max-w-prose"
                                style={{ lineHeight: '1.8' }}
                            >
                                {task.description || <span className="italic text-muted-foreground/60">No description provided.</span>}
                            </div>

                            {/* Info Card - Simple & Demoted */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface/20 rounded-xl border border-soft/50 mb-8">
                                <div className="space-y-6">
                                    {/* Due Date moved to Header for Emphasis */}
                                    {/* <div className="flex items-start gap-3">...</div> */}

                                    <div className="flex items-start gap-3">
                                        <User size={16} className="text-muted-foreground/60 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-1.5">Requested By</p>
                                            <p className="text-xs text-muted-foreground">
                                                <ResolvedStructureName
                                                    id={task.departmentId || task.institutionId}
                                                    type={task.departmentId ? 'department' : 'institution'}
                                                    fallback={(!task.departmentId && !task.institutionId) ? (task.department || task.createdBy?.name) : undefined}
                                                />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Assigned Team</p>
                                        {(user?.role === 'admin' || (user?.role === 'team' && typeof task.createdBy === 'object' && task.createdBy.uid === user.uid)) && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1 opacity-70 hover:opacity-100">
                                                        <UserIcon size={11} /> Assign
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-2 bg-popover border-soft text-foreground z-[110]" align="end" side="bottom">
                                                    <div className="text-xs font-bold text-muted-foreground px-2 py-1 mb-1 tracking-wider">SELECT MEMBER</div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {teamMembers.map((m) => {
                                                            const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(current => typeof current === 'string' ? current === m.uid : current.uid === m.uid);
                                                            return (
                                                                <div
                                                                    key={m.uid}
                                                                    onClick={() => handleToggleAssign(m)}
                                                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors ${isAssigned ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAssigned ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                                        {isAssigned && <span className="text-primary-foreground text-[10px]">✓</span>}
                                                                    </div>
                                                                    {m.name}
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
                                            task.assignedTo.map((assignee: any, i) => {
                                                const uid = typeof assignee === 'string' ? assignee : assignee.uid;
                                                let teamMember = teamMembers.find(m => m.uid === uid);
                                                if (!teamMember && assignee.name) {
                                                    teamMember = teamMembers.find(m => m.name === assignee.name);
                                                }
                                                const avatarUrl = assignee.avatarUrl || teamMember?.avatarUrl;
                                                const name = assignee.name || teamMember?.name || 'Unknown';

                                                return (
                                                    <div key={i} className="flex items-center gap-2 bg-surface/50 px-2.5 py-1.5 rounded-lg border border-soft/50">
                                                        <SafeAvatar
                                                            src={avatarUrl}
                                                            name={name}
                                                            alt={name}
                                                            size={16}
                                                            className="border border-soft"
                                                        />
                                                        <span className="text-[11px] text-muted-foreground">{name}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground/40 italic">No one assigned</p>
                                        )}
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
                                        TaskService.getTask(task.id).then(t => t && setFullTask(t));
                                    }}
                                />
                            </div>

                            {/* Subtasks Section */}
                            {((fullTask.subtasks?.length ?? 0) > 0 || user?.role === 'admin' || user?.role === 'team') && (
                                <div className="pt-6 mt-8 -mx-8 px-8 pb-8 border-t border-soft bg-muted/5">
                                    <TaskSubtasks
                                        taskId={task.id}
                                        subtasks={fullTask.subtasks || []}
                                        onUpdate={() => {
                                            TaskService.getTask(task.id).then(t => t && setFullTask(t));
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
                                        TaskService.getTask(task.id).then(t => t && setFullTask(t));
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}


        </AnimatePresence>,
        document.body
    );
};
