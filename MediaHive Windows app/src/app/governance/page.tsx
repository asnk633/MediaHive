"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Scale, ShieldCheck, ClipboardCheck, Sparkles,
  UserCheck, CheckCircle2, Lock, FileText,
  Plus, X, Loader2, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContextProvider";
import { AnimatePresence } from "framer-motion";

export default function GovernancePage() {
  const { user, loading: authLoading } = useAuth();
  const [policies, setPolicies] = React.useState<any[]>([]);
  const [audits, setAudits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal State
  const [showPolicyModal, setShowPolicyModal] = React.useState(false);
  const [addingPolicy, setAddingPolicy] = React.useState(false);
  const [policyForm, setPolicyForm] = React.useState({
    name: "", description: "", metric: "Compliance"
  });

  interface Toast { type: "success" | "error" | "loading"; message: string; }
  const [toast, setToast] = React.useState<Toast | null>(null);

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    if (type !== "loading") setTimeout(() => setToast(null), 3500);
  };

  const fetchGovernanceData = async () => {
    if (!user?.tenant_id) return;
    try {
      const { data: polData, error: polErr } = await supabase.from('governance_policies').select('*').eq('tenant_id', user.tenant_id);
      if (!polErr && polData) setPolicies(polData);

      const { data: audData, error: audErr } = await supabase.from('audit_log').select('*').eq('tenant_id', user.tenant_id).order('created_at', { ascending: false }).limit(5);
      if (!audErr && audData) setAudits(audData);
    } catch (err) {
      console.error("Failed to fetch governance data:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!authLoading) fetchGovernanceData();
  }, [user, authLoading]);

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.name.trim() || !user?.tenant_id) return;
    setAddingPolicy(true);
    showToast("loading", "Adding policy...");
    try {
      const { error } = await supabase.from("governance_policies").insert({
        name: policyForm.name.trim(),
        description: policyForm.description.trim(),
        metric: policyForm.metric,
        tenant_id: user.tenant_id,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      showToast("success", "Policy created successfully!");
      setShowPolicyModal(false);
      setPolicyForm({ name: "", description: "", metric: "Compliance" });
      await fetchGovernanceData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to create policy.");
    } finally {
      setAddingPolicy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Compliance & Safety
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Governance</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Define access metrics, audit compliance checks, and enforce asset lifecycle policies.
          </p>
        </div>
        <button 
          onClick={() => setShowPolicyModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-zinc-950 text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer">
          <Plus size={16} />
          <span>Add Policy</span>
        </button>
      </header>

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

      {/* Add Policy Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPolicyModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md studio-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">New Policy</h2>
                  <p className="text-[11px] text-zinc-550 m-0 mt-0.5">Enforce a new governance rule</p>
                </div>
                <button onClick={() => setShowPolicyModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer relative z-20">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddPolicy} className="p-6 flex flex-col gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Policy Name *</label>
                  <input required autoFocus type="text" value={policyForm.name} onChange={e => setPolicyForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Mandatory Review"
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-[var(--accent)]/55 focus:ring-1 focus:ring-[var(--accent)]/30 transition-all font-sans" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Metric / Tag</label>
                  <input type="text" value={policyForm.metric} onChange={e => setPolicyForm(f => ({ ...f, metric: e.target.value }))}
                    placeholder="e.g. Compliance, Security"
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-[var(--accent)]/55 focus:ring-1 focus:ring-[var(--accent)]/30 transition-all font-sans" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea value={policyForm.description} onChange={e => setPolicyForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="What does this policy enforce?"
                    className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-[var(--accent)]/55 focus:ring-1 focus:ring-[var(--accent)]/30 transition-all font-sans resize-none" />
                </div>
                <button type="submit" disabled={addingPolicy || !policyForm.name.trim()}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-zinc-950 text-xs font-bold px-4 py-3 rounded-full transition-all cursor-pointer">
                  {addingPolicy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {addingPolicy ? "Adding..." : "Add Policy"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Policies */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">Active Policies</h3>
            <button onClick={() => setShowPolicyModal(true)} className="text-zinc-505 hover:text-[var(--accent)] transition-colors cursor-pointer" title="Add Policy">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              <div className="text-xs text-zinc-500 p-4">Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="col-span-2 text-center text-sm text-zinc-500 py-10 bg-zinc-900/20 border border-white/5 rounded-2xl">
                No policies defined yet. Click &quot;Add Policy&quot; to get started.
              </div>
            ) : policies.map((pol, idx) => {
              const Icon = ShieldCheck;
              return (
                <motion.div
                  whileHover={{ y: -4 }}
                  key={idx}
                  className="studio-card rounded-2xl p-6 flex flex-col justify-between min-h-[160px] cursor-pointer group hover:border-zinc-700 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2 rounded-xl bg-zinc-800/50 border border-white/5 text-[var(--accent)]">
                      <Icon size={16} />
                    </div>
                    <span className="text-[9px] font-bold text-[var(--accent)] bg-[var(--accent-wash)] border border-[var(--accent)]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {pol.metric || "Active"}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-zinc-200 m-0">{pol.title || pol.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1 m-0 leading-relaxed">{pol.desc || pol.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Audit Logs */}
        <div className="studio-panel rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-[50px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Compliance Audits</h3>
            <span className="text-[10px] text-zinc-500">Auto check log</span>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-xs text-zinc-500 py-2">Loading logs...</div>
            ) : audits.length === 0 ? (
              <div className="text-xs text-zinc-500 py-2 text-center">No recent audit logs</div>
            ) : audits.map((aud, idx) => (
              <div key={idx} className="studio-card p-3 rounded-xl flex items-center justify-between gap-3 relative z-10">
                <div>
                  <div className="text-xs font-bold text-zinc-200">{aud.rule || aud.action || "System Event"}</div>
                  <span className="text-[9px] text-zinc-500 mt-1 block">By {aud.auditor || aud.actor_id || "System"} • {aud.date || new Date(aud.created_at).toLocaleString()}</span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>{aud.status || "Logged"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

