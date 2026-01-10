import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlignLeft, User, Briefcase, Camera, Check, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/apiClient';
import { StructureService } from '@/services/structureService';
import { SystemEventService } from '@/services/systemEventService';
import { UserService } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { TimePicker } from '@/components/ui/time-picker';

interface CreateEventFormProps {
    initialDate?: Date;
    onSuccess: () => void;
    onCancel?: () => void;
    isModal?: boolean;
    forceSystemEvent?: boolean;
}

export const CreateEventForm = ({ initialDate, onSuccess, onCancel, isModal = false, forceSystemEvent = false }: CreateEventFormProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<{ id: number; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: number; name: string }[]>([]);

    // Form State
    const [isSystemEvent, setIsSystemEvent] = useState(forceSystemEvent);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('Operations');
    const [createdById, setCreatedById] = useState('');
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);

    // Recurrence State
    const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

    // New State for Media Coverage
    const [mediaCoverage, setMediaCoverage] = useState<string[]>([]);

    // Media Options
    const mediaOptions = [
        "Complete Videography",
        "Reel Videography",
        "Photography",
        "Live Broadcasting",
        "Drone Video",
        "Drone Photography",
    ];

    const toggleMediaOption = (option: string) => {
        setMediaCoverage(prev =>
            prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
        );
    };

    // Fetch real team members from Firestore
    useEffect(() => {
        const fetchTeamMembers = async () => {
            const members = await UserService.getTeamMembers();
            const otherMembers = members.filter(m => m.uid !== user?.uid);
            setTeamMembers(otherMembers);
        };
        fetchTeamMembers();
    }, [user?.uid]);

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

    // Initialize State
    useEffect(() => {
        if (initialDate) {
            setDate(format(initialDate, 'yyyy-MM-dd'));
        } else {
            setDate('');
        }
        setTime('10:00');
        setTitle('');
        setLocation('');
        setDescription('');
        if (user?.defaultDepartment && (departmentsList.some(d => d.name === user.defaultDepartment) || institutionsList.some(i => i.name === user.defaultDepartment))) {
            setDepartment(user.defaultDepartment);
        } else if (departmentsList.length > 0) {
            setDepartment(departmentsList[0].name);
        } else {
            setDepartment('Operations');
        }
        setMediaCoverage([]);
        setCreatedById(user?.uid || '');
    }, [initialDate, user, departmentsList, institutionsList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return; // Time not required for system event if we default it

        setLoading(true);
        try {
            const dateTime = new Date(`${date}T${time || '09:00'}`);

            if (isSystemEvent && user?.role === 'admin') {
                const recurrencePayload: any = {
                    frequency: recurrenceFreq,
                    interval: 1,
                    endDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
                    month: dateTime.getMonth(), // 0-11
                    day: dateTime.getDate(),    // 1-31
                };

                // Add specific constraints
                if (recurrenceFreq === 'weekly') {
                    recurrencePayload.weekday = dateTime.getDay(); // 0-6
                }

                await SystemEventService.addSystemEvent({
                    title,
                    description,
                    type: 'company',
                    isRecurring: true,
                    recurrence: recurrencePayload,
                    date: dateTime.toISOString() // Store start date
                });
                onSuccess();
                return;
            }

            if (!time) return;

            let finalCreatedBy = { uid: user?.uid || 'anon', name: user?.officialName || user?.name || 'Guest' };
            let onBehalfOfPayload = undefined;

            if (user?.role === 'admin' || user?.role === 'team') {
                if (createdById === user?.uid || createdById === 'self' || !createdById) {
                    // Default to self
                    finalCreatedBy = { uid: user?.uid || 'anon', name: user?.officialName || user?.name || 'User' };
                } else if (createdById.startsWith('dept_')) {
                    const id = parseInt(createdById.split('_')[1]);
                    const dept = departmentsList.find(d => d.id === id);
                    if (dept) {
                        onBehalfOfPayload = { id: dept.id, name: dept.name, type: 'department' };
                    }
                } else if (createdById.startsWith('inst_')) {
                    const id = parseInt(createdById.split('_')[1]);
                    const inst = institutionsList.find(i => i.id === id);
                    if (inst) {
                        onBehalfOfPayload = { id: inst.id, name: inst.name, type: 'institution' };
                    }
                } else if (user?.role === 'admin') {
                    // Admin assigning to another team member
                    const selected = teamMembers.find(m => m.uid === createdById);
                    if (selected) {
                        finalCreatedBy = { uid: selected.uid, name: selected.name };
                    }
                }
            }

            await apiClient('/api/events', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    date: dateTime.toISOString(), // Send as ISO string
                    location,
                    description,
                    department,
                    type: 'other',
                    createdBy: finalCreatedBy,
                    onBehalfOf: onBehalfOfPayload,
                    mediaCoverage,
                })
            });
            onSuccess();
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Working offline?");
        } finally {
            setLoading(false);
        }
    };

    // Modern Input Style (Night Sky Theme)
    const inputContainerClasses = "relative group";
    const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors duration-200 z-10 pointer-events-none";
    const inputClasses = `
        w-full 
        bg-[#0a0c10] 
        text-white 
        placeholder:text-white/30
        border border-[#ffffff1a] 
        rounded-2xl 
        py-4 pl-12 pr-4 
        outline-none 
        transition-all duration-200
        focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10
        hover:border-white/20
    `;
    const labelClasses = "block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 ml-1";

    return (
        <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Title Section */}
            <div className="space-y-4">
                {user?.role === 'admin' && (
                    <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-[#ffffff1a]">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label className="text-sm font-bold text-white block">System Event</label>
                                <span className="text-xs text-white/50 block mt-1">Recurring event for everyone</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSystemEvent(!isSystemEvent)}
                                className={`
                                    relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-[#0a0c10]
                                    ${isSystemEvent ? 'bg-blue-600' : 'bg-white/10'}
                                `}
                            >
                                <span className="sr-only">Use setting</span>
                                <span
                                    aria-hidden="true"
                                    className={`
                                        pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                        ${isSystemEvent ? 'translate-x-5' : 'translate-x-0'}
                                    `}
                                />
                            </button>
                        </div>

                        {/* Recurrence Options */}
                        {isSystemEvent && (
                            <div className="pt-4 border-t border-[#ffffff1a] grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase">Frequency</label>
                                    <div className="relative">
                                        <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <Select value={recurrenceFreq} onValueChange={(val: any) => setRecurrenceFreq(val)}>
                                            <SelectTrigger className="w-full bg-[#0a0c10] border-[#ffffff1a] text-white pl-9 h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#141e30] border-[#ffffff1a] text-white">
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
                                                    "w-full bg-[#0a0c10] border-[#ffffff1a] text-white justify-start text-left font-normal h-11",
                                                    !recurrenceEndDate && "text-white/30"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                {recurrenceEndDate ? format(new Date(recurrenceEndDate), "PPP") : <span>No End Date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-[#141e30] border-[#ffffff1a] text-white" align="start">
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
                )}

                <div className="space-y-2">
                    <label className={labelClasses}>Event Details</label>
                    <div className={inputContainerClasses}>
                        <AlignLeft size={20} className={iconClasses} />
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Event Title (e.g., Q4 Planning)"
                            className={`${inputClasses} text-lg font-medium`}
                        />
                    </div>
                </div>
            </div>


            {/* Creator Selection: Admin & Team */}
            {
                (user?.role === 'admin' || user?.role === 'team') && !isSystemEvent && (
                    <div className={inputContainerClasses}>
                        <User size={20} className={iconClasses} />
                        <Select value={createdById} onValueChange={setCreatedById}>
                            <SelectTrigger className="w-full bg-[#0a0c10] border-[#ffffff1a] text-white h-14 rounded-2xl pl-12">
                                <SelectValue placeholder="Select Creator" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141e30] border-[#ffffff1a] text-white max-h-80">
                                <SelectItem value={user?.uid || 'self'}>Myself ({user?.officialName || user?.name})</SelectItem>

                                {user?.role === 'admin' && teamMembers.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="text-white/50 text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Team Members</SelectLabel>
                                        {teamMembers.map(m => (
                                            <SelectItem key={m.uid} value={m.uid}>{m.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}

                                <SelectGroup>
                                    <SelectLabel className="text-white/50 text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Offices / Units</SelectLabel>
                                    {departmentsList.map(d => (
                                        <SelectItem key={`dept_${d.id}`} value={`dept_${d.id}`}>{d.name}</SelectItem>
                                    ))}
                                </SelectGroup>

                                <SelectGroup>
                                    <SelectLabel className="text-white/50 text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Institutions</SelectLabel>
                                    {institutionsList.map(i => (
                                        <SelectItem key={`inst_${i.id}`} value={`inst_${i.id}`}>{i.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                )
            }

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className={inputContainerClasses}>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    inputClasses,
                                    "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                    !date && "text-white/30 font-normal"
                                )}
                            >
                                <CalendarIcon size={20} className="text-white/40 shrink-0" />
                                <span className="truncate">
                                    {date ? format(new Date(date), "MMM dd, yyyy") : "Pick a date"}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-[#ffffff1a] bg-[#141e30] text-white" align="start">
                            <Calendar
                                mode="single"
                                selected={date ? new Date(date) : undefined}
                                onSelect={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : '')}
                                initialFocus
                                className="bg-[#141e30] text-white rounded-xl border border-[#ffffff1a]"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                {!isSystemEvent && (
                    <div className={inputContainerClasses}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        inputClasses,
                                        "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                        !time && "text-white/30 font-normal"
                                    )}
                                >
                                    <Clock size={20} className="text-white/40 shrink-0" />
                                    <span className="truncate">
                                        {time ? (() => {
                                            const [h, m] = time.split(':');
                                            const date = new Date();
                                            date.setHours(parseInt(h), parseInt(m));
                                            return format(date, 'h:mm a');
                                        })() : "Pick a time"}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none bg-transparent" align="start">
                                <TimePicker value={time} onChange={setTime} />
                            </PopoverContent>
                        </Popover>
                    </div>
                )}
            </div>

            {/* Location */}
            <div className={inputContainerClasses}>
                <MapPin size={20} className={iconClasses} />
                <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Location (Optional)"
                    className={inputClasses}
                />
            </div>



            {
                !isSystemEvent && (
                    <>
                        {/* Department */}
                        <div className={inputContainerClasses}>
                            <Briefcase size={20} className={iconClasses} />
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger className="w-full bg-[#0a0c10] border-[#ffffff1a] text-white h-14 rounded-2xl pl-12">
                                    <SelectValue placeholder="Select Office / Unit" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141e30] border-[#ffffff1a] text-white max-h-80">
                                    <SelectGroup>
                                        <SelectLabel className="text-white/50 text-xs font-bold uppercase tracking-wider px-2 py-1.5">Offices / Units</SelectLabel>
                                        {departmentsList.map(dept => (
                                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-white/50 text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Institutions</SelectLabel>
                                        {institutionsList.map(inst => (
                                            <SelectItem key={inst.id} value={inst.name}>{inst.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Media Coverage - Cards Style */}
                        <div className="pt-2">
                            <label className={`${labelClasses} flex items-center gap-2 mb-4`}>
                                <Camera size={14} className="text-blue-400" />
                                Request Media Team
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {mediaOptions.map((option) => {
                                    const isSelected = mediaCoverage.includes(option);
                                    return (
                                        <label
                                            key={option}
                                            className={`
                                    relative flex flex-col items-start justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 select-none group
                                    ${isSelected
                                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                                    : 'bg-[#0a0c10] border-white/5 hover:border-[#ffffff1a] hover:bg-white/5'}
                                `}
                                        >
                                            <div className="flex items-center justify-between w-full mb-3">
                                                <div className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300
                                        ${isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-white/20 bg-white/5'}
                                    `}>
                                                    {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-blue-200' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                {option}
                                            </span>
                                            <input
                                                type="checkbox"
                                                value={option}
                                                checked={isSelected}
                                                onChange={() => toggleMediaOption(option)}
                                                className="hidden"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )
            }

            {/* Description */}
            <div className={inputContainerClasses}>
                <AlignLeft size={20} className={`${iconClasses} top-6 -translate-y-0`} />
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Add description or notes..."
                    className={`${inputClasses} pt-4 pl-12 resize-none min-h-[120px]`}
                />
            </div>

            {/* Actions */}
            <div className={`flex gap-4 ${isModal ? 'pt-2' : 'pt-6 mt-6 border-t border-[#ffffff1a]'}`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 text-sm font-bold text-gray-400 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                            Creating...
                        </>
                    ) : (
                        'Create Event'
                    )}
                </button>
            </div>
        </form >
    );
};
