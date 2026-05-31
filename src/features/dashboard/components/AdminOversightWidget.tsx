import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn, nativeNavigate } from "@/lib/utils";
import { ReactiveCard } from '@/components/ui/ReactiveCard';
import { Task } from "@/features/tasks/types/task";
import { EventItem as Event } from '@/services/events/eventContract';
import { AuthUser } from "@/contexts/AuthContextProvider";
import { DashboardMetrics } from "@/lib/dashboardMetrics";
import {
    getAdminSeverity,
    getSeverityColor,
    getSeverityGlow,
    getKPIBadge
} from "@/lib/adminSeverity";
import {
    Clock,
    AlertCircle,
    CheckSquare,
    Calendar,
    Layers,
    UserPlus,
    Activity,
    Flag,
    ShieldCheck,
    Zap,
    LifeBuoy
} from 'lucide-react';
import { InstitutionalPulseRow } from './InstitutionalPulseRow';

import { useDashboard } from '@/system/dashboard/DashboardProvider';

/**
 * AdminOversightWidget (Next-Level Upgrade)
 * Command center with severity encoding, escalation paths, and executive KPI signaling.
 */
export const AdminOversightWidget = () => {
    const { tasks, events, metrics: dashboardMetrics, user } = useDashboard();
    const router = useRouter();

    const adminStats = useMemo(() => {
        if (!dashboardMetrics) return null;
        return {
            createdByMe: dashboardMetrics.adminTotals.createdMe,
            onHold: dashboardMetrics.adminTotals.onHold,
            upcomingEvents: dashboardMetrics.next7DayEvents.length,
            weeklyEvents: dashboardMetrics.thisWeekEvents.length,
            activeCampaignsCount: dashboardMetrics.adminTotals.activeCampaignsCount,
        };
    }, [dashboardMetrics]);

    if (!dashboardMetrics || !adminStats) return null;

    const oversightCards = [
        {
            title: "Pending Approvals",
            value: dashboardMetrics.adminTotals.pendingApprovals,
            icon: CheckSquare,
            route: "/admin/approvals",
            empty: "All clear. No approvals waiting."
        },
        {
            title: "Overdue (Global)",
            value: dashboardMetrics.adminTotals.globalOverdue,
            icon: Clock,
            route: "/tasks?filter=overdue",
            empty: "Great job. Nothing is overdue."
        },
        {
            title: "Tasks Created by Me",
            value: adminStats.createdByMe,
            icon: UserPlus,
            route: "/tasks?created_by=me",
            empty: "0 tasks created yet"
        },
        {
            title: "On Hold Tasks",
            value: adminStats.onHold,
            icon: ShieldCheck, // Using ShieldCheck or similar distinct icon if Ban is too negative? User didn't specify. I'll stick to AlertCircle or change to something "On Hold"-like. Original was AlertCircle.
            // Prompt said: "Rename card: On Hold Tasks".
            // I'll use Flag or PauseCircle. Let's use `Ban` as it was there? No, step 1718 showed `AlertCircle` for blocked.
            // Wait, step 1718 line 76 says `icon: AlertCircle`.
            // But line 118 shows `oversightCards.map` uses `card.icon`.
            // I'll use `AlertCircle` relative to the previous `AlertCircle` or `Ban`.
            // Step 1718 lines 74-79:
            // title: "Blocked Tasks", value: ..., icon: AlertCircle...
            // I will replace it.
            route: "/tasks?status=on_hold",
            empty: "No tasks on hold at the moment"
        },
        {
            title: "Active Campaigns",
            value: adminStats.activeCampaignsCount,
            icon: Layers,
            route: "/reports",
            empty: "No active campaigns yet"
        },
        {
            title: "Upcoming Events",
            value: adminStats.upcomingEvents,
            icon: Calendar,
            route: "/calendar",
            empty: "No upcoming events scheduled"
        }
    ];

    // Compute status colors and KPI badge
    const cardSeverities = oversightCards.map(c => getAdminSeverity(c.value || 0));
    const kpi = getKPIBadge(cardSeverities);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 relative">

            {/* Executive KPI Badge - Moved inside to prevent clipping */}
            <div className="flex justify-end">
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-wider transition-all duration-500",
                    kpi.bg, kpi.color, kpi.border
                )}>
                    {kpi.label === 'Systems Stable' ? <ShieldCheck size={12} /> : kpi.label === 'Attention Needed' ? <Zap size={12} /> : <LifeBuoy size={12} />}
                    {kpi.label}
                </div>
            </div>

            {/* Primary Grid: Strategic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {oversightCards.map((card, idx) => {
                    const severity = getAdminSeverity(card.value || 0);
                    const accentColor = getSeverityColor(severity);
                    const glowEffect = getSeverityGlow(severity);

                    return (
                        <ReactiveCard
                            key={idx}
                            onClick={() => nativeNavigate(card.route, router, `AdminOversight:${card.title}`)}
                            className="p-[18px] cursor-pointer min-h-[144px] flex flex-col justify-between dashboard-card-secondary rounded-3xl transition-all"
                        >

                            <div className="flex justify-between items-baseline mb-4">
                                <h4 className="text-sm font-medium text-foreground/85 group-hover:text-foreground transition-colors ml-1.5">
                                    {card.title}
                                </h4>
                                <card.icon size={14} className={cn("transition-colors", severity !== 'neutral' ? "text-foreground/70" : "text-foreground/80")} />
                            </div>

                            <div className="mt-auto">
                                {card.value !== null && card.value > 0 ? (
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-bold text-foreground/80 group-hover:text-foreground transition-colors tracking-tight">
                                            {card.value}
                                        </p>
                                        <span className="text-[9px] font-medium text-foreground/70 italic tracking-tight mt-1">
                                            As of today
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest py-1">
                                            {card.empty}
                                        </p>
                                        <span className="text-[9px] font-medium text-foreground/70 italic tracking-tight mt-1">
                                            Synced moments ago
                                        </span>
                                    </div>
                                )}
                            </div>
                        </ReactiveCard>
                    );
                })}
            </div>

            {/* Institutional Pulse Row (Truth Pass) */}
            <InstitutionalPulseRow dashboardMetrics={dashboardMetrics} />
        </div>
    );
};
