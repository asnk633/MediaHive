import React from 'react';
import { cn } from "@/lib/utils";

type TaskStatus = 'pending' | 'working' | 'completed' | 'on_hold' | string;

interface StatusPillProps {
    status: TaskStatus;
}

export function StatusPill({ status }: StatusPillProps) {
    const map: Record<string, { label: string; className: string }> = {
        'pending': {
            label: 'Pending',
            className: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        },
        'working': {
            label: 'In Progress',
            className: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        },
        'in_progress': { // handle variation
            label: 'In Progress',
            className: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        },
        'completed': {
            label: 'Done',
            className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        },
        'done': { // handle variation
            label: 'Done',
            className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        },
        'on_hold': {
            label: 'On Hold',
            className: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        },
    };

    // Normalize status for lookup (lowercase)
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const cfg = map[normalizedStatus] ?? {
        label: status || 'Unknown',
        className: 'bg-white/10 text-white/60 border-white/20'
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                cfg.className
            )}
        >
            {cfg.label}
        </span>
    );
}
