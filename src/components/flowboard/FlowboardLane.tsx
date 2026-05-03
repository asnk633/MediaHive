import React from 'react';
import { Task, SmartMetadata } from '@/features/tasks/types/task';
import { FlowboardCard } from './FlowboardCard';

import { User as UserIcon } from 'lucide-react';

interface FlowboardLaneProps {
    title: string;
    stageId: string;
    tasks: { task: Task; smartData: SmartMetadata }[];
    onTaskClick: (task: Task) => void;
    color?: string;
    userCapacity?: Record<string, Record<string, number>>;
    userNames?: Record<string, string>;
}

export const FlowboardLane: React.FC<FlowboardLaneProps> = ({
    title, stageId, tasks, onTaskClick, color = 'blue',
    userCapacity = {}, userNames = {}
}) => {

    const borderColor = {
        blue: 'border-blue-500/30',
        purple: 'border-purple-500/30',
        green: 'border-green-500/30',
        emerald: 'border-emerald-500/30',
        orange: 'border-orange-500/30',
        fuchsia: 'border-fuchsia-500/30',
        gray: 'border-white/10'
    }[color] || 'border-white/10';

    const bgGradient = {
        blue: 'from-blue-500/5',
        purple: 'from-purple-500/5',
        green: 'from-green-500/5',
        emerald: 'from-emerald-500/5',
        orange: 'from-orange-500/5',
        fuchsia: 'from-fuchsia-500/5',
        gray: 'from-white/5'
    }[color] || 'from-white/5';

    // Calculate active users in this stage
    const activeUsers = Object.entries(userCapacity)
        .map(([uid, stages]) => ({
            uid,
            count: stages[stageId] || 0,
            name: userNames[uid] || 'Unknown'
        }))
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count);

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-[#0B0E14]/50 border-r border-white/5 first:pl-0 last:border-r-0 relative">
            {/* Top Glimmer */}
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${bgGradient} to-transparent pointer-events-none`} />

            {/* Header */}
            <div className={`p-4 border-b border-white/5 shrink-0 sticky top-0 bg-[#0B0E14]/95 backdrop-blur-md z-10 space-y-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{title}</h3>
                        <span className="text-xs font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{tasks.length}</span>
                    </div>
                </div>

                {/* Capacity Signals */}
                {activeUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {activeUsers.map(user => (
                            <div
                                key={user.uid}
                                title={`${user.name}: ${user.count} active tasks`}
                                className={`
                                    flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-full text-[9px] font-bold border
                                    ${user.count > 3
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-white/5 text-gray-400 border-white/10'}
                                `}
                            >
                                <div className="w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center">
                                    {user.name[0]?.toUpperCase() || 'U'}
                                </div>
                                <span>{user.count}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Accent Line */}
                <div className={`absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent`} />
            </div>

            {/* Tasks Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {tasks.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-white/5 rounded-xl">
                        <span className="text-xs text-gray-600 font-medium">No tasks</span>
                    </div>
                ) : (
                    tasks.map(({ task, smartData }) => (
                        <FlowboardCard
                            key={task.id}
                            task={task}
                            smartData={smartData}
                            onClick={onTaskClick}
                        />
                    ))
                )}
                {/* Spacer for bottom scrolling */}
                <div className="h-4" />
            </div>
        </div>
    );
};
