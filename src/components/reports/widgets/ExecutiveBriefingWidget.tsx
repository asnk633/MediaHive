import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ExecutiveBriefingProps {
    points: string[];
    loading?: boolean;
}

export const ExecutiveBriefingWidget: React.FC<ExecutiveBriefingProps> = ({ points, loading }) => {
    return (
        <Card className="bg-slate-900/30 border-[#ffffff1a] h-full">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Sparkles size={16} className="text-blue-400" />
                </div>
                <CardTitle className="text-lg font-medium text-foreground">Executive Briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-4 bg-slate-800 rounded w-1/2" />
                        <div className="h-4 bg-slate-800 rounded w-5/6" />
                    </div>
                ) : (
                    points.map((point, idx) => (
                        <div key={idx} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-foreground/5 transition-colors border border-transparent hover:border-foreground/5">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {point}
                            </p>
                            <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
};
