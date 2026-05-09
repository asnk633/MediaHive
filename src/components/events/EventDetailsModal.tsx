import React, { useState, useEffect } from 'react';
import { Event } from '@/features/events/types/event';
import { MediaService } from '@/services/mediaService';
import { EventService } from '@/features/events/services/eventService';
import { SystemEventService } from '@/features/events/services/systemEventService';
import {
    X, Calendar, Clock, MapPin, Edit2,
    Share2, Trash2, Video, CheckCircle2,
    Info, Briefcase, User, Camera, Package, Repeat
} from 'lucide-react';
import { format } from 'date-fns';
import { EventMediaTab } from '@/components/media/EventMediaTab';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useDevWiring } from '@/hooks/useDevWiring';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useEntityPresence } from '@/hooks/useEntityPresence';
import { PresencePile } from '@/components/collaboration/PresencePile';

interface EventDetailsModalProps {
    event: Event | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete?: (event_id: string) => void;
}

const toJSDate = (ts: any): Date => {
    if (!ts) return new Date();
    if (ts instanceof Date) return ts;
    if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
    if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
    return new Date();
};

import { usePermissions } from '@/hooks/usePermissions';

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose, onEdit, onDelete }) => {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'single' | 'series'>('single');
    const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const { canDeleteEvent, role } = usePermissions();

    // Real-time Presence
    const { activeUsers } = useEntityPresence('event', event?.id);

    useEffect(() => {
        const fetchRelatedTasks = async () => {
            if (!event?.id) return;
            setIsLoadingTasks(true);
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('event_id', event.id)
                    .eq('deleted', false);
                
                if (error) throw error;
                setRelatedTasks(data || []);
            } catch (err) {
                console.error("Error fetching related tasks:", err);
            } finally {
                setIsLoadingTasks(false);
            }
        };

        if (isOpen && event) {
            fetchRelatedTasks();
        }
    }, [isOpen, event?.id]);

    const getDateObject = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            return new Date(dateValue.seconds * 1000);
        }
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
    };

    const eventDate = getDateObject(event?.start_at) || new Date();
    const startTime = getDateObject(event?.start_at);
    const endTime = getDateObject(event?.end_at);

    // Dynamic Permission Checks
    const isCreator = !!event && (typeof event.created_by === 'string' ? event.created_by : event.created_by?.uid) === user?.uid;
    const canManageEvent = ['admin', 'manager', 'member', 'team'].includes(role);
    const allowedToDelete = canDeleteEvent || isCreator;
    const allowedToEdit = canManageEvent || isCreator;

    const confirmDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isDeleting || !event) return;

        // OPTIMISTIC DELETION: Immediate Feedback
        setIsDeleting(true);
        setIsDeleteOpen(false); // Close dialog immediately

        // 1. Notify parent to remove from UI instantly
        if (onDelete) {
            onDelete(event.id);
        }

        // 2. Close the modal immediately
        onClose();

        // 3. Show success message immediately (Optimistic)
        toast.success("Event deleted");

        // 4. Perform actual deletion in background
        try {
            if (event.is_system_event) {
                // System events don't support instances yet
                const realId = event.id.replace(/_\d+$/, '').replace(/_\d{4}-\d{2}-\d{2}$/, '');
                await SystemEventService.deleteSystemEvent(realId);
            } else {
                const isInstance = (event as any).is_recurring_instance;
                const seriesId = (event as any).original_series_id || event.id;

                if (isInstance && deleteMode === 'single') {
                    await EventService.deleteInstance(seriesId, event.start_at);
                } else {
                    const realId = event.id.replace(/_\d+$/, '');
                    await EventService.deleteEvent(realId);
                }
            }
            // Success matches optimistic update. No further action needed.
        } catch (error) {
            console.error("Failed to delete event (Background):", error);
            // If it failed, we should probably alert the user.
            // Since modal is closed, Toast is the best way.
            if (error instanceof Error && !error.message.includes("timed out")) {
                toast.error("Failed to delete event. Please refresh.");
            }
            // Ideally we would revert the UI change here, but that requires complex parent state management.
            // For now, next poll/refresh fixes it.
        }
    };

    useDevWiring('EventDetailsModal', [
        { name: 'Delete Event', handler: () => setIsDeleteOpen(true), visible: !!allowedToDelete, destructive: true, permissionVerified: !!allowedToDelete },
        { name: 'Edit Event', handler: onEdit, visible: !!allowedToEdit },
        { name: 'Close', handler: onClose, visible: true }
    ]);

    if (!event) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="max-w-5xl bg-background border-none p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] rounded-3xl shadow-2xl"
            >

                {/* Screen readers title */}
                <DialogTitle className="sr-only">Event Details: {event.title}</DialogTitle>
                <DialogDescription className="sr-only">
                    Detailed view of the event including time, location, and media coverage options.
                </DialogDescription>

                {/* Header Image/Pattern Area */}
                <div className="h-32 bg-gradient-to-r from-primary/10 to-indigo-500/10 relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[200%] rotate-12 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    </div>
                </div>

                {/* Close Button - Custom positioned */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting || isDeleteOpen}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all z-50 backdrop-blur-md border-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Event Title & Type Badge */}
                <div className="px-8 -mt-10 relative z-10 pb-4 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.is_system_event ? 'bg-amber-500/10 text-amber-500' :
                                    event.type === 'meeting' ? 'bg-blue-500/10 text-blue-500' :
                                        event.type === 'workshop' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                    {event.is_system_event ? 'System Event' : event.type}
                                </span>
                                {event.status === 'pending' && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500">
                                        Pending Approval
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                                {event.title}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-6">
                            <PresencePile users={activeUsers} />
                            <div className="h-8 w-px bg-soft/50 hidden sm:block" />
                            <div className="flex gap-2">
                                <button 
                                    className="p-2.5 text-muted hover:text-foreground hover:bg-surface transition-all rounded-xl border border-transparent hover:border-soft"
                                    title="Copy Link"
                                    onClick={() => {
                                        const url = `${window.location.origin}/events/${event.id}`;
                                        navigator.clipboard.writeText(url);
                                        toast.success("Link copied to clipboard");
                                    }}
                                >
                                    <Share2 size={18} />
                                </button>
                                {allowedToEdit && (
                                    <button
                                        onClick={onEdit}
                                        disabled={isDeleting || isDeleteOpen}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all font-bold text-sm disabled:opacity-50"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 custom-scrollbar min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        {/* Left Column: Main Info */}
                        <div className="md:col-span-3 space-y-8">
                            <section>
                                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info size={14} /> Description
                                </h3>
                                <p className="text-foreground/80 leading-relaxed text-lg">
                                    {event.description || "No description provided."}
                                </p>
                            </section>

                            {/* Media Coverage */}
                            {event.media_coverage && event.media_coverage.length > 0 && (
                                <section className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4">
                                        <Video size={18} /> Media Coverage Requested
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {event.media_coverage.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-white/70 text-sm py-2 px-3 bg-surface rounded-lg whitespace-nowrap">
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Assigned Crew */}
                            {event.crew && event.crew.length > 0 && (
                                <section>
                                    <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} /> Assigned Crew
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {event.crew.map((assignment, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-soft rounded-xl">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                    {assignment.profile?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{assignment.profile?.full_name || 'Team Member'}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{assignment.role || 'Production Crew'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Reserved Equipment */}
                            {event.equipment && event.equipment.length > 0 && (
                                <section>
                                    <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Package size={14} /> Reserved Equipment
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {event.equipment.map((res, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-surface border border-soft rounded-xl">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                    <Camera size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">{res.inventory?.name || 'Equipment'}</p>
                                                    <div className="flex gap-4 mt-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                                                            <Clock size={10} />
                                                            {format(toJSDate(res.reserved_from), 'HH:mm')} - {format(toJSDate(res.reserved_to), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                                                    Reserved
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            {/* Related Tasks */}
                            {relatedTasks.length > 0 && (
                                <section>
                                    <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Briefcase size={14} /> Related Tasks
                                    </h3>
                                    <div className="space-y-3">
                                        {relatedTasks.map((task, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-surface border border-soft rounded-xl group hover:border-primary/50 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                                                            task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            task.status === 'review' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                        )}>
                                                            {task.status}
                                                        </span>
                                                        {task.priority === 'high' || task.priority === 'urgent' && (
                                                            <span className="text-[8px] font-bold text-red-400 uppercase">
                                                                {task.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-white/20 group-hover:text-primary transition-colors">
                                                    View Task →
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Media Gallery */}
                            <section>
                                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Media Gallery</h3>
                                <EventMediaTab event_id={event.id} files={[]} />
                            </section>
                        </div>

                        {/* Right Column: Metadata */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-glass rounded-2xl p-5 space-y-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Date</p>
                                        <p className="text-sm font-semibold text-foreground">{format(eventDate, 'EEEE, dd/MM/yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                                        <Clock size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Time</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {startTime ? format(startTime, 'h:mm a') : 'TBD'}
                                            {endTime && ` - ${format(endTime, 'h:mm a')}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Location</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {event.location || 'No location set'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Office / Unit</p>
                                        <p className="text-sm font-semibold text-foreground break-words">
                                            {/* Priority: On Behalf Of Name -> Department Field -> General */}
                                            {event.on_behalf_of?.name || event.department || 'General'}
                                        </p>
                                    </div>
                                </div>

                                {event.is_recurring && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                            <Repeat size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Recurrence</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                Recurring Series
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-glass rounded-2xl p-5 shadow-sm">
                                <h3 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-4 flex items-center gap-2">
                                    <User size={12} /> {(event.on_behalf_of || event.institution_id || event.department_id || event.department) ? 'Requested On behalf of' : (event.created_by?.role === 'member' ? 'Requested By' : 'Organizer')}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                                        {/* Avatar Initials logic */}
                                        {(() => {
                                            const entity = event.organizer || event.created_by;
                                            return entity?.name ? entity.name.charAt(0) : (event.department?.charAt(0) || 'O');
                                        })()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground break-words">
                                            {/* Organizer Name Logic */}
                                            {(() => {
                                                const entity = event.organizer || event.created_by;
                                                return entity?.name || event.department || 'Unknown';
                                            })()}
                                        </p>
                                        <p className="text-[10px] text-muted capitalize">
                                            {/* Organizer Role/Context Logic */}
                                            {(() => {
                                                const entity = event.organizer || event.created_by;
                                                if (entity?.role === 'member') return 'Member User';
                                                if (event.on_behalf_of?.name) return `On Behalf of ${event.on_behalf_of.name}`;
                                                return 'Event Organizer';
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-soft/50 bg-background flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="text-[10px] text-muted font-medium">
                        EVENT ID: {event.id}
                    </div>
                    <div className="flex gap-3">
                        <button className="p-2.5 text-muted hover:text-foreground hover:bg-surface transition-all rounded-xl border border-transparent hover:border-soft">
                            <Share2 size={18} />
                        </button>
                        {allowedToDelete && (
                            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="p-2.5 text-destructive hover:text-red-500 hover:bg-destructive/10 transition-all rounded-xl border border-transparent disabled:opacity-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Let the dialog trigger handle the open state naturally or ensure state sync
                                            setIsDeleteOpen(true);
                                        }}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-[440px] bg-[#0F1218]/95 backdrop-blur-2xl border border-white/10 text-foreground z-[120] rounded-[2.5rem] p-0 overflow-hidden shadow-2xl shadow-black/50">
                                    <div className="p-8 flex flex-col items-center text-center">
                                        {/* Danger Icon */}
                                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 rotate-3">
                                            <Trash2 size={40} strokeWidth={1.5} />
                                        </div>

                                        <AlertDialogHeader className="space-y-3">
                                            <AlertDialogTitle className="text-2xl font-bold tracking-tight">Delete Event?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-white/50 text-sm leading-relaxed px-4">
                                                {event.is_recurring || (event as any).is_recurring_instance ? (
                                                    <div className="space-y-4 py-2">
                                                        <p className="text-white/70 font-medium">This is a recurring event. How would you like to proceed?</p>
                                                        <div className="flex flex-col gap-3">
                                                            <label className={cn(
                                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                                                deleteMode === 'single' ? "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                            )}>
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                                    deleteMode === 'single' ? "border-red-500" : "border-white/20"
                                                                )}>
                                                                    {deleteMode === 'single' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                                                </div>
                                                                <input 
                                                                    type="radio" 
                                                                    name="deleteMode" 
                                                                    value="single" 
                                                                    checked={deleteMode === 'single'} 
                                                                    onChange={() => setDeleteMode('single')} 
                                                                    className="hidden"
                                                                />
                                                                <div className="text-left">
                                                                    <div className={cn("text-sm font-bold", deleteMode === 'single' ? "text-red-400" : "text-white")}>Just this instance</div>
                                                                    <div className="text-[10px] text-white/40">Other occurrences will remain.</div>
                                                                </div>
                                                            </label>

                                                            <label className={cn(
                                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                                                deleteMode === 'series' ? "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                            )}>
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                                    deleteMode === 'series' ? "border-red-500" : "border-white/20"
                                                                )}>
                                                                    {deleteMode === 'series' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                                                </div>
                                                                <input 
                                                                    type="radio" 
                                                                    name="deleteMode" 
                                                                    value="series" 
                                                                    checked={deleteMode === 'series'} 
                                                                    onChange={() => setDeleteMode('series')} 
                                                                    className="hidden"
                                                                />
                                                                <div className="text-left">
                                                                    <div className={cn("text-sm font-bold", deleteMode === 'series' ? "text-red-400" : "text-white")}>All events in series</div>
                                                                    <div className="text-[10px] text-white/40">Removes the entire recurring pattern.</div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    "Are you sure you want to delete this event? This action is permanent and cannot be undone."
                                                )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter className="w-full flex flex-col sm:flex-row gap-3 pt-8">
                                            <AlertDialogCancel
                                                onClick={() => setIsDeleteOpen(false)}
                                                className="flex-1 h-12 rounded-2xl bg-white/5 border-white/10 text-white font-bold hover:bg-white/10 hover:text-white transition-all border-0"
                                            >
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={confirmDelete}
                                                disabled={isDeleting}
                                                className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 border-0 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete Event'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </div>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
