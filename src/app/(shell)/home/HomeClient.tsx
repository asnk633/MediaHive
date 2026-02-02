import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { getWelcomeData } from "@/utils/greetings";
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckSquare, Calendar, FolderPlus, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn, nativeNavigate } from "@/lib/utils";

import { PageLayout } from "@/components/ui/layout/PageLayout";
import { MyFocusWidget } from "@/components/home/widgets/MyFocusWidget";
import { ActiveCampaignsWidget } from "@/components/home/widgets/ActiveCampaignsWidget";
import { TimelineWidget } from "@/components/home/widgets/TimelineWidget";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { getInspirationLine } from "@/utils/inspiration";
import { Task } from "@/types/task";
import { Event } from "@/types/event";
import { useClientData } from "@/app/(shell)/ClientDataContext";

import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

export default function HomeClient() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { tasks: contextTasks, events: contextEvents, loading } = useClientData();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const dashboardMetrics = useDashboardMetrics(tasks, user);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [welcomeData, setWelcomeData] = useState<{ greeting: string; icon: string }>({ greeting: "Welcome back", icon: "👋" });

    const fetchData = React.useCallback(async () => {
        if (!user?.uid) return;
        setError(null);

        try {
            const [fetchedTasks, fetchedEvents] = await Promise.all([
                CanonicalDataService.getTasks({
                    role: user.role,
                    userId: user.uid,
                    institutionId: user.institutionId
                }),
                CanonicalDataService.getEvents({
                    role: user.role,
                    userId: user.uid,
                    institutionId: user.institutionId
                })
            ]);

            setTasks(fetchedTasks || []);
            setEvents(fetchedEvents || []);
        } catch (error) {
            console.error("Dashboard fetch error:", error);
            setError("Sync didn’t work");
        } finally {
            setLoadingData(false);
        }
    }, [user?.uid, user?.role, user?.institutionId]);

    // Initial Fetch
    useEffect(() => {
        if (user?.uid) {
            fetchData();
            setWelcomeData(getWelcomeData(user));
        }
    }, [user, fetchData]);

    // Silent Refresh on Focus
    useRefreshOnFocus(fetchData);

    // Intent Shortcut: Press 'n' for New Task
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'n' &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) &&
                !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                router.push('/tasks/new?returnTo=home');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    if (authLoading || loadingData) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-canvas z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full overflow-y-auto no-scrollbar py-8 lg:pb-10">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-12 text-center">
                {/* 29.1.1 — HERO / ORIENTATION STRIP */}
                <div className="relative pt-4 pb-8 border-b border-white/5">
                    {/* Glass Backdrop (Minimal) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-30 rounded-[32px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-white/90">
                                {welcomeData.greeting.split(',')[0]}, <span className="text-blue-400">{welcomeData.greeting.split(',')[1]?.trim()}</span>
                            </h1>
                            <p className="text-sm text-white/40 italic font-medium">
                                "{getInspirationLine(user?.role || 'guest')}"
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/tasks/new?returnTo=home')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <CheckSquare size={14} className="text-blue-400" />
                                New Task
                            </button>
                            <button
                                onClick={() => router.push('/calendar')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <Calendar size={14} className="text-blue-400" />
                                New Event
                            </button>
                            {/* Admin Quick Action (29.4) */}
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => router.push('/notifications/new')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-all active:scale-95"
                                >
                                    <Bell size={14} className="text-blue-400" />
                                    Notify
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status/Error Indicator Fragment */}
                {error && (
                    <div className="mx-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/5 border border-red-500/10 animate-in fade-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</span>
                        <div className="w-1.5 h-1.5 bg-red-400/20 rounded-full" />
                        <button onClick={() => fetchData()} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Retry Sync</button>
                    </div>
                )}

                {/* 29.3.3 — ROLE-CORRECT HOME CONTENT (Gated for non-admins) */}
                {user?.role !== 'admin' && (
                    <>
                        {/* 29.1.2 — MY TODAY: Metrics Row */}
                        <div className="px-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Primary Card */}
                                <div className="glass-card p-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <CheckSquare size={48} className="text-blue-400" />
                                    </div>
                                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">My Today</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white">{dashboardMetrics.todo}</span>
                                        <span className="text-xs font-medium text-white/40">Tasks Due</span>
                                    </div>
                                </div>

                                {/* Overdue (Conditional) */}
                                {dashboardMetrics.overdue > 0 && (
                                    <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/[0.02] animate-in zoom-in-95">
                                        <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-4">Overdue</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-white">{dashboardMetrics.overdue}</span>
                                            <span className="text-xs font-medium text-white/40">Critical</span>
                                        </div>
                                    </div>
                                )}

                                {/* In Progress */}
                                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">In Progress</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white">{dashboardMetrics.inProgress}</span>
                                        <span className="text-xs font-medium text-white/40">Active</span>
                                    </div>
                                </div>

                                {/* Completed Today */}
                                <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Done Today</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white">{dashboardMetrics.completed}</span>
                                        <span className="text-xs font-medium text-white/40">Updates</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 29.1.3 — MY TODAY: TASK LIST */}
                        <div className="px-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white/90">Your work for today</h2>
                                {!loading && (tasks.length > 0 || events.length > 0) && (
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Live Sync Alpha</span>
                                )}
                            </div>

                            <MyFocusWidget
                                tasks={tasks}
                                userId={user?.uid || ''}
                                error={error}
                                onRetry={fetchData}
                                todayOnly={true}
                                maxItems={6}
                            />
                        </div>

                        {/* 29.1.4 — TOMORROW PREVIEW */}
                        <div className="px-4">
                            <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] opacity-70">
                                <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Tomorrow</h2>
                                <div className="space-y-4">
                                    {tasks && tasks.filter(t => {
                                        if (!t.dueDate || t.status === 'done') return false;
                                        const isAssigned = Array.isArray(t.assignedTo) && t.assignedTo.some(a => (typeof a === 'string' ? a === user?.uid : a.uid === user?.uid));
                                        if (!isAssigned) return false;
                                        const due = (t.dueDate as any).seconds ? new Date((t.dueDate as any).seconds * 1000) : new Date(t.dueDate);
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                        return due.toDateString() === tomorrow.toDateString();
                                    }).length > 0 ? (
                                        tasks.filter(t => {
                                            if (!t.dueDate || t.status === 'done') return false;
                                            const isAssigned = Array.isArray(t.assignedTo) && t.assignedTo.some(a => (typeof a === 'string' ? a === user?.uid : a.uid === user?.uid));
                                            if (!isAssigned) return false;
                                            const due = (t.dueDate as any).seconds ? new Date((t.dueDate as any).seconds * 1000) : new Date(t.dueDate);
                                            const tomorrow = new Date();
                                            tomorrow.setDate(tomorrow.getDate() + 1);
                                            return due.toDateString() === tomorrow.toDateString();
                                        }).slice(0, 5).map(task => (
                                            <div key={task.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-2 -mx-2 rounded transition-colors">
                                                <span className="text-sm text-white/50">{task.title}</span>
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">{task.priority}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-white/20 italic font-medium px-2">Nothing scheduled for tomorrow</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-4 items-start">
                    <div className="lg:col-span-12 space-y-12">
                        {/* 29.1.5 — TEAM TODAY OVERVIEW */}
                        <section className="pt-8 border-t border-white/5">
                            <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">Team today</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Due Today</p>
                                    <p className="text-xl font-bold text-white/60">{tasks.filter(t => t.status !== 'done').length}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <p className="text-[10px] font-bold text-white/20 uppercase mb-1">In Progress</p>
                                    <p className="text-xl font-bold text-white/60">{tasks.filter(t => t.status === 'in_progress').length}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Pending Review</p>
                                    <p className="text-xl font-bold text-white/60">{dashboardMetrics.review}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                    <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Completed</p>
                                    <p className="text-xl font-bold text-white/60">{dashboardMetrics.completed}</p>
                                </div>
                            </div>
                        </section>

                        {/* 29.1.7 — ADMIN-ONLY INSERTS */}
                        {user?.role === 'admin' && (
                            <section className="pt-8 border-t border-white/5 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-xs font-bold text-blue-400/50 uppercase tracking-widest mb-6">Administrative Context</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Pending Approvals</h4>
                                        <p className="text-2xl font-bold text-white">{dashboardMetrics.pendingApproval}</p>
                                    </div>
                                    <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Tasks From Me</h4>
                                        <p className="text-2xl font-bold text-white">0</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 29.1.6 — MEDIA TEAM OVERVIEW (STRATEGIC) */}
                        <section className="pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xs font-bold text-white/20 uppercase tracking-widest">Media team overview</h2>
                                <div onClick={() => nativeNavigate('/projects', router, 'Home:Campaigns')} className="flex items-center gap-1.5 cursor-pointer group">
                                    <span className="text-[10px] font-bold text-white/20 group-hover:text-blue-400/60 uppercase transition-colors">Strategic View</span>
                                    <ArrowRight size={12} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                            <ActiveCampaignsWidget />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
