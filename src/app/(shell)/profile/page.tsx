"use client";

import { useRole } from "@/app/(shell)/RoleContext";
import { User, Mail, Phone, Lock, ChevronRight, Bell, Moon, Shield, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useRole();
  const role = user?.role;
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="flex flex-col gap-6 px-2 pt-4 pb-24">
      {/* Header / Avatar */}
      <div className="flex flex-col items-center pt-6 pb-2">
        <div className="relative group">
          <div className="h-28 w-28 rounded-full border-4 border-[var(--bg)] shadow-2xl overflow-hidden bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center">
            {/* Placeholder Avatar if no image */}
            <span className="text-3xl font-bold text-[var(--text)] opacity-80">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <button className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--accent)] text-[var(--text)] shadow-lg border-4 border-[var(--bg)] hover:bg-[var(--accent-2)] transition-colors">
            <Settings size={16} />
          </button>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold text-[var(--text)]">{user?.name || "User Name"}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              role === 'admin' ? "bg-purple-500/20 text-purple-400 border border-purple-500/20" : "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/20"
            )}>
              {role || "Guest"}
            </span>
            <span className="text-sm text-[var(--muted)]">Media Manager</span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <section className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--glass-border)] bg-[var(--panel)]">
          <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Account Information</h3>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          <ProfileRow icon={Mail} label="Email" value={"user@thaibagarden.com"} />
          <ProfileRow icon={Phone} label="Phone" value="+1 (555) 123-4567" />
          <ProfileRow icon={Lock} label="Password" value="••••••••" action />
        </div>
      </section>

      {/* App Settings */}
      <section className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--glass-border)] bg-[var(--panel)]">
          <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Application Settings</h3>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          <ToggleRow
            icon={Bell}
            label="Push Notifications"
            checked={notifications}
            onChange={setNotifications}
          />
          <ToggleRow
            icon={Moon}
            label="Dark Mode"
            checked={darkMode}
            onChange={setDarkMode}
          />
        </div>
      </section>

      {/* Admin Only Section */}
      {role === 'admin' && (
        <section className="glass-card overflow-hidden border-[var(--accent-2)]/20">
          <div className="px-4 py-3 border-b border-[var(--accent-2)]/10 bg-[var(--accent-2)]/5">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[var(--accent-2)]" />
              <h3 className="text-sm font-semibold text-[var(--accent-2)] uppercase tracking-wider">Admin Controls</h3>
            </div>
          </div>
          <div className="p-4">
            <button className="w-full py-2.5 rounded-lg bg-[var(--accent-2)] hover:bg-[var(--accent)] text-[var(--text)] font-medium text-sm transition-colors shadow-lg shadow-[var(--accent-2)]/20">
              Manage Users & Roles
            </button>
            <button className="w-full mt-3 py-2.5 rounded-lg bg-[var(--panel)] hover:bg-[var(--panel-strong)] text-[var(--text)] hover:text-[var(--text)] font-medium text-sm transition-colors border border-[var(--glass-border)]">
              System Logs
            </button>
          </div>
        </section>
      )}

      {/* Logout */}
      <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] font-medium transition-colors border border-[var(--danger)]/10">
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value, action }: { icon: any; label: string; value: string; action?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-[var(--panel)] transition-all duration-200 ease-in-out group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-[var(--panel)] text-[var(--icon-muted)] group-hover:text-[var(--icon)] transition-all duration-200 ease-in-out">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="text-sm font-medium text-[var(--text)]">{value}</p>
        </div>
      </div>
      {action && <ChevronRight size={18} className="text-[var(--icon-muted)] group-hover:text-[var(--icon)] transition-all duration-200 ease-in-out" />}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-[var(--panel)] transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-[var(--panel)] text-[var(--icon-muted)]">
          <Icon size={18} />
        </div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
      </div>

      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "w-11 h-6 rounded-full relative transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50",
          checked ? "bg-[var(--accent)]" : "bg-[var(--panel-strong)]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 bg-[var(--text)] w-4 h-4 rounded-full shadow-sm transition-all duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
