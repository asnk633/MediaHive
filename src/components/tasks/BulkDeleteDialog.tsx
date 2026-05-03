'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';

interface BulkDeleteDialogProps {
    open: boolean;
    count: number;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * BulkDeleteDialog
 *
 * A full-screen modal confirmation dialog for bulk task deletion.
 * Responsibilities:
 *  - Focus trap: focuses the Cancel button on open
 *  - Escape key: cancels the dialog
 *  - Accessible: role="dialog", aria-modal, aria-labelledby, aria-describedby
 *  - Precise copy: exact title + count-aware body per spec
 *  - No partial state: caller owns all async state
 */
export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
    open,
    count,
    isLoading,
    onConfirm,
    onCancel,
}) => {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);

    // Auto-focus Cancel on open (safer default than Confirm for a destructive dialog)
    useEffect(() => {
        if (open) {
            // Slight delay to let the animation begin before focus shift
            const t = setTimeout(() => cancelRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [open]);

    // Escape key cancels
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Escape' && !isLoading) {
                e.stopPropagation();
                onCancel();
            }
            // Trap Tab within dialog
            if (e.key === 'Tab') {
                const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLButtonElement[];
                if (focusable.length < 2) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
                } else {
                    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
            }
        },
        [isLoading, onCancel]
    );

    const taskWord = count === 1 ? 'task' : 'tasks';

    return (
        <AnimatePresence>
            {open && (
                // Backdrop
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center px-4"
                    style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}
                    onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
                    aria-hidden="true"
                >
                    {/* Dialog panel */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bulk-delete-title"
                        aria-describedby="bulk-delete-desc"
                        initial={{ scale: 0.94, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 8 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="w-full max-w-sm bg-[#0D111A] border border-white/10 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden"
                        onKeyDown={handleKeyDown}
                        aria-hidden="false"
                        tabIndex={-1}
                    >
                        {/* Red accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

                        <div className="px-6 pt-6 pb-5 space-y-4">
                            {/* Icon + Title */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </div>
                                <div>
                                    <h2
                                        id="bulk-delete-title"
                                        className="text-sm font-bold text-white leading-tight"
                                    >
                                        Delete selected {taskWord}?
                                    </h2>
                                    <p
                                        id="bulk-delete-desc"
                                        className="mt-1.5 text-[13px] text-white/50 leading-relaxed"
                                    >
                                        You are about to delete <span className="text-white/80 font-semibold">{count} {taskWord}</span>.
                                        {' '}This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            {/* Warning note */}
                            <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span className="text-[11px] text-red-400/80">
                                    All selected tasks will be permanently removed.
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    ref={cancelRef}
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-[12px] font-semibold text-white/50 hover:text-white hover:bg-white/[0.08] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    ref={confirmRef}
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-[12px] font-semibold text-white transition-all shadow-[0_4px_16px_rgba(220,38,38,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-live="polite"
                                >
                                    {isLoading ? 'Deleting…' : `Delete ${count} ${taskWord}`}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
