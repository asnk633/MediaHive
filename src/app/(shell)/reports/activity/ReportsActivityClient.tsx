"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    Calendar,
    User as UserIcon,
    Clock,
    AlertCircle,
    TrendingUp,
    FileText,
    CheckSquare
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/features/tasks/types/task';
import { StructureService } from '@/services/structureService';
import { TaskService } from '@/services/tasks';
import { format, subMonths, isSameMonth } from 'date-fns';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsActivityClient() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const availableMonths = useMemo(() => [
        new Date(),
        subMonths(new Date(), 1),
        subMonths(new Date(), 2)
    ], []);

    useEffect(() => {
        fetchTasks();
        fetchInstitutions();
    }, []);

    const fetchInstitutions = async () => {
        try {
            const { institutions: data } = await StructureService.getInstitutions(true); // Include archived for historic reports
            setInstitutions(data);
        } catch (err) {}
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await TaskService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        // Robust filtering for demo and deleted data
        const isDemo = task.is_demo_data === true || (task as any).is_demo_data === 'true';
        const isDeleted = task.deleted === true || (task as any).deleted === 'true' || !!(task as any).deleted_at;
        
        if (isDemo || isDeleted) return false;
        
        const created = task.created_at?.seconds
            ? new Date(task.created_at.seconds * 1000)
            : new Date(task.created_at as any);
        return isSameMonth(created, selectedMonth);
    });

    const metrics = useMemo(() => {
        const total = filteredTasks.length;
        const completed = filteredTasks.filter(t => t.status === 'done').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const pending = filteredTasks.filter(t => t.status !== 'done' && t.status !== 'on_hold').length;

        return { total, completed, rate, pending };
    }, [filteredTasks]);

    const formatDate = (dateVal: any) => {
        if (!dateVal) return '-';
        const date = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
        if (isNaN(date.getTime())) return '-';
        return format(date, 'MMM d, yyyy');
    };

    const formatDateTime = (dateVal: any) => {
        if (!dateVal) return '-';
        const date = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
        if (isNaN(date.getTime())) return '-';
        return format(date, 'MMM d, yyyy h:mm a');
    };

    const getStatusBadge = (task: Task) => {
        if (task.status === 'done') {
            let obo = task.on_behalf_of;
            if (typeof obo === 'string') {
                try { obo = JSON.parse(obo); } catch (e) {}
            }
            
            // Extract assignee names from mapped assignedTo array
            const assigneeNames = Array.isArray(task.assignedTo) && task.assignedTo.length > 0
                ? task.assignedTo.map((a: any) => a.name).join(', ')
                : '';

            const completedByName = obo?.completed_by_name 
                || task.completed_by?.name 
                || task.updated_by?.name 
                || task.updatedBy?.name 
                || task.created_by?.name 
                || assigneeNames 
                || 'Media Team';

            return (
                <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Completed
                    </span>
                    <span className="text-[10px] text-foreground/80 font-medium max-w-[200px] text-right">
                        Marked Completed by {completedByName} at {formatDateTime(task.completed_at || task.completedAt)}
                    </span>
                </div>
            );
        }

        const config: Record<string, { label: string; class: string; icon: any }> = {
            pending: { label: "Awaiting Approval", class: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertCircle },
            todo: { label: "To Do", class: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
            in_progress: { label: "In Progress", class: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Clock },
            on_hold: { label: "On Hold", class: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertCircle },
            review: { label: "Review", class: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: CheckCircle2 }
        };

        const { label, class: cls, icon: Icon } = config[task.status] || config.todo;

        return (
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider", cls)}>
                <Icon size={12} /> {label}
            </span>
        );
    };

    return (
        <PageLayout mode="plain" className="max-w-6xl mx-auto">
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
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">Activity Report</h1>
                        <p className="text-foreground/80 font-medium">Monthly institutional task requests and throughput.</p>
                    </div>

                    {/* Month Select */}
                    <div className="flex bg-foreground/5 p-1 rounded-xl border border-foreground/5 backdrop-blur-md">
                        {availableMonths.map((date, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedMonth(date)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    isSameMonth(date, selectedMonth)
                                        ? "bg-foreground/10 text-foreground shadow-xl ring-1 ring-foreground/10"
                                        : "text-foreground/70 hover:text-foreground/80 hover:bg-foreground/[0.02]"
                                )}
                            >
                                {format(date, 'MMMM')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Tasks', value: metrics.total, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Completed', value: metrics.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Completion Rate', value: `${metrics.rate}%`, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                        { label: 'Active/Pending', value: metrics.pending, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    ].map((m, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl flex flex-col gap-1">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">{m.label}</span>
                                <div className={cn("p-1.5 rounded-lg", m.bg)}>
                                    <m.icon size={14} className={m.color} />
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-foreground tracking-tight">{loading ? '...' : m.value}</span>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-foreground/[0.02] border-b border-foreground/5">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Identification / Title</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Initiated</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Requirement Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-foreground/80 uppercase tracking-widest text-right">Operational Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i}>
                                            <td colSpan={4} className="px-8 py-6">
                                                <Skeleton className="h-4 w-full bg-foreground/5" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <FileText size={40} />
                                                <span className="text-sm font-medium">No activity records found for {format(selectedMonth, 'MMMM yyyy')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <tr key={task.id} className="group hover:bg-foreground/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/10">
                                                            {institutions.find(inst => String(inst.id) === String(task.institution_id || (task as any).institutionId))?.name || 'Global'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">
                                                        {task.title}
                                                    </span>
                                                    {task.description && (
                                                        <span className="text-[11px] text-foreground/80 font-medium mt-1 line-clamp-1">
                                                            {task.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-medium text-foreground/80">
                                                {formatDate(task.created_at)}
                                            </td>
                                            <td className="px-8 py-6 text-xs font-medium text-foreground/80">
                                                {formatDate(task.due_date)}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {getStatusBadge(task)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
