"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Filter,
    Download,
    FileText,
    Calendar,
    CheckSquare,
    Database,
    Search,
    X,
    ChevronDown,
    SlidersHorizontal,
    Table as TableIcon
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { Task } from '@/features/tasks/types/task';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { StructureService } from '@/services/structureService';
import { Institution, Department } from '@/types/structure';
import { useAuth } from '@/contexts/AuthContextProvider';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

import { inventoryService } from '@/services/inventory/inventoryService';
import { EquipmentItem } from '@/services/inventory/inventoryContract';

type DataSource = 'tasks' | 'media_assets' | 'equipment';

export default function ReportsCustomClient() {
    const router = useRouter();
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [source, setSource] = useState<DataSource>('tasks');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [entityFilter, setEntityFilter] = useState<string[]>([]);
    const [deptFilter, setDeptFilter] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user) return;
        loadAllData();
    }, [user]);

    // Reset specific filters when source changes
    useEffect(() => {
        setStatusFilter([]);
        setPriorityFilter([]);
        setSearchQuery('');
    }, [source]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [taskData, fileData, equipmentData, instData, deptData] = await Promise.all([
                CanonicalDataService.getTasks({ role: user!.role, userId: user!.uid, includeAllHistory: true }),
                FileService.getFiles(user!.role, user!.department_id, user!.institution_id),
                inventoryService.getEquipment(),
                StructureService.getInstitutions(),
                StructureService.getDepartments()
            ]);

            setTasks(taskData || []);
            setFiles(fileData || []);
            setEquipment(equipmentData || []);
            setInstitutions(instData.institutions || []);
            setDepartments(deptData.departments || []);
        } catch (error) {
            console.error("Failed to load custom report data:", error);
            setTasks([]);
            setFiles([]);
            setEquipment([]);
            setInstitutions([]);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
        set(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const filteredData = useMemo(() => {
        if (source === 'tasks') {
            return tasks.filter(t => {
                const matchesStatus = statusFilter.length === 0 || statusFilter.includes(t.status?.toLowerCase() || t.status);
                const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(t.priority?.toLowerCase() || t.priority);
                
                // Attribution Logic (Prioritize where the task is assigned/working)
                let taskInstId = t.institution_id || t.institutionId || t.created_by?.institution_id;
                let taskDeptId = t.department_id || t.departmentId || t.created_by?.department_id;
                
                // Extract from varied on_behalf_of formats safely
                let obo = t.on_behalf_of;
                if (typeof obo === 'string') {
                    try { obo = JSON.parse(obo); } catch (e) {}
                }
                if (obo) {
                    if (obo.type === 'department' && obo.id) taskDeptId = obo.id;
                    else if (obo.type === 'institution' && obo.id) taskInstId = obo.id;
                    else {
                        if (obo.department?.id) taskDeptId = obo.department.id;
                        if (obo.institution?.id) taskInstId = obo.institution.id;
                        if (obo.department_id) taskDeptId = obo.department_id;
                        if (obo.institution_id) taskInstId = obo.institution_id;
                    }
                }

                const matchesInst = entityFilter.length === 0 || (taskInstId && entityFilter.includes(String(taskInstId)));
                const matchesDept = deptFilter.length === 0 || (taskDeptId && deptFilter.includes(String(taskDeptId)));
                
                const matchesSearch = !searchQuery || 
                    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    t.description?.toLowerCase().includes(searchQuery.toLowerCase());
                    
                return matchesStatus && matchesPriority && matchesInst && matchesDept && matchesSearch;
            });
        } else if (source === 'media_assets') {
            return files.filter(f => {
                const matchesType = statusFilter.length === 0 || statusFilter.includes(f.type);
                const matchesSearch = !searchQuery || f.name?.toLowerCase().includes(searchQuery.toLowerCase());
                
                // File-level organizational filtering
                const fileInsts = f.visibility?.institutions || [];
                const matchesInst = entityFilter.length === 0 || fileInsts.some(id => entityFilter.includes(String(id)));
                const matchesDept = deptFilter.length === 0 || (f.department && deptFilter.includes(String(f.department)));
                
                return matchesType && matchesSearch && matchesInst && matchesDept;
            });
        } else if (source === 'equipment') {
            return equipment.filter(e => {
                const matchesStatus = statusFilter.length === 0 || 
                    statusFilter.includes(e.status) || 
                    (e.assetStatus && statusFilter.includes(e.assetStatus));
                const matchesSearch = !searchQuery || 
                    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    (e.brand && e.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (e.model && e.model.toLowerCase().includes(searchQuery.toLowerCase()));
                
                // Equipment institutional filtering
                const matchesInst = entityFilter.length === 0 || (e.institutionId && entityFilter.includes(String(e.institutionId)));
                const matchesDept = deptFilter.length === 0; // Equipment doesn't typically have a dept link in core schema

                return matchesStatus && matchesSearch && matchesInst && matchesDept;
            });
        }
        return [];
    }, [source, tasks, files, equipment, statusFilter, priorityFilter, searchQuery, entityFilter, deptFilter]);

    const handleExport = (format: 'csv' | 'pdf') => {
        alert(`Exporting ${filteredData.length} records as ${format.toUpperCase()}... (Module logic connected)`);
    };

    return (
        <PageLayout mode="plain" className="max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to reports
                        </button>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">Custom Report Builder</h1>
                        <p className="text-foreground/80 font-medium">Generate granular data exports based on institutional parameters.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/5 border border-foreground/5 text-[10px] font-bold text-foreground hover:bg-foreground/10 transition-all uppercase tracking-widest"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all uppercase tracking-widest"
                        >
                            <FileText size={14} /> Export PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Mode Switcher */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Select Report Mode</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setSource('tasks')}
                                    className={cn(
                                        "w-full flex items-center justify-start gap-3 px-4 py-4 rounded-xl border transition-all text-left",
                                        source === 'tasks'
                                            ? "bg-foreground/10 border-foreground/10 text-foreground shadow-xl"
                                            : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80 hover:bg-foreground/[0.04]"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg", source === 'tasks' ? "bg-foreground/10 text-foreground" : "bg-foreground/5 text-foreground/80")}>
                                        <CheckSquare size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Tasks & Projects</span>
                                        <span className="text-[10px] font-medium opacity-40">System throughput & attribution</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSource('media_assets')}
                                    className={cn(
                                        "w-full flex items-center justify-start gap-3 px-4 py-4 rounded-xl border transition-all text-left",
                                        source === 'media_assets'
                                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-xl"
                                            : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80 hover:bg-foreground/[0.04]"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg", source === 'media_assets' ? "bg-indigo-500/10 text-indigo-400" : "bg-foreground/5 text-foreground/80")}>
                                        <Database size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Media Assets</span>
                                        <span className="text-[10px] font-medium opacity-40">Digital files & task outputs</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSource('equipment')}
                                    className={cn(
                                        "w-full flex items-center justify-start gap-3 px-4 py-4 rounded-xl border transition-all text-left",
                                        source === 'equipment'
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-xl"
                                            : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80 hover:bg-foreground/[0.04]"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg", source === 'equipment' ? "bg-emerald-500/10 text-emerald-400" : "bg-foreground/5 text-foreground/80")}>
                                        <Database size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Equipment Inventory</span>
                                        <span className="text-[10px] font-medium opacity-40">Hardware, gear & devices</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Keywords</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/80" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-foreground/[0.02] border border-foreground/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-all placeholder:text-foreground/70"
                                />
                            </div>
                        </div>

                        {source === 'tasks' && (
                            <>
                                {/* Status Filters */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Status</h3>
                                        {statusFilter.length > 0 && (
                                            <button onClick={() => setStatusFilter([])} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">Clear</button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['todo', 'in_progress', 'review', 'done', 'on_hold', 'pending'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => toggleFilter(setStatusFilter, s)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                                    statusFilter.includes(s)
                                                        ? "bg-foreground/10 border-foreground/20 text-foreground"
                                                        : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80"
                                                )}
                                            >
                                                {s.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Filters */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Priority</h3>
                                        {priorityFilter.length > 0 && (
                                            <button onClick={() => setPriorityFilter([])} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">Clear</button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['low', 'medium', 'high'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => toggleFilter(setPriorityFilter, p)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                                    priorityFilter.includes(p)
                                                        ? "bg-foreground/10 border-foreground/20 text-foreground"
                                                        : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Institution Filters */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Institutional Hub</h3>
                                        {entityFilter.length > 0 && (
                                            <button onClick={() => setEntityFilter([])} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">Clear</button>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                        {institutions.map(inst => (
                                            <button
                                                key={inst.id}
                                                onClick={() => toggleFilter(setEntityFilter, String(inst.id))}
                                                className={cn(
                                                    "w-full flex items-center justify-start gap-3 px-3 py-3 rounded-lg text-[10px] font-bold uppercase transition-all border text-left",
                                                    entityFilter.includes(String(inst.id))
                                                        ? "bg-foreground/10 border-foreground/20 text-foreground"
                                                        : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80"
                                                )}
                                            >
                                                <div className={cn("w-1.5 h-1.5 rounded-full", entityFilter.includes(String(inst.id)) ? "bg-indigo-400" : "bg-foreground/10")} />
                                                <span className="truncate">{inst.name}</span>
                                            </button>
                                        ))}
                                        {institutions.length === 0 && (
                                            <span className="text-[10px] text-foreground/70 italic">No institutions identified</span>
                                        )}
                                    </div>
                                </div>

                                {/* Department Filters */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Departmental Context</h3>
                                        {deptFilter.length > 0 && (
                                            <button onClick={() => setDeptFilter([])} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">Clear</button>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                        {departments.map(dept => (
                                            <button
                                                key={dept.id}
                                                onClick={() => toggleFilter(setDeptFilter, String(dept.id))}
                                                className={cn(
                                                    "w-full flex items-center justify-start gap-3 px-3 py-3 rounded-lg text-[10px] font-bold uppercase transition-all border text-left",
                                                    deptFilter.includes(String(dept.id))
                                                        ? "bg-foreground/10 border-foreground/20 text-foreground"
                                                        : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80"
                                                )}
                                            >
                                                <div className={cn("w-1.5 h-1.5 rounded-full", deptFilter.includes(String(dept.id)) ? "bg-emerald-400" : "bg-foreground/10")} />
                                                <span className="truncate">{dept.name}</span>
                                            </button>
                                        ))}
                                        {departments.length === 0 && (
                                            <span className="text-[10px] text-foreground/70 italic">No departments identified</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {source !== 'tasks' && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">
                                    {source === 'equipment' ? 'Equipment Status' : 'Asset Type'}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(source === 'equipment' ? ['available', 'maintenance', 'in_use', 'damaged'] : ['poster', 'video', 'pdf', 'other']).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => toggleFilter(setStatusFilter, t)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                                statusFilter.includes(t)
                                                    ? "bg-foreground/10 border-foreground/20 text-foreground shadow-sm"
                                                    : "bg-foreground/[0.02] border-foreground/5 text-foreground/80 hover:text-foreground/80"
                                            )}
                                        >
                                            {t.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Table */}
                    <div className="lg:col-span-3 min-w-0">
                        <div className="glass-card rounded-2xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            <div className="px-8 py-6 border-b border-foreground/5 flex items-center justify-between bg-foreground/[0.02]">
                                <div className="flex items-center gap-3">
                                    <SlidersHorizontal size={18} className="text-foreground/80" />
                                    <h2 className="text-lg font-bold text-foreground">Results <span className="text-foreground/80 ml-1">({filteredData.length})</span></h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">Real-time Sychronized</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left table-fixed">
                                    <thead className="bg-foreground/[0.02] border-b border-foreground/5">
                                        <tr>
                                            <th className="px-8 py-4 w-[40%] text-[10px] font-bold text-foreground/80 uppercase tracking-widest">
                                                {source === 'tasks' ? 'Task Descriptor' : source === 'equipment' ? 'Equipment Spec' : 'Asset Descriptor'}
                                            </th>
                                            <th className="px-8 py-4 w-[25%] text-[10px] font-bold text-foreground/80 uppercase tracking-widest">
                                                {source === 'tasks' ? 'Institutional Hub' : source === 'equipment' ? 'Inventory Path' : 'Source Entity'}
                                            </th>
                                            <th className="px-8 py-4 w-[15%] text-[10px] font-bold text-foreground/80 uppercase tracking-widest">
                                                {source === 'tasks' ? 'Operational Rank' : source === 'equipment' ? 'Asset Health' : 'Resource Details'}
                                            </th>
                                            <th className="px-8 py-4 w-[20%] text-[10px] font-bold text-foreground/80 uppercase tracking-widest text-right">
                                                {source === 'tasks' ? 'Timeline' : 'Expansion Date'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            [1, 2, 3, 4, 5].map(i => <tr key={i}><td colSpan={3} className="px-8 py-6"><Skeleton className="h-4 w-full bg-foreground/5" /></td></tr>)
                                        ) : filteredData.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-40">
                                                    <div className="flex flex-col items-center gap-4 text-center opacity-20">
                                                        <Search size={48} strokeWidth={1} />
                                                        <div>
                                                            <p className="font-bold uppercase tracking-[0.2em] text-xs">No entries detected</p>
                                                            <p className="text-[10px] mt-1">Adjust institutional filters to expand scope</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredData.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-foreground/[0.01] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition-colors uppercase tracking-tight break-all">
                                                                {source === 'tasks' ? item.title : item.name}
                                                            </span>
                                                            <span className="text-[10px] text-foreground/80 font-medium mt-1 uppercase">
                                                                {source === 'equipment' ? `${item.brand} ${item.model}` : `ID: ${item.id.slice(0, 8)}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                                                            {source === 'tasks' 
                                                                ? (item.on_behalf_of?.name || item.created_by?.institution_name || 'Media & IT') 
                                                                : source === 'equipment' ? (item.category || 'General Equipment') : (item.department || 'Creative Library')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {source === 'tasks' ? (
                                                            <span className={cn(
                                                                "inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                                                                item.priority === 'high' || item.priority === 'urgent' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                    item.priority === 'medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                            )}>
                                                                {item.priority === 'urgent' ? 'high' : item.priority}
                                                            </span>
                                                        ) : source === 'equipment' ? (
                                                            <span className={cn(
                                                                "inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                                                                item.status === 'available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                                    item.status === 'maintenance' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                        "bg-foreground/5 text-foreground/80 border-foreground/10"
                                                            )}>
                                                                {item.status}
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-foreground uppercase">{item.type || 'Media'}</span>
                                                                <span className="text-[10px] text-foreground/80 uppercase tracking-widest mt-1">
                                                                    {item.mimeType?.split('/')[1] || 'Asset'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-[10px] font-bold text-foreground/80 uppercase">
                                                            {item.created_at || item.createdAt ? format(
                                                                (item.created_at?.seconds || item.createdAt?.seconds) 
                                                                    ? new Date((item.created_at?.seconds || item.createdAt?.seconds) * 1000) 
                                                                    : new Date(item.created_at || item.createdAt),
                                                                'dd MMM yyyy'
                                                            ) : 'N/A'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
