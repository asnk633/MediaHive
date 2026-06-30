"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Sparkles, Settings, Mail, Shield, Circle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContextProvider";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return 'UA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.name || user?.email?.split('@')[0] || "User";
  const displayRole = user?.role || "Member";

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto w-full pb-10">
      
      {/* 1. Header */}
      <header className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            User Profile
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">My Profile</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            View your organizational role and account details.
          </p>
        </div>

        <Link href="/settings">
          <button className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer">
            <Settings size={16} />
            <span>Edit Profile</span>
          </button>
        </Link>
      </header>

      {/* 2. Profile Details Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/20 border border-white/5 rounded-2xl p-8 backdrop-blur-md flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
      >
        {/* Background glow hit */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-2xl"></div>

        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-wash)] border border-[var(--accent)]/20 flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
            {getInitials(displayName)}
          </div>
          <Circle size={12} className="absolute bottom-1 right-1 fill-emerald-500 stroke-zinc-950 text-emerald-500" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          {loading ? (
            <div className="text-sm text-zinc-500">Loading profile...</div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white m-0">{displayName}</h2>
              <div className="text-xs text-[var(--accent)] font-semibold mt-1 capitalize">{displayRole}</div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-zinc-400">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={14} className="text-zinc-500" />
                  <span>{user?.email || "No email provided"}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Shield size={14} className="text-zinc-500" />
                  <span className="capitalize">{displayRole} Access</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

    </div>
  );
}
