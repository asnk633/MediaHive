'use client';

import React from 'react';
import { Shield, Users, User, CheckCircle2, XCircle } from 'lucide-react';

const ROLES = [
    {
        id: 'admin',
        label: 'Admin',
        icon: Shield,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        capabilities: [
            { label: 'Full Data Control', enabled: true },
            { label: 'Resolve Any Conflict', enabled: true },
            { label: 'Override Policies', enabled: true },
            { label: 'Permanent Purge', enabled: true },
            { label: 'System Configuration', enabled: true }
        ]
    },
    {
        id: 'team',
        label: 'Team',
        icon: Users,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        capabilities: [
            { label: 'Standard Task Work', enabled: true },
            { label: 'Resolve Own Conflicts', enabled: true },
            { label: 'Override Policies', enabled: false },
            { label: 'Permanent Purge', enabled: false },
            { label: 'System Configuration', enabled: false }
        ]
    },
    {
        id: 'guest',
        label: 'Member',
        icon: User,
        color: 'text-white/40',
        bg: 'bg-white/5',
        border: 'border-white/10',
        capabilities: [
            { label: 'View Published Data', enabled: true },
            { label: 'Resolve Conflicts', enabled: false },
            { label: 'Delete Data', enabled: false },
            { label: 'Permanent Purge', enabled: false },
            { label: 'System Configuration', enabled: false }
        ]
    }
];

export const RoleAuthorityMap: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-white">Role Authority Map</h3>
                <p className="text-sm text-white/40 font-medium tracking-tight leading-relaxed">
                    Visual breakdown of system-wide permissions and decision hierarchy.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {ROLES.map((role) => (
                    <div
                        key={role.id}
                        className={`p-6 rounded-[32px] border ${role.border} ${role.bg} transition-all duration-300 hover:scale-[1.02] shadow-xl`}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-2xl ${role.color} bg-black/20 border border-white/5`}>
                                <role.icon size={24} />
                            </div>
                            <span className="text-lg font-bold text-white">{role.label}</span>
                        </div>

                        <div className="space-y-4">
                            {role.capabilities.map((cap, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3">
                                    <span className={`text-xs font-medium ${cap.enabled ? 'text-white/70' : 'text-white/20'}`}>
                                        {cap.label}
                                    </span>
                                    {cap.enabled ? (
                                        <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                                    ) : (
                                        <XCircle size={16} className="text-white/10 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
