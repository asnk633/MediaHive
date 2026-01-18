import React, { useMemo } from 'react';
import { Task, SmartMetadata } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, User as UserIcon, AlertTriangle, Clock, Ban } from 'lucide-react';

interface FlowboardCardProps {
    task: Task;
    smartData: SmartMetadata;
    onClick: (task: Task) => void;
}

export const FlowboardCard: React.FC<FlowboardCardProps> = ({ task, smartData, onClick }) => {

    // Status color mapping
    const statusColor = useMemo(() => {
        switch (task.status) {
            case 'done': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'review': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'todo': return 'bg-white/10 text-gray-400 border-[#ffffff1a]';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    }, [task.status]);

    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(task);
            }}
            className={`
                group relative p-3 rounded-xl border border-white/5 bg-[#1A1F2E]/80 backdrop-blur-sm 
                hover:bg-white/10 hover:border-[#ffffff1a] transition-all cursor-pointer shadow-sm hover:shadow-md
                ${smartData.needsAttention ? 'ring-1 ring-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' : ''}
                ${smartData.isBlocked ? 'ring-1 ring-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]' : ''}
                ${smartData.inferredStage === 'publish' && task.status === 'done' ? 'opacity-60 grayscale-[0.5]' : ''}
            `}
        >
            {/* Header: Status + Urgency + Blocked */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusColor}`}>
                        {task.status.replace('_', ' ')}
                    </span>

                    {smartData.isBlocked && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="Blocked: Missing Requirements">
                            <Ban size={10} />
                            <span>BLOCKED</span>
                        </div>
                    )}
                </div>

                {smartData.urgencyScore > 50 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400" title="High Urgency">
                        <AlertTriangle size={12} />
                        <span>{smartData.urgencyScore}</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors mb-3">
                {task.title}
            </h4>

            {/* Footer: Assignee + Date + Staleness */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                {/* Assignee */}
                <div className="flex items-center gap-2">
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                        <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignedTo.slice(0, 3).map((assignee) => (
                                <div key={assignee.uid}
                                    className="w-5 h-5 rounded-full bg-blue-900 ring-2 ring-[#13161c] flex items-center justify-center text-[8px] font-bold text-blue-200"
                                    title={assignee.name}
                                >
                                    {assignee.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                            ))}
                            {task.assignedTo.length > 3 && (
                                <div className="w-5 h-5 rounded-full bg-gray-700 ring-2 ring-[#13161c] flex items-center justify-center text-[8px] font-bold text-gray-300">
                                    +{task.assignedTo.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                            <UserIcon size={10} />
                        </div>
                    )}
                </div>

                {/* Date / Staleness */}
                <div className="flex items-center gap-2 text-[10px]">
                    {smartData.isStale && (
                        <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <Clock size={10} />
                            {smartData.daysInStatus}d
                        </span>
                    )}

                    {task.dueDate && (
                        <span className={`flex items-center gap-1 ${smartData.urgencyScore > 80 ? 'text-red-400' : 'text-gray-500'}`}>
                            <Calendar size={10} />
                            {(() => {
                                try {
                                    const date = (task.dueDate as any).seconds
                                        ? new Date((task.dueDate as any).seconds * 1000)
                                        : new Date(task.dueDate);
                                    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
                                } catch { return ''; }
                            })()}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover visual cue */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};
