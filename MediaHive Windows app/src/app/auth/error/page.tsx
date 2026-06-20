"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { EtheralShadow } from "@/components/ui/etheral-shadow";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
    <div className="w-screen h-screen flex overflow-hidden font-sans select-none p-4 bg-[#030305] relative">
      
      {/* ── Outer desktop frame border wrapper ── */}
      <div className="w-full h-full border border-zinc-800/80 rounded-2xl overflow-hidden flex relative shadow-2xl">
        
        {/* Top desktop window style bar */}
        <div className="absolute top-0 inset-x-0 h-10 border-b border-white/5 flex items-center justify-between px-6 z-50 pointer-events-none">
          <span className="text-[10px] text-zinc-500 font-bold tracking-[0.15em] uppercase">
            MediaHive Desktop v2.1
          </span>
        </div>

        {/* Dynamic gritty background noise filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] mix-blend-overlay z-0">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Outer Interaction Wrapper with Ethereal Shadow */}
        <EtheralShadow
          className="w-full h-full"
          sizing="fill"
          color="rgba(20, 184, 166, 0.22)" // Teal accent shadow overlay
          animation={{ scale: 70, speed: 85 }}
          noise={{ opacity: 0.12, scale: 1.2 }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center relative z-10 p-6">
            
            {/* MediaHive Branding Header */}
            <div className="flex flex-col items-center text-center mb-8 pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 150,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-24 h-24 mb-4 flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              >
                <img
                  src="/media-app-logo-luminous.png"
                  alt="MediaHive Logo"
                  className="w-full h-full object-contain brightness-0 invert opacity-80"
                />
              </motion.div>
              <h1 className="font-extrabold tracking-widest text-white uppercase text-2xl m-0 leading-tight">
                MediaHive
              </h1>
              <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.25em] m-0 mt-2">
                THE CENTRAL HUB FOR THAIBA GARDEN MEDIA & IT
              </p>
            </div>

            {/* Error Card */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-950/75 border border-zinc-800/80 shadow-2xl backdrop-blur-xl p-8 relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex flex-col items-center text-center gap-6">
                
                {/* Warning Icon Container */}
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
                  <AlertCircle size={28} className="text-red-400" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white uppercase m-0">
                    {errorTitle}
                  </h2>
                  <p className="text-zinc-400 text-xs leading-relaxed font-medium m-0 px-2">
                    {errorDescription}
                  </p>
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer active:scale-[0.98]"
                  >
                    <span>Request New Link</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full text-[11px] text-zinc-400 hover:text-white font-bold transition-all cursor-pointer text-center py-2"
                  >
                    Back to Login
                  </button>
                </div>

              </div>
            </motion.div>

          </div>
        </EtheralShadow>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#030305] flex items-center justify-center">
          <Loader2 className="animate-spin text-teal-500" size={32} />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
