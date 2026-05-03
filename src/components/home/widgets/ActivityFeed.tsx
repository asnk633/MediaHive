import React from 'react';
import { Task } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';
import { Activity, PlusCircle, CheckCircle2, Edit3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
    tasks: Task[]; // All tasks to derive activity from
}

export const ActivityFeed = ({ tasks }: ActivityFeedProps) => {
    // Derive generic activity from tasks
    const activities = tasks
        .sort((a, b) => {
            const dateA = a.updated_at || a.created_at;
            const dateB = b.updated_at || b.created_at;
            const timeA = (dateA as any)?.seconds || new Date(dateA as any).getTime() / 1000;
            const timeB = (dateB as any)?.seconds || new Date(dateB as any).getTime() / 1000;
            return timeB - timeA;
        })
        .filter(task => {
            const dateVal = task.updated_at || task.created_at;
            const date = (dateVal as any)?.seconds ? new Date((dateVal as any)?.seconds * 1000) : new Date(dateVal as any);
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            return date >= fortyEightHoursAgo;
        })
        .slice(0, 5) // Last 5 activities
        .map(task => {
            const isNew = !task.updated_at || (task.created_at === task.updated_at);
            const dateVal = task.updated_at || task.created_at;
            const date = (dateVal as any)?.seconds ? new Date((dateVal as any)?.seconds * 1000) : new Date(dateVal as any);

            // Determine user name and role
            let userName = 'Unknown';
            let userRole = 'system';

            if (isNew) {
                userName = task.created_by?.name || 'Unknown';
                userRole = task.created_by?.role || 'system';
            } else {
                userName = task.updated_by?.name || task.created_by?.name || 'Unknown';
                userRole = task.updated_by?.role || task.created_by?.role || 'system';
            }

            return {
                id: task.id,
                type: isNew ? 'created' : 'updated',
                taskTitle: task.title,
                user: userName,
                role: userRole,
                time: date
            };
        });

    if (activities.length === 0) return null;

    return (
        <div className="bg-surface backdrop-blur-md rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Recent Updates</h3>
            </div>

            <div className="space-y-4">
                {activities.map((act) => (
                    <div key={`${act.id}-${act.type}`} className="flex gap-3 relative pb-4 last:pb-0">
                        {/* Timeline Line */}
                        <div className="absolute left-[9px] top-8 bottom-0 w-px bg-white/10 last:hidden" />

                        <div className={cn("mt-1 h-5 w-5 rounded-full flex items-center justify-center shadow-lg border border-[#ffffff1a] shrink-0",
                            act.type === 'created' ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                        )}>
                            {act.type === 'created' ? <PlusCircle size={12} /> : <Edit3 size={12} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border tracking-wide",
                                    act.role === 'admin' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                        act.role === 'team' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                            "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                )}>{act.role}</span>
                                <span className="font-semibold text-white text-sm">{act.user || 'User'}</span>
                            </div>

                            <p className="text-sm text-gray-300 leading-snug">
                                {act.type === 'created' ? 'created' : 'updated'}
                                {' '}
                                <span className="italic text-gray-400/80">"{act.taskTitle}"</span>
                            </p>

                            <p className="text-[10px] text-gray-600 mt-1">
                                {(() => {
                                    try {
                                        return act.time && !isNaN(act.time.getTime())
                                            ? formatDistanceToNow(act.time, { addSuffix: true })
                                            : 'recently';
                                    } catch (e) {
                                        return 'recently';
                                    }
                                })()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
