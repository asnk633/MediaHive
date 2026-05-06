
import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Event } from '@/features/events/types/event';
import { Clock, Users, CheckSquare } from 'lucide-react';

interface EventHoverTooltipProps {
    event: Event;
    anchorRect: DOMRect;
    isVisible: boolean;
}

export function EventHoverTooltip({ event, anchorRect, isVisible }: EventHoverTooltipProps) {
    if (!isVisible || !anchorRect) return null;

    const tooltipWidth = 240;
    const tooltipHeight = 120; // Estimated

    let left = anchorRect.left + (anchorRect.width / 2) - (tooltipWidth / 2);
    let top = anchorRect.top - tooltipHeight - 12;

    // Boundary checks
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    if (top < 10) top = anchorRect.bottom + 12;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
                position: 'fixed',
                top,
                left,
                width: tooltipWidth,
                zIndex: 10000,
                pointerEvents: 'none'
            }}
            className="bg-[#1a2235]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-4 flex flex-col gap-2"
        >
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${event.is_system_event ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <h4 className="text-xs font-bold text-white truncate">{event.title}</h4>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <Clock size={12} className="text-blue-400" />
                    <span>
                        {(() => {
                            const formatTime = (t: any) => {
                                if (!t) return '';
                                if (typeof t === 'string') return t;
                                return format(t, 'h:mm a');
                            };
                            const start = formatTime(event.start_at);
                            const end = event.end_at ? ` - ${formatTime(event.end_at)}` : '';
                            return `${start}${end}`;
                        })()}
                    </span>
                </div>
                
                {event.location && (
                    <div className="flex items-center gap-2 text-[10px] text-white/60">
                         <Users size={12} className="text-blue-400" />
                         <span className="truncate">{event.location}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-tighter">
                    <CheckSquare size={12} />
                    <span>Quick Preview Enabled</span>
                </div>
            </div>
        </motion.div>
    );
}
