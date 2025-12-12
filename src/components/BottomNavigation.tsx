"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Calendar, User } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
export default function BottomNavigation() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const items = [
    { key: 'home', label: 'Home', href: '/home', icon: Home },
    { key: 'tasks', label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { key: 'spacer', label: '', href: '', icon: null }, // FAB Spacer
    { key: 'events', label: 'Events', href: '/events', icon: Calendar },
    { key: 'profile', label: 'Profile', href: '/profile', icon: User },
  ];
  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md bg-white/90 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-around h-16 z-30 border border-white/20"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      {items.map((item) => {
        if (item.key === 'spacer') return <div key="spacer" className="w-16" />;
        const Icon = item.icon!;
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${active ? 'text-[#0096FF]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon size={24} className={active ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </motion.nav>
  );
}