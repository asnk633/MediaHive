'use client';

import React, { useState } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { ProfileSettingsView } from '@/components/settings/views/ProfileSettingsView';
import { NotificationSettingsView } from '@/components/settings/views/NotificationSettingsView';
import { ShieldAlert, Building2 } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'users' | 'institution'>('profile');

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
            <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>

                {activeTab === 'profile' && <ProfileSettingsView />}
                {activeTab === 'notifications' && <NotificationSettingsView />}

                {/* Admin Stubs - Protected by Menu Logic but good to guard here too */}
                {activeTab === 'users' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <ShieldAlert size={48} className="mb-4 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-400">Restricted Area</h3>
                        <p className="text-sm text-slate-600 max-w-sm mt-2">
                            User Management Module is being refactored for Phase 4.
                        </p>
                    </div>
                )}

                {activeTab === 'institution' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <Building2 size={48} className="mb-4 text-slate-600" />
                        <h3 className="text-lg font-medium text-slate-400">Institution Config</h3>
                        <p className="text-sm text-slate-600 max-w-sm mt-2">
                            Global settings are currently locked.
                        </p>
                    </div>
                )}

            </SettingsLayout>
        </div>
    );
}