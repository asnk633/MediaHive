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
    Coffee,
    Sliders,
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
import { useTheme } from '@/contexts/ThemeContext';


import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";


import { usePermissions } from '@/hooks/usePermissions';

export default function DesktopSideNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut, loading: authLoading } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { role: currentRole, canReadReports } = usePermissions();
    const { currentWorkspace, tenantSettings } = useWorkspace();
    const { theme } = useTheme();
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
                { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks', feature: 'tasks' as FeatureKey },
                { id: 'calendar', label: 'Events', icon: Calendar, path: '/events', feature: 'events' as FeatureKey },
                ...(canReadReports ? [
                    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports', feature: 'reports' as FeatureKey }
                ] : []),
                // Phase 5D: Trash — hidden from Members
                ...(currentRole !== 'member' ? [
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
        // Laboratory Hub (Alpha/Beta tools)
        ...(currentRole !== 'member' ? [
            {
                id: 'labs',
                label: 'Laboratory',
                feature: 'labs' as FeatureKey,
                items: [
                    { id: 'labs-hub', label: 'MediaHive Labs', icon: FlaskConical, path: '/labs' },
                ]
            }
        ] : []),
        {
            id: 'admin',
            label: 'System',
            items: [
                // Global Admin: System Management
                ...(currentRole === 'admin' ? [
                    { id: 'admin-panel', label: 'Control Panel', icon: ShieldAlert, path: '/admin' },
                    { id: 'governance', label: 'Governance', icon: ShieldCheck, path: '/governance', feature: 'governance' as FeatureKey }
                ] : []),
                // Team Users: Request Leave
                ...(currentRole === 'team' ? [
                    { id: 'leave', label: 'Request Leave', icon: Coffee, path: '/leave/request', feature: 'leave_management' as FeatureKey }
                ] : []),
                // Admin & Manager: Leave Management
                ...(currentRole === 'admin' || currentRole === 'manager' ? [
                    { id: 'leave-requests', label: 'Leave Requests', icon: Coffee, path: '/admin/leave-requests', feature: 'leave_management' as FeatureKey },
                    { id: 'leave-analytics', label: 'Leave Analytics', icon: BarChart3, path: '/admin/leave-analytics', feature: 'leave_management' as FeatureKey }
                ] : []),
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
                    (currentRole as UserRole) || 'member',
                    currentWorkspace ? { id: String(currentWorkspace.id), features: currentWorkspace.features, tenantSettings } : undefined
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
                        (currentRole as UserRole) || 'member',
                        currentWorkspace ? { id: String(currentWorkspace.id), features: currentWorkspace.features, tenantSettings } : undefined
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
                    <div className="w-9 h-9 rounded-full bg-foreground/5 animate-pulse shrink-0" />
                    {!isCollapsed && (
                        <div className="flex flex-col gap-1">
                            <div className="h-3 w-24 bg-foreground/10 animate-pulse rounded" />
                            <div className="h-2 w-14 bg-foreground/5 animate-pulse rounded" />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "group relative w-full flex items-center h-12 px-0 rounded-[18px] transition-all duration-300 outline-none hover:bg-foreground/[0.03]",
                        isCollapsed ? "justify-center" : ""
                    )}>
                        <div className="grid grid-cols-[40px_1fr] items-center w-full">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground/10 ring-1 ring-foreground/20 shadow-lg group-hover:ring-indigo-500/50 transition-all duration-300">
                                    {(user?.avatar_url || user?.photoURL) ? (
                                        <img src={getDriveImageUrl(user.avatar_url || user.photoURL, user.avatar_drive_id)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground/80 uppercase">
                                            {user?.email?.[0] || 'U'}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full shadow-sm" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col overflow-hidden text-left ml-4">
                                    <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors tracking-tight leading-none mb-1">
                                        {user?.name || 'Authorized User'}
                                    </span>
                                    <div className="flex items-center">
                                        <span className="text-[10px] text-foreground/80 font-black uppercase tracking-[0.2em] leading-none">
                                            {currentRole || 'Member'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    align="start" 
                    sideOffset={12} 
                    className="w-72 bg-popover border-foreground/10 p-0 overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.9)] ring-1 ring-foreground/5 animate-in fade-in zoom-in-95 duration-200 rounded-[24px]"
                >
                    {/* Header Section */}
                    <div className="relative px-5 py-6 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-2.5">Active Session</div>
                        <div className="flex flex-col gap-0.5">
                            <div className="text-sm font-bold text-foreground tracking-tight truncate">{user?.name || 'Authorized User'}</div>
                            <div className="text-[11px] text-foreground/80 font-medium truncate">{user?.email}</div>
                        </div>
                    </div>
                    
                    <div className="h-px bg-foreground/5" />

                    <div className="p-2 space-y-1">
                        <DropdownMenuItem 
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:bg-foreground/[0.03] focus:bg-foreground/[0.03] text-foreground/70 hover:text-foreground transition-all group border-none outline-none"
                            onClick={() => nativeNavigate('/settings', router, 'Profile')}
                        >
                            <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/80 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                <Settings size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight">Profile Settings</span>
                                <span className="text-[10px] text-foreground/70 font-medium uppercase tracking-wider">Identity & Preferences</span>
                            </div>
                        </DropdownMenuItem>

                        <div className="h-px bg-foreground/5 my-1 mx-2" />

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
                "glass-liquid border-foreground/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
            )}
        >
            {/* 1. Brand Header */}
            <div className={cn(
                "h-[80px] flex items-center transition-all duration-300 border-b border-foreground/[0.03] px-4",
                isCollapsed ? "justify-center" : ""
            )}>
                <div className="flex items-center w-full">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => router.push('/home')}>
                        <img
                            src={
                                theme === 'midnight' 
                                    ? '/media-app-logo-midnight.png' 
                                    : theme === 'luminous' 
                                        ? '/media-app-logo-luminous.png' 
                                        : '/media-app-logo-golden.png'
                            }
                            alt="MH"
                            className="w-10 h-10 rounded-xl shrink-0 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                        />
                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: -10, filter: 'blur(8px)' }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="flex flex-col ml-4"
                            >
                                <span 
                                    className="text-2xl tracking-wider leading-none mb-1 font-normal"
                                    style={{ 
                                        fontFamily: 'BavistaSoulvare', 
                                        color: 'var(--brand-title-color)',
                                        textShadow: 'var(--brand-title-shadow)'
                                    }}
                                >
                                    MediaHive
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--accent-primary)]" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none">
                                        Operational
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6">
                {/* Identity Section (Switcher, Alerts, Profile) */}
                <div className={cn(
                    "flex flex-col gap-2 mb-8 px-4",
                    isCollapsed ? "items-center" : ""
                )}>
                    {/* Workspace Switcher */}
                    <div className="w-full">
                        <WorkspaceSwitcher isCollapsed={isCollapsed} />
                    </div>

                    {/* Alerts / Team Updates */}
                    <div className={cn(
                        "group relative w-full flex items-center h-12 px-0 rounded-[18px] transition-all duration-300 hover:bg-foreground/[0.03]",
                        isCollapsed ? "justify-center" : ""
                    )}>
                        <div className="grid grid-cols-[40px_1fr] items-center w-full">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                <NotificationBell />
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col overflow-hidden ml-4">
                                    <span className="text-[9px] font-black text-foreground/80 uppercase tracking-[0.2em] leading-none mb-1">Status</span>
                                    <span className="text-sm font-bold text-foreground/80 truncate">Team Updates</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="w-full">
                        {renderIdentity()}
                    </div>
                </div>

                <div className="h-px bg-foreground/[0.03] mx-6 mb-8" />

                {/* Main Navigation */}
                <div className="px-4 space-y-9">
                    {filteredGroups.map((group) => (
                        <div key={group.id} className="space-y-4">
                            {!isCollapsed && (
                                <motion.h3
                                    className="pl-[56px] text-[10px] font-black text-foreground/80 uppercase tracking-[0.3em] whitespace-nowrap"
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
                                                "group relative w-full flex items-center h-12 px-0 rounded-[18px] transition-all duration-300 ease-out active:scale-[0.97] sidebar-item overflow-hidden",
                                                isActive
                                                    ? "bg-foreground/[0.06] shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                                    : "hover:bg-foreground/[0.03] text-foreground/80"
                                            )}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            {/* Active Highlight Pill */}
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-pill"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.8)]"
                                                />
                                            )}

                                            <div className="grid grid-cols-[40px_1fr] items-center w-full">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                                                    <item.icon
                                                        size={20}
                                                        strokeWidth={isActive ? 2.5 : 2}
                                                        className={cn(
                                                            "transition-all duration-300",
                                                            isActive
                                                                ? "text-primary drop-shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]"
                                                                : "text-inherit group-hover:text-foreground"
                                                        )}
                                                    />
                                                </div>

                                                {!isCollapsed && (
                                                    <span
                                                        className={cn(
                                                            "ml-4 text-sm font-bold tracking-tight transition-colors duration-300 truncate text-left",
                                                            isActive ? "text-foreground" : "text-inherit group-hover:text-foreground"
                                                        )}
                                                    >
                                                        {item.label}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Footer / Collapse Trigger */}
            <div className="p-4 mt-auto border-t border-foreground/[0.03]">
                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center h-12 rounded-xl hover:bg-foreground/5 transition-all group text-foreground/80 hover:text-foreground active:scale-95"
                >
                    {isCollapsed ? (
                        <div className="w-10 h-10 flex items-center justify-center bg-foreground/5 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <ChevronRight size={18} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 h-9 bg-foreground/[0.03] rounded-xl group-hover:bg-foreground/10 transition-all">
                            <ChevronLeft size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Collapse</span>
                        </div>
                    )}
                </button>
            </div>




        </motion.aside>
    );
}
