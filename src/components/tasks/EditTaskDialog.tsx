"use client";

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
import { Loader2, Edit3, Calendar as CalendarIcon, Layers, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { TaskService } from '@/features/tasks/services/taskService';
import { CampaignService } from '@/features/campaigns/services/campaignService';
import { Campaign } from '@/features/campaigns/types/campaign';
import { useAuth } from "@/contexts/AuthContextProvider";
import { UserService } from "@/services/userService";
import { useRouter } from 'next/navigation';
import { DeliverablesList } from '@/components/deliverables/DeliverablesList';
import { DeliverableUploadModal } from '@/components/deliverables/DeliverableUploadModal';
import { AttachmentSection } from '@/components/tasks/AttachmentSection';
import { useCollaboration } from '@/lib/collaboration/useCollaboration';
import { PresencePile } from '@/components/collaboration/PresencePile';
import { TypingIndicator } from '@/components/collaboration/TypingIndicator';
import { FieldPresence } from '@/components/collaboration/FieldPresence';
import { useFormState } from '@/hooks/useFormState';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

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
        assignedTo?: { uid: string; name: string }[]; // Added legacy support
    };
    onUpdate: (updates: any) => Promise<boolean>;
}

export function EditTaskDialog({ open, onOpenChange, task, onUpdate }: EditTaskDialogProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [fullTask, setFullTask] = useState<any>(task);
    const { state: formData, setState: setFormData, clearDraft, isDraftSaved, isRestored } = useFormState({
        key: `draft:task:${task.id}`,
        initialState: {
            title: task.title,
            description: task.description || "",
            priority: task.priority,
            due_date: task.due_date ? new Date(task.due_date).toISOString() : undefined as string | undefined,
            campaign_id: task.campaign_id || "none",
            assignedToIds: ((task.assigned_to || task.assignedTo)?.map(m => (m as any).uid || (m as any).userId) || []) as string[]
        }
    });

    const { title, description, priority, campaign_id, assignedToIds } = formData;
    const due_date = formData.due_date ? new Date(formData.due_date) : undefined;

    const setTitle = (val: string) => setFormData(prev => ({ ...prev, title: val }));
    const setDescription = (val: string) => setFormData(prev => ({ ...prev, description: val }));
    const setPriority = (val: "low" | "medium" | "high" | "urgent") => setFormData(prev => ({ ...prev, priority: val }));
    const setDueDate = (val: Date | undefined) => setFormData(prev => ({ ...prev, due_date: val ? val.toISOString() : undefined }));
    const setCampaignId = (val: string) => setFormData(prev => ({ ...prev, campaign_id: val }));
    const setAssignedToIds = (val: string[] | ((prev: string[]) => string[])) => setFormData(prev => ({
        ...prev,
        assignedToIds: typeof val === 'function' ? val(prev.assignedToIds) : val
    }));
    
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Attachments State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const collab = useCollaboration('tasks', task?.id || '');

    useEffect(() => {
        if (open && user && task?.id) {
            // Skip resetting local state from props if we just restored a draft
            if (!isRestored) {
                setTitle(task.title);
                setDescription(task.description || "");
                setPriority(task.priority);
                setCampaignId(task.campaign_id || "none");
                setAssignedToIds((task.assigned_to || task.assignedTo)?.map(m => (m as any).uid || (m as any).userId) || []);
            }

            // Handle Date
            if (!isRestored) {
                if (task.due_date) {
                    try {
                        const dateObj = new Date(task.due_date);
                        if (dateObj && !isNaN(dateObj.getTime())) {
                            setDueDate(dateObj);
                        } else {
                            setDueDate(undefined);
                        }
                    } catch (e) {
                        setDueDate(undefined);
                    }
                } else {
                    setDueDate(undefined);
                }
            }

            // Campaigns & Team
            // Campaigns
            loadCampaigns();

            // Team (Admins only)
            if (isAdmin) {
                loadTeamMembers();
            }

            // HYDRATE: Fetch fresh task data to ensure 'files' and other dynamic fields are up to date
            // This fixes the issue where List View might pass a stale or partial object without files
            TaskService.getTaskById(task.id).then((fresh) => {
                if (fresh) {
                    setFullTask(fresh as any);
                }
            });
        }
    }, [open, task, user, isRestored]);

    const loadCampaigns = async () => {
        if (!user) return;
        try {
            const list = await CampaignService.getCampaigns({
                uid: user.uid,
                role: user.role || 'member'
            });
            setCampaigns(list);
        } catch (error) {
            console.error("Failed to load campaigns", error);
        }
    };

    const loadTeamMembers = async () => {
        if (!user) return;
        try {
            const members = await UserService.getTeamMembers();
            setTeamMembers(members);
        } catch (error) {
            console.error("Failed to load team members", error);
        }
    };

    const submitUpdate = async () => {
        setError(null);
        if (!title.trim()) {
            throw new Error("Title is required");
        }

        const updates: any = {
            title,
            description,
            priority,
            campaign_id: campaign_id === "none" ? null : campaign_id,
        };

        // Calculate final assigned_to objects
        if (isAdmin) {
            // Map IDs back to objects
            const finalAssignedTo = assignedToIds.map(id => {
                const member = teamMembers.find(m => m.uid === id);
                if (member) return { uid: member.uid, name: member.name };
                return null;
            }).filter(Boolean);
            updates.assigned_to = finalAssignedTo;
        }

        if (due_date) {
            updates.due_date = due_date.toISOString();
        }

        const success = await onUpdate(updates);
        if (!success) {
            const isApproval = (task as any).approval_status === 'pending';
            throw new Error(isApproval ? "Approval didn’t go through" : "Task couldn’t be updated");
        }
    };

    const { isSubmitting, handleSubmit: handleProtectedSubmit } = useFormSubmit({
        onSubmit: submitUpdate,
        onSuccess: () => {
            toast.success("Task updated successfully");
            clearDraft();
            onOpenChange(false);
        },
        onError: (err) => {
            setError(err.message);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Two-step Confirmation
        const confirmed = window.confirm("Are you sure you want to update this task?");
        if (!confirmed) return;
        await handleProtectedSubmit(undefined);
    };

    // Styles matching Night Sky theme
    const inputClasses = "bg-[#0a0c10] border-[#ffffff1a] text-white placeholder:text-white/50 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-xl h-11 disabled:opacity-50 disabled:cursor-not-allowed";
    const labelClasses = "uppercase text-[10px] font-bold tracking-widest text-white/50 mb-1.5 block";

    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const is_super_admin = (user as any)?.is_super_admin || user?.email === 'media@thaibagarden.com';
    const isTeam = (user?.role === 'manager' || user?.role === 'member' || user?.role === 'team');
    const isMember = user?.role === 'member';

    const taskCreatorId = (task as any).created_by?.uid || (task as any).created_by;
    const isCreator = user?.uid === taskCreatorId;

    const assignedArray = Array.isArray(task.assigned_to) ? task.assigned_to : [];
    const isAssignee = assignedArray.some((u: any) => (typeof u === 'string' ? u : u.uid) === user?.uid);

    // --- STRICT PERMISSION UI RULES (Matching Backend) ---
    const canEditContent = isAdmin || is_super_admin || isTeam || isCreator;

    // Priority: ADMIN ONLY
    const canEditPriority = isAdmin || is_super_admin;

    // Assignee: ADMIN ONLY
    // (Handled directly in JSX by conditional rendering)

    // Status: 
    // - Admin: Always
    // - Team/Member: Only if Assginee
    // Note: Member Creator CANNOT change status unless assigned (strict workflow)
    const canEditStatus = isAdmin || is_super_admin || isAssignee;

    const canEditMeta = isAdmin || is_super_admin; // For Due Date etc.

    const canSave = canEditContent || canEditPriority || canEditStatus;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                overlayClassName="z-[150]"
                className="z-[150] sm:max-w-2xl bg-[#10111a] text-white border-[#ffffff1a] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-6 rounded-[24px] backdrop-blur-3xl"
            >
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2.5 rounded-xl text-blue-500", canSave ? "bg-blue-600/10" : "bg-white/5 text-white/50")}>
                                {canSave ? <Edit3 size={20} /> : <Layers size={20} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span>{canSave ? "Edit Task" : "Task Details"}</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live Sync</span>
                                </div>
                                <DraftIndicator isSaved={isDraftSaved} />
                            </div>
                        </div>
                        <PresencePile users={collab.activeUsers} />
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {canSave ? "Modify the details of the selected task." : "View the details of the selected task."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ... Inputs ... */}

                    {/* ... (Existing inputs with disabled props are fine, keeping them via context match would be hard with replace logic on huge block. 
                         I will target specific areas or wrap inputs. 
                         Wait, I need to keep the inputs. 
                         The previous file view showed inputs. I will use a StartLine/EndLine that covers Header and Footer changes primarily, 
                         or modify the Button area.
                         
                         Let's split this into chunks to be safe.
                    */}

                    <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1.5">
                            <Label className={cn(labelClasses, "mb-0")}>Task Title</Label>
                            <div className="flex items-center gap-2">
                                <TypingIndicator fieldName="title" userContext={collab.editingUsers['title']} />
                                <FieldPresence users={collab.activeUsers} field="title" />
                            </div>
                        </div>
                        <Input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                collab.onTyping('title', true);
                            }}
                            onFocus={() => collab.onFieldFocus('title')}
                            onBlur={() => collab.onFieldBlur('title')}
                            className={inputClasses}
                            placeholder="What needs to be done?"
                            disabled={!canEditContent}
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1.5">
                            <Label className={cn(labelClasses, "mb-0")}>Description</Label>
                            <div className="flex items-center gap-2">
                                <TypingIndicator fieldName="description" userContext={collab.editingUsers['description']} />
                                <FieldPresence users={collab.activeUsers} field="description" />
                            </div>
                        </div>
                        <Textarea
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                collab.onTyping('description', true);
                            }}
                            onFocus={() => collab.onFieldFocus('description')}
                            onBlur={() => collab.onFieldBlur('description')}
                            className={cn(
                                "bg-[#0a0c10] border-[#ffffff1a] text-white placeholder:text-white/50 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-xl min-h-[120px] custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                            )}
                            placeholder="Provide more context..."
                            disabled={!canEditContent}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className={labelClasses}>Priority</Label>
                            <Select
                                value={priority?.toLowerCase() || 'low'}
                                onValueChange={(v: any) => setPriority(v)}
                                disabled={!isAdmin && !is_super_admin && !canEditMeta}
                            >
                                <SelectTrigger className="bg-[#0a0c10] border-[#ffffff1a] text-white focus:ring-blue-500/10 h-11 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0c10] border-[#ffffff1a] text-white z-[200]">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assigned To - Admin Only */}
                        {isAdmin && (
                            <div className="space-y-1">
                                <Label className={labelClasses}>Assigned To</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between bg-[#0a0c10] border-[#ffffff1a] text-white hover:bg-white/5 hover:text-white h-11 rounded-xl"
                                        >
                                            <span className="truncate">
                                                {assignedToIds.length === 0
                                                    ? "Unassigned"
                                                    : `${assignedToIds.length} Member${assignedToIds.length === 1 ? '' : 's'}`}
                                            </span>
                                            <Users size={16} className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0 bg-[#0a0c10] border-[#ffffff1a] text-white shadow-xl z-[200]" align="start">
                                        <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
                                            {teamMembers.map(m => (
                                                <div
                                                    key={m.uid}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                                                        assignedToIds.includes(m.uid) ? "bg-blue-600/20 text-blue-200" : "hover:bg-white/5 text-gray-400"
                                                    )}
                                                    onClick={() => {
                                                        setAssignedToIds(prev =>
                                                            prev.includes(m.uid)
                                                                ? prev.filter(id => id !== m.uid)
                                                                : [...prev, m.uid]
                                                        );
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center",
                                                        assignedToIds.includes(m.uid) ? "border-blue-500 bg-blue-500" : "border-white/20"
                                                    )}>
                                                        {assignedToIds.includes(m.uid) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                    </div>
                                                    <span className="text-xs font-medium truncate">{m.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                        {/* Hidden spacer if not admin to keep grid correct? No, standard grid flow is fine */}


                        <div className="space-y-1 flex flex-col">
                            <Label className={labelClasses}>Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        disabled={!isAdmin && !is_super_admin && !canEditMeta}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-[#0a0c10] border-[#ffffff1a] text-white hover:bg-white/5 hover:text-white h-11 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed",
                                            !due_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {due_date ? format(due_date, "dd/MM/yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#10111a] border-[#ffffff1a] text-white z-[200]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={due_date}
                                        onSelect={setDueDate}
                                        initialFocus
                                        className="bg-[#10111a] text-white"
                                        classNames={{
                                            day_selected: "bg-blue-600 text-white rounded-full",
                                            day_today: "bg-white/10 text-white rounded-full",
                                            day: "text-white hover:bg-white/10 rounded-full w-9 h-9 p-0 font-normal aria-selected:opacity-100",
                                            head_cell: "text-white/50 w-9 font-normal text-[0.8rem]",
                                            caption_label: "text-white",
                                            nav_button: "text-white hover:bg-white/10 rounded-full",
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className={labelClasses}>Campaign</Label>
                        <Select value={campaign_id} onValueChange={setCampaignId} disabled={!canEditContent}>
                            <SelectTrigger className="bg-[#0a0c10] border-[#ffffff1a] text-white focus:ring-blue-500/10 h-11 rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="flex items-center gap-2 truncate">
                                    <Layers size={14} className="text-white/50" />
                                    <SelectValue placeholder="Select Campaign" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0c10] border-[#ffffff1a] text-white z-[200]">
                                <SelectItem value="none" className="text-white/50 italic">No Campaign</SelectItem>
                                {campaigns.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <Label className={labelClasses}>Attachments / Deliverables</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUploadModal(true)} // Open Upload Modal
                                className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                            >
                                <Users className="w-3 h-3 mr-1.5" /> Upload File
                            </Button>
                        </div>
                        <div className="bg-[#0a0c10] border border-[#ffffff1a] rounded-xl p-4 min-h-[100px] max-h-[500px] overflow-y-auto custom-scrollbar">
                            <AttachmentSection
                                task={fullTask}
                                onUpdate={() => {
                                    // Refresh local data only
                                    TaskService.getTaskById(task.id).then((t) => t && setFullTask(t as any));
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-3 py-2 animate-in fade-in slide-in-from-bottom-2">
                            <span className="text-sm text-red-400 font-medium">{error}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    handleProtectedSubmit(undefined);
                                }}
                                className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-semibold h-11 px-6"
                        >
                            {canSave ? "Cancel" : "Close"}
                        </Button>
                        {canSave && (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold h-11 px-8 shadow-lg shadow-blue-500/20"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>

            {/* Upload Modal - Rendered outside to prevent context conflicts, though Portals handle it, simpler DOM structure helps */}
            <DeliverableUploadModal
                taskId={task.id}
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadComplete={() => setRefreshTrigger(prev => prev + 1)}
            />
        </Dialog>
    );
}
