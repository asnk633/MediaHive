"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Building2, Layers, Activity, 
  Key, RefreshCw, Sparkles, ArrowRight,
  Server, Cpu, Users
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    async function fetchMetrics() {
      if (authLoading || !user?.tenant_id) return;
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenant_id);
          
        if (count !== null) setUserCount(count);
      } catch (err) {
        console.error("Error fetching admin metrics:", err);
      }
    }
    fetchMetrics();
  }, [user, authLoading]);

  const adminCards = [
    {
      title: "Tenants Management",
      desc: "Configure multi-tenant separation, domain rules, and branding setups.",
      metric: "2 Active Tenants",
      icon: Building2,
      color: "text-teal-400",
      href: "/admin"
    },
    {
      title: "Governance & Policies",
      desc: "Set access hierarchies, permissions matrices, and role policies.",
      metric: "14 Role Policies",
      icon: Shield,
      color: "text-indigo-400",
      href: "/governance"
    },
    {
      title: "Workspace Structure",
      desc: "Map the 3-layer hierarchy (Tenant → Institution → Unit).",
      metric: "8 Total Units",
      icon: Layers,
      color: "text-purple-400",
      href: "/users"
    },
    {
      title: "System Health & telemetry",
      desc: "Monitor desktop app sync states, CPU loads, and Tauri log feeds.",
      metric: "Healthy (100ms)",
      icon: Activity,
      color: "text-emerald-400",
      href: "/system-activity"
    },
    {
      title: "Security & API Keys",
      desc: "Manage security audit logs, OAuth providers, and system credentials.",
      metric: "3 API Gateways",
      icon: Key,
      color: "text-amber-400",
      href: "/settings"
    },
    {
      title: "System Updates",
      desc: "Upgrade local database schemas, synchronize updates, and view builds.",
      metric: "v1.2.7-Stable",
      icon: RefreshCw,
      color: "text-sky-400",
      href: "/system-updates"
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* 1. Header */}
      <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
          <Shield size={14} />
          Control Panel
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">Admin Control</h1>
        <p className="text-zinc-400 m-0 text-sm mt-1">
          Configure multi-tenant structures, map user permissions, and track server telemetry.
        </p>
      </header>

      {/* 2. Telemetry Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 glass-panel p-4 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <Server className="text-teal-500 w-5 h-5" />
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sync Server</div>
            <div className="text-xs font-semibold text-zinc-200">connected (db_main)</div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4 relative z-10">
          <Cpu className="text-indigo-500 w-5 h-5" />
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tauri Engine</div>
            <div className="text-xs font-semibold text-zinc-200">Active (v0.1.0)</div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4 relative z-10">
          <Users className="text-purple-500 w-5 h-5" />
          <div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Users</div>
            <div className="text-xs font-semibold text-zinc-200">{userCount || "0"} Active (Online)</div>
          </div>
        </div>
      </div>

      {/* 3. Grid of Admin Configs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
        {adminCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link href={card.href} key={idx}>
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[200px] cursor-pointer hover:border-indigo-500/30 hover:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.2)] transition-all group relative overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-teal-500/20" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl bg-zinc-800/50 border border-white/5 ${card.color}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-850 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {card.metric}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-bold text-zinc-200 mt-4 mb-1.5">{card.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-teal-400 group-hover:text-teal-300 mt-6 transition-colors relative z-10">
                  <span>Configure Settings</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
