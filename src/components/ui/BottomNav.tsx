// src/components/ui/BottomNav.tsx
"use client";
import Link from "next/link";
import React from "react";
import styles from "./bottomnav.module.css";

const NAV = [
  { key: "home", label: "Home", href: "/"},
  { key: "tasks", label: "Tasks", href: "/tasks"},
  { key: "events", label: "Events", href: "/events"},
  { key: "reports", label: "Reports", href: "/reports"},
  { key: "downloads", label: "Downloads", href: "/downloads"},
  { key: "profile", label: "Profile", href: "/profile"},
];

export default function BottomNav(){
  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Main">
      <ul className={styles.list}>
        {NAV.map(item => (
          <li key={item.key} className={styles.item}>
            <Link href={item.href} className={styles.link}>
              <span className={styles.icon} aria-hidden>◻</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}