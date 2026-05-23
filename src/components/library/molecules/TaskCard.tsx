import React from 'react';
import { Clock, CheckSquare } from 'lucide-react';

/* NOTE: For full swipe functionality, wrap with Framer Motion as detailed in the Interaction Spec. */
/* This is the static/desktop representation. */

interface TaskCardProps {
    title: string;
    time: string;
    priority?: 'high' | 'medium' | 'low';
    completed?: boolean;
    onToggle?: () => void;
}

export const TaskCard = ({ title, time, priority = 'medium', completed, onToggle }: TaskCardProps) => {
    const priorityColors = {
        high: 'bg-red-500',
        medium: 'bg-orange-500',
        low: 'bg-blue-500'
    };

    return (
        <div className="group relative bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer">

            {/* Priority Strip */}
            <div className={`w-1 self-stretch rounded-full ${priorityColors[priority]} my-1`} />

            {/* Checkbox */}
            <button
                onClick={onToggle}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completed ? 'bg-blue-500 border-blue-500 text-foreground' : 'border-gray-300 hover:border-blue-400'}`}
            >
                {completed && <CheckSquare size={14} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-[var(--color-text-primary)] truncate ${completed ? 'line-through text-gray-400' : ''}`}>
                    {title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mt-0.5">
                    <Clock size={12} />
                    {time}
                </div>
            </div>
        </div>
    );
};
