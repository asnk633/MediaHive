"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    BarChart3,
    HardDrive,
    FolderClosed,
    Database,
    CloudDownload,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { cn, nativeNavigate } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DevEnvironmentBadge } from "@/components/debug/DevEnvironmentBadge";

export default function DesktopSideNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Grouped Navigation Structure
    const navGroups = [
        {
            id: 'workspace',
            label: 'Workspace',
            items: [
                { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: '/home' },
                { id: 'tasks', label: 'My Tasks', icon: CheckSquare, path: '/tasks' },
                { id: 'calendar', label: 'Events', icon: Calendar, path: '/calendar' },
                { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
            ]
        },
        {
            id: 'repository',
            label: 'Library',
            items: [
                { id: 'files', label: 'Files', icon: FolderClosed, path: '/files' },
                { id: 'media', label: 'Media Assets', icon: Database, path: '/media' },
                { id: 'downloads', label: 'Downloads', icon: CloudDownload, path: '/downloads' },
            ]
        },
        {
            id: 'admin',
            label: 'System',
            items: [
                { id: 'users', label: 'Users', icon: Users, path: '/users' },
                { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
            ],
            // adminOnly: true // Removed restricted access for settings visualization
        }
    ];

    const filteredGroups = navGroups;

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('sidebar-collapsed');
        const collapsed = saved === 'true';
        setIsCollapsed(collapsed);
        updateWidthVar(collapsed);
    }, []);

    const updateWidthVar = (collapsed: boolean) => {
        const width = collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
        document.documentElement.style.setProperty('--current-sidebar-width', width);
    };

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem('sidebar-collapsed', String(next));
        updateWidthVar(next);
    };

    if (!mounted) return null;

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '72px' : '240px' }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            style={{
                left: "max(clamp(1rem, 2.5vw, 4rem), calc((100vw - var(--content-max-width)) / 2 - var(--current-sidebar-width) - 1.5rem))"
            }}
            className={cn(
                "fixed top-1/2 -translate-y-1/2 z-[60] hidden lg:flex flex-col select-none overflow-hidden h-fit max-h-[calc(100vh-4rem)] rounded-[24px]",
                "glass-liquid"
            )}
        >
            {/* 1. Brand Header */}
            <div className={cn(
                "h-[var(--header-height)] flex items-center mb-2 transition-[padding] duration-200",
                isCollapsed ? "justify-center px-0" : "px-6"
            )}>
                <img
                    src="/mediahive-icon.png"
                    alt="MH"
                    className="w-8 h-8 rounded-sm shrink-0 shadow-lg"
                />

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 'auto' }}
                            exit={{ opacity: 0, x: -10, width: 0 }}
                            className="text-lg font-bold text-white tracking-tight whitespace-nowrap overflow-hidden ml-3 drop-shadow-md"
                        >
                            MediaHive
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Identity Cluster */}
            <div className={cn(
                "flex flex-col gap-4 mb-6 transition-all duration-200 border-b border-white/5 pb-4",
                isCollapsed ? "items-center px-0" : "px-6"
            )}>
                {/* Notification Bell */}
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <NotificationBell />
                    {!isCollapsed && (
                        <span className="text-sm font-medium text-white/60">Notifications</span>
                    )}
                </div>

                {/* Avatar / Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn("flex items-center outline-none group", isCollapsed ? "justify-center" : "gap-3")}>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 ring-1 ring-white/20 shrink-0 shadow-inner group-hover:ring-white/40 transition-all">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-xs font-medium text-white/50">
                                        {user?.email?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col overflow-hidden text-left">
                                    <span className="text-sm font-medium text-white truncate group-hover:text-white/80 transition-colors">{user?.name || 'User'}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-white/40 truncate capitalize">{user?.role || 'Guest'}</span>
                                        {/* Mini Badge for collapsed state or quick view */}
                                    </div>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={8} className="w-56 glass-panel border-white/10 bg-[#0a0a0a]/95 text-white">
                        <div className="px-2 py-1.5 text-xs text-white/50 font-medium">
                            Currently signed in as
                            <div className="text-white truncate font-bold mt-0.5">{user?.email}</div>
                        </div>
                        <div className="h-px bg-white/10 my-1" />

                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer" onClick={() => nativeNavigate('/settings/profile', router, 'Profile')}>
                            <Users size={14} className="mr-2" />
                            Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 focus:bg-transparent">
                            <DevEnvironmentBadge className="w-full justify-center cursor-pointer m-1" />
                        </DropdownMenuItem>

                        <div className="h-px bg-white/10 my-1" />

                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer" onClick={() => user?.uid && signOut()}>
                            <LogOut size={14} className="mr-2" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 2. Navigation List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-6">
                {filteredGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                        {!isCollapsed && (
                            <motion.h3
                                initial={false}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="px-3 text-xs font-semibold text-muted opacity-80 uppercase tracking-wide whitespace-nowrap overflow-hidden"
                            >
                                {group.label}
                            </motion.h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => nativeNavigate(item.path, router, `Nav:${item.label}`)}
                                        className={cn(
                                            "group relative w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ease-out active:scale-95",
                                            isActive
                                                ? "bg-white/[0.03] shadow-inner"
                                                : "hover:bg-white/[0.02]"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <item.icon
                                            size={20}
                                            className={cn(
                                                "transition-all duration-200",
                                                isActive
                                                    ? "text-[#60a5fa]"
                                                    : "text-[#cbd5f5] opacity-55 group-hover:opacity-100 group-hover:text-[#60a5fa]"
                                            )}
                                        />

                                        <motion.span
                                            initial={false}
                                            animate={{
                                                opacity: isCollapsed ? 0 : 1,
                                                x: isCollapsed ? -10 : 0,
                                                display: isCollapsed ? 'none' : 'block',
                                                transition: {
                                                    duration: isCollapsed ? 0.1 : 0.2,
                                                    delay: isCollapsed ? 0 : 0.1
                                                }
                                            }}
                                            className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Footer / Collapse Trigger */}
            <div className="p-4 mt-auto">
                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center py-2 rounded-md hover:bg-white/5 transition-colors text-text-muted hover:text-text-secondary"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft size={16} />
                            <motion.span
                                initial={false}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                                className="text-xs font-medium whitespace-nowrap overflow-hidden"
                            >
                                Collapse Sidebar
                            </motion.span>
                        </div>
                    )}
                </button>
            </div>
        </motion.aside>
    );
}
