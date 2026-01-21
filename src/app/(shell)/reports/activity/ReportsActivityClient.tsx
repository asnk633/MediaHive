"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Calendar, User as UserIcon, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Task } from '@/types/task';
import { format, subMonths, isSameMonth, startOfMonth } from 'date-fns';

export default function ReportsActivityClient() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const availableMonths = [
        new Date(),
        subMonths(new Date(), 1),
        subMonths(new Date(), 2)
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // Fetch tasks from API route instead of direct Firestore
            const fetchedTasks = await apiClient('/api/tasks', {
                method: 'GET',
            });
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const created = task.createdAt?.seconds
            ? new Date(task.createdAt.seconds * 1000)
            : new Date(task.createdAt as any);
        return isSameMonth(created, selectedMonth);
    });

    const formatDate = (dateVal: any) => {
        if (!dateVal) return '-';
        // Handle both Firestore Timestamp and potential Date/string fallback
        const date = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
        // Check for invalid date
        if (isNaN(date.getTime())) return '-';
        return format(date, 'MMM d, yyyy');
    };

    const getStatusBadge = (task: Task) => {
        if (task.status === 'done') {
            return (
                <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 mb-1">
                        <CheckCircle2 size={12} /> Completed
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                        by {task.completedBy?.name || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] opacity-60">
                        {formatDate(task.completedAt || task.updatedAt)}
                    </span>
                </div>
            );
        }

        // Not completed
        const styles = {
            pending: "bg-gray-500/10 text-gray-500",
            todo: "bg-blue-500/10 text-blue-500",
            in_progress: "bg-amber-500/10 text-amber-500",
            on_hold: "bg-orange-500/10 text-orange-500",
            review: "bg-purple-500/10 text-purple-500",
            done: "" // handled
        };

        const labels = {
            pending: "Pending Approval",
            todo: "To Do",
            in_progress: "In Progress",
            on_hold: "On Hold",
            review: "In Review",
            done: "Done"
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${styles[task.status] || styles.todo}`}>
                {task.status === 'in_progress' && <Clock size={12} />}
                {task.status === 'review' && <AlertCircle size={12} />}
                {task.status === 'todo' && <Calendar size={12} />}
                {labels[task.status] || task.status}
            </span>
        );
    };

    return (
        <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-5xl mx-auto relative">
            <header className="mb-8 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-[var(--bg-panel)] transition-colors text-[var(--text-secondary)]"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-1">Monthly Activity</h1>
                        <p className="text-[var(--color-text-secondary)]">Task requests and completion status.</p>
                    </div>
                </div>

                {/* Month Filter */}
                <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)]">
                    {availableMonths.map((date, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedMonth(date)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isSameMonth(date, selectedMonth)
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel)]'
                                }`}
                        >
                            {format(date, 'MMMM')}
                        </button>
                    ))}
                </div>
            </header>

            <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--text-secondary)]">
                        <thead className="bg-[var(--bg-panel)] text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Task</th>
                                <th className="px-6 py-4">Requested</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Status / Completed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center">Loading tasks...</td>
                                </tr>
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center">No tasks found for {format(selectedMonth, 'MMMM yyyy')}.</td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-[var(--bg-panel)] transition-colors">
                                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                                            <div className="max-w-[300px] truncate" title={task.title}>{task.title}</div>
                                            {task.description && <div className="text-xs opacity-60 truncate max-w-[280px] mt-0.5">{task.description}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDate(task.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDate(task.dueDate)}
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
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
    );
}
