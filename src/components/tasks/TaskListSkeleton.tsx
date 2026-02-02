import { TaskRowSkeleton } from "./TaskRowSkeleton";
import { useDensityStore } from "@/stores/useDensityStore";

export function TaskListSkeleton({ count = 6 }: { count?: number }) {
    const { density } = useDensityStore();
    return (
        <div className="divide-y divide-soft rounded-2xl border border-soft bg-surface shadow-sm overflow-hidden min-h-[400px]">
            {/* Header Mock */}
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[40px_3fr_2fr_1.4fr_1.2fr_0.9fr_1fr] gap-2 px-6 py-3 bg-muted/5 border-b border-soft">
                <div className="h-3 w-4" /> {/* Expander */}
                <div className="h-3 w-8 bg-white/5 rounded" /> {/* Task */}
                <div className="hidden md:block h-3 w-20 bg-white/5 rounded" /> {/* Req By */}
                <div className="hidden md:block h-3 w-16 bg-white/5 rounded" /> {/* Assignee */}
                <div className="hidden md:block h-3 w-12 bg-white/5 rounded" /> {/* Status */}
                <div className="hidden md:block h-3 w-12 bg-white/5 rounded" /> {/* Priority */}
                <div className="hidden md:block h-3 w-8 ml-auto bg-white/5 rounded" /> {/* Due */}
            </div>

            <div className="divide-y divide-soft">
                {Array.from({ length: count }).map((_, i) => (
                    <TaskRowSkeleton key={i} density={density} />
                ))}
            </div>
        </div>
    );
}
