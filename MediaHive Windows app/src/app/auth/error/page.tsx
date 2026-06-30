"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useIsTauri } from "@/lib/hooks/useIsTauri";
import { useWindow } from "@/contexts/WindowContext";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isDesktopApp = useIsTauri();
  const { isMaximized } = useWindow();

  // Extract error details from URL parameters
  const errorType = searchParams.get("error") || "auth_error";
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description") || 
    "Your authentication or recovery session could not be verified. This happens if the link was already used, has expired, or is invalid.";

  // Determine user friendly title
  let errorTitle = "Link Invalid or Expired";
  if (errorType === "access_denied" || errorCode === "access_denied") {
    errorTitle = "Access Denied";
  }

  return (
    <div className="w-full h-full overflow-hidden font-sans select-none bg-[#030305] relative">

      {/* Outer desktop frame — fixed to viewport so height never depends on parent chain */}
      <div
        className="login-page-frame fixed overflow-hidden flex shadow-2xl rounded-2xl border border-zinc-800/80"
        style={{
          top: isDesktopApp ? 36 : 16,
          left: isMaximized ? 0 : 16,
          right: isMaximized ? 0 : 16,
          bottom: isMaximized ? 0 : 16,
          borderRadius: isMaximized ? 0 : undefined,
          border: isMaximized ? "none" : undefined,
          boxShadow: isMaximized ? "none" : undefined,
          zIndex: 10,
        }}
      >
        {/* Top desktop window style bar */}
        {!isDesktopApp && (
          <div className="absolute top-0 inset-x-0 h-10 border-b border-white/5 flex items-center justify-between px-6 z-50 pointer-events-none">
            <span className="text-[10px] text-zinc-500 font-bold tracking-[0.15em] uppercase">
              MediaHive Desktop v2.1
            </span>
          </div>
        )}

        {/* Dynamic gritty background noise filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] mix-blend-overlay z-0">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        <div className="w-full h-full flex flex-col items-center justify-center relative z-10 p-6 bg-[var(--bg-primary)]">
          
          {/* MediaHive Branding Header */}
          <div className="flex flex-col items-center text-center mb-8 pointer-events-none">
            <div className="w-16 h-16 mb-4 flex items-center justify-center">
              <img
                src="/media-app-logo-luminous.png"
                alt="MediaHive Logo"
                className="w-full h-full object-contain brightness-0 invert opacity-80"
              />
            </div>
            <h1 className="font-extrabold tracking-widest text-[var(--text-primary)] uppercase text-xl m-0 leading-tight">
              MediaHive
            </h1>
            <p className="text-[var(--text-tertiary)] text-[9px] font-bold uppercase tracking-[0.25em] m-0 mt-2">
              THE CENTRAL HUB FOR THAIBA GARDEN MEDIA & IT
            </p>
          </div>

          {/* Error Card */}
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-full max-w-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-8 relative overflow-hidden shadow-sm"
          >
            <div className="flex flex-col items-center text-center gap-6">
              
              {/* Warning Icon Container */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
                <AlertCircle size={28} className="text-red-400" />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase m-0">
                  {errorTitle}
                </h2>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium m-0 px-2">
                  {errorDescription}
                </p>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm py-2 rounded-md transition-colors cursor-pointer"
                >
                  <span>Request New Link</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-all cursor-pointer text-center py-2"
                >
                  Back to Login
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-[#030305] flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
