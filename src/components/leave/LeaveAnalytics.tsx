"use client";

import React from 'react';
import { 
    PieChart, 
    Pie, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    Cell, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { 
    TrendingUp, 
    Users, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    BarChart3,
    Activity,
    CalendarDays
} from 'lucide-react';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnalyticsData {
    summary: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        approvalRate: number;
        avgProcessingTime: number;
    };
    byType: { type: string; count: number }[];
    byMonth: { month: string; count: number }[];
    byDepartment: { department: string; count: number }[];
    upcoming: any[];
}

interface LeaveAnalyticsProps {
    data: AnalyticsData;
    teamBalances?: any[];
}

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f1117] border border-foreground/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                <p className="text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em] mb-2">{label}</p>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
                    <p className="text-sm font-bold text-foreground">{payload[0].value} Requests</p>
                </div>
            </div>
        );
    }
    return null;
};

export const LeaveAnalytics: React.FC<LeaveAnalyticsProps> = ({ data, teamBalances = [] }) => {
    if (!data) return null;
    const { summary, byType, byMonth, upcoming } = data;

    const formattedMonthData = byMonth.map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        count: item.count
    }));

    const formattedTypeData = byType.map(item => ({
        name: LEAVE_TYPE_LABELS[item.type as keyof typeof LEAVE_TYPE_LABELS] || item.type,
        value: item.count
    }));

    const kpis = [
        { label: 'Total Volume', value: summary.total, icon: Activity, color: 'text-foreground' },
        { label: 'Approval Rate', value: `${summary.approvalRate}%`, icon: TrendingUp, color: 'text-emerald-400' },
        { label: 'Response Time', value: `${summary.avgProcessingTime}h`, icon: Clock, color: 'text-blue-400' },
        { label: 'Open Issues', value: summary.pending, icon: AlertCircle, color: 'text-amber-400' },
    ];

    return (
        <div className="space-y-8">
            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-liquid border border-foreground/5 p-6 rounded-[28px] relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <kpi.icon size={48} />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <p className="text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">{kpi.label}</p>
                            <h3 className={cn("text-3xl font-black tracking-tighter", kpi.color)}>{kpi.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Leave by Month - Trend Chart */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass-liquid border border-foreground/10 rounded-[32px] p-8 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <BarChart3 size={16} className="text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest">Temporal Trends</h3>
                        </div>
                        <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">Last 12 Months</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formattedMonthData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#6366f1" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorCount)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Leave by Type - Distribution Chart */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-liquid border border-foreground/10 rounded-[32px] p-8 space-y-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Activity size={16} className="text-blue-400" />
                        </div>
                        <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest">Allocation Split</h3>
                    </div>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={formattedTypeData}
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {formattedTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {formattedTypeData.map((type, idx) => (
                            <div key={type.name} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <p className="text-[10px] font-bold text-foreground/80 truncate">{type.name}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Upcoming and Team Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-liquid border border-foreground/5 rounded-[32px] overflow-hidden">
                    <div className="p-6 border-b border-foreground/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CalendarDays size={18} className="text-indigo-400" />
                            <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest">Active Schedule</h3>
                        </div>
                        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Next 30 Days</span>
                    </div>
                    <div className="p-2">
                        {upcoming.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-sm text-foreground/80 font-medium">No active leave schedules in this window.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {upcoming.map((leave: any) => (
                                    <div key={leave.id} className="p-4 rounded-2xl hover:bg-foreground/[0.03] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/80 font-bold text-xs group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                                                {leave.requestedBy.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{leave.requestedBy.name}</p>
                                                <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">{leave.requestedBy.department}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-indigo-300">
                                                {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-[9px] font-black text-foreground/80 uppercase tracking-tighter">
                                                {leave.totalDays} Days • {LEAVE_TYPE_LABELS[leave.type as keyof typeof LEAVE_TYPE_LABELS]}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Saturation / Quick Summary */}
                <div className="glass-liquid border border-foreground/5 rounded-[32px] p-8 flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-foreground tracking-tighter">Workforce Saturation</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                            Currently <span className="text-indigo-400 font-bold">{summary.approved} members</span> are on leave. 
                            The team is operating at <span className="text-emerald-400 font-bold">94% capacity</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '94%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500" 
                            />
                        </div>
                        <span className="text-xs font-black text-foreground/80">94%</span>
                    </div>
                    <div className="flex items-center gap-6 pt-4 border-t border-foreground/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-foreground/10" />
                            <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">Scheduled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
