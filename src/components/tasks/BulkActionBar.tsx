'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/features/tasks/types/task';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { UserService } from '@/services/userService';
import { toast } from 'sonner';
import {
    X,
    CheckCircle2,
    Clock,
    AlertCircle,
    Circle,
    Flag,
    Users,
    Trash2,
    ChevronDown,
    CheckCircle,
    RotateCcw,
} from 'lucide-react';
import {
    canEditPriority,
    canChangeStatus,
    canAssignTask,
    canManageAllTasks
} from '@/lib/permissions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { BulkDeleteDialog } from './BulkDeleteDialog';
import { UndoManager, buildSnapshot, UndoOperation } from '@/lib/undoManager';
import { ActivityHistory, buildActivityLabel } from '@/lib/activityHistory';


interface BulkActionBarProps {
    selectedCount: number;
    selectedIds: ReadonlySet<string>;
    tasks: Task[];
    user: any;
    onClear: () => void;
    onOperationComplete: () => void;
    onTaskMutate?: (
        taskIds: string[],
        updates: Partial<Task>,
        apiCall: () => Promise<any>,
        options?: { errorMessage?: string; successMessage?: string; serializableOp?: any; }
    ) => Promise<void>;
    mode?: 'default' | 'trash';
    onRestore?: (ids: string[]) => Promise<void>;
    onPermanentDelete?: (ids: string[]) => void;
    isLoading?: boolean;
}

type ActiveOp = 'delete' | null;

