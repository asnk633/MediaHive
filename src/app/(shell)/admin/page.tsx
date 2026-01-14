"use client";

import React from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { ActivityFeedWidget } from "@/components/admin/ActivityFeedWidget";
import { Users, Building, Activity, Shield, Zap, Bell } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    return (
        <PageLayout mode="standard">
            <PageHeader
                title="Admin Command Center"
                description="System-wide operations, security monitoring, and user management."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Links Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/admin/users" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">User Management</h3>
                            <p className="text-sm text-slate-400">Manage accounts, roles, and status.</p>
                        </Link>

                        <Link href="/admin/structure" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Building size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Organization</h3>
                            <p className="text-sm text-slate-400">Institutions, Units, and Hierarchy.</p>
                        </Link>

                        <Link href="/admin/security" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Security Rules</h3>
                            <p className="text-sm text-slate-400">Access policies and protection.</p>
                        </Link>

                        <Link href="/admin/system-health" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">System Health</h3>
                            <p className="text-sm text-slate-400">Live operational status.</p>
                        </Link>

                        <Link href="/admin/notification-policies" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Bell size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Notification Policies</h3>
                            <p className="text-sm text-slate-400">Control reminders and escalations in simple terms.</p>
                        </Link>

                        <Link href="/admin/automation-rules" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Automation Rules</h3>
                            <p className="text-sm text-slate-400">Advanced: detailed trigger logic.</p>
                        </Link>
                    </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-6">
                    <ActivityFeedWidget />
                </div>
            </div>
        </PageLayout>
    );
}
