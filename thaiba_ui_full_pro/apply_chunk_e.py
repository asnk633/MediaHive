import os
from pathlib import Path

# ============================================================
# 1) src/hooks/useWindowSize.tsx
# ============================================================
(Path("src/hooks/useWindowSize.tsx")).parent.mkdir(parents=True, exist_ok=True)
(Path("src/hooks/useWindowSize.tsx")).write_text("""import { useEffect, useState } from "react";

export default function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}
""")

# ============================================================
# 2) src/components/Sidebar.tsx
# ============================================================
(Path("src/components/Sidebar.tsx")).write_text("""import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import classNames from "classnames";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const loc = useLocation();
  const { role } = useAuth();

  const items = [
    { name: "Home", path: "/" },
    { name: "Tasks", path: "/tasks" },
    { name: "Events", path: "/events" },
    { name: "Calendar", path: "/calendar" },
    { name: "Reports", path: "/reports" },
    { name: "Profile", path: "/profile" },
  ];

  // Admin-only items
  if (role?.role === "admin") {
    items.push({ name: "Role Manager", path: "/admin/roles" });
    items.push({ name: "Create Notification", path: "/create-notif" });
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 220 }}
      className="bg-slate-900 border-r border-white/5 text-sm text-gray-200 h-full flex flex-col"
      style={{ minHeight: "calc(100vh - 0px)" }}
    >
      <div className="px-3 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded" />
          {!collapsed && <span className="font-semibold">Thaiba</span>}
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={onToggle}
          className="p-1 rounded hover:bg-white/5"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {items.map((it) => (
          <Link
            key={it.path}
            to={it.path}
            className={classNames(
              "flex items-center gap-3 px-3 py-2 rounded",
              loc.pathname === it.path ? "bg-white/5 font-semibold" : "hover:bg-white/2"
            )}
          >
            <span className="w-6 text-center">•</span>
            {!collapsed && <span>{it.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4">
        {!collapsed && (
          <div className="text-xs opacity-70">
            Version 1.0 • Thaiba Garden
          </div>
        )}
      </div>
    </motion.aside>
  );
}
""")

# ============================================================
# 3) src/components/Drawer.tsx
# ============================================================
(Path("src/components/Drawer.tsx")).write_text("""import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Drawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { role } = useAuth();

  const items = [
    { name: "Home", path: "/" },
    { name: "Tasks", path: "/tasks" },
    { name: "Events", path: "/events" },
    { name: "Calendar", path: "/calendar" },
    { name: "Reports", path: "/reports" },
    { name: "Profile", path: "/profile" },
  ];

  if (role?.role === "admin") {
    items.push({ name: "Role Manager", path: "/admin/roles" });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween" }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900 z-[70] p-4"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded" />
                <div>
                  <div className="font-semibold">Thaiba Garden</div>
                  <div className="text-xs opacity-70">Media Manager</div>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              {items.map((it) => (
                <Link key={it.path} to={it.path} onClick={onClose} className="px-3 py-2 rounded hover:bg-white/5">
                  {it.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
""")

# ============================================================
# 4) src/components/FABMenu.tsx
# ============================================================
(Path("src/components/FABMenu.tsx")).write_text("""import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FABMenu() {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: "task", label: "New Task", onClick: () => window.dispatchEvent(new CustomEvent("open-task-modal")) },
    { id: "event", label: "New Event", onClick: () => alert("New Event - placeholder") },
    { id: "notif", label: "Notify", onClick: () => alert("Notify - placeholder") },
  ];

  return (
    <>
      <div className="fixed left-1/2 -translate-x-1/2 bottom-[20px] z-40">
        <div className="relative">
          <button
            onClick={() => setOpen((s) => !s)}
            className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center text-3xl"
            aria-label="Open FAB"
          >
            {open ? "×" : "+"}
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 flex flex-col gap-2 items-stretch"
              >
                {actions.map((a) => (
                  <motion.li key={a.id} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={() => { a.onClick(); setOpen(false); }}
                      className="w-full text-left px-4 py-2 rounded bg-white/6"
                    >
                      {a.label}
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
""")

# ============================================================
# 5) Update src/components/Layout.tsx
# ============================================================
(Path("src/components/Layout.tsx")).write_text("""import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import FABMenu from "./FABMenu";
import Sidebar from "./Sidebar";
import Drawer from "./Drawer";
import useWindowSize from "../hooks/useWindowSize";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const size = useWindowSize();

  // auto collapse on small screens
  useEffect(() => {
    if (size.width <= 768) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [size.width]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for larger screens */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
      </div>

      {/* Drawer for mobile */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
          {/* Mobile menu opener */}
          <div className="md:hidden mb-4">
            <button
              className="px-3 py-2 bg-white/10 rounded"
              onClick={() => setDrawerOpen(true)}
            >
              Menu
            </button>
          </div>

          {/* content */}
          <div>
            <Outlet />
          </div>
        </main>

        <BottomNav />
        <FABMenu />
      </div>
    </div>
  );
}
""")

# ============================================================
# 6) Update src/styles/globals.css
# ============================================================
globals_css = Path("src/styles/globals.css")
if globals_css.exists():
    content = globals_css.read_text()
    new_styles = """
/* layout invariants */
:root { --bottom-nav-height: 26px; }

/* ensure app main area sits above bottom nav on mobile */
body { padding-bottom: calc(var(--bottom-nav-height) + 60px); }

/* small helper for sidebar collapse transitions */
@media (min-width: 768px) {
  aside {
    transition: width 0.22s ease;
  }
}

/* small tweak for FAB on smaller screens */
@media (max-width: 480px) {
  .fab { bottom: 18px !important; width: 56px !important; height: 56px !important; }
}
"""
    if "layout invariants" not in content:
        globals_css.write_text(content + new_styles)

print("Chunk E files applied successfully!")
