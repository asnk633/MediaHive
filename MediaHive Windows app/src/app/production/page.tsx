"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Plus, Sparkles, ArrowUpRight, 
  Layers, CheckCircle2, Calendar, Target,
  User, Play, Film, X, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

interface ProductionItem {
  id: string;
  title: string;
  stage: string;
  progress: number;
  director: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
}

export default function ProductionPage() {
  const { user, loading: authLoading } = useAuth();
  const [productions, setProductions] = useState<ProductionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    stage: "Pre-Production",
    director: "",
    location: "",
    start_date: "",
    end_date: "",
    progress: 0
  });

  const fallbackProductions: ProductionItem[] = [
    {
      id: "1",
      title: "Commercial Spot: Apex Core",
      stage: "Principal Photography",
      progress: 50,
      director: "Jenny Wilson",
      location: "LA - Stage 4",
      start_date: "2026-06-06",
      end_date: "2026-06-10"
    }
  ];

  async function fetchProductions() {
    if (authLoading || (!user?.institution_id && !user?.tenant_id)) return;
    try {
      let query = supabase.from('productions').select('*');
      if (user.institution_id) {
        query = query.eq('institution_id', user.institution_id);
      } else if (user.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setProductions(data as ProductionItem[]);
      } else {
        setProductions([]);
      }
    } catch (err) {
      console.error("Error fetching productions:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProductions();
  }, [user, authLoading]);

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.institution_id && !user?.tenant_id) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('productions').insert({
        institution_id: user.institution_id,
        tenant_id: user.tenant_id,
        title: formData.title,
        stage: formData.stage,
        progress: formData.progress,
        director: formData.director,
        location: formData.location,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      });

      if (!error) {
        setShowModal(false);
        setFormData({ title: "", stage: "Pre-Production", director: "", location: "", start_date: "", end_date: "", progress: 0 });
        await fetchProductions();
      } else {
        console.error("Error creating production:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateString = (start: string | null, end: string | null) => {
    if (!start && !end) return "TBD";
    const s = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : "";
    const e = end ? new Date(end).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : "";
    return `${s} ${s && e ? '-' : ''} ${e}`;
  };

  const displayProductions = productions.length > 0 ? productions : (loading ? [] : fallbackProductions);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Operations
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Production</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Track active shoots, set bookings, and post-production timelines.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Production</span>
        </button>
      </header>

      {/* Productions list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-zinc-500 text-sm col-span-3 flex items-center gap-2 py-4">
            <Loader2 size={16} className="animate-spin" /> Loading productions...
          </div>
        ) : displayProductions.map((prod) => (
          <motion.div
            whileHover={{ y: -4 }}
            key={prod.id}
            className="glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[220px] cursor-pointer hover:border-indigo-500/30 hover:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.2)] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-teal-500/20" />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full ${
                  prod.stage === "Principal Photography" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                  prod.stage === "Post-Production" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                  "bg-purple-500/10 text-purple-400 border-purple-500/20"
                }`}>
                  {prod.stage}
                </span>
                <Film size={14} className="text-zinc-500" />
              </div>

              <h3 className="text-base font-bold text-zinc-200 mt-4 mb-1">{prod.title}</h3>
              <p className="text-[10px] text-zinc-500 m-0">Location: {prod.location || "TBD"}</p>
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex flex-col gap-2 relative z-10">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                <span>STAGE COMPLETION</span>
                <span>{prod.progress}%</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full" 
                  style={{ width: `${prod.progress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-zinc-650" />
                  <span>Dir: {prod.director || "TBA"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-zinc-650" />
                  <span>{formatDateString(prod.start_date, prod.end_date)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Production Modal */}
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
                  <h2 className="text-base font-bold text-white m-0">New Production</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Add a new production timeline</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreateProduction} className="p-6 flex flex-col gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title <span className="text-red-400">*</span></label>
                  <input 
                    type="text" required
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Commercial Spot: Apex Core"
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stage</label>
                    <select 
                      value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans appearance-none cursor-pointer"
                    >
                      <option className="bg-zinc-900" value="Pre-Production">Pre-Production</option>
                      <option className="bg-zinc-900" value="Principal Photography">Principal Photography</option>
                      <option className="bg-zinc-900" value="Post-Production">Post-Production</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Director</label>
                    <input 
                      type="text"
                      value={formData.director} onChange={(e) => setFormData({...formData, director: e.target.value})}
                      placeholder="e.g. John Smith"
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                  <input 
                    type="text"
                    value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. LA - Stage 4"
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
                    <input 
                      type="date"
                      value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
                    <input 
                      type="date"
                      value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={submitting}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? "Creating..." : "Create Production"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
