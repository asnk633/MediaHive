"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileQuestion, Home } from "lucide-react";
import { EtheralShadow } from "@/components/ui/etheral-shadow";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] flex items-center justify-center relative p-4 overflow-hidden rounded-2xl">
      
      {/* Outer Interaction Wrapper with Ethereal Shadow filling the content pane */}
      <EtheralShadow
        className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden"
        sizing="fill"
        color="rgba(20, 184, 166, 0.15)" // Subtle teal accent glow
        animation={{ scale: 60, speed: 70 }}
        noise={{ opacity: 0.08, scale: 1.2 }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative z-10 p-6">
          
          {/* Subtle branding indicator */}
          <div className="flex flex-col items-center text-center mb-6 pointer-events-none opacity-40">
            <h1 className="font-extrabold tracking-widest text-white uppercase text-sm m-0 leading-tight">
              MediaHive Node System
            </h1>
          </div>

          {/* 404 Error Card */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="w-full max-w-sm rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl backdrop-blur-xl p-8 relative overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center text-center gap-6">
              
              {/* FileQuestion Icon Container */}
              <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-lg shadow-teal-500/5">
                <FileQuestion size={28} className="text-teal-400" />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-black tracking-tight text-white uppercase m-0">
                  Node Not Found
                </h2>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium m-0 px-2">
                  The requested workspace node or resource could not be resolved. Please verify the URL path or return to the dashboard.
                </p>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 cursor-pointer active:scale-[0.98]"
                >
                  <Home size={13} />
                  <span>Return to Dashboard</span>
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </EtheralShadow>
    </div>
  );
}
