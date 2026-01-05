// src/components/TaskList.tsx
'use client';
import React from 'react';
import { useTasks } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';

export default function TaskList({ tasks }: { tasks: any[] }) {
    const { updateTask } = useTasks();
    const { user } = useAuth();

    async function toggleComplete(task: any) {
        await updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    }

    if (!tasks.length) return <div className="text-muted">No tasks</div>;

    return (
        <div className="grid gap-3">
            {tasks.map(t => (
                <div key={t.id} className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                        <div className="text-lg font-medium">{t.title}</div>
                        <div className="text-sm text-gray-600">{t.description}</div>
                        <div className="text-xs mt-2 text-gray-500">Priority: {t.priority} • Status: {t.status}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn" onClick={() => toggleComplete(t)}>
                            {t.status === 'done' ? 'Reopen' : 'Complete'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
