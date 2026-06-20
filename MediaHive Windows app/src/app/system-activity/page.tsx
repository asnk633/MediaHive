"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  HardDrive, Sparkles, Server, Cpu, 
  Terminal, ShieldCheck, RefreshCcw
} from "lucide-react";

export default function SystemActivityPage() {
  const syncLogs = [
    { time: "20:55:12", status: "Success", task: "Database index compression", duration: "12ms" },
    { time: "20:50:00", status: "Success", task: "Asset sync: 24 new files cached", duration: "2.4s" },
    { time: "20:45:10", status: "Success", task: "Roles mapping table synced", duration: "8ms" },
    { time: "20:30:00", status: "Success", task: "Automated integrity check", duration: "15ms" }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
          <Sparkles size={14} />
          Engine Telemetry
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">System Activity</h1>
        <p className="text-zinc-400 m-0 text-sm mt-1">
          Track database sync engines, local cache sizes, and background process logs.
        </p>
      </header>

      {/* Grid Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sync Status */}
        <div className="bg-zinc-900/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sync Status</span>
            <div className="text-sm font-bold text-zinc-200 mt-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span>Fully Synchronized</span>
            </div>
          </div>
          <Server className="text-teal-400 w-6 h-6" />
        </div>
        {/* Cache memory */}
        <div className="bg-zinc-900/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Database Cache</span>
            <div className="text-sm font-bold text-zinc-200 mt-1">42.5 MB (Healthy)</div>
          </div>
          <Cpu className="text-indigo-400 w-6 h-6" />
        </div>
      </div>

      {/* Console log rows */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0 flex items-center gap-2">
            <Terminal size={14} />
            Background Logs
          </h3>
          <span className="text-[9px] text-zinc-500">Live feed</span>
        </div>

        <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-zinc-400 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
          {syncLogs.map((log, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-start sm:items-center gap-2">
                <span className="text-zinc-600">[{log.time}]</span>
                <span className="text-emerald-400 font-semibold">{log.status}</span>
                <span className="text-zinc-300">{log.task}</span>
              </div>
              <span className="text-zinc-500 text-right">{log.duration}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
