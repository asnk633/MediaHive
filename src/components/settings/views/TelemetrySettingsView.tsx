'use client';

import React, { useState, useEffect } from 'react';
import { logger, SystemEvent } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download,
  Copy,
  Trash2,
  Share2,
  Terminal,
  Info,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export const TelemetrySettingsView = () => {
  const [logs, setLogs] = useState<SystemEvent[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    userAgent: '',
    platform: '',
    language: '',
    resolution: '',
    viewport: '',
    timezone: ''
  });

  useEffect(() => {
    // Load logs
    setLogs(logger.getLogs());

    // Gather browser environment variables safely on client
    setSystemInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform || (navigator as any).userAgentData?.platform || 'Unknown',
      language: navigator.language,
      resolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }, []);

  const handleCopyLogs = async () => {
    try {
      const logContent = JSON.stringify({ system: systemInfo, logs }, null, 2);
      await navigator.clipboard.writeText(logContent);
      toast.success('Logs copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy logs');
    }
  };

  const handleDownloadLogs = () => {
    try {
      const logContent = JSON.stringify({ system: systemInfo, logs }, null, 2);
      const blob = new Blob([logContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      // Validate filename structure to ensure safety
      const safeDate = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `mediahive_telemetry_${safeDate}.json`;
      
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Logs downloaded successfully');
    } catch (err) {
      toast.error('Failed to download logs');
    }
  };

  const handleClearLogs = () => {
    logger.clear();
    setLogs([]);
    toast.success('Local telemetry cache cleared');
  };

  const handleConfirmShare = async () => {
    setIsSharing(true);
    // Simulate sending logs via secure backend endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSharing(false);
    setShowShareModal(false);
    toast.success('Telemetry logs securely shared with Developer.');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-950/40 border-red-500/30';
      case 'warn':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'debug':
        return 'text-zinc-400 bg-zinc-950/40 border-zinc-500/30';
      default:
        return 'text-blue-400 bg-blue-950/40 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Telemetry & Logs</h3>
        <p className="text-sm text-foreground/60">
          View, download, and share diagnostic logs to help troubleshoot application performance and connections.
        </p>
      </div>

      {/* System Diagnostics Info Panel */}
      <div className="bg-slate-950/50 border border-foreground/5 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
          <Info size={14} className="text-blue-400" />
          System Diagnostics Info
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-foreground/5">
            <span className="text-foreground/50">Platform:</span>
            <span className="text-foreground/80 font-medium">{systemInfo.platform}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-foreground/5">
            <span className="text-foreground/50">Language:</span>
            <span className="text-foreground/80 font-medium">{systemInfo.language}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-foreground/5">
            <span className="text-foreground/50">Screen Resolution:</span>
            <span className="text-foreground/80 font-medium">{systemInfo.resolution}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-foreground/5">
            <span className="text-foreground/50">Viewport Size:</span>
            <span className="text-foreground/80 font-medium">{systemInfo.viewport}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-foreground/5 md:col-span-2">
            <span className="text-foreground/50">Timezone:</span>
            <span className="text-foreground/80 font-medium">{systemInfo.timezone}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-foreground/5 md:col-span-2">
            <span className="text-foreground/50">User Agent:</span>
            <span className="text-foreground/80 truncate max-w-xs md:max-w-md font-mono" title={systemInfo.userAgent}>
              {systemInfo.userAgent}
            </span>
          </div>
        </div>
      </div>

      {/* Console Viewer Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
          <Terminal size={14} className="text-amber-400" />
          Console Output ({logs.length} events logged)
        </h4>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="border-foreground/10 text-foreground/85 hover:bg-foreground/5 flex items-center gap-1.5 h-8 text-xs px-3 rounded-lg"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
          >
            <Copy size={13} />
            Copy Logs
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-foreground/10 text-foreground/85 hover:bg-foreground/5 flex items-center gap-1.5 h-8 text-xs px-3 rounded-lg"
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
          >
            <Download size={13} />
            Download JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-foreground/10 text-foreground/85 hover:bg-foreground/5 flex items-center gap-1.5 h-8 text-xs px-3 rounded-lg"
            onClick={() => setShowShareModal(true)}
            disabled={logs.length === 0}
          >
            <Share2 size={13} />
            Share Logs
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20 flex items-center gap-1.5 h-8 text-xs px-3 rounded-lg"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            <Trash2 size={13} />
            Clear
          </Button>
        </div>
      </div>

      {/* Console Screen */}
      <div className="bg-slate-950 border border-foreground/10 rounded-xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-slate-900 border-b border-foreground/5 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
            <span className="text-[10px] text-foreground/40 font-mono ml-2">mediahive-diagnostic.log</span>
          </div>
          <span className="text-[10px] text-foreground/30 font-mono">PII Redaction Active</span>
        </div>

        {/* Terminal logs list */}
        <div className="p-4 max-h-80 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2.5 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
          {logs.length === 0 ? (
            <div className="text-foreground/30 text-center py-10 flex flex-col items-center gap-2">
              <Terminal size={24} className="opacity-20" />
              <span>No telemetry logs captured in this session.</span>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="border-b border-foreground/5 pb-2 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground/40">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-foreground/80 font-bold">{log.type}</span>
                  {log.endpoint && (
                    <span className="text-blue-400 text-[10px]">{log.endpoint}</span>
                  )}
                </div>
                {log.metadata && (
                  <pre className="mt-1 bg-slate-900/50 p-2 rounded text-foreground/60 overflow-x-auto whitespace-pre-wrap max-h-40">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Share Confirmation & Logs Preview Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-foreground/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Close */}
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Confirm Sharing Diagnostics</h3>
                <p className="text-xs text-foreground/60 mt-1">
                  You are about to share system metrics and logs with the developer team. Review the payload contents below.
                </p>
              </div>
            </div>

            {/* Scrollable logs preview content */}
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-foreground/5 rounded-xl p-4 font-mono text-[10px] leading-relaxed text-foreground/70 max-h-60 mb-6 whitespace-pre-wrap">
              {JSON.stringify({ system: systemInfo, logs }, null, 2)}
            </div>

            {/* Info Badge */}
            <div className="bg-blue-500/5 border border-blue-500/10 text-blue-400/90 rounded-xl p-3.5 flex items-start gap-2.5 mb-6">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Data Privacy Notice:</strong> All auth credentials, passwords, access keys, and headers are automatically redacted prior to display/transmission.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                className="border-foreground/10 text-foreground/80 hover:bg-foreground/5 px-4 h-10 rounded-xl text-xs"
                onClick={() => setShowShareModal(false)}
                disabled={isSharing}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-foreground font-bold px-6 h-10 rounded-xl text-xs flex items-center gap-2"
                onClick={handleConfirmShare}
                disabled={isSharing}
              >
                {isSharing ? 'Sharing...' : 'Confirm & Share Logs'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
