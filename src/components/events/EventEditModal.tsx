import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Event } from '@/types/event';
import { SystemEventService } from '@/services/systemEventService';
import { UserService } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { apiClient } from '@/lib/apiClient';
import {
    X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft,
    Briefcase, Camera, Send, AlertCircle, Check, Repeat
} from 'lucide-react';
import { format } from 'date-fns';
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: string; name: string }[]>([]);

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
        media_coverage: [] as string[],
        createdById: '',
        is_media_off_day: false
    });

    const mediaOptions = [
        "Complete Videography",
        "Reel Videography",
        "Photography",
        "Live Broadcasting",
        "Drone Video",
        "Drone Photography",
    ];

    // Fetch Organizations
    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const [deptData, instData] = await Promise.all([
                    StructureService.getDepartments(),
                    StructureService.getInstitutions()
                ]);
                setDepartmentsList(deptData.departments);
                setInstitutionsList(instData.institutions);
            } catch (e) {
                console.error("Failed to fetch organizations", e);
            }
        };
        fetchOrgs();
    }, []);

    // Fetch Team Members
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

    // Initialize Form Data
    useEffect(() => {
        if (event) {
            const eventDate = getDateObject(event.date) || new Date();
            const startTimeCandidate = getDateObject(event.start_time) || eventDate;
            const eventTime = startTimeCandidate || new Date();

            setFormData({
                title: event.title || '',
                date: format(eventDate, 'yyyy-MM-dd'),
                time: format(eventTime, 'HH:mm'),
                location: event.location || '',
                description: event.description || '',
                department: event.department || '', // Existing logic uses Name
                type: event.type || 'other',
                media_coverage: event.media_coverage || [],
                createdById: event.created_by?.uid || '',
                is_media_off_day: event.is_media_off_day || false
            });

            // Initialize Recurrence logic
            if (event.is_system_event) {
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
            media_coverage: prev.media_coverage.includes(option)
                ? prev.media_coverage.filter(o => o !== option)
                : [...prev.media_coverage, option]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            let finalCreatedBy = { ...event.created_by };
            if (isAdmin && formData.createdById !== event.created_by.uid) {
                const selected = teamMembers.find(m => m.uid === formData.createdById);
                if (selected) {
                    finalCreatedBy = { uid: selected.uid, name: selected.name, role: 'team' };
                }
            }

            if (event.is_system_event && isAdmin) {
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
                    date: dateTime.toISOString(),
                    isRecurring: isRecurring,
                    recurrence: recurrencePayload,
                    is_media_off_day: formData.is_media_off_day
                };

                const realId = event.id.replace(/_\d{4}-\d{2}-\d{2}$/, '');
                await SystemEventService.updateSystemEvent(realId, payload);
            } else if (!event.is_system_event) {
                // Logic for User Events
                // Resolve Department/Institution ID
                let deptId = '';
                let deptType: 'department' | 'institution' = 'department';
                let targetInstitutionId = event.institution_id;
                let targetDepartmentId = event.department_id;

                const foundDept = departmentsList.find(d => d.name === formData.department);
                if (foundDept) {
                    deptId = foundDept.id;
                    deptType = 'department';
                    targetDepartmentId = foundDept.id;
                } else {
                    const foundInst = institutionsList.find(i => i.name === formData.department);
                    if (foundInst) {
                        deptId = foundInst.id;
                        deptType = 'institution';
                        targetInstitutionId = foundInst.id;
                        targetDepartmentId = undefined; // Clear department_id if it's an institution
                    }
                }

                const on_behalf_of = {
                    id: deptId || 'unknown',
                    name: formData.department,
                    type: deptType
                };

                const payload = {
                    title: formData.title,
                    date: dateTime.toISOString(),
                    start_time: dateTime.toISOString(),
                    location: formData.location,
                    description: formData.description,
                    department: formData.department,
                    type: formData.type,
                    created_by: finalCreatedBy,
                    media_coverage: formData.media_coverage,
                    on_behalf_of,
                    institution_id: targetInstitutionId,
                    department_id: targetDepartmentId
                };

                // Using PUT since we updated the route handler to PUT. 
                // Wait, if I change to PUT here, I must be sure the route accepts PUT.
                // I implemented PUT. So this is correct.
                await apiClient(`/api/events/${event.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            }

            onClose();
            toast.success("Event updated successfully");
        } catch (error: any) {
            console.error("Failed to update event:", error);
            toast.error(error.message || "Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="max-w-2xl bg-surface border-none p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl rounded-2xl"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-soft/50 flex justify-between items-center bg-surface shrink-0">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <AlertCircle className="text-blue-400" size={20} />
                        Edit Event
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Form to edit information for the event including title, date, and description.
                    </DialogDescription>
                    <button onClick={onClose} className="p-2 hover:bg-glass rounded-full transition-colors text-muted hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    <form id="edit-event-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">Event Title</label>
                            <div className="relative group">
                                <AlignLeft size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    className="w-full bg-glass border-none rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                                    placeholder="Enter event title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full bg-glass border-none hover:bg-surface text-left font-normal h-[50px] rounded-xl justify-start pl-4 shadow-sm",
                                                !formData.date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon size={18} className="text-muted mr-3.5" />
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
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">Time</label>
                                <div className="relative group">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full bg-glass border-none hover:bg-surface text-left font-normal h-[50px] rounded-xl justify-start pl-4 shadow-sm",
                                                    !formData.time && "text-muted-foreground"
                                                )}
                                            >
                                                <Clock size={18} className="text-muted mr-3.5" />
                                                <span className="text-foreground">
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
                            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">Location</label>
                            <div className="relative group">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    className="w-full bg-glass border-none rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                                    placeholder="Location (Optional)"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">Office / Unit / Institution</label>
                            <div className="relative group">
                                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                <select
                                    className="w-full bg-glass border-none rounded-xl pl-12 pr-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer shadow-sm"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="" className="bg-surface text-muted">Select Organization</option>
                                    <optgroup label="OFFICES / UNITS" className="bg-surface text-muted font-bold">
                                        {departmentsList.map(dept => (
                                            <option key={dept.id} value={dept.name} className="bg-surface text-foreground">{dept.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="INSTITUTIONS" className="bg-surface text-muted font-bold">
                                        {institutionsList.map(inst => (
                                            <option key={inst.id} value={inst.name} className="bg-surface text-foreground">{inst.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-4 px-1">Media Coverage Requested</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {mediaOptions.map((option) => {
                                    const isSelected = formData.media_coverage.includes(option);
                                    return (
                                        <label
                                            key={option}
                                            className={`
                                            flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all
                                            ${isSelected
                                                    ? 'bg-primary/20 border-primary/50 text-foreground'
                                                    : 'bg-glass border-none text-muted hover:bg-surface shadow-sm'
                                                }
                                        `}
                                        >
                                            <div className="flex justify-between items-center">
                                                <Camera size={14} className={isSelected ? 'text-primary' : 'text-muted'} />
                                                <div className={`
                                                w-4 h-4 rounded-full border flex items-center justify-center
                                                ${isSelected ? 'bg-primary border-primary' : 'bg-transparent border-soft'}
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
                            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 px-1">Description</label>
                            <textarea
                                className="w-full bg-glass border-none rounded-xl px-4 py-3 text-foreground placeholder-muted focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[120px] shadow-sm"
                                placeholder="Add description or notes..."
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {event.is_system_event && isAdmin && (
                            <div className="space-y-4">
                                <div className="bg-glass rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-bold text-foreground block">Recurring Event</label>
                                            <span className="text-xs text-muted block mt-1">Enable repetition for this event</span>
                                        </div>
                                        <Switch
                                            checked={isRecurring}
                                            onCheckedChange={setIsRecurring}
                                        />
                                    </div>

                                    {isRecurring && (
                                        <div className="pt-4 border-t border-soft/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted uppercase">Frequency</label>
                                                <div className="relative">
                                                    <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                                    <Select value={recurrenceFreq} onValueChange={(val: any) => setRecurrenceFreq(val)}>
                                                        <SelectTrigger className="w-full bg-surface border-none text-foreground pl-9 h-11">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-surface border-soft text-foreground">
                                                            <SelectItem value="weekly">Weekly</SelectItem>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="yearly">Yearly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted uppercase">Repeat Until</label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full bg-surface border-none text-foreground justify-start text-left font-normal h-11",
                                                                !recurrenceEndDate && "text-muted"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                            {recurrenceEndDate ? format(new Date(recurrenceEndDate), "PPP") : <span>No End Date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-surface border-soft text-foreground" align="start">
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

                                <div className="bg-red-500/10 border-none rounded-xl p-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`
                                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                                        ${formData.is_media_off_day ? 'bg-red-500 border-red-500' : 'border-soft bg-transparent'}
                                    `}>
                                            {formData.is_media_off_day && <Check size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.is_media_off_day}
                                            onChange={e => setFormData({ ...formData, is_media_off_day: e.target.checked })}
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
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-200 text-xs">
                                <AlertCircle size={14} />
                                <span>Warning: The selected date is a Sunday (Media Off Day).</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-soft/50 bg-surface flex gap-3 justify-end items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-muted hover:text-foreground hover:bg-glass transition-all text-sm font-medium"
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
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/30 border-t-primary" />
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
