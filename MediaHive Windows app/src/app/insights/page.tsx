"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckSquare, Clock, Calendar, Shield, Activity, HardDrive, Cpu } from "lucide-react";

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
        <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-semibold tracking-wider uppercase mb-1">
          <Activity size={14} />
          Analytics
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] m-0">
          Insights
        </h1>
      </div>

      {/* Attention Required */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-secondary)] border border-red-500/20 rounded-lg p-6 relative overflow-hidden group shadow-sm">
        <div className="flex items-center justify-between mb-6 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-400">Attention Required</div>
              <div className="text-xl font-bold text-[var(--text-primary)]">2 Overdue Tasks</div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center transition-colors cursor-pointer">
            <ArrowRight size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 z-10 relative">
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-3">
              <Clock size={14} className="text-red-400" />
              <span className="text-sm text-[var(--text-secondary)]">Reel Edit: TPS June 5 video shot on 04-06-2026</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 tracking-wider font-mono">MEDIUM</span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-3">
              <Clock size={14} className="text-red-400" />
              <span className="text-sm text-[var(--text-secondary)]">Re edit Haneefka's farming video for June 5th status</span>
            </div>
            <span className="text-[10px] font-bold text-red-500 tracking-wider font-mono">HIGH</span>
          </div>
        </div>
      </motion.div>

      {/* Global Governance */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Global Governance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[var(--text-secondary)]">Pending Approvals</div>
              <CheckSquare size={16} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">1</div>
            <div className="text-[10px] text-[var(--text-tertiary)] italic mt-1">As of today</div>
          </div>
          
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[var(--text-secondary)]">Overdue (Global)</div>
              <Clock size={16} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">2</div>
            <div className="text-[10px] text-[var(--text-tertiary)] italic mt-1">As of today</div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[var(--text-secondary)]">Tasks Created by Me</div>
              <Shield size={16} className="text-[var(--text-tertiary)]" />
            </div>
            <div className="text-sm font-bold text-[var(--text-secondary)] mt-2 uppercase tracking-wide">0 Tasks Created</div>
            <div className="text-[10px] text-[var(--text-tertiary)] italic mt-1">Synced moments ago</div>
          </div>
        </div>

        {/* Small Pills Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 rounded-lg flex items-center gap-3">
            <Calendar size={16} className="text-[var(--text-secondary)]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">Weekly Events</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">1 Institutional</div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 rounded-lg flex items-center gap-3">
            <Activity size={16} className="text-[var(--text-secondary)]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">Global Overdue</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">2 Critical</div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 rounded-lg flex items-center gap-3">
            <Shield size={16} className="text-[var(--text-secondary)]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">Approvals</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">1 Pending</div>
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 rounded-lg flex items-center gap-3">
            <CheckSquare size={16} className="text-[var(--text-secondary)]" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">Created by Me</div>
              <div className="text-xs font-bold text-[var(--text-primary)]">0 Tasks</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strategic Insights */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Strategic Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-md bg-[var(--accent-wash)] flex items-center justify-center">
                <HardDrive size={14} className="text-[var(--accent)]" />
              </div>
              <div className="text-sm font-semibold text-[var(--text-secondary)]">Storage & Logic</div>
            </div>
            <div className="flex items-end justify-between mt-6">
              <div>
                <div className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">0%</div>
                <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Inventory Load</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[var(--text-primary)] font-mono">0</div>
                <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Items Active</div>
              </div>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-4 overflow-hidden">
              <div className="bg-[var(--accent)] h-full w-0" />
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center">
                <Shield size={14} className="text-red-400" />
              </div>
              <div className="text-sm font-semibold text-[var(--text-secondary)]">System Blockers</div>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md p-3 text-center">
                <div className="text-2xl font-bold text-red-400 font-mono">0</div>
                <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">On Hold</div>
              </div>
              <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md p-3 text-center">
                <div className="text-2xl font-bold text-amber-400 font-mono">0</div>
                <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">High Priority</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-md bg-[var(--accent-wash)] flex items-center justify-center">
                <Cpu size={14} className="text-[var(--accent)]" />
              </div>
              <div className="text-sm font-semibold text-[var(--text-secondary)]">Reliability Score</div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div>
                <div className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">92.9</div>
                <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mt-1">Excellent</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] font-mono">SYS</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
