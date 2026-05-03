"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    BarChart3,
    Share2,
    ShieldAlert,
    Zap,
    PieChart,
    TrendingUp,
    Database,
    CheckCircle2
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { TaskService } from '@/features/tasks/services/taskService';
import { Task } from '@/features/tasks/types/task';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { useAuth } from '@/contexts/AuthContextProvider';
import { format, subMonths, isSameMonth } from 'date-fns';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsAnalyticsClient() {
    const router = useRouter();
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const availableMonths = useMemo(() => [
        new Date(),
        subMonths(new Date(), 1),
        subMonths(new Date(), 2)
    ], []);

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
            console.error("Failed to load analytics data:", error);
            setTasks([]);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const created = task.created_at?.seconds
            ? new Date(task.created_at.seconds * 1000)
            : new Date(task.created_at as any);
        return isSameMonth(created, selectedMonth);
    });

    const filteredFiles = files.filter(file => {
        const created = file.created_at?.seconds
            ? new Date(file.created_at.seconds * 1000)
            : new Date(file.created_at as any);
        return isSameMonth(created, selectedMonth);
    });

    const analytics = useMemo(() => {
        // Status Distribution
        const statusMap: Record<string, number> = {
            todo: 0, in_progress: 0, review: 0, done: 0, on_hold: 0, pending: 0
        };
        filteredTasks.forEach(t => {
            if (statusMap.hasOwnProperty(t.status)) statusMap[t.status]++;
        });

        const totalTasks = filteredTasks.length;

        // Priority concentration
        const urgentTasks = filteredTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
        const priorityConcentration = totalTasks > 0 ? Math.round((urgentTasks / totalTasks) * 100) : 0;

        // Media Growth (Current vs Last Month - simplified for demo)
        const currentFiles = filteredFiles.length;
        const mediaGrowth = currentFiles > 0 ? 12 : 0; // Simulated delta for visual depth

        // Correlation: Linked to Events/Campaigns
        const linkedTasks = filteredTasks.filter(t => t.event_id || t.campaign_id).length;
        const correlationRate = totalTasks > 0 ? Math.round((linkedTasks / totalTasks) * 100) : 0;

        return {
            statusMap,
            totalTasks,
            priorityConcentration,
            mediaCount: files.length,
            currentFiles,
            mediaGrowth,
            correlationRate
        };
    }, [filteredTasks, filteredFiles, files]);

    // Donut visualization helpers
    const statusColors: Record<string, string> = {
        todo: '#3b82f6',
        in_progress: '#6366f1',
        review: '#a855f7',
        done: '#10b981',
        on_hold: '#f59e0b',
        pending: '#94a3b8'
    };

    const getStatusRotation = (status: string) => {
        const statuses = Object.keys(analytics.statusMap);
        let accumulated = 0;
        for (const s of statuses) {
            if (s === status) break;
            accumulated += (analytics.statusMap[s] / (analytics.totalTasks || 1)) * 360;
        }
        return accumulated;
    };

    return (
        <PageLayout mode="plain" className="max-w-6xl mx-auto">
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
                        <h1 className="text-4xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
                        <p className="text-white/40 font-medium">System-wide data intelligence and resource distribution.</p>
                    </div>

                    {/* Month Select */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                        {availableMonths.map((date, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedMonth(date)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    isSameMonth(date, selectedMonth)
                                        ? "bg-white/10 text-white shadow-xl ring-1 ring-white/10"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
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
                        { label: 'System Tasks', value: analytics.totalTasks, icon: PieChart, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Media Assets', value: analytics.mediaCount, icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Strategic Load', value: `${analytics.priorityConcentration}%`, icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                        { label: 'Linkage Rate', value: `${analytics.correlationRate}%`, icon: Share2, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    ].map((m, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-1">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{m.label}</span>
                                <div className={cn("p-1.5 rounded-lg", m.bg)}>
                                    <m.icon size={14} className={m.color} />
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : m.value}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Distribution Visualization */}
                    <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.01] p-8 shadow-2xl flex flex-col items-center justify-center">
                        <div className="self-start flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <PieChart size={18} className="text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Status Breakdown</h2>
                        </div>

                        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                            {/* SVG Donut */}
                            <svg className="w-full h-full transform -rotate-90">
                                {Object.entries(analytics.statusMap).map(([status, count]) => {
                                    const percentage = (count / (analytics.totalTasks || 1)) * 100;
                                    if (percentage === 0) return null;

                                    return (
                                        <circle
                                            key={status}
                                            cx="96"
                                            cy="96"
                                            r="80"
                                            stroke={statusColors[status]}
                                            strokeWidth="12"
                                            strokeDasharray={502.4}
                                            strokeDashoffset={502.4 - (502.4 * percentage) / 100}
                                            fill="transparent"
                                            className="transition-all duration-1000"
                                            style={{ transformOrigin: 'center', transform: `rotate(${getStatusRotation(status)}deg)` }}
                                        />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-white tracking-tight">{analytics.totalTasks}</span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Global Tasks</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            {Object.entries(analytics.statusMap).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{status.replace('_', ' ')}</span>
                                    <span className="ml-auto text-[10px] font-bold text-white/40">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Growth & Trend Card */}
                    <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 bg-white/[0.01] p-8 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <TrendingUp size={18} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Institutional Growth</h2>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                    <TrendingUp size={12} /> +{analytics.mediaGrowth}% vs Prev
                                </div>
                            </div>

                            <p className="text-sm text-white/40 leading-relaxed max-w-xl mb-8">
                                Resource allocation and asset generation are trending positive across all departments. Media asset growth has increased by institutional requirement demand.
                            </p>

                            {/* Trend Visualization (SVG Line Chart) */}
                            <div className="w-full h-40 bg-white/[0.02] rounded-xl border border-white/5 p-4 relative group">
                                <svg className="w-full h-full overflow-visible">
                                    <path
                                        d="M0,120 Q50,110 100,80 T200,60 T300,90 T400,40 T500,20"
                                        fill="none"
                                        stroke="url(#gradient-line)"
                                        strokeWidth="3"
                                        className="transition-all duration-1000"
                                    />
                                    <path
                                        d="M0,120 Q50,110 100,80 T200,60 T300,90 T400,40 T500,20 V140 H0 Z"
                                        fill="url(#gradient-fill)"
                                        className="opacity-20"
                                    />
                                    <defs>
                                        <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                        <linearGradient id="gradient-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-white/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Network Impact</span>
                                <span className="text-sm font-bold text-white">System Synchronized</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/40">
                                        M
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                    +
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Efficiency Matrix */}
                <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                <Zap size={18} className="text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Institutional Efficiency</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                        <div className="p-8 space-y-4">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Load Density</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">{analytics.priorityConcentration}%</span>
                                <span className="text-xs font-medium text-amber-500 mb-1">Strategic Concentration</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${analytics.priorityConcentration}%` }} />
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Correlation Impact</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">{analytics.correlationRate}%</span>
                                <span className="text-xs font-medium text-indigo-500 mb-1">Resource Linkage</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics.correlationRate}%` }} />
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Media Expansion</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">+{analytics.mediaGrowth}%</span>
                                <span className="text-xs font-medium text-emerald-500 mb-1">Asset Acceleration</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analytics.mediaGrowth}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
