import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CalendarDays, Activity } from 'lucide-react';
import { TaskStats } from '@/services/canonicalDataService';

interface GuestTaskOverviewWidgetProps {
    stats: TaskStats | null;
}

export function GuestTaskOverviewWidget({ stats }: GuestTaskOverviewWidgetProps) {
    // Safe default to 0 if stats are missing (loading or error)
    const inProgress = stats?.inProgress || 0;
    const dueToday = stats?.dueToday || 0;
    const next7Days = stats?.next7Days || 0;

    // Today's Workload = In Progress + Due Today
    const todaysWorkload = inProgress + dueToday;
    const next7DaysLoad = next7Days;

    // Department Status Logic
    const activeTasksCount = (stats?.inProgress || 0) + (stats?.pending || 0) + (stats?.review || 0);
    let statusText = "Normal Operations";
    let statusColor = "text-green-400 bg-green-500/10 border-green-500/20";

    if (activeTasksCount > 15) {
        statusText = "Critical Load";
        statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
    } else if (activeTasksCount > 5) {
        statusText = "High Volume";
        statusColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-700">

            {/* Card 1: Today's Workload */}
            <motion.div
                className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/5 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={48} className="text-blue-400" />
                </div>

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <BarChart3 size={20} />
                        </div>
                        <h3 className="text-gray-400 font-medium text-sm">Today&apos;s Workload at media office</h3>
                    </div>
                </div>

                {/* Department Status Pill */}
                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border mb-4 ${statusColor}`}>
                    {statusText}
                </div>

                <div>
                    <p className="text-3xl font-bold text-white tracking-tight">{todaysWorkload}</p>
                    <p className="text-sm text-gray-500 mt-1">In progress & due today</p>
                </div>
            </motion.div>

            {/* Card 2: Tasks Scheduled - Next 7 Days */}
            <motion.div
                className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/5 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CalendarDays size={48} className="text-violet-400" />
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                        <CalendarDays size={20} />
                    </div>
                    <h3 className="text-gray-400 font-medium text-sm">Tasks Scheduled</h3>
                </div>

                <div className="mt-4">
                    <p className="text-3xl font-bold text-white tracking-tight">{next7DaysLoad}</p>
                    <p className="text-sm text-gray-500 mt-1">Due next 7 days</p>
                </div>
            </motion.div>
        </div>
    );
}
