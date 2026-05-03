'use client';

import React, { useEffect, useState } from 'react';
import { healthManager, HealthStatus } from '@/lib/health/healthState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STATUS_CONFIG: Record<HealthStatus, { color: string; label: string; description: string }> = {
  healthy: {
    color: 'bg-emerald-500',
    label: 'Healthy',
    description: 'System is operational and connected to Supabase.'
  },
  retrying: {
    color: 'bg-amber-500 animate-pulse',
    label: 'Retrying',
    description: 'Transient connection issue detected. Retrying queries...'
  },
  degraded: {
    color: 'bg-orange-500',
    label: 'Degraded',
    description: 'System is up, but some data components (schema) are missing.'
  },
  unavailable: {
    color: 'bg-rose-500 animate-bounce',
    label: 'Unavailable',
    description: 'Critical connection failure. Background activities paused.'
  },
  unknown: {
    color: 'bg-slate-400',
    label: 'Unknown',
    description: 'Waiting for initial system check...'
  },
  syncing: {
    color: 'bg-blue-500 animate-pulse',
    label: 'Syncing',
    description: 'Synchronizing offline changes with the server.'
  }
};

export function HealthIndicator() {
  const [health, setHealth] = useState(healthManager.getSnapshot());

  const getStatusColor = () => {
    if (health.status === 'unavailable') return 'bg-rose-500';
    if (health.conflictCount > 0) return 'bg-orange-500';
    if (health.status === 'degraded' || health.status === 'retrying') return 'bg-amber-500';
    if (health.status === 'syncing' || health.syncStatus === 'syncing') return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getStatusLabel = () => {
    if (health.status === 'unavailable') return 'Working Offline';
    if (health.conflictCount > 0) return `${health.conflictCount} Conflicts`;
    if (health.status === 'retrying') return 'Reconnecting...';
    if (health.status === 'degraded') return 'Degraded';
    if (health.syncStatus === 'syncing') return `Syncing (${health.pendingSyncCount})`;
    if (health.pendingSyncCount > 0) return `${health.pendingSyncCount} Pending`;
    return 'System Live';
  };

  useEffect(() => {
    const unsubscribe = healthManager.subscribe((newStatus) => {
      setHealth(healthManager.getSnapshot());
    });

    return unsubscribe;
  }, []);

  const config = (health && health.status && STATUS_CONFIG[health.status]) 
    || STATUS_CONFIG.unknown 
    || { color: 'bg-slate-400', label: 'System', description: 'Initializing...' };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help group bg-white/5 px-2.5 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-all">
            <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor()} shadow-[0_0_8px_rgba(0,0,0,0.1)] group-hover:scale-125 transition-transform animate-pulse`} />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">
              {getStatusLabel()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          <p className="font-bold mb-1">{config.label}</p>
          <p className="text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
