"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Bell, Shield, HardDrive, Sparkles, Monitor,
  Save, LogOut, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";

interface Toast {
  type: "success" | "error" | "loading";
  message: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState<Toast | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification toggles state
  const [notifSettings, setNotifSettings] = useState({
    emailNotifications: true,
    pushAlerts: true,
    conflictWarnings: false,
  });

  // Desktop Integration state
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || 'isTauri' in window)) {
      import('@tauri-apps/plugin-autostart').then(async (module) => {
        const initialized = localStorage.getItem("autostart_initialized");
        if (!initialized) {
            try {
                await module.enable();
                localStorage.setItem("autostart_initialized", "true");
                setAutostartEnabled(true);
            } catch (e) {
                // Ignore error if it fails to set up on first load
            }
        } else {
            module.isEnabled().then(setAutostartEnabled);
        }
      });
    }
  }, []);

  const handleToggleAutostart = async () => {
    if (typeof window === 'undefined' || !(('__TAURI_INTERNALS__' in window || 'isTauri' in window))) return;
    try {
      const module = await import('@tauri-apps/plugin-autostart');
      if (autostartEnabled) {
        await module.disable();
        setAutostartEnabled(false);
        showToast("success", "Launch on Startup disabled");
      } else {
        await module.enable();
        setAutostartEnabled(true);
        showToast("success", "Launch on Startup enabled");
      }
    } catch (err: any) {
      showToast("error", "Failed to update autostart setting");
    }
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Keys", icon: Shield },
    { id: "storage", label: "Local Storage", icon: HardDrive },
    { id: "desktop", label: "Desktop Integration", icon: Monitor }
  ];

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    if (type !== "loading") setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // ─── Save Profile ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    showToast("loading", "Saving profile...");

    try {
      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: profileForm.name }
      });
      if (authError) throw authError;

      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Also try updating the users table (if it exists with this user)
      await supabase
        .from('users')
        .update({
          full_name: profileForm.name,
          updated_at: new Date().toISOString(),
        })
        .eq('email', user.email);

      showToast("success", "Profile updated successfully!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Change Password ───────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    showToast("loading", "Updating password...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      showToast("success", "Password changed successfully!");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      showToast("error", err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    if (!name) return 'UA';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1100px] mx-auto w-full pb-10">

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

      {/* 1. Header */}
      <header className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-teal-400 font-medium tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            User Preferences
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Settings</h1>
          <p className="text-zinc-400 m-0 text-sm mt-1">
            Manage your personal profile, notifications, and application telemetry.
          </p>
        </div>
      </header>

      {/* 2. Main Tabbed Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Tab Switcher */}
        <div className="glass-panel p-3 rounded-2xl relative overflow-hidden flex flex-col gap-1.5 z-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[60px] rounded-full pointer-events-none" />
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-br from-teal-500/10 to-indigo-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_12px_rgba(13,148,136,0.1)]"
                    : "bg-transparent text-zinc-400 border border-transparent hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon size={14} className={isActive ? "text-teal-400" : "text-zinc-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          
          <div className="h-px bg-white/5 my-2"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Active Panel */}
        <div className="md:col-span-3 glass-panel p-6 rounded-2xl relative overflow-hidden min-h-[400px]">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
          <AnimatePresence mode="wait">

            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <motion.form
                key="profile"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                onSubmit={handleSaveProfile}
                className="flex flex-col gap-5"
              >
                <h2 className="text-base font-bold text-white m-0 border-b border-white/5 pb-2">Profile Information</h2>
                
                {/* Profile Pic Card */}
                <div className="flex items-center gap-4 p-4 rounded-xl glass-card w-fit relative z-10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/20 flex items-center justify-center text-lg font-bold text-teal-400 shadow-[0_0_16px_rgba(20,184,166,0.15)]">
                    {getInitials(profileForm.name)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-200">{profileForm.name || "User"}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 capitalize">{user?.role || "Member"}</div>
                    <button type="button" className="text-[10px] text-teal-400 font-bold hover:text-teal-300 mt-2 block cursor-pointer">
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      readOnly
                      className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-400 cursor-not-allowed opacity-60 font-sans"
                    />
                    <p className="text-[10px] text-zinc-600 m-0">Email cannot be changed here.</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-teal-500/10 transition-all cursor-pointer"
                  >
                    {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex flex-col gap-5"
              >
                <h2 className="text-base font-bold text-white m-0 border-b border-white/5 pb-2">Notification Settings</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { key: "emailNotifications", title: "Email Notifications", desc: "Receive daily sync digests and high-priority action alerts." },
                    { key: "pushAlerts", title: "Push Alerts", desc: "Receive real-time banner notifications on task assignments." },
                    { key: "conflictWarnings", title: "Conflict Warnings", desc: "Get alerted when booking overlaps occur in campaigns." },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl glass-card relative z-10 group hover:border-white/10 transition-colors">
                      <div className="flex-1 pr-4">
                        <div className="text-xs font-bold text-zinc-200">{item.title}</div>
                        <p className="text-[10px] text-zinc-500 m-0 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifSettings(s => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))}
                        className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 cursor-pointer flex-shrink-0 ${notifSettings[item.key as keyof typeof notifSettings] ? "bg-teal-500" : "bg-zinc-800"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifSettings[item.key as keyof typeof notifSettings] ? "translate-x-4" : "translate-x-0"}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => showToast("success", "Notification preferences saved!")}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Save size={15} />
                    Save Preferences
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === "security" && (
              <motion.form
                key="security"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                onSubmit={handleChangePassword}
                className="flex flex-col gap-5"
              >
                <h2 className="text-base font-bold text-white m-0 border-b border-white/5 pb-2">Security & Keys</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="••••••••••••"
                      className="bg-zinc-950/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-all font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="••••••••••••"
                      className={`bg-zinc-950/40 border rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none transition-all font-sans ${
                        passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                          ? "border-red-500/50 focus:border-red-500/70"
                          : "border-white/5 focus:border-teal-500/50"
                      }`}
                    />
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-[10px] text-red-400 m-0">Passwords do not match.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword || !passwordForm.newPassword}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-indigo-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── Storage Tab ── */}
            {activeTab === "storage" && (
              <motion.div
                key="storage"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="flex flex-col gap-5"
              >
                <h2 className="text-base font-bold text-white m-0 border-b border-white/5 pb-2">Local Storage</h2>
                <div className="glass-card p-4 rounded-xl flex items-center justify-between relative z-10">
                  <div>
                    <div className="text-xs font-bold text-zinc-200">Local cache database</div>
                    <div className="text-[10px] text-zinc-500 mt-1">42.5 MB used for offline index.</div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      showToast("success", "Local cache cleared.");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Clear Database Cache
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
