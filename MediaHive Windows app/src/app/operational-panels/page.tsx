"use client";

import { motion } from "framer-motion";
import { Users, Briefcase, TrendingUp, LayoutDashboard } from "lucide-react";

export default function OperationalPanelsPage() {
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
          <LayoutDashboard size={14} />
          Operations
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] m-0">
          Operational Panels
        </h1>
      </div>

      {/* Production Pulse (Full Width) */}
      <motion.div 
        variants={itemVariants} 
        className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 flex items-center justify-between rounded-lg relative overflow-hidden group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Standby Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Production Pulse</span>
          <TrendingUp size={14} className="text-[var(--text-secondary)]" />
        </div>
      </motion.div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Crew Schedule */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Crew Schedule</h2>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 rounded-lg min-h-[300px] flex flex-col relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Users size={20} className="text-blue-400" />
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">Crew Schedule</div>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-1 mt-8 mb-8 text-[var(--text-tertiary)]">
              <Users size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-medium">No personnel scheduled today.</p>
            </div>
          </div>
        </motion.div>

        {/* Equipment Usage */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Equipment Usage</h2>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-8 rounded-lg min-h-[300px] flex flex-col relative overflow-hidden group shadow-sm">
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-10 h-10 rounded-md bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Briefcase size={20} className="text-indigo-400" />
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">Equipment Usage</div>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-1 mt-8 mb-8 text-[var(--text-tertiary)]">
              <Briefcase size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-medium">No equipment entries for today.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
