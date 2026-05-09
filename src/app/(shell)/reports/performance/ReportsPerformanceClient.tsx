"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    TrendingUp,
    Users,
    Clock,
    Zap,
    BarChart3,
    Trophy,
    Target
} from 'lucide-react';
import { MediaTeamOverview } from '@/features/dashboard/components/MediaTeamOverview';
import { apiClient } from '@/lib/apiClient';
import { TaskService } from '@/services/tasks';
import { StructureService } from '@/services/structureService';
import { Task } from '@/features/tasks/types/task';
import { format, subMonths, isSameMonth, differenceInHours } from 'date-fns';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


export default function ReportsPerformanceClient() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const availableMonths = useMemo(() => [
        new Date(),
        subMonths(new Date(), 1),
        subMonths(new Date(), 2)
    ], []);

    useEffect(() => {
        fetchTasks();
        fetchStructure();
    }, []);

    const fetchStructure = async () => {
        try {
            const [instData, deptData] = await Promise.all([
                StructureService.getInstitutions(true),
                StructureService.getDepartments(true)
            ]);
            setInstitutions(instData.institutions);
            setDepartments(deptData.departments);
        } catch (err) {
            console.error("Failed to fetch structure data:", err);
        }
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await TaskService.getTasks();
            setTasks(data || []);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            setTasks([]);
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

    const performanceData = useMemo(() => {
        const completedTasks = filteredTasks.filter(t => t.status === 'done');

        // Calculate average lead time (hours)
        let totalHours = 0;
        completedTasks.forEach(task => {
            const start = task.created_at?.seconds ? new Date(task.created_at.seconds * 1000) : new Date(task.created_at as any);
            const end = task.completed_at?.seconds ? new Date(task.completed_at.seconds * 1000) : new Date(task.completed_at as any);

            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                totalHours += Math.max(0, differenceInHours(end, start));
            }
        });

        const avgLeadTimeHours = completedTasks.length > 0 ? Math.round(totalHours / completedTasks.length) : 0;
        const avgLeadTimeDays = (avgLeadTimeHours / 24).toFixed(1);

        // Leaderboard & Department mapping
        const entityMap = new Map<string, { name: string; completed: number; total: number; tasks: Task[] }>();
        const workloadMap: Record<string, number> = {};

        // Helper to resolve entity info from task
        const getEntityInfo = (task: Task) => {
            // Priority 1: On Behalf Of
            if (task.on_behalf_of?.id) {
                return { id: String(task.on_behalf_of.id), name: task.on_behalf_of.name || 'External' };
            }

            // Priority 2: Department ID
            if (task.department_id) {
                const dept = departments.find(d => String(d.id) === String(task.department_id));
                if (dept) return { id: String(dept.id), name: dept.name };
            }

            // Priority 3: Institution ID
            if (task.institution_id) {
                const inst = institutions.find(i => String(i.id) === String(task.institution_id));
                if (inst) return { id: String(inst.id), name: inst.name };
            }

            return { id: 'general', name: 'General' };
        };
        
        filteredTasks.forEach(task => {
            // Workload (uncompleted tasks) - Still tracked by team members doing the work
            if (task.status !== 'done' && task.assignedTo && Array.isArray(task.assignedTo)) {
                task.assignedTo.forEach(assignee => {
                    const name = assignee.name || 'Unassigned';
                    workloadMap[name] = (workloadMap[name] || 0) + 1;
                });
            }

            // Productivity Metrics - Tracked by Requesting Entity
            const { id: entityId, name: entityName } = getEntityInfo(task);
            
            if (!entityMap.has(entityId)) {
                entityMap.set(entityId, { name: entityName, completed: 0, total: 0, tasks: [] });
            }
            
            const stats = entityMap.get(entityId)!;
            stats.total++;
            
            if (task.status === 'done') {
                stats.completed++;
                stats.tasks.push(task);
            }
        });

        const leaderboard = Array.from(entityMap.values())
            .filter(e => e.completed > 0)
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5);

        // Productivity Trend (all completions in filtered month)
        const trendMap: Record<string, number> = {};
        completedTasks.forEach(task => {
            const date = task.completed_at?.seconds ? new Date(task.completed_at.seconds * 1000) : new Date(task.completed_at as any);
            if (!isNaN(date.getTime())) {
                const dayKey = format(date, 'MMM dd');
                trendMap[dayKey] = (trendMap[dayKey] || 0) + 1;
            }
        });

        // Ensure we have last 7 days padded for the trend chart
        const productivityTrend = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dayKey = format(d, 'MMM dd');
            return {
                date: dayKey,
                count: trendMap[dayKey] || 0
            };
        });

        // Prepare Turnaround Data (from entityMap)
        const depts = Array.from(entityMap.values())
            .map(e => ({ 
                name: e.name, 
                count: e.total,
                completed: e.completed
            }))
            .sort((a, b) => b.count - a.count);

        return {
            avgLeadTimeHours,
            avgLeadTimeDays: Number(avgLeadTimeDays),
            leaderboard,
            depts,
            totalCompleted: completedTasks.length,
            completedThisWeek: completedTasks.length,
            throughput: filteredTasks.length > 0 ? Math.round((completedTasks.length / filteredTasks.length) * 100) : 0,
            workloadDistribution: workloadMap,
            productivityTrend,
            avgCompletionTimeDays: Number(avgLeadTimeDays)
        };
    }, [filteredTasks]);

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
                        <h1 className="text-4xl font-bold text-white tracking-tight">Performance Metrics</h1>
                        <p className="text-white/40 font-medium">Team throughput, turnaround times, and institutional efficiency.</p>
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

                {/* Content Sections */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-2xl" />)}
                    </div>
                ) : (
                    <MediaTeamOverview performance={performanceData} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard Card */}
                    <div className="lg:col-span-2 dashboard-card-primary p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <Trophy size={18} className="text-amber-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xl font-bold text-white tracking-tight">Top Departments</h2>
                                    <p className="text-[10px] text-white/20 font-medium">Requesting entities with highest completions.</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Throughput</span>
                                <span className="text-[8px] text-white/10 font-bold uppercase mt-0.5">By completions</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />)
                            ) : performanceData.leaderboard.length === 0 ? (
                                <div className="py-20 text-center text-white/20 font-medium">No activity data available.</div>
                            ) : (
                                performanceData.leaderboard.map((user, idx) => (
                                    <div key={user.name} className="flex items-center gap-4 group">
                                        <div className="w-8 text-xs font-bold text-white/20">#{idx + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{user.name}</span>
                                                <span className="text-xs font-bold text-white tracking-tight">{user.completed}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${(user.completed / (performanceData.leaderboard[0].completed || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Efficiency / Target Card */}
                    <div className="dashboard-card-primary p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <Target size={18} className="text-indigo-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Efficiency Target</h2>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                {/* SVG Circle Progress */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-white/5"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * performanceData.throughput) / 100}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        className="text-indigo-500 transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-white tracking-tighter">{performanceData.throughput}%</span>
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">On Track</span>
                                </div>
                            </div>
                            <p className="text-xs text-white/40 text-center leading-relaxed">
                                Current throughput is based on {performanceData.totalCompleted} completed items out of {filteredTasks.length} total institutional requests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Turnaround Table */}
                <div className="dashboard-card-secondary border border-white/5 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                    <div className="px-8 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Institutional Distribution</h2>
                            <p className="text-xs text-white/30 font-medium">Detailed breakdown of task volume and throughput share.</p>
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Lead Time Analysis</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Institution / Department</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Requests</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Throughput Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    [1, 2, 3].map(i => <tr key={i}><td colSpan={3} className="px-8 py-4"><Skeleton className="h-4 w-full bg-white/5" /></td></tr>)
                                ) : performanceData.depts.length === 0 ? (
                                    <tr><td colSpan={3} className="px-8 py-10 text-center text-white/20 text-xs">No department data found.</td></tr>
                                ) : (
                                    performanceData.depts.map((dept) => (
                                        <tr key={dept.name} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="text-sm font-bold text-white">{dept.name === 'undefined' ? 'General' : dept.name}</span>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-medium text-white/40">
                                                {dept.count} Requests
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md border border-indigo-400/20 uppercase">
                                                    {Math.round((dept.count / filteredTasks.length) * 100)}%
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
        </PageLayout>
    );
}
