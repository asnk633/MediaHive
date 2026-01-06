"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    ShieldAlert,
    BrainCircuit
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadershipSummaryData {
    period: string;
    departmentHealth: {
        score: number;
        label: 'Healthy' | 'Strained' | 'Critical';
        trend: 'up' | 'down' | 'stable';
        stats: {
            avgCompletionRate: number;
        };
    };
    riskDistribution: {
        performing: number;
        atRisk: number;
        underperforming: number;
        total: number;
    };
    interventions: {
        count: number;
    };
    narrative: string[];
    automationPreview: {
        enabled: boolean;
        hypotheticalTriggers: {
            sustainedUnderperformance: number;
        };
        message: string;
    };
}

export function LeadershipSummaryPanel() {
    const [data, setData] = useState<LeadershipSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient('/api/admin/leadership/summary');
                setData(res);
            } catch (err) {
                console.error('Failed to fetch leadership summary:', err);
                setError('Failed to load executive briefing.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (error) return null; // Fail silently or show error? Admin UI usually handles errors gracefully.

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-48 rounded-2xl bg-white/5 col-span-2" />
                <Skeleton className="h-48 rounded-2xl bg-white/5" />
            </div>
        );
    }

    if (!data) return null;

    const { departmentHealth, riskDistribution, narrative, automationPreview } = data;

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp size={16} className="text-emerald-400" />;
            case 'down': return <TrendingDown size={16} className="text-red-400" />;
            default: return <Minus size={16} className="text-gray-400" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. Executive Narrative (Left - Wide) */}
                <div className="col-span-12 md:col-span-7 lg:col-span-8 bg-[#0f172a] border border-[#ffffff1a] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BrainCircuit size={120} className="text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <Activity size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-wide">Executive Briefing</h2>
                        </div>

                        <div className="space-y-3">
                            {narrative.map((text, idx) => (
                                <div key={idx} className="flex gap-3 text-sm text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                                    <div className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                                    {text}
                                </div>
                            ))}
                        </div>

                        {/* Quick Stats Row */}
                        <div className="mt-6 flex flex-wrap gap-4">
                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Interventions</span>
                                <div className="text-xl font-mono font-bold text-white mt-1">
                                    {data.interventions.count} <span className="text-xs text-gray-600 font-sans font-normal">this period</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Health & Risk (Right - Compact) */}
                <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col gap-6">

                    {/* Health Score */}
                    <div className="flex-1 bg-[#0f172a] border border-[#ffffff1a] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Department Health</h3>
                                <div className={cn("text-4xl font-bold mt-2 font-mono tracking-tighter shadow-glow", getScoreColor(departmentHealth.score))}>
                                    {departmentHealth.score}
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs font-medium text-white/80 border border-[#ffffff1a]">
                                    {getTrendIcon(departmentHealth.trend)}
                                    <span className="uppercase">{departmentHealth.trend}</span>
                                </div>
                                <span className={cn("text-xs font-bold mt-2", getScoreColor(departmentHealth.score))}>
                                    {departmentHealth.label.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Risk Bar */}
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Workforce Risk Distribution</h4>

                            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                                <div style={{ width: `${(riskDistribution.performing / riskDistribution.total) * 100}%` }} className="bg-emerald-500/80 hover:bg-emerald-400 transition-colors" title={`Performing: ${riskDistribution.performing}`} />
                                <div style={{ width: `${(riskDistribution.atRisk / riskDistribution.total) * 100}%` }} className="bg-yellow-500/80 hover:bg-yellow-400 transition-colors" title={`At Risk: ${riskDistribution.atRisk}`} />
                                <div style={{ width: `${(riskDistribution.underperforming / riskDistribution.total) * 100}%` }} className="bg-red-500/80 hover:bg-red-400 transition-colors" title={`Underperforming: ${riskDistribution.underperforming}`} />
                            </div>

                            <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" />PERFORMING ({riskDistribution.performing})</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />CRITICAL ({riskDistribution.underperforming})</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Automation Readiness (Preview) */}
            <div className="bg-[#0f172a] border border-[#ffffff1a] rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50" />

                <div className="shrink-0 flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                        <ShieldAlert className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            Automation Readiness
                            <span className="px-1.5 py-0.5 rounded bg-gray-700 text-[10px] text-gray-300 border border-gray-600">DISABLED</span>
                        </h3>
                        <p className="text-xs text-amber-500/80 mt-1 font-medium">Preview Mode Only — No Actions Taken</p>
                    </div>
                </div>

                <div className="hidden md:block w-px h-10 bg-white/10" />

                <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Hypothetical Triggers</div>
                        <div className="text-white text-sm font-medium mt-0.5">
                            <span className="text-amber-400 font-bold">{automationPreview.hypotheticalTriggers.sustainedUnderperformance}</span> Sustained Underperf.
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-500 italic max-w-xs md:text-right border-l md:border-l-0 md:border-r border-[#ffffff1a] pl-4 md:pr-4 md:pl-0">
                    "{automationPreview.message}"
                </div>
            </div>
        </div>
    );
}
