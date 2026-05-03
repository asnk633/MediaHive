'use client';

import React from 'react';
import { format } from 'date-fns';
import {
    History,
    CheckCircle,
    AlertCircle,
    User,
    Trash2,
    Edit3,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuditLog, AuditAction } from '@/types/audit';

interface AuditTimelineProps {
    logs: AuditLog[];
    isLoading?: boolean;
}

const ActionIcon = ({ action }: { action: AuditAction }) => {
    switch (action) {
        case 'create': return <div className="bg-green-500/20 p-1.5 rounded-full"><User size={14} className="text-green-500" /></div>;
        case 'complete': return <div className="bg-blue-500/20 p-1.5 rounded-full"><CheckCircle size={14} className="text-blue-500" /></div>;
        case 'delete': return <div className="bg-red-500/20 p-1.5 rounded-full"><Trash2 size={14} className="text-red-500" /></div>;
        case 'assign': return <div className="bg-purple-500/20 p-1.5 rounded-full"><User size={14} className="text-purple-500" /></div>;
        case 'update': default: return <div className="bg-white/10 p-1.5 rounded-full"><Edit3 size={14} className="text-white/60" /></div>;
    }
};

const ChangeRenderer = ({ change }: { change: any }) => {
    const { field, from, to } = change;

    // Format if date (simple heuristic)
    const fmt = (v: any) => {
        if (!v) return 'Empty';
        if (typeof v === 'string' && (v.includes('T') && v.includes('Z') && v.length > 20)) {
            try { return format(new Date(v), 'MMM d, yyyy'); } catch { return v; }
        }
        if (Array.isArray(v)) {
            if (v.length === 0) return 'None';
            // heuristic: if small array, show content
            if (v.length <= 2) {
                return v.map(i => typeof i === 'object' ? (i.name || JSON.stringify(i)) : String(i)).join(', ');
            }
            return `[${v.length} items]`;
        }
        return String(v);
    };

    return (
        <div className="text-xs text-white/50 mt-1 pl-1 border-l-2 border-white/10 ml-1">
            <span className="font-mono text-white/40 uppercase text-[10px]">{field}:</span>{' '}
            <span className="line-through opacity-50">{fmt(from)}</span> <ArrowRight size={10} className="inline mx-0.5" /> <span className="text-white/80">{fmt(to)}</span>
        </div>
    );
};

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, isLoading }) => {
    if (isLoading) {
        return <div className="p-4 text-center text-xs text-muted animate-pulse">Loading history...</div>;
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-white/20">
                <History size={24} className="mb-2 opacity-50" />
                <p className="text-xs">No recorded history yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-1">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3 relative">
                    {/* Connector Line */}
                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-[1px] bg-white/5 last:hidden" />

                    <div className="mt-0.5 shrink-0 z-10">
                        <ActionIcon action={log.action} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-white/90">
                                {log.action === 'create' && 'Created Task'}
                                {log.action === 'update' && 'Updated Task'}
                                {log.action === 'assign' && 'Changed Assignment'}
                                {log.action === 'complete' && 'Completed Task'}
                                {log.action === 'reopen' && 'Reopened Task'}
                                {log.action === 'delete' && 'Deleted Task'}
                            </p>
                            <span className="text-[10px] text-white/50 whitespace-nowrap">
                                {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 mb-1.5">
                            <span className="text-xs text-white/50">by {log.performed_by.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 uppercase tracking-wider">
                                {log.performed_by.role}
                            </span>
                        </div>

                        {/* Diff View */}
                        {log.changes && log.changes.length > 0 && (
                            <div className="space-y-1 mt-1">
                                {log.changes.map((c, i) => (
                                    <ChangeRenderer key={i} change={c} />
                                ))}
                            </div>
                        )}

                        {/* Status Change (Legacy/Simplified) */}
                        {log.action === 'complete' && (
                            <p className="text-xs text-emerald-400 mt-1">Marked as Done</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
