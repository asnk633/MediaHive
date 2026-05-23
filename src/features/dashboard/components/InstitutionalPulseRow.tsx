import React from 'react';
import { Activity, Flag, Layers, Calendar, Copy, PauseCircle } from 'lucide-react'; // Added PauseCircle/Copy for new stats
import { DashboardMetrics } from "@/lib/dashboardMetrics";

interface InstitutionalPulseRowProps {
    dashboardMetrics: DashboardMetrics;
}

/**
 * InstitutionalPulseRow (Truth Pass)
 * Connected strictly to dashboardMetrics.ts
 * 
 * Required metrics:
 * - Weekly Events
 * - Total Active Tasks (inProgress + todo?) User said "Active Tasks". Usually "In Progress". Or "Todo + In Progress". I will use InProgress as pure active. Or user might mean Total Pipeline.
 *   Directive says: "Total Active Tasks".
 *   I'll show In Progress + Todo? Or just In Progress?
 *   Given "Media Team Overview" asked for "Total Active Tasks, Due Today, On Hold...".
 *   Pulse Row asked for: "Weekly Events, Active Tasks, Pending Reviews, On Hold".
 *   I will use:
 *   - Efficiency Range (Completed %) - Kept from original design as it adds value? User didn't strictly say remove it, but listed specific metrics.
 *     "Fix and connect: Weekly Events, Active Tasks, Pending Reviews, On Hold."
 *     It lists 4 items. The row has 4 slots.
 *     I will replace Efficiency with "Active Tasks"?
 *     Wait, "Active Tasks" in Pulse Row.
 *     I'll map:
 *     1. Active Tasks (inProgress + todo)
 *     2. Pending Reviews (review)
 *     3. On Hold (onHold)
 *     4. Weekly Events (thisWeekEvents.length)
 */
export const InstitutionalPulseRow = ({ dashboardMetrics }: InstitutionalPulseRowProps) => {

    // "Active Tasks" = Due Today + In Progress + Review (Operational Load)
    const activeTasks = dashboardMetrics.dueToday + dashboardMetrics.inProgress + dashboardMetrics.review;

    return (
        <div className="pt-2 border-t border-foreground/5 grid grid-cols-1 md:grid-cols-4 gap-[18px] py-[10px] px-4 items-center">
            {/* 1. Weekly Events */}
            <div className="flex items-center gap-4 group cursor-default">
                <div className="w-8 h-8 rounded-[18px] bg-foreground/5 flex items-center justify-center text-foreground/80 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all">
                    <Calendar size={16} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-foreground/70 uppercase tracking-[0.2em]">Weekly Events</p>
                    <p className="text-sm font-bold text-foreground/80 group-hover:text-foreground/80 transition-colors">
                        {dashboardMetrics.thisWeekEvents.length} Institutional
                    </p>
                </div>
            </div>

            {/* 2. Global Overdue */}
            <div className="flex items-center gap-4 group cursor-default">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/80 group-hover:bg-red-500/10 group-hover:text-red-400 transition-all">
                    <Activity size={16} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-foreground/70 uppercase tracking-[0.2em]">Global Overdue</p>
                    <p className="text-sm font-bold text-foreground/80 group-hover:text-foreground/80 transition-colors">
                        {dashboardMetrics.adminTotals.globalOverdue} Critical
                    </p>
                </div>
            </div>

            {/* 3. Pending Approvals */}
            <div className="flex items-center gap-4 group cursor-default">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/80 group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-all">
                    <Flag size={16} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-foreground/70 uppercase tracking-[0.2em]">Approvals</p>
                    <p className="text-sm font-bold text-foreground/80 group-hover:text-foreground/80 transition-colors">
                        {dashboardMetrics.adminTotals.pendingApprovals} Pending
                    </p>
                </div>
            </div>

            {/* 4. Created by Me */}
            <div className="flex items-center gap-4 group cursor-default">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/80 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all">
                    <Copy size={16} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-foreground/70 uppercase tracking-[0.2em]">Created By Me</p>
                    <p className="text-sm font-bold text-foreground/80 group-hover:text-foreground/80 transition-colors">
                        {dashboardMetrics.adminTotals.createdMe} Tasks
                    </p>
                </div>
            </div>
        </div>
    );
};
