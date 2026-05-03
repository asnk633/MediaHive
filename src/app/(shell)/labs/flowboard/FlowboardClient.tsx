'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/features/tasks/types/task';
import { FlowboardLane } from '@/components/flowboard/FlowboardLane';
import { Loader2, Kanban, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CanonicalDataService } from '@/services/canonicalDataService';

export default function FlowboardClient() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const stages = [
        { id: 'todo', title: 'To Do', color: 'blue' },
        { id: 'in_progress', title: 'In Progress', color: 'orange' },
        { id: 'pending', title: 'Pending', color: 'fuchsia' },
        { id: 'completed', title: 'Completed', color: 'green' }
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // Direct Supabase fetch via CanonicalDataService
            const data = await CanonicalDataService.getTasks();
            setTasks((data || []) as any as Task[]);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface border border-soft p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Kanban size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Visual Workflow</h2>
                        <p className="text-xs text-muted">Manage tasks across pipeline stages</p>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                    <input
                        type="text"
                        placeholder="Search board..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/5 border border-soft rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-white/10">
                <div className="flex h-full min-h-[600px] gap-4">
                    {stages.map(stage => (
                        <FlowboardLane
                            key={stage.id}
                            title={stage.title}
                            stageId={stage.id}
                            color={stage.color as any}
                            tasks={filteredTasks
                                .filter(t => t.status === stage.id)
                                .map(t => ({
                                    task: t,
                                    smartData: {
                                        inferredStage: 'general' as const,
                                        isStale: false,
                                        daysInStatus: 0,
                                        urgencyScore: t.priority === 'urgent' ? 100 : 0,
                                        normalizedProvenance: 'System',
                                        needsAttention: false,
                                        isBlocked: false,
                                        isOverdue: false
                                    }
                                }))
                            }
                            onTaskClick={(task) => {
                                // Redirection or modal
                                console.log('Task clicked:', task.id);
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
