"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Building2,
    ShieldCheck,
    Activity,
    Settings,
    ChevronLeft,
    ShieldAlert
} from 'lucide-react';
import { cn } from "@/lib/utils";

const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'workspaces', label: 'Workspaces', icon: Building2, path: '/admin/workspaces' },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck, path: '/admin/permissions' },
    { id: 'activity', label: 'Activity Logs', icon: Activity, path: '/admin/activity' },
    { id: 'settings', label: 'System Settings', icon: Settings, path: '/admin/system-settings' },
];

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-[70] flex flex-col w-[240px] h-fit max-h-[calc(100vh-6rem)] rounded-[32px] glass-liquid border-white/10 shadow-2xl p-4 space-y-6">
            <div className="px-4 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <ShieldAlert size={18} />
                </div>
                <div>
                    <h2 className="text-sm font-black text-white tracking-tight">Admin Panel</h2>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Global Control</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5">
                {adminNavItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                "group relative w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300",
                                isActive 
                                    ? "bg-white/10 text-white shadow-xl" 
                                    : "text-white/40 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-indigo-400" : "")} />
                            <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                            {isActive && (
                                <motion.div 
                                    layoutId="admin-active-pill"
                                    className="absolute left-0 w-1 h-4 bg-indigo-500 rounded-r-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="pt-4 border-t border-white/5">
                <button 
                    onClick={() => router.push('/home')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-semibold">Exit Admin</span>
                </button>
            </div>
        </aside>
    );
}
