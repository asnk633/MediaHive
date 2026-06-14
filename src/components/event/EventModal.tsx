import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft, Building2, Repeat, Send } from "lucide-react";
// Events temporarily disabled — createEvent is a no-op stub
import { useAuth } from '@/contexts/AuthContextProvider';
import { SystemEventService } from '@/features/events/services/systemEventService';
import { motion, AnimatePresence } from 'framer-motion';
import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { TimeSelector } from "@/components/ui/selectors/TimeSelector";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultDate?: Date;
    eventToEdit?: any;
}

export function EventModal({ isOpen, onClose, defaultDate, eventToEdit }: EventModalProps) {
    const createEvent = async (_: any) => { console.warn("Events disabled"); };
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // System Event State
    const [is_system_event, setIsSystemEvent] = useState(false);
    const [recurrence, setRecurrence] = useState<{ frequency: 'yearly', month: number, day: number }>({
        frequency: 'yearly',
        month: new Date().getMonth(),
        day: new Date().getDate()
    });

    // Smart Defaults
    const getSmartTimes = () => {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);

        const endHour = new Date(nextHour);
        endHour.setHours(nextHour.getHours() + 1);

        return {
            start: nextHour.toTimeString().slice(0, 5), // HH:MM
            end: endHour.toTimeString().slice(0, 5)
        };
    };

    const smartTimes = getSmartTimes();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: smartTimes.start,
        endTime: smartTimes.end,
        location: "",
    });

    // Close on ESC & Submit on Cmd+Enter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                const form = document.getElementById('event-form') as HTMLFormElement;
                if (form) form.requestSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Populate form if editing
    useEffect(() => {
        if (eventToEdit) {
            const isSystem = !!eventToEdit.is_system_event;
            setIsSystemEvent(isSystem);

            // Parse date
            let dateStr = "";
            if (eventToEdit.date) {
                if (eventToEdit.date.seconds) {
                    dateStr = new Date(eventToEdit.date.seconds * 1000).toISOString().split('T')[0];
                } else if (typeof eventToEdit.date === 'string') {
                    dateStr = eventToEdit.date.split('T')[0];
                }
            }

            setFormData({
                title: eventToEdit.title || "",
                description: eventToEdit.description || "",
                date: dateStr || new Date().toISOString().split('T')[0],
                startTime: "09:00", // Keep fixed 09:00 for edits if missing, to avoid shifting existing data unexpectedly? 
                // Actually if editing an event without time, it might be better to keep 09:00 or what is in DB.
                // But wait, the previous code had 09:00 hardcoded.
                endTime: "10:00",
                location: eventToEdit.location || "",
            });
            // Note: If eventToEdit has times, we should use them. The previous code didn't seem to extract times from eventToEdit?
            // Let's look at lines 53-60... it only extracts date.
            // If the event object has startAt/endAt, we should parse them.
            if (eventToEdit.startAt) {
                const s = new Date(eventToEdit.startAt);
                const e = eventToEdit.endAt ? new Date(eventToEdit.endAt) : new Date(s.getTime() + 60 * 60 * 1000);
                setFormData(prev => ({
                    ...prev,
                    startTime: s.toTimeString().slice(0, 5),
                    endTime: e.toTimeString().slice(0, 5)
                }));
            } else {
                // Fallback for edit without time? Default to smart times? Or 09:00?
                // If it's an existing event without time, it's likely an all-day event or legacy.
                // Let's leave the hardcoded 09:00 for *editing* to minimize noise, OR use the smart defaults if it's a "New" event passing through here?
                // Wait, this block is if(eventToEdit).
            }

            if (isSystem && eventToEdit.recurrence) {
                setRecurrence(eventToEdit.recurrence);
            }
        } else {
            if (defaultDate) {
                setFormData(prev => ({ ...prev, date: defaultDate.toISOString().split('T')[0] }));
            }
        }
    }, [eventToEdit, defaultDate, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (is_system_event && user?.role === 'admin') {
                const dateObj = new Date(formData.date);

                const payload = {
                    title: formData.title,
                    description: formData.description,
                    type: 'company' as const,
                    isRecurring: true,
                    recurrence: {
                        frequency: 'yearly' as const,
                        interval: 1,
                        month: dateObj.getMonth(),
                        day: dateObj.getDate()
                    }
                };

                if (eventToEdit && eventToEdit.id) {
                    await SystemEventService.updateSystemEvent(eventToEdit.id, payload);
                } else {
                    await SystemEventService.addSystemEvent(payload);
                }
            } else {
                const startAt = new Date(`${formData.date}T${formData.startTime}`).toISOString();
                const endAt = formData.endTime ? new Date(`${formData.date}T${formData.endTime}`).toISOString() : null;

                await createEvent({
                    title: formData.title,
                    description: formData.description,
                    startAt,
                    endAt,
                    location: formData.location,
                });
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const canCreate = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'member';
    const isAdmin = user?.role === 'admin';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#141e30] rounded-2xl shadow-2xl border border-[#ffffff1a] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#ffffff1a] flex justify-between items-center bg-foreground/5">
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                {eventToEdit ? (is_system_event ? 'Edit System Event' : 'Edit Event') : (is_system_event ? 'New System Event' : (user?.role === 'member' ? 'Request Event' : 'New Event'))}
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground/70 hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Admin Toggle */}
                                {isAdmin && (
                                    <div className="flex items-center justify-between p-4 bg-foreground/5 rounded-xl border border-[#ffffff1a]">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-bold text-foreground">System Event</label>
                                            <span className="text-xs text-foreground/80">Recurring yearly event for everyone</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsSystemEvent(!is_system_event)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is_system_event ? 'bg-blue-600' : 'bg-foreground/20'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${is_system_event ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                )}

                                {/* EVENT DETAILS Label */}
                                <div className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Event Details</div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                                        Event Title {is_system_event && <span className="text-foreground/80">(System-wide)</span>}
                                    </label>
                                    <div className="relative group">
                                        <AlignLeft size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/70 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                        <input
                                            className="w-full bg-foreground/5 border border-[#ffffff1a] rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-white/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                            placeholder={is_system_event ? "e.g. 77th Republic Day of India" : "e.g. Team Meeting"}
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Date & Time */}                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-0.5">
                                        <DateSelector 
                                            label="Event Date"
                                            date={new Date(formData.date)}
                                            onChange={(date) => {
                                                if (!date) return;
                                                setFormData({ ...formData, date: date.toISOString().split('T')[0] });
                                            }}
                                        />
                                    </div>
                                    {!is_system_event && (
                                        <div className="space-y-0.5">
                                            <TimeSelector 
                                                label="Start Time"
                                                value={formData.startTime}
                                                onChange={(time) => setFormData({ ...formData, startTime: time })}
                                            />
                                        </div>
                                    )}
                                </div>


                                {/* Recurrence Notice */}
                                {is_system_event && (
                                    <div className="flex items-center gap-2 text-xs text-blue-200 bg-blue-600/10 p-3 rounded-xl border border-blue-500/20">
                                        <Repeat className="w-4 h-4" />
                                        <span>Will repeat yearly on this date</span>
                                    </div>
                                )}

                                {/* Location */}
                                {!is_system_event && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground/70 mb-2">
                                            Location <span className="text-foreground/80 text-xs">(Optional)</span>
                                        </label>
                                        <div className="relative group">
                                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/70 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                                            <input
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g. Conference Room A"
                                                className="w-full bg-foreground/5 border border-[#ffffff1a] rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-white/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                                        Description <span className="text-foreground/80 text-xs">(Optional)</span>
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Add event details, agenda, or notes..."
                                        className="w-full bg-foreground/5 border border-[#ffffff1a] rounded-xl px-4 py-3 text-foreground placeholder-white/30 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[100px]"
                                        rows={4}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#ffffff1a] bg-foreground/5 flex gap-3 justify-end items-center">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-foreground/80 hover:text-foreground hover:bg-foreground/5 transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                form="event-form"
                                type="submit"
                                disabled={loading || !canCreate}
                                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-foreground rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm font-bold disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground/30 border-t-white" />
                                ) : (
                                    <>
                                        <Send size={16} />
                                        {eventToEdit ? "Save" : "Create"}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
