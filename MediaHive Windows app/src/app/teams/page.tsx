"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Building2, Layers, Sparkles, UserPlus, 
  MapPin, Phone, Shield, ArrowUpRight, Plus,
  X, Loader2, CheckCircle2, AlertCircle, Copy, Link, Clock
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

interface MemberItem {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
}

const AVATAR_COLORS = [
  "from-teal-500 to-indigo-600",
  "from-purple-500 to-indigo-500",
  "from-emerald-400 to-teal-600",
  "from-amber-500 to-red-500",
  "from-pink-500 to-rose-500"
];

function getInitials(name: string) {
  if (!name) return "UA";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function TeamsPage() {
  const { user, loading: authLoading } = useAuth();

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [memberForm, setMemberForm] = useState({
    name: "", email: "", role: "Member", department_id: 0
  });

  // Data state
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "loading"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "loading", message: string) => {
    setToast({ type, message });
    if (type !== "loading") setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    if (!user?.tenant_id) return;
    try {
      const { data: depts } = await supabase.from('departments').select('*').eq('tenant_id', user.tenant_id);
      const { data: profs } = await supabase.from('profiles').select('*').eq('tenant_id', user.tenant_id);
      
      // We wrap this in a try-catch to avoid breaking the page if the user hasn't run the SQL script yet
      try {
        const { data: invites } = await supabase.from('invitations').select('*').eq('tenant_id', user.tenant_id).eq('status', 'pending');
        if (invites) setPendingInvites(invites);
      } catch (invErr) {
        console.warn("Invitations table might not exist yet.", invErr);
      }

      if (depts) {
        setDepartments(depts);
        if (depts.length > 0 && !selectedDeptId) setSelectedDeptId(depts[0].id);
      }
      if (profs) setProfiles(profs);
    } catch (err) {
      console.error("Failed to fetch teams data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [user, authLoading]);

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !user?.tenant_id) return;
    setAddingDept(true);
    showToast("loading", "Adding department...");
    try {
      const { data, error } = await supabase.from("departments").insert({
        name: newDeptName.trim(),
        tenant_id: user.tenant_id,
        created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      showToast("success", "Department created!");
      setShowDeptModal(false);
      setNewDeptName("");
      if (data) setSelectedDeptId(data.id);
      await fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add department.");
    } finally {
      setAddingDept(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_id || !memberForm.department_id) return;
    setAddingMember(true);
    showToast("loading", "Generating invite link...");
    try {
      // Generate a secure random token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from("invitations").insert({
        tenant_id: user.tenant_id,
        token: token,
        email: memberForm.email.trim(),
        role: memberForm.role,
        department_id: memberForm.department_id,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });
      if (error) throw error;
      
      const inviteUrl = `${window.location.origin}/invite?token=${token}`;
      setGeneratedInviteLink(inviteUrl);
      showToast("success", "Invite generated successfully!");
      await fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to generate invite.");
    } finally {
      setAddingMember(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    showToast("success", "Invite link copied to clipboard!");
  };

  const revokeInvite = async (id: string) => {
    showToast("loading", "Revoking invite...");
    try {
      await supabase.from("invitations").update({ status: 'revoked' }).eq('id', id);
      showToast("success", "Invite revoked.");
      await fetchData();
    } catch (err: any) {
      showToast("error", "Failed to revoke invite.");
    }
  };

  const currentMembers = profiles
    .filter(p => p.department_id === selectedDeptId)
    .map((p, i): MemberItem => ({
      id: p.id,
      name: p.full_name || p.name || "Unknown User",
      role: p.role || "Member",
      initials: getInitials(p.full_name || p.name),
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length]
    }));

  const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name || "Department";

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Org Chart
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Teams & Organization</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Manage your tenant organizational structures, departments, and members.
          </p>
        </div>

        <button 
          onClick={() => {
            setMemberForm(f => ({ ...f, department_id: selectedDeptId || (departments[0]?.id || 0) }));
            setShowMemberModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer">
          <UserPlus size={16} />
          <span>Add Member</span>
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

      {/* Add Department Modal */}
      <AnimatePresence>
        {showDeptModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDeptModal(false)}
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
                  <h2 className="text-base font-bold text-white m-0">Add Department</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Create a new branch in your organization</p>
                </div>
                <button onClick={() => setShowDeptModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddDept} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Department Name *</label>
                  <input required autoFocus type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
                    placeholder="e.g. Creative Engineering"
                    className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                </div>
                <button type="submit" disabled={addingDept || !newDeptName.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all cursor-pointer">
                  {addingDept ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
                  {addingDept ? "Adding..." : "Add Department"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showMemberModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMemberModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Add Member</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Invite someone to your organization</p>
                </div>
                <button onClick={() => { setShowMemberModal(false); setGeneratedInviteLink(""); }} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              
              {generatedInviteLink ? (
                <div className="p-6 flex flex-col gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                    <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                    <h3 className="text-sm font-bold text-emerald-400 m-0">Invite Created!</h3>
                    <p className="text-xs text-zinc-400 m-0">Send this link to the new member. It will expire in 7 days.</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input readOnly value={generatedInviteLink} className="flex-1 bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none font-mono" />
                    <button onClick={copyToClipboard} className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer" title="Copy to clipboard">
                      <Copy size={16} />
                    </button>
                  </div>
                  <button onClick={() => { setShowMemberModal(false); setGeneratedInviteLink(""); setMemberForm({ name: "", email: "", role: "Member", department_id: selectedDeptId || 0 }); }} className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddMember} className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email (Optional)</label>
                    <input type="email" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 transition-all font-sans" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Role</label>
                      <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}
                        className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans cursor-pointer">
                        <option className="bg-zinc-900" value="Member">Member</option>
                        <option className="bg-zinc-900" value="Admin">Admin</option>
                        <option className="bg-zinc-900" value="Manager">Manager</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Department</label>
                      <select value={memberForm.department_id} onChange={e => setMemberForm(f => ({ ...f, department_id: Number(e.target.value) }))}
                        className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans cursor-pointer">
                        {departments.map(d => (
                          <option key={d.id} className="bg-zinc-900" value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={addingMember}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all cursor-pointer">
                    {addingMember ? <Loader2 size={15} className="animate-spin" /> : <Link size={15} />}
                    {addingMember ? "Generating..." : "Generate Invite Link"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Org Tree */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-[60px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0">Structure</h3>
            <button onClick={() => setShowDeptModal(true)} className="text-zinc-500 hover:text-teal-400 transition-colors cursor-pointer" title="Add Department">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="text-xs text-zinc-500 px-2 py-4">Loading departments...</div>
            ) : departments.length > 0 ? (
              departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left w-full border relative z-10 ${
                    selectedDeptId === dept.id
                      ? "bg-gradient-to-br from-teal-500/10 to-indigo-500/10 text-teal-400 border-teal-500/30"
                      : "bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <Building2 size={14} />
                  <span>{dept.name}</span>
                </button>
              ))
            ) : (
              <div className="text-xs text-zinc-500 px-2 py-4">No departments found.</div>
            )}
          </div>
        </div>

        {/* Right Side: Member Grid list */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">
              Members in {selectedDeptName}
            </h3>
            <span className="text-xs text-zinc-500 font-semibold">{currentMembers.length} Active Members</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-zinc-500 text-sm py-4">Loading members...</div>
            ) : currentMembers.length === 0 ? (
              <div className="col-span-full text-zinc-500 text-sm py-4">No members found in this department.</div>
            ) : (
              <AnimatePresence mode="popLayout">
                {currentMembers.map((member) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -3 }}
                    key={member.id}
                    className="glass-card p-5 flex flex-col items-center justify-between text-center min-h-[180px] transition-all cursor-pointer group hover:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.2)] hover:border-indigo-500/30"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {/* Member Avatar */}
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${member.avatarColor} flex items-center justify-center text-base font-extrabold text-white shadow-lg`}>
                        {member.initials}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-zinc-200 m-0">{member.name}</h4>
                        <p className="text-[11px] text-zinc-500 mt-1 m-0 capitalize">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-4 w-full border-t border-white/5 pt-3">
                      <button className="flex-1 py-1 rounded bg-zinc-950/40 hover:bg-zinc-800 border border-white/5 text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1">
                        <span>Profile</span>
                        <ArrowUpRight size={10} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="glass-panel border-orange-500/20 rounded-2xl p-5 flex flex-col gap-4 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 text-orange-400 relative z-10">
              <Clock size={16} />
              <h3 className="text-xs font-semibold uppercase tracking-wider m-0">Pending Invites</h3>
            </div>
            <div className="flex flex-col gap-2">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{invite.email || "Link Generated"}</span>
                    <span className="text-xs text-zinc-500">Role: {invite.role} • Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => revokeInvite(invite.id)}
                    className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
