// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { useWorkspace } from "@/system/workspace/WorkspaceProvider";
import { getWelcomeData } from "@/utils/greetings";
import { useRouter } from 'next/navigation';
import { 
    ArrowRight, 
    CheckSquare, 
    Calendar as CalendarIcon, 
    FolderPlus, 
    Bell, 
    ChevronDown, 
    ChevronRight, 
    Clock, 
    Activity, 
    PauseCircle, 
    CheckCircle, 
    Zap, 
    Shield, 
    BarChart3, 
    Users, 
    Briefcase, 
    LayoutDashboard, 
    TrendingUp,
    Info
} from 'lucide-react';
import { isToday, isPast } from 'date-fns';
import { Button } from "@/components/ui/button";
import { cn, nativeNavigate } from "@/lib/utils";
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Magnetic } from "@/components/ui/Magnetic";

import { PageLayout } from "@/components/ui/layout/PageLayout";
import { DashboardProvider } from "@/system/dashboard/DashboardProvider";
import { getWidgetsForSection } from "@/system/dashboard/widgetRegistry";
import { Skeleton } from "@/components/ui/skeleton";
import { CanonicalDataService } from "@/services/canonicalDataService";
import { computeDashboardMetrics, assertDashboardMetrics, DashboardMetrics, EMPTY_METRICS } from '@/lib/dashboardMetrics';
import { getInspirationLine } from "@/utils/inspiration";
import { Task } from '@/features/tasks/types/task';
import { Event } from '@/features/events/types/event';
import { useClientData } from "@/app/(shell)/ClientDataContext";

import { normalizeTasks, normalizeEvents, NormalizedTask, NormalizedEvent } from "@/lib/normalization";
import { useOptimisticTasks } from "@/features/tasks/hooks/useOptimisticTasks";
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
import AppTour from "@/components/onboarding/AppTour";
import { OverdueTasksWidget } from "@/features/dashboard/components/OverdueTasksWidget";
import { TodayFocusPanel } from "@/features/dashboard/components/TodayFocusPanel";
import { useCampaigns } from "@/services/campaigns/useCampaigns";
import { ProductionInsights } from "@/features/dashboard/components/ProductionInsights";
import { SystemStatusWidget } from "@/features/dashboard/components/SystemStatusWidget";
import { MemberRequestSummaryWidget } from "@/features/dashboard/components/MemberRequestSummaryWidget";
import { AdminOversightWidget } from "@/features/dashboard/components/AdminOversightWidget";
import { MediaTeamOverview } from "@/features/dashboard/components/MediaTeamOverview";
import { EventsNext7DaysWidget } from "@/features/dashboard/components/EventsNext7DaysWidget";
import { ProductionPulseBar } from "@/features/dashboard/components/ProductionPulseBar";
import { useOperationalSummary } from "@/hooks/useOperationalSummary";
import { DashboardSection } from "@/components/home/DashboardSection";
import { CrewScheduleCard } from "@/features/dashboard/components/CrewScheduleCard";
import { EquipmentUsageCard } from "@/features/dashboard/components/EquipmentUsageCard";
import { TodayEventsCard } from '@/features/dashboard/components/TodayEventsCard';
import { TodayTasksCard } from '@/features/dashboard/components/TodayTasksCard';

import { usePermissions } from "@/hooks/usePermissions";

