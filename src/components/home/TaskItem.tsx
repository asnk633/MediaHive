import React, { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, CheckSquare, Clock } from "lucide-react";
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex items-center justify-between p-5 bg-[#18181B] border border-[#242427] rounded-[24px] transition-all duration-normal hover:border-accent-primary/20 shadow-lg hover:shadow-neumorphic-raised select-none overflow-hidden"
        >
            <div className="flex items-center gap-5 z-10 relative">
                <button
                    onClick={handleToggleComplete}
                    disabled={disableCompletion}
                    className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-normal border shadow-soft",
                        disableCompletion && "cursor-not-allowed opacity-20",
                        isCompleted
                            ? "bg-[#242427] border-white/5 text-accent-primary shadow-neumorphic-inset"
                            : "bg-[#242427] border-white/5 text-[#71717A] hover:text-accent-primary shadow-neumorphic-raised"
                    )}
                >
                    {Icon ? <Icon size={20} strokeWidth={2.5} /> : (
                        <div className={cn("w-4 h-4 rounded-md border-2 transition-all",
                            isCompleted ? "border-accent-primary bg-accent-primary scale-90" : "border-white/10 group-hover:border-accent-primary/40 bg-transparent")}
                        >
                            {isCompleted && <CheckSquare size={14} className="text-[#18181B] -ml-[2px] -mt-[2px]" />}
                        </div>
                    )}
                </button>

                <div className="flex flex-col">
                    <span className={cn(
                        "text-[15px] font-bold tracking-tight transition-all duration-normal",
                        isCompleted
                            ? "line-through text-[#71717A]/40"
                            : "text-[#F4F4F5] group-hover:text-accent-primary"
                    )}>
                        {title}
                    </span>
                    <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-2">
                            <Clock size={12} className="text-[#71717A] group-hover:text-accent-primary/60 transition-colors" />
                            <span className="text-[11px] font-bold text-[#71717A] opacity-60">
                                {date}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-all duration-normal transform translate-x-3 group-hover:translate-x-0 relative z-10">
                <button className="w-9 h-9 flex items-center justify-center text-[#71717A] hover:text-white bg-[#242427] border border-white/5 rounded-xl shadow-neumorphic-raised hover:bg-[#323236] transition-all">
                    <MoreHorizontal size={18} />
                </button>
            </div>
        </motion.div>
    );
}
