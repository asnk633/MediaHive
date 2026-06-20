"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Sparkles, Search, Shield, UserPlus, 
  Mail, ShieldCheck, Edit3, KeyRound, X,
  CheckCircle2, AlertCircle, Loader2, Copy
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  joinedDate: string;
  avatarColor: string;
}

interface Toast {
  type: "success" | "error" | "loading";
  message: string;
}

const avatarColors = [
  "from-teal-500 to-indigo-600",
  "from-purple-500 to-indigo-500",
  "from-amber-500 to-red-500",
  "from-emerald-400 to-teal-600",
  "from-pink-500 to-rose-500",
  "from-sky-500 to-cyan-600",
];

const ROLES = ["admin", "manager", "team", "member"];

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [filterRole, setFilterRole] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [usersData, setUsersData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "member", password: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState("member");
  const [saving, setSaving] = useState(false);

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    if (type !== "loading") setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = async () => {
    if (!user?.institution_id) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('institution_id', user.institution_id);

      if (data) {
        setUsersData(data.map((u: Record<string, any>, idx: number) => ({
          id: u.id.toString(),
          name: u.full_name || u.email?.split('@')[0] || "Unknown User",
          email: u.email || "",
          role: u.role || "member",
          status: "Active",
          joinedDate: new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          avatarColor: avatarColors[idx % avatarColors.length],
        })));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.institution_id) fetchUsers();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  // ─── Invite Member ───────────────────────────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email) return;
    if (!user?.institution_id) return;

    setInviting(true);
    showToast("loading", "Generating invitation link...");

    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: inviteError } = await supabase.from('invitations').insert({
        email: inviteForm.email,
        role: inviteForm.role,
        token,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        institution_id: user.institution_id,
        tenant_id: user.tenant_id,
        status: 'pending'
      });

      if (inviteError) {
        console.error("Invite error:", inviteError);
        throw new Error("Failed to create invitation record.");
      }

      const link = `${window.location.origin}/invite?token=${token}`;
      setInviteLink(link);
      showToast("success", "Invitation generated successfully.");
      
      // We don't close the modal yet so the user can copy the link
      setInviteForm({ email: "", name: "", role: "member", password: "" });
      await fetchUsers();
    } catch (err: any) {
      showToast("error", err.message || "Failed to invite member.");
    } finally {
      setInviting(false);
    }
  };

  // ─── Change Role ─────────────────────────────────────────────────────────────
  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    showToast("loading", "Updating permissions...");

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: editRole, updated_at: new Date().toISOString() })
        .eq('id', editingUser.id);

      if (error) throw error;

      showToast("success", `${editingUser.name}'s role updated to ${editRole}.`);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = usersData.filter(u => {
    const matchesRole = filterRole === "All" || u.role.toLowerCase() === filterRole.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Invite Member</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">Add a new user to your workspace</p>
                </div>
                <button onClick={() => { setShowInviteModal(false); setInviteLink(""); }} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer z-20">
                  <X size={16} />
                </button>
              </div>

              {inviteLink ? (
                <div className="p-6 flex flex-col gap-4 relative z-10">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 items-start">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400 mb-1">Invitation Created!</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Share this unique link with the user. It will expire in 7 days.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-300 font-mono outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        showToast("success", "Link copied to clipboard!");
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => { setShowInviteModal(false); setInviteLink(""); }}
                    className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="p-6 flex flex-col gap-4 relative z-10">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                    <input
                      required
                      type="email"
                      value={inviteForm.email}
                      onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jane@mediahive.io"
                      className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Role</label>
                    <div className="relative">
                      <select
                        value={inviteForm.role}
                        onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans cursor-pointer appearance-none"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} className="bg-zinc-900 capitalize text-zinc-200">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={inviting}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {inviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {inviting ? "Generating Link..." : "Generate Invite Link"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Role Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingUser(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm glass-panel rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-base font-bold text-white m-0">Change Permissions</h2>
                  <p className="text-[11px] text-zinc-500 m-0 mt-0.5">{editingUser.name}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleRoleChange} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    className="bg-zinc-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans cursor-pointer"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r} className="bg-zinc-900 capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                  {saving ? "Saving..." : "Update Role"}
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
            <Sparkles size={14} />
            Access Management
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Users & Access</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Control member permissions, allocate role scopes, and monitor active logins.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Invite Member</span>
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-3 rounded-2xl relative overflow-hidden z-10">
        <div className="relative w-full md:w-80 relative z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all font-sans"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["All", "Admin", "Manager", "Team", "Member"]).map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterRole === role
                  ? "bg-gradient-to-br from-teal-500/10 to-indigo-500/10 text-teal-400 border-teal-500/30 shadow-[0_0_12px_rgba(13,148,136,0.15)]"
                  : "bg-zinc-950/20 border-white/5 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>

      {/* Directory + Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider m-0">Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500 p-4">
                <Loader2 size={16} className="animate-spin" /> Loading users...
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredUsers.map(u => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={u.id}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${u.avatarColor} flex items-center justify-center text-sm font-extrabold text-white shadow-lg flex-shrink-0`}>
                        {getInitials(u.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate m-0">{u.name}</h4>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                          <Mail size={12} />
                          <span className="text-[11px] truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full capitalize ${
                          u.role === "admin" ? "bg-teal-500/10 border-teal-500/20 text-teal-400" :
                          u.role === "manager" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                          u.role === "team" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                          "bg-zinc-800 border-zinc-700/50 text-zinc-400"
                        }`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">Joined {u.joinedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          title="Change Permissions"
                          onClick={() => { setEditingUser(u); setEditRole(u.role); }}
                          className="p-1.5 rounded-lg bg-zinc-950/40 border border-white/5 text-zinc-400 hover:text-teal-400 hover:border-teal-500/30 transition-colors cursor-pointer"
                        >
                          <KeyRound size={12} />
                        </button>
                        <button
                          title="Edit User"
                          onClick={() => { setEditingUser(u); setEditRole(u.role); }}
                          className="p-1.5 rounded-lg bg-zinc-950/40 border border-white/5 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-colors cursor-pointer"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between border-b border-white/5 pb-2 relative z-10">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider m-0 flex items-center gap-1.5">
              <Shield size={13} className="text-teal-400" /> Security Status
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <ShieldCheck size={11} /> Synced
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Workspace Seats</span>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-2xl font-bold">{usersData.length}</span>
                <span className="text-xs text-zinc-500">active users</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, usersData.length * 10)}%` }}
                />
              </div>
            </div>
            <div className="h-px bg-white/5 my-1"></div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Directory Logs</span>
              <div className="flex flex-col gap-1.5 font-mono text-[9px] text-zinc-400">
                {["AD Sync completed in 0.4s", "Credentials checklist pass", "Token rotation updated"].map((log, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="text-teal-500">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
