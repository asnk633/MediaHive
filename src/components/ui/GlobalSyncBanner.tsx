import React, { useEffect, useState } from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';
import type { ConflictCategory } from '@/domain/conflicts/types';
import { useOptimisticTasks } from '@/features/tasks/hooks/useOptimisticTasks';
import { CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalSyncBanner() {
    const { isOnline } = useConnectivity();
    // We can pull the queue status and auth paused state from a dummy hook call
    // However, since useOptimisticTasks is meant to be used where serverTasks are passed,
    // and we need a global observer, we'll implement a lightweight listener here
    // for OfflineQueue length instead of re-mounting the entire tasks hook.

    // For Phase 7A, we will use a custom event or interval to poll the queue length
    const [queueCount, setQueueCount] = useState(0);
    const [isAuthPaused, setIsAuthPaused] = useState(false);

    useEffect(() => {
        // Poll queue count periodically (a more robust event-driven approach is better for production)
        const checkQueue = async () => {
            try {
                const { OfflineQueue } = await import('@/lib/offlineQueue');
                const items = await OfflineQueue.getAll();
                setQueueCount(items.length);
            } catch (e) {
                // ignore
            }
        };

        checkQueue();
        const interval = setInterval(checkQueue, 2000); // Check every 2s
        return () => clearInterval(interval);
    }, []);

    // Listen for the custom "sync:auth_paused" event emitted by useOptimisticTasks
    useEffect(() => {
        const handleAuthPaused = () => setIsAuthPaused(true);
        const handleAuthResumed = () => setIsAuthPaused(false);

        window.addEventListener('sync:auth_paused', handleAuthPaused);
        window.addEventListener('sync:auth_resumed', handleAuthResumed);

        return () => {
            window.removeEventListener('sync:auth_paused', handleAuthPaused);
            window.removeEventListener('sync:auth_resumed', handleAuthResumed);
        };
    }, []);

    // Also visually reflect if we are actively replaying (we can infer this if online and queue > 0, but auth not paused)
    const isReplaying = isOnline && queueCount > 0 && !isAuthPaused;

    if (queueCount === 0 && !isAuthPaused) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className={cn(
                    "fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full shadow-lg border z-[100] flex items-center gap-3 backdrop-blur-md transition-colors duration-500",
                    isAuthPaused
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                        : !isOnline
                            ? "bg-slate-900/80 border-slate-700 text-foreground"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                )}
            >
                {isAuthPaused ? (
                    <AlertCircle size={16} className="animate-pulse" />
                ) : !isOnline ? (
                    <CloudOff size={16} />
                ) : (
                    <Loader2 size={16} className="animate-spin" />
                )}

                <span className="text-sm font-medium tracking-wide">
                    {isAuthPaused
                        ? "Sync paused: Please sign in to save"
                        : !isOnline
                            ? `${queueCount} action${queueCount > 1 ? 's' : ''} queued for sync`
                            : `Syncing ${queueCount} action${queueCount > 1 ? 's' : ''}...`
                    }
                </span>

                {isAuthPaused && (
                    <button
                        onClick={() => {
                            // Helper to refresh page or trigger login modal depending on app structure
                            window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname);
                        }}
                        className="ml-2 text-xs font-bold uppercase bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 rounded transition-colors"
                    >
                        Sign In
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
