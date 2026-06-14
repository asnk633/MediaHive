"use client";
import { API_BASE } from '@/lib/api-utils';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LifeBuoy,
  MessageSquarePlus,
  Activity,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { logger } from "@/lib/logger";

export default function SupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const handleDownloadTelemetry = () => {
    try {
      const logs = logger.getLogs();
      const telemetryData = {
        logs: logs.length > 0 ? logs : [{ message: "No recent errors found." }],
        system: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        }
      };
      const textContent = JSON.stringify(telemetryData, null, 2);
      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediahive-telemetry-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download telemetry:", err);
    }
  };

  const handleContactDeveloper = async () => {
    if (!user?.uid) return;
    setIsCreatingChat(true);
    try {
      const res = await fetch(`${API_BASE}/chat/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.roomId) {
          window.location.href = `/chat?room=${data.roomId}`;
        }
      } else {
        console.error("Failed to create support chat");
      }
    } catch (err) {
      console.error("Error creating support chat:", err);
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="w-full h-full max-w-4xl mx-auto py-8 px-4 sm:px-8 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-foreground/10 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <LifeBuoy size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Help & Support</h1>
          <p className="text-foreground/60 mt-1">Get assistance, view guides, or contact our support team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Support Options */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-foreground/50 uppercase tracking-widest">Support Options</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.open("https://mediahive.com/guide", "_blank")}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all group text-left border border-foreground/5 hover:border-foreground/10 shadow-sm"
              >
                <div className="flex items-center gap-4 text-foreground/80 group-hover:text-foreground">
                  <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center">
                    <Info size={20} />
                  </div>
                  <div>
                    <span className="block text-base font-semibold">User Guide</span>
                    <span className="text-xs text-foreground/50 mt-0.5">Read our documentation</span>
                  </div>
                </div>
                <ExternalLink size={18} className="text-foreground/30 group-hover:text-foreground/60 transition-colors" />
              </button>

              <button
                onClick={handleContactDeveloper}
                disabled={isCreatingChat}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-primary/[0.03] hover:bg-primary/[0.08] transition-all group text-left border border-primary/10 hover:border-primary/20 shadow-sm"
              >
                <div className="flex items-center gap-4 text-primary/80 group-hover:text-primary">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquarePlus size={20} />
                  </div>
                  <div>
                    <span className="block text-base font-semibold">
                      {isCreatingChat ? "Opening Support Chat..." : "Contact Developer"}
                    </span>
                    <span className="text-xs text-primary/60 mt-0.5">Direct chat with the developer</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-primary/40 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </section>

          {/* About MediaHive */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-foreground/50 uppercase tracking-widest">About</h3>
            <div className="bg-foreground/[0.02] rounded-2xl p-6 border border-foreground/5 shadow-sm">
              <div className="flex items-center gap-5 mb-4">
                <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                  <img src="/mediahive-honey-logo.png" alt="MediaHive Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground">MediaHive</h4>
                  <p className="text-sm text-foreground/60">VERSION 1.1.3-BETA (BETA 37) (Web)</p>
                </div>
              </div>
              <p className="text-base text-foreground/70 leading-relaxed">
                The central nervous system for media teams. Manage inventory, coordinate tasks, and streamline your workflow.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* System Health */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-foreground/50 uppercase tracking-widest">System Health & Telemetry</h3>
            <div className="bg-foreground/[0.02] rounded-2xl p-6 border border-foreground/5 shadow-sm space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-base text-foreground/80">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Activity size={18} className="text-emerald-500" />
                    </div>
                    <span className="font-semibold">System Status</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-500/15 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-base text-foreground/80">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <ShieldCheck size={18} className="text-indigo-500" />
                    </div>
                    <span className="font-semibold">Connection</span>
                  </div>
                  <span className="text-sm font-medium text-foreground/70 bg-foreground/5 px-3 py-1.5 rounded-lg">
                    Secure
                  </span>
                </div>
              </div>

              <div className="h-px bg-foreground/10" />

              <div>
                <h4 className="text-sm font-bold text-foreground/80 mb-2">Diagnostic Logs</h4>
                <p className="text-sm text-foreground/60 mb-5 leading-relaxed">
                  If you encounter an issue, please download the telemetry logs and share them with the developer to help diagnose the problem faster.
                </p>
                <button
                  onClick={handleDownloadTelemetry}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground/80 text-sm font-bold transition-all border border-foreground/5"
                >
                  <Download size={16} />
                  Download Telemetry
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
