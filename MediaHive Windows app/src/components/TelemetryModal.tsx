"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Copy, Trash2, X, Check } from "lucide-react";

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelemetryModal({ isOpen, onClose }: TelemetryModalProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load initial logs
    const loadLogs = () => {
      try {
        const stored = localStorage.getItem("mediahive_diagnostic_logs");
        setLogs(stored ? JSON.parse(stored) : []);
      } catch (err) {
        console.error("Failed to load telemetry logs:", err);
      }
    };
    loadLogs();

    // Listen for new logs in real-time
    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setLogs((prev) => {
        const updated = [...prev, customEvent.detail];
        if (updated.length > 200) {
          updated.shift();
        }
        return updated;
      });
    };

    window.addEventListener("mediahive-new-log", handleNewLog);
    return () => {
      window.removeEventListener("mediahive-new-log", handleNewLog);
    };
  }, [isOpen]);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (isOpen) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    try {
      const fullText = logs.join("\n");
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  const clearLogs = () => {
    try {
      localStorage.removeItem("mediahive_diagnostic_logs");
      setLogs([]);
      // If server is active, clear server file too
      fetch("http://localhost:3000/api/diagnostic-log", { method: "DELETE" }).catch(() => {});
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl h-[80vh] flex flex-col border border-white/10 bg-[#09090b]/95 rounded-lg shadow-2xl overflow-hidden"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(217,155,22,0.05)"
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-zinc-950/80 border-b border-white/5 select-none">
          <div className="flex items-center gap-2 text-zinc-200 text-sm font-semibold tracking-wider uppercase">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span>App Telemetry & Logs</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Log Viewer Codeblock */}
        <div className="flex-1 bg-black/90 p-4 font-mono text-[11px] text-zinc-300 overflow-y-auto space-y-1.5 leading-relaxed selection:bg-amber-500/20 selection:text-amber-300">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Terminal className="w-8 h-8 opacity-20" />
              <span>No telemetry logs captured in this session.</span>
            </div>
          ) : (
            logs.map((log, index) => {
              // Color highlight lines based on source
              const isTauri = log.includes("[TAURI]");
              const isBrowser = log.includes("[BROWSER]");
              const colorClass = isTauri 
                ? "text-sky-400" 
                : isBrowser 
                  ? "text-amber-400" 
                  : "text-zinc-400";
              
              return (
                <div key={index} className="hover:bg-white/5 py-0.5 px-1 rounded-sm transition-colors whitespace-pre-wrap break-all">
                  <span className={colorClass}>{log}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 bg-zinc-950/80 border-t border-white/5">
          <div className="text-[10px] text-zinc-500 font-medium">
            Showing last {logs.length} events
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
            <button
              onClick={copyToClipboard}
              disabled={logs.length === 0}
              className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-black bg-amber-500 hover:bg-amber-400 rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Logs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
