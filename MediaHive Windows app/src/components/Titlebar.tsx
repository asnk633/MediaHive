'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Terminal } from 'lucide-react';
import { useWindow } from "@/contexts/WindowContext";
import TelemetryModal from '@/components/TelemetryModal';

export default function Titlebar() {
  const { isMaximized } = useWindow();
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  // Register the maximize button ID with the snap-layout plugin dynamically on mount
  useEffect(() => {
    const initSnapLayout = async () => {
      try {
        const { changeTarget } = await import("tauri-plugin-snap-layout");
        changeTarget("titlebar-maximize");
        console.log("[Titlebar] Registered snap layout target: titlebar-maximize");
      } catch (err) {
        console.warn("[Titlebar] Failed to initialize tauri-plugin-snap-layout frontend:", err);
      }
    };
    initSnapLayout();
  }, []);

  const minimize = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    getCurrentWindow().minimize();
  };

  const toggleMaximize = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    getCurrentWindow().toggleMaximize();
  };

  const close = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    getCurrentWindow().close();
  };

  return (
    <>
      {/* Titlebar height increased to h-10 (40px) for standard, spacious sensation area */}
      <div className="window-titlebar h-10 w-full justify-between items-center bg-[#09090b] select-none border-b border-white/5 fixed top-0 left-0 right-0 z-[99999] pointer-events-auto shadow-sm">
        <div className="flex items-center pl-3 pointer-events-none text-xs font-semibold text-zinc-400 tracking-wider">
          <div className="w-4 h-4 bg-primary/20 rounded-sm mr-2 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-sm" />
          </div>
          MEDIAHIVE
        </div>
        
        {/* Safe Drag Region */}
        <div data-tauri-drag-region className="flex-1 h-full cursor-default mx-4" />
        
        <div className="flex h-full">
          {/* Telemetry Button: w-11 hit area */}
          <button 
            onClick={() => setIsTelemetryOpen(true)}
            className="w-11 h-full inline-flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-400 hover:text-amber-500 cursor-pointer"
            title="Telemetry logs"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-500/70" />
          </button>
          
          {/* Minimize: w-12 (48px) hit area */}
          <button 
            onClick={minimize}
            className="w-12 h-full inline-flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-400 hover:text-white cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Maximize: w-12 (48px) hit area & native Snap Layout overlay target */}
          <button 
            id="titlebar-maximize"
            onClick={toggleMaximize}
            className="w-12 h-full inline-flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-400 hover:text-white cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Close: w-12 (48px) hit area */}
          <button 
            onClick={close}
            className="w-12 h-full inline-flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <TelemetryModal isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />
    </>
  );
}
