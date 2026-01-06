"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceHistoryItem {
    period: string;
    ips: number;
    ipsScore: number;
    status: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgDailyHours: number;
}

interface PerformanceChartProps {
    data: PerformanceHistoryItem[];
}

// Custom Dot Component - Color-coded by IPS
function CustomDot(props: any) {
    const { cx, cy, payload } = props;
    const ips = payload.ipsScore;

    let fill = '#22c55e'; // Green (Performing)
    if (ips < 60) fill = '#ef4444'; // Red (Underperforming)
    else if (ips < 80) fill = '#eab308'; // Yellow (At Risk)

    return (
        <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={fill}
            stroke="#1e293b" // Match bg color for cleaner look
            strokeWidth={3}
            className="filter drop-shadow-md"
        />
    );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;

    return (
        <div className="bg-[#1a2639]/95 border border-[#ffffff1a] rounded-xl p-4 shadow-xl backdrop-blur-md">
            <p className="text-white font-bold mb-2 uppercase tracking-wider text-xs border-b border-[#ffffff1a] pb-2">{data.period}</p>
            <div className="space-y-2">
                <div className="flex justify-between items-center gap-8">
                    <span className="text-gray-400 text-xs">IPS Score</span>
                    <span className={`text-sm font-bold ${data.ipsScore >= 80 ? 'text-green-400' :
                            data.ipsScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{data.ipsScore}</span>
                </div>
                <div className="flex justify-between items-center gap-8">
                    <span className="text-gray-400 text-xs">Tasks Completed</span>
                    <span className="text-sm font-semibold text-white">{data.completedTasks}<span className="text-white/40">/{data.assignedTasks}</span></span>
                </div>
                {data.overdueTasks > 0 && (
                    <div className="flex justify-between items-center gap-8">
                        <span className="text-red-400/80 text-xs">Overdue</span>
                        <span className="text-sm font-bold text-red-400">{data.overdueTasks}</span>
                    </div>
                )}
                <div className="flex justify-between items-center gap-8 pt-2 border-t border-white/5 mt-1">
                    <span className="text-gray-400 text-xs">Avg Hours/Day</span>
                    <span className="text-sm font-mono text-blue-300">{data.avgDailyHours.toFixed(1)}h</span>
                </div>
            </div>
        </div>
    );
}

export function PerformanceChart({ data }: PerformanceChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="period"
                    stroke="rgba(255,255,255,0.1)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    className="font-mono"
                    dy={10}
                />
                <YAxis
                    domain={[0, 100]}
                    stroke="rgba(255,255,255,0.1)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Line
                    type="monotone"
                    dataKey="ipsScore"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={<CustomDot />}
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1500}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
