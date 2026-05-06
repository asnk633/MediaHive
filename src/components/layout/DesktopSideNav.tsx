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
    CloudDownload,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Trash2,
    ShieldCheck,
    FlaskConical,
    Bot,
    Terminal,
    Kanban,
    Activity,
    ShieldAlert,
    Video,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { canAccessFeature, UserRole } from '@/system/features/featureAccess';
import { FeatureKey } from '@/system/features/featureRegistry';
import { cn, nativeNavigate } from "@/lib/utils";
import { getDriveImageUrl } from '@/lib/driveUtils';
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";


import { usePermissions } from '@/hooks/usePermissions';

export default function DesktopSideNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut, loading: authLoading } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { role: currentRole, canReadReports } = usePermissions();
    const { currentWorkspace } = useWorkspace();
    const isAdminRoute = pathname.startsWith('/admin');

    const updateWidthVar = (collapsed: boolean) => {
        const width = collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
        document.documentElement.style.setProperty('--current-sidebar-width', width);
    };

    useEffect(() => {
        setMounted(true);
        if (isAdminRoute) {
            document.documentElement.style.setProperty('--current-sidebar-width', '0px');
            return;
        }
        const saved = localStorage.getItem('sidebar-collapsed');
        const collapsed = saved === 'true';
        setIsCollapsed(collapsed);
        updateWidthVar(collapsed);
    }, [isAdminRoute]);

    if (!mounted) return null;
    if (isAdminRoute) return null;

    // Grouped Navigation Structure
    const navGroups = [
        {
            id: 'workspace',
            label: 'Workspace',
            items: [
                { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: '/home' },
                { id: 'tasks', label: 'My Tasks', icon: CheckSquare, path: '/tasks', feature: 'tasks' as FeatureKey },
                { id: 'calendar', label: 'Events', icon: Calendar, path: '/events', feature: 'events' as FeatureKey },
                ...(canReadReports ? [
                    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' }
                ] : []),
                // Phase 5D: Trash — hidden from Guests
                ...(currentRole !== 'guest' ? [
                    { id: 'trash', label: 'Trash', icon: Trash2, path: '/tasks/trash' }
                ] : []),
            ]
        },
        {
            id: 'repository',
            label: 'Library',
            items: [
                { id: 'downloads', label: 'Downloads', icon: CloudDownload, path: '/downloads' },
                { id: 'inventory', label: 'Media Inventory', icon: HardDrive, path: '/inventory', feature: 'inventory' as FeatureKey },
            ]
        },
        {
            id: 'labs',
            label: 'Laboratory',
            feature: 'labs' as FeatureKey,
            items: [
                { id: 'labs-hub', label: 'MediaHive Labs', icon: FlaskConical, path: '/labs' },
            ]
        },
        {
            id: 'admin',
            label: 'System',
            items: [
                // Global Admin: Control Panel
                ...(user?.role === 'admin' ? [
                    { id: 'admin-panel', label: 'Control Panel', icon: ShieldAlert, path: '/admin' }
                ] : []),
                // Institutional Manager/Admin: Users list
                ...(['admin', 'manager'].includes(currentRole) ? [
                    { id: 'users', label: 'User Directory', icon: Users, path: '/admin/users' }
                ] : []),
                { id: 'governance', label: 'Governance', icon: ShieldCheck, path: '/governance' },
                { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
            ],
        }
    ];

    // Final Filter based on Feature Flags
    const filteredGroups = navGroups
        .filter(group => {
            if ('feature' in group && (group as any).feature) {
                return canAccessFeature(
                    (group as any).feature as FeatureKey,
                    (currentRole as UserRole) || 'guest',
                    currentWorkspace ? { id: currentWorkspace.institution_id, features: currentWorkspace.features } : undefined
                );
            }
            return true;
        })
        .map(group => ({
            ...group,
            items: group.items.filter(item => {
                // If item has a feature key, check access
                if ('feature' in item && item.feature) {
                    return canAccessFeature(
                        item.feature as FeatureKey,
                        (currentRole as UserRole) || 'guest',
                        currentWorkspace ? { id: currentWorkspace.institution_id, features: currentWorkspace.features } : undefined
                    );
                }
                return true;
            })
        })).filter(group => group.items.length > 0);


    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem('sidebar-collapsed', String(next));
        updateWidthVar(next);
    };

    // Identity cluster rendering helper
    const renderIdentity = () => {
        if (authLoading || !mounted) {
            return (
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse shrink-0" />
                    {!isCollapsed && (
                        <div className="flex flex-col gap-1">
                            <div className="h-3 w-24 bg-white/10 animate-pulse rounded" />
                            <div className="h-2 w-14 bg-white/5 animate-pulse rounded" />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn("flex items-center outline-none group", isCollapsed ? "justify-center" : "gap-3")}>
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/20 shrink-0 shadow-lg group-hover:ring-indigo-500/50 transition-all duration-300">
                                {(user?.avatar_url || user?.photoURL) ? (
                                    <img src={getDriveImageUrl(user.avatar_url || user.photoURL, user.avatar_drive_id)} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-xs font-bold text-white/40 uppercase">
                                        {user?.email?.[0] || 'U'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#09090b] rounded-full shadow-sm" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden text-left">
                                <span className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors tracking-tight">{user?.name || 'Authorized User'}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{currentRole || 'Guest'}</span>
                                </div>
                            </div>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    align="start" 
                    sideOffset={12} 
                    className="w-72 bg-[#0c0c0e] border-white/10 p-0 overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200 rounded-[24px]"
                >
                    {/* Header Section */}
                    <div className="relative px-5 py-6 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-2.5">Active Session</div>
                        <div className="flex flex-col gap-0.5">
                            <div className="text-sm font-bold text-white tracking-tight truncate">{user?.name || 'Authorized User'}</div>
                            <div className="text-[11px] text-white/60 font-medium truncate">{user?.email}</div>
                        </div>
                    </div>
                    
                    <div className="h-px bg-white/5" />

                    <div className="p-2 space-y-1">
                        <DropdownMenuItem 
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:bg-white/[0.03] focus:bg-white/[0.03] text-white/70 hover:text-white transition-all group border-none outline-none"
                            onClick={() => nativeNavigate('/settings', router, 'Profile')}
                        >
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                                <Settings size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Profile Settings</span>
                                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Identity & Preferences</span>
                            </div>
                        </DropdownMenuItem>

                        <div className="h-px bg-white/5 my-1 mx-2" />

                        <DropdownMenuItem 
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10 text-rose-400/70 hover:text-rose-400 transition-all group border-none outline-none"
                            onClick={() => user?.uid && signOut()}
                        >
                            <div className="w-9 h-9 rounded-xl bg-rose-500/5 flex items-center justify-center text-rose-500/40 group-hover:text-rose-400 group-hover:bg-rose-500/15 transition-all">
                                <LogOut size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Sign Out</span>
                                <span className="text-[10px] text-rose-500/30 font-medium uppercase tracking-wider">Terminate Session</span>
                            </div>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '76px' : '260px' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
                left: "max(1.5rem, calc((100vw - var(--content-max-width)) / 2 - var(--current-sidebar-width) - 1.5rem))"
            }}
            className={cn(
                "fixed top-1/2 -translate-y-1/2 z-[60] hidden lg:flex flex-col select-none overflow-hidden h-fit max-h-[calc(100vh-3rem)] rounded-[32px]",
                "glass-liquid border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
            )}
        >
            {/* 1. Brand Header */}
            <div className={cn(
                "h-[72px] flex items-center transition-[padding] duration-300",
                isCollapsed ? "justify-center px-4" : "px-7"
            )}>
                <div className="relative group cursor-pointer" onClick={() => router.push('/home')}>
                    <img
                        src="/mediahive-icon.png"
                        alt="MH"
                        className="w-10 h-10 rounded-xl shrink-0 shadow-2xl transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-xl font-black text-white tracking-tighter whitespace-nowrap overflow-hidden ml-4 text-premium-gradient"
                        >
                            MediaHive
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Identity Cluster */}
            <div className={cn(
                "flex flex-col gap-5 mb-8 transition-all duration-300 border-b border-white/5 pb-6",
                isCollapsed ? "items-center px-4" : "px-7"
            )}>
                {/* Workspace Switcher */}
                <WorkspaceSwitcher />

                {/* Notification Bell */}
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-4")}>
                    <NotificationBell />
                    {!isCollapsed && (
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Team Updates</span>
                    )}
                </div>

                {/* Avatar / Profile */}
                {renderIdentity()}
            </div>

            {/* 3. Navigation List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-7">
                {filteredGroups.map((group) => (
                    <div key={group.id} className="space-y-3">
                        {!isCollapsed && (
                            <motion.h3
                                initial={false}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden"
                            >
                                {group.label}
                            </motion.h3>
                        )}
                        <div className="space-y-1.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => nativeNavigate(item.path, router, `Nav:${item.label}`)}
                                        className={cn(
                                            "group relative w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-300 ease-out active:scale-95 sidebar-item",
                                            isActive
                                                ? "bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] premium-shadow"
                                                : "hover:bg-white/[0.02]"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <div className="relative">
                                            <item.icon
                                                size={18}
                                                className={cn(
                                                    "transition-all duration-300 shrink-0",
                                                    isActive
                                                        ? "text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.6)] scale-110"
                                                        : "text-white/40 group-hover:text-white group-hover:scale-110"
                                                )}
                                            />
                                            {isActive && (
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full -z-10" />
                                            )}
                                        </div>

                                        <motion.span
                                            initial={false}
                                            animate={{
                                                opacity: isCollapsed ? 0 : 1,
                                                x: isCollapsed ? -10 : 0,
                                                display: isCollapsed ? 'none' : 'block',
                                            }}
                                            className={cn(
                                                "text-sm font-semibold tracking-tight transition-colors duration-300",
                                                isActive ? "text-white" : "text-white/40 group-hover:text-white"
                                            )}
                                        >
                                            {item.label}
                                        </motion.span>

                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-pill"
                                                className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Footer / Collapse Trigger */}
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
