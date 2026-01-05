"use client";

import Link from "next/link";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import { Search, Bell, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function UpdatesPage() {
  const { notifications } = useClientData();
  const [filter, setFilter] = useState('All');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    // Add more logic if needed for Mentions/System
    return true;
  });

  return (
    <div className="min-h-screen pb-24 px-4 pt-24">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Updates</h1>
          <p className="text-[var(--text-secondary)]">Stay informed about latest changes.</p>
        </header>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--icon-muted)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full bg-[var(--panel)] border border-[var(--glass-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]/50 focus:bg-[var(--panel-strong)] transition-all duration-200 ease-in-out"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {["All", "Unread", "Mentions", "System"].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ease-in-out border",
                  filter === c
                    ? "bg-[var(--accent)] text-[var(--text)] border-[var(--accent)] shadow-glow"
                    : "bg-[var(--panel)] text-[var(--muted)] border-[var(--glass-border)] hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <Link
                href={`/updates/view?id=${n.id}`}
                key={n.id}
                className="glass-card flex items-start gap-4 p-4 hover:bg-[var(--panel)] transition-colors group relative"
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "grid size-10 place-items-center rounded-full bg-[var(--panel)] text-[var(--icon-muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-all duration-200 ease-in-out",
                    !n.read && "text-[var(--accent)] bg-[var(--accent)]/10"
                  )}>
                    <Bell size={20} className="text-[var(--icon)]" />
                  </div>
                  {!n.read && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)] bg-[var(--accent)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold leading-tight text-[var(--text)]", !n.read && "text-[var(--accent)]")}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-[var(--muted)] whitespace-nowrap">{n.time ?? "Just now"}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">{n.body}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-[var(--panel)] flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-[var(--icon-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text)]">No updates yet</h3>
              <p className="text-sm text-[var(--muted)] mt-1 max-w-xs">
                Notifications about tasks, events, and system updates will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
