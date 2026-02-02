import React, { useState } from 'react';
import { Event } from '@/types/event';
import { MediaService } from '@/services/mediaService';
import { EventService } from '@/services/events';
import { SystemEventService } from '@/services/systemEventService';
import {
    X, Calendar, Clock, MapPin, Edit2,
    Share2, Trash2, Video, CheckCircle2,
    Info, Briefcase, User
} from 'lucide-react';
import { format } from 'date-fns';
import { EventMediaTab } from '@/components/media/EventMediaTab';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useDevWiring } from '@/hooks/useDevWiring';
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

interface EventDetailsModalProps {
    event: Event | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete?: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose, onEdit, onDelete }) => {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const getDateObject = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            return new Date(dateValue.seconds * 1000);
        }
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
    };

    const eventDate = getDateObject(event?.date) || new Date();
    // Fallback to eventDate for startTime if explicit startTime is missing (common for ISO string events)
    const startTime = getDateObject(event?.startTime) || eventDate;

    // Safe check for event existence in logic vars
    const canDelete = !!event && (user?.role === 'admin' || (!event.isSystemEvent && user?.uid && event.createdBy?.uid === user.uid));

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
            if (event.isSystemEvent) {
                // Strip suffix if present (recurring events have _YYYY-MM-DD)
                const realId = event.id.replace(/_\d{4}-\d{2}-\d{2}$/, '');
                await SystemEventService.deleteSystemEvent(realId);
            } else {
                await EventService.deleteEvent(event.id);
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
        { name: 'Delete Event', handler: () => setIsDeleteOpen(true), visible: !!canDelete, destructive: true, permissionVerified: !!canDelete },
        { name: 'Edit Event', handler: onEdit, visible: !!event },
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
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.isSystemEvent ? 'bg-amber-500/10 text-amber-500' :
                                    event.type === 'meeting' ? 'bg-blue-500/10 text-blue-500' :
                                        event.type === 'workshop' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                    {event.isSystemEvent ? 'System Event' : event.type}
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
                        <div className="flex gap-2">
                            {(!event.isSystemEvent || user?.role === 'admin') && (
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
                            {event.mediaCoverage && event.mediaCoverage.length > 0 && (
                                <section className="bg-glass rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4">
                                        <Video size={18} /> Media Coverage Requested
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {event.mediaCoverage.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-muted text-sm py-2 px-3 bg-surface rounded-lg whitespace-nowrap">
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Media Gallery */}
                            <section>
                                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Media Gallery</h3>
                                <EventMediaTab eventId={event.id} files={[]} />
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
                                            {event.onBehalfOf?.name || event.department || 'General'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-glass rounded-2xl p-5 shadow-sm">
                                <h3 className="text-[10px] uppercase font-bold text-muted tracking-wider mb-4 flex items-center gap-2">
                                    <User size={12} /> {event.createdBy?.role === 'guest' ? 'Created By' : 'Organizer'}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                                        {/* Avatar Initials logic */}
                                        {(() => {
                                            const entity = event.organizer || event.createdBy;
                                            return entity?.name ? entity.name.charAt(0) : (event.department?.charAt(0) || 'O');
                                        })()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground break-words">
                                            {/* Organizer Name Logic */}
                                            {(() => {
                                                const entity = event.organizer || event.createdBy;
                                                return entity?.name || event.department || 'Unknown';
                                            })()}
                                        </p>
                                        <p className="text-[10px] text-muted capitalize">
                                            {/* Organizer Role/Context Logic */}
                                            {(() => {
                                                const entity = event.organizer || event.createdBy;
                                                if (entity?.role === 'guest') return 'Guest User';
                                                if (event.onBehalfOf?.name) return `On Behalf of ${event.onBehalfOf.name}`;
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
                        {canDelete && (
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
                                <AlertDialogContent className="bg-surface border-soft text-foreground z-[120]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted">
                                            Are you sure you want to delete this event? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            onClick={() => setIsDeleteOpen(false)}
                                            className="bg-transparent border-soft text-muted hover:bg-surface hover:text-foreground"
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={confirmDelete}
                                            className="bg-red-500 hover:bg-red-600 text-white border-0"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
