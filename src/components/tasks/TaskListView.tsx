import React from 'react';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';

interface TaskListViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onTaskClick }) => {
    const priorityColors = {
        high: 'text-red-600 bg-red-50',
        medium: 'text-orange-600 bg-orange-50',
        low: 'text-blue-600 bg-blue-50',
    };

    const statusColors = {
        todo: 'bg-gray-100 text-gray-600',
        'in-progress': 'bg-blue-100 text-blue-600',
        review: 'bg-purple-100 text-purple-600',
        done: 'bg-green-100 text-green-600',
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-medium">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4 sr-only">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onTaskClick?.(task)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="max-w-xs truncate" title={task.title}>{task.title}</div>
                                    <div className="text-xs text-gray-400 max-w-xs truncate">{task.department}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[task.status]}`}>
                                        {task.status.replace('-', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), 'MMM d, yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {task.assignedTo ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {task.assignedTo.name.charAt(0)}
                                            </div>
                                            <span className="truncate max-w-[100px]">{task.assignedTo.name}</span>
                                        </span>
                                    ) : <span className="text-gray-300 italic">Unassigned</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tasks.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic">No tasks found</div>
                )}
            </div>
        </div>
    );
};
