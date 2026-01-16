import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { TaskService } from '@/services/tasks';
import { UserService } from '@/services/userService';
import { DeliverableService } from '@/services/deliverableService';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { X, Calendar, Flag, Send, Users, Check, AlertCircle } from 'lucide-react';
import { ConflictDetectionService } from '@/services/conflictDetectionService';
import { ConflictWarningBanner } from '@/components/conflicts/ConflictWarningBanner';
import { Conflict } from '@/types/conflict';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { DeliverablesList } from '@/components/deliverables/DeliverablesList';

interface EditTaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose }) => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isSuperAdmin = (user as any)?.isSuperAdmin || user?.email === 'media@thaibagarden.com';
    const isTeam = user?.role === 'team';

    // Determine creator status safely
    const creatorId = typeof task.createdBy === 'object' ? task.createdBy.uid : task.createdBy;
    const isCreator = user?.uid === creatorId;

    // Permission Logic
    const canEditContent = isAdmin || isSuperAdmin || isCreator; // Title, Desc, Campaign
    const canEditStatus = isAdmin || isSuperAdmin || isTeam || isCreator;
    // Allow Admins to edit priority on ANY task (previously restricted)
    // Team can only edit priority if they are the creator
    const canEditPriority = isAdmin || isSuperAdmin || (isTeam && isCreator);
    const canAssign = isAdmin || isSuperAdmin || (isTeam && isCreator); // Guest cannot assign, Team only on own tasks
    const canEditDueDate = isAdmin || isSuperAdmin || isCreator; // Team/Guest only on own tasks

    const [loading, setLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'low',
        dueDate: '',
        department: '',
        assignedToIds: [] as string[],
        campaignId: ''
    });

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);


    const [campaigns, setCampaigns] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const load = async () => {
            // Load members
            const members = await UserService.getTeamMembers();
            setTeamMembers(members);

            // Load campaigns
            if (user) {
                const { CampaignService } = await import('@/services/campaignService');
                const camps = await CampaignService.getUserCampaigns({ uid: user.uid, role: user.role || 'guest' });
                setCampaigns(camps);
            }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                priority: task.priority || 'low',
                dueDate: task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), 'yyyy-MM-dd') : '',
                department: task.department || '',
                assignedToIds: Array.isArray(task.assignedTo) ? task.assignedTo.map(u => u.uid) : [],
                campaignId: task.campaignId || ''
            });
        }
    }, [task]);

    // Check for conflicts when assignees or due date change
    useEffect(() => {
        const checkConflicts = async () => {
            if (formData.dueDate && formData.assignedToIds.length > 0) {
                const allConflicts: Conflict[] = [];

                // Check conflicts for each assignee
                for (const assigneeId of formData.assignedToIds) {
                    const result = await ConflictDetectionService.checkTaskAssignmentConflicts(
                        assigneeId,
                        new Date(formData.dueDate)
                    );
                    allConflicts.push(...result.conflicts);
                }

                setConflicts(allConflicts);
            } else {
                setConflicts([]);
            }
        };

        checkConflicts();
    }, [formData.assignedToIds, formData.dueDate]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Guard: If marking as done, check for deliverables
            if (formData.status === 'done') {
                const deliverables = await DeliverableService.getDeliverables(task.id);
                if (deliverables.length === 0) {
                    const confirmDone = window.confirm("⚠️ No deliverables attached.\n\nAre you sure you want to mark this task as Completed?");
                    if (!confirmDone) {
                        setLoading(false);
                        return;
                    }
                }
            }

            let finalAssignees = [...(task.assignedTo || [])];

            if (isAdmin || isTeam) {
                finalAssignees = formData.assignedToIds.map(id => {
                    const m = teamMembers.find(mm => mm.uid === id);
                    if (m) return { uid: m.uid, name: m.name };
                    const existing = task.assignedTo?.find(u => u.uid === id);
                    return existing || null;
                }).filter(Boolean) as any[];
            }

            await apiClient(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    status: formData.status as any,
                    priority: formData.priority as any,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : task.dueDate,
                    department: formData.department,
                    assignedTo: finalAssignees
                })
            });

            toast.success("Task updated");
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-xl bg-card rounded-2xl shadow-strong border border-soft overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-soft flex justify-between items-center bg-muted/50">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <AlertCircle className="text-primary" size={20} />
                                Edit Task
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Task Title</label>
                                    <input
                                        className="w-full bg-surface border border-soft rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Enter task title"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        disabled={!canEditContent}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Description</label>
                                    <textarea
                                        className="w-full bg-surface border border-soft rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[120px]"
                                        placeholder="Describe the task details..."
                                        rows={4}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        disabled={!canEditContent}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Status</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-surface border border-soft rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                disabled={!canEditStatus}
                                            >
                                                <option value="pending" className="bg-popover text-foreground">Pending</option>
                                                <option value="todo" className="bg-popover text-foreground">To Do</option>
                                                <option value="in_progress" className="bg-popover text-foreground">In Progress</option>
                                                <option value="on_hold" className="bg-popover text-foreground">On Hold</option>
                                                <option value="review" className="bg-popover text-foreground">Review</option>
                                                <option value="done" className="bg-popover text-foreground">Done</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                <Check size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Priority</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-surface border border-soft rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={formData.priority}
                                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                                disabled={!canEditPriority}
                                            >
                                                <option value="low" className="bg-popover text-foreground">Low</option>
                                                <option value="medium" className="bg-popover text-foreground">Medium</option>
                                                <option value="high" className="bg-popover text-foreground">High</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                                <Flag size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Due Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="w-full bg-surface border border-soft rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none block disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                            disabled={!canEditDueDate}
                                        />
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={18} />
                                    </div>
                                </div>

                                {/* Campaign Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Campaign</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-surface border border-soft rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={formData.campaignId || ''}
                                            onChange={e => setFormData({ ...formData, campaignId: e.target.value })}
                                            disabled={!canEditContent}
                                        >
                                            <option value="" className="bg-popover text-foreground">No Campaign</option>
                                            {campaigns.map(c => (
                                                <option key={c.id} value={c.id} className="bg-popover text-foreground">{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <Flag size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Conflict Warning */}
                                {conflicts.length > 0 && (
                                    <ConflictWarningBanner conflicts={conflicts} />
                                )}

                                {canAssign && (
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Assign Team Members</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-muted/50 rounded-xl border border-soft custom-scrollbar">
                                            {teamMembers.map(m => (
                                                <label
                                                    key={m.uid}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                                        ${formData.assignedToIds.includes(m.uid)
                                                            ? 'bg-primary/10 border-primary/20 text-foreground'
                                                            : 'bg-surface border-transparent text-muted-foreground hover:bg-muted/50'
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        w-6 h-6 rounded-md flex items-center justify-center border transition-all
                                                        ${formData.assignedToIds.includes(m.uid) ? 'bg-primary border-primary' : 'bg-transparent border-soft'}
                                                    `}>
                                                        {formData.assignedToIds.includes(m.uid) && <Check size={14} className="text-primary-foreground" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.assignedToIds.includes(m.uid)}
                                                        onChange={e => {
                                                            if (e.target.checked) setFormData(prev => ({ ...prev, assignedToIds: [...prev.assignedToIds, m.uid] }));
                                                            else setFormData(prev => ({ ...prev, assignedToIds: prev.assignedToIds.filter(id => id !== m.uid) }));
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium">{m.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                <div className="pt-6 mt-6 border-t border-soft">
                                    <DeliverablesList
                                        taskId={task.id}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-soft bg-muted/50 flex gap-3 justify-end items-center">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                form="edit-task-form"
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <Send size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div >
            )}
        </AnimatePresence >
    );
};
