"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, apiGet } from '@/lib/apiClient';
import { motion } from 'framer-motion';
import { Shield, User as UserIcon, Users, Save } from 'lucide-react';
import { RoleEditor } from '@/components/admin/RoleEditor';
import { User } from '@/types/user';
import { UserService } from '@/services/userService';

export default function UserManagementPage() {
    const { user } = useAuth(); // Role from context (for protection)
    const { user: authUser } = useAuth(); // Auth token source
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const [departmentsList, setDepartmentsList] = useState<string[]>([]);
    const [institutionsList, setInstitutionsList] = useState<string[]>([]);

    useEffect(() => {
        fetchUsers();
        fetchOrgData();
    }, []);

    const fetchOrgData = async () => {
        try {
            const [deptData, instData] = await Promise.all([
                apiGet<{ id: string; name: string }[]>('/api/departments?limit=1000'),
                apiGet<{ id: string; name: string }[]>('/api/institutions?limit=1000')
            ]);
            setDepartmentsList(deptData.map(d => d.name));
            setInstitutionsList(instData.map(i => i.name));
        } catch (error) {
            console.error('Failed to fetch org data:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const clientUsers = await UserService.getAllUsers();
            setUsers(clientUsers as User[]);
        } catch (e) {
            console.warn("Failed to fetch users via UserService", e);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (uid: string, field: keyof User, value: string) => {
        setSaving(uid);
        try {
            const payload: any = { uid };

            if (field === 'role') {
                payload.role = value;
                // Enforce "Media & IT Office" for Admin/Team
                if (value === 'admin' || value === 'team') {
                    payload.defaultDepartment = 'Media & IT Office';
                    payload.defaultInstitution = '';
                }
            } else if (field === 'name') {
                payload.name = value;
            } else if (field === 'officialName') {
                payload.officialName = value;
            } else if (field === 'defaultDepartment') {
                payload.defaultDepartment = value;
            } else if (field === 'defaultInstitution') {
                payload.defaultInstitution = value;
            }

            await apiClient('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

        } catch (e) {
            console.warn("API Update failed, trying Client SDK", e);
            try {
                const updateData: any = { [field]: value };
                // Logic to clear other field if needed (Client SDK fallback)
                if (field === 'defaultDepartment' && value) updateData.defaultInstitution = "";
                if (field === 'defaultInstitution' && value) updateData.defaultDepartment = "";

                // Enforce "Media & IT Office" for Admin/Team in fallback
                if (field === 'role' && (value === 'admin' || value === 'team')) {
                    updateData.defaultDepartment = 'Media & IT Office';
                    updateData.defaultInstitution = '';
                }

                await UserService.updateUser(uid, updateData);
            } catch (clientErr) {
                console.error("Client update failed", clientErr);
                alert("Failed to update user");
                setSaving(null);
                return;
            }
        }

        setUsers(prev => prev.map(u => {
            if (u.uid !== uid) return u;

            let updates: any = { [field]: value };

            // Enforce Exclusivity logic
            if (field === 'defaultDepartment' && value) updates.defaultInstitution = "";
            if (field === 'defaultInstitution' && value) updates.defaultDepartment = "";

            // Enforce Rule for Admin/Team
            if (field === 'role' && (value === 'admin' || value === 'team')) {
                updates.defaultDepartment = 'Media & IT Office';
                updates.defaultInstitution = '';
            }

            return { ...u, ...updates };
        }));

        setSaving(null);
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-white">Access Denied. Admins only.</div>;
    }

    // Helper to check if organization options should be locked
    const isOrgLocked = (role: string) => role === 'admin' || role === 'team';

    return (
        <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-7xl mx-auto">
            <header className="mb-8 pt-6">
                <h1 className="text-3xl font-display font-bold text-white mb-2">Team Management</h1>
                <p className="text-[var(--color-text-secondary)]">Manage user roles and default organization settings.</p>
            </header>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-white flex items-center justify-center py-20 opacity-50">
                        <div className="animate-pulse">Loading team members...</div>
                    </div>
                ) : (
                    users.map((u) => (
                        <motion.div
                            key={u.uid}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-white/5 backdrop-blur-md border border-white/5 rounded-[20px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.2)] hover:bg-white/10 hover-sheen transition-all duration-300 overflow-hidden"
                        >
                            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 relative z-10">
                                {/* Identity */}
                                <div className="flex items-start gap-4 min-w-[280px]">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0 mt-1 shadow-lg ring-2 ring-white/10">
                                        {u.name ? u.name[0].toUpperCase() : u.email?.[0].toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <input
                                            defaultValue={u.officialName || u.name}
                                            onBlur={(e) => {
                                                const val = e.target.value.trim();
                                                const current = u.officialName || u.name;
                                                if (val !== current && val.length > 0) {
                                                    handleUpdate(u.uid, 'officialName', val);
                                                }
                                            }}
                                            className="bg-transparent text-white font-semibold border-b border-transparent hover:border-blue-500/50 focus:border-blue-500 focus:outline-none transition-colors w-full p-1 text-lg tracking-tight placeholder-white/20"
                                            placeholder="Name"
                                        />
                                        <p className="text-sm text-gray-400 truncate px-1">{u.email}</p>
                                        {u.createdAt && (
                                            <p className="text-xs text-gray-500 mt-1 px-1">
                                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col md:flex-row gap-4 w-full">

                                    {/* Role */}
                                    <div className="flex-1 min-w-[140px]">
                                        <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 ml-1">Role</label>
                                        <RoleEditor
                                            uid={u.uid}
                                            currentRole={u.role || 'guest'}
                                            onRoleUpdate={(newRole) => {
                                                // Optimistic update for the list
                                                setUsers(prev => prev.map(user =>
                                                    user.uid === u.uid ? { ...user, role: newRole as User['role'] } : user
                                                ));
                                            }}
                                        />
                                    </div>

                                    {/* Department */}
                                    <div className="flex-[2] min-w-[200px]">
                                        <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 ml-1">Default Department</label>
                                        <select
                                            value={u.defaultDepartment || ""}
                                            onChange={(e) => handleUpdate(u.uid, 'defaultDepartment', e.target.value)}
                                            disabled={saving === u.uid || !!u.defaultInstitution || isOrgLocked(u.role)}
                                            className={`w-full bg-black/20 text-white border border-[#ffffff1a] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:bg-white/5 transition-colors ${u.defaultInstitution || isOrgLocked(u.role) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="" className="bg-slate-900">Select Department...</option>
                                            {departmentsList.map(dept => (
                                                <option key={dept} value={dept} className="bg-slate-900">{dept}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Institution */}
                                    <div className="flex-[2] min-w-[200px]">
                                        <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 ml-1">Default Institution</label>
                                        <select
                                            value={u.defaultInstitution || ""}
                                            onChange={(e) => handleUpdate(u.uid, 'defaultInstitution', e.target.value)}
                                            disabled={saving === u.uid || !!u.defaultDepartment || isOrgLocked(u.role)}
                                            className={`w-full bg-black/20 text-white border border-[#ffffff1a] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer hover:bg-white/5 transition-colors ${u.defaultDepartment || isOrgLocked(u.role) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="" className="bg-slate-900">Select Institution...</option>
                                            {institutionsList.map(inst => (
                                                <option key={inst} value={inst} className="bg-slate-900">{inst}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
