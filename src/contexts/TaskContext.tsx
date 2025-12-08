'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/firebase/client';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export type Task = {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'working' | 'completed';
    dueDate?: string;
    createdBy: string;
    createdAt: any;
};

type TaskContextValue = {
    tasks: Task[];
    loading: boolean;
    createTask: (data: Partial<Task>) => Promise<void>;
    updateTask: (id: string, data: Partial<Task>) => Promise<void>;
};

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const items: Task[] = [];
            snap.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as Task);
            });
            setTasks(items);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const createTask = async (data: Partial<Task>) => {
        if (!user) return;
        await addDoc(collection(db, 'tasks'), {
            ...data,
            status: 'pending',
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
        });
    };

    const updateTask = async (id: string, data: Partial<Task>) => {
        await updateDoc(doc(db, 'tasks', id), data);
    };

    return (
        <TaskContext.Provider value={{ tasks, loading, createTask, updateTask }}>
            {children}
        </TaskContext.Provider>
    );
};

export function useTasks() {
    const ctx = useContext(TaskContext);
    if (!ctx) throw new Error('useTasks must be used within TaskProvider');
    return ctx;
}
