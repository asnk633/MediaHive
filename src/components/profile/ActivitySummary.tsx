import React, { useEffect, useState } from 'react';
import { AuthUser } from '@/contexts/AuthContext';
import { CheckCircle2, Clock, Pin } from 'lucide-react';
import { db } from '@/firebase/client';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

interface ActivitySummaryProps {
    user: AuthUser | null;
}

export function ActivitySummary({ user }: ActivitySummaryProps) {
    const [stats, setStats] = useState({ requested: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    // Fetch basic stats (Tasks Requested vs Completed)
    // We do this client side for simplicity.
    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                // 1. Tasks Requested by User
                const tasksRef = collection(db, 'tasks');
                const qRequested = query(tasksRef, where('createdBy.uid', '==', user.uid));
                const snapRequested = await getCountFromServer(qRequested);

                // 2. Tasks Completed (Requested by user AND status done)
                const qCompleted = query(
                    tasksRef,
                    where('createdBy.uid', '==', user.uid),
                    where('status', '==', 'done')
                );
                const snapCompleted = await getCountFromServer(qCompleted);

                setStats({
                    requested: snapRequested.data().count,
                    completed: snapCompleted.data().count
                });
            } catch (error) {
                console.warn("Failed to fetch profile stats", error);
                // Allow fail silently, show 0
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-28 relative overflow-hidden group hover:bg-accent transition-colors">
                <div className="flex items-center gap-2 text-blue-400 mb-1 z-10">
                    <Pin size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide opacity-80">Tasks Requested</span>
                </div>
                <div className="text-3xl font-bold text-foreground z-10">
                    {loading ? "..." : stats.requested}
                </div>
                <div className="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                    <Pin size={80} />
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-28 relative overflow-hidden group hover:bg-accent transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 mb-1 z-10">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide opacity-80">Completed</span>
                </div>
                <div className="text-3xl font-bold text-foreground z-10">
                    {loading ? "..." : stats.completed}
                </div>
                <div className="absolute -right-4 -bottom-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                    <CheckCircle2 size={80} />
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-28 relative overflow-hidden group hover:bg-accent transition-colors">
                <div className="flex items-center gap-2 text-purple-400 mb-1 z-10">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide opacity-80">Last Active</span>
                </div>
                <div className="text-lg font-medium text-foreground z-10">
                    2 days ago
                </div>
                <div className="absolute -right-4 -bottom-4 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
                    <Clock size={80} />
                </div>
            </div>
        </div>
    );
}
