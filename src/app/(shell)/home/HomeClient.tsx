// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { getWelcomeData } from "@/utils/greetings";
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckSquare, Calendar, FolderPlus, Bell, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn, nativeNavigate } from "@/lib/utils";

import { PageLayout } from "@/components/ui/layout/PageLayout";
import { MyFocusWidget } from "@/components/home/widgets/MyFocusWidget";
import { ActiveCampaignsWidget } from "@/components/home/widgets/ActiveCampaignsWidget";
import { EventsNext7DaysWidget } from "@/components/home/widgets/EventsNext7DaysWidget";
import { AdminOversightWidget } from "@/components/home/widgets/AdminOversightWidget";
import { TimelineWidget } from "@/components/home/widgets/TimelineWidget";
import { MediaTeamOverview } from "@/components/home/widgets/MediaTeamOverview";
import { TaskIntelligenceWidget } from "@/components/home/widgets/TaskIntelligenceWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { computeDashboardMetrics, assertDashboardMetrics, DashboardMetrics, EMPTY_METRICS } from '@/lib/dashboardMetrics';
import { getInspirationLine } from "@/utils/inspiration";
import { Task } from "@/types/task";
import { Event } from "@/types/event";
import { useClientData } from "@/app/(shell)/ClientDataContext";

import { normalizeTasks, normalizeEvents, NormalizedTask, NormalizedEvent } from "@/lib/normalization";
import { useOptimisticTasks } from "@/hooks/useOptimisticTasks";
import { useConnectivity } from "@/hooks/useConnectivity";

