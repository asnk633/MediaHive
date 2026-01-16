import React, { useState } from "react";
import { MoreHorizontal, CheckSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
    title: string;
    date: string;
    icon?: LucideIcon;
    isCompleted?: boolean;
    disableCompletion?: boolean;
}

export function TaskItem({ title, date, icon: Icon, isCompleted: initialCompleted, disableCompletion }: TaskItemProps) {
    const [isCompleted, setIsCompleted] = useState(initialCompleted || false);
    const [isHiding, setIsHiding] = useState(false);

    const handleToggleComplete = () => {
        // If completion is disabled, do nothing
        if (disableCompletion) return;

        setIsCompleted(!isCompleted);

        // If marking as complete, hide the item after animation
        if (!isCompleted) {
            setTimeout(() => setIsHiding(true), 300);
        }
    };

    if (isHiding) {
        return null;
    }

    return (
        <div className="group relative flex items-center justify-between p-4 bg-surface backdrop-blur-sm rounded-xl transition-all duration-300 hover-sheen overflow-hidden text-white shadow-sm hover:shadow-md hover:bg-card">
            <div className="flex items-center gap-4 z-10 relative">
                <button
                    onClick={handleToggleComplete}
                    disabled={disableCompletion}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border backdrop-blur-sm",
                        disableCompletion && "cursor-not-allowed opacity-50",
                        isCompleted
                            ? "bg-green-500/20 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                            : "bg-glass border-soft text-muted hover:bg-primary/10 hover:border-strong hover:text-primary"
                    )}
                >
                    {/* If icon provided use it, else checkbox style */}
                    {Icon ? <Icon size={20} /> : (
                        <div className={cn("w-5 h-5 rounded-md border-2 transition-all",
                            isCompleted ? "border-green-500 bg-green-500 scale-90" : "border-soft group-hover:border-primary/50 bg-transparent")}
                        >
                            {isCompleted && <CheckSquare size={16} className="text-white -ml-[2px] -mt-[2px]" />}
                        </div>
                    )}
                </button>

                <div className="flex flex-col">
                    <span className={cn(
                        "text-sm font-semibold transition-colors duration-300",
                        isCompleted
                            ? "line-through text-muted decoration-gray-600"
                            : "text-primary/80 group-hover:text-primary"
                    )}>
                        {title}
                    </span>
                    <span className="text-xs font-medium tracking-wide transition-colors px-2 py-0.5 rounded-lg w-fit mt-1 border bg-glass border-soft text-muted group-hover:text-secondary">
                        {date}
                    </span>
                </div>
            </div>

            {/* Right chevron or action indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 text-white/20 group-hover:text-white/50">
                <MoreHorizontal size={20} />
            </div>
        </div>
    );
}