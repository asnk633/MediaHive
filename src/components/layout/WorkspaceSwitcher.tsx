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
            <div className="flex items-center h-12 px-0 bg-foreground/5 rounded-[18px] animate-pulse">
                <div className="grid grid-cols-[40px_1fr] items-center w-full">
                    <div className="w-10 h-10 rounded-xl bg-foreground/10 shrink-0" />
                    {!isCollapsed && <div className="ml-4 w-24 h-4 bg-foreground/10 rounded" />}
                </div>
            </div>
        );
    }

    if (!currentWorkspace) return null;

    const Icon = currentWorkspace.type === 'department' ? LayoutGrid : Building2;

    return (
        <div className={cn(
            "flex items-center h-12 rounded-[18px] transition-all duration-300 px-0",
            isCollapsed ? "justify-center" : ""
        )}>
            <div className="grid grid-cols-[40px_1fr] items-center w-full">
                <div className={cn(
                    "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all shadow-lg",
                    "bg-primary/10 border-primary/20 text-primary"
                )}>
                    <Icon size={16} />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col overflow-hidden ml-4">
                        <span className="text-sm font-bold text-foreground tracking-tight truncate leading-tight">
                            {currentWorkspace.name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
