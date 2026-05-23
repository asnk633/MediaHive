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
import { TaskService } from '@/services/tasks';
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
        const dateVal = task.created_at || task.createdAt;
        if (!dateVal) return false;
        const created = (dateVal as any)?.seconds
            ? new Date((dateVal as any).seconds * 1000)
            : new Date(dateVal as any);
        return isSameMonth(created, selectedMonth);
    });

    const filteredFiles = files.filter(file => {
        const dateVal = file.created_at || (file as any).createdAt;
        if (!dateVal) return false;
        const created = (dateVal as any)?.seconds
            ? new Date((dateVal as any).seconds * 1000)
            : new Date(dateVal as any);
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

        // Strategic Load (Priority Concentration)
        const highPriorityTasks = filteredTasks.filter(t => t.priority === 'high').length;
        const strategicLoad = totalTasks > 0 ? Math.round((highPriorityTasks / totalTasks) * 100) : 0;

        // Media Expansion (Dynamic Calculation)
        // For now, we simulate a 'previous' count if we don't have historical data
        const currentFiles = filteredFiles.length;
        const previousFiles = files.length - currentFiles;
        const mediaExpansion = previousFiles > 0 
            ? Math.round(((currentFiles) / previousFiles) * 100) 
            : (currentFiles > 0 ? 100 : 0);

        // Linkage Rate (Correlation)
        const linkedTasks = filteredTasks.filter(t => t.event_id || t.campaign_id).length;
        const linkageRate = totalTasks > 0 ? Math.round((linkedTasks / totalTasks) * 100) : 0;

        // Institutional Growth Trend Data
        // Group tasks by day to create a simple trend
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayMap: Record<number, number> = {};
        filteredTasks.forEach(t => {
            const dateVal = t.created_at || t.createdAt;
            if (!dateVal) return;
            const date = (dateVal as any).seconds
                ? new Date((dateVal as any).seconds * 1000)
                : new Date(dateVal as any);
            const day = date.getDate();
            dayMap[day] = (dayMap[day] || 0) + 1;
        });
        const growthTrend = Array.from({ length: daysInMonth }).map((_, i) => dayMap[i + 1] || 0);

        // Generate SVG Path
        const maxVal = Math.max(...growthTrend, 1);
        const points = growthTrend.map((val, i) => {
            const x = (i / (growthTrend.length - 1)) * 500;
            const y = 100 - (val / maxVal) * 80; // Keep padded from SVG top/bottom
            return { x, y };
        });

        let linePath = '';
        let fillPath = '';
        if (points.length > 0) {
            linePath = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cpX1 = p0.x + (p1.x - p0.x) / 2;
                const cpY1 = p0.y;
                const cpX2 = p0.x + (p1.x - p0.x) / 2;
                const cpY2 = p1.y;
                linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
            }
            fillPath = `${linePath} L 500 120 L 0 120 Z`;
        }

        return {
            statusMap,
            totalTasks,
            strategicLoad,
            mediaCount: files.length,
            currentFiles,
            mediaExpansion,
            linkageRate,
            growthTrend,
            linePath,
            fillPath
        };
    }, [filteredTasks, filteredFiles, files, selectedMonth]);

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
                            className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to reports
                        </button>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
                        <p className="text-foreground/80 font-medium">System-wide data intelligence and resource distribution.</p>
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
                        { label: 'System Tasks', value: analytics.totalTasks, icon: PieChart, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { label: 'Media Assets', value: analytics.mediaCount, icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Strategic Load', value: `${analytics.strategicLoad}%`, icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                        { label: 'Linkage Rate', value: `${analytics.linkageRate}%`, icon: Share2, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    ].map((m, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl border border-foreground/5 bg-foreground/[0.01] flex flex-col gap-1">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Distribution Visualization */}
                    <div className="glass-card rounded-2xl border border-foreground/5 bg-foreground/[0.01] p-8 shadow-2xl flex flex-col items-center justify-center">
                        <div className="self-start flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <PieChart size={18} className="text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Status Breakdown</h2>
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
                                <span className="text-3xl font-bold text-foreground tracking-tight">{analytics.totalTasks}</span>
                                <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Global Tasks</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            {Object.entries(analytics.statusMap).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{status.replace('_', ' ')}</span>
                                    <span className="ml-auto text-[10px] font-bold text-foreground/80">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Growth & Trend Card */}
                    <div className="lg:col-span-2 glass-card rounded-2xl border border-foreground/5 bg-foreground/[0.01] p-8 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <TrendingUp size={18} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Institutional Growth</h2>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                    <TrendingUp size={12} /> +{analytics.mediaExpansion}% Acceleration
                                </div>
                            </div>

                            <p className="text-sm text-foreground/80 leading-relaxed max-w-xl mb-8">
                                Resource allocation and asset generation are trending positive across all departments. Media asset growth has increased by institutional requirement demand.
                            </p>

                            {/* Trend Visualization (SVG Line Chart) */}
                            <div className="w-full h-40 bg-foreground/[0.02] rounded-xl border border-foreground/5 p-4 relative group">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                                    {analytics.linePath && (
                                        <>
                                            <path
                                                d={analytics.linePath}
                                                fill="none"
                                                stroke="url(#gradient-line)"
                                                strokeWidth="3"
                                                className="transition-all duration-1000"
                                            />
                                            <path
                                                d={analytics.fillPath}
                                                fill="url(#gradient-fill)"
                                                className="opacity-20 transition-all duration-1000"
                                            />
                                        </>
                                    )}
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

                        <div className="flex items-center justify-between pt-8 border-t border-foreground/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Network Impact</span>
                                <span className="text-sm font-bold text-foreground">System Synchronized</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-foreground/5 flex items-center justify-center text-[10px] font-bold text-foreground/80">
                                        M
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-blue-600 flex items-center justify-center text-[10px] font-bold text-foreground">
                                    +
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Efficiency Matrix */}
                <div className="glass-card rounded-2xl border border-foreground/5 bg-foreground/[0.01] overflow-hidden shadow-2xl">
                    <div className="px-8 py-6 border-b border-foreground/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                <Zap size={18} className="text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Institutional Efficiency</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                        <div className="p-8 space-y-4">
                            <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Load Density</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-foreground">{analytics.strategicLoad}%</span>
                                <span className="text-xs font-medium text-amber-500 mb-1">Strategic Concentration</span>
                            </div>
                            <div className="h-2 w-full bg-foreground/5 rounded-full">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${analytics.strategicLoad}%` }} />
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Correlation Impact</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-foreground">{analytics.linkageRate}%</span>
                                <span className="text-xs font-medium text-indigo-500 mb-1">Resource Linkage</span>
                            </div>
                            <div className="h-2 w-full bg-foreground/5 rounded-full">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics.linkageRate}%` }} />
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Media Expansion</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-foreground">+{analytics.mediaExpansion}%</span>
                                <span className="text-xs font-medium text-emerald-500 mb-1">Asset Acceleration</span>
                            </div>
                            <div className="h-2 w-full bg-foreground/5 rounded-full">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analytics.mediaExpansion}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
