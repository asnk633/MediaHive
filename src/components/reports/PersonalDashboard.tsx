'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    TrendingUp,
    ListTodo,
    Activity
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { format } from 'date-fns';

interface DashboardData {
    stats: {
        pending: number;
        dueSoon: number;
        overdue: number;
        completionRate: number;
        totalAssigned: number;
    };
    chartData: { date: string; count: number }[];
    recentActivity: { id: number; title: string; completedAt: string }[];
}

export function PersonalDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await apiClient('/api/reports/personal');
                setData(res);
            } catch (error) {
                console.error("Failed to load personal dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!data) return <div className="text-center p-8 text-white/50">Failed to load dashboard data.</div>;

    const { stats, chartData, recentActivity } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">My Dashboard</h2>
                <p className="text-white/50 text-sm">Personal performance and workload overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Pending Tasks"
                    value={stats.pending}
                    icon={ListTodo}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <StatCard
                    label="Due Soon (48h)"
                    value={stats.dueSoon}
                    icon={Clock}
                    color="text-yellow-400"
                    bg="bg-yellow-500/10"
                    border="border-yellow-500/20"
                />
                <StatCard
                    label="Overdue"
                    value={stats.overdue}
                    icon={AlertTriangle}
                    color="text-red-400"
                    bg="bg-red-500/10"
                    border="border-red-500/20"
                    alert={stats.overdue > 0}
                />
                <StatCard
                    label="Completion Rate"
                    value={`${stats.completionRate}%`}
                    icon={TrendingUp}
                    color="text-green-400"
                    bg="bg-green-500/10"
                    border="border-green-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <Card className="lg:col-span-2 bg-[#0f172a] border-white/10">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Weekly Productivity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val) => format(new Date(val), 'EEE')}
                                        stroke="#ffffff30"
                                        tick={{ fill: '#ffffff50', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#4f46e5" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-[#0f172a] border-white/10">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            Recent Achievements
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {recentActivity.length === 0 ? (
                            <p className="text-white/30 text-center py-8 text-sm">No recently completed tasks.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.map((task) => (
                                    <div key={task.id} className="flex gap-3 items-start group">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)] group-hover:bg-green-400 transition-colors" />
                                        <div>
                                            <p className="text-sm text-white/90 font-medium line-clamp-1 group-hover:text-blue-200 transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-white/40 mt-1">
                                                Completed {format(new Date(task.completedAt), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg, border, alert }: any) {
    return (
        <Card className={`bg-white/5 backdrop-blur-sm border ${alert ? 'border-red-500/50 animate-pulse' : 'border-white/10'} hover:bg-white/10 transition-colors`}>
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${bg} ${border} border`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                    <p className="text-white/50 text-xs uppercase font-bold tracking-wider mb-1">{label}</p>
                    <p className={`text-2xl font-black ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
