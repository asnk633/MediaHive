'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TaskService } from '@/services/tasks';
import { Task, SmartMetadata } from '@/types/task';
import { SmartRulesEngine } from '@/services/smartRulesEngine';
import { FlowboardLane } from '@/components/flowboard/FlowboardLane';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import { WorkflowHealthWidget } from '@/app/(shell)/reports/components/WorkflowHealthWidget'; // Maybe reuse parts or layout?
import { Loader2 } from 'lucide-react';

export default function FlowboardPage() {
    const [rawTasks, setRawTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        const unsubscribe = TaskService.subscribeToTasks((tasks) => {
            setRawTasks(tasks);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Process and Group Tasks
    const groupedTasks = useMemo(() => {
        const lanes = {
            intake: [] as { task: Task; smartData: SmartMetadata }[],
            shoot: [] as { task: Task; smartData: SmartMetadata }[],
            edit: [] as { task: Task; smartData: SmartMetadata }[],
            review: [] as { task: Task; smartData: SmartMetadata }[],
            publish: [] as { task: Task; smartData: SmartMetadata }[],
        };

        rawTasks.forEach(task => {
            if (task.status === 'done' && task.completedAt) {
                // Determine if we show Done tasks. 
                // Maybe 'publish' lane keeps done tasks for a while? 
                // Or filtered out? 
                // Let's keep them if inferredStage is 'publish', otherwise maybe hide?
                // Actually, let's include all to see where they land.
            }

            const smartData = SmartRulesEngine.processTask(task);

            // Map 'general' -> 'intake' visually if we want, or handle explicitly.
            // Our audit logic made fallback 'intake'.
            // SmartRulesEngine return type now has 'intake' | 'general' etc.

            let stage = smartData.inferredStage;
            if (stage === 'general') stage = 'intake'; // Catch-all just in case

            if (lanes[stage]) {
                lanes[stage].push({ task, smartData });
            } else {
                // Should not happen if types aligned, but safe fallback
                lanes.intake.push({ task, smartData });
            }
        });

        // Sort inside lanes? Priority?
        // Let's sort by urgency score desc
        Object.values(lanes).forEach(list => {
            list.sort((a, b) => b.smartData.urgencyScore - a.smartData.urgencyScore);
        });

        return lanes;
        return lanes;
    }, [rawTasks]);

    // Calculate Capacity Load
    const userCapacity = useMemo(() => SmartRulesEngine.getUserStageLoad(rawTasks), [rawTasks]);

    // Extract User Names for display
    const userNames = useMemo(() => {
        const names: Record<string, string> = {};
        rawTasks.forEach(t => {
            t.assignedTo?.forEach(u => {
                if (u.uid && u.name) names[u.uid] = u.name;
            });
        });
        return names;
    }, [rawTasks]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent text-white overflow-hidden">
            {/* Header Removed as per user request */}

            {/* Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full min-w-max px-4">
                    <FlowboardLane
                        title="Intake"
                        stageId="intake"
                        color="gray"
                        tasks={groupedTasks.intake}
                        onTaskClick={(task) => {
                            console.log('🟢 [FLOWBOARD PAGE] setSelectedTask called for:', task.id);
                            setSelectedTask(task);
                        }}
                        userCapacity={userCapacity}
                        userNames={userNames}
                    />
                    <FlowboardLane
                        title="Pre-Production / Shoot"
                        stageId="shoot"
                        color="orange"
                        tasks={groupedTasks.shoot}
                        onTaskClick={setSelectedTask}
                        userCapacity={userCapacity}
                        userNames={userNames}
                    />
                    <FlowboardLane
                        title="Post-Production / Edit"
                        stageId="edit"
                        color="blue"
                        tasks={groupedTasks.edit}
                        onTaskClick={setSelectedTask}
                        userCapacity={userCapacity}
                        userNames={userNames}
                    />
                    <FlowboardLane
                        title="Review & Feedback"
                        stageId="review"
                        color="purple"
                        tasks={groupedTasks.review}
                        onTaskClick={setSelectedTask}
                        userCapacity={userCapacity}
                        userNames={userNames}
                    />
                    <FlowboardLane
                        title="Publish & Delivery"
                        stageId="publish"
                        color="emerald"
                        tasks={groupedTasks.publish}
                        onTaskClick={setSelectedTask}
                        userCapacity={userCapacity}
                        userNames={userNames}
                    />
                </div>
            </div>

            {/* Edit Modal */}
            {selectedTask && (
                <EditTaskDialog
                    task={selectedTask}
                    open={!!selectedTask}
                    onOpenChange={(open) => !open && setSelectedTask(null)}
                    onUpdate={async (updates) => {
                        if (!selectedTask) return false;
                        try {
                            await TaskService.updateTask(selectedTask.id, updates);
                            return true;
                        } catch (e) {
                            console.error("Failed to update task", e);
                            return false;
                        }
                    }}
                />
            )}
        </div>
    );
}
