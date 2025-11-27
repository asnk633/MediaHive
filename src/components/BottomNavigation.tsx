// src/components/BottomNavigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Calendar, FileText, Download, User } from "lucide-react";
import { useEffect } from "react";
import { addFocusVisibleClass } from "@/utils/a11y";

const BOTTOM_NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/home', icon: Home },
  { key: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { key: 'events', label: 'Events', href: '/events', icon: Calendar },
  { key: 'reports', label: 'Reports', href: '/reports', icon: FileText },
  { key: 'downloads', label: 'Downloads', href: '/downloads', icon: Download },
  { key: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export default function BottomNavigation() {
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
      {BOTTOM_NAV_ITEMS.map((item, index) => (
        <>
          {index === 3 && <div style={{ width: 'var(--fab-size)' }} key="fab-spacer" />} {/* Spacer after 3rd item (index 0,1,2) */}
          <Link
            key={item.key}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? "active" : ""}`}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <item.icon size={20} className="text-[var(--icon)]" />
            <span className="text-[var(--icon)]">{item.label}</span>
          </Link>
        </>
      ))}
    </nav>
  );
}