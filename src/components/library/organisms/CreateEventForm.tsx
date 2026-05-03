import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlignLeft, User, Briefcase, Camera, Check, Repeat, Lock, Shield } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContextProvider';
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
    const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: string; name: string }[]>([]);

    // Form State
    const [is_system_event, setIsSystemEvent] = useState(forceSystemEvent);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('Operations');
    const [createdById, setCreatedById] = useState('');
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string; department_id?: string; institution_id?: string }[]>([]);

    // Create On Behalf Of State
    const [createOnBehalfOf, setCreateOnBehalfOf] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(''); // Kept for legacy/fallback if needed, but primary focus changes
    const [onBehalfOfEntityName, setOnBehalfOfEntityName] = useState(''); // New state for Entity Mode

    // Recurrence State
    const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

    // New State for Media Coverage
    const [media_coverage, setMediaCoverage] = useState<string[]>([]);

    // Popover State (to fix overlay bug)
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [recurrenceEndPopoverOpen, setRecurrenceEndPopoverOpen] = useState(false);

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

    // Fetch real team members from Firestore with department info
    useEffect(() => {
        const fetchTeamMembers = async () => {
            const members = await UserService.getTeamMembers();
            // Fetch full user details including department for each member
            const membersWithDept = await Promise.all(
                members.map(async (m) => {
                    try {
                        const response = await apiClient(`/api/users/${m.uid}`, { method: 'GET' });
                        const userDoc = response.user;
                        return {
                            uid: m.uid,
                            name: m.name,
                            department_id: userDoc?.department_id,
                            institution_id: userDoc?.institution_id,
                        };
                    } catch (e) {
                        // Fallback if user details can't be fetched
                        return {
                            uid: m.uid,
                            name: m.name,
                        };
                    }
                })
            );
            const otherMembers = membersWithDept.filter(m => m.uid !== user?.uid);
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
        if (user?.department_id && (departmentsList.some(d => d.name === user.department_id) || institutionsList.some(i => i.name === user.department_id))) {
            setDepartment(user.department_id);
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

            if (is_system_event && user?.role === 'admin') {
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

            // Resolve Department/Institution ID from name
            // If "On Behalf Of" is active, use onBehalfOfEntityName, otherwise use standard department state.
            const targetEntityName = createOnBehalfOf ? onBehalfOfEntityName : department;

            let deptId = '';
            let deptType = 'department';
            let targetInstitutionId = user?.institution_id;
            let targetDepartmentId: string | null = null;
            let resolvedInstitutionName = '';

            const foundDept = departmentsList.find(d => d.name === targetEntityName);
            if (foundDept) {
                deptId = foundDept.id;
                deptType = 'department';
                targetDepartmentId = foundDept.id;
            } else {
                const foundInst = institutionsList.find(i => i.name === targetEntityName);
                if (foundInst) {
                    deptId = foundInst.id;
                    deptType = 'institution';
                    targetInstitutionId = foundInst.id;
                    targetDepartmentId = null;
                }
            }

            // Construct explicit on_behalf_of object (The Entity)
            const on_behalf_of = {
                id: deptId || 'unknown',
                name: targetEntityName,
                type: deptType
            };

            // Construct explicit Organizer object (The Person OR Entity)
            let organizer;

            if (createOnBehalfOf) {
                // In "On Behalf Of" mode, the Entity is the Organizer
                organizer = {
                    uid: `entity:${deptId}`, // Virtual UID for entity
                    name: targetEntityName,
                    role: 'system' // or 'entity'
                };
            } else {
                // In Standard mode, the User is the Organizer
                organizer = {
                    uid: user?.uid || 'anon',
                    name: user?.official_name || user?.name || 'Guest',
                    role: user?.role || 'guest'
                };
            }

            // Legacy support: We still send created_by for backward compat, but API prioritizes user session
            const legacyCreatedBy = {
                uid: user?.uid,
                name: user?.name,
                role: user?.role
            };

            const payload: any = {
                title,
                date: dateTime.toISOString(), // Send as ISO string
                location,
                description,
                department: targetEntityName, // Legacy string (updated to selected entity)
                type: 'other',
                created_by: legacyCreatedBy, // Correct system metadata
                on_behalf_of, // Explicit Entity
                organizer,  // Explicit Person or Entity
                institution_id: targetInstitutionId,
                department_id: targetDepartmentId,
                media_coverage,
            };

            // Clean up payload if on_behalf_of is active to avoid ambiguity if backend cares
            if (createOnBehalfOf) {
                // We ensure 'department' field in payload matches the entity, which we did above.
            }

            await apiClient('/api/events', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            onSuccess();
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Working offline?");
        }
    };

    // Modern Input Style (Semantic)
    const inputContainerClasses = "relative group";
    const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none";
    const inputClasses = `
        w-full 
        bg-background 
        text-foreground 
        placeholder:text-muted
        border border-soft 
        rounded-2xl 
        py-4 pl-12 pr-4 
        outline-none 
        transition-all duration-200
        focus:border-primary/50 focus:ring-4 focus:ring-primary/10
        hover:border-muted
    `;
    const labelClasses = "block text-sm font-medium text-muted mb-2";

    // Field State Styles (for role-based clarity)
    const lockedFieldClasses = "bg-muted/5 border-soft text-muted cursor-not-allowed";
    const derivedFieldClasses = "bg-muted/5 border-soft text-muted cursor-not-allowed";

    return (
        <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Title Section */}
            <div className="space-y-4">
                {user?.role === 'admin' && (
                    <div className="space-y-4 p-4 rounded-2xl bg-surface border border-soft">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label className="text-sm font-bold text-foreground block">System Event</label>
                                <span className="text-xs text-muted block mt-1">Recurring event for everyone</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSystemEvent(!is_system_event)}
                                className={`
                                    relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                    ${is_system_event ? 'bg-primary' : 'bg-muted'}
                                `}
                            >
                                <span className="sr-only">Use setting</span>
                                <span
                                    aria-hidden="true"
                                    className={`
                                        pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out
                                        ${is_system_event ? 'translate-x-5' : 'translate-x-0'}
                                    `}
                                />
                            </button>
                        </div>

                        {/* Recurrence Options */}
                        {is_system_event && (
                            <div className="pt-4 border-t border-soft grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Frequency</label>
                                    <div className="relative">
                                        <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                        <Select value={recurrenceFreq} onValueChange={(val: any) => setRecurrenceFreq(val)}>
                                            <SelectTrigger className="w-full bg-background border-soft text-foreground pl-9 h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-surface border-soft text-foreground z-[200]">
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Repeat Until <span className="text-muted text-xs">(Optional)</span></label>
                                    <Popover open={recurrenceEndPopoverOpen} onOpenChange={setRecurrenceEndPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full bg-background border-soft text-foreground justify-start text-left font-normal h-11",
                                                    !recurrenceEndDate && "text-muted"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                {recurrenceEndDate ? format(new Date(recurrenceEndDate), "PPP") : <span>No End Date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-surface border-soft text-foreground z-[200]" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={recurrenceEndDate ? new Date(recurrenceEndDate) : undefined}
                                                onSelect={(d) => {
                                                    setRecurrenceEndDate(d ? d.toISOString() : '');
                                                    setRecurrenceEndPopoverOpen(false);
                                                }}
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
                    <label className={labelClasses}>Event Title</label>
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


            {/* Created By Section - Role-Based Behavior */}
            {
                !is_system_event && (
                    <>
                        {/* Admin Only: Create On Behalf Of Toggle */}
                        {user?.role === 'admin' && (
                            <div className="space-y-4 p-5 rounded-2xl bg-blue-500/5 border-2 border-blue-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                        Administrative Action
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <label className="text-sm font-bold text-foreground block">Create On Behalf Of</label>
                                        <span className="text-xs text-muted block mt-1">
                                            {createOnBehalfOf ? "Event owned by an Office / Institution" : "Event owned by you (the user)"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newValue = !createOnBehalfOf;
                                            setCreateOnBehalfOf(newValue);
                                            if (!newValue) {
                                                // Reset when toggling off
                                                setOnBehalfOfEntityName('');
                                                // Restore default department if needed
                                                if (user?.department_id) setDepartment(user.department_id);
                                            } else {
                                                // Initialize with current department if valid
                                                setOnBehalfOfEntityName(department);
                                            }
                                        }}
                                        className={`
                                            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                                            ${createOnBehalfOf ? 'bg-primary' : 'bg-muted'}
                                        `}
                                    >
                                        <span className="sr-only">Create on behalf of</span>
                                        <span
                                            aria-hidden="true"
                                            className={`
                                                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out
                                                ${createOnBehalfOf ? 'translate-x-5' : 'translate-x-0'}
                                            `}
                                        />
                                    </button>
                                </div>

                                {/* Entity Selector (When ON) */}
                                {createOnBehalfOf && (
                                    <div className="pt-4 mt-4 border-t border-blue-500/20">
                                        <label className={labelClasses}>On Behalf Of (Entity)</label>
                                        <div className={inputContainerClasses}>
                                            <Briefcase size={20} className={iconClasses} />
                                            <Select value={onBehalfOfEntityName} onValueChange={setOnBehalfOfEntityName}>
                                                <SelectTrigger className="w-full bg-background border-soft text-foreground h-14 rounded-2xl pl-12">
                                                    <SelectValue placeholder="Select Office / Institution" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-surface border-soft text-foreground max-h-80 z-[200]">
                                                    <SelectGroup>
                                                        <SelectLabel className="text-muted text-xs font-bold uppercase tracking-wider px-2 py-1.5">Offices / Units</SelectLabel>
                                                        {departmentsList.map(dept => (
                                                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                    <SelectGroup>
                                                        <SelectLabel className="text-muted text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Institutions</SelectLabel>
                                                        {institutionsList.map(inst => (
                                                            <SelectItem key={inst.id} value={inst.name}>{inst.name}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-xs text-blue-500/70 mt-2">
                                            The selected entity will be the official <strong>Organizer</strong> of this event. Your name will not appear on the event card.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Created By Field (Only show if NOT available logic needed, or standard mode) */}
                        {/* Wait, the prompt says "Replace user selector" - so when ON, we show Entity selector (done above). 
                            When ON, we do NOT show Created By. 
                            When OFF, we show Created By (Standard). 
                        */}
                        {!createOnBehalfOf && (
                            <div className="space-y-2">
                                <label className={labelClasses}>Created By</label>
                                <div className={inputContainerClasses}>
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted z-10" />
                                    <div className={`w-full border rounded-2xl py-4 pl-12 pr-4 flex items-center ${lockedFieldClasses}`}>
                                        <span>{user?.official_name || user?.name || 'Current User'}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted mt-1.5">
                                    {user?.role === 'admin' ? 'Your account' : 'Auto-filled from your profile'}
                                </p>
                            </div>
                        )}
                    </>
                )
            }


            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className={labelClasses}>Event Date</label>
                    <div className={inputContainerClasses}>
                        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        inputClasses,
                                        "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                        !date && "text-muted font-normal"
                                    )}
                                >
                                    <CalendarIcon size={20} className="text-muted shrink-0" />
                                    <span className="truncate">
                                        {date ? format(new Date(date), "MMM dd, yyyy") : "Pick a date"}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-soft bg-surface text-foreground z-[200]" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date ? new Date(date) : undefined}
                                    onSelect={(d) => {
                                        setDate(d ? format(d, 'yyyy-MM-dd') : '');
                                        setDatePopoverOpen(false);
                                    }}
                                    initialFocus
                                    className="bg-surface text-foreground rounded-xl border border-soft"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                {!is_system_event && (
                    <div className="space-y-2">
                        <label className={labelClasses}>Start Time</label>
                        <div className={inputContainerClasses}>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            inputClasses,
                                            "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                            !time && "text-muted font-normal"
                                        )}
                                    >
                                        <Clock size={20} className="text-muted shrink-0" />
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
                                <PopoverContent className="w-auto p-0 border-none bg-transparent z-[200]" align="start">
                                    <TimePicker value={time} onChange={setTime} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}
            </div>

            {/* Location */}
            <div className="space-y-2">
                <label className={labelClasses}>Location <span className="text-muted text-xs">(Optional)</span></label>
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
            </div>



            {
                !is_system_event && !createOnBehalfOf && (
                    <>
                        {/* Department / Unit */}
                        <div className="space-y-2">
                            <label className={labelClasses}>Department / Unit</label>
                            {user?.role === 'admin' ? (
                                // Admin: Always Editable Dropdown
                                <div className={inputContainerClasses}>
                                    <Briefcase size={20} className={iconClasses} />
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger className="w-full bg-background border-soft text-foreground h-14 rounded-2xl pl-12">
                                            <SelectValue placeholder="Select Office / Unit" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-surface border-soft text-foreground max-h-80 z-[200]">
                                            <SelectGroup>
                                                <SelectLabel className="text-muted text-xs font-bold uppercase tracking-wider px-2 py-1.5">Offices / Units</SelectLabel>
                                                {departmentsList.map(dept => (
                                                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel className="text-muted text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Institutions</SelectLabel>
                                                {institutionsList.map(inst => (
                                                    <SelectItem key={inst.id} value={inst.name}>{inst.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                // Guest/Team: Read-only (auto-filled from user profile)
                                <>
                                    <div className={inputContainerClasses}>
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted z-10" />
                                        <div className={`w-full border rounded-2xl py-4 pl-12 pr-4 flex items-center ${derivedFieldClasses}`}>
                                            <span>{department}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted mt-1.5">Derived from your department</p>
                                </>
                            )}
                        </div>
                    </>
                )
            }

            {
                !is_system_event && (
                    <>
                        {/* Media Coverage - Cards Style */}
                        <div className="pt-2">
                            <label className={`${labelClasses} flex items-center gap-2 mb-4`}>
                                <Camera size={14} className="text-blue-400" />
                                Request Media Team
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {mediaOptions.map((option) => {
                                    const isSelected = media_coverage.includes(option);
                                    return (
                                        <label
                                            key={option}
                                            className={`
                                                relative flex flex-col items-start justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 select-none group
                                                ${isSelected
                                                    ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-primary/20'
                                                    : 'bg-background border-soft hover:border-muted hover:bg-surface'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between w-full mb-3">
                                                <div className={`
                                                    w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300
                                                    ${isSelected ? 'bg-primary border-primary scale-110' : 'border-muted bg-muted/10'}
                                                `}>
                                                    {isSelected && <Check size={12} className="text-primary-foreground stroke-[3]" />}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-primary' : 'text-muted group-hover:text-foreground'}`}>
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
            <div className="space-y-2">
                <label className={labelClasses}>Description <span className="text-muted text-xs">(Optional)</span></label>
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
            </div>

            {/* Actions */}
            <div className={`flex gap-4 ${isModal ? 'pt-2' : 'pt-6 mt-6 border-t border-soft'}`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 text-sm font-bold text-muted bg-surface hover:bg-muted/10 rounded-2xl transition-colors hover:text-foreground border border-soft"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
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
