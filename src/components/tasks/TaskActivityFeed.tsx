'use client';

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { History, RefreshCw, Trash2, CheckCircle2, Flag, Users, Undo2, ShieldCheck, Edit3, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { motion } from 'framer-motion';

interface TaskActivityFeedProps {
    taskId: string;
    user: { uid: string; role: string } | null;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    status_changed: <CheckCircle2 size={13} className="text-blue-400" />,
    priority_changed: <Flag size={13} className="text-amber-400" />,
    assigned: <Users size={13} className="text-purple-400" />,
    unassigned: <Users size={13} className="text-foreground/70" />,
    deleted: <Trash2 size={13} className="text-red-400" />,
    restored: <Undo2 size={13} className="text-emerald-400" />,
    conflict_resolved: <ShieldCheck size={13} className="text-blue-500" />,
    created: <Edit3 size={13} className="text-emerald-400" />,
    updated: <History size={13} className="text-blue-400" />,
    commented: <MessageSquare size={13} className="text-indigo-400" />,
};

function formatDisplayTime(ts: string): string {
    try {
        const date = new Date(ts);
        if (isToday(date)) return `Today ${format(date, 'h:mm a')}`;
        if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
        return format(date, 'MMM d, yyyy h:mm a');
    } catch {
        return ts;
    }
}

function resolveActionLabel(log: any, viewerUid: string): string {
    const actor = log.user?.fullName || log.user?.email || (log.userId === viewerUid ? 'You' : 'Someone');
    const act = log.action.replace('_', ' ').toLowerCase();

    // Attempt detailed action extraction from metadata
    try {
        if (log.details) {
            const meta = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            if (log.action === 'status_changed' && meta.oldValue && meta.newValue) {
                return `${actor} changed status from ${meta.oldValue} to ${meta.newValue}`;
            }
        }
    } catch (e) { }

    return `${actor} ${act} this task`;
}

export const TaskActivityFeed: React.FC<TaskActivityFeedProps> = ({ taskId, user }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || !taskId) return;

        const fetchAuditLogs = async () => {
            setLoading(true);
            try {
                // Fetch audit logs for the specific task resource
                // The API doesn't support generic resourceId filtering yet via query param,
                // so we fetch latest task updates and filter by taskId
                const res = await apiClient(`/api/audit-log?resourceType=task&limit=50&includeUserDetails=true`);
                if (res && res.logs) {
                    const taskLogs = res.logs.filter((log: any) =>
                        log.resourceId === taskId ||
                        (log.details && log.details.includes(taskId))
                    );
                    setEntries(taskLogs);
                }
            } catch (err) {
                console.error("Failed to load task activity:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, [taskId, user]);

    if (!user) return null;

    // Members who have no entries: hide feed entirely
    if (user.role === 'member' && entries.length === 0) return null;

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-3 text-foreground/80">
                <RefreshCw size={14} className="shrink-0 animate-spin" />
                <span className="text-[11px]">Loading activity...</span>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex items-center gap-2 py-3 text-foreground/80">
                <History size={14} className="shrink-0" />
                <span className="text-[11px]">No recent activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((entry, idx) => {
                const icon = ACTION_ICONS[entry.action] || <History size={13} className="text-gray-400" />;

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        key={entry.id || idx}
                        className="flex items-start gap-3 group relative"
                    >
                        {/* Connecting Line */}
                        {idx !== entries.length - 1 && (
                            <div className="absolute left-3 top-7 bottom-0 w-[1px] -translate-x-[0.5px] bg-foreground/[0.05]" />
                        )}

                        {/* Icon / Avatar placeholder */}
                        <div className="shrink-0 w-6 h-6 rounded-full bg-foreground/[0.04] border border-foreground/5 flex items-center justify-center z-10">
                            {icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pb-1">
                            <p className="text-[13px] text-foreground/80 leading-snug">
                                {resolveActionLabel(entry, user.uid)}
                            </p>
                            <p className="text-[11px] text-foreground/80 mt-0.5">
                                {formatDisplayTime(entry.timestamp)}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
