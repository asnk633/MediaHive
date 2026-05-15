
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TaskRowSkeleton({ density = 'comfortable' }: { density?: 'comfortable' | 'compact' }) {
    return (
        <div className={cn(
            "grid grid-cols-[auto_1fr_auto] md:grid-cols-[28px_minmax(0,10fr)_minmax(0,4fr)_70px_45px_70px_100px_90px_80px] gap-x-2 px-1.5 items-center border-l-[3px] border-l-transparent bg-white/[0.01]",
            density === 'compact' ? "py-1.5" : "py-2.5"
        )}>
            {/* Expander Placeholder */}
            <div className="flex justify-center p-1">
                <Skeleton className="w-4 h-4 rounded-sm" />
            </div>

            {/* Title & Checkbox Placeholder */}
            <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-full max-w-[200px] rounded-sm" />
                </div>
                {/* Mobile Meta Row */}
                <div className="md:hidden flex items-center gap-2 mt-1">
                    <Skeleton className="h-3 w-16 rounded-full" />
                </div>
            </div>

            {/* Requested By */}
            <div className="hidden md:block">
                <Skeleton className="h-3 w-full max-w-[120px] bg-white/5" />
            </div>

            {/* Priority */}
            <div className="hidden md:flex justify-center">
                <Skeleton className="h-4 w-12 rounded bg-white/5" />
            </div>

            {/* Assignee */}
            <div className="hidden md:flex items-center justify-center">
                <Skeleton className="w-6 h-6 rounded-full bg-white/5" />
            </div>

            {/* Due Date */}
            <div className="hidden md:flex justify-end">
                <Skeleton className="h-3 w-10 bg-white/5" />
            </div>

            {/* Status */}
            <div className="hidden md:block">
                <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
            </div>

            {/* Completed Date */}
            <div className="hidden md:flex justify-end">
                <Skeleton className="h-3 w-16 bg-white/5" />
            </div>

            {/* Ops / Quick Actions */}
            <div className="hidden md:flex justify-center gap-1.5">
                <Skeleton className="w-4 h-4 rounded bg-white/5" />
                <Skeleton className="w-4 h-4 rounded bg-white/5" />
                <Skeleton className="w-4 h-4 rounded bg-white/5" />
            </div>
        </div>
    );
}
