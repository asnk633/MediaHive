import React from 'react';
import { cn } from "@/lib/utils";

import { Task } from '@/types/task';

type TaskStatus = Task['status'];

interface StatusPillProps {
    status: TaskStatus;
}

export function StatusPill({ status }: StatusPillProps) {
    const map: Record<string, { label: string; className: string }> = {
        'pending': {
            label: 'Pending',
            className: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        },
        'todo': {
            label: 'To Do',
            className: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
        },
        'in_progress': {
            label: 'In Progress',
            className: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        },
        'review': {
            label: 'Review',
            className: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        },
        'done': {
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
