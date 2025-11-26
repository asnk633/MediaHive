// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Download, Bell, User } from "lucide-react";
import { useEffect } from "react";
import { addFocusVisibleClass } from "@/utils/a11y";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Add focus visible class to all nav items for keyboard navigation detection
  useEffect(() => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item instanceof HTMLElement) {
        addFocusVisibleClass(item);
      }
    });
  }, []);

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <Link 
        href="/home" 
        className={`nav-item ${isActive("/home") ? "active" : ""}`}
        aria-current={isActive("/home") ? "page" : undefined}
      >
        <Home size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Home</span>
      </Link>
      <Link
        href="/tasks"
        className={`nav-item ${isActive("/tasks") ? "active" : ""}`}
        aria-current={isActive("/tasks") ? "page" : undefined}
      >
        <CheckSquare size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Tasks</span>
      </Link>
      <div style={{ width: 'var(--fab-size)' }} /> {/* spacer for FAB */}
      <Link
        href="/downloads"
        className={`nav-item ${isActive("/downloads") ? "active" : ""}`}
        aria-current={isActive("/downloads") ? "page" : undefined}
      >
        <Download size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Downloads</span>
      </Link>
      <Link
        href="/updates"
        className={`nav-item ${isActive("/updates") ? "active" : ""}`}
        aria-current={isActive("/updates") ? "page" : undefined}
      >
        <Bell size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Updates</span>
      </Link>
      <Link
        href="/profile"
        className={`nav-item ${isActive("/profile") ? "active" : ""}`}
        aria-current={isActive("/profile") ? "page" : undefined}
      >
        <User size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Profile</span>
      </Link>
    </nav>
  );
}