'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, User, Briefcase, Flag, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { TaskService } from '@/services/tasks';
import { UserService } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { apiClient } from '@/lib/apiClient';

export default function TasksNewClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = searchParams.get('campaignId');
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [campaignName, setCampaignName] = useState<string>('');

    useEffect(() => {
        if (campaignId) {
            apiClient<{ campaign: { name: string } }>(`/api/campaigns/${campaignId}`)
                .then(res => setCampaignName(res.campaign.name))
                .catch(err => console.error("Failed to fetch campaign name", err));
        }
    }, [campaignId]);

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: string; name: string }[]>([]);

    if (!user) return null;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Create As Logic
    const canCreateOnBehalf = user.role === 'admin' || user.role === 'team';
    const [createAs, setCreateAs] = useState<'myself' | 'onBehalfOf'>('myself');

    // Unified state for department or institution
    const [selectedOrgId, setSelectedOrgId] = useState<string>(''); // Format: dept_{id} or inst_{id}
    const [onBehalfOfId, setOnBehalfOfId] = useState<string>('');

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

    // Auto-fill from user defaults
    // Auto-fill from user defaults
    // We use a separate effect for this to ensure it runs when either User defaults exist OR when lists are loaded.
    // We explicitly check length inside to avoid adding the arrays themselves to the dependency list if they are causing strict mode issues,
    // though typically state arrays are stable. The error "changed size" suggests something else might be going on, 
    // so we will stringify the dependence or just use the length as a proxy for "loaded".
    useEffect(() => {
        if (departmentsList.length === 0 && institutionsList.length === 0) return;

        // Helper to find dept/inst
        // Check Explicit IDs first (New standard), then explicit defaults, then name matches
        const userDeptId = user.departmentId || user.defaultDepartment;
        const userInstId = user.institutionId || user.defaultInstitution;

        if (userDeptId) {
            const dept = departmentsList.find(d => d.id === userDeptId || d.name === userDeptId);
            if (dept) {
                setSelectedOrgId(`dept_${dept.id}`);
                return;
            }
        }

        if (userInstId) {
            const inst = institutionsList.find(i => i.id === userInstId || i.name === userInstId);
            if (inst) {
                setSelectedOrgId(`inst_${inst.id}`);
                return;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.departmentId, user.institutionId, user.defaultDepartment, user.defaultInstitution, departmentsList.length, institutionsList.length]);

    const isGuest = user?.role?.toLowerCase() === 'guest';
    const isAdmin = user?.role === 'admin';
    const isTeam = user?.role === 'team';

    // Fetch real team members from Firestore
    useEffect(() => {
        const fetchTeamMembers = async () => {
            const members = await UserService.getTeamMembers();
            // Filter out current user explicitly
            // Also exclude "media@thaibagarden.com" (Media Admin) from the list
            const otherMembers = members.filter(m =>
                m.uid !== user?.uid &&
                m.name !== 'Media Admin'
            );
            setTeamMembers(otherMembers);
        };
        fetchTeamMembers();
    }, [user?.uid]);
    // ...
    // ...


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !dueDate || !selectedOrgId) {
            alert('Please fill all required fields');
            return;
        }
        setLoading(true);

        try {
            let finalAssignedTo: { uid: string; name: string }[] = [];

            if (isAdmin) {
                // Admin selected multiple people
                // Map selected IDs to user objects
                finalAssignedTo = assignedToIds.map(id => {
                    // Need to find member object from ID.
                    // In the render loop we map teamMembers. Let's look it up here.
                    // Note: mockMembers was used in previous code, but we have teamMembers state now.
                    // However, teamMembers state doesn't track "Myself".
                    // Let's rely on finding them in the combined list or just constructing if we have info.
                    // Actually, earlier code had `mockMembers` error.
                    // We should use `teamMembers` + `user`.

                    const member = teamMembers.find(m => m.uid === id);
                    if (member) return { uid: member.uid, name: member.name };
                    return null;
                }).filter(Boolean) as { uid: string; name: string }[];

            } else if (isTeam) {
                // Team assigns self
                finalAssignedTo = [{ uid: user.uid, name: user.name || 'Unknown' }];
            }
            // Guest: finalAssignedTo remains empty array (Admin assigns later)

            // Prepare On Behalf Of Data
            let onBehalfOfData = undefined;
            // Only process if toggle is Active AND we have a selected ID
            if (canCreateOnBehalf && createAs === 'onBehalfOf' && onBehalfOfId) {
                if (onBehalfOfId.startsWith('dept_')) {
                    const id = onBehalfOfId.split('_')[1];
                    const dept = departmentsList.find(d => d.id === id);
                    if (dept) onBehalfOfData = { id: dept.id, name: dept.name, type: 'department' };
                } else if (onBehalfOfId.startsWith('inst_')) {
                    const id = onBehalfOfId.split('_')[1];
                    const inst = institutionsList.find(i => i.id === id);
                    if (inst) onBehalfOfData = { id: inst.id, name: inst.name, type: 'institution' };
                }
            }

            // Resolve Structure IDs
            let departmentId = null;
            let institutionId = undefined;
            let departmentName = '';

            if (selectedOrgId.startsWith('dept_')) {
                const id = selectedOrgId.split('_')[1];
                departmentId = id;
                const d = departmentsList.find(dep => dep.id === id);
                departmentName = d ? d.name : '';
            } else if (selectedOrgId.startsWith('inst_')) {
                const id = selectedOrgId.split('_')[1];
                institutionId = id;
                departmentId = null;
            }

            const { id: newTaskId } = await TaskService.addTask({
                title,
                description,
                status: isGuest ? 'pending' : 'todo', // Guest defaults to Pending
                priority: isGuest ? 'low' : priority,
                dueDate: dueDate ? dueDate.toISOString() : new Date().toISOString(), // Fallback to now if somehow empty
                department: departmentName,
                departmentId,
                institutionId,
                assignedBy: {
                    uid: user.uid,
                    name: user.officialName || user.name || user.email || 'Unknown',
                    role: user.role
                },
                createdBy: {
                    uid: user.uid,
                    name: user.officialName || user.name || user.email || 'Unknown',
                    role: user.role
                },
                assignedTo: finalAssignedTo.length > 0 ? finalAssignedTo : undefined,
                campaignId: campaignId || undefined,
                onBehalfOf: onBehalfOfData
            } as any); // Cast because TaskService might be strict

            // Upload Attachments
            if (files.length > 0) {
                setUploadProgress(`0/${files.length}`);
                let uploadedCount = 0;
                for (const file of files) {
                    try {
                        await TaskService.uploadAttachment(newTaskId, file, 'requester-inputs');
                        uploadedCount++;
                        setUploadProgress(`${uploadedCount}/${files.length}`);
                    } catch (e) {
                        console.error(`Failed to upload ${file.name}`, e);
                        // Don't halt the whole process, just log
                    }
                }
            }

            // Notify Admins if Guest created it
            if (isGuest) {
                try {
                    const { NotificationService } = await import('@/services/notificationService');
                    const admins = await UserService.getAdmins();

                    await Promise.all(admins.map(admin =>
                        NotificationService.createNotification({
                            userId: admin.uid,
                            sourceUserId: user.uid,
                            type: 'task_assigned', // Using valid type
                            title: 'New Pending Task',
                            message: `${user.officialName || user.name || user.email || 'Guest'} created "${title}"`,
                            entityType: 'task',
                            entityId: newTaskId,
                            actionUrl: `/tasks/view?id=${newTaskId}`,
                            priority: 'medium'
                        })
                    ));
                } catch (e) {
                    console.error("Failed to notify admins", e);
                }
            }

            router.push('/tasks');
        } catch (error: any) {
            console.error(error);
            alert('Failed to create task: ' + (error.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 relative">
            {/* Centered Card */}
            <div className="w-full max-w-xl relative z-10">
                <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <button
                            onClick={() => router.back()}
                            className="text-red-400/80 font-medium hover:text-red-300 transition-colors text-sm hover:bg-white/5 px-3 py-1.5 rounded-full"
                        >
                            Cancel
                        </button>
                        <h1 className="text-lg font-bold text-white tracking-wide">New Task</h1>
                        {/* Spacer for balance */}
                        <div className="w-[50px]"></div>
                    </div>

                    {campaignName && (
                        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Building size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Attached to Campaign</p>
                                <p className="text-sm text-white font-bold">{campaignName}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Create As Toggle - Admin/Team Only */}
                        {canCreateOnBehalf && (
                            <div className="flex bg-white/5 p-1 rounded-xl w-full mb-4">
                                <button
                                    type="button"
                                    onClick={() => setCreateAs('myself')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${createAs === 'myself' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    As Myself
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreateAs('onBehalfOf')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${createAs === 'onBehalfOf' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    On Behalf Of
                                </button>
                            </div>
                        )}

                        {/* Title & Desc Group */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-white/70 mb-2">Task Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Task title..."
                                    className="w-full bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5 shadow-inner focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 font-medium text-white text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Add details..."
                                    rows={4}
                                    className="w-full bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5 shadow-inner focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 resize-none text-white/90 leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* Date & Department/Institution Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Due Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full bg-white/5 hover:bg-white/10 pl-10 pr-4 py-3 h-auto rounded-xl border border-[#ffffff1a] focus:border-blue-500/50 hover:text-white text-left font-normal justify-start relative text-sm text-white",
                                                !dueDate && "text-white/40"
                                            )}
                                        >
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                                                <CalendarIcon size={14} />
                                            </div>
                                            {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#10111a] border-[#ffffff1a] text-white z-[200]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dueDate}
                                            onSelect={setDueDate}
                                            initialFocus
                                            fromDate={new Date()}
                                            className="bg-[#10111a] text-white"
                                            classNames={{
                                                day_selected: "bg-blue-600 text-white rounded-full", // Fallback
                                                day_today: "bg-white/10 text-white rounded-full",
                                                day: "text-white hover:bg-white/10 rounded-full w-9 h-9 p-0 font-normal aria-selected:opacity-100",
                                                head_cell: "text-white/50 w-9 font-normal text-[0.8rem]",
                                                caption_label: "text-white",
                                                nav_button: "text-white hover:bg-white/10 rounded-full",
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Unified Department or Institution Dropdown (Myself Mode) */}
                            {createAs === 'myself' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Requested By <span className="text-white/40 text-xs">(Department / Unit / Office)</span>
                                    </label>

                                    {isGuest ? (
                                        /* Read-Only View for Guests */
                                        <div className="w-full bg-white/5 pl-4 pr-4 py-3 rounded-xl border border-[#ffffff1a] text-sm text-white flex items-center gap-3">
                                            <Briefcase size={14} className="text-gray-400" />
                                            <span>
                                                {(() => {
                                                    if (!selectedOrgId) return <span className="text-gray-500 italic">No Department Assigned (Contact Admin)</span>;
                                                    if (selectedOrgId.startsWith('dept_')) {
                                                        const id = selectedOrgId.split('_')[1];
                                                        return departmentsList.find(d => d.id === id)?.name || "Unknown Department";
                                                    }
                                                    if (selectedOrgId.startsWith('inst_')) {
                                                        const id = selectedOrgId.split('_')[1];
                                                        return institutionsList.find(i => i.id === id)?.name || "Unknown Institution";
                                                    }
                                                    return "Unknown Unit";
                                                })()}
                                            </span>
                                            {selectedOrgId && <span className="ml-auto text-xs text-green-400/70 italic">Auto-set</span>}
                                        </div>
                                    ) : (
                                        /* Interactive Dropdown for others */
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                                                <Briefcase size={14} />
                                            </div>
                                            <select
                                                value={selectedOrgId}
                                                onChange={(e) => setSelectedOrgId(e.target.value)}
                                                className="w-full bg-white/5 hover:bg-white/10 pl-10 pr-8 py-3 rounded-xl border border-[#ffffff1a] focus:border-blue-500/50 outline-none text-sm text-white appearance-none [&>optgroup]:bg-[#13161c] [&>option]:bg-[#13161c] cursor-pointer transition-colors"
                                            >
                                                <option value="" className="bg-[#13161c]">Select Requesting Unit...</option>

                                                <optgroup label="OFFICES / UNITS" className="bg-[#13161c] text-gray-500 font-bold">
                                                    {departmentsList.map(dept => (
                                                        <option key={dept.id} value={`dept_${dept.id}`} className="bg-[#13161c] text-gray-300 font-normal">
                                                            {dept.name}
                                                        </option>
                                                    ))}
                                                </optgroup>

                                                <optgroup label="INSTITUTIONS" className="bg-[#13161c] text-gray-500 font-bold">
                                                    {institutionsList.map(inst => (
                                                        <option key={inst.id} value={`inst_${inst.id}`} className="bg-[#13161c] text-gray-300 font-normal">
                                                            {inst.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Identity Selector (On Behalf Of Mode) - Replaces Department */}
                            {canCreateOnBehalf && createAs === 'onBehalfOf' && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-sm font-medium text-blue-400 mb-2">
                                        Publishing On Behalf Of <span className="text-white/40 text-xs">(Identity)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-500/50">
                                            <Flag size={14} />
                                        </div>
                                        <select
                                            value={onBehalfOfId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setOnBehalfOfId(val);
                                                // Auto-sync selectedOrg with the chosen Identity name
                                                if (val) {
                                                    setSelectedOrgId(val);
                                                } else {
                                                    setSelectedOrgId('');
                                                }
                                            }}
                                            className="w-full bg-blue-500/10 hover:bg-blue-500/20 pl-10 pr-8 py-3 rounded-xl border border-blue-500/30 focus:border-blue-500 outline-none text-sm text-blue-100 appearance-none [&>optgroup]:bg-[#13161c] [&>option]:bg-[#13161c] cursor-pointer transition-colors"
                                        >
                                            <option value="" className="bg-[#13161c]">Select Identity...</option>

                                            <optgroup label="OFFICES / UNITS" className="bg-[#13161c] text-gray-500 font-bold">
                                                {departmentsList.map(dept => (
                                                    <option key={`dept_${dept.id}`} value={`dept_${dept.id}`} className="bg-[#13161c] text-gray-300 font-normal">
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </optgroup>

                                            <optgroup label="INSTITUTIONS" className="bg-[#13161c] text-gray-500 font-bold">
                                                {institutionsList.map(inst => (
                                                    <option key={`inst_${inst.id}`} value={`inst_${inst.id}`} className="bg-[#13161c] text-gray-300 font-normal">
                                                        {inst.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-blue-500/50">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Priority - Admin Only */}
                        {isAdmin && (
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Priority
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`relative overflow-hidden py-3 rounded-xl text-sm font-medium transition-all duration-300 ${priority === p
                                                ? p === 'high' ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                                                    p === 'medium' ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]' :
                                                        'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                : 'bg-white/5 border border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-400'
                                                }`}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assigned To - Admin Only */}
                        {isAdmin && (
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-medium text-white/70 mb-2">
                                    Assign To Team Members
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                    {teamMembers.map(m => (
                                        <label
                                            key={m.uid}
                                            className={`group flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${assignedToIds.includes(m.uid)
                                                ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/10 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${assignedToIds.includes(m.uid) ? 'border-blue-400 bg-blue-500' : 'border-gray-600 bg-transparent group-hover:border-gray-500'
                                                }`}>
                                                {assignedToIds.includes(m.uid) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={assignedToIds.includes(m.uid)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setAssignedToIds([...assignedToIds, m.uid]);
                                                    } else {
                                                        setAssignedToIds(assignedToIds.filter(id => id !== m.uid));
                                                    }
                                                }}
                                            />
                                            <span className={`ml-3 text-sm font-medium transition-colors ${assignedToIds.includes(m.uid) ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                {m.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Attachments Section */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <label className="block text-sm font-medium text-white/70 mb-2">
                                Attachments <span className="text-white/40 text-xs">(Optional)</span>
                            </label>
                            <div className="bg-white/5 rounded-2xl border border-dashed border-white/10 p-6 text-center hover:bg-white/10 transition-colors relative group">
                                <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                />
                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                    </div>
                                    <p className="text-sm text-gray-400 group-hover:text-gray-300">
                                        Click or drag files here
                                    </p>
                                </div>
                            </div>
                            {/* File List */}
                            {files.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-xs text-gray-300 truncate max-w-[200px]">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                className="text-gray-500 hover:text-red-400 p-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Read Only Info */}
                        <div className="pt-6 mt-2 border-t border-white/5 flex items-center justify-between opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {(user.name || 'U').charAt(0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Assigning as <span className="text-gray-300">
                                        {createAs === 'onBehalfOf' ? (
                                            onBehalfOfId ? ( // Lookup name
                                                departmentsList.find(d => `dept_${d.id}` === onBehalfOfId)?.name ||
                                                institutionsList.find(i => `inst_${i.id}` === onBehalfOfId)?.name || 'Unknown'
                                            ) : '...'
                                        ) : (user.name || 'Unknown')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover-sheen active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    {uploadProgress ? `Uploading (${uploadProgress})...` : 'Saving...'}
                                </>
                            ) : (
                                'Create Task'
                            )}
                        </button>

                    </form>
                </div>
            </div >
        </div >
    );
}
