
import React from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Event } from '@/features/events/types/event';

interface EventPreviewCardProps {
    events: Event[];
    date: Date;
    anchorRect?: DOMRect;
    isVisible: boolean;
}

export function EventPreviewCard({ events, date, anchorRect, isVisible }: EventPreviewCardProps) {
    if (!isVisible || events.length === 0 || !anchorRect) return null;

    const PREVIEW_WIDTH = 280;
    const PREVIEW_HEIGHT = 180; // Estimated max height
    
    // Position Logic
    let left = anchorRect.right + 12;
    let top = anchorRect.top + (anchorRect.height / 2) - (PREVIEW_HEIGHT / 2);

    // Handle Viewport Overflow (Right)
    if (left + PREVIEW_WIDTH + 20 > window.innerWidth) {
        left = anchorRect.left - PREVIEW_WIDTH - 12;
    }

    // Handle Viewport Overflow (Top/Bottom)
    top = Math.max(20, Math.min(top, window.innerHeight - PREVIEW_HEIGHT - 20));

    return (
        <motion.div
            initial={{ opacity: 0, x: left > anchorRect.left ? -8 : 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
                position: 'fixed',
                top,
                left,
                width: PREVIEW_WIDTH,
                zIndex: 9999,
                pointerEvents: 'none'
            }}
            className="
                w-64
                bg-[#14192d]/90
                backdrop-blur-xl
                rounded-xl
                border border-white/0.1
                shadow-[0_10px_30px_rgba(0,0,0,0.5)]
                p-3.5
                overflow-hidden
            "
        >
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/0.05 pb-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        Event Preview
                    </span>
                    <span className="text-[10px] text-white/40">
                        {format(date, 'MMM d, yyyy')}
                    </span>
                </div>

                <div className="space-y-2.5">
                    {events.slice(0, 3).map((ev) => {
                        let timeStr = 'All Day';
                        if (ev.start_at) {
                            timeStr = typeof ev.start_at === 'string' ? ev.start_at : format(ev.start_at, 'h:mm a');
                        }

                        const hasConflict = (ev as any).hasConflict;

                        return (
                            <div key={ev.id} className={`group/item flex flex-col gap-0.5 p-1.5 rounded-lg transition-colors ${hasConflict ? 'bg-red-500/10 border border-red-500/20' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-1 rounded-full ${hasConflict ? 'bg-red-500' : (ev as any).is_system_event ? 'bg-secondary' : 'bg-indigo-500'}`} />
                                        <span className={`text-[10px] font-medium ${hasConflict ? 'text-red-300' : 'text-white/50'}`}>{timeStr}</span>
                                    </div>
                                    {hasConflict && (
                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter animate-pulse">
                                            ⚠ Conflict
                                        </span>
                                    )}
                                </div>
                                <div className={`text-[12px] font-medium pl-3 truncate ${hasConflict ? 'text-red-100' : 'text-white/90'}`}>
                                    {ev.title}
                                </div>
                                {hasConflict && (
                                    <div className="pl-3 text-[9px] text-red-400/80 italic leading-tight mt-0.5">
                                        Scheduling conflict detected
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {events.length > 3 && (
                    <div className="pt-1 mt-1 border-t border-white/0.05">
                        <span className="text-[10px] text-indigo-400/80 font-semibold italic">
                            + {events.length - 3} more events
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
