"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plane, Calendar, ClipboardList, Sparkles,
  CheckCircle2, Clock, Send, ShieldAlert, XCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

export default function LeaveRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>({ annual: 18, sick: 8, personal: 4 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestedStatus, setRequestedStatus] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: "annual",
    start_date: "",
    end_date: "",
    total_days: "",
    reason: ""
  });

  const fallbackHistory = [
    { id: "1", type: "Annual Leave", start_date: "2026-07-10", end_date: "2026-07-14", status: "Approved", total_days: 5 },
    { id: "2", type: "Personal Leave", start_date: "2026-06-18", end_date: "2026-06-19", status: "Pending", total_days: 2 }
  ];

  async function fetchLeaveData() {
    if (authLoading || !user?.id) return;
    try {
      // Fetch Balances
      const { data: balanceData } = await supabase
        .from('user_leave_balances')
        .select('balances')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (balanceData?.balances) {
        setBalances(balanceData.balances);
      }

      // Fetch Requests
      const { data: requestData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('requested_by_id', user.id)
        .order('created_at', { ascending: false })
        // Fallback to order by start_date if created_at is missing, though we assume created_at
        .order('start_date', { ascending: false });

      if (requestData && requestData.length > 0) {
        setRequests(requestData);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching leave data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaveData();
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('leave_requests').insert({
        institution_id: user.institution_id,
        tenant_id: user.tenant_id,
        requested_by_id: user.id,
        requested_by_name: user.name,
        type: formData.type,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        total_days: Number(formData.total_days) || 0,
        reason: formData.reason,
        status: "Pending",
        requested_at: new Date().toISOString()
      });

      if (!error) {
        setRequestedStatus(true);
        setFormData({ type: "annual", start_date: "", end_date: "", total_days: "", reason: "" });
        await fetchLeaveData();
        setTimeout(() => setRequestedStatus(false), 3000);
      } else {
        console.error("Error creating leave request:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const balanceCards = [
    { type: "Annual Leave", balance: `${balances.annual || balances.Annual || 0} days left`, color: "text-teal-400 border-teal-500/20" },
    { type: "Sick Leave", balance: `${balances.sick || balances.Sick || 0} days left`, color: "text-indigo-400 border-indigo-500/20" },
    { type: "Personal Leave", balance: `${balances.personal || balances.Personal || 0} days left`, color: "text-purple-400 border-purple-500/20" }
  ];

  const displayHistory = requests.length > 0 ? requests : (loading ? [] : fallbackHistory);

  const getStatusIcon = (status: string) => {
    if (status === "Approved") return <CheckCircle2 size={10} />;
    if (status === "Rejected") return <XCircle size={10} />;
    return <Clock size={10} />;
  };

  const getStatusColor = (status: string) => {
    if (status === "Approved") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "Rejected") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
          <Sparkles size={14} />
          HR Portal
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">Leave Management</h1>
        <p className="text-zinc-400 m-0 text-sm mt-1">
          Request time off, manage balances, and view your request history.
        </p>
      </header>

      {/* 1. Leave Balances Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balanceCards.map((bal, idx) => (
          <div key={idx} className={`glass-card p-5 flex items-center justify-between relative overflow-hidden group hover:shadow-[0_8px_24px_rgba(20,184,166,0.12)]`}>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{bal.type}</div>
              <div className={`text-xl font-extrabold mt-1.5 ${bal.color.split(' ')[0]}`}>{bal.balance}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-white/5 text-zinc-500 group-hover:text-teal-400 group-hover:border-teal-500/25 transition-all">
              <Plane size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Request Form */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-base font-bold text-white m-0 border-b border-white/5 pb-2">Request Time Off</h3>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Leave Type <span className="text-red-400">*</span></label>
                <select 
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Duration (Days) <span className="text-red-400">*</span></label>
                <input 
                  type="number" step="0.5" required
                  value={formData.total_days}
                  onChange={(e) => setFormData({...formData, total_days: e.target.value})}
                  placeholder="e.g. 3"
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Start Date <span className="text-red-400">*</span></label>
                <input 
                  type="date" required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">End Date <span className="text-red-400">*</span></label>
                <input 
                  type="date" required
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reason / Additional Notes</label>
              <textarea 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Describe your request reason..."
                rows={3}
                className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans resize-none"
              />
            </div>

            <button 
              type="submit" disabled={submitting}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              <Send size={13} />
              <span>{submitting ? "Submitting..." : requestedStatus ? "Request Submitted!" : "Submit Request"}</span>
            </button>

          </form>
        </div>

        {/* Request History */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Request History</h3>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-xs text-zinc-500">Loading history...</div>
            ) : displayHistory.length === 0 ? (
              <div className="text-xs text-zinc-500">No requests found.</div>
            ) : displayHistory.map((hist) => {
              const start = hist.start_date ? new Date(hist.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "";
              const end = hist.end_date ? new Date(hist.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "";
              const dates = start === end ? start : `${start} - ${end}`;
              const statusStr = hist.status || "Pending";

              return (
                <div key={hist.id} className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-zinc-200 capitalize">{hist.type}</div>
                    <span className="text-[9px] text-zinc-500 mt-1 block">{dates} • {hist.total_days} day(s)</span>
                  </div>
                  <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(statusStr)}`}>
                    {getStatusIcon(statusStr)}
                    <span>{statusStr}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
