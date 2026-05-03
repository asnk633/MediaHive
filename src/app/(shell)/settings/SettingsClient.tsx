'use client';

import React, { useState } from 'react';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { ProfileSettingsView } from '@/components/settings/views/ProfileSettingsView';
import { NotificationSettingsView } from '@/components/settings/views/NotificationSettingsView';

type SettingsTab = 'profile' | 'notifications';

export default function SettingsClient() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    return (
        <PageLayout mode="standard">
            <PageHeader
                title="Settings"
                description="Manage your security, notifications, and application preferences."
            />

            <SettingsLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
            >
                {activeTab === 'profile' && <ProfileSettingsView />}
                {activeTab === 'notifications' && <NotificationSettingsView />}
            </SettingsLayout>
        </PageLayout>
    );
}