import { usePermissions } from '@/hooks/usePermissions';

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
    selectedCount,
    selectedIds,
    tasks,
    user,
    onClear,
    onOperationComplete,
    onTaskMutate,
    mode = 'default',
    onRestore,
    onPermanentDelete,
    isLoading: externalLoading = false,
}) => {
    const { 
        canChangeStatus: checkCanChangeStatus, 
        canAssignTask: canAssign, 
        canDeleteTask: canPermDelete,
        role: userRole 
    } = usePermissions();

    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = localLoading || externalLoading;
    const [activeOp, setActiveOp] = useState<ActiveOp>(null);
    const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const selectedTasks = tasks.filter(t => selectedIds.has(t.id));
    
    // Permission calculations
    const canStatus = selectedTasks.every(t => checkCanChangeStatus(t));
    const canPriority = ['admin', 'manager'].includes(userRole);
    const canDelete = selectedTasks.every(t => {
        const isCreator = (typeof t.created_by === 'string' ? t.created_by : t.created_by?.uid) === user?.uid;
        return ['admin', 'manager'].includes(userRole) || isCreator;
    });
    const canRestore = ['admin', 'manager', 'member', 'team'].includes(userRole);
    const canPermanentDelete = canPermDelete;

    // Determine if user has any available actions
    const hasAnyAction = mode === 'trash'
        ? (canRestore || canPermanentDelete)
        : (canStatus || canPriority || canAssign || canDelete);

    const selectedIdsArray = Array.from(selectedIds);

    // Member / empty — guard evaluated after all hooks (Rules of Hooks requires hooks
    // to run unconditionally; we move the guard below the useCallback declarations).

    const loadTeamMembers = async () => {
        if (teamMembers.length > 0) return;
        setMembersLoading(true);
        try {
            const members = await UserService.getTeamMembers(null);
            setTeamMembers(members);
        } catch {
            toast.error('Failed to load team members');
        } finally {
            setMembersLoading(false);
        }
    };

    const runOperation = useCallback(async (
        operation: 'changePriority' | 'changeStatus' | 'assign' | 'delete',
        value: string
    ) => {
        if (isLoading) return;

        const validation = BulkOperationsService.validateBulkOperation(
            selectedIdsArray,
            operation
        );

        console.log(`[Authority][Bulk] runOperation. Role: ${userRole}, Op: ${operation}, Targets: ${selectedIdsArray.length}`);

        // Individual guards for better feedback
        if (operation === 'delete' && !canDelete) {
            console.warn(`[Authority][Bulk] Delete BLOCKED for ${userRole}.`);
            toast.error("You do not have permission to delete these tasks.");
            return;
        }

        if ((operation === 'changeStatus' || operation === 'changePriority' || operation === 'assign') && !['admin', 'manager'].includes(userRole)) {
            console.warn(`[Authority][Bulk] ${operation} BLOCKED for ${userRole}.`);
            toast.error(`You do not have permission to ${operation === 'assign' ? 'assign' : 'change ' + (operation === 'changeStatus' ? 'status' : 'priority')} in bulk.`);
            return;
        }

        if (!validation.isValid) {
            toast.error(validation.message);
            return;
        }

        if (operation === 'delete') {
            setActiveOp('delete');
            return; // handled by confirm dialog
        }

        // ── Capture pre-mutation snapshot ──────────────────────────────
        const affectedTasks = tasks.filter(t => selectedIds.has(t.id));
        const snapshot = buildSnapshot(affectedTasks, operation as UndoOperation);

        // Build optimistic state
        let optimisticUpdates: Partial<Task> = {};
        if (operation === 'changeStatus') optimisticUpdates.status = value as any;
        if (operation === 'changePriority') optimisticUpdates.priority = value as any;
        if (operation === 'assign') {
            const member = teamMembers.find(m => m.uid === value);
            if (member) optimisticUpdates.assigned_to = [member];
        }

        // Use standard pipeline if available, else fallback to manual handling
        if (onTaskMutate) {
            await onTaskMutate(
                selectedIdsArray,
                optimisticUpdates,
                async () => {
                    const result = await BulkOperationsService.performBulkOperation(
                        selectedIdsArray,
                        operation,
                        value
                    );
                    if (!result.success) throw new Error(result.message);

                    // Log & Undo
                    const action = operation === 'changeStatus' ? 'status_changed' :
                        operation === 'changePriority' ? 'priority_changed' : 'assigned';
                    ActivityHistory.pushBulk(selectedIdsArray, {
                        action,
                        label: buildActivityLabel(action, value, selectedIdsArray.length),
                        actorUid: user?.uid ?? '',
                        actorName: user?.name ?? 'Admin',
                    });
                    const entryId = UndoManager.push({
                        operation: operation as any,
                        snapshot,
                        taskIds: selectedIdsArray,
                    });

                    onOperationComplete();

                    toast.success(`${selectedCount} ${selectedCount === 1 ? 'task' : 'tasks'} updated`, {
                        action: {
                            label: 'Undo',
                            onClick: async () => {
                                const entry = UndoManager.consume(entryId);
                                if (!entry) return;

                                // Phase 7: Check if it's in the offline queue (undelivered)
                                // We use dynamic import or just standard call to our OfflineQueue
                                const { OfflineQueue } = await import('@/lib/offlineQueue');
                                const allQueued = await OfflineQueue.getAll();
                                // Find the most recent queue item for these exact task IDs
                                const queuedMatch = allQueued.reverse().find(q =>
                                    q.taskIds.length === selectedIdsArray.length &&
                                    q.taskIds.every(id => selectedIdsArray.includes(id))
                                );

                                if (queuedMatch) {
                                    // It's offline! Just remove it from queue.
                                    await OfflineQueue.remove(queuedMatch.id);
                                    toast.success("Offline queued action cancelled.");
                                    // The user may need to refresh or the optimistic patch will just silently die 
                                    // when they reload. For instant UI reversal, we'd need to trigger a context reload.
                                    window.dispatchEvent(new Event('offline-undo'));
                                    return;
                                }

                                // Else, synced. Fire inverse.
                                toast.promise(async () => {
                                    // Restore from snapshot
                                    // This requires a targeted BulkOperationsService inverse 
                                    // For simplicity in this demo, we can reject or implement a best-effort inverse
                                    throw new Error("Inverse networked undo not fully implemented");
                                }, {
                                    loading: 'Reverting...',
                                    success: 'Reverted successfully',
                                    error: 'Undo failed'
                                });
                            }
                        }
                    });
                    return result;
                },
                {
                    serializableOp: { type: 'bulkOperation', args: [selectedIdsArray, operation, value] } as any
                }
            );
            return;
        }

        // Legacy fallback
        setLocalLoading(true);
        try {
            const result = await BulkOperationsService.performBulkOperation(selectedIdsArray, operation, value);
            if (result.success) {
                const action = operation === 'changeStatus' ? 'status_changed' : operation === 'changePriority' ? 'priority_changed' : 'assigned';
                ActivityHistory.pushBulk(selectedIdsArray, { action, label: buildActivityLabel(action, value, selectedIdsArray.length), actorUid: user?.uid ?? '', actorName: user?.name ?? 'Admin' });
                UndoManager.push({ operation: operation as UndoOperation, snapshot, taskIds: selectedIdsArray });
                toast.success(`${selectedCount} ${selectedCount === 1 ? 'task' : 'tasks'} updated`);
                onOperationComplete();
            } else {
                toast.error(result.message || 'Operation failed.');
            }
        } catch {
            toast.error('Operation failed. Please try again.');
        } finally {
            setLocalLoading(false);
        }
    }, [isLoading, selectedIdsArray, selectedIds, tasks, selectedCount, user, onOperationComplete, onTaskMutate, teamMembers, userRole, canDelete]);

    const confirmDelete = useCallback(async () => {
        console.log(`[Authority][Bulk] confirmDelete triggered. Role: ${userRole}`);
        if (!canDelete) {
            console.warn(`[Authority][Bulk] confirmDelete BLOCKED for ${userRole}.`);
            toast.error("You do not have permission to perform this action.");
            setActiveOp(null);
            return;
        }
        // ── Capture pre-mutation snapshot ──────────────────────────────
        const affectedTasks = tasks.filter(t => selectedIds.has(t.id));
        const snapshot = buildSnapshot(affectedTasks, 'delete');

        if (onTaskMutate) {
            await onTaskMutate(
                selectedIdsArray,
                { deleted: true }, // Optimistic soft delete
                async () => {
                    const result = await BulkOperationsService.performBulkOperation(selectedIdsArray, 'delete', 'DELETE');
                    if (!result.success) throw new Error(result.message);
                    ActivityHistory.pushBulk(selectedIdsArray, { action: 'deleted', label: buildActivityLabel('deleted', undefined, selectedIdsArray.length), actorUid: user?.uid ?? '', actorName: user?.name ?? 'Admin' });
                    const entryId = UndoManager.push({ operation: 'delete', snapshot, taskIds: selectedIdsArray });
                    onOperationComplete();
                    setActiveOp(null);

                    toast.success(`${selectedCount} ${selectedCount === 1 ? 'task' : 'tasks'} deleted`, {
                        action: {
                            label: 'Undo',
                            onClick: async () => {
                                const entry = UndoManager.consume(entryId);
                                if (!entry) return;
                                const { OfflineQueue } = await import('@/lib/offlineQueue');
                                const allQueued = await OfflineQueue.getAll();
                                const queuedMatch = allQueued.reverse().find(q =>
                                    q.mutationType === 'bulkOperation' && q.args?.[1] === 'delete' &&
                                    q.taskIds.length === selectedIdsArray.length &&
                                    q.taskIds.every(id => selectedIdsArray.includes(id))
                                );

                                if (queuedMatch) {
                                    await OfflineQueue.remove(queuedMatch.id);
                                    toast.success("Offline queued delete cancelled.");
                                    window.dispatchEvent(new Event('offline-undo'));
                                    return;
                                }
                                throw new Error("Inverse networked undo not fully implemented for delete");
                            }
                        }
                    });

                    return result;
                },
                {
                    serializableOp: { type: 'bulkOperation', args: [selectedIdsArray, 'delete', 'DELETE'] } as any
                }
            );
            return;
        }

        // Legacy fallback
        setLocalLoading(true);
        try {
            const result = await BulkOperationsService.performBulkOperation(
                selectedIdsArray,
                'delete',
                'DELETE'
            );
            if (result.success) {
                ActivityHistory.pushBulk(selectedIdsArray, { action: 'deleted', label: buildActivityLabel('deleted', undefined, selectedIdsArray.length), actorUid: user?.uid ?? '', actorName: user?.name ?? 'Admin' });
                UndoManager.push({ operation: 'delete', snapshot, taskIds: selectedIdsArray });
                toast.success(`${selectedCount} ${selectedCount === 1 ? 'task' : 'tasks'} deleted`);
                onOperationComplete();
                setActiveOp(null);
            } else {
                toast.error(result.message || 'Delete failed. Please try again.');
            }
        } catch {
            toast.error('Delete failed. Please try again.');
        } finally {
            setLocalLoading(false);
        }
    }, [selectedIdsArray, selectedIds, tasks, selectedCount, user, onOperationComplete, onTaskMutate]);
    // Now safe to bail out — all hooks have run.
    if (selectedCount === 0 || !hasAnyAction) return null;

    return (
        <>
            <AnimatePresence>
                <motion.div
                    key="bulk-action-bar"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="fixed left-1/2 -translate-x-1/2 z-[55]"
                    style={{ bottom: 'calc(var(--bottom-nav-height, 88px) + 12px)' }}
                    role="toolbar"
                    aria-label={`Bulk actions for ${selectedCount} selected tasks`}
                >
                    <div className="bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
                        {/* 4.1 — Bulk Action Progress Feedback (UI-P1) */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 origin-left z-10"
                                >
                                    <div className="absolute inset-0 bg-blue-400 animate-pulse" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main toolbar */}
                        <div className="flex items-center gap-1 p-2">

                            {/* Selected count badge */}
                            <div className="bg-blue-500/10 text-blue-400 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mr-1 ml-1 shrink-0">
                                {selectedCount} Selected
                            </div>

                            <div className="w-px h-5 bg-white/5 mx-1 shrink-0" />

                            {mode === 'trash' ? (
                                <>
                                    <button
                                        onClick={() => onRestore?.(selectedIdsArray)}
                                        disabled={isLoading}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400/50 hover:text-emerald-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-emerald-500/10 disabled:opacity-40"
                                    >
                                        <RotateCcw size={13} /> Restore
                                    </button>
                                    {canPermanentDelete && (
                                        <button
                                            onClick={() => onPermanentDelete?.(selectedIdsArray)}
                                            disabled={isLoading}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/5 hover:bg-red-500/15 text-red-500/50 hover:text-red-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-red-500/10 disabled:opacity-40"
                                        >
                                            <Trash2 size={13} /> Delete Forever
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Status action */}
                                    {canStatus && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    aria-label="Bulk change status"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Status
                                                    <ChevronDown className="w-3 h-3 opacity-40" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-white/50">Set status to</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => runOperation('changeStatus', 'todo')}>
                                                    <Circle size={13} className="mr-2 text-slate-400" /> To Do
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => runOperation('changeStatus', 'in_progress')}>
                                                    <Clock size={13} className="mr-2 text-blue-400" /> Working
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => runOperation('changeStatus', 'review')}>
                                                    <AlertCircle size={13} className="mr-2 text-amber-400" /> On Hold
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => runOperation('changeStatus', 'done')}>
                                                    <CheckCircle2 size={13} className="mr-2 text-emerald-400" /> Completed
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    {/* Priority action */}
                                    {canPriority && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    aria-label="Bulk change priority"
                                                >
                                                    <Flag className="w-3.5 h-3.5" />
                                                    Priority
                                                    <ChevronDown className="w-3 h-3 opacity-40" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[140px]">
                                                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-white/50">Set priority to</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => runOperation('changePriority', 'urgent')}>
                                                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2" /> Urgent
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => runOperation('changePriority', 'high')}>
                                                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" /> High
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => runOperation('changePriority', 'medium')}>
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2" /> Medium
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => runOperation('changePriority', 'low')}>
                                                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" /> Low
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    {/* Assign action (admin only) */}
                                    {canAssign && (
                                        <DropdownMenu onOpenChange={(open) => { if (open) loadTeamMembers(); }}>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                                    aria-label="Bulk assign team member"
                                                >
                                                    <Users className="w-3.5 h-3.5" />
                                                    Assign
                                                    <ChevronDown className="w-3 h-3 opacity-40" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[180px] max-h-[200px] overflow-y-auto">
                                                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-white/50">Assign to</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {membersLoading ? (
                                                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                                                ) : teamMembers.length === 0 ? (
                                                    <DropdownMenuItem disabled>No team members</DropdownMenuItem>
                                                ) : (
                                                    teamMembers.map(m => (
                                                        <DropdownMenuItem
                                                            key={m.uid}
                                                            onClick={() => runOperation('assign', m.uid)}
                                                        >
                                                            {m.name}
                                                        </DropdownMenuItem>
                                                    ))
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    {/* Delete action (admin only) */}
                                    {canDelete && (
                                        <>
                                            <div className="w-px h-5 bg-white/5 mx-1 shrink-0" />
                                            <button
                                                onClick={() => setActiveOp('delete')}
                                                disabled={isLoading}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/5 hover:bg-red-500/15 text-red-500/50 hover:text-red-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                                aria-label="Bulk delete selected tasks"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                            <div className="w-px h-5 bg-white/5 mx-1 shrink-0" />

                            {/* Clear selection */}
                            <button
                                onClick={onClear}
                                disabled={isLoading}
                                className="p-2 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
                                aria-label="Clear selection"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Delete confirmation dialog — renders above everything at z-70 */}
            {
                canDelete && (
                    <BulkDeleteDialog
                        open={activeOp === 'delete'}
                        count={selectedCount}
                        isLoading={isLoading}
                        onConfirm={confirmDelete}
                        onCancel={() => setActiveOp(null)}
                    />
                )
            }
        </>);
};
