import React from "react";

export interface ScheduleItemProps {
  title: string;
  time: string;
  category: string;
}

export function ScheduleItem({ title, time, category }: ScheduleItemProps) {
  return (
    <div className="flex items-center justify-between h-11 px-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] transition-colors duration-150 group cursor-pointer relative">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{title}</div>
        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate uppercase tracking-wider font-semibold">{category}</div>
      </div>
      <div className="text-xs font-semibold text-[var(--accent)] shrink-0 font-mono">{time}</div>
    </div>
  );
}

export const ScheduleSkeleton = () => (
  <div className="animate-pulse flex items-center justify-between h-11 px-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <div className="h-3.5 bg-[var(--bg-tertiary)] rounded w-3/4" />
      <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2" />
    </div>
    <div className="h-3.5 bg-[var(--bg-tertiary)] rounded w-12 shrink-0" />
  </div>
);
