'use client';

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { syncConflictsAtom, syncEngine } from '@/lib/offline/queueManager';
import { offlineDB } from '@/lib/offline/db';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Server } from 'lucide-react';

export function ConflictResolutionModal() {
  const [conflicts, setConflicts] = useAtom(syncConflictsAtom);
  const [isConfirming, setIsConfirming] = useState(false);

  if (conflicts.length === 0) return null;

  const currentConflict = conflicts[0];
  const { mutation, serverData, table } = currentConflict;

  const handleKeepMine = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    // Force sync
    const updatedMutation = { ...mutation };
    updatedMutation.payload = { ...updatedMutation.payload, _forceSync: true };
    updatedMutation.status = 'pending';
    
    await offlineDB.enqueue(updatedMutation); 
    
    // Update local cache immediately so UI reflects the decision
    if (mutation.payload.id) {
      await offlineDB.updateEntityCache(table as any, mutation.payload.id, mutation.payload);
    }
    
    syncEngine.incrementConflictsResolved();
    
    setConflicts((prev) => prev.slice(1));
    setIsConfirming(false);
    syncEngine.processQueue();
  };

  const handleMerge = async () => {
    const updatedMutation = { ...mutation };
    const mergedPayload = { ...serverData, ...mutation.payload };
    
    // Merge array fields properly
    for (const key in serverData) {
      if (Array.isArray(serverData[key]) && Array.isArray(mutation.payload[key])) {
        mergedPayload[key] = Array.from(new Set([...serverData[key], ...mutation.payload[key]]));
      }
    }

    updatedMutation.payload = { ...mergedPayload, _forceSync: true };
    updatedMutation.status = 'pending';
    
    await offlineDB.enqueue(updatedMutation);

    // Update local cache immediately so UI reflects the decision
    if (mutation.payload.id) {
      await offlineDB.updateEntityCache(table as any, mutation.payload.id, mergedPayload);
    }

    syncEngine.incrementConflictsResolved();
    setConflicts((prev) => prev.slice(1));
    setIsConfirming(false);
    syncEngine.processQueue();
  };

  const handleKeepServer = async () => {
    await offlineDB.delete(mutation.id);
    
    // Update local cache immediately with server data
    if (mutation.payload.id) {
      await offlineDB.updateEntityCache(table as any, mutation.payload.id, serverData);
    }
    setConflicts((prev) => prev.slice(1));
    setIsConfirming(false);
  };

  const renderConflictingFields = () => {
    const fields = currentConflict.conflictFields || [];
    if (fields.length === 0) {
       return <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-center text-sm text-red-200/50 italic">Full record structural conflict</div>;
    }

    return (
      <div className="space-y-3">
        {fields.map(field => (
          <div key={field} className="bg-black/30 rounded-xl border border-foreground/5 overflow-hidden">
            <div className="px-3 py-1.5 bg-foreground/5 border-b border-foreground/5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">{field}</span>
              <AlertTriangle className="w-3 h-3 text-red-500/50" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/5">
              <div className="p-3">
                <div className="text-[9px] font-bold text-blue-400 uppercase mb-1 opacity-60">Mine</div>
                <div className="text-xs text-foreground/90 font-medium">{JSON.stringify(mutation.payload[field])}</div>
              </div>
              <div className="p-3 bg-red-500/[0.02]">
                <div className="text-[9px] font-bold text-red-400 uppercase mb-1 opacity-60">Server</div>
                <div className="text-xs text-foreground/90 font-medium">{JSON.stringify(serverData[field])}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-[#0F0F0F] rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-foreground/10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Sync Conflict</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Conflict detected in <strong>{table.slice(0, -1)}</strong>. 
              {conflicts.length > 1 && <span className="ml-1 text-red-400/80">+{conflicts.length - 1} more pending.</span>}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {renderConflictingFields()}
          
          <div className="mt-6 p-4 bg-foreground/[0.02] rounded-2xl border border-foreground/5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/70 uppercase tracking-widest">
              <Server className="w-3 h-3" /> Context
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-foreground/80">Record ID</span>
              <span className="text-foreground/80 font-mono">{mutation.payload.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-foreground/80">Last Seen Server Version</span>
              <span className="text-foreground/80 font-mono">v{mutation.baseVersion || '?' }</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isConfirming ? (
          <div className="p-5 bg-red-900/30 border-t border-red-500/20 flex items-center justify-between gap-3">
            <span className="text-red-300 text-sm">This will permanently overwrite the server's newer data. Continue?</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsConfirming(false)} className="text-foreground hover:bg-foreground/10">Cancel</Button>
              <Button onClick={handleKeepMine} className="bg-red-600 hover:bg-red-500 text-foreground font-semibold">Yes, Overwrite</Button>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-black/20 border-t border-foreground/5 flex items-center justify-between gap-3">
            <Button 
              variant="ghost" 
              onClick={handleKeepServer}
              className="text-foreground/70 hover:text-foreground hover:bg-foreground/10"
            >
              Discard My Changes
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleMerge}
                className="border-foreground/10 text-foreground hover:bg-foreground/5"
              >
                Merge Changes
              </Button>
              <Button 
                onClick={handleKeepMine}
                className="bg-blue-600 hover:bg-blue-500 text-foreground font-semibold"
              >
                Keep Mine
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
