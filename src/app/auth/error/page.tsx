"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

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
    <div className="w-full h-full overflow-hidden font-sans select-none bg-[#030305] relative min-h-screen flex items-center justify-center">
      {/* Outer frame */}
      <div
        className="w-full max-w-lg overflow-hidden flex flex-col items-center justify-center p-6"
        style={{ zIndex: 10 }}
      >
        {/* Dynamic gritty background noise filter */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] mix-blend-overlay z-0">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        <div className="w-full flex flex-col items-center justify-center relative z-10">
          
          {/* MediaHive Branding Header */}
          <div className="flex flex-col items-center text-center mb-8 pointer-events-none">
            <div className="w-16 h-16 mb-4 flex items-center justify-center">
              <img
                src="/brand-name-light.png"
                alt="MediaHive Logo"
                className="w-full h-full object-contain brightness-0 invert opacity-80"
              />
            </div>
            <h1 className="font-extrabold tracking-widest text-white uppercase text-xl m-0 leading-tight">
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
            className="w-full max-w-sm rounded-lg bg-zinc-950/50 border border-zinc-800 p-8 relative overflow-hidden shadow-sm"
          >
            <div className="flex flex-col items-center text-center gap-6">
              
              {/* Warning Icon Container */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
                <AlertCircle size={28} className="text-red-400" />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-white uppercase m-0">
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
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm py-2 rounded-md transition-colors cursor-pointer"
                >
                  <span>Request New Link</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full text-xs text-zinc-400 hover:text-white font-bold transition-all cursor-pointer text-center py-2"
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
        <div className="w-full h-full bg-[#030305] flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
