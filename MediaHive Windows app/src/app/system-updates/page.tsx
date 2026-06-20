"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, RefreshCw, ShieldCheck, Terminal, AlertTriangle, Play,
  CheckCircle2, Server, Database, Wifi, Globe, Settings
} from "lucide-react";

export default function SystemUpdatesPage() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "up-to-date" | "out-of-sync">("idle");
  const [dbSyncProgress, setDbSyncProgress] = useState(100);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[16:04:12] Engine initialized successfully.",
    "[16:04:15] Found 14 local active collections in SQLite.",
    "[16:05:00] Graphify AST index synced (171 nodes, 135 edges).",
    "[21:26:38] Ready for telemetry check."
  ]);

  const handleCheck = () => {
    setChecking(true);
    setStatus("checking");
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Triggering remote server handshake...`]);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Handshake successful. Comparing local signatures...`]);
    }, 1000);

    setTimeout(() => {
      setConsoleLogs(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] DB schema is matching client v2.4.0.`,
        `[${new Date().toLocaleTimeString()}] System is fully updated.`
      ]);
      setChecking(false);
      setStatus("up-to-date");
    }, 2500);
  };

  const components = [
    { name: "Tauri Desktop Host", version: "v2.0.4", status: "Healthy", type: "core" },
    { name: "SQLite DB Engine", version: "v3.45.1", status: "Healthy", type: "database" },
    { name: "Local Assets Cache", version: "4.2 GB", status: "100% Synced", type: "cache" },
    { name: "Graphify Semantic AST", version: "v2.1.0", status: "Index Complete", type: "graph" },
    { name: "WebView Engine", version: "Chromium 124", status: "Healthy", type: "runtime" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Cpu size={14} />
            Diagnostic Control
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">System Updates</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Manage local application builds, SQLite database migrations, and sync configurations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
            <span>{checking ? "Checking System..." : "Check for Updates"}</span>
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sync status gauge & control parameters */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Diagnostic status block */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
            
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Sync Status</h3>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center w-32 h-32 rounded-full border border-white/5 bg-zinc-950/40">
                {/* Visual glow indicator */}
                <div className={`absolute inset-0 rounded-full border-2 blur-[2px] transition-colors duration-500 ${
                  status === "checking" ? "border-indigo-500/40 animate-pulse" :
                  status === "up-to-date" ? "border-emerald-500/40" : "border-teal-500/30"
                }`}></div>
                
                <div className="flex flex-col items-center justify-center text-center">
                  {status === "checking" && (
                    <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
                  )}
                  {status === "up-to-date" && (
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  )}
                  {status !== "checking" && status !== "up-to-date" && (
                    <Database className="w-10 h-10 text-teal-400" />
                  )}
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase mt-2">Database</span>
                  <span className="text-xs font-bold text-zinc-300">100% Synced</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Wifi size={12} className="text-teal-400" /> API Connection
                </span>
                <span className="font-semibold text-emerald-400">Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Server size={12} className="text-indigo-400" /> Remote Endpoint
                </span>
                <span className="font-mono text-zinc-300 text-[11px]">production.mediahive.io</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Globe size={12} className="text-zinc-500" /> Region
                </span>
                <span className="text-zinc-300">US-East (Tauri Edge)</span>
              </div>
            </div>
          </div>

          {/* Sync Preferences */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0 flex items-center gap-1.5">
              <Settings size={14} className="text-zinc-400" /> Update Configuration
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-zinc-200">Automatic Updates</span>
                  <span className="text-[10px] text-zinc-500">Apply patches on startup</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-zinc-200">Opt-in Beta Builds</span>
                  <span className="text-[10px] text-zinc-500">Receive bleeding-edge features</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Component Table & Diagnostic Console Log */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* Diagnostic component grid */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Core Components Diagnostics</h3>
            <div className="flex flex-col gap-1 border border-white/5 rounded-xl overflow-hidden bg-zinc-950/20">
              {components.map((comp, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-200">{comp.name}</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{comp.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-zinc-400">{comp.version}</span>
                    <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      {comp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Console Shell */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0 flex items-center gap-2">
                <Terminal size={14} className="text-indigo-400" />
                Diagnostic Console Log
              </h3>
              <button 
                onClick={() => setConsoleLogs([`[${new Date().toLocaleTimeString()}] Console logs cleared.`])}
                className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors bg-transparent border-0 cursor-pointer"
              >
                Clear Output
              </button>
            </div>
            
            <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-zinc-400 min-h-[160px] max-h-[220px] overflow-y-auto flex flex-col gap-1 shadow-inner">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-teal-500/80 select-none">&gt;</span>
                  <span className={log.includes("successful") || log.includes("fully") ? "text-emerald-400" : log.includes("Triggering") ? "text-indigo-400" : "text-zinc-400"}>
                    {log}
                  </span>
                </div>
              ))}
              {checking && (
                <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                  <span className="text-teal-500/80 select-none">&gt;</span>
                  <span>Syncing database structures...</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

