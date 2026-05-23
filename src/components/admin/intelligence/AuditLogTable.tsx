
"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Shield, Clock, FileText, User, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

type AuditLogEntry = {
    id: number;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: string;
    timestamp: string;
    user?: {
        fullName: string;
        email: string;
    };
};

export function AuditLogTable() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await apiClient(`/api/admin/audit?page=${page}&limit=20&includeUserDetails=true`);
            setLogs(res.logs);
            setTotalPages(res.pagination.totalPages);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            setError('Failed to load audit logs. Ensure you have admin permissions.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="p-12 text-center text-red-400 bg-red-500/5 rounded-2xl border border-red-500/20">
                <AlertTriangle className="mx-auto mb-4" size={32} />
                <h3 className="text-lg font-bold">Access Denied</h3>
                <p className="mt-2 text-sm opacity-80">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-soft rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-foreground/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="text-emerald-500" size={24} />
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-wide">Compliance Audit Log</h2>
                        <p className="text-xs text-muted mt-0.5">Immutable record of administrative actions</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
                    SECURE_LOGGING_ACTIVE
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/5 text-xs uppercase text-muted font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Performed By</th>
                            <th className="px-6 py-4">Activity Type</th>
                            <th className="px-6 py-4 w-1/3">Description of Change</th>
                            <th className="px-6 py-4 text-right">Reference ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-soft">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-4">
                                        <div className="h-4 bg-foreground/5 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted italic">
                                    No audit records found.
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => {
                                // Parse details once
                                let detailsObj: any = {};
                                try {
                                    detailsObj = JSON.parse(log.details);
                                } catch (e) {
                                    // Fallback if not valid JSON
                                    detailsObj = { raw: log.details };
                                }

                                // --- Natural Language Formatter ---
                                const getFormattedDetails = () => {
                                    const action = log.action.toLowerCase();
                                    const type = log.resourceType.toLowerCase();

                                    // 1. Bulk Operations
                                    if (action === 'bulk_task_operation') {
                                        const op = detailsObj.operation || 'processed';
                                        const count = detailsObj.successCount || detailsObj.taskCount || 0;
                                        return (
                                            <div>
                                                <span className="text-foreground font-medium">Bulk {op}</span>
                                                <div className="text-foreground/70 text-xs mt-0.5">
                                                    Successfully processed {count} tasks.
                                                </div>
                                            </div>
                                        );
                                    }

                                    // 2. Events
                                    if (type === 'event') {
                                        if (action === 'create') {
                                            return (
                                                <span className="text-muted/80">
                                                    Created event <span className="text-foreground font-medium">"{detailsObj.title || 'Untitled'}"</span>
                                                </span>
                                            );
                                        }
                                        if (action === 'update') {
                                            const changes = Array.isArray(detailsObj.changes) ? detailsObj.changes.join(', ') : 'details';
                                            return (
                                                <span className="text-muted/80">
                                                    Updated {changes} for event {log.resourceId}
                                                </span>
                                            );
                                        }
                                    }

                                    // 3. Tasks
                                    if (type === 'task') {
                                        if (action === 'create') {
                                            return <span className="text-foreground/80">Created a new task</span>;
                                        }
                                        if (action === 'update') {
                                            const changes = Array.isArray(detailsObj.changes) ? detailsObj.changes.join(', ') : 'details';
                                            return <span className="text-foreground/80">Modified {changes}</span>;
                                        }
                                        if (action === 'delete') {
                                            return <span className="text-foreground/80">Deleted task</span>;
                                        }
                                    }

                                    // 4. Notifications
                                    if (type === 'notification') {
                                        return <span className="text-muted/80">Sent a {detailsObj.type || ''} notification</span>;
                                    }

                                    // 5. Login/Logout
                                    if (action === 'login') return <span className="text-emerald-500 font-medium">System Access Granted</span>;
                                    if (action === 'logout') return <span className="text-muted/50">System Session Ended</span>;

                                    // Generic Fallback (Cleaned up)
                                    if (Object.keys(detailsObj).length > 0 && !detailsObj.raw) {
                                        return (
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(detailsObj).map(([k, v]) => {
                                                    if (k === 'changes' || typeof v === 'object') return null;
                                                    return (
                                                        <span key={k} className="px-1.5 py-0.5 rounded bg-muted/10 text-muted/80 text-[10px]">
                                                            {k}: {String(v)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }

                                    return <span className="text-muted/30 italic">No additional details</span>;
                                };

                                return (
                                    <tr key={log.id} className="hover:bg-primary/5 transition-colors group border-b border-soft last:border-0">
                                        <td className="px-6 py-4 text-muted/70 font-mono text-xs whitespace-nowrap">
                                            {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
                                                    <User size={14} className="text-foreground" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-foreground font-medium">
                                                        {log.user?.fullName || 'Unknown System User'}
                                                    </div>
                                                    <div className="text-[10px] text-muted/60 font-mono">
                                                        {log.user?.email || `ID: ${log.userId.substring(0, 8)}...`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Combined Action & Context */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 opacity-70">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-indigo-500 font-mono">
                                                    {log.resourceType}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Human Readable Details */}
                                        <td className="px-6 py-4 text-sm w-1/3">
                                            {getFormattedDetails()}
                                        </td>

                                        {/* Raw technical ID detail (hidden by default, visible on hover/group) */}
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] bg-muted/20 text-muted/60 px-2 py-1 rounded font-mono group-hover:text-muted transition-colors">
                                                ID: {log.resourceId?.substring(0, 8) || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-soft flex items-center justify-between bg-muted/5">
                <span className="text-xs text-muted">
                    Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="p-1 px-3 rounded bg-surface border border-soft hover:bg-surface/80 disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-colors"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="p-1 px-3 rounded bg-surface border border-soft hover:bg-surface/80 disabled:opacity-30 disabled:cursor-not-allowed text-foreground transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
