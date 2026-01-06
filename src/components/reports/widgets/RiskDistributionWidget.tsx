import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RiskDistributionProps {
    riskCount: number;
    safeCount: number;
}

export const RiskDistributionWidget: React.FC<RiskDistributionProps> = ({ riskCount, safeCount }) => {
    const total = riskCount + safeCount;
    const riskPercent = total > 0 ? (riskCount / total) * 100 : 0;

    return (
        <Card className="bg-slate-900/30 border-[#ffffff1a] h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Workforce Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <span className="text-3xl font-bold text-white">{riskCount}</span>
                        <span className="text-sm text-slate-500 ml-2">At Risk</span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-300">{safeCount}</span>
                        <span className="text-sm text-slate-500 ml-2">Performing</span>
                    </div>
                </div>

                {/* Custom Bar Chart (CSS-only for lightness) */}
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    {/* Safe Segment */}
                    <div
                        className="h-full bg-emerald-500/80 transition-all duration-1000"
                        style={{ width: `${100 - riskPercent}%` }}
                    />
                    {/* Risk Segment */}
                    <div
                        className="h-full bg-red-500/80 transition-all duration-1000"
                        style={{ width: `${riskPercent}%` }}
                    />
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Stable</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Critical Intervention</span>
                </div>
            </CardContent>
        </Card>
    );
};
