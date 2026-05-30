"use client";

import React, { useEffect, useState } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { 
    Users, 
    Building2, 
    Activity, 
    Zap, 
    Bell, 
    Mail, 
    ShieldAlert,
    ChevronRight,
    ArrowUpRight,
    BarChart3,
    Sliders
} from 'lucide-react';
import AppLink from '@/components/AppLink';
import { AdminService, TenantMetrics } from '@/services/adminService';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
    const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            const data = await AdminService.getTenantOverview();
            setMetrics(data);
            setLoading(false);
        };
        fetchMetrics();
    }, []);

    const statCards = [
        { label: 'Total Users', value: metrics?.totalUsers ?? '-', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Workspaces', value: metrics?.activeWorkspaces ?? '-', icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Pending Invites', value: metrics?.pendingInvites ?? '-', icon: Mail, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];

    return (
        <PageLayout mode="standard">
            <PageHeader
                title="Command Center"
                description="Global system state and organizational oversight."
            />

            <div className="space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-[24px] glass-liquid border-foreground/5 space-y-4"
                        >
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-3xl font-black text-foreground">{loading ? '...' : stat.value}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {/* Recent Activity */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} /> Recent System Activity
                            </h3>
                            <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                                View All <ArrowUpRight size={12} />
                            </button>
                        </div>
                        
                        <div className="rounded-[32px] glass-liquid border-foreground/5 overflow-hidden">
                            {[1, 2, 3, 4].map((item, i) => (
                                <div key={i} className="p-5 flex items-center justify-between border-b border-foreground/5 last:border-0 hover:bg-foreground/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/80 group-hover:text-indigo-400 transition-colors">
                                            <ShieldAlert size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Security policy updated</p>
                                            <p className="text-[10px] text-foreground/70 font-medium uppercase tracking-wider">By Admin • 2 hours ago</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-foreground/80 group-hover:text-foreground transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4 lg:col-span-2 xl:col-span-3">
                        <h3 className="text-sm font-black text-foreground/80 uppercase tracking-widest flex items-center gap-2 px-2">
                            <Zap size={14} /> Critical Actions
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            <QuickActionCard 
                                icon={Users} 
                                title="Manage Users" 
                                desc="Adjust roles & access" 
                                href="/admin/users" 
                                color="blue" 
                            />
                            <QuickActionCard 
                                icon={BarChart3} 
                                title="Team Leaves" 
                                desc="Analytics & team counts" 
                                href="/admin/leave-analytics" 
                                color="purple" 
                            />
                            <QuickActionCard 
                                icon={Building2} 
                                title="Workspaces" 
                                desc="Configure institutions" 
                                href="/admin/workspaces" 
                                color="indigo" 
                            />
                            <QuickActionCard 
                                icon={Sliders} 
                                title="Feature Config" 
                                desc="Permissions & Flags" 
                                href="/admin/settings/features" 
                                color="rose" 
                            />
                            <QuickActionCard 
                                icon={Bell} 
                                title="System Updates" 
                                desc="Version & maintenance" 
                                href="/admin/system-updates" 
                                color="amber" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

function QuickActionCard({ icon: Icon, title, desc, href, color }: any) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    };

    return (
        <AppLink href={href} className="block group p-6 rounded-[28px] glass-liquid border-foreground/5 hover:bg-foreground/5 transition-all active:scale-95 text-left">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <h4 className="text-sm font-black text-foreground group-hover:text-indigo-400 transition-colors uppercase tracking-wider">{title}</h4>
            <p className="text-xs text-foreground/80 font-medium">{desc}</p>
        </AppLink>
    );
}
