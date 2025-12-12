import React from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
    title: string;
    date: string;
    icon?: LucideIcon;
    isCompleted?: boolean;
}

export function TaskItem({ title, date, icon: Icon, isCompleted }: TaskItemProps) {
    return (
        <div className="group flex items-center justify-between p-4 bg-[var(--color-bg-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isCompleted
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
                )}>
                    {/* If icon provided use it, else checkbox style */}
                    {Icon ? <Icon size={20} /> : (
                        <div className={cn("w-5 h-5 rounded-md border-2", isCompleted ? "border-green-500 bg-green-500" : "border-gray-300")} />
                    )}
                </div>

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

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                <MoreHorizontal size={20} />
            </button>
        </div>
    );
}
