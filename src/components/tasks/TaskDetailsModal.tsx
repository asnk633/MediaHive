"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/types/task';
import { Share2, Clock, Calendar, CheckCircle2, User as UserIcon, AlertCircle, X, MessageSquare, Send, Trash2, Edit2, Archive, Loader2, UploadCloud, FileCheck, Circle, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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

interface TaskDetailsModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
}

const statusIcons = {
    pending: <Circle size={18} className="text-amber-500" />,
    todo: <Circle size={18} className="text-slate-400" />,
    'in_progress': <Clock size={18} className="text-blue-500" />,
    on_hold: <Circle size={18} className="text-orange-500" />,
    review: <AlertCircle size={18} className="text-purple-500" />,
    done: <CheckCircle2 size={18} className="text-emerald-500" />,
};

const priorityColors = {
    high: 'text-red-400 border-red-400/20 bg-red-400/10',
    urgent: 'text-red-600 border-red-600/20 bg-red-600/10',
    medium: 'text-orange-400 border-orange-400/20 bg-orange-400/10',
    low: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
};

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, isOpen, onClose, onEdit }) => {
    const { user } = useAuth();
    const [showDeliverableUpload, setShowDeliverableUpload] = useState(false);
    const [deliverableRefreshTrigger, setDeliverableRefreshTrigger] = useState(0);

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

    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string; avatarUrl?: string }[]>([]);

    // Fetch team members
    React.useEffect(() => {
        const fetchTeam = async () => {
            const members = await UserService.getTeamMembers();
            setTeamMembers(members.map(m => ({
                uid: m.uid,
                name: m.name || 'Unknown',
                avatarUrl: m.avatarUrl || m.photoURL // Fallback
            })));
        };
        if (isOpen) fetchTeam();
    }, [isOpen]);

    const handleToggleAssign = async (member: { uid: string, name: string }) => {
        if (!task) return;
        await TaskService.toggleTaskAssignee(task.id, { uid: member.uid, name: member.name });

        // Ideally we should update local state or trigger a refresh, but onEdit() or similar props aren't setup for simple refresh. 
        // We will assume parent might refresh or we rely on optimistic updates if possible, but for now just the API call.
        // Actually, without state refresh, the UI won't update immediately. 
        // We can force a re-render or let the parent handle it if 'task' prop updates.
        // Since 'task' is passed as prop, we can't mutate it easily. 
        // However, this component seems to be controlled. 
        // We will trigger a notification and rely on SWR/React Query if used, or just wait.
        // But to give feedback, we can notify User.

        // Notify
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

        // Trigger generic edit callback which might cause a re-fetch in parent
        onEdit();
    };

    useDevWiring('TaskDetailsModal', [
        { name: 'Delete Task', handler: handleDelete, visible: !!canDelete, destructive: true, permissionVerified: !!canDelete },
        { name: 'Edit Task', handler: onEdit, visible: true },
        { name: 'Deliverable Upload', handler: () => setShowDeliverableUpload(true), visible: (user?.role === 'admin' || user?.role === 'team') }
    ]);

    if (!task) return null;

    console.log('[TaskDetailsModal] Task:', task.id, 'Assignees:', task.assignedTo);

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="modal-content" className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        layoutId={`task-card-${task.id}`}
                        className="relative w-full max-w-2xl bg-gradient-to-br from-[#1a2639] to-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border border-[#ffffff1a] flex flex-col max-h-[90vh]"
                    >
                        {/* Header Image/Pattern Area */}
                        <div className="h-32 bg-blue-600/20 relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                            />
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                {(user?.role === 'admin' || user?.role === 'team' || user?.uid === task?.createdBy?.uid) && (
                                    <button
                                        onClick={() => {
                                            onEdit();
                                        }}
                                        className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white"
                                        title="Edit Task"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-[#1a2639] to-transparent">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${priorityColors[task.priority!] || priorityColors.low} `}>
                                        {task.priority || 'low'} Priority
                                    </span>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-[#ffffff1a] text-xs font-medium text-white/70">
                                        {statusIcons[task.status]}
                                        <span className="capitalize">{task.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl font-bold text-white mb-4 leading-tight"
                            >
                                {task.title}
                            </motion.h2>

                            <TaskRatingComponent
                                task={task}
                                onRatingSubmitted={onClose}
                            />

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-blue-100/70 leading-relaxed mb-8 whitespace-pre-wrap"
                            >
                                {task.description || <span className="italic opacity-50">No description provided.</span>}
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-white/60">
                                        <Calendar size={18} className="text-blue-400" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Due Date</p>
                                            <p className="text-sm text-white font-medium">
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

                                    <div className="flex items-center gap-3 text-white/60">
                                        <User size={18} className="text-blue-400" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Requested By</p>
                                            <p className="text-sm text-white font-medium">
                                                {typeof task.createdBy === 'object' ? task.createdBy.name : 'Unknown User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-white/30">Assigned Team Members</p>
                                            {(user?.role === 'admin' || (user?.role === 'team' && typeof task.createdBy === 'object' && task.createdBy.uid === user.uid)) && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider flex items-center gap-1">
                                                            <UserIcon size={12} /> Assign
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-56 p-2 bg-[#0f172a] border-[#ffffff1a] text-white z-[110]" align="end" side="bottom">
                                                        <div className="text-xs font-bold text-gray-500 px-2 py-1 mb-1 tracking-wider">SELECT MEMBER</div>
                                                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                            {teamMembers.map((m) => {
                                                                const isAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(current => typeof current === 'string' ? current === m.uid : current.uid === m.uid);
                                                                return (
                                                                    <div
                                                                        key={m.uid}
                                                                        onClick={() => handleToggleAssign(m)}
                                                                        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm transition-colors ${isAssigned ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-gray-300'}`}
                                                                    >
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAssigned ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500'}`}>
                                                                            {isAssigned && <span className="text-white text-[10px]">✓</span>}
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

                                                    // Robust Lookup: UID -> Name Match (for migrated accounts)
                                                    let teamMember = teamMembers.find(m => m.uid === uid);
                                                    if (!teamMember && assignee.name) {
                                                        teamMember = teamMembers.find(m => m.name === assignee.name);
                                                    }

                                                    const avatarUrl = assignee.avatarUrl || teamMember?.avatarUrl;
                                                    const name = assignee.name || teamMember?.name || 'Unknown';

                                                    return (
                                                        <div key={i} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-[#ffffff1a] group cursor-default">
                                                            <SafeAvatar
                                                                src={avatarUrl}
                                                                name={name}
                                                                alt={name}
                                                                size={24}
                                                                className="border border-[#ffffff1a]"
                                                            />
                                                            <span className="text-xs text-white/90">{name}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-xs text-white/40 italic">No one assigned</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Deliverables Section */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-8 pt-8 border-t border-[#ffffff1a]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileCheck size={16} /> Deliverables
                                </h3>
                                {(user?.role === 'admin' || user?.role === 'team' || (Array.isArray(task.assignedTo) && task.assignedTo.some((u: any) => (typeof u === 'string' ? u : u.uid) === user?.uid))) && (
                                    <button
                                        onClick={() => setShowDeliverableUpload(true)}
                                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                    >
                                        <UploadCloud size={14} /> Upload Version
                                    </button>
                                )}
                            </div>

                            <DeliverablesList
                                taskId={task.id}
                                refreshTrigger={deliverableRefreshTrigger}
                            />
                        </motion.div>
                    </motion.div>
                </div>
            )}

            {/* Modals */}
            {task.id && ( // Ensure task.id exists before rendering modal
                <DeliverableUploadModal
                    key="upload-modal"
                    taskId={task.id}
                    isOpen={showDeliverableUpload}
                    onClose={() => setShowDeliverableUpload(false)}
                    onUploadComplete={() => setDeliverableRefreshTrigger(prev => prev + 1)}
                />
            )}
        </AnimatePresence>
    );
};
