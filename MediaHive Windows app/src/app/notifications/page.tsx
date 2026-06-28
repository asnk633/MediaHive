"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Bell, CheckCircle2, MessageSquare, AlertCircle, 
  Calendar, FileImage, ShieldAlert, Check, Trash2, Eye
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

interface NotificationItem {
  id: string;
  type: "mention" | "task" | "system" | "review";
  title: string;
  message: string;
  time: string;
  unread: boolean;
  meta?: {
    sender?: string;
    targetId?: string;
    targetName?: string;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "tasks" | "system">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data) {
          setNotifications(data.map((n: any) => ({
            id: String(n.id),
            type: n.type || "system",
            title: n.title || "Notification",
            message: n.message || "",
            time: new Date(n.created_at).toLocaleDateString(),
            unread: !n.is_read,
            meta: n.meta
          })));
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  // Handle global quick create "?create=true" query parameter offline-safe
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkQuery = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("create") === "true") {
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    checkQuery();
    const interval = setInterval(checkQuery, 250);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    if (user) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;
    if (activeTab === "mentions") return notifications.filter(n => n.type === "mention");
    if (activeTab === "tasks") return notifications.filter(n => n.type === "task");
    if (activeTab === "system") return notifications.filter(n => n.type === "system");
    return notifications;
  };

  const filtered = getFilteredNotifications();
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Workspace Inbox
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Notifications</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Alerts, team updates, and active task alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Check size={16} className="text-teal-400" />
            <span>Mark all read</span>
          </button>
        )}
      </header>

      {/* Tabs / Filter bar */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900/10 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 bg-zinc-950/40 p-1 rounded-xl border border-white/5">
          {(["all", "mentions", "tasks", "system"] as const).map((tab) => {
            const count = tab === "all" 
              ? notifications.length 
              : notifications.filter(n => n.type === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab 
                    ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <span>{tab}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-zinc-500 font-semibold">
          Unread Alerts: <span className="text-teal-400">{unreadCount}</span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm">Loading notifications...</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/5 flex flex-col items-center justify-center gap-4 py-20">
                <Bell className="w-10 h-10 text-zinc-600" />
                <p className="text-zinc-500 text-sm">No notifications found in this category.</p>
              </div>
          ) : (
            filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  item.unread 
                    ? "bg-gradient-to-r from-teal-500/5 to-indigo-500/5 border-teal-500/20" 
                    : "bg-zinc-900/10 border-white/5 hover:bg-zinc-900/20"
                }`}
              >
                {/* Left side: Icons and details */}
                <div className="flex items-start gap-4">
                  {/* Styled Icon */}
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    item.type === "mention" 
                      ? "bg-teal-500/10 border-teal-500/20 text-teal-400" 
                      : item.type === "task"
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      : item.type === "system"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    {item.type === "mention" && <MessageSquare size={16} />}
                    {item.type === "task" && <Calendar size={16} />}
                    {item.type === "system" && <ShieldAlert size={16} />}
                    {item.type === "review" && <FileImage size={16} />}
                  </div>

                  {/* Text details */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white m-0">
                        {item.title}
                      </h4>
                      {item.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed m-0">
                      {item.message}
                    </p>
                    
                    {/* Optional metadata pills */}
                    {item.meta && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/40 border border-teal-900/30 px-2 py-0.5 rounded">
                          {item.meta.targetName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Actions & Time */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {item.time}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {item.unread && (
                      <button 
                        onClick={() => markAsRead(item.id)}
                        title="Mark as read"
                        className="p-1.5 rounded-lg bg-zinc-950/40 border border-white/5 text-zinc-500 hover:text-teal-400 transition-colors cursor-pointer"
                      >
                        <Check size={13} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(item.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-zinc-950/40 border border-white/5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        )}
      </div>

    </div>
  );
}

