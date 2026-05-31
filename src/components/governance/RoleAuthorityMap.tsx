'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Users, User, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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
        id: 'manager',
        label: 'Manager',
        icon: ShieldCheck,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        capabilities: [
            { label: 'Full Data Control', enabled: true },
            { label: 'Resolve Any Conflict', enabled: true },
            { label: 'Override Policies', enabled: false },
            { label: 'Permanent Purge', enabled: false },
            { label: 'System Configuration', enabled: false }
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
        id: 'member',
        label: 'Member',
        icon: User,
        color: 'text-foreground/80',
        bg: 'bg-foreground/5',
        border: 'border-foreground/10',
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
    const [rolePercentages, setRolePercentages] = useState<Record<string, number>>({
        admin: 0,
        manager: 0,
        team: 0,
        member: 0,
    });

    useEffect(() => {
        const fetchRoles = async () => {
            const { data, error } = await supabase.from('profiles').select('role');
            if (error || !data) return;

            let total = data.length || 1;
            let counts: Record<string, number> = { admin: 0, manager: 0, team: 0, member: 0 };

            data.forEach((p: any) => {
                const role = (p.role || 'member').toLowerCase();
                if (role.includes('admin')) counts.admin++;
                else if (role.includes('manager')) counts.manager++;
                else if (role.includes('team')) counts.team++;
                else counts.member++;
            });

            setRolePercentages({
                admin: (counts.admin / total) * 100,
                manager: (counts.manager / total) * 100,
                team: (counts.team / total) * 100,
                member: (counts.member / total) * 100,
            });
        };

        fetchRoles();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-foreground">Role Authority Map</h3>
                <p className="text-sm text-foreground/80 font-medium tracking-tight leading-relaxed">
                    Visual breakdown of system-wide permissions and decision hierarchy.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {ROLES.map((role) => (
                    <div
                        key={role.id}
                        className={`p-6 rounded-[32px] border ${role.border} ${role.bg} transition-all duration-300 hover:scale-[1.02] shadow-xl`}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-2xl ${role.color} bg-black/20 border border-foreground/5`}>
                                <role.icon size={24} />
                            </div>
                            <span className="text-lg font-bold text-foreground">{role.label}</span>
                        </div>

                        <div className="space-y-4">
                            {role.capabilities.map((cap, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3">
                                    <span className={`text-xs font-medium ${cap.enabled ? 'text-foreground/70' : 'text-foreground/80'}`}>
                                        {cap.label}
                                    </span>
                                    {cap.enabled ? (
                                        <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                                    ) : (
                                        <XCircle size={16} className="text-foreground/70 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Population</span>
                                <span className={`text-xs font-bold ${role.color}`}>{rolePercentages[role.id]?.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${role.bg.replace('/10', '')} transition-all duration-1000`}
                                    style={{ width: `${rolePercentages[role.id] || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
