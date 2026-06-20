"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Sparkles, Calendar, Box,
  Clock, AlertTriangle, ArrowRight, User, CheckCircle2
} from "lucide-react";

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<any[]>([]);

  const handleResolve = (id: number) => {
    setConflicts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Operations Room
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Conflicts</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Track and resolve asset shortages, double bookings, and timeline overlaps.
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert size={13} className="text-red-400 animate-pulse" />
          <span className="text-zinc-300">{conflicts.length} Active Overlaps</span>
        </div>
      </header>

      {/* Conflicts List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {conflicts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-white/5 bg-zinc-900/10 p-12 text-center"
            >
              <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto mb-3" />
              <div className="text-sm font-bold text-zinc-200">No conflicts found</div>
              <p className="text-xs text-zinc-500 mt-1 m-0">All schedules, equipment booking, and resource allotments are clear.</p>
            </motion.div>
          ) : (
            conflicts.map((conf) => {
              const Icon = conf.icon;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  key={conf.id}
                  className={`border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 hover:border-white/10 transition-all ${conf.color.split(' ')[2]}`}
                >
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-300 h-fit self-start">
                    <Icon size={20} />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{conf.type}</span>
                          <h4 className="text-sm font-bold text-zinc-200 mt-1 m-0">{conf.title}</h4>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full ${
                          conf.severity === "High" ? "bg-red-500/15 text-red-400 border-red-500/25" : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                        }`}>
                          {conf.severity} Severity
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 m-0">{conf.desc}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-white/5">
                      <button 
                        onClick={() => handleResolve(conf.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-xs font-semibold text-teal-400 transition-colors cursor-pointer"
                      >
                        <span>Resolve Conflict</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
