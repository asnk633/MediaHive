"use client";
import React from 'react';
import AppLink from "@/components/AppLink";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Calendar, User, Download, BarChart3, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/AuthContextProvider';
import FAB from "@/client/components/FAB";

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const navRef = React.useRef<HTMLElement>(null);
  const [width, setWidth] = React.useState(0);

  // Exclude specific paths where BottomNav causes layout issues
  const excludedPaths = ['/events/new'];
  if (excludedPaths.includes(pathname || '')) {
    return null;
  }

  // FAB Context-Aware Visibility Control
  const allowedPages = ['/home', '/tasks', '/events', '/inventory', '/downloads', '/reports', '/admin', '/settings', '/profile', '/notifications'];
  const isOnAllowedPage = allowedPages.some(page =>
    pathname === page || pathname?.startsWith(page + '/')
  );
  const hasModalParam = typeof window !== 'undefined' && (window.location.search.includes('id=') || window.location.search.includes('action='));
  const showFAB = isOnAllowedPage && !hasModalParam;

  const { user } = useAuth(); // Helper to access auth context
  // Assume guest if no role or specific guest role
  const isGuest = user?.role === 'guest';

  const items = [
    { key: 'home', label: 'Home', href: '/home', icon: Home },
    { key: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { key: 'events', label: 'Events', href: '/events', icon: Calendar },
    { key: 'spacer', label: '', href: '', icon: null },
    { key: 'inventory', label: 'Inventory', href: '/inventory', icon: Package },
    { key: 'downloads', label: 'Files', href: '/downloads', icon: Download },
    // Role-based Switch: Reports for Team/Admin, Profile for Guests
    isGuest
      ? { key: 'profile', label: 'Profile', href: '/profile', icon: User }
      : { key: 'reports', label: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        style={{
          bottom: 'calc(1.5rem + var(--safe-bottom))',
          width: 'min(36rem, calc(100vw - 2rem))', // slightly wider for desktop/tablet feel
          height: '4.5rem', // slightly shorter/tighter
          transform: 'translateX(-50%) translateY(calc(-1 * var(--keyboard-offset, 0px)))'
        }}
      >
        {/* FAB - Context-Aware Visibility */}
        <div className="pointer-events-auto">
          {showFAB && <FAB />}
        </div>

        <motion.nav
          ref={navRef}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full h-full bg-[#18181B]/95 backdrop-blur-xl border border-[#242427] rounded-3xl px-1 shadow-strong dock-glow pointer-events-auto overflow-hidden relative"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr) 72px repeat(3, 1fr)',
            alignItems: 'center',
            justifyItems: 'center'
          }}
        >
          {items.map((item) => {
            if (item.key === 'spacer') return <div key="spacer" className="w-18" />;
            const Icon = item.icon!;
            const active = isActive(item.href);

            return (
              <AppLink
                key={item.key}
                href={item.href}
                className={`group relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {/* Active Indicator Bar (Cyber-Executive under-glow) */}
                {active && (
                  <motion.div
                    layoutId="nav-active-glow"
                    className="absolute bottom-0 w-12 h-6 bg-accent-primary/20 blur-xl rounded-full"
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  />
                )}

                <Icon
                  size={22}
                  className={`transition-all duration-300 ${active ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] translate-y-0' : 'text-zinc-500 group-hover:text-white'}`}
                />

                <span
                  className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 transition-all duration-200 ${active ? 'opacity-100' : 'opacity-0 scale-90 translate-y-1 group-hover:opacity-60 group-hover:translate-y-0 group-hover:scale-100'}`}
                >
                  {item.label}
                </span>
              </AppLink>
            );
          })}
        </motion.nav>
      </div>
    </>
  );
}
