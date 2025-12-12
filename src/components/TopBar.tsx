"use client";
import React, { useEffect, useRef } from "react";
import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRole } from "@/app/(shell)/RoleContext";
import ThemeToggle from "@/components/ThemeToggle";
import { addFocusVisibleClass } from "@/utils/a11y";

export default function TopBar({ title = "Thaiba MediaHive" }: { title?: string }) {
  const { user } = useRole();
  const notifRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (notifRef.current) addFocusVisibleClass(notifRef.current);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-[var(--color-bg-glass)] backdrop-blur-md border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4 lg:px-8 transition-all">
      <div className="flex items-center gap-3">
        {/* Logo Icon */}
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/mediahive-icon.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-display font-bold text-xl text-[var(--color-text-primary)] hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/updates">
          <button ref={notifRef} aria-label="Notifications" className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
        </Link>

        {/* Settings Button (Hidden on mobile) */}
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
          <Settings size={20} />
        </button>

        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
          {(user as any)?.avatar ? <img src={(user as any).avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-gray-500 font-bold">{user?.name?.charAt(0).toUpperCase() || 'A'}</div>}
        </div>
      </div>
    </header>
  );
}