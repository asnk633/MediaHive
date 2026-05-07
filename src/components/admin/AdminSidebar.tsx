"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Building2,
    ShieldCheck,
    Activity,
    Settings,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    BarChart3,
    Sliders
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContextProvider';

const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin', minRole: 'manager' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users', minRole: 'manager' },
    { id: 'leave-analytics', label: 'Leave Analytics', icon: BarChart3, path: '/admin/leave-analytics', minRole: 'manager' },
    { id: 'workspaces', label: 'Workspaces', icon: Building2, path: '/admin/workspaces', minRole: 'admin' },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck, path: '/admin/security', minRole: 'admin' },
    { id: 'activity', label: 'Activity Logs', icon: Activity, path: '/admin/activity', minRole: 'admin' },
    { id: 'features', label: 'Feature Config', icon: Sliders, path: '/admin/settings/features', minRole: 'admin' },
    { id: 'settings', label: 'Global Setup', icon: Settings, path: '/admin/structure', minRole: 'admin' },
];

export default function AdminSidebar() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('admin-sidebar-collapsed');
        if (saved === 'true') {
            setIsCollapsed(true);
            updatePadding(true);
        } else {
            updatePadding(false);
        }
    }, []);

    const updatePadding = (collapsed: boolean) => {
        const width = collapsed ? '72px' : '240px';
        document.documentElement.style.setProperty('--admin-sidebar-width', width);
    };

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem('admin-sidebar-collapsed', String(next));
        updatePadding(next);
    };

    if (!mounted) return null;

    // Filter items based on role
    const filteredItems = adminNavItems.filter(item => {
        if (user?.role === 'admin') return true;
        if (user?.role === 'manager') return item.minRole === 'manager';
        return false;
    });

    return (
        <motion.aside 
            initial={false}
            animate={{ width: isCollapsed ? '88px' : '260px' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-[70] hidden lg:flex flex-col h-fit max-h-[calc(100vh-6rem)] rounded-[36px] glass-liquid border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
        >
            <div className="p-4 space-y-6 flex-1 flex flex-col">
                <div className={cn("px-2 py-3 flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0">
                        <ShieldAlert size={20} />
                    </div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="text-sm font-black text-white tracking-tight">Admin Panel</h2>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Global Control</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="flex-1 space-y-1">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                onClick={() => router.push(item.path)}
                                title={isCollapsed ? item.label : undefined}
                                className={cn(
                                    "group relative w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300",
                                    isActive 
                                        ? "bg-white/10 text-white shadow-xl shadow-black/20" 
                                        : "text-white/40 hover:bg-white/5 hover:text-white",
                                    isCollapsed ? "justify-center" : ""
                                )}
                            >
                                <item.icon size={20} className={cn("transition-all duration-300 group-hover:scale-110 group-active:scale-95 shrink-0", isActive ? "text-indigo-400" : "")} />
                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm font-bold tracking-tight whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && (
                                    <motion.div 
                                        layoutId="admin-active-pill"
                                        className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="pt-4 border-t border-white/5 space-y-2">
                    <button 
                        onClick={() => router.push('/home')}
                        className={cn("group w-full flex items-center gap-3 p-3.5 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all", isCollapsed ? "justify-center" : "")}
                        title={isCollapsed ? "Exit Admin" : undefined}
                    >
                        <ChevronLeft size={20} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                        {!isCollapsed && <span className="text-sm font-bold">Exit Admin</span>}
                    </button>
                    
                    <button 
                        onClick={toggleCollapse}
                        className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl text-white/20 hover:bg-white/5 hover:text-white/60 transition-all", isCollapsed ? "justify-center" : "")}
                    >
                        {isCollapsed ? <ChevronRight size={20} className="animate-pulse" /> : (
                            <div className="flex items-center gap-3 w-full">
                                <ChevronLeft size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Collapse</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </motion.aside>
    );
}
