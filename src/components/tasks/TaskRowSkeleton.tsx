
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TaskRowSkeleton({ density = 'comfortable' }: { density?: 'comfortable' | 'compact' }) {
    return (
        <div className={cn(
            "grid grid-cols-[auto_1fr_auto] md:grid-cols-[40px_3fr_1.5fr_0.8fr_1.5fr_1.2fr_1.2fr_1.2fr] gap-2 px-6 items-center border-l-4 border-l-transparent bg-elevated/50",
            density === 'compact' ? "py-2" : "py-4"
        )}>
            {/* Expander */}
            <div className="flex justify-center p-1">
                <Skeleton className="w-4 h-4 rounded-sm" />
            </div>

            {/* Title & Mobile Meta */}
            <div className="pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                    {/* Selection Checkbox Placeholder */}
                    <div className="hidden md:block w-4 h-4 border border-white/10 rounded" />
                    <Skeleton className="h-4 w-[60%] rounded-sm" />
                </div>
                {/* Mobile Meta Row */}
                <div className="md:hidden flex items-center gap-2 mt-1">
                    <Skeleton className="h-3 w-16 rounded-full" />
                </div>
            </div>

            {/* Requested By */}
            <div className="hidden md:block">
                <Skeleton className="h-3 w-[80%]" />
            </div>

            {/* Priority */}
            <div className="hidden md:block">
                <Skeleton className="h-4 w-16 rounded" />
            </div>

            {/* Assignee */}
            <div className="hidden md:flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
            </div>

            {/* Due Date */}
            <div className="hidden md:flex justify-end">
                <Skeleton className="h-3 w-12" />
            </div>

            {/* Completed Date */}
            <div className="hidden md:flex justify-end">
                <Skeleton className="h-3 w-12" />
            </div>

            {/* Status */}
            <div className="hidden md:block">
                <Skeleton className="h-5 w-24 rounded" />
            </div>
        </div>
    );
}
