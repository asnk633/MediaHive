import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlignLeft, User, Briefcase, Camera, Check, Repeat, Lock, Shield, AlertTriangle, Search, Package, TestTube2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isBefore, startOfDay } from 'date-fns';
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/apiClient';
import { StructureService } from '@/services/structureService';
import { EventService } from '@/features/events/services/eventService';
import { SystemEventService } from '@/features/events/services/systemEventService';
import { UserService } from '@/services/userService';
import { inventoryService } from '@/services/inventory/inventoryService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { TimePicker } from '@/components/ui/time-picker';
import { RecurrenceService } from '@/features/events/services/recurrenceService';

interface CreateEventFormProps {
    initialDate?: Date;
    initialEndDate?: Date;
    initialEvent?: any;
    onSuccess: () => void;
    onCancel?: () => void;
    isModal?: boolean;
    forceSystemEvent?: boolean;
}

export const CreateEventForm = ({ initialDate, initialEndDate, initialEvent, onSuccess, onCancel, isModal = false, forceSystemEvent = false }: CreateEventFormProps) => {
    const { user } = useAuth();
    const isPrivilegedRole = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'member' || user?.role === 'team';

    const [loading, setLoading] = useState(false);

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<{ id: string | number; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: string | number; name: string }[]>([]);

    // Form State
    const [is_system_event, setIsSystemEvent] = useState(forceSystemEvent);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [time, setTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);
    const [department, setDepartment] = useState('');
    const [createdById, setCreatedById] = useState('');
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string; department_id?: string | number; institution_id?: string | number }[]>([]);

    // Create On Behalf Of State
    const [createOnBehalfOf, setCreateOnBehalfOf] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(''); // Kept for legacy/fallback if needed, but primary focus changes
    const [onBehalfOfEntityName, setOnBehalfOfEntityName] = useState(''); // New state for Entity Mode

    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

    // New State for Media Coverage
    const [media_coverage, setMediaCoverage] = useState<string[]>([]);

    // Crew & Equipment State
    const [assignedCrew, setAssignedCrew] = useState<{ user_id: string; name: string; role: string }[]>([]);
    const [reservedEquipment, setReservedEquipment] = useState<{ inventory_id: string; name: string; reserved_from: string; reserved_to: string }[]>([]);
    const [equipmentConflicts, setEquipmentConflicts] = useState<Record<string, any[]>>({});
    const [inventoryList, setInventoryList] = useState<{ id: string; name: string; category?: string }[]>([]);
    const [autoGenerateTasks, setAutoGenerateTasks] = useState(true);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    const [is_demo_data, setIsDemoData] = useState(false);

    // Popover State (to fix overlay bug)
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
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
            try {
                const members = await UserService.getTeamMembers(null, user?.uid, { forceMediaIT: true });
                // Filter out current user and map to expected format
                const otherMembers = members
                    .filter(m => m.uid !== user?.uid)
                    .map(m => ({
                        uid: m.uid,
                        name: m.name,
                        department_id: m.department_id,
                        institution_id: m.institution_id
                    }));
                setTeamMembers(otherMembers);
            } catch (e) {
                console.error("Failed to fetch team members", e);
            }
        };
        fetchTeamMembers();
    }, [user?.uid]);

    // Fetch Inventory for selection
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const items = await inventoryService.getEquipment();
                setInventoryList(items.map(i => ({ id: String(i.id), name: i.name, category: i.category })));
            } catch (e) {
                console.error("Failed to fetch inventory", e);
            }
        };
        fetchInventory();
    }, []);

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

    const hasInitialized = useRef(false);

    // Initial Event Pre-population
    useEffect(() => {
        if (initialEvent && !hasInitialized.current) {
            setTitle(initialEvent.title || '');
            setDescription(initialEvent.description || '');
            setLocation(initialEvent.location || '');
            setIsAllDay(!!initialEvent.is_all_day);
            setIsSystemEvent(!!initialEvent.is_system_event);
            
            if (initialEvent.start_at) {
                const start = new Date(initialEvent.start_at);
                setDate(format(start, 'yyyy-MM-dd'));
                if (!initialEvent.is_all_day) setTime(format(start, 'HH:mm'));
            }
            
            if (initialEvent.end_at) {
                const end = new Date(initialEvent.end_at);
                setEndDate(format(end, 'yyyy-MM-dd'));
                if (!initialEvent.is_all_day) setEndTime(format(end, 'HH:mm'));
            }
            
            if (initialEvent.on_behalf_of) {
                setCreateOnBehalfOf(true);
                setOnBehalfOfEntityName(String(initialEvent.on_behalf_of.id));
            } else if (initialEvent.department_id) {
                setDepartment(String(initialEvent.department_id));
            }
            
            if (initialEvent.media_coverage) {
                setMediaCoverage(initialEvent.media_coverage);
            }

            if (initialEvent.crew) {
                setAssignedCrew(initialEvent.crew.map((c: any) => ({
                    user_id: c.user_id,
                    name: c.profile?.full_name || 'Team Member',
                    role: c.role || ''
                })));
            }

            if (initialEvent.equipment) {
                setReservedEquipment(initialEvent.equipment.map((e: any) => ({
                    inventory_id: e.inventory_id,
                    name: e.inventory?.name || 'Equipment',
                    reserved_from: e.reserved_from,
                    reserved_to: e.reserved_to
                })));
            }

            setIsRecurring(!!initialEvent.is_recurring);
            hasInitialized.current = true;
        }
    }, [initialEvent]);

    // Conflict Detection Logic
    const checkConflicts = async (newRes?: typeof reservedEquipment) => {
        setIsCheckingConflicts(true);
        const conflicts: Record<string, any[]> = {};
        const itemsToCheck = newRes || reservedEquipment;
        
        for (const item of itemsToCheck) {
            const results = await EventService.checkEquipmentConflicts(
                item.inventory_id,
                item.reserved_from,
                item.reserved_to
            );
            if (results.length > 0) {
                conflicts[item.inventory_id] = results;
            }
        }
        setEquipmentConflicts(conflicts);
        setIsCheckingConflicts(false);
    };

    useEffect(() => {
        if (reservedEquipment.length > 0) {
            checkConflicts();
        }
    }, [date, time, endDate, endTime]);

    // Handle Department Initialization (When org lists load)
    useEffect(() => {
        const hasLists = departmentsList.length > 0 || institutionsList.length > 0;
        if (!hasLists || !user) return;

        // Only auto-set department if it's still at default or empty
        if (department === 'Operations' || !department) {
            const foundDept = departmentsList.find(d => String(d.id) === String(user.department_id) || d.name === user.department_id);
            const foundInst = institutionsList.find(i => String(i.id) === String(user.department_id) || i.name === user.department_id);
            
            if (foundDept) {
                setDepartment(String(foundDept.id));
            } else if (foundInst) {
                setDepartment(String(foundInst.id));
            } else if (departmentsList.length > 0) {
                setDepartment(String(departmentsList[0].id));
            }
        }
    }, [departmentsList, institutionsList, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- Hardened Validation ---
        if (!title.trim()) {
            alert("Event Title is required.");
            return;
        }
        if (!date) {
            alert("Start Date is required.");
            return;
        }
        if (!isAllDay && !time) {
            alert("Start Time is required for timed events.");
            return;
        }

        setLoading(true);
        try {
            let startAtISO: string;
            let endAtISO: string;

            if (isAllDay) {
                // All Day: Midnight to 23:59:59
                startAtISO = `${date}T00:00:00.000Z`;
                endAtISO = `${endDate || date}T23:59:59.999Z`;
            } else {
                // Timed Event
                const startDateTime = new Date(`${date}T${time || '09:00'}`);
                const endDateTime = endDate 
                    ? new Date(`${endDate}T${endTime || time || '10:00'}`) 
                    : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour
                
                startAtISO = startDateTime.toISOString();
                endAtISO = endDateTime.toISOString();
            }

            if (is_system_event && user?.role === 'admin') {
                const dateTime = new Date(startAtISO);
                
                let recurrenceRule: string | undefined = undefined;
                if (isRecurring) {
                    recurrenceRule = RecurrenceService.generateRuleString({
                        frequency: recurrenceFreq,
                        interval: recurrenceInterval,
                        startDate: dateTime,
                        until: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined
                    });
                }

                await SystemEventService.addSystemEvent({
                    title,
                    description,
                    type: 'company',
                    isRecurring: isRecurring,
                    recurrence_rule: recurrenceRule,
                    start_at: startAtISO,
                    end_at: endAtISO,
                    is_all_day: isAllDay
                } as any);
                onSuccess();
                return;
            }

            // Resolve Department/Institution ID and Name
            const targetEntityId = createOnBehalfOf ? onBehalfOfEntityName : department;

            let deptId = '';
            let deptType = 'department';
            let targetInstitutionId = user?.institution_id;
            let targetDepartmentId: string | null = null;
            let entityName = '';

            const foundDept = departmentsList.find(d => String(d.id) === String(targetEntityId));
            if (foundDept) {
                deptId = String(foundDept.id);
                deptType = 'department';
                targetDepartmentId = String(foundDept.id);
                entityName = foundDept.name;
            } else {
                const foundInst = institutionsList.find(i => String(i.id) === String(targetEntityId));
                if (foundInst) {
                    deptId = String(foundInst.id);
                    deptType = 'institution';
                    targetInstitutionId = foundInst.id;
                    targetDepartmentId = null;
                    entityName = foundInst.name;
                }
            }

            const on_behalf_of = {
                id: deptId || 'unknown',
                name: entityName || targetEntityId || 'Unknown Entity',
                type: deptType
            };

            let organizer;
            if (createOnBehalfOf) {
                organizer = {
                    uid: `entity:${deptId}`,
                    name: entityName || targetEntityId || 'Unknown Entity',
                    role: 'system'
                };
            } else {
                organizer = {
                    uid: user?.uid || 'anon',
                    name: user?.official_name || user?.name || 'Member',
                    role: user?.role || 'member'
                };
            }

            // Construct payload
            const payload: any = {
                title,
                description,
                start_at: startAtISO,
                end_at: endAtISO,
                is_all_day: isAllDay,
                location,
                media_coverage,
                institution_id: deptType === 'institution' ? targetInstitutionId : (deptType === 'department' ? null : (targetInstitutionId || user?.institution_id)),
                department_id: deptType === 'department' ? (targetDepartmentId ? Number(targetDepartmentId) : null) : null,
                on_behalf_of,
                organizer,
                is_recurring: isRecurring,
                tenant_id: user?.tenant_id,
                is_demo_data
            };

            if (isRecurring) {
                payload.recurrence_rule = RecurrenceService.generateRuleString({
                    frequency: recurrenceFreq,
                    interval: recurrenceInterval,
                    startDate: new Date(startAtISO),
                    until: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined
                });
            }

            if (initialEvent) {
                await EventService.updateEvent(initialEvent.id, payload, user?.uid || '', assignedCrew, reservedEquipment);
            } else {
                await EventService.addEvent(payload, assignedCrew, reservedEquipment, autoGenerateTasks);
            }
            onSuccess();
        } catch (error: any) {
            console.error("Failed to create event:", error);
            const msg = error.message || "Failed to create event.";
            alert(`${msg} ${error.code === 'OFFLINE' ? '(Working offline)' : ''}`);
        } finally {
            setLoading(false);
        }
    };

    // Modern Input Style (Semantic)
    const inputContainerClasses = "relative group";
    const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-foreground/80 group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none";
    const inputClasses = `
        w-full 
        bg-background 
        text-foreground 
        placeholder:text-foreground/80
        border border-soft 
        rounded-2xl 
        py-4 pl-12 pr-4 
        outline-none 
        transition-all duration-200
        focus:border-primary/50 focus:ring-4 focus:ring-primary/10
        hover:border-foreground/20
    `;
    const labelClasses = "block text-sm font-medium text-foreground/70 mb-2";

    // Field State Styles (for role-based clarity)
    const lockedFieldClasses = "bg-muted/5 border-soft text-foreground/80 cursor-not-allowed";
    const derivedFieldClasses = "bg-muted/5 border-soft text-foreground/80 cursor-not-allowed";

    return (
        <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Title Section */}
            <div className="space-y-4">
                {user?.role === 'admin' && (
                    <div className="space-y-4 p-4 rounded-2xl bg-surface border border-soft">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label className="text-sm font-bold text-foreground block">System Event</label>
                                <span className="text-xs text-foreground/70 block mt-1">Recurring event for everyone</span>
                            </div>
                            <Switch
                                id="system-event"
                                checked={is_system_event}
                                onCheckedChange={setIsSystemEvent}
                            />
                        </div>
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

                <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/10 mt-4">
                    <div className="flex items-center gap-3">
                        <Clock size={20} className="text-foreground/80" />
                        <div>
                            <p className="text-sm font-bold text-foreground">All Day Event</p>
                            <p className="text-xs text-foreground/80">Event spans the entire calendar day</p>
                        </div>
                    </div>
                    <Switch 
                        checked={isAllDay} 
                        onCheckedChange={setIsAllDay}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/10">
                        <div className="flex items-center gap-3">
                            <Repeat size={20} className="text-foreground/80" />
                            <div>
                                <p className="text-sm font-bold text-foreground">Recurring Event</p>
                                <p className="text-xs text-foreground/80">Repeat this event on a schedule</p>
                            </div>
                        </div>
                        <Switch 
                            checked={isRecurring} 
                            onCheckedChange={setIsRecurring}
                        />
                    </div>

                    {isRecurring && (
                        <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Frequency</label>
                                    <Select value={recurrenceFreq} onValueChange={(val: any) => setRecurrenceFreq(val)}>
                                        <SelectTrigger className="w-full bg-background border-soft text-foreground h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-surface border-soft text-foreground z-[200]">
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Interval (Every X {recurrenceFreq.replace('ly', '')}s)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={recurrenceInterval}
                                            onChange={e => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                            className="w-full bg-background border border-soft rounded-md h-11 px-3 outline-none focus:border-primary/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={labelClasses}>Repeat Until <span className="text-foreground/80 text-xs">(Optional)</span></label>
                                <Popover open={recurrenceEndPopoverOpen} onOpenChange={setRecurrenceEndPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full bg-background border-soft text-foreground justify-start text-left font-normal h-11",
                                                !recurrenceEndDate && "text-foreground/80"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                            {recurrenceEndDate ? format(new Date(recurrenceEndDate), "PPP") : <span>No End Date (Continuous)</span>}
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

                {/* Demo Data Toggle */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <TestTube2 size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-200">Test / Demo Data</p>
                                    <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">Exclude from official reports</p>
                                </div>
                            </div>
                            <Switch
                                checked={is_demo_data}
                                onCheckedChange={setIsDemoData}
                            />
                        </div>
                    </div>
                )}
            </div>


            {/* Created By Section - Role-Based Behavior */}
            {
                !is_system_event && (
                    <>
                        {/* Admin/Team: Create On Behalf Of Toggle */}
                        {isPrivilegedRole && (
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
                                        <span className="text-xs text-foreground/70 block mt-1">
                                            {createOnBehalfOf ? "Event owned by a Department / Institution" : "Event owned by you (the user)"}
                                        </span>
                                    </div>
                                    <Switch
                                        id="create-on-behalf-of"
                                        checked={createOnBehalfOf}
                                        onCheckedChange={(checked) => {
                                            setCreateOnBehalfOf(checked);
                                            if (!checked) {
                                                setOnBehalfOfEntityName('');
                                                if (user?.department_id) setDepartment(String(user.department_id));
                                            } else {
                                                setOnBehalfOfEntityName(department);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Entity Selector (When ON) */}
                                {createOnBehalfOf && (
                                    <div className="pt-4 mt-4 border-t border-blue-500/20">
                                        <label className={labelClasses}>Requested On behalf of (Entity)</label>
                                        <div className={inputContainerClasses}>
                                            <Briefcase size={20} className={iconClasses} />
                                            <Select value={onBehalfOfEntityName} onValueChange={setOnBehalfOfEntityName}>
                                                <SelectTrigger className="w-full bg-background border-soft text-foreground h-14 rounded-2xl pl-12">
                                                    <SelectValue placeholder="Select Department / Institution" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-surface border-soft text-foreground max-h-80 z-[200]">
                                                    <SelectGroup>
                                                        <SelectLabel className="text-foreground/70 text-xs font-bold uppercase tracking-wider px-2 py-1.5">Departments / Units</SelectLabel>
                                                        {departmentsList.map(dept => (
                                                            <SelectItem key={`dept-${dept.id}`} value={String(dept.id)}>{dept.name}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                    <SelectGroup>
                                                        <SelectLabel className="text-foreground/70 text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Institutions</SelectLabel>
                                                        {institutionsList.map(inst => (
                                                            <SelectItem key={`inst-${inst.id}`} value={String(inst.id)}>{inst.name}</SelectItem>
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
                                <p className="text-xs text-foreground/70 mt-1.5">
                                    {user?.role === 'admin' ? 'Your account' : 'Auto-filled from your profile'}
                                </p>
                            </div>
                        )}
                    </>
                )
            }


            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label className={labelClasses}>Start Date</label>
                    <div className={inputContainerClasses}>
                        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        inputClasses,
                                        "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                        !date && "text-foreground/80 font-normal"
                                    )}
                                >
                                    <CalendarIcon size={20} className="text-muted shrink-0" />
                                    <span className="truncate">
                                        {date ? format(new Date(date), "MMM dd, yyyy") : "Pick start date"}
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

                {!is_system_event && !isAllDay && (
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
                                            !time && "text-foreground/80 font-normal"
                                        )}
                                    >
                                        <Clock size={20} className="text-muted shrink-0" />
                                        <span className="truncate">
                                            {time ? (() => {
                                                const [h, m] = time.split(':');
                                                const date = new Date();
                                                date.setHours(parseInt(h), parseInt(m));
                                                return format(date, 'h:mm a');
                                            })() : "Pick start time"}
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

                <div className="space-y-2">
                    <label className={labelClasses}>End Date</label>
                    <div className={inputContainerClasses}>
                        <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        inputClasses,
                                        "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                        !endDate && "text-foreground/80 font-normal"
                                    )}
                                >
                                    <CalendarIcon size={20} className="text-muted shrink-0" />
                                    <span className="truncate">
                                        {endDate ? format(new Date(endDate), "MMM dd, yyyy") : "Pick end date"}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-soft bg-surface text-foreground z-[200]" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate ? new Date(endDate) : undefined}
                                    onSelect={(d) => {
                                        setEndDate(d ? format(d, 'yyyy-MM-dd') : '');
                                        setEndDatePopoverOpen(false);
                                    }}
                                    initialFocus
                                    disabled={(d) => date ? isBefore(startOfDay(d), startOfDay(new Date(date))) : false}
                                    className="bg-surface text-foreground rounded-xl border border-soft"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {!is_system_event && !isAllDay && (
                    <div className="space-y-2">
                        <label className={labelClasses}>End Time</label>
                        <div className={inputContainerClasses}>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            inputClasses,
                                            "flex items-center justify-start gap-3 pl-4 h-14 font-medium",
                                            !endTime && "text-foreground/80 font-normal"
                                        )}
                                    >
                                        <Clock size={20} className="text-muted shrink-0" />
                                        <span className="truncate">
                                            {endTime ? (() => {
                                                const [h, m] = endTime.split(':');
                                                const date = new Date();
                                                date.setHours(parseInt(h), parseInt(m));
                                                return format(date, 'h:mm a');
                                            })() : "Pick end time"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none bg-transparent z-[200]" align="start">
                                    <TimePicker value={endTime} onChange={setEndTime} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}
            </div>

            {/* Location */}
            <div className="space-y-2">
                <label className={labelClasses}>Location <span className="text-foreground/80 text-xs">(Optional)</span></label>
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
                        {/* Department / Institution */}
                        <div className="space-y-2">
                            <label className={labelClasses}>Department / Institution</label>
                            {isPrivilegedRole ? (
                                // Admin: Always Editable Dropdown
                                <div className={inputContainerClasses}>
                                    <Briefcase size={20} className={iconClasses} />
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger className="w-full bg-background border-soft text-foreground h-14 rounded-2xl pl-12">
                                            <SelectValue placeholder="Select Department / Institution" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-surface border-soft text-foreground max-h-80 z-[200]">
                                            <SelectGroup>
                                                <SelectLabel className="text-foreground/70 text-xs font-bold uppercase tracking-wider px-2 py-1.5">Departments / Institutions</SelectLabel>
                                                {departmentsList.map(dept => (
                                                    <SelectItem key={`dept-${dept.id}`} value={String(dept.id)}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel className="text-foreground/70 text-xs font-bold uppercase tracking-wider px-2 py-1.5 mt-2">Institutions</SelectLabel>
                                                {institutionsList.map(inst => (
                                                    <SelectItem key={`inst-${inst.id}`} value={String(inst.id)}>{inst.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                // Member/Team: Read-only (auto-filled from user profile)
                                <>
                                    <div className={inputContainerClasses}>
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted z-10" />
                                        <div className={`w-full border rounded-2xl py-4 pl-12 pr-4 flex items-center ${derivedFieldClasses}`}>
                                            <span>{department}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-foreground/70 mt-1.5">Derived from your department</p>
                                </>
                            )}
                        </div>
                    </>
                )
            }

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
                                                    ${isSelected ? 'bg-primary border-primary scale-110' : 'border-foreground/20 bg-foreground/5'}
                                                `}>
                                                    {isSelected && <Check size={12} className="text-primary-foreground stroke-[3]" />}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'}`}>
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

                        {/* Auto-generate Tasks Toggle */}
                        <div className="p-5 rounded-2xl border border-soft bg-surface mt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <label className="text-sm font-bold text-foreground block">Auto-generate Actionable Tasks</label>
                                    <span className="text-xs text-foreground/70 block mt-1">
                                        Creates Preparation, Execution, and Post Production tasks automatically.
                                    </span>
                                </div>
                                <Switch
                                    id="auto-generate-tasks"
                                    checked={autoGenerateTasks}
                                    onCheckedChange={setAutoGenerateTasks}
                                />
                            </div>
                        </div>
                    </>

            {/* Crew Section */}
            <div className="space-y-4">
                <label className={`${labelClasses} flex items-center gap-2`}>
                    <User size={14} className="text-blue-400" />
                    Crew Assignment
                </label>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative group">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full h-12 bg-background border-soft justify-start text-foreground/70">
                                        + Add Team Member
                                    </Button>
                                </PopoverTrigger>
                                 <PopoverContent className="w-[320px] p-0 bg-[var(--glass-liquid-bg)] border-border shadow-2xl shadow-black/50 backdrop-blur-2xl z-[205] rounded-2xl overflow-hidden">
                                    <Command className="bg-transparent">
                                        <div className="flex items-center border-b border-foreground/5 px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                            <CommandInput 
                                                placeholder="Search team members..." 
                                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-foreground/70 disabled:cursor-not-allowed disabled:opacity-50" 
                                            />
                                        </div>
                                        <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-1">
                                            <CommandEmpty className="py-6 text-center text-sm text-foreground/70">No team member found.</CommandEmpty>
                                            <CommandGroup>
                                                {teamMembers.map((member) => (
                                                    <CommandItem
                                                        key={member.uid}
                                                        onSelect={() => {
                                                            if (!assignedCrew.find(c => c.user_id === member.uid)) {
                                                                setAssignedCrew([...assignedCrew, { user_id: member.uid, name: member.name, role: '' }]);
                                                            }
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/70 aria-selected:bg-foreground/10 aria-selected:text-foreground cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                                        </div>
                                                        <span className="flex-1 text-sm font-medium">{member.name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {assignedCrew.map((crew, index) => (
                            <div key={crew.user_id} className="flex gap-2 items-center p-3 rounded-xl bg-surface border border-soft group">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-foreground">{crew.name}</div>
                                    <input 
                                        placeholder="Role (e.g. Camera Op)" 
                                        className="text-xs bg-transparent border-none outline-none text-foreground/80 focus:text-primary p-0 h-auto"
                                        value={crew.role}
                                        onChange={(e) => {
                                            const newCrew = [...assignedCrew];
                                            newCrew[index].role = e.target.value;
                                            setAssignedCrew(newCrew);
                                        }}
                                    />
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setAssignedCrew(prev => prev.filter(c => c.user_id !== crew.user_id))}
                                    className="text-foreground/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Equipment Section */}
            <div className="space-y-4">
                <label className={`${labelClasses} flex items-center gap-2`}>
                    <Camera size={14} className="text-blue-400" />
                    Equipment Reservation
                </label>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative group">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full h-12 bg-background border-soft justify-start text-foreground/70">
                                        + Reserve Equipment
                                    </Button>
                                </PopoverTrigger>
                                 <PopoverContent className="w-[320px] p-0 bg-[var(--glass-liquid-bg)] border-border shadow-2xl shadow-black/50 backdrop-blur-2xl z-[205] rounded-2xl overflow-hidden">
                                    <Command className="bg-transparent">
                                        <div className="flex items-center border-b border-foreground/5 px-3">
                                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                            <CommandInput 
                                                placeholder="Search inventory..." 
                                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-foreground/70 disabled:cursor-not-allowed disabled:opacity-50" 
                                            />
                                        </div>
                                        <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-1">
                                            <CommandEmpty className="py-6 text-center text-sm text-foreground/70">No equipment found.</CommandEmpty>
                                            <CommandGroup>
                                                {inventoryList.map((item) => (
                                                    <CommandItem
                                                        key={item.id}
                                                        onSelect={() => {
                                                            if (!reservedEquipment.find(e => e.inventory_id === item.id)) {
                                                                const startIso = new Date(`${date}T${time || '09:00'}`).toISOString();
                                                                const endIso = endDate ? new Date(`${endDate}T${endTime || time || '10:00'}`).toISOString() : new Date(`${date}T23:59:59`).toISOString();
                                                                const newEntry = { inventory_id: item.id, name: item.name, reserved_from: startIso, reserved_to: endIso };
                                                                setReservedEquipment([...reservedEquipment, newEntry]);
                                                                checkConflicts([...reservedEquipment, newEntry]);
                                                            }
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/70 aria-selected:bg-foreground/10 aria-selected:text-foreground cursor-pointer transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                            <Package size={14} />
                                                        </div>
                                                        <div className="flex-1 flex flex-col">
                                                            <span className="text-sm font-medium">{item.name}</span>
                                                            <span className="text-[10px] text-foreground/70 uppercase tracking-tighter">{item.category || 'General'}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {reservedEquipment.map((equip) => {
                            const conflicts = equipmentConflicts[equip.inventory_id] || [];
                            const hasConflict = conflicts.length > 0;
                            return (
                                <div key={equip.inventory_id} className={cn(
                                    "flex flex-col gap-2 p-3 rounded-xl bg-surface border group",
                                    hasConflict ? "border-red-500/50 bg-red-500/5" : "border-soft"
                                )}>
                                    <div className="flex justify-between items-center w-full">
                                        <div className="text-sm font-medium text-foreground">{equip.name}</div>
                                        <button 
                                            type="button"
                                            onClick={() => setReservedEquipment(prev => prev.filter(e => e.inventory_id !== equip.inventory_id))}
                                            className="text-foreground/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    {hasConflict && (
                                        <div className="flex items-center gap-2 text-[10px] text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded">
                                            <AlertTriangle size={10} />
                                            Conflict: Reserved by "{conflicts[0].event?.title}"
                                            {user?.role === 'admin' && " (Override allowed)"}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isCheckingConflicts && <div className="text-[10px] text-foreground/70 italic">Checking availability...</div>}
                    </div>
                </div>
            </div>

            {/* Media Coverage */}

            {/* Actions */}
            <div className={`flex gap-4 ${isModal ? 'pt-2' : 'pt-6 mt-6 border-t border-soft'}`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 text-sm font-bold text-foreground/80 bg-surface hover:bg-foreground/5 rounded-2xl transition-colors hover:text-foreground border border-soft"
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
                            {initialEvent ? 'Saving...' : 'Creating...'}
                        </>
                    ) : (
                        initialEvent ? 'Save Changes' : 'Create Event'
                    )}
                </button>
            </div>
        </form >
    );
};
