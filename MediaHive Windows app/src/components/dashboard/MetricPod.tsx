import React from "react";
import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export type StatusKey = "pending" | "working" | "completed" | "urgent";

export const STATUS_CONFIG: Record<StatusKey, {
  label: string; fill: string; text: string;
  accent: string; glow: string; strip: string; scanTint: string;
}> = {
  urgent:    { label: "Urgent",    fill: "bg-rose-500",    text: "text-rose-400",    accent: "#f43f5e", glow: "rgba(244,63,94,0.22)",   strip: "rgba(244,63,94,0.9)",   scanTint: "rgba(244,63,94,0.04)" },
  working:   { label: "Working",   fill: "bg-blue-500",    text: "text-blue-400",    accent: "#3b82f6", glow: "rgba(59,130,246,0.22)",  strip: "rgba(59,130,246,0.9)",  scanTint: "rgba(59,130,246,0.04)" },
  pending:   { label: "Pending",   fill: "bg-amber-500",   text: "text-amber-400",   accent: "#f59e0b", glow: "rgba(245,158,11,0.22)",  strip: "rgba(245,158,11,0.9)",  scanTint: "rgba(245,158,11,0.04)" },
  completed: { label: "Completed", fill: "bg-emerald-500", text: "text-emerald-400", accent: "#10b981", glow: "rgba(16,185,129,0.22)",  strip: "rgba(16,185,129,0.9)",  scanTint: "rgba(16,185,129,0.04)" },
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
      className="glass-card-premium metric-pod-depth metric-pod-glass relative flex flex-col overflow-hidden group"
      style={{ height: 204, padding: 0, borderTop: `2px solid ${cfg.strip}` }}
    >
      <GlowingEffect spread={50} glow proximity={80} inactiveZone={0.01} />

      {/* Status-color ambient glow flood at top */}
      <div
        className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-[1]"
        style={{ background: `radial-gradient(ellipse 90% 120% at 20% -10%, ${cfg.glow} 0%, transparent 65%)` }}
      />

      {/* Horizontal scan-line texture for instrument depth */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${cfg.scanTint} 0px, ${cfg.scanTint} 1px, transparent 1px, transparent 5px)`,
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col justify-between h-full" style={{ padding: "18px 20px 0 20px" }}>

        {/* Title + status badge */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{title}</span>
          <span
            className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-[3px] rounded-full ${cfg.text}`}
            style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}30` }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Big neon number */}
        <div className="flex items-end gap-0 leading-none">
          {loading
            ? <div className="h-14 w-20 bg-white/5 rounded-xl animate-pulse" />
            : (
              <span
                className="font-black tabular-nums select-none text-metric-hero"
                style={{
                  color: cfg.accent,
                  textShadow: `0 0 30px ${cfg.glow}, 0 0 60px ${cfg.scanTint}`,
                }}
              >
                {value}
              </span>
            )
          }
        </div>

        {/* Completion label + percentage */}
        <div className="flex items-center justify-between pb-[14px]">
          <span className="text-[9px] text-zinc-600 uppercase tracking-[0.14em]">Completion</span>
          {loading
            ? <span className="inline-block h-3 w-8 bg-white/5 rounded animate-pulse" />
            : <span className={`text-[11px] font-bold tabular-nums ${cfg.text}`}>{percentage}%</span>
          }
        </div>
      </div>

      {/* Flush bottom progress rail — no padding, bleeds to edges */}
      <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-white/[0.04]">
        <motion.div
          className={`h-full ${cfg.fill}`}
          initial={{ width: 0 }}
          animate={{ width: loading ? "0%" : `${percentage}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ boxShadow: `0 0 8px ${cfg.accent}` }}
        />
      </div>
    </div>
  );
}
