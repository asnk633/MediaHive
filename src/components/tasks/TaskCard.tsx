import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Clock, CheckCircle2, AlertCircle, Circle, MoreHorizontal, Trash2, Edit2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useRole } from '@/app/(shell)/RoleContext';
import { TaskService } from '@/services/tasks';
import { useRouter } from 'next/navigation';

import { EditTaskModal } from './EditTaskModal';

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    const { user } = useRole();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const priorityColors = {
        high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800',
        medium: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
        low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
    };

    const statusIcons = {
        todo: <Circle size={16} className="text-gray-400" />,
        'in-progress': <Clock size={16} className="text-blue-500" />,
        review: <AlertCircle size={16} className="text-orange-500" />,
        done: <CheckCircle2 size={16} className="text-green-500" />,
    };

    // Permission Check
    const canManage = user?.role === 'admin' || (task.createdBy?.uid === user?.id);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this task?')) return;
        setIsLoading(true);
        await TaskService.deleteTask(task.id);
        setIsLoading(false);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        setIsEditing(true);
    };

    return (
        <div
            className={`bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${isLoading ? 'opacity-50' : ''}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>

                {canManage && (
                    <div className="relative">
                        <button
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-panel)] transition-colors"
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-subtle)] z-20 py-1 overflow-hidden">
                                    <button
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-panel)] flex items-center gap-2"
                                        onClick={handleEdit}
                                    >
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] mb-1 line-clamp-2">{task.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">{task.description}</p>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">
                <div className="flex items-center gap-2">
                    {statusIcons[task.status]}
                    <span className="capitalize">{task.status.replace('-', ' ')}</span>
                </div>

                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), 'MMM d') : 'No Date'}
                </div>
            </div>

            {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
                <div className="mt-3 flex justify-end">
                    <div className="flex -space-x-2 overflow-hidden">
                        {task.assignedTo.map((assignee, i) => (
                            <div
                                key={i}
                                className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-[var(--bg-card)]"
                                title={`Assigned to ${assignee.name}`}
                            >
                                {assignee.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <EditTaskModal
                task={task}
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
            />
        </div>
    );
};

// Lazy load or import at top? Import at top is safer for replacing file content.
// I will assume I need to add import at top in next step or use lazy dynamic import if safe.
// For now, I'll update imports.
