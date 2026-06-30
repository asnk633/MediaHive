import React from "react";
import { motion } from "framer-motion";

export type StatusKey = "pending" | "working" | "completed" | "urgent";

export const STATUS_CONFIG: Record<StatusKey, {
  label: string;
  text: string;
  border: string;
  bg: string;
  barColor: string;
}> = {
  urgent:    { label: "Urgent",    text: "text-[var(--danger)]",  border: "border-[var(--danger)]/30", bg: "bg-[var(--danger)]/10", barColor: "bg-[var(--danger)]" },
  working:   { label: "Working",   text: "text-[var(--accent)]",  border: "border-[var(--accent)]/30", bg: "bg-[var(--accent)]/10", barColor: "bg-[var(--accent)]" },
  pending:   { label: "Pending",   text: "text-[var(--warning)]", border: "border-[var(--warning)]/30", bg: "bg-[var(--warning)]/10", barColor: "bg-[var(--warning)]" },
  completed: { label: "Completed", text: "text-[var(--success)]", border: "border-[var(--success)]/30", bg: "bg-[var(--success)]/10", barColor: "bg-[var(--success)]" },
};

export interface MetricPodProps {
  title: string;
  value: string | number;
  percentage: number;
  status: StatusKey;
  loading?: boolean;
}

export function MetricPod({ title, value, percentage, status, loading }: MetricPodProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg relative flex flex-col justify-between overflow-hidden p-3 h-[120px] transition-colors duration-150 hover:border-[var(--accent)]"
    >
      {/* Title + status badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</span>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-[2px] rounded border ${cfg.text} ${cfg.border} ${cfg.bg}`}
        >
          {cfg.label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-end leading-none my-1">
        {loading ? (
          <div className="h-6 w-12 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        ) : (
          <span className="font-bold text-[22px] text-[var(--text-primary)] font-mono tabular-nums leading-none">
            {value}
          </span>
        )}
      </div>

      {/* Completion */}
      <div className="flex items-center justify-between text-[11px] mb-2">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Completion</span>
        {loading ? (
          <span className="h-3.5 w-6 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        ) : (
          <span className={`font-semibold font-mono tabular-nums ${cfg.text}`}>{percentage}%</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${cfg.barColor}`}
          initial={{ width: 0 }}
          animate={{ width: loading ? "0%" : `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
