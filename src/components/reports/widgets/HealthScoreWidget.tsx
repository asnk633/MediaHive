import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HealthScoreWidgetProps {
    score: number;
    trend?: 'up' | 'down' | 'stable';
    className?: string;
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({ score, trend, className }) => {
    // Determine color based on score
    const getColor = (s: number) => {
        if (s >= 80) return 'text-emerald-500 stroke-emerald-500';
        if (s >= 60) return 'text-amber-500 stroke-amber-500';
        return 'text-red-500 stroke-red-500';
    };

    const colorClass = getColor(score);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <Card className={cn("bg-slate-900/30 border-[#ffffff1a] relative overflow-hidden", className)}>
            <CardContent className="p-6 flex items-center justify-center relative z-10">
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            className="text-slate-800"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-out", colorClass)}
                        />
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={cn("text-4xl font-bold tracking-tighter", colorClass.split(' ')[0])}>
                            {score}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Health Score</span>
                    </div>
                </div>

                {/* Decorative visual in background */}
                <div className={cn("absolute inset-0 opacity-10 blur-3xl rounded-full", colorClass.replace('text-', 'bg-'))} />
            </CardContent>
        </Card>
    );
};
