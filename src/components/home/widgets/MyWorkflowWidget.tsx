import React from 'react';
import { Task } from '@/types/task';
import { Video, Edit3, Eye, UploadCloud, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MyWorkflowWidgetProps {
    tasks: Task[];
    userId: string;
}

export const MyWorkflowWidget = ({ tasks, userId }: MyWorkflowWidgetProps) => {
    const router = useRouter();

    // Filter tasks assigned to me
    const myTasks = tasks.filter(task => {
        if (task.status === 'done') return false;

        // Handle array of assignees
        if (Array.isArray(task.assignedTo)) {
            return task.assignedTo.some(u =>
                (typeof u === 'string' ? u : u.uid) === userId
            );
        }
        return false;
    });

    // Bucket by Stage
    const stageCounts = {
        shoot: 0,
        edit: 0,
        review: 0,
        publish: 0
    };

    myTasks.forEach(task => {
        const stage = task.smartMetadata?.inferredStage;
        if (stage && stageCounts[stage as keyof typeof stageCounts] !== undefined) {
            stageCounts[stage as keyof typeof stageCounts]++;
        }
    });

    const StageCard = ({ label, subtitle, count, icon: Icon, colorClass, stageKey }: any) => (
        <button
            onClick={() => router.push(`/tasks?status=in_progress`)} // Could be smarter with deep links later
            disabled={count === 0}
            className={`
                flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 w-full relative group
                ${count > 0
                    ? `bg-white/5 backdrop-blur-md border-[#ffffff1a] hover:bg-white/10 ${colorClass}`
                    : 'bg-white/5 border-white/5 opacity-50 cursor-default'
                }
            `}
        >
            <div className={`p-2 rounded-full bg-white/5 mb-2 group-hover:scale-110 transition-transform`}>
                <Icon size={20} className={count > 0 ? "text-white" : "text-gray-500"} />
            </div>
            <span className="text-2xl font-bold text-white">{count}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">{label}</span>
            {subtitle && <span className="text-[9px] text-gray-600 font-medium absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">{subtitle}</span>}
        </button>
    );

    if (myTasks.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Layers size={14} className="text-gray-400" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    My Workflow
                </h3>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <StageCard
                    label="Shoot"
                    subtitle="Production"
                    count={stageCounts.shoot}
                    icon={Video}
                    stageKey="shoot"
                    colorClass="hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                />
                <StageCard
                    label="Edit"
                    subtitle="Post-Prod"
                    count={stageCounts.edit}
                    icon={Edit3}
                    stageKey="edit"
                    colorClass="hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                />
                <StageCard
                    label="Review"
                    subtitle="Approval"
                    count={stageCounts.review}
                    icon={Eye}
                    stageKey="review"
                    colorClass="hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                />
                <StageCard
                    label="Publish"
                    subtitle="Release"
                    count={stageCounts.publish}
                    icon={UploadCloud}
                    stageKey="publish"
                    colorClass="hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                />
            </div>
        </div>
    );
};
