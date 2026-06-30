"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Sparkles, Download, Calendar,
  TrendingUp, Activity, FileText, ArrowDownToLine
} from "lucide-react";

export default function ReportsPage() {
  const exports: any[] = [];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Analytics Engine
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Reports</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            View system telemetry, storage utilization ratios, and team efficiency metrics.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer">
          <Download size={16} />
          <span>Export Stats</span>
        </button>
      </header>

      {/* 2. Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage Growth SVG Chart */}
        <motion.div 
          className="lg:col-span-2 studio-card rounded-2xl p-6 flex flex-col justify-between min-h-[300px] hover:border-indigo-500/30 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none transition-all group-hover:bg-teal-500/20" />
          <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 m-0">Monthly Task Output</h3>
              <p className="text-[10px] text-zinc-500 m-0 mt-0.5">Tasks completed per month</p>
            </div>
            <TrendingUp size={16} className="text-teal-400" />
          </div>

          {/* Custom SVG Bar Graph */}
          <div className="flex-1 flex items-end gap-3 h-32 w-full pt-4">
            {[0, 0, 0, 0, 0, 0, 0].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 1, delay: idx * 0.05 }}
                  className="w-full bg-gradient-to-t from-indigo-600/50 to-teal-500/80 rounded-t-lg relative group"
                >
                  <div className="absolute -top-6 left-1/2 -translate-y-0 -translate-x-1/2 bg-zinc-950/80 border border-white/10 px-1 rounded text-[8px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {height}
                  </div>
                </motion.div>
                <span className="text-[9px] text-zinc-500 font-bold">M{idx + 1}</span>
              </div>
            ))}
            </div>
          </div>
        </motion.div>

        {/* Storage breakdown gauge card */}
        <div className="studio-card rounded-2xl p-6 flex flex-col justify-between min-h-[300px] group relative overflow-hidden transition-all hover:border-indigo-500/30">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none transition-all group-hover:bg-indigo-500/20" />
          <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-200 m-0">Storage Allocation</h3>
            <Activity size={16} className="text-indigo-400" />
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            {/* Custom SVG Donut Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="50" className="stroke-zinc-800" strokeWidth="10" fill="transparent" />
                <motion.circle 
                  cx="64" cy="64" r="50" 
                  className="stroke-teal-500" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={314}
                  initial={{ strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 - (314 * 0.65) }}
                  transition={{ duration: 1.2 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">0%</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">No Data</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around border-t border-white/5 pt-4">
            <div className="text-center">
              <div className="text-sm font-bold text-teal-400">0%</div>
              <div className="text-[9px] text-zinc-500">Video Rushes</div>
            </div>
            <div className="w-px h-6 bg-white/5"></div>
            <div className="text-center">
              <div className="text-sm font-bold text-indigo-400">0%</div>
              <div className="text-[9px] text-zinc-500">Other Assets</div>
            </div>
          </div>
          </div>
        </div>

      </div>

      {/* 3. Export History list */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">Report Exports</h3>
        
        <div className="flex flex-col gap-2.5">
          {exports.map((exp, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl studio-card transition-all cursor-pointer group hover:shadow-[0_4px_20px_-4px_rgba(79,70,229,0.15)] hover:border-indigo-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-[30px] rounded-full pointer-events-none transition-all group-hover:bg-teal-500/15" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-teal-400">
                  <FileText size={14} />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{exp.title}</div>
                  <span className="text-[9px] text-zinc-500 mt-1 block">{exp.date} • {exp.size}</span>
                </div>
              </div>

              <button className="p-2 rounded-xl bg-zinc-950/40 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-teal-400 transition-all cursor-pointer relative z-10">
                <ArrowDownToLine size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

