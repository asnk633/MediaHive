"use client";
import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Calendar, User, Download, BarChart3, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomNavigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const navRef = React.useRef<HTMLElement>(null);
  const [width, setWidth] = React.useState(0);





  const items = [
    { key: 'home', label: 'Home', href: '/home', icon: Home },
    { key: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { key: 'spacer', label: '', href: '', icon: null },
    { key: 'inventory', label: 'Inventory', href: '/inventory', icon: Package },
    { key: 'downloads', label: 'Files', href: '/downloads', icon: Download },
  ];

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: 100, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        boxShadow: [
          "0 15px 35px -5px rgba(91, 66, 243, 0.4), 0 5px 15px rgba(0, 221, 235, 0.2)",
          "0 15px 45px -5px rgba(91, 66, 243, 0.6), 0 10px 25px rgba(0, 221, 235, 0.4)",
          "0 15px 35px -5px rgba(91, 66, 243, 0.4), 0 5px 15px rgba(0, 221, 235, 0.2)"
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-[#0f172a]/90 backdrop-blur-2xl border border-[#ffffff1a] rounded-[40px] h-20"
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        width: '26rem',
        minWidth: '26rem',
        maxWidth: '26rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 80px 1fr 1fr',
        alignItems: 'center',
        justifyItems: 'center'
      }}
    >
      {items.map((item, index) => {
        if (item.key === 'spacer') return <div key="spacer" className="w-20" />;
        const Icon = item.icon!;
        const active = isActive(item.href);

        // Micro-adjustments for visual centering relative to FAB
        const isLeftSide = index < 2; // Home, Tasks
        const microOffset = isLeftSide ? '-translate-x-[4px]' : 'translate-x-[4px]';

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`group relative flex flex-col items-center justify-center w-12 h-full transition-all duration-300 ${microOffset} ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {/* Active Glow Background */}
            {active && (
              <motion.div
                layoutId="nav-glow"
                className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl -z-10"
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
                className="absolute bottom-2 w-1 h-1 bg-blue-400 rounded-full"
              />
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
}