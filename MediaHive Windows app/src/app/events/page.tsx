"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PartyPopper, Calendar, MapPin, Clock, 
  Users, Plus, Sparkles, ArrowUpRight,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_at: "",
    end_at: "",
    production_stage: "Shoot"
  });


  async function fetchEvents() {
    if (authLoading || (!user?.institution_id && !user?.tenant_id)) return;
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('deleted', false)
        .order('start_at', { ascending: true });
        
      if (user.institution_id) {
        query = query.eq('institution_id', user.institution_id);
      } else if (user.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      }
        
      const { data, error } = await query;
      
      if (data && data.length > 0) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [user, authLoading]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('events').insert({
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        created_by: user.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        production_stage: formData.production_stage,
        deleted: false,
        status: "Scheduled"
      });

      if (!error) {
        setShowModal(false);
        setFormData({ title: "", description: "", location: "", start_at: "", end_at: "", production_stage: "Shoot" });
        await fetchEvents();

        if (user.role !== 'admin' && user.role !== 'manager') {
          const { data: admins } = await supabase.from('profiles').select('id').in('role', ['admin', 'manager']);
          if (admins && admins.length > 0) {
            const notifications = admins.map((a: any) => ({
              user_id: a.id,
              type: 'system',
              title: 'New Event Request',
              message: `${user.email || 'A user'} has requested a new event: ${formData.title}`,
              is_read: false,
              created_at: new Date().toISOString()
            }));
            await supabase.from('notifications').insert(notifications);
          }
        }
      } else {
        console.error("Error creating event:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // fallback if it's already formatted
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const formatTime = (startStr: string, endStr: string) => {
    if (!startStr) return "TBD";
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    
    if (isNaN(start.getTime())) return `${startStr} - ${endStr}`;
    
    const startTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = end && !isNaN(end.getTime()) ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
    
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  const displayEvents = events;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Operations Schedule
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Events</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Active shoots, campaign pitches, and review schedules.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Event</span>
        </button>
      </header>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-zinc-500 text-sm col-span-3">Loading events...</div>
        ) : displayEvents.length === 0 ? (
          <div className="text-zinc-500 text-sm col-span-3 text-center py-10 glass-panel rounded-2xl">No events scheduled.</div>
        ) : displayEvents.map((ev) => {
          // Normalize the data between real DB and fallback
          const title = ev.title;
          const desc = ev.description;
          const date = ev.start_at ? formatDate(ev.start_at) : "TBD";
          const time = ev.start_at ? formatTime(ev.start_at, ev.end_at) : "TBD";
          const location = ev.location || "TBD";
          const teamSize = "TBD";
          const category = ev.production_stage || "General";

          return (
            <motion.div
              whileHover={{ y: -4 }}
              key={ev.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[220px] cursor-pointer group hover:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.2)] hover:border-indigo-500/30 transition-all relative overflow-hidden"
            >
              {/* Ambient Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-indigo-500/10 blur-[40px] group-hover:from-teal-500/20 group-hover:to-indigo-500/20 transition-all"></div>

              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full ${
                    category === "Shoot" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                    category === "Pitch" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                    "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}>
                    {category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    <Calendar size={11} />
                    <span>{date}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-zinc-200 mt-4 mb-1.5">{title}</h3>
                <p className="text-xs text-zinc-455 leading-relaxed line-clamp-3">{desc}</p>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <Clock size={12} className="text-zinc-650" />
                  <span>{time}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-zinc-650" />
                    <span className="truncate max-w-[180px]">{location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-teal-400">
                    <Users size={12} />
                    <span>{teamSize}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* New Event Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">New Event</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Schedule a new operation</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent} className="p-6 flex flex-col gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Event Title <span className="text-red-400">*</span></label>
                  <input 
                    type="text" required
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Q3 All Hands"
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Details about the event..." rows={2}
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                    <div className="relative">
                      <select 
                        value={formData.production_stage} onChange={(e) => setFormData({...formData, production_stage: e.target.value})}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans appearance-none cursor-pointer"
                      >
                        <option className="bg-zinc-900" value="Shoot">Shoot</option>
                        <option className="bg-zinc-900" value="Pitch">Pitch</option>
                        <option className="bg-zinc-900" value="Review">Review</option>
                        <option className="bg-zinc-900" value="Meeting">Meeting</option>
                        <option className="bg-zinc-900" value="General">General</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                    <input 
                      type="text"
                      value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Stage 4"
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Start Time <span className="text-red-400">*</span></label>
                    <input 
                      type="datetime-local" required
                      value={formData.start_at} onChange={(e) => setFormData({...formData, start_at: e.target.value})}
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">End Time</label>
                    <input 
                      type="datetime-local"
                      value={formData.end_at} onChange={(e) => setFormData({...formData, end_at: e.target.value})}
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={submitting}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {submitting ? "Creating..." : "Create Event"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
