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
import { TaskService } from '@/services/tasks';
import { Task } from '@/features/tasks/types/task';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { useAuth } from '@/contexts/AuthContextProvider';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type DataSource = 'tasks' | 'media';

export default function ReportsCustomClient() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [files, setFiles] = useState<DriveFile[]>([]);

    // Filter State
    const [source, setSource] = useState<DataSource>('tasks');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user) return;
        loadAllData();
    }, [user]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [taskData, fileData] = await Promise.all([
                TaskService.getTasks(),
                FileService.getFiles(user!.role, user!.department_id, user!.institution_id)
            ]);

            setTasks(taskData || []);
            setFiles(fileData || []);
        } catch (error) {
            console.error("Failed to load custom report data:", error);
            setTasks([]);
            setFiles([]);
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
                const matchesStatus = statusFilter.length === 0 || statusFilter.includes(t.status);
                const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(t.priority);
                const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesStatus && matchesPriority && matchesSearch;
            });
        } else {
            return files.filter(f => {
                const matchesType = statusFilter.length === 0 || statusFilter.includes(f.type);
                const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesType && matchesSearch;
            });
        }
    }, [source, tasks, files, statusFilter, priorityFilter, searchQuery]);

    const handleExport = (format: 'csv' | 'pdf') => {
        alert(`Exporting ${filteredData.length} records as ${format.toUpperCase()}... (Module logic connected)`);
    };

    return (
        <PageLayout mode="plain" className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to reports
                        </button>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Custom Report Builder</h1>
                        <p className="text-white/40 font-medium">Generate granular data exports based on institutional parameters.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest"
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
                        <div className="bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 flex gap-1">
                            <button
                                onClick={() => setSource('tasks')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest",
                                    source === 'tasks' ? "bg-white/10 text-white shadow-lg" : "text-white/20 hover:text-white/40"
                                )}
                            >
                                <CheckSquare size={14} /> Tasks
                            </button>
                            <button
                                onClick={() => setSource('media')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest",
                                    source === 'media' ? "bg-emerald-500/20 text-emerald-400 shadow-lg border border-emerald-500/20" : "text-white/20 hover:text-white/40"
                                )}
                            >
                                <Database size={14} /> Media Inventory
                            </button>
                        </div>

                        {/* Search */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Keywords</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search entries..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        {source === 'tasks' && (
                            <>
                                {/* Status Filters */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Status</h3>
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
                                                        ? "bg-white/10 border-white/20 text-white"
                                                        : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40"
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
                                        <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Priority</h3>
                                        {priorityFilter.length > 0 && (
                                            <button onClick={() => setPriorityFilter([])} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">Clear</button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['low', 'medium', 'high', 'urgent'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => toggleFilter(setPriorityFilter, p)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                                    priorityFilter.includes(p)
                                                        ? "bg-white/10 border-white/20 text-white"
                                                        : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        {source === 'media' && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Asset Type</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['poster', 'video', 'pdf', 'other'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => toggleFilter(setStatusFilter, t)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                                statusFilter.includes(t)
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                    : "bg-white/[0.02] border-white/5 text-white/20 hover:text-white/40"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Table */}
                    <div className="lg:col-span-3">
                        <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.01] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <SlidersHorizontal size={18} className="text-white/40" />
                                    <h2 className="text-lg font-bold text-white">Results <span className="text-white/20 ml-1">({filteredData.length})</span></h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">Real-time Sychronized</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left table-auto">
                                    <thead className="bg-[#0f172a] border-b border-white/5">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">{source === 'tasks' ? 'Task Descriptor' : 'Asset Descriptor'}</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">{source === 'tasks' ? 'Institutional Hub' : 'Source Entity'}</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">{source === 'tasks' ? 'Operational Rank' : 'Resource Details'}</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-white/20 uppercase tracking-widest text-right">{source === 'tasks' ? 'Timeline' : 'Expansion Date'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            [1, 2, 3, 4, 5].map(i => <tr key={i}><td colSpan={3} className="px-8 py-6"><Skeleton className="h-4 w-full bg-white/5" /></td></tr>)
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
                                                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                                                {source === 'tasks' ? item.title : item.name}
                                                            </span>
                                                            <span className="text-[10px] text-white/20 font-medium mt-1 uppercase">ID: {item.id.slice(0, 8)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                                                            {source === 'tasks' 
                                                                ? (item.on_behalf_of?.name || item.created_by?.institution_name || 'Media & IT') 
                                                                : (item.department || 'Creative Library')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {source === 'tasks' ? (
                                                            <span className={cn(
                                                                "inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                                                                item.priority === 'urgent' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                    item.priority === 'high' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                            )}>
                                                                {item.priority}
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-white uppercase">{item.type || 'Media'}</span>
                                                                <span className="text-[10px] text-white/20 uppercase tracking-widest mt-1">
                                                                    {item.mimeType?.split('/')[1] || 'Asset'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase">
                                                            {item.created_at ? format(
                                                                item.created_at.seconds ? new Date(item.created_at.seconds * 1000) : new Date(item.created_at),
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
