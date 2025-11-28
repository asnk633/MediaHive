import os
from pathlib import Path

# ============================================================
# D1 — Firestore Notification Service
# ============================================================
(Path("src/services/notificationService.ts")).write_text("""import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

import { db } from "../../firebase/auth";

export const notifRef = collection(db, "notifications");

export function listenNotifications(callback: Function) {
  const q = query(notifRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(all);
  });
}

export async function pushNotification(data: any) {
  data.createdAt = Date.now();
  data.readBy = [];
  return await addDoc(notifRef, data);
}

export async function deleteNotification(id: string) {
  const ref = doc(db, "notifications", id);
  await deleteDoc(ref);
}

export async function markAsRead(id: string, uid: string) {
  const ref = doc(db, "notifications", id);
  // Firestore "arrayUnion" is not safe without backend rules here
  // so we rewrite manually by reading listener context
  return { id, uid }; // handled in NotificationContext
}
""")

# ============================================================
# D2 — Notification Context Provider
# ============================================================
(Path("src/context/NotificationContext.tsx")).write_text("""import React, { createContext, useContext, useEffect, useState } from "react";
import { listenNotifications, pushNotification, deleteNotification } from "../services/notificationService";
import { useAuth } from "./AuthContext";
import { db } from "../../firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenNotifications((all) => {
      setNotifications(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const unreadCount = notifications.filter(
    (n) => !n.readBy?.includes(user?.uid)
  ).length;

  const markRead = async (notif: any) => {
    if (!user) return;
    const ref = doc(db, "notifications", notif.id);
    await updateDoc(ref, {
      readBy: Array.from(new Set([...(notif.readBy || []), user.uid]))
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markRead,
      loading,
      pushNotification,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
""")

# ============================================================
# D3 — Notification Bell in TopBar
# ============================================================
(Path("src/components/TopBar.tsx")).write_text("""import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationPanel from "./NotificationPanel";

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur px-4 py-4 shadow flex justify-between items-center">
      <h1 className="font-semibold text-lg">Thaiba Garden Media Manager</h1>

      <div className="flex items-center gap-4">
        <button
          className="relative"
          onClick={() => setOpen(!open)}
        >
          <span className="material-icons text-2xl">notifications</span>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 px-1.5 py-0.5 rounded-full text-xs">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="px-3 py-1 bg-white/10 rounded"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
""")

# ============================================================
# D4 — Notification Dropdown Panel (animated)
# ============================================================
(Path("src/components/NotificationPanel.tsx")).write_text("""import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

export default function NotificationPanel({ open, onClose }) {
  const { notifications, markRead, deleteNotification } = useNotifications();
  const { role, user } = useAuth();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-4 top-16 w-80 bg-slate-800 border border-white/10 rounded-lg p-4 shadow-xl z-[200]"
        >
          <h3 className="font-semibold mb-3">Notifications</h3>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="opacity-50">No notifications.</p>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 mb-2 bg-white/10 rounded cursor-pointer"
                onClick={() => markRead(n)}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-sm opacity-80">{n.body}</p>

                {role?.role === "admin" && (
                  <button
                    className="text-xs text-red-400 mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-right mt-3">
            <button
              className="text-sm opacity-70 hover:opacity-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
""")

# ============================================================
# D5 — Admin Notification Creator Page
# ============================================================
(Path("src/routes/CreateNotification.tsx")).write_text("""import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function CreateNotification() {
  const { role } = useAuth();
  const { pushNotification } = useNotifications();

  if (role?.role !== "admin") {
    return <div className="p-6">Admin only.</div>;
  }

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const send = async () => {
    await pushNotification({
      title,
      body,
      readBy: []
    });
    setTitle("");
    setBody("");
    alert("Sent!");
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Send Notification</h2>

      <input
        className="w-full p-2 bg-white/20 rounded mb-3"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full p-2 bg-white/20 rounded mb-4"
        rows={3}
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <button
        className="px-4 py-2 bg-indigo-600 rounded"
        onClick={send}
      >
        Send
      </button>
    </div>
  );
}
""")

print("Chunk D files applied successfully!")
