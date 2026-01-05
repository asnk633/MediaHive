import React from 'react';
import { Task } from '@/types/task';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';

interface UrgencyRiskWidgetProps {
    tasks: Task[];
}

export const UrgencyRiskWidget = ({ tasks }: UrgencyRiskWidgetProps) => {
    // Calculate Risks based on Smart Metadata Urgency Score
    // Score >= 100: Overdue / Critical
    // Score >= 40: Due in 24h
    // Score >= 25: Due in 48h

    let overdueCount = 0;
    let due24hCount = 0;
    let due48hCount = 0;

    tasks.forEach(task => { // Fix applied
        if (task.status === 'done') return;

        const score = task.smartMetadata?.urgencyScore || 0;

        if (score >= 100) overdueCount++;
        else if (score >= 40) due24hCount++;
        else if (score >= 25) due48hCount++;
    });

    const RiskCard = ({ label, count, icon: Icon, color, subtext }: any) => (
        <div className={`
            relative overflow-hidden rounded-2xl p-5 border transition-all duration-300
            ${color === 'red'
                ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
                : color === 'orange'
                    ? 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40'
                    : 'bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40'
            }
        `}>
            <div className={`absolute top-0 right-0 p-3 opacity-20`}>
                <Icon size={48} className={
                    color === 'red' ? 'text-red-500' : color === 'orange' ? 'text-orange-500' : 'text-yellow-500'
                } />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className={
                        color === 'red' ? 'text-red-400' : color === 'orange' ? 'text-orange-400' : 'text-yellow-400'
                    } />
                    <span className={`text-xs font-bold uppercase tracking-wider ${color === 'red' ? 'text-red-400' : color === 'orange' ? 'text-orange-400' : 'text-yellow-400'
                        }`}>
                        {label}
                    </span>
                </div>

                <h3 className="text-3xl font-display font-bold text-white tracking-tight">{count}</h3>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">{subtext}</p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <RiskCard
                label="Critical / Overdue"
                count={overdueCount}
                icon={AlertCircle}
                color="red"
                subtext="Immediate attention required"
            />
            <RiskCard
                label="Due in 24 Hours"
                count={due24hCount}
                icon={AlertTriangle}
                color="orange"
                subtext="Upcoming deadlines"
            />
            <RiskCard
                label="Due in 48 Hours"
                count={due48hCount}
                icon={Clock}
                color="yellow"
                subtext="Plan ahead"
            />
        </div>
    );
};
