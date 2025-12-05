"use client";
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useRole } from "@/app/(shell)/RoleContext";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useRef } from "react";
import { addFocusVisibleClass } from "@/utils/a11y";

export default function TopBar() {
  const { user } = useRole();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Add focus visible class to interactive elements for keyboard navigation detection
  useEffect(() => {
    if (notificationButtonRef.current) {
      addFocusVisibleClass(notificationButtonRef.current);
    }
    if (userMenuRef.current) {
      addFocusVisibleClass(userMenuRef.current);
    }
  }, []);

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(0,200,83,0.25)]" />
        <div className="font-bold text-lg tracking-tight text-[var(--text)]">Thaiba Garden</div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Link href="/updates" passHref legacyBehavior>
          <button
            ref={notificationButtonRef}
            aria-label="Notifications"
            title="Notifications"
            className="p-2 rounded-full hover:bg-[var(--panel)] transition-all duration-200 ease-in-out focus:outline-none"
          >
            <Bell size={20} aria-hidden="true" className="text-[var(--icon)]" />
          </button>
        </Link>

        <div
          ref={userMenuRef}
          className="w-9 h-9 rounded-full grid place-items-center bg-[var(--panel)] border border-[var(--glass-border)]"
          role="button"
          tabIndex={0}
          aria-label={`User menu for ${user?.name || 'Anonymous'}`}
        >
          <span className="font-bold text-sm text-[var(--icon)]">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </span>
        </div>
        {user && (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700">
            {user.role.toUpperCase()}
          </span>
        )}
      </div>
    </header>
  );
}