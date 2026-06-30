import React from "react";

export interface TaskRowProps {
  title: string;
  tag: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  status: "Pending" | "In Progress" | "Completed";
}

export function TaskRow({ title, tag, priority, dueDate, status }: TaskRowProps) {
  const statusColor =
    status === "Completed"  ? "bg-[var(--success)] text-[var(--success)]" :
    status === "In Progress"? "bg-[var(--accent)] text-[var(--accent)]" :
    priority === "High"     ? "bg-[var(--danger)] text-[var(--danger)]" : "bg-[var(--warning)] text-[var(--warning)]";

  const priorityBadge =
    priority === "High"   ? "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20" :
    priority === "Medium" ? "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20" :
                            "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20";

  const statusBadge =
    status === "Completed"   ? "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20" :
    status === "In Progress" ? "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20" :
                               "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border-[var(--border)]";

  return (
    <div className="flex items-center justify-between h-11 px-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] transition-colors duration-150 group relative">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full ${statusColor} shrink-0`} />
        <span className={`text-[13px] font-medium truncate ${status === "Completed" ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]"}`}>
          {title}
        </span>
        <span className="hidden sm:inline text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded border border-[var(--border)] uppercase tracking-wider truncate max-w-[90px]">
          {tag}
        </span>
        <span className={`hidden sm:inline text-[10px] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider ${priorityBadge}`}>
          {priority}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-[var(--text-secondary)] font-mono hidden sm:block">{dueDate}</span>
        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded whitespace-nowrap uppercase tracking-wider ${statusBadge}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

export const TaskSkeleton = () => (
  <div className="animate-pulse flex items-center justify-between h-11 px-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-tertiary)]" />
      <div className="h-4 bg-[var(--bg-tertiary)] rounded w-32" />
    </div>
    <div className="h-5 bg-[var(--bg-tertiary)] rounded w-16" />
  </div>
);
