"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Plus, Sparkles, ArrowUpRight, 
  Layers, CheckCircle2, Calendar, Target,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phase: "Planning",
    start_date: "",
    end_date: ""
  });

  const fallbackCampaigns = [
    {
      id: "fallback-1",
      name: "Super Bowl Core Rebranding",
      phase: "Active",
      channels: ["Social Media", "OOH", "TV Spots"],
      end_date: "2026-11-20",
      progress: 65,
      tasks: "16 of 24 completed"
    }
  ];

  async function fetchCampaigns() {
    if (authLoading || (!user?.institution_id && !user?.tenant_id)) return;
    try {
      let query = supabase.from('campaigns').select('*');
      if (user.institution_id) {
        query = query.eq('institution_id', user.institution_id);
      } else if (user.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaigns();
  }, [user, authLoading]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.institution_id && !user?.tenant_id) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('campaigns').insert({
        institution_id: user.institution_id,
        tenant_id: user.tenant_id,
        owner_id: user.id,
        name: formData.name,
        description: formData.description,
        phase: formData.phase,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      });

      if (!error) {
        setShowModal(false);
        setFormData({ name: "", description: "", phase: "Planning", start_date: "", end_date: "" });
        await fetchCampaigns();
      } else {
        console.error("Error creating campaign:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse";
      case "planning": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const displayCampaigns = campaigns.length > 0 ? campaigns : (loading ? [] : fallbackCampaigns);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Campaign Tracker
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Campaigns</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Track design sprints, target channels, and launch deadlines for live campaigns.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Campaign</span>
        </button>
      </header>

      {/* Campaigns list rows */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-zinc-500 text-sm">Loading campaigns...</div>
        ) : displayCampaigns.map((camp) => (
          <motion.div
            whileHover={{ scale: 1.005 }}
            key={camp.id}
            className="glass-card rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/10 transition-all cursor-pointer group"
          >
            {/* Title & Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-zinc-200 truncate m-0 group-hover:text-white transition-colors">
                  {camp.name}
                </h3>
                <span className={`px-2.5 py-0.5 text-[9px] font-semibold border rounded-full ${getStatusColor(camp.phase || "Active")}`}>
                  {camp.phase || "Active"}
                </span>
              </div>
              {camp.description && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{camp.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(camp.channels || ["General"]).map((chan: string, idx: number) => (
                  <span key={idx} className="text-[9px] font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded uppercase tracking-wider">
                    {chan}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress metric */}
            <div className="w-full lg:w-64 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                <span>TASKS COMPLETED</span>
                <span>{camp.progress || 0}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500`}
                  style={{ width: `${camp.progress || 0}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-zinc-400 mt-1">{camp.tasks || "0 tasks"}</span>
            </div>

            {/* Launch Date */}
            <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
              <div className="flex items-center gap-2 text-xs text-zinc-455">
                <Calendar size={13} className="text-zinc-600" />
                <span>Launch: {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : "TBD"}</span>
              </div>
              <ArrowUpRight size={16} className="text-zinc-500 group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

          </motion.div>
        ))}
      </div>

      {/* New Campaign Modal */}
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
              className="relative w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between p-5 border-b border-white/5 relative z-10">
                <h2 className="text-lg font-bold text-white m-0">New Campaign</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreateCampaign} className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Campaign Name <span className="text-red-400">*</span></label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Summer Release 2026"
                    className="bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Description</label>
                  <textarea 
                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief overview of the campaign goals..." rows={3}
                    className="bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Phase</label>
                    <select 
                      value={formData.phase} onChange={(e) => setFormData({...formData, phase: e.target.value})}
                      className="bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Target Launch (End Date)</label>
                    <input 
                      type="date"
                      value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                  <button 
                    type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={submitting}
                    className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {submitting ? "Creating..." : "Create Campaign"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
