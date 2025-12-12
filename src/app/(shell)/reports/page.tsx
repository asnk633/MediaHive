"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/app/(shell)/RoleContext';
import { motion } from 'framer-motion';
import { BarChart3, Users, FileText } from 'lucide-react';

type UserData = {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'team' | 'guest';
};

export default function ReportsPage() {
  const { user } = useRole();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Load users only if admin
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user?.role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    setSaving(uid);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role: newRole })
      });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
    } catch (e) {
      alert("Failed to update role");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-4xl mx-auto">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-[var(--color-text-secondary)]">Overview of system activity and resources.</p>
      </header>

      {/* General Reports Section (Visible to all or Team) */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--color-bg-surface)] p-6 rounded-[20px] border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><FileText size={20} /></div>
              <h3 className="text-white font-bold">Monthly Summary</h3>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">Download the latest activity report for this month.</p>
            <button className="mt-4 text-xs font-bold text-blue-400 uppercase tracking-wider">View Report</button>
          </div>

          <div className="bg-[var(--color-bg-surface)] p-6 rounded-[20px] border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"><BarChart3 size={20} /></div>
              <h3 className="text-white font-bold">Performance</h3>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">Your task completion rate is 20% higher than last week.</p>
          </div>
        </div>
      </section>

      {/* Admin User Management Section */}
      {user?.role === 'admin' && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-indigo-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Team Management</h2>
          </div>

          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[20px] overflow-hidden">
            <div className="p-4 md:p-6 grid gap-4">
              {loading ? (
                <div className="text-[var(--color-text-secondary)] text-center py-4">Loading users...</div>
              ) : (
                users.map((u) => (
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 border-b border-[var(--color-border)] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-primary)] font-bold">
                        {u.name ? u.name[0].toUpperCase() : (u.email?.[0]?.toUpperCase() || 'U')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-medium truncate">{u.name || 'Unknown User'}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">{u.email}</p>
                      </div>
                    </div>

                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      disabled={saving === u.uid}
                      className="bg-black/30 text-white border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="guest">Guest</option>
                      <option value="team">Team</option>
                      <option value="admin">Admin</option>
                    </select>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}