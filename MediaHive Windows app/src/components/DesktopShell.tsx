"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, MessageSquare,
  Settings, LogOut, Film, User,
  Calendar, Download, Package, Factory,
  HelpCircle, ChevronsLeft, ChevronsRight, Users,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";

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
const SIDEBAR_COLLAPSED_W = 68;
const SIDEBAR_GAP = 20;

export default function DesktopShell({ children }: DesktopShellProps) {
  const pathname = usePathname() as string;
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const clock = useClock();

  const sidebarW    = sidebarExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W;
  const contentLeft = SIDEBAR_GAP + sidebarW + SIDEBAR_GAP;

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

  const contextBreadcrumbs: Record<string, string[]> = {
    "/":          ["Overview", "Insights", "Notifications"],
    "/tasks":     ["My Tasks", "Board View", "Backlog"],
    "/events":    ["Calendar", "Events", "Campaigns"],
    "/inventory": ["Inventory"],
    "/downloads": ["Downloads"],
    "/chat":      ["Direct Messages", "Channels"],
    "/settings":  ["General", "Activity", "Updates"],
    "/profile":   ["Profile", "Leave Management"],
    "/labs":      ["Labs"],
    "/support":   ["Support"],
  };

  const currentBreadcrumbs = Object.entries(contextBreadcrumbs).find(
    ([key]) => pathname === key || (key !== "/" && pathname.startsWith(key))
  )?.[1] ?? [];

  const pageLabel =
    pathname === "/" ? "OVERVIEW" : pathname.split("/")[1].toUpperCase();

  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ backgroundColor: "#080810", color: "#f1f5f9" }}>

      {/* Aurora drift blobs */}
      <div className="aurora-container-global">
        <div className="aurora-blob-main aurora-teal"   />
        <div className="aurora-blob-main aurora-indigo" />
        <div className="aurora-blob-main aurora-violet" />
        <div className="aurora-blob-main aurora-blue"   />
      </div>

      {/* Overlays */}
      <div className="noise-overlay-global" />
      <div className="scanline-overlay-global" />

      {/* ── Floating Sidebar ──────────────────────────────────────────── */}
      <motion.aside
        className="sidebar-shell sidebar-shell-depth sidebar-shell-floating flex flex-col"
        animate={{ width: sidebarW }}
        transition={{ type: "tween", ease, duration: 0.45 }}
        style={{ zIndex: 20 }}
      >

        {/* ── Brand Header ───────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-4 pt-5 pb-4 shrink-0 ${!sidebarExpanded ? "justify-center px-0" : ""}`}>
          {/* Logo mark */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-teal-400/30 via-teal-500/15 to-indigo-500/20 border border-teal-400/35 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Film size={16} className="text-teal-300" />
            </div>
            {/* Logo glow halo */}
            <div className="absolute inset-0 rounded-[11px] bg-teal-400/10 blur-[8px] -z-10" />
          </div>

          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col overflow-hidden whitespace-nowrap min-w-0"
              >
                <span className="text-[13px] font-bold text-white tracking-[0.01em] leading-tight">MediaHive</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 status-online" />
                  <span className="text-[9px] text-teal-400/80 font-bold tracking-[0.18em] uppercase">Production</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand divider */}
        <div className="mx-4 mb-3 h-px" style={{ background: "linear-gradient(90deg, rgba(20,184,166,0.2), rgba(255,255,255,0.06) 50%, transparent)" }} />

        {/* ── Nav Sections ───────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-3 gap-1" style={{ scrollbarWidth: "none" }}>
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
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.22em]">
                      {section.label}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav items */}
              {section.items.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item outline-none ${isActive ? "active" : ""} ${!sidebarExpanded ? "justify-center !px-0" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    {/* Icon container — has bg on active */}
                    <div className={`flex-shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-[9px] transition-all duration-250 ${
                      isActive
                        ? "bg-teal-500/15 shadow-[0_0_10px_rgba(20,184,166,0.18),inset_0_1px_0_rgba(20,184,166,0.15)]"
                        : "bg-transparent group-hover:bg-white/4"
                    }`}>
                      <Icon
                        size={15}
                        className={`${isActive ? "text-teal-400" : "text-zinc-500"} transition-colors duration-200`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>

                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className={`text-[13px] overflow-hidden whitespace-nowrap flex-1 ${
                            isActive ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active chevron */}
                    <AnimatePresence>
                      {isActive && sidebarExpanded && (
                        <motion.div
                          initial={{ opacity: 0, x: 4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <ChevronRight size={11} className="text-teal-500/60 shrink-0" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Bottom: Profile + Collapse ─────────────────────────────── */}
        <div className="px-3 pb-4 pt-3 flex flex-col gap-2 shrink-0">

          {/* Divider */}
          <div className="h-px mb-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 50%, transparent)" }} />

          {/* Profile popup */}
          <div className="relative">
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-2 w-56 p-4 glass-card-premium shadow-2xl flex flex-col gap-3"
                  style={{ zIndex: 30 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-teal-300 bg-gradient-to-br from-teal-500/20 to-indigo-500/20">{getInitials(user?.name || "")}</span>
                      }
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-semibold text-white truncate">{user?.name || "Account"}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
                      <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider mt-0.5 capitalize">{user?.role}</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.05]" />

                  <Link href="/settings" onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-1 py-1 text-[11px] font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                    <Settings size={12} className="text-zinc-600" /> Settings
                  </Link>
                  <Link href="/profile" onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-1 py-1 text-[11px] font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                    <Users size={12} className="text-zinc-600" /> My Profile
                  </Link>

                  <div className="h-px bg-white/[0.05]" />

                  <button
                    onClick={async () => { setShowProfileMenu(false); await logout(); }}
                    className="flex items-center gap-2.5 px-1 py-1 text-[11px] font-medium text-red-400/80 hover:text-red-300 rounded-lg hover:bg-red-500/8 transition-all w-full text-left"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile pod */}
            <motion.div
              className={`flex items-center gap-2.5 p-2 rounded-[13px] cursor-pointer transition-all duration-200
                border border-transparent hover:border-white/[0.07] hover:bg-white/[0.04]
                ${showProfileMenu ? "bg-white/[0.05] border-white/[0.08]" : ""}
                ${!sidebarExpanded ? "justify-center" : ""}
              `}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setShowProfileMenu(!showProfileMenu)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-[10px] overflow-hidden bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-teal-300">{getInitials(user?.name || "")}</span>
                  }
                </div>
                <span className="status-online absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-[1.5px] border-[#080810]" />
              </div>

              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex flex-col min-w-0 overflow-hidden flex-1"
                  >
                    <span className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">{user?.name || "Account"}</span>
                    <span className="text-[10px] text-zinc-500 capitalize truncate leading-tight mt-0.5">{user?.role || "User"}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chevron */}
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight size={12} className="text-zinc-500 shrink-0" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Collapse toggle */}
          <motion.button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`flex items-center gap-2.5 h-9 px-2.5 rounded-[10px] w-full
              text-zinc-600 hover:text-zinc-300
              border border-transparent hover:border-white/[0.07] hover:bg-white/[0.04]
              transition-all duration-250
              ${!sidebarExpanded ? "justify-center" : ""}
            `}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-[22px] h-[22px] rounded-md bg-white/5">
              {sidebarExpanded
                ? <ChevronsLeft size={13} />
                : <ChevronsRight size={13} />
              }
            </div>
            <AnimatePresence>
              {sidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="text-[11px] font-medium whitespace-nowrap overflow-hidden tracking-wide"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main workspace ─────────────────────────────────────────────── */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden"
        animate={{ left: contentLeft }}
        transition={{ type: "tween", ease, duration: 0.45 }}
        style={{ zIndex: 10 }}
      >
        {/* Context breadcrumb header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center shrink-0 bg-[#080810]/40 backdrop-blur-sm">
          <div className="flex items-center px-6 shrink-0 border-r border-white/[0.06] h-full">
            <h2 className="text-[10px] font-bold text-zinc-400 tracking-[0.18em] uppercase m-0">{pageLabel}</h2>
          </div>
          {currentBreadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {currentBreadcrumbs.map((crumb, i) => (
                <span
                  key={crumb}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors shrink-0 ${
                    i === 0
                      ? "bg-teal-500/10 text-teal-300 font-semibold border-teal-500/25 shadow-[0_0_12px_rgba(20,184,166,0.12)]"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 cursor-pointer"
                  }`}
                >
                  {crumb}
                </span>
              ))}
            </div>
          )}
          <div className="ml-auto px-6 flex items-center gap-4">
            {clock && (
              <span className="text-[10px] font-mono font-semibold text-zinc-500 tracking-widest tabular-nums">
                {clock}
              </span>
            )}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/18">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-online" />
              <span className="text-[10px] text-emerald-400/80 tracking-widest font-semibold uppercase">Online</span>
            </div>
          </div>
        </header>

        {/* Animated page transition */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(6px)", y: 6 }}
            transition={{ duration: 0.32, ease }}
            className="flex-1 overflow-y-auto p-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
