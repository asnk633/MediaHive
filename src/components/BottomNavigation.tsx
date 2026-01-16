"use client";
import React from 'react';
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, CheckSquare, Calendar, User, Download, BarChart3, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext';
import FAB from "@/client/components/FAB";

export default function BottomNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const hasModalParam = searchParams.has('id') || searchParams.has('action');
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
        className="fixed left-1/2 -translate-x-1/2 z-30"
        style={{
          bottom: 'calc(1.5rem + var(--safe-bottom, 0px))',
          width: 'min(30rem, calc(100vw - 2rem))', // Responsive width (max 30rem, but fits mobile)
          height: '5rem', // h-20
        }}
      >
        {/* FAB - Context-Aware Visibility */}
        {showFAB && <FAB />}

        <motion.nav
          ref={navRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            boxShadow: [
              "0 15px 35px -5px rgba(91, 66, 243, 0.25), 0 5px 15px rgba(0, 221, 235, 0.15)",
              "0 15px 45px -5px rgba(91, 66, 243, 0.35), 0 10px 25px rgba(0, 221, 235, 0.25)",
              "0 15px 35px -5px rgba(91, 66, 243, 0.25), 0 5px 15px rgba(0, 221, 235, 0.15)"
            ]
          }}
          transition={{
            y: { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 0.5 },
            boxShadow: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="w-full h-full bg-glass backdrop-blur-3xl border-t border-soft rounded-[40px] px-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.3)]"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr) 80px repeat(3, 1fr)',
            alignItems: 'center',
            justifyItems: 'center'
          }}
        >
          {items.map((item) => {
            if (item.key === 'spacer') return <div key="spacer" className="w-20" />;
            const Icon = item.icon!;
            const active = isActive(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`group relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${active ? 'text-primary' : 'text-muted hover:text-foreground'}`}
              >
                {/* Active Glow Background */}
                {active && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 bg-primary/10 rounded-full blur-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <Icon
                  size={24}
                  className={`transition-all duration-300 ${active ? 'stroke-[2.5px] -translate-y-1' : 'stroke-2 group-hover:-translate-y-0.5'}`}
                />

                <span
                  className={`text-[10px] font-medium mt-1 transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}
                >
                  {item.label}
                </span>

                {/* Active Dot */}
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute bottom-2 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </>
  );
}