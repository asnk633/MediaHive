import React from 'react';
import { Task } from '@/features/tasks/types/task';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

interface TasksFromMeWidgetProps {
    tasks: Task[];
    userId: string;
    title?: string;
}

export const TasksFromMeWidget = ({ tasks, userId, title = "Tasks from Me" }: TasksFromMeWidgetProps) => {
    const router = useRouter();

    // Filter: Created by me (or assigned by me legacy)
    const myTasks = tasks.filter(task => {
        const creatorUid = typeof task.created_by === 'string' ? task.created_by : task.created_by?.uid;
        if (creatorUid && creatorUid === userId) return true;
        if (task.assigned_by?.uid === userId) return true;
        return false;
    }).slice(0, 5); // Limit to 5

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done':
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-glass text-foreground/60 shadow-sm';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getTaskHint = (task: Task) => {
        if (task.status === 'review') return "Waiting for review";
        if (task.status === 'in_progress' && Array.isArray(task.assigned_to) && task.assigned_to.length > 0) {
            const assigneeName = typeof task.assigned_to[0] === 'string' ? 'team' : task.assigned_to[0].name.split(' ')[0];
            return `In progress by ${assigneeName}`;
        }
        if (task.status === 'todo' && (!task.assigned_to || task.assigned_to.length === 0)) return "Pending assignment";
        return null;
    };

    if (myTasks.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-widest ml-1">
                        {title}
                    </h3>
                </div>
                <div className="p-6 bg-surface backdrop-blur-md rounded-2xl shadow-sm text-center">
                    <p className="text-foreground/60 text-sm">No active requests found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-widest ml-1">
                    {title}
                </h3>
                <button
                    onClick={() => nativeNavigate('/tasks', router, 'TasksFromMeWidget (See All)')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                    See All
                </button>
            </div>

            <div className="space-y-3">
                {myTasks.map(task => {
                    const isDone = task.status === 'done';
                    return (
                        <div key={task.id} className={`group flex items-center justify-between p-4 bg-surface backdrop-blur-md rounded-2xl shadow-sm hover:bg-surface/80 hover:shadow-md transition-all duration-300 ${isDone ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex-1 min-w-0 mr-4">
                                <p className={`text-sm font-semibold truncate ${isDone ? 'text-foreground/50 line-through' : 'text-foreground group-hover:text-foreground'}`}>
                                    {task.title}
                                </p>
                                {getTaskHint(task) && !isDone && (
                                    <p className="text-xs text-blue-300/60 mt-0.5 truncate">{getTaskHint(task)}</p>
                                )}
                                <div className="mt-1.5 flex items-center gap-2">
                                    {task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0 ? (
                                        <div className="flex -space-x-1.5 overflow-hidden">
                                            {task.assigned_to.slice(0, 3).map((u, i) => {
                                                const name = typeof u === 'string' ? "User" : (u.name || "User");
                                                const initial = name.charAt(0).toUpperCase();
                                                return (
                                                    <div key={i} className="h-5 w-5 rounded-full bg-slate-700 border border-[#1a1a1a] flex items-center justify-center text-[9px] font-bold text-foreground" title={name}>
                                                        {initial}
                                                    </div>
                                                );
                                            })}
                                            {task.assigned_to.length > 3 && (
                                                <div className="h-5 w-5 rounded-full bg-slate-800 border border-[#1a1a1a] flex items-center justify-center text-[8px] text-foreground/60">
                                                    +{task.assigned_to.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-foreground/40 italic">Unassigned</span>
                                    )}
                                </div>
                            </div>

                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm ${getStatusColor(task.status)}`}>
                                {formatStatus(task.status)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