export default function HomeClient() {
    const { user, loading: authLoading } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const { role: currentRole } = usePermissions();
    const router = useRouter();

    const authReady = !!user && !!currentRole;
    const [tasksLoaded, setTasksLoaded] = useState(false);
    const { loading } = useClientData();
    const [tasks, setTasks] = useState<NormalizedTask[]>([]);
    const [events, setEvents] = useState<NormalizedEvent[]>([]);
    const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns();
    const { data: operationalData, isLoading: operationalLoading } = useOperationalSummary();

    const { displayTasks, mutate, syncRemoteTasks, isReplaying } = useOptimisticTasks(tasks, setTasks as React.Dispatch<React.SetStateAction<Task[]>>);
    const { isOnline } = useConnectivity();

    const sanitizedTasks = useMemo(() => {
        return tasks.filter(t => !t.deleted && !t.is_demo_data);
    }, [tasks]);

    const sanitizedEvents = useMemo(() => {
        return events.filter(e => !e.deleted && !e.is_demo_data);
    }, [events]);

    const dashboardMetrics = useMemo(() => {
        if (!authReady || !tasksLoaded) return null;
        const metrics = computeDashboardMetrics(sanitizedTasks, sanitizedEvents);
        assertDashboardMetrics(metrics); 
        return metrics;
    }, [sanitizedTasks, sanitizedEvents, authReady, tasksLoaded]);

    // Collapsible Group States
    const [operationalPanelsExpanded, setOperationalPanelsExpanded] = useState(false);
    const [strategicInsightsExpanded, setStrategicInsightsExpanded] = useState(false);

    // Persistence: Load from localStorage
    useEffect(() => {
        const loadState = (key: string, setFn: (val: boolean) => void) => {
            const saved = localStorage.getItem(key);
            if (saved !== null) setFn(saved === 'true');
        };

        loadState('mh_home_operational_panels_expanded', setOperationalPanelsExpanded);
        loadState('mh_home_strategic_insights_expanded', setStrategicInsightsExpanded);
    }, []);

    // Helper to toggle and save
    const toggleSection = (key: string, current: boolean, setFn: (val: boolean) => void) => {
        const next = !current;
        setFn(next);
        localStorage.setItem(key, String(next));
    };

    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [welcomeData, setWelcomeData] = useState<{ greeting: string; icon: string }>({ greeting: "Welcome back", icon: "👋" });

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!authReady) return;

        setLoadingData(true);
        setError(null);
        console.log('[HomeClient] Fetching core data...', { role: currentRole, userId: user?.uid });
        try {
            const filter = { 
                role: currentRole, 
                includeAllHistory: true,
                signal 
            };
            const [tData, eData] = await Promise.all([
                CanonicalDataService.getTasks(filter),
                CanonicalDataService.getEvents(filter),
            ]);

            if (signal?.aborted) return;

            setTasks(normalizeTasks(tData || []));
            setEvents(normalizeEvents(eData || []));
            setTasksLoaded(true);
            console.log('[HomeClient] Core data loaded successfully', { tasks: tData.length, events: eData.length });
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Failed to fetch dashboard data:', error);
            setError("Sync didn’t work");
        } finally {
            if (!signal?.aborted) {
                setLoadingData(false);
            }
        }
    }, [authReady, currentWorkspaceId, user?.uid, currentRole]);

    useEffect(() => {
        const controller = new AbortController();
        if (authReady) {
            fetchData(controller.signal);
            setWelcomeData(getWelcomeData(user));
        }
        return () => controller.abort();
    }, [authReady, user, fetchData]);

    useEffect(() => {
        if (!authReady || !isOnline || isReplaying) return;

        const unsubscribe = CanonicalDataService.subscribeToTasks(
            { role: currentRole, userId: user?.uid, includeAllHistory: true },
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
    }, [user, isOnline, isReplaying, syncRemoteTasks, currentWorkspaceId, authReady, currentRole]);

    useRefreshOnFocus(fetchData);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'n' &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) &&
                !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                nativeNavigate('/tasks/new?returnTo=home', router, 'HomeClient.tsx');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    const isAuthLoading = authLoading || !authReady;
    const isDataLoading = loadingData || !tasksLoaded;
    const isActuallyLoading = isAuthLoading || isDataLoading;
    
    // Log state changes in dev to track bottlenecks
    if (process.env.NODE_ENV === 'development') {
        console.log('[HomeClient] Loading State:', { 
            isActuallyLoading, 
            authLoading, 
            loadingData, 
            tasksLoaded, 
            campaignsLoading,
            role: currentRole
        });
    }

    const todayTasks = useMemo(() => {
        return displayTasks.filter(t => {
            const due = t.due_date;
            return due && (isToday(due) || (t.status !== 'done' && isPast(due)));
        });
    }, [displayTasks]);

    const todayEvents = useMemo(() => {
        return events.filter(e => e.date && isToday(e.date));
    }, [events]);

    const dashboardContextValue = useMemo(() => ({
        tasks: displayTasks.filter(t => !t.deleted && !t.is_demo_data) as NormalizedTask[],
        events: sanitizedEvents,
        metrics: dashboardMetrics,
        loading: isActuallyLoading,
        error,
        mutate,
        refresh: fetchData,
        user
    }), [displayTasks, sanitizedEvents, dashboardMetrics, isActuallyLoading, error, mutate, fetchData, user]);

    const inspirationLine = useMemo(() => getInspirationLine(currentRole), [currentRole]);

    return (
        <DashboardProvider value={dashboardContextValue}>
            <PageLayout mode="plain" className="pt-0 pb-0 space-y-0">
                <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-8 lg:pb-12">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-[48px] space-y-8">
                        {/* Header Section */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="relative pt-6 pb-2"
                        >
                            <div className="absolute inset-0 bg-foreground/[0.01] rounded-[32px] pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 px-0">
                                <div className="space-y-2 text-left min-w-[280px]">
                                    {isAuthLoading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-10 w-64 bg-foreground/10" />
                                            <Skeleton className="h-4 w-80 bg-foreground/5" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black text-[#60A5FA] uppercase tracking-[0.2em] leading-none mb-1">
                                                    {welcomeData.greeting.split(',')[0]}
                                                </span>
                                                <div className="flex items-baseline gap-2">
                                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                                        {welcomeData.greeting.split(',')[1]?.trim()}
                                                    </h1>
                                                    <span className="text-2xl animate-bounce duration-[3000ms]">
                                                        {welcomeData.icon || "👋"}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-foreground/80 font-medium tracking-wide italic">
                                                Reviewing today's wins.
                                            </p>
                                        </>
                                    )}
                                </div>

                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                    className="flex items-center gap-3 md:gap-4 flex-wrap justify-center md:justify-end"
                                >
                                    <Magnetic strength={0.3}>
                                        <button 
                                            onClick={() => nativeNavigate('/tasks/new?returnTo=home', router, 'HomeClient.tsx')} 
                                            className="group flex items-center gap-3 h-12 px-6 rounded-2xl glass-liquid hover:bg-foreground/[0.1] text-foreground text-sm font-semibold active:scale-95 whitespace-nowrap transition-all border border-foreground/10"
                                        >
                                            <CheckSquare size={18} className="text-primary group-hover:rotate-12 transition-transform" /> 
                                            NEW TASK
                                        </button>
                                    </Magnetic>
                                    <Magnetic strength={0.3}>
                                        <button 
                                            onClick={() => nativeNavigate('/calendar', router, 'HomeClient.tsx')} 
                                            className="group flex items-center gap-3 h-12 px-6 rounded-2xl glass-liquid hover:bg-foreground/[0.1] text-foreground text-sm font-semibold active:scale-95 whitespace-nowrap transition-all border border-foreground/10"
                                        >
                                            <CalendarIcon size={18} className="text-primary group-hover:rotate-12 transition-transform" /> 
                                            NEW EVENT
                                        </button>
                                    </Magnetic>
                                    {currentRole !== 'member' && (
                                        <Magnetic strength={0.3}>
                                            <button 
                                                onClick={() => nativeNavigate('/campaigns/new', router, 'HomeClient.tsx')} 
                                                className="group flex items-center gap-3 h-12 px-6 rounded-2xl glass-liquid hover:bg-foreground/[0.1] text-foreground text-sm font-semibold active:scale-95 whitespace-nowrap transition-all border border-foreground/10"
                                            >
                                                <FolderPlus size={18} className="text-primary group-hover:scale-110 transition-transform" /> 
                                                NEW CAMPAIGN
                                            </button>
                                        </Magnetic>
                                    )}
                                    {['admin', 'manager'].includes(currentRole) && (
                                        <Magnetic strength={0.3}>
                                            <button 
                                                onClick={() => nativeNavigate('/notifications/new', router, 'HomeClient.tsx')} 
                                                className="group flex items-center gap-3 h-12 px-6 rounded-2xl glass-liquid hover:bg-foreground/[0.1] text-foreground text-sm font-semibold active:scale-95 whitespace-nowrap transition-all border border-foreground/10"
                                            >
                                                <Bell size={18} className="text-rose-400 animate-swing transition-transform" /> 
                                                NOTIFY TEAM
                                            </button>
                                        </Magnetic>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>

                        {currentRole !== 'member' && (
                            <div className="space-y-6">
                                <div className="flex items-baseline gap-3 ml-2">
                                    <Zap size={18} className="text-amber-400 self-center" />
                                    <h2 className="text-sm font-bold tracking-tight text-foreground/90">Production Pulse</h2>
                                </div>
                                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                                    <ProductionPulseBar />
                                </div>
                            </div>
                        )}
                        {/* 1 - System Status (Visible to all for transparency) */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <SystemStatusWidget />
                        </div>

                        {/* 1b - Personal Request Summary (Available to all, but hidden if empty for non-members) */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <MemberRequestSummaryWidget allowEmpty={currentRole === 'member'} />
                        </div>

                        {/* 2 & 3 - Today's Tasks & Today's Events */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-800">
                            <TodayTasksCard 
                                tasks={todayTasks} 
                                isLoading={isDataLoading} 
                                onViewTask={(id) => nativeNavigate(`/tasks?id=${id}`, router, 'HomeClient.tsx')}
                            />
                            <TodayEventsCard 
                                events={todayEvents} 
                                tasks={tasks}
                                isLoading={isDataLoading} 
                                onViewEvent={(id) => nativeNavigate(`/calendar?id=${id}`, router, 'HomeClient.tsx')}
                            />
                        </div>


                        {/* Live Monitoring Indicator */}
                        {['admin', 'manager'].includes(currentRole) && (
                            <div className="p-4 rounded-[18px] bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap size={14} className="text-amber-400" />
                                    <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest">
                                        Live monitoring active for {user?.name || user?.fullName || 'Super Admin'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Connected</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Collapsed Sections */}
                        {currentRole !== 'member' && (
                            <div className="space-y-8 pt-4 border-t border-foreground/5">
                                {/* 5 - Insights Group */}
                                <DashboardSection
                                    sectionId="insights-group"
                                    title="Insights"
                                    className="space-y-6"
                                    icon={<BarChart3 size={18} className="text-premium-gradient self-center" />}
                                    isExpanded={strategicInsightsExpanded}
                                    onToggle={() => toggleSection('mh_home_strategic_insights_expanded', strategicInsightsExpanded, setStrategicInsightsExpanded)}
                                >
                                    <div className="space-y-8">
                                        <OverdueTasksWidget />
                                        <div className="space-y-[12px]">
                                            {['admin', 'manager'].includes(currentRole) && (
                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-widest mb-4 ml-2 mt-2">Global Governance</h3>
                                                    <AdminOversightWidget />
                                                </div>
                                            )}
                                            <div className="space-y-6 pt-2">
                                                <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-widest mb-4 ml-2 mt-2">Strategic Insights</h3>
                                                <ProductionInsights 
                                                    data={{ events, tasks, totalInventory: operationalData.totalInventory }} 
                                                    isLoading={isDataLoading} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </DashboardSection>

                                {/* 6 - Operational Panels Group */}
                                <DashboardSection
                                    sectionId="operational-group"
                                    title="Operational Panels"
                                    className="space-y-6 mb-4"
                                    icon={<LayoutDashboard size={18} className="text-blue-500 self-center" />}
                                    isExpanded={operationalPanelsExpanded}
                                    onToggle={() => toggleSection('mh_home_operational_panels_expanded', operationalPanelsExpanded, setOperationalPanelsExpanded)}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-[repeat(2,minmax(260px,1fr))] gap-5 pt-2">
                                        <div className="flex flex-col">
                                            <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-widest mb-4 ml-2 mt-2">Crew Schedule</h3>
                                            <CrewScheduleCard crew={operationalData.crew} isLoading={operationalLoading} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-widest mb-4 ml-2 mt-2">Equipment Usage</h3>
                                            <EquipmentUsageCard equipment={operationalData.equipment} isLoading={operationalLoading} />
                                        </div>
                                    </div>
                                </DashboardSection>
                            </div>
                        )}
                    </div>
                </div>
            </PageLayout>
            <AppTour />
        </DashboardProvider>
    );
}
