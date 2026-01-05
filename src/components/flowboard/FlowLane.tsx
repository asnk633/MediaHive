import React from 'react';
import { Task } from '@/types/task';
import { FlowTaskCard } from './FlowTaskCard';

interface FlowLaneProps {
    title: string;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    color: 'orange' | 'blue' | 'purple' | 'emerald';
}

export const FlowLane: React.FC<FlowLaneProps> = ({ title, tasks, onTaskClick, color }) => {
    const colorMap = {
        orange: 'border-orange-500/30 bg-orange-500/5',
        blue: 'border-blue-500/30 bg-blue-500/5',
        purple: 'border-purple-500/30 bg-purple-500/5',
        emerald: 'border-emerald-500/30 bg-emerald-500/5',
    };

    const headerColorMap = {
        orange: 'text-orange-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        emerald: 'text-emerald-400',
    };

    return (
        <div className="flex-shrink-0 w-72 flex flex-col h-full">
            {/* Lane Header */}
            <div className={`border-b-2 ${colorMap[color]} px-4 py-3 flex items-center justify-between`}>
                <h3 className={`font-bold text-sm uppercase tracking-wider ${headerColorMap[color]}`}>
                    {title}
                </h3>
                <span className="text-xs text-gray-500 font-semibold">
                    {tasks.length}
                </span>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0B0E14]">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <FlowTaskCard
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                        <p>No tasks in this stage</p>
                    </div>
                )}
            </div>
        </div>
    );
};
