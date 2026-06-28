'use client';

import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useWindow } from "@/contexts/WindowContext";

export default function Titlebar() {
  const { isMaximized, isDesktop } = useWindow();

  if (!isDesktop) {
    return null;
  }

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
    <div className="window-titlebar h-9 w-full flex justify-between items-center bg-background/80 backdrop-blur-md select-none border-b border-white/5 fixed top-0 left-0 right-0 z-[99999] pointer-events-auto shadow-sm">
      <div className="flex items-center pl-3 pointer-events-none text-xs font-semibold text-foreground/70 tracking-wider">
        <div className="w-4 h-4 bg-primary/20 rounded-sm mr-2 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-sm" />
        </div>
        MEDIAHIVE
      </div>
      
      {/* Safe Drag Region (Qwen suggestion) */}
      <div data-tauri-drag-region className="flex-1 h-full cursor-default mx-4" />
      
      <div className="flex h-full">
        <button 
          onClick={minimize}
          className="h-full px-4 inline-flex items-center justify-center hover:bg-white/10 transition-colors text-foreground/60 hover:text-foreground"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={toggleMaximize}
          className="h-full px-4 inline-flex items-center justify-center hover:bg-white/10 transition-colors text-foreground/60 hover:text-foreground"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={close}
          className="h-full px-4 inline-flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors text-foreground/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
