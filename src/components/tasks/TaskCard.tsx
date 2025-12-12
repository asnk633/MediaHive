import React from 'react';
import { Task } from '@/types/task';
import { Clock, CheckCircle2, AlertCircle, Circle, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    const priorityColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-orange-100 text-orange-700 border-orange-200',
        low: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const statusIcons = {
        todo: <Circle size={16} className="text-gray-400" />,
        'in-progress': <Clock size={16} className="text-blue-500" />,
        review: <AlertCircle size={16} className="text-orange-500" />,
        done: <CheckCircle2 size={16} className="text-green-500" />,
    };

    return (
        <div
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{task.description}</p>

            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
                <div className="flex items-center gap-2">
                    {statusIcons[task.status]}
                    <span className="capitalize">{task.status.replace('-', ' ')}</span>
                </div>

                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), 'MMM d') : 'No Date'}
                </div>
            </div>

            {task.assignedTo && (
                <div className="mt-3 flex justify-end">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold" title={`Assigned to ${task.assignedTo.name}`}>
                        {task.assignedTo.name.charAt(0)}
                    </div>
                </div>
            )}
        </div>
    );
};
