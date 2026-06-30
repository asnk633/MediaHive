"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, XCircle, Clock, Sparkles,
  Eye, RefreshCw, AlertCircle, ArrowUpRight, MessageSquare
} from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const recentApprovals: any[] = [];

  const handleAction = (id: number) => {
    setReviews((prev) => prev.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Proofing
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Reviews & Approvals</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Review creative deliverables, leave feedback, and sign off on campaign materials.
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-3">
          <div className="studio-card px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <Clock size={13} className="text-indigo-400" />
            <span className="text-zinc-300">{reviews.length} Pending</span>
          </div>
          <div className="studio-card px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 size={13} className="text-teal-400" />
            <span className="text-zinc-300">3 Done</span>
          </div>
        </div>
      </header>

      {/* 2. Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Pane: Pending review list (Lg grid span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">Pending Action</h3>
          
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {reviews.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-white/5 bg-zinc-900/10 p-12 text-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto mb-3" />
                  <div className="text-sm font-bold text-zinc-200">You are all caught up!</div>
                  <p className="text-xs text-zinc-500 mt-1 m-0">No deliverables are waiting for your approval.</p>
                </motion.div>
              ) : (
                reviews.map((rev) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={rev.id}
                    className="studio-card rounded-2xl p-5 flex flex-col sm:flex-row gap-5 hover:border-indigo-500/30 hover:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.2)] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-teal-500/20" />
                    {/* Media Thumbnail */}
                    <div className="w-full sm:w-44 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-white/5 relative flex-shrink-0">
                      <img src={rev.thumb} alt={rev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <button className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 border border-white/5 text-zinc-300 transition-colors">
                        <Eye size={12} />
                      </button>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 relative z-10">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-zinc-200 truncate m-0">{rev.title}</h4>
                          <span className="text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {rev.version}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 mb-2">Requested by {rev.requester} • {rev.time}</p>
                        <p className="text-xs text-zinc-400 leading-relaxed m-0">{rev.desc}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5 gap-2">
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">
                          <MessageSquare size={13} />
                          <span>Leave Comment</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAction(rev.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
                          >
                            <XCircle size={13} />
                            <span>Request Changes</span>
                          </button>
                          <button 
                            onClick={() => handleAction(rev.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-xs font-semibold text-teal-400 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={13} />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Pane: Recent Activity Logs */}
        <div className="studio-panel rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-2 relative z-10">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Recent Approvals</h3>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            {recentApprovals.map((app, idx) => (
              <div key={idx} className="studio-card p-3 rounded-xl flex items-center justify-between gap-3 relative z-10">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200 truncate">{app.title}</div>
                  <span className="text-[9px] text-zinc-500 mt-1 block">{app.time}</span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>Approved</span>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

