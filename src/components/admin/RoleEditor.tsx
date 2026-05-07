'use client';

import React, { useState } from 'react';
import { updateRole } from '@/services/roleService';
import { User } from '@/services/userService';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { Shield, User as UserIcon, ShieldAlert } from 'lucide-react';
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

type RoleEditorProps = {
    uid: string;
    currentRole: string;
    onRoleUpdate?: (newRole: string) => void;
};

export const RoleEditor: React.FC<RoleEditorProps> = ({ uid, currentRole, onRoleUpdate }) => {
    const [role, setRole] = useState(currentRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [confirmConfig, setConfirmConfig] = useState<{
        open: boolean;
        newRole: string;
    }>({
        open: false,
        newRole: '',
    });

    const handleRoleChange = (newRole: string) => {
        if (newRole === role) return;
        setConfirmConfig({ open: true, newRole });
    };

    const processRoleChange = async () => {
        const newRole = confirmConfig.newRole;
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
            setConfirmConfig({ open: false, newRole: '' });
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
                    { id: 'admin', label: 'Admin', icon: <ShieldAlert size={14} className="text-red-400" /> },
                    { id: 'manager', label: 'Manager', icon: <Shield size={14} /> },
                    { id: 'team', label: 'Team', icon: <UserIcon size={14} /> },
                    { id: 'member', label: 'Member', icon: <UserIcon size={14} /> },
                ]}
            />

            {error && (
                <span className="text-xs text-red-400 pl-1">{error}</span>
            )}

            <ConfirmationDialog 
                open={confirmConfig.open}
                onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}
                title="Confirm Role Update"
                description={`Are you sure you want to change this user's role to ${confirmConfig.newRole.toUpperCase()}? This may affect their permissions across the platform.`}
                onConfirm={processRoleChange}
            />
        </div>
    );
};
