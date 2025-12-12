"use client";
import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Calendar, User, Download, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNavigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const navRef = React.useRef<HTMLElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!navRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.borderBoxSize) {
          setWidth(entry.borderBoxSize[0].inlineSize);
        } else {
          setWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  const getClipPath = (w: number) => {
    if (!w) return 'none'; // Initial state
    const h = 80;
    const c = w / 2;
    const r = 24; // Corner radius

    // Smooth Bezier Curve for the "App Notch" look + Rounded Corners
    // Path:
    // 1. Start below Top-Left corner
    // 2. Top-Left Corner
    // 3. Line to notch start
    // 4. Notch curves (Down, Flat, Up)
    // 5. Line to Top-Right corner start
    // 6. Top-Right Corner
    // 7. Right edge to Bottom-Right corner
    // 8. Bottom-Right Corner
    // 9. Bottom edge to Bottom-Left corner
    // 10. Bottom-Left Corner
    // 11. Close
    return `path('M 0 ${r} Q 0 0 ${r} 0 L ${c - 52} 0 C ${c - 28} 0 ${c - 32} 40 ${c} 40 C ${c + 32} 40 ${c + 28} 0 ${c + 52} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} Z')`;
  };

  const items = [
    { key: 'home', label: 'Home', href: '/home', icon: Home },
    { key: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { key: 'events', label: 'Events', href: '/events', icon: Calendar },
    { key: 'spacer', label: '', href: '', icon: null },
    { key: 'downloads', label: 'Files', href: '/downloads', icon: Download },
    { key: 'reports', label: 'Reports', href: '/reports', icon: BarChart3 },
    { key: 'profile', label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md bg-[var(--color-bg-glass)] backdrop-blur-xl flex items-center justify-around h-20 z-30 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        clipPath: getClipPath(width),
        // Remove standard border/radius as clip-path handles shape
      }}
    >
      {items.map((item) => {
        if (item.key === 'spacer') return <div key="spacer" className="w-16" />;
        const Icon = item.icon!;
        const active = isActive(item.href);
        return (
          <Link key={item.key} href={item.href} className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${active ? 'text-[#0096FF]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Icon size={24} className={active ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </motion.nav>
  );
}