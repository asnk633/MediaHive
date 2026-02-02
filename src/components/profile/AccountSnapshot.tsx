import React from 'react';
import { AuthUser } from '@/contexts/AuthContextProvider';
import { Mail, Shield, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface AccountSnapshotProps {
    user: AuthUser | null;
}

export function AccountSnapshot({ user }: AccountSnapshotProps) {
    // Determine Access Level based on role
    const getAccessLevel = (role: string) => {
        switch (role) {
            case 'admin': return 'Full System Access';
            case 'team': return 'Production Access';
            default: return 'Limited (Request Only)';
        }
    };

    // Determine Account Type
    const getAccountType = (user: AuthUser | null) => {
        if (user?.isSuperAdmin) return 'Root Administrator';
        if (user?.role === 'guest') return 'Office / Unit Account';
        if (user?.institutionId) return 'Institution Account';
        return 'Standard Account';
    };

    // Placeholder for joined date - AuthContext doesn't expose it yet, so we'll mock or leave blank
    // If real data needed, we'd need to fetch from user.metadata.creationTime in context
    const joinedDate = "Jan 2026";

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <SnapshotItem
                    icon={Shield}
                    label="Role"
                    value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Guest'}
                />
                <SnapshotItem
                    icon={User}
                    label="Access Level"
                    value={getAccessLevel(user?.role || 'guest')}
                />
                <SnapshotItem
                    icon={Mail}
                    label="Account Type" // Changed Label per prompt request (fields: Account Type)
                    value={getAccountType(user)}
                    truncate
                />
                <SnapshotItem
                    icon={Calendar}
                    label="Joined On"
                    value={joinedDate}
                />
            </div>
        </div>
    );
}

function SnapshotItem({ icon: Icon, label, value, truncate }: { icon: any; label: string; value: string; truncate?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon size={14} className="opacity-70" />
                <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
            </div>
            <p className={`text-sm font-medium text-foreground ${truncate ? 'truncate' : ''}`} title={value}>
                {value}
            </p>
        </div>
    );
}
