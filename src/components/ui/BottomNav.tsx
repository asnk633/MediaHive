// src/components/ui/BottomNav.tsx
"use client";
import AppLink from "@/components/AppLink";
import React from "react";
import Icon from "@/client/components/Icon";
import styles from "./bottomnav.module.css";

const BOTTOM_NAV = [
  { name: "home", href: "/", label: "Home" },
  { name: "tasks", href: "/tasks", label: "Tasks" },
  { name: "events", href: "/events", label: "Events" },
  { name: "reports", href: "/reports", label: "Reports" },
  { name: "downloads", href: "/downloads", label: "Files" },
  { name: "profile", href: "/profile", label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Main">
      <ul className={styles.list}>
        {BOTTOM_NAV.map(item => (
          <li key={item.href} className={styles.item}>
            <AppLink href={item.href} className={styles.link} aria-label={item.label}>
              <Icon name={item.name as any} variant="duotone" className="w-6 h-6" />
              <span className={styles.label}>{item.label}</span>
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}