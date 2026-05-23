import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { TimeSelector } from '@/components/ui/selectors/TimeSelector';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { Event } from '@/features/events/types/event';
import { SystemEventService } from '@/features/events/services/systemEventService';
import { UserService } from '@/services/userService';
import { EventService } from '@/features/events/services/eventService';
import { StructureService } from '@/services/structureService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { apiClient } from '@/lib/apiClient';
import {
    X, Calendar as CalendarIcon, Clock, MapPin, AlignLeft,
    Briefcase, Camera, Send, AlertCircle, Check, Repeat, Building
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useEntityPresence } from '@/hooks/useEntityPresence';
import { FieldPresence } from '@/components/collaboration/FieldPresence';
import { PresencePile } from '@/components/collaboration/PresencePile';

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

    // Real-time Presence
    const { activeUsers, updateFocus } = useEntityPresence('event', event?.id);

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<{ id: string | number; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: string | number; name: string }[]>([]);

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

    const categories = [
        { id: 'film', label: 'Media Production', icon: <Camera size={14} /> },
        { id: 'event', label: 'General Event', icon: <CalendarIcon size={14} /> },
        { id: 'other', label: 'Other', icon: <AlertCircle size={14} /> },
    ];

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
                const members = await UserService.getTeamMembers(event?.institution_id || null, user?.uid, { forceMediaIT: true });
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
            const startTimeCandidate = getDateObject(event.start_at) || eventDate;
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
                // Resolve Department/Institution ID
                let deptId: string | number = '';
                let deptType: 'department' | 'institution' = 'department';
                let targetInstitutionId: string | number | undefined = event.institution_id;
                let targetDepartmentId: string | number | undefined = event.department_id;

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

                const payload: any = {
                    title: formData.title,
                    date: dateTime.toISOString(),
                    start_at: dateTime.toISOString(),
                    location: formData.location,
                    description: formData.description,
                    department: formData.department,
                    type: formData.type,
                    created_by_info: finalCreatedBy,
                    media_coverage: formData.media_coverage,
                    on_behalf_of,
                    institution_id: targetInstitutionId,
                    department_id: targetDepartmentId
                };

                await EventService.updateEvent(event.id, payload, user?.uid || '', undefined, undefined);
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
                    <div className="flex items-center gap-4">
                        <PresencePile users={activeUsers} />
                        <button onClick={onClose} className="p-2 hover:bg-glass rounded-full transition-colors text-muted hover:text-foreground">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    <form id="edit-event-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest px-1">Event Title</label>
                                <FieldPresence users={activeUsers} field="title" />
                            </div>
                            <div className="relative group">
                                <AlignLeft size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    className="w-full bg-glass border-none rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                                    placeholder="Enter event title"
                                    value={formData.title}
                                    onFocus={() => updateFocus('title')}
                                    onBlur={() => updateFocus(null)}
                                    onChange={e => {
                                        setFormData({ ...formData, title: e.target.value });
                                        updateFocus('title', true); // broadcasting "typing"
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-0.5">
                                <DateSelector 
                                    label="Date"
                                    date={formData.date ? new Date(formData.date) : undefined}
                                    onChange={date => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                />
                            </div>

                            <div className="space-y-0.5">
                                <TimeSelector 
                                    label="Time"
                                    value={formData.time}
                                    onChange={val => setFormData({ ...formData, time: val })}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest px-1">Location</label>
                                <FieldPresence users={activeUsers} field="location" />
                            </div>
                            <div className="relative group">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    className="w-full bg-glass border-none rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm"
                                    placeholder="Location (Optional)"
                                    value={formData.location}
                                    onFocus={() => updateFocus('location')}
                                    onBlur={() => updateFocus(null)}
                                    onChange={e => {
                                        setFormData({ ...formData, location: e.target.value });
                                        updateFocus('location', true);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            <DropdownSelector 
                                label="Department / Institution"
                                value={formData.department}
                                onChange={val => setFormData({ ...formData, department: val })}
                                options={[
                                    ...departmentsList.map(dept => ({ id: dept.name, label: dept.name, icon: <Briefcase size={14} /> })),
                                    ...institutionsList.map(inst => ({ id: inst.name, label: inst.name, icon: <Building size={14} /> }))
                                ]}
                            />
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
                                                    {isSelected && <Check size={10} className="text-foreground" />}
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
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-muted uppercase tracking-widest px-1">Description</label>
                                <FieldPresence users={activeUsers} field="description" />
                            </div>
                            <textarea
                                className="w-full bg-glass border-none rounded-xl px-4 py-3 text-foreground placeholder-muted focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[120px] shadow-sm"
                                placeholder="Add description or notes..."
                                rows={4}
                                value={formData.description}
                                onFocus={() => updateFocus('description')}
                                onBlur={() => updateFocus(null)}
                                onChange={e => {
                                    setFormData({ ...formData, description: e.target.value });
                                    updateFocus('description', true);
                                }}
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
                                            <div className="space-y-0.5">
                                                <DropdownSelector 
                                                    label="Frequency"
                                                    value={recurrenceFreq}
                                                    onChange={(val: any) => setRecurrenceFreq(val)}
                                                    options={[
                                                        { id: 'weekly', label: 'Weekly', icon: <Repeat size={14} /> },
                                                        { id: 'monthly', label: 'Monthly', icon: <Repeat size={14} /> },
                                                        { id: 'yearly', label: 'Yearly', icon: <Repeat size={14} /> },
                                                    ]}
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <DateSelector 
                                                    label="Repeat Until"
                                                    date={recurrenceEndDate ? new Date(recurrenceEndDate) : undefined}
                                                    onChange={d => setRecurrenceEndDate(d ? d.toISOString() : '')}
                                                    disabledBefore={new Date()}
                                                />
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
                                            {formData.is_media_off_day && <Check size={14} className="text-foreground" />}
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
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-foreground rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm font-bold disabled:opacity-50"
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
