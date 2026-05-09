'use client';
// Build Trigger: 9e32e45b (Fix Service Types)

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, User, Briefcase, Flag, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { format } from "date-fns";
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { useFormState } from '@/hooks/useFormState';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { apiClient } from '@/lib/apiClient';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { toast } from 'sonner';
import { COPY } from '@/lib/copy';
import { tenantContext } from '@/lib/auth/tenantContext';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';

export default function TasksNewClient() {
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const campaign_id = searchParams.get('campaign_id');
    const { user } = useAuth();
    const { currentRole, currentWorkspaceId } = useWorkspace();
    const [error, setError] = useState<string | null>(null);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [campaignName, setCampaignName] = useState<string>('');

    useEffect(() => {
        if (campaign_id) {
            apiClient<{ campaign: { name: string } }>(`/api/campaigns/${campaign_id}`)
                .then(res => setCampaignName(res.campaign.name))
                .catch(err => console.error("Failed to fetch campaign name", err));
        }
    }, [campaign_id]);

    // Organization Data
    const [departmentsList, setDepartmentsList] = useState<{ id: string | number; name: string }[]>([]);
    const [institutionsList, setInstitutionsList] = useState<{ id: string | number; name: string }[]>([]);

    if (!user) return null;

    const isAdmin = currentRole?.toLowerCase() === 'admin';
    const isTeam = currentRole?.toLowerCase() === 'manager' || currentRole?.toLowerCase() === 'team';
    const isMember = currentRole?.toLowerCase() === 'member';
    const canCreateOnBehalf = isAdmin || isTeam;

    const { state: formData, setState: setFormData, clearDraft, isDraftSaved } = useFormState({
        key: 'draft:task:new',
        initialState: {
            title: '',
            description: '',
            due_date: undefined as string | undefined,
            priority: 'medium' as 'low' | 'medium' | 'high',
            assignedToIds: [] as string[],
            selectedOrgId: '',
            isDelegating: false
        }
    });

    const { title, description, priority, assignedToIds, selectedOrgId, isDelegating } = formData;
    const due_date = formData.due_date ? new Date(formData.due_date) : undefined;

    const setTitle = (val: string) => setFormData(prev => ({ ...prev, title: val }));
    const setDescription = (val: string) => setFormData(prev => ({ ...prev, description: val }));
    const setDueDate = (val: Date | undefined) => setFormData(prev => ({ ...prev, due_date: val ? val.toISOString() : undefined }));
    const setPriority = (val: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: val }));
    const setAssignedToIds = (val: string[] | ((prev: string[]) => string[])) => setFormData(prev => ({ 
        ...prev, 
        assignedToIds: typeof val === 'function' ? val(prev.assignedToIds) : val 
    }));
    const setSelectedOrgId = (val: string) => setFormData(prev => ({ ...prev, selectedOrgId: val }));
    const setIsDelegating = (val: boolean) => setFormData(prev => ({ ...prev, isDelegating: val }));

    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Save persistence
    useEffect(() => {
        if (typeof window !== 'undefined' && selectedOrgId) {
            sessionStorage.setItem('task-org-pref', selectedOrgId);
        }
    }, [selectedOrgId]);

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
    // We use a separate effect for this to ensure it runs when either User defaults exist OR when lists are loaded.
    // We explicitly check length inside to avoid adding the arrays themselves to the dependency list if they are causing strict mode issues,
    // though typically state arrays are stable. The error "changed size" suggests something else might be going on, 
    // so we will stringify the dependence or just use the length as a proxy for "loaded".
    useEffect(() => {
        if (departmentsList.length === 0 && institutionsList.length === 0) return;

        // Helper to find dept/inst
        // Check Explicit IDs first (New standard), then explicit defaults, then name matches
        const userDeptId = user.department_id || user.department_id || user.department_id;
        const userInstId = user.institution_id || user.institution_id || user.default_institution || user.institution_id;

        // 1. Auto-select if ONLY one option exists (Friction Removal)
        const totalOptions = departmentsList.length + institutionsList.length;
        if (totalOptions === 1) {
            if (departmentsList.length === 1) {
                setSelectedOrgId(`dept_${departmentsList[0].id}`);
                return;
            }
            if (institutionsList.length === 1) {
                setSelectedOrgId(`inst_${institutionsList[0].id}`);
                return;
            }
        }

        // 2. User Defaults
        if (userDeptId) {
            const dept = departmentsList.find(d => String(d.id) === String(userDeptId) || d.name === String(userDeptId));
            if (dept) {
                setSelectedOrgId(`dept_${dept.id}`);
                return;
            }
        }

        if (userInstId) {
            const inst = institutionsList.find(i => String(i.id) === String(userInstId) || i.name === String(userInstId));
            if (inst) {
                setSelectedOrgId(`inst_${inst.id}`);
                return;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.department_id, user.institution_id, user.department_id, user.institution_id, departmentsList.length, institutionsList.length]);

    // Role derived above to ensure consistency across the component lifecycle
    console.log("[TasksNew] User Role Detection (Active Context):", { role: currentRole, isAdmin, isTeam, isMember });

    // Fetch real team members from Firestore
    useEffect(() => {
        const fetchTeamMembers = async () => {
            // Use the user's current institution/workspace context, not the 'Requested By' selection.
            // This ensures you can always assign tasks to your own team members.
            const contextId = currentWorkspaceId;
            const members = await UserService.getTeamMembers(contextId);

            // Context-Aware Filter
            const filtered = members.filter(m => {
                const role = (m as any).role?.toLowerCase().trim();
                const isCreator = m.uid === user?.uid;
                const isMediaAdmin = m.name === 'Media Admin';
                
                // Allow standard non-admin roles for assignment
                const isValidRole = ['manager', 'team', 'member'].includes(role);

                // Role and System exclusion
                return (
                    isValidRole &&
                    !isMediaAdmin
                );
            });
            
            setTeamMembers(filtered);
        };
        fetchTeamMembers();
    }, [user?.uid, currentWorkspaceId, selectedOrgId]);
    // ...
    // ...


    const submitTask = async () => {
        setError(null);
        
        // Comprehensive Validation Check
        if (!title.trim()) {
            throw new Error("Task title is required.");
        }
        if (!due_date) {
            throw new Error("Please select a due date.");
        }
        if (!selectedOrgId) {
            throw new Error("Please select a Department / Institution.");
        }

        try {
            const { tenantId } = await tenantContext();
            let finalAssignedTo: { uid: string; name: string }[] = [];

            if (isAdmin || isTeam) {
                finalAssignedTo = assignedToIds.map(id => {
                    // Let's rely on finding them in the combined list or just constructing if we have info.
                    // Actually, earlier code had `mockMembers` error.
                    // We should use `teamMembers` + `user`.

                    const member = teamMembers.find(m => m.uid === id);
                    if (member) return { uid: member.uid, name: member.name };
                    return null;
                }).filter(Boolean) as { uid: string; name: string }[];

                // Fallback: If no one selected, assign to self
                if (finalAssignedTo.length === 0) {
                    finalAssignedTo = [{ uid: user.uid, name: user.name || 'Unknown' }];
                }
            }
            // Member: finalAssignedTo remains empty array (Admin assigns later)
 
            // Prepare On Behalf Of Data
            let onBehalfOfData = undefined;
            const userDeptId = user.department_id ? `dept_${user.department_id}` : null;
            const userInstId = user.institution_id ? `inst_${user.institution_id}` : null;
            
            // Only treat as 'On Behalf Of' if explicitly delegating and selected something other than defaults
            // OR if it's a different entity even if not 'explicitly' delegating (safety fallback)
            if (selectedOrgId && (selectedOrgId !== userDeptId && selectedOrgId !== userInstId)) {
                if (selectedOrgId.startsWith('dept_')) {
                    const id = selectedOrgId.split('_')[1];
                    const dept = departmentsList.find(d => String(d.id) === id);
                    if (dept) onBehalfOfData = { id: dept.id, name: dept.name, type: 'department' };
                } else if (selectedOrgId.startsWith('inst_')) {
                    const id = selectedOrgId.split('_')[1];
                    const inst = institutionsList.find(i => String(i.id) === id);
                    if (inst) onBehalfOfData = { id: inst.id, name: inst.name, type: 'institution' };
                }
            }
 
            // Resolve Structure IDs
            let department_id = null;
            let institution_id = user.institution_id;
            let departmentName = '';
 
            if (selectedOrgId.startsWith('dept_')) {
                const id = selectedOrgId.split('_')[1];
                const isNumeric = /^\d+$/.test(id);
                department_id = isNumeric ? parseInt(id) : null;
                const d = departmentsList.find(dep => String(dep.id) === id);
                departmentName = d ? d.name : '';
                // Ensure institution_id is carried over if available
                if (!institution_id) institution_id = user.institution_id;
            } else if (selectedOrgId.startsWith('inst_')) {
                const id = selectedOrgId.split('_')[1];
                institution_id = id;
                department_id = null;
            }
 
            const newTaskData = {
                title,
                description,
                status: isMember ? 'pending' : 'todo',
                priority: isMember ? 'low' : priority,
                due_date: due_date ? (typeof due_date === 'string' ? new Date(due_date).toISOString() : (due_date as Date).toISOString()) : new Date().toISOString(),
                department: departmentName,
                department_id: department_id,
                institution_id: institution_id,
                assigned_by: user.uid,
                created_by: user.uid,
                assigned_to: finalAssignedTo.length > 0 ? finalAssignedTo : undefined,
                campaign_id: campaign_id || undefined,
                on_behalf_of: onBehalfOfData
            };
 
            const { data: newTask, error: insertError } = await CanonicalDataService.createRecord('tasks', newTaskData, 'task');
            if (insertError) { 
                // In offline mode, createRecord might return data: null and error: null if enqueued
                // But we should check if it was actually enqueued. safeQuery returns { data: fallbackData, error: null }
                // if it's offline.
                if (!navigator.onLine) {
                    toast.info("Working offline. Task queued for sync.");
                } else {
                    throw new Error(insertError.message || "Failed to create task");
                }
            }
            
            const newTaskId = newTask?.id || uuidv4(); // Fallback ID for offline attachments if needed
 
            // Upload Attachments natively
            if (files.length > 0) {
                setUploadProgress(`0/${files.length}`);
                let uploadedCount = 0;
                let finalFiles = [];
                for (const file of files) {
                    try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${uuidv4()}.${fileExt}`;
                        const filePath = `${newTaskId}/${fileName}`;
                        // Assuming bucket is named 'task_attachments'
                        await supabase.storage.from('task_attachments').upload(filePath, file);
                        const { data: publicUrlData } = supabase.storage.from('task_attachments').getPublicUrl(filePath);
 
                        finalFiles.push({
                            id: uuidv4(),
                            name: file.name,
                            mimeType: file.type,
                            size: file.size,
                            url: publicUrlData.publicUrl,
                            uploaded_by: { uid: user.uid, name: user.name, role: user.role },
                            uploaded_at: new Date().toISOString(),
                            section: 'requester-inputs'
                        });
                        uploadedCount++;
                        setUploadProgress(`${uploadedCount}/${files.length}`);
                    } catch (e) {
                        console.error(`Failed to upload ${file.name}`, e);
                    }
                }
                if (finalFiles.length > 0) {
                    await supabase.from('tasks').update({ files: finalFiles }).eq('id', newTaskId);
                }
            }
 
            // Notify Admins if Member created it
            if (isMember) {
                try {
                    const { pushNotification } = await import('@/services/alertService');
                    const [admins, managers] = await Promise.all([
                        UserService.getAdmins(),
                        UserService.getManagers()
                    ]);

                    const recipients = [...admins, ...managers];

                    await Promise.all(recipients.map(recipient =>
                        pushNotification({
                            user_id: recipient.uid,
                            created_by: user.uid,
                            type: 'task_assigned',
                            title: 'Task Assignment Required',
                            message: `${user.official_name || user.name || 'A member'} has created "${title}" and a team member needs to be assigned to the task`,
                            entity_type: 'task',
                            entity_id: newTaskId,
                            action_url: `/tasks/view?id=${newTaskId}`,
                            priority: 'medium'
                        })
                    ));
                } catch (e) {
                    console.error("Failed to notify admins", e);
                }
            }
        } catch (err: any) {
            console.error("[TasksNew] Submission failed:", err);
            throw err; // Re-throw for useFormSubmit to catch
        }
    };
 
    const { isSubmitting, handleSubmit: handleProtectedSubmit } = useFormSubmit({
        onSubmit: submitTask,
        onSuccess: () => {
            clearDraft();
            toast.success(COPY.toasts.taskCreated);
            const returnTo = searchParams.get('returnTo');
            if (returnTo === 'home') router.push('/home');
            else router.push('/tasks');
        },
        onError: (err) => {
            setError(err.message || COPY.errors.generic);
        }
    });
 
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleProtectedSubmit(undefined);
    };
 
    const handleRetry = async () => {
        await handleProtectedSubmit(undefined);
    };
 
    // Power User: Cmd/Ctrl + Enter to Submit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleProtectedSubmit(undefined);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
 
    // Escape to Cancel (Task 79)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const returnTo = searchParams.get('returnTo');
                if (returnTo === 'home') {
                    router.push('/home');
                } else {
                    router.push('/tasks');
                }
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [router, searchParams]);
 
    // Date Shortcuts (Task 75)
    useEffect(() => {
        const handleDateShortcut = (e: KeyboardEvent) => {
            if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
                e.preventDefault(); // Prevent browser nav (Alt+Left is Back)
 
                const current = due_date ? new Date(due_date) : new Date();
                // If invalid date, start today
                if (isNaN(current.getTime())) {
                    setDueDate(new Date());
                    return;
                }
 
                // Add/Sub day
                const change = e.key === 'ArrowRight' ? 1 : -1;
                current.setDate(current.getDate() + change);
 
                setDueDate(current);
 
                // Quiet Feedback
                toast.dismiss(); // Prevent stacking
                toast(`Due: ${format(current, 'EEE, MMM d')}`, {
                    duration: 2000,
                    icon: '📅'
                });
            }
        };
        window.addEventListener('keydown', handleDateShortcut);
        return () => window.removeEventListener('keydown', handleDateShortcut);
    }, [due_date]);
 
    return (
        <PageLayout mode="plain">
            <div className="flex flex-col items-center">
                {/* Centered Card */}
                <div className="w-full max-w-xl">
                    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-white/5">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                            <button
                                onClick={() => {
                                    const returnTo = searchParams.get('returnTo');
                                    if (returnTo === 'home') {
                                        router.push('/home');
                                    } else {
                                        router.push('/tasks');
                                    }
                                }}
                                className="text-red-400/80 font-medium hover:text-red-300 transition-colors text-sm hover:bg-white/5 px-3 py-1.5 rounded-full"
                            >
                                {COPY.actions.cancel}
                            </button>
                            <h1 className="text-lg font-bold text-white tracking-wide">New Task</h1>
                            <DraftIndicator isSaved={isDraftSaved} className="w-[80px] justify-end" />
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
 
                            {/* Title & Desc Group */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/70 mb-2">Task Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder={COPY.placeholders.taskTitle}
                                        className="w-full bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5 shadow-inner focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 font-medium text-white text-lg"
                                    />
                                </div>
 
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white/70 mb-2">{COPY.labels.description}</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder={COPY.placeholders.taskDescription}
                                        rows={4}
                                        className="w-full bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5 shadow-inner focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 resize-none text-white/90 leading-relaxed"
                                        tabIndex={2}
                                    />
                                </div>
                            </div>
 
                            {/* Date \u0026 Department/Institution Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-0.5">
                                    <DateSelector 
                                        label="Due Date"
                                        date={due_date}
                                        onChange={setDueDate}
                                    />
                                </div>
 
                                {/* Unified Department or Institution Selector */}
                                {isDelegating ? (
                                    <div className="space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-white/70">
                                                Requested By <span className="text-white/40 text-xs">(Dept / Inst)</span>
                                            </label>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setIsDelegating(false);
                                                    // Reset to user's default
                                                    const def = user.department_id ? `dept_${user.department_id}` : (user.institution_id ? `inst_${user.institution_id}` : '');
                                                    setSelectedOrgId(def);
                                                }}
                                                className="text-[10px] uppercase tracking-wider text-blue-400/60 hover:text-blue-400 font-bold transition-colors"
                                            >
                                                Back to Myself
                                            </button>
                                        </div>
                                        <DropdownSelector 
                                            label=""
                                            value={selectedOrgId}
                                            onChange={setSelectedOrgId}
                                            options={[
                                                ...departmentsList.map(dept => ({ id: `dept_${dept.id}`, label: dept.name, icon: <Briefcase size={14} /> })),
                                                ...institutionsList.map(inst => ({ id: `inst_${inst.id}`, label: inst.name, icon: <Building size={14} /> }))
                                            ]}
                                        />
                                    </div>
                                ) : (
                                    /* Hidden by default as requested. Leadership can toggle. */
                                    canCreateOnBehalf && (
                                        <button 
                                            type="button"
                                            onClick={() => setIsDelegating(true)}
                                            className="w-full py-3 px-4 rounded-xl border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group flex items-center justify-center gap-2"
                                        >
                                            <Briefcase size={14} className="text-white/20 group-hover:text-blue-400/50 transition-colors" />
                                            <span className="text-xs font-bold text-white/40 group-hover:text-blue-400/70 uppercase tracking-widest">
                                                Request on behalf of another entity?
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>

                            {/* Priority - Admin, Manager, and Team */}
                            {(isAdmin || isTeam) && (
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

                            {/* Assigned To - Admin, Manager, and Team Only */}
                            {(isAdmin || isTeam) && (
                                <div className="space-y-3 pt-2">
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Assign To Team Members
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                        {teamMembers.length > 0 ? (
                                            teamMembers.map(m => (
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
                                            ))
                                        ) : (
                                            <div className="col-span-full py-4 px-4 bg-white/5 border border-dashed border-white/10 rounded-xl text-center text-xs text-gray-500">
                                                No other team members found in this workspace.
                                            </div>
                                        )}
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
                                        Creating as <span className="text-gray-300">
                                            {user.name || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Phase 28 Inline Recovery */}
                            {error && (
                                <div className="flex items-center justify-center gap-3 py-2 animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-sm text-red-400 font-medium">{error}</span>
                                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                                    <button
                                        type="button"
                                        onClick={handleRetry}
                                        className="text-xs font-bold text-white/50 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Edit & Retry
                                    </button>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                tabIndex={3}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover-sheen active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                        <span>Creating...</span>
                                        {uploadProgress && <span className="text-xs font-normal opacity-70 ml-1">({uploadProgress})</span>}
                                    </>
                                ) : (
                                    'Create Task'
                                )}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
