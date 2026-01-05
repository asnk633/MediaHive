import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Event } from '@/types/event';
import { SystemEventService } from '@/services/systemEventService';
import { UserService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import {
    X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft,
    Briefcase, Camera, Send, AlertCircle, Check, Repeat
} from 'lucide-react';
import { format } from 'date-fns';
import { DEPARTMENTS, INSTITUTIONS } from '@/lib/constants/organizations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from '@/components/ui/time-picker';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface EventEditModalProps {
    event: Event;
    isOpen: boolean;
    onClose: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({ event, isOpen, onClose }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);

    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        description: '',
        department: '',
        type: 'other' as Event['type'],
        mediaCoverage: [] as string[],
        createdById: '',
        isMediaOffDay: false
    });

    const mediaOptions = [
        "Complete Videography",
        "Reel Videography",
        "Photography",
        "Live Broadcasting",
        "Drone Video",
        "Drone Photography",
    ];

    // Close on ESC handled by Radix Dialog

    useEffect(() => {
        if (isAdmin) {
            const fetchTeamMembers = async () => {
                const members = await UserService.getTeamMembers();
                setTeamMembers(members);
            };
            fetchTeamMembers();
        }
    }, [isAdmin]);

    const getDateObject = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        if (typeof dateValue === 'object' && 'seconds' in dateValue) {
            return new Date(dateValue.seconds * 1000);
        }
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? null : d;
    };

    useEffect(() => {
        if (event) {
            const eventDate = getDateObject(event.date) || new Date();
            // For time, fallback to eventDate if startTime is missing (common for ISO string events which contain time)
            const startTimeCandidate = getDateObject(event.startTime) || eventDate;
            const eventTime = startTimeCandidate || new Date();

            setFormData({
                title: event.title || '',
                date: format(eventDate, 'yyyy-MM-dd'),
                time: format(eventTime, 'HH:mm'),
                location: event.location || '',
                description: event.description || '',
                department: event.department || '',
                type: event.type || 'other',
                mediaCoverage: event.mediaCoverage || [],
                createdById: event.createdBy?.uid || '',
                isMediaOffDay: event.isMediaOffDay || false
            });

            // Initialize Recurrence logic
            if (event.isSystemEvent) {
                // We access the system event properties via type casting or loose access since 'Event' type is union
                const sysEvent = event as any;
                setIsRecurring(sysEvent.isRecurring || false);
                if (sysEvent.recurrence) {
                    setRecurrenceFreq(sysEvent.recurrence.frequency || 'yearly');
                    setRecurrenceEndDate(sysEvent.recurrence.endDate || '');
                }
            }
        }
    }, [event]);

    const toggleMediaOption = (option: string) => {
        setFormData(prev => ({
            ...prev,
            mediaCoverage: prev.mediaCoverage.includes(option)
                ? prev.mediaCoverage.filter(o => o !== option)
                : [...prev.mediaCoverage, option]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            let finalCreatedBy = { ...event.createdBy };
            if (isAdmin && formData.createdById !== event.createdBy.uid) {
                const selected = teamMembers.find(m => m.uid === formData.createdById);
                if (selected) {
                    finalCreatedBy = { uid: selected.uid, name: selected.name, role: 'team' };
                }
            }

            if (event.isSystemEvent && isAdmin) {
                // Logic for System Events
                const recurrencePayload: any = isRecurring ? {
                    frequency: recurrenceFreq,
                    interval: 1,
                    endDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
                    month: dateTime.getMonth(),
                    day: dateTime.getDate()
                } : undefined;

                if (isRecurring && recurrenceFreq === 'weekly') {
                    recurrencePayload.weekday = dateTime.getDay();
                }

                const payload = {
                    title: formData.title,
                    description: formData.description,
                    type: formData.type as any,
                    date: dateTime.toISOString(), // Send as ISO string
                    isRecurring: isRecurring,
                    recurrence: recurrencePayload,
                    isMediaOffDay: formData.isMediaOffDay
                };

                // Strip suffix if present (recurring events have _YYYY-MM-DD)
                const realId = event.id.replace(/_\d{4}-\d{2}-\d{2}$/, '');

                await SystemEventService.updateSystemEvent(realId, payload);
            } else if (!event.isSystemEvent) {
                // Logic for User Events
                const payload = {
                    title: formData.title,
                    date: dateTime.toISOString(), // Send as ISO string
                    startTime: dateTime.toISOString(), // Send as ISO string
                    location: formData.location,
                    description: formData.description,
                    department: formData.department,
                    type: formData.type,
                    createdBy: finalCreatedBy,
                    mediaCoverage: formData.mediaCoverage,
                };
                await apiClient(`/api/events/${event.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
            }


            onClose();
            toast.success("Event updated successfully");
        } catch (error: any) {
            console.error("Failed to update event:", error);
            // Show the actual error message from the server
            toast.error(error.message || "Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="max-w-2xl bg-[#141e30] border-white/10 p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertCircle className="text-blue-400" size={20} />
                        Edit Event
                    </DialogTitle>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    <form id="edit-event-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Event Title</label>
                            <div className="relative group">
                                <AlignLeft size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    placeholder="Enter event title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full bg-white/5 border-white/10 hover:bg-white/10 text-left font-normal h-[50px] rounded-xl justify-start pl-4",
                                                !formData.date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon size={18} className="text-white/40 mr-3.5" />
                                            {formData.date ? format(new Date(formData.date), "MMM dd, yyyy") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-[200]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.date ? new Date(formData.date) : undefined}
                                            onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Time</label>
                                <div className="relative group">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full bg-white/5 border border-white/10 hover:bg-white/10 text-left font-normal h-[50px] rounded-xl justify-start pl-4",
                                                    !formData.time && "text-muted-foreground"
                                                )}
                                            >
                                                <Clock size={18} className="text-white/40 mr-3.5" />
                                                <span className="text-white">
                                                    {formData.time ? (() => {
                                                        const [h, m] = formData.time.split(':');
                                                        const date = new Date();
                                                        date.setHours(parseInt(h), parseInt(m));
                                                        return format(date, 'h:mm a');
                                                    })() : "Pick a time"}
                                                </span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none z-[200]" align="start">
                                            <TimePicker
                                                value={formData.time}
                                                onChange={(val) => setFormData({ ...formData, time: val })}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Location</label>
                            <div className="relative group">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    placeholder="Location (Optional)"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Department / Institution</label>
                            <div className="relative group">
                                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="" className="bg-[#141e30]">Select Organization</option>
                                    <optgroup label="DEPARTMENTS" className="bg-[#141e30] text-white/40 font-bold">
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept} value={dept} className="bg-[#141e30] text-white">{dept}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="INSTITUTIONS" className="bg-[#141e30] text-white/40 font-bold">
                                        {INSTITUTIONS.map(inst => (
                                            <option key={inst} value={inst} className="bg-[#141e30] text-white">{inst}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-4 px-1">Media Coverage Requested</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {mediaOptions.map((option) => {
                                    const isSelected = formData.mediaCoverage.includes(option);
                                    return (
                                        <label
                                            key={option}
                                            className={`
                                            flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all
                                            ${isSelected
                                                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                                                    : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                                                }
                                        `}
                                        >
                                            <div className="flex justify-between items-center">
                                                <Camera size={14} className={isSelected ? 'text-blue-400' : 'text-white/20'} />
                                                <div className={`
                                                w-4 h-4 rounded-full border flex items-center justify-center
                                                ${isSelected ? 'bg-blue-600 border-blue-400' : 'bg-transparent border-white/10'}
                                            `}>
                                                    {isSelected && <Check size={10} className="text-white" />}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-left">{option}</span>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isSelected}
                                                onChange={() => toggleMediaOption(option)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Description</label>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all min-h-[120px]"
                                placeholder="Add description or notes..."
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {event.isSystemEvent && isAdmin && (
                            <div className="space-y-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-bold text-white block">Recurring Event</label>
                                            <span className="text-xs text-white/50 block mt-1">Enable repetition for this event</span>
                                        </div>
                                        <Switch
                                            checked={isRecurring}
                                            onCheckedChange={setIsRecurring}
                                        />
                                    </div>

                                    {isRecurring && (
                                        <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/50 uppercase">Frequency</label>
                                                <div className="relative">
                                                    <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                                    <Select value={recurrenceFreq} onValueChange={(val: any) => setRecurrenceFreq(val)}>
                                                        <SelectTrigger className="w-full bg-[#0a0c10] border-white/10 text-white pl-9 h-11">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#141e30] border-white/10 text-white">
                                                            <SelectItem value="weekly">Weekly</SelectItem>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="yearly">Yearly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-white/50 uppercase">Repeat Until</label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full bg-[#0a0c10] border-white/10 text-white justify-start text-left font-normal h-11",
                                                                !recurrenceEndDate && "text-white/30"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                            {recurrenceEndDate ? format(new Date(recurrenceEndDate), "PPP") : <span>No End Date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-[#141e30] border-white/10 text-white" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={recurrenceEndDate ? new Date(recurrenceEndDate) : undefined}
                                                            onSelect={(d) => setRecurrenceEndDate(d ? d.toISOString() : '')}
                                                            initialFocus
                                                            disabled={(date) => date < new Date()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`
                                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                                        ${formData.isMediaOffDay ? 'bg-red-500 border-red-500' : 'border-white/30 bg-transparent'}
                                    `}>
                                            {formData.isMediaOffDay && <Check size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.isMediaOffDay}
                                            onChange={e => setFormData({ ...formData, isMediaOffDay: e.target.checked })}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-red-200">Media Off Day</span>
                                            <span className="text-xs text-red-200/50">Mark this date as a non-working day for the Media team</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {new Date(formData.date).getDay() === 0 && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs">
                                <AlertCircle size={14} />
                                <span>Warning: The selected date is a Sunday (Media Off Day).</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3 justify-end items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        form="edit-event-form"
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm font-bold disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        ) : (
                            <>
                                <Send size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
