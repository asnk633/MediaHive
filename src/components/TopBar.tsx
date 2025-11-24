// src/components/TopBar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Moon, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Health = "unknown" | "healthy" | "error";

export default function TopBar() {
  const [health, setHealth] = useState<Health>("unknown");
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const ok = res.ok ? (await res.json())?.status === "healthy" : false;
        if (mounted) setHealth(ok ? "healthy" : "error");
      } catch {
        if (mounted) setHealth("error");
      }
    };
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?userId=1&read=false&limit=5");
        if (mounted) setUnread(res.ok ? (await res.json()).length ?? 0 : 0);
      } catch {
        if (mounted) setUnread(0);
      }
    };
    fetchHealth();
    fetchNotifications();
    const t1 = setInterval(fetchHealth, 60_000);
    const t2 = setInterval(fetchNotifications, 30_000);
    return () => {
      mounted = false;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-background/80 backdrop-blur-md px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]",
            health === "healthy" ? "bg-emerald-500 text-emerald-500" : health === "error" ? "bg-red-500 text-red-500" : "bg-zinc-500 text-zinc-500"
          )}
          title={`Server: ${health}`}
        />
        <span className="text-lg font-bold tracking-tight text-white">Thaiba Garden</span>
      </div>

      <nav className="flex items-center gap-1 text-text-muted">
        <button aria-label="Theme" className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors">
          <Moon className="h-5 w-5" />
        </button>
        <Link href="/updates" className="relative p-2 hover:text-white hover:bg-white/5 rounded-full transition-colors" aria-label="Notifications" title="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 grid h-2.5 min-w-[10px] place-items-center rounded-full bg-primary ring-2 ring-background" />
          )}
        </Link>

        <Link href="/profile" aria-label="Open profile" className="ml-1">
          <div
            className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-surface flex items-center justify-center hover:border-primary/50 transition-colors"
            title="Your profile"
          >
            <span className="text-xs font-bold text-white">AU</span>
          </div>
        </Link>
      </nav>
    </header>
  );
}