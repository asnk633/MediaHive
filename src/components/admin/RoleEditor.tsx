'use client';

import React, { useState } from 'react';
import { updateRole } from '@/services/roleService';
import { User } from '@/services/userService';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { Shield, User as UserIcon, ShieldAlert } from 'lucide-react';

type RoleEditorProps = {
    uid: string;
    currentRole: string;
    onRoleUpdate?: (newRole: string) => void;
};

export const RoleEditor: React.FC<RoleEditorProps> = ({ uid, currentRole, onRoleUpdate }) => {
    const [role, setRole] = useState(currentRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRoleChange = async (newRole: string) => {
        if (newRole === role) return;

        if (!confirm(`Are you sure you want to change role to ${newRole}?`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await updateRole(uid, newRole);
            setRole(newRole);
            if (onRoleUpdate) onRoleUpdate(newRole);
        } catch (err: any) {
            console.error('Failed to update role:', err);
            setError(err.message || 'Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1 min-w-[140px]">
            <DropdownSelector 
                label=""
                value={role}
                onChange={handleRoleChange}
                disabled={loading}
                options={[
                    { id: 'guest', label: 'Guest', icon: <UserIcon size={14} /> },
                    { id: 'member', label: 'Member', icon: <UserIcon size={14} /> },
                    { id: 'manager', label: 'Manager', icon: <Shield size={14} /> },
                    { id: 'admin', label: 'Admin', icon: <ShieldAlert size={14} className="text-red-400" /> },
                ]}
            />

            {error && (
                <span className="text-xs text-red-400 pl-1">{error}</span>
            )}
        </div>
    );
};
