'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '@/lib/offline/queueManager';

interface MetricsSnapshot {
  queueLength: number;
  avgSyncTime: number;
  conflictsResolved: number;
  retries: number;
  lastError: string | null;
  lastSyncAt: string | null;
  tabId: string;
  circuitBreakerActive: boolean;
  circuitBreakerResumesAt: number | null;
}

/**
 * Developer-only sync session panel.
 * Toggle with: Alt+Shift+S
 * Also reads last telemetry snapshot from localStorage.
 */
export function SyncDevPanel() {
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [persisted, setPersisted] = useState<MetricsSnapshot | null>(null);

  const refresh = useCallback(() => {
    const live = syncEngine.getMetrics();
    setMetrics(live as MetricsSnapshot);
    try {
      const raw = localStorage.getItem('mediahive_last_telemetry');
      if (raw) setPersisted(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'S') {
        setVisible(v => !v);
        refresh();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [refresh]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [visible, refresh]);

  if (!visible || process.env.NODE_ENV !== 'development') return null;

  const row = (label: string, value: React.ReactNode, highlight?: string) => (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-foreground/5 last:border-0">
      <span className="text-foreground/80 text-xs shrink-0">{label}</span>
      <span className={`text-xs font-mono text-right break-all ${highlight ?? 'text-foreground/80'}`}>{value ?? '—'}</span>
    </div>
  );

  const fmt = (ms: number) => `${ms.toFixed(0)}ms`;

  return (
    <div className="fixed bottom-16 right-4 z-[1000] w-80 bg-black/90 backdrop-blur border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-foreground/5 border-b border-foreground/10">
        <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">⚙ Sync Dev Panel</span>
        <button onClick={() => setVisible(false)} className="text-foreground/70 hover:text-foreground/70 text-xs">✕</button>
      </div>

      {/* Live metrics */}
      <div className="px-4 py-3">
        <p className="text-[10px] text-foreground/70 uppercase tracking-widest mb-2">Live</p>
        {metrics ? (
          <>
            {row('Queue Length', metrics.queueLength, metrics.queueLength > 0 ? 'text-yellow-300' : 'text-green-400')}
            {row('Avg Sync Time', fmt(metrics.avgSyncTime))}
            {row('Conflicts Resolved', metrics.conflictsResolved)}
            {row('Total Retries', metrics.retries, metrics.retries > 0 ? 'text-yellow-300' : 'text-foreground/80')}
            {row('Circuit Breaker', metrics.circuitBreakerActive ? `🔴 Tripped` : '🟢 OK', metrics.circuitBreakerActive ? 'text-red-400' : 'text-green-400')}
            {row('Last Sync', metrics.lastSyncAt ? new Date(metrics.lastSyncAt).toLocaleTimeString() : null)}
            {row('Last Error', metrics.lastError, metrics.lastError ? 'text-red-300' : undefined)}
            {row('Leader Tab', metrics.tabId.slice(0, 8) + '…')}
          </>
        ) : (
          <p className="text-xs text-foreground/70">Loading…</p>
        )}
      </div>

      {/* Last persisted snapshot */}
      {persisted && (
        <div className="px-4 pb-3 border-t border-foreground/5 mt-1">
          <p className="text-[10px] text-foreground/70 uppercase tracking-widest mb-2 mt-2">Last Telemetry Snapshot</p>
          {row('Queue Length', persisted.queueLength)}
          {row('Avg Sync Time', fmt(persisted.avgSyncTime))}
          {row('Retries', persisted.retries)}
        </div>
      )}

      <div className="px-4 pb-3 text-[10px] text-foreground/80 text-center">
        Alt+Shift+S to toggle · Refreshes every 2s
      </div>
    </div>
  );
}
