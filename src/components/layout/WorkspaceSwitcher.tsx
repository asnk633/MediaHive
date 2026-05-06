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
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg animate-pulse">
                <div className="w-4 h-4 rounded-full bg-white/10" />
                <div className="w-20 h-3 bg-white/10 rounded" />
            </div>
        );
    }

    if (!currentWorkspace) return null;

    // If only one workspace is available and user is not admin, just show a static label or hide entirely
    if (isSingleWorkspace) {
        return (
            <div className={cn("flex items-center gap-2 py-1.5 opacity-60", isCollapsed ? "justify-center px-0" : "px-2")}>
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-white/40" />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold text-white tracking-tight truncate leading-tight">
                            {currentWorkspace.name}
                        </span>
                        <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                            Default Department
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <ClientOnly>
            <DropdownMenu>
                <DropdownMenuTrigger className={cn(
                    "flex items-center hover:bg-white/5 rounded-xl transition-all duration-200 outline-none group text-left",
                    isCollapsed ? "justify-center p-1" : "gap-2 px-2 py-1.5"
                )}>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <Building2 size={14} className="text-blue-400" />
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-white tracking-tight truncate leading-tight">
                                    {currentWorkspace.name}
                                </span>
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                    Switch Department
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-white/20 group-hover:text-white/40 transition-colors ml-1" />
                        </>
                    )}
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
