'use client';

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

import { TaskService } from '@/services/tasks'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from "sonner"
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog'
import { AttachmentSection } from '@/components/tasks/AttachmentSection'
import { getRelativeTime, getInitials, formatDate as formatDisplayDate } from '@/lib/utils'

import { Task } from '@/types/task';
import { CampaignService } from '@/services/campaignService'

// --- Mock Data / Interfaces ---
interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string; // ISO
}

export default function TasksViewClient() {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading task...</div>}>
            <TaskViewContent />
        </Suspense>
    )
}

function TaskViewContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
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

    const loadTask = async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            const data = await TaskService.getTask(taskId);
            if (data) {
                setTask(data);
                if (data.campaignId) {
                    loadCampaignName(data.campaignId);
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

    const loadCampaignName = async (campaignId: string) => {
        try {
            const campaign = await CampaignService.getCampaign(campaignId);
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
            toast.success("Task updated");
            return true;
        } catch (e) {
            console.error(e);
            toast.error("Failed to update task");
            return false;
        }
    };

    const handleDeleteTask = async () => {
        if (!task) return;
        if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) return;

        try {
            await TaskService.deleteTask(task.id);
            toast.success("Task deleted");
            router.push('/tasks');
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
            userId: user?.uid || 'guest',
            userName: user?.name || 'Guest',
            content: newComment,
            createdAt: new Date().toISOString()
        };
        setComments([mockComment, ...comments]);
        setNewComment("");
        toast.success("Comment posted");
    };

    const getPriorityColor = (p: string) => {
        switch (p?.toLowerCase()) {
            case 'urgent': return 'bg-red-500 text-white border-red-400';
            case 'high': return 'bg-orange-500 text-white border-orange-400';
            case 'medium': return 'bg-yellow-500 text-black border-yellow-400';
            case 'low': return 'bg-blue-500 text-white border-blue-400';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'in_progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'review': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'blocked': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const resolveUserName = (u: any) => {
        if (!u) return 'Unknown';
        if (typeof u === 'string') return 'User';
        return u.name || u.email || 'User';
    };


    if (loading) return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Loading task details...</p>
            </div>
        </div>
    );

    if (error || !task) return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center flex-col gap-4">
            <AlertCircle className="h-12 w-12 text-red-500/50" />
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Task Not Found</h3>
                <p className="text-muted-foreground">{error || "The task you requested does not exist or you lack permission."}</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/tasks')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
            </Button>
        </div>
    );

    const isAdmin = user?.role === 'admin';
    const isOwner = user?.uid === (typeof task.createdBy === 'string' ? task.createdBy : task.createdBy?.uid);
    const canEdit = isAdmin || isOwner || user?.role === 'team';

    return (
        <div className="flex flex-col h-full bg-[#0a0c10] text-white">
            <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0c10]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0c10]/60">
                <div className="flex items-center justify-between p-4 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full -ml-2"
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
                                className="hidden sm:flex h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white"
                                onClick={() => setIsEditOpen(true)}
                            >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Task
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#10111a] border-[#ffffff1a] text-white">
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
                                        <DropdownMenuSeparator className="bg-white/10" />
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

                    <div className="flex flex-wrap items-center gap-4 bg-[#10111a] p-4 rounded-2xl border border-white/5 shadow-sm">
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
                            <DropdownMenuContent align="start" className="bg-[#10111a] border-[#ffffff1a] text-white">
                                {['pending', 'in_progress', 'review', 'completed', 'blocked'].map(s => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                                        <span className={cn("capitalize", task.status === s && "font-bold text-blue-400")}>
                                            {s.replace('_', ' ')}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Badge variant="outline" className={cn("rounded-full px-3 py-1 border-0 capitalize font-medium", getPriorityColor(task.priority))}>
                            {task.priority || 'Normal'}
                        </Badge>
                        {task.dueDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 ml-auto sm:ml-0">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>Due {formatDisplayDate(task.dueDate)}</span>
                            </div>
                        )}
                        <div className="ml-auto hidden sm:flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                    task.assignedTo.map((u: any, i: number) => (
                                        <Badge key={i} variant="secondary" className="rounded-full h-8 w-8 p-0 flex items-center justify-center border-2 border-[#10111a] bg-gray-800 text-xs">
                                            {getInitials(u.name || u.email)}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-500 italic">Unassigned</span>
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
                                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed bg-[#10111a] p-6 rounded-2xl border border-white/5">
                                    {task.description ? (
                                        <p className="whitespace-pre-wrap">{task.description}</p>
                                    ) : (
                                        <p className="italic text-gray-600">No description provided.</p>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Paperclip className="h-5 w-5 text-purple-500" /> Attachments
                                    </h3>
                                </div>

                                <div className="bg-[#10111a] p-6 rounded-2xl border border-white/5">
                                    <AttachmentSection
                                        task={task}
                                        onUpdate={() => loadTask()}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="space-y-6">

                            <Card className="bg-[#10111a] border-white/5 shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-widest">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created By</span>
                                        <span className="text-gray-200">{resolveUserName(task.createdBy)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created On</span>
                                        <span className="text-gray-200">
                                            {task.createdAt?.seconds ? formatDisplayDate(task.createdAt) : 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phase</span>
                                        <span className="text-gray-200 capitalize">{task.phase || 'N/A'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-green-500" /> Discussion
                                </h3>
                                <div className="bg-[#10111a] rounded-2xl border border-white/5 overflow-hidden">
                                    <div className="p-4 space-y-4">
                                        <div className="text-center py-8 text-gray-600 text-sm">
                                            No recent activity.
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
                                        <Input
                                            className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-gray-600"
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

            {isEditOpen && (
                <EditTaskDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    task={task}
                    onUpdate={handleUpdateTask}
                />
            )}
        </div>
    )
}
