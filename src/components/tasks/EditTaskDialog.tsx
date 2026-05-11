"use client";

import { motion, AnimatePresence } from "framer-motion";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    Loader2, Edit3, Calendar as CalendarIcon, Layers, CheckCircle2,
    Circle, Clock, AlertCircle, Flag, Users, Trash2, UploadCloud, TestTube2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { TaskService } from '@/services/tasks';
import { CampaignService } from '@/features/campaigns/services/campaignService';
import { Campaign } from '@/features/campaigns/types/campaign';
import { useAuth } from "@/contexts/AuthContextProvider";
import { UserService } from "@/services/userService";
import { AttachmentSection } from '@/components/tasks/AttachmentSection';
import { DeliverableUploadModal } from '@/components/deliverables/DeliverableUploadModal';
import { useCollaboration } from '@/lib/collaboration/useCollaboration';
import { PresencePile } from '@/components/collaboration/PresencePile';
import { TypingIndicator } from '@/components/collaboration/TypingIndicator';
import { FieldPresence } from '@/components/collaboration/FieldPresence';
import { useFormState } from '@/hooks/useFormState';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { DraftIndicator } from '@/components/ui/DraftIndicator';
import { MultiSelect } from '@/components/ui/selectors/MultiSelect';

interface EditTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: {
        id: string;
        title: string;
        description?: string;
        priority: "low" | "medium" | "high" | "urgent";
        due_date?: any;
        status: string;
        campaign_id?: string;
        created_by?: any;
        assigned_to?: { uid: string; name: string }[];
        assignedTo?: { uid: string; name: string; userId?: string }[];
        is_demo_data?: boolean;
    };
    onUpdate: (updates: any) => Promise<boolean>;
}

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', color: 'text-green-400', activeClass: 'bg-green-500/20 border-green-500/50 text-green-300' },
    { value: 'medium', label: 'Medium', color: 'text-amber-400', activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
    { value: 'high', label: 'High', color: 'text-orange-400', activeClass: 'bg-orange-500/20 border-orange-500/50 text-orange-300' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-400', activeClass: 'bg-red-500/20 border-red-500/50 text-red-300' },
];

const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do', icon: Circle, activeClass: 'bg-white/10 border-white/30 text-white' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, activeClass: 'bg-blue-500/20 border-blue-500/50 text-blue-300' },
    { value: 'review', label: 'On Hold', icon: AlertCircle, activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300' },
    { value: 'done', label: 'Completed', icon: CheckCircle2, activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' },
];

export function EditTaskDialog({ open, onOpenChange, task, onUpdate }: EditTaskDialogProps) {
    const { user } = useAuth();
    const [fullTask, setFullTask] = useState<any>(task);
    const { state: formData, setState: setFormData, clearDraft, isDraftSaved, isRestored } = useFormState({
        key: `draft:task:${task.id}`,
        initialState: {
            title: task.title,
            description: task.description || "",
            priority: task.priority,
            status: task.status || 'todo',
            due_date: task.due_date ? new Date(task.due_date).toISOString() : undefined as string | undefined,
            campaign_id: task.campaign_id || "none",
            assignedToIds: ((task.assigned_to || task.assignedTo)?.map(m => (m as any).uid || (m as any).userId) || []) as string[],
            is_demo_data: !!task.is_demo_data
        }
    });

    const { title, description, priority, status, campaign_id, assignedToIds, is_demo_data } = formData;
    const due_date = formData.due_date ? new Date(formData.due_date) : undefined;

    const setTitle = (val: string) => setFormData(prev => ({ ...prev, title: val }));
    const setDescription = (val: string) => setFormData(prev => ({ ...prev, description: val }));
    const setPriority = (val: string) => setFormData(prev => ({ ...prev, priority: val as any }));
    const setStatus = (val: string) => setFormData(prev => ({ ...prev, status: val }));
    const setDueDate = (val: Date | undefined) => setFormData(prev => ({ ...prev, due_date: val ? val.toISOString() : undefined }));
    const setCampaignId = (val: string) => setFormData(prev => ({ ...prev, campaign_id: val }));
    const setAssignedToIds = (val: string[] | ((prev: string[]) => string[])) => setFormData(prev => ({
        ...prev,
        assignedToIds: typeof val === 'function' ? val(prev.assignedToIds) : val
    }));
    const setIsDemoData = (val: boolean) => setFormData(prev => ({ ...prev, is_demo_data: val }));

    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [calOpen, setCalOpen] = useState(false);

    const collab = useCollaboration('tasks', task?.id || '');

    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isSuperAdmin = (user as any)?.is_super_admin || user?.email === 'media@thaibagarden.com';
    const isManager = user?.role?.toLowerCase() === 'manager';
    const isMember = user?.role?.toLowerCase() === 'member';
    const isTeam = isManager || isMember || user?.role?.toLowerCase() === 'team';
    
    const taskCreatorId = (task as any).created_by?.uid || (task as any).created_by;
    const isCreator = user?.uid === taskCreatorId;
    
    const assignedArray = (Array.isArray((task as any).assignedTo) && (task as any).assignedTo.length > 0) 
        ? (task as any).assignedTo 
        : (Array.isArray(task.assigned_to) ? task.assigned_to : []);
    const isAssignee = assignedArray.some((u: any) => (typeof u === 'string' ? u : (u.uid || u.userId)) === user?.uid);

    // Permission Logic
    const canEditContent = isAdmin || isSuperAdmin || isManager || isMember || isCreator;
    const canEditPriority = isAdmin || isSuperAdmin || isManager;
    const canEditStatus = isAdmin || isSuperAdmin || isManager || isAssignee;
    const canEditDueDate = isAdmin || isSuperAdmin || isManager || isMember;
    const canAssign = true; // Always allow visibility; UserService handles filtering of eligible assignees
    
    const canSave = canEditContent || canEditPriority || canEditStatus || canEditDueDate;

    useEffect(() => {
        if (open && user && task?.id) {
            if (!isRestored) {
                setTitle(task.title || "");
                setDescription(task.description || "");
                setPriority(task.priority || "medium");
                setStatus(task.status || "todo");
                setCampaignId(task.campaign_id || "");
                setDueDate(task.due_date ? new Date(task.due_date) : undefined);
                setIsDemoData(!!task.is_demo_data);

                // Priority: (task as any).assignedTo (modern DTO) -> task.assigned_to (legacy)
                const taskAssignedTo = ((task as any).assignedTo?.length ? (task as any).assignedTo : task.assigned_to) || [];
                const ids = taskAssignedTo
                    .map((m: any) => m.uid || m.userId || (typeof m === 'string' ? m : null))
                    .filter(Boolean);
                
                setAssignedToIds(ids);
            }

            CampaignService.getCampaigns({ uid: user.uid, role: user.role || 'member' })
                .then(setCampaigns).catch(console.error);

            // Determine if the user is an admin or super admin to decide whether to fetch all members or only those in the task's institution
            const currentIsAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';
            const currentIsSuperAdmin = (user as any)?.is_super_admin || user?.email === 'media@thaibagarden.com' || user?.role?.toLowerCase() === 'superadmin';
            const currentIsManager = user?.role?.toLowerCase() === 'manager';
            
            // If admin/superadmin/manager, we want the most inclusive view possible
            const isElevated = currentIsAdmin || currentIsSuperAdmin || currentIsManager;
            
            // If admin/superadmin, pass null to fetch all members (omniscient view)
            const finalInstitutionId = (task as any).institution_id || (task as any).institutionId || null;
            
            UserService.getTeamMembers(finalInstitutionId, user.uid).then(members => {
                const filtered = members.filter(m => {
                    const role = (m as any).role?.toLowerCase().trim();
                    const name = m.name?.toLowerCase() || '';
                    // Exclude generic system/admin accounts from the selection list, but keep real users
                    const isGenericAdmin = name.includes('admin user') || name === 'admin' || name === 'super admin';
                    const isSystem = name.includes('system');
                    return !isGenericAdmin && !isSystem && role !== 'superadmin';
                });
                setTeamMembers(filtered);
            }).catch(err => {
                console.error("[EditTaskDialog] Failed to fetch team members:", err);
            });

            // Always fetch latest task data to ensure we have current assignments
            TaskService.getTaskById(task.id).then(fresh => {
                if (fresh) {
                    // Sync assignments specifically
                    const freshAssignedTo = ((fresh as any).assignedTo?.length ? (fresh as any).assignedTo : (fresh as any).assigned_to) || [];
                    const freshIds = freshAssignedTo
                        .map((m: any) => m.uid || m.userId || (typeof m === 'string' ? m : null))
                        .filter(Boolean);

                    // If the current list is empty (default state) or if fresh has data, sync it.
                    // We don't want to overwrite if the user just manually edited it,
                    // but on first load/open, we want the most accurate data.
                    if (assignedToIds.length === 0 || freshIds.length > 0) {
                        setAssignedToIds(freshIds);
                    }
                }
            }).catch(err => console.error('[EditTaskDialog] Failed to fetch fresh task:', err));
        }
    }, [open, task, user]);

    const submitUpdate = async () => {
        setError(null);
        if (!title.trim()) throw new Error("Title is required");

        const updates: any = {
            title,
            description,
            priority,
            status,
            campaign_id: campaign_id === "none" ? null : campaign_id,
            is_demo_data
        };

        if (canAssign) {
            updates.assigned_to = assignedToIds.map(id => {
                const m = teamMembers.find(m => m.uid === id);
                // Try to find in original task if not in teamMembers
                const original = (task as any).assignedTo?.find((o: any) => (o.uid || o.userId) === id);
                return { 
                    uid: id, 
                    name: m?.name || original?.name || 'Assigned Member' 
                };
            });
        }

        if (due_date) updates.due_date = due_date.toISOString();

        const success = await onUpdate(updates);
        if (!success) throw new Error("Task couldn't be updated");
    };

    const { isSubmitting, handleSubmit: handleProtectedSubmit } = useFormSubmit({
        onSubmit: submitUpdate,
        onSuccess: () => {
            toast.success("Task updated successfully");
            clearDraft();
            onOpenChange(false);
        },
        onError: (err) => setError(err.message)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleProtectedSubmit(undefined);
    };

    // Shared style tokens
    const labelCls = "text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block";
    const inputCls = "bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-0 focus:bg-white/[0.06] transition-all rounded-xl h-11 disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                overlayClassName="z-[150]"
                className="z-[150] sm:max-w-[640px] bg-[#0d0e17] text-white border border-white/[0.07] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)] p-0 rounded-[28px] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-white/[0.06] bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", canSave ? "bg-blue-500/10 text-blue-400" : "bg-white/5 text-white/40")}>
                            <Edit3 size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <DialogHeader className="flex-1">
                                    <DialogTitle className="text-base font-bold text-white tracking-tight">
                                        {canSave ? "Edit Task" : "Task Details"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live Sync</span>
                                </div>
                                <DraftIndicator isSaved={isDraftSaved} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mr-12">
                        <PresencePile users={collab.activeUsers} />
                        {(isAdmin || isSuperAdmin || isManager || isCreator) && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm("Are you sure you want to move this task to trash?")) {
                                        await TaskService.deleteTask(task.id);
                                        toast.success("Task moved to trash");
                                        onOpenChange(false);
                                    }
                                }}
                                className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Move to Trash"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <DialogDescription className="sr-only">Edit the selected task.</DialogDescription>

                <form onSubmit={handleSubmit} className="px-7 py-6 space-y-7 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[#0d0e17]">

                    {/* Section 1: General Info */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">General Information</span>
                        </div>
                        
                        {/* Task Title */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls}>Task Title</label>
                                <div className="flex items-center gap-2">
                                    <TypingIndicator fieldName="title" userContext={collab.editingUsers['title']} />
                                    <FieldPresence users={collab.activeUsers} field="title" />
                                </div>
                            </div>
                            <Input
                                value={title}
                                onChange={e => { setTitle(e.target.value); collab.onTyping('title', true); }}
                                onFocus={() => collab.onFieldFocus('title')}
                                onBlur={() => collab.onFieldBlur('title')}
                                className={inputCls}
                                placeholder="What needs to be done?"
                                disabled={!canEditContent}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls}>Description</label>
                                <div className="flex items-center gap-2">
                                    <TypingIndicator fieldName="description" userContext={collab.editingUsers['description']} />
                                    <FieldPresence users={collab.activeUsers} field="description" />
                                </div>
                            </div>
                            <Textarea
                                value={description}
                                onChange={e => { setDescription(e.target.value); collab.onTyping('description', true); }}
                                onFocus={() => collab.onFieldFocus('description')}
                                onBlur={() => collab.onFieldBlur('description')}
                                className="bg-white/[0.03] border border-white/[0.07] text-white placeholder:text-white/25 focus:border-blue-500/40 focus:ring-0 focus:bg-white/[0.05] transition-all rounded-xl min-h-[120px] p-4 text-sm leading-relaxed resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                                placeholder="Add more context, requirements, or links..."
                                disabled={!canEditContent}
                            />
                        </div>
                    </div>

                    {/* Section 2: Timeline & Context */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Timeline & Context</span>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            {/* Due Date */}
                            <div>
                                <label className={labelCls}>Due Date</label>
                                <Popover open={calOpen} onOpenChange={setCalOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={!canEditDueDate}
                                            className={cn(
                                                "w-full h-11 flex items-center gap-2.5 px-3.5 rounded-xl border text-sm transition-all",
                                                "bg-white/[0.03] border-white/[0.07] text-white hover:bg-white/[0.05]",
                                                "disabled:opacity-40 disabled:cursor-not-allowed shadow-inner",
                                                !due_date && "text-white/30"
                                            )}
                                        >
                                            <CalendarIcon size={15} className="text-white/40 shrink-0" />
                                            {due_date ? format(due_date, "MMM d, yyyy") : "Select date"}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#0d0e17] border border-white/[0.1] text-white z-[200] shadow-2xl rounded-2xl overflow-hidden" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={due_date}
                                            onSelect={(d) => { setDueDate(d); setCalOpen(false); }}
                                            initialFocus
                                            className="bg-transparent text-white p-4"
                                            classNames={{
                                                day_selected: "bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20",
                                                day_today: "bg-white/10 text-white rounded-xl font-bold border border-white/20",
                                                day: "text-white hover:bg-white/10 rounded-xl w-10 h-10 p-0 font-normal transition-colors",
                                                head_cell: "text-white/40 w-10 font-bold text-[10px] uppercase tracking-widest",
                                                caption_label: "text-sm font-bold tracking-tight px-2",
                                                nav_button: "text-white/60 hover:text-white hover:bg-white/10 rounded-lg w-8 h-8 flex items-center justify-center transition-colors",
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Campaign */}
                            <div>
                                <label className={labelCls}>Campaign</label>
                                <Select value={campaign_id} onValueChange={setCampaignId} disabled={!canEditContent}>
                                    <SelectTrigger className="bg-white/[0.03] border border-white/[0.07] text-white h-11 rounded-xl focus:ring-0 disabled:opacity-40 shadow-inner">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Layers size={13} className="text-white/40 shrink-0" />
                                            <SelectValue placeholder="No Campaign" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0d0e17] border border-white/[0.1] text-white z-[200] rounded-xl shadow-2xl">
                                        <SelectItem value="none" className="text-white/40 italic py-2.5">No Campaign</SelectItem>
                                        {campaigns.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="py-2.5 focus:bg-blue-500/10 focus:text-blue-200">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Governance */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Governance</span>
                        </div>

                        {/* Priority Toggle Buttons */}
                        <div>
                            <label className={labelCls}>Priority</label>
                            <div className="grid grid-cols-4 gap-2.5">
                                {PRIORITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={!canEditPriority}
                                        onClick={() => setPriority(opt.value)}
                                        className={cn(
                                            "h-11 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            priority === opt.value
                                                ? opt.activeClass + " shadow-lg"
                                                : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:bg-white/[0.05] hover:text-white/50"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div>
                            <label className={labelCls}>Status</label>
                            <div className="grid grid-cols-4 gap-2.5">
                                {STATUS_OPTIONS.map(opt => {
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={!canEditStatus}
                                            onClick={() => setStatus(opt.value)}
                                            className={cn(
                                                "h-11 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200",
                                                "disabled:opacity-40 disabled:cursor-not-allowed",
                                                status === opt.value
                                                    ? opt.activeClass + " shadow-lg"
                                                    : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:bg-white/[0.05] hover:text-white/50"
                                            )}
                                        >
                                            <Icon size={14} />
                                            <span className="hidden sm:inline">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Assign To Team Members */}
                        {canAssign && (
                            <div>
                                <label className={cn(labelCls, "mb-3")}>Assign To Team Members</label>
                                <MultiSelect
                                    placeholder="Add assignees..."
                                    options={teamMembers.map(m => ({ id: m.uid, label: m.name }))}
                                    selected={assignedToIds}
                                    onChange={setAssignedToIds}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Demo Data Management */}
                        {(isAdmin || isManager) && (
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <TestTube2 size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-200">Test / Demo Data</p>
                                            <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">Exclude from official reports</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={is_demo_data}
                                        onCheckedChange={setIsDemoData}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attachments / Deliverables */}
                    <div className="pt-7 border-t border-white/[0.06] space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Attachments & Deliverables</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all shadow-sm"
                            >
                                <UploadCloud size={13} />
                                Upload File
                            </button>
                        </div>
                        <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                            <AttachmentSection
                                task={fullTask}
                                onUpdate={() => {
                                    TaskService.getTaskById(task.id).then(t => t && setFullTask(t as any));
                                }}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5"
                            >
                                <AlertCircle size={18} className="text-red-400 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-red-200 uppercase tracking-widest mb-0.5">Update Failed</p>
                                    <p className="text-sm text-red-300/80 font-medium">{error}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleProtectedSubmit(undefined)}
                                    className="px-3.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-colors"
                                >
                                    Retry
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.06]">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="text-white/40 hover:text-white hover:bg-white/[0.05] rounded-xl h-12 px-6 text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            {canSave ? "Discard" : "Close"}
                        </Button>
                        {canSave && (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 px-10 text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>

            <DeliverableUploadModal
                taskId={task.id}
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadComplete={() => setRefreshTrigger(prev => prev + 1)}
            />
        </Dialog>
    );
}
