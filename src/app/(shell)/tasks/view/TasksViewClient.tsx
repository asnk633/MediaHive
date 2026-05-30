"use client";


import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { nativeNavigate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { format, parseISO } from 'date-fns'
import {
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    Flag,
    User as UserIcon,
    ArrowLeft,
    Share2,
    Download,
    Trash2,
    Edit3,
    Send,
    Plus,
    X,
    FileText,
    MessageSquare,
    Paperclip,
    History,
    Link as LinkIcon
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { supabase } from '@/lib/supabaseClient'
import { AuditService } from '@/services/auditService'
import { useAuth } from '@/contexts/AuthContextProvider'
import { toast } from "sonner"
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog'
import { AttachmentSection } from '@/components/tasks/AttachmentSection'
import { getRelativeTime, getInitials, formatDate as formatDisplayDate } from '@/lib/utils'
import { useTableRealtime } from '@/hooks/useTableRealtime'
import { TABLES } from '@/lib/dbTables'

import { Task } from '@/features/tasks/types/task';
import { CampaignService } from '@/features/campaigns/services/campaignService'
import { TaskService } from '@/services/tasks';

// --- Mock Data / Interfaces ---
interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    created_at: string; // ISO
}

export default function TasksViewClient() {
    return <TaskViewContent />;
}

function TaskViewContent() {
    const router = useRouter()
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
    const taskId = searchParams.get('id')
    const { user } = useAuth()

    const [task, setTask] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Editing State
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Comment State
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    const [campaignName, setCampaignName] = useState<string | null>(null);

    useEffect(() => {
        if (!taskId) {
            setError("No task ID provided");
            setLoading(false);
            return;
        }

        loadTask();
    }, [taskId]);

    // ✨ REAL-TIME UPDATE: Reload when this specific task changes on the server
    useTableRealtime(TABLES.TASKS, (payload) => {
        if (payload.new && payload.new.id === taskId) {
            console.log(`[REALTIME] Auto-refreshing task ${taskId} due to server update.`);
            setTask(payload.new);
            // Re-fetch campaign name if it changed
            if (payload.new.campaign_id !== task?.campaign_id) {
                loadCampaignName(payload.new.campaign_id);
            }
        }
    });

    const loadTask = async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            const data = await TaskService.getTaskById(taskId);
            if (data) {
                setTask(data);
                if (data.campaign_id) {
                    loadCampaignName(data.campaign_id);
                }
            } else {
                setError("Task not found");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load task");
        } finally {
            setLoading(false);
        }
    };

    const loadCampaignName = async (campaign_id: string) => {
        try {
            const campaign = await CampaignService.getCampaign(campaign_id);
            if (campaign) {
                setCampaignName(campaign.name);
            }
        } catch (e) {
            console.error("Failed to load campaign name", e);
        }
    }

    const handleUpdateTask = async (updates: any) => {
        if (!task) return false;
        try {
            await TaskService.updateTask(task.id, updates);
            setTask({ ...task, ...updates });
            toast.success("Updated");
            return true;
        } catch (e) {
            console.error(e);
            toast.error("Failed to update task");
            return false;
        }
    };



    const handleDeleteTask = async () => {
        if (!task) return;

        const reason = (typeof window !== 'undefined') ? prompt("Please provide a reason for deletion (Required for Statutory Compliance):") : null;
        if (!reason) {
            toast.error("Deletion cancelled: Reason is required for audit trails.");
            return;
        }

        if (typeof window !== 'undefined' && !confirm("Are you sure you want to delete this task? This action will be permanently logged.")) return;

        try {
            await TaskService.deleteTask(task.id);

            // PUBLIC SECTOR PASS: Immutable Audit Logging
            await AuditService.logAction('DELETE_TASK', {
                entityId: task.id,
                entityType: 'task',
                reason: reason,
                title: task.title
            });

            toast.success("Task deleted and logged successfully");
            nativeNavigate('/tasks', router, 'TasksView (Delete)');
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete task");
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        await handleUpdateTask({ status: newStatus });
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        const mockComment: Comment = {
            id: Date.now().toString(),
            userId: user?.uid || 'member',
            userName: user?.name || 'Member',
            content: newComment,
            created_at: new Date().toISOString()
        };
        setComments([mockComment, ...comments]);
        setNewComment("");
        toast.success("Comment posted");
    };

    const getPriorityColor = (p: string) => {
        switch (p?.toLowerCase()) {
            case 'urgent':
            case 'high': return 'bg-orange-500 text-foreground border-orange-400';
            case 'medium': return 'bg-yellow-500 text-black border-yellow-400';
            case 'low': return 'bg-blue-500 text-foreground border-blue-400';
            default: return 'bg-gray-700 text-foreground';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'in_progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'review': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'blocked': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-foreground/60 bg-gray-400/10 border-gray-400/20';
        }
    };

    const resolveUserName = (u: any) => {
        if (!u) return 'Unknown';
        if (typeof u === 'string') return 'User';
        return u.name || u.email || 'User';
    };


    if (loading) return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
            <p className="text-foreground/50 font-medium animate-pulse tracking-wide italic">
                Retrieving task details...
            </p>
        </div>
    );

    if (error || !task) return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center flex-col gap-4">
            <AlertCircle className="h-12 w-12 text-red-500/50" />
            <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Task Not Found</h3>
                <p className="text-muted-foreground">{error || "The task you requested does not exist or you lack permission."}</p>
            </div>
            <Button variant="outline" onClick={() => nativeNavigate('/tasks', router, 'TasksView (NotFound Back)')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
            </Button>
        </div>
    );

    const isAdmin = user?.role === 'admin';
    const isOwner = user?.uid === (typeof task.created_by === 'string' ? task.created_by : task.created_by?.uid);
    const canEdit = isAdmin || isOwner || user?.role === 'manager' || user?.role === 'member';

    return (
        <div className="flex flex-col h-full bg-[#0a0c10] text-foreground">
            <div className="sticky top-0 z-10 border-b border-foreground/5 bg-[#0a0c10]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0c10]/60">
                <div className="flex items-center justify-between p-4 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full -ml-2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-semibold tracking-tight line-clamp-1">{task.title}</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{task.id.substring(0, 8)}</span>
                                {campaignName && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Flag className="h-3 w-3" />
                                            {campaignName}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden sm:flex h-9 border-foreground/10 bg-foreground/5 hover:bg-foreground/10 text-foreground"
                                onClick={() => setIsEditOpen(true)}
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Task
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#10111a] border-[#ffffff1a] text-foreground">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Link copied");
                                }}>
                                    <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                    <Edit3 className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <>
                                        <DropdownMenuSeparator className="bg-foreground/10" />
                                        <DropdownMenuItem
                                            className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                                            onClick={handleDeleteTask}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">

                    <div className="flex flex-wrap items-center gap-4 bg-[#10111a] p-4 rounded-2xl border border-foreground/5 shadow-sm">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={!canEdit}>
                                <Button
                                    variant="outline"
                                    className={cn("h-9 border-0 rounded-full px-4 font-medium transition-all", getStatusColor(task.status))}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {task.status?.replace('_', ' ').toUpperCase()}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-[#10111a] border-[#ffffff1a] text-foreground">
                                {['pending', 'in_progress', 'review', 'completed', 'blocked'].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                                        <span className={cn("capitalize", task.status === s && "font-bold text-blue-400")}>
                                            {s.replace('_', ' ')}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Badge variant="neutral" className={cn("rounded-full px-3 py-1 border-0 capitalize font-medium", getPriorityColor(task.priority))}>
                            {task.priority || 'Normal'}
                        </Badge>
                        {task.due_date && (
                            <div className="flex items-center gap-2 text-sm text-foreground/60 ml-auto sm:ml-0">
                                <Clock className="h-4 w-4 text-foreground/50" />
                                <span>Due {formatDisplayDate(task.due_date)}</span>
                            </div>
                        )}
                        <div className="ml-auto hidden sm:flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {task.assigned_to && task.assigned_to.length > 0 ? (
                                    task.assigned_to.map((u: any, i: number) => (
                                        <Badge key={i} variant="neutral" className="rounded-full h-8 w-8 p-0 flex items-center justify-center border-2 border-[#10111a] bg-gray-800 text-xs">
                                            {getInitials(u.name || u.email)}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-foreground/50 italic">Unassigned</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" /> Description
                                </h3>
                                <div className="prose prose-invert max-w-none text-foreground leading-relaxed bg-[#10111a] p-6 rounded-2xl border border-foreground/5">
                                    {task.description ? (
                                        <p className="whitespace-pre-wrap">{task.description}</p>
                                    ) : (
                                        <p className="italic text-foreground/40">No description provided.</p>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-foreground/5" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Paperclip className="h-5 w-5 text-purple-500" /> Attachments
                                    </h3>
                                </div>

                                <div className="bg-[#10111a] p-6 rounded-2xl border border-foreground/5">
                                    <AttachmentSection
                                        task={task}
                                        onUpdate={() => loadTask()}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="space-y-6">

                            <Card className="bg-[#10111a] border-foreground/5 shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-foreground/60 uppercase tracking-widest">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-foreground/50">Created By</span>
                                        <span className="text-foreground">{resolveUserName(task.created_by)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-foreground/50">Created On</span>
                                        <span className="text-foreground">
                                            {task.created_at?.seconds ? formatDisplayDate(task.created_at) : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-foreground/50">Phase</span>
                                        <span className="text-foreground capitalize">{task.phase || 'N/A'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-green-500" /> Discussion
                                </h3>
                                <div className="bg-[#10111a] rounded-2xl border border-foreground/5 overflow-hidden">
                                    <div className="p-4 space-y-4">
                                        <div className="text-center py-8 text-foreground/40 text-sm">
                                            No recent activity.
                                        </div>
                                    </div>
                                    <div className="p-4 bg-foreground/5 border-t border-foreground/5 flex gap-2">
                                        <Input
                                            className="bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-foreground/40"
                                            placeholder="Write a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <Button size="icon" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}
