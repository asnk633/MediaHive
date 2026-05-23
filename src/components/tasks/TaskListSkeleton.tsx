import { TaskRowSkeleton } from "./TaskRowSkeleton";
import { useDensityStore } from "@/stores/useDensityStore";

export function TaskListSkeleton({ count = 6 }: { count?: number }) {
    const { density } = useDensityStore();
    return (
        <div className="divide-y divide-soft rounded-2xl border border-soft bg-surface shadow-sm overflow-hidden min-h-[400px]">
            {/* Header Mock */}
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[44px_minmax(0,10fr)_minmax(0,4fr)_65px_45px_65px_90px_75px_95px] gap-x-2 pl-1.5 pr-3 py-3 bg-muted/5 border-b border-soft items-center">
                <div className="h-4 w-4 bg-foreground/5 rounded-sm mx-auto opacity-20" /> {/* Control Column Placeholder */}
                <div className="h-3 w-8 bg-foreground/10 rounded" /> {/* Task */}
                <div className="hidden md:block h-3 w-20 bg-foreground/10 rounded" /> {/* Requester */}
                <div className="hidden md:block h-3 w-12 bg-foreground/10 rounded mx-auto" /> {/* Priority */}
                <div className="hidden md:block h-3 w-8 bg-foreground/10 rounded mx-auto" /> {/* Assignee */}
                <div className="hidden md:block h-3 w-10 ml-auto bg-foreground/10 rounded" /> {/* Due */}
                <div className="hidden md:block h-3 w-14 bg-foreground/10 rounded" /> {/* Status */}
                <div className="hidden md:block h-3 w-16 mx-auto bg-foreground/10 rounded" /> {/* Date */}
                <div className="hidden md:block h-3 w-12 bg-foreground/10 rounded mx-auto" /> {/* Ops */}
            </div>

            <div className="divide-y divide-soft">
                {Array.from({ length: count }).map((_, i) => (
                    <TaskRowSkeleton key={i} density={density} />
                ))}
            </div>
        </div>
    );
}
