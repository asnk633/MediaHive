import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Check, ChevronRight } from "lucide-react";
import { Task } from "@/types/task";
import { useDensityStore } from "@/stores/useDensityStore";
import { useSwipeAction } from "@/hooks/useSwipeAction";
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Archive, CheckCircle2 } from "lucide-react";

interface HomeTaskRowProps {
    task: Task;
    timeContext: string;
    isFirst?: boolean;
    isActive?: boolean; // Phase 36-B
    onClick?: () => void;
    onComplete?: () => void;
}

export function HomeTaskRow({ task, timeContext, isFirst, isActive, onClick, onComplete }: HomeTaskRowProps) {
    const { density } = useDensityStore();
    const isOverdue = task.due_date ? new Date(task.due_date) < new Date() : false;

    const isToday = task.due_date ? new Date(task.due_date).toDateString() === new Date().toDateString() : false;

    const isTomorrow = task.due_date && !isToday && !isOverdue;

    const isInProgress = task.status === 'in_progress';
    const isPendingReview = task.status === 'review';
    const isDone = task.status === 'done';

    // Phase 36-C: Swipe Actions
    const { handlers, style, offset, isSwiping } = useSwipeAction({
        onSwipeRight: async () => {
            await Haptics.notification({ type: NotificationType.Success });
            onComplete?.();
        },
        threshold: 100
    });

    const swipeBackground = offset > 50 ? "bg-emerald-500/20" : offset < -50 ? "bg-amber-500/20" : "bg-transparent";

    return (
        <div className="relative overflow-hidden bg-white/[0.02]">
            {/* Swipe Backdrops */}
            <div className={cn("absolute inset-0 flex items-center justify-between px-6 transition-colors duration-200", swipeBackground)}>
                <div className={cn("flex items-center gap-2 text-emerald-400 transition-opacity", offset > 50 ? "opacity-100" : "opacity-0")}>
                    <CheckCircle2 size={24} /> <span className="font-bold uppercase tracking-wider text-xs">Complete</span>
                </div>
                <div className={cn("flex items-center gap-2 text-amber-400 transition-opacity", offset < -50 ? "opacity-100" : "opacity-0")}>
                    <span className="font-bold uppercase tracking-wider text-xs">Snooze</span> <Archive size={24} />
                </div>
            </div>

            <div
                {...handlers}
                style={style}

                id={`nav-item-${task.id}`} // Phase 36-B for scrolling
                onClick={onClick}
                role="button"
                tabIndex={0}
                data-active={isActive}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
                className={cn(
                    "group relative flex items-center justify-between px-6 bg-white/[0.02] transition-all duration-200 ease-out cursor-pointer overflow-hidden border-b border-white/5 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                    density === 'compact' ? "min-h-[48px] py-2" : "min-h-[64px] max-h-[88px] py-4",
                    "hover:bg-white/[0.06] hover:brightness-[1.1] hover:scale-[1.002] active:scale-[0.98]",
                    "hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.5)] z-0 hover:z-10",
                    isActive && "bg-white/[0.08] ring-1 ring-inset ring-blue-500/50 z-10 scale-[1.002]", // Phase 36-B Active State
                    isOverdue && "border-l-2 border-l-amber-500/50",
                    // Fix B1: Removed opacity-60 from container. Will handle via children classes.
                    isTomorrow && "bg-white/[0.01]"
                )}
            >
                {/* IN PROGRESS INDICATOR (Top Line) */}
                {isInProgress && (
                    <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
                        <div className="h-full bg-blue-400 animate-[progress_2s_infinite_linear]" style={{ width: '30%' }} />
                    </div>
                )}

                <div className="flex flex-col gap-1 max-w-[80%]">
                    <span className={cn(
                        "text-base font-semibold tracking-tight line-clamp-2 leading-[1.3] transition-colors",
                        isFirst ? "text-white" : "text-white/92",
                        isFirst && "group-hover:text-blue-400/90",
                        isTomorrow && "text-white/50"
                    )}>
                        {task.title}
                    </span>

                    <div className="flex items-center gap-2">
                        {/* DUE TODAY INDICATOR */}
                        {isToday && !isOverdue && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                        )}
                        <span className="text-[12px] font-medium text-white/55">
                            {timeContext}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* STATUS ICONS */}
                    <div className="flex items-center justify-end w-6">
                        {isPendingReview && (
                            <Clock size={16} className="text-white/40" />
                        )}
                        {isDone && (
                            <Check size={16} className="text-blue-400" />
                        )}
                    </div>

                    {/* HOVER CHEVRON */}
                    <ChevronRight
                        size={16}
                        className="text-white/20 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
                    />
                </div>

                {/* PROGRESS ANIMATION KEYFRAMES (Inlined via style for simplicity in this component) */}
                <style jsx>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
            </div>
        </div>
    );
}
