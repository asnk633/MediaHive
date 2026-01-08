'use client';

import React, { useState } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { ProfileSettingsView } from '@/components/settings/views/ProfileSettingsView';
import { NotificationSettingsView } from '@/components/settings/views/NotificationSettingsView';
import { ShieldAlert, Building2 } from 'lucide-react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'users' | 'institution'>('profile');

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Settings"
                description="Manage your account."
            />
            <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>

                {activeTab === 'profile' && <ProfileSettingsView />}
                {activeTab === 'notifications' && <NotificationSettingsView />}

                {/* Admin Links */}
                {activeTab === 'users' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ShieldAlert size={48} className="mb-4 text-blue-400" />
                        <h3 className="text-lg font-medium text-white">User Management</h3>
                        <p className="text-sm text-slate-400 max-w-sm mt-2 mb-6">
                            Manage users, roles, and affiliations in the dedicated module.
                        </p>
                        <a href="/admin/users" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
                            Go to User Management
                        </a>
                    </div>
                )}

                {activeTab === 'institution' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Building2 size={48} className="mb-4 text-pink-400" />
                        <h3 className="text-lg font-medium text-white">Organization Structure</h3>
                        <p className="text-sm text-slate-400 max-w-sm mt-2 mb-6">
                            Manage global institutions and departments.
                        </p>
                        <a href="/admin/structure" className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-colors">
                            Go to Structure Configuration
                        </a>
                    </div>
                )}

            </SettingsLayout>
        </PageLayout>
    );
}