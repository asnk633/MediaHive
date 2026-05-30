'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ArrowRight, ShieldCheck, DownloadCloud, Info } from 'lucide-react';
import type { ConflictCategory, TaskConflict } from '@/domain/conflicts/types';
import { Task } from '@/features/tasks/types/task';

interface ConflictResolutionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    conflictBuffer: Record<string, TaskConflict[]>;
    onResolve: (taskId: string, field: string, choice: 'local' | 'server', user: any) => void;
    tasks: Task[]; // For getting the full task name
    user: any; // User context for ActivityHistory logging
}

export const ConflictResolutionPanel: React.FC<ConflictResolutionPanelProps> = ({
    isOpen,
    onClose,
    conflictBuffer,
    onResolve,
    tasks,
    user
}) => {
    const taskIds = Object.keys(conflictBuffer);
    const hasConflicts = taskIds.length > 0;

    // Automatically close panel if no conflicts remain
    React.useEffect(() => {
        if (isOpen && !hasConflicts) {
            onClose();
        }
    }, [isOpen, hasConflicts, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm z-[100]"
            />

            {/* Drawer */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0B0E14] border-l border-foreground/10 shadow-2xl z-[101] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/10 shrink-0 bg-surface/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                            <Info className="w-5 h-5 text-foreground/60" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Needs Review</h2>
                            <p className="text-xs text-foreground/60">These changes conflicted with others.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        autoFocus
                        className="p-2 text-foreground/80 hover:text-foreground rounded-lg hover:bg-foreground/5 transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {taskIds.map(taskId => {
                        const taskConflicts = conflictBuffer[taskId];
                        if (!taskConflicts || taskConflicts.length === 0) return null;

                        const taskName = tasks.find(t => t.id === taskId)?.title || 'Unknown Task';

                        return (
                            <div key={taskId} className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 bg-foreground/[0.02] border-b border-foreground/5 shadow-sm">
                                    <h3 className="text-sm font-bold text-foreground truncate">{taskName}</h3>
                                </div>

                                <div className="p-4 space-y-5">
                                    {taskConflicts.map(conflict => {
                                        const guidance = conflict.policyGuidance;
                                        const isLocalSuggested = guidance?.suggestedAction === 'local';
                                        const isServerSuggested = guidance?.suggestedAction === 'server';
                                        const blockOverride = guidance?.blockOverride && user?.role !== 'admin';

                                        const [previewSource, setPreviewSource] = React.useState<'local' | 'server' | null>(null);

                                        const disableLocal = blockOverride && !isLocalSuggested;
                                        const disableServer = blockOverride && !isServerSuggested;

                                        return (
                                            <div key={conflict.field} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">{conflict.field}</span>
                                                    <span className="text-[10px] text-foreground/50 italic">
                                                        by {conflict.remoteActor} {conflict.remoteActorRole ? `(${conflict.remoteActorRole})` : ''}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                                                    {/* Local Value */}
                                                    <div
                                                        className={`flex flex-col gap-2 p-3 rounded-xl border relative transition-colors ${isLocalSuggested ? 'bg-foreground/[0.02] border-foreground/20' :
                                                                previewSource === 'local' ? 'bg-foreground/[0.04] border-foreground/15' :
                                                                    'bg-foreground/[0.01] border-foreground/10'
                                                            }`}
                                                        onMouseEnter={() => setPreviewSource('local')}
                                                        onMouseLeave={() => setPreviewSource(null)}
                                                    >
                                                        {isLocalSuggested && (
                                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-foreground/10 border border-foreground/20 text-foreground/80 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                Policy Aligned
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] uppercase font-bold tracking-widest text-foreground/50 mt-1">Your Change</div>
                                                        <div className={`text-sm font-medium break-all flex-1 ${disableLocal ? 'text-foreground/70' : 'text-foreground'}`}>
                                                            {JSON.stringify(conflict.localValue).replace(/"/g, '')}
                                                        </div>
                                                        <button
                                                            onClick={() => onResolve(taskId, conflict.field, 'local', user)}
                                                            disabled={disableLocal}
                                                            className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors text-xs font-bold
                                                                ${disableLocal
                                                                    ? 'bg-foreground/5 text-foreground/40 cursor-not-allowed'
                                                                    : 'bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground/80 hover:text-foreground'}`}
                                                        >
                                                            <ShieldCheck size={14} /> Keep Mine
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <ArrowRight className="text-foreground/80 w-4 h-4" />
                                                    </div>

                                                    {/* Server Value */}
                                                    <div
                                                        className={`flex flex-col gap-2 p-3 rounded-xl border relative transition-colors ${isServerSuggested ? 'bg-foreground/[0.02] border-foreground/20' :
                                                                previewSource === 'server' ? 'bg-foreground/[0.04] border-foreground/15' :
                                                                    'bg-foreground/[0.01] border-foreground/10'
                                                            }`}
                                                        onMouseEnter={() => setPreviewSource('server')}
                                                        onMouseLeave={() => setPreviewSource(null)}
                                                    >
                                                        {isServerSuggested && (
                                                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-foreground/10 border border-foreground/20 text-foreground/80 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                Policy Aligned
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] uppercase font-bold tracking-widest text-foreground/50 mt-1">Server Change</div>
                                                        <div className={`text-sm font-medium break-all flex-1 ${disableServer ? 'text-foreground/70' : 'text-foreground'}`}>
                                                            {JSON.stringify(conflict.serverValue).replace(/"/g, '')}
                                                        </div>
                                                        <button
                                                            onClick={() => onResolve(taskId, conflict.field, 'server', user)}
                                                            disabled={disableServer}
                                                            className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg transition-colors text-xs font-bold
                                                                ${disableServer
                                                                    ? 'bg-foreground/5 text-foreground/40 cursor-not-allowed'
                                                                    : 'bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 text-foreground/80 hover:text-foreground'}`}
                                                        >
                                                            <DownloadCloud size={14} /> Use Theirs
                                                        </button>
                                                    </div>
                                                </div>

                                                {(guidance || previewSource) && (
                                                    <div className="flex items-start gap-2 text-[11px] text-foreground/70 bg-foreground/5 p-2 rounded-lg mt-2 transition-all duration-300">
                                                        <AlertCircle size={14} className={`shrink-0 mt-0.5 ${previewSource ? 'text-blue-400 animate-pulse' : 'text-blue-400/70'}`} />
                                                        <div className="flex-1">
                                                            {previewSource ? (
                                                                <p className="text-blue-200">
                                                                    <span className="font-bold">Preview:</span> Choosing this will {previewSource === guidance?.suggestedAction ? 'follow' : 'override'} policy. {previewSource === 'local' ? 'Local' : 'Server'} value will be committed.
                                                                </p>
                                                            ) : (
                                                                <p className="leading-snug">{guidance?.reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-foreground/10 bg-surface/30 shrink-0">
                    <p className="text-[11px] text-center text-foreground/80 leading-relaxed">
                        Conflicts occur when another user changes the same field while you are editing it. Your changes are safe until you resolve the conflict.
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
