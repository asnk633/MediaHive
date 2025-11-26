"use client";
import { Bell } from 'lucide-react';
import { useRole } from "@/app/(shell)/RoleContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopBar() {
  const { user } = useRole();

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(0,200,83,0.25)]" />
        <div className="font-bold text-lg tracking-tight text-[var(--text)]">Thaiba Garden</div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          aria-label="Notifications"
          title="Notifications"
          className="p-2 rounded-full hover:bg-[var(--panel)] transition-all duration-200 ease-in-out"
        >
          <Bell size={20} aria-hidden="true" className="text-[var(--icon)]" />
        </button>

        <div className="w-9 h-9 rounded-full grid place-items-center bg-[var(--panel)] border border-[var(--glass-border)]">
          <span className="font-bold text-sm text-[var(--icon)]">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </span>
        </div>
      </div>
    </header>
  );
}