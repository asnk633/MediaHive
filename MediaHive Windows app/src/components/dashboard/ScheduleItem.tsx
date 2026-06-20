import React from "react";

export interface ScheduleItemProps {
  title: string;
  time: string;
  category: string;
}

export function ScheduleItem({ title, time, category }: ScheduleItemProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer relative schedule-item-shimmer">
      <div className="absolute inset-y-0 left-0 w-[2px] bg-indigo-500/0 group-hover:bg-indigo-500/60 rounded-l-xl transition-colors duration-300" />
      <div className="min-w-0 pl-1">
        <div className="text-xs font-semibold text-zinc-200 truncate">{title}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{category}</div>
      </div>
      <div className="text-xs font-medium text-teal-400 shrink-0">{time}</div>
    </div>
  );
}

export const ScheduleSkeleton = () => (
  <div className="animate-pulse flex items-center justify-between h-14 px-4 rounded-xl bg-white/[0.02] border border-white/5">
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="h-3.5 bg-white/5 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
    <div className="h-3.5 bg-white/5 rounded w-14 shrink-0" />
  </div>
);
