"use client";

import React from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { ActivityFeedWidget } from "@/components/admin/ActivityFeedWidget";
import { Users, Building, Activity, Shield } from 'lucide-react';
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

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Security Rules</h3>
                            <p className="text-sm text-slate-400">Access policies (Coming Soon).</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">System Health</h3>
                            <p className="text-sm text-slate-400">Performance metrics (Coming Soon).</p>
                        </div>
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
