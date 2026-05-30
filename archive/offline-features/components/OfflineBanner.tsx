'use client';

import React from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline } = useConnectivity();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-full shadow-2xl backdrop-blur-md">
        <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
          <WifiOff size={12} className="text-amber-500" />
        </div>
        <span className="text-xs font-medium text-neutral-300 pr-1">Working Offline</span>
      </div>
    </div>
  );
}
