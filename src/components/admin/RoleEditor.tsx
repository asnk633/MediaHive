'use client';

import React, { useState } from 'react';
import { updateRole } from '@/services/roleService';
import { User } from '@/services/userService';

type RoleEditorProps = {
    uid: string;
    currentRole: string;
    onRoleUpdate?: (newRole: string) => void;
};

export const RoleEditor: React.FC<RoleEditorProps> = ({ uid, currentRole, onRoleUpdate }) => {
    const [role, setRole] = useState(currentRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value;
        if (newRole === role) return;

        if (!confirm(`Are you sure you want to change role to ${newRole}?`)) {
            e.target.value = role; // Reset selection
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await updateRole(uid, newRole);
            setRole(newRole);
            if (onRoleUpdate) onRoleUpdate(newRole);

            // Optional: Show success toast here if toast system exists
            // alert('Role updated successfully'); 
        } catch (err: any) {
            console.error('Failed to update role:', err);
            setError(err.message || 'Failed to update role');
            // Reset logic could go here, but keeping optimistic UI or error state is fine
            e.target.value = role; // Reset selection on UI
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="relative">
                <select
                    value={role}
                    onChange={handleChange}
                    disabled={loading}
                    className={`
            appearance-none w-full px-3 py-1.5 pr-8 rounded-lg text-sm font-medium
            bg-white/5 border border-white/10
            text-white
            focus:outline-none focus:border-blue-500/50 focus:bg-white/10
            transition-all duration-200
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}
          `}
                >
                    <option value="guest" className="bg-slate-900 text-white">Guest</option>
                    <option value="team" className="bg-slate-900 text-white">Team</option>
                    <option value="admin" className="bg-slate-900 text-white">Admin</option>
                </select>

                {/* Custom Arrow Icon */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    )}
                </div>
            </div>

            {error && (
                <span className="text-xs text-red-400 pl-1">{error}</span>
            )}
        </div>
    );
};
