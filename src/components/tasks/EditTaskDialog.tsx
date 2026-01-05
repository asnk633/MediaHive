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
import { CampaignService } from "@/services/campaignService";
import { Campaign } from "@/types/campaign";
import { useAuth } from "@/contexts/AuthContext";
import { UserService } from "@/services/userService";

interface EditTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: {
        id: string;
        title: string;
        description?: string;
        priority: "low" | "medium" | "high" | "urgent";
        dueDate?: any;
        status: string;
        campaignId?: string;
        createdBy?: any;
        assignedTo?: { uid: string; name: string }[];
    };
    onUpdate: (updates: any) => Promise<boolean>;
}

export function EditTaskDialog({ open, onOpenChange, task, onUpdate }: EditTaskDialogProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">(task.priority);
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [campaignId, setCampaignId] = useState<string>(task.campaignId || "none");
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && user) {
            setTitle(task.title);
            setDescription(task.description || "");
            setPriority(task.priority);
            setCampaignId(task.campaignId || "none");
            setAssignedToIds(task.assignedTo?.map(m => m.uid) || []);

            // Handle Date Format for Input
            if (task.dueDate) {
                try {
                    // If firestore timestamp
                    const dateObj = task.dueDate.seconds
                        ? new Date(task.dueDate.seconds * 1000)
                        : (typeof task.dueDate === 'string' ? new Date(task.dueDate) : null);

                    if (dateObj && !isNaN(dateObj.getTime())) {
                        setDueDate(dateObj);
                    } else {
                        setDueDate(undefined);
                    }
                } catch (e) {
                    console.error("Date parsing error", e);
                    setDueDate(undefined);
                }
            } else {
                setDueDate(undefined);
            }

            // Fetch Campaigns
            loadCampaigns();
            // Fetch Team Members
            loadTeamMembers();
        }
    }, [open, task, user]);

    const loadCampaigns = async () => {
        if (!user) return;
        try {
            const list = await CampaignService.getUserCampaigns({
                uid: user.uid,
                role: user.role || 'guest'
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const updates: any = {
                title,
                description,
                priority,
                campaignId: campaignId === "none" ? null : campaignId,
            };

            // Calculate final assignedTo objects
            if (isAdmin) {
                // Map IDs back to objects
                const finalAssignedTo = assignedToIds.map(id => {
                    const member = teamMembers.find(m => m.uid === id);
                    if (member) return { uid: member.uid, name: member.name };
                    // If it's myself and not in list?
                    if (id === user?.uid) return { uid: user.uid, name: user.name || 'Admin' };
                    return null;
                }).filter(Boolean);
                updates.assignedTo = finalAssignedTo;
            }

            if (dueDate) {
                updates.dueDate = dueDate.toISOString();
            } else {
                // Optionally allow clearing date? 
                // If user clears the date input, we might want to unset it.
                // For now, let's assume clearing means removing the due date if supported by backend.
                // updates.dueDate = null; 
            }

            const success = await onUpdate(updates);
            if (success) {
                toast.success("Task updated successfully");
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update task");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Styles matching Night Sky theme
    const inputClasses = "bg-[#0a0c10] border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-xl h-11 disabled:opacity-50 disabled:cursor-not-allowed";
    const labelClasses = "uppercase text-[10px] font-bold tracking-widest text-white/50 mb-1.5 block";

    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isSuperAdmin = (user as any)?.isSuperAdmin || user?.email === 'media@thaibagarden.com';
    const isTeam = user?.role === 'team';
    const isGuest = user?.role === 'guest';

    const taskCreatorId = (task as any).createdBy?.uid || (task as any).createdBy;
    const isCreator = user?.uid === taskCreatorId;

    const canEditContent = isAdmin || isSuperAdmin || isCreator;

    // Priority:
    // Guest: NEVER (isGuest check enforced)
    // Team: Only if creator
    // Admin: Always
    const canEditPriority = isAdmin || isSuperAdmin || (isTeam && isCreator);

    // Status: 
    // Team: Always (for assigned tasks or general tasks) - User said "Team members can only change the status... on tasked created by other users"
    // Guest: "other task are are view only" -> No status change for others.
    const canEditStatus = isAdmin || isSuperAdmin || isTeam || isCreator;

    // Meta (Priority, Date, etc.) - Alias to priority logic for now
    const canEditMeta = isAdmin || isSuperAdmin || (isTeam && isCreator);

    const canSave = canEditContent || canEditPriority || canEditStatus;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-[150] sm:max-w-md bg-[#10111a] text-white border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-6 rounded-[24px]">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl text-blue-500", canSave ? "bg-blue-600/10" : "bg-white/5 text-white/50")}>
                            {canSave ? <Edit3 size={20} /> : <Layers size={20} />}
                        </div>
                        {canSave ? "Edit Task" : "Task Details"}
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
                        <Label className={labelClasses}>Task Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClasses}
                            placeholder="What needs to be done?"
                            disabled={!canEditContent}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className={labelClasses}>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={cn(
                                "bg-[#0a0c10] border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-blue-500/10 transition-all rounded-xl min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
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
                                disabled={!isAdmin && !isSuperAdmin && !canEditMeta}
                            >
                                <SelectTrigger className="bg-[#0a0c10] border-white/10 text-white focus:ring-blue-500/10 h-11 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0c10] border-white/10 text-white z-[200]">
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
                                            className="w-full justify-between bg-[#0a0c10] border-white/10 text-white hover:bg-white/5 hover:text-white h-11 rounded-xl"
                                        >
                                            <span className="truncate">
                                                {assignedToIds.length === 0
                                                    ? "Unassigned"
                                                    : `${assignedToIds.length} Member${assignedToIds.length === 1 ? '' : 's'}`}
                                            </span>
                                            <Users size={16} className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0 bg-[#0a0c10] border-white/10 text-white shadow-xl" align="start">
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
                                        disabled={!isAdmin && !isSuperAdmin && !canEditMeta}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-[#0a0c10] border-white/10 text-white hover:bg-white/5 hover:text-white h-11 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed",
                                            !dueDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#10111a] border-white/10 text-white z-[200]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
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
                        <Select value={campaignId} onValueChange={setCampaignId} disabled={!canEditContent}>
                            <SelectTrigger className="bg-[#0a0c10] border-white/10 text-white focus:ring-blue-500/10 h-11 rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="flex items-center gap-2 truncate">
                                    <Layers size={14} className="text-white/50" />
                                    <SelectValue placeholder="Select Campaign" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0c10] border-white/10 text-white">
                                <SelectItem value="none" className="text-white/50 italic">No Campaign</SelectItem>
                                {campaigns.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
        </Dialog >
    );
}
