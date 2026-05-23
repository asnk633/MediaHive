import React from 'react';

export function TaskCardSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-[#ffffff1a] bg-foreground/5 p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-foreground/20" />
            <div className="h-3 w-full rounded bg-foreground/10" />
            <div className="flex gap-2">
                <div className="h-3 w-16 rounded-full bg-foreground/15" />
                <div className="h-3 flex-1 rounded-full bg-foreground/10" />
            </div>
        </div>
    );
}
