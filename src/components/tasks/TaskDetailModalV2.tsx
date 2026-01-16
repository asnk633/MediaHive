"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types/task';
import { Clock, Calendar, CheckCircle2, User as UserIcon, AlertCircle, X, Edit2, UploadCloud, FileCheck, Circle, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { DeliverablesList } from '@/components/deliverables/DeliverablesList';
import { DeliverableUploadModal } from '@/components/deliverables/DeliverableUploadModal';
import { TaskService } from '@/services/tasks';
import { toast } from 'sonner';
import { useDevWiring } from '@/hooks/useDevWiring';
import { TaskRatingComponent } from '@/components/tasks/TaskRatingComponent';
import { UserService } from '@/services/userService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResolvedStructureName } from "@/components/admin/structure/ResolvedStructureName";

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
    const [showDeliverableUpload, setShowDeliverableUpload] = useState(false);
    const [deliverableRefreshTrigger, setDeliverableRefreshTrigger] = useState(0);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string; avatarUrl?: string }[]>([]);

    const canDelete = user?.role === 'admin' || (user?.uid && task?.createdBy?.uid === user.uid);

    const handleDelete = async () => {
        if (!task) return;
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
        try {
            await TaskService.deleteTask(task.id);
            toast.success('Task deleted');
            onClose();
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete task');
        }
    };

    // Fetch team members
    React.useEffect(() => {
        const fetchTeam = async () => {
            const members = await UserService.getTeamMembers();
            setTeamMembers(members.map(m => ({
                uid: m.uid,
                name: m.name || 'Unknown',
                avatarUrl: m.avatarUrl || m.photoURL
            })));
        };
        if (isOpen) fetchTeam();
    }, [isOpen]);

    const handleToggleAssign = async (member: { uid: string, name: string }) => {
        if (!task) return;
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
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal - Minimal Aesthetic Layer */}
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-soft flex flex-col max-h-[90vh] bg-gradient-to-br from-card to-background shadow-strong"
                        style={{}}
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
                                        className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors text-foreground backdrop-blur-sm shadow-sm"
                                        title="Edit Task"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-surface/50 hover:bg-surface rounded-lg transition-colors text-foreground backdrop-blur-sm shadow-sm"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Identity Content - Centered, Grouped */}
                            <div className="absolute inset-0 flex flex-col justify-center px-8">
                                {/* Badges - Small, Subordinate */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase border ${priorityColors[task.priority!] || priorityColors.low}`}>
                                        {task.priority || 'low'}
                                    </span>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-soft text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {statusIcons[task.status]}
                                        <span className="text-foreground">{task.status.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                {/* Title - HERO, Dominant */}
                                <h1 className="text-4xl font-black text-foreground leading-tight max-w-[85%]">
                                    {task.title}
                                </h1>
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

                            {/* Info Card - Simple */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface/40 rounded-xl border border-soft mb-8">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={16} className="text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Due Date</p>
                                            <p className="text-sm text-foreground">
                                                {(() => {
                                                    if (!task.dueDate) return 'No due date';
                                                    const date = task.dueDate.seconds
                                                        ? new Date(task.dueDate.seconds * 1000)
                                                        : new Date(task.dueDate);
                                                    return !isNaN(date.getTime()) ? format(date, 'EEEE, dd/MM/yyyy') : 'Invalid Date';
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <User size={16} className="text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Requested By</p>
                                            <p className="text-sm text-foreground">
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
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Assigned Team</p>
                                        {(user?.role === 'admin' || (user?.role === 'team' && typeof task.createdBy === 'object' && task.createdBy.uid === user.uid)) && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1">
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
                                                    <div key={i} className="flex items-center gap-2 bg-surface px-2.5 py-1.5 rounded-lg border border-soft">
                                                        <SafeAvatar
                                                            src={avatarUrl}
                                                            name={name}
                                                            alt={name}
                                                            size={20}
                                                            className="border border-soft"
                                                        />
                                                        <span className="text-xs text-foreground/80">{name}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-muted-foreground/60 italic">No one assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Deliverables Section - Operational */}
                            <div
                                className="pt-6 mt-8 -mx-8 px-8 pb-8 border-t border-soft bg-muted/5"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <FileCheck size={14} /> Deliverables
                                    </h3>
                                    {(user?.role === 'admin' || user?.role === 'team' || (Array.isArray(task.assignedTo) && task.assignedTo.some((u: any) => (typeof u === 'string' ? u : u.uid) === user?.uid))) && (
                                        <button
                                            onClick={() => setShowDeliverableUpload(true)}
                                            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary/50 transition-colors"
                                        >
                                            <UploadCloud size={13} /> Upload
                                        </button>
                                    )}
                                </div>

                                <DeliverablesList
                                    taskId={task.id}
                                    refreshTrigger={deliverableRefreshTrigger}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Deliverable Upload Modal */}
            {task?.id && (
                <DeliverableUploadModal
                    taskId={task.id}
                    isOpen={showDeliverableUpload}
                    onClose={() => setShowDeliverableUpload(false)}
                    onUploadComplete={() => setDeliverableRefreshTrigger(prev => prev + 1)}
                />
            )}
        </AnimatePresence>,
        document.body
    );
};
