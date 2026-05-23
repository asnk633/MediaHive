import React, { useEffect, useState } from 'react';
import { AttachmentLog } from '@/features/tasks/types/task';
import { supabase } from '@/lib/supabaseClient';
import { Activity, UploadCloud, Trash2, Eye, EyeOff, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContextProvider';

interface AttachmentActivityLogProps {
    taskId: string;
    refreshTrigger: number; // Increment to force refresh
}

export const AttachmentActivityLog: React.FC<AttachmentActivityLogProps> = ({ taskId, refreshTrigger }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AttachmentLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Deprecated: fetchAttachmentActivity was using /api/tasks which is removed.
            // Placeholder until a native Supabase activity table is hooked up.
            setLogs([]);
            setHasLoaded(true);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when expanded or triggered
    useEffect(() => {
        if (expanded || refreshTrigger > 0) {
            fetchLogs();
        }
    }, [expanded, refreshTrigger]);

    // Role Visibility Check (Redundant if API secures it, but good for UI hygiene)
    // "Visible to Admin + Assigned Team. Optional visibility to Requester"
    // We render for all authorized users.

    if (!expanded) {
        return (
            <div className="mt-6 border-t border-foreground/5 pt-4">
                <Button
                    variant="ghost"
                    onClick={() => setExpanded(true)}
                    className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-foreground/5 text-xs font-medium uppercase tracking-wider flex items-center gap-2"
                >
                    <Activity size={14} />
                    View Activity Log
                    {loading && <Loader2 size={12} className="animate-spin ml-2" />}
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-6 border-t border-foreground/5 pt-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-foreground/70 text-xs font-bold uppercase tracking-wider">
                    <Activity size={14} />
                    Attachment Activity
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchLogs()}
                    className="h-6 w-6 p-0 text-foreground/80 hover:text-foreground"
                    title="Refresh"
                >
                    <Loader2 size={12} className={cn(loading && "animate-spin")} />
                </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar bg-[#0a0c10]/30 rounded-xl p-4 border border-foreground/5">
                {loading && !hasLoaded && (
                    <div className="text-center py-4 text-foreground/70 text-xs">Loading activity...</div>
                )}
                {!loading && logs.length === 0 && (
                    <div className="text-center py-4 text-foreground/70 text-xs">No activity recorded.</div>
                )}

                {logs.map(log => (
                    <div key={log.id} className="flex gap-3 text-sm text-slate-400 items-start transition-opacity animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="mt-1 shrink-0">
                            {log.action === 'upload' && <UploadCloud size={14} className="text-blue-400" />}
                            {log.action === 'delete' && <Trash2 size={14} className="text-red-400" />}
                            {log.action === 'visibility_public' && <Eye size={14} className="text-green-400" />}
                            {log.action === 'visibility_private' && <EyeOff size={14} className="text-orange-400" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-1">
                                <span className="text-foreground font-medium">{log.performed_by.name}</span>
                                <span className="text-slate-500">
                                    {log.action === 'upload' && 'uploaded'}
                                    {log.action === 'delete' && 'deleted'}
                                    {log.action === 'visibility_public' && 'made public'}
                                    {log.action === 'visibility_private' && 'made private'}
                                </span>
                                <span className="font-medium text-blue-200/80 whitespace-pre-wrap break-all">{log.file_name}</span>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-2">
                                <Clock size={10} />
                                {format(new Date(log.timestamp), 'MMM dd, h:mm a')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 text-center">
                <Button
                    variant="link"
                    onClick={() => setExpanded(false)}
                    className="text-[10px] text-foreground/80 hover:text-foreground"
                >
                    Hide Activity
                </Button>
            </div>
        </div>
    );
};
