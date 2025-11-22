// src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Role = "admin" | "team" | "guest";

export default function BottomNav({ onFabClick }: { onFabClick?: () => void }) {
  const pathname = usePathname();
  const { push } = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const [role] = useState<Role>("admin"); // TODO: wire to real auth

  const Tab = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center gap-1 ${
          active ? "text-[var(--tg-accent)] font-semibold" : "text-white/70 hover:text-white"
        }`}
        aria-label={label}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-[11px]">{label}</span>
      </Link>
    );
  };

  const handleFabClick = () => {
    setFabOpen((s) => !s);
    if (onFabClick) onFabClick();
  };

  return (
    <>
      {/* Center FAB */}
      <div className="fixed inset-x-0 bottom-[84px] z-40 flex justify-center">
        <button
          onClick={handleFabClick}
          className="h-14 w-14 rounded-full bg-[var(--tg-accent)] text-black text-3xl leading-[56px] shadow-lg"
          aria-label="Create"
        >
          +
        </button>
      </div>

      {/* FAB overlay + role-aware menu */}
      {fabOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={() => setFabOpen(false)} />
          <div className="fixed bottom-[150px] left-0 right-0 z-50 mx-auto flex max-w-sm flex-col items-center gap-4 px-4">
            {role !== "guest" && (
              <MenuBtn
                label="Create Event"
                onClick={() => {
                  // navigate to event creation flow or open modal
                  push("/calendar/new");
                  setFabOpen(false);
                }}
              />
            )}

            <MenuBtn
              label="Create Task"
              onClick={() => {
                push("/tasks/new");
                setFabOpen(false);
              }}
            />

            {role === "admin" && (
              <MenuBtn
                label="Create Notification"
                onClick={() => {
                  push("/notifications/new");
                  setFabOpen(false);
                }}
              />
            )}

            {role === "guest" && (
              <p className="text-xs text-white/70">Admin will assign a team member after submission.</p>
            )}
          </div>
        </>
      )}

      {/* Bottom bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto h-16 max-w-3xl rounded-t-2xl border-t border-white/10 bg-black/55 backdrop-blur-md">
          {/* notch space */}
          <div className="pointer-events-none absolute -top-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full" />
          <nav className="grid h-full grid-cols-6 place-items-center text-sm">
            <Tab href="/home" label="Home" icon="🏠" />
            <Tab href="/tasks" label="Tasks" icon="✅" />
            <Tab href="/calendar" label="Calendar" icon="🗓️" />
            <Tab href="/downloads" label="Downloads" icon="⬇️" />
            <Tab href="/updates" label="Updates" icon="🔔" />
            <Tab href="/profile" label="Profile" icon="👤" />
          </nav>
        </div>
      </footer>
    </>
  );
}

function MenuBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-[260px] rounded-lg bg-[#2a2a2a] px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#333]"
    >
      {label}
    </button>
  );
}
