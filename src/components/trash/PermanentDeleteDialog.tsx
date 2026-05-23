'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface PermanentDeleteDialogProps {
    open: boolean;
    count: number;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * PermanentDeleteDialog
 *
 * Heavy confirmation dialog for hard-delete from Trash.
 * Intentionally heavier UX than BulkDeleteDialog:
 * – No undo notice (because there truly is none)
 * – Tab order: Cancel first, Delete Forever second
 * – Deep red accent
 */
export const PermanentDeleteDialog: React.FC<PermanentDeleteDialogProps> = ({
    open,
    count,
    isLoading,
    onConfirm,
    onCancel,
}) => {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Auto-focus Cancel on open
    useEffect(() => {
        if (open) {
            setTimeout(() => cancelRef.current?.focus(), 50);
        }
    }, [open]);

    // Focus trap
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isLoading) { onCancel(); return; }
            if (e.key !== 'Tab') return;
            const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
            if (focusable.length < 2) return;
            if (e.shiftKey) {
                if (document.activeElement === focusable[0]) {
                    e.preventDefault(); focusable[focusable.length - 1].focus();
                }
            } else {
                if (document.activeElement === focusable[focusable.length - 1]) {
                    e.preventDefault(); focusable[0].focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, isLoading, onCancel]);

    const noun = count === 1 ? 'task' : 'tasks';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    onClick={(e) => { if (!isLoading && e.target === e.currentTarget) onCancel(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Dialog */}
                    <motion.div
                        ref={dialogRef}
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="perm-del-title"
                        aria-describedby="perm-del-desc"
                        className="relative z-10 w-full max-w-sm rounded-2xl border border-red-900/40 bg-[#0d0608] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
                        tabIndex={-1}
                    >
                        {/* Top accent bar */}
                        <div className="h-[3px] w-full bg-gradient-to-r from-red-700 via-red-600 to-red-700" />

                        <div className="p-6">
                            {/* Icon + Title */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-red-600/15 border border-red-600/25 flex items-center justify-center">
                                    <Trash2 size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <h2 id="perm-del-title" className="text-base font-bold text-foreground leading-tight">
                                        Delete {count} {noun} forever?
                                    </h2>
                                    <p className="text-[11px] text-foreground/80 mt-0.5 uppercase tracking-wider font-medium">
                                        Permanent — cannot be undone
                                    </p>
                                </div>
                            </div>

                            {/* Warning body */}
                            <div
                                id="perm-del-desc"
                                className="rounded-xl bg-red-950/30 border border-red-900/30 p-4 mb-6"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-[13px] text-red-200/70 leading-relaxed">
                                        {count === 1
                                            ? 'This task will be permanently removed from the database.'
                                            : `These ${count} tasks will be permanently removed from the database.`}{' '}
                                        There is <span className="text-red-400 font-semibold">no recovery</span> after this action.
                                        This is not the same as moving to Trash.
                                    </p>
                                </div>
                            </div>

                            {/* Actions — Cancel first in tab order */}
                            <div className="flex items-center gap-3">
                                <button
                                    ref={cancelRef}
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 border border-foreground/10 hover:bg-foreground/5 hover:text-foreground transition-colors disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <button
                                    ref={confirmRef}
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-foreground bg-red-700 hover:bg-red-600 border border-red-600/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                >
                                    {isLoading ? (
                                        <><div className="w-3.5 h-3.5 rounded-full border-2 border-red-300/30 border-t-white animate-spin" /> Deleting...</>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            Delete Forever
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
