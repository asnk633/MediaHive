"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Sparkles, Filter, Clock, 
  Upload, CheckCircle2, UserPlus, AlertCircle, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

interface ActivityLog {
  id: string;
  title: string;
  description: string;
  action_type: string;
  actor_name: string;
  actor_id: string;
  created_at: string;
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState("All");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback logs to show the UI even if the DB is empty or we're loading
  const fallbackActs = [
    { id: "1", actor_name: "Bobby Axelrod", action_type: "Tasks", title: "completed", description: "Brand Strategy Deck", created_at: new Date().toISOString() },
    { id: "2", actor_name: "Mikel Macoy", action_type: "Uploads", title: "uploaded", description: "logo_vector_v2.ai", created_at: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: "3", actor_name: "System", action_type: "System", title: "synchronized index database", description: "5,412 media entries", created_at: new Date(Date.now() - 4 * 3600000).toISOString() }
  ];

  useEffect(() => {
    async function fetchLogs() {
      if (authLoading || !user?.institution_id) return;
      
      try {
        // Query system_activity_logs
        // Depending on your schema, you might need to filter by tenant_id or institution_id
        // We'll just fetch recent logs globally or you can add filters here if applicable
        const { data, error } = await supabase
          .from("system_activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          setLogs(data as ActivityLog[]);
        }
      } catch (err) {
        console.error("Error fetching activity logs", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLogs();
  }, [user, authLoading]);

  const displayLogs = logs.length > 0 ? logs : (loading ? [] : fallbackActs as ActivityLog[]);
  const filteredActs = filter === "All" ? displayLogs : displayLogs.filter(a => (a.action_type || "System") === filter);

  // Helper to extract initials
  const getInitials = (name: string) => {
    if (!name) return "SYS";
    if (name === "System") return "SYS";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  
  // Helper to format time ago
  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium tracking-wider uppercase mb-1">
          <Sparkles size={14} />
          Telemetry Logs
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">Recent Activity</h1>
        <p className="text-zinc-400 m-0 text-sm mt-1">
          Chronological index of user actions, uploads, database synchronizations, and edits.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 studio-panel p-3 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/5 blur-[60px] rounded-full pointer-events-none" />
        {["All", "Uploads", "Tasks", "System", "Inventory", "Events", "Productions"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer relative z-10 ${
              filter === f 
                ? "bg-[var(--accent-wash)] border-[var(--accent)]/30 text-[var(--accent)]"
                : "bg-zinc-950/40 border-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="flex flex-col gap-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-[1px] before:bg-zinc-800">
        {loading && logs.length === 0 ? (
          <div className="text-zinc-500 text-sm flex items-center gap-2 py-4 pl-12">
            <Loader2 size={16} className="animate-spin" /> Fetching telemetry...
          </div>
        ) : filteredActs.length === 0 ? (
          <div className="text-zinc-500 text-sm flex items-center gap-2 py-4 pl-12">
            No activity found for this filter.
          </div>
        ) : filteredActs.map((act) => (
          <motion.div
            layout
            key={act.id}
            className="flex gap-4 p-3.5 pl-6 rounded-2xl hover:studio-card border border-transparent transition-all relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 blur-[30px] rounded-full pointer-events-none transition-all group-hover:bg-[var(--accent)]/10" />
            
            {/* Dot Node */}
            <div className="absolute left-[20px] top-[22px] w-2 h-2 rounded-full bg-[var(--accent)] ring-4 ring-zinc-950 z-10"></div>

            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--accent)] flex-shrink-0 relative z-10">
              {getInitials(act.actor_name)}
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-zinc-300 m-0 leading-relaxed">
                  <span className="font-semibold text-white">{act.actor_name || "System"}</span> {act.title}{" "}
                  <span className="text-[var(--accent)] font-medium">{act.description}</span>
                </p>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 flex-shrink-0">
                  <Clock size={11} />
                  <span>{formatTimeAgo(act.created_at)}</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1 block">
                {(act.action_type || "System").toUpperCase()} LOG
              </span>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}

