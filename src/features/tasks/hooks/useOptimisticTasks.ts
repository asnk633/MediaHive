// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Task } from "@/features/tasks/types/task";
import { toast } from 'sonner';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useQueryClient } from '@tanstack/react-query';
import { OfflineQueue, QueuedMutation } from '@/lib/offlineQueue';
// task service removed
import { TrashService } from '@/services/trashService';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { ActivityHistory, buildActivityLabel } from '@/lib/activityHistory';
import { evaluatePolicies, PolicyResult } from '@/domain/conflicts/conflictPolicies';
import { TaskService } from '@/services/tasks';
import { canPerformAction, OfflineAction } from '@/lib/offline-contracts';
import { TaskConflict, ConflictCategory } from '@/domain/conflicts/types';

export type SerializableOp = {
    type: 'updateTask' | 'deleteTasks' | 'restoreTasks' | 'assignUsers' | 'bulkOperation';
    args: any[];
};

// Types moved to @/domain/conflicts/types.ts

export function identifyConflictType(field: string, localValue: any, remoteValue: any, wasPatched: boolean): ConflictCategory {
    if (remoteValue === 'DEL' || localValue === 'DEL' || field === 'deleted') return 'structural';
    if (!wasPatched) return 'benign';
    return 'content'; // Field-level collisions that aren't deletions are content conflicts
}

/**
 * useOptimisticTasks
 * 
 * Enforces the Phase 6 strict optimistic mutation pipeline:
 * 1. Snapshot current state
 * 2. Apply optimistic UI update
 * 3. Fire server request (or Queue if offline)
 * 4. Reconcile (Success -> commit, Failure -> rollback + toast)
 */
