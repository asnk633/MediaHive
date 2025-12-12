"use client";
import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRole } from "@/app/(shell)/RoleContext";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useRef } from "react";
import { addFocusVisibleClass } from "@/utils/a11y";
type TopBarProps = {
  title?: string;
};
export default function TopBar({ title = "Thaiba Garden" }: TopBarProps) {
  const { user } = useRole();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (notificationButtonRef.current) addFocusVisibleClass(notificationButtonRef.current);
  }, []);
  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4 lg:px-8 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary-start)] to-[var(--color-primary-end)] flex items-center justify-center text-white font-bold text-sm">
          TG
        </div>
        <h1 className="font-display font-bold text-xl tracking-tight text-[var(--color-text-primary)] hidden sm:block">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/updates">
          <button
            ref={notificationButtonRef}
            aria-label="Notifications"
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>
        </Link>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
          <Settings size={20} />
        </button>
        <div className="flex items-center gap-3 pl-2 sm:border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold text-gray-500">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}