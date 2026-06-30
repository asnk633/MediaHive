"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, UserPlus, Lock } from "lucide-react";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("Invalid or missing invitation token.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchErr } = await supabase
          .from("invitations")
          .select("*, departments(name), profiles:invited_by(full_name)")
          .eq("token", token)
          .single();

        if (fetchErr || !data) {
          setError("Invitation not found.");
          setLoading(false);
          return;
        }

        if (data.status !== "pending") {
          setError(`This invitation has already been ${data.status}.`);
          setLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError("This invitation has expired.");
          await supabase.from("invitations").update({ status: 'expired' }).eq('id', data.id);
          setLoading(false);
          return;
        }

        setInvite(data);
        if (data.email) setForm(f => ({ ...f, email: data.email }));
      } catch (err) {
        setError("An error occurred while verifying the invitation.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) return;

    // Enforce email match if the invitation specifies one
    if (invite.email && form.email.trim().toLowerCase() !== invite.email.trim().toLowerCase()) {
      setError(`This invitation is for ${invite.email}. Please use that email address.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Step 1 — Claim the invitation slot FIRST (before creating auth account)
      // This reduces the TOCTOU window: two concurrent requests can't both claim the slot
      const { data, error: updateErr } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id)
        .eq("status", "pending")
        .select("id");

      if (updateErr || !data || data.length === 0) {
        setError("This invitation has already been used.");
        setSubmitting(false);
        return;
      }

      // Step 2 — Create auth account (only runs if we claimed the invite)
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            tenant_id: invite.tenant_id
          }
        }
      });

      if (authErr) {
        // Rollback: re-open the invite so the user can try again
        await supabase.from("invitations").update({ status: "pending" }).eq("id", invite.id);
        throw authErr;
      }
      if (!authData.user) {
        await supabase.from("invitations").update({ status: "pending" }).eq("id", invite.id);
        throw new Error("Failed to create account.");
      }

      // Step 3 — Detect already-registered email (Fix 2.7)
      if (authData.user.identities?.length === 0) {
        await supabase.from("invitations").update({ status: "pending" }).eq("id", invite.id);
        throw new Error("An account with this email already exists. Please log in instead.");
      }

      const userId = authData.user.id;

      // Step 4 — Create the profile
      const { error: profileErr } = await supabase.from("profiles").insert({
        id: userId,
        tenant_id: invite.tenant_id,
        name: form.name.trim(),
        full_name: form.name.trim(),
        email: form.email,
        role: invite.role,
        department_id: invite.department_id,
        created_at: new Date().toISOString()
      });

      if (profileErr) {
        console.error("[Invite] Profile creation failed:", profileErr);
        // Auth account was created but profile failed — known dead end (no rollback from client)
        // Invite is already marked accepted. Redirect to login.
        router.push("/login?message=Account setup incomplete. Please contact your administrator.");
        return;
      }

      // 5. Redirect to login
      router.push("/login?message=Invite accepted! You can now log in.");

    } catch (err: any) {
      setError(err.message || "Failed to process invitation.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-zinc-200 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md studio-panel rounded-[2rem] shadow-2xl p-8 relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <UserPlus size={24} className="text-white" />
          </div>
        </div>

        {error ? (
          <div className="text-center flex flex-col items-center gap-4">
            <AlertCircle size={48} className="text-red-500/80" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Invitation Invalid</h2>
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">You've been invited!</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">{invite?.profiles?.full_name || "An administrator"}</strong> has invited you to join as a <strong className="text-teal-400">{invite?.role}</strong> in the <strong className="text-zinc-200">{invite?.departments?.name || "organization"}</strong>.
              </p>
            </div>

            <form onSubmit={handleAcceptInvite} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <input required autoFocus type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your Name"
                  className="bg-zinc-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  readOnly={!!invite?.email}
                  className={`bg-zinc-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all ${invite?.email ? "text-zinc-500 cursor-not-allowed opacity-70" : ""}`} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Create Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••" minLength={8}
                    className="w-full bg-zinc-950/60 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {submitting ? "Joining..." : "Accept Invitation & Join"}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-500" size={32} />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}

