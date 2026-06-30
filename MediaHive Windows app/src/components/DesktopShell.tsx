"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useIsTauri } from "@/lib/hooks/useIsTauri";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BreadcrumbTabs } from "./BreadcrumbTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, MessageSquare,
  Settings, LogOut, Film, User,
  Calendar, Download, Package, Factory,
  HelpCircle, ChevronsLeft, ChevronsRight, Users,
  ChevronRight, X, Sun, Moon, Terminal
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { useWindow } from "@/contexts/WindowContext";
import { useTheme } from "@/contexts/ThemeContext";
import { eventBus } from "@/lib/eventBus";
import TelemetryModal from "@/components/TelemetryModal";

/** Live clock hook — updates every second */
function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

interface DesktopShellProps {
  children: React.ReactNode;
}

const SIDEBAR_EXPANDED_W = 240;
const SIDEBAR_COLLAPSED_W = 56;
const SIDEBAR_GAP = 0;

export default function DesktopShell({ children }: DesktopShellProps) {
  const pathname = usePathname() as string;
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const { user, logout } = useAuth();
  const clock = useClock();
  const { theme, toggleTheme } = useTheme();

  // Collapsible Right Details Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<any>(null);

  useEffect(() => {
    const handleOpen = (data: any) => {
      setDrawerContent(data);
      setDrawerOpen(true);
    };
    const handleClose = () => {
      setDrawerOpen(false);
    };

    eventBus.on("mediahive:open-drawer", handleOpen);
    eventBus.on("mediahive:close-drawer", handleClose);

    // Escape key listener to close drawer
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      eventBus.off("mediahive:open-drawer", handleOpen);
      eventBus.off("mediahive:close-drawer", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const { isMaximized, isDesktop: isDesktopApp } = useWindow();

  const sidebarW    = sidebarExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W;
  const sidebarGap  = SIDEBAR_GAP;

  const getInitials = (name: string) => {
    if (!name) return "MH";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const navSections = [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/",          icon: LayoutDashboard },
        { label: "Tasks",     href: "/tasks",      icon: CheckSquare     },
        { label: "Chat",      href: "/chat",       icon: MessageSquare   },
        { label: "Events",    href: "/events",     icon: Calendar        },
      ],
    },
    {
      label: "Library",
      items: [
        { label: "Downloads", href: "/downloads",  icon: Download        },
        { label: "Inventory", href: "/inventory",  icon: Package         },
        ...(user?.role === "admin" || user?.role === "manager"
          ? [{ label: "Labs", href: "/labs", icon: Factory }]
          : []),
      ],
    },
    {
      label: "System",
      items: [
        { label: "Profile",   href: "/profile",   icon: User            },
        { label: "Settings",  href: "/settings",  icon: Settings        },
        { label: "Support",   href: "/support",   icon: HelpCircle      },
      ],
    },
  ];

  const isSidebarItemActive = (itemHref: string) => {
    if (itemHref === "/") {
      return ["/", "/insights", "/notifications"].includes(pathname);
    }
    if (itemHref === "/events") {
      return ["/events", "/calendar", "/campaigns"].includes(pathname);
    }
    if (itemHref === "/settings") {
      return ["/settings", "/activity", "/updates"].includes(pathname);
    }
    if (itemHref === "/profile") {
      return ["/profile", "/leave"].includes(pathname);
    }
    return pathname === itemHref || (itemHref !== "/" && pathname.startsWith(itemHref + "/"));
  };

  const pageLabel =
    pathname === "/" ? "OVERVIEW" : pathname.split("/")[1].toUpperCase();

  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <div 
      className={`desktop-shell-root relative w-full h-full overflow-hidden select-none ${isDesktopApp ? "desktop-app" : ""}`} 
      style={{ 
        background: "transparent", 
        color: "var(--text-primary)",
        "--sidebar-width": `${sidebarW}px`,
        "--sidebar-gap": `${sidebarGap}px`
      } as React.CSSProperties}
    >

      {/* ── Collapsible Left Sidebar ───────────────────────────────────── */}
      <div
        className="sidebar-shell flex flex-col"
        style={{ zIndex: 20 }}
      >

        {/* ── Brand Header ───────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-4 pt-4 pb-3 shrink-0 ${!sidebarExpanded ? "justify-center px-0" : ""}`}>
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border)]">
              <img src="/mediahive-icon.png" alt="MediaHive Logo" className="w-full h-full object-contain p-0" />
            </div>
          </div>

          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex flex-col overflow-hidden whitespace-nowrap min-w-0"
              >
                <span className="text-[13px] font-bold text-[var(--text-primary)] tracking-[0.01em] leading-tight">MediaHive</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-online" />
                  <span className="text-[9px] text-[var(--text-secondary)] font-bold tracking-[0.1em] uppercase">Production</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Search Trigger Pill ──────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="px-2.5 mb-2 shrink-0"
            >
              <button 
                onClick={() => eventBus.emit("mediahive:toggle-search")}
                className="w-full flex items-center justify-between px-3 h-8 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-tertiary)]">🔍</span>
                  <span>Search...</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border)]">⌘K</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Nav Sections ───────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-2.5 gap-1 mt-2" style={{ scrollbarWidth: "none" }}>
          {navSections.map((section, si) => (
            <div key={section.label} className={`flex flex-col gap-0.5 ${si > 0 ? "mt-3" : ""}`}>

              {/* Section label */}
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 px-2 mb-1"
                  >
                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {section.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav items */}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isSidebarItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item outline-none ${isActive ? "active" : ""} ${!sidebarExpanded ? "justify-center !px-0" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <div className={`flex-shrink-0 flex items-center justify-center w-[28px] h-[28px] rounded-md transition-all duration-200 ${
                      isActive && !sidebarExpanded
                        ? "bg-[var(--bg-tertiary)] border border-[var(--border)]"
                        : "bg-transparent"
                    }`}>
                      <Icon
                        size={14}
                        className={isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                    </div>

                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className={`text-[13px] overflow-hidden whitespace-nowrap flex-1 ${
                            isActive ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Bottom: Profile + Collapse ─────────────────────────────── */}
        <div className="px-2.5 pb-4 pt-2 flex flex-col gap-2 shrink-0">

          {/* Profile popup */}
          <div className="relative">
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full left-2 mb-2 w-52 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md shadow-lg flex flex-col gap-2"
                  style={{ zIndex: 30 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User info */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border)] shrink-0">
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--accent)]">{getInitials(user?.name || "")}</span>
                      }
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{user?.name || "Account"}</span>
                      <span className="text-[9px] text-[var(--text-tertiary)] truncate">{user?.email}</span>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border)] my-1" />

                  <Link href="/settings" onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-tertiary)] transition-colors">
                    <Settings size={12} className="text-[var(--text-tertiary)]" /> Settings
                  </Link>
                  <Link href="/profile" onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-tertiary)] transition-colors">
                    <Users size={12} className="text-[var(--text-tertiary)]" /> Profile
                  </Link>
                  <button
                    onClick={() => { setShowProfileMenu(false); setIsTelemetryOpen(true); }}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-tertiary)] transition-colors w-full text-left cursor-pointer"
                  >
                    <Terminal size={12} className="text-[var(--text-tertiary)]" /> Telemetry Logs
                  </button>

                  <div className="h-px bg-[var(--border)] my-1" />

                  <button
                    onClick={async () => { setShowProfileMenu(false); await logout(); }}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-red-500 hover:text-red-400 rounded hover:bg-red-500/5 transition-colors w-full text-left cursor-pointer"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile pod */}
            <motion.div
              className={`flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer transition-all duration-150
                border border-transparent hover:bg-[var(--bg-tertiary)]
                ${showProfileMenu ? "bg-[var(--bg-tertiary)] border-[var(--border)]" : ""}
                ${!sidebarExpanded ? "justify-center" : ""}
              `}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setShowProfileMenu(!showProfileMenu)}
            >
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-md overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    : <span className="text-[10px] font-bold text-[var(--accent)]">{getInitials(user?.name || "")}</span>
                  }
                </div>
                <span className="status-online absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-[var(--bg-secondary)]" />
              </div>

              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col min-w-0 overflow-hidden flex-1"
                  >
                    <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">{user?.name || "Account"}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] capitalize truncate leading-tight mt-0.5">{user?.role || "User"}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`flex items-center gap-2 h-8 px-2 rounded-md w-full
              text-[var(--text-secondary)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer
              ${!sidebarExpanded ? "justify-center" : ""}
            `}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-[18px] h-[18px]">
              {sidebarExpanded ? <ChevronsLeft size={13} /> : <ChevronsRight size={13} />}
            </div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[11px] font-medium whitespace-nowrap overflow-hidden tracking-wide"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Main workspace ─────────────────────────────────────────────── */}
      <div
        className="main-workspace-shell absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden"
        style={{ zIndex: 10 }}
      >
        {/* Context breadcrumb header (Height: 48px -> h-12) */}
        <header className="h-12 border-b border-[var(--border)] flex items-center shrink-0 bg-[var(--bg-secondary)] backdrop-blur-md px-4 z-20">
          <div className="flex items-center pr-4 shrink-0 border-r border-[var(--border)] h-full">
            <h2 className="text-[10px] font-bold text-[var(--text-tertiary)] tracking-[0.1em] uppercase m-0">{pageLabel}</h2>
          </div>
          <Suspense fallback={<div className="h-4 w-24 animate-pulse bg-[var(--bg-tertiary)] rounded ml-4" />}>
            <div className="ml-2 flex items-center h-full">
              <BreadcrumbTabs pathname={pathname} />
            </div>
          </Suspense>
          <div className="ml-auto flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {clock && (
              <span className="text-[10px] font-mono font-medium text-[var(--text-tertiary)] tracking-wider tabular-nums">
                {clock}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-tertiary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-online" />
              <span className="text-[9px] text-[var(--text-secondary)] tracking-wider font-bold uppercase">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content area */}
        <div className="flex-1 relative flex overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease }}
              className="flex-1 overflow-y-auto p-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>

          {/* ── Collapsible Right Detail Drawer ─────────────────────────── */}
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ x: 280 }}
                animate={{ x: 0 }}
                exit={{ x: 280 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-[280px] h-full bg-[var(--bg-secondary)] backdrop-blur-md border-l border-[var(--border)] flex flex-col p-4 shadow-sm overflow-y-auto shrink-0"
                style={{ zIndex: 15 }}
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-3">
                  <h3 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {drawerContent?.title || "Details"}
                  </h3>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer p-0.5 rounded hover:bg-[var(--bg-tertiary)]"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-3 text-[11px]">
                  {drawerContent?.metadata && Object.entries(drawerContent.metadata).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-[var(--text-tertiary)] uppercase tracking-wider font-bold text-[9px]">
                        {key}
                      </span>
                      <span className="text-[var(--text-secondary)] font-medium break-words">
                        {String(value)}
                      </span>
                    </div>
                  ))}

                  {drawerContent?.children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TelemetryModal isOpen={isTelemetryOpen} onClose={() => setIsTelemetryOpen(false)} />
    </div>
  );
}
