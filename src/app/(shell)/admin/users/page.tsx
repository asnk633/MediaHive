"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/app/(shell)/RoleContext';
import { motion } from 'framer-motion';
import { Shield, User as UserIcon, Users, Save } from 'lucide-react';

type UserData = {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'team' | 'guest';
};

export default function UserManagementPage() {
    const { user } = useRole(); // Role from context (for protection)
    const { user: authUser } = useAuth(); // Auth token source
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Pass auth token if we implement strict check
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
            // Optimistic update
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
        } catch (e) {
            console.error("Failed to update role", e);
            alert("Failed to update role");
        } finally {
            setSaving(null);
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-white">Access Denied. Admins only.</div>;
    }

    return (
        <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-4xl mx-auto">
            <header className="mb-8 pt-6">
                <h1 className="text-3xl font-display font-bold text-white mb-2">Team Management</h1>
                <p className="text-[var(--color-text-secondary)]">Manage user roles and permissions.</p>
            </header>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-white">Loading users...</div>
                ) : (
                    users.map((u) => (
                        <motion.div
                            key={u.uid}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[20px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                    {u.name ? u.name[0].toUpperCase() : u.email?.[0].toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">{u.name || 'Unknown Name'}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{u.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider mr-2">Role</label>
                                <select
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                                    disabled={saving === u.uid}
                                    className="bg-[var(--color-bg-subtle)] text-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="guest">Guest</option>
                                    <option value="team">Team Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {saving === u.uid && <span className="text-xs text-indigo-400 animate-pulse">Saving...</span>}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
