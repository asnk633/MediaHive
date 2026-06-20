"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckSquare, Clock, Calendar, Shield, Activity, HardDrive, Cpu } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function InsightsPage() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div>
        <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
          <Activity size={14} />
          Analytics
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">
          Insights
        </h1>
      </div>

      {/* Attention Required */}
      <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-red-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-400">Attention Required</div>
              <div className="text-2xl font-bold text-white">2 Overdue Tasks</div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <ArrowRight size={18} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex flex-col gap-3 z-10 relative">
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex items-center gap-3">
              <Clock size={14} className="text-red-400" />
              <span className="text-sm text-zinc-300">Reel Edit: TPS June 5 video shot on 04-06-2026</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 tracking-wider">MEDIUM</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex items-center gap-3">
              <Clock size={14} className="text-red-400" />
              <span className="text-sm text-zinc-300">Re edit Haneefka's farming video for June 5th status</span>
            </div>
            <span className="text-[10px] font-bold text-red-500 tracking-wider">HIGH</span>
          </div>
        </div>
      </motion.div>

      {/* Global Governance */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Governance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-zinc-400">Pending Approvals</div>
              <CheckSquare size={16} className="text-zinc-500" />
            </div>
            <div className="text-4xl font-extrabold text-white">1</div>
            <div className="text-[10px] text-zinc-500 italic mt-1">As of today</div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-zinc-400">Overdue (Global)</div>
              <Clock size={16} className="text-zinc-500" />
            </div>
            <div className="text-4xl font-extrabold text-white">2</div>
            <div className="text-[10px] text-zinc-500 italic mt-1">As of today</div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-zinc-400">Tasks Created by Me</div>
              <Shield size={16} className="text-zinc-500" />
            </div>
            <div className="text-sm font-bold text-zinc-300 mt-2">0 TASKS CREATED YET</div>
            <div className="text-[10px] text-zinc-500 italic mt-1">Synced moments ago</div>
          </div>
        </div>

        {/* Small Pills Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="glass-card px-4 py-3 rounded-xl bg-black/20 border border-white/5 flex items-center gap-3">
            <Calendar size={16} className="text-zinc-400" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Weekly Events</div>
              <div className="text-xs font-bold text-white">1 Institutional</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl bg-black/20 border border-white/5 flex items-center gap-3">
            <Activity size={16} className="text-zinc-400" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Global Overdue</div>
              <div className="text-xs font-bold text-white">2 Critical</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl bg-black/20 border border-white/5 flex items-center gap-3">
            <Shield size={16} className="text-zinc-400" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Approvals</div>
              <div className="text-xs font-bold text-white">1 Pending</div>
            </div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl bg-black/20 border border-white/5 flex items-center gap-3">
            <CheckSquare size={16} className="text-zinc-400" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Created by Me</div>
              <div className="text-xs font-bold text-white">0 Tasks</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strategic Insights */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Strategic Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <HardDrive size={14} className="text-blue-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-300">Storage & Logic</div>
            </div>
            <div className="flex items-end justify-between mt-6">
              <div>
                <div className="text-4xl font-extrabold text-white">0%</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Inventory Load</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">0</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Items Active</div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-4"></div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <Shield size={14} className="text-red-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-300">System Blockers</div>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-extrabold text-red-400">0</div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">On Hold</div>
              </div>
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-extrabold text-amber-400">0</div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">High Priority</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                <Cpu size={14} className="text-teal-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-300">Reliability Score</div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div>
                <div className="text-4xl font-extrabold text-white">92.9</div>
                <div className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mt-1">Excellent</div>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-zinc-400">SYS</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