export function useOptimisticTasks(
    serverTasks: Task[],
    setServerTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
) {
    const queryClient = useQueryClient();
    const { isOnline } = useConnectivity();
    const [optimisticPatches, setOptimisticPatches] = useState<Record<string, Partial<Task> & { isOptimistic: true; isPendingSync?: boolean }>>({});
    const [deferredRemoteUpdates, setDeferredRemoteUpdates] = useState<Record<string, Task>>({});
    const [conflictBuffer, setConflictBuffer] = useState<Record<string, TaskConflict[]>>({});
    const [isReplaying, setIsReplaying] = useState(false);
    const [isAuthPaused, setIsAuthPaused] = useState(false);
    const [isPausedDueToAuth, setIsPausedDueToAuth] = useState(false);
    const [isPausedDueToNetwork, setIsPausedDueToNetwork] = useState(false);

    // Refs for stable callbacks
    const patchesRef = React.useRef(optimisticPatches);
    useEffect(() => { patchesRef.current = optimisticPatches; }, [optimisticPatches]);

    const deferredRef = React.useRef(deferredRemoteUpdates);
    useEffect(() => { deferredRef.current = deferredRemoteUpdates; }, [deferredRemoteUpdates]);

    const conflictBufferRef = React.useRef(conflictBuffer);
    useEffect(() => { conflictBufferRef.current = conflictBuffer; }, [conflictBuffer]);

    // Ref to hold recently successfully synced patches for accurate conflict evaluation
    const recentPatchesRef = React.useRef<Record<string, Partial<Task>>>({});

    const [isBootComplete, setIsBootComplete] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsBootComplete(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    // ── DEV LOGGING ────────────────────────────────────────────────────────
    const logOpt = useCallback((stage: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_OPTIMISTIC === 'true') {
            console.log(`[OptimisticUI::${stage}]`, ...args);
        }
    }, []);

    // ── DISPLAY TASKS ──────────────────────────────────────────────────────
    const displayTasks = useMemo(() => {
        return serverTasks
            .filter(task => {
                const patch = optimisticPatches[task.id];
                return !(patch && (patch as any)._purged === true);
            })
            .map(task => {
                const patch = optimisticPatches[task.id];
                if (patch) {
                    const isDeferred = !!deferredRemoteUpdates[task.id];
                    const hasConflicts = !!conflictBuffer[task.id] && conflictBuffer[task.id].length > 0;
                    return {
                        ...task,
                        ...patch,
                        hasExternalChangePending: isDeferred, // UI Flag for Phase 8
                        hasUnresolvedConflicts: hasConflicts // UI Flag for Phase 9
                    };
                }
                return task;
            });
        // We do NOT filter `deleted: true` here. The parent component (TasksPageClient or TrashView)
        // should apply its own view filters (e.g., hiding deleted tasks in active view).
    }, [serverTasks, optimisticPatches]);

    // Phase 7: Intelligent error classification for retry logic
    function isRetryableError(error: any): boolean {
        // Network errors are retryable
        if (error?.message?.includes('network') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('Network Error') ||
            error?.code === 'NETWORK_ERROR') {
            return true;
        }

        // Server errors (5xx) are retryable
        if (error?.status && error.status >= 500 && error.status < 600) {
            return true;
        }

        // Service unavailable or gateway errors
        if (error?.status === 503 || error?.status === 502 || error?.status === 504) {
            return true;
        }

        // Non-retryable errors (4xx except 401/403 which are handled separately)
        if (error?.status && error.status >= 400 && error.status < 500) {
            // 401/403 are handled by auth guard, 422/400 are validation errors (non-retryable)
            return false;
        }

        // Default: assume retryable for unknown errors
        return true;
    }

    // ── REPLAY EFFECT WITH RETRY LOGIC ──────────────────────────────────────
    useEffect(() => {
        // Only proceed if online, not already replaying, and not paused due to auth
        if (!isOnline || isReplaying || isPausedDueToAuth || isAuthPaused) return;

        const replayQueue = async () => {
            setIsReplaying(true);
            try {
                // Phase 7A: Auth check - we rely on apiClient to fail with 401 if unauthorized,
                // but we can do a quick check here if we want to avoid trying to sync when obviously out.
                // However, for pure API layer, we just let the first call fail.
                // We'll keep the logic but move away from direct supabase call if possible.

                const queue = await OfflineQueue.getAll();
                // Phase 7: Enhanced queue prioritization
                queue.sort((a, b) => {
                    // Primary sort: timestamp (oldest first)
                    const timeDiff = a.timestamp - b.timestamp;
                    if (timeDiff !== 0) return timeDiff;

                    // Secondary sort: delete operations before updates (basic prioritization)
                    const isADelete = a.mutationType === 'deleteTasks' || a.mutationType === 'restoreTasks';
                    const isBDelete = b.mutationType === 'deleteTasks' || b.mutationType === 'restoreTasks';

                    if (isADelete && !isBDelete) return -1;
                    if (!isADelete && isBDelete) return 1;

                    return 0;
                });

                if (queue.length === 0) return;

                logOpt('Replaying offline queue', queue.length, 'items');
                toast(`Syncing ${queue.length} offline changes...`, { duration: 3000 });

                let successCount = 0;
                let failureCount = 0;
                let networkPaused = false;

                for (const mutation of queue) {
                    // Phase 7B: Check global pause states before processing each mutation
                    if (isAuthPaused || isPausedDueToAuth) {
                        logOpt('Replay halted globally due to auth pause');
                        break; // Exit entire replay loop
                    }

                    let retryCount = 0;
                    const maxRetries = 3;
                    let success = false;

                    while (retryCount <= maxRetries && !success) {
                        try {
                            // Phase 7: Add delay for retries (exponential backoff)
                            if (retryCount > 0) {
                                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Cap at 10s
                                logOpt(`Retry ${retryCount}/${maxRetries} for mutation ${mutation.id}, waiting ${delay}ms`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                            }

                            let apiPromise;
                            if (mutation.mutationType === 'updateTask') {
                                apiPromise = TaskService.updateTask(mutation.args![0], mutation.args![1]);
                            } else if (mutation.mutationType === 'assignUsers') {
                                const [taskId] = mutation.args!;
                                apiPromise = TaskService.updateTask(taskId, mutation.payload);
                            } else if (mutation.mutationType === 'restoreTasks') {
                                apiPromise = TrashService.restore(mutation.args![0]);
                            } else if (mutation.mutationType === 'bulkOperation') {
                                apiPromise = BulkOperationsService.performBulkOperation(mutation.args![0], mutation.args![1], mutation.args![2]);
                            } else {
                                throw new Error(`Unknown mutation type: ${mutation.mutationType}`);
                            }

                            // Replay the server request
                            await apiPromise;

                            // Commit local state changes cleanly
                            setServerTasks(prev => prev.map(t => {
                                if (mutation.taskIds.includes(t.id)) {
                                    return { ...t, ...mutation.payload };
                                }
                                return t;
                            }));

                            // Clear the patch now that we're verified
                            setOptimisticPatches(prev => {
                                const next = { ...prev };
                                mutation.taskIds.forEach(id => delete next[id]);
                                return next;
                            });

                            // Invalidate TanStack Query cache
                            queryClient.invalidateQueries({ queryKey: ['tasks'] });

                            // Mark as completed and remove from queue
                            await OfflineQueue.remove(mutation.id);
                            success = true;
                            successCount++;
                            logOpt(`Successfully replayed mutation ${mutation.id} (attempt ${retryCount + 1})`);

                        } catch (err: any) {
                            retryCount++;
                            logOpt(`Failed attempt ${retryCount} for mutation ${mutation.id}:`, err.message);

                            // Phase 7B: Global Auth Failure - Halt Entire Replay
                            if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err?.status === 401) {
                                logOpt('Replay halted globally: 401 Unauthorized detected during sync execution.');
                                setIsAuthPaused(true);
                                setIsPausedDueToAuth(true);
                                if (typeof window !== 'undefined') window.dispatchEvent(new Event('sync:auth_paused'));
                                toast.error("Session expired while syncing. Please login to save remaining changes.", { duration: Infinity });
                                // Phase 7B: Exit ALL loops immediately - global halt
                                return; // Exit the entire replayQueue function
                            }

                            // Phase 7: Intelligent error classification
                            const isRetryable = isRetryableError(err);

                            // Phase 7B: Retry Exhaustion Must PAUSE, Not DELETE
                            if (isRetryable && retryCount <= maxRetries) {
                                // Continue to next retry attempt
                                logOpt(`Retrying mutation ${mutation.id} (${retryCount}/${maxRetries})`);
                                continue;
                            } else if (isRetryable && retryCount > maxRetries) {
                                // Phase 7B: Retryable error exhausted - PAUSE queue, don't delete
                                logOpt(`Retry limit exceeded for mutation ${mutation.id}. Pausing replay due to network instability.`);
                                networkPaused = true;
                                setIsPausedDueToNetwork(true);
                                toast.error(`Network unstable. Sync paused. ${queue.length - successCount - failureCount} changes remain queued.`, { duration: Infinity });
                                // Phase 7B: Exit ALL loops - don't process remaining mutations
                                return; // Exit the entire replayQueue function
                            } else {
                                // Non-retryable error (4xx validation) - safe to remove this specific mutation
                                failureCount++;

                                // Strict rollback for permanent failures
                                setServerTasks(prev => prev.map(t => {
                                    if (mutation.taskIds.includes(t.id) && mutation.snapshot[t.id]) {
                                        return { ...t, ...mutation.snapshot[t.id] };
                                    }
                                    return t;
                                }));

                                setOptimisticPatches(prev => {
                                    const next = { ...prev };
                                    mutation.taskIds.forEach(id => delete next[id]);
                                    return next;
                                });

                                // Phase 7B: Only remove non-retryable errors (4xx), never retryable errors
                                await OfflineQueue.remove(mutation.id);
                                toast.error(`Change failed to sync: ${err.message || 'Invalid request'}`);
                                // Continue to next mutation (only for non-retryable errors)
                                break;
                            }
                        }
                    }
                }

                // Phase 7B: Final status reporting with pause state awareness
                if (networkPaused) {
                    // Don't show completion message when paused due to network issues
                    return;
                }

                if (successCount > 0 || failureCount > 0) {
                    const message = failureCount === 0
                        ? `Sync complete: ${successCount} changes saved`
                        : `Sync partially complete: ${successCount} saved, ${failureCount} failed`;
                    toast(message, {
                        duration: 5000,
                        icon: failureCount === 0 ? '✅' : '⚠️'
                    });
                }

            } finally {
                setIsReplaying(false);
                // Phase 8A: Tell awareness service replay is done to trigger safe buffer flush
                const { awarenessService } = require('@/lib/awarenessService');
                awarenessService.setSystemState({ isReplaying: false });
                awarenessService.processBufferedUpdates();
            }
        };

        replayQueue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, isAuthPaused, isPausedDueToAuth, isPausedDueToNetwork]); // Intentionally minimal deps to only trigger on connectivity flip or auth unpause

    // ── PHASE 8 & 9 & 11: REAL-TIME SYNC & CONFLICT DETECTION ──────────────────
    const syncRemoteTasks = useCallback((newTasks: Task[], currentUser: any) => {
        let detectedConflicts: TaskConflict[] = [];

        // Phase 8A: Update awareness service system state
        const { awarenessService } = require('@/lib/awarenessService');
        awarenessService.setSystemState({
            isOffline: !isOnline,
            isReplaying: isReplaying,
            isPaused: isPausedDueToAuth || isAuthPaused
        });

        setDeferredRemoteUpdates(prevDeferred => {
            const nextDeferred = { ...prevDeferred };
            let deferredChanged = false;

            setServerTasks(prevServerTasks => {
                const finalTasks: Task[] = [];
                const prevTasksMap = new Map(prevServerTasks.map(t => [t.id, t]));
                const currentPatches = patchesRef.current;

                newTasks.forEach(newTask => {
                    const hasPatch = !!currentPatches[newTask.id];
                    const hasRecentCommit = !!recentPatchesRef.current[newTask.id];
                    const oldTask = prevTasksMap.get(newTask.id);

                    // Phase 8A: Process awareness updates BEFORE applying task changes
                    if (oldTask) {
                        awarenessService.processTaskUpdate(newTask, oldTask, currentUser, hasPatch);
                    }

                    if (hasPatch || hasRecentCommit) {
                        // Defer this update so we don't clobber the optimistic UI
                        // OR a recently committed mutation (within 5s grace window).
                        finalTasks.push(oldTask || newTask); // Keep old server state for now

                        // Check if it's an external update
                        const isExternal = newTask.updatedBy?.uid && newTask.updatedBy.uid !== currentUser?.uid;

                        if (isExternal || !nextDeferred[newTask.id]) {
                            nextDeferred[newTask.id] = newTask;
                            deferredChanged = true;
                        }
                    } else {
                        // Safe to apply directly
                        finalTasks.push(newTask);
                        if (nextDeferred[newTask.id]) {
                            delete nextDeferred[newTask.id];
                            deferredChanged = true;
                        }
                    }
                });


                return finalTasks;
            });

            return deferredChanged ? nextDeferred : prevDeferred;
        });

        // Buffer newly detected conflicts
        if (detectedConflicts.length > 0) {
            setConflictBuffer(prev => {
                const next = { ...prev };
                let hasNew = false;
                detectedConflicts.forEach(conflict => {
                    const existing = next[conflict.taskId] || [];
                    if (!existing.find(c => c.field === conflict.field && JSON.stringify(c.serverValue) === JSON.stringify(conflict.serverValue))) {
                        next[conflict.taskId] = [...existing, conflict];
                        hasNew = true;
                    }
                });
                if (hasNew) {
                    toast('Some tasks need your attention', { icon: '⚠️', duration: 4000 });
                }
                return hasNew ? next : prev;
            });
        }
    }, [setServerTasks, isOnline, isReplaying, isPausedDueToAuth, isAuthPaused]);

    // Phase 8B: Guarding Detection Mechanics (The Strict Gate)
    useEffect(() => {
        // Prevent detection logic from firing synchronously on Page Load/Boot.
        if (!isBootComplete) return;

        // Inject `isOnline && !isReplaying && !isPaused && !hasPatch` gate directly into trigger logic
        if (!isOnline || isReplaying || isPausedDueToAuth || isPausedDueToNetwork || isAuthPaused) return;

        let detectedConflicts: TaskConflict[] = [];

        Object.keys(deferredRemoteUpdates).forEach(taskId => {
            const hasPatch = !!optimisticPatches[taskId];
            // 8B Strict Gate: Do not evaluate conflicts while mid-edit
            if (hasPatch) return;

            const localState = serverTasks.find(t => t.id === taskId);
            const remoteState = deferredRemoteUpdates[taskId];

            if (localState && remoteState) {
                // Find deeply unequal fields
                const keys = Array.from(new Set([...Object.keys(localState), ...Object.keys(remoteState)]));
                const recentPatch = recentPatchesRef.current[taskId] || {};
                const benignUpdates: Partial<Task> = {};

                keys.forEach(field => {
                    // Ignore metadata flutter
                    if (['updatedAt', 'connectedAt', 'isOverdue', 'smartMetadata', 'isOptimistic', 'isPendingSync'].includes(field)) return;

                    const localValue = (localState as any)[field];
                    const remoteValue = (remoteState as any)[field];

                    if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
                        const wasPatched = field in recentPatch;
                        const category = identifyConflictType(field, localValue, remoteValue, wasPatched);

                        if (category === 'benign') {
                            // Automatically accept mathematically safe incoming state
                            (benignUpdates as any)[field] = remoteValue;
                            return;
                        }

                        const conflict: TaskConflict = {
                            taskId,
                            field,
                            category,
                            localValue,
                            serverValue: remoteValue,
                            remoteActor: remoteState.updatedBy?.name || 'Another user',
                            remoteActorRole: remoteState.updatedBy?.role,
                            timestamp: Date.now()
                        };

                        detectedConflicts.push(conflict);
                    }
                });

                // Silently patch the local snapshot with benign server values
                if (Object.keys(benignUpdates).length > 0) {
                    setServerTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...benignUpdates } : t));
                }
            }
        });

        if (detectedConflicts.length > 0) {
            const newConflictsToPersist: TaskConflict[] = [];
            const currentConflictBuffer = conflictBufferRef.current;

            detectedConflicts.forEach(conflict => {
                const existing = currentConflictBuffer[conflict.taskId] || [];
                if (!existing.find(c => c.field === conflict.field && JSON.stringify(c.serverValue) === JSON.stringify(conflict.serverValue))) {
                    newConflictsToPersist.push(conflict);
                }
            });

            if (newConflictsToPersist.length > 0) {
                // Phase 8B: Persist the conflict to the persistent store safely outside the setter
                const { conflictStore } = require('@/lib/conflictStore');
                newConflictsToPersist.forEach(conflict => {
                    conflictStore.addConflict({
                        taskId: conflict.taskId,
                        field: conflict.field,
                        category: conflict.category,
                        localValue: conflict.localValue,
                        serverValue: conflict.serverValue,
                        remoteActor: conflict.remoteActor,
                        remoteActorRole: conflict.remoteActorRole,
                        timestamp: conflict.timestamp,
                        policyGuidance: conflict.policyGuidance
                    }).catch((error: any) => {
                        console.error('[ConflictStore] Failed to persist conflict:', error);
                    });
                });

                // Pure state update
                setConflictBuffer(prev => {
                    const next = { ...prev };
                    newConflictsToPersist.forEach(conflict => {
                        const existing = next[conflict.taskId] || [];
                        if (!existing.find(c => c.field === conflict.field && JSON.stringify(c.serverValue) === JSON.stringify(conflict.serverValue))) {
                            next[conflict.taskId] = [...existing, conflict];
                        }
                    });
                    return next;
                });

                toast('Conflicts detected from recent remote updates.', { icon: '⚠️', duration: 5000 });
            }

            // Clear deferred updates that have been processed to prevent looping
            setDeferredRemoteUpdates(prev => {
                const next = { ...prev };
                detectedConflicts.forEach(c => delete next[c.taskId]);
                return next;
            });
        }

    }, [
        deferredRemoteUpdates,
        optimisticPatches,
        serverTasks,
        isBootComplete,
        isOnline,
        isReplaying,
        isPausedDueToAuth,
        isPausedDueToNetwork,
        isAuthPaused
    ]);

    const mutate = useCallback(async (
        taskIds: string[],
        updates: Partial<Task>,
        apiCall: () => Promise<any>,
        options?: {
            errorMessage?: string;
            successMessage?: string;
            serializableOp?: SerializableOp; // REQUIRED for offline Phase 7
        }
    ) => {
        if (!taskIds.length) return;

        // Check offline contract based on mutation type
        let actionType: OfflineAction = 'update_task';
        if (options?.serializableOp) {
            switch (options.serializableOp.type) {
                case 'updateTask':
                    actionType = 'update_task';
                    break;
                case 'deleteTasks':
                    actionType = 'delete_task';
                    break;
                case 'assignUsers':
                    actionType = 'assign_task';
                    break;
                default:
                    actionType = 'update_task';
            }
        }

        // Check if the action is allowed in the current connectivity state
        const actionCheck = canPerformAction(actionType, isOnline);
        if (!actionCheck.allowed) {
            toast.error(actionCheck.reason || `Action "${actionType}" is not allowed in offline mode`);
            return;
        }

        // Prevent overlapping mutations on the same tasks
        const hasOverlap = taskIds.some(id => !!optimisticPatches[id]);
        if (hasOverlap) {
            logOpt('Blocked', 'Overlapping mutation detected on tasks:', taskIds);
            // We could queue here, but the simplest safe approach is to block or just let it override.
            // Requirement 8: "New mutations must Queue or block until reconciliation completes"
            toast.error("Please wait for the previous action to complete.");
            return;
        }

        // 1 & 2. SNAPSHOT + APPLY
        logOpt('Snapshot & Apply', { taskIds, updates });
        const snapshot: Record<string, Partial<Task>> = {};

        setOptimisticPatches(prev => {
            const next = { ...prev };
            taskIds.forEach(id => {
                const existingTask = serverTasks.find(t => t.id === id);
                if (existingTask) {
                    // Save rollback state
                    snapshot[id] = Object.keys(updates).reduce((acc, key) => {
                        (acc as any)[key] = (existingTask as unknown as any)[key];
                        return acc;
                    }, {} as Partial<Task>);
                }
                next[id] = { ...updates, isOptimistic: true, isPendingSync: !isOnline };
            });
            return next;
        });

        // Track if this is a hard deletion to handle in Reconcile
        const isHardDelete = options?.serializableOp?.type === 'deleteTasks' || (updates as any)._purged === true;

        // If offline, queue and return
        if (!isOnline && options?.serializableOp) {
            const mutation: QueuedMutation = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                mutationType: options.serializableOp.type,
                taskIds,
                payload: updates,
                snapshot,
                status: 'pending',
                args: options.serializableOp.args
            } as QueuedMutation & { args: any[] };

            await OfflineQueue.put(mutation);
            toast("You are currently offline. Change queued.");
            return;
        }

        if (!isOnline && !options?.serializableOp) {
            // Cannot be queued, rollback
            setOptimisticPatches(prev => {
                const next = { ...prev };
                taskIds.forEach(id => delete next[id]);
                return next;
            });
            toast.error("You are offline and this action cannot be queued.");
            return;
        }

        // 3. FIRE SERVER REQUEST
        logOpt('Fire API', { taskIds });
        try {
            await apiCall();

            // 4. RECONCILE (SUCCESS)
            logOpt('Reconcile', 'Success');

            // Commit to serverTasks
            setServerTasks(prev => {
                if (isHardDelete) {
                    return prev.filter(t => !taskIds.includes(t.id));
                }
                return prev.map(t => {
                    if (taskIds.includes(t.id)) {
                        return { ...t, ...updates };
                    }
                    return t;
                });
            });

            // Store in transient memory for strict evaluation gate to pick up
            taskIds.forEach(id => {
                recentPatchesRef.current[id] = { ...recentPatchesRef.current[id], ...updates };
                // Memory clears after 5s to prevent ghost conflicts
                setTimeout(() => { if (recentPatchesRef.current[id]) delete recentPatchesRef.current[id]; }, 5000);
            });

            // Clear patches
            setOptimisticPatches(prev => {
                const next = { ...prev };
                taskIds.forEach(id => delete next[id]);
                return next;
            });

            // Invalidate TanStack Query cache
            queryClient.invalidateQueries({ queryKey: ['tasks'] });

            // DO NOT clear deferredRemoteUpdates! The strict gate hook MUST evaluate them!

            if (options?.successMessage) {
                // If there's a success message, we show it. 
                // Mostly handled by callers, but helpful if passed in.
                toast.success(options.successMessage);
            }

        } catch (err: any) {
            // 4. RECONCILE (FAILURE / ROLLBACK)
            logOpt('Rollback', 'API Failed', err);

            // Clear patches to revert to clean server state
            setOptimisticPatches(prev => {
                const next = { ...prev };
                taskIds.forEach(id => delete next[id]);
                return next;
            });

            // If a deferred remote update arrived while we were trying to save,
            // we should apply it now that our patch is gone.
            setServerTasks(prev => prev.map(t => {
                if (taskIds.includes(t.id) && deferredRef.current[t.id]) {
                    return deferredRef.current[t.id];
                }
                return t;
            }));

            setDeferredRemoteUpdates(prev => {
                const next = { ...prev };
                let changed = false;
                taskIds.forEach(id => {
                    if (next[id]) {
                        delete next[id];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });

            // Show error
            toast.error(options?.errorMessage || err.message || "Action failed. Reverting changes.");
        }
    }, [optimisticPatches, serverTasks, setServerTasks, isOnline, logOpt]);

    const resolveConflict = useCallback(async (taskId: string, field: string, choice: 'local' | 'server', user: any) => {
        const taskConflicts = conflictBuffer[taskId];
        if (!taskConflicts) return;

        const conflict = taskConflicts.find(c => c.field === field);
        if (!conflict) return;

        // Remove conflict from UI buffer immediately
        setConflictBuffer(prev => {
            const next = { ...prev };
            if (!next[taskId]) return next;
            next[taskId] = next[taskId].filter(c => c.field !== field);
            if (next[taskId].length === 0) delete next[taskId];
            return next;
        });

        // Phase 8B: Update persistent conflict store
        const { conflictStore } = require('@/lib/conflictStore');
        const persistentConflicts = await conflictStore.getConflicts({ taskId, field });
        for (const persistentConflict of persistentConflicts) {
            await conflictStore.resolveConflict(persistentConflict.id, choice, user?.uid || 'unknown');
        }

        // Phase 11 & Phase 8B: Determine policy string for logging
        let policyLogString = '';
        if (conflict.policyGuidance) {
            if (conflict.policyGuidance.suggestedAction === choice) {
                policyLogString = ' (Followed policy)';
            } else if (conflict.policyGuidance.suggestedAction !== 'none') {
                policyLogString = ' (Overrode policy)';
            }
        }

        if (choice === 'local') {
            // Keep Mine: Re-queue as a mutation safely, leveraging 7A offline queue
            mutate([taskId], { [field]: conflict.localValue }, () => TaskService.updateTask(taskId, { [field]: conflict.localValue }), {
                serializableOp: { type: 'updateTask', args: [taskId, { [field]: conflict.localValue }] },
                successMessage: `Re-applied your change to ${field}`
            });

            ActivityHistory.push(taskId, {
                action: 'conflict_resolved',
                label: `Resolved conflict: Kept local value for ${field}${policyLogString}`,
                actorUid: user?.uid ?? 'system',
                actorName: user?.name ?? 'System',
                scope: 1,
            });
        } else {
            // Use Theirs: Drop local patch for this field and accept server truth
            setOptimisticPatches(prevPatches => {
                const nextPatches = { ...prevPatches };
                if (nextPatches[taskId]) {
                    delete (nextPatches[taskId] as any)[field];
                    const keys = Object.keys(nextPatches[taskId]).filter(k => k !== 'isOptimistic' && k !== 'isPendingSync');
                    if (keys.length === 0) delete nextPatches[taskId];
                }
                return nextPatches;
            });

            setServerTasks(prevTasks => prevTasks.map(t =>
                t.id === taskId ? { ...t, [field]: conflict.serverValue } : t
            ));

            toast.success(`Accepted remote change for ${field}`);

            ActivityHistory.push(taskId, {
                action: 'conflict_resolved',
                label: `Resolved conflict: Accepted remote value for ${field}${policyLogString}`,
                actorUid: user?.uid ?? 'system',
                actorName: user?.name ?? 'System',
                scope: 1,
            });
        }
    }, [conflictBuffer, setConflictBuffer, mutate, setOptimisticPatches, setServerTasks]);

    const resumeReplay = async () => {
        if (isPausedDueToAuth || isAuthPaused) {
            // Simply attempt to resume; if it fails again with 401, it will pause again.
            setIsPausedDueToAuth(false);
            setIsAuthPaused(false);
            toast.success("Attempting to resume sync...", { duration: 2000 });

            // Trigger replay by changing online state
            if (typeof window !== 'undefined' && navigator.onLine) {
                window.dispatchEvent(new Event('online'));
            }
        }

        if (isPausedDueToNetwork) {
            setIsPausedDueToNetwork(false);
            toast.success("Network stable. Resuming sync...", { duration: 2000 });

            // Trigger replay by changing online state
            if (typeof window !== 'undefined' && navigator.onLine) {
                window.dispatchEvent(new Event('online'));
            }
        }
    };

    const getQueueStatus = async () => {
        const queue = await OfflineQueue.getAll();
        return {
            count: queue.length,
            pausedDueToAuth: isPausedDueToAuth,
            pausedDueToNetwork: isPausedDueToNetwork,
            isReplaying: isReplaying,
            isOnline: isOnline
        };
    };

    return {
        displayTasks,
        mutate,
        syncRemoteTasks,
        isReplaying,
        isPausedDueToAuth,
        isPausedDueToNetwork,
        isAuthPaused,
        resumeReplay,
        getQueueStatus,
        conflictBuffer,
        resolveConflict,
        optimisticPatches, // exposed for advanced checks if needed
    };
}
