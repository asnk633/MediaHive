'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContextProvider';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/types/task';

type TaskContextValue = {
    tasks: Task[];
    loading: boolean;
    networkError: boolean;
    createTask: (data: Partial<Task>) => Promise<void>;
    updateTask: (id: string, data: Partial<Task>) => Promise<void>;
};

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [networkError, setNetworkError] = useState(false);
    const { user } = useAuth();

    // Poll for tasks every 30 seconds
    useEffect(() => {
        if (!user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        let pollInterval: NodeJS.Timeout | null = null;
        let isCancelled = false;

        const pollTasks = async () => {
            if (isCancelled) return;

            try {
                try {
                    // Determine user institution for filtering
                    // Use a proper filter to only show tasks relevant to user
                    let query = supabase.from('tasks').select('*');

                    if (user.institution_id) {
                        query = query.eq('institution_id', user.institution_id);
                    }

                    const { data, error } = await query;

                    if (error) throw error;

                    // Sort tasks by created_at in descending order
                    const sortedTasks = (data || []).sort((a: Task, b: Task) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                    });

                    setTasks(sortedTasks);
                    setNetworkError(false);
                } catch (error) {
                    console.warn('Task polling failed:', error);
                    setNetworkError(true);
                }
            } catch (error) {
                console.error('Critical task fetch error', error);
            }

            if (!isCancelled) {
                pollInterval = setTimeout(pollTasks, 30000); // Poll every 30 seconds
            }
        };

        // Initial load
        pollTasks().then(() => {
            setLoading(false);
        });

        return () => {
            isCancelled = true;
            if (pollInterval) {
                clearTimeout(pollInterval);
            }
        };
    }, [user]);

    const createTask = async (data: Partial<Task>) => {
        if (!user) return;

        try {
            const newTask = {
                ...data,
                status: 'pending',
                created_by: user.uid,
                institution_id: user.institution_id || null
            };

            const { error } = await supabase.from('tasks').insert(newTask);
            if (error) throw error;
        } catch (error: any) {
            console.error('Error creating task:', error);
            // Handle network-specific errors
            if (error.message && (error.message.includes('network') || error.message.includes('Network') || error.message.includes('offline'))) {
                throw new Error('Failed to create task due to network connectivity issues. Please check your internet connection and try again.');
            } else {
                throw new Error('Failed to create task. Please try again.');
            }
        }
    };

    const updateTask = async (id: string, data: Partial<Task>) => {
        try {
            const { error } = await supabase.from('tasks').update(data).eq('id', id);
            if (error) throw error;
        } catch (error: any) {
            console.error('Error updating task:', error);
            // Handle network-specific errors
            if (error.message && (error.message.includes('network') || error.message.includes('Network') || error.message.includes('offline'))) {
                throw new Error('Failed to update task due to network connectivity issues. Please check your internet connection and try again.');
            } else {
                throw new Error('Failed to update task. Please try again.');
            }
        }
    };

    return (
        <TaskContext.Provider value={{ tasks, loading, networkError, createTask, updateTask }}>
            {children}
        </TaskContext.Provider>
    );
};

export function useTasks() {
    const ctx = useContext(TaskContext);
    if (!ctx) throw new Error('useTasks must be used within TaskProvider');
    return ctx;
}
