'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from '@/features/tasks/types/task';
import { format } from "date-fns";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { generateTaskCSV, downloadCSV } from "@/lib/reportUtils";
import { Loader2, Download, Printer, ArrowLeft } from "lucide-react";

export default function ReportPreviewClient() {
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0,
    });
    const [workload, setWorkload] = useState<Record<string, { name: string, assigned: number, completed: number, pending: number }>>({});

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0, 23, 59, 59);

                // Fetch tasks natively from Supabase
                const { data: fetchedTasks, error } = await supabase.from('tasks')
                    .select('*')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());

                if (error) throw error;

                fetchedTasks.sort((a: Task, b: Task) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

                setTasks(fetchedTasks);

                const total = fetchedTasks.length;
                const completed = fetchedTasks.filter((t: Task) => t.status === 'done').length;
                const now = new Date();
                const overdue = fetchedTasks.filter((t: Task) => t.status !== 'done' && t.due_date && (t.due_date.seconds * 1000) < now.getTime()).length;

                setStats({
                    total,
                    completed,
                    overdue,
                    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
                });

                const load: any = {};
                fetchedTasks.forEach((t: Task) => {
                    if (t.assigned_to) {
                        t.assigned_to.forEach((assignee: any) => {
                            const uid = typeof assignee === 'string' ? assignee : assignee.uid;
                            const name = typeof assignee === 'string' ? 'Unknown' : assignee.name;

                            if (!load[uid]) load[uid] = { name, assigned: 0, completed: 0, pending: 0 };

                            load[uid].assigned++;
                            if (t.status === 'done') load[uid].completed++;
                            else load[uid].pending++;
                        });
                    }
                });
                setWorkload(load);

            } catch (err) {
                console.error("Failed to fetch report data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [month, year]);

    const handleDownloadCSV = () => {
        const csv = generateTaskCSV(tasks);
        downloadCSV(csv, `Monthly_Report_${month + 1}_${year}.csv`);
    };

    const handlePrint = () => {
        window.print();
    };

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    if (loading) return <div className="flex h-screen items-center justify-center bg-white text-black"><Loader2 className="animate-spin" size={32} /></div>;

    return (
        <div className="bg-white min-h-screen text-black">
            {/* Navigation Header - Hidden on Print */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between print:hidden">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-foreground/40 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <div className="flex gap-2">
                    <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium transition-colors">
                        <Download size={16} /> <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-foreground rounded hover:bg-blue-700 text-sm font-medium transition-colors">
                        <Printer size={16} /> <span className="hidden sm:inline">Print / PDF</span>
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-[210mm] mx-auto print:max-w-none print:p-0">
                <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4 print:border-black">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-[#1a1f2e]">Monthly Task Report</h1>
                        <p className="text-lg text-foreground/40 mt-1">{monthName} {year}</p>
                    </div>
                    {/* Logo placeholder if needed */}
                    <div className="text-right">
                        <div className="text-sm font-bold text-foreground/60 uppercase">Thaiba MediaHive</div>
                    </div>
                </div>

                {/* Executive Summary */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 uppercase border-b border-gray-300 pb-1 text-[#1a1f2e]">Executive Summary</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 border border-gray-200 rounded bg-gray-50">
                            <div className="text-xs text-foreground/50 uppercase font-bold tracking-wider">Total Tasks</div>
                            <div className="text-3xl font-bold text-[#1a1f2e]">{stats.total}</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded bg-gray-50">
                            <div className="text-xs text-foreground/50 uppercase font-bold tracking-wider">Completed</div>
                            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded bg-gray-50">
                            <div className="text-xs text-foreground/50 uppercase font-bold tracking-wider">Overdue</div>
                            <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded bg-gray-50">
                            <div className="text-xs text-foreground/50 uppercase font-bold tracking-wider">Rate</div>
                            <div className="text-3xl font-bold text-[#1a1f2e]">{stats.completionRate}%</div>
                        </div>
                    </div>
                </section>

                {/* Team Performance */}
                <section className="mb-8 break-inside-avoid">
                    <h2 className="text-xl font-bold mb-4 uppercase border-b border-gray-300 pb-1 text-[#1a1f2e]">Team Workload</h2>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b border-black">
                                <th className="p-2 font-bold text-[#1a1f2e]">Team Member</th>
                                <th className="p-2 text-center font-bold text-[#1a1f2e]">Assigned</th>
                                <th className="p-2 text-center font-bold text-green-700">Done</th>
                                <th className="p-2 text-center font-bold text-amber-600">Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(workload).length > 0 ? Object.values(workload).map((w: { name: string, assigned: number, completed: number, pending: number }, i) => (
                                <tr key={i} className="border-b border-gray-200">
                                    <td className="p-2 font-medium text-[#1a1f2e]">{w.name}</td>
                                    <td className="p-2 text-center text-foreground/30">{w.assigned}</td>
                                    <td className="p-2 text-center text-foreground/30">{w.completed}</td>
                                    <td className="p-2 text-center text-foreground/30">{w.pending}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-4 text-center text-foreground/60 italic">No team activity this month</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>

                {/* Detailed Task List */}
                <section className="break-before-auto">
                    <h2 className="text-xl font-bold mb-4 uppercase border-b border-gray-300 pb-1 text-[#1a1f2e]">Detailed Task List</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b border-black">
                                    <th className="p-2 font-bold w-[20%] text-[#1a1f2e]">Title</th>
                                    <th className="p-2 font-bold w-[8%] text-[#1a1f2e]">Priority</th>
                                    <th className="p-2 font-bold w-[8%] text-[#1a1f2e]">Status</th>
                                    <th className="p-2 font-bold w-[12%] text-[#1a1f2e]">Requester</th>
                                    <th className="p-2 font-bold w-[12%] text-[#1a1f2e]">Assignee</th>
                                    <th className="p-2 font-bold w-[10%] text-[#1a1f2e]">Created</th>
                                    <th className="p-2 font-bold w-[10%] text-[#1a1f2e]">Due</th>
                                    <th className="p-2 font-bold w-[10%] text-[#1a1f2e]">Done</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length > 0 ? tasks.map((task) => (
                                    <tr key={task.id} className="border-b border-gray-200 break-inside-avoid hover:bg-gray-50">
                                        <td className="p-2 font-medium text-[#1a1f2e]">{task.title}</td>
                                        <td className="p-2 capitalize text-foreground/30">{task.priority}</td>
                                        <td className="p-2 capitalize text-foreground/30">{task.status?.replace('_', ' ')}</td>
                                        <td className="p-2 text-foreground/30">{task.assigned_by?.name || '-'}</td>
                                        <td className="p-2 text-foreground/30">
                                            {task.assigned_to?.map((a: any) => typeof a === 'string' ? 'User' : a.name).join(', ') || '-'}
                                        </td>
                                        <td className="p-2 text-foreground/30">
                                            {task.created_at?.seconds ? format(new Date(task.created_at.seconds * 1000), 'MMM d') : '-'}
                                        </td>
                                        <td className="p-2 text-foreground/30">
                                            {task.due_date?.seconds ? format(new Date(task.due_date.seconds * 1000), 'MMM d') : '-'}
                                        </td>
                                        <td className="p-2 text-foreground/30">
                                            {task.completed_at?.seconds ? format(new Date(task.completed_at.seconds * 1000), 'MMM d') : '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={8} className="p-8 text-center text-foreground/60 italic">No tasks found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="mt-8 text-[10px] text-foreground/60 text-center print:fixed print:bottom-4 print:left-0 print:w-full">
                    Generated on {new Date().toLocaleDateString()} • Thaiba MediaHive Internal Report
                </div>
            </div>
        </div>
    );
}
