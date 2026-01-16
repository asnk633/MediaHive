"use client";

import React from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { ActivityFeedWidget } from "@/components/admin/ActivityFeedWidget";
import { Users, Building2, Activity, Shield, Zap, Bell } from 'lucide-react';
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
                        <Link href="/admin/users" className="p-6 rounded-2xl bg-surface border border-soft hover:bg-muted/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">User Management</h3>
                            <p className="text-sm text-muted">Manage accounts, roles, and status.</p>
                        </Link>

                        <Link href="/admin/structure" className="p-6 rounded-2xl bg-surface border border-soft hover:bg-muted/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Building2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Organization Structure</h3>
                            <p className="text-sm text-muted">Manage departments, units, and institutions.</p>
                        </Link>

                        <Link href="/admin/security" className="p-6 rounded-2xl bg-surface border border-soft hover:bg-muted/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Security Rules</h3>
                            <p className="text-sm text-muted">Access policies and protection.</p>
                        </Link>

                        <Link href="/admin/system-health" className="p-6 rounded-2xl bg-surface border border-soft hover:bg-muted/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Activity size={24} />
                            </div>
                            <p className="text-sm text-slate-400">Live operational status.</p>
                        </Link>

                        <Link href="/admin/notification-policies" className="p-6 rounded-2xl bg-surface border border-soft hover:bg-muted/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Bell size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Notification Policies</h3>
                            <p className="text-sm text-muted">Control reminders and escalations in simple terms.</p>
                        </Link>

                        <Link href="/admin/automation-rules" className="p-6 rounded-2xl bg-surface border border-soft hover:bg-muted/10 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Automation Rules</h3>
                            <p className="text-sm text-muted">Advanced: detailed trigger logic.</p>
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
