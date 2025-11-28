// src/client/components/FAB.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./fab.module.css";
import Link from "next/link";
import Icon from "@/design-system/Icon";

type Role = "admin" | "team" | "guest";

const MENU_ADMIN = [
  { id: "notify", label: "Notify", href: "/notifications/new", color: "#ffb86b" },
  { id: "event", label: "New Event", href: "/events/new", color: "#7b5cff" },
  { id: "task", label: "New Task", href: "/tasks/new", color: "#00bfa6" },
];
const MENU_OTHERS = [
  { id: "task", label: "New Task", href: "/tasks/new", color: "#00bfa6" },
  { id: "event", label: "New Event", href: "/events/new", color: "#7b5cff" },
];

export default function FAB({ role = "team" as Role }: { role?: Role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if(e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const menu = role === "admin" ? MENU_ADMIN : MENU_OTHERS;

  return (
    <div className={styles.fabWrap} aria-hidden={false}>
      <div className={`${styles.menu} ${open ? styles.open : ""}`} role="menu" aria-label="Quick actions">
        {menu.map(item => (
          <Link key={item.id} href={item.href} className={styles.menuItem} role="menuitem" tabIndex={open ? 0 : -1} style={{ boxShadow: `0 6px 20px ${item.color}22` }}>
            <span className={styles.menuBullet} style={{ background: item.color }} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <button
        ref={ref}
        aria-haspopup="true"
        aria-expanded={open}
        className={`${styles.fab} ${open ? styles.active : ""}`}
        onClick={() => setOpen(v => !v)}
        title={open ? "Close quick actions" : "Open quick actions"}
      >
        <Icon name="plus" size={36} className="text-[var(--accent)]" ariaLabel="Create new" />
      </button>
    </div>
  );
}