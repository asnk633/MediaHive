"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, User as UserIcon, Users, Save, Plus, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

type UserData = {
    id: number;
    email: string;
    fullName: string;
    role: 'admin' | 'team' | 'guest';
    institutionId: number;
    departmentId: number | null;
};

type Department = {
    id: number;
    name: string;
};

type Institution = {
    id: number;
    name: string;
};

type UserDepartment = {
    id: number;
    departmentId: number;
    departmentName: string;
};

type UserInstitution = {
    id: number;
    institutionId: number;
    institutionName: string;
};

export default function EnhancedUserManagementPage() {
    const { user } = useAuth(); // Role from context (for protection)
    const [users, setUsers] = useState<UserData[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [userDepartments, setUserDepartments] = useState<Record<number, UserDepartment[]>>({});
    const [userInstitutions, setUserInstitutions] = useState<Record<number, UserInstitution[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users
            const usersData = await apiClient('/api/users', {
                method: 'GET'
            });
            setUsers(usersData);
            
            // Fetch departments and institutions for each user
            usersData.forEach(async (u: UserData) => {
                await fetchUserDepartments(u.id);
                await fetchUserInstitutions(u.id);
            });
            
            // Fetch all departments
            const deptData = await apiClient('/api/departments', {
                method: 'GET'
            });
            setDepartments(deptData);
            
            // Fetch all institutions
            const instData = await apiClient('/api/institutions', {
                method: 'GET'
            });
            setInstitutions(instData);
        } catch (e) {
            console.error("Failed to fetch data", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDepartments = async (userId: number) => {
        try {
            const data = await apiClient(`/api/user-departments?userId=${userId}`, {
                method: 'GET'
            });
            setUserDepartments(prev => ({ ...prev, [userId]: data }));
        } catch (e) {
            console.error(`Failed to fetch departments for user ${userId}`, e);
        }
    };

    const fetchUserInstitutions = async (userId: number) => {
        try {
            const data = await apiClient(`/api/user-institutions?userId=${userId}`, {
                method: 'GET'
            });
            setUserInstitutions(prev => ({ ...prev, [userId]: data }));
        } catch (e) {
            console.error(`Failed to fetch institutions for user ${userId}`, e);
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        setSaving(`role-${userId}`);
        try {
            await apiClient('/api/users', {
                method: 'PUT',
                body: JSON.stringify({ id: userId, role: newRole })
            });
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
        } catch (e) {
            console.error("Failed to update role", e);
            alert("Failed to update role");
        } finally {
            setSaving(null);
        }
    };

    const addUserDepartment = async (userId: number, departmentId: number) => {
        try {
            await apiClient('/api/user-departments', {
                method: 'POST',
                body: JSON.stringify({ userId, departmentId })
            });
            
            await fetchUserDepartments(userId);
        } catch (e) {
            console.error("Failed to add department", e);
            alert("Failed to add department");
        }
    };

    const removeUserDepartment = async (userId: number, departmentId: number) => {
        try {
            await apiClient(`/api/user-departments?userId=${userId}&departmentId=${departmentId}`, {
                method: 'DELETE'
            });
            
            await fetchUserDepartments(userId);
        } catch (e) {
            console.error("Failed to remove department", e);
            alert("Failed to remove department");
        }
    };

    const addUserInstitution = async (userId: number, institutionId: number) => {
        try {
            await apiClient('/api/user-institutions', {
                method: 'POST',
                body: JSON.stringify({ userId, institutionId })
            });
            
            await fetchUserInstitutions(userId);
        } catch (e) {
            console.error("Failed to add institution", e);
            alert("Failed to add institution");
        }
    };

    const removeUserInstitution = async (userId: number, institutionId: number) => {
        try {
            await apiClient(`/api/user-institutions?userId=${userId}&institutionId=${institutionId}`, {
                method: 'DELETE'
            });
            
            await fetchUserInstitutions(userId);
        } catch (e) {
            console.error("Failed to remove institution", e);
            alert("Failed to remove institution");
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-white">Access Denied. Admins only.</div>;
    }

    return (
        <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-6xl mx-auto">
            <header className="mb-8 pt-6">
                <h1 className="text-3xl font-display font-bold text-white mb-2">Enhanced User Management</h1>
                <p className="text-[var(--color-text-secondary)]">Manage user roles, departments, and institutions.</p>
            </header>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-white">Loading users...</div>
                ) : (
                    users.map((u) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[20px] p-4 shadow-sm"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {u.fullName ? u.fullName[0].toUpperCase() : u.email?.[0].toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{u.fullName || 'Unknown Name'}</h3>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{u.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-[var(--color-text-secondary)] uppercase font-bold tracking-wider mr-2">Role</label>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            disabled={saving === `role-${u.id}`}
                                            className="bg-[var(--color-bg-subtle)] text-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="guest">Guest</option>
                                            <option value="team">Team Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {saving === `role-${u.id}` && <span className="text-xs text-indigo-400 animate-pulse">Saving...</span>}
                                    </div>
                                    
                                    <button 
                                        onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                                    >
                                        {editingUserId === u.id ? 'Close' : 'Edit Tags'}
                                    </button>
                                </div>
                            </div>

                            {editingUserId === u.id && (
                                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Departments Section */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-2">Departments</h4>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {userDepartments[u.id]?.map((ud) => (
                                                    <div key={ud.id} className="flex items-center bg-blue-900/30 text-blue-200 px-2 py-1 rounded-md text-xs">
                                                        {ud.departmentName}
                                                        <button 
                                                            onClick={() => removeUserDepartment(u.id, ud.departmentId)}
                                                            className="ml-1 text-blue-400 hover:text-white"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    onChange={(e) => e.target.value && addUserDepartment(u.id, parseInt(e.target.value))}
                                                    defaultValue=""
                                                    className="flex-1 bg-[var(--color-bg-subtle)] text-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Add Department</option>
                                                    {departments
                                                        .filter(d => !userDepartments[u.id]?.some(ud => ud.departmentId === d.id))
                                                        .map((dept) => (
                                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Institutions Section */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-2">Institutions</h4>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {userInstitutions[u.id]?.map((ui) => (
                                                    <div key={ui.id} className="flex items-center bg-green-900/30 text-green-200 px-2 py-1 rounded-md text-xs">
                                                        {ui.institutionName}
                                                        <button 
                                                            onClick={() => removeUserInstitution(u.id, ui.institutionId)}
                                                            className="ml-1 text-green-400 hover:text-white"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    onChange={(e) => e.target.value && addUserInstitution(u.id, parseInt(e.target.value))}
                                                    defaultValue=""
                                                    className="flex-1 bg-[var(--color-bg-subtle)] text-white border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Add Institution</option>
                                                    {institutions
                                                        .filter(i => !userInstitutions[u.id]?.some(ui => ui.institutionId === i.id))
                                                        .map((inst) => (
                                                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}