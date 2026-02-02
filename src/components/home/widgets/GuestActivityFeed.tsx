import React from 'react';
import { Task } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';
import { Activity, PlusCircle, Edit3 } from 'lucide-react';
import { cn, nativeNavigate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface GuestActivityFeedProps {
    tasks: Task[]; // Assumed to be filtered to "created by user"
}

export const GuestActivityFeed = ({ tasks }: GuestActivityFeedProps) => {
    const router = useRouter();

    // Derive concise activity from tasks
    // Rules:
    // 1. Show only 'Created' or 'Status Changed' (inferred from update time)
    // 2. No user names, no chatter.
    const activities = tasks
        .sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt;
            const dateB = b.updatedAt || b.createdAt;
            const timeA = (dateA as any)?.seconds || new Date(dateA as any).getTime() / 1000;
            const timeB = (dateB as any)?.seconds || new Date(dateB as any).getTime() / 1000;
            return timeB - timeA;
        })
        .slice(0, 5) // Last 5 updates
        .map(task => {
            const isNew = !task.updatedAt || (task.createdAt === task.updatedAt);
            const dateVal = task.updatedAt || task.createdAt;
            const date = (dateVal as any)?.seconds ? new Date((dateVal as any)?.seconds * 1000) : new Date(dateVal as any);

            // Infer action
            let actionText = "Request Created";
            if (!isNew) {
                // If updated, show status focus
                actionText = `Request is now ${task.status.replace('_', ' ')}`;
            }

            return {
                id: task.id,
                type: isNew ? 'created' : 'updated',
                taskTitle: task.title,
                action: actionText,
                status: task.status,
                time: date
            };
        });

    if (activities.length === 0) return null;

    return (
        <div className="bg-white/5 backdrop-blur-md border border-[#ffffff1a] rounded-2xl p-5 shadow-xl animate-in fade-in duration-700">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">My Request Updates</h3>
            </div>

            <div className="space-y-4">
                {activities.map((act) => (
                    <div
                        key={`${act.id}-${act.type}`}
                        className="flex gap-3 relative pb-4 last:pb-0 cursor-pointer group"
                        onClick={() => nativeNavigate(`/tasks/view?id=${act.id}`, router, 'GuestActivityFeed (Task)')}
                    >
                        {/* Timeline Line */}
                        <div className="absolute left-[9px] top-8 bottom-0 w-px bg-white/10 last:hidden" />

                        <div className={cn("mt-1 h-5 w-5 rounded-full flex items-center justify-center shadow-lg border border-[#ffffff1a] shrink-0 transition-transform group-hover:scale-110",
                            act.type === 'created' ? "bg-blue-500/20 text-blue-400" : "bg-violet-500/20 text-violet-400"
                        )}>
                            {act.type === 'created' ? <PlusCircle size={12} /> : <Edit3 size={12} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 leading-snug font-medium group-hover:text-blue-300 transition-colors">
                                {act.action}
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                "{act.taskTitle}"
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
