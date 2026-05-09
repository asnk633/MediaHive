'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import { TaskService } from '@/services/tasks';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    created_by_id: string;
    created_at: { seconds: number; nanoseconds: number } | string;
    completed_at?: { seconds: number; nanoseconds: number } | string | null;
}

interface TaskSubtasksProps {
    taskId: string;
    subtasks: Subtask[];
    onUpdate: () => void;
}

export function TaskSubtasks({ taskId, subtasks, onUpdate }: TaskSubtasksProps) {
    const { user } = useAuth();
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [adding, setAdding] = useState(false);
    const [showInput, setShowInput] = useState(false);

    const completedCount = subtasks.filter((st) => st.completed).length;
    const totalCount = subtasks.length;

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        setAdding(true);
        try {
            const newSubtask = {
                id: Date.now().toString(),
                title: newSubtaskTitle,
                completed: false,
                created_by_id: user?.uid || 'unknown',
                created_at: new Date().toISOString()
            };

            const taskData = await TaskService.getTaskById(taskId);
            const currentSubtasks = taskData?.subtasks || [];
            
            await TaskService.updateTask(taskId, {
                subtasks: [...currentSubtasks, newSubtask]
            });

            setNewSubtaskTitle('');
            setShowInput(false);
            onUpdate();
            toast.success('Subtask added');
        } catch (error) {
            console.error('Failed to add subtask:', error);
            toast.error('Failed to add subtask');
        } finally {
            setAdding(false);
        }
    };

    const handleToggleComplete = async (subtaskId: string, currentStatus: boolean) => {
        try {
            const taskData = await TaskService.getTaskById(taskId);
            const currentSubtasks = taskData?.subtasks || [];
 
            const updatedSubtasks = currentSubtasks.map((st: any) =>
                st.id === subtaskId ? { ...st, completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null } : st
            );
 
            await TaskService.updateTask(taskId, {
                subtasks: updatedSubtasks
            });

            onUpdate();
        } catch (error) {
            console.error('Failed to toggle subtask:', error);
            toast.error('Failed to update subtask');
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        if (!confirm('Delete this subtask?')) return;

        try {
            const taskData = await TaskService.getTaskById(taskId);
            const currentSubtasks = taskData?.subtasks || [];
            const remainingSubtasks = currentSubtasks.filter((st: any) => st.id !== subtaskId);
 
            await TaskService.updateTask(taskId, {
                subtasks: remainingSubtasks
            });

            onUpdate();
            toast.success('Subtask deleted');
        } catch (error) {
            console.error('Failed to delete subtask:', error);
            toast.error('Failed to delete subtask');
        }
    };

    const canEdit = user?.role === 'admin' || (user?.role === 'manager' || user?.role === 'member');

    return (
        <div className="space-y-4">
            {/* Header with Progress */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Subtasks
                    </h3>
                </div>
                {totalCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {completedCount}/{totalCount} completed
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                </div>
            )}

            {/* Subtask List */}
            <div className="space-y-2">
                {subtasks.length === 0 && !showInput && (
                    <p className="text-sm text-muted-foreground/60 italic">No subtasks yet.</p>
                )}
                {subtasks.map((subtask) => (
                    <div
                        key={subtask.id}
                        className="flex items-center gap-3 p-3 bg-surface/40 rounded-lg border border-soft group hover:bg-surface/60 transition-colors"
                    >
                        <button
                            onClick={() => handleToggleComplete(subtask.id, subtask.completed)}
                            className="shrink-0 transition-transform hover:scale-110"
                        >
                            {subtask.completed ? (
                                <CheckCircle2 size={20} className="text-primary" />
                            ) : (
                                <Circle size={20} className="text-muted-foreground" />
                            )}
                        </button>
                        <span
                            className={`flex-1 text-sm ${subtask.completed
                                ? 'text-muted-foreground line-through'
                                : 'text-foreground'
                                }`}
                        >
                            {subtask.title}
                        </span>
                        {canEdit && (
                            <button
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Subtask Input */}
            {showInput && canEdit && (
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Subtask title..."
                        className="flex-1 px-3 py-2 bg-surface border border-soft rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                        disabled={adding}
                    />
                    <button
                        type="submit"
                        disabled={!newSubtaskTitle.trim() || adding}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {adding ? 'Adding...' : 'Add'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowInput(false);
                            setNewSubtaskTitle('');
                        }}
                        className="px-4 py-2 bg-surface border border-soft text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                </form>
            )}

            {/* Add Button */}
            {!showInput && canEdit && (
                <button
                    onClick={() => setShowInput(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <Plus size={16} />
                    Add Subtask
                </button>
            )}
        </div>
    );
}
