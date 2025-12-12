import React from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

const COLUMNS: { id: Task['status']; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
    return (
        <div className="flex overflow-x-auto pb-4 gap-6 h-full min-h-[calc(100vh-200px)]">
            {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);

                return (
                    <div key={col.id} className="min-w-[280px] w-full max-w-xs flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                {col.label}
                                <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                                    {colTasks.length}
                                </span>
                            </h3>
                        </div>

                        <div className="flex-1 bg-gray-50/50 rounded-2xl p-2 flex flex-col gap-3 border border-dashed border-gray-200/50">
                            {colTasks.map((task) => (
                                <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
                            ))}
                            {colTasks.length === 0 && (
                                <div className="h-24 flex items-center justify-center text-gray-300 text-sm italic">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