import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { CollapsibleSectionHeader } from "@/components/home/CollapsibleSectionHeader";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export default function HomeClient() {
    const { user, loading: authLoading } = useAuth();
    const role = user?.role;
    const router = useRouter();

    // UI-P1.1 — Explicit Auth Gate
    const authReady = !!user && !!role;
    const [tasksLoaded, setTasksLoaded] = useState(false);
    const { loading } = useClientData();
    const [tasks, setTasks] = useState<NormalizedTask[]>([]);
    const [events, setEvents] = useState<NormalizedEvent[]>([]);

    const { displayTasks, mutate, syncRemoteTasks, isReplaying } = useOptimisticTasks(tasks, setTasks as React.Dispatch<React.SetStateAction<Task[]>>);
    const { isOnline } = useConnectivity();

    const dashboardMetrics = useMemo(() => {
        // UI-P1.1 — Prevent metric flicker. Truth only after tasks load.
        if (!authReady || !tasksLoaded) return null;
        const metrics = computeDashboardMetrics(tasks, events);
        assertDashboardMetrics(metrics); // Keep assertion for safety
        return metrics;
    }, [tasks, events, authReady, tasksLoaded]);

    // Collapsible States
    const [adminOversightExpanded, setAdminOversightExpanded] = useState(true);
    const [mediaTeamOverviewExpanded, setMediaTeamOverviewExpanded] = useState(true);

    // Persistence: Load from localStorage
    useEffect(() => {
        const adminSaved = localStorage.getItem('mh_home_admin_oversight_expanded');
        if (adminSaved !== null) setAdminOversightExpanded(adminSaved === 'true');

        const mediaSaved = localStorage.getItem('mh_home_media_team_overview_expanded');
        if (mediaSaved !== null) setMediaTeamOverviewExpanded(mediaSaved === 'true');
    }, []);

    // Persistence: Save to localStorage
    const toggleAdminOversight = () => {
        const next = !adminOversightExpanded;
        setAdminOversightExpanded(next);
        localStorage.setItem('mh_home_admin_oversight_expanded', String(next));
    };

    const toggleMediaTeamOverview = () => {
        const next = !mediaTeamOverviewExpanded;
        setMediaTeamOverviewExpanded(next);
        localStorage.setItem('mh_home_media_team_overview_expanded', String(next));
    };

    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [welcomeData, setWelcomeData] = useState<{ greeting: string; icon: string }>({ greeting: "Welcome back", icon: "👋" });

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!authReady) return;

        setLoadingData(true);
        setError(null); // Clear previous errors
        try {
            console.log('[BOOT] Fetching dashboard data...');
            const filter = { institution_id: user?.institution_id, role, userId: user?.uid, signal };
            const [tData, eData] = await Promise.all([
                CanonicalDataService.getTasks(filter),
                CanonicalDataService.getEvents(filter),
            ]);

            if (signal?.aborted) return;

            setTasks(normalizeTasks(tData || [])); // Ensure normalization
            setEvents(normalizeEvents(eData || [])); // Ensure normalization
            setTasksLoaded(true);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to fetch dashboard data:', error);
            setError("Sync didn’t work");
        } finally {
            if (!signal?.aborted) {
                setLoadingData(false);
            }
        }
    }, [authReady, user?.institution_id, user?.uid, role]);

    // Initial Fetch (For Events and Tasks)
    useEffect(() => {
        const controller = new AbortController();
        if (authReady) {
            fetchData(controller.signal);
            setWelcomeData(getWelcomeData(user));
        }
        return () => controller.abort();
    }, [authReady, user, fetchData]);

    // Phase 8: Real-Time Sync Subscription for Tasks
    useEffect(() => {
        if (!authReady || !isOnline || isReplaying) return;

        console.log('[BOOT] Subscribing to real-time updates...');
        const unsubscribe = CanonicalDataService.subscribeToTasks(
            { institution_id: user?.institution_id, role, userId: user?.uid },
            (updatedTasks) => {
                const normalized = normalizeTasks(updatedTasks || []);
                syncRemoteTasks(normalized, user);
                setTasksLoaded(true);
            },
            (err) => {
                console.error("Dashboard task sync error:", err);
                setError("Task sync interrupted");
            }
        );

        return () => unsubscribe();
    }, [user, isOnline, isReplaying, syncRemoteTasks]);

    // Silent Refresh on Focus (Mainly for Events now)
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


    const isActuallyLoading = authLoading || loadingData || !tasksLoaded;

    return (
        <div className="flex-1 w-full overflow-y-auto no-scrollbar py-8 lg:pb-10">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-12">
                {/* 29.1.1 — HERO / ORIENTATION STRIP */}
                <div className="relative pt-4 pb-8 border-b border-white/5">
                    {/* Glass Backdrop (Minimal) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-30 rounded-[32px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="space-y-1 text-left min-w-[200px]">
                            {isActuallyLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-9 w-48 bg-white/10" />
                                    <Skeleton className="h-4 w-64 bg-white/5" />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold tracking-tight text-white/95">
                                        {welcomeData.greeting.split(',')[0]}, <span className="text-blue-400">{welcomeData.greeting.split(',')[1]?.trim()}</span>
                                    </h1>
                                    <p className="text-sm text-white/50 italic font-medium">
                                        "{getInspirationLine(user?.role || 'guest')}"
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3 flex-wrap md:justify-end">
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
                            <button
                                onClick={() => router.push('/campaigns/new')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <FolderPlus size={14} className="text-blue-400" />
                                New Campaign
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
                        {/* 29.1.2 — MY TODAY: TASK INTELLIGENCE */}
                        <div className="px-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white/90">Task Intelligence</h2>
                            </div>
                            {dashboardMetrics ? (
                                <TaskIntelligenceWidget stats={{
                                    ...dashboardMetrics,
                                    // Map DashboardMetrics to TaskStats.next7Days
                                    next7Days: dashboardMetrics.upcomingTasks,
                                    // Separate Due Today from Overdue for strict stats (approximate, since dashboardMetrics.dueToday is composite)
                                    // We'll rely on the fact that overdue is separate in dashboardMetrics
                                    dueToday: Math.max(0, dashboardMetrics.dueToday - dashboardMetrics.overdue),
                                    total: 0, // Unused
                                    working: 0, // Unused
                                    pending: 0,
                                    completed: 0,
                                    onHold: dashboardMetrics.blocked, // Map blocked to onHold
                                    done: dashboardMetrics.completedToday // Map completedToday to done
                                }} />
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />)}
                                </div>
                            )}
                        </div>

                        {/* 29.1.3 — MY TODAY: TASK LIST */}
                        <div className="px-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white/90">Your work for today</h2>
                                {!loading && (displayTasks.length > 0 || events.length > 0) && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Operational</span>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black/90 border-white/10 backdrop-blur-md">
                                                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Live Sync Alpha v1.4</p>
                                                <p className="text-[9px] text-white/40 mt-1">Real-time collaboration active.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            <MyFocusWidget
                                tasks={displayTasks as NormalizedTask[]}
                                userId={user?.uid || ''}
                                error={error}
                                onRetry={fetchData}
                                todayOnly={true}
                                maxItems={6}
                                onTaskMutate={mutate}
                            />
                        </div>

                        {/* 29.1.4 — TOMORROW PREVIEW */}
                        <div className="px-4">
                            <section className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
                                <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">Tomorrow</h2>
                                <div className="space-y-4">
                                    {displayTasks && displayTasks.filter(t => {
                                        if (!t.due_date || t.status === 'done') return false;
                                        const isAssigned = Array.isArray(t.assigned_to) && t.assigned_to.some(a => (typeof a === 'string' ? a === user?.uid : a.uid === user?.uid));
                                        if (!isAssigned) return false;
                                        const due = new Date(t.due_date);
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                        return due.toDateString() === tomorrow.toDateString();
                                    }).length > 0 ? (
                                        displayTasks.filter(t => {
                                            if (!t.due_date || t.status === 'done') return false;
                                            const isAssigned = Array.isArray(t.assigned_to) && t.assigned_to.some(a => (typeof a === 'string' ? a === user?.uid : a.uid === user?.uid));
                                            if (!isAssigned) return false;
                                            const due = new Date(t.due_date);
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
                                        <EmptyState
                                            icon={Calendar}
                                            title="Free Tomorrow"
                                            description="Nothing scheduled yet. Focus on your current priorities."
                                            compact={true}
                                            className="py-4"
                                        />
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
                            {/* ... (Team today content remains static as per requirements) ... */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Due Today', value: dashboardMetrics?.dueToday ?? 0 },
                                    { label: 'In Progress', value: dashboardMetrics?.inProgress ?? 0 },
                                    { label: 'On Hold', value: dashboardMetrics?.review ?? 0 },
                                    { label: 'Completed', value: dashboardMetrics?.completedToday ?? 0 }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                                        <p className="text-[10px] font-bold text-white/30 uppercase mb-1">{item.label}</p>
                                        {isActuallyLoading ? (
                                            <Skeleton className="h-7 w-12 bg-white/10 rounded mt-1" />
                                        ) : (
                                            <p className="text-xl font-bold text-white/60 animate-in fade-in duration-300">{item.value}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Today Progress Bar */}
                            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">Today's Completion</h4>
                                    <div className="flex items-center gap-2">
                                        {displayTasks.length > 0 && dashboardMetrics ? (
                                            <>
                                                <span className="text-xs font-bold text-white/70">
                                                    {dashboardMetrics?.completedToday ?? 0} / {(dashboardMetrics?.completedToday ?? 0) + (dashboardMetrics?.dueToday ?? 0)} tasks
                                                </span>
                                                <span className="text-[10px] font-black text-white/10 tracking-tighter">·</span>
                                                <span className="text-xs font-bold text-white/70">
                                                    {(dashboardMetrics.completedToday ?? 0) + (dashboardMetrics.dueToday ?? 0) > 0
                                                        ? Math.round(((dashboardMetrics.completedToday ?? 0) / ((dashboardMetrics.completedToday ?? 0) + (dashboardMetrics.dueToday ?? 0))) * 100)
                                                        : 100}%
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[10px) font-bold text-white/10 uppercase tracking-widest">Awaiting sync</span>
                                        )}
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm p-[2px]">
                                    {isActuallyLoading ? (
                                        <div className="h-full w-1/3 bg-white/10 animate-pulse rounded-full" />
                                    ) : (
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_-2px_rgba(255,255,255,0.1)]",
                                                (() => {
                                                    if (!dashboardMetrics) return "bg-white/10";
                                                    const total = (dashboardMetrics.completedToday ?? 0) + (dashboardMetrics.dueToday ?? 0);
                                                    if (total === 0) return "bg-emerald-500/80 shadow-emerald-500/20"; // All clear
                                                    const pct = ((dashboardMetrics.completedToday ?? 0) / total) * 100;
                                                    if (pct <= 30) return "bg-gradient-to-r from-red-500/80 to-amber-500/80 shadow-amber-500/20";
                                                    if (pct <= 70) return "bg-blue-500/80 shadow-blue-500/20";
                                                    return "bg-emerald-500/80 shadow-emerald-500/20";
                                                })()
                                            )}
                                            style={{ width: `${(dashboardMetrics?.completedToday ?? 0) + (dashboardMetrics?.dueToday ?? 0) > 0 ? Math.round(((dashboardMetrics?.completedToday ?? 0) / ((dashboardMetrics?.completedToday ?? 0) + (dashboardMetrics?.dueToday ?? 0))) * 100) : 100}%` }}
                                        />
                                    )}
                                </div>
                            </div>
                        </section>


                        {/* 29.1.7 — ADMIN OVERSIGHT (STRATEGIC) */}
                        {user?.role === 'admin' && (
                            <section className="pt-8 border-t border-white/5">
                                <CollapsibleSectionHeader
                                    title="Admin Oversight"
                                    isExpanded={adminOversightExpanded}
                                    onToggle={toggleAdminOversight}
                                />
                                <AnimatePresence initial={false}>
                                    {adminOversightExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <AdminOversightWidget
                                                tasks={displayTasks as NormalizedTask[]}
                                                events={events}
                                                dashboardMetrics={dashboardMetrics || EMPTY_METRICS}
                                                user={user}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {!adminOversightExpanded && (
                                    <div className="h-px bg-white/5 mt-2" />
                                )}
                            </section>
                        )}

                        {/* 29.1.6 — MEDIA TEAM OVERVIEW (STRATEGIC) */}
                        <section className="pt-8 border-t border-white/5">
                            <CollapsibleSectionHeader
                                title="Media Team Overview"
                                isExpanded={mediaTeamOverviewExpanded}
                                onToggle={toggleMediaTeamOverview}
                            />

                            <AnimatePresence initial={false}>
                                {mediaTeamOverviewExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <MediaTeamOverview dashboardMetrics={dashboardMetrics || EMPTY_METRICS} />
                                        <ActiveCampaignsWidget />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!mediaTeamOverviewExpanded && (
                                <div className="h-px bg-white/5 mt-2" />
                            )}
                        </section>

                        {/* Events in Next 7 Days Section */}
                        <section className="pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">Events in Next 7 Days</h2>
                                <div onClick={() => nativeNavigate('/calendar', router, 'Home:Events')} className="flex items-center gap-1.5 cursor-pointer group">
                                    <span className="text-[10px] font-bold text-white/20 group-hover:text-blue-400/60 uppercase transition-colors">Calendar</span>
                                    <ArrowRight size={12} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                            <EventsNext7DaysWidget events={dashboardMetrics?.next7DayEvents ?? []} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
