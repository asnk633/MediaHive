'use client';

import React, { useState } from 'react';
import { User, Bell, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContextProvider';

interface SettingsLayoutProps {
    children: React.ReactNode;
    activeTab: 'profile' | 'notifications';
    onTabChange: (tab: any) => void;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
    children,
    activeTab,
    onTabChange
}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    ];



    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] mt-2">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 shrink-0 space-y-1">
                <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                    {menuItems.map((item) => (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                activeTab === item.id
                                    ? "bg-blue-600/10 text-blue-400 font-medium"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                            onClick={() => onTabChange(item.id)}
                        >
                            {item.icon}
                            {item.label}
                        </Button>
                    ))}
                </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 rounded-xl bg-slate-900/30 border border-white/5 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
                {children}
            </main>
        </div>
    );
};
