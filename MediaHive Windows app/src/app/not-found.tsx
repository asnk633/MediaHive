"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] flex items-center justify-center relative p-4 bg-[var(--bg-primary)]">
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10 p-6">
        
        {/* Subtle branding indicator */}
        <div className="flex flex-col items-center text-center mb-6 pointer-events-none opacity-40">
          <h1 className="font-bold tracking-widest text-[var(--text-primary)] uppercase text-xs m-0 leading-tight">
            MediaHive Node System
          </h1>
        </div>

        {/* 404 Error Card */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="w-full max-w-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-8 relative overflow-hidden shadow-sm"
        >
          <div className="flex flex-col items-center text-center gap-6">
            
            {/* FileQuestion Icon Container */}
            <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <FileQuestion size={28} className="text-[var(--accent)]" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-base font-bold text-[var(--text-primary)] uppercase m-0">
                Node Not Found
              </h2>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium m-0 px-2">
                The requested workspace node or resource could not be resolved. Please verify the URL path or return to the dashboard.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-xs py-2 rounded-md transition-colors cursor-pointer"
              >
                <Home size={14} />
                <span>Return to Dashboard</span>
              </button>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
