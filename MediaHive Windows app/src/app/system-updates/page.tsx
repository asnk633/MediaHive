"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, RefreshCw, ShieldCheck, Terminal, AlertTriangle, ArrowUpCircle,
  CheckCircle2, Server, Database, Wifi, Globe, Settings, Play
} from "lucide-react";

export default function SystemUpdatesPage() {
  const [checking, setChecking] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("0.1.2");
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "up-to-date" | "update-available" | "installing" | "installed" | "error">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] Engine initialized successfully.",
    "[SYSTEM] Diagnostic controller online."
  ]);

  // Detect Tauri app version on mount
  useEffect(() => {
    const getAppInfo = async () => {
      const isTauriApp = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).isTauri);
      if (isTauriApp) {
        try {
          const { getVersion } = await import("@tauri-apps/api/app");
          const ver = await getVersion();
          setCurrentVersion(ver);
          setConsoleLogs(prev => [...prev, `[TAURI] Detected Desktop App version: v${ver}`]);
        } catch (err) {
          console.warn("Failed to get Tauri version:", err);
        }
      } else {
        setConsoleLogs(prev => [...prev, "[WEB] Running in browser environment. Self-updates disabled."]);
      }
    };
    getAppInfo();
  }, []);

  const handleCheck = async () => {
    const isTauriApp = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).isTauri);
    
    if (!isTauriApp) {
      setConsoleLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Update manager is only available inside the Tauri desktop shell.`
      ]);
      setStatus("error");
      return;
    }

    setChecking(true);
    setStatus("checking");
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Querying GitHub release endpoint for updates...`]);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      
      if (update) {
        setUpdateInfo(update);
        setStatus("update-available");
        setConsoleLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [UPDATE FOUND] New version v${update.version} is available!`,
          `[${new Date().toLocaleTimeString()}] Release date: ${update.date || 'N/A'}`,
          `[${new Date().toLocaleTimeString()}] Change description: ${update.body || 'No release notes.'}`
        ]);
      } else {
        setStatus("up-to-date");
        setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Handshake completed. System is fully up-to-date (v${currentVersion}).`]);
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Update check failed: ${err.message || err}`]);
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!updateInfo) return;

    setStatus("installing");
    setDownloadProgress(0);
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Initiating update download and install package...`]);

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Started downloading update (${(contentLength / 1024 / 1024).toFixed(2)} MB)...`]);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              const percentage = Math.round((downloaded / contentLength) * 100);
              setDownloadProgress(percentage);
            }
            break;
          case 'Finished':
            setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Download completed successfully. Extracting and running NSIS installer package...`]);
            break;
        }
      });

      setStatus("installed");
      setConsoleLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] Update successfully applied!`,
        `[${new Date().toLocaleTimeString()}] Restart the application to launch version v${updateInfo.version}.`
      ]);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Installation failed: ${err.message || err}`]);
    }
  };

  const handleRelaunch = async () => {
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process");
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Triggering application relaunch...`]);
      await relaunch();
    } catch (err: any) {
      console.error(err);
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Relaunch failed: ${err.message || err}`]);
    }
  };

  const components = [
    { name: "Tauri Desktop Host", version: `v${currentVersion}`, status: "Healthy", type: "core" },
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
          <div className="flex items-center gap-2 text-sm text-amber-500 font-medium tracking-wider uppercase mb-1">
            <Cpu size={14} />
            Diagnostic Control
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">System Updates</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Manage local application builds, SQLite database migrations, and sync configurations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {status === "idle" || status === "up-to-date" || status === "error" ? (
            <button 
              onClick={handleCheck}
              disabled={checking}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
              <span>{checking ? "Checking System..." : "Check for Updates"}</span>
            </button>
          ) : status === "update-available" ? (
            <button 
              onClick={handleInstall}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowUpCircle size={16} />
              <span>Download & Install v{updateInfo?.version}</span>
            </button>
          ) : status === "installed" ? (
            <button 
              onClick={handleRelaunch}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play size={16} />
              <span>Restart to Update</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sync status gauge & control parameters */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Diagnostic status block */}
          <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Sync Status</h3>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center w-32 h-32 rounded-full border border-white/5 bg-zinc-950/40">
                {/* Visual glow indicator */}
                <div className={`absolute inset-0 rounded-full border-2 blur-[2px] transition-colors duration-500 ${
                  status === "checking" ? "border-amber-500/40 animate-pulse" :
                  status === "up-to-date" ? "border-emerald-500/40" :
                  status === "update-available" ? "border-teal-500/40" :
                  status === "installing" ? "border-indigo-500/40 animate-pulse" :
                  status === "installed" ? "border-purple-500/40" : "border-zinc-800"
                }`}></div>
                
                <div className="flex flex-col items-center justify-center text-center p-4">
                  {status === "checking" && (
                    <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
                  )}
                  {status === "up-to-date" && (
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  )}
                  {status === "update-available" && (
                    <ArrowUpCircle className="w-10 h-10 text-teal-400 animate-bounce" />
                  )}
                  {status === "installing" && (
                    <div className="text-center">
                      <span className="text-xl font-black text-indigo-400">{downloadProgress}%</span>
                    </div>
                  )}
                  {status === "installed" && (
                    <CheckCircle2 className="w-10 h-10 text-purple-400" />
                  )}
                  {status === "idle" && (
                    <Database className="w-10 h-10 text-zinc-500" />
                  )}
                  {status === "error" && (
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  )}
                  <span className="text-[9px] text-zinc-500 font-semibold uppercase mt-2">App Status</span>
                  <span className="text-xs font-bold text-zinc-300">
                    {status === "checking" ? "Checking..." :
                     status === "up-to-date" ? "Up to date" :
                     status === "update-available" ? "New version found" :
                     status === "installing" ? "Downloading..." :
                     status === "installed" ? "Ready to restart" :
                     status === "error" ? "Check failed" : "Idle"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Wifi size={12} className="text-amber-500/80" /> API Connection
                </span>
                <span className="font-semibold text-emerald-400">Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Server size={12} className="text-indigo-400" /> Remote Endpoint
                </span>
                <span className="font-mono text-zinc-300 text-[10px] truncate max-w-[160px]">github.com/asnk633/releases</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Globe size={12} className="text-zinc-500" /> Host
                </span>
                <span className="text-zinc-300">GitHub Releases</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
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
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
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
                    <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
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
            
            <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-zinc-300 min-h-[160px] max-h-[220px] overflow-y-auto flex flex-col gap-1 shadow-inner">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-amber-500/70 select-none">&gt;</span>
                  <span className={
                    log.includes("[SUCCESS]") || log.includes("fully") || log.includes("up-to-date") ? "text-emerald-400" : 
                    log.includes("[UPDATE FOUND]") ? "text-teal-400 animate-pulse font-bold" :
                    log.includes("[ERROR]") ? "text-red-400" :
                    log.includes("[SYSTEM]") ? "text-zinc-500" : "text-zinc-300"
                  }>
                    {log}
                  </span>
                </div>
              ))}
              {status === "installing" && (
                <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                  <span className="text-amber-500/70 select-none">&gt;</span>
                  <span>Applying local files... {downloadProgress}%</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
