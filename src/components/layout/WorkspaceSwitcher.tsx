'use client';

import React from 'react';
import { Building2, LayoutGrid } from 'lucide-react';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
    isCollapsed?: boolean;
}

export function WorkspaceSwitcher({ isCollapsed }: WorkspaceSwitcherProps) {
    const { currentWorkspace, loading } = useWorkspace();

    if (loading) {
        return (
            <div className="flex items-center h-12 px-0 bg-white/5 rounded-[18px] animate-pulse">
                <div className="grid grid-cols-[40px_1fr] items-center w-full">
                    <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                    {!isCollapsed && <div className="ml-4 w-24 h-4 bg-white/10 rounded" />}
                </div>
            </div>
        );
    }

    if (!currentWorkspace) return null;

    const Icon = currentWorkspace.type === 'department' ? LayoutGrid : Building2;
    const accentColor = currentWorkspace.type === 'department' ? 'amber' : 'indigo';
    const secondaryLabel = currentWorkspace.type === 'department' ? 'Thaiba Garden' : 'Thaiba Garden';
    const secondaryType = currentWorkspace.type === 'department' ? 'Institution' : 'Department';

    return (
        <div className={cn(
            "flex items-center h-12 rounded-[18px] transition-all duration-300 px-0",
            isCollapsed ? "justify-center" : ""
        )}>
            <div className="grid grid-cols-[40px_1fr] items-center w-full">
                <div className={cn(
                    "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all shadow-lg",
                    currentWorkspace.type === 'department'
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                )}>
                    <Icon size={16} />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col overflow-hidden ml-4">
                        <span className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                            {currentWorkspace.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">
                                {secondaryLabel}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[9px] text-white/20 font-bold uppercase tracking-wider">
                                {secondaryType}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
