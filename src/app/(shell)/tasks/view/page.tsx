'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/apiClient'
import { UserService } from '@/services/userService'
import { MediaService } from '@/services/mediaService'
import { DriveFile } from '@/types/file'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UploadModal } from '@/components/files/UploadModal'
import { ArrowLeft, Calendar, Clock, User as UserIcon, Flag, CheckCircle, Send, MoreHorizontal, UploadCloud, Edit, Layers } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog'
import { format, parseISO } from 'date-fns'
import { TaskMediaGallery } from '@/components/media/TaskMediaGallery'
import { MediaLightbox } from '@/components/media/MediaLightbox'
import { SafeAvatar } from '@/components/ui/SafeAvatar'
import { getRelativeTime } from '@/lib/utils'
import { DeliverableService } from '@/services/deliverableService'
import { NotificationService } from '@/services/notificationService'
// Define the task type based on what we know from Firebase
interface FirebaseTask {
    id: string
    title: string
    description?: string
    status: 'todo' | 'in_progress' | 'review' | 'done' | 'pending'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: any // Firestore Timestamp
    campaignId?: string
    createdBy: string | { // Can be string (legacy/API) or object
        uid: string
        name: string
    }
    assignedTo?: (string | { // Can be string (legacy) or object
        uid: string
        name: string
        avatarUrl?: string
    })[]
    createdAt: any // Firestore Timestamp
    firstDeliverableAt?: any // Firestore Timestamp
    activity?: TaskActivity[]
}

interface TaskActivity {
    id: string
    type: 'comment'
    userId: string
    userName: string
    content: string
    timestamp: any // Firestore Timestamp
    label?: string
}

interface TeamMember {
    uid: string
    displayName: string
    avatarUrl?: string
}

function TaskDetailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const { user: currentUser } = useAuth()
    const [task, setTask] = useState<FirebaseTask | null>(null)
    const [loading, setLoading] = useState(true)
    const [comment, setComment] = useState('')
    const [updating, setUpdating] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<DriveFile[]>([])
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    // Team Assignment State
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [selectedAssignee, setSelectedAssignee] = useState<string>('')
    const [creatorName, setCreatorName] = useState<string>('')
    const [creatorAvatar, setCreatorAvatar] = useState<string | undefined>(undefined)
    const [campaignName, setCampaignName] = useState<string | null>(null)
    useEffect(() => {
        if (id) {
            Promise.all([fetchTask(), fetchTeamMembers(), fetchMediaFiles()])
        } else {
            // Wait for ID to be available, or handle missing ID gracefully
            if (loading && !id) {
                // Might be initial load
            } else if (!loading && !id) {
                router.push('/tasks')
            }
        }
    }, [id])
    const fetchTask = async () => {
        if (!id) return;
        try {
            const data = await apiClient(`/api/tasks/${id}`, {
                method: 'GET'
            });
            if (data) {
                console.log('[DEBUG-TASK] Raw Data:', data); // DEBUG
                console.log('[DEBUG-TASK] Assigned To Data:', JSON.stringify(data.assignedTo, null, 2)); // DEBUG
                setTask(data as FirebaseTask)

                // Robust Creator Name Resolution
                if (data.createdBy) {
                    const uid = typeof data.createdBy === 'string' ? data.createdBy : data.createdBy.uid;
                    const cachedName = typeof data.createdBy === 'string' ? null : data.createdBy.name;

                    if (!cachedName || cachedName === 'Unknown') {
                        fetchCreatorProfile(uid);
                    } else {
                        setCreatorName(cachedName);
                    }
                }

                // Fetch Campaign Name if linked
                if (data.campaignId) {
                    try {
                        const { CampaignService } = await import('@/services/campaignService');
                        const campaign = await CampaignService.getCampaign(data.campaignId);
                        if (campaign) setCampaignName(campaign.name);
                    } catch (e) {
                        console.error("Failed to fetch linked campaign", e);
                    }
                }
            } else {
                toast.error('Task not found')
                router.push('/tasks')
            }
        } catch (error) {
            console.error('Error fetching task:', error)
            toast.error('Failed to load task')
        } finally {
            setLoading(false)
        }
    }

    const fetchCreatorProfile = async (uid: string) => {
        try {
            const userData = await apiClient(`/api/users/${uid}`, {
                method: 'GET'
            });
            if (userData) {
                setCreatorName(userData.officialName || userData.displayName || userData.name || 'MediaHive Member');
                setCreatorAvatar(userData.avatarUrl || userData.photoURL);
            } else {
                setCreatorName('System User');
            }
        } catch (err) {
            console.error("Error fetching creator:", err);
            setCreatorName('System User');
        }
    }

    const fetchTeamMembers = async () => {
        try {
            const members = await UserService.getTeamMembers()
            // Map generic User type to our TeamMember interface
            const mappedMembers = members.map(m => ({
                uid: m.uid,
                displayName: m.name || 'MediaHive Member',
                avatarUrl: m.avatarUrl || m.photoURL // Using photoURL as fallback
            }))

            setTeamMembers(mappedMembers)
        } catch (error) {
            console.error('Error fetching team members:', error)
        }
    }

    const fetchMediaFiles = async () => {
        if (!id || !currentUser) return;

        try {
            const files = await MediaService.getFilesForTask(id);
            setMediaFiles(files);
        } catch (error) {
            console.error('Error fetching media files:', error);
        }
    }

    // Helper to format dates handling both Timestamp and ISO strings
    const formatDate = (dateValue: any, formatStr: string = 'MMM dd, yyyy') => {
        if (!dateValue) return 'N/A';
        try {
            if (dateValue.seconds) {
                return format(new Date(dateValue.seconds * 1000), formatStr);
            }
            if (typeof dateValue === 'string') {
                return format(parseISO(dateValue), formatStr);
            }
            return 'N/A';
        } catch (e) {
            return 'Error';
        }
    }

    // Helper to resolve user name from ID or Object
    const resolveUserName = (user: string | { uid: string, name: string } | undefined) => {
        if (!user) return 'Unassigned';
        if (typeof user === 'string') {
            const member = teamMembers.find(m => m.uid === user);
            return member ? member.displayName : 'System Member'; // Could fetch profile if not in team
        }
        return user.name || 'System Member';
    }

    const updateTaskDirectly = async (updates: Partial<FirebaseTask> | { assignedTo: any[] }): Promise<boolean> => {
        if (!task || !currentUser) return false
        if (!id) return false

        try {
            setUpdating(true)

            await apiClient(`/api/tasks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    updatedBy: {
                        uid: currentUser.uid,
                        name: currentUser.officialName || currentUser.name || currentUser.email || 'Unknown'
                    }
                })
            });

            // Refetch to sync
            fetchTask();
            return true;
        } catch (error) {
            console.error('Error updating task:', error)
            toast.error('Failed to update task offline')
            return false;
        } finally {
            setUpdating(false)
        }
    }

    const handleStatusChange = async (newStatus: FirebaseTask['status']) => {
        const success = await updateTaskDirectly({ status: newStatus });
        if (success) {
            toast.success(`Task marked as ${newStatus}`);

            // Notification: Task Approved (Pending -> Todo)
            // Notify the Creator
            if (!task) return;
            const creatorUid = typeof task.createdBy === 'string' ? task.createdBy : task.createdBy?.uid;

            if (newStatus === 'todo' && task?.status === 'pending' && creatorUid) {
                try {
                    const { NotificationService } = await import('@/services/notificationService');
                    await NotificationService.createNotification({
                        userId: creatorUid,
                        sourceUserId: currentUser!.uid,
                        type: 'status_changed', // Maps to "Request Approved"
                        title: 'Request Approved',
                        message: `Your request "${task.title}" has been approved.`,
                        entityType: 'task',
                        entityId: task.id,
                        actionUrl: `/tasks/view?id=${task.id}`,
                        priority: 'medium'
                    });
                } catch (e) {
                    console.error("Failed to send approval notification", e);
                }
            }
        }
    }

    const handleAssignMember = async (memberUserId: string) => {
        if (!memberUserId) return;

        // Find member details
        const selectedMember = teamMembers.find(m => m.uid === memberUserId);
        if (!selectedMember) {
            toast.error("Member not found");
            return;
        }

        // Find existing IDs
        const currentAssigned = task?.assignedTo || [];
        const existingIds = currentAssigned.map(u => typeof u === 'string' ? u : u.uid);

        // Prevent duplicate
        if (existingIds.includes(memberUserId)) {
            toast.info("User already assigned");
            return;
        }

        // Add new member to list as OBJECT
        const newAssignees = [
            ...currentAssigned.map(u => typeof u === 'string' ? { uid: u, name: resolveUserName(u) } : u), // Normalize existing
            { uid: selectedMember.uid, name: selectedMember.displayName }
        ];

        const success = await updateTaskDirectly({ assignedTo: newAssignees });
        if (success) {
            toast.success("Team member assigned");
            setSelectedAssignee(''); // Reset dropdown

            // Notification Logic
            try {
                const { NotificationService } = await import('@/services/notificationService');

                // 1. Notify Assignee
                await NotificationService.createNotification({
                    userId: selectedMember.uid, // The new assignee
                    sourceUserId: currentUser!.uid, // The assigner (Admin)
                    type: 'task_assigned',
                    title: 'New Assignment',
                    message: `You have been assigned to "${task?.title}"`,
                    entityType: 'task',
                    entityId: task!.id,
                    actionUrl: `/tasks/view?id=${task!.id}`,
                    priority: 'high'
                });

                // 2. Notify Creator (if not self)
                const creatorUid = typeof task?.createdBy === 'string' ? task.createdBy : task?.createdBy?.uid;

                if (creatorUid && creatorUid !== currentUser!.uid) {
                    await NotificationService.createNotification({
                        userId: creatorUid,
                        sourceUserId: currentUser!.uid,
                        type: 'task_assigned',
                        title: 'Team Member Assigned',
                        message: `${selectedMember.displayName} has been assigned to your request.`,
                        entityType: 'task',
                        entityId: task!.id,
                        actionUrl: `/tasks/view?id=${task!.id}`,
                        priority: 'medium'
                    });
                }

            } catch (e) {
                console.error("Failed to send assignment notifications", e);
            }
        }
    }

    const handleAddComment = async () => {
        if (!task || !comment.trim() || !currentUser) return
        if (!id) return;

        try {
            setUpdating(true)
            let activityLabel: string | undefined;

            // Correction Logic: If Guest + Task has Deliverables
            if ((currentUser.role as any) === 'guest') {
                try {
                    const deliverables = await DeliverableService.getDeliverables(id);
                    if (deliverables.length > 0) {
                        activityLabel = 'Correction Requested';
                    }
                } catch (e) {
                    console.error("Failed to check deliverables for correction logic", e);
                }
            }

            const newActivity: TaskActivity = {
                id: crypto.randomUUID(),
                type: 'comment',
                userId: currentUser.uid,
                userName: currentUser.name || currentUser.email || 'User',
                content: comment,
                timestamp: new Date().toISOString(),
                ...(activityLabel ? { label: activityLabel } : {})
            };

            await apiClient(`/api/tasks/${id}/comments`, {
                method: 'POST',
                body: JSON.stringify({
                    activity: newActivity
                })
            });

            setComment('')
            toast.success('Comment added')

            // Notification for Correction Request
            if (activityLabel === 'Correction Requested' && task.assignedTo && task.assignedTo.length > 0) {
                const assigneeIds = task.assignedTo.map(u => typeof u === 'string' ? u : u.uid);
                // Filter out self if guest is somehow assigned (unlikely but safe)
                const targets = assigneeIds.filter(uid => uid !== currentUser.uid);

                if (targets.length > 0) {
                    await NotificationService.createBatchNotifications(targets, {
                        sourceUserId: currentUser.uid,
                        type: 'task_comment', // Or specific type if available
                        title: 'Correction Requested',
                        message: `Guest ${currentUser.name || 'User'} requested a correction on "${task.title}"`,
                        entityType: 'task',
                        entityId: task.id,
                        actionUrl: `/tasks/view?id=${task.id}`,
                        priority: 'high' // Corrections are high priority
                    });
                }
            }

            fetchTask(); // Refresh UI
        } catch (error) {
            console.error("Comment add failed", error);
            toast.error('Failed to add comment')
        } finally {
            setUpdating(false)
        }
    }

    // PHASE 6.3 — Explicit Auto-Complete (Admin-Only, Optional)
    const handleExplicitComplete = async () => {
        if (!task || !id || !currentUser) return;

        // Only admins can explicitly complete tasks
        if (currentUser.role !== 'admin') {
            toast.error('Only administrators can explicitly complete tasks');
            return;
        }

        try {
            setCompleting(true);

            // Check if task has media and approved media before attempting completion
            const hasMedia = mediaFiles.length > 0;
            const hasApprovedMedia = mediaFiles.some(file =>
                file.proofingStatus === 'approved' && file.isActiveVersion);

            if (!hasMedia) {
                toast.error('Task must have linked media to be completed');
                return;
            }

            if (!hasApprovedMedia) {
                toast.error('Task must have approved media to be completed');
                return;
            }

            // Call the API endpoint to explicitly complete the task
            const result = await apiClient(`/api/tasks/${id}/complete`, {
                method: 'POST',
            });

            if (result.error) {
                throw new Error(result.error || 'Failed to complete task');
            }

            toast.success('Task completed successfully');
            fetchTask(); // Refresh UI to show updated status
            fetchMediaFiles(); // Refresh media files to show updated status
        } catch (error) {
            console.error('Error completing task:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to complete task');
        } finally {
            setCompleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!task) return <div className="p-8 text-center text-muted-foreground pt-24">Task not found</div>

    const isCurrentUserCreator = currentUser?.uid ? (typeof task.createdBy === 'string' ? task.createdBy === currentUser.uid : task.createdBy?.uid === currentUser.uid) : false;
    const canManage = currentUser && (currentUser.role === 'admin' || (currentUser.role as any) === 'manager');

    return (
        <div className="container mx-auto px-4 max-w-6xl min-h-screen flex flex-col">
            {/* Spacer to push content below fixed TopBar */}
            <div className="h-32 w-full shrink-0" aria-hidden="true" />

            <div className="mb-6 flex items-center justify-between mt-4">
                <Button variant="ghost" onClick={() => router.back()} className="hover:bg-secondary/50">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Tasks
                </Button>
                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 text-white">
                            <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Task Details
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Content - Left Column (8/12) */}
                <div className="lg:col-span-8 space-y-6">

                    <Card className="border-none overflow-hidden relative group
                        bg-gradient-to-br from-[#141e30] to-[#243b55]
                        shadow-[5px_10px_50px_rgba(0,0,0,0.5),-5px_0px_250px_rgba(0,0,0,0.5)]
                        rounded-[15px]
                        text-white
                    ">
                        {/* Vibrant Header Banner */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${task.status === 'done' ? 'from-green-400 to-emerald-600' :
                            task.status === 'in_progress' ? 'from-purple-400 to-blue-600' :
                                task.status === 'pending' ? 'from-amber-400 to-orange-600' :
                                    task.priority === 'urgent' ? 'from-red-400 to-rose-600' :
                                        'from-blue-300 to-indigo-400'
                            }`} />

                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight mb-3 text-white drop-shadow-md">{task.title}</h1>
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        <Badge variant="outline" className={`capitalize px-3 py-1 border-white/20 bg-white/10 backdrop-blur-md text-white shadow-sm`}>
                                            {task.status === 'in_progress' ? 'On It' : task.status.replace('_', ' ')}
                                        </Badge>

                                        {/* Priority Badge - Custom Styled */}
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500/20 text-red-200 border border-red-500/30' :
                                            task.priority === 'medium' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' :
                                                'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                                            }`}>
                                            <Flag className="w-3 h-3" />
                                            {task.priority}
                                        </div>

                                        <div className="flex items-center text-blue-200/80 bg-white/5 px-3 py-1 rounded-full text-xs border border-white/10" title="Due Date">
                                            <Calendar className="mr-1.5 h-3 w-3" />
                                            {formatDate(task.dueDate)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-300/70 mb-3 ml-1">Description</h3>
                                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-blue-50 text-base leading-relaxed shadow-inner">
                                    {task.description || <span className="italic text-white/40">No description provided.</span>}
                                </div>
                            </div>

                            {/* Linked Campaign Badge */}
                            {campaignName && (
                                <div className="mb-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-300/70 mb-2 ml-1">Campaign</h3>
                                    <div
                                        onClick={() => task.campaignId && router.push(`/campaigns/${task.campaignId}`)}
                                        className="bg-blue-500/10 border border-blue-500/20 text-blue-200 px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-blue-500/20 transition-colors w-full"
                                    >
                                        <div className="bg-blue-500/20 p-2 rounded-lg">
                                            <Layers className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{campaignName}</p>
                                            <p className="text-[10px] text-blue-300/50 uppercase tracking-wider">Click to view campaign</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group/box">
                                    <h3 className="text-[10px] font-bold uppercase text-blue-300/60 mb-2 tracking-wider">Created By</h3>
                                    <div className="flex items-center gap-3">
                                        <SafeAvatar
                                            name={creatorName || '?'}
                                            alt={creatorName || 'Creator'}
                                            src={creatorAvatar || teamMembers.find(m => (typeof task.createdBy === 'string' ? task.createdBy : task.createdBy.uid) === m.uid)?.avatarUrl}
                                            size="md"
                                            className="ring-2 ring-white/20 group-hover/box:ring-white/40 shadow-lg"
                                        />
                                        <span className="font-medium text-white group-hover/box:text-blue-200 transition-colors">{creatorName || 'Loading...'}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group/box">
                                    <h3 className="text-[10px] font-bold uppercase text-blue-300/60 mb-2 tracking-wider">Assigned To</h3>
                                    <div className="flex -space-x-3 overflow-hidden py-1 items-center pl-1">
                                        {task.assignedTo && task.assignedTo.length > 0 ? (
                                            task.assignedTo.map((assignee, i) => {
                                                const name = resolveUserName(assignee);
                                                const uid = typeof assignee === 'string' ? assignee : assignee.uid;
                                                // 1. Try finding by UID (Best)
                                                let teamMember = teamMembers.find(m => m.uid === uid);

                                                // 2. If not found (e.g. deleted user replaced by new one), try Name Match
                                                if (!teamMember && typeof assignee !== 'string' && assignee.name) {
                                                    teamMember = teamMembers.find(m => m.displayName === assignee.name);
                                                }

                                                const avatarUrl = (typeof assignee === 'object' ? assignee.avatarUrl : undefined) || teamMember?.avatarUrl;
                                                // ... rest of rendering

                                                return (
                                                    <div key={i} className="" title={name}>
                                                        <SafeAvatar
                                                            src={avatarUrl}
                                                            name={name}
                                                            alt={name || 'Assignee'}
                                                            size="md"
                                                            className="w-10 h-10 ring-2 ring-[#1e2a3b] shadow-lg transform hover:-translate-y-1 transition-transform relative z-0 hover:z-10 bg-gradient-to-br from-indigo-500 to-purple-600"
                                                        />
                                                        {/* Debug Info */}
                                                        {/* <div className="text-[10px] text-white/50">{JSON.stringify(assignee)}</div> */}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-sm text-white/40 italic">Unassigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group/box">                                    <h3 className="text-[10px] font-bold uppercase text-blue-300/60 mb-2 tracking-wider">Due Date</h3>
                                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                                        <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-300 group-hover/box:text-blue-200">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        {task.dueDate ? (
                                            <div>
                                                <div>{formatDate(task.dueDate)}</div>
                                                <div className="text-xs text-white/60 mt-1">{getRelativeTime(task.dueDate)}</div>
                                            </div>
                                        ) : 'No due date'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none
                        bg-gradient-to-br from-[#141e30] to-[#243b55]
                        shadow-[5px_10px_50px_rgba(0,0,0,0.5),-5px_0px_250px_rgba(0,0,0,0.5)]
                        rounded-[15px]
                        text-white
                    ">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white text-xl">
                                <span>Activity & Comments</span>
                                <span className="bg-white/10 text-blue-200 text-xs px-2 py-0.5 rounded-full border border-white/10">{task.activity?.length || 0}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-8 relative group/input">
                                <Textarea
                                    placeholder="Write a comment..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="min-h-[100px] bg-white/5 border-white/10 focus:border-blue-400/50 focus:bg-white/10 resize-none pr-12 pb-10 placeholder:text-white/20 text-white rounded-xl transition-all"
                                />
                                <div className="absolute bottom-3 right-3 opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        onClick={handleAddComment}
                                        disabled={!comment.trim() || updating}
                                        className="h-9 w-9 p-0 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {(task.activity || []).length === 0 ? (
                                    <div className="text-center py-10 opacity-50">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-3 border border-white/10">
                                            <MoreHorizontal className="h-6 w-6 text-white" />
                                        </div>
                                        <p className="text-white text-sm">No recent activity</p>
                                    </div>
                                ) : (
                                    (task.activity || []).slice().reverse().map((activity) => (
                                        <div key={activity.id} className="flex gap-4 group/activity">
                                            <div className="mt-1">
                                                <SafeAvatar
                                                    name={activity.userName}
                                                    alt={activity.userName || 'User'}
                                                    size="sm"
                                                    className="ring-1 ring-white/10"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="font-semibold text-sm text-blue-100">{activity.userName}</span>
                                                    <span className="text-[10px] text-white/40 uppercase tracking-wide">
                                                        {getRelativeTime(activity.timestamp)}
                                                    </span>
                                                </div>
                                                {activity.label && (
                                                    <div className="mb-2">
                                                        <Badge variant="destructive" className="text-[10px] uppercase tracking-wide font-bold bg-red-500/20 text-red-200 border-red-500/50">
                                                            {activity.label}
                                                        </Badge>
                                                    </div>
                                                )}
                                                <div className="text-sm text-white/90 bg-white/5 p-3.5 rounded-2xl rounded-tl-none border border-white/5 group-hover/activity:bg-white/10 transition-colors">
                                                    {activity.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media Gallery Section */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Media Gallery
                        </h2>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setUploadModalOpen(true)}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload Media
                        </Button>
                    </div>

                    <TaskMediaGallery
                        files={mediaFiles}
                        onFileSelect={setSelectedFile}
                    />

                    {/* Lightbox Modal */}
                    {selectedFile && (
                        <MediaLightbox
                            file={selectedFile}
                            files={mediaFiles}
                            onClose={() => setSelectedFile(null)}
                            onNavigate={setSelectedFile}
                        />
                    )}

                    <UploadModal
                        open={uploadModalOpen}
                        onClose={() => setUploadModalOpen(false)}
                        onSuccess={async () => {
                            fetchMediaFiles();
                            toast.success("File uploaded successfully");

                            // Update Task Timestamp & First Deliverable
                            if (task && id) {
                                try {
                                    const updates: any = { updatedAt: new Date().toISOString() };
                                    if (!task.firstDeliverableAt) {
                                        updates.firstDeliverableAt = new Date().toISOString();
                                    }
                                    await updateTaskDirectly(updates);
                                } catch (e) {
                                    console.error("Failed to update task timestamps after upload", e);
                                }
                            }
                        }}
                        taskId={id || undefined}
                    />

                    {task && (
                        <EditTaskDialog
                            open={editDialogOpen}
                            onOpenChange={setEditDialogOpen}
                            task={task as any}
                            onUpdate={updateTaskDirectly}
                        />
                    )}
                </div>

                {/* Sidebar - Right Column (4/12) */}                <div className="lg:col-span-4 space-y-6">
                    {/* Actions Card */}
                    {currentUser && (isCurrentUserCreator || canManage) && (
                        <Card className="border-none
                            bg-gradient-to-br from-[#141e30] to-[#243b55]
                            shadow-[5px_10px_50px_rgba(0,0,0,0.5),-5px_0px_250px_rgba(0,0,0,0.5)]
                            rounded-[15px]
                            text-white
                        ">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-white font-bold tracking-tight">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {task.status === 'pending' && canManage ? (
                                    <Button
                                        variant="default"
                                        onClick={() => handleStatusChange('todo')}
                                        disabled={updating}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-900/20 border-0 h-12 rounded-xl text-base transition-all hover:scale-[1.02]"
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Approve Task
                                    </Button>
                                ) : (
                                    <>
                                        {(task.status || 'todo') !== 'todo' && task.status !== 'pending' && (
                                            <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 hover:bg-white/10 text-white h-11" onClick={() => handleStatusChange('todo')} disabled={updating}>
                                                Mark as Todo
                                            </Button>
                                        )}
                                        {(task.status || 'todo') !== 'in_progress' && task.status !== 'pending' && (
                                            <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-200 text-white h-11" onClick={() => handleStatusChange('in_progress')} disabled={updating}>
                                                Mark In Progress
                                            </Button>
                                        )}
                                        {(task.status || 'todo') !== 'done' && (
                                            <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-200 text-white h-11" onClick={() => handleStatusChange('done')} disabled={updating}>
                                                Mark as Done
                                            </Button>
                                        )}
                                    </>
                                )}

                                {/* PHASE 6.3 — Explicit Auto-Complete (Admin-Only, Optional) */}
                                {canManage && currentUser?.role === 'admin' && task.status !== 'done' && (
                                    <Button
                                        variant="default"
                                        onClick={handleExplicitComplete}
                                        disabled={completing || mediaFiles.length === 0}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold shadow-lg shadow-purple-900/20 border-0 h-12 rounded-xl text-base transition-all hover:scale-[1.02] mt-3"
                                    >
                                        {completing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Completing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-5 w-5" />
                                                Complete with Approved Media
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Team Card */}
                    <Card className="border-none
                        bg-gradient-to-br from-[#141e30] to-[#243b55]
                        shadow-[5px_10px_50px_rgba(0,0,0,0.5),-5px_0px_250px_rgba(0,0,0,0.5)]
                        rounded-[15px]
                        text-white
                    ">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-white font-bold tracking-tight">Assigned Team</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                {task.assignedTo && task.assignedTo.length > 0 ? (
                                    task.assignedTo.map((assignee, index) => {
                                        const name = resolveUserName(assignee);
                                        const uid = typeof assignee === 'string' ? assignee : assignee.uid;

                                        // 1. Try finding by UID (Best)
                                        let teamMember = teamMembers.find(m => m.uid === uid);

                                        // 2. If not found (e.g. deleted user replaced by new one), try Name Match
                                        if (!teamMember && typeof assignee !== 'string' && assignee.name) {
                                            teamMember = teamMembers.find(m => m.displayName === assignee.name);
                                        }

                                        const avatarUrl = (typeof assignee === 'object' ? assignee.avatarUrl : undefined) || teamMember?.avatarUrl;

                                        return (
                                            <div key={uid + index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group/member">
                                                <SafeAvatar
                                                    src={avatarUrl}
                                                    name={name}
                                                    alt={name || 'Team Member'}
                                                    size={36}
                                                    className="ring-2 ring-indigo-500/30"
                                                />
                                                <span className="text-sm font-medium text-blue-100 group-hover/member:text-white transition-colors">{name}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.02] text-white/40 text-sm">
                                        No team members assigned
                                    </div>
                                )}
                            </div>

                            {canManage && (
                                <div className="pt-4 border-t border-white/10">
                                    <Label className="text-[10px] font-bold text-blue-300/60 mb-3 block uppercase tracking-wider">Add Member</Label>
                                    <div className="flex gap-2">
                                        <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                                            <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white focus:ring-blue-500/50 h-10">
                                                <SelectValue placeholder="Select member" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1e2a3b] border-white/10 text-white">
                                                {teamMembers.map((member) => (
                                                    <SelectItem key={member.uid} value={member.uid} className="focus:bg-white/10 focus:text-white hover:bg-white/10 cursor-pointer">
                                                        {member.displayName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAssignMember(selectedAssignee)}
                                            disabled={!selectedAssignee || updating}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 px-4 shadow-md"
                                        >
                                            Assign
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function TaskDetailView() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        }>
            <TaskDetailContent />
        </Suspense>
    )
}