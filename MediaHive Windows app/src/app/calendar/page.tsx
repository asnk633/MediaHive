"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Sparkles, Clock,
  X, Loader2, CheckCircle2, AlertCircle, MapPin, Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  date: string; // YYYY-MM-DD
}

interface Toast {
  type: "success" | "error" | "loading";
  message: string;
}

const EVENT_COLORS = [
  "bg-teal-500", "bg-indigo-500", "bg-amber-500",
  "bg-emerald-500", "bg-sky-500", "bg-purple-500", "bg-pink-500",
];
const BORDER_COLORS = [
  "border-l-teal-500", "border-l-indigo-500", "border-l-amber-500",
  "border-l-emerald-500", "border-l-sky-500", "border-l-purple-500", "border-l-pink-500",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const days: { num: number; isCurrentMonth: boolean; fullDate: string }[] = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ num: daysInPrev - i, isCurrentMonth: false, fullDate: "" });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    days.push({ num: d, isCurrentMonth: true, fullDate: `${year}-${mm}-${dd}` });
  }
  // Next month padding to fill 6 rows (42 cells)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ num: d, isCurrentMonth: false, fullDate: "" });
  }
  return days;
}

function formatTime(timeStr: string) {
  if (!timeStr) return "--:--";
  return timeStr.slice(0, 5);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // Create event modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "",
    date: selectedDate, start_time: "09:00", end_time: "10:00",
  });

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    if (type !== "loading") setTimeout(() => setToast(null), 3500);
  };

  // ─── Fetch events for the visible month ──────────────────────────────────
  const fetchEvents = async () => {
    if (!user) return;
    if (!user.institution_id && !user.tenant_id) return;
    setLoadingEvents(true);
    try {
      const startOfMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
      const endOfMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${new Date(viewYear, viewMonth + 1, 0).getDate()}`;

      let query = supabase
        .from("events")
        .select("id, title, description, start_time, end_time, location, date")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth)
        .order("start_time", { ascending: true });
        
      if (user.institution_id) {
        query = query.eq("institution_id", user.institution_id);
      } else if (user.tenant_id) {
        query = query.eq("tenant_id", user.tenant_id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user?.institution_id || user?.tenant_id)) fetchEvents();
    else if (!authLoading) setLoadingEvents(false);
  }, [user, authLoading, viewYear, viewMonth]);

  // ─── Create Event ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !user) return;
    setCreating(true);
    showToast("loading", "Creating event...");
    try {
      const { error } = await supabase.from("events").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_by_id: user.id,
        status: "scheduled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      showToast("success", "Event created!");
      setShowCreateModal(false);
      setForm({ title: "", description: "", location: "", date: selectedDate, start_time: "09:00", end_time: "10:00" });
      await fetchEvents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create event.");
    } finally {
      setCreating(false);
    }
  };

  // ─── Calendar grid ────────────────────────────────────────────────────────
  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  // Map events to dates for quick lookup
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const selectedDayEvents = eventsByDate[selectedDate] || [];

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${today.getFullYear()}-${mm}-${dd}`);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-semibold ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
              "bg-zinc-900/80 border-white/10 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "loading" && <Loader2 size={16} className="animate-spin" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">New Event</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Schedule an event for your workspace</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Event Title *</label>
                  <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Weekly Team Sync"
                    className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Optional notes..."
                    className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 transition-all font-sans resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date *</label>
                    <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                    <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Room / Online"
                      className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Start Time</label>
                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">End Time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                  </div>
                </div>
                <button type="submit" disabled={creating || !form.title.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all cursor-pointer">
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} /> Planner
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Calendar</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">Coordinate shoots, reviews, deadlines and client campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={goToToday}
            className="px-3 py-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 text-xs font-semibold text-zinc-300 transition-all cursor-pointer">
            Today
          </button>
          <button
            onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowCreateModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer">
            <Plus size={16} /> New Event
          </button>
        </div>
      </header>

      {/* Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h2 className="text-xl font-bold text-white m-0">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <div className="flex items-center gap-1 bg-zinc-950/40 border border-white/5 p-1 rounded-xl">
              <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <span key={d}>{d}</span>)}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const isSelected = day.fullDate === selectedDate && day.isCurrentMonth;
              const isToday = day.fullDate === todayStr;
              const dayEvents = day.fullDate ? (eventsByDate[day.fullDate] || []) : [];

              return (
                <div
                  key={idx}
                  onClick={() => day.isCurrentMonth && setSelectedDate(day.fullDate)}
                  className={`aspect-square rounded-xl p-2 flex flex-col justify-between border transition-all relative z-10 ${
                    !day.isCurrentMonth ? "opacity-20 border-transparent cursor-default" :
                    isSelected
                      ? "bg-gradient-to-br from-teal-500/15 to-indigo-500/15 border-teal-500/40 shadow-[0_0_14px_rgba(13,148,136,0.12)] cursor-pointer"
                      : "glass-card cursor-pointer hover:border-white/10"
                  }`}
                >
                  <span className={`text-xs font-bold leading-none ${
                    isToday ? "text-teal-400" :
                    isSelected ? "text-white" : "text-zinc-400"
                  }`}>
                    {isToday ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-[9px] font-extrabold">
                        {day.num}
                      </span>
                    ) : day.num}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-auto">
                    {dayEvents.slice(0, 2).map((ev, eIdx) => (
                      <span key={eIdx} className={`text-[7px] font-bold text-white px-1 py-0.5 rounded truncate ${EVENT_COLORS[eIdx % EVENT_COLORS.length]}`}>
                        {ev.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[7px] text-zinc-500 font-bold text-center">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: Day timeline */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-2 relative z-10">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Timeline</h3>
            <span className="text-[10px] text-zinc-500">{selectedDate}</span>
          </div>

          {loadingEvents ? (
            <div className="flex items-center gap-2 text-zinc-500 text-xs py-4">
              <Loader2 size={13} className="animate-spin" /> Loading...
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center text-zinc-600">
                <Plus size={18} />
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">No events on this day.<br />Click <strong className="text-zinc-400">New Event</strong> to add one.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedDayEvents.map((ev, idx) => (
                <div key={ev.id}
                  className={`border-l-4 ${BORDER_COLORS[idx % BORDER_COLORS.length]} glass-card p-3 rounded-r-xl flex flex-col gap-2 relative z-10`}>
                  <div>
                    <div className="text-xs font-bold text-zinc-200 leading-normal">{ev.title}</div>
                    {ev.description && <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{ev.description}</div>}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{formatTime(ev.start_time)} – {formatTime(ev.end_time)}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1 text-zinc-500">
                        <MapPin size={9} />
                        <span className="truncate max-w-[80px]">{ev.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setForm(f => ({ ...f, date: selectedDate })); setShowCreateModal(true); }}
            className="mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/10 hover:border-teal-500/30 text-zinc-500 hover:text-teal-400 text-xs font-semibold transition-all cursor-pointer">
            <Plus size={13} /> Add to this day
          </button>
        </div>

      </div>
    </div>
  );
}
