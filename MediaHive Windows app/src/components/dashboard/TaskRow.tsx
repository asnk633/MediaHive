import React from "react";

/** Static audio-wave separator used between task row cells */
const AudioWaveSeparator = () => (
  <div className="flex items-end gap-[3px] h-4 opacity-25 select-none shrink-0" aria-hidden>
    {[3, 5, 4, 2, 4].map((h, i) => (
      <div key={i} className={`w-[2px] bg-zinc-400 rounded-full`} style={{ height: `${h * 2}px` }} />
    ))}
  </div>
);

export interface TaskRowProps {
  title: string;
  tag: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  status: "Pending" | "In Progress" | "Completed";
}

export function TaskRow({ title, tag, priority, dueDate, status }: TaskRowProps) {
  const statusDotColor =
    status === "Completed"  ? "bg-[#10b981]" :
    status === "In Progress"? "bg-[#3b82f6]" :
    priority === "High"     ? "bg-[#ef4444]" : "bg-[#f59e0b]";

  const priorityBadge =
    priority === "High"   ? "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20" :
    priority === "Medium" ? "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20" :
                            "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20";

  const statusBadge =
    status === "Completed"   ? "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20" :
    status === "In Progress" ? "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20" :
                               "text-zinc-400 bg-zinc-800 border-zinc-700/50";

  return (
    <div className="flex items-center justify-between h-14 px-5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-colors duration-200 group relative task-row-shimmer">
      <div className="absolute inset-y-0 left-0 w-[2px] bg-teal-500/0 group-hover:bg-teal-500/60 rounded-l-xl transition-colors duration-300" />
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full ${statusDotColor} shrink-0 ${(status === "Completed" || status === "In Progress") ? "shadow-[0_0_6px_currentColor]" : ""}`} />
        <span className={`text-[13px] font-medium truncate ${status === "Completed" ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
          {title}
        </span>
        <span className="hidden sm:inline text-[10px] font-semibold font-medium text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded uppercase tracking-wider truncate max-w-[90px]">
          {tag}
        </span>
        <span className={`hidden sm:inline text-[10px] font-semibold border px-2 py-0.5 rounded uppercase tracking-[0.08em] ${priorityBadge}`}>
          {priority}
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <AudioWaveSeparator />
        <span className="text-xs text-zinc-500 tabular-nums hidden sm:block">{dueDate}</span>
        <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusBadge}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export const TaskSkeleton = () => (
  <div className="animate-pulse flex items-center justify-between h-14 px-5 rounded-xl bg-white/[0.02] border border-white/5">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-white/10" />
      <div className="h-4 bg-white/5 rounded w-40" />
    </div>
    <div className="h-5 bg-white/5 rounded-full w-20" />
  </div>
);
