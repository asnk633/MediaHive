"use client";

import { motion } from "framer-motion";
import { Users, Briefcase, TrendingUp, LayoutDashboard } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function OperationalPanelsPage() {
  const containerVariants = {
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
          <LayoutDashboard size={14} />
          Operations
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">
          Operational Panels
        </h1>
      </div>

      {/* Production Pulse (Full Width) */}
      <motion.div 
        variants={itemVariants} 
        className="glass-card p-4 flex items-center justify-between rounded-2xl relative overflow-hidden bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] group"
      >
        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500/70" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Standby Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Production Pulse</span>
          <TrendingUp size={14} className="text-zinc-400" />
        </div>
      </motion.div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Crew Schedule */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Crew Schedule</h2>
          <div className="glass-card p-8 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-h-[300px] flex flex-col relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Users size={20} className="text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white">Crew Schedule</div>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-1 mt-8 mb-8 text-zinc-500">
              <Users size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-medium">No personnel scheduled today.</p>
            </div>
          </div>
        </motion.div>

        {/* Equipment Usage */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Equipment Usage</h2>
          <div className="glass-card p-8 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-h-[300px] flex flex-col relative overflow-hidden group">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Briefcase size={20} className="text-indigo-400" />
              </div>
              <div className="text-lg font-bold text-white">Equipment Usage</div>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-1 mt-8 mb-8 text-zinc-500">
              <Briefcase size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-medium">No equipment entries for today.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
