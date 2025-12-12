"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/app/(shell)/RoleContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Users, FileText, Shield } from 'lucide-react';

type UserData = {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'team' | 'guest';
};

export default function ReportsPage() {
  const { user } = useRole();
  const router = useRouter();
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
      if (!res.ok) {
        console.error(`API Error: ${res.status}`);
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json.error) console.error(json.error);
        } catch {
          console.error("Non-JSON Response:", text.slice(0, 100));
        }
        return;
      }
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

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'team' });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Re-use loading or distinct state
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => [...prev, { ...data.user }]);
        setShowAddUser(false);
        setNewUser({ name: '', email: '', password: '', role: 'team' });
        alert("User created successfully");
      } else {
        alert(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-4xl mx-auto relative">
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Reports & Analytics</h1>
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
            <button onClick={() => alert('Monthly Summary feature coming soon!')} className="mt-4 text-xs font-bold text-blue-400 uppercase tracking-wider">View Report</button>
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


      {/* Admin Controls */}
      {user?.role === 'admin' && (
        <section className="mb-8">
          <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-indigo-500/30">
            <div className="px-4 py-3 border-b border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-indigo-400" />
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Admin Controls</h3>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
              >
                Manage Users & Roles
              </button>
              <button
                onClick={() => alert('System Logs feature coming soon!')}
                className="w-full py-2.5 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-panel)] text-[var(--text-primary)] font-medium text-sm transition-colors border border-[var(--border-subtle)]"
              >
                System Logs
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Team Member</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="email@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Role</label>
                <select
                  className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="guest">Guest</option>
                  <option value="team">Team Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Default Password</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}