'use client';

import React from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

import ClientOnly from "@/components/ClientOnly";

interface WorkspaceSwitcherProps {
    isCollapsed?: boolean;
}

export function WorkspaceSwitcher({ isCollapsed }: WorkspaceSwitcherProps) {
    const { currentWorkspace, availableWorkspaces, setWorkspace, loading, isSingleWorkspace } = useWorkspace();

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

    // If only one workspace is available and user is not admin, just show a static label or hide entirely
    if (isSingleWorkspace) {
        return (
            <div className={cn(
                "flex items-center h-12 rounded-[18px] transition-all duration-300 opacity-60 px-0",
                isCollapsed ? "justify-center" : ""
            )}>
                <div className="grid grid-cols-[40px_1fr] items-center w-full">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-white/40" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden ml-4">
                            <span className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                                {currentWorkspace.name}
                            </span>
                            <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mt-0.5">
                                Active Dept
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <ClientOnly>
            <DropdownMenu>
                <DropdownMenuTrigger className={cn(
                    "flex items-center w-full h-12 hover:bg-white/5 rounded-[18px] transition-all duration-300 outline-none group text-left px-0",
                    isCollapsed ? "justify-center" : ""
                )}>
                    <div className="grid grid-cols-[40px_1fr] items-center w-full">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                            <Building2 size={16} className="text-indigo-400" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-1 items-center justify-between ml-4 overflow-hidden">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                                        {currentWorkspace.name}
                                    </span>
                                    <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mt-0.5">
                                        Switch Dept
                                    </span>
                                </div>
                                <ChevronDown size={14} className="text-white/20 group-hover:text-white/40 transition-colors ml-2 shrink-0" />
                            </div>
                        )}
                    </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64 glass-panel border-white/10 bg-[#0a0a0a]/95 text-white p-1.5 mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                        Your Departments / Institutions
                    </div>

                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5">
                        {availableWorkspaces.map((ws) => (
                            <DropdownMenuItem
                                key={ws.institution_id}
                                onClick={() => setWorkspace(ws.institution_id)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-lg border border-transparent cursor-pointer transition-all duration-200 group/item",
                                    currentWorkspace.institution_id === ws.institution_id
                                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                        : "hover:bg-white/5 text-white/60 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                                        currentWorkspace.institution_id === ws.institution_id
                                            ? "bg-blue-500/20 border-blue-500/30"
                                            : "bg-white/5 border-white/5 group-hover/item:border-white/10"
                                    )}>
                                        <Building2 size={16} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-semibold truncate leading-tight">
                                            {ws.name}
                                        </span>
                                        <span className="text-[10px] opacity-40 uppercase tracking-tighter">
                                            Active Instance
                                        </span>
                                    </div>
                                </div>
                                {currentWorkspace.institution_id === ws.institution_id && (
                                    <Check size={16} className="text-blue-400 shrink-0 ml-2" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>

                    {availableWorkspaces.length === 0 && (
                        <div className="px-3 py-4 text-center">
                            <p className="text-xs text-white/40">No other workspaces available.</p>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </ClientOnly>
    );
}
