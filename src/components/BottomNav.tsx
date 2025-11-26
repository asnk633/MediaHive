// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Download, Bell, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <Link href="/home" className={`nav-item ${isActive("/home") ? "active" : ""}`}>

        <Home size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Home</span>

      </Link>
      <Link
        href="/tasks"
        className={`nav-item ${isActive("/tasks") ? "active" : ""}`}>

        <CheckSquare size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Tasks</span>

      </Link>
      <div style={{ width: 'var(--fab-size)' }} /> {/* spacer for FAB */}
      <Link
        href="/downloads"
        className={`nav-item ${isActive("/downloads") ? "active" : ""}`}>

        <Download size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Downloads</span>

      </Link>
      <Link
        href="/updates"
        className={`nav-item ${isActive("/updates") ? "active" : ""}`}>

        <Bell size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Updates</span>

      </Link>
      <Link
        href="/profile"
        className={`nav-item ${isActive("/profile") ? "active" : ""}`}>

        <User size={20} className="text-[var(--icon)]" />
        <span className="text-[var(--icon)]">Profile</span>

      </Link>
    </nav>
  );
}