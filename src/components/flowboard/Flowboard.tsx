import React, { useMemo } from 'react';
import { Task } from '@/types/task';
import { SmartRulesEngine } from '@/services/smartRulesEngine';
import { FlowLane } from './FlowLane';

interface FlowboardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const Flowboard: React.FC<FlowboardProps> = ({ tasks, onTaskClick }) => {
    // Process and group tasks by stage
    const groupedTasks = useMemo(() => {
        const lanes = {
            shoot: [] as Task[],
            edit: [] as Task[],
            review: [] as Task[],
            publish: [] as Task[],
        };

        tasks.forEach(task => {
            const stage = SmartRulesEngine.inferStage(task);

            // Exclude intake/unknown stages from campaign flowboard
            if (stage === 'intake' || stage === 'general') {
                return;
            }

            if (lanes[stage]) {
                lanes[stage].push(task);
            }
        });

        // Sort tasks within each lane
        const sortTasks = (taskList: Task[]) => {
            return taskList.sort((a, b) => {
                const now = Date.now();

                // Helper to get due date timestamp
                const getDueTime = (task: Task) => {
                    if (!task.dueDate) return null;
                    try {
                        return (task.dueDate as any).seconds
                            ? (task.dueDate as any).seconds * 1000
                            : new Date(task.dueDate).getTime();
                    } catch {
                        return null;
                    }
                };

                const aDue = getDueTime(a);
                const bDue = getDueTime(b);

                // 1. Overdue tasks first
                const aOverdue = aDue && aDue < now;
                const bOverdue = bDue && bDue < now;
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;

                // 2. Due soon (within 7 days)
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                const aDueSoon = aDue && aDue < now + sevenDays;
                const bDueSoon = bDue && bDue < now + sevenDays;
                if (aDueSoon && !bDueSoon) return -1;
                if (!aDueSoon && bDueSoon) return 1;

                // 3. Tasks with due dates before tasks without
                if (aDue && !bDue) return -1;
                if (!aDue && bDue) return 1;

                // 4. Sort by due date if both have one
                if (aDue && bDue) {
                    return aDue - bDue;
                }

                // 5. Secondary sort by updatedAt DESC
                const aUpdated = (a.updatedAt as any)?.seconds || (a.createdAt as any)?.seconds || 0;
                const bUpdated = (b.updatedAt as any)?.seconds || (b.createdAt as any)?.seconds || 0;
                return bUpdated - aUpdated;
            });
        };

        // Apply sorting to each lane
        Object.keys(lanes).forEach(key => {
            lanes[key as keyof typeof lanes] = sortTasks(lanes[key as keyof typeof lanes]);
        });

        return lanes;
    }, [tasks]);

    return (
        <div className="bg-[#0B0E14] rounded-2xl border border-white/10 overflow-hidden">
            {/* Header Removed as per user request */}

            {/* Lanes Container */}
            <div className="flex overflow-x-auto h-[500px]">
                <FlowLane
                    title="Pre-Production / Shoot"
                    tasks={groupedTasks.shoot}
                    onTaskClick={onTaskClick}
                    color="orange"
                />
                <FlowLane
                    title="Post-Production / Edit"
                    tasks={groupedTasks.edit}
                    onTaskClick={onTaskClick}
                    color="blue"
                />
                <FlowLane
                    title="Review & Feedback"
                    tasks={groupedTasks.review}
                    onTaskClick={onTaskClick}
                    color="purple"
                />
                <FlowLane
                    title="Publish & Delivery"
                    tasks={groupedTasks.publish}
                    onTaskClick={onTaskClick}
                    color="emerald"
                />
            </div>
        </div>
    );
};
