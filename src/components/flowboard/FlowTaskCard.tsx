import React from 'react';
import { Task } from '@/types/task';
import { SmartRulesEngine } from '@/services/smartRulesEngine';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, FileCheck, Ban, User as UserIcon } from 'lucide-react';
import { SafeAvatar } from '@/components/ui/SafeAvatar';

interface FlowTaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
}

export const FlowTaskCard: React.FC<FlowTaskCardProps> = ({ task, onClick }) => {
    const isBlocked = SmartRulesEngine.isTaskBlocked(task);
    const hasDeliverable = !!task.firstDeliverableAt;
    const stage = SmartRulesEngine.inferStage(task);

    // Get blocked reason
    const getBlockedReason = () => {
        if (stage === 'edit' || stage === 'review') {
            return 'Waiting for deliverable';
        }
        if (stage === 'publish') {
            return 'Pending approval';
        }
        return 'Blocked';
    };

    return (
        <div
            onClick={() => onClick(task)}
            className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${isBlocked
                    ? 'bg-white/5 border-white/10 opacity-60 hover:opacity-80'
                    : 'bg-[#1A1F2E]/80 border-white/10 hover:border-white/20 hover:bg-white/10'
                }
            `}
        >
            {/* Header: Blocked Badge */}
            {isBlocked && (
                <div
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded mb-2 w-fit"
                    title={getBlockedReason()}
                >
                    <Ban size={10} />
                    <span>BLOCKED</span>
                </div>
            )}

            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-tight mb-2">
                {task.title}
            </h4>

            {/* Footer: Assignee + Indicators */}
            <div className="flex items-center justify-between">
                {/* Assignee */}
                <div className="flex items-center gap-2">
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                        <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignedTo.slice(0, 2).map((assignee) => (
                                <div
                                    key={assignee.uid}
                                    title={assignee.name}
                                >
                                    <SafeAvatar
                                        src={assignee.avatarUrl || assignee.photoURL}
                                        alt={assignee.name}
                                        size={20}
                                        fallbackText={assignee.name}
                                        className="ring-2 ring-[#0B0E14] border-0"
                                    />
                                </div>
                            ))}
                            {task.assignedTo.length > 2 && (
                                <div className="w-5 h-5 rounded-full bg-gray-700 ring-2 ring-[#0B0E14] flex items-center justify-center text-[8px] font-bold text-gray-300">
                                    +{task.assignedTo.length - 2}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                            <UserIcon size={10} />
                        </div>
                    )}
                </div>

                {/* Right Side: Deliverable + Due Date */}
                <div className="flex items-center gap-2 text-[10px]">
                    {/* Deliverable Indicator */}
                    <div
                        className={`flex items-center gap-1 ${hasDeliverable ? 'text-green-400' : 'text-gray-500'}`}
                        title={hasDeliverable ? 'Deliverable attached' : 'No deliverable yet'}
                    >
                        <FileCheck size={12} />
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                        <span className="flex items-center gap-1 text-gray-500">
                            <Calendar size={10} />
                            {(() => {
                                try {
                                    const date = (task.dueDate as any).seconds
                                        ? new Date((task.dueDate as any).seconds * 1000)
                                        : new Date(task.dueDate);
                                    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
                                } catch {
                                    return '';
                                }
                            })()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
