import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { SafeAvatar } from '@/components/ui/SafeAvatar';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { MediaTask as Task } from '@/services/tasks/taskContract';
import { format } from 'date-fns';

export function GuestProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch tasks where this user is the CREATOR
                const data = await CanonicalDataService.getTasks({
                    createdBy: user.uid,
                });
                setTasks(data);
            } catch (err) {
                console.error("Failed to load profile data", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    if (!user) return null;

    const parseDate = (ts: any) => {
        if (!ts) return new Date(0);
        if (typeof ts === 'string') return new Date(ts);
        if (ts.seconds) return new Date(ts.seconds * 1000);
        return new Date(0);
    };

    const activeCount = tasks.filter(t => t.status !== 'done').length;
    const completedCount = tasks.filter(t => t.status === 'done').length;

    // Recent Activity: Last 5 updated tasks
    const recentActivity = [...tasks]
        .sort((a, b) => parseDate(b.updatedAt).getTime() - parseDate(a.updatedAt).getTime())
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20 lg:pb-0">
            <div className="bg-white/5 backdrop-blur-md border border-[#ffffff1a] rounded-3xl p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-blue-500 to-violet-500">
                            <SafeAvatar
                                src={user.avatar_url}
                                alt={user.name || 'User'}
                                className="w-full h-full border-4 border-[#0f172a] rounded-full"
                                size={128}
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0f172a]" />
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                        <p className="text-blue-400 font-medium mb-4">{user.email}</p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300 border border-white/5">
                                Guest Account
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300 border border-white/5">
                                {user.department_id || 'General'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onClick={() => nativeNavigate('/tasks', router, 'GuestProfile (View Requests)')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <ClipboardList size={18} />
                            View Requests
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Active Requests</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{loading ? '-' : activeCount}</span>
                        <span className="text-gray-400 text-sm">in progress</span>
                    </div>
                </div>

                <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Completed</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{loading ? '-' : completedCount}</span>
                        <span className="text-gray-400 text-sm">delivered</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 px-2">Recent Request Activity</h3>
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-gray-500 italic p-4">Loading activity...</div>
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map(task => (
                            <div key={task.id}
                                onClick={() => nativeNavigate(`/tasks/view?id=${task.id}`, router, 'GuestProfile (Task Click)')}
                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <div>
                                        <p className="text-white font-medium group-hover:text-blue-300 transition-colors">{task.title}</p>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Updated {task.updated_at?.seconds ? format(new Date(task.updated_at.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-black/20 px-2 py-1 rounded">
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 italic p-4">No recent activity found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
