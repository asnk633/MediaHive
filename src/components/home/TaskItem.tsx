import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
    title: string;
    date: string;
    icon?: LucideIcon;
    isCompleted?: boolean;
}

export function TaskItem({ title, date, icon: Icon, isCompleted: initialCompleted }: TaskItemProps) {
    const [isCompleted, setIsCompleted] = useState(initialCompleted || false);
    const [isHiding, setIsHiding] = useState(false);

    const handleToggleComplete = () => {
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
        <div className="group flex items-center justify-between p-4 bg-[var(--color-bg-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
                <button
                    onClick={handleToggleComplete}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
                        isCompleted
                            ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                    )}
                >
                    {/* If icon provided use it, else checkbox style */}
                    {Icon ? <Icon size={20} /> : (
                        <div className={cn("w-5 h-5 rounded-md border-2 transition-all", isCompleted ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600")} />
                    )}
                </button>

                <div className="flex flex-col">
                    <span className={cn(
                        "text-sm font-semibold text-[var(--color-text-primary)]",
                        isCompleted && "line-through text-[var(--color-text-secondary)]"
                    )}>
                        {title}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {date}
                    </span>
                </div>
            </div>
        </div>
    );
}
